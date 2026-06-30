import { createHash } from "node:crypto";

export const LOCAL_CLEARING_LEDGER_VERSION = "atg.local-clearing-ledger.v1" as const;

export type LocalClearingLedgerRecordType =
  | "pipeline_result"
  | "clearing_decision"
  | "clearing_receipt"
  | "receipt_verification_result"
  | "fee_metering_event"
  | "refusalgraph_signal"
  | "refusalgraph_query_result"
  | "demo_report"
  | "unknown_local_record";

export interface LocalClearingLedgerRecordInput {
  [key: string]: unknown;
  record_type: string;
  source_id: string;
  pipeline_id?: string | null;
  clearing_request_id?: string | null;
  clearing_decision_id?: string | null;
  clearing_receipt_id?: string | null;
  verification_id?: string | null;
  metering_event_id?: string | null;
  refusalgraph_signal_id?: string | null;
  refusalgraph_query_id?: string | null;
  decision?: string | null;
  caution_level?: string | null;
  approval_required?: boolean;
  action_allowed?: boolean;
  action_blocked?: boolean;
  receipt_status?: string | null;
  verification_result?: string | null;
  fee_readiness_status?: string | null;
  created_at: string;
}

export interface LocalClearingLedgerRecord {
  record_id: string;
  record_type: LocalClearingLedgerRecordType;
  source_id: string;
  pipeline_id: string | null;
  clearing_request_id: string | null;
  clearing_decision_id: string | null;
  clearing_receipt_id: string | null;
  verification_id: string | null;
  metering_event_id: string | null;
  refusalgraph_signal_id: string | null;
  refusalgraph_query_id: string | null;
  decision: string | null;
  caution_level: "none" | "low" | "medium" | "high" | "critical" | "unknown";
  approval_required: boolean;
  action_allowed: boolean;
  action_blocked: boolean;
  receipt_status: "draft_only" | "local_only" | "not_applicable";
  verification_result: string | null;
  fee_readiness_status: "placeholder_only" | "not_enabled" | "not_applicable";
  private_data_included: false;
  network_lookup_performed: false;
  external_lookup_performed: false;
  payment_or_fee_triggered: false;
  billing_triggered: false;
  settlement_triggered: false;
  action_executed: false;
  status: "draft_only";
  created_at: string;
}

export interface LocalClearingLedger {
  ledger_version: typeof LOCAL_CLEARING_LEDGER_VERSION;
  local_only: true;
  records: readonly LocalClearingLedgerRecord[];
  status: "draft_only";
}

export interface LocalClearingLedgerSummary {
  total_records: number;
  record_type_counts: Record<LocalClearingLedgerRecordType, number>;
  blocked_count: number;
  approval_required_count: number;
  allowed_count: number;
  high_caution_count: number;
  critical_caution_count: number;
  receipts_created_count: number;
  verifications_completed_count: number;
  fee_placeholders_count: number;
  action_executed_count: number;
  payment_triggered_count: number;
  billing_triggered_count: number;
  settlement_triggered_count: number;
  network_lookup_count: number;
  private_data_included: false;
  status: "draft_only";
}

const RECORD_TYPES = new Set<LocalClearingLedgerRecordType>([
  "pipeline_result", "clearing_decision", "clearing_receipt",
  "receipt_verification_result", "fee_metering_event", "refusalgraph_signal",
  "refusalgraph_query_result", "demo_report", "unknown_local_record",
]);

const DECISIONS = new Set([
  "accept_with_limits", "require_more_evidence", "require_human_approval",
  "require_identity_verification", "clarify_payment_intent", "cap_spend_limit",
  "refuse_transaction", "keep_blocked", "create_receipt_only",
  "draft_only_not_executed",
]);

const VERIFICATION_RESULTS = new Set([
  "locally_valid", "locally_invalid", "missing_required_fields",
  "unsafe_flags_detected", "private_data_detected", "decision_link_missing",
  "draft_only_not_externally_verified",
]);

export function createLocalClearingLedger(): LocalClearingLedger {
  return {
    ledger_version: LOCAL_CLEARING_LEDGER_VERSION,
    local_only: true,
    records: [],
    status: "draft_only",
  };
}

export function addLocalClearingLedgerRecord(
  ledger: LocalClearingLedger,
  input: LocalClearingLedgerRecordInput,
): LocalClearingLedger {
  const record = createLedgerRecord(input);
  if (ledger.records.some((existing) => existing.record_id === record.record_id)) {
    return ledger;
  }
  return {
    ledger_version: LOCAL_CLEARING_LEDGER_VERSION,
    local_only: true,
    records: [...ledger.records, record],
    status: "draft_only",
  };
}

export function listLocalClearingLedgerRecords(
  ledger: LocalClearingLedger,
): LocalClearingLedgerRecord[] {
  return ledger.records.map((record) => ({ ...record }));
}

export function findLocalClearingLedgerRecordById(
  ledger: LocalClearingLedger,
  recordId: string,
): LocalClearingLedgerRecord | undefined {
  const record = ledger.records.find((entry) => entry.record_id === recordId);
  return record === undefined ? undefined : { ...record };
}

export function summariseLocalClearingLedger(
  ledger: LocalClearingLedger,
): LocalClearingLedgerSummary {
  const records = ledger.records;
  const recordTypeCounts = emptyRecordTypeCounts();
  for (const record of records) recordTypeCounts[record.record_type] += 1;

  return {
    total_records: records.length,
    record_type_counts: recordTypeCounts,
    blocked_count: records.filter((record) => record.action_blocked).length,
    approval_required_count: records.filter((record) => record.approval_required).length,
    allowed_count: records.filter((record) => record.action_allowed).length,
    high_caution_count: records.filter((record) => record.caution_level === "high").length,
    critical_caution_count: records.filter((record) => record.caution_level === "critical").length,
    receipts_created_count: recordTypeCounts.clearing_receipt,
    verifications_completed_count: recordTypeCounts.receipt_verification_result,
    fee_placeholders_count: records.filter((record) =>
      record.record_type === "fee_metering_event"
      && record.fee_readiness_status === "placeholder_only").length,
    action_executed_count: records.filter((record) => record.action_executed).length,
    payment_triggered_count: records.filter((record) => record.payment_or_fee_triggered).length,
    billing_triggered_count: records.filter((record) => record.billing_triggered).length,
    settlement_triggered_count: records.filter((record) => record.settlement_triggered).length,
    network_lookup_count: records.filter((record) =>
      record.network_lookup_performed || record.external_lookup_performed).length,
    private_data_included: false,
    status: "draft_only",
  };
}

export function createLocalLedgerRecordId(recordType: string, sourceId: string): string {
  const type = safeRecordType(recordType);
  const digest = createHash("sha256").update(`${type}:${sourceId}`, "utf8").digest("hex");
  return `local_ledger_${type}_${digest.slice(0, 20)}`;
}

function createLedgerRecord(input: LocalClearingLedgerRecordInput): LocalClearingLedgerRecord {
  const type = safeRecordType(input.record_type);
  return {
    record_id: createLocalLedgerRecordId(type, input.source_id),
    record_type: type,
    source_id: safeReference("source", input.source_id),
    pipeline_id: optionalReference("pipeline", input.pipeline_id),
    clearing_request_id: optionalReference("clearing_request", input.clearing_request_id),
    clearing_decision_id: optionalReference("clearing_decision", input.clearing_decision_id),
    clearing_receipt_id: optionalReference("clearing_receipt", input.clearing_receipt_id),
    verification_id: optionalReference("verification", input.verification_id),
    metering_event_id: optionalReference("metering_event", input.metering_event_id),
    refusalgraph_signal_id: optionalReference("refusalgraph_signal", input.refusalgraph_signal_id),
    refusalgraph_query_id: optionalReference("refusalgraph_query", input.refusalgraph_query_id),
    decision: optionalEnum(input.decision, DECISIONS),
    caution_level: safeCaution(input.caution_level),
    approval_required: input.approval_required === true,
    action_allowed: input.action_allowed === true,
    action_blocked: input.action_blocked === true,
    receipt_status: safeReceiptStatus(input.receipt_status),
    verification_result: optionalEnum(input.verification_result, VERIFICATION_RESULTS),
    fee_readiness_status: safeFeeStatus(input.fee_readiness_status),
    private_data_included: false,
    network_lookup_performed: false,
    external_lookup_performed: false,
    payment_or_fee_triggered: false,
    billing_triggered: false,
    settlement_triggered: false,
    action_executed: false,
    status: "draft_only",
    created_at: safeTimestamp(input.created_at),
  };
}

function safeRecordType(value: string): LocalClearingLedgerRecordType {
  const token = safeToken(value) as LocalClearingLedgerRecordType;
  return RECORD_TYPES.has(token) ? token : "unknown_local_record";
}

function safeCaution(value: string | null | undefined): LocalClearingLedgerRecord["caution_level"] {
  const token = value === null || value === undefined ? "" : safeToken(value);
  return token === "none" || token === "low" || token === "medium"
    || token === "high" || token === "critical" ? token : "unknown";
}

function safeReceiptStatus(value: string | null | undefined): LocalClearingLedgerRecord["receipt_status"] {
  const token = value === null || value === undefined ? "" : safeToken(value);
  return token === "draft_only" || token === "local_only" ? token : "not_applicable";
}

function safeFeeStatus(value: string | null | undefined): LocalClearingLedgerRecord["fee_readiness_status"] {
  const token = value === null || value === undefined ? "" : safeToken(value);
  return token === "placeholder_only" || token === "not_enabled" ? token : "not_applicable";
}

function optionalEnum(value: string | null | undefined, allowed: ReadonlySet<string>): string | null {
  if (value === null || value === undefined) return null;
  const token = safeToken(value);
  return allowed.has(token) ? token : null;
}

function optionalReference(kind: string, value: string | null | undefined): string | null {
  return value === null || value === undefined || value.trim() === ""
    ? null
    : safeReference(kind, value);
}

function safeReference(kind: string, value: string): string {
  const digest = createHash("sha256").update(value, "utf8").digest("hex");
  return `${kind}_reference_${digest.slice(0, 20)}`;
}

function safeToken(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 96);
}

function safeTimestamp(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "unknown" : date.toISOString();
}

function emptyRecordTypeCounts(): Record<LocalClearingLedgerRecordType, number> {
  return {
    pipeline_result: 0,
    clearing_decision: 0,
    clearing_receipt: 0,
    receipt_verification_result: 0,
    fee_metering_event: 0,
    refusalgraph_signal: 0,
    refusalgraph_query_result: 0,
    demo_report: 0,
    unknown_local_record: 0,
  };
}
