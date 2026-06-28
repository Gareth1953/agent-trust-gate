import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

import {
  createGatewayServer,
  createSecurityReadinessReport,
  type GatewayRequestLogEntry,
  type SecurityReadinessReport,
} from "../src/index.js";

const cliPath = resolve("dist/src/cli.js");
const securityDocs = resolve("docs/security-readiness");

test("security readiness report is versioned and never certifies production security", () => {
  const now = new Date("2026-06-27T12:00:00.000Z");
  const report = createSecurityReadinessReport(now);
  assert.equal(report.security_readiness_version, "atg.security-readiness.v1");
  assert.equal(report.generated_at, now.toISOString());
  assert.equal(report.local_only, true);
  assert.equal(report.production_security_certified, false);
  assert.equal(report.public_service_safe, false);
  assert.equal(report.payment_security_ready, false);
  assert.equal(report.overall.security_readiness_percent, 40);
  assert.equal(report.overall.status, "security_preparation_only_not_production_certified");
});

test("security readiness includes implemented foundations and missing production controls", () => {
  const report = createSecurityReadinessReport();
  for (const id of [
    "local_only_default_binding",
    "raw_api_keys_not_logged",
    "production_authentication_missing",
    "secret_storage_missing",
    "rate_limiting_local_only",
    "abuse_prevention_local_signals",
    "production_monitoring_local_signals",
    "incident_response_partial_local",
    "customer_tenant_readiness_local_only",
    "public_docs_safety_boundaries_available",
    "transport_security_required",
    "payment_security_planning_only",
  ]) {
    assert.ok(report.checks.some((check) => check.id === id), id);
  }
});

test("security readiness lists critical gaps and pre-hosting controls", () => {
  const report = createSecurityReadinessReport();
  assert.ok(report.critical_gaps.includes("production_authentication_not_implemented"));
  assert.ok(report.critical_gaps.includes("secure_secret_storage_not_implemented"));
  assert.match(report.required_before_public_hosting.join("\n"), /production-grade authentication/i);
  assert.match(report.required_before_public_hosting.join("\n"), /HTTPS\/TLS termination/i);
  assert.match(report.recommended_security_controls.join("\n"), /never log raw secrets/i);
});

test("CLI security readiness JSON is parseable", () => {
  const result = spawnSync(process.execPath, [cliPath, "--security-readiness", "--json"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  const output = JSON.parse(result.stdout) as SecurityReadinessReport;
  assert.equal(result.status, 0);
  assert.equal(result.stderr, "");
  assert.equal(output.security_readiness_version, "atg.security-readiness.v1");
  assert.equal(output.production_security_certified, false);
});

test("CLI security readiness output creates a local JSON report", () => {
  const directory = mkdtempSync(`${tmpdir()}\\atg-security-readiness-`);
  const outputPath = resolve(directory, "nested", "security-readiness.json");
  try {
    const result = spawnSync(process.execPath, [
      cliPath,
      "--security-readiness",
      "--output",
      outputPath,
    ], { cwd: process.cwd(), encoding: "utf8" });
    assert.equal(result.status, 0);
    assert.equal(existsSync(outputPath), true);
    const output = JSON.parse(readFileSync(outputPath, "utf8")) as SecurityReadinessReport;
    assert.equal(output.public_service_safe, false);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("GET security readiness returns JSON with request ID and logs the request", async () => {
  const directory = mkdtempSync(`${tmpdir()}\\atg-security-readiness-http-`);
  const logPath = resolve(directory, "gateway.jsonl");
  const server = createGatewayServer({
    requireApiKey: true,
    clients: [{ client_id: "security-test", api_key: "test-only-secret" }],
    gatewayLogPath: logPath,
  });
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  const address = server.address() as AddressInfo;
  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/v1/security-readiness`);
    const body = await response.json() as SecurityReadinessReport & { request_id: string };
    assert.equal(response.status, 200);
    assert.equal(body.security_readiness_version, "atg.security-readiness.v1");
    assert.match(body.request_id, /^gw_[0-9a-f-]{36}$/);
    assert.equal(body.production_security_certified, false);
  } finally {
    await new Promise<void>((done, reject) => server.close((error) => error ? reject(error) : done()));
    const entry = JSON.parse(readFileSync(logPath, "utf8").trim()) as GatewayRequestLogEntry;
    assert.equal(entry.endpoint, "/v1/security-readiness");
    assert.equal(entry.status_code, 200);
    rmSync(directory, { recursive: true, force: true });
  }
});

test("security readiness documents exist and avoid secret or certification claims", () => {
  for (const fileName of [
    "README.md",
    "production-security-checklist.md",
    "secret-handling.md",
    "incident-response-template.md",
    "rate-limiting-and-abuse-prevention.md",
  ]) {
    assert.equal(existsSync(resolve(securityDocs, fileName)), true, fileName);
  }
  const secretHandling = readFileSync(resolve(securityDocs, "secret-handling.md"), "utf8");
  assert.match(secretHandling, /never commit real secrets/i);
  const source = ["README.md", "production-security-checklist.md", "secret-handling.md"]
    .map((fileName) => readFileSync(resolve(securityDocs, fileName), "utf8"))
    .join("\n");
  assert.match(source, /not a security certification/i);
  assert.doesNotMatch(source, /sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|BEGIN (RSA |OPENSSH |EC )?PRIVATE KEY/);
});
