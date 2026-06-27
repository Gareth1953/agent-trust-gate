import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

import {
  createGatewayServer,
  createHostedReadinessReport,
  type GatewayRequestLogEntry,
  type HostedReadinessReport,
} from "../src/index.js";

const cliPath = resolve("dist/src/cli.js");
const deploymentDocs = resolve("docs/deployment-readiness");

test("hosted readiness report is versioned and keeps deployment disabled", () => {
  const now = new Date("2026-06-27T12:00:00.000Z");
  const report = createHostedReadinessReport(now);
  assert.equal(report.hosted_readiness_version, "atg.hosted-readiness.v1");
  assert.equal(report.generated_at, now.toISOString());
  assert.equal(report.hosted_deployment_enabled, false);
  assert.equal(report.public_service_enabled, false);
  assert.equal(report.production_ready, false);
  assert.equal(report.overall.hosted_readiness_percent, 33);
  assert.equal(report.overall.status, "not_hosted_preparation_only");
  assert.equal(report.recommended_environment.host, "127.0.0.1");
  assert.equal(report.checks.some((check) => check.id === "security_readiness_available"), true);
  assert.equal(report.checks.some((check) => check.id === "local_rate_limit_signals_available"), true);
});

test("hosted readiness contains required security and missing-capability checks", () => {
  const report = createHostedReadinessReport();
  for (const id of [
    "public_binding_disabled_by_default",
    "production_authentication_missing",
    "payment_processing_missing",
    "production_monitoring_missing",
    "rate_limiting_local_only",
    "terms_and_legal_review_missing",
    "public_hosting_not_enabled",
  ]) {
    assert.ok(report.checks.some((check) => check.id === id), id);
  }
  assert.equal(report.checks.find((check) => (
    check.id === "production_authentication_missing"
  ))?.severity, "critical");
});

test("hosted readiness lists mandatory authentication and TLS gates", () => {
  const requirements = createHostedReadinessReport().required_before_hosting.join("\n");
  assert.match(requirements, /production-grade authentication/i);
  assert.match(requirements, /HTTPS\/TLS/i);
  assert.match(requirements, /rate limiting/i);
  assert.match(requirements, /incident response/i);
  assert.match(requirements, /deployment rollback/i);
});

test("CLI hosted readiness JSON is parseable", () => {
  const result = spawnSync(process.execPath, [cliPath, "--hosted-readiness", "--json"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  const output = JSON.parse(result.stdout) as HostedReadinessReport;
  assert.equal(result.status, 0);
  assert.equal(result.stderr, "");
  assert.equal(output.hosted_readiness_version, "atg.hosted-readiness.v1");
  assert.equal(output.hosted_deployment_enabled, false);
});

test("CLI hosted readiness output creates a local JSON report", () => {
  const directory = mkdtempSync(`${tmpdir()}\\atg-hosted-readiness-`);
  const outputPath = resolve(directory, "nested", "hosted-readiness.json");
  try {
    const result = spawnSync(process.execPath, [
      cliPath,
      "--hosted-readiness",
      "--output",
      outputPath,
    ], { cwd: process.cwd(), encoding: "utf8" });
    assert.equal(result.status, 0);
    assert.equal(existsSync(outputPath), true);
    const output = JSON.parse(readFileSync(outputPath, "utf8")) as HostedReadinessReport;
    assert.equal(output.production_ready, false);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("GET hosted readiness returns JSON with request ID and logs the request", async () => {
  const directory = mkdtempSync(`${tmpdir()}\\atg-hosted-readiness-http-`);
  const logPath = resolve(directory, "gateway.jsonl");
  const server = createGatewayServer({
    requireApiKey: true,
    clients: [{ client_id: "hosted-test", api_key: "test-only-secret" }],
    gatewayLogPath: logPath,
  });
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  const address = server.address() as AddressInfo;
  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/v1/hosted-readiness`);
    const body = await response.json() as HostedReadinessReport & { request_id: string };
    assert.equal(response.status, 200);
    assert.equal(body.hosted_readiness_version, "atg.hosted-readiness.v1");
    assert.match(body.request_id, /^gw_[0-9a-f-]{36}$/);
    assert.equal(body.public_service_enabled, false);
  } finally {
    await new Promise<void>((done, reject) => server.close((error) => error ? reject(error) : done()));
    const entry = JSON.parse(readFileSync(logPath, "utf8").trim()) as GatewayRequestLogEntry;
    assert.equal(entry.endpoint, "/v1/hosted-readiness");
    assert.equal(entry.status_code, 200);
    rmSync(directory, { recursive: true, force: true });
  }
});

test("deployment readiness documents exist and environment template has safe defaults", () => {
  for (const fileName of [
    "README.md",
    "production-checklist.md",
    "env.example",
    "local-to-hosted-notes.md",
  ]) {
    assert.equal(existsSync(resolve(deploymentDocs, fileName)), true, fileName);
  }
  const environment = readFileSync(resolve(deploymentDocs, "env.example"), "utf8");
  assert.match(environment, /ATG_HOST=127\.0\.0\.1/);
  assert.match(environment, /ATG_HOSTED_DEPLOYMENT_ENABLED=false/);
  assert.match(environment, /ATG_PAYMENT_ENABLED=false/);
  assert.match(environment, /ATG_AUTOMATIC_PURCHASE_ENABLED=false/);
  assert.match(environment, /ATG_BILLING_ENABLED=false/);
  assert.doesNotMatch(environment, /sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|BEGIN (RSA |OPENSSH |EC )?PRIVATE KEY/);
});

test("deployment documentation states no deployment, payment, or action execution", () => {
  const source = ["README.md", "production-checklist.md", "local-to-hosted-notes.md"]
    .map((fileName) => readFileSync(resolve(deploymentDocs, fileName), "utf8"))
    .join("\n");
  assert.match(source, /does not deploy/i);
  assert.match(source, /payments?/i);
  assert.match(source, /disabled|does not deploy/i);
  assert.match(source, /execute actions/i);
});
