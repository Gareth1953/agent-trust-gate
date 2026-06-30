import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import {
  createAgentClearingDemoReport,
  createAgentClearingDemoReportId,
  renderAgentClearingDemoReportMarkdown,
  type AgentClearingPipelineDemoResult,
} from "../src/index.js";

const docPath = resolve("docs/agent-clearing-demo-report.md");
const configPath = resolve("config/agent-clearing-demo-report-safety.json");
const inputPath = resolve("examples/agent-clearing-demo-report-input-pipeline.json");
const outputPath = resolve("examples/agent-clearing-demo-report-output-local.json");
const markdownPath = resolve("examples/agent-clearing-demo-report-markdown.md");
const rejectedPath = resolve("examples/agent-clearing-demo-report-private-data-rejected.json");
const blockedPath = resolve("examples/agent-clearing-demo-report-live-publishing-blocked.json");
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
  resolve("test/agent-clearing-pipeline-demo.test.ts"),
  resolve("test/agent-clearing-demo-cli.test.ts"),
];
const outputKeys = [
  "report_id", "report_type", "source_pipeline_id", "report_status", "title",
  "summary", "requested_action_summary", "refusalgraph_summary",
  "clearing_decision_summary", "receipt_summary", "verification_summary",
  "fee_metering_summary", "safety_summary", "future_value_summary",
  "recommended_next_steps", "private_data_included", "network_lookup_performed",
  "external_lookup_performed", "payment_or_fee_triggered", "billing_triggered",
  "settlement_triggered", "machine_to_machine_fee_triggered", "tracking_triggered",
  "analytics_triggered", "action_executed", "published", "status", "created_at",
].sort();

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8")) as unknown;
}

function input(): AgentClearingPipelineDemoResult {
  return readJson(inputPath) as AgentClearingPipelineDemoResult;
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

function assertReportSafety(report: Record<string, unknown>): void {
  for (const field of [
    "private_data_included", "network_lookup_performed", "external_lookup_performed",
    "payment_or_fee_triggered", "billing_triggered", "settlement_triggered",
    "machine_to_machine_fee_triggered", "tracking_triggered", "analytics_triggered",
    "action_executed", "published",
  ]) assert.equal(report[field], false, field);
  assert.equal(report.report_status, "draft_only");
  assert.equal(report.status, "draft_only");
}

test("demo report files exist and all prior trust infrastructure tests remain present", () => {
  for (const path of [docPath, configPath, inputPath, outputPath, markdownPath, rejectedPath, blockedPath, ...priorTests]) {
    assert.equal(existsSync(path), true, path);
  }
});

test("tracked pipeline result creates the exact tracked local report", () => {
  const report = createAgentClearingDemoReport(input());
  assert.deepEqual(report, readJson(outputPath));
  assert.deepEqual(Object.keys(report).sort(), outputKeys);
  assert.equal(report.source_pipeline_id, "acp_local_8546957d70d11f9d520d8850");
  assert.match(report.summary, /high caution/i);
  assert.match(report.requested_action_summary, /payment or money-movement action/i);
  assert.match(report.refusalgraph_summary, /2 matching draft refusal signals/i);
  assert.match(report.clearing_decision_summary, /Human approval is required/i);
  assert.match(report.receipt_summary, /local Agent Clearing Receipt/i);
  assert.match(report.verification_summary, /locally_valid/i);
  assert.match(report.fee_metering_summary, /placeholder_only/i);
  assert.match(report.safety_summary, /unpublished, untracked, non-networked/i);
  assert.match(report.future_value_summary, /future Agent Clearing House/i);
  assert.ok(report.recommended_next_steps.includes("require_human_approval"));
  assert.ok(report.recommended_next_steps.includes("Gareth_final_approval_required"));
  assertReportSafety(report as unknown as Record<string, unknown>);
});

test("report ID is deterministic, local, and copies no private pipeline ID", () => {
  const marker = "PRIVATE_REPORT_SOURCE_ID_MUST_NOT_COPY";
  const first = createAgentClearingDemoReportId(marker);
  assert.equal(first, createAgentClearingDemoReportId(marker));
  assert.match(first, /^acdr_local_[a-f0-9]{24}$/);
  assert.doesNotMatch(first, new RegExp(marker));
});

test("Markdown rendering exactly matches the tracked safe report", () => {
  const report = createAgentClearingDemoReport(input());
  const markdown = renderAgentClearingDemoReportMarkdown(report);
  assert.equal(markdown.trimEnd(), readFileSync(markdownPath, "utf8").trimEnd());
  assert.match(markdown, /^# Agent Clearing Demo Report/m);
  assert.match(markdown, /^## Safety Status/m);
  assert.match(markdown, /No action was executed/i);
  assert.match(markdown, /No network lookup was performed/i);
  assert.match(markdown, /No payment, billing, settlement, tracking, analytics, publishing, or deployment occurred/i);
  assert.match(markdown, /Human approval is required/i);
  assert.match(markdown, /placeholder_only/i);
});

test("private and untrusted normalized values never enter report object or Markdown", () => {
  const marker = "PRIVATE_REPORT_VALUE_MUST_NOT_COPY";
  const source = input() as unknown as Record<string, unknown>;
  source.pipeline_id = marker;
  source.customer_name = marker;
  source.customer_email = marker;
  source.company_name = marker;
  source.bank_account = marker;
  source.card_number = marker;
  source.wallet_address = marker;
  source.api_key = marker;
  source.access_token = marker;
  source.private_document_text = marker;
  source.invoice_number = marker;
  source.contract_text = marker;
  source.real_agent_endpoint = marker;
  source.real_url = marker;
  source.real_email_content = marker;
  const query = source.refusalgraph_query_result as Record<string, unknown>;
  const decision = source.clearing_decision as Record<string, unknown>;
  const verification = source.receipt_verification_result as Record<string, unknown>;
  const metering = source.fee_metering_event as Record<string, unknown>;
  query.caution_level = marker;
  decision.decision = marker;
  decision.reason_codes = [marker];
  decision.required_next_steps = [marker];
  verification.verification_result = marker;
  verification.required_next_steps = [marker];
  metering.fee_readiness_status = marker;

  const report = createAgentClearingDemoReport(source as unknown as AgentClearingPipelineDemoResult);
  const markdown = renderAgentClearingDemoReportMarkdown(report);
  assert.doesNotMatch(JSON.stringify(report), new RegExp(marker));
  assert.doesNotMatch(markdown, new RegExp(marker));
  assert.equal(report.private_data_included, false);
  assert.equal(report.published, false);
  assert.ok(report.recommended_next_steps.every((step) => !step.includes(marker)));
});

test("unsafe source flags fail closed without repeating source activity", () => {
  const source = input() as unknown as Record<string, unknown>;
  source.action_executed = true;
  source.network_lookup_performed = true;
  source.payment_or_fee_triggered = true;
  source.tracking_triggered = true;
  const report = createAgentClearingDemoReport(source as unknown as AgentClearingPipelineDemoResult);
  assert.match(report.safety_summary, /Unsafe or inconsistent source flags were detected/i);
  assertReportSafety(report as unknown as Record<string, unknown>);
});

test("report safety config disables every activation surface and requires all reviews", () => {
  const config = readJson(configPath) as Record<string, unknown>;
  const blocked = readJson(blockedPath) as Record<string, unknown>;
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
    "demo_report_enabled", "live_reporting_enabled", "report_publishing_enabled",
    "report_export_enabled", "tracking_enabled", "analytics_enabled",
    "clearing_network_enabled", "external_lookup_enabled", "public_api_enabled",
    "public_protocol_enabled", "agent_to_agent_reporting_enabled", "receipt_network_enabled",
    "live_receipt_verification_enabled", "external_receipt_verification_enabled",
    "live_fee_metering_enabled", "billable_events_enabled", "billing_enabled",
    "payment_enabled", "settlement_enabled", "machine_to_machine_fee_enabled",
    "external_metering_enabled", "deployment_enabled", "publishing_enabled",
    "signup_enabled", "outreach_enabled", "webhook_enabled",
    "third_party_connections_enabled", "live_customer_data_enabled",
    "private_data_export_enabled", "action_execution_enabled", "automatic_purchase_enabled",
  ]) assert.equal(config[flag], false, flag);
});

test("report docs and examples state the local unpublished boundary", () => {
  const source = [docPath, configPath, inputPath, outputPath, markdownPath, rejectedPath, blockedPath]
    .map((path) => readFileSync(path, "utf8"))
    .join("\n");
  assert.match(source, /demo report does not execute actions/i);
  assert.match(source, /demo report does not perform network lookups/i);
  assert.match(source, /demo report does not publish content/i);
  assert.match(source, /demo report does not track, analyse, or profile users/i);
  assert.match(source, /demo report does not move money/i);
  assert.match(source, /does not trigger payment, billing, settlement, signup, deployment, publishing, outreach, webhooks, or third-party connections/i);
  assert.match(source, /All live, commercial, network, payment, verification, metering, billing, or settlement use requires Gareth final approval/i);
  assert.doesNotMatch(source, /https?:\/\/|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|0x[a-fA-F0-9]{20,}/i);
  assert.doesNotMatch(source, /\bG-[A-Z0-9]{10}\b|\bUA-\d{4,}-\d+\b/);
});
