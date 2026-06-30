import { createHash } from "node:crypto";

export const CLEARING_EVIDENCE_BUNDLE_VERSION = "atg.clearing-evidence-bundle.v1" as const;

export type ClearingEvidenceBundleType =
  | "single_clearing_run" | "batch_clearing_run" | "receipt_verification_bundle"
  | "refusalgraph_query_bundle" | "unknown_local_bundle";
export type ClearingEvidenceStatus =
  | "draft_only" | "local_only" | "incomplete" | "locally_verified"
  | "verification_failed" | "approval_required" | "blocked" | "unknown";

export interface ClearingEvidenceBundleInput {
  [key: string]: unknown;
  bundle_type: string;
  source_id: string;
  pipeline_id?: string | null;
  batch_id?: string | null;
  clearing_request_id?: string | null;
  clearing_decision_id?: string | null;
  clearing_receipt_id?: string | null;
  verification_id?: string | null;
  refusalgraph_query_id?: string | null;
  matched_signal_ids?: readonly string[];
  ledger_record_ids?: readonly string[];
  fee_metering_event_ids?: readonly string[];
  report_id?: string | null;
  decision?: string | null;
  caution_level?: string | null;
  approval_required?: boolean;
  action_allowed?: boolean;
  action_blocked?: boolean;
  receipt_status?: string | null;
  verification_result?: string | null;
  evidence_status?: string | null;
  recommended_next_steps?: readonly string[];
  created_at: string;
}

export interface ClearingEvidenceSafetySummary {
  local_references_only: true;
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

export interface ClearingEvidenceBundle {
  bundle_id: string;
  bundle_type: ClearingEvidenceBundleType;
  source_id: string;
  pipeline_id: string | null;
  batch_id: string | null;
  clearing_request_id: string | null;
  clearing_decision_id: string | null;
  clearing_receipt_id: string | null;
  verification_id: string | null;
  refusalgraph_query_id: string | null;
  matched_signal_ids: string[];
  ledger_record_ids: string[];
  fee_metering_event_ids: string[];
  report_id: string | null;
  decision: string;
  caution_level: "none" | "low" | "medium" | "high" | "critical" | "unknown";
  approval_required: boolean;
  action_allowed: boolean;
  action_blocked: boolean;
  receipt_status: "draft_only" | "local_only" | "not_present" | "invalid";
  verification_result: string;
  verification_passed: boolean;
  verification_failed: boolean;
  fee_placeholder_count: number;
  matched_signal_count: number;
  evidence_status: ClearingEvidenceStatus;
  evidence_summary: string;
  safety_summary: ClearingEvidenceSafetySummary;
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

export interface ClearingEvidenceBundleSummary {
  bundle_id: string;
  bundle_type: ClearingEvidenceBundleType;
  evidence_status: ClearingEvidenceStatus;
  decision: string;
  caution_level: ClearingEvidenceBundle["caution_level"];
  approval_required: boolean;
  action_allowed: boolean;
  action_blocked: boolean;
  receipt_present: boolean;
  verification_present: boolean;
  verification_passed: boolean;
  verification_failed: boolean;
  matched_signal_count: number;
  ledger_record_count: number;
  fee_metering_event_count: number;
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

const BUNDLE_TYPES = new Set<ClearingEvidenceBundleType>([
  "single_clearing_run", "batch_clearing_run", "receipt_verification_bundle",
  "refusalgraph_query_bundle", "unknown_local_bundle",
]);
const EVIDENCE_STATUSES = new Set<ClearingEvidenceStatus>([
  "draft_only", "local_only", "incomplete", "locally_verified",
  "verification_failed", "approval_required", "blocked", "unknown",
]);
const DECISIONS = new Set([
  "accept_with_limits", "require_more_evidence", "require_human_approval",
  "require_identity_verification", "clarify_payment_intent", "cap_spend_limit",
  "refuse_transaction", "keep_blocked", "create_receipt_only",
  "draft_only_not_executed", "unknown",
]);
const VERIFICATION_RESULTS = new Set([
  "locally_valid", "locally_invalid", "missing_required_fields",
  "unsafe_flags_detected", "private_data_detected", "decision_link_missing",
  "draft_only_not_externally_verified", "not_present", "unknown",
]);
const NEXT_STEPS = new Set([
  "require_human_approval", "require_more_evidence", "require_identity_verification",
  "clarify_payment_intent", "cap_spend_limit", "refuse_transaction", "keep_blocked",
  "create_receipt_only", "accept_with_limits", "draft_only_not_executed",
  "keep_local_only", "do_not_execute", "do_not_verify_externally",
  "do_not_trigger_fee", "Gareth_final_approval_required",
]);

export function createClearingEvidenceBundle(
  input: ClearingEvidenceBundleInput,
): ClearingEvidenceBundle {
  const bundleType = safeBundleType(input.bundle_type);
  const matchedSignalIds = safeReferenceList("signal", input.matched_signal_ids);
  const ledgerRecordIds = safeReferenceList("ledger_record", input.ledger_record_ids);
  const feeEventIds = safeReferenceList("fee_event", input.fee_metering_event_ids);
  const decision = safeEnum(input.decision, DECISIONS, "unknown");
  const caution = safeCaution(input.caution_level);
  const verificationResult = safeEnum(input.verification_result, VERIFICATION_RESULTS, "not_present");
  const verificationPassed = verificationResult === "locally_valid";
  const verificationFailed = verificationResult !== "locally_valid" && verificationResult !== "not_present";
  const evidenceStatus = safeEvidenceStatus(input.evidence_status);
  const approvalRequired = input.approval_required === true || decision === "require_human_approval";
  const actionBlocked = input.action_blocked === true
    || decision === "keep_blocked" || decision === "refuse_transaction";
  const actionAllowed = input.action_allowed === true && !actionBlocked;
  const receiptId = optionalReference("clearing_receipt", input.clearing_receipt_id);
  const verificationId = optionalReference("verification", input.verification_id);
  return {
    bundle_id: createClearingEvidenceBundleId(input.source_id),
    bundle_type: bundleType,
    source_id: safeReference("source", input.source_id),
    pipeline_id: optionalReference("pipeline", input.pipeline_id),
    batch_id: optionalReference("batch", input.batch_id),
    clearing_request_id: optionalReference("clearing_request", input.clearing_request_id),
    clearing_decision_id: optionalReference("clearing_decision", input.clearing_decision_id),
    clearing_receipt_id: receiptId,
    verification_id: verificationId,
    refusalgraph_query_id: optionalReference("refusalgraph_query", input.refusalgraph_query_id),
    matched_signal_ids: matchedSignalIds,
    ledger_record_ids: ledgerRecordIds,
    fee_metering_event_ids: feeEventIds,
    report_id: optionalReference("report", input.report_id),
    decision,
    caution_level: caution,
    approval_required: approvalRequired,
    action_allowed: actionAllowed,
    action_blocked: actionBlocked,
    receipt_status: safeReceiptStatus(input.receipt_status, receiptId !== null),
    verification_result: verificationResult,
    verification_passed: verificationPassed,
    verification_failed: verificationFailed,
    fee_placeholder_count: feeEventIds.length,
    matched_signal_count: matchedSignalIds.length,
    evidence_status: evidenceStatus,
    evidence_summary: createEvidenceSummary(
      bundleType, evidenceStatus, decision, caution, matchedSignalIds.length,
      ledgerRecordIds.length, feeEventIds.length, receiptId !== null, verificationId !== null,
    ),
    safety_summary: createSafetySummary(),
    recommended_next_steps: safeNextSteps(input.recommended_next_steps),
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

export function createClearingEvidenceBundleId(sourceId: string): string {
  const digest = createHash("sha256").update(sourceId, "utf8").digest("hex");
  return "clearing_evidence_bundle_" + digest.slice(0, 24);
}

export function summariseClearingEvidenceBundle(
  bundle: ClearingEvidenceBundle,
): ClearingEvidenceBundleSummary {
  return {
    bundle_id: bundle.bundle_id,
    bundle_type: bundle.bundle_type,
    evidence_status: bundle.evidence_status,
    decision: bundle.decision,
    caution_level: bundle.caution_level,
    approval_required: bundle.approval_required,
    action_allowed: bundle.action_allowed,
    action_blocked: bundle.action_blocked,
    receipt_present: bundle.clearing_receipt_id !== null,
    verification_present: bundle.verification_id !== null,
    verification_passed: bundle.verification_passed,
    verification_failed: bundle.verification_failed,
    matched_signal_count: bundle.matched_signal_ids.length,
    ledger_record_count: bundle.ledger_record_ids.length,
    fee_metering_event_count: bundle.fee_metering_event_ids.length,
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

export function renderClearingEvidenceBundleMarkdown(bundle: ClearingEvidenceBundle): string {
  return [
    "# Clearing Evidence Bundle", "", "Status: local-only and draft-only",
    "Bundle: " + bundle.bundle_id, "Type: " + bundle.bundle_type,
    "Evidence status: " + bundle.evidence_status, "", "## Source", "",
    "Source reference: " + bundle.source_id,
    "Pipeline reference: " + (bundle.pipeline_id ?? "not_present"),
    "Batch reference: " + (bundle.batch_id ?? "not_present"), "",
    "## Clearing Decision", "", "Decision: " + bundle.decision,
    "Caution: " + bundle.caution_level,
    "Approval required: " + bundle.approval_required,
    "Action allowed: " + bundle.action_allowed,
    "Action blocked: " + bundle.action_blocked, "",
    "## RefusalGraph Evidence", "", "Matched signals: " + bundle.matched_signal_count,
    "Query reference: " + (bundle.refusalgraph_query_id ?? "not_present"), "",
    "## Receipt Evidence", "",
    "Receipt reference: " + (bundle.clearing_receipt_id ?? "not_present"),
    "Receipt status: " + bundle.receipt_status, "", "## Verification Result", "",
    "Verification reference: " + (bundle.verification_id ?? "not_present"),
    "Result: " + bundle.verification_result,
    "Passed locally: " + bundle.verification_passed, "",
    "## Fee Metering Placeholders", "",
    "Placeholder event count: " + bundle.fee_placeholder_count, "",
    "## Local Ledger Records", "", "Record count: " + bundle.ledger_record_ids.length, "",
    "## Safety Status", "",
    "This is not legal evidence, compliance certification, a live audit, public proof, network verification, or blockchain proof.",
    "No action was executed. No network lookup was performed.",
    "No billing, payment, settlement, tracking, analytics, publishing, or deployment occurred.",
    "", "## Recommended Next Steps", "",
    ...bundle.recommended_next_steps.map((step) => "- " + step), "",
    "All live, external, commercial, publication, verification, or proof use requires Gareth final approval.",
  ].join("\n");
}

function createEvidenceSummary(
  type: ClearingEvidenceBundleType,
  status: ClearingEvidenceStatus,
  decision: string,
  caution: string,
  signals: number,
  records: number,
  fees: number,
  receiptPresent: boolean,
  verificationPresent: boolean,
): string {
  return "Local draft " + type + " evidence references were assembled with status " + status
    + ". The decision is " + decision + " with " + caution + " caution. The bundle references "
    + signals + " RefusalGraph signals, " + records + " local ledger records, and " + fees
    + " fee placeholders. Receipt present: " + receiptPresent + ". Verification present: "
    + verificationPresent
    + ". Nothing was executed, networked, billed, paid, settled, tracked, analysed, or published.";
}

function createSafetySummary(): ClearingEvidenceSafetySummary {
  return {
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
  };
}

function safeBundleType(value: string): ClearingEvidenceBundleType {
  const token = safeToken(value) as ClearingEvidenceBundleType;
  return BUNDLE_TYPES.has(token) ? token : "unknown_local_bundle";
}
function safeEvidenceStatus(value: string | null | undefined): ClearingEvidenceStatus {
  const token = safeToken(value ?? "") as ClearingEvidenceStatus;
  return EVIDENCE_STATUSES.has(token) ? token : "unknown";
}
function safeCaution(value: string | null | undefined): ClearingEvidenceBundle["caution_level"] {
  const token = safeToken(value ?? "");
  return token === "none" || token === "low" || token === "medium"
    || token === "high" || token === "critical" ? token : "unknown";
}
function safeReceiptStatus(
  value: string | null | undefined,
  receiptPresent: boolean,
): ClearingEvidenceBundle["receipt_status"] {
  if (!receiptPresent) return "not_present";
  const token = safeToken(value ?? "");
  return token === "draft_only" || token === "local_only" ? token : "invalid";
}
function safeNextSteps(values: readonly string[] | undefined): string[] {
  if (!Array.isArray(values)) return ["do_not_execute", "keep_local_only"];
  const output = [...new Set(values.map(safeToken).filter((value) => NEXT_STEPS.has(value)))];
  if (!output.includes("keep_local_only")) output.push("keep_local_only");
  if (!output.includes("do_not_execute")) output.push("do_not_execute");
  return output.sort();
}
function safeReferenceList(kind: string, values: readonly string[] | undefined): string[] {
  if (!Array.isArray(values)) return [];
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
function safeEnum(
  value: string | null | undefined,
  allowed: ReadonlySet<string>,
  fallback: string,
): string {
  const token = safeToken(value ?? "");
  return allowed.has(token) ? token : fallback;
}
function safeToken(value: string): string {
  return value.trim().replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 96);
}
function safeTimestamp(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "unknown" : date.toISOString();
}
