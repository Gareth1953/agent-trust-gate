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
  schema_version?: "atg.local-agent-action-request.v2";
  request_id: string;
  action_id?: string;
  agent_id: string;
  requested_action: string;
  action_category: string;
  local_only?: true;
  issuer_ref?: string;
  verifier_ref?: string;
  nonce?: string;
  mandate?: {
    present?: boolean;
    mandate_id?: string;
    scope?: string;
    expires_at?: string;
    issuer_ref?: string;
  };
  verified_intent?: {
    present?: boolean;
    status?: "verified" | "unverified" | "missing";
    source?: string;
    verifier_ref?: string;
    verified_at?: string;
  };
  evidence?: {
    present?: boolean;
    fresh?: boolean;
    evidence_id?: string;
    evidence_type?: "local_fixture" | "local_document" | "local_receipt" | "local_policy" | "synthetic_observation";
    source?: string;
    local_reference?: string;
    evidence_hash?: string;
    verified_at?: string;
    freshness?: {
      checked_at?: string;
      expires_at?: string;
      max_age_seconds?: number;
    };
  };
  limits?: {
    spend_amount_gbp?: number;
    max_allowed_gbp?: number;
  };
  approval?: {
    required?: boolean;
    status?: "not_required" | "pending" | "approved" | "rejected" | "unknown";
  };
  risk_context?: {
    risk_tier?: "low" | "medium" | "high" | "blocked";
    policy_decision?: "allow" | "review_required" | "refuse";
    policy_pack_version?: "local-demo-v1";
  };
  proof_metadata?: {
    schema_version?: "atg.local-proof-metadata.v1";
    proof_purpose?: "pre_action_trust_gate" | "pre_settlement_money_gate";
    proof_status?: "candidate" | "verified" | "review_required" | "blocked";
    issuer_ref?: string;
    verifier_ref?: string;
    created_at?: string;
    expires_at?: string;
    nonce?: string;
    local_only?: true;
    replay_freshness?: {
      nonce?: string;
      single_use?: true;
      freshness_window_seconds?: number;
      replay_protection?: "local_in_memory_single_use" | "not_applicable";
    };
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
