import { classifyLocalPolicy } from "./local-policy.js";

export type LocalGatePassVerdict =
  | "allow_signed_gate_pass"
  | "review_required"
  | "refuse_no_mandate"
  | "refuse_no_evidence"
  | "refuse_stale_evidence"
  | "refuse_no_verified_intent"
  | "refuse_over_limit"
  | "refuse_missing_approval"
  | "refuse_unsafe_action";

export type LocalGatePassReceiptType =
  | "signed_gate_pass"
  | "review_receipt"
  | "refusal_receipt";

export interface LocalGatePassDemoInput {
  request_id: string;
  agent_id: string;
  requested_action: string;
  action_category: string;
  mandate?: {
    present?: boolean;
    scope?: string;
    expires_at?: string;
  };
  verified_intent?: {
    present?: boolean;
    source?: string;
  };
  evidence?: {
    present?: boolean;
    fresh?: boolean;
    source?: string;
  };
  limits?: {
    spend_amount_gbp?: number;
    max_allowed_gbp?: number;
  };
  approval?: {
    required?: boolean;
    status?: "not_required" | "pending" | "approved" | "rejected" | "unknown";
  };
  checked_at?: string;
}

export interface LocalGatePassDemoResult {
  request_id: string;
  verdict: LocalGatePassVerdict;
  allowed: boolean;
  settlement_allowed: false;
  reason_codes: string[];
  checked_at: string;
  receipt_type: LocalGatePassReceiptType;
  signature_metadata: {
    signature_mode: "local_demo_placeholder";
    signed: false;
    cryptographic_signature_created: false;
    purpose: "local_proof_artifact_only";
  };
  action_executed: false;
  payment_triggered: false;
  network_call_performed: false;
  external_agent_contacted: false;
  local_only: true;
}

export function runLocalGatePassDemo(input: LocalGatePassDemoInput): LocalGatePassDemoResult {
  const policy = classifyLocalPolicy(input);
  if (policy.risk_tier === "prohibited") {
    return result(input, "refuse_unsafe_action", ["UNSUPPORTED_UNSAFE_ACTION"]);
  }

  if (input.mandate?.present !== true) {
    return result(input, "refuse_no_mandate", ["MANDATE_REQUIRED"]);
  }

  if (typeof input.mandate.scope !== "string" || input.mandate.scope.trim() === "") {
    return result(input, "refuse_no_mandate", ["MANDATE_SCOPE_REQUIRED"]);
  }

  if (isExpired(input.mandate.expires_at, input.checked_at)) {
    return result(input, "refuse_no_mandate", ["MANDATE_EXPIRED"]);
  }

  if (input.evidence?.present !== true) {
    return result(input, "refuse_no_evidence", ["EVIDENCE_REQUIRED"]);
  }

  if (input.evidence.fresh !== true) {
    return result(input, "refuse_stale_evidence", ["EVIDENCE_STALE"]);
  }

  if (input.verified_intent?.present !== true) {
    return result(input, "refuse_no_verified_intent", ["VERIFIED_INTENT_REQUIRED"]);
  }

  const spend = safeAmount(input.limits?.spend_amount_gbp);
  const limit = safeAmount(input.limits?.max_allowed_gbp);
  if (spend > limit) {
    return result(input, "refuse_over_limit", ["LIMIT_EXCEEDED"]);
  }

  if ((input.approval?.required === true || policy.requires_approval) && input.approval?.status !== "approved") {
    const isReviewable = input.approval?.status === "pending" || input.approval?.status === "unknown";
    return result(
      input,
      isReviewable ? "review_required" : "refuse_missing_approval",
      [isReviewable ? "HUMAN_REVIEW_REQUIRED" : "FINAL_APPROVAL_REQUIRED"],
    );
  }

  return result(input, "allow_signed_gate_pass", [
    "MANDATE_VALID",
    "EVIDENCE_FRESH",
    "INTENT_VERIFIED",
    "WITHIN_LIMITS",
    "APPROVAL_SATISFIED",
  ]);
}

function result(
  input: LocalGatePassDemoInput,
  verdict: LocalGatePassVerdict,
  reasonCodes: string[],
): LocalGatePassDemoResult {
  const allowed = verdict === "allow_signed_gate_pass";
  const receiptType: LocalGatePassReceiptType = allowed
    ? "signed_gate_pass"
    : verdict === "review_required"
      ? "review_receipt"
      : "refusal_receipt";

  return {
    request_id: safeIdentifier(input.request_id),
    verdict,
    allowed,
    settlement_allowed: false,
    reason_codes: reasonCodes,
    checked_at: safeTimestamp(input.checked_at),
    receipt_type: receiptType,
    signature_metadata: {
      signature_mode: "local_demo_placeholder",
      signed: false,
      cryptographic_signature_created: false,
      purpose: "local_proof_artifact_only",
    },
    action_executed: false,
    payment_triggered: false,
    network_call_performed: false,
    external_agent_contacted: false,
    local_only: true,
  };
}

function safeAmount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : 0;
}

function safeIdentifier(value: string): string {
  const normalised = value.trim().replace(/[^a-zA-Z0-9_-]+/g, "_").slice(0, 80);
  return normalised || "demo_request";
}

function safeTimestamp(value: unknown): string {
  if (typeof value !== "string") return "1970-01-01T00:00:00.000Z";
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf())
    ? "1970-01-01T00:00:00.000Z"
    : parsed.toISOString();
}

function isExpired(expiresAt: unknown, checkedAt: unknown): boolean {
  if (typeof expiresAt !== "string" || typeof checkedAt !== "string") return true;
  const expiry = new Date(expiresAt);
  const checked = new Date(checkedAt);
  if (Number.isNaN(expiry.valueOf()) || Number.isNaN(checked.valueOf())) return true;
  return expiry.valueOf() <= checked.valueOf();
}
