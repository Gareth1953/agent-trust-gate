import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

import {
  auditGatewayUsage,
  createGatewayServer,
  listGatewayRequests,
  type GatewayRequestLogEntry,
  type GatewayUsageSummary,
} from "../src/index.js";

const cliPath = resolve("dist/src/cli.js");

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

async function withGatewayLog<T>(
  callback: (baseUrl: string, logPath: string) => Promise<T>,
): Promise<T> {
  const directory = mkdtempSync(`${tmpdir()}\\atg-gateway-log-`);
  const logPath = resolve(directory, "gateway-requests.jsonl");
  const server = createGatewayServer({ gatewayLogPath: logPath });

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

function readLogEntries(logPath: string): GatewayRequestLogEntry[] {
  return readFileSync(logPath, "utf8")
    .trim()
    .split(/\r?\n/)
    .map((line) => JSON.parse(line) as GatewayRequestLogEntry);
}

function runCli(cwd: string, ...args: string[]) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd,
    encoding: "utf8",
  });
}

test("GET /v1/health writes a log entry", async () => {
  await withGatewayLog(async (baseUrl, logPath) => {
    const response = await fetch(`${baseUrl}/v1/health`);
    const body = await response.json() as { request_id: string };
    const [entry] = readLogEntries(logPath);

    assert.equal(response.status, 200);
    assert.ok(entry);
    assert.equal(entry.request_id, body.request_id);
    assert.equal(entry.endpoint, "/v1/health");
    assert.equal(entry.method, "GET");
    assert.equal(entry.ok, true);
    assert.equal(entry.status_code, 200);
    assert.equal(entry.contract_version, "atg.v1");
    assert.equal(entry.gateway_mode, "local");
  });
});

test("POST /v1/decision writes a useful log entry", async () => {
  await withGatewayLog(async (baseUrl, logPath) => {
    const response = await fetch(`${baseUrl}/v1/decision`, {
      method: "POST",
      body: JSON.stringify(publicPostAction),
    });
    const body = await response.json() as { request_id: string };
    const [entry] = readLogEntries(logPath);

    assert.equal(response.status, 200);
    assert.ok(entry);
    assert.equal(entry.request_id, body.request_id);
    assert.equal(entry.endpoint, "/v1/decision");
    assert.equal(entry.policy_profile, "standard");
    assert.equal(entry.action_type, "public_post");
    assert.equal(entry.actor, "communications-agent");
    assert.equal(entry.target, "public-channel");
    assert.equal(entry.allowed, false);
    assert.equal(entry.risk_level, "high");
    assert.equal(entry.human_approval_required, true);
    assert.equal(entry.regulated_policy, false);
    assert.equal(typeof entry.duration_ms, "number");
  });
});

test("POST /v1/decision regulated policy logs regulated metadata", async () => {
  await withGatewayLog(async (baseUrl, logPath) => {
    const response = await fetch(`${baseUrl}/v1/decision`, {
      method: "POST",
      body: JSON.stringify({
        policy_profile: "regulated",
        action: publicPostAction,
      }),
    });
    const [entry] = readLogEntries(logPath);

    assert.equal(response.status, 200);
    assert.ok(entry);
    assert.equal(entry.policy_profile, "regulated");
    assert.equal(entry.regulated_policy, true);
  });
});

test("invalid request writes an error log entry", async () => {
  await withGatewayLog(async (baseUrl, logPath) => {
    const response = await fetch(`${baseUrl}/v1/decision`, {
      method: "POST",
      body: "{ invalid json",
    });
    const body = await response.json() as { request_id: string };
    const [entry] = readLogEntries(logPath);

    assert.equal(response.status, 400);
    assert.ok(entry);
    assert.equal(entry.request_id, body.request_id);
    assert.equal(entry.ok, false);
    assert.equal(entry.status_code, 400);
    assert.equal(entry.error_code, "INVALID_JSON");
  });
});

test("--gateway-usage with no log file returns zero summary", () => {
  const directory = mkdtempSync(`${tmpdir()}\\atg-gateway-empty-`);

  try {
    const result = runCli(directory, "--gateway-usage", "--json");
    const output = JSON.parse(result.stdout) as GatewayUsageSummary;

    assert.equal(result.status, 0);
    assert.equal(result.stderr, "");
    assert.equal(output.total_requests, 0);
    assert.equal(output.successful_requests, 0);
    assert.equal(output.error_requests, 0);
    assert.equal(output.malformed_log_lines_count, 0);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("--gateway-usage --json outputs parseable JSON", () => {
  const directory = mkdtempSync(`${tmpdir()}\\atg-gateway-usage-`);

  try {
    mkdirSync(resolve(directory, "gateway-logs"));
    writeFileSync(
      resolve(directory, "gateway-logs", "gateway-requests.jsonl"),
      `${JSON.stringify(sampleLogEntry({ endpoint: "/v1/decision" }))}\n`,
      "utf8",
    );

    const result = runCli(directory, "--gateway-usage", "--json");
    const output = JSON.parse(result.stdout) as GatewayUsageSummary;

    assert.equal(result.status, 0);
    assert.equal(result.stderr, "");
    assert.equal(output.total_requests, 1);
    assert.equal(output.decision_requests_count, 1);
    assert.equal(output.policy_profile_counts.standard, 1);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("--list-gateway-requests --json outputs parseable JSON", () => {
  const directory = mkdtempSync(`${tmpdir()}\\atg-gateway-list-`);

  try {
    mkdirSync(resolve(directory, "gateway-logs"));
    writeFileSync(
      resolve(directory, "gateway-logs", "gateway-requests.jsonl"),
      `${JSON.stringify(sampleLogEntry({ request_id: "gw_list_1" }))}\n`,
      "utf8",
    );

    const result = runCli(directory, "--list-gateway-requests", "--json");
    const output = JSON.parse(result.stdout) as Array<{ request_id: string; status: string }>;

    assert.equal(result.status, 0);
    assert.equal(result.stderr, "");
    assert.equal(output.length, 1);
    assert.equal(output[0]?.status, "valid");
    assert.equal(output[0]?.request_id, "gw_list_1");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("malformed JSONL log line is counted without crashing", () => {
  const directory = mkdtempSync(`${tmpdir()}\\atg-gateway-malformed-`);
  const logPath = resolve(directory, "gateway-requests.jsonl");

  try {
    writeFileSync(logPath, `${JSON.stringify(sampleLogEntry())}\n{ invalid json\n`, "utf8");
    const usage = auditGatewayUsage(logPath);
    const entries = listGatewayRequests(20, logPath);

    assert.equal(usage.total_requests, 1);
    assert.equal(usage.malformed_log_lines_count, 1);
    assert.equal(entries.length, 2);
    assert.equal(entries[1]?.status, "malformed");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("--list-gateway-requests default limit works", () => {
  const directory = mkdtempSync(`${tmpdir()}\\atg-gateway-limit-`);

  try {
    mkdirSync(resolve(directory, "gateway-logs"));
    const lines = Array.from({ length: 25 }, (_value, index) => JSON.stringify(
      sampleLogEntry({ request_id: `gw_limit_${index.toString().padStart(2, "0")}` }),
    ));
    writeFileSync(
      resolve(directory, "gateway-logs", "gateway-requests.jsonl"),
      `${lines.join("\n")}\n`,
      "utf8",
    );

    const result = runCli(directory, "--list-gateway-requests", "--json");
    const output = JSON.parse(result.stdout) as Array<{ request_id: string }>;

    assert.equal(result.status, 0);
    assert.equal(output.length, 20);
    assert.equal(output[0]?.request_id, "gw_limit_05");
    assert.equal(output[19]?.request_id, "gw_limit_24");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("generated gateway log files are ignored", () => {
  const jsonlResult = spawnSync("git", ["check-ignore", "gateway-logs/gateway-requests.jsonl"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  const jsonResult = spawnSync("git", ["check-ignore", "gateway-logs/demo.json"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });

  assert.equal(jsonlResult.status, 0);
  assert.match(jsonlResult.stdout, /gateway-logs\/gateway-requests\.jsonl/);
  assert.equal(jsonResult.status, 0);
  assert.match(jsonResult.stdout, /gateway-logs\/demo\.json/);
});

function sampleLogEntry(overrides: Partial<GatewayRequestLogEntry> = {}): GatewayRequestLogEntry {
  return {
    request_id: "gw_sample",
    timestamp: "2026-06-26T12:00:00.000Z",
    endpoint: "/v1/decision",
    method: "POST",
    ok: true,
    status_code: 200,
    contract_version: "atg.v1",
    gateway_mode: "local",
    duration_ms: 3,
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
