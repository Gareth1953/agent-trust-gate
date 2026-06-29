import { createHash } from "node:crypto";

import type {
  AgentClearingDecisionType,
  AgentClearingReasonCode,
} from "./agent-clearing-decision-engine.js";

export const RECEIPT_VERIFICATION_READINESS_VERSION = "atg.receipt-verification-readiness.v1" as const;

export type LocalReceiptVerificationResult =
  | "locally_valid"
  | "locally_invalid"
  | "missing_required_fields"
  | "unsafe_flags_detected"
  | "private_data_detected"
  | "decision_link_missing"
  | "draft_only_not_externally_verified";

export type ReceiptVerificationReasonCode =
  | "receipt_locally_valid"
  | "missing_receipt_id"
  | "missing_source_decision_id"
  | "missing_source_request_id"
  | "invalid_receipt_type"
  | "receipt_not_draft_or_local"
  | "unsafe_action_executed_flag"
  | "unsafe_network_lookup_flag"
  | "unsafe_external_lookup_flag"
  | "unsafe_payment_fee_flag"
  | "unsafe_billing_flag"
  | "unsafe_settlement_flag"
  | "unsafe_machine_fee_flag"
  | "private_data_flag_detected"
  | "reason_codes_invalid"
  | "next_steps_invalid"
  | "external_verification_not_enabled"
  | "fee_readiness_placeholder_only"
  | "draft_only_not_externally_verified";

export type ReceiptVerificationNextStep =
  | "keep_local_only"
  | "require_human_approval"
  | "require_more_evidence"
  | "require_identity_verification"
  | "clarify_payment_intent"
  | "keep_blocked"
  | "create_receipt_only"
  | "do_not_execute"
  | "do_not_verify_externally"
  | "do_not_trigger_fee"
  | "Gareth_final_approval_required";

export interface ReceiptVerificationInput {
  [key: string]: unknown;
  receipt_id: string;
  receipt_type: string;
  source_clearing_decision_id: string;
  source_clearing_request_id: string;
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
  verification_status: string;
  receipt_status: string;
  private_data_included: boolean;
  network_lookup_performed: boolean;
  external_lookup_performed: boolean;
  payment_or_fee_triggered: boolean;
  action_executed: boolean;
  receipt_persisted: boolean;
  settlement_triggered: boolean;
  billing_triggered: boolean;
  machine_to_machine_fee_triggered: boolean;
  status: string;
  created_at: string;
}

export interface ReceiptVerificationReadinessResult {
  verification_id: string;
  source_receipt_id: string;
  receipt_type: "agent_clearing_receipt" | "invalid_receipt_type";
  verification_result: LocalReceiptVerificationResult;
  verification_status: "local_draft_only";
  receipt_status: "draft_only" | "local_only" | "invalid";
  decision_linked: boolean;
  safety_flags_valid: boolean;
  private_data_absent: boolean;
  action_not_executed: boolean;
  network_not_used: boolean;
  external_lookup_not_used: boolean;
  payment_not_triggered: boolean;
  billing_not_triggered: boolean;
  settlement_not_triggered: boolean;
  machine_to_machine_fee_not_triggered: boolean;
  receipt_persistence_status: "not_persisted" | "unexpected_persistence_detected";
  reason_codes_valid: boolean;
  next_steps_valid: boolean;
  verification_reason_codes: ReceiptVerificationReasonCode[];
  required_next_steps: ReceiptVerificationNextStep[];
  fee_readiness_status: "placeholder_only";
  private_data_included: false;
  network_lookup_performed: false;
  external_lookup_performed: false;
  payment_or_fee_triggered: false;
  action_executed: false;
  status: "draft_only";
  created_at: string;
}

const RECEIPT_REASON_CODES = new Set<AgentClearingReasonCode>([
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

const RECEIPT_NEXT_STEPS = new Set<AgentClearingDecisionType>([
  "accept_with_limits", "require_more_evidence", "require_human_approval",
  "require_identity_verification", "clarify_payment_intent", "cap_spend_limit",
  "refuse_transaction", "keep_blocked", "create_receipt_only",
  "draft_only_not_executed",
]);

export function verifyAgentClearingReceiptLocal(
  input: ReceiptVerificationInput,
): ReceiptVerificationReadinessResult {
  const receiptIdPresent = hasSafeLocalReference(input.receipt_id);
  const sourceDecisionPresent = hasSafeLocalReference(input.source_clearing_decision_id);
  const sourceRequestPresent = hasSafeLocalReference(input.source_clearing_request_id);
  const decisionLinked = sourceDecisionPresent && sourceRequestPresent;
  const receiptTypeValid = safeToken(input.receipt_type) === "agent_clearing_receipt";
  const receiptStatus = safeReceiptStatus(input.receipt_status);
  const statusValid = receiptStatus !== "invalid"
    && ["draft_only", "local_only"].includes(safeToken(input.status));
  const reasonCodesValid = input.reason_codes.length > 0
    && input.reason_codes.every((value) => RECEIPT_REASON_CODES.has(safeToken(value) as AgentClearingReasonCode));
  const nextStepsValid = input.required_next_steps.length > 0
    && input.required_next_steps.every((value) => RECEIPT_NEXT_STEPS.has(safeToken(value) as AgentClearingDecisionType));
  const privateDataAbsent = input.private_data_included === false;
  const actionNotExecuted = input.action_executed === false;
  const networkNotUsed = input.network_lookup_performed === false;
  const externalLookupNotUsed = input.external_lookup_performed === false;
  const paymentNotTriggered = input.payment_or_fee_triggered === false;
  const billingNotTriggered = input.billing_triggered === false;
  const settlementNotTriggered = input.settlement_triggered === false;
  const machineFeeNotTriggered = input.machine_to_machine_fee_triggered === false;
  const receiptNotPersisted = input.receipt_persisted === false;
  const sourceNotExternallyVerified = safeToken(input.verification_status) === "not_verified_externally";
  const safetyFlagsValid = privateDataAbsent && actionNotExecuted && networkNotUsed
    && externalLookupNotUsed && paymentNotTriggered && billingNotTriggered
    && settlementNotTriggered && machineFeeNotTriggered && receiptNotPersisted
    && sourceNotExternallyVerified;
  const reasons = deriveVerificationReasonCodes(input, {
    receiptIdPresent,
    sourceDecisionPresent,
    sourceRequestPresent,
    receiptTypeValid,
    statusValid,
    reasonCodesValid,
    nextStepsValid,
  });
  const verificationResult = selectVerificationResult({
    receiptIdPresent,
    decisionLinked,
    receiptTypeValid,
    statusValid,
    reasonCodesValid,
    nextStepsValid,
    privateDataAbsent,
    safetyFlagsValid,
  });

  return {
    verification_id: createReceiptVerificationId(input.receipt_id),
    source_receipt_id: pseudonymiseReceiptReference(input.receipt_id),
    receipt_type: receiptTypeValid ? "agent_clearing_receipt" : "invalid_receipt_type",
    verification_result: verificationResult,
    verification_status: "local_draft_only",
    receipt_status: receiptStatus,
    decision_linked: decisionLinked,
    safety_flags_valid: safetyFlagsValid,
    private_data_absent: privateDataAbsent,
    action_not_executed: actionNotExecuted,
    network_not_used: networkNotUsed,
    external_lookup_not_used: externalLookupNotUsed,
    payment_not_triggered: paymentNotTriggered,
    billing_not_triggered: billingNotTriggered,
    settlement_not_triggered: settlementNotTriggered,
    machine_to_machine_fee_not_triggered: machineFeeNotTriggered,
    receipt_persistence_status: receiptNotPersisted
      ? "not_persisted"
      : "unexpected_persistence_detected",
    reason_codes_valid: reasonCodesValid,
    next_steps_valid: nextStepsValid,
    verification_reason_codes: reasons,
    required_next_steps: deriveVerificationNextSteps(input, verificationResult),
    fee_readiness_status: "placeholder_only",
    private_data_included: false,
    network_lookup_performed: false,
    external_lookup_performed: false,
    payment_or_fee_triggered: false,
    action_executed: false,
    status: "draft_only",
    created_at: safeTimestamp(input.created_at),
  };
}

export function createReceiptVerificationId(sourceReceiptId: string): string {
  const digest = createHash("sha256").update(sourceReceiptId, "utf8").digest("hex");
  return `acrv_local_${digest.slice(0, 24)}`;
}

function deriveVerificationReasonCodes(
  input: ReceiptVerificationInput,
  checks: {
    receiptIdPresent: boolean;
    sourceDecisionPresent: boolean;
    sourceRequestPresent: boolean;
    receiptTypeValid: boolean;
    statusValid: boolean;
    reasonCodesValid: boolean;
    nextStepsValid: boolean;
  },
): ReceiptVerificationReasonCode[] {
  const reasons = new Set<ReceiptVerificationReasonCode>();
  if (!checks.receiptIdPresent) reasons.add("missing_receipt_id");
  if (!checks.sourceDecisionPresent) reasons.add("missing_source_decision_id");
  if (!checks.sourceRequestPresent) reasons.add("missing_source_request_id");
  if (!checks.receiptTypeValid) reasons.add("invalid_receipt_type");
  if (!checks.statusValid) reasons.add("receipt_not_draft_or_local");
  if (input.action_executed !== false) reasons.add("unsafe_action_executed_flag");
  if (input.network_lookup_performed !== false) reasons.add("unsafe_network_lookup_flag");
  if (input.external_lookup_performed !== false) reasons.add("unsafe_external_lookup_flag");
  if (input.payment_or_fee_triggered !== false) reasons.add("unsafe_payment_fee_flag");
  if (input.billing_triggered !== false) reasons.add("unsafe_billing_flag");
  if (input.settlement_triggered !== false) reasons.add("unsafe_settlement_flag");
  if (input.machine_to_machine_fee_triggered !== false) reasons.add("unsafe_machine_fee_flag");
  if (input.private_data_included !== false) reasons.add("private_data_flag_detected");
  if (!checks.reasonCodesValid) reasons.add("reason_codes_invalid");
  if (!checks.nextStepsValid) reasons.add("next_steps_invalid");
  if (reasons.size === 0) reasons.add("receipt_locally_valid");
  reasons.add("external_verification_not_enabled");
  reasons.add("fee_readiness_placeholder_only");
  reasons.add("draft_only_not_externally_verified");
  return [...reasons].sort();
}

function deriveVerificationNextSteps(
  input: ReceiptVerificationInput,
  result: LocalReceiptVerificationResult,
): ReceiptVerificationNextStep[] {
  const steps = new Set<ReceiptVerificationNextStep>([
    "keep_local_only",
    "do_not_execute",
    "do_not_verify_externally",
    "do_not_trigger_fee",
    "Gareth_final_approval_required",
  ]);
  if (result !== "locally_valid") steps.add("keep_blocked");
  if (input.approval_required || input.reason_codes.includes("missing_human_approval")) {
    steps.add("require_human_approval");
  }
  if (input.evidence_required || input.reason_codes.includes("missing_evidence")) {
    steps.add("require_more_evidence");
  }
  if (input.identity_verification_required || input.reason_codes.includes("weak_or_missing_identity")) {
    steps.add("require_identity_verification");
  }
  if (input.payment_intent_clarification_required || input.reason_codes.includes("payment_intent_unclear")) {
    steps.add("clarify_payment_intent");
  }
  steps.add("create_receipt_only");
  return [...steps].sort((left, right) => nextStepPriority(left) - nextStepPriority(right));
}

function selectVerificationResult(checks: {
  receiptIdPresent: boolean;
  decisionLinked: boolean;
  receiptTypeValid: boolean;
  statusValid: boolean;
  reasonCodesValid: boolean;
  nextStepsValid: boolean;
  privateDataAbsent: boolean;
  safetyFlagsValid: boolean;
}): LocalReceiptVerificationResult {
  if (!checks.privateDataAbsent) return "private_data_detected";
  if (!checks.receiptIdPresent) return "missing_required_fields";
  if (!checks.decisionLinked) return "decision_link_missing";
  if (!checks.safetyFlagsValid) return "unsafe_flags_detected";
  if (!checks.receiptTypeValid || !checks.statusValid
    || !checks.reasonCodesValid || !checks.nextStepsValid) return "locally_invalid";
  return "locally_valid";
}

function safeReceiptStatus(value: string): ReceiptVerificationReadinessResult["receipt_status"] {
  const token = safeToken(value);
  return token === "draft_only" || token === "local_only" ? token : "invalid";
}

function hasSafeLocalReference(value: string): boolean {
  return /^[a-z0-9][a-z0-9_-]{7,95}$/.test(value);
}

function pseudonymiseReceiptReference(value: string): string {
  const digest = createHash("sha256").update(value, "utf8").digest("hex");
  return `receipt_reference_${digest.slice(0, 24)}`;
}

function safeToken(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 96);
}

function safeTimestamp(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "unknown" : date.toISOString();
}

function nextStepPriority(step: ReceiptVerificationNextStep): number {
  const priorities: Record<ReceiptVerificationNextStep, number> = {
    keep_blocked: 0,
    require_human_approval: 1,
    require_identity_verification: 2,
    require_more_evidence: 3,
    clarify_payment_intent: 4,
    keep_local_only: 5,
    do_not_execute: 6,
    do_not_verify_externally: 7,
    do_not_trigger_fee: 8,
    create_receipt_only: 9,
    Gareth_final_approval_required: 10,
  };
  return priorities[step];
}
