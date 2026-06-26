import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

import {
  auditGatewayClientUsage,
  auditGatewayUsage,
  createGatewayServer,
  listGatewayRequests,
  type GatewayRequestLogEntry,
  type GatewayUsageSummary,
} from "../src/index.js";

const cliPath = resolve("dist/src/cli.js");

const limitedClient = {
  client_id: "limited-agent",
  api_key: "limited-key",
  decision_allowance: 1,
  allowance_window: "all_time" as const,
};

const unlimitedClient = {
  client_id: "unlimited-agent",
  api_key: "unlimited-key",
};

const publicPostAction = {
  action_type: "public_post",
  description: "Publish a project update on a public channel.",
  actor: "communications-agent",
  target: "public-channel",
  estimated_cost_gbp: 0,
  public_action: true,
  external_commitment: false,
  money_movement: false,
  legal_or_compliance_sensitive: false,
  customer_or_user_facing: true,
  evidence: ["Draft content is available for human review."],
  rollback_plan: "Delete the post and issue a correction if approved by a human.",
  human_approval_status: "not_requested",
};

async function withLimitedGateway<T>(
  callback: (baseUrl: string, logPath: string) => Promise<T>,
): Promise<T> {
  const directory = mkdtempSync(`${tmpdir()}\\atg-usage-limit-`);
  const logPath = resolve(directory, "gateway-requests.jsonl");
  const server = createGatewayServer({
    requireApiKey: true,
    clients: [limitedClient, unlimitedClient],
    gatewayLogPath: logPath,
  });

  await new Promise<void>((resolveListen) => {
    server.listen(0, "127.0.0.1", resolveListen);
  });

  const address = server.address();
  assert.ok(address !== null && typeof address === "object");

  try {
    return await callback(`http://127.0.0.1:${(address as AddressInfo).port}`, logPath);
  } finally {
    await new Promise<void>((resolveClose, rejectClose) => {
      server.close((error) => {
        if (error !== undefined) {
          rejectClose(error);
          return;
        }
        resolveClose();
      });
    });
    rmSync(directory, { recursive: true, force: true });
  }
}

test("client with no allowance is treated as unlimited", async () => {
  await withLimitedGateway(async (baseUrl) => {
    for (let index = 0; index < 2; index += 1) {
      const response = await fetch(`${baseUrl}/v1/decision`, {
        method: "POST",
        headers: {
          "X-ATG-Client-ID": "unlimited-agent",
          "X-ATG-API-Key": "unlimited-key",
        },
        body: JSON.stringify(publicPostAction),
      });
      const body = await response.json() as { usage?: unknown };

      assert.equal(response.status, 200);
      assert.equal(body.usage, undefined);
    }
  });
});

test("client under allowance can call protected endpoint with usage object", async () => {
  await withLimitedGateway(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/v1/decision`, {
      method: "POST",
      headers: {
        "X-ATG-Client-ID": "limited-agent",
        "X-ATG-API-Key": "limited-key",
      },
      body: JSON.stringify(publicPostAction),
    });
    const body = await response.json() as {
      usage: {
        decision_allowance: number;
        allowance_window: string;
        used_decisions: number;
        remaining_decisions: number;
        over_limit: boolean;
      };
    };

    assert.equal(response.status, 200);
    assert.equal(body.usage.decision_allowance, 1);
    assert.equal(body.usage.allowance_window, "all_time");
    assert.equal(body.usage.used_decisions, 1);
    assert.equal(body.usage.remaining_decisions, 0);
    assert.equal(body.usage.over_limit, false);
  });
});

test("client at allowance gets 429 over-limit JSON error before validation", async () => {
  await withLimitedGateway(async (baseUrl) => {
    await fetch(`${baseUrl}/v1/decision`, {
      method: "POST",
      headers: {
        "X-ATG-Client-ID": "limited-agent",
        "X-ATG-API-Key": "limited-key",
      },
      body: JSON.stringify(publicPostAction),
    });

    const response = await fetch(`${baseUrl}/v1/decision`, {
      method: "POST",
      headers: {
        "X-ATG-Client-ID": "limited-agent",
        "X-ATG-API-Key": "limited-key",
      },
      body: JSON.stringify({ action_type: "public_post" }),
    });
    const body = await response.json() as {
      usage: { over_limit: boolean; used_decisions: number; remaining_decisions: number };
      error: { code: string };
    };

    assert.equal(response.status, 429);
    assert.equal(body.error.code, "CLIENT_USAGE_LIMIT_EXCEEDED");
    assert.equal(body.usage.over_limit, true);
    assert.equal(body.usage.used_decisions, 1);
    assert.equal(body.usage.remaining_decisions, 0);
  });
});

test("over-limit request is logged with usage fields", async () => {
  await withLimitedGateway(async (baseUrl, logPath) => {
    await fetch(`${baseUrl}/v1/decision`, {
      method: "POST",
      headers: {
        "X-ATG-Client-ID": "limited-agent",
        "X-ATG-API-Key": "limited-key",
      },
      body: JSON.stringify(publicPostAction),
    });
    await fetch(`${baseUrl}/v1/decision`, {
      method: "POST",
      headers: {
        "X-ATG-Client-ID": "limited-agent",
        "X-ATG-API-Key": "limited-key",
      },
      body: JSON.stringify(publicPostAction),
    });

    const entries = readFileSync(logPath, "utf8")
      .trim()
      .split(/\r?\n/)
      .map((line) => JSON.parse(line) as GatewayRequestLogEntry);
    const overLimit = entries.at(-1);

    assert.ok(overLimit);
    assert.equal(overLimit.status_code, 429);
    assert.equal(overLimit.error_code, "CLIENT_USAGE_LIMIT_EXCEEDED");
    assert.equal(overLimit.usage_checked, true);
    assert.equal(overLimit.decision_allowance, 1);
    assert.equal(overLimit.used_decisions, 1);
    assert.equal(overLimit.remaining_decisions, 0);
    assert.equal(overLimit.over_limit, true);
  });
});

test("--gateway-usage includes over_limit_requests and client_usage_summary", () => {
  const directory = mkdtempSync(`${tmpdir()}\\atg-usage-summary-`);

  try {
    mkdirSync(resolve(directory, "gateway-logs"));
    writeFileSync(
      resolve(directory, "gateway-logs", "gateway-requests.jsonl"),
      [
        JSON.stringify(sampleLogEntry({ request_id: "gw_ok" })),
        JSON.stringify(sampleLogEntry({
          request_id: "gw_over",
          ok: false,
          status_code: 429,
          over_limit: true,
          error_code: "CLIENT_USAGE_LIMIT_EXCEEDED",
        })),
      ].join("\n") + "\n",
      "utf8",
    );

    const result = spawnSync(process.execPath, [cliPath, "--gateway-usage", "--json"], {
      cwd: directory,
      encoding: "utf8",
    });
    const output = JSON.parse(result.stdout) as GatewayUsageSummary;

    assert.equal(result.status, 0);
    assert.equal(output.over_limit_requests, 1);
    assert.equal(output.usage_limited_client_counts["limited-agent"], 1);
    assert.equal(output.client_usage_summary["limited-agent"]?.protected_requests, 2);
    assert.equal(output.client_usage_summary["limited-agent"]?.over_limit_requests, 1);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("--client-usage with no logs returns empty client list", () => {
  const directory = mkdtempSync(`${tmpdir()}\\atg-client-usage-empty-`);

  try {
    const result = spawnSync(process.execPath, [cliPath, "--client-usage", "--json"], {
      cwd: directory,
      encoding: "utf8",
    });
    const output = JSON.parse(result.stdout) as { clients: unknown[] };

    assert.equal(result.status, 0);
    assert.deepEqual(output.clients, []);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("--client-usage --json outputs parseable per-client usage", () => {
  const directory = mkdtempSync(`${tmpdir()}\\atg-client-usage-`);

  try {
    mkdirSync(resolve(directory, "gateway-logs"));
    writeFileSync(
      resolve(directory, "gateway-logs", "gateway-requests.jsonl"),
      `${JSON.stringify(sampleLogEntry())}\n`,
      "utf8",
    );

    const result = spawnSync(process.execPath, [cliPath, "--client-usage", "--json"], {
      cwd: directory,
      encoding: "utf8",
    });
    const output = JSON.parse(result.stdout) as {
      clients: Array<{ client_id: string; protected_requests: number }>;
    };

    assert.equal(result.status, 0);
    assert.equal(output.clients[0]?.client_id, "limited-agent");
    assert.equal(output.clients[0]?.protected_requests, 1);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("--list-gateway-requests --json includes over-limit usage fields", () => {
  const directory = mkdtempSync(`${tmpdir()}\\atg-list-usage-fields-`);

  try {
    mkdirSync(resolve(directory, "gateway-logs"));
    writeFileSync(
      resolve(directory, "gateway-logs", "gateway-requests.jsonl"),
      `${JSON.stringify(sampleLogEntry({ over_limit: true, remaining_decisions: 0 }))}\n`,
      "utf8",
    );

    const result = spawnSync(process.execPath, [cliPath, "--list-gateway-requests", "--json"], {
      cwd: directory,
      encoding: "utf8",
    });
    const output = JSON.parse(result.stdout) as Array<{
      over_limit: boolean;
      usage_checked: boolean;
      remaining_decisions: number;
    }>;

    assert.equal(result.status, 0);
    assert.equal(output[0]?.over_limit, true);
    assert.equal(output[0]?.usage_checked, true);
    assert.equal(output[0]?.remaining_decisions, 0);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("gateway-clients.example.json includes safe allowance example", () => {
  const contents = readFileSync(resolve("gateway-clients.example.json"), "utf8");

  assert.match(contents, /"decision_allowance": 1000/);
  assert.match(contents, /"allowance_window": "monthly"/);
});

test("auditGatewayClientUsage summarizes client usage from log path", () => {
  const directory = mkdtempSync(`${tmpdir()}\\atg-client-usage-api-`);
  const logPath = resolve(directory, "gateway-requests.jsonl");

  try {
    writeFileSync(logPath, `${JSON.stringify(sampleLogEntry())}\n`, "utf8");
    const usage = auditGatewayClientUsage(logPath);

    assert.equal(usage.clients.length, 1);
    assert.equal(usage.clients[0]?.client_id, "limited-agent");
    assert.equal(usage.clients[0]?.decision_requests, 1);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

function sampleLogEntry(overrides: Partial<GatewayRequestLogEntry> = {}): GatewayRequestLogEntry {
  return {
    request_id: "gw_sample_usage",
    timestamp: "2026-06-26T12:00:00.000Z",
    endpoint: "/v1/decision",
    method: "POST",
    ok: true,
    status_code: 200,
    contract_version: "atg.v1",
    gateway_mode: "local",
    duration_ms: 2,
    client_id: "limited-agent",
    auth_required: true,
    auth_ok: true,
    usage_checked: true,
    decision_allowance: 1,
    allowance_window: "all_time",
    used_decisions: 0,
    remaining_decisions: 1,
    over_limit: false,
    policy_profile: "standard",
    action_type: "public_post",
    actor: "communications-agent",
    target: "public-channel",
    allowed: false,
    risk_level: "high",
    human_approval_required: true,
    regulated_policy: false,
    ...overrides,
  };
}
