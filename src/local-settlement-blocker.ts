import type { LocalGatePassAuditReceipt } from "./local-gate-pass-receipt.js";
import {
  evaluateLocalGatePassProtection,
  LocalGatePassReplayStore,
  type LocalGatePassProtectionDecision,
  type LocalGatePassReplayStatus,
  type LocalGatePassValidityStatus,
} from "./local-gate-pass-protection.js";

export type LocalSettlementSimulation = "allowed" | "blocked";

export type LocalSettlementBlockReason =
  | "no_signed_gate_pass"
  | "receipt_type_not_allowed"
  | "gate_verdict_not_allow"
  | "settlement_not_allowed_by_gate"
  | "human_review_required"
  | "refusal_receipt_blocks_settlement"
  | "critical_check_failed"
  | "refusal_reason_code_present"
  | "gate_pass_not_yet_valid"
  | "gate_pass_expired"
  | "gate_pass_validity_metadata_invalid"
  | "gate_pass_replay_metadata_invalid"
  | "gate_pass_replay_detected"
  | "evaluation_time_invalid"
  | "missing_receipt"
  | "malformed_receipt";

export interface LocalSettlementProtectionContext {
  evaluated_at: string;
  replay_store?: LocalGatePassReplayStore;
  consume?: boolean;
}

export interface LocalSettlementBlockerDecision {
  request_id: string;
  receipt_id: string;
  receipt_type: string;
  gate_verdict: string;
  gate_allowed: boolean;
  settlement_allowed_from_receipt: boolean;
  settlement_simulation: LocalSettlementSimulation;
  blocked: boolean;
  block_reason_codes: LocalSettlementBlockReason[];
  checked_at: string;
  evaluated_at: string;
  gate_pass_expires_at: string | null;
  validity_status: LocalGatePassValidityStatus;
  replay_status: LocalGatePassReplayStatus;
  replay_store_size: number;
  mode: "local_simulation_only";
  settlement_executed: false;
  payment_triggered: false;
  network_call_performed: false;
  action_executed: false;
  note: "No real settlement, payment, API call, or action execution occurred.";
}

const NOTE = "No real settlement, payment, API call, or action execution occurred." as const;
const FALLBACK_TIMESTAMP = "1970-01-01T00:00:00.000Z";

export function isReceiptSettlementEligible(receipt: unknown, evaluatedAt?: string): boolean {
  if (!isReceiptShape(receipt)) return false;
  const baseEligible = isBaseReceiptSettlementEligible(receipt);
  if (!baseEligible) return false;
  const protection = evaluateLocalGatePassProtection(
    receipt,
    evaluatedAt ?? receipt.checked_at,
    undefined,
    false,
  );
  return protection.protected;
}

function isBaseReceiptSettlementEligible(receipt: LocalGatePassAuditReceipt): boolean {
  return receipt.receipt_type === "signed_gate_pass"
    && receipt.verdict === "allow_signed_gate_pass"
    && receipt.allowed === true
    && receipt.settlement_allowed === true
    && receipt.human_review_required !== true
    && criticalChecksPassed(receipt.checks)
    && !containsRefusalReason(receipt.reason_codes);
}

export function simulateLocalSettlementBlocker(
  receipt: unknown,
  context?: LocalSettlementProtectionContext,
): LocalSettlementBlockerDecision {
  if (receipt === null || receipt === undefined) {
    return blockedDecision("missing_receipt", ["missing_receipt"]);
  }
  if (!isReceiptShape(receipt)) {
    return blockedDecision("malformed_receipt", ["malformed_receipt"]);
  }

  const candidate = isBaseReceiptSettlementEligible(receipt);
  const protection = candidate
    ? evaluateLocalGatePassProtection(
      receipt,
      context?.evaluated_at ?? receipt.checked_at,
      context?.replay_store ?? new LocalGatePassReplayStore(),
      context?.consume ?? true,
    )
    : notApplicableProtection(receipt.checked_at);
  const eligible = candidate && protection.protected;
  const reasons: LocalSettlementBlockReason[] = [];
  if (!eligible) reasons.push("no_signed_gate_pass");
  if (receipt.receipt_type !== "signed_gate_pass") reasons.push("receipt_type_not_allowed");
  if (receipt.verdict !== "allow_signed_gate_pass" || receipt.allowed !== true) {
    reasons.push("gate_verdict_not_allow");
  }
  if (receipt.settlement_allowed !== true) reasons.push("settlement_not_allowed_by_gate");
  if (receipt.human_review_required === true) reasons.push("human_review_required");
  if (receipt.receipt_type === "refusal_receipt") reasons.push("refusal_receipt_blocks_settlement");
  if (!criticalChecksPassed(receipt.checks)) reasons.push("critical_check_failed");
  if (containsRefusalReason(receipt.reason_codes)) reasons.push("refusal_reason_code_present");
  if (!protection.protected && protection.validity_status !== "not_applicable") {
    for (const reason of protection.reason_codes) {
      if (reason !== "gate_pass_valid") reasons.push(reason);
    }
  }

  return {
    request_id: safeIdentifier(receipt.request_id),
    receipt_id: safeIdentifier(receipt.receipt_id),
    receipt_type: safeLabel(receipt.receipt_type),
    gate_verdict: safeLabel(receipt.verdict),
    gate_allowed: receipt.allowed,
    settlement_allowed_from_receipt: receipt.settlement_allowed,
    settlement_simulation: eligible ? "allowed" : "blocked",
    blocked: !eligible,
    block_reason_codes: reasons,
    checked_at: safeTimestamp(receipt.checked_at),
    evaluated_at: protection.evaluated_at,
    gate_pass_expires_at: protection.expires_at,
    validity_status: protection.validity_status,
    replay_status: protection.replay_status,
    replay_store_size: protection.replay_store_size,
    mode: "local_simulation_only",
    settlement_executed: false,
    payment_triggered: false,
    network_call_performed: false,
    action_executed: false,
    note: NOTE,
  };
}

export function formatLocalSettlementBlockerSummary(
  decision: LocalSettlementBlockerDecision,
): string {
  return [
    `Settlement blocker simulation: ${decision.settlement_simulation}`,
    `Validity: ${decision.validity_status}`,
    `Replay protection: ${decision.replay_status}`,
    `Reason codes: ${decision.block_reason_codes.length === 0 ? "none" : decision.block_reason_codes.join(", ")}`,
    `Mode: ${decision.mode}`,
    decision.note,
  ].join("\n");
}

function blockedDecision(
  label: string,
  reasons: LocalSettlementBlockReason[],
): LocalSettlementBlockerDecision {
  return {
    request_id: "unknown",
    receipt_id: "unknown",
    receipt_type: label,
    gate_verdict: "unknown",
    gate_allowed: false,
    settlement_allowed_from_receipt: false,
    settlement_simulation: "blocked",
    blocked: true,
    block_reason_codes: reasons,
    checked_at: FALLBACK_TIMESTAMP,
    evaluated_at: FALLBACK_TIMESTAMP,
    gate_pass_expires_at: null,
    validity_status: "not_applicable",
    replay_status: "not_checked",
    replay_store_size: 0,
    mode: "local_simulation_only",
    settlement_executed: false,
    payment_triggered: false,
    network_call_performed: false,
    action_executed: false,
    note: NOTE,
  };
}

function isReceiptShape(value: unknown): value is LocalGatePassAuditReceipt {
  if (!isRecord(value)) return false;
  return typeof value.request_id === "string"
    && typeof value.receipt_id === "string"
    && typeof value.receipt_type === "string"
    && typeof value.verdict === "string"
    && typeof value.allowed === "boolean"
    && typeof value.settlement_allowed === "boolean"
    && typeof value.human_review_required === "boolean"
    && typeof value.checked_at === "string"
    && (value.gate_pass_validity === null || isRecord(value.gate_pass_validity))
    && (value.replay_protection === null || isRecord(value.replay_protection))
    && Array.isArray(value.reason_codes)
    && value.reason_codes.every((code) => typeof code === "string")
    && isRecord(value.checks);
}

function notApplicableProtection(checkedAt: string): LocalGatePassProtectionDecision {
  return {
    protected: false,
    validity_status: "not_applicable",
    replay_status: "not_checked",
    reason_codes: [],
    evaluated_at: safeTimestamp(checkedAt),
    expires_at: null,
    replay_key: null,
    replay_store_size: 0,
    mode: "local_in_memory_only",
    persistent_state_written: false,
    network_call_performed: false,
    action_executed: false,
    settlement_executed: false,
  };
}

function criticalChecksPassed(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return ["mandate", "evidence", "verified_intent", "limits", "approval"]
    .every((name) => isRecord(value[name]) && value[name].passed === true);
}

function containsRefusalReason(reasonCodes: readonly string[]): boolean {
  const refusalCodes = new Set([
    "MANDATE_REQUIRED",
    "MANDATE_SCOPE_REQUIRED",
    "MANDATE_EXPIRED",
    "EVIDENCE_REQUIRED",
    "EVIDENCE_STALE",
    "VERIFIED_INTENT_REQUIRED",
    "LIMIT_EXCEEDED",
    "FINAL_APPROVAL_REQUIRED",
    "UNSUPPORTED_UNSAFE_ACTION",
  ]);
  return reasonCodes.some((code) => refusalCodes.has(code));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function safeIdentifier(value: string): string {
  const output = value.trim().replace(/[^a-zA-Z0-9_-]+/g, "_").slice(0, 80);
  return output || "unknown";
}

function safeLabel(value: string): string {
  const output = value.trim().replace(/[^a-zA-Z0-9_-]+/g, "_").slice(0, 64);
  return output || "unknown";
}

function safeTimestamp(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? FALLBACK_TIMESTAMP : parsed.toISOString();
}
