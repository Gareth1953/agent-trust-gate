import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

import {
  createCommercialReadinessSnapshot,
  createGatewayServer,
  type CommercialReadinessSnapshot,
  type GatewayRequestLogEntry,
} from "../src/index.js";

const cliPath = resolve("dist/src/cli.js");

test("commercial readiness snapshot is deterministic, versioned, and below full completion", () => {
  const now = new Date("2026-06-27T12:00:00.000Z");
  const snapshot = createCommercialReadinessSnapshot(now);
  assert.equal(snapshot.readiness_version, "atg.commercial-readiness.v1");
  assert.equal(snapshot.generated_at, now.toISOString());
  assert.equal(snapshot.overall.local_product_readiness_percent, 86);
  assert.equal(snapshot.overall.commercial_mvp_readiness_percent, 63);
  assert.equal(snapshot.overall.full_target_readiness_percent, 38);
  assert.ok(snapshot.overall.full_target_readiness_percent < 100);
  assert.equal(snapshot.overall.status, "local_infrastructure_ready_not_commercially_complete");
  assert.doesNotMatch(JSON.stringify(snapshot), /100% complete/i);
});

test("future commercial target categories remain honestly unstarted", () => {
  const snapshot = createCommercialReadinessSnapshot();
  for (const id of [
    "payment_processing",
    "automatic_machine_to_machine_purchase",
    "global_automated_marketing",
    "self_learning_market_scanning",
  ]) {
    const category = snapshot.categories.find((candidate) => candidate.id === id);
    assert.ok(category, id);
    assert.match(category.status, /^(not_started|future)$/);
    assert.equal(category.readiness_percent, 0);
  }
});

test("production hosting is partial preparation and not complete", () => {
  const snapshot = createCommercialReadinessSnapshot();
  const hosting = snapshot.categories.find((category) => category.id === "production_hosting");
  assert.ok(hosting);
  assert.equal(hosting.status, "partial");
  assert.equal(hosting.readiness_percent, 25);
  assert.match(hosting.evidence.join(" "), /readiness report/i);
  assert.match(hosting.gaps.join(" "), /No hosted deployment/i);
  const security = snapshot.categories.find((category) => category.id === "production_security_readiness");
  assert.ok(security);
  assert.equal(security.status, "partial");
  assert.equal(security.readiness_percent, 30);
  assert.match(security.gaps.join(" "), /No production authentication/i);
});

test("commercial readiness includes the full required category inventory", () => {
  const snapshot = createCommercialReadinessSnapshot();
  const ids = new Set(snapshot.categories.map((category) => category.id));
  for (const id of [
    "core_trust_decision_engine",
    "policy_profiles",
    "approval_and_human_review",
    "evidence_bundle_layer",
    "local_gateway_api",
    "gateway_logging_and_metering",
    "client_identity_and_api_key_gate",
    "client_usage_limits",
    "gateway_admin_summary",
    "developer_quickstart",
    "openapi_contract",
    "sdk_wrappers",
    "agent_manifest",
    "mcp_style_adapter",
    "entitlement_and_upgrade_signals",
    "production_hosting",
    "production_authentication",
    "production_security_readiness",
    "customer_accounts",
    "payment_processing",
    "automatic_machine_to_machine_purchase",
    "billing_records",
    "global_automated_marketing",
    "public_developer_docs",
    "self_learning_market_scanning",
    "adaptive_upgrade_recommendations",
    "production_monitoring",
    "legal_terms_and_commercial_positioning",
  ]) {
    assert.equal(ids.has(id), true, id);
  }
  assert.equal(snapshot.categories.every((category) => (
    category.status !== "complete" || category.readiness_percent === 100
  )), true);
});

test("CLI commercial readiness JSON is parseable", () => {
  const result = spawnSync(process.execPath, [cliPath, "--commercial-readiness", "--json"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  const output = JSON.parse(result.stdout) as CommercialReadinessSnapshot;
  assert.equal(result.status, 0);
  assert.equal(result.stderr, "");
  assert.equal(output.readiness_version, "atg.commercial-readiness.v1");
  assert.equal(output.overall.full_target_readiness_percent, 38);
});

test("CLI commercial readiness output creates a local JSON report", () => {
  const directory = mkdtempSync(`${tmpdir()}\\atg-commercial-readiness-`);
  const outputPath = resolve(directory, "nested", "commercial-readiness.json");
  try {
    const result = spawnSync(process.execPath, [
      cliPath,
      "--commercial-readiness",
      "--output",
      outputPath,
    ], { cwd: process.cwd(), encoding: "utf8" });
    assert.equal(result.status, 0);
    assert.equal(existsSync(outputPath), true);
    const output = JSON.parse(readFileSync(outputPath, "utf8")) as CommercialReadinessSnapshot;
    assert.equal(output.readiness_version, "atg.commercial-readiness.v1");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("GET commercial readiness returns JSON with request ID and logs the request", async () => {
  const directory = mkdtempSync(`${tmpdir()}\\atg-commercial-readiness-http-`);
  const logPath = resolve(directory, "gateway.jsonl");
  const server = createGatewayServer({
    requireApiKey: true,
    clients: [{ client_id: "readiness-test", api_key: "test-only-secret" }],
    gatewayLogPath: logPath,
  });
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  const address = server.address() as AddressInfo;
  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/v1/commercial-readiness`);
    const body = await response.json() as CommercialReadinessSnapshot & { request_id: string };
    assert.equal(response.status, 200);
    assert.equal(body.readiness_version, "atg.commercial-readiness.v1");
    assert.match(body.request_id, /^gw_[0-9a-f-]{36}$/);
    assert.equal(body.overall.full_target_readiness_percent, 38);
  } finally {
    await new Promise<void>((done, reject) => server.close((error) => error ? reject(error) : done()));
    const entry = JSON.parse(readFileSync(logPath, "utf8").trim()) as GatewayRequestLogEntry;
    assert.equal(entry.endpoint, "/v1/commercial-readiness");
    assert.equal(entry.status_code, 200);
    rmSync(directory, { recursive: true, force: true });
  }
});

test("commercial readiness safety statement excludes implemented commerce claims", () => {
  const snapshot = createCommercialReadinessSnapshot();
  assert.match(snapshot.safety_statement, /does not bill customers/i);
  assert.match(snapshot.safety_statement, /process payments/i);
  assert.match(snapshot.safety_statement, /enable automatic purchase/i);
  assert.match(snapshot.safety_statement, /execute actions/i);
});
