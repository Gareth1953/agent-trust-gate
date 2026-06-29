import { createHash } from "node:crypto";

import type { RefusalGraphCautionLevel, RefusalGraphQueryResult } from "./refusalgraph-query-engine.js";

export const AGENT_CLEARING_DECISION_ENGINE_VERSION = "atg.agent-clearing-decision-engine.v1" as const;

export type AgentClearingDecisionType =
  | "accept_with_limits"
  | "require_more_evidence"
  | "require_human_approval"
  | "require_identity_verification"
  | "clarify_payment_intent"
  | "cap_spend_limit"
  | "refuse_transaction"
  | "keep_blocked"
  | "create_receipt_only"
  | "draft_only_not_executed";

export type AgentClearingReasonCode =
  | "missing_human_approval"
  | "missing_evidence"
  | "weak_or_missing_identity"
  | "payment_intent_unclear"
  | "refusalgraph_high_caution"
  | "refusalgraph_critical_caution"
  | "high_risk_action"
  | "money_movement_requested"
  | "payment_requested"
  | "billing_requested"
  | "settlement_requested"
  | "automatic_purchase_requested"
  | "deployment_requested"
  | "publishing_requested"
  | "customer_facing_action"
  | "signup_requested"
  | "private_data_access_requested"
  | "external_connection_requested"
  | "low_risk_receipt_only"
  | "unknown_or_unclear_intent"
  | "draft_only_not_executed";

export interface AgentClearingDecisionInput {
  [key: string]: unknown;
  clearing_request_id: string;
  requesting_agent_type: string;
  receiving_agent_type: string;
  requested_action_category: string;
  requested_action_type: string;
  proposed_value: number | null;
  proposed_fee: number | null;
  risk_level: string;
  impact_level: string;
  evidence_status: string;
  approval_status: string;
  agent_identity_status: string;
  payment_intent_status: string;
  refusalgraph_query_result: RefusalGraphQueryResult;
  requested_decision: string;
  timestamp: string;
}

export interface AgentClearingDecision {
  clearing_decision_id: string;
  clearing_request_id: string;
  decision: AgentClearingDecisionType;
  action_allowed: boolean;
  action_blocked: boolean;
  approval_required: boolean;
  evidence_required: boolean;
  identity_verification_required: boolean;
  payment_intent_clarification_required: boolean;
  spend_limit_recommended: boolean;
  refusalgraph_caution_level: RefusalGraphCautionLevel;
  refusalgraph_matched_signal_count: number;
  reason_codes: AgentClearingReasonCode[];
  required_next_steps: AgentClearingDecisionType[];
  receipt_recommended: true;
  private_data_included: false;
  network_lookup_performed: false;
  external_lookup_performed: false;
  payment_or_fee_triggered: false;
  action_executed: false;
  status: "draft_only";
  created_at: string;
}

const ACTION_CATEGORIES = new Set([
  "financial_action", "payment", "billing", "settlement", "automatic_purchase",
  "deployment", "publishing", "customer_communication", "signup", "data_access",
  "private_data_access", "external_connection", "internal_action", "other",
]);

const ACTION_TYPES = new Set([
  "initiate_payment", "pay_for_task", "buy_service", "enable_billing",
  "settle_transaction", "automatic_purchase", "deploy_code", "publish_content",
  "email_customer", "enable_signup", "access_data", "access_private_data",
  "connect_external_system", "internal_review", "other",
]);

const PROTECTED_CATEGORIES = new Set([
  "financial_action", "payment", "billing", "settlement", "automatic_purchase",
  "deployment", "publishing", "customer_communication", "signup", "data_access",
  "private_data_access", "external_connection",
]);

const MONEY_CATEGORIES = new Set([
  "financial_action", "payment", "billing", "settlement", "automatic_purchase",
]);

const MONEY_ACTION_TYPES = new Set([
  "initiate_payment", "pay_for_task", "buy_service", "enable_billing",
  "settle_transaction", "automatic_purchase",
]);

export function createAgentClearingDecision(
  input: AgentClearingDecisionInput,
): AgentClearingDecision {
  const category = safeEnum(input.requested_action_category, ACTION_CATEGORIES, "other");
  const actionType = safeEnum(input.requested_action_type, ACTION_TYPES, "other");
  const cautionLevel = safeCautionLevel(input.refusalgraph_query_result.caution_level);
  const matchedSignalCount = safeCount(input.refusalgraph_query_result.matched_signal_count);
  const reasonCodes = deriveAgentClearingReasonCodes(input, category, actionType);
  const decision = selectDecision(input, category, actionType, cautionLevel, reasonCodes);
  const requestDigest = createHash("sha256")
    .update(input.clearing_request_id, "utf8")
    .digest("hex")
    .slice(0, 24);
  const actionAllowed = decision === "accept_with_limits";

  return {
    clearing_decision_id: `acd_${requestDigest}`,
    clearing_request_id: `clearing_request_${requestDigest}`,
    decision,
    action_allowed: actionAllowed,
    action_blocked: !actionAllowed,
    approval_required: decision === "require_human_approval",
    evidence_required: reasonCodes.includes("missing_evidence"),
    identity_verification_required: reasonCodes.includes("weak_or_missing_identity"),
    payment_intent_clarification_required: reasonCodes.includes("payment_intent_unclear"),
    spend_limit_recommended: isMoneyAction(category, actionType)
      && (safeToken(input.risk_level) === "high" || safeToken(input.impact_level) === "high"),
    refusalgraph_caution_level: cautionLevel,
    refusalgraph_matched_signal_count: matchedSignalCount,
    reason_codes: reasonCodes,
    required_next_steps: deriveRequiredNextSteps(decision, reasonCodes),
    receipt_recommended: true,
    private_data_included: false,
    network_lookup_performed: false,
    external_lookup_performed: false,
    payment_or_fee_triggered: false,
    action_executed: false,
    status: "draft_only",
    created_at: safeTimestamp(input.timestamp),
  };
}

export function deriveAgentClearingReasonCodes(
  input: AgentClearingDecisionInput,
  normalizedCategory?: string,
  normalizedActionType?: string,
): AgentClearingReasonCode[] {
  const category = normalizedCategory
    ?? safeEnum(input.requested_action_category, ACTION_CATEGORIES, "other");
  const actionType = normalizedActionType
    ?? safeEnum(input.requested_action_type, ACTION_TYPES, "other");
  const codes = new Set<AgentClearingReasonCode>();
  const approvalStatus = safeToken(input.approval_status);
  const evidenceStatus = safeToken(input.evidence_status);
  const identityStatus = safeToken(input.agent_identity_status);
  const paymentIntentStatus = safeToken(input.payment_intent_status);
  const riskLevel = safeToken(input.risk_level);
  const impactLevel = safeToken(input.impact_level);
  const cautionLevel = safeCautionLevel(input.refusalgraph_query_result.caution_level);

  if (!["approved", "not_required"].includes(approvalStatus)) codes.add("missing_human_approval");
  if (!["complete", "sufficient", "verified", "hash_only"].includes(evidenceStatus)) {
    codes.add("missing_evidence");
  }
  if (!["verified", "verified_locally"].includes(identityStatus)) {
    codes.add("weak_or_missing_identity");
  }
  if (isMoneyAction(category, actionType)
    && !["clear", "declared", "not_applicable"].includes(paymentIntentStatus)) {
    codes.add("payment_intent_unclear");
  }
  if (cautionLevel === "high") codes.add("refusalgraph_high_caution");
  if (cautionLevel === "critical") codes.add("refusalgraph_critical_caution");
  addRefusalGraphReasonCodes(codes, input.refusalgraph_query_result.common_refusal_reason_codes);
  if (riskLevel === "high" || riskLevel === "blocked" || impactLevel === "high") {
    codes.add("high_risk_action");
  }

  addActionReasonCodes(codes, category, actionType);

  if (riskLevel === "low" && impactLevel === "low" && (cautionLevel === "none" || cautionLevel === "low")) {
    codes.add("low_risk_receipt_only");
  }
  if (!isSafeLocalQueryResult(input.refusalgraph_query_result)
    || (category === "other" && actionType === "other")) {
    codes.add("unknown_or_unclear_intent");
  }
  codes.add("draft_only_not_executed");
  return [...codes].sort();
}

function addRefusalGraphReasonCodes(
  codes: Set<AgentClearingReasonCode>,
  refusalCodes: RefusalGraphQueryResult["common_refusal_reason_codes"],
): void {
  for (const code of refusalCodes) {
    switch (code) {
      case "missing_human_approval":
      case "missing_evidence":
      case "weak_or_missing_identity":
      case "payment_intent_unclear":
      case "high_risk_action":
      case "money_movement_requested":
      case "billing_requested":
      case "automatic_purchase_requested":
      case "deployment_requested":
      case "publishing_requested":
      case "customer_facing_action":
      case "signup_requested":
      case "external_connection_requested":
      case "unknown_or_unclear_intent":
        codes.add(code);
        break;
      case "data_access_requested":
      case "private_data_risk":
        codes.add("private_data_access_requested");
        break;
      case "policy_blocked":
        codes.add("unknown_or_unclear_intent");
        break;
    }
  }
}

function selectDecision(
  input: AgentClearingDecisionInput,
  category: string,
  actionType: string,
  cautionLevel: RefusalGraphCautionLevel,
  reasonCodes: readonly AgentClearingReasonCode[],
): AgentClearingDecisionType {
  if (!isSafeLocalQueryResult(input.refusalgraph_query_result)) return "keep_blocked";
  if (cautionLevel === "critical") return "refuse_transaction";
  if (cautionLevel === "high") return "require_human_approval";

  const riskLevel = safeToken(input.risk_level);
  const impactLevel = safeToken(input.impact_level);
  const approvalStatus = safeToken(input.approval_status);
  const highImpact = riskLevel === "high" || riskLevel === "blocked" || impactLevel === "high";
  const protectedAction = PROTECTED_CATEGORIES.has(category);

  if (reasonCodes.includes("missing_human_approval") && (highImpact || protectedAction)) {
    return "require_human_approval";
  }
  if (reasonCodes.includes("missing_evidence")) return "require_more_evidence";
  if (reasonCodes.includes("weak_or_missing_identity")) return "require_identity_verification";
  if (reasonCodes.includes("payment_intent_unclear")) return "clarify_payment_intent";
  if (protectedAction && approvalStatus !== "approved") return "require_human_approval";
  if (highImpact) return "require_human_approval";

  const riskAcceptable = riskLevel === "low" || riskLevel === "medium";
  const impactAcceptable = impactLevel === "low" || impactLevel === "medium";
  const approvalAcceptable = approvalStatus === "approved"
    || (!protectedAction && approvalStatus === "not_required");
  const cautionAcceptable = cautionLevel === "none" || cautionLevel === "low";
  if (riskAcceptable && impactAcceptable && approvalAcceptable && cautionAcceptable) {
    return "accept_with_limits";
  }

  return "keep_blocked";
}

function addActionReasonCodes(
  codes: Set<AgentClearingReasonCode>,
  category: string,
  actionType: string,
): void {
  if (isMoneyAction(category, actionType)) codes.add("money_movement_requested");
  if (category === "payment" || ["initiate_payment", "pay_for_task", "buy_service"].includes(actionType)) {
    codes.add("payment_requested");
  }
  if (category === "billing" || actionType === "enable_billing") codes.add("billing_requested");
  if (category === "settlement" || actionType === "settle_transaction") codes.add("settlement_requested");
  if (category === "automatic_purchase" || actionType === "automatic_purchase") {
    codes.add("automatic_purchase_requested");
  }
  if (category === "deployment" || actionType === "deploy_code") codes.add("deployment_requested");
  if (category === "publishing" || actionType === "publish_content") codes.add("publishing_requested");
  if (category === "customer_communication" || actionType === "email_customer") {
    codes.add("customer_facing_action");
  }
  if (category === "signup" || actionType === "enable_signup") codes.add("signup_requested");
  if (category === "private_data_access" || actionType === "access_private_data") {
    codes.add("private_data_access_requested");
  }
  if (category === "data_access" || actionType === "access_data") {
    codes.add("private_data_access_requested");
  }
  if (category === "external_connection" || actionType === "connect_external_system") {
    codes.add("external_connection_requested");
  }
}

function deriveRequiredNextSteps(
  decision: AgentClearingDecisionType,
  codes: readonly AgentClearingReasonCode[],
): AgentClearingDecisionType[] {
  const steps = new Set<AgentClearingDecisionType>();
  if (decision !== "accept_with_limits") steps.add(decision);
  if (codes.includes("missing_human_approval")) steps.add("require_human_approval");
  if (codes.includes("missing_evidence")) steps.add("require_more_evidence");
  if (codes.includes("weak_or_missing_identity")) steps.add("require_identity_verification");
  if (codes.includes("payment_intent_unclear")) steps.add("clarify_payment_intent");
  steps.add("create_receipt_only");
  steps.add("draft_only_not_executed");
  return [...steps].sort((left, right) => decisionPriority(left) - decisionPriority(right));
}

function decisionPriority(decision: AgentClearingDecisionType): number {
  const priorities: Record<AgentClearingDecisionType, number> = {
    refuse_transaction: 0,
    keep_blocked: 1,
    require_human_approval: 2,
    require_identity_verification: 3,
    require_more_evidence: 4,
    clarify_payment_intent: 5,
    cap_spend_limit: 6,
    accept_with_limits: 7,
    create_receipt_only: 8,
    draft_only_not_executed: 9,
  };
  return priorities[decision];
}

function isMoneyAction(category: string, actionType: string): boolean {
  return MONEY_CATEGORIES.has(category) || MONEY_ACTION_TYPES.has(actionType);
}

function isSafeLocalQueryResult(result: RefusalGraphQueryResult): boolean {
  return (result.status === "draft_only")
    && result.private_data_included === false
    && result.network_lookup_performed === false
    && result.external_lookup_performed === false
    && result.payment_or_fee_triggered === false;
}

function safeCautionLevel(value: string): RefusalGraphCautionLevel {
  const token = safeToken(value);
  return token === "none" || token === "low" || token === "medium"
    || token === "high" || token === "critical" ? token : "high";
}

function safeCount(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(Math.floor(value), 1_000_000);
}

function safeToken(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 64);
}

function safeEnum(value: string, allowed: ReadonlySet<string>, fallback: string): string {
  const token = safeToken(value);
  return allowed.has(token) ? token : fallback;
}

function safeTimestamp(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "unknown" : date.toISOString();
}
