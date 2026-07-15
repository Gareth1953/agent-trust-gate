import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import {
  createClearingIntegritySnapshot,
  createClearingIntegritySnapshotId,
  renderClearingIntegritySnapshotMarkdown,
  summariseClearingIntegritySnapshot,
  type ClearingIntegritySnapshotInput,
} from "../src/index.js";

const paths = {
  doc: resolve("docs/clearing-integrity-snapshot.md"),
  config: resolve("config/clearing-integrity-snapshot-safety.json"),
  input: resolve("examples/clearing-integrity-snapshot-input-draft.json"),
  output: resolve("examples/clearing-integrity-snapshot-output-local.json"),
  summary: resolve("examples/clearing-integrity-snapshot-summary.json"),
  markdown: resolve("examples/clearing-integrity-snapshot-markdown.md"),
  mismatch: resolve("examples/clearing-integrity-snapshot-mismatch-detected.json"),
  rejected: resolve("examples/clearing-integrity-snapshot-private-data-rejected.json"),
  blocked: resolve("examples/clearing-integrity-snapshot-live-monitoring-blocked.json"),
};
const priorTests = [
  "agent-to-agent-trust-handshake", "refusalgraph-core", "agent-clearing-house-foundation",
  "refusalgraph-signal-engine", "refusalgraph-query-engine", "agent-clearing-decision-engine",
  "agent-clearing-receipt-engine", "unique-advantage-radar", "receipt-verification-readiness",
  "fee-metering-readiness", "agent-clearing-pipeline-demo", "agent-clearing-demo-cli",
  "agent-clearing-demo-report", "agent-clearing-public-demo-narrative",
  "agent-clearing-investor-partner-brief", "local-clearing-ledger",
  "refusalgraph-local-signal-store", "batch-agent-clearing-runner",
  "receipt-verification-cli", "fee-metering-ledger", "clearing-evidence-bundle",
  "clearing-replay-runner",
].map((name) => resolve(`test/${name}.test.ts`));
const snapshotKeys = [
  "snapshot_id", "snapshot_type", "source_id", "batch_id", "pipeline_id",
  "clearing_ledger_summary", "refusalgraph_signal_store_summary",
  "evidence_bundle_summary", "replay_summary", "receipt_verification_summary",
  "fee_metering_summary", "batch_clearing_summary", "total_clearing_records",
  "total_refusalgraph_signals", "total_evidence_bundles", "total_replay_runs",
  "total_receipt_verifications", "total_fee_placeholders", "blocked_count",
  "approval_required_count", "allowed_count", "high_caution_count",
  "critical_caution_count", "replay_consistent_count", "replay_mismatch_count",
  "verification_passed_count", "verification_failed_count",
  "fee_billable_if_live_count", "integrity_status", "integrity_score",
  "integrity_summary", "safety_summary", "recommended_next_steps",
  "private_data_included", "network_lookup_performed", "external_lookup_performed",
  "tracking_triggered", "analytics_triggered", "payment_or_fee_triggered",
  "billing_triggered", "settlement_triggered", "machine_to_machine_fee_triggered",
  "action_executed", "published", "status", "created_at",
].sort();

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8")) as unknown;
}
function normaliseNewlines(value: string): string {
  return value.replace(/\r\n/g, "\n");
}
function input(): ClearingIntegritySnapshotInput {
  return readJson(paths.input) as ClearingIntegritySnapshotInput;
}
function mismatchInput(): ClearingIntegritySnapshotInput {
  const source = input();
  return {
    ...source,
    replay_summary: { ...source.replay_summary, consistent_count: 0, mismatch_count: 1, safety_flag_mismatch_count: 1 },
    receipt_verification_summary: { ...source.receipt_verification_summary, passed_count: 0, failed_count: 1 },
    evidence_bundle_summary: { ...source.evidence_bundle_summary, incomplete_count: 1, missing_receipt_count: 1 },
  };
}
function assertNoEnabledFlags(value: unknown, path = "root"): void {
  if (Array.isArray(value)) return value.forEach((item, index) => assertNoEnabledFlags(item, `${path}[${index}]`));
  if (typeof value !== "object" || value === null) return;
  for (const [key, item] of Object.entries(value)) {
    if (key.endsWith("_enabled")) assert.equal(item, false, `${path}.${key}`);
    assertNoEnabledFlags(item, `${path}.${key}`);
  }
}

test("integrity snapshot files exist and all prior infrastructure tests remain present", () => {
  for (const path of [...Object.values(paths), ...priorTests]) assert.equal(existsSync(path), true, path);
});

test("createClearingIntegritySnapshot creates exact tracked local snapshot", () => {
  const snapshot = createClearingIntegritySnapshot(input());
  assert.deepEqual(snapshot, readJson(paths.output));
  assert.deepEqual(Object.keys(snapshot).sort(), snapshotKeys);
  assert.equal(snapshot.integrity_score, 100);
  assert.equal(snapshot.integrity_status, "consistent");
});

test("snapshot normalizes every local subsystem summary and key totals", () => {
  const snapshot = createClearingIntegritySnapshot(input());
  assert.equal(snapshot.clearing_ledger_summary.total_records, 5);
  assert.equal(snapshot.refusalgraph_signal_store_summary.total_signals, 5);
  assert.equal(snapshot.evidence_bundle_summary.total_bundles, 1);
  assert.equal(snapshot.replay_summary.total_runs, 1);
  assert.equal(snapshot.receipt_verification_summary.total_verifications, 1);
  assert.equal(snapshot.fee_metering_summary.total_events, 7);
  assert.equal(snapshot.batch_clearing_summary.total_requests, 4);
  assert.equal(snapshot.total_clearing_records, 5);
  assert.equal(snapshot.total_refusalgraph_signals, 5);
  assert.equal(snapshot.total_evidence_bundles, 1);
  assert.equal(snapshot.total_replay_runs, 1);
  assert.equal(snapshot.total_receipt_verifications, 1);
  assert.equal(snapshot.total_fee_placeholders, 7);
  assert.equal(snapshot.replay_consistent_count, 1);
  assert.equal(snapshot.replay_mismatch_count, 0);
  assert.equal(snapshot.verification_passed_count, 1);
  assert.equal(snapshot.verification_failed_count, 0);
  assert.equal(snapshot.fee_billable_if_live_count, 3);
});

test("mismatch fixture lowers deterministic score and status", () => {
  const snapshot = createClearingIntegritySnapshot(mismatchInput());
  assert.deepEqual(snapshot, readJson(paths.mismatch));
  assert.equal(snapshot.integrity_score, 25);
  assert.equal(snapshot.integrity_status, "mismatch_detected");
  assert.equal(snapshot.replay_mismatch_count, 1);
  assert.equal(snapshot.verification_failed_count, 1);
  assert.deepEqual(snapshot.recommended_next_steps, [
    "complete_local_evidence", "do_not_execute", "keep_local_only",
    "require_human_approval", "review_replay_mismatches",
    "review_verification_failures",
  ]);
});

test("each documented integrity penalty is deterministic and local", () => {
  const source = input();
  const cases: Array<[Partial<ClearingIntegritySnapshotInput>, number]> = [
    [{ replay_summary: { ...source.replay_summary, mismatch_count: 1 } }, 85],
    [{ receipt_verification_summary: { ...source.receipt_verification_summary, failed_count: 1 } }, 80],
    [{ evidence_bundle_summary: { ...source.evidence_bundle_summary, incomplete_count: 1 } }, 90],
    [{ evidence_bundle_summary: { ...source.evidence_bundle_summary, missing_receipt_count: 1 } }, 90],
    [{ replay_summary: { ...source.replay_summary, safety_flag_mismatch_count: 1 } }, 80],
  ];
  for (const [override, expected] of cases) {
    assert.equal(createClearingIntegritySnapshot({ ...source, ...override }).integrity_score, expected);
  }
  assert.equal(createClearingIntegritySnapshot(source).integrity_score, 100);
});

test("empty and unknown input fails into unknown local snapshot", () => {
  const snapshot = createClearingIntegritySnapshot({
    snapshot_type: "PRIVATE_UNKNOWN_TYPE",
    source_id: "unknown-source",
    created_at: "invalid",
  });
  assert.equal(snapshot.snapshot_type, "unknown_local_snapshot");
  assert.equal(snapshot.integrity_score, 0);
  assert.equal(snapshot.integrity_status, "unknown");
  assert.equal(snapshot.total_clearing_records, 0);
  assert.equal(snapshot.created_at, "unknown");
  assert.doesNotMatch(JSON.stringify(snapshot), /PRIVATE_/);
});

test("snapshot ID is deterministic and contains no private source identifier", () => {
  const marker = "PRIVATE_SNAPSHOT_SOURCE_MUST_NOT_COPY";
  const id = createClearingIntegritySnapshotId(marker);
  assert.equal(id, createClearingIntegritySnapshotId(marker));
  assert.match(id, /^clearing_integrity_snapshot_[a-f0-9]{24}$/);
  assert.doesNotMatch(id, new RegExp(marker));
});

test("snapshot summary matches tracked safe aggregate", () => {
  const summary = summariseClearingIntegritySnapshot(createClearingIntegritySnapshot(input()));
  assert.deepEqual(summary, readJson(paths.summary));
  assert.equal(summary.integrity_status, "consistent");
  assert.equal(summary.integrity_score, 100);
  for (const field of ["private_data_included", "network_lookup_performed", "external_lookup_performed", "tracking_triggered", "analytics_triggered", "payment_or_fee_triggered", "billing_triggered", "settlement_triggered", "machine_to_machine_fee_triggered", "action_executed", "published"] as const) assert.equal(summary[field], false, field);
});

test("Markdown renderer matches tracked local non-certifying snapshot", () => {
  const markdown = renderClearingIntegritySnapshotMarkdown(createClearingIntegritySnapshot(input()));
  assert.equal(normaliseNewlines(markdown), normaliseNewlines(readFileSync(paths.markdown, "utf8").trimEnd()));
  for (const heading of ["# Clearing Integrity Snapshot", "## Integrity Status", "## Clearing Ledger Summary", "## RefusalGraph Summary", "## Evidence Bundle Summary", "## Replay Summary", "## Receipt Verification Summary", "## Fee Metering Placeholder Summary", "## Safety Status"]) assert.match(markdown, new RegExp(heading));
  assert.match(markdown, /local-only and draft-only/i);
  assert.match(markdown, /No live monitoring occurred/i);
  assert.match(markdown, /No action was executed/i);
  assert.match(markdown, /No network lookup was performed/i);
  assert.match(markdown, /No billing, payment, settlement/i);
  assert.doesNotMatch(markdown, /compliance certified|audit certified|is legal evidence/i);
});

test("private fields and arbitrary values never enter snapshot, summary, or Markdown", () => {
  const marker = "PRIVATE_INTEGRITY_VALUE_MUST_NOT_COPY";
  const source: ClearingIntegritySnapshotInput = {
    ...input(),
    source_id: marker,
    pipeline_id: marker,
    batch_id: marker,
    clearing_ledger_summary: {
      ...input().clearing_ledger_summary,
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
    },
    customer_name: marker,
    api_key: marker,
  };
  const snapshot = createClearingIntegritySnapshot(source);
  const summary = summariseClearingIntegritySnapshot(snapshot);
  const markdown = renderClearingIntegritySnapshotMarkdown(snapshot);
  assert.doesNotMatch(JSON.stringify(snapshot), new RegExp(marker));
  assert.doesNotMatch(JSON.stringify(summary), new RegExp(marker));
  assert.doesNotMatch(markdown, new RegExp(marker));
});

test("snapshot and safety summary force all operational fields false", () => {
  const snapshot = createClearingIntegritySnapshot(mismatchInput());
  for (const field of ["private_data_included", "network_lookup_performed", "external_lookup_performed", "tracking_triggered", "analytics_triggered", "payment_or_fee_triggered", "billing_triggered", "settlement_triggered", "machine_to_machine_fee_triggered", "action_executed", "published"] as const) assert.equal(snapshot[field], false, field);
  assert.equal(snapshot.safety_summary.live_monitoring_performed, false);
  assert.equal(snapshot.safety_summary.legal_evidence, false);
  assert.equal(snapshot.safety_summary.compliance_certification, false);
  assert.equal(snapshot.safety_summary.live_audit_performed, false);
  assert.equal(snapshot.safety_summary.blockchain_proof_performed, false);
});

test("integrity safety config disables monitoring, proof, network, commerce, and execution", () => {
  const config = readJson(paths.config) as Record<string, unknown>;
  assert.equal(config.status, "draft_only");
  assert.equal(config.version, "0.1.0");
  assertNoEnabledFlags(config);
  assertNoEnabledFlags(readJson(paths.blocked));
  for (const requirement of ["requires_human_approval", "requires_gareth_final_approval", "requires_technical_validation", "requires_security_review", "requires_privacy_review", "requires_legal_review", "requires_commercial_validation", "requires_audit_review", "requires_publication_approval"]) assert.equal(config[requirement], true, requirement);
});

test("integrity docs and examples contain no private or live identifiers", () => {
  const source = Object.values(paths).map((path) => readFileSync(path, "utf8")).join("\n");
  assert.match(source, /not live monitoring/i);
  assert.match(source, /Gareth final approval/i);
  assert.doesNotMatch(source, /https?:\/\/|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|0x[a-fA-F0-9]{20,}/i);
  for (const marker of ["customer_name", "customer_email", "company_name", "bank_account", "card_number", "wallet_address", "api_key", "access_token", "private_document_text", "invoice_number", "contract_text", "real_agent_endpoint", "real_url", "real_email_content"]) {
    assert.doesNotMatch(JSON.stringify(readJson(paths.output)), new RegExp(marker));
    assert.doesNotMatch(JSON.stringify(readJson(paths.summary)), new RegExp(marker));
    assert.doesNotMatch(readFileSync(paths.markdown, "utf8"), new RegExp(marker));
  }
});
