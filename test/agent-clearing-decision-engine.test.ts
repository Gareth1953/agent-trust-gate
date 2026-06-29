import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import {
  createAgentClearingDecision,
  deriveAgentClearingReasonCodes,
  type AgentClearingDecisionInput,
  type RefusalGraphQueryResult,
} from "../src/index.js";

const docPath = resolve("docs/agent-clearing-decision-engine.md");
const configPath = resolve("config/agent-clearing-decision-engine-safety.json");
const inputPath = resolve("examples/agent-clearing-decision-input-draft.json");
const blockedPath = resolve("examples/agent-clearing-decision-output-blocked.json");
const acceptedPath = resolve("examples/agent-clearing-decision-output-accept-with-limits.json");
const rejectedPath = resolve("examples/agent-clearing-decision-private-data-rejected.json");
const priorTests = [
  resolve("test/agent-to-agent-trust-handshake.test.ts"),
  resolve("test/refusalgraph-core.test.ts"),
  resolve("test/agent-clearing-house-foundation.test.ts"),
  resolve("test/refusalgraph-signal-engine.test.ts"),
  resolve("test/refusalgraph-query-engine.test.ts"),
];
const outputKeys = [
  "clearing_decision_id", "clearing_request_id", "decision", "action_allowed",
  "action_blocked", "approval_required", "evidence_required",
  "identity_verification_required", "payment_intent_clarification_required",
  "spend_limit_recommended", "refusalgraph_caution_level",
  "refusalgraph_matched_signal_count", "reason_codes", "required_next_steps",
  "receipt_recommended", "private_data_included", "network_lookup_performed",
  "external_lookup_performed", "payment_or_fee_triggered", "action_executed",
  "status", "created_at",
].sort();

function queryResult(overrides: Partial<RefusalGraphQueryResult> = {}): RefusalGraphQueryResult {
  return {
    query_id: "query_local_test",
    result_status: "no_matches",
    matched_signal_count: 0,
    caution_level: "none",
    common_refusal_reason_codes: [],
    recommended_decision: "allow_low_risk_only",
    recommended_next_steps: ["allow_low_risk_only"],
    private_data_included: false,
    network_lookup_performed: false,
    external_lookup_performed: false,
    payment_or_fee_triggered: false,
    status: "draft_only",
    ...overrides,
  };
}

function input(overrides: Partial<AgentClearingDecisionInput> = {}): AgentClearingDecisionInput {
  return {
    clearing_request_id: "local-clearing-test",
    requesting_agent_type: "request_agent_placeholder",
    receiving_agent_type: "receive_agent_placeholder",
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
    refusalgraph_query_result: queryResult(),
    requested_decision: "request_clearance",
    timestamp: "2026-06-29T14:05:00.000Z",
    ...overrides,
  };
}

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8")) as unknown;
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

test("decision engine files exist and all prior trust infrastructure tests remain present", () => {
  for (const path of [docPath, configPath, inputPath, blockedPath, acceptedPath, rejectedPath, ...priorTests]) {
    assert.equal(existsSync(path), true, path);
  }
});

test("tracked high-risk payment example requires human approval", () => {
  const source = readJson(inputPath) as AgentClearingDecisionInput;
  const expected = readJson(blockedPath);
  const result = createAgentClearingDecision(source);

  assert.deepEqual(result, expected);
  assert.equal(result.decision, "require_human_approval");
  assert.equal(result.action_blocked, true);
  assert.ok(result.reason_codes.includes("missing_human_approval"));
  assert.ok(result.reason_codes.includes("refusalgraph_high_caution"));
});

test("missing evidence, unclear identity, and unclear payment intent select safe decisions", () => {
  const evidence = createAgentClearingDecision(input({ evidence_status: "incomplete" }));
  assert.equal(evidence.decision, "require_more_evidence");
  assert.ok(evidence.reason_codes.includes("missing_evidence"));

  const identity = createAgentClearingDecision(input({ agent_identity_status: "unclear" }));
  assert.equal(identity.decision, "require_identity_verification");
  assert.ok(identity.reason_codes.includes("weak_or_missing_identity"));

  const payment = createAgentClearingDecision(input({
    requested_action_category: "payment",
    requested_action_type: "initiate_payment",
    approval_status: "approved",
    payment_intent_status: "unclear",
  }));
  assert.equal(payment.decision, "clarify_payment_intent");
  assert.ok(payment.reason_codes.includes("payment_intent_unclear"));
});

test("missing approval on high-impact input requires human approval", () => {
  const result = createAgentClearingDecision(input({
    risk_level: "high",
    impact_level: "high",
    approval_status: "not_requested",
  }));
  assert.equal(result.decision, "require_human_approval");
  assert.equal(result.approval_required, true);
  assert.ok(result.reason_codes.includes("missing_human_approval"));
  assert.ok(result.reason_codes.includes("high_risk_action"));
});

test("critical and high RefusalGraph caution fail closed", () => {
  const critical = createAgentClearingDecision(input({
    refusalgraph_query_result: queryResult({ caution_level: "critical", matched_signal_count: 3 }),
  }));
  assert.equal(critical.decision, "refuse_transaction");
  assert.ok(critical.reason_codes.includes("refusalgraph_critical_caution"));

  const high = createAgentClearingDecision(input({
    refusalgraph_query_result: queryResult({ caution_level: "high", matched_signal_count: 1 }),
  }));
  assert.equal(high.decision, "require_human_approval");
  assert.ok(high.reason_codes.includes("refusalgraph_high_caution"));
});

test("RefusalGraph reason codes drive clearing controls without raw text", () => {
  const result = createAgentClearingDecision(input({
    refusalgraph_query_result: queryResult({
      caution_level: "medium",
      matched_signal_count: 2,
      common_refusal_reason_codes: ["missing_evidence"],
    }),
  }));
  assert.equal(result.decision, "require_more_evidence");
  assert.ok(result.reason_codes.includes("missing_evidence"));
  assert.doesNotMatch(JSON.stringify(result), /raw reason/i);
});

test("money actions require approval unless clearly approved at acceptable risk", () => {
  const cases = [
    ["financial_action", "initiate_payment"],
    ["payment", "pay_for_task"],
    ["billing", "enable_billing"],
    ["settlement", "settle_transaction"],
    ["automatic_purchase", "automatic_purchase"],
  ] as const;
  for (const [category, actionType] of cases) {
    const blocked = createAgentClearingDecision(input({
      requested_action_category: category,
      requested_action_type: actionType,
      risk_level: "medium",
      impact_level: "medium",
      approval_status: "not_requested",
      payment_intent_status: "clear",
    }));
    assert.equal(blocked.decision, "require_human_approval", `${category}/${actionType}`);
    assert.ok(blocked.reason_codes.includes("money_movement_requested"));

    const approved = createAgentClearingDecision(input({
      requested_action_category: category,
      requested_action_type: actionType,
      risk_level: "medium",
      impact_level: "medium",
      approval_status: "approved",
      payment_intent_status: "clear",
    }));
    assert.equal(approved.decision, "accept_with_limits", `${category}/${actionType}`);
    assert.equal(approved.action_executed, false);
  }
});

test("external-impact actions require approval unless clearly approved at acceptable risk", () => {
  const cases = [
    ["deployment", "deploy_code"],
    ["publishing", "publish_content"],
    ["customer_communication", "email_customer"],
    ["signup", "enable_signup"],
    ["private_data_access", "access_private_data"],
    ["external_connection", "connect_external_system"],
  ] as const;
  for (const [category, actionType] of cases) {
    const blocked = createAgentClearingDecision(input({
      requested_action_category: category,
      requested_action_type: actionType,
      risk_level: "medium",
      impact_level: "medium",
      approval_status: "not_requested",
    }));
    assert.equal(blocked.decision, "require_human_approval", `${category}/${actionType}`);

    const approved = createAgentClearingDecision(input({
      requested_action_category: category,
      requested_action_type: actionType,
      risk_level: "medium",
      impact_level: "medium",
      approval_status: "approved",
    }));
    assert.equal(approved.decision, "accept_with_limits", `${category}/${actionType}`);
    assert.equal(approved.action_executed, false);
  }
});

test("low-risk complete verified input produces tracked accept-with-limits draft", () => {
  const expected = readJson(acceptedPath);
  const result = createAgentClearingDecision(input({
    clearing_request_id: "local-clearing-internal-placeholder",
  }));
  assert.deepEqual(result, expected);
  assert.equal(result.action_allowed, true);
  assert.equal(result.action_executed, false);
  assert.ok(result.required_next_steps.includes("create_receipt_only"));
  assert.ok(result.required_next_steps.includes("draft_only_not_executed"));
});

test("unknown intent and unsafe RefusalGraph metadata remain blocked", () => {
  const unknown = createAgentClearingDecision(input({
    requested_action_category: "unrecognised_private_category",
    requested_action_type: "unrecognised_private_action",
    risk_level: "unknown",
    impact_level: "unknown",
  }));
  assert.equal(unknown.decision, "keep_blocked");
  assert.ok(unknown.reason_codes.includes("unknown_or_unclear_intent"));

  const unsafeQuery = {
    ...queryResult(),
    network_lookup_performed: true,
  } as unknown as RefusalGraphQueryResult;
  const unsafe = createAgentClearingDecision(input({ refusalgraph_query_result: unsafeQuery }));
  assert.equal(unsafe.decision, "keep_blocked");
  assert.equal(unsafe.network_lookup_performed, false);
});

test("money reason codes are normalized by action kind", () => {
  const cases = [
    ["payment", "initiate_payment", "payment_requested"],
    ["billing", "enable_billing", "billing_requested"],
    ["settlement", "settle_transaction", "settlement_requested"],
    ["automatic_purchase", "automatic_purchase", "automatic_purchase_requested"],
  ] as const;
  for (const [category, actionType, expectedCode] of cases) {
    const codes = deriveAgentClearingReasonCodes(input({
      requested_action_category: category,
      requested_action_type: actionType,
      approval_status: "approved",
      payment_intent_status: "clear",
    }));
    assert.ok(codes.includes("money_movement_requested"));
    assert.ok(codes.includes(expectedCode));
  }
});

test("decision output is strictly allowlisted and copies no private data", () => {
  const privateMarker = "PRIVATE_CLEARING_VALUE_MUST_NOT_COPY";
  const source = {
    ...input({ clearing_request_id: privateMarker }),
    customer_name: privateMarker,
    customer_email: privateMarker,
    company_name: privateMarker,
    bank_account: privateMarker,
    card_number: privateMarker,
    wallet_address: privateMarker,
    api_key: privateMarker,
    access_token: privateMarker,
    private_document_text: privateMarker,
    real_agent_endpoint: privateMarker,
    refusalgraph_query_result: {
      ...queryResult(),
      customer_name: privateMarker,
      raw_reason: privateMarker,
    },
  } as AgentClearingDecisionInput;
  const result = createAgentClearingDecision(source);

  assert.deepEqual(Object.keys(result).sort(), outputKeys);
  assert.equal(result.clearing_request_id.startsWith("clearing_request_"), true);
  assert.equal(result.private_data_included, false);
  assert.equal(result.network_lookup_performed, false);
  assert.equal(result.external_lookup_performed, false);
  assert.equal(result.payment_or_fee_triggered, false);
  assert.equal(result.action_executed, false);
  assert.equal(result.status, "draft_only");
  assert.doesNotMatch(JSON.stringify(result), new RegExp(privateMarker));
});

test("decision engine safety config disables persistence, network, commerce, and execution", () => {
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
    "decision_engine_enabled", "decision_persistence_enabled", "clearing_network_enabled",
    "external_lookup_enabled", "public_api_enabled", "public_protocol_enabled",
    "agent_to_agent_lookup_enabled", "machine_to_machine_fee_enabled",
    "payment_enabled", "billing_enabled", "settlement_enabled", "tracking_enabled",
    "signup_enabled", "deployment_enabled", "publishing_enabled", "outreach_enabled",
    "webhook_enabled", "third_party_connections_enabled", "private_data_export_enabled",
    "action_execution_enabled", "automatic_purchase_enabled",
  ]) assert.equal(config[flag], false, flag);
});

test("decision docs and examples contain no live endpoints, identities, credentials, wallets, or payment links", () => {
  const source = [docPath, configPath, inputPath, blockedPath, acceptedPath, rejectedPath]
    .map((path) => readFileSync(path, "utf8"))
    .join("\n");
  assert.match(source, /does not execute actions/i);
  assert.match(source, /does not perform network lookups/i);
  assert.match(source, /does not move money/i);
  assert.match(source, /All live, commercial, network, persistent, or external use requires Gareth final approval/i);
  assert.doesNotMatch(source, /https?:\/\/|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|0x[a-fA-F0-9]{20,}/i);
  assert.doesNotMatch(source, /\bG-[A-Z0-9]{10}\b|\bUA-\d{4,}-\d+\b/);
});
