import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import {
  addFeeMeteringLedgerEvent,
  addFeeMeteringLedgerEvents,
  createFeeMeteringLedger,
  createFeeMeteringLedgerEvent,
  createFeeMeteringLedgerEventId,
  findFeeMeteringLedgerEventById,
  listFeeMeteringLedgerEvents,
  summariseFeeMeteringLedger,
  type FeeMeteringLedger,
  type FeeMeteringLedgerEvent,
  type FeeMeteringLedgerEventInput,
} from "../src/index.js";

const paths = {
  doc: resolve("docs/fee-metering-ledger.md"),
  config: resolve("config/fee-metering-ledger-safety.json"),
  events: resolve("examples/fee-metering-ledger-events-draft.json"),
  summary: resolve("examples/fee-metering-ledger-summary.json"),
  billable: resolve("examples/fee-metering-ledger-billable-if-live.json"),
  rejected: resolve("examples/fee-metering-ledger-private-data-rejected.json"),
  blocked: resolve("examples/fee-metering-ledger-live-billing-blocked.json"),
};
const priorTests = [
  "agent-to-agent-trust-handshake", "refusalgraph-core", "agent-clearing-house-foundation",
  "refusalgraph-signal-engine", "refusalgraph-query-engine", "agent-clearing-decision-engine",
  "agent-clearing-receipt-engine", "unique-advantage-radar", "receipt-verification-readiness",
  "fee-metering-readiness", "agent-clearing-pipeline-demo", "agent-clearing-demo-cli",
  "agent-clearing-demo-report", "agent-clearing-public-demo-narrative",
  "agent-clearing-investor-partner-brief", "local-clearing-ledger",
  "refusalgraph-local-signal-store", "batch-agent-clearing-runner",
  "receipt-verification-cli",
].map((name) => resolve(`test/${name}.test.ts`));
const eventKeys = [
  "event_id", "event_type", "source_id", "source_type", "pipeline_id",
  "clearing_request_id", "clearing_decision_id", "clearing_receipt_id",
  "verification_id", "batch_id", "refusalgraph_query_id", "placeholder_fee_category",
  "placeholder_fee_status", "billable_if_live", "billing_enabled", "payment_enabled",
  "settlement_enabled", "machine_to_machine_fee_enabled", "currency", "amount",
  "amount_minor_units", "fee_reason", "approval_required", "action_allowed",
  "action_blocked", "payment_or_fee_triggered", "billing_triggered",
  "settlement_triggered", "tracking_triggered", "analytics_triggered",
  "network_lookup_performed", "external_lookup_performed", "action_executed",
  "private_data_included", "status", "created_at",
].sort();

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8")) as unknown;
}

function trackedLedger(): FeeMeteringLedger {
  return readJson(paths.events) as FeeMeteringLedger;
}

function rebuiltLedger(): FeeMeteringLedger {
  return addFeeMeteringLedgerEvents(createFeeMeteringLedger(), trackedLedger().events);
}

function assertNoEnabledFlags(value: unknown, path = "root"): void {
  if (Array.isArray(value)) return value.forEach((item, index) => assertNoEnabledFlags(item, `${path}[${index}]`));
  if (typeof value !== "object" || value === null) return;
  for (const [key, item] of Object.entries(value)) {
    if (key.endsWith("_enabled")) assert.equal(item, false, `${path}.${key}`);
    assertNoEnabledFlags(item, `${path}.${key}`);
  }
}

test("fee metering ledger files exist and all prior infrastructure tests remain present", () => {
  for (const path of [...Object.values(paths), ...priorTests]) assert.equal(existsSync(path), true, path);
});

test("createFeeMeteringLedger creates an empty local placeholder ledger", () => {
  const ledger = createFeeMeteringLedger();
  assert.equal(ledger.ledger_version, "atg.fee-metering-ledger.v1");
  assert.equal(ledger.local_only, true);
  assert.deepEqual(ledger.events, []);
  assert.equal(ledger.status, "placeholder_only");
  assert.equal(summariseFeeMeteringLedger(ledger).total_events, 0);
});

test("create, add, add-many, list, find, and duplicate handling are immutable", () => {
  const tracked = trackedLedger();
  const first = tracked.events[0] as FeeMeteringLedgerEvent;
  const created = createFeeMeteringLedgerEvent(first);
  assert.deepEqual(created, first);
  const empty = createFeeMeteringLedger();
  const one = addFeeMeteringLedgerEvent(empty, created);
  const complete = addFeeMeteringLedgerEvents(one, tracked.events.slice(1));
  assert.equal(empty.events.length, 0);
  assert.deepEqual(complete, tracked);
  const listed = listFeeMeteringLedgerEvents(complete);
  assert.notEqual(listed[0], complete.events[0]);
  assert.deepEqual(findFeeMeteringLedgerEventById(complete, first.event_id), first);
  assert.equal(findFeeMeteringLedgerEventById(complete, "missing"), undefined);
  assert.equal(addFeeMeteringLedgerEvent(complete, first), complete);
});

test("tracked events and summary stay aligned with ledger logic", () => {
  const ledger = rebuiltLedger();
  const summary = summariseFeeMeteringLedger(ledger);
  assert.deepEqual(ledger, readJson(paths.events));
  assert.deepEqual(summary, readJson(paths.summary));
  assert.equal(summary.total_events, 7);
  for (const type of ["clearing_check_placeholder", "refusalgraph_lookup_placeholder", "receipt_creation_placeholder", "receipt_verification_placeholder", "batch_clearing_placeholder", "approval_gate_placeholder", "blocked_action_placeholder"] as const) {
    assert.equal(summary.event_type_counts[type], 1, type);
  }
  assert.equal(summary.billable_if_live_count, 3);
  assert.equal(summary.not_billable_count, 1);
  assert.equal(summary.blocked_count, 1);
  assert.equal(summary.approval_required_count, 6);
  assert.equal(summary.action_blocked_count, 6);
  assert.equal(summary.placeholder_amount_total, 0.095);
  assert.equal(summary.placeholder_amount_minor_units_total, 10);
});

test("billable-if-live remains a non-operational planning placeholder", () => {
  const event = readJson(paths.billable) as FeeMeteringLedgerEvent;
  assert.equal(event.billable_if_live, true);
  assert.equal(event.placeholder_fee_status, "billable_if_live");
  assert.equal(event.amount, 0.02);
  assert.equal(event.amount_minor_units, 2);
  for (const field of ["billing_enabled", "payment_enabled", "settlement_enabled", "machine_to_machine_fee_enabled", "payment_or_fee_triggered", "billing_triggered", "settlement_triggered", "tracking_triggered", "analytics_triggered", "network_lookup_performed", "external_lookup_performed", "action_executed", "private_data_included"] as const) {
    assert.equal(event[field], false, field);
  }
});

test("unknown values, unsafe amounts, and private fields fail into safe defaults", () => {
  const marker = "PRIVATE_FEE_LEDGER_VALUE_MUST_NOT_COPY";
  const input: FeeMeteringLedgerEventInput = {
    event_type: marker,
    source_id: marker,
    source_type: marker,
    pipeline_id: marker,
    placeholder_fee_category: marker,
    placeholder_fee_status: marker,
    billable_if_live: true,
    currency: marker,
    amount: -1,
    amount_minor_units: -1,
    fee_reason: marker,
    created_at: "invalid",
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
  };
  const event = createFeeMeteringLedgerEvent(input);
  assert.equal(event.event_type, "unknown_fee_placeholder");
  assert.equal(event.placeholder_fee_status, "unknown");
  assert.equal(event.billable_if_live, false);
  assert.equal(event.currency, "not_configured");
  assert.equal(event.amount, null);
  assert.equal(event.amount_minor_units, null);
  assert.equal(event.fee_reason, "unknown");
  assert.equal(event.created_at, "unknown");
  assert.deepEqual(Object.keys(event).sort(), eventKeys);
  assert.doesNotMatch(JSON.stringify(event), new RegExp(marker));
});

test("deterministic fee IDs contain no private data and safe amounts are bounded", () => {
  const marker = "PRIVATE_FEE_SOURCE_MUST_NOT_COPY";
  const id = createFeeMeteringLedgerEventId("receipt_verification_placeholder", marker);
  assert.equal(id, createFeeMeteringLedgerEventId("receipt_verification_placeholder", marker));
  assert.match(id, /^fee_metering_placeholder_receipt_verification_placeholder_[a-f0-9]{20}$/);
  assert.doesNotMatch(id, new RegExp(marker));
  const event = createFeeMeteringLedgerEvent({
    event_type: "clearing_check_placeholder",
    source_id: "amount-boundary",
    placeholder_fee_status: "placeholder_only",
    amount: 2_000_000,
    amount_minor_units: 200_000_000,
    created_at: "2026-06-30T17:30:00.000Z",
  });
  assert.equal(event.amount, 1_000_000);
  assert.equal(event.amount_minor_units, 100_000_000);
  assert.equal(event.billing_enabled, false);
  assert.equal(event.payment_enabled, false);
  assert.equal(event.settlement_enabled, false);
  assert.equal(event.machine_to_machine_fee_enabled, false);
});

test("summary operational and commerce counts remain zero", () => {
  const summary = summariseFeeMeteringLedger(rebuiltLedger());
  assert.equal(summary.private_data_included, false);
  for (const field of ["billing_enabled_count", "payment_enabled_count", "settlement_enabled_count", "machine_to_machine_fee_enabled_count", "payment_triggered_count", "billing_triggered_count", "settlement_triggered_count", "network_lookup_count", "external_lookup_count", "tracking_triggered_count", "analytics_triggered_count", "action_executed_count"] as const) {
    assert.equal(summary[field], 0, field);
  }
  assert.equal(summary.status, "placeholder_only");
});

test("fee metering ledger safety config disables every activation surface", () => {
  const config = readJson(paths.config) as Record<string, unknown>;
  assert.equal(config.status, "placeholder_only");
  assert.equal(config.version, "0.1.0");
  assertNoEnabledFlags(config);
  assertNoEnabledFlags(readJson(paths.blocked));
  for (const requirement of ["requires_human_approval", "requires_gareth_final_approval", "requires_technical_validation", "requires_security_review", "requires_privacy_review", "requires_legal_review", "requires_commercial_validation", "requires_payment_provider_review", "requires_tax_review"]) {
    assert.equal(config[requirement], true, requirement);
  }
});

test("fee ledger docs and examples contain no private, payment, or live identifiers", () => {
  const source = Object.values(paths).map((path) => readFileSync(path, "utf8")).join("\n");
  assert.match(source, /does not.*create invoices or payment links/i);
  assert.match(source, /Gareth final approval/i);
  assert.doesNotMatch(source, /https?:\/\/|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|0x[a-fA-F0-9]{20,}/i);
  for (const marker of ["customer_name", "customer_email", "company_name", "bank_account", "card_number", "wallet_address", "api_key", "access_token", "private_document_text", "invoice_number", "contract_text", "real_agent_endpoint", "real_url", "real_email_content"]) {
    assert.doesNotMatch(JSON.stringify(readJson(paths.events)), new RegExp(marker));
    assert.doesNotMatch(JSON.stringify(readJson(paths.summary)), new RegExp(marker));
    assert.doesNotMatch(JSON.stringify(readJson(paths.billable)), new RegExp(marker));
  }
});
