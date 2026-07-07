import type { LocalGatePassDemoInput, LocalGatePassVerdict } from "./local-gate-pass-demo.js";

export const LOCAL_POLICY_PACK_VERSION = "local-demo-v1" as const;

export type LocalPolicyRiskTier = "low" | "medium" | "high" | "prohibited";

export interface LocalPolicyRule {
  action_category: string;
  risk_tier: LocalPolicyRiskTier;
  requires_approval: boolean;
  requires_fresh_evidence: true;
  requires_verified_intent: true;
  allows_fast_path: boolean;
  settlement_blocked_by_default: true;
  risk_reason: string;
}

export interface LocalPolicyExplanation extends LocalPolicyRule {
  policy_pack_version: typeof LOCAL_POLICY_PACK_VERSION;
  applied_policy: string;
  fast_path_allowed: boolean;
  human_review_required: boolean;
}

export interface LocalPolicySummary {
  request_id: string;
  risk_tier: LocalPolicyRiskTier;
  applied_policy: string;
  verdict: LocalGatePassVerdict;
  human_review_required: boolean;
  fast_path_allowed: boolean;
  settlement_allowed: boolean;
  reason_codes: string[];
}

const LOW_RISK = new Set([
  "local_review",
  "read_only_summary",
  "internal_classification",
  "safe_local_update_check",
  "non_customer_draft",
]);
const MEDIUM_RISK = new Set([
  "customer_facing_draft",
  "supplier_comparison",
  "supplier_review",
  "workflow_recommendation",
  "purchase_recommendation",
]);
const HIGH_RISK = new Set([
  "money_review",
  "money_movement",
  "purchase_authorization",
  "contract_commitment",
  "legal_compliance_action",
  "customer_impacting_external_communication",
]);
const PROHIBITED = new Set([
  "restricted_material_handling",
  "autonomous_payment_execution",
  "unsupported_unsafe_action",
]);

export function classifyLocalPolicy(input: LocalGatePassDemoInput): LocalPolicyRule {
  const actionCategory = normalizeCategory(input.action_category);
  const riskTier: LocalPolicyRiskTier = PROHIBITED.has(actionCategory)
    ? "prohibited"
    : HIGH_RISK.has(actionCategory)
      ? "high"
      : MEDIUM_RISK.has(actionCategory)
        ? "medium"
        : LOW_RISK.has(actionCategory)
          ? "low"
          : "medium";

  return {
    action_category: actionCategory,
    risk_tier: riskTier,
    requires_approval: riskTier === "medium" || riskTier === "high" || riskTier === "prohibited",
    requires_fresh_evidence: true,
    requires_verified_intent: true,
    allows_fast_path: riskTier === "low",
    settlement_blocked_by_default: true,
    risk_reason: riskReason(riskTier),
  };
}

export function explainLocalPolicy(
  input: LocalGatePassDemoInput,
  verdict: LocalGatePassVerdict,
): LocalPolicyExplanation {
  const rule = classifyLocalPolicy(input);
  const allowed = verdict === "allow_signed_gate_pass";
  return {
    ...rule,
    policy_pack_version: LOCAL_POLICY_PACK_VERSION,
    applied_policy: appliedPolicy(rule.risk_tier, verdict),
    fast_path_allowed: allowed && rule.allows_fast_path,
    human_review_required: verdict === "review_required",
  };
}

export function summariseLocalPolicy(
  input: LocalGatePassDemoInput,
  verdict: LocalGatePassVerdict,
  reasonCodes: readonly string[],
): LocalPolicySummary {
  const policy = explainLocalPolicy(input, verdict);
  return {
    request_id: normalizeIdentifier(input.request_id),
    risk_tier: policy.risk_tier,
    applied_policy: policy.applied_policy,
    verdict,
    human_review_required: policy.human_review_required,
    fast_path_allowed: policy.fast_path_allowed,
    settlement_allowed: verdict === "allow_signed_gate_pass",
    reason_codes: [...reasonCodes],
  };
}

function appliedPolicy(tier: LocalPolicyRiskTier, verdict: LocalGatePassVerdict): string {
  if (verdict === "refuse_no_mandate") return "refusal-no-mandate";
  if (verdict === "refuse_no_evidence") return "refusal-no-evidence";
  if (verdict === "refuse_stale_evidence") return "refusal-stale-evidence";
  if (verdict === "refuse_no_verified_intent") return "refusal-no-verified-intent";
  if (verdict === "refuse_over_limit") return "refusal-over-limit";
  if (verdict === "refuse_missing_approval") return "refusal-missing-approval";
  if (verdict === "refuse_unsafe_action") return "refusal-unsafe-action";
  if (verdict === "review_required") {
    return tier === "high" ? "high-risk-approval-required" : "medium-risk-review-required";
  }
  return tier === "low" ? "low-risk-local-demo" : `${tier}-risk-approved-local-demo`;
}

function riskReason(tier: LocalPolicyRiskTier): string {
  if (tier === "low") return "Low-impact local category eligible for fast path only after all checks pass.";
  if (tier === "medium") return "Uncertain or externally relevant category is gated for explicit review.";
  if (tier === "high") return "Money, legal, contractual, or customer-impacting category requires explicit approval.";
  return "Unsupported or unsafe category is prohibited in the local demo.";
}

function normalizeCategory(value: unknown): string {
  if (typeof value !== "string") return "unknown";
  const output = value.trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_").slice(0, 80);
  return output || "unknown";
}

function normalizeIdentifier(value: unknown): string {
  if (typeof value !== "string") return "demo_request";
  const output = value.trim().replace(/[^a-zA-Z0-9_-]+/g, "_").slice(0, 80);
  return output || "demo_request";
}
