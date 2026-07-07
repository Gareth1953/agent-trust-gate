import {
  evaluateLocalGatePassProtection,
  LOCAL_GATE_PASS_MAX_VALIDITY_SECONDS,
  LocalGatePassReplayStore,
} from "./local-gate-pass-protection.js";
import { simulateLocalSettlementBlocker } from "./local-settlement-blocker.js";

export const LOCAL_TRUST_RECEIPT_VERIFIER_VERSION = "local-trust-receipt-verifier-v1" as const;
export const SUPPORTED_LOCAL_TRUST_RECEIPT_SCHEMA = "atg.local-gate-pass-receipt.v2" as const;

export type LocalTrustReceiptVerificationReason =
  | "missing_receipt"
  | "malformed_receipt"
  | "unsupported_schema_version"
  | "missing_required_field"
  | "receipt_type_verdict_mismatch"
  | "allowed_settlement_mismatch"
  | "missing_checks"
  | "failed_critical_check"
  | "reason_codes_missing_for_failed_checks"
  | "missing_policy_metadata"
  | "missing_signature_metadata"
  | "expired_receipt"
  | "receipt_not_yet_valid"
  | "invalid_receipt_timestamp"
  | "gate_pass_validity_failed"
  | "request_id_mismatch"
  | "agent_id_mismatch"
  | "requested_action_mismatch"
  | "replay_risk_detected"
  | "review_receipt_not_settlement_eligible"
  | "refusal_receipt_not_settlement_eligible"
  | "settlement_blocker_rejected";

export type LocalTrustReceiptVerificationWarning =
  | "signature_not_cryptographic";

export interface LocalTrustReceiptVerifierOptions {
  expected_request_id?: string;
  expected_agent_id?: string;
  expected_requested_action?: string;
  ttl_seconds?: number;
  current_time?: string;
  previously_seen_receipt_ids?: readonly string[];
  require_settlement_eligibility?: boolean;
  replay_store?: LocalGatePassReplayStore;
}

export interface LocalTrustReceiptVerificationDecision {
  receipt_id: string;
  request_id: string;
  verified: boolean;
  valid_for_simulated_settlement: boolean;
  structurally_valid: boolean;
  schema_supported: boolean;
  internally_consistent: boolean;
  fresh: boolean;
  replay_safe: boolean;
  settlement_blocker_allowed: boolean;
  receipt_type: string;
  verdict: string;
  reason_codes: LocalTrustReceiptVerificationReason[];
  warnings: LocalTrustReceiptVerificationWarning[];
  checked_at: string;
  mode: "local_simulation_only";
  note: "Local receipt verification only; no real settlement, payment, API call, or action execution occurred.";
}

const NOTE = "Local receipt verification only; no real settlement, payment, API call, or action execution occurred." as const;
const FALLBACK_TIMESTAMP = "1970-01-01T00:00:00.000Z";
const REQUIRED_FIELDS = [
  "receipt_id",
  "request_id",
  "agent_id",
  "requested_action",
  "action_category",
  "verdict",
  "allowed",
  "settlement_allowed",
  "settlement_executed",
  "receipt_type",
  "risk_tier",
  "policy_pack_version",
  "applied_policy",
  "risk_reason",
  "fast_path_allowed",
  "human_review_required",
  "checks",
  "reason_codes",
  "checked_at",
  "gate_pass_validity",
  "replay_protection",
  "signature_metadata",
  "audit_metadata",
] as const;
const CRITICAL_CHECKS = ["mandate", "evidence", "verified_intent", "limits", "approval"] as const;
const ALLOW_REASON_CODES = [
  "MANDATE_VALID",
  "EVIDENCE_FRESH",
  "INTENT_VERIFIED",
  "WITHIN_LIMITS",
  "APPROVAL_SATISFIED",
] as const;

export function verifyLocalTrustReceipt(
  receipt: unknown,
  options: LocalTrustReceiptVerifierOptions = {},
): LocalTrustReceiptVerificationDecision {
  if (receipt === null || receipt === undefined) {
    return failedDecision(receipt, ["missing_receipt"], options.current_time);
  }
  if (!isRecord(receipt)) {
    return failedDecision(receipt, ["malformed_receipt"], options.current_time);
  }

  const reasons: LocalTrustReceiptVerificationReason[] = [];
  const warnings: LocalTrustReceiptVerificationWarning[] = [];
  const missingFields = REQUIRED_FIELDS.filter((field) => !Object.hasOwn(receipt, field));
  if (missingFields.length > 0) reasons.push("missing_required_field");

  const checksPresent = hasValidChecks(receipt.checks);
  const structurallyValid = missingFields.length === 0
    && hasValidTopLevelTypes(receipt)
    && checksPresent;
  if (!structurallyValid && missingFields.length === 0) reasons.push("malformed_receipt");

  const schemaSupported = isRecord(receipt.audit_metadata)
    && receipt.audit_metadata.schema_version === SUPPORTED_LOCAL_TRUST_RECEIPT_SCHEMA;
  if (!schemaSupported) reasons.push("unsupported_schema_version");

  if (!checksPresent) reasons.push("missing_checks");

  const receiptTypeConsistent = receiptTypeMatchesVerdict(receipt.receipt_type, receipt.verdict);
  if (!receiptTypeConsistent) reasons.push("receipt_type_verdict_mismatch");

  const allowedConsistent = allowedValuesAreConsistent(receipt);
  if (!allowedConsistent) reasons.push("allowed_settlement_mismatch");

  const policyConsistent = hasValidPolicyMetadata(receipt);
  if (!policyConsistent) reasons.push("missing_policy_metadata");

  const reasonCodesConsistent = checksPresent && reasonCodesMatchChecks(receipt);
  if (!reasonCodesConsistent) reasons.push("reason_codes_missing_for_failed_checks");

  const failedCriticalCheck = checksPresent && CRITICAL_CHECKS.some(
    (name) => isRecord(receipt.checks) && isRecord(receipt.checks[name]) && receipt.checks[name].passed !== true,
  );
  if (failedCriticalCheck) reasons.push("failed_critical_check");

  const signatureValid = hasValidLocalSignatureMetadata(receipt.signature_metadata);
  if (!signatureValid) reasons.push("missing_signature_metadata");
  else warnings.push("signature_not_cryptographic");

  const safetyMetadataConsistent = hasSafeAuditMetadata(receipt.audit_metadata);
  if (!safetyMetadataConsistent && structurallyValid) reasons.push("malformed_receipt");

  const expectedScopeMatches = checkExpectedScope(receipt, options, reasons);
  const evaluationTime = safeEvaluationTime(options.current_time, receipt.checked_at);
  const freshness = checkFreshness(receipt.checked_at, evaluationTime, options.ttl_seconds);
  if (freshness === "expired") reasons.push("expired_receipt");
  if (freshness === "future") reasons.push("receipt_not_yet_valid");
  if (freshness === "invalid") reasons.push("invalid_receipt_timestamp");

  const replayStore = options.replay_store ?? new LocalGatePassReplayStore();
  const previouslySeen = typeof receipt.receipt_id === "string"
    && (options.previously_seen_receipt_ids ?? []).includes(receipt.receipt_id);
  let replaySafe = structurallyValid && !previouslySeen;
  if (previouslySeen) reasons.push("replay_risk_detected");

  const isGatePass = receipt.receipt_type === "signed_gate_pass"
    && receipt.verdict === "allow_signed_gate_pass";
  let gatePassValidityPassed = false;
  let gatePassProtectionPassed = false;
  if (isGatePass && structurallyValid) {
    const protection = evaluateLocalGatePassProtection(
      receipt,
      evaluationTime,
      replayStore,
      false,
    );
    gatePassValidityPassed = protection.validity_status === "valid";
    replaySafe = !previouslySeen && protection.replay_status === "ready";
    gatePassProtectionPassed = protection.protected && !previouslySeen;
    if (protection.validity_status === "expired") addUnique(reasons, "expired_receipt");
    else if (protection.validity_status === "not_yet_valid") addUnique(reasons, "receipt_not_yet_valid");
    else if (protection.validity_status !== "valid") addUnique(reasons, "gate_pass_validity_failed");
    if (protection.replay_status === "replay_detected") {
      replaySafe = false;
      addUnique(reasons, "replay_risk_detected");
    }
  }

  let settlementBlockerAllowed = false;
  if (structurallyValid && !previouslySeen) {
    const blocker = simulateLocalSettlementBlocker(receipt, {
      evaluated_at: evaluationTime,
      replay_store: replayStore,
      consume: false,
    });
    settlementBlockerAllowed = blocker.settlement_simulation === "allowed";
  }

  if (receipt.receipt_type === "review_receipt") {
    reasons.push("review_receipt_not_settlement_eligible");
  } else if (receipt.receipt_type === "refusal_receipt") {
    reasons.push("refusal_receipt_not_settlement_eligible");
  }
  if (!settlementBlockerAllowed) reasons.push("settlement_blocker_rejected");

  const internallyConsistent = structurallyValid
    && receiptTypeConsistent
    && allowedConsistent
    && policyConsistent
    && checksPresent
    && reasonCodesConsistent
    && signatureValid
    && safetyMetadataConsistent;
  const fresh = freshness === "fresh" && (!isGatePass || gatePassValidityPassed);
  const coreVerified = structurallyValid
    && schemaSupported
    && internallyConsistent
    && fresh
    && replaySafe
    && expectedScopeMatches;
  const validForSettlement = coreVerified
    && isGatePass
    && !failedCriticalCheck
    && gatePassProtectionPassed
    && settlementBlockerAllowed;
  const verified = coreVerified
    && (options.require_settlement_eligibility !== true || validForSettlement);

  return {
    receipt_id: safeText(receipt.receipt_id, "unknown"),
    request_id: safeText(receipt.request_id, "unknown"),
    verified,
    valid_for_simulated_settlement: validForSettlement,
    structurally_valid: structurallyValid,
    schema_supported: schemaSupported,
    internally_consistent: internallyConsistent,
    fresh,
    replay_safe: replaySafe,
    settlement_blocker_allowed: settlementBlockerAllowed,
    receipt_type: safeText(receipt.receipt_type, "unknown"),
    verdict: safeText(receipt.verdict, "unknown"),
    reason_codes: unique(reasons),
    warnings: unique(warnings),
    checked_at: safeTimestamp(evaluationTime),
    mode: "local_simulation_only",
    note: NOTE,
  };
}

export function formatLocalTrustReceiptVerification(
  decision: LocalTrustReceiptVerificationDecision,
): string {
  return [
    `Receipt verification: ${decision.verified ? "verified" : "blocked"}`,
    `Valid for simulated settlement: ${decision.valid_for_simulated_settlement}`,
    `Structurally valid: ${decision.structurally_valid}`,
    `Internally consistent: ${decision.internally_consistent}`,
    `Fresh: ${decision.fresh}`,
    `Replay safe: ${decision.replay_safe}`,
    `Reason codes: ${decision.reason_codes.length === 0 ? "none" : decision.reason_codes.join(", ")}`,
    `Warnings: ${decision.warnings.length === 0 ? "none" : decision.warnings.join(", ")}`,
    `Mode: ${decision.mode}`,
    "No real settlement, payment, API call, or action execution occurred.",
  ].join("\n");
}

function failedDecision(
  receipt: unknown,
  reasons: LocalTrustReceiptVerificationReason[],
  currentTime?: string,
): LocalTrustReceiptVerificationDecision {
  const value = isRecord(receipt) ? receipt : {};
  return {
    receipt_id: safeText(value.receipt_id, "unknown"),
    request_id: safeText(value.request_id, "unknown"),
    verified: false,
    valid_for_simulated_settlement: false,
    structurally_valid: false,
    schema_supported: false,
    internally_consistent: false,
    fresh: false,
    replay_safe: false,
    settlement_blocker_allowed: false,
    receipt_type: safeText(value.receipt_type, "unknown"),
    verdict: safeText(value.verdict, "unknown"),
    reason_codes: reasons,
    warnings: [],
    checked_at: safeTimestamp(currentTime),
    mode: "local_simulation_only",
    note: NOTE,
  };
}

function hasValidTopLevelTypes(value: Record<string, unknown>): boolean {
  return [
    "receipt_id",
    "request_id",
    "agent_id",
    "requested_action",
    "action_category",
    "verdict",
    "receipt_type",
    "risk_tier",
    "policy_pack_version",
    "applied_policy",
    "risk_reason",
    "checked_at",
  ].every((field) => typeof value[field] === "string" && value[field].trim() !== "")
    && ["allowed", "settlement_allowed", "settlement_executed", "fast_path_allowed", "human_review_required"]
      .every((field) => typeof value[field] === "boolean")
    && Array.isArray(value.reason_codes)
    && value.reason_codes.every((code) => typeof code === "string")
    && (value.gate_pass_validity === null || isRecord(value.gate_pass_validity))
    && (value.replay_protection === null || isRecord(value.replay_protection))
    && isRecord(value.signature_metadata)
    && isRecord(value.audit_metadata);
}

function hasValidChecks(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return CRITICAL_CHECKS.every((name) => {
    const check = value[name];
    if (!isRecord(check) || typeof check.passed !== "boolean" || typeof check.reason !== "string") return false;
    if (name === "evidence" && typeof check.fresh !== "boolean") return false;
    if (name === "approval" && typeof check.required !== "boolean") return false;
    return true;
  });
}

function receiptTypeMatchesVerdict(receiptType: unknown, verdict: unknown): boolean {
  if (typeof receiptType !== "string" || typeof verdict !== "string") return false;
  if (verdict === "allow_signed_gate_pass") return receiptType === "signed_gate_pass";
  if (verdict === "review_required") return receiptType === "review_receipt";
  if (verdict.startsWith("refuse_")) return receiptType === "refusal_receipt";
  return false;
}

function allowedValuesAreConsistent(value: Record<string, unknown>): boolean {
  const allow = value.verdict === "allow_signed_gate_pass" && value.receipt_type === "signed_gate_pass";
  return value.allowed === allow
    && value.settlement_allowed === allow
    && value.settlement_executed === false
    && value.human_review_required === (value.verdict === "review_required");
}

function hasValidPolicyMetadata(value: Record<string, unknown>): boolean {
  const basic = value.policy_pack_version === "local-demo-v1"
    && nonEmpty(value.applied_policy)
    && nonEmpty(value.risk_reason)
    && typeof value.fast_path_allowed === "boolean"
    && typeof value.human_review_required === "boolean";
  if (!basic) return false;
  if (typeof value.verdict !== "string") return false;
  if (value.verdict.startsWith("refuse_")) return value.risk_tier === "blocked" && value.fast_path_allowed === false;
  if (!(["low", "medium", "high"] as unknown[]).includes(value.risk_tier)) return false;
  return value.fast_path_allowed !== true
    || (value.risk_tier === "low" && value.verdict === "allow_signed_gate_pass");
}

function reasonCodesMatchChecks(value: Record<string, unknown>): boolean {
  if (!Array.isArray(value.reason_codes) || !isRecord(value.checks)) return false;
  const codes = new Set(value.reason_codes.filter((code): code is string => typeof code === "string"));
  if (value.verdict === "allow_signed_gate_pass") {
    return CRITICAL_CHECKS.every((name) => isRecord(value.checks) && isRecord(value.checks[name]) && value.checks[name].passed === true)
      && codes.size === ALLOW_REASON_CODES.length
      && ALLOW_REASON_CODES.every((code) => codes.has(code));
  }
  if (value.verdict === "refuse_unsafe_action") {
    return codes.size === 1 && codes.has("UNSUPPORTED_UNSAFE_ACTION");
  }

  const decisionChecks: Record<string, string> = {
    review_required: "approval",
    refuse_no_mandate: "mandate",
    refuse_no_evidence: "evidence",
    refuse_stale_evidence: "evidence",
    refuse_no_verified_intent: "verified_intent",
    refuse_over_limit: "limits",
    refuse_missing_approval: "approval",
  };
  if (typeof value.verdict !== "string") return false;
  const checkName = decisionChecks[value.verdict];
  if (checkName === undefined) return false;
  const check = value.checks[checkName];
  if (!isRecord(check) || check.passed !== false) return false;
  const expected = expectedFailureCode(checkName, check.reason, value.verdict);
  return expected !== undefined && codes.size === 1 && codes.has(expected);
}

function expectedFailureCode(name: string, reason: unknown, verdict: unknown): string | undefined {
  const byReason: Record<string, string> = {
    mandate_missing: "MANDATE_REQUIRED",
    mandate_scope_missing: "MANDATE_SCOPE_REQUIRED",
    mandate_expired: "MANDATE_EXPIRED",
    evidence_missing: "EVIDENCE_REQUIRED",
    evidence_stale: "EVIDENCE_STALE",
    verified_intent_missing: "VERIFIED_INTENT_REQUIRED",
    configured_limit_exceeded: "LIMIT_EXCEEDED",
  };
  if (typeof reason === "string" && byReason[reason] !== undefined) return byReason[reason];
  if (name === "approval" && reason === "required_approval_missing_or_pending") {
    return verdict === "review_required" ? "HUMAN_REVIEW_REQUIRED" : "FINAL_APPROVAL_REQUIRED";
  }
  return undefined;
}

function hasValidLocalSignatureMetadata(value: unknown): boolean {
  return isRecord(value)
    && value.signature_mode === "local_demo_placeholder"
    && value.algorithm === "none"
    && typeof value.note === "string"
    && /not cryptographic signing/i.test(value.note);
}

function hasSafeAuditMetadata(value: unknown): boolean {
  return isRecord(value)
    && value.source === "local_gate_pass_demo"
    && value.local_only === true
    && value.private_data_included === false
    && value.network_call_performed === false
    && value.external_agent_contacted === false
    && value.payment_triggered === false
    && value.action_executed === false;
}

function checkExpectedScope(
  receipt: Record<string, unknown>,
  options: LocalTrustReceiptVerifierOptions,
  reasons: LocalTrustReceiptVerificationReason[],
): boolean {
  let matches = true;
  if (options.expected_request_id !== undefined && receipt.request_id !== options.expected_request_id) {
    reasons.push("request_id_mismatch");
    matches = false;
  }
  if (options.expected_agent_id !== undefined && receipt.agent_id !== options.expected_agent_id) {
    reasons.push("agent_id_mismatch");
    matches = false;
  }
  if (options.expected_requested_action !== undefined && receipt.requested_action !== options.expected_requested_action) {
    reasons.push("requested_action_mismatch");
    matches = false;
  }
  return matches;
}

function checkFreshness(
  checkedAt: unknown,
  currentTime: string,
  ttlSeconds: number | undefined,
): "fresh" | "expired" | "future" | "invalid" {
  const issued = parseTimestamp(checkedAt);
  const current = parseTimestamp(currentTime);
  if (issued === undefined || current === undefined) return "invalid";
  if (current.valueOf() < issued.valueOf()) return "future";
  const requestedTtl = typeof ttlSeconds === "number" && Number.isFinite(ttlSeconds)
    ? Math.max(0, Math.min(ttlSeconds, LOCAL_GATE_PASS_MAX_VALIDITY_SECONDS))
    : LOCAL_GATE_PASS_MAX_VALIDITY_SECONDS;
  return current.valueOf() - issued.valueOf() < requestedTtl * 1_000 ? "fresh" : "expired";
}

function safeEvaluationTime(currentTime: unknown, checkedAt: unknown): string {
  if (currentTime !== undefined) {
    return parseTimestamp(currentTime)?.toISOString() ?? String(currentTime);
  }
  if (parseTimestamp(checkedAt) !== undefined) return new Date(checkedAt as string).toISOString();
  return FALLBACK_TIMESTAMP;
}

function safeText(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const output = value.trim().replace(/[\u0000-\u001f\u007f]/g, " ").slice(0, 160);
  return output || fallback;
}

function safeTimestamp(value: unknown): string {
  return parseTimestamp(value)?.toISOString() ?? FALLBACK_TIMESTAMP;
}

function parseTimestamp(value: unknown): Date | undefined {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? undefined : parsed;
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

function addUnique<T>(values: T[], value: T): void {
  if (!values.includes(value)) values.push(value);
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
