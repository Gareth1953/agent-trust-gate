import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

import {
  createGatewayServer,
  createRateLimitStatus,
  type GatewayRequestLogEntry,
  type RateLimitStatusReport,
} from "../src/index.js";

const cliPath = resolve("dist/src/cli.js");
const client = {
  client_id: "rate-test-agent",
  api_key: "local-test-key",
  rate_limit: { max_requests: 1, window: "local_runtime" as const },
};
const action = {
  action_type: "local_file_update",
  description: "Validate local runtime rate-limit behavior.",
  actor: "rate-test-agent",
  target: "local-test-fixture",
  rollback_plan: "Restore the local fixture.",
};

test("rate-limit status calculator covers every threshold", () => {
  const notConfigured = createRateLimitStatus({ clientId: "test", usedRequests: 0 });
  const within = createRateLimitStatus({ clientId: "test", maxRequests: 10, usedRequests: 7 });
  const near = createRateLimitStatus({ clientId: "test", maxRequests: 10, usedRequests: 8 });
  const at = createRateLimitStatus({ clientId: "test", maxRequests: 10, usedRequests: 10 });
  const over = createRateLimitStatus({ clientId: "test", maxRequests: 10, usedRequests: 11 });
  assert.equal(notConfigured.rate_limit_version, "atg.rate-limit.v1");
  assert.equal(notConfigured.rate_limit_status, "not_configured");
  assert.equal(within.rate_limit_status, "within_limit");
  assert.equal(near.rate_limit_status, "near_limit");
  assert.equal(at.rate_limit_status, "at_limit");
  assert.equal(over.rate_limit_status, "over_limit");
  assert.equal(over.abuse_signal.abuse_status, "over_limit");
});

test("all rate-limit outputs keep commerce disabled", () => {
  for (const usedRequests of [0, 8, 10, 11]) {
    const report = createRateLimitStatus({ clientId: "test", maxRequests: 10, usedRequests });
    assert.equal(report.upgrade.purchase_enabled, false);
    assert.equal(report.upgrade.automatic_purchase_enabled, false);
    assert.equal(report.upgrade.billing_enabled, false);
  }
});

test("simple abuse statuses include repeated errors and unknown clients", () => {
  assert.equal(createRateLimitStatus({
    clientId: "known",
    maxRequests: 10,
    usedRequests: 1,
    repeatedErrors: 3,
  }).abuse_signal.abuse_status, "repeated_errors");
  assert.equal(createRateLimitStatus({
    clientId: "unknown",
    usedRequests: 0,
    knownClient: false,
  }).abuse_signal.abuse_status, "unknown_client");
});

test("configured local runtime limit returns 429 before protected logic runs", async () => {
  const directory = mkdtempSync(`${tmpdir()}\\atg-rate-limit-`);
  const logPath = resolve(directory, "gateway.jsonl");
  const server = createGatewayServer({ clients: [client], gatewayLogPath: logPath });
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  const address = server.address() as AddressInfo;
  const request = () => fetch(`http://127.0.0.1:${address.port}/v1/decision`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-atg-client-id": client.client_id },
    body: JSON.stringify(action),
  });
  try {
    const first = await request();
    assert.equal(first.status, 200);
    const second = await request();
    const body = await second.json() as Record<string, unknown>;
    assert.equal(second.status, 429);
    assert.equal((body.error as { code: string }).code, "ATG_RATE_LIMIT_EXCEEDED");
    assert.equal(body.rate_limit_status, "over_limit");
    assert.equal(body.abuse_status, "over_limit");
    assert.equal(body.purchase_enabled, false);
    assert.equal(body.automatic_purchase_enabled, false);
    assert.equal(body.billing_enabled, false);
    assert.equal(body.executes_actions, false);
  } finally {
    await new Promise<void>((done, reject) => server.close((error) => error ? reject(error) : done()));
    const entries = readFileSync(logPath, "utf8").trim().split(/\r?\n/).map((line) => (
      JSON.parse(line) as GatewayRequestLogEntry
    ));
    assert.equal(entries.at(-1)?.error_code, "ATG_RATE_LIMIT_EXCEEDED");
    assert.equal(entries.at(-1)?.rate_limit_status, "over_limit");
    rmSync(directory, { recursive: true, force: true });
  }
});

test("GET rate-limit status is JSON, traced, logged, and protected in API-key mode", async () => {
  const directory = mkdtempSync(`${tmpdir()}\\atg-rate-limit-status-`);
  const logPath = resolve(directory, "gateway.jsonl");
  const server = createGatewayServer({ requireApiKey: true, clients: [client], gatewayLogPath: logPath });
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  const address = server.address() as AddressInfo;
  const url = `http://127.0.0.1:${address.port}/v1/rate-limit-status`;
  try {
    assert.equal((await fetch(url)).status, 401);
    const response = await fetch(url, { headers: { "x-atg-api-key": client.api_key } });
    const body = await response.json() as RateLimitStatusReport & { request_id: string };
    assert.equal(response.status, 200);
    assert.equal(body.rate_limit_version, "atg.rate-limit.v1");
    assert.equal(body.rate_limit_status, "within_limit");
    assert.match(body.request_id, /^gw_[0-9a-f-]{36}$/);
  } finally {
    await new Promise<void>((done, reject) => server.close((error) => error ? reject(error) : done()));
    const entries = readFileSync(logPath, "utf8").trim().split(/\r?\n/).map((line) => (
      JSON.parse(line) as GatewayRequestLogEntry
    ));
    assert.equal(entries.at(-1)?.endpoint, "/v1/rate-limit-status");
    rmSync(directory, { recursive: true, force: true });
  }
});

test("CLI rate-limit JSON and output modes are parseable", () => {
  const json = spawnSync(process.execPath, [cliPath, "--rate-limit-status", "--json"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.equal(json.status, 0);
  assert.equal((JSON.parse(json.stdout) as RateLimitStatusReport).rate_limit_version, "atg.rate-limit.v1");

  const directory = mkdtempSync(`${tmpdir()}\\atg-rate-limit-cli-`);
  const outputPath = resolve(directory, "nested", "rate-limit.json");
  try {
    const output = spawnSync(process.execPath, [
      cliPath,
      "--rate-limit-status",
      "--output",
      outputPath,
    ], { cwd: process.cwd(), encoding: "utf8" });
    assert.equal(output.status, 0);
    assert.equal(existsSync(outputPath), true);
    assert.equal(
      (JSON.parse(readFileSync(outputPath, "utf8")) as RateLimitStatusReport).rate_limit_version,
      "atg.rate-limit.v1",
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("rate-limit documentation exists and states the local-only boundary", () => {
  const directory = resolve("docs/rate-limit-abuse-control");
  const files = ["README.md", "local-rate-limits.md", "abuse-signal-model.md", "future-production-controls.md"];
  const source = files.map((file) => readFileSync(resolve(directory, file), "utf8")).join("\n");
  assert.match(source, /not production-grade abuse prevention/i);
  assert.match(source, /ATG_RATE_LIMIT_EXCEEDED/);
  assert.match(source, /distributed/i);
  assert.doesNotMatch(source, /sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}/);
});
