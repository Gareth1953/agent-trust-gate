import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

import {
  createGatewayAdminSummary,
  type GatewayAdminSummary,
  type GatewayRequestLogEntry,
} from "../src/index.js";

const cliPath = resolve("dist/src/cli.js");

function runCli(cwd: string, ...args: string[]) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd,
    encoding: "utf8",
  });
}

test("--gateway-admin with no logs returns zero summary", () => {
  const directory = mkdtempSync(`${tmpdir()}\\atg-admin-empty-`);

  try {
    const result = runCli(directory, "--gateway-admin", "--json");
    const output = JSON.parse(result.stdout) as GatewayAdminSummary;

    assert.equal(result.status, 0);
    assert.equal(result.stderr, "");
    assert.equal(output.gateway_health.log_file_found, false);
    assert.equal(output.gateway_health.total_requests, 0);
    assert.equal(output.gateway_health.successful_requests, 0);
    assert.equal(output.gateway_health.error_requests, 0);
    assert.deepEqual(output.clients, []);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("--gateway-admin --json outputs parseable JSON", () => {
  const directory = mkdtempSync(`${tmpdir()}\\atg-admin-json-`);

  try {
    writeGatewayLog(directory, [sampleLogEntry()]);
    const result = runCli(directory, "--gateway-admin", "--json");
    const output = JSON.parse(result.stdout) as GatewayAdminSummary;

    assert.equal(result.status, 0);
    assert.equal(result.stderr, "");
    assert.equal(output.contract_version, "atg.v1");
    assert.equal(output.gateway_logs_path, "gateway-logs\\gateway-requests.jsonl");
    assert.equal(output.clients[0]?.client_id, "local-demo-agent");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("admin summary includes gateway health and decision activity totals", () => {
  const directory = mkdtempSync(`${tmpdir()}\\atg-admin-activity-`);
  const logPath = resolve(directory, "gateway-requests.jsonl");

  try {
    writeFileSync(
      logPath,
      [
        JSON.stringify(sampleLogEntry({ endpoint: "/v1/decision", risk_level: "high" })),
        JSON.stringify(sampleLogEntry({
          request_id: "gw_pack",
          endpoint: "/v1/approval-pack",
          risk_level: "medium",
          allowed: true,
          human_approval_required: false,
        })),
        JSON.stringify(sampleLogEntry({
          request_id: "gw_bundle",
          endpoint: "/v1/evidence-bundle",
          risk_level: "low",
          regulated_policy: true,
        })),
        JSON.stringify(sampleHealthLogEntry()),
      ].join("\n") + "\n",
      "utf8",
    );

    const output = createGatewayAdminSummary({ logPath });

    assert.equal(output.gateway_health.total_requests, 4);
    assert.equal(output.gateway_health.successful_requests, 4);
    assert.equal(output.gateway_health.error_requests, 0);
    assert.equal(output.decision_activity.decision_requests_count, 1);
    assert.equal(output.decision_activity.approval_pack_requests_count, 1);
    assert.equal(output.decision_activity.evidence_bundle_requests_count, 1);
    assert.equal(output.decision_activity.health_requests_count, 1);
    assert.equal(output.decision_activity.allowed_count, 1);
    assert.equal(output.decision_activity.blocked_count, 2);
    assert.equal(output.decision_activity.approval_required_count, 2);
    assert.equal(output.decision_activity.high_risk_count, 1);
    assert.equal(output.decision_activity.medium_risk_count, 1);
    assert.equal(output.decision_activity.low_risk_count, 1);
    assert.equal(output.decision_activity.regulated_policy_count, 1);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("admin summary includes auth and usage limit activity totals", () => {
  const directory = mkdtempSync(`${tmpdir()}\\atg-admin-auth-`);
  const logPath = resolve(directory, "gateway-requests.jsonl");

  try {
    writeFileSync(
      logPath,
      [
        JSON.stringify(sampleLogEntry({ request_id: "gw_auth_ok" })),
        JSON.stringify(sampleLogEntry({
          request_id: "gw_auth_fail",
          ok: false,
          status_code: 401,
          auth_ok: false,
          error_code: "UNAUTHORIZED_GATEWAY_REQUEST",
        })),
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

    const output = createGatewayAdminSummary({ logPath });

    assert.equal(output.auth_activity.authenticated_requests, 2);
    assert.equal(output.auth_activity.unauthenticated_requests, 0);
    assert.equal(output.auth_activity.unauthorized_requests, 1);
    assert.equal(output.usage_limit_activity.over_limit_requests, 1);
    assert.equal(output.usage_limit_activity.usage_limited_client_counts["local-demo-agent"], 1);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("admin summary includes clients from logs", () => {
  const directory = mkdtempSync(`${tmpdir()}\\atg-admin-log-clients-`);
  const logPath = resolve(directory, "gateway-requests.jsonl");

  try {
    writeFileSync(logPath, `${JSON.stringify(sampleLogEntry())}\n`, "utf8");
    const output = createGatewayAdminSummary({ logPath });
    const client = output.clients.find((entry) => entry.client_id === "local-demo-agent");

    assert.ok(client);
    assert.equal(client.configured, false);
    assert.equal(client.total_requests, 1);
    assert.equal(client.protected_requests, 1);
    assert.equal(client.allowance_status, "unlimited");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("admin summary includes configured clients without exposing api_key", () => {
  const directory = mkdtempSync(`${tmpdir()}\\atg-admin-config-`);
  const clientsFile = resolve(directory, "gateway-clients.json");

  try {
    writeFileSync(
      clientsFile,
      JSON.stringify({
        clients: [
          {
            client_id: "configured-agent",
            api_key: "secret-local-key",
            label: "Configured Agent",
            decision_allowance: 10,
            allowance_window: "monthly",
          },
          {
            client_id: "unused-agent",
            api_key: "unused-secret-key",
            label: "Unused Agent",
          },
        ],
      }),
      "utf8",
    );

    const result = runCli(directory, "--gateway-admin", "--clients-file", clientsFile, "--json");
    const output = JSON.parse(result.stdout) as GatewayAdminSummary;
    const configured = output.clients.find((client) => client.client_id === "configured-agent");
    const unused = output.clients.find((client) => client.client_id === "unused-agent");

    assert.equal(result.status, 0);
    assert.equal(output.clients_file_found, true);
    assert.ok(configured);
    assert.equal(configured.label, "Configured Agent");
    assert.equal(configured.configured, true);
    assert.equal(configured.has_api_key_configured, true);
    assert.equal(configured.decision_allowance, 10);
    assert.equal(configured.allowance_window, "monthly");
    assert.ok(unused);
    assert.equal(unused.total_requests, 0);
    assert.equal(result.stdout.includes("secret-local-key"), false);
    assert.equal(result.stdout.includes("unused-secret-key"), false);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("missing clients file does not crash", () => {
  const directory = mkdtempSync(`${tmpdir()}\\atg-admin-missing-config-`);

  try {
    const result = runCli(directory, "--gateway-admin", "--clients-file", "missing-clients.json", "--json");
    const output = JSON.parse(result.stdout) as GatewayAdminSummary;

    assert.equal(result.status, 0);
    assert.equal(output.clients_file_found, false);
    assert.equal(output.warnings.some((warning) => warning.includes("missing-clients.json")), true);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("malformed log line is counted", () => {
  const directory = mkdtempSync(`${tmpdir()}\\atg-admin-malformed-`);
  const logPath = resolve(directory, "gateway-requests.jsonl");

  try {
    writeFileSync(logPath, `${JSON.stringify(sampleLogEntry())}\n{ invalid json\n`, "utf8");
    const output = createGatewayAdminSummary({ logPath });

    assert.equal(output.gateway_health.total_requests, 1);
    assert.equal(output.gateway_health.malformed_log_lines_count, 1);
    assert.equal(output.warnings.some((warning) => warning.includes("malformed")), true);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("allowance_status covers unlimited, under_limit, at_limit, and over_limit", () => {
  const directory = mkdtempSync(`${tmpdir()}\\atg-admin-allowance-`);
  const logPath = resolve(directory, "gateway-requests.jsonl");
  const clientsFile = resolve(directory, "gateway-clients.json");

  try {
    writeFileSync(
      clientsFile,
      JSON.stringify({
        clients: [
          { client_id: "unlimited-agent", api_key: "unlimited-key" },
          {
            client_id: "under-agent",
            api_key: "under-key",
            decision_allowance: 2,
            allowance_window: "all_time",
          },
          {
            client_id: "at-agent",
            api_key: "at-key",
            decision_allowance: 1,
            allowance_window: "all_time",
          },
          {
            client_id: "over-agent",
            api_key: "over-key",
            decision_allowance: 1,
            allowance_window: "all_time",
          },
        ],
      }),
      "utf8",
    );
    writeFileSync(
      logPath,
      [
        JSON.stringify(sampleLogEntry({ request_id: "gw_unlimited", client_id: "unlimited-agent" })),
        JSON.stringify(sampleLogEntry({ request_id: "gw_under", client_id: "under-agent" })),
        JSON.stringify(sampleLogEntry({ request_id: "gw_at", client_id: "at-agent" })),
        JSON.stringify(sampleLogEntry({ request_id: "gw_over_ok", client_id: "over-agent" })),
        JSON.stringify(sampleLogEntry({
          request_id: "gw_over_limit",
          client_id: "over-agent",
          ok: false,
          status_code: 429,
          over_limit: true,
          error_code: "CLIENT_USAGE_LIMIT_EXCEEDED",
        })),
      ].join("\n") + "\n",
      "utf8",
    );

    const output = createGatewayAdminSummary({ logPath, clientsFile });
    const byId = Object.fromEntries(output.clients.map((client) => [client.client_id, client]));

    assert.equal(byId["unlimited-agent"]?.allowance_status, "unlimited");
    assert.equal(byId["under-agent"]?.allowance_status, "under_limit");
    assert.equal(byId["under-agent"]?.used_decisions, 1);
    assert.equal(byId["under-agent"]?.remaining_decisions, 1);
    assert.equal(byId["at-agent"]?.allowance_status, "at_limit");
    assert.equal(byId["at-agent"]?.remaining_decisions, 0);
    assert.equal(byId["over-agent"]?.allowance_status, "over_limit");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

function writeGatewayLog(directory: string, entries: GatewayRequestLogEntry[]): void {
  mkdirSync(resolve(directory, "gateway-logs"));
  writeFileSync(
    resolve(directory, "gateway-logs", "gateway-requests.jsonl"),
    entries.map((entry) => JSON.stringify(entry)).join("\n") + "\n",
    "utf8",
  );
}

function sampleLogEntry(overrides: Partial<GatewayRequestLogEntry> = {}): GatewayRequestLogEntry {
  return {
    request_id: "gw_admin_sample",
    timestamp: "2026-06-26T12:00:00.000Z",
    endpoint: "/v1/decision",
    method: "POST",
    ok: true,
    status_code: 200,
    contract_version: "atg.v1",
    gateway_mode: "local",
    duration_ms: 3,
    client_id: "local-demo-agent",
    auth_required: true,
    auth_ok: true,
    usage_checked: true,
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

function sampleHealthLogEntry(): GatewayRequestLogEntry {
  return {
    request_id: "gw_health",
    timestamp: "2026-06-26T12:03:00.000Z",
    endpoint: "/v1/health",
    method: "GET",
    ok: true,
    status_code: 200,
    contract_version: "atg.v1",
    gateway_mode: "local",
    duration_ms: 1,
    client_id: "local-anonymous",
    auth_required: false,
    auth_ok: null,
  };
}
