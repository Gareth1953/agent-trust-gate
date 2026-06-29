import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import {
  createFeeMeteringEvent,
  createFeeMeteringEventId,
  feeMeteringCategoryForEvent,
  type FeeMeteringInput,
} from "../src/index.js";

const docPath = resolve("docs/fee-metering-readiness.md");
const configPath = resolve("config/fee-metering-readiness-safety.json");
const inputPath = resolve("examples/fee-metering-input-receipt-verification.json");
const outputPath = resolve("examples/fee-metering-output-placeholder.json");
const typesPath = resolve("examples/fee-metering-event-types.json");
const rejectedPath = resolve("examples/fee-metering-private-data-rejected.json");
const blockedPath = resolve("examples/fee-metering-live-billing-blocked.json");
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
];
const outputKeys = [
  "metering_event_id", "source_event_id", "source_event_type", "metering_category",
  "fee_readiness_status", "possible_fee_model", "possible_fee_amount",
  "possible_fee_currency", "billable_event_recorded", "billing_triggered",
  "payment_triggered", "settlement_triggered", "machine_to_machine_fee_triggered",
  "external_metering_triggered", "tracking_triggered", "analytics_triggered",
  "private_data_included", "network_lookup_performed", "external_lookup_performed",
  "action_executed", "status", "created_at",
].sort();

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8")) as unknown;
}

function input(overrides: Partial<FeeMeteringInput> = {}): FeeMeteringInput {
  return {
    source_event_id: "local-metering-event",
    source_event_type: "clearing_receipt_created",
    source_receipt_id: null,
    source_verification_id: null,
    source_clearing_decision_id: null,
    source_refusal_signal_id: null,
    source_lookup_id: null,
    actor_type: "local_agent_placeholder",
    requested_metering_category: "clearing_receipt_event",
    possible_fee_model: "per_clearing_event",
    possible_fee_amount: null,
    possible_fee_currency: "GBP",
    timestamp: "2026-06-29T17:30:00.000Z",
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

test("fee metering files exist and all prior trust infrastructure tests remain present", () => {
  for (const path of [docPath, configPath, inputPath, outputPath, typesPath, rejectedPath, blockedPath, ...priorTests]) {
    assert.equal(existsSync(path), true, path);
  }
});

test("tracked receipt verification event creates the tracked placeholder", () => {
  const source = readJson(inputPath) as FeeMeteringInput;
  const expected = readJson(outputPath);
  const result = createFeeMeteringEvent(source);
  assert.deepEqual(result, expected);
  assert.equal(result.metering_category, "receipt_verification_event");
  assert.equal(result.fee_readiness_status, "placeholder_only");
  assert.equal(result.billable_event_recorded, false);
});

test("all supported event types map to their documented categories", () => {
  const expected = (readJson(typesPath) as { event_types: Record<string, string> }).event_types;
  for (const [eventType, category] of Object.entries(expected)) {
    assert.equal(feeMeteringCategoryForEvent(eventType), category, eventType);
  }
  assert.equal(feeMeteringCategoryForEvent("clearing_receipt_created"), "clearing_receipt_event");
  assert.equal(feeMeteringCategoryForEvent("clearing_decision_created"), "clearing_decision_event");
  assert.equal(feeMeteringCategoryForEvent("refusal_lookup_requested"), "refusal_lookup_event");
  assert.equal(feeMeteringCategoryForEvent("refusal_signal_created"), "refusal_signal_event");
});

test("unknown event remains unmetered with all commerce disabled", () => {
  const result = createFeeMeteringEvent(input({
    source_event_type: "unknown_private_event",
    requested_metering_category: "force_billable",
    possible_fee_model: "private_fee_model",
    possible_fee_amount: 999,
    possible_fee_currency: "PRIVATE",
  }));
  assert.equal(result.source_event_type, "unknown");
  assert.equal(result.metering_category, "unknown_or_unmetered");
  assert.equal(result.fee_readiness_status, "not_enabled");
  assert.equal(result.possible_fee_model, "not_configured");
  assert.equal(result.possible_fee_amount, "not_configured");
  assert.equal(result.possible_fee_currency, "not_configured");
  assert.equal(result.billing_triggered, false);
  assert.equal(result.payment_triggered, false);
  assert.equal(result.settlement_triggered, false);
});

test("metering ID is deterministic and copies no private source identifier", () => {
  const privateMarker = "PRIVATE_SOURCE_EVENT_IDENTIFIER";
  const first = createFeeMeteringEventId("receipt_verification_completed", privateMarker);
  assert.equal(first, createFeeMeteringEventId("receipt_verification_completed", privateMarker));
  assert.match(first, /^fem_local_receipt_verification_completed_[a-f0-9]{20}$/);
  assert.doesNotMatch(first, new RegExp(privateMarker));
});

test("metering output is strictly allowlisted and copies no private data", () => {
  const privateMarker = "PRIVATE_METERING_VALUE_MUST_NOT_COPY";
  const result = createFeeMeteringEvent({
    ...input({
      source_event_id: privateMarker,
      source_receipt_id: privateMarker,
      source_verification_id: privateMarker,
      source_clearing_decision_id: privateMarker,
      source_refusal_signal_id: privateMarker,
      source_lookup_id: privateMarker,
      actor_type: privateMarker,
      requested_metering_category: privateMarker,
      possible_fee_amount: privateMarker,
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
  });
  assert.deepEqual(Object.keys(result).sort(), outputKeys);
  assert.doesNotMatch(JSON.stringify(result), new RegExp(privateMarker));
  assert.equal(result.private_data_included, false);
  assert.equal(result.network_lookup_performed, false);
  assert.equal(result.external_lookup_performed, false);
  assert.equal(result.action_executed, false);
});

test("every metering commerce, tracking, and execution indicator remains false", () => {
  const result = createFeeMeteringEvent(input());
  for (const field of [
    "billable_event_recorded", "billing_triggered", "payment_triggered",
    "settlement_triggered", "machine_to_machine_fee_triggered",
    "external_metering_triggered", "tracking_triggered", "analytics_triggered",
    "private_data_included", "network_lookup_performed", "external_lookup_performed",
    "action_executed",
  ] as const) assert.equal(result[field], false, field);
  assert.equal(result.status, "draft_only");
});

test("fee metering config and blocked example disable every activation surface", () => {
  const config = readJson(configPath) as Record<string, unknown>;
  const blocked = readJson(blockedPath) as Record<string, unknown>;
  assert.equal(config.status, "draft_only");
  assert.equal(config.version, "0.1.0");
  for (const requirement of [
    "requires_human_approval", "requires_gareth_final_approval",
    "requires_technical_validation", "requires_security_review",
    "requires_privacy_review", "requires_legal_review",
    "requires_commercial_validation",
  ]) assert.equal(config[requirement], true, requirement);
  assertNoEnabledFlags(config);
  assertNoEnabledFlags(blocked);

  for (const flag of [
    "fee_metering_readiness_enabled", "live_fee_metering_enabled",
    "billable_events_enabled", "billing_enabled", "payment_enabled",
    "settlement_enabled", "machine_to_machine_fee_enabled", "external_metering_enabled",
    "tracking_enabled", "analytics_enabled", "public_api_enabled",
    "public_protocol_enabled", "receipt_network_enabled", "agent_to_agent_metering_enabled",
    "deployment_enabled", "publishing_enabled", "signup_enabled", "outreach_enabled",
    "webhook_enabled", "third_party_connections_enabled", "live_customer_data_enabled",
    "private_data_export_enabled", "action_execution_enabled", "automatic_purchase_enabled",
  ]) assert.equal(config[flag], false, flag);
});

test("fee metering docs and examples contain no live endpoints, credentials, wallets, or payment links", () => {
  const source = [docPath, configPath, inputPath, outputPath, typesPath, rejectedPath, blockedPath]
    .map((path) => readFileSync(path, "utf8"))
    .join("\n");
  assert.match(source, /Fee metering readiness does not mean live charging/i);
  assert.match(source, /does not bill users/i);
  assert.match(source, /does not collect payment/i);
  assert.match(source, /does not settle funds/i);
  assert.match(source, /does not call external services/i);
  assert.match(source, /does not track real users/i);
  assert.match(source, /All live, commercial, network, payment, metering, billing, or settlement use requires Gareth final approval/i);
  assert.doesNotMatch(source, /https?:\/\/|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|0x[a-fA-F0-9]{20,}/i);
  assert.doesNotMatch(source, /\bG-[A-Z0-9]{10}\b|\bUA-\d{4,}-\d+\b/);
});
