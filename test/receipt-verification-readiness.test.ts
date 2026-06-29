import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import {
  createReceiptVerificationId,
  verifyAgentClearingReceiptLocal,
  type ReceiptVerificationInput,
} from "../src/index.js";

const docPath = resolve("docs/receipt-verification-readiness.md");
const configPath = resolve("config/receipt-verification-readiness-safety.json");
const inputPath = resolve("examples/receipt-verification-input-draft.json");
const validPath = resolve("examples/receipt-verification-output-local-valid.json");
const unsafePath = resolve("examples/receipt-verification-output-unsafe-flags.json");
const rejectedPath = resolve("examples/receipt-verification-private-data-rejected.json");
const feePath = resolve("examples/receipt-verification-fee-placeholder.json");
const priorTests = [
  resolve("test/agent-to-agent-trust-handshake.test.ts"),
  resolve("test/refusalgraph-core.test.ts"),
  resolve("test/agent-clearing-house-foundation.test.ts"),
  resolve("test/refusalgraph-signal-engine.test.ts"),
  resolve("test/refusalgraph-query-engine.test.ts"),
  resolve("test/agent-clearing-decision-engine.test.ts"),
  resolve("test/agent-clearing-receipt-engine.test.ts"),
  resolve("test/unique-advantage-radar.test.ts"),
];
const outputKeys = [
  "verification_id", "source_receipt_id", "receipt_type", "verification_result",
  "verification_status", "receipt_status", "decision_linked", "safety_flags_valid",
  "private_data_absent", "action_not_executed", "network_not_used",
  "external_lookup_not_used", "payment_not_triggered", "billing_not_triggered",
  "settlement_not_triggered", "machine_to_machine_fee_not_triggered",
  "receipt_persistence_status", "reason_codes_valid", "next_steps_valid",
  "verification_reason_codes", "required_next_steps", "fee_readiness_status",
  "private_data_included", "network_lookup_performed", "external_lookup_performed",
  "payment_or_fee_triggered", "action_executed", "status", "created_at",
].sort();

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8")) as unknown;
}

function input(overrides: Partial<ReceiptVerificationInput> = {}): ReceiptVerificationInput {
  return {
    receipt_id: "acr_local_test_receipt",
    receipt_type: "agent_clearing_receipt",
    source_clearing_decision_id: "clearing_decision_local_test",
    source_clearing_request_id: "clearing_request_local_test",
    decision: "require_human_approval",
    action_allowed: false,
    action_blocked: true,
    approval_required: true,
    evidence_required: false,
    identity_verification_required: false,
    payment_intent_clarification_required: false,
    spend_limit_recommended: false,
    refusalgraph_caution_level: "medium",
    refusalgraph_matched_signal_count: 1,
    reason_codes: ["missing_human_approval", "draft_only_not_executed"],
    required_next_steps: ["require_human_approval", "create_receipt_only", "draft_only_not_executed"],
    verification_status: "not_verified_externally",
    receipt_status: "draft_only",
    private_data_included: false,
    network_lookup_performed: false,
    external_lookup_performed: false,
    payment_or_fee_triggered: false,
    action_executed: false,
    receipt_persisted: false,
    settlement_triggered: false,
    billing_triggered: false,
    machine_to_machine_fee_triggered: false,
    status: "draft_only",
    created_at: "2026-06-29T16:00:00.000Z",
    ...overrides,
  };
}

function assertNoEnabledFlags(value: unknown, path = "root"): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoEnabledFlags(item, `${path}[${index}]`));
    return;
  }
  if (typeof value !== "object" || value === null) return;
  for (const [key, item] of Object.entries(value)) {
    if (key.endsWith("_enabled")) assert.equal(item, false, `${path}.${key}`);
    assertNoEnabledFlags(item, `${path}.${key}`);
  }
}

test("verification readiness files exist and all prior trust infrastructure tests remain present", () => {
  for (const path of [docPath, configPath, inputPath, validPath, unsafePath, rejectedPath, feePath, ...priorTests]) {
    assert.equal(existsSync(path), true, path);
  }
});

test("tracked draft receipt produces the tracked locally valid result", () => {
  const source = readJson(inputPath) as ReceiptVerificationInput;
  const expected = readJson(validPath);
  const result = verifyAgentClearingReceiptLocal(source);

  assert.deepEqual(result, expected);
  assert.equal(result.verification_result, "locally_valid");
  assert.equal(result.verification_status, "local_draft_only");
  assert.equal(result.decision_linked, true);
  assert.equal(result.safety_flags_valid, true);
  assert.ok(result.verification_reason_codes.includes("receipt_locally_valid"));
});

test("verification ID helper is deterministic, local, and does not copy its source", () => {
  const source = "PRIVATE_RECEIPT_IDENTIFIER";
  const first = createReceiptVerificationId(source);
  assert.equal(first, createReceiptVerificationId(source));
  assert.match(first, /^acrv_local_[a-f0-9]{24}$/);
  assert.doesNotMatch(first, new RegExp(source));
});

test("missing receipt and source linkage fields are detected", () => {
  const missingReceipt = verifyAgentClearingReceiptLocal(input({ receipt_id: "" }));
  assert.equal(missingReceipt.verification_result, "missing_required_fields");
  assert.ok(missingReceipt.verification_reason_codes.includes("missing_receipt_id"));

  const missingDecision = verifyAgentClearingReceiptLocal(input({ source_clearing_decision_id: "" }));
  assert.equal(missingDecision.verification_result, "decision_link_missing");
  assert.ok(missingDecision.verification_reason_codes.includes("missing_source_decision_id"));

  const missingRequest = verifyAgentClearingReceiptLocal(input({ source_clearing_request_id: "" }));
  assert.equal(missingRequest.verification_result, "decision_link_missing");
  assert.ok(missingRequest.verification_reason_codes.includes("missing_source_request_id"));
});

test("tracked unsafe source flags are all detected without repeating the activity", () => {
  const source = readJson(inputPath) as ReceiptVerificationInput;
  const unsafeInput: ReceiptVerificationInput = {
    ...source,
    action_executed: true,
    network_lookup_performed: true,
    external_lookup_performed: true,
    payment_or_fee_triggered: true,
    billing_triggered: true,
    settlement_triggered: true,
    machine_to_machine_fee_triggered: true,
  };
  const expected = readJson(unsafePath);
  const result = verifyAgentClearingReceiptLocal(unsafeInput);

  assert.deepEqual(result, expected);
  assert.equal(result.verification_result, "unsafe_flags_detected");
  for (const code of [
    "unsafe_action_executed_flag", "unsafe_network_lookup_flag",
    "unsafe_external_lookup_flag", "unsafe_payment_fee_flag",
    "unsafe_billing_flag", "unsafe_settlement_flag", "unsafe_machine_fee_flag",
  ] as const) assert.ok(result.verification_reason_codes.includes(code), code);
  assert.equal(result.network_lookup_performed, false);
  assert.equal(result.external_lookup_performed, false);
  assert.equal(result.payment_or_fee_triggered, false);
  assert.equal(result.action_executed, false);
});

test("private-data indicator is detected while private fields remain absent", () => {
  const privateMarker = "PRIVATE_VERIFICATION_VALUE_MUST_NOT_COPY";
  const source: ReceiptVerificationInput = {
    ...input({ private_data_included: true }),
    customer_name: privateMarker,
    customer_email: privateMarker,
    company_name: privateMarker,
    bank_account: privateMarker,
    card_number: privateMarker,
    wallet_address: privateMarker,
    api_key: privateMarker,
    access_token: privateMarker,
    private_document_text: privateMarker,
    invoice_number: privateMarker,
    contract_text: privateMarker,
    real_agent_endpoint: privateMarker,
    real_url: privateMarker,
    real_email_content: privateMarker,
  };
  const result = verifyAgentClearingReceiptLocal(source);

  assert.equal(result.verification_result, "private_data_detected");
  assert.ok(result.verification_reason_codes.includes("private_data_flag_detected"));
  assert.equal(result.private_data_included, false);
  assert.doesNotMatch(JSON.stringify(result), new RegExp(privateMarker));
});

test("invalid receipt type, status, reason codes, and next steps fail local verification", () => {
  const result = verifyAgentClearingReceiptLocal(input({
    receipt_type: "unsafe_private_receipt_type",
    receipt_status: "published",
    status: "published",
    reason_codes: ["raw private reason"],
    required_next_steps: ["send raw receipt externally"],
  }));
  assert.equal(result.verification_result, "locally_invalid");
  assert.equal(result.receipt_type, "invalid_receipt_type");
  assert.equal(result.receipt_status, "invalid");
  assert.equal(result.reason_codes_valid, false);
  assert.equal(result.next_steps_valid, false);
  for (const code of [
    "invalid_receipt_type", "receipt_not_draft_or_local",
    "reason_codes_invalid", "next_steps_invalid",
  ] as const) assert.ok(result.verification_reason_codes.includes(code), code);
  assert.doesNotMatch(JSON.stringify(result), /raw private reason|send raw receipt externally/i);
});

test("output is strictly allowlisted and all local activity indicators remain false", () => {
  const result = verifyAgentClearingReceiptLocal(input());
  assert.deepEqual(Object.keys(result).sort(), outputKeys);
  assert.equal(result.private_data_included, false);
  assert.equal(result.network_lookup_performed, false);
  assert.equal(result.external_lookup_performed, false);
  assert.equal(result.payment_or_fee_triggered, false);
  assert.equal(result.action_executed, false);
  assert.equal(result.fee_readiness_status, "placeholder_only");
  assert.equal(result.status, "draft_only");
});

test("unexpected persistence and external verification state fail safety checks", () => {
  const persisted = verifyAgentClearingReceiptLocal(input({ receipt_persisted: true }));
  assert.equal(persisted.verification_result, "unsafe_flags_detected");
  assert.equal(persisted.receipt_persistence_status, "unexpected_persistence_detected");

  const externallyVerified = verifyAgentClearingReceiptLocal(input({ verification_status: "externally_verified" }));
  assert.equal(externallyVerified.verification_result, "unsafe_flags_detected");
  assert.equal(externallyVerified.safety_flags_valid, false);
  assert.ok(externallyVerified.verification_reason_codes.includes("external_verification_not_enabled"));
});

test("verification safety config and fee placeholder keep every activation surface disabled", () => {
  const config = readJson(configPath) as Record<string, unknown>;
  const fee = readJson(feePath) as Record<string, unknown>;
  assert.equal(config.status, "draft_only");
  assert.equal(config.version, "0.1.0");
  for (const requirement of [
    "requires_human_approval", "requires_gareth_final_approval",
    "requires_technical_validation", "requires_security_review",
    "requires_privacy_review", "requires_legal_review",
    "requires_commercial_validation",
  ]) assert.equal(config[requirement], true, requirement);
  assertNoEnabledFlags(config);
  assertNoEnabledFlags(fee);

  for (const flag of [
    "receipt_verification_readiness_enabled", "live_receipt_verification_enabled",
    "external_receipt_verification_enabled", "receipt_network_enabled",
    "public_api_enabled", "public_protocol_enabled", "agent_to_agent_verification_enabled",
    "machine_to_machine_fee_enabled", "payment_enabled", "billing_enabled",
    "settlement_enabled", "tracking_enabled", "analytics_enabled", "signup_enabled",
    "deployment_enabled", "publishing_enabled", "outreach_enabled", "webhook_enabled",
    "third_party_connections_enabled", "live_customer_data_enabled",
    "private_data_export_enabled", "action_execution_enabled", "automatic_purchase_enabled",
  ]) assert.equal(config[flag], false, flag);
  assert.equal(fee.commercial_status, "placeholder_only");
  assert.equal(fee.payment_or_fee_triggered, false);
  assert.equal(fee.action_executed, false);
});

test("verification docs and examples contain no live endpoints, credentials, wallets, or payment links", () => {
  const source = [docPath, configPath, inputPath, validPath, unsafePath, rejectedPath, feePath]
    .map((path) => readFileSync(path, "utf8"))
    .join("\n");
  assert.match(source, /Verification readiness does not mean live verification/i);
  assert.match(source, /does not verify receipts across a network/i);
  assert.match(source, /does not charge fees/i);
  assert.match(source, /does not move money/i);
  assert.match(source, /does not execute actions/i);
  assert.match(source, /All live, commercial, network, payment, persistent, verification, exchange, or external use requires Gareth final approval/i);
  assert.doesNotMatch(source, /https?:\/\/|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|0x[a-fA-F0-9]{20,}/i);
  assert.doesNotMatch(source, /\bG-[A-Z0-9]{10}\b|\bUA-\d{4,}-\d+\b/);
});
