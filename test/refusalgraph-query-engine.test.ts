import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import {
  aggregateRefusalReasonCodes,
  queryRefusalGraphSignals,
  type LocalRefusalGraphSignal,
  type RefusalGraphQuery,
} from "../src/index.js";

const docPath = resolve("docs/refusalgraph-local-query-engine.md");
const configPath = resolve("config/refusalgraph-query-engine-safety.json");
const queryPath = resolve("examples/refusalgraph-query-input-draft.json");
const signalsPath = resolve("examples/refusalgraph-query-local-signals.json");
const outputPath = resolve("examples/refusalgraph-query-output-caution.json");
const noMatchPath = resolve("examples/refusalgraph-query-no-match.json");
const priorTests = [
  resolve("test/agent-to-agent-trust-handshake.test.ts"),
  resolve("test/refusalgraph-core.test.ts"),
  resolve("test/agent-clearing-house-foundation.test.ts"),
  resolve("test/refusalgraph-signal-engine.test.ts"),
];
const outputKeys = [
  "query_id", "result_status", "matched_signal_count", "caution_level",
  "common_refusal_reason_codes", "recommended_decision",
  "recommended_next_steps", "private_data_included",
  "network_lookup_performed", "external_lookup_performed",
  "payment_or_fee_triggered", "status",
].sort();

function query(overrides: Partial<RefusalGraphQuery> = {}): RefusalGraphQuery {
  return {
    query_id: "local-query-test",
    requested_action_category: "financial_action",
    requested_action_type: "initiate_payment",
    risk_level: "medium",
    impact_level: "medium",
    evidence_status: "sufficient",
    approval_status: "approved",
    agent_identity_status: "verified_locally",
    payment_intent_status: "clear",
    ...overrides,
  };
}

function signal(overrides: Partial<LocalRefusalGraphSignal> = {}): LocalRefusalGraphSignal {
  return {
    signal_id: "rgs_local_test",
    action_category: "financial_action",
    proposed_action_type: "initiate_payment",
    refusal_type: "blocked",
    refusal_reason_codes: ["money_movement_requested"],
    risk_level: "medium",
    impact_level: "medium",
    evidence_status: "sufficient",
    approval_status: "requested",
    recommended_next_step: "keep_blocked",
    status: "draft_only",
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

test("query engine files exist and all prior trust infrastructure tests remain present", () => {
  for (const path of [docPath, configPath, queryPath, signalsPath, outputPath, noMatchPath, ...priorTests]) {
    assert.equal(existsSync(path), true, path);
  }
});

test("matching local signals produce the tracked high-caution result", () => {
  const input = readJson(queryPath) as RefusalGraphQuery;
  const signals = readJson(signalsPath) as LocalRefusalGraphSignal[];
  const expected = readJson(outputPath);
  const result = queryRefusalGraphSignals(input, signals);

  assert.deepEqual(result, expected);
  assert.equal(result.matched_signal_count, 2);
  assert.equal(result.caution_level, "high");
  assert.equal(result.recommended_decision, "require_human_approval");
});

test("no local match produces a safe no-match result", () => {
  const signals = readJson(signalsPath) as LocalRefusalGraphSignal[];
  const expected = readJson(noMatchPath);
  const result = queryRefusalGraphSignals(query({
    query_id: "local-query-low-risk-placeholder",
    requested_action_category: "deployment",
    requested_action_type: "deploy_code",
    risk_level: "low",
    impact_level: "low",
  }), signals);

  assert.deepEqual(result, expected);
  assert.deepEqual(result.common_refusal_reason_codes, []);
  assert.equal(result.recommended_decision, "allow_low_risk_only");
});

test("reason aggregation deduplicates within signals and ranks by frequency", () => {
  const aggregated = aggregateRefusalReasonCodes([
    signal({ refusal_reason_codes: ["missing_evidence", "missing_evidence", "policy_blocked"] }),
    signal({ signal_id: "rgs_local_2", refusal_reason_codes: ["missing_evidence", "missing_human_approval", "unsafe_raw_reason"] }),
  ]);

  assert.deepEqual(aggregated, ["missing_evidence", "missing_human_approval", "policy_blocked"]);
});

test("control-gap patterns select their required safe recommendations", () => {
  const cases = [
    ["missing_human_approval", "require_human_approval"],
    ["missing_evidence", "require_more_evidence"],
    ["weak_or_missing_identity", "require_identity_verification"],
    ["payment_intent_unclear", "clarify_payment_intent"],
  ] as const;

  for (const [reasonCode, expectedDecision] of cases) {
    const result = queryRefusalGraphSignals(query(), [signal({ refusal_reason_codes: [reasonCode] })]);
    assert.equal(result.recommended_decision, expectedDecision, reasonCode);
  }
});

test("high-risk money patterns require approval and repeated high-risk matches refuse", () => {
  const highRiskSignal = signal({
    refusal_type: "high_risk_action",
    refusal_reason_codes: ["high_risk_action", "money_movement_requested"],
    risk_level: "high",
    recommended_next_step: "require_human_approval",
  });
  const single = queryRefusalGraphSignals(query({ risk_level: "high" }), [highRiskSignal]);
  assert.equal(single.caution_level, "high");
  assert.equal(single.recommended_decision, "require_human_approval");

  const many = [0, 1, 2].map((index) => ({ ...highRiskSignal, signal_id: `rgs_high_${index}` }));
  const repeated = queryRefusalGraphSignals(query({ risk_level: "high" }), many);
  assert.equal(repeated.caution_level, "critical");
  assert.equal(repeated.recommended_decision, "refuse_transaction");
});

test("query result is strictly allowlisted and does not copy private input", () => {
  const privateMarker = "PRIVATE_QUERY_VALUE_MUST_NOT_COPY";
  const result = queryRefusalGraphSignals({
    ...query({ query_id: privateMarker }),
    customer_name: privateMarker,
    customer_email: privateMarker,
    bank_account: privateMarker,
    api_key: privateMarker,
  }, [{
    ...signal(),
    customer_name: privateMarker,
    private_document_text: privateMarker,
    real_agent_endpoint: privateMarker,
  }]);

  assert.deepEqual(Object.keys(result).sort(), outputKeys);
  assert.equal(result.query_id.startsWith("query_"), true);
  assert.equal(result.private_data_included, false);
  assert.equal(result.network_lookup_performed, false);
  assert.equal(result.external_lookup_performed, false);
  assert.equal(result.payment_or_fee_triggered, false);
  assert.equal(result.status, "draft_only");
  assert.doesNotMatch(JSON.stringify(result), new RegExp(privateMarker));
});

test("non-local signals and action-type mismatches cannot match", () => {
  const result = queryRefusalGraphSignals(query(), [
    signal({ status: "published" }),
    signal({ signal_id: "rgs_wrong_type", proposed_action_type: "buy_service" }),
  ]);
  assert.equal(result.matched_signal_count, 0);
  assert.equal(result.result_status, "no_matches");
});

test("query engine safety config disables persistence, network, commerce, and execution", () => {
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
    "query_engine_enabled", "query_persistence_enabled", "network_enabled",
    "external_lookup_enabled", "public_api_enabled", "agent_to_agent_lookup_enabled",
    "machine_to_machine_fee_enabled", "payment_enabled", "billing_enabled",
    "settlement_enabled", "tracking_enabled", "signup_enabled", "deployment_enabled",
    "publishing_enabled", "outreach_enabled", "webhook_enabled",
    "third_party_connections_enabled", "private_data_export_enabled",
    "action_execution_enabled", "automatic_purchase_enabled",
  ]) assert.equal(config[flag], false, flag);
});

test("query docs and examples contain no live endpoints, identities, credentials, wallets, or payment links", () => {
  const source = [docPath, configPath, queryPath, signalsPath, outputPath, noMatchPath]
    .map((path) => readFileSync(path, "utf8"))
    .join("\n");
  assert.match(source, /does not execute actions/i);
  assert.match(source, /does not perform network lookups/i);
  assert.match(source, /does not expose private data/i);
  assert.match(source, /All live, commercial, network, persistent, or external use requires Gareth final approval/i);
  assert.doesNotMatch(source, /https?:\/\/|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|0x[a-fA-F0-9]{20,}/i);
  assert.doesNotMatch(source, /\bG-[A-Z0-9]{10}\b|\bUA-\d{4,}-\d+\b/);
});
