import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

import {
  createGatewayServer,
  createMonitoringHealthReport,
  type GatewayRequestLogEntry,
  type MonitoringHealthReport,
} from "../src/index.js";

const cliPath = resolve("dist/src/cli.js");

test("monitoring health is versioned and keeps production services disabled", () => {
  const directory = mkdtempSync(`${tmpdir()}\\atg-monitoring-empty-`);
  try {
    const now = new Date("2026-06-27T12:00:10.000Z");
    const report = createMonitoringHealthReport({
      now,
      gatewayLogPath: resolve(directory, "missing.jsonl"),
    });
    assert.equal(report.monitoring_health_version, "atg.monitoring-health.v1");
    assert.equal(report.generated_at, now.toISOString());
    assert.equal(report.production_monitoring_enabled, false);
    assert.equal(report.external_alerting_enabled, false);
    assert.equal(report.public_uptime_sla_enabled, false);
    assert.equal(report.overall.monitoring_readiness_percent, 33);
    assert.equal(report.runtime.uptime_available, false);
    assert.equal(report.log_health.log_file_found, false);
    assert.equal(report.log_health.total_logged_requests, 0);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("monitoring health exposes local capability signals and required checks", () => {
  const report = createMonitoringHealthReport();
  assert.equal(report.health.gateway_health_endpoint_available, true);
  assert.equal(report.health.request_logging_available, true);
  assert.equal(report.health.request_id_available, true);
  assert.equal(report.health.usage_metering_available, true);
  for (const id of [
    "local_health_endpoint_available",
    "request_logging_available",
    "production_monitoring_local_signals",
    "external_alerting_missing",
    "uptime_sla_missing",
    "incident_response_partial_local",
  ]) {
    assert.ok(report.checks.some((check) => check.id === id), id);
  }
  assert.match(report.required_before_public_hosting.join("\n"), /production uptime monitoring/i);
  assert.match(report.required_before_public_hosting.join("\n"), /external alerting/i);
  assert.match(report.recommended_monitoring_controls.join("\n"), /request IDs on all responses/i);
});

test("monitoring log health counts valid, error, rate-limit, unauthorized, and malformed entries", () => {
  const directory = mkdtempSync(`${tmpdir()}\\atg-monitoring-log-`);
  const logPath = resolve(directory, "gateway.jsonl");
  const base = {
    timestamp: "2026-06-27T12:00:00.000Z",
    endpoint: "/v1/decision",
    method: "POST",
    contract_version: "atg.v1",
    gateway_mode: "local",
    duration_ms: 1,
    client_id: "monitoring-test",
  };
  writeFileSync(logPath, [
    JSON.stringify({ ...base, request_id: "gw_1", ok: true, status_code: 200 }),
    JSON.stringify({ ...base, request_id: "gw_2", ok: false, status_code: 429, error_code: "ATG_RATE_LIMIT_EXCEEDED", over_limit: true }),
    JSON.stringify({ ...base, request_id: "gw_3", ok: false, status_code: 401, error_code: "UNAUTHORIZED_GATEWAY_REQUEST", auth_required: true, auth_ok: false }),
    "{malformed",
  ].join("\n"), "utf8");
  try {
    const report = createMonitoringHealthReport({ gatewayLogPath: logPath });
    assert.equal(report.log_health.log_file_found, true);
    assert.equal(report.log_health.total_logged_requests, 3);
    assert.equal(report.log_health.error_requests, 2);
    assert.equal(report.log_health.rate_limited_requests, 1);
    assert.equal(report.log_health.unauthorized_requests, 1);
    assert.equal(report.log_health.malformed_log_lines, 1);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("CLI monitoring health JSON and output modes are parseable", () => {
  const json = spawnSync(process.execPath, [cliPath, "--monitoring-health", "--json"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.equal(json.status, 0);
  assert.equal(json.stderr, "");
  assert.equal(
    (JSON.parse(json.stdout) as MonitoringHealthReport).monitoring_health_version,
    "atg.monitoring-health.v1",
  );

  const directory = mkdtempSync(`${tmpdir()}\\atg-monitoring-cli-`);
  const outputPath = resolve(directory, "nested", "monitoring.json");
  try {
    const output = spawnSync(process.execPath, [
      cliPath,
      "--monitoring-health",
      "--output",
      outputPath,
    ], { cwd: process.cwd(), encoding: "utf8" });
    assert.equal(output.status, 0);
    assert.equal(existsSync(outputPath), true);
    assert.equal(
      (JSON.parse(readFileSync(outputPath, "utf8")) as MonitoringHealthReport).external_alerting_enabled,
      false,
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("GET monitoring health returns live runtime JSON with request ID and logs the request", async () => {
  const directory = mkdtempSync(`${tmpdir()}\\atg-monitoring-http-`);
  const logPath = resolve(directory, "gateway.jsonl");
  const server = createGatewayServer({ gatewayLogPath: logPath });
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  const address = server.address() as AddressInfo;
  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/v1/monitoring-health`);
    const body = await response.json() as MonitoringHealthReport & { request_id: string };
    assert.equal(response.status, 200);
    assert.equal(body.monitoring_health_version, "atg.monitoring-health.v1");
    assert.match(body.request_id, /^gw_[0-9a-f-]{36}$/);
    assert.equal(body.runtime.scope, "current_gateway_process");
    assert.equal(body.runtime.uptime_available, true);
    assert.equal(typeof body.runtime.uptime_seconds, "number");
  } finally {
    await new Promise<void>((done, reject) => server.close((error) => error ? reject(error) : done()));
    const entry = JSON.parse(readFileSync(logPath, "utf8").trim()) as GatewayRequestLogEntry;
    assert.equal(entry.endpoint, "/v1/monitoring-health");
    assert.equal(entry.status_code, 200);
    rmSync(directory, { recursive: true, force: true });
  }
});

test("monitoring health documents exist and state the local-only boundary", () => {
  const directory = resolve("docs/monitoring-health");
  const files = ["README.md", "local-monitoring-signals.md", "future-production-monitoring.md", "log-retention-and-alerting.md"];
  const source = files.map((file) => readFileSync(resolve(directory, file), "utf8")).join("\n");
  assert.match(source, /not production monitoring/i);
  assert.match(source, /No external alert/i);
  assert.match(source, /uptime SLA/i);
  assert.doesNotMatch(source, /sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}/);
});
