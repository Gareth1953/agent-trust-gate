import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import {
  createClearingEvidenceBundle,
  createClearingEvidenceBundleId,
  renderClearingEvidenceBundleMarkdown,
  summariseClearingEvidenceBundle,
  type ClearingEvidenceBundleInput,
} from "../src/index.js";

const paths = {
  doc: resolve("docs/clearing-evidence-bundle.md"),
  config: resolve("config/clearing-evidence-bundle-safety.json"),
  input: resolve("examples/clearing-evidence-bundle-input-draft.json"),
  output: resolve("examples/clearing-evidence-bundle-output-local.json"),
  summary: resolve("examples/clearing-evidence-bundle-summary.json"),
  markdown: resolve("examples/clearing-evidence-bundle-markdown.md"),
  rejected: resolve("examples/clearing-evidence-bundle-private-data-rejected.json"),
  blocked: resolve("examples/clearing-evidence-bundle-live-proof-blocked.json"),
};
const priorTests = [
  "agent-to-agent-trust-handshake", "refusalgraph-core", "agent-clearing-house-foundation",
  "refusalgraph-signal-engine", "refusalgraph-query-engine", "agent-clearing-decision-engine",
  "agent-clearing-receipt-engine", "unique-advantage-radar", "receipt-verification-readiness",
  "fee-metering-readiness", "agent-clearing-pipeline-demo", "agent-clearing-demo-cli",
  "agent-clearing-demo-report", "agent-clearing-public-demo-narrative",
  "agent-clearing-investor-partner-brief", "local-clearing-ledger",
  "refusalgraph-local-signal-store", "batch-agent-clearing-runner",
  "receipt-verification-cli", "fee-metering-ledger",
].map((name) => resolve(`test/${name}.test.ts`));
const bundleKeys = [
  "bundle_id", "bundle_type", "source_id", "pipeline_id", "batch_id",
  "clearing_request_id", "clearing_decision_id", "clearing_receipt_id",
  "verification_id", "refusalgraph_query_id", "matched_signal_ids",
  "ledger_record_ids", "fee_metering_event_ids", "report_id", "decision",
  "caution_level", "approval_required", "action_allowed", "action_blocked",
  "receipt_status", "verification_result", "verification_passed",
  "verification_failed", "fee_placeholder_count", "matched_signal_count",
  "evidence_status", "evidence_summary", "safety_summary",
  "recommended_next_steps", "private_data_included", "network_lookup_performed",
  "external_lookup_performed", "tracking_triggered", "analytics_triggered",
  "payment_or_fee_triggered", "billing_triggered", "settlement_triggered",
  "machine_to_machine_fee_triggered", "action_executed", "published", "status",
  "created_at",
].sort();

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8")) as unknown;
}
function normaliseNewlines(value: string): string {
  return value.replace(/\r\n/g, "\n");
}

function input(): ClearingEvidenceBundleInput {
  return readJson(paths.input) as ClearingEvidenceBundleInput;
}

function assertNoEnabledFlags(value: unknown, path = "root"): void {
  if (Array.isArray(value)) return value.forEach((item, index) => assertNoEnabledFlags(item, `${path}[${index}]`));
  if (typeof value !== "object" || value === null) return;
  for (const [key, item] of Object.entries(value)) {
    if (key.endsWith("_enabled")) assert.equal(item, false, `${path}.${key}`);
    assertNoEnabledFlags(item, `${path}.${key}`);
  }
}

test("clearing evidence files exist and all prior infrastructure tests remain present", () => {
  for (const path of [...Object.values(paths), ...priorTests]) assert.equal(existsSync(path), true, path);
});

test("createClearingEvidenceBundle creates the exact tracked local bundle", () => {
  const bundle = createClearingEvidenceBundle(input());
  assert.deepEqual(bundle, readJson(paths.output));
  assert.deepEqual(Object.keys(bundle).sort(), bundleKeys);
  assert.equal(bundle.bundle_type, "single_clearing_run");
  assert.equal(bundle.decision, "require_human_approval");
  assert.equal(bundle.caution_level, "high");
  assert.equal(bundle.approval_required, true);
  assert.equal(bundle.action_allowed, false);
  assert.equal(bundle.action_blocked, true);
  assert.equal(bundle.receipt_status, "draft_only");
  assert.equal(bundle.verification_result, "locally_valid");
  assert.equal(bundle.verification_passed, true);
  assert.equal(bundle.verification_failed, false);
});

test("bundle includes safe RefusalGraph, ledger, fee, report, receipt, and verification references", () => {
  const bundle = createClearingEvidenceBundle(input());
  assert.equal(bundle.matched_signal_ids.length, 2);
  assert.equal(bundle.ledger_record_ids.length, 7);
  assert.equal(bundle.fee_metering_event_ids.length, 2);
  assert.equal(bundle.matched_signal_count, 2);
  assert.equal(bundle.fee_placeholder_count, 2);
  assert.match(bundle.clearing_receipt_id ?? "", /^clearing_receipt_reference_[a-f0-9]{20}$/);
  assert.match(bundle.verification_id ?? "", /^verification_reference_[a-f0-9]{20}$/);
  assert.match(bundle.report_id ?? "", /^report_reference_[a-f0-9]{20}$/);
});

test("unknown bundle and evidence values fail into safe local defaults", () => {
  const bundle = createClearingEvidenceBundle({
    bundle_type: "PRIVATE_UNSUPPORTED_TYPE",
    source_id: "unknown-source",
    decision: "PRIVATE_DECISION",
    caution_level: "PRIVATE_CAUTION",
    receipt_status: "PRIVATE_RECEIPT_STATUS",
    verification_result: "PRIVATE_VERIFICATION",
    evidence_status: "PRIVATE_EVIDENCE",
    recommended_next_steps: ["PRIVATE_STEP"],
    created_at: "invalid",
  });
  assert.equal(bundle.bundle_type, "unknown_local_bundle");
  assert.equal(bundle.decision, "unknown");
  assert.equal(bundle.caution_level, "unknown");
  assert.equal(bundle.receipt_status, "not_present");
  assert.equal(bundle.verification_result, "not_present");
  assert.equal(bundle.evidence_status, "unknown");
  assert.deepEqual(bundle.recommended_next_steps, ["do_not_execute", "keep_local_only"]);
  assert.equal(bundle.created_at, "unknown");
  assert.doesNotMatch(JSON.stringify(bundle), /PRIVATE_/);
});

test("bundle ID is deterministic and contains no private source identifier", () => {
  const marker = "PRIVATE_EVIDENCE_SOURCE_MUST_NOT_COPY";
  const id = createClearingEvidenceBundleId(marker);
  assert.equal(id, createClearingEvidenceBundleId(marker));
  assert.match(id, /^clearing_evidence_bundle_[a-f0-9]{24}$/);
  assert.doesNotMatch(id, new RegExp(marker));
});

test("bundle and safety summary are strictly non-operational", () => {
  const bundle = createClearingEvidenceBundle(input());
  for (const field of ["private_data_included", "network_lookup_performed", "external_lookup_performed", "tracking_triggered", "analytics_triggered", "payment_or_fee_triggered", "billing_triggered", "settlement_triggered", "machine_to_machine_fee_triggered", "action_executed", "published"] as const) {
    assert.equal(bundle[field], false, field);
  }
  assert.deepEqual(bundle.safety_summary, {
    local_references_only: true,
    legal_evidence: false,
    compliance_certification: false,
    live_audit_performed: false,
    blockchain_proof_performed: false,
    private_data_included: false,
    network_lookup_performed: false,
    external_lookup_performed: false,
    tracking_triggered: false,
    analytics_triggered: false,
    payment_or_fee_triggered: false,
    billing_triggered: false,
    settlement_triggered: false,
    machine_to_machine_fee_triggered: false,
    action_executed: false,
    published: false,
  });
});

test("bundle summary exactly tracks evidence presence and safe counts", () => {
  const summary = summariseClearingEvidenceBundle(createClearingEvidenceBundle(input()));
  assert.deepEqual(summary, readJson(paths.summary));
  assert.equal(summary.receipt_present, true);
  assert.equal(summary.verification_present, true);
  assert.equal(summary.matched_signal_count, 2);
  assert.equal(summary.ledger_record_count, 7);
  assert.equal(summary.fee_metering_event_count, 2);
  for (const field of ["private_data_included", "network_lookup_performed", "external_lookup_performed", "tracking_triggered", "analytics_triggered", "payment_or_fee_triggered", "billing_triggered", "settlement_triggered", "machine_to_machine_fee_triggered", "action_executed", "published"] as const) {
    assert.equal(summary[field], false, field);
  }
});

test("Markdown renderer matches tracked safe local evidence text", () => {
  const markdown = renderClearingEvidenceBundleMarkdown(createClearingEvidenceBundle(input()));
  assert.equal(normaliseNewlines(markdown), normaliseNewlines(readFileSync(paths.markdown, "utf8").trimEnd()));
  for (const heading of ["# Clearing Evidence Bundle", "## Clearing Decision", "## RefusalGraph Evidence", "## Receipt Evidence", "## Verification Result", "## Fee Metering Placeholders", "## Safety Status"]) assert.match(markdown, new RegExp(heading));
  assert.match(markdown, /local-only and draft-only/i);
  assert.match(markdown, /No action was executed/i);
  assert.match(markdown, /No network lookup was performed/i);
  assert.match(markdown, /No billing, payment, settlement/i);
  assert.match(markdown, /not legal evidence, compliance certification/i);
  assert.doesNotMatch(markdown, /is legal evidence|is compliance certified|audit certified/i);
});

test("private data and arbitrary text never enter bundle, summary, or Markdown", () => {
  const marker = "PRIVATE_EVIDENCE_VALUE_MUST_NOT_COPY";
  const source: ClearingEvidenceBundleInput = {
    ...input(),
    source_id: marker,
    pipeline_id: marker,
    clearing_request_id: marker,
    clearing_decision_id: marker,
    clearing_receipt_id: marker,
    verification_id: marker,
    refusalgraph_query_id: marker,
    matched_signal_ids: [marker],
    ledger_record_ids: [marker],
    fee_metering_event_ids: [marker],
    report_id: marker,
    evidence_summary: marker,
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
  const bundle = createClearingEvidenceBundle(source);
  const summary = summariseClearingEvidenceBundle(bundle);
  const markdown = renderClearingEvidenceBundleMarkdown(bundle);
  assert.doesNotMatch(JSON.stringify(bundle), new RegExp(marker));
  assert.doesNotMatch(JSON.stringify(summary), new RegExp(marker));
  assert.doesNotMatch(markdown, new RegExp(marker));
});

test("evidence safety config disables audit, proof, network, commerce, and execution", () => {
  const config = readJson(paths.config) as Record<string, unknown>;
  assert.equal(config.status, "draft_only");
  assert.equal(config.version, "0.1.0");
  assertNoEnabledFlags(config);
  assertNoEnabledFlags(readJson(paths.blocked));
  for (const requirement of ["requires_human_approval", "requires_gareth_final_approval", "requires_technical_validation", "requires_security_review", "requires_privacy_review", "requires_legal_review", "requires_commercial_validation", "requires_audit_review", "requires_publication_approval"]) {
    assert.equal(config[requirement], true, requirement);
  }
});

test("evidence docs and examples contain no private or live identifiers", () => {
  const source = Object.values(paths).map((path) => readFileSync(path, "utf8")).join("\n");
  assert.match(source, /not legal evidence/i);
  assert.match(source, /Gareth final approval/i);
  assert.doesNotMatch(source, /https?:\/\/|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|0x[a-fA-F0-9]{20,}/i);
  for (const marker of ["customer_name", "customer_email", "company_name", "bank_account", "card_number", "wallet_address", "api_key", "access_token", "private_document_text", "invoice_number", "contract_text", "real_agent_endpoint", "real_url", "real_email_content"]) {
    assert.doesNotMatch(JSON.stringify(readJson(paths.output)), new RegExp(marker));
    assert.doesNotMatch(JSON.stringify(readJson(paths.summary)), new RegExp(marker));
    assert.doesNotMatch(readFileSync(paths.markdown, "utf8"), new RegExp(marker));
  }
});
