import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import {
  addRefusalGraphLocalSignal,
  addRefusalGraphLocalSignals,
  createRefusalGraphLocalSignalId,
  createRefusalGraphLocalSignalStore,
  findRefusalGraphLocalSignalById,
  listRefusalGraphLocalSignals,
  queryRefusalGraphLocalSignalStore,
  summariseRefusalGraphLocalSignalStore,
  type RefusalGraphLocalSignalInput,
  type RefusalGraphLocalSignalStore,
} from "../src/index.js";

const paths = {
  doc: resolve("docs/refusalgraph-local-signal-store.md"),
  config: resolve("config/refusalgraph-local-signal-store-safety.json"),
  store: resolve("examples/refusalgraph-local-signal-store-draft.json"),
  query: resolve("examples/refusalgraph-local-signal-store-query-result.json"),
  summary: resolve("examples/refusalgraph-local-signal-store-summary.json"),
  rejected: resolve("examples/refusalgraph-local-signal-store-private-data-rejected.json"),
  blocked: resolve("examples/refusalgraph-local-signal-store-live-network-blocked.json"),
};
const priorTests = [
  "agent-to-agent-trust-handshake", "refusalgraph-core", "agent-clearing-house-foundation",
  "refusalgraph-signal-engine", "refusalgraph-query-engine", "agent-clearing-decision-engine",
  "agent-clearing-receipt-engine", "unique-advantage-radar", "receipt-verification-readiness",
  "fee-metering-readiness", "agent-clearing-pipeline-demo", "agent-clearing-demo-cli",
  "agent-clearing-demo-report", "agent-clearing-public-demo-narrative",
  "agent-clearing-investor-partner-brief", "local-clearing-ledger",
].map((name) => resolve(`test/${name}.test.ts`));
const signalKeys = [
  "signal_id", "signal_type", "source_id", "related_request_id", "related_agent_id",
  "intent_category", "action_category", "refusal_reason", "caution_level",
  "approval_required", "action_allowed", "action_blocked", "evidence_level",
  "signal_status", "private_data_included", "network_lookup_performed",
  "external_lookup_performed", "tracking_triggered", "analytics_triggered",
  "payment_or_fee_triggered", "billing_triggered", "settlement_triggered",
  "action_executed", "status", "created_at",
].sort();

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8")) as unknown;
}

function fixtureInputs(): RefusalGraphLocalSignalInput[] {
  const created_at = "2026-06-30T13:00:00.000Z";
  return [
    { signal_type: "approval_required", source_id: "signal-payment-approval-001", related_request_id: "request-payment-001", related_agent_id: "agent-placeholder-001", intent_category: "payment", action_category: "initiate_payment", refusal_reason: "missing_human_approval", caution_level: "high", approval_required: true, action_allowed: false, action_blocked: true, evidence_level: "incomplete", signal_status: "draft_only", created_at },
    { signal_type: "refused_action", source_id: "signal-payment-identity-002", related_request_id: "request-payment-002", related_agent_id: "agent-placeholder-002", intent_category: "payment", action_category: "initiate_payment", refusal_reason: "weak_or_missing_identity", caution_level: "critical", approval_required: false, action_allowed: false, action_blocked: true, evidence_level: "missing", signal_status: "draft_only", created_at },
    { signal_type: "limited_request", source_id: "signal-publishing-evidence-003", related_request_id: "request-publishing-003", intent_category: "publishing", action_category: "publish_content", refusal_reason: "missing_evidence", caution_level: "medium", approval_required: true, action_allowed: false, action_blocked: true, evidence_level: "incomplete", signal_status: "draft_only", created_at },
    { signal_type: "receipt_verification_failed", source_id: "signal-verification-004", intent_category: "other", action_category: "other", refusal_reason: "receipt_verification_failed", caution_level: "high", approval_required: true, action_allowed: false, action_blocked: true, evidence_level: "hash_only", signal_status: "draft_only", created_at },
    { signal_type: "fee_readiness_blocked", source_id: "signal-fee-005", intent_category: "billing", action_category: "enable_billing", refusal_reason: "fee_readiness_blocked", caution_level: "medium", approval_required: true, action_allowed: false, action_blocked: true, evidence_level: "none", signal_status: "draft_only", created_at },
  ];
}

function fixtureStore(): RefusalGraphLocalSignalStore {
  return addRefusalGraphLocalSignals(createRefusalGraphLocalSignalStore(), fixtureInputs());
}

function assertNoEnabledFlags(value: unknown, path = "root"): void {
  if (Array.isArray(value)) return value.forEach((item, index) => assertNoEnabledFlags(item, `${path}[${index}]`));
  if (typeof value !== "object" || value === null) return;
  for (const [key, item] of Object.entries(value)) {
    if (key.endsWith("_enabled")) assert.equal(item, false, `${path}.${key}`);
    assertNoEnabledFlags(item, `${path}.${key}`);
  }
}

test("signal store files exist and all prior trust infrastructure tests remain present", () => {
  for (const path of [...Object.values(paths), ...priorTests]) assert.equal(existsSync(path), true, path);
});

test("createRefusalGraphLocalSignalStore creates an empty local draft store", () => {
  const store = createRefusalGraphLocalSignalStore();
  assert.equal(store.store_version, "atg.refusalgraph-local-signal-store.v1");
  assert.equal(store.local_only, true);
  assert.deepEqual(store.signals, []);
  assert.equal(store.status, "draft_only");
});

test("add, add-many, list, find, and duplicate handling are immutable", () => {
  const empty = createRefusalGraphLocalSignalStore();
  const added = addRefusalGraphLocalSignal(empty, fixtureInputs()[0] as RefusalGraphLocalSignalInput);
  const complete = addRefusalGraphLocalSignals(added, fixtureInputs().slice(1));
  assert.equal(empty.signals.length, 0);
  assert.equal(complete.signals.length, 5);
  const listed = listRefusalGraphLocalSignals(complete);
  assert.notEqual(listed[0], complete.signals[0]);
  assert.deepEqual(findRefusalGraphLocalSignalById(complete, listed[0]?.signal_id ?? "missing"), listed[0]);
  assert.equal(findRefusalGraphLocalSignalById(complete, "missing"), undefined);
  assert.equal(addRefusalGraphLocalSignal(complete, fixtureInputs()[0] as RefusalGraphLocalSignalInput), complete);
});

test("tracked store, query, and summary remain aligned with local logic", () => {
  const store = fixtureStore();
  const query = queryRefusalGraphLocalSignalStore(store, { query_id: "local-payment-query", intent_category: "payment", action_category: "initiate_payment", created_at: "2026-06-30T13:00:00.000Z" });
  assert.deepEqual(store, readJson(paths.store));
  assert.deepEqual(query, readJson(paths.query));
  assert.deepEqual(summariseRefusalGraphLocalSignalStore(store), readJson(paths.summary));
  assert.equal(query.matched_signal_count, 2);
  assert.equal(query.highest_caution_level, "critical");
  assert.deepEqual(query.refusal_reasons, ["missing_human_approval", "weak_or_missing_identity"]);
});

test("unknown categories fail closed and stored signals copy no private data", () => {
  const marker = "PRIVATE_SIGNAL_VALUE_MUST_NOT_COPY";
  const input = { signal_type: marker, source_id: marker, related_request_id: marker, related_agent_id: marker, intent_category: marker, action_category: marker, refusal_reason: marker, caution_level: marker, evidence_level: marker, signal_status: marker, created_at: "invalid", customer_name: marker, customer_email: marker, company_name: marker, bank_account: marker, card_number: marker, wallet_address: marker, api_key: marker, access_token: marker, private_document_text: marker, invoice_number: marker, contract_text: marker, real_agent_endpoint: marker, real_url: marker, real_email_content: marker };
  const signal = addRefusalGraphLocalSignal(createRefusalGraphLocalSignalStore(), input).signals[0];
  assert.ok(signal);
  assert.equal(signal.signal_type, "unknown_local_signal");
  assert.equal(signal.caution_level, "unknown");
  assert.equal(signal.intent_category, "other");
  assert.equal(signal.action_category, "other");
  assert.equal(signal.refusal_reason, "unknown_or_unclear_intent");
  assert.equal(signal.evidence_level, "unknown");
  assert.deepEqual(Object.keys(signal).sort(), signalKeys);
  assert.doesNotMatch(JSON.stringify(signal), new RegExp(marker));
  const id = createRefusalGraphLocalSignalId("refused_action", marker);
  assert.equal(id, createRefusalGraphLocalSignalId("refused_action", marker));
  assert.match(id, /^rg_local_signal_refused_action_[a-f0-9]{20}$/);
  assert.doesNotMatch(id, new RegExp(marker));
});

test("local queries match every allowlisted dimension and stay non-operational", () => {
  const store = fixtureStore();
  const cases: Array<[Record<string, unknown>, number]> = [
    [{ intent_category: "payment" }, 2], [{ action_category: "initiate_payment" }, 2],
    [{ signal_type: "limited_request" }, 1], [{ caution_level: "critical" }, 1],
    [{ approval_required: false }, 1], [{ action_blocked: true }, 5],
    [{ evidence_level: "incomplete" }, 2],
  ];
  for (const [query, count] of cases) assert.equal(queryRefusalGraphLocalSignalStore(store, query).matched_signal_count, count);
  const result = queryRefusalGraphLocalSignalStore(store, { intent_category: "payment" });
  assert.equal(result.total_signals_checked, 5);
  assert.equal(result.approval_required, true);
  assert.equal(result.action_blocked, true);
  assert.equal(result.private_data_included, false);
  for (const field of ["network_lookup_performed", "external_lookup_performed", "tracking_triggered", "analytics_triggered"] as const) assert.equal(result[field], false, field);
  assert.equal(result.status, "draft_only");
});

test("summary counts local intelligence while operational counts stay zero", () => {
  const summary = summariseRefusalGraphLocalSignalStore(fixtureStore());
  assert.equal(summary.total_signals, 5);
  assert.equal(summary.signal_type_counts.approval_required, 1);
  assert.equal(summary.signal_type_counts.refused_action, 1);
  assert.equal(summary.caution_level_counts.high, 2);
  assert.equal(summary.caution_level_counts.medium, 2);
  assert.equal(summary.caution_level_counts.critical, 1);
  assert.equal(summary.approval_required_count, 4);
  assert.equal(summary.action_blocked_count, 5);
  assert.equal(summary.high_caution_count, 2);
  assert.equal(summary.critical_caution_count, 1);
  assert.deepEqual(summary.evidence_level_counts, { hash_only: 1, incomplete: 2, missing: 1, none: 1 });
  assert.equal(summary.private_data_included, false);
  for (const field of ["network_lookup_count", "external_lookup_count", "tracking_triggered_count", "analytics_triggered_count", "action_executed_count"] as const) assert.equal(summary[field], 0, field);
});

test("signal store safety config disables storage, network, commerce, and execution", () => {
  const config = readJson(paths.config) as Record<string, unknown>;
  assert.equal(config.status, "draft_only");
  assert.equal(config.version, "0.1.0");
  assertNoEnabledFlags(config);
  assertNoEnabledFlags(readJson(paths.blocked));
  for (const requirement of ["requires_human_approval", "requires_gareth_final_approval", "requires_technical_validation", "requires_security_review", "requires_privacy_review", "requires_legal_review", "requires_commercial_validation"]) assert.equal(config[requirement], true, requirement);
});

test("signal store docs and examples contain no private or live identifiers", () => {
  const source = Object.values(paths).map((path) => readFileSync(path, "utf8")).join("\n");
  assert.match(source, /local in-memory draft only/i);
  assert.match(source, /does not write files/i);
  assert.match(source, /Gareth final approval/i);
  assert.doesNotMatch(source, /https?:\/\/|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|0x[a-fA-F0-9]{20,}/i);
  for (const marker of ["customer_name", "customer_email", "company_name", "bank_account", "card_number", "wallet_address", "api_key", "access_token", "private_document_text", "invoice_number", "contract_text", "real_agent_endpoint", "real_url", "real_email_content"]) {
    assert.doesNotMatch(JSON.stringify(readJson(paths.store)), new RegExp(marker));
    assert.doesNotMatch(JSON.stringify(readJson(paths.query)), new RegExp(marker));
    assert.doesNotMatch(JSON.stringify(readJson(paths.summary)), new RegExp(marker));
  }
});
