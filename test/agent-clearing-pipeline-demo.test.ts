import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import {
  createAgentClearingPipelineId,
  runAgentClearingPipelineDemo,
  type AgentClearingPipelineDemoInput,
} from "../src/index.js";

const docPath = resolve("docs/agent-clearing-pipeline-demo.md");
const configPath = resolve("config/agent-clearing-pipeline-demo-safety.json");
const inputPath = resolve("examples/agent-clearing-pipeline-input-draft.json");
const blockedPath = resolve("examples/agent-clearing-pipeline-output-blocked.json");
const lowRiskPath = resolve("examples/agent-clearing-pipeline-output-low-risk.json");
const rejectedPath = resolve("examples/agent-clearing-pipeline-private-data-rejected.json");
const activationPath = resolve("examples/agent-clearing-pipeline-live-activation-blocked.json");
const priorTests = [
  resolve("test/agent-to-agent-trust-handshake.test.ts"),
  resolve("test/refusalgraph-core.test.ts"),
  resolve("test/agent-clearing-house-foundation.test.ts"),
  resolve("test/refusalgraph-signal-engine.test.ts"),
  resolve("test/refusalgraph-query-engine.test.ts"),
  resolve("test/agent-clearing-decision-engine.test.ts"),
  resolve("test/agent-clearing-receipt-engine.test.ts"),
  resolve("test/unique-advantage-radar.test.ts"),
  resolve("test/receipt-verification-readiness.test.ts"),
  resolve("test/fee-metering-readiness.test.ts"),
];
const outputKeys = [
  "pipeline_id", "pipeline_status", "refusalgraph_query_result",
  "clearing_decision", "clearing_receipt", "receipt_verification_result",
  "fee_metering_event", "action_executed", "network_lookup_performed",
  "external_lookup_performed", "payment_or_fee_triggered", "billing_triggered",
  "settlement_triggered", "machine_to_machine_fee_triggered", "tracking_triggered",
  "analytics_triggered", "private_data_included", "status", "created_at",
].sort();

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8")) as unknown;
}

function lowRiskInput(overrides: Partial<AgentClearingPipelineDemoInput> = {}): AgentClearingPipelineDemoInput {
  return {
    pipeline_id: "local-low-risk-pipeline-placeholder",
    clearing_request: {
      clearing_request_id: "local-low-risk-pipeline-request",
      requesting_agent_type: "internal_agent_placeholder",
      receiving_agent_type: "review_agent_placeholder",
      requested_action_category: "internal_action",
      requested_action_type: "internal_review",
      proposed_value: null,
      proposed_fee: null,
      risk_level: "low",
      impact_level: "low",
      evidence_status: "complete",
      approval_status: "not_required",
      agent_identity_status: "verified_locally",
      payment_intent_status: "not_applicable",
      requested_decision: "request_clearance",
      timestamp: "2026-06-29T18:05:00.000Z",
    },
    local_refusal_signals: [],
    fee_metering_requested: false,
    timestamp: "2026-06-29T18:05:00.000Z",
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

function assertOperationalFlagsFalse(value: Record<string, unknown>): void {
  for (const field of [
    "action_executed", "network_lookup_performed", "external_lookup_performed",
    "payment_or_fee_triggered", "billing_triggered", "settlement_triggered",
    "machine_to_machine_fee_triggered", "tracking_triggered", "analytics_triggered",
    "private_data_included",
  ]) {
    if (Object.hasOwn(value, field)) assert.equal(value[field], false, field);
  }
}

test("pipeline demo files exist and all prior trust infrastructure tests remain present", () => {
  for (const path of [docPath, configPath, inputPath, blockedPath, lowRiskPath, rejectedPath, activationPath, ...priorTests]) {
    assert.equal(existsSync(path), true, path);
  }
});

test("tracked high-caution input produces the tracked blocked local pipeline", () => {
  const source = readJson(inputPath) as AgentClearingPipelineDemoInput;
  const expected = readJson(blockedPath);
  const result = runAgentClearingPipelineDemo(source);
  assert.deepEqual(result, expected);
  assert.equal(result.refusalgraph_query_result.caution_level, "high");
  assert.equal(result.refusalgraph_query_result.matched_signal_count, 2);
  assert.equal(result.clearing_decision.decision, "require_human_approval");
  assert.equal(result.clearing_decision.action_blocked, true);
  assert.equal(result.clearing_receipt.receipt_type, "agent_clearing_receipt");
  assert.equal(result.receipt_verification_result.verification_result, "locally_valid");
  assert.equal(result.fee_metering_event.fee_readiness_status, "placeholder_only");
  assert.equal(result.fee_metering_event.billable_event_recorded, false);
});

test("low-risk complete input composes every stage without executing", () => {
  const result = runAgentClearingPipelineDemo(lowRiskInput());
  assert.deepEqual(result, readJson(lowRiskPath));
  assert.equal(result.refusalgraph_query_result.result_status, "no_matches");
  assert.equal(result.clearing_decision.decision, "accept_with_limits");
  assert.equal(result.clearing_receipt.decision, "accept_with_limits");
  assert.equal(result.receipt_verification_result.verification_result, "locally_valid");
  assert.equal(result.fee_metering_event.fee_readiness_status, "not_enabled");
  assert.equal(result.fee_metering_event.possible_fee_model, "not_configured");
  assert.equal(result.action_executed, false);
});

test("pipeline output is strictly allowlisted and every operational flag remains false", () => {
  const result = runAgentClearingPipelineDemo(lowRiskInput({ fee_metering_requested: true }));
  assert.deepEqual(Object.keys(result).sort(), outputKeys);
  assertOperationalFlagsFalse(result as unknown as Record<string, unknown>);
  assertOperationalFlagsFalse(result.refusalgraph_query_result as unknown as Record<string, unknown>);
  assertOperationalFlagsFalse(result.clearing_decision as unknown as Record<string, unknown>);
  assertOperationalFlagsFalse(result.clearing_receipt as unknown as Record<string, unknown>);
  assertOperationalFlagsFalse(result.receipt_verification_result as unknown as Record<string, unknown>);
  assertOperationalFlagsFalse(result.fee_metering_event as unknown as Record<string, unknown>);
  assert.equal(result.fee_metering_event.billable_event_recorded, false);
  assert.equal(result.fee_metering_event.payment_triggered, false);
  assert.equal(result.fee_metering_event.external_metering_triggered, false);
  assert.equal(result.pipeline_status, "draft_only_completed");
  assert.equal(result.status, "draft_only");
});

test("pipeline ID is deterministic, local, and copies no private source value", () => {
  const marker = "PRIVATE_PIPELINE_ID_MUST_NOT_COPY";
  const first = createAgentClearingPipelineId(marker);
  assert.equal(first, createAgentClearingPipelineId(marker));
  assert.match(first, /^acp_local_[a-f0-9]{24}$/);
  assert.doesNotMatch(first, new RegExp(marker));
});

test("private input fields are absent from the pipeline and every nested result", () => {
  const marker = "PRIVATE_PIPELINE_VALUE_MUST_NOT_COPY";
  const source = lowRiskInput({
    pipeline_id: marker,
    clearing_request: {
      ...lowRiskInput().clearing_request,
      clearing_request_id: marker,
      requesting_agent_type: marker,
      receiving_agent_type: marker,
      customer_name: marker,
      customer_email: marker,
      company_name: marker,
      bank_account: marker,
      card_number: marker,
      wallet_address: marker,
      api_key: marker,
      access_token: marker,
      private_document_text: marker,
      invoice_number: marker,
      contract_text: marker,
      real_agent_endpoint: marker,
      real_url: marker,
      real_email_content: marker,
    },
    local_refusal_signals: [{
      signal_id: marker,
      action_category: "other",
      proposed_action_type: "other",
      refusal_type: "blocked",
      refusal_reason_codes: ["policy_blocked"],
      risk_level: "low",
      impact_level: "low",
      evidence_status: "complete",
      approval_status: "not_required",
      recommended_next_step: "keep_blocked",
      status: "draft_only",
      customer_email: marker,
      private_document_text: marker,
    }],
  });
  const result = runAgentClearingPipelineDemo(source);
  assert.doesNotMatch(JSON.stringify(result), new RegExp(marker));
  assert.equal(result.private_data_included, false);
  assert.equal(result.refusalgraph_query_result.private_data_included, false);
  assert.equal(result.clearing_decision.private_data_included, false);
  assert.equal(result.clearing_receipt.private_data_included, false);
  assert.equal(result.receipt_verification_result.private_data_included, false);
  assert.equal(result.fee_metering_event.private_data_included, false);
});

test("pipeline safety config disables every activation surface and requires all reviews", () => {
  const config = readJson(configPath) as Record<string, unknown>;
  const blocked = readJson(activationPath) as Record<string, unknown>;
  assert.equal(config.status, "draft_only");
  assert.equal(config.version, "0.1.0");
  assertNoEnabledFlags(config);
  assertNoEnabledFlags(blocked);
  for (const requirement of [
    "requires_human_approval", "requires_gareth_final_approval",
    "requires_technical_validation", "requires_security_review",
    "requires_privacy_review", "requires_legal_review",
    "requires_commercial_validation",
  ]) assert.equal(config[requirement], true, requirement);

  for (const flag of [
    "pipeline_demo_enabled", "live_pipeline_enabled", "clearing_network_enabled",
    "external_lookup_enabled", "public_api_enabled", "public_protocol_enabled",
    "agent_to_agent_pipeline_enabled", "receipt_network_enabled",
    "live_receipt_verification_enabled", "external_receipt_verification_enabled",
    "live_fee_metering_enabled", "billable_events_enabled", "billing_enabled",
    "payment_enabled", "settlement_enabled", "machine_to_machine_fee_enabled",
    "external_metering_enabled", "tracking_enabled", "analytics_enabled",
    "deployment_enabled", "publishing_enabled", "signup_enabled", "outreach_enabled",
    "webhook_enabled", "third_party_connections_enabled", "live_customer_data_enabled",
    "private_data_export_enabled", "action_execution_enabled", "automatic_purchase_enabled",
  ]) assert.equal(config[flag], false, flag);
});

test("pipeline docs and examples state the local-only non-operational boundary", () => {
  const source = [docPath, configPath, inputPath, blockedPath, lowRiskPath, rejectedPath, activationPath]
    .map((path) => readFileSync(path, "utf8"))
    .join("\n");
  assert.match(source, /pipeline demo does not execute actions/i);
  assert.match(source, /pipeline demo does not perform network lookups/i);
  assert.match(source, /pipeline demo does not move money/i);
  assert.match(source, /does not trigger payment, billing, settlement, signup, tracking, analytics, deployment, publishing, outreach, webhooks, or third-party connections/i);
  assert.match(source, /All live, commercial, network, payment, verification, metering, billing, or settlement use requires Gareth final approval/i);
  assert.doesNotMatch(source, /https?:\/\/|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|0x[a-fA-F0-9]{20,}/i);
  assert.doesNotMatch(source, /\bG-[A-Z0-9]{10}\b|\bUA-\d{4,}-\d+\b/);
});
