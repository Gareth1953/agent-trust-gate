import { createHash } from "node:crypto";

export const REFUSALGRAPH_SIGNAL_ENGINE_VERSION = "atg.refusalgraph-signal-engine.v1" as const;

export type RefusalType =
  | "blocked"
  | "approval_required"
  | "limited"
  | "refused"
  | "missing_evidence"
  | "identity_unclear"
  | "payment_intent_unclear"
  | "high_risk_action"
  | "policy_blocked";

export type RefusalReasonCode =
  | "missing_human_approval"
  | "missing_evidence"
  | "weak_or_missing_identity"
  | "payment_intent_unclear"
  | "high_risk_action"
  | "policy_blocked"
  | "customer_facing_action"
  | "money_movement_requested"
  | "publishing_requested"
  | "deployment_requested"
  | "billing_requested"
  | "signup_requested"
  | "data_access_requested"
  | "external_connection_requested"
  | "automatic_purchase_requested"
  | "private_data_risk"
  | "unknown_or_unclear_intent";

export type RefusalRecommendedNextStep =
  | "require_human_approval"
  | "require_more_evidence"
  | "require_identity_verification"
  | "clarify_payment_intent"
  | "cap_spend_limit"
  | "refuse_transaction"
  | "allow_low_risk_only"
  | "create_receipt_only"
  | "keep_blocked";

export interface RefusalGraphReceiptInput {
  [key: string]: unknown;
  receipt_id: string;
  decision: string;
  allowed: boolean;
  blocked: boolean;
  action_category: string;
  proposed_action_type: string;
  risk_level: string;
  impact_level: string;
  evidence_status: string;
  approval_status: string;
  reasons: readonly string[];
  missing_evidence: readonly string[];
  evidence_hashes: readonly string[];
  timestamp: string;
}

export interface RefusalGraphSignal {
  signal_id: string;
  source_receipt_id: string;
  action_category: string;
  proposed_action_type: string;
  refusal_type: RefusalType;
  refusal_reason_codes: RefusalReasonCode[];
  risk_level: "low" | "medium" | "high" | "blocked" | "unknown";
  impact_level: "low" | "medium" | "high" | "unknown";
  evidence_status: "sufficient" | "incomplete" | "missing" | "hash_only" | "hash_only_incomplete" | "unknown";
  approval_status: "not_requested" | "requested" | "approved" | "rejected" | "unknown";
  evidence_hashes: string[];
  private_data_included: false;
  anonymised: true;
  pseudonymised: true;
  evidence_hash_only: true;
  recommended_next_step: RefusalRecommendedNextStep;
  created_at: string;
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

const REFUSAL_DECISIONS = new Set([
  "blocked", "block", "refused", "refuse", "limited", "approval_required",
  "request_human", "missing_evidence", "identity_unclear",
  "payment_intent_unclear", "high_risk_action", "policy_blocked",
]);

export function createRefusalGraphSignal(input: RefusalGraphReceiptInput): RefusalGraphSignal | null {
  const category = safeEnum(input.action_category, ACTION_CATEGORIES, "other");
  const actionType = safeEnum(input.proposed_action_type, ACTION_TYPES, "other");
  const decision = safeToken(input.decision);
  const riskLevel = safeRiskLevel(input.risk_level);
  const approvalStatus = safeApprovalStatus(input.approval_status);

  if (
    input.allowed
    && !input.blocked
    && (decision === "allow" || decision === "allowed")
    && riskLevel === "low"
    && input.reasons.length === 0
    && input.missing_evidence.length === 0
  ) {
    return null;
  }

  const reasonCodes = normalizeRefusalReasons(input.reasons, {
    action_category: category,
    proposed_action_type: actionType,
    risk_level: riskLevel,
    approval_status: approvalStatus,
    decision,
    missing_evidence_count: input.missing_evidence.length,
  });

  const meaningfulReasons = reasonCodes.some((code) => code !== "unknown_or_unclear_intent");
  const refusalOutcome = input.blocked || !input.allowed || REFUSAL_DECISIONS.has(decision)
    || riskLevel === "high" || riskLevel === "blocked" || meaningfulReasons;

  if (!refusalOutcome) return null;

  const receiptHash = createHash("sha256").update(input.receipt_id, "utf8").digest("hex");
  const refusalType = selectRefusalType(decision, input.blocked, reasonCodes, riskLevel);

  return {
    signal_id: `rgs_${receiptHash.slice(0, 24)}`,
    source_receipt_id: `receipt_${receiptHash.slice(0, 24)}`,
    action_category: category,
    proposed_action_type: actionType,
    refusal_type: refusalType,
    refusal_reason_codes: reasonCodes,
    risk_level: riskLevel,
    impact_level: safeImpactLevel(input.impact_level),
    evidence_status: safeEvidenceStatus(input.evidence_status),
    approval_status: approvalStatus,
    evidence_hashes: safeEvidenceHashes(input.evidence_hashes),
    private_data_included: false,
    anonymised: true,
    pseudonymised: true,
    evidence_hash_only: true,
    recommended_next_step: recommendNextStep(reasonCodes, refusalType),
    created_at: safeTimestamp(input.timestamp),
    status: "draft_only",
  };
}

export function normalizeRefusalReasons(
  reasons: readonly string[],
  context: {
    action_category?: string;
    proposed_action_type?: string;
    risk_level?: string;
    approval_status?: string;
    decision?: string;
    missing_evidence_count?: number;
  } = {},
): RefusalReasonCode[] {
  const codes = new Set<RefusalReasonCode>();
  for (const reason of reasons) {
    const value = reason.toLowerCase();
    if (/human approval|approval (?:is )?(?:missing|required|not requested)|without approval/.test(value)) codes.add("missing_human_approval");
    else if (/missing evidence|evidence (?:is )?(?:missing|incomplete|required|insufficient)|no evidence/.test(value)) codes.add("missing_evidence");
    else if (/identity (?:is )?(?:unclear|unknown|missing|unverified)|missing identity|cannot verify.*identity/.test(value)) codes.add("weak_or_missing_identity");
    else if (/payment intent (?:is )?(?:unclear|unknown|ambiguous)|unclear payment/.test(value)) codes.add("payment_intent_unclear");
    else if (/automatic purchase/.test(value)) codes.add("automatic_purchase_requested");
    else if (/money movement|move money|payment requested|initiate payment|purchase requested|buy service/.test(value)) codes.add("money_movement_requested");
    else if (/publish|public post|landing page/.test(value)) codes.add("publishing_requested");
    else if (/deploy|deployment|release package/.test(value)) codes.add("deployment_requested");
    else if (/billing|invoice|charge customer/.test(value)) codes.add("billing_requested");
    else if (/sign[ -]?up|create account/.test(value)) codes.add("signup_requested");
    else if (/data access|access data|private document/.test(value)) codes.add("data_access_requested");
    else if (/external connection|third party|webhook|external system/.test(value)) codes.add("external_connection_requested");
    else if (/private data|personal data|customer data|credential|secret/.test(value)) codes.add("private_data_risk");
    else if (/customer[- ]facing|email customer|user[- ]facing/.test(value)) codes.add("customer_facing_action");
    else if (/policy block|blocked by policy|policy denied|not permitted/.test(value)) codes.add("policy_blocked");
    else if (/high risk|high-impact|high impact/.test(value)) codes.add("high_risk_action");
    else codes.add("unknown_or_unclear_intent");
  }

  if ((context.missing_evidence_count ?? 0) > 0) codes.add("missing_evidence");
  if ((context.decision === "approval_required" || context.decision === "request_human") && context.approval_status !== "approved") codes.add("missing_human_approval");
  addActionCode(codes, context.action_category, context.proposed_action_type);
  if (context.risk_level === "high" || context.risk_level === "blocked") codes.add("high_risk_action");
  if (codes.size === 0) codes.add("unknown_or_unclear_intent");
  if (codes.size > 1) codes.delete("unknown_or_unclear_intent");
  return [...codes].sort();
}

function addActionCode(codes: Set<RefusalReasonCode>, category?: string, actionType?: string): void {
  const value = `${category ?? ""} ${actionType ?? ""}`;
  if (/automatic_purchase/.test(value)) codes.add("automatic_purchase_requested");
  else if (/financial_action|initiate_payment|buy_service/.test(value)) codes.add("money_movement_requested");
  if (/publishing|publish_content/.test(value)) codes.add("publishing_requested");
  if (/deployment|deploy_code/.test(value)) codes.add("deployment_requested");
  if (/billing|enable_billing/.test(value)) codes.add("billing_requested");
  if (/signup|enable_signup/.test(value)) codes.add("signup_requested");
  if (/data_access|access_data/.test(value)) codes.add("data_access_requested");
  if (/external_connection|connect_external_system/.test(value)) codes.add("external_connection_requested");
  if (/customer_communication|email_customer/.test(value)) codes.add("customer_facing_action");
}

function selectRefusalType(decision: string, blocked: boolean, codes: readonly RefusalReasonCode[], risk: string): RefusalType {
  if (decision === "refused" || decision === "refuse") return "refused";
  if (decision === "limited") return "limited";
  if (decision === "policy_blocked" || codes.includes("policy_blocked")) return "policy_blocked";
  if (decision === "identity_unclear" || codes.includes("weak_or_missing_identity")) return "identity_unclear";
  if (decision === "payment_intent_unclear" || codes.includes("payment_intent_unclear")) return "payment_intent_unclear";
  if (decision === "missing_evidence" || codes.includes("missing_evidence")) return "missing_evidence";
  if (decision === "approval_required" || decision === "request_human" || codes.includes("missing_human_approval")) return "approval_required";
  if (decision === "high_risk_action" || risk === "high" || risk === "blocked") return "high_risk_action";
  if (blocked || decision === "blocked" || decision === "block") return "blocked";
  return "refused";
}

function recommendNextStep(codes: readonly RefusalReasonCode[], refusalType: RefusalType): RefusalRecommendedNextStep {
  if (codes.includes("missing_human_approval")) return "require_human_approval";
  if (codes.includes("missing_evidence")) return "require_more_evidence";
  if (codes.includes("weak_or_missing_identity")) return "require_identity_verification";
  if (codes.includes("payment_intent_unclear")) return "clarify_payment_intent";
  if (codes.includes("money_movement_requested") || codes.includes("automatic_purchase_requested")) return "require_human_approval";
  if (codes.includes("policy_blocked") || refusalType === "policy_blocked") return "refuse_transaction";
  if (codes.includes("high_risk_action")) return "require_human_approval";
  return "keep_blocked";
}

function safeToken(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 64);
}

function safeEnum(value: string, allowed: ReadonlySet<string>, fallback: string): string {
  const token = safeToken(value);
  return allowed.has(token) ? token : fallback;
}

function safeRiskLevel(value: string): RefusalGraphSignal["risk_level"] {
  const token = safeToken(value);
  return token === "low" || token === "medium" || token === "high" || token === "blocked" ? token : "unknown";
}

function safeImpactLevel(value: string): RefusalGraphSignal["impact_level"] {
  const token = safeToken(value);
  return token === "low" || token === "medium" || token === "high" ? token : "unknown";
}

function safeApprovalStatus(value: string): RefusalGraphSignal["approval_status"] {
  const token = safeToken(value);
  return token === "not_requested" || token === "requested" || token === "approved" || token === "rejected" ? token : "unknown";
}

function safeEvidenceStatus(value: string): RefusalGraphSignal["evidence_status"] {
  const token = safeToken(value);
  return token === "sufficient" || token === "incomplete" || token === "missing" || token === "hash_only" || token === "hash_only_incomplete" ? token : "unknown";
}

function safeEvidenceHashes(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim().toLowerCase()).filter((value) => /^(?:sha256:)?[a-f0-9]{32,128}$/.test(value)))].slice(0, 20);
}

function safeTimestamp(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "unknown" : date.toISOString();
}
