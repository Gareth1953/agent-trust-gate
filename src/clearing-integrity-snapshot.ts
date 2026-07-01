import { createHash } from "node:crypto";

export const CLEARING_INTEGRITY_SNAPSHOT_VERSION = "atg.clearing-integrity-snapshot.v1" as const;

export type ClearingIntegritySnapshotType =
  | "local_clearing_integrity_snapshot" | "batch_integrity_snapshot"
  | "replay_integrity_snapshot" | "evidence_integrity_snapshot"
  | "unknown_local_snapshot";
export type ClearingIntegrityStatus =
  | "local_only" | "draft_only" | "consistent" | "caution"
  | "mismatch_detected" | "incomplete" | "unknown";

export interface ClearingIntegritySnapshotInput {
  [key: string]: unknown;
  snapshot_type: string;
  source_id: string;
  batch_id?: string | null;
  pipeline_id?: string | null;
  clearing_ledger_summary?: Record<string, unknown>;
  refusalgraph_signal_store_summary?: Record<string, unknown>;
  evidence_bundle_summary?: Record<string, unknown>;
  replay_summary?: Record<string, unknown>;
  receipt_verification_summary?: Record<string, unknown>;
  fee_metering_summary?: Record<string, unknown>;
  batch_clearing_summary?: Record<string, unknown>;
  created_at: string;
}

export interface ClearingIntegrityCountSummary {
  [key: string]: number | string;
  status: string;
}

export interface ClearingIntegritySafetySummary {
  local_snapshot_only: true;
  live_monitoring_performed: false;
  legal_evidence: false;
  compliance_certification: false;
  live_audit_performed: false;
  blockchain_proof_performed: false;
  private_data_included: false;
  network_lookup_performed: false;
  external_lookup_performed: false;
  tracking_triggered: false;
  analytics_triggered: false;
  payment_or_fee_triggered: false;
  billing_triggered: false;
  settlement_triggered: false;
  machine_to_machine_fee_triggered: false;
  action_executed: false;
  published: false;
}

export interface ClearingIntegritySnapshot {
  snapshot_id: string;
  snapshot_type: ClearingIntegritySnapshotType;
  source_id: string;
  batch_id: string | null;
  pipeline_id: string | null;
  clearing_ledger_summary: ClearingIntegrityCountSummary;
  refusalgraph_signal_store_summary: ClearingIntegrityCountSummary;
  evidence_bundle_summary: ClearingIntegrityCountSummary;
  replay_summary: ClearingIntegrityCountSummary;
  receipt_verification_summary: ClearingIntegrityCountSummary;
  fee_metering_summary: ClearingIntegrityCountSummary;
  batch_clearing_summary: ClearingIntegrityCountSummary;
  total_clearing_records: number;
  total_refusalgraph_signals: number;
  total_evidence_bundles: number;
  total_replay_runs: number;
  total_receipt_verifications: number;
  total_fee_placeholders: number;
  blocked_count: number;
  approval_required_count: number;
  allowed_count: number;
  high_caution_count: number;
  critical_caution_count: number;
  replay_consistent_count: number;
  replay_mismatch_count: number;
  verification_passed_count: number;
  verification_failed_count: number;
  fee_billable_if_live_count: number;
  integrity_status: ClearingIntegrityStatus;
  integrity_score: number;
  integrity_summary: string;
  safety_summary: ClearingIntegritySafetySummary;
  recommended_next_steps: string[];
  private_data_included: false;
  network_lookup_performed: false;
  external_lookup_performed: false;
  tracking_triggered: false;
  analytics_triggered: false;
  payment_or_fee_triggered: false;
  billing_triggered: false;
  settlement_triggered: false;
  machine_to_machine_fee_triggered: false;
  action_executed: false;
  published: false;
  status: "draft_only";
  created_at: string;
}

export interface ClearingIntegritySnapshotSummary {
  snapshot_id: string;
  snapshot_type: ClearingIntegritySnapshotType;
  integrity_status: ClearingIntegrityStatus;
  integrity_score: number;
  total_clearing_records: number;
  total_refusalgraph_signals: number;
  total_evidence_bundles: number;
  total_replay_runs: number;
  total_receipt_verifications: number;
  total_fee_placeholders: number;
  replay_consistent_count: number;
  replay_mismatch_count: number;
  verification_passed_count: number;
  verification_failed_count: number;
  fee_billable_if_live_count: number;
  private_data_included: false;
  network_lookup_performed: false;
  external_lookup_performed: false;
  tracking_triggered: false;
  analytics_triggered: false;
  payment_or_fee_triggered: false;
  billing_triggered: false;
  settlement_triggered: false;
  machine_to_machine_fee_triggered: false;
  action_executed: false;
  published: false;
  status: "draft_only";
}

const SNAPSHOT_TYPES = new Set<ClearingIntegritySnapshotType>([
  "local_clearing_integrity_snapshot", "batch_integrity_snapshot",
  "replay_integrity_snapshot", "evidence_integrity_snapshot",
  "unknown_local_snapshot",
]);

export function createClearingIntegritySnapshot(
  input: ClearingIntegritySnapshotInput,
): ClearingIntegritySnapshot {
  const ledger = normalizeSummary(input.clearing_ledger_summary, [
    "total_records", "blocked_count", "approval_required_count", "allowed_count",
    "high_caution_count", "critical_caution_count", "receipts_created_count",
    "verifications_completed_count", "fee_placeholders_count",
  ]);
  const refusalgraph = normalizeSummary(input.refusalgraph_signal_store_summary, [
    "total_signals", "approval_required_count", "action_blocked_count",
    "high_caution_count", "critical_caution_count",
  ]);
  const evidence = normalizeSummary(input.evidence_bundle_summary, [
    "total_bundles", "incomplete_count", "missing_receipt_count",
    "approval_required_count", "blocked_count",
  ]);
  const replay = normalizeSummary(input.replay_summary, [
    "total_runs", "consistent_count", "mismatch_count", "incomplete_count",
    "safety_flag_mismatch_count",
  ]);
  const verification = normalizeSummary(input.receipt_verification_summary, [
    "total_verifications", "passed_count", "failed_count",
  ]);
  const fees = normalizeSummary(input.fee_metering_summary, [
    "total_events", "billable_if_live_count", "blocked_count",
  ]);
  const batch = normalizeSummary(input.batch_clearing_summary, [
    "total_requests", "completed_count", "allowed_count", "blocked_count",
    "approval_required_count", "high_caution_count", "critical_caution_count",
    "receipts_created_count", "verifications_completed_count",
    "fee_placeholders_count",
  ]);
  const totals = {
    total_clearing_records: count(ledger, "total_records"),
    total_refusalgraph_signals: count(refusalgraph, "total_signals"),
    total_evidence_bundles: count(evidence, "total_bundles"),
    total_replay_runs: count(replay, "total_runs"),
    total_receipt_verifications: count(verification, "total_verifications"),
    total_fee_placeholders: count(fees, "total_events"),
    blocked_count: count(ledger, "blocked_count") + count(batch, "blocked_count"),
    approval_required_count: count(ledger, "approval_required_count")
      + count(batch, "approval_required_count"),
    allowed_count: count(ledger, "allowed_count") + count(batch, "allowed_count"),
    high_caution_count: count(ledger, "high_caution_count")
      + count(refusalgraph, "high_caution_count") + count(batch, "high_caution_count"),
    critical_caution_count: count(ledger, "critical_caution_count")
      + count(refusalgraph, "critical_caution_count") + count(batch, "critical_caution_count"),
    replay_consistent_count: count(replay, "consistent_count"),
    replay_mismatch_count: count(replay, "mismatch_count"),
    verification_passed_count: count(verification, "passed_count"),
    verification_failed_count: count(verification, "failed_count"),
    fee_billable_if_live_count: count(fees, "billable_if_live_count"),
  };
  const penalties = {
    replay_mismatches: totals.replay_mismatch_count,
    verification_failures: totals.verification_failed_count,
    incomplete_evidence: count(evidence, "incomplete_count"),
    missing_receipts: count(evidence, "missing_receipt_count"),
    safety_flag_mismatches: count(replay, "safety_flag_mismatch_count"),
  };
  const dataCount = totals.total_clearing_records + totals.total_refusalgraph_signals
    + totals.total_evidence_bundles + totals.total_replay_runs
    + totals.total_receipt_verifications + totals.total_fee_placeholders;
  const integrityScore = scoreIntegrity(dataCount, penalties);
  const integrityStatus = selectIntegrityStatus(dataCount, integrityScore, penalties);
  return {
    snapshot_id: createClearingIntegritySnapshotId(input.source_id),
    snapshot_type: safeSnapshotType(input.snapshot_type),
    source_id: safeReference("source", input.source_id),
    batch_id: optionalReference("batch", input.batch_id),
    pipeline_id: optionalReference("pipeline", input.pipeline_id),
    clearing_ledger_summary: ledger,
    refusalgraph_signal_store_summary: refusalgraph,
    evidence_bundle_summary: evidence,
    replay_summary: replay,
    receipt_verification_summary: verification,
    fee_metering_summary: fees,
    batch_clearing_summary: batch,
    ...totals,
    integrity_status: integrityStatus,
    integrity_score: integrityScore,
    integrity_summary: createIntegritySummary(integrityStatus, integrityScore, totals, penalties),
    safety_summary: createSafetySummary(),
    recommended_next_steps: nextSteps(integrityStatus, penalties),
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
    status: "draft_only",
    created_at: safeTimestamp(input.created_at),
  };
}

export function createClearingIntegritySnapshotId(sourceId: string): string {
  const digest = createHash("sha256").update(sourceId, "utf8").digest("hex");
  return "clearing_integrity_snapshot_" + digest.slice(0, 24);
}

export function summariseClearingIntegritySnapshot(
  snapshot: ClearingIntegritySnapshot,
): ClearingIntegritySnapshotSummary {
  return {
    snapshot_id: snapshot.snapshot_id,
    snapshot_type: snapshot.snapshot_type,
    integrity_status: snapshot.integrity_status,
    integrity_score: snapshot.integrity_score,
    total_clearing_records: snapshot.total_clearing_records,
    total_refusalgraph_signals: snapshot.total_refusalgraph_signals,
    total_evidence_bundles: snapshot.total_evidence_bundles,
    total_replay_runs: snapshot.total_replay_runs,
    total_receipt_verifications: snapshot.total_receipt_verifications,
    total_fee_placeholders: snapshot.total_fee_placeholders,
    replay_consistent_count: snapshot.replay_consistent_count,
    replay_mismatch_count: snapshot.replay_mismatch_count,
    verification_passed_count: snapshot.verification_passed_count,
    verification_failed_count: snapshot.verification_failed_count,
    fee_billable_if_live_count: snapshot.fee_billable_if_live_count,
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
    status: "draft_only",
  };
}

export function renderClearingIntegritySnapshotMarkdown(
  snapshot: ClearingIntegritySnapshot,
): string {
  return [
    "# Clearing Integrity Snapshot", "", "Status: local-only and draft-only",
    "Snapshot ID: " + snapshot.snapshot_id, "Type: " + snapshot.snapshot_type, "",
    "## Snapshot Source", "", "Source reference: " + snapshot.source_id,
    "Pipeline reference: " + (snapshot.pipeline_id ?? "not_present"),
    "Batch reference: " + (snapshot.batch_id ?? "not_present"), "",
    "## Integrity Status", "", "Integrity status: " + snapshot.integrity_status,
    "Local demo integrity score: " + snapshot.integrity_score,
    snapshot.integrity_summary, "", "## Clearing Ledger Summary", "",
    "Records: " + snapshot.total_clearing_records,
    "Blocked: " + snapshot.blocked_count,
    "Approval required: " + snapshot.approval_required_count,
    "Allowed: " + snapshot.allowed_count, "", "## RefusalGraph Summary", "",
    "Signals: " + snapshot.total_refusalgraph_signals,
    "High caution: " + snapshot.high_caution_count,
    "Critical caution: " + snapshot.critical_caution_count, "",
    "## Evidence Bundle Summary", "", "Bundles: " + snapshot.total_evidence_bundles,
    "Incomplete: " + count(snapshot.evidence_bundle_summary, "incomplete_count"), "",
    "## Replay Summary", "", "Runs: " + snapshot.total_replay_runs,
    "Consistent: " + snapshot.replay_consistent_count,
    "Mismatches: " + snapshot.replay_mismatch_count, "",
    "## Receipt Verification Summary", "",
    "Verifications: " + snapshot.total_receipt_verifications,
    "Passed: " + snapshot.verification_passed_count,
    "Failed: " + snapshot.verification_failed_count, "",
    "## Fee Metering Placeholder Summary", "",
    "Placeholder events: " + snapshot.total_fee_placeholders,
    "Billable if live: " + snapshot.fee_billable_if_live_count, "",
    "## Safety Status", "",
    "This is a local demo indicator, not live monitoring, analytics, legal evidence, compliance certification, a live audit, public reporting, or network verification.",
    "No live monitoring occurred. No action was executed. No network lookup was performed.",
    "No billing, payment, settlement, tracking, analytics, publishing, or deployment occurred.",
    "", "## Recommended Next Steps", "",
    ...snapshot.recommended_next_steps.map((step) => "- " + step), "",
    "All live monitoring, external verification, publication, or commercial use requires Gareth final approval.",
  ].join("\n");
}

type Penalties = {
  replay_mismatches: number;
  verification_failures: number;
  incomplete_evidence: number;
  missing_receipts: number;
  safety_flag_mismatches: number;
};

function scoreIntegrity(dataCount: number, penalties: Penalties): number {
  if (dataCount === 0) return 0;
  const deduction = penalties.replay_mismatches * 15
    + penalties.verification_failures * 20
    + penalties.incomplete_evidence * 10
    + penalties.missing_receipts * 10
    + penalties.safety_flag_mismatches * 20;
  return Math.max(0, Math.min(100, 100 - deduction));
}

function selectIntegrityStatus(
  dataCount: number,
  score: number,
  penalties: Penalties,
): ClearingIntegrityStatus {
  if (dataCount === 0) return "unknown";
  if (score >= 90) return "consistent";
  if (score >= 70) return "caution";
  if (penalties.replay_mismatches > 0 || penalties.verification_failures > 0
    || penalties.safety_flag_mismatches > 0) return "mismatch_detected";
  return "incomplete";
}

function createIntegritySummary(
  status: ClearingIntegrityStatus,
  score: number,
  totals: {
    total_clearing_records: number;
    total_refusalgraph_signals: number;
    total_evidence_bundles: number;
    total_replay_runs: number;
    total_receipt_verifications: number;
    total_fee_placeholders: number;
  },
  penalties: Penalties,
): string {
  return "Local draft integrity snapshot status is " + status + " with score " + score
    + ". It summarises " + totals.total_clearing_records + " clearing records, "
    + totals.total_refusalgraph_signals + " RefusalGraph signals, "
    + totals.total_evidence_bundles + " evidence bundles, " + totals.total_replay_runs
    + " replay runs, " + totals.total_receipt_verifications + " receipt verifications, and "
    + totals.total_fee_placeholders + " fee placeholders. Penalties: "
    + (penalties.replay_mismatches + penalties.verification_failures
      + penalties.incomplete_evidence + penalties.missing_receipts
      + penalties.safety_flag_mismatches)
    + ". This is not a legal, compliance, audit, monitoring, or safety guarantee.";
}

function nextSteps(status: ClearingIntegrityStatus, penalties: Penalties): string[] {
  const steps = new Set<string>(["do_not_execute", "keep_local_only"]);
  if (penalties.replay_mismatches > 0 || penalties.safety_flag_mismatches > 0) {
    steps.add("review_replay_mismatches");
  }
  if (penalties.verification_failures > 0) steps.add("review_verification_failures");
  if (penalties.incomplete_evidence > 0 || penalties.missing_receipts > 0) {
    steps.add("complete_local_evidence");
  }
  if (status !== "consistent") steps.add("require_human_approval");
  return [...steps].sort();
}

function normalizeSummary(
  value: Record<string, unknown> | undefined,
  fields: readonly string[],
): ClearingIntegrityCountSummary {
  const output: ClearingIntegrityCountSummary = { status: "not_present" };
  if (value === undefined || value === null || Array.isArray(value)) {
    for (const field of fields) output[field] = 0;
    return output;
  }
  output.status = safeSummaryStatus(value.status);
  for (const field of fields) output[field] = safeCount(value[field]);
  return output;
}

function count(summary: ClearingIntegrityCountSummary, field: string): number {
  const value = summary[field];
  return typeof value === "number" ? value : 0;
}
function safeCount(value: unknown): number {
  return Number.isSafeInteger(value) && (value as number) >= 0
    ? Math.min(value as number, 1_000_000) : 0;
}
function safeSummaryStatus(value: unknown): string {
  if (typeof value !== "string") return "unknown";
  const token = safeToken(value);
  return new Set(["draft_only", "local_only", "placeholder_only", "not_present"])
    .has(token) ? token : "unknown";
}
function safeSnapshotType(value: string): ClearingIntegritySnapshotType {
  const token = safeToken(value) as ClearingIntegritySnapshotType;
  return SNAPSHOT_TYPES.has(token) ? token : "unknown_local_snapshot";
}
function createSafetySummary(): ClearingIntegritySafetySummary {
  return {
    local_snapshot_only: true,
    live_monitoring_performed: false,
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
  };
}
function optionalReference(kind: string, value: string | null | undefined): string | null {
  return typeof value !== "string" || value.trim() === "" ? null : safeReference(kind, value);
}
function safeReference(kind: string, value: string): string {
  const digest = createHash("sha256").update(value, "utf8").digest("hex");
  return kind + "_reference_" + digest.slice(0, 20);
}
function safeToken(value: string): string {
  return value.trim().replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 96);
}
function safeTimestamp(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "unknown" : date.toISOString();
}
