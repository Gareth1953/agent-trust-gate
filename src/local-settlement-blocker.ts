import type { LocalGatePassAuditReceipt } from "./local-gate-pass-receipt.js";

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
  | "missing_receipt"
  | "malformed_receipt";

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
  mode: "local_simulation_only";
  settlement_executed: false;
  payment_triggered: false;
  network_call_performed: false;
  action_executed: false;
  note: "No real settlement, payment, API call, or action execution occurred.";
}

const NOTE = "No real settlement, payment, API call, or action execution occurred." as const;
const FALLBACK_TIMESTAMP = "1970-01-01T00:00:00.000Z";

export function isReceiptSettlementEligible(receipt: unknown): boolean {
  if (!isReceiptShape(receipt)) return false;
  return receipt.receipt_type === "signed_gate_pass"
    && receipt.verdict === "allow_signed_gate_pass"
    && receipt.allowed === true
    && receipt.settlement_allowed === true
    && receipt.human_review_required !== true
    && criticalChecksPassed(receipt.checks)
    && !containsRefusalReason(receipt.reason_codes);
}

export function simulateLocalSettlementBlocker(receipt: unknown): LocalSettlementBlockerDecision {
  if (receipt === null || receipt === undefined) {
    return blockedDecision("missing_receipt", ["missing_receipt"]);
  }
  if (!isReceiptShape(receipt)) {
    return blockedDecision("malformed_receipt", ["malformed_receipt"]);
  }

  const eligible = isReceiptSettlementEligible(receipt);
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
    && Array.isArray(value.reason_codes)
    && value.reason_codes.every((code) => typeof code === "string")
    && isRecord(value.checks);
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
