import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import {
  compareClearingReplayArtifacts,
  createClearingReplayRun,
  createClearingReplayRunId,
  renderClearingReplayRunMarkdown,
  summariseClearingReplayRun,
  type ClearingReplayRunInput,
} from "../src/index.js";

const paths = {
  doc: resolve("docs/clearing-replay-runner.md"),
  config: resolve("config/clearing-replay-runner-safety.json"),
  consistentInput: resolve("examples/clearing-replay-runner-input-consistent.json"),
  consistentOutput: resolve("examples/clearing-replay-runner-output-consistent.json"),
  mismatchInput: resolve("examples/clearing-replay-runner-input-mismatch.json"),
  mismatchOutput: resolve("examples/clearing-replay-runner-output-mismatch.json"),
  summary: resolve("examples/clearing-replay-runner-summary.json"),
  markdown: resolve("examples/clearing-replay-runner-markdown.md"),
  rejected: resolve("examples/clearing-replay-runner-private-data-rejected.json"),
  blocked: resolve("examples/clearing-replay-runner-live-audit-blocked.json"),
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
].map((name) => resolve(`test/${name}.test.ts`));
const replayKeys = [
  "replay_id", "replay_type", "source_id", "source_type", "pipeline_id", "batch_id",
  "bundle_id", "clearing_request_id", "clearing_decision_id", "clearing_receipt_id",
  "verification_id", "refusalgraph_query_id", "matched_signal_ids", "ledger_record_ids",
  "fee_metering_event_ids", "original_decision", "replayed_decision",
  "original_caution_level", "replayed_caution_level", "original_approval_required",
  "replayed_approval_required", "original_action_allowed", "replayed_action_allowed",
  "original_action_blocked", "replayed_action_blocked", "receipt_match",
  "verification_match", "refusalgraph_match", "ledger_match", "fee_metering_match",
  "safety_flags_match", "replay_consistent", "mismatch_reasons", "replay_status",
  "replay_summary", "safety_summary", "recommended_next_steps",
  "private_data_included", "network_lookup_performed", "external_lookup_performed",
  "tracking_triggered", "analytics_triggered", "payment_or_fee_triggered",
  "billing_triggered", "settlement_triggered", "machine_to_machine_fee_triggered",
  "action_executed", "published", "status", "created_at",
].sort();

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8")) as unknown;
}
function consistentInput(): ClearingReplayRunInput {
  return readJson(paths.consistentInput) as ClearingReplayRunInput;
}
function mismatchInput(): ClearingReplayRunInput {
  return readJson(paths.mismatchInput) as ClearingReplayRunInput;
}
function assertNoEnabledFlags(value: unknown, path = "root"): void {
  if (Array.isArray(value)) return value.forEach((item, index) => assertNoEnabledFlags(item, `${path}[${index}]`));
  if (typeof value !== "object" || value === null) return;
  for (const [key, item] of Object.entries(value)) {
    if (key.endsWith("_enabled")) assert.equal(item, false, `${path}.${key}`);
    assertNoEnabledFlags(item, `${path}.${key}`);
  }
}

test("clearing replay files exist and all prior infrastructure tests remain present", () => {
  for (const path of [...Object.values(paths), ...priorTests]) assert.equal(existsSync(path), true, path);
});

test("consistent replay creates the exact tracked safe result", () => {
  const replay = createClearingReplayRun(consistentInput());
  assert.deepEqual(replay, readJson(paths.consistentOutput));
  assert.deepEqual(Object.keys(replay).sort(), replayKeys);
  assert.equal(replay.replay_consistent, true);
  assert.equal(replay.replay_status, "replay_consistent");
  assert.deepEqual(replay.mismatch_reasons, []);
  for (const field of ["receipt_match", "verification_match", "refusalgraph_match", "ledger_match", "fee_metering_match", "safety_flags_match"] as const) assert.equal(replay[field], true, field);
});

test("mismatch replay creates exact safe mismatch reasons", () => {
  const replay = createClearingReplayRun(mismatchInput());
  assert.deepEqual(replay, readJson(paths.mismatchOutput));
  assert.equal(replay.replay_consistent, false);
  assert.equal(replay.replay_status, "replay_mismatch");
  assert.deepEqual(replay.mismatch_reasons, [
    "decision_mismatch", "caution_level_mismatch", "receipt_id_mismatch",
    "verification_result_mismatch", "refusalgraph_signal_ids_mismatch",
    "ledger_record_ids_mismatch", "fee_metering_event_ids_mismatch",
    "safety_flags_mismatch",
  ]);
});

test("comparison checks decision, caution, approval, and action fields independently", () => {
  const source = consistentInput();
  const changes = [
    ["decision", "keep_blocked", "decision_mismatch"],
    ["caution_level", "critical", "caution_level_mismatch"],
    ["approval_required", false, "approval_required_mismatch"],
    ["action_allowed", true, "action_allowed_mismatch"],
    ["action_blocked", false, "action_blocked_mismatch"],
  ] as const;
  for (const [field, value, reason] of changes) {
    const replayed = { ...source.replayed, [field]: value };
    const comparison = compareClearingReplayArtifacts({ ...source, replayed });
    assert.equal(comparison.replay_status, "replay_mismatch");
    assert.ok(comparison.mismatch_reasons.includes(reason), reason);
  }
});

test("comparison checks receipt, verification, RefusalGraph, ledger, fee, and safety fields", () => {
  const comparison = compareClearingReplayArtifacts(mismatchInput());
  assert.equal(comparison.receipt_match, false);
  assert.equal(comparison.verification_match, false);
  assert.equal(comparison.refusalgraph_match, false);
  assert.equal(comparison.ledger_match, false);
  assert.equal(comparison.fee_metering_match, false);
  assert.equal(comparison.safety_flags_match, false);
});

test("incomplete replay fails closed without guessing comparison values", () => {
  const source = consistentInput();
  const withoutOriginal = { ...source };
  delete withoutOriginal.original;
  const noOriginal = compareClearingReplayArtifacts(withoutOriginal);
  assert.equal(noOriginal.replay_status, "replay_incomplete");
  assert.equal(noOriginal.replay_consistent, false);
  assert.ok(noOriginal.mismatch_reasons.includes("original_artifact_incomplete"));
  const incompleteReplay = compareClearingReplayArtifacts({
    ...source,
    replayed: { decision: "require_human_approval" },
  });
  assert.equal(incompleteReplay.replay_status, "replay_incomplete");
  assert.ok(incompleteReplay.mismatch_reasons.includes("replayed_artifact_incomplete"));
});

test("unknown replay type and source values fail into safe local defaults", () => {
  const replay = createClearingReplayRun({
    ...consistentInput(),
    replay_type: "PRIVATE_REPLAY_TYPE",
    source_type: "PRIVATE_SOURCE_TYPE",
    created_at: "invalid",
  });
  assert.equal(replay.replay_type, "unknown_local_replay");
  assert.equal(replay.source_type, "unknown");
  assert.equal(replay.created_at, "unknown");
  assert.doesNotMatch(JSON.stringify(replay), /PRIVATE_/);
});

test("replay ID is deterministic and contains no private source identifier", () => {
  const marker = "PRIVATE_REPLAY_SOURCE_MUST_NOT_COPY";
  const id = createClearingReplayRunId(marker);
  assert.equal(id, createClearingReplayRunId(marker));
  assert.match(id, /^clearing_replay_[a-f0-9]{24}$/);
  assert.doesNotMatch(id, new RegExp(marker));
});

test("replay summary exactly reports mismatch and remains non-operational", () => {
  const summary = summariseClearingReplayRun(createClearingReplayRun(mismatchInput()));
  assert.deepEqual(summary, readJson(paths.summary));
  assert.equal(summary.replay_status, "replay_mismatch");
  assert.equal(summary.replay_consistent, false);
  assert.equal(summary.mismatch_count, 8);
  for (const field of ["private_data_included", "network_lookup_performed", "external_lookup_performed", "tracking_triggered", "analytics_triggered", "payment_or_fee_triggered", "billing_triggered", "settlement_triggered", "machine_to_machine_fee_triggered", "action_executed", "published"] as const) assert.equal(summary[field], false, field);
});

test("Markdown renderer matches tracked local non-certifying replay text", () => {
  const markdown = renderClearingReplayRunMarkdown(createClearingReplayRun(mismatchInput()));
  assert.equal(markdown, readFileSync(paths.markdown, "utf8").trimEnd());
  for (const heading of ["# Clearing Replay Run", "## Replay Result", "## Decision Match", "## Receipt Match", "## Verification Match", "## RefusalGraph Match", "## Ledger Match", "## Fee Metering Match", "## Safety Flags"]) assert.match(markdown, new RegExp(heading));
  assert.match(markdown, /local-only and draft-only/i);
  assert.match(markdown, /No action was re-executed/i);
  assert.match(markdown, /No network lookup was performed/i);
  assert.match(markdown, /No billing, payment, settlement/i);
  assert.match(markdown, /not a live audit, legal evidence, compliance certification/i);
  assert.doesNotMatch(markdown, /audit certified|compliance certified|is legal proof/i);
});

test("private fields and values never enter replay, summary, or Markdown", () => {
  const marker = "PRIVATE_REPLAY_VALUE_MUST_NOT_COPY";
  const source = consistentInput();
  const privateSnapshot = {
    ...source.original,
    clearing_receipt_id: marker,
    matched_signal_ids: [marker],
    ledger_record_ids: [marker],
    fee_metering_event_ids: [marker],
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
  const replay = createClearingReplayRun({
    ...source,
    source_id: marker,
    pipeline_id: marker,
    bundle_id: marker,
    original: privateSnapshot,
    replayed: privateSnapshot,
    customer_name: marker,
    api_key: marker,
  });
  const summary = summariseClearingReplayRun(replay);
  const markdown = renderClearingReplayRunMarkdown(replay);
  assert.doesNotMatch(JSON.stringify(replay), new RegExp(marker));
  assert.doesNotMatch(JSON.stringify(summary), new RegExp(marker));
  assert.doesNotMatch(markdown, new RegExp(marker));
});

test("replay output and safety summary force every operational field false", () => {
  const replay = createClearingReplayRun(mismatchInput());
  for (const field of ["private_data_included", "network_lookup_performed", "external_lookup_performed", "tracking_triggered", "analytics_triggered", "payment_or_fee_triggered", "billing_triggered", "settlement_triggered", "machine_to_machine_fee_triggered", "action_executed", "published"] as const) assert.equal(replay[field], false, field);
  assert.equal(replay.safety_summary.production_replay_performed, false);
  assert.equal(replay.safety_summary.action_reexecution_performed, false);
  assert.equal(replay.safety_summary.legal_evidence, false);
  assert.equal(replay.safety_summary.compliance_certification, false);
  assert.equal(replay.safety_summary.live_audit_performed, false);
});

test("replay safety config disables replay, audit, proof, network, commerce, and execution", () => {
  const config = readJson(paths.config) as Record<string, unknown>;
  assert.equal(config.status, "draft_only");
  assert.equal(config.version, "0.1.0");
  assertNoEnabledFlags(config);
  assertNoEnabledFlags(readJson(paths.blocked));
  for (const requirement of ["requires_human_approval", "requires_gareth_final_approval", "requires_technical_validation", "requires_security_review", "requires_privacy_review", "requires_legal_review", "requires_commercial_validation", "requires_audit_review", "requires_publication_approval"]) assert.equal(config[requirement], true, requirement);
});

test("replay docs and examples contain no private or live identifiers", () => {
  const source = Object.values(paths).map((path) => readFileSync(path, "utf8")).join("\n");
  assert.match(source, /does not rerun a production workflow or re-execute actions/i);
  assert.match(source, /Gareth final approval/i);
  assert.doesNotMatch(source, /https?:\/\/|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|0x[a-fA-F0-9]{20,}/i);
  for (const marker of ["customer_name", "customer_email", "company_name", "bank_account", "card_number", "wallet_address", "api_key", "access_token", "private_document_text", "invoice_number", "contract_text", "real_agent_endpoint", "real_url", "real_email_content"]) {
    assert.doesNotMatch(JSON.stringify(readJson(paths.consistentOutput)), new RegExp(marker));
    assert.doesNotMatch(JSON.stringify(readJson(paths.mismatchOutput)), new RegExp(marker));
    assert.doesNotMatch(readFileSync(paths.markdown, "utf8"), new RegExp(marker));
  }
});
