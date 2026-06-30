import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import {
  addLocalClearingLedgerRecord,
  createLocalClearingLedger,
  createLocalLedgerRecordId,
  findLocalClearingLedgerRecordById,
  listLocalClearingLedgerRecords,
  summariseLocalClearingLedger,
  type LocalClearingLedger,
  type LocalClearingLedgerRecordInput,
} from "../src/index.js";

const paths = {
  doc: resolve("docs/local-clearing-ledger.md"),
  config: resolve("config/local-clearing-ledger-safety.json"),
  records: resolve("examples/local-clearing-ledger-records-draft.json"),
  summary: resolve("examples/local-clearing-ledger-summary.json"),
  rejected: resolve("examples/local-clearing-ledger-private-data-rejected.json"),
  blocked: resolve("examples/local-clearing-ledger-live-storage-blocked.json"),
};
const priorTests = [
  "agent-to-agent-trust-handshake", "refusalgraph-core", "agent-clearing-house-foundation",
  "refusalgraph-signal-engine", "refusalgraph-query-engine", "agent-clearing-decision-engine",
  "agent-clearing-receipt-engine", "unique-advantage-radar",
  "receipt-verification-readiness", "fee-metering-readiness",
  "agent-clearing-pipeline-demo", "agent-clearing-demo-cli", "agent-clearing-demo-report",
  "agent-clearing-public-demo-narrative", "agent-clearing-investor-partner-brief",
].map((name) => resolve(`test/${name}.test.ts`));
const recordKeys = [
  "record_id", "record_type", "source_id", "pipeline_id", "clearing_request_id",
  "clearing_decision_id", "clearing_receipt_id", "verification_id",
  "metering_event_id", "refusalgraph_signal_id", "refusalgraph_query_id", "decision",
  "caution_level", "approval_required", "action_allowed", "action_blocked",
  "receipt_status", "verification_result", "fee_readiness_status",
  "private_data_included", "network_lookup_performed", "external_lookup_performed",
  "payment_or_fee_triggered", "billing_triggered", "settlement_triggered",
  "action_executed", "status", "created_at",
].sort();

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8")) as unknown;
}

function fixtureInputs(): LocalClearingLedgerRecordInput[] {
  const created_at = "2026-06-30T11:00:00.000Z";
  return [
    { record_type: "clearing_decision", source_id: "acd_local_demo_001", pipeline_id: "acp_local_demo_001", clearing_request_id: "request_local_demo_001", clearing_decision_id: "acd_local_demo_001", decision: "require_human_approval", caution_level: "high", approval_required: true, action_blocked: true, created_at },
    { record_type: "clearing_receipt", source_id: "acr_local_demo_001", pipeline_id: "acp_local_demo_001", clearing_decision_id: "acd_local_demo_001", clearing_receipt_id: "acr_local_demo_001", decision: "require_human_approval", caution_level: "high", approval_required: true, action_blocked: true, receipt_status: "draft_only", created_at },
    { record_type: "receipt_verification_result", source_id: "acrv_local_demo_001", pipeline_id: "acp_local_demo_001", clearing_receipt_id: "acr_local_demo_001", verification_id: "acrv_local_demo_001", verification_result: "locally_valid", created_at },
    { record_type: "fee_metering_event", source_id: "fem_local_demo_001", pipeline_id: "acp_local_demo_001", verification_id: "acrv_local_demo_001", metering_event_id: "fem_local_demo_001", fee_readiness_status: "placeholder_only", created_at },
    { record_type: "pipeline_result", source_id: "acp_local_demo_001", pipeline_id: "acp_local_demo_001", clearing_request_id: "request_local_demo_001", clearing_decision_id: "acd_local_demo_001", clearing_receipt_id: "acr_local_demo_001", verification_id: "acrv_local_demo_001", metering_event_id: "fem_local_demo_001", decision: "require_human_approval", caution_level: "high", approval_required: true, action_blocked: true, receipt_status: "draft_only", verification_result: "locally_valid", fee_readiness_status: "placeholder_only", created_at },
  ];
}

function fixtureLedger(): LocalClearingLedger {
  return fixtureInputs().reduce(addLocalClearingLedgerRecord, createLocalClearingLedger());
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

test("ledger files exist and all prior trust infrastructure tests remain present", () => {
  for (const path of [...Object.values(paths), ...priorTests]) assert.equal(existsSync(path), true, path);
});

test("createLocalClearingLedger returns an empty local draft ledger", () => {
  const ledger = createLocalClearingLedger();
  assert.equal(ledger.ledger_version, "atg.local-clearing-ledger.v1");
  assert.equal(ledger.local_only, true);
  assert.deepEqual(ledger.records, []);
  assert.equal(ledger.status, "draft_only");
  assert.equal(summariseLocalClearingLedger(ledger).total_records, 0);
});

test("add, list, find, and duplicate handling are immutable and deterministic", () => {
  const empty = createLocalClearingLedger();
  const input = fixtureInputs()[0] as LocalClearingLedgerRecordInput;
  const added = addLocalClearingLedgerRecord(empty, input);
  assert.equal(empty.records.length, 0);
  assert.equal(added.records.length, 1);
  const listed = listLocalClearingLedgerRecords(added);
  assert.notEqual(listed[0], added.records[0]);
  const found = findLocalClearingLedgerRecordById(added, listed[0]?.record_id ?? "missing");
  assert.deepEqual(found, listed[0]);
  assert.equal(findLocalClearingLedgerRecordById(added, "missing"), undefined);
  assert.equal(addLocalClearingLedgerRecord(added, input), added);
});

test("tracked records and summary stay aligned with ledger logic", () => {
  const ledger = fixtureLedger();
  const summary = summariseLocalClearingLedger(ledger);
  assert.deepEqual(ledger, readJson(paths.records));
  assert.deepEqual(summary, readJson(paths.summary));
  assert.equal(summary.total_records, 5);
  assert.equal(summary.blocked_count, 3);
  assert.equal(summary.approval_required_count, 3);
  assert.equal(summary.allowed_count, 0);
  assert.equal(summary.high_caution_count, 3);
  assert.equal(summary.receipts_created_count, 1);
  assert.equal(summary.verifications_completed_count, 1);
  assert.equal(summary.fee_placeholders_count, 1);
});

test("unknown types and unsafe categorical values fail into safe local defaults", () => {
  const ledger = addLocalClearingLedgerRecord(createLocalClearingLedger(), {
    record_type: "PRIVATE_UNKNOWN_TYPE", source_id: "PRIVATE_SOURCE_ID",
    decision: "PRIVATE_DECISION", caution_level: "PRIVATE_CAUTION",
    receipt_status: "PRIVATE_STATUS", verification_result: "PRIVATE_VERIFICATION",
    fee_readiness_status: "PRIVATE_FEE", created_at: "invalid",
  });
  const record = ledger.records[0];
  assert.ok(record);
  assert.equal(record.record_type, "unknown_local_record");
  assert.equal(record.decision, null);
  assert.equal(record.caution_level, "unknown");
  assert.equal(record.receipt_status, "not_applicable");
  assert.equal(record.verification_result, null);
  assert.equal(record.fee_readiness_status, "not_applicable");
  assert.equal(record.created_at, "unknown");
  assert.doesNotMatch(JSON.stringify(record), /PRIVATE_/);
});

test("record IDs and records are allowlisted and copy no private data", () => {
  const marker = "PRIVATE_LEDGER_VALUE_MUST_NOT_COPY";
  const id = createLocalLedgerRecordId("clearing_receipt", marker);
  assert.equal(id, createLocalLedgerRecordId("clearing_receipt", marker));
  assert.match(id, /^local_ledger_clearing_receipt_[a-f0-9]{20}$/);
  assert.doesNotMatch(id, new RegExp(marker));
  const ledger = addLocalClearingLedgerRecord(createLocalClearingLedger(), {
    record_type: "clearing_receipt", source_id: marker, pipeline_id: marker,
    clearing_receipt_id: marker, decision: "require_human_approval",
    caution_level: "high", approval_required: true, action_blocked: true,
    receipt_status: "draft_only", created_at: "2026-06-30T11:30:00.000Z",
    customer_name: marker, customer_email: marker, company_name: marker,
    bank_account: marker, card_number: marker, wallet_address: marker,
    api_key: marker, access_token: marker, private_document_text: marker,
    invoice_number: marker, contract_text: marker, real_agent_endpoint: marker,
    real_url: marker, real_email_content: marker,
  });
  const record = ledger.records[0];
  assert.ok(record);
  assert.deepEqual(Object.keys(record).sort(), recordKeys);
  assert.doesNotMatch(JSON.stringify(record), new RegExp(marker));
  for (const field of ["private_data_included", "network_lookup_performed", "external_lookup_performed", "payment_or_fee_triggered", "billing_triggered", "settlement_triggered", "action_executed"] as const) {
    assert.equal(record[field], false, field);
  }
  assert.equal(record.status, "draft_only");
});

test("summary counts allowed and critical records while operational counts remain zero", () => {
  let ledger = fixtureLedger();
  ledger = addLocalClearingLedgerRecord(ledger, { record_type: "refusalgraph_query_result", source_id: "query-critical", refusalgraph_query_id: "query-critical", caution_level: "critical", action_blocked: true, created_at: "2026-06-30T12:00:00.000Z" });
  ledger = addLocalClearingLedgerRecord(ledger, { record_type: "demo_report", source_id: "report-allowed", decision: "accept_with_limits", caution_level: "low", action_allowed: true, created_at: "2026-06-30T12:01:00.000Z" });
  const summary = summariseLocalClearingLedger(ledger);
  assert.equal(summary.total_records, 7);
  assert.equal(summary.record_type_counts.refusalgraph_query_result, 1);
  assert.equal(summary.record_type_counts.demo_report, 1);
  assert.equal(summary.blocked_count, 4);
  assert.equal(summary.allowed_count, 1);
  assert.equal(summary.critical_caution_count, 1);
  assert.equal(summary.private_data_included, false);
  for (const field of ["action_executed_count", "payment_triggered_count", "billing_triggered_count", "settlement_triggered_count", "network_lookup_count"] as const) {
    assert.equal(summary[field], 0, field);
  }
  assert.equal(summary.status, "draft_only");
});

test("ledger safety config disables every storage, network, commercial, and execution surface", () => {
  const config = readJson(paths.config) as Record<string, unknown>;
  const blocked = readJson(paths.blocked) as Record<string, unknown>;
  assert.equal(config.status, "draft_only");
  assert.equal(config.version, "0.1.0");
  assertNoEnabledFlags(config);
  assertNoEnabledFlags(blocked);
  for (const requirement of ["requires_human_approval", "requires_gareth_final_approval", "requires_technical_validation", "requires_security_review", "requires_privacy_review", "requires_legal_review", "requires_commercial_validation"]) {
    assert.equal(config[requirement], true, requirement);
  }
  for (const flag of ["local_clearing_ledger_enabled", "ledger_file_persistence_enabled", "live_database_enabled", "cloud_sync_enabled", "external_storage_enabled", "analytics_enabled", "tracking_enabled", "public_api_enabled", "public_protocol_enabled", "clearing_network_enabled", "receipt_network_enabled", "billing_enabled", "payment_enabled", "settlement_enabled", "machine_to_machine_fee_enabled", "deployment_enabled", "publishing_enabled", "signup_enabled", "outreach_enabled", "webhook_enabled", "third_party_connections_enabled", "live_customer_data_enabled", "private_data_export_enabled", "action_execution_enabled", "automatic_purchase_enabled"]) {
    assert.equal(config[flag], false, flag);
  }
});

test("ledger docs and examples contain no live endpoints, credentials, or payment links", () => {
  const source = Object.values(paths).map((path) => readFileSync(path, "utf8")).join("\n");
  assert.match(source, /immutable in-memory object/i);
  assert.match(source, /does not write files/i);
  assert.match(source, /does not.*database/i);
  assert.match(source, /Gareth final approval/i);
  assert.doesNotMatch(source, /https?:\/\/|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|0x[a-fA-F0-9]{20,}/i);
  assert.doesNotMatch(source, /\bG-[A-Z0-9]{10}\b|\bUA-\d{4,}-\d+\b/);
});
