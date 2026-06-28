import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

import {
  createBillingPaymentReadinessReport,
  createGatewayServer,
  getGatewayEntitlementStatus,
  readLocalBillingPlansFile,
  type BillingPaymentReadinessReport,
  type GatewayRequestLogEntry,
} from "../src/index.js";

const cliPath = resolve("dist/src/cli.js");
const examplePath = resolve("examples/billing-payment/billing-plans.example.json");

test("billing payment readiness is versioned and all transaction capabilities remain disabled", () => {
  const report = createBillingPaymentReadinessReport({ now: new Date("2026-06-28T12:00:00.000Z") });
  assert.equal(report.billing_payment_readiness_version, "atg.billing-payment-readiness.v1");
  assert.equal(report.billing_enabled, false);
  assert.equal(report.payment_processing_enabled, false);
  assert.equal(report.automatic_purchase_enabled, false);
  assert.equal(report.real_charges_enabled, false);
  assert.equal(report.payment_provider_configured, false);
  assert.equal(report.pci_scope_assessed, false);
  assert.equal(report.overall.billing_payment_readiness_percent, 25);
  assert.ok(report.checks.some((check) => check.id === "machine_purchase_policy_readiness_available"));
});

test("plan, billing, payment, and machine purchase models are placeholders only", () => {
  const report = createBillingPaymentReadinessReport();
  assert.equal(report.plan_model.plan_catalogue_available, true);
  assert.equal(report.plan_model.plans_are_placeholders, true);
  assert.equal(report.plan_model.plans.every((plan) => plan.price === null), true);
  assert.equal(report.plan_model.plans.every((plan) => !plan.automatic_purchase_available), true);
  assert.equal(report.billing_model.billing_enabled, false);
  assert.equal(report.billing_model.real_invoice_generation_enabled, false);
  assert.equal(report.payment_model.card_collection_enabled, false);
  assert.equal(report.payment_model.machine_to_machine_payment_enabled, false);
  assert.equal(report.payment_model.payment_security_ready, false);
  assert.equal(report.machine_purchase_model.automatic_purchase_enabled, false);
  assert.equal(report.machine_purchase_model.purchase_endpoint_available, false);
});

test("payment prerequisites and controls remain explicit", () => {
  const report = createBillingPaymentReadinessReport();
  assert.match(report.required_before_payments.join("\n"), /payment provider selection/i);
  assert.match(report.required_before_payments.join("\n"), /PCI and payment security/i);
  assert.match(report.recommended_payment_controls.join("\n"), /manual approval before enabling automatic purchase/i);
});

test("safe billing plans example parses without real prices, details, or secrets", () => {
  assert.equal(existsSync(examplePath), true);
  const result = readLocalBillingPlansFile(examplePath);
  assert.equal(result.plan_count, 3);
  assert.equal(result.billing_mode, "not_enabled");
  assert.equal(result.plans.every((plan) => plan.price === null && !plan.payment_required), true);
  const source = readFileSync(examplePath, "utf8");
  assert.doesNotMatch(source, /card_number|cvv|bank_account|wallet_address|api[_-]?key|secret|password|sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}/i);
});

test("billing payment readiness CLI supports JSON, output, and plans file", () => {
  const json = spawnSync(process.execPath, [cliPath, "--billing-payment-readiness", "--json"], { cwd: process.cwd(), encoding: "utf8" });
  assert.equal(json.status, 0);
  assert.equal((JSON.parse(json.stdout) as BillingPaymentReadinessReport).billing_enabled, false);
  const configured = spawnSync(process.execPath, [cliPath, "--billing-payment-readiness", "--plans-file", examplePath, "--json"], { cwd: process.cwd(), encoding: "utf8" });
  assert.equal(configured.status, 0);
  assert.equal((JSON.parse(configured.stdout) as BillingPaymentReadinessReport).plan_model.source.plans_file_found, true);
  const directory = mkdtempSync(`${tmpdir()}\\atg-billing-cli-`);
  const outputPath = resolve(directory, "nested", "readiness.json");
  try {
    const output = spawnSync(process.execPath, [cliPath, "--billing-payment-readiness", "--output", outputPath], { cwd: process.cwd(), encoding: "utf8" });
    assert.equal(output.status, 0);
    assert.equal(existsSync(outputPath), true);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test("GET billing payment readiness is traced and logged", async () => {
  const directory = mkdtempSync(`${tmpdir()}\\atg-billing-http-`);
  const logPath = resolve(directory, "gateway.jsonl");
  const server = createGatewayServer({ gatewayLogPath: logPath });
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  const address = server.address() as AddressInfo;
  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/v1/billing-payment-readiness`);
    const body = await response.json() as BillingPaymentReadinessReport & { request_id: string };
    assert.equal(response.status, 200);
    assert.match(body.request_id, /^gw_[0-9a-f-]{36}$/);
    assert.equal(body.payment_processing_enabled, false);
  } finally {
    await new Promise<void>((done, reject) => server.close((error) => error ? reject(error) : done()));
    const entry = JSON.parse(readFileSync(logPath, "utf8").trim()) as GatewayRequestLogEntry;
    assert.equal(entry.endpoint, "/v1/billing-payment-readiness");
    rmSync(directory, { recursive: true, force: true });
  }
});

test("entitlement payment alignment remains backward compatible and disabled", () => {
  const entitlement = getGatewayEntitlementStatus();
  assert.equal(entitlement.plan_code, null);
  assert.equal(entitlement.payment_required, false);
  assert.equal(entitlement.billing_enabled, false);
  assert.equal(entitlement.payment_processing_enabled, false);
  assert.equal(entitlement.automatic_purchase_enabled, false);
});

test("billing readiness docs state all payment safety boundaries", () => {
  const directory = resolve("docs/billing-payment-readiness");
  const files = ["README.md", "plan-model.md", "payment-provider-requirements.md", "machine-to-machine-purchase-readiness.md", "billing-safety-boundaries.md"];
  const source = files.map((file) => readFileSync(resolve(directory, file), "utf8")).join("\n");
  assert.match(source, /no real billing|performs no real billing/i);
  assert.match(source, /no payment processor|no payment processing/i);
  assert.match(source, /collects no payment details|collect no payment details/i);
  assert.match(source, /Automatic purchase is disabled|enables no automatic purchase/i);
  assert.doesNotMatch(source, /sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}/);
});
