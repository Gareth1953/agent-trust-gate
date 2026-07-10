import { createHash } from "node:crypto";

import {
  runLocalGatePassDemo,
  type LocalGatePassDemoInput,
  type LocalGatePassReceiptType,
  type LocalGatePassVerdict,
} from "./local-gate-pass-demo.js";
import { explainLocalPolicy, type LocalPolicyRiskTier } from "./local-policy.js";
import {
  createLocalGatePassProtectionMetadata,
  LOCAL_GATE_PASS_MAX_VALIDITY_SECONDS,
  type LocalGatePassReplayMetadata,
  type LocalGatePassValidityMetadata,
} from "./local-gate-pass-protection.js";

export type LocalGatePassRiskTier = LocalPolicyRiskTier | "blocked";

export interface LocalAuditCheck {
  passed: boolean;
  reason: string;
}

export interface LocalEvidenceAuditCheck extends LocalAuditCheck {
  fresh: boolean;
}

export interface LocalApprovalAuditCheck extends LocalAuditCheck {
  required: boolean;
}

export interface LocalReceiptProofMetadata {
  schema_version: "atg.local-proof-metadata.v1";
  proof_purpose: "pre_action_trust_gate";
  proof_status: "verified" | "review_required" | "blocked";
  issuer_ref: string;
  verifier_ref: string;
  created_at: string;
  expires_at: string;
  nonce: string;
  local_only: true;
  replay_freshness: {
    nonce: string;
    single_use: true;
    freshness_window_seconds: number;
    replay_protection: "local_in_memory_single_use" | "not_applicable";
  };
}

export interface LocalGatePassAuditReceipt {
  schema_version: "atg.local-gate-pass-receipt.v2";
  receipt_id: string;
  request_id: string;
  action_id: string;
  agent_id: string;
  requested_action: string;
  action_category: string;
  mandate_id: string;
  evidence_id: string;
  verdict: LocalGatePassVerdict;
  allowed: boolean;
  settlement_allowed: boolean;
  settlement_executed: false;
  receipt_type: LocalGatePassReceiptType;
  risk_tier: LocalGatePassRiskTier;
  policy_decision: "allow" | "review_required" | "refuse";
  issuer_ref: string;
  verifier_ref: string;
  proof_metadata: LocalReceiptProofMetadata;
  policy_pack_version: "local-demo-v1";
  applied_policy: string;
  risk_reason: string;
  fast_path_allowed: boolean;
  human_review_required: boolean;
  checks: {
    mandate: LocalAuditCheck;
    evidence: LocalEvidenceAuditCheck;
    verified_intent: LocalAuditCheck;
    limits: LocalAuditCheck;
    approval: LocalApprovalAuditCheck;
  };
  reason_codes: string[];
  checked_at: string;
  gate_pass_validity: LocalGatePassValidityMetadata | null;
  replay_protection: LocalGatePassReplayMetadata | null;
  signature_metadata: {
    signature_mode: "local_demo_placeholder";
    algorithm: "none";
    note: "Local demo placeholder only; not cryptographic signing.";
  };
  audit_metadata: {
    schema_version: "atg.local-gate-pass-receipt.v2";
    source: "local_gate_pass_demo";
    local_only: true;
    private_data_included: false;
    network_call_performed: false;
    external_agent_contacted: false;
    payment_triggered: false;
    action_executed: false;
  };
}

export interface LocalGatePassAuditSummary {
  request_id: string;
  verdict: LocalGatePassVerdict;
  receipt_type: LocalGatePassReceiptType;
  settlement_allowed: boolean;
  risk_tier: LocalGatePassRiskTier;
  applied_policy: string;
  human_review_required: boolean;
  fast_path_allowed: boolean;
  failed_checks: string[];
  reason_codes: string[];
  gate_pass_expires_at: string | null;
  replay_protection: "single_use" | "not_applicable";
}

export function createLocalGatePassAuditReceipt(
  input: LocalGatePassDemoInput,
): LocalGatePassAuditReceipt {
  const decision = runLocalGatePassDemo(input);
  const checkedAt = decision.checked_at;
  const policy = explainLocalPolicy(input, decision.verdict);
  const mandate = checkMandate(input, checkedAt);
  const evidence = checkEvidence(input);
  const verifiedIntent = checkVerifiedIntent(input);
  const limits = checkLimits(input);
  const approval = checkApproval(input, policy.requires_approval);
  const receiptId = createLocalGatePassReceiptId(input.request_id, checkedAt);
  const protection = decision.verdict === "allow_signed_gate_pass"
    ? createLocalGatePassProtectionMetadata(
      receiptId,
      safeText(input.request_id, "demo_request", 80),
      checkedAt,
      input.mandate?.expires_at,
    )
    : undefined;
  const actionId = safeText(input.action_id ?? input.request_id, "demo_action", 80);
  const mandateId = safeText(
    input.mandate?.mandate_id ?? `${actionId}_mandate`,
    "demo_mandate",
    80,
  );
  const evidenceId = safeText(
    input.evidence?.evidence_id ?? `${actionId}_evidence`,
    "demo_evidence",
    80,
  );
  const issuerRef = safeText(input.proof_metadata?.issuer_ref ?? input.issuer_ref ?? input.mandate?.issuer_ref ?? "local_demo_issuer", "local_demo_issuer", 80);
  const verifierRef = safeText(input.proof_metadata?.verifier_ref ?? input.verifier_ref ?? input.verified_intent?.verifier_ref ?? "local_demo_verifier", "local_demo_verifier", 80);
  const proofStatus = proofStatusForVerdict(decision.verdict);

  return {
    schema_version: "atg.local-gate-pass-receipt.v2",
    receipt_id: receiptId,
    request_id: safeText(input.request_id, "demo_request", 80),
    action_id: actionId,
    agent_id: safeText(input.agent_id, "demo_agent", 80),
    requested_action: safeText(input.requested_action, "unspecified_local_demo_action", 160),
    action_category: safeText(input.action_category, "unknown_local_category", 80),
    mandate_id: mandateId,
    evidence_id: evidenceId,
    verdict: decision.verdict,
    allowed: decision.allowed,
    settlement_allowed: decision.verdict === "allow_signed_gate_pass",
    settlement_executed: false,
    receipt_type: decision.receipt_type,
    risk_tier: riskTier(decision.verdict, policy.risk_tier),
    policy_pack_version: policy.policy_pack_version,
    policy_decision: policyDecisionForVerdict(decision.verdict),
    issuer_ref: issuerRef,
    verifier_ref: verifierRef,
    proof_metadata: createReceiptProofMetadata(input, checkedAt, issuerRef, verifierRef, proofStatus, protection?.validity.expires_at ?? null),
    applied_policy: policy.applied_policy,
    risk_reason: policy.risk_reason,
    fast_path_allowed: policy.fast_path_allowed,
    human_review_required: policy.human_review_required,
    checks: {
      mandate,
      evidence,
      verified_intent: verifiedIntent,
      limits,
      approval,
    },
    reason_codes: [...decision.reason_codes],
    checked_at: checkedAt,
    gate_pass_validity: protection?.validity ?? null,
    replay_protection: protection?.replay ?? null,
    signature_metadata: {
      signature_mode: "local_demo_placeholder",
      algorithm: "none",
      note: "Local demo placeholder only; not cryptographic signing.",
    },
    audit_metadata: {
      schema_version: "atg.local-gate-pass-receipt.v2",
      source: "local_gate_pass_demo",
      local_only: true,
      private_data_included: false,
      network_call_performed: false,
      external_agent_contacted: false,
      payment_triggered: false,
      action_executed: false,
    },
  };
}

export function createLocalGatePassReceiptId(
  requestId: string,
  checkedAt: string,
): string {
  const digest = createHash("sha256")
    .update(`${requestId}|${checkedAt}`, "utf8")
    .digest("hex");
  return `receipt_demo_${digest.slice(0, 24)}`;
}

export function summariseLocalGatePassAudit(
  receipt: LocalGatePassAuditReceipt,
): LocalGatePassAuditSummary {
  return {
    request_id: receipt.request_id,
    verdict: receipt.verdict,
    receipt_type: receipt.receipt_type,
    settlement_allowed: receipt.settlement_allowed,
    risk_tier: receipt.risk_tier,
    applied_policy: receipt.applied_policy,
    human_review_required: receipt.human_review_required,
    fast_path_allowed: receipt.fast_path_allowed,
    failed_checks: Object.entries(receipt.checks)
      .filter(([, check]) => !check.passed)
      .map(([name]) => name),
    reason_codes: [...receipt.reason_codes],
    gate_pass_expires_at: receipt.gate_pass_validity?.expires_at ?? null,
    replay_protection: receipt.replay_protection?.single_use === true
      ? "single_use"
      : "not_applicable",
  };
}

function checkMandate(input: LocalGatePassDemoInput, checkedAt: string): LocalAuditCheck {
  if (input.mandate?.present !== true) return { passed: false, reason: "mandate_missing" };
  if (!input.mandate.scope?.trim()) return { passed: false, reason: "mandate_scope_missing" };
  const expiry = new Date(input.mandate.expires_at ?? "");
  const checked = new Date(checkedAt);
  if (Number.isNaN(expiry.valueOf()) || expiry.valueOf() <= checked.valueOf()) {
    return { passed: false, reason: "mandate_expired" };
  }
  return { passed: true, reason: "mandate_present_in_scope_and_current" };
}

function checkEvidence(input: LocalGatePassDemoInput): LocalEvidenceAuditCheck {
  const present = input.evidence?.present === true;
  const fresh = present && input.evidence?.fresh === true;
  return {
    passed: fresh,
    fresh,
    reason: !present ? "evidence_missing" : fresh ? "evidence_present_and_fresh" : "evidence_stale",
  };
}

function checkVerifiedIntent(input: LocalGatePassDemoInput): LocalAuditCheck {
  const passed = input.verified_intent?.present === true;
  return { passed, reason: passed ? "intent_verified" : "verified_intent_missing" };
}

function checkLimits(input: LocalGatePassDemoInput): LocalAuditCheck {
  const spend = amount(input.limits?.spend_amount_gbp);
  const maximum = amount(input.limits?.max_allowed_gbp);
  const passed = spend <= maximum;
  return { passed, reason: passed ? "within_configured_limit" : "configured_limit_exceeded" };
}

function checkApproval(
  input: LocalGatePassDemoInput,
  policyRequiresApproval: boolean,
): LocalApprovalAuditCheck {
  const required = input.approval?.required === true || policyRequiresApproval;
  const passed = !required || input.approval?.status === "approved";
  return {
    passed,
    required,
    reason: !required
      ? "approval_not_required"
      : passed
        ? "required_approval_present"
        : "required_approval_missing_or_pending",
  };
}

function riskTier(
  verdict: LocalGatePassVerdict,
  policyTier: LocalPolicyRiskTier,
): LocalGatePassRiskTier {
  if (verdict.startsWith("refuse_")) return "blocked";
  return policyTier;
}

function policyDecisionForVerdict(
  verdict: LocalGatePassVerdict,
): "allow" | "review_required" | "refuse" {
  if (verdict === "allow_signed_gate_pass") return "allow";
  if (verdict === "review_required") return "review_required";
  return "refuse";
}

function proofStatusForVerdict(
  verdict: LocalGatePassVerdict,
): "verified" | "review_required" | "blocked" {
  if (verdict === "allow_signed_gate_pass") return "verified";
  if (verdict === "review_required") return "review_required";
  return "blocked";
}

function createReceiptProofMetadata(
  input: LocalGatePassDemoInput,
  checkedAt: string,
  issuerRef: string,
  verifierRef: string,
  proofStatus: "verified" | "review_required" | "blocked",
  gatePassExpiresAt: string | null,
): LocalReceiptProofMetadata {
  const nonce = safeText(
    input.proof_metadata?.nonce ?? input.nonce ?? createLocalMetadataNonce(input.request_id, checkedAt),
    "nonce_local_demo",
    80,
  );
  return {
    schema_version: "atg.local-proof-metadata.v1",
    proof_purpose: "pre_action_trust_gate",
    proof_status: proofStatus,
    issuer_ref: issuerRef,
    verifier_ref: verifierRef,
    created_at: safeTimestampText(input.proof_metadata?.created_at ?? checkedAt, checkedAt),
    expires_at: safeTimestampText(gatePassExpiresAt ?? input.proof_metadata?.expires_at ?? input.mandate?.expires_at ?? checkedAt, checkedAt),
    nonce,
    local_only: true,
    replay_freshness: {
      nonce: safeText(input.proof_metadata?.replay_freshness?.nonce ?? nonce, nonce, 80),
      single_use: true,
      freshness_window_seconds: LOCAL_GATE_PASS_MAX_VALIDITY_SECONDS,
      replay_protection: gatePassExpiresAt === null ? "not_applicable" : "local_in_memory_single_use",
    },
  };
}

function createLocalMetadataNonce(seed: string, checkedAt: string): string {
  const digest = createHash("sha256")
    .update(`${seed}|${checkedAt}|proof_metadata`, "utf8")
    .digest("hex");
  return `nonce_${digest.slice(0, 32)}`;
}

function safeTimestampText(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? fallback : parsed.toISOString();
}

function amount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0;
}

function safeText(value: unknown, fallback: string, maximum: number): string {
  if (typeof value !== "string") return fallback;
  const normalised = value.trim().replace(/[\u0000-\u001f\u007f]/g, " ").slice(0, maximum);
  return normalised || fallback;
}
