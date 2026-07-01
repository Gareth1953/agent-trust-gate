import { createHash } from "node:crypto";

export const CLEARING_REPLAY_RUNNER_VERSION = "atg.clearing-replay-runner.v1" as const;

export type ClearingReplayType =
  | "pipeline_result_replay" | "evidence_bundle_replay" | "batch_result_replay"
  | "receipt_verification_replay" | "unknown_local_replay";
export type ClearingReplayStatus =
  | "replay_consistent" | "replay_mismatch" | "replay_incomplete"
  | "draft_only" | "local_only" | "unknown";

export interface ClearingReplaySafetySnapshot {
  private_data_included?: boolean;
  network_lookup_performed?: boolean;
  external_lookup_performed?: boolean;
  tracking_triggered?: boolean;
  analytics_triggered?: boolean;
  payment_or_fee_triggered?: boolean;
  billing_triggered?: boolean;
  settlement_triggered?: boolean;
  machine_to_machine_fee_triggered?: boolean;
  action_executed?: boolean;
  published?: boolean;
}

export interface ClearingReplayArtifactSnapshot {
  [key: string]: unknown;
  decision?: string;
  caution_level?: string;
  approval_required?: boolean;
  action_allowed?: boolean;
  action_blocked?: boolean;
  clearing_receipt_id?: string;
  verification_result?: string;
  matched_signal_ids?: readonly string[];
  ledger_record_ids?: readonly string[];
  fee_metering_event_ids?: readonly string[];
  safety_flags?: ClearingReplaySafetySnapshot;
}

export interface ClearingReplayRunInput {
  [key: string]: unknown;
  replay_type: string;
  source_id: string;
  source_type?: string | null;
  pipeline_id?: string | null;
  batch_id?: string | null;
  bundle_id?: string | null;
  clearing_request_id?: string | null;
  clearing_decision_id?: string | null;
  verification_id?: string | null;
  refusalgraph_query_id?: string | null;
  original?: ClearingReplayArtifactSnapshot;
  replayed?: ClearingReplayArtifactSnapshot;
  created_at: string;
}

export interface ClearingReplayComparison {
  original_decision: string;
  replayed_decision: string;
  original_caution_level: string;
  replayed_caution_level: string;
  original_approval_required: boolean;
  replayed_approval_required: boolean;
  original_action_allowed: boolean;
  replayed_action_allowed: boolean;
  original_action_blocked: boolean;
  replayed_action_blocked: boolean;
  receipt_match: boolean;
  verification_match: boolean;
  refusalgraph_match: boolean;
  ledger_match: boolean;
  fee_metering_match: boolean;
  safety_flags_match: boolean;
  replay_consistent: boolean;
  mismatch_reasons: string[];
  replay_status: "replay_consistent" | "replay_mismatch" | "replay_incomplete";
}

export interface ClearingReplaySafetySummary {
  local_comparison_only: true;
  production_replay_performed: false;
  action_reexecution_performed: false;
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

export interface ClearingReplayRun extends ClearingReplayComparison {
  replay_id: string;
  replay_type: ClearingReplayType;
  source_id: string;
  source_type: string;
  pipeline_id: string | null;
  batch_id: string | null;
  bundle_id: string | null;
  clearing_request_id: string | null;
  clearing_decision_id: string | null;
  clearing_receipt_id: string | null;
  verification_id: string | null;
  refusalgraph_query_id: string | null;
  matched_signal_ids: string[];
  ledger_record_ids: string[];
  fee_metering_event_ids: string[];
  replay_summary: string;
  safety_summary: ClearingReplaySafetySummary;
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

export interface ClearingReplayRunSummary {
  replay_id: string;
  replay_type: ClearingReplayType;
  replay_status: ClearingReplayComparison["replay_status"];
  replay_consistent: boolean;
  mismatch_count: number;
  mismatch_reasons: string[];
  receipt_match: boolean;
  verification_match: boolean;
  refusalgraph_match: boolean;
  ledger_match: boolean;
  fee_metering_match: boolean;
  safety_flags_match: boolean;
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

const REPLAY_TYPES = new Set<ClearingReplayType>([
  "pipeline_result_replay", "evidence_bundle_replay", "batch_result_replay",
  "receipt_verification_replay", "unknown_local_replay",
]);
const DECISIONS = new Set([
  "accept_with_limits", "require_more_evidence", "require_human_approval",
  "require_identity_verification", "clarify_payment_intent", "cap_spend_limit",
  "refuse_transaction", "keep_blocked", "create_receipt_only",
  "draft_only_not_executed", "unknown",
]);
const CAUTIONS = new Set(["none", "low", "medium", "high", "critical", "unknown"]);
const VERIFICATIONS = new Set([
  "locally_valid", "locally_invalid", "missing_required_fields",
  "unsafe_flags_detected", "private_data_detected", "decision_link_missing",
  "draft_only_not_externally_verified", "not_present", "unknown",
]);
const SAFETY_FIELDS = [
  "private_data_included", "network_lookup_performed", "external_lookup_performed",
  "tracking_triggered", "analytics_triggered", "payment_or_fee_triggered",
  "billing_triggered", "settlement_triggered", "machine_to_machine_fee_triggered",
  "action_executed", "published",
] as const;

export function createClearingReplayRun(input: ClearingReplayRunInput): ClearingReplayRun {
  const comparison = compareClearingReplayArtifacts(input);
  const original = normalizeSnapshot(input.original);
  const replayed = normalizeSnapshot(input.replayed);
  const replayType = safeReplayType(input.replay_type);
  return {
    replay_id: createClearingReplayRunId(input.source_id),
    replay_type: replayType,
    source_id: safeReference("source", input.source_id),
    source_type: safeSourceType(input.source_type),
    pipeline_id: optionalReference("pipeline", input.pipeline_id),
    batch_id: optionalReference("batch", input.batch_id),
    bundle_id: optionalReference("bundle", input.bundle_id),
    clearing_request_id: optionalReference("clearing_request", input.clearing_request_id),
    clearing_decision_id: optionalReference("clearing_decision", input.clearing_decision_id),
    clearing_receipt_id: original?.clearing_receipt_id ?? replayed?.clearing_receipt_id ?? null,
    verification_id: optionalReference("verification", input.verification_id),
    refusalgraph_query_id: optionalReference("refusalgraph_query", input.refusalgraph_query_id),
    matched_signal_ids: original?.matched_signal_ids ?? replayed?.matched_signal_ids ?? [],
    ledger_record_ids: original?.ledger_record_ids ?? replayed?.ledger_record_ids ?? [],
    fee_metering_event_ids: original?.fee_metering_event_ids
      ?? replayed?.fee_metering_event_ids ?? [],
    ...comparison,
    replay_summary: createReplaySummary(replayType, comparison),
    safety_summary: createSafetySummary(),
    recommended_next_steps: replayNextSteps(comparison),
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

export function createClearingReplayRunId(sourceId: string): string {
  const digest = createHash("sha256").update(sourceId, "utf8").digest("hex");
  return "clearing_replay_" + digest.slice(0, 24);
}

export function compareClearingReplayArtifacts(
  input: ClearingReplayRunInput,
): ClearingReplayComparison {
  const original = normalizeSnapshot(input.original);
  const replayed = normalizeSnapshot(input.replayed);
  if (original === null || replayed === null) {
    return incompleteComparison(original, replayed);
  }
  const reasons: string[] = [];
  if (original.decision !== replayed.decision) reasons.push("decision_mismatch");
  if (original.caution_level !== replayed.caution_level) reasons.push("caution_level_mismatch");
  if (original.approval_required !== replayed.approval_required) reasons.push("approval_required_mismatch");
  if (original.action_allowed !== replayed.action_allowed) reasons.push("action_allowed_mismatch");
  if (original.action_blocked !== replayed.action_blocked) reasons.push("action_blocked_mismatch");
  const receiptMatch = original.clearing_receipt_id === replayed.clearing_receipt_id;
  if (!receiptMatch) reasons.push("receipt_id_mismatch");
  const verificationMatch = original.verification_result === replayed.verification_result;
  if (!verificationMatch) reasons.push("verification_result_mismatch");
  const refusalgraphMatch = arraysEqual(original.matched_signal_ids, replayed.matched_signal_ids);
  if (!refusalgraphMatch) reasons.push("refusalgraph_signal_ids_mismatch");
  const ledgerMatch = arraysEqual(original.ledger_record_ids, replayed.ledger_record_ids);
  if (!ledgerMatch) reasons.push("ledger_record_ids_mismatch");
  const feeMatch = arraysEqual(original.fee_metering_event_ids, replayed.fee_metering_event_ids);
  if (!feeMatch) reasons.push("fee_metering_event_ids_mismatch");
  const safetyMatch = original.safety_key === replayed.safety_key;
  if (!safetyMatch) reasons.push("safety_flags_mismatch");
  const consistent = reasons.length === 0;
  return {
    original_decision: original.decision,
    replayed_decision: replayed.decision,
    original_caution_level: original.caution_level,
    replayed_caution_level: replayed.caution_level,
    original_approval_required: original.approval_required,
    replayed_approval_required: replayed.approval_required,
    original_action_allowed: original.action_allowed,
    replayed_action_allowed: replayed.action_allowed,
    original_action_blocked: original.action_blocked,
    replayed_action_blocked: replayed.action_blocked,
    receipt_match: receiptMatch,
    verification_match: verificationMatch,
    refusalgraph_match: refusalgraphMatch,
    ledger_match: ledgerMatch,
    fee_metering_match: feeMatch,
    safety_flags_match: safetyMatch,
    replay_consistent: consistent,
    mismatch_reasons: reasons,
    replay_status: consistent ? "replay_consistent" : "replay_mismatch",
  };
}

export function summariseClearingReplayRun(run: ClearingReplayRun): ClearingReplayRunSummary {
  return {
    replay_id: run.replay_id,
    replay_type: run.replay_type,
    replay_status: run.replay_status,
    replay_consistent: run.replay_consistent,
    mismatch_count: run.mismatch_reasons.length,
    mismatch_reasons: [...run.mismatch_reasons],
    receipt_match: run.receipt_match,
    verification_match: run.verification_match,
    refusalgraph_match: run.refusalgraph_match,
    ledger_match: run.ledger_match,
    fee_metering_match: run.fee_metering_match,
    safety_flags_match: run.safety_flags_match,
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

export function renderClearingReplayRunMarkdown(run: ClearingReplayRun): string {
  const reasons = run.mismatch_reasons.length === 0
    ? ["- none"] : run.mismatch_reasons.map((reason) => "- " + reason);
  return [
    "# Clearing Replay Run", "", "Status: local-only and draft-only",
    "Replay ID: " + run.replay_id, "Replay type: " + run.replay_type, "",
    "## Source", "", "Source reference: " + run.source_id,
    "Pipeline reference: " + (run.pipeline_id ?? "not_present"),
    "Bundle reference: " + (run.bundle_id ?? "not_present"), "",
    "## Replay Result", "", "Replay status: " + run.replay_status,
    "Consistent: " + run.replay_consistent, "", "## Decision Match", "",
    "Original decision: " + run.original_decision,
    "Replayed decision: " + run.replayed_decision,
    "Original caution: " + run.original_caution_level,
    "Replayed caution: " + run.replayed_caution_level, "",
    "## Receipt Match", "", "Match: " + run.receipt_match, "",
    "## Verification Match", "", "Match: " + run.verification_match, "",
    "## RefusalGraph Match", "", "Match: " + run.refusalgraph_match, "",
    "## Ledger Match", "", "Match: " + run.ledger_match, "",
    "## Fee Metering Match", "", "Match: " + run.fee_metering_match, "",
    "## Safety Flags", "", "Match: " + run.safety_flags_match,
    "This is not a live audit, legal evidence, compliance certification, public proof, network verification, or blockchain proof.", "",
    "## Mismatch Reasons", "", ...reasons, "", "## Recommended Next Steps", "",
    ...run.recommended_next_steps.map((step) => "- " + step), "",
    "No action was re-executed. No network lookup was performed.",
    "No billing, payment, settlement, tracking, analytics, publishing, or deployment occurred.",
    "All production replay, external verification, publication, or commercial use requires Gareth final approval.",
  ].join("\n");
}

type NormalizedSnapshot = {
  decision: string;
  caution_level: string;
  approval_required: boolean;
  action_allowed: boolean;
  action_blocked: boolean;
  clearing_receipt_id: string;
  verification_result: string;
  matched_signal_ids: string[];
  ledger_record_ids: string[];
  fee_metering_event_ids: string[];
  safety_key: string;
};

function normalizeSnapshot(
  snapshot: ClearingReplayArtifactSnapshot | undefined,
): NormalizedSnapshot | null {
  if (snapshot === undefined
    || typeof snapshot.decision !== "string"
    || typeof snapshot.caution_level !== "string"
    || typeof snapshot.approval_required !== "boolean"
    || typeof snapshot.action_allowed !== "boolean"
    || typeof snapshot.action_blocked !== "boolean"
    || typeof snapshot.clearing_receipt_id !== "string"
    || typeof snapshot.verification_result !== "string"
    || !Array.isArray(snapshot.matched_signal_ids)
    || !Array.isArray(snapshot.ledger_record_ids)
    || !Array.isArray(snapshot.fee_metering_event_ids)) return null;
  const safety = normalizeSafety(snapshot.safety_flags);
  if (safety === null) return null;
  return {
    decision: safeEnum(snapshot.decision, DECISIONS, "unknown"),
    caution_level: safeEnum(snapshot.caution_level, CAUTIONS, "unknown"),
    approval_required: snapshot.approval_required,
    action_allowed: snapshot.action_allowed,
    action_blocked: snapshot.action_blocked,
    clearing_receipt_id: safeReference("clearing_receipt", snapshot.clearing_receipt_id),
    verification_result: safeEnum(snapshot.verification_result, VERIFICATIONS, "unknown"),
    matched_signal_ids: safeReferenceList("signal", snapshot.matched_signal_ids),
    ledger_record_ids: safeReferenceList("ledger_record", snapshot.ledger_record_ids),
    fee_metering_event_ids: safeReferenceList("fee_event", snapshot.fee_metering_event_ids),
    safety_key: JSON.stringify(safety),
  };
}

function normalizeSafety(snapshot: ClearingReplaySafetySnapshot | undefined): boolean[] | null {
  if (snapshot === undefined) return null;
  const values: boolean[] = [];
  for (const field of SAFETY_FIELDS) {
    if (typeof snapshot[field] !== "boolean") return null;
    values.push(snapshot[field]);
  }
  return values;
}

function incompleteComparison(
  original: NormalizedSnapshot | null,
  replayed: NormalizedSnapshot | null,
): ClearingReplayComparison {
  const reasons = [
    ...(original === null ? ["original_artifact_incomplete"] : []),
    ...(replayed === null ? ["replayed_artifact_incomplete"] : []),
  ];
  return {
    original_decision: original?.decision ?? "unknown",
    replayed_decision: replayed?.decision ?? "unknown",
    original_caution_level: original?.caution_level ?? "unknown",
    replayed_caution_level: replayed?.caution_level ?? "unknown",
    original_approval_required: original?.approval_required ?? false,
    replayed_approval_required: replayed?.approval_required ?? false,
    original_action_allowed: original?.action_allowed ?? false,
    replayed_action_allowed: replayed?.action_allowed ?? false,
    original_action_blocked: original?.action_blocked ?? true,
    replayed_action_blocked: replayed?.action_blocked ?? true,
    receipt_match: false,
    verification_match: false,
    refusalgraph_match: false,
    ledger_match: false,
    fee_metering_match: false,
    safety_flags_match: false,
    replay_consistent: false,
    mismatch_reasons: reasons,
    replay_status: "replay_incomplete",
  };
}

function createReplaySummary(
  type: ClearingReplayType,
  comparison: ClearingReplayComparison,
): string {
  return "Local draft " + type + " completed with status " + comparison.replay_status
    + ". Consistent: " + comparison.replay_consistent + ". Mismatch count: "
    + comparison.mismatch_reasons.length
    + ". No action was re-executed, networked, billed, paid, settled, tracked, analysed, or published.";
}

function replayNextSteps(comparison: ClearingReplayComparison): string[] {
  if (comparison.replay_status === "replay_consistent") {
    return ["do_not_execute", "keep_local_only"];
  }
  return ["do_not_execute", "keep_blocked", "keep_local_only", "require_human_approval"];
}

function createSafetySummary(): ClearingReplaySafetySummary {
  return {
    local_comparison_only: true,
    production_replay_performed: false,
    action_reexecution_performed: false,
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

function safeReplayType(value: string): ClearingReplayType {
  const token = safeToken(value) as ClearingReplayType;
  return REPLAY_TYPES.has(token) ? token : "unknown_local_replay";
}
function safeSourceType(value: string | null | undefined): string {
  const token = safeToken(value ?? "");
  return new Set(["pipeline_result", "evidence_bundle", "batch_result", "receipt_verification"])
    .has(token) ? token : "unknown";
}
function arraysEqual(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}
function safeReferenceList(kind: string, values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => typeof value === "string" && value.trim() !== "")
    .map((value) => safeReference(kind, value)))].sort();
}
function optionalReference(kind: string, value: string | null | undefined): string | null {
  return typeof value !== "string" || value.trim() === "" ? null : safeReference(kind, value);
}
function safeReference(kind: string, value: string): string {
  const existing = new RegExp("^" + kind + "_reference_[a-f0-9]{20}$");
  if (existing.test(value)) return value;
  const digest = createHash("sha256").update(value, "utf8").digest("hex");
  return kind + "_reference_" + digest.slice(0, 20);
}
function safeEnum(value: string, allowed: ReadonlySet<string>, fallback: string): string {
  const token = safeToken(value);
  return allowed.has(token) ? token : fallback;
}
function safeToken(value: string): string {
  return value.trim().replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 96);
}
function safeTimestamp(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "unknown" : date.toISOString();
}
