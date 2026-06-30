import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import {
  createAgentClearingInvestorPartnerBrief,
  createAgentClearingInvestorPartnerBriefId,
  renderAgentClearingInvestorPartnerBriefMarkdown,
  type AgentClearingInvestorPartnerBriefInput,
} from "../src/index.js";

const briefDocPath = resolve("docs/agent-clearing-investor-partner-brief.md");
const summaryDocPath = resolve("docs/agent-clearing-partner-one-page-summary.md");
const memoDocPath = resolve("docs/agent-clearing-founder-strategic-memo.md");
const configPath = resolve("config/agent-clearing-investor-partner-brief-safety.json");
const briefPath = resolve("examples/agent-clearing-investor-brief-draft.json");
const summaryPath = resolve("examples/agent-clearing-partner-summary-draft.json");
const memoPath = resolve("examples/agent-clearing-founder-memo-draft.json");
const blockedPath = resolve("examples/agent-clearing-brief-sharing-blocked.json");
const rejectedPath = resolve("examples/agent-clearing-brief-private-data-rejected.json");
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
  resolve("test/agent-clearing-public-demo-narrative.test.ts"),
];
const outputKeys = [
  "brief_id", "brief_type", "title", "one_sentence_summary", "problem_summary",
  "solution_summary", "refusalgraph_summary", "current_demo_summary",
  "future_fee_summary", "unique_advantage_summary", "safety_summary",
  "current_status", "recommended_next_steps", "shared_externally", "published",
  "tracking_enabled", "analytics_enabled", "payment_or_fee_triggered",
  "billing_triggered", "settlement_triggered", "action_executed",
  "private_data_included", "status", "created_at",
].sort();

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8")) as unknown;
}

function input(overrides: Partial<AgentClearingInvestorPartnerBriefInput> = {}): AgentClearingInvestorPartnerBriefInput {
  return {
    source_narrative_id: "acpdn_local_investor_brief_placeholder",
    current_demo_status: "local_demo_validated",
    created_at: "2026-06-30T10:00:00.000Z",
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

test("investor partner brief files exist and all prior trust infrastructure tests remain present", () => {
  for (const path of [
    briefDocPath, summaryDocPath, memoDocPath, configPath, briefPath, summaryPath,
    memoPath, blockedPath, rejectedPath, ...priorTests,
  ]) assert.equal(existsSync(path), true, path);
});

test("builder creates the exact tracked draft investor partner brief", () => {
  const brief = createAgentClearingInvestorPartnerBrief(input());
  assert.deepEqual(brief, readJson(briefPath));
  assert.deepEqual(Object.keys(brief).sort(), outputKeys);
  assert.ok(brief.one_sentence_summary.length > 0);
  assert.match(brief.problem_summary, /communication protocols/i);
  assert.match(brief.solution_summary, /clearing decision and receipt/i);
  assert.match(brief.refusalgraph_summary, /who already said no/i);
  assert.match(brief.current_demo_summary, /local_demo_validated/i);
  assert.match(brief.future_fee_summary, /commercial hypotheses only/i);
  assert.match(brief.unique_advantage_summary, /crowded categories/i);
  assert.match(brief.safety_summary, /draft-only brief/i);
  assert.ok(brief.recommended_next_steps.includes("require_gareth_final_approval"));
  assert.equal(brief.shared_externally, false);
  assert.equal(brief.published, false);
  assert.equal(brief.tracking_enabled, false);
  assert.equal(brief.analytics_enabled, false);
  assert.equal(brief.payment_or_fee_triggered, false);
  assert.equal(brief.billing_triggered, false);
  assert.equal(brief.settlement_triggered, false);
  assert.equal(brief.action_executed, false);
  assert.equal(brief.private_data_included, false);
  assert.equal(brief.status, "draft_only");
});

test("brief ID is deterministic, local, and copies no private narrative ID", () => {
  const marker = "PRIVATE_BRIEF_SOURCE_ID_MUST_NOT_COPY";
  const first = createAgentClearingInvestorPartnerBriefId(marker);
  assert.equal(first, createAgentClearingInvestorPartnerBriefId(marker));
  assert.match(first, /^acipb_local_[a-f0-9]{24}$/);
  assert.doesNotMatch(first, new RegExp(marker));
});

test("Markdown renderer remains draft-only, unshared, unpublished, and non-commercial", () => {
  const markdown = renderAgentClearingInvestorPartnerBriefMarkdown(
    createAgentClearingInvestorPartnerBrief(input()),
  );
  assert.match(markdown, /^# Agent Clearing House \+ RefusalGraph Investor \/ Partner Brief/m);
  assert.match(markdown, /Draft-only\. Not externally shared\. Not published\. Not investment advice\./i);
  assert.match(markdown, /^## RefusalGraph/m);
  assert.match(markdown, /^## Future Fee Readiness/m);
  assert.match(markdown, /^## Safety Statement/m);
  assert.match(markdown, /Nothing was shared, published, tracked, analysed, billed, paid, settled, networked, or executed/i);
  assert.match(markdown, /Gareth final approval is required/i);
});

test("private and untrusted input values never enter brief object or Markdown", () => {
  const marker = "PRIVATE_BRIEF_VALUE_MUST_NOT_COPY";
  const brief = createAgentClearingInvestorPartnerBrief({
    ...input({ source_narrative_id: marker, current_demo_status: marker }),
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
  const markdown = renderAgentClearingInvestorPartnerBriefMarkdown(brief);
  assert.doesNotMatch(JSON.stringify(brief), new RegExp(marker));
  assert.doesNotMatch(markdown, new RegExp(marker));
  assert.match(brief.current_demo_summary, /current draft_only capability/i);
  assert.equal(brief.private_data_included, false);
  assert.equal(brief.shared_externally, false);
});

test("brief config and sharing example disable every activation surface", () => {
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
    "requires_commercial_validation", "requires_external_sharing_approval",
    "requires_publication_approval",
  ]) assert.equal(config[requirement], true, requirement);

  for (const flag of [
    "investor_partner_brief_enabled", "external_sharing_enabled", "publication_enabled",
    "outreach_enabled", "email_sending_enabled", "crm_enabled", "tracking_enabled",
    "analytics_enabled", "live_public_page_enabled", "deployment_enabled",
    "signup_enabled", "contact_form_enabled", "billing_enabled", "payment_enabled",
    "settlement_enabled", "machine_to_machine_fee_enabled", "webhook_enabled",
    "third_party_connections_enabled", "public_api_enabled", "public_protocol_enabled",
    "agent_to_agent_network_enabled", "clearing_network_enabled", "receipt_network_enabled",
    "live_receipt_verification_enabled", "external_receipt_verification_enabled",
    "live_fee_metering_enabled", "billable_events_enabled", "live_customer_data_enabled",
    "private_data_export_enabled", "action_execution_enabled", "automatic_purchase_enabled",
  ]) assert.equal(config[flag], false, flag);
});

test("draft brief, partner summary, founder memo, and sharing objects remain internal and safe", () => {
  const brief = readJson(briefPath) as Record<string, unknown>;
  const summary = readJson(summaryPath) as Record<string, unknown>;
  const memo = readJson(memoPath) as Record<string, unknown>;
  const blocked = readJson(blockedPath) as Record<string, unknown>;
  const rejected = readJson(rejectedPath) as Record<string, unknown>;
  for (const value of [brief, summary, memo, rejected]) {
    assert.equal(value.status, "draft_only");
    assert.equal(value.shared_externally, false);
    assert.equal(value.published, false);
  }
  assert.equal(blocked.result, "blocked");
  assert.equal(blocked.requires_external_sharing_approval, true);
  assert.equal(rejected.private_data_included, false);
  assertNoEnabledFlags([brief, summary, memo, blocked, rejected]);
});

test("brief documents and examples contain required strategy and no live identifiers", () => {
  const source = [
    briefDocPath, summaryDocPath, memoDocPath, configPath, briefPath, summaryPath,
    memoPath, blockedPath, rejectedPath,
  ].map((path) => readFileSync(path, "utf8")).join("\n");
  assert.match(source, /This is a draft-only brief/i);
  assert.match(source, /It is not published/i);
  assert.match(source, /It is not outreach/i);
  assert.match(source, /It is not investment advice/i);
  assert.match(source, /Before an agent says yes, it can check who already said no - and why/i);
  assert.match(source, /does not replace A2A, MCP, AP2, x402, Stripe, Coinbase, Mastercard/i);
  assert.match(source, /generic AI governance is crowded/i);
  assert.match(source, /Payment rails are crowded/i);
  assert.match(source, /Agent communication is crowded/i);
  assert.match(source, /Gareth final approval is required before any external use, publication, outreach, partner sharing, commercial activation, deployment, billing, payment, or settlement/i);
  assert.doesNotMatch(source, /https?:\/\/|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|0x[a-fA-F0-9]{20,}/i);
  assert.doesNotMatch(source, /\bG-[A-Z0-9]{10}\b|\bUA-\d{4,}-\d+\b/);
});
