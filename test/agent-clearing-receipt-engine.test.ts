import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import {
  createAgentClearingReceipt,
  createAgentClearingReceiptId,
  filterAgentClearingReceiptNextSteps,
  filterAgentClearingReceiptReasonCodes,
  type AgentClearingReceiptInput,
} from "../src/index.js";

const docPath = resolve("docs/agent-clearing-receipt-engine.md");
const configPath = resolve("config/agent-clearing-receipt-engine-safety.json");
const inputPath = resolve("examples/agent-clearing-receipt-input-decision.json");
const outputPath = resolve("examples/agent-clearing-receipt-output-draft.json");
const rejectedPath = resolve("examples/agent-clearing-receipt-private-data-rejected.json");
const lowRiskPath = resolve("examples/agent-clearing-receipt-low-risk-local.json");
const priorTests = [
  resolve("test/agent-to-agent-trust-handshake.test.ts"),
  resolve("test/refusalgraph-core.test.ts"),
  resolve("test/agent-clearing-house-foundation.test.ts"),
  resolve("test/refusalgraph-signal-engine.test.ts"),
  resolve("test/refusalgraph-query-engine.test.ts"),
  resolve("test/agent-clearing-decision-engine.test.ts"),
];
const outputKeys = [
  "receipt_id", "receipt_type", "source_clearing_decision_id",
  "source_clearing_request_id", "decision", "action_allowed", "action_blocked",
  "approval_required", "evidence_required", "identity_verification_required",
  "payment_intent_clarification_required", "spend_limit_recommended",
  "refusalgraph_caution_level", "refusalgraph_matched_signal_count",
  "reason_codes", "required_next_steps", "verification_status", "receipt_status",
  "private_data_included", "network_lookup_performed", "external_lookup_performed",
  "payment_or_fee_triggered", "action_executed", "receipt_persisted",
  "settlement_triggered", "billing_triggered", "machine_to_machine_fee_triggered",
  "status", "created_at",
].sort();

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8")) as unknown;
}

function input(overrides: Partial<AgentClearingReceiptInput> = {}): AgentClearingReceiptInput {
  return {
    clearing_decision_id: "acd_local_test",
    clearing_request_id: "clearing_request_local_test",
    decision: "require_human_approval",
    action_allowed: false,
    action_blocked: true,
    approval_required: true,
    evidence_required: true,
    identity_verification_required: false,
    payment_intent_clarification_required: false,
    spend_limit_recommended: false,
    refusalgraph_caution_level: "medium",
    refusalgraph_matched_signal_count: 1,
    reason_codes: ["missing_human_approval", "missing_evidence", "draft_only_not_executed"],
    required_next_steps: ["require_human_approval", "require_more_evidence", "create_receipt_only", "draft_only_not_executed"],
    receipt_recommended: true,
    private_data_included: false,
    network_lookup_performed: false,
    external_lookup_performed: false,
    payment_or_fee_triggered: false,
    action_executed: false,
    status: "draft_only",
    created_at: "2026-06-29T15:00:00.000Z",
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

test("receipt engine files exist and all prior trust infrastructure tests remain present", () => {
  for (const path of [docPath, configPath, inputPath, outputPath, rejectedPath, lowRiskPath, ...priorTests]) {
    assert.equal(existsSync(path), true, path);
  }
});

test("tracked clearing decision creates the tracked local draft receipt", () => {
  const source = readJson(inputPath) as AgentClearingReceiptInput;
  const expected = readJson(outputPath);
  const receipt = createAgentClearingReceipt(source);

  assert.deepEqual(receipt, expected);
  assert.equal(receipt.decision, source.decision);
  assert.ok(receipt.source_clearing_decision_id.startsWith("clearing_decision_"));
  assert.ok(receipt.source_clearing_request_id.startsWith("clearing_request_"));
  assert.notEqual(receipt.source_clearing_decision_id, source.clearing_decision_id);
  assert.notEqual(receipt.source_clearing_request_id, source.clearing_request_id);
  assert.equal(receipt.verification_status, "not_verified_externally");
  assert.equal(receipt.receipt_status, "draft_only");
});

test("receipt ID helper is deterministic, local, and does not copy its source", () => {
  const source = "PRIVATE_SOURCE_DECISION_IDENTIFIER";
  const first = createAgentClearingReceiptId(source);
  assert.equal(first, createAgentClearingReceiptId(source));
  assert.match(first, /^acr_local_[a-f0-9]{24}$/);
  assert.doesNotMatch(first, new RegExp(source));
});

test("reason and next-step filters retain only safe codes", () => {
  const privateMarker = "PRIVATE_RAW_REASON_MUST_NOT_COPY";
  assert.deepEqual(filterAgentClearingReceiptReasonCodes([
    "missing_evidence", "missing_evidence", privateMarker,
  ]), ["missing_evidence", "unknown_or_unclear_intent"]);
  assert.deepEqual(filterAgentClearingReceiptNextSteps([
    "require_more_evidence", "require_more_evidence", privateMarker,
  ]), ["require_more_evidence", "draft_only_not_executed"]);
});

test("tracked low-risk receipt remains non-executing and non-commercial", () => {
  const source = readJson(resolve("examples/agent-clearing-decision-output-accept-with-limits.json")) as AgentClearingReceiptInput;
  const expected = readJson(lowRiskPath);
  const receipt = createAgentClearingReceipt(source);

  assert.deepEqual(receipt, expected);
  assert.equal(receipt.decision, "accept_with_limits");
  assert.equal(receipt.action_allowed, true);
  assert.equal(receipt.action_executed, false);
  assert.equal(receipt.payment_or_fee_triggered, false);
  assert.equal(receipt.receipt_persisted, false);
});

test("unsafe or non-local source metadata fails closed", () => {
  for (const unsafe of [
    input({ private_data_included: true }),
    input({ network_lookup_performed: true }),
    input({ external_lookup_performed: true }),
    input({ payment_or_fee_triggered: true }),
    input({ action_executed: true }),
    input({ status: "published" }),
  ]) {
    const receipt = createAgentClearingReceipt(unsafe);
    assert.equal(receipt.decision, "draft_only_not_executed");
    assert.equal(receipt.action_allowed, false);
    assert.equal(receipt.action_blocked, true);
    assert.ok(receipt.reason_codes.includes("unknown_or_unclear_intent"));
    assert.equal(receipt.private_data_included, false);
    assert.equal(receipt.network_lookup_performed, false);
    assert.equal(receipt.external_lookup_performed, false);
    assert.equal(receipt.payment_or_fee_triggered, false);
    assert.equal(receipt.action_executed, false);
  }
});

test("receipt output is strictly allowlisted and copies no private data", () => {
  const privateMarker = "PRIVATE_RECEIPT_VALUE_MUST_NOT_COPY";
  const source: AgentClearingReceiptInput = {
    ...input({
      clearing_decision_id: privateMarker,
      clearing_request_id: privateMarker,
      reason_codes: ["missing_evidence", privateMarker],
      required_next_steps: ["require_more_evidence", privateMarker],
    }),
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
  const receipt = createAgentClearingReceipt(source);

  assert.deepEqual(Object.keys(receipt).sort(), outputKeys);
  assert.doesNotMatch(JSON.stringify(receipt), new RegExp(privateMarker));
  assert.ok(receipt.reason_codes.includes("unknown_or_unclear_intent"));
  assert.ok(receipt.required_next_steps.includes("draft_only_not_executed"));
});

test("every receipt operational, commerce, persistence, and verification indicator stays safe", () => {
  const receipt = createAgentClearingReceipt(input());
  assert.equal(receipt.private_data_included, false);
  assert.equal(receipt.network_lookup_performed, false);
  assert.equal(receipt.external_lookup_performed, false);
  assert.equal(receipt.payment_or_fee_triggered, false);
  assert.equal(receipt.action_executed, false);
  assert.equal(receipt.receipt_persisted, false);
  assert.equal(receipt.settlement_triggered, false);
  assert.equal(receipt.billing_triggered, false);
  assert.equal(receipt.machine_to_machine_fee_triggered, false);
  assert.equal(receipt.verification_status, "not_verified_externally");
  assert.equal(receipt.status, "draft_only");
});

test("receipt engine safety config disables persistence, verification, network, commerce, and execution", () => {
  const config = readJson(configPath) as Record<string, unknown>;
  assert.equal(config.status, "draft_only");
  assert.equal(config.version, "0.1.0");
  for (const requirement of [
    "requires_human_approval", "requires_gareth_final_approval",
    "requires_technical_validation", "requires_security_review",
    "requires_privacy_review", "requires_legal_review",
    "requires_commercial_validation",
  ]) assert.equal(config[requirement], true, requirement);
  assertNoEnabledFlags(config);

  for (const flag of [
    "receipt_engine_enabled", "receipt_persistence_enabled",
    "receipt_external_verification_enabled", "clearing_network_enabled",
    "external_lookup_enabled", "public_api_enabled", "public_protocol_enabled",
    "agent_to_agent_lookup_enabled", "machine_to_machine_fee_enabled",
    "payment_enabled", "billing_enabled", "settlement_enabled", "tracking_enabled",
    "signup_enabled", "deployment_enabled", "publishing_enabled", "outreach_enabled",
    "webhook_enabled", "third_party_connections_enabled", "private_data_export_enabled",
    "action_execution_enabled", "automatic_purchase_enabled",
  ]) assert.equal(config[flag], false, flag);
});

test("receipt docs and examples contain no live endpoints, identities, credentials, wallets, or payment links", () => {
  const source = [docPath, configPath, inputPath, outputPath, rejectedPath, lowRiskPath]
    .map((path) => readFileSync(path, "utf8"))
    .join("\n");
  assert.match(source, /does not execute actions/i);
  assert.match(source, /does not perform network lookups/i);
  assert.match(source, /does not move money/i);
  assert.match(source, /All live, commercial, network, persistent, verification, exchange, or external use requires Gareth final approval/i);
  assert.doesNotMatch(source, /https?:\/\/|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|0x[a-fA-F0-9]{20,}/i);
  assert.doesNotMatch(source, /\bG-[A-Z0-9]{10}\b|\bUA-\d{4,}-\d+\b/);
});
