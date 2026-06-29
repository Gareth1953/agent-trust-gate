import { createHash } from "node:crypto";

import type {
  RefusalReasonCode,
  RefusalRecommendedNextStep,
  RefusalType,
} from "./refusalgraph-signal-engine.js";

export const REFUSALGRAPH_QUERY_ENGINE_VERSION = "atg.refusalgraph-query-engine.v1" as const;

export type RefusalGraphCautionLevel = "none" | "low" | "medium" | "high" | "critical";

export type RefusalGraphQueryDecision = RefusalRecommendedNextStep;

export interface RefusalGraphQuery {
  [key: string]: unknown;
  query_id: string;
  requested_action_category: string;
  requested_action_type: string;
  risk_level: string;
  impact_level: string;
  evidence_status: string;
  approval_status: string;
  agent_identity_status: string;
  payment_intent_status: string;
}

export interface LocalRefusalGraphSignal {
  [key: string]: unknown;
  signal_id: string;
  action_category: string;
  proposed_action_type: string;
  refusal_type: RefusalType | string;
  refusal_reason_codes: readonly (RefusalReasonCode | string)[];
  risk_level: string;
  impact_level: string;
  evidence_status: string;
  approval_status: string;
  recommended_next_step: RefusalRecommendedNextStep | string;
  status: string;
}

export interface RefusalGraphQueryResult {
  query_id: string;
  result_status: "matches_found" | "no_matches";
  matched_signal_count: number;
  caution_level: RefusalGraphCautionLevel;
  common_refusal_reason_codes: RefusalReasonCode[];
  recommended_decision: RefusalGraphQueryDecision;
  recommended_next_steps: RefusalRecommendedNextStep[];
  private_data_included: false;
  network_lookup_performed: false;
  external_lookup_performed: false;
  payment_or_fee_triggered: false;
  status: "draft_only";
}

const ACTION_CATEGORIES = new Set([
  "financial_action", "publishing", "customer_communication", "deployment",
  "data_access", "external_connection", "signup", "billing",
  "automatic_purchase", "high_risk_action", "other",
]);

const ACTION_TYPES = new Set([
  "initiate_payment", "publish_content", "buy_service", "email_customer",
  "access_data", "deploy_code", "enable_billing", "enable_signup",
  "connect_external_system", "automatic_purchase", "other",
]);

const REASON_CODES = new Set<RefusalReasonCode>([
  "missing_human_approval", "missing_evidence", "weak_or_missing_identity",
  "payment_intent_unclear", "high_risk_action", "policy_blocked",
  "customer_facing_action", "money_movement_requested", "publishing_requested",
  "deployment_requested", "billing_requested", "signup_requested",
  "data_access_requested", "external_connection_requested",
  "automatic_purchase_requested", "private_data_risk",
  "unknown_or_unclear_intent",
]);

const NEXT_STEPS = new Set<RefusalRecommendedNextStep>([
  "require_human_approval", "require_more_evidence",
  "require_identity_verification", "clarify_payment_intent", "cap_spend_limit",
  "refuse_transaction", "allow_low_risk_only", "create_receipt_only",
  "keep_blocked",
]);

export function queryRefusalGraphSignals(
  query: RefusalGraphQuery,
  signals: readonly LocalRefusalGraphSignal[],
): RefusalGraphQueryResult {
  const category = safeEnum(query.requested_action_category, ACTION_CATEGORIES, "other");
  const actionType = safeEnum(query.requested_action_type, ACTION_TYPES, "other");
  const matches = signals.filter((signal) => isLocalMatch(signal, category, actionType));
  const reasonCodes = aggregateRefusalReasonCodes(matches);
  const highRiskMatchCount = matches.filter(isHighRiskSignal).length;
  const queryContextCodes = deriveQueryContextCodes(query, category, actionType);
  const decisionCodes = [...new Set([...reasonCodes, ...queryContextCodes])];
  const recommendedDecision = recommendDecision(
    decisionCodes,
    matches.length,
    highRiskMatchCount,
    query,
  );

  return {
    query_id: pseudonymiseQueryId(query.query_id),
    result_status: matches.length > 0 ? "matches_found" : "no_matches",
    matched_signal_count: matches.length,
    caution_level: calculateCautionLevel(matches, reasonCodes, highRiskMatchCount),
    common_refusal_reason_codes: reasonCodes,
    recommended_decision: recommendedDecision,
    recommended_next_steps: aggregateRecommendedNextSteps(matches, recommendedDecision),
    private_data_included: false,
    network_lookup_performed: false,
    external_lookup_performed: false,
    payment_or_fee_triggered: false,
    status: "draft_only",
  };
}

export function aggregateRefusalReasonCodes(
  signals: readonly LocalRefusalGraphSignal[],
): RefusalReasonCode[] {
  const frequencies = new Map<RefusalReasonCode, number>();
  for (const signal of signals) {
    const uniqueCodes = new Set<RefusalReasonCode>(
      signal.refusal_reason_codes.filter(isRefusalReasonCode),
    );
    const evidenceStatus = safeToken(signal.evidence_status);
    const approvalStatus = safeToken(signal.approval_status);
    const refusalType = safeToken(signal.refusal_type);
    if (["missing", "incomplete", "insufficient", "hash_only_incomplete"].includes(evidenceStatus)) {
      uniqueCodes.add("missing_evidence");
    }
    if (["not_requested", "rejected", "missing"].includes(approvalStatus)) {
      uniqueCodes.add("missing_human_approval");
    }
    if (refusalType === "identity_unclear") uniqueCodes.add("weak_or_missing_identity");
    if (refusalType === "payment_intent_unclear") uniqueCodes.add("payment_intent_unclear");
    if (isHighRiskSignal(signal)) uniqueCodes.add("high_risk_action");
    for (const code of uniqueCodes) {
      frequencies.set(code, (frequencies.get(code) ?? 0) + 1);
    }
  }

  return [...frequencies.entries()]
    .sort(([leftCode, leftCount], [rightCode, rightCount]) =>
      rightCount - leftCount || leftCode.localeCompare(rightCode))
    .map(([code]) => code);
}

function isLocalMatch(
  signal: LocalRefusalGraphSignal,
  category: string,
  actionType: string,
): boolean {
  const status = safeToken(signal.status);
  if (status !== "draft_only" && status !== "local_only") return false;

  const signalCategory = safeEnum(signal.action_category, ACTION_CATEGORIES, "other");
  if (signalCategory !== category) return false;

  const signalActionType = safeEnum(signal.proposed_action_type, ACTION_TYPES, "other");
  return actionType === "other" || signalActionType === "other" || signalActionType === actionType;
}

function isHighRiskSignal(signal: LocalRefusalGraphSignal): boolean {
  const risk = safeToken(signal.risk_level);
  const impact = safeToken(signal.impact_level);
  const refusalType = safeToken(signal.refusal_type);
  return risk === "high" || risk === "blocked" || impact === "high"
    || refusalType === "high_risk_action"
    || signal.refusal_reason_codes.some((code) => code === "high_risk_action");
}

function calculateCautionLevel(
  matches: readonly LocalRefusalGraphSignal[],
  reasonCodes: readonly RefusalReasonCode[],
  highRiskMatchCount: number,
): RefusalGraphCautionLevel {
  if (matches.length === 0) return "none";
  if (highRiskMatchCount >= 3) return "critical";
  if (highRiskMatchCount > 0 || reasonCodes.includes("policy_blocked")) return "high";
  if (matches.length >= 2 || reasonCodes.some(isControlGapCode)) return "medium";
  return "low";
}

function deriveQueryContextCodes(
  query: RefusalGraphQuery,
  category: string,
  actionType: string,
): RefusalReasonCode[] {
  const codes = new Set<RefusalReasonCode>();
  const evidenceStatus = safeToken(query.evidence_status);
  const approvalStatus = safeToken(query.approval_status);
  const identityStatus = safeToken(query.agent_identity_status);
  const paymentStatus = safeToken(query.payment_intent_status);
  const riskLevel = safeToken(query.risk_level);

  if (["missing", "incomplete", "insufficient", "unknown"].includes(evidenceStatus)) {
    codes.add("missing_evidence");
  }
  if (["missing", "not_requested", "required", "rejected", "unknown"].includes(approvalStatus)) {
    codes.add("missing_human_approval");
  }
  if (["missing", "unclear", "unknown", "unverified"].includes(identityStatus)) {
    codes.add("weak_or_missing_identity");
  }
  if (["missing", "unclear", "unknown", "ambiguous"].includes(paymentStatus)) {
    codes.add("payment_intent_unclear");
  }
  if (riskLevel === "high" || riskLevel === "blocked") codes.add("high_risk_action");
  if (category === "financial_action" || actionType === "initiate_payment" || actionType === "buy_service") {
    codes.add("money_movement_requested");
  }
  if (category === "automatic_purchase" || actionType === "automatic_purchase") {
    codes.add("automatic_purchase_requested");
  }

  return [...codes];
}

function recommendDecision(
  codes: readonly RefusalReasonCode[],
  matchCount: number,
  highRiskMatchCount: number,
  query: RefusalGraphQuery,
): RefusalGraphQueryDecision {
  if (matchCount === 0) {
    return safeToken(query.risk_level) === "low" && safeToken(query.impact_level) === "low"
      ? "allow_low_risk_only"
      : "create_receipt_only";
  }
  if (highRiskMatchCount >= 3) return "refuse_transaction";
  if (codes.includes("missing_human_approval")) return "require_human_approval";
  if (codes.includes("missing_evidence")) return "require_more_evidence";
  if (codes.includes("weak_or_missing_identity")) return "require_identity_verification";
  if (codes.includes("payment_intent_unclear")) return "clarify_payment_intent";
  if (codes.includes("money_movement_requested") || codes.includes("automatic_purchase_requested")) {
    return "require_human_approval";
  }
  if (codes.includes("policy_blocked")) return "keep_blocked";
  return "keep_blocked";
}

function aggregateRecommendedNextSteps(
  signals: readonly LocalRefusalGraphSignal[],
  decision: RefusalGraphQueryDecision,
): RefusalRecommendedNextStep[] {
  const steps = new Set<RefusalRecommendedNextStep>([decision]);
  for (const signal of signals) {
    if (
      isRecommendedNextStep(signal.recommended_next_step)
      && signal.recommended_next_step !== "allow_low_risk_only"
    ) {
      steps.add(signal.recommended_next_step);
    }
  }
  return [...steps].sort((left, right) =>
    nextStepPriority(left) - nextStepPriority(right) || left.localeCompare(right));
}

function nextStepPriority(step: RefusalRecommendedNextStep): number {
  const priorities: Record<RefusalRecommendedNextStep, number> = {
    refuse_transaction: 0,
    keep_blocked: 1,
    require_human_approval: 2,
    require_identity_verification: 3,
    require_more_evidence: 4,
    clarify_payment_intent: 5,
    cap_spend_limit: 6,
    allow_low_risk_only: 7,
    create_receipt_only: 8,
  };
  return priorities[step];
}

function isControlGapCode(code: RefusalReasonCode): boolean {
  return code === "missing_human_approval" || code === "missing_evidence"
    || code === "weak_or_missing_identity" || code === "payment_intent_unclear";
}

function isRefusalReasonCode(value: RefusalReasonCode | string): value is RefusalReasonCode {
  return REASON_CODES.has(value as RefusalReasonCode);
}

function isRecommendedNextStep(
  value: RefusalRecommendedNextStep | string,
): value is RefusalRecommendedNextStep {
  return NEXT_STEPS.has(value as RefusalRecommendedNextStep);
}

function safeToken(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 64);
}

function safeEnum(value: string, allowed: ReadonlySet<string>, fallback: string): string {
  const token = safeToken(value);
  return allowed.has(token) ? token : fallback;
}

function pseudonymiseQueryId(queryId: string): string {
  const digest = createHash("sha256").update(queryId, "utf8").digest("hex");
  return `query_${digest.slice(0, 24)}`;
}
