import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import {
  createBatchAgentClearingRun,
  createBatchAgentClearingRunId,
  runBatchAgentClearingRequests,
  summariseBatchAgentClearingRun,
  type BatchAgentClearingRunInput,
} from "../src/index.js";

const paths = {
  doc: resolve("docs/batch-agent-clearing-runner.md"),
  config: resolve("config/batch-agent-clearing-runner-safety.json"),
  input: resolve("examples/batch-agent-clearing-runner-input-draft.json"),
  output: resolve("examples/batch-agent-clearing-runner-output-local.json"),
  summary: resolve("examples/batch-agent-clearing-runner-summary.json"),
  rejected: resolve("examples/batch-agent-clearing-runner-private-data-rejected.json"),
  blocked: resolve("examples/batch-agent-clearing-runner-live-activation-blocked.json"),
};
const priorTests = [
  "agent-to-agent-trust-handshake", "refusalgraph-core", "agent-clearing-house-foundation",
  "refusalgraph-signal-engine", "refusalgraph-query-engine", "agent-clearing-decision-engine",
  "agent-clearing-receipt-engine", "unique-advantage-radar", "receipt-verification-readiness",
  "fee-metering-readiness", "agent-clearing-pipeline-demo", "agent-clearing-demo-cli",
  "agent-clearing-demo-report", "agent-clearing-public-demo-narrative",
  "agent-clearing-investor-partner-brief", "local-clearing-ledger",
  "refusalgraph-local-signal-store",
].map((name) => resolve(`test/${name}.test.ts`));
const resultKeys = [
  "batch_id", "batch_type", "batch_status", "total_requests", "completed_count",
  "allowed_count", "blocked_count", "approval_required_count", "high_caution_count",
  "critical_caution_count", "receipts_created_count", "verifications_completed_count",
  "fee_placeholders_count", "ledger_summary", "signal_store_summary", "request_results",
  "safety_summary", "recommended_next_steps", "private_data_included",
  "network_lookup_performed", "external_lookup_performed", "tracking_triggered",
  "analytics_triggered", "payment_or_fee_triggered", "billing_triggered",
  "settlement_triggered", "action_executed", "status", "created_at",
].sort();
const requestResultKeys = [
  "request_id", "pipeline_id", "decision", "caution_level", "approval_required",
  "action_allowed", "action_blocked", "refusal_reasons", "clearing_decision_id",
  "clearing_receipt_id", "verification_id", "metering_event_id", "report_id",
  "ledger_record_ids", "matched_signal_count", "highest_refusalgraph_caution",
  "status", "created_at",
].sort();

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8")) as unknown;
}

function fixtureInput(): BatchAgentClearingRunInput {
  return readJson(paths.input) as BatchAgentClearingRunInput;
}

function assertNoEnabledFlags(value: unknown, path = "root"): void {
  if (Array.isArray(value)) return value.forEach((item, index) => assertNoEnabledFlags(item, `${path}[${index}]`));
  if (typeof value !== "object" || value === null) return;
  for (const [key, item] of Object.entries(value)) {
    if (key.endsWith("_enabled")) assert.equal(item, false, `${path}.${key}`);
    assertNoEnabledFlags(item, `${path}.${key}`);
  }
}

test("batch runner files exist and all prior trust infrastructure tests remain present", () => {
  for (const path of [...Object.values(paths), ...priorTests]) assert.equal(existsSync(path), true, path);
});

test("createBatchAgentClearingRun composes the exact tracked local batch", () => {
  const result = createBatchAgentClearingRun(fixtureInput());
  assert.deepEqual(result, readJson(paths.output));
  assert.equal(result.batch_type, "local_agent_clearing_batch");
  assert.equal(result.batch_status, "draft_only_completed");
  assert.equal(result.total_requests, 4);
  assert.equal(result.completed_count, 4);
});

test("batch runner processes allowed, blocked, approval, caution, receipt, and verification counts", () => {
  const result = runBatchAgentClearingRequests(fixtureInput());
  assert.equal(result.allowed_count, 1);
  assert.equal(result.blocked_count, 3);
  assert.equal(result.approval_required_count, 3);
  assert.equal(result.high_caution_count, 3);
  assert.equal(result.critical_caution_count, 0);
  assert.equal(result.receipts_created_count, 4);
  assert.equal(result.verifications_completed_count, 4);
  assert.equal(result.fee_placeholders_count, 4);
  assert.equal(result.request_results[0]?.decision, "accept_with_limits");
  assert.equal(result.request_results[1]?.decision, "require_human_approval");
});

test("each request queries the local signal store and creates local ledger records", () => {
  const result = runBatchAgentClearingRequests(fixtureInput());
  assert.equal(result.signal_store_summary.total_signals, 3);
  assert.equal(result.signal_store_summary.critical_caution_count, 1);
  assert.equal(result.request_results[0]?.matched_signal_count, 0);
  assert.equal(result.request_results[1]?.matched_signal_count, 1);
  assert.equal(result.request_results[1]?.highest_refusalgraph_caution, "critical");
  assert.equal(result.request_results[2]?.matched_signal_count, 1);
  assert.equal(result.request_results[3]?.matched_signal_count, 1);
  assert.equal(result.ledger_summary.total_records, 28);
  assert.equal(result.ledger_summary.record_type_counts.pipeline_result, 4);
  assert.equal(result.ledger_summary.record_type_counts.clearing_receipt, 4);
  assert.equal(result.ledger_summary.record_type_counts.receipt_verification_result, 4);
  assert.equal(result.ledger_summary.record_type_counts.fee_metering_event, 4);
  assert.equal(result.ledger_summary.record_type_counts.demo_report, 4);
  for (const request of result.request_results) assert.equal(request.ledger_record_ids.length, 7);
});

test("batch and request outputs are strictly allowlisted and non-operational", () => {
  const result = runBatchAgentClearingRequests(fixtureInput());
  assert.deepEqual(Object.keys(result).sort(), resultKeys);
  for (const request of result.request_results) assert.deepEqual(Object.keys(request).sort(), requestResultKeys);
  for (const field of ["private_data_included", "network_lookup_performed", "external_lookup_performed", "tracking_triggered", "analytics_triggered", "payment_or_fee_triggered", "billing_triggered", "settlement_triggered", "action_executed"] as const) {
    assert.equal(result[field], false, field);
  }
  assert.deepEqual(result.safety_summary, {
    local_inputs_only: true,
    private_data_included: false,
    network_lookup_performed: false,
    external_lookup_performed: false,
    tracking_triggered: false,
    analytics_triggered: false,
    payment_or_fee_triggered: false,
    billing_triggered: false,
    settlement_triggered: false,
    action_executed: false,
  });
});

test("batch summary exactly matches tracked counts and has zero unsafe activity", () => {
  const summary = summariseBatchAgentClearingRun(runBatchAgentClearingRequests(fixtureInput()));
  assert.deepEqual(summary, readJson(paths.summary));
  assert.equal(summary.total_requests, 4);
  assert.equal(summary.completed_count, 4);
  assert.equal(summary.private_data_included, false);
  for (const field of ["network_lookup_count", "external_lookup_count", "tracking_triggered_count", "analytics_triggered_count", "payment_triggered_count", "billing_triggered_count", "settlement_triggered_count", "action_executed_count"] as const) {
    assert.equal(summary[field], 0, field);
  }
  assert.equal(summary.status, "draft_only");
});

test("batch identifiers are deterministic, pseudonymous, and contain no private source", () => {
  const marker = "PRIVATE_BATCH_IDENTIFIER_MUST_NOT_COPY";
  const id = createBatchAgentClearingRunId(marker);
  assert.equal(id, createBatchAgentClearingRunId(marker));
  assert.match(id, /^batch_agent_clearing_[a-f0-9]{24}$/);
  assert.doesNotMatch(id, new RegExp(marker));
});

test("private fields are stripped from batch, request, ledger, signal, and summary outputs", () => {
  const marker = "PRIVATE_BATCH_VALUE_MUST_NOT_COPY";
  const source = fixtureInput();
  const result = runBatchAgentClearingRequests({
    ...source,
    batch_id: marker,
    clearing_requests: source.clearing_requests.map((request) => ({
      ...request,
      request_id: marker,
      agent_id: marker,
      target_agent_id: marker,
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
    })),
    local_refusal_signals: source.local_refusal_signals.map((signal) => ({
      ...signal,
      source_id: marker,
      customer_name: marker,
      api_key: marker,
      private_document_text: marker,
    })),
  });
  assert.doesNotMatch(JSON.stringify(result), new RegExp(marker));
  assert.equal(result.private_data_included, false);
  assert.equal(result.ledger_summary.private_data_included, false);
  assert.equal(result.signal_store_summary.private_data_included, false);
});

test("batch safety config disables orchestration, storage, network, commerce, and execution", () => {
  const config = readJson(paths.config) as Record<string, unknown>;
  assert.equal(config.status, "draft_only");
  assert.equal(config.version, "0.1.0");
  assertNoEnabledFlags(config);
  assertNoEnabledFlags(readJson(paths.blocked));
  for (const requirement of ["requires_human_approval", "requires_gareth_final_approval", "requires_technical_validation", "requires_security_review", "requires_privacy_review", "requires_legal_review", "requires_commercial_validation"]) {
    assert.equal(config[requirement], true, requirement);
  }
});

test("batch docs and examples preserve local-only private-data and activation boundaries", () => {
  const source = Object.values(paths).map((path) => readFileSync(path, "utf8")).join("\n");
  assert.match(source, /local-only/i);
  assert.match(source, /does not write files/i);
  assert.match(source, /Gareth final approval/i);
  assert.doesNotMatch(source, /https?:\/\/|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|0x[a-fA-F0-9]{20,}/i);
  for (const marker of ["customer_name", "customer_email", "company_name", "bank_account", "card_number", "wallet_address", "api_key", "access_token", "private_document_text", "invoice_number", "contract_text", "real_agent_endpoint", "real_url", "real_email_content"]) {
    assert.doesNotMatch(JSON.stringify(readJson(paths.output)), new RegExp(marker));
    assert.doesNotMatch(JSON.stringify(readJson(paths.summary)), new RegExp(marker));
  }
});
