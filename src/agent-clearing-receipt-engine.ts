import { createHash } from "node:crypto";

import type {
  AgentClearingDecisionType,
  AgentClearingReasonCode,
} from "./agent-clearing-decision-engine.js";
import type { RefusalGraphCautionLevel } from "./refusalgraph-query-engine.js";

export const AGENT_CLEARING_RECEIPT_ENGINE_VERSION = "atg.agent-clearing-receipt-engine.v1" as const;

export interface AgentClearingReceiptInput {
  [key: string]: unknown;
  clearing_decision_id: string;
  clearing_request_id: string;
  decision: string;
  action_allowed: boolean;
  action_blocked: boolean;
  approval_required: boolean;
  evidence_required: boolean;
  identity_verification_required: boolean;
  payment_intent_clarification_required: boolean;
  spend_limit_recommended: boolean;
  refusalgraph_caution_level: string;
  refusalgraph_matched_signal_count: number;
  reason_codes: readonly string[];
  required_next_steps: readonly string[];
  receipt_recommended: boolean;
  private_data_included: boolean;
  network_lookup_performed: boolean;
  external_lookup_performed: boolean;
  payment_or_fee_triggered: boolean;
  action_executed: boolean;
  status: string;
  created_at: string;
}

export interface AgentClearingReceipt {
  receipt_id: string;
  receipt_type: "agent_clearing_receipt";
  source_clearing_decision_id: string;
  source_clearing_request_id: string;
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
  verification_status: "not_verified_externally";
  receipt_status: "draft_only";
  private_data_included: false;
  network_lookup_performed: false;
  external_lookup_performed: false;
  payment_or_fee_triggered: false;
  action_executed: false;
  receipt_persisted: false;
  settlement_triggered: false;
  billing_triggered: false;
  machine_to_machine_fee_triggered: false;
  status: "draft_only";
  created_at: string;
}

const DECISIONS = new Set<AgentClearingDecisionType>([
  "accept_with_limits", "require_more_evidence", "require_human_approval",
  "require_identity_verification", "clarify_payment_intent", "cap_spend_limit",
  "refuse_transaction", "keep_blocked", "create_receipt_only",
  "draft_only_not_executed",
]);

const REASON_CODES = new Set<AgentClearingReasonCode>([
  "missing_human_approval", "missing_evidence", "weak_or_missing_identity",
  "payment_intent_unclear", "refusalgraph_high_caution",
  "refusalgraph_critical_caution", "high_risk_action",
  "money_movement_requested", "payment_requested", "billing_requested",
  "settlement_requested", "automatic_purchase_requested", "deployment_requested",
  "publishing_requested", "customer_facing_action", "signup_requested",
  "private_data_access_requested", "external_connection_requested",
  "low_risk_receipt_only", "unknown_or_unclear_intent",
  "draft_only_not_executed",
]);

export function createAgentClearingReceipt(
  input: AgentClearingReceiptInput,
): AgentClearingReceipt {
  const safeSource = isSafeLocalDecision(input);
  const sourceDecision = safeDecision(input.decision);
  const decision = safeSource ? sourceDecision : "draft_only_not_executed";
  const decisionReference = pseudonymiseReference("clearing_decision", input.clearing_decision_id);
  const requestReference = pseudonymiseReference("clearing_request", input.clearing_request_id);
  const reasonCodes = filterReasonCodes(input.reason_codes);
  const nextSteps = filterNextSteps(input.required_next_steps);

  if (!safeSource || sourceDecision === "draft_only_not_executed") {
    addSorted(reasonCodes, "unknown_or_unclear_intent");
  }
  addSorted(reasonCodes, "draft_only_not_executed");
  addSorted(nextSteps, "draft_only_not_executed");
  if (!nextSteps.includes("create_receipt_only")) addSorted(nextSteps, "create_receipt_only");

  const actionAllowed = safeSource
    && decision === "accept_with_limits"
    && input.action_allowed === true
    && input.action_blocked === false;

  return {
    receipt_id: createAgentClearingReceiptId(input.clearing_decision_id),
    receipt_type: "agent_clearing_receipt",
    source_clearing_decision_id: decisionReference,
    source_clearing_request_id: requestReference,
    decision,
    action_allowed: actionAllowed,
    action_blocked: !actionAllowed,
    approval_required: decision === "require_human_approval" || input.approval_required === true,
    evidence_required: input.evidence_required === true,
    identity_verification_required: input.identity_verification_required === true,
    payment_intent_clarification_required: input.payment_intent_clarification_required === true,
    spend_limit_recommended: input.spend_limit_recommended === true,
    refusalgraph_caution_level: safeCautionLevel(input.refusalgraph_caution_level),
    refusalgraph_matched_signal_count: safeCount(input.refusalgraph_matched_signal_count),
    reason_codes: reasonCodes,
    required_next_steps: nextSteps,
    verification_status: "not_verified_externally",
    receipt_status: "draft_only",
    private_data_included: false,
    network_lookup_performed: false,
    external_lookup_performed: false,
    payment_or_fee_triggered: false,
    action_executed: false,
    receipt_persisted: false,
    settlement_triggered: false,
    billing_triggered: false,
    machine_to_machine_fee_triggered: false,
    status: "draft_only",
    created_at: safeTimestamp(input.created_at),
  };
}

export function createAgentClearingReceiptId(sourceDecisionId: string): string {
  const digest = createHash("sha256").update(sourceDecisionId, "utf8").digest("hex");
  return `acr_local_${digest.slice(0, 24)}`;
}

export function filterAgentClearingReceiptReasonCodes(
  values: readonly string[],
): AgentClearingReasonCode[] {
  return filterReasonCodes(values);
}

export function filterAgentClearingReceiptNextSteps(
  values: readonly string[],
): AgentClearingDecisionType[] {
  return filterNextSteps(values);
}

function filterReasonCodes(values: readonly string[]): AgentClearingReasonCode[] {
  const output = new Set<AgentClearingReasonCode>();
  let unsafeValueFound = false;
  for (const value of values) {
    const token = safeToken(value);
    if (isReasonCode(token)) output.add(token);
    else unsafeValueFound = true;
  }
  if (unsafeValueFound) output.add("unknown_or_unclear_intent");
  return [...output].sort();
}

function filterNextSteps(values: readonly string[]): AgentClearingDecisionType[] {
  const output = new Set<AgentClearingDecisionType>();
  let unsafeValueFound = false;
  for (const value of values) {
    const token = safeToken(value);
    if (isDecision(token)) output.add(token);
    else unsafeValueFound = true;
  }
  if (unsafeValueFound) output.add("draft_only_not_executed");
  return [...output].sort((left, right) => decisionPriority(left) - decisionPriority(right));
}

function isSafeLocalDecision(input: AgentClearingReceiptInput): boolean {
  const status = safeToken(input.status);
  return (status === "draft_only" || status === "local_only")
    && input.private_data_included === false
    && input.network_lookup_performed === false
    && input.external_lookup_performed === false
    && input.payment_or_fee_triggered === false
    && input.action_executed === false;
}

function safeDecision(value: string): AgentClearingDecisionType {
  const token = safeToken(value);
  return isDecision(token) ? token : "draft_only_not_executed";
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

function pseudonymiseReference(prefix: string, value: string): string {
  const digest = createHash("sha256").update(value, "utf8").digest("hex");
  return `${prefix}_${digest.slice(0, 24)}`;
}

function safeTimestamp(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "unknown" : date.toISOString();
}

function safeToken(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 64);
}

function isReasonCode(value: string): value is AgentClearingReasonCode {
  return REASON_CODES.has(value as AgentClearingReasonCode);
}

function isDecision(value: string): value is AgentClearingDecisionType {
  return DECISIONS.has(value as AgentClearingDecisionType);
}

function addSorted<T extends string>(values: T[], value: T): void {
  if (!values.includes(value)) values.push(value);
  values.sort((left, right) => {
    if (isDecision(left) && isDecision(right)) return decisionPriority(left) - decisionPriority(right);
    return left.localeCompare(right);
  });
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
