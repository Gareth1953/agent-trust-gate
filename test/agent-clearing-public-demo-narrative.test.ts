import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import {
  createAgentClearingPublicDemoNarrative,
  createAgentClearingPublicDemoNarrativeId,
  renderAgentClearingPublicDemoNarrativeMarkdown,
  type AgentClearingPublicDemoNarrativeInput,
} from "../src/index.js";

const narrativeDocPath = resolve("docs/agent-clearing-public-demo-narrative.md");
const summaryDocPath = resolve("docs/agent-clearing-one-page-summary.md");
const faqDocPath = resolve("docs/agent-clearing-public-demo-faq.md");
const configPath = resolve("config/agent-clearing-public-demo-narrative-safety.json");
const narrativePath = resolve("examples/agent-clearing-public-demo-narrative-draft.json");
const summaryPath = resolve("examples/agent-clearing-public-demo-summary-draft.json");
const faqPath = resolve("examples/agent-clearing-public-demo-faq-draft.json");
const blockedPath = resolve("examples/agent-clearing-public-demo-publishing-blocked.json");
const rejectedPath = resolve("examples/agent-clearing-public-demo-private-data-rejected.json");
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
  resolve("test/agent-clearing-demo-report.test.ts"),
];
const outputKeys = [
  "narrative_id", "narrative_type", "title", "headline", "problem_summary",
  "solution_summary", "demo_flow_summary", "refusalgraph_summary", "safety_summary",
  "future_fee_summary", "current_status", "published", "tracking_enabled",
  "analytics_enabled", "payment_or_fee_triggered", "billing_triggered",
  "settlement_triggered", "action_executed", "private_data_included", "status",
  "created_at",
].sort();

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8")) as unknown;
}

function input(overrides: Partial<AgentClearingPublicDemoNarrativeInput> = {}): AgentClearingPublicDemoNarrativeInput {
  return {
    source_report_id: "acdr_local_public_demo_placeholder",
    caution_level: "high",
    clearing_decision: "require_human_approval",
    created_at: "2026-06-30T09:00:00.000Z",
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

test("public demo narrative files exist and all prior trust infrastructure tests remain present", () => {
  for (const path of [
    narrativeDocPath, summaryDocPath, faqDocPath, configPath, narrativePath,
    summaryPath, faqPath, blockedPath, rejectedPath, ...priorTests,
  ]) assert.equal(existsSync(path), true, path);
});

test("builder creates the exact tracked draft narrative object", () => {
  const narrative = createAgentClearingPublicDemoNarrative(input());
  assert.deepEqual(narrative, readJson(narrativePath));
  assert.deepEqual(Object.keys(narrative).sort(), outputKeys);
  assert.match(narrative.headline, /Before an agent says yes/i);
  assert.match(narrative.demo_flow_summary, /high caution/i);
  assert.match(narrative.demo_flow_summary, /require_human_approval/i);
  assert.match(narrative.refusalgraph_summary, /privacy-minimized refusal patterns/i);
  assert.equal(narrative.current_status, "draft_public_narrative_not_published");
  assert.equal(narrative.published, false);
  assert.equal(narrative.tracking_enabled, false);
  assert.equal(narrative.analytics_enabled, false);
  assert.equal(narrative.payment_or_fee_triggered, false);
  assert.equal(narrative.billing_triggered, false);
  assert.equal(narrative.settlement_triggered, false);
  assert.equal(narrative.action_executed, false);
  assert.equal(narrative.private_data_included, false);
  assert.equal(narrative.status, "draft_only");
});

test("narrative ID is deterministic, local, and copies no private report ID", () => {
  const marker = "PRIVATE_NARRATIVE_SOURCE_ID_MUST_NOT_COPY";
  const first = createAgentClearingPublicDemoNarrativeId(marker);
  assert.equal(first, createAgentClearingPublicDemoNarrativeId(marker));
  assert.match(first, /^acpdn_local_[a-f0-9]{24}$/);
  assert.doesNotMatch(first, new RegExp(marker));
});

test("Markdown renderer remains draft-only, unpublished, and non-executing", () => {
  const markdown = renderAgentClearingPublicDemoNarrativeMarkdown(
    createAgentClearingPublicDemoNarrative(input()),
  );
  assert.match(markdown, /^# Agent Clearing House \+ RefusalGraph Local Demo/m);
  assert.match(markdown, /Draft-only\. Not published\. Not a live website\./i);
  assert.match(markdown, /Before an agent says yes/i);
  assert.match(markdown, /No action was executed/i);
  assert.match(markdown, /no network lookup was performed/i);
  assert.match(markdown, /Gareth final approval is required before any publication or commercial activation/i);
});

test("private and untrusted input values never enter narrative object or Markdown", () => {
  const marker = "PRIVATE_NARRATIVE_VALUE_MUST_NOT_COPY";
  const narrative = createAgentClearingPublicDemoNarrative({
    ...input({
      source_report_id: marker,
      caution_level: marker,
      clearing_decision: marker,
    }),
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
  });
  const markdown = renderAgentClearingPublicDemoNarrativeMarkdown(narrative);
  assert.doesNotMatch(JSON.stringify(narrative), new RegExp(marker));
  assert.doesNotMatch(markdown, new RegExp(marker));
  assert.match(narrative.demo_flow_summary, /unknown caution/i);
  assert.match(narrative.demo_flow_summary, /keep_blocked/i);
  assert.equal(narrative.private_data_included, false);
});

test("narrative config and publication example disable every activation surface", () => {
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
    "requires_commercial_validation", "requires_publication_approval",
  ]) assert.equal(config[requirement], true, requirement);

  for (const flag of [
    "public_demo_narrative_enabled", "live_public_page_enabled", "publishing_enabled",
    "deployment_enabled", "tracking_enabled", "analytics_enabled", "signup_enabled",
    "contact_form_enabled", "billing_enabled", "payment_enabled", "settlement_enabled",
    "machine_to_machine_fee_enabled", "outreach_enabled", "email_sending_enabled",
    "webhook_enabled", "third_party_connections_enabled", "public_api_enabled",
    "public_protocol_enabled", "agent_to_agent_network_enabled", "clearing_network_enabled",
    "receipt_network_enabled", "live_receipt_verification_enabled",
    "external_receipt_verification_enabled", "live_fee_metering_enabled",
    "billable_events_enabled", "live_customer_data_enabled", "private_data_export_enabled",
    "action_execution_enabled", "automatic_purchase_enabled",
  ]) assert.equal(config[flag], false, flag);
});

test("draft narrative, summary, FAQ, and publication objects remain unpublished and safe", () => {
  const narrative = readJson(narrativePath) as Record<string, unknown>;
  const summary = readJson(summaryPath) as Record<string, unknown>;
  const faq = readJson(faqPath) as Record<string, unknown>;
  const blocked = readJson(blockedPath) as Record<string, unknown>;
  const rejected = readJson(rejectedPath) as Record<string, unknown>;
  for (const value of [narrative, summary, faq, rejected]) {
    assert.equal(value.status, "draft_only");
    assert.equal(value.published, false);
  }
  assert.equal(blocked.result, "blocked");
  assert.equal(blocked.requires_gareth_final_approval, true);
  assert.equal(blocked.requires_publication_approval, true);
  assert.equal(rejected.private_data_included, false);
  assertNoEnabledFlags([narrative, summary, faq, blocked, rejected]);
});

test("public narrative documents and examples contain required positioning and no live identifiers", () => {
  const source = [
    narrativeDocPath, summaryDocPath, faqDocPath, configPath, narrativePath,
    summaryPath, faqPath, blockedPath, rejectedPath,
  ].map((path) => readFileSync(path, "utf8")).join("\n");
  assert.match(source, /This is a draft public narrative only/i);
  assert.match(source, /It is not published/i);
  assert.match(source, /It is not a live website/i);
  assert.match(source, /Before an agent says yes, it can check who already said no - and why/i);
  assert.match(source, /does not replace payment rails or agent communication protocols/i);
  assert.match(source, /does not activate tracking, analytics, signup, billing, payment, settlement, deployment, outreach, webhooks, or third-party connections/i);
  assert.match(source, /Gareth final approval is required before any publication or commercial activation/i);
  assert.doesNotMatch(source, /https?:\/\/|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|0x[a-fA-F0-9]{20,}/i);
  assert.doesNotMatch(source, /\bG-[A-Z0-9]{10}\b|\bUA-\d{4,}-\d+\b/);
});
