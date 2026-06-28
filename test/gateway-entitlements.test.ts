import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

import {
  createGatewayServer,
  getGatewayEntitlementStatus,
  type GatewayClient,
  type GatewayEntitlementStatus,
  type GatewayRequestLogEntry,
} from "../src/index.js";

const cliPath = resolve("dist/src/cli.js");

test("entitlement statuses cover unlimited, active, at-limit, over-limit, and unknown", () => {
  const directory = mkdtempSync(`${tmpdir()}\\atg-entitlement-status-`);
  try {
    const cases: Array<{
      name: string;
      client: GatewayClient | undefined;
      successfulRequests: number;
      overLimitEvent?: boolean;
      expected: GatewayEntitlementStatus["entitlement_status"];
      upgradeRequired: boolean;
    }> = [
      {
        name: "unlimited",
        client: { client_id: "unlimited", api_key: "test-key" },
        successfulRequests: 0,
        expected: "unlimited_local",
        upgradeRequired: false,
      },
      {
        name: "active",
        client: limitedClient("active", 2),
        successfulRequests: 1,
        expected: "active",
        upgradeRequired: false,
      },
      {
        name: "at-limit",
        client: limitedClient("at-limit", 1),
        successfulRequests: 1,
        expected: "at_limit",
        upgradeRequired: true,
      },
      {
        name: "over-limit",
        client: limitedClient("over-limit", 1),
        successfulRequests: 1,
        overLimitEvent: true,
        expected: "over_limit",
        upgradeRequired: true,
      },
      {
        name: "unknown",
        client: undefined,
        successfulRequests: 0,
        expected: "unknown_client",
        upgradeRequired: false,
      },
    ];

    for (const entry of cases) {
      const logPath = resolve(directory, `${entry.name}.jsonl`);
      const clientId = entry.client?.client_id ?? "unknown";
      const logs = Array.from({ length: entry.successfulRequests }, (_, index) => (
        sampleLogEntry(clientId, `gw_${entry.name}_${index}`)
      ));
      if (entry.overLimitEvent === true) {
        logs.push(sampleLogEntry(clientId, `gw_${entry.name}_rejected`, {
          ok: false,
          status_code: 429,
          over_limit: true,
          error_code: "CLIENT_USAGE_LIMIT_EXCEEDED",
        }));
      }
      if (logs.length > 0) {
        writeFileSync(logPath, `${logs.map((log) => JSON.stringify(log)).join("\n")}\n`, "utf8");
      }

      const entitlement = getGatewayEntitlementStatus({
        clientId,
        clients: entry.client === undefined ? [] : [entry.client],
        gatewayLogPath: logPath,
      });
      assert.equal(entitlement.entitlement_status, entry.expected, entry.name);
      assert.equal(entitlement.upgrade.upgrade_required, entry.upgradeRequired, entry.name);
      assert.equal(entitlement.upgrade.purchase_enabled, false, entry.name);
      assert.equal(entitlement.upgrade.automatic_purchase_enabled, false, entry.name);
      assert.equal(entitlement.upgrade.billing_enabled, false, entry.name);
      assert.equal(entitlement.tenant_id, null, entry.name);
      assert.equal(entitlement.account_id, null, entry.name);
      assert.equal(entitlement.billing_enabled, false, entry.name);
      assert.equal(entitlement.payment_processing_enabled, false, entry.name);
      assert.equal(entitlement.automatic_purchase_enabled, false, entry.name);
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("entitlement over-limit status also detects usage beyond configured allowance", () => {
  const directory = mkdtempSync(`${tmpdir()}\\atg-entitlement-over-`);
  const logPath = resolve(directory, "gateway.jsonl");
  try {
    writeFileSync(logPath, [
      JSON.stringify(sampleLogEntry("over-agent", "gw_one")),
      JSON.stringify(sampleLogEntry("over-agent", "gw_two")),
    ].join("\n") + "\n", "utf8");
    const entitlement = getGatewayEntitlementStatus({
      clientId: "over-agent",
      clients: [limitedClient("over-agent", 1)],
      gatewayLogPath: logPath,
    });
    assert.equal(entitlement.entitlement_status, "over_limit");
    assert.equal(entitlement.usage.used_decisions, 2);
    assert.equal(entitlement.usage.remaining_decisions, 0);
    assert.equal(entitlement.upgrade.upgrade_reason, "local_decision_allowance_exceeded");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("CLI entitlement JSON supports client ID and optional clients file", () => {
  const directory = mkdtempSync(`${tmpdir()}\\atg-entitlement-cli-`);
  try {
    const result = spawnSync(process.execPath, [
      cliPath,
      "--entitlement",
      "--client-id",
      "local-demo-agent",
      "--clients-file",
      resolve("gateway-clients.example.json"),
      "--json",
    ], {
      cwd: directory,
      encoding: "utf8",
    });
    const output = JSON.parse(result.stdout) as GatewayEntitlementStatus;
    assert.equal(result.status, 0);
    assert.equal(result.stderr, "");
    assert.equal(output.client_id, "local-demo-agent");
    assert.equal(output.entitlement_status, "active");
    assert.equal(output.usage.decision_allowance, 1000);
    assert.equal(output.upgrade.purchase_enabled, false);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("CLI entitlement with missing logs and clients file does not crash", () => {
  const directory = mkdtempSync(`${tmpdir()}\\atg-entitlement-missing-`);
  try {
    const result = spawnSync(process.execPath, [
      cliPath,
      "--entitlement",
      "--client-id",
      "missing-client",
      "--clients-file",
      resolve(directory, "missing-clients.json"),
      "--json",
    ], { cwd: directory, encoding: "utf8" });
    assert.equal(result.status, 0);
    assert.equal((JSON.parse(result.stdout) as GatewayEntitlementStatus).entitlement_status, "unknown_client");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("GET entitlement returns JSON with request ID and logs the lookup", async () => {
  const directory = mkdtempSync(`${tmpdir()}\\atg-entitlement-http-`);
  const logPath = resolve(directory, "gateway.jsonl");
  const server = createGatewayServer({ gatewayLogPath: logPath });
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  const address = server.address() as AddressInfo;
  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/v1/entitlement`, {
      headers: { "X-ATG-Client-ID": "local-lookup" },
    });
    const body = await response.json() as GatewayEntitlementStatus & { request_id: string };
    assert.equal(response.status, 200);
    assert.match(body.request_id, /^gw_[0-9a-f-]{36}$/);
    assert.equal(body.client_id, "local-lookup");
    assert.equal(body.entitlement_status, "unknown_client");
    assert.equal(body.upgrade.purchase_enabled, false);
  } finally {
    await new Promise<void>((done, reject) => server.close((error) => error ? reject(error) : done()));
    const entry = JSON.parse(readFileSync(logPath, "utf8").trim()) as GatewayRequestLogEntry;
    assert.equal(entry.endpoint, "/v1/entitlement");
    assert.equal(entry.status_code, 200);
    rmSync(directory, { recursive: true, force: true });
  }
});

test("GET entitlement requires and validates API key in API-key mode", async () => {
  const directory = mkdtempSync(`${tmpdir()}\\atg-entitlement-auth-`);
  const server = createGatewayServer({
    requireApiKey: true,
    clients: [limitedClient("auth-agent", 5)],
    gatewayLogPath: resolve(directory, "gateway.jsonl"),
  });
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  const address = server.address() as AddressInfo;
  const url = `http://127.0.0.1:${address.port}/v1/entitlement`;
  try {
    const unauthorized = await fetch(url);
    assert.equal(unauthorized.status, 401);

    const authorized = await fetch(url, {
      headers: { "X-ATG-API-Key": "test-key" },
    });
    const body = await authorized.json() as GatewayEntitlementStatus;
    assert.equal(authorized.status, 200);
    assert.equal(body.client_id, "auth-agent");
    assert.equal(body.entitlement_status, "active");
  } finally {
    await new Promise<void>((done, reject) => server.close((error) => error ? reject(error) : done()));
    rmSync(directory, { recursive: true, force: true });
  }
});

function limitedClient(clientId: string, allowance: number): GatewayClient {
  return {
    client_id: clientId,
    api_key: "test-key",
    decision_allowance: allowance,
    allowance_window: "all_time",
  };
}

function sampleLogEntry(
  clientId: string,
  requestId: string,
  overrides: Partial<GatewayRequestLogEntry> = {},
): GatewayRequestLogEntry {
  return {
    request_id: requestId,
    timestamp: "2026-06-27T12:00:00.000Z",
    endpoint: "/v1/decision",
    method: "POST",
    ok: true,
    status_code: 200,
    contract_version: "atg.v1",
    gateway_mode: "local",
    duration_ms: 1,
    client_id: clientId,
    auth_required: true,
    auth_ok: true,
    over_limit: false,
    ...overrides,
  };
}
