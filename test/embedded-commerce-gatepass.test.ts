import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

import {
  EMBEDDED_COMMERCE_GATEPASS_COMMAND,
  EMBEDDED_COMMERCE_SAFETY_FLAGS,
  evaluateEmbeddedCommerceGate,
  getEmbeddedCommerceScenarioRequest,
  runEmbeddedCommerceGatepassDemo,
  runEmbeddedCommerceGatepassScenario,
  summariseEmbeddedCommerceGatepassDemo,
  type CommerceGateCheckId,
  type CommerceGateEvaluation,
  type CommerceGateScenarioId,
  type EmbeddedCommerceGatepassReport,
} from "../src/embedded-commerce-gatepass.js";
import {
  runEmbeddedCommerceGatepassCli,
  type EmbeddedCommerceGatepassCliIo,
} from "../src/embedded-commerce-gatepass-cli.js";

const scenarioExpectations: Array<[CommerceGateScenarioId, CommerceGateCheckId]> = [
  ["unauthorised_substitution", "substitutions_policy_compliant"],
  ["wrong_product_variant", "product_variants_match"],
  ["excess_quantity", "quantities_within_limits"],
  ["item_price_exceeds_limit", "per_item_prices_within_limits"],
  ["final_total_exceeds_cap", "final_total_within_cap"],
  ["unexpected_delivery_fee", "fees_within_limits"],
  ["delivery_address_changed", "delivery_destination_matches"],
  ["merchant_changed", "merchant_authorised"],
  ["currency_changed", "currency_matches"],
  ["approval_expired", "approval_current"],
  ["human_approval_missing", "human_approval_present_when_required"],
  ["basket_changed_after_approval", "basket_unchanged_after_approval"],
  ["replayed_request", "nonce_not_replayed"],
  ["missing_evidence", "evidence_sufficient"],
];

function assertCommerceSafety(result: CommerceGateEvaluation | EmbeddedCommerceGatepassReport): void {
  assert.equal(result.localOnly, true);
  assert.equal(result.syntheticOnly, true);
  assert.equal(result.nonProduction, true);
  assert.equal(result.networkCalls, false);
  assert.equal(result.liveRetailerIntegration, false);
  assert.equal(result.liveAiProviderIntegration, false);
  assert.equal(result.checkoutCreated, false);
  assert.equal(result.paymentAuthorisation, false);
  assert.equal(result.settlementExecution, false);
  assert.equal(result.actionExecution, false);
  assert.equal(result.accountLogin, false);
  assert.equal(result.cardHandling, false);
  assert.equal(result.paymentCredentialHandling, false);
  assert.equal(result.a2aServer, false);
  assert.equal(result.mcpServer, false);
  assert.equal(result.productionSigning, false);
  assert.equal(result.productionGradeCrypto, false);
  assert.equal(result.realPersonalData, false);
}

test("valid embedded commerce basket issues a local commerce GatePass", () => {
  const result = runEmbeddedCommerceGatepassScenario("valid_basket_within_mandate");
  assertCommerceSafety(result);
  assert.equal(result.verdict, "allow");
  assert.equal(result.allowed, true);
  assert.equal(result.failedChecks.length, 0);
  assert.equal(result.checks.length, 20);
  assert.ok(result.checks.every((check) => check.passed));
  assert.ok(result.gatePass);
  assert.equal(result.gatePass.checkoutAuthority, "none_local_pre_checkout_demonstration_only");
  assert.equal(result.gatePass.signature.productionSigning, false);
  assert.equal(result.refusalReceipt, undefined);
});

test("invalid embedded commerce scenarios produce refusal receipts", () => {
  for (const [scenarioId, expectedFailedCheck] of scenarioExpectations) {
    const result = runEmbeddedCommerceGatepassScenario(scenarioId);
    assertCommerceSafety(result);
    assert.equal(result.verdict, "refuse", scenarioId);
    assert.equal(result.allowed, false, scenarioId);
    assert.ok(result.failedChecks.includes(expectedFailedCheck), scenarioId);
    assert.ok(result.refusalReasons.includes(`commerce_${expectedFailedCheck}_failed`), scenarioId);
    assert.ok(result.refusalReceipt, scenarioId);
    assert.equal(result.refusalReceipt.noCheckout, true);
    assert.equal(result.refusalReceipt.noPaymentAuthorisation, true);
    assert.equal(result.refusalReceipt.noSettlementExecution, true);
    assert.equal(result.gatePass, undefined);
  }
});

test("commerce report covers all deterministic scenarios and keeps reviewer kit first", () => {
  const report = runEmbeddedCommerceGatepassDemo();
  assertCommerceSafety(report);
  assert.equal(report.command, EMBEDDED_COMMERCE_GATEPASS_COMMAND);
  assert.equal(report.recommendedFirstExperience, "npm run demo:reviewer-kit");
  assert.equal(report.optionalSpecialistCommand, "npm run demo:commerce-gatepass");
  assert.equal(report.scenarioCount, 15);
  assert.equal(report.allowedCount, 1);
  assert.equal(report.refusedCount, 14);
  assert.equal(Object.keys(report.scenarios).length, 15);
  assert.ok(report.sampleGatePass.gatePassId.startsWith("commerce_gatepass_"));
  assert.ok(report.sampleRefusalReceipt.receiptId.startsWith("commerce_refusal_"));
  assert.match(report.designPartnerPrinciple, /design partner funds the real integration/i);
});

test("embedded commerce output is deterministic and summary omits scenario payloads", () => {
  const first = runEmbeddedCommerceGatepassDemo();
  const second = runEmbeddedCommerceGatepassDemo();
  assert.deepEqual(first, second);
  const summary = summariseEmbeddedCommerceGatepassDemo(first);
  assert.equal("scenarios" in summary, false);
  assert.equal("sampleGatePass" in summary, false);
  assert.equal(summary.scenarioCount, 15);
});

test("commerce CLI supports human output, summary-only, scenario selection, and JSON-only output", () => {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const io: EmbeddedCommerceGatepassCliIo = {
    stdout: (value) => stdout.push(value),
    stderr: (value) => stderr.push(value),
  };

  assert.equal(runEmbeddedCommerceGatepassCli([], io), 0);
  assert.equal(stderr.length, 0);
  assert.match(stdout[0] ?? "", /Embedded Commerce GatePass demonstrator/);
  assert.match(stdout[0] ?? "", /No verified basket\. No valid mandate\. No current approval\. No GatePass\. No checkout\./);

  stdout.length = 0;
  assert.equal(runEmbeddedCommerceGatepassCli(["--summary-only"], io), 0);
  assert.doesNotMatch(stdout[0] ?? "", /sample refusal:/);

  stdout.length = 0;
  assert.equal(runEmbeddedCommerceGatepassCli(["--scenario", "replayed_request"], io), 0);
  assert.match(stdout[0] ?? "", /verdict: refuse/);
  assert.match(stdout[0] ?? "", /nonce_not_replayed/);

  const compiled = spawnSync(process.execPath, [
    resolve("dist/src/embedded-commerce-gatepass-cli.js"),
    "--json",
  ], { encoding: "utf8" });
  assert.equal(compiled.status, 0, compiled.stderr);
  assert.equal(compiled.stderr, "");
  const parsed = JSON.parse(compiled.stdout) as EmbeddedCommerceGatepassReport;
  assertCommerceSafety(parsed);
  assert.equal(parsed.scenarioCount, 15);
});

test("local input mode evaluates a synthetic request and rejects private or live data fields", () => {
  const request = getEmbeddedCommerceScenarioRequest("valid_basket_within_mandate");
  assert.deepEqual(evaluateEmbeddedCommerceGate(request), runEmbeddedCommerceGatepassScenario("valid_basket_within_mandate"));
  const privateInput = join(mkdtempSync(join(tmpdir(), "atg-commerce-")), "private.json");
  writeFileSync(privateInput, JSON.stringify({
    schemaVersion: "atg.embedded-commerce-gatepass.local.v1",
    customer_email: "redacted",
  }));
  const stderr: string[] = [];
  assert.equal(runEmbeddedCommerceGatepassCli(
    ["--input", privateInput, "--json"],
    { stdout: () => undefined, stderr: (value) => stderr.push(value) },
  ), 1);
  assert.match(stderr[0] ?? "", /PRIVATE_OR_LIVE_DATA_REJECTED/);
});

test("machine-readable commerce examples and report remain aligned", () => {
  const report = JSON.parse(readFileSync("examples/embedded-commerce-gatepass-report.json", "utf8")) as EmbeddedCommerceGatepassReport;
  assert.deepEqual(report, runEmbeddedCommerceGatepassDemo());
  for (const path of Object.values(report.exampleFiles)) {
    assert.equal(existsSync(path), true, path);
    const example = JSON.parse(readFileSync(path, "utf8")) as {
      scenarioId: CommerceGateScenarioId;
      result: CommerceGateEvaluation;
    };
    assert.equal(example.result.scenarioId, example.scenarioId);
    assert.deepEqual(example.result, runEmbeddedCommerceGatepassScenario(example.scenarioId));
  }
});

test("embedded commerce fixtures and output contain no live commerce or payment claims", () => {
  const combined = [
    JSON.stringify(runEmbeddedCommerceGatepassDemo()),
    readFileSync("examples/embedded-commerce-gatepass-report.json", "utf8"),
  ].join("\n");
  assert.doesNotMatch(combined, /instacart|openai|anthropic|claude|chatgpt/i);
  assert.doesNotMatch(combined, /stripe|paypal|card_number|payment_token|checkout_url|api_key|access_token|password|secret/i);
  assert.doesNotMatch(combined, /production-ready|live retailer integration|live checkout|payment processor/i);
  assert.deepEqual(EMBEDDED_COMMERCE_SAFETY_FLAGS, {
    localOnly: true,
    syntheticOnly: true,
    nonProduction: true,
    networkCalls: false,
    liveRetailerIntegration: false,
    liveAiProviderIntegration: false,
    checkoutCreated: false,
    paymentAuthorisation: false,
    settlementExecution: false,
    actionExecution: false,
    accountLogin: false,
    cardHandling: false,
    paymentCredentialHandling: false,
    a2aServer: false,
    mcpServer: false,
    productionSigning: false,
    productionGradeCrypto: false,
    realPersonalData: false,
  });
});
