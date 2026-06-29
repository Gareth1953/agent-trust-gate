import { createHash } from "node:crypto";

import {
  createAgentClearingDecision,
  type AgentClearingDecision,
} from "./agent-clearing-decision-engine.js";
import {
  createAgentClearingReceipt,
  type AgentClearingReceipt,
  type AgentClearingReceiptInput,
} from "./agent-clearing-receipt-engine.js";
import {
  createFeeMeteringEvent,
  type FeeMeteringEvent,
} from "./fee-metering-readiness.js";
import {
  queryRefusalGraphSignals,
  type LocalRefusalGraphSignal,
  type RefusalGraphQuery,
  type RefusalGraphQueryResult,
} from "./refusalgraph-query-engine.js";
import {
  verifyAgentClearingReceiptLocal,
  type ReceiptVerificationInput,
  type ReceiptVerificationReadinessResult,
} from "./receipt-verification-readiness.js";

export const AGENT_CLEARING_PIPELINE_DEMO_VERSION = "atg.agent-clearing-pipeline-demo.v1" as const;

export interface AgentClearingPipelineRequest {
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
  requested_decision: string;
  timestamp: string;
}

export interface AgentClearingPipelineDemoInput {
  [key: string]: unknown;
  pipeline_id: string;
  clearing_request: AgentClearingPipelineRequest;
  local_refusal_signals: readonly LocalRefusalGraphSignal[];
  fee_metering_requested: boolean;
  timestamp: string;
}

export interface AgentClearingPipelineDemoResult {
  pipeline_id: string;
  pipeline_status: "draft_only_completed";
  refusalgraph_query_result: RefusalGraphQueryResult;
  clearing_decision: AgentClearingDecision;
  clearing_receipt: AgentClearingReceipt;
  receipt_verification_result: ReceiptVerificationReadinessResult;
  fee_metering_event: FeeMeteringEvent;
  action_executed: false;
  network_lookup_performed: false;
  external_lookup_performed: false;
  payment_or_fee_triggered: false;
  billing_triggered: false;
  settlement_triggered: false;
  machine_to_machine_fee_triggered: false;
  tracking_triggered: false;
  analytics_triggered: false;
  private_data_included: false;
  status: "draft_only";
  created_at: string;
}

export function runAgentClearingPipelineDemo(
  input: AgentClearingPipelineDemoInput,
): AgentClearingPipelineDemoResult {
  const pipelineId = createAgentClearingPipelineId(input.pipeline_id);
  const request = input.clearing_request;
  const query = buildPipelineRefusalGraphQuery(pipelineId, request);
  const refusalgraphQueryResult = queryRefusalGraphSignals(query, input.local_refusal_signals);
  const clearingDecision = createAgentClearingDecision({
    ...request,
    refusalgraph_query_result: refusalgraphQueryResult,
  });
  const clearingReceipt = createAgentClearingReceipt(toReceiptInput(clearingDecision));
  const receiptVerificationResult = verifyAgentClearingReceiptLocal(
    toVerificationInput(clearingReceipt),
  );
  const meteringCandidate = createFeeMeteringEvent({
    source_event_id: receiptVerificationResult.verification_id,
    source_event_type: "receipt_verification_completed",
    source_receipt_id: clearingReceipt.receipt_id,
    source_verification_id: receiptVerificationResult.verification_id,
    source_clearing_decision_id: clearingDecision.clearing_decision_id,
    source_refusal_signal_id: null,
    source_lookup_id: refusalgraphQueryResult.query_id,
    actor_type: request.receiving_agent_type,
    requested_metering_category: "receipt_verification_event",
    possible_fee_model: input.fee_metering_requested
      ? "per_receipt_verification"
      : "not_configured",
    possible_fee_amount: null,
    possible_fee_currency: input.fee_metering_requested ? "GBP" : null,
    timestamp: input.timestamp,
  });
  const feeMeteringEvent = input.fee_metering_requested
    ? meteringCandidate
    : disableFeeMeteringPlaceholder(meteringCandidate);

  return {
    pipeline_id: pipelineId,
    pipeline_status: "draft_only_completed",
    refusalgraph_query_result: refusalgraphQueryResult,
    clearing_decision: clearingDecision,
    clearing_receipt: clearingReceipt,
    receipt_verification_result: receiptVerificationResult,
    fee_metering_event: feeMeteringEvent,
    action_executed: false,
    network_lookup_performed: false,
    external_lookup_performed: false,
    payment_or_fee_triggered: false,
    billing_triggered: false,
    settlement_triggered: false,
    machine_to_machine_fee_triggered: false,
    tracking_triggered: false,
    analytics_triggered: false,
    private_data_included: false,
    status: "draft_only",
    created_at: safeTimestamp(input.timestamp),
  };
}

export function createAgentClearingPipelineId(sourcePipelineId: string): string {
  const digest = createHash("sha256").update(sourcePipelineId, "utf8").digest("hex");
  return `acp_local_${digest.slice(0, 24)}`;
}

function buildPipelineRefusalGraphQuery(
  pipelineId: string,
  request: AgentClearingPipelineRequest,
): RefusalGraphQuery {
  return {
    query_id: `${pipelineId}_refusalgraph_query`,
    requested_action_category: request.requested_action_category,
    requested_action_type: request.requested_action_type,
    risk_level: request.risk_level,
    impact_level: request.impact_level,
    evidence_status: request.evidence_status,
    approval_status: request.approval_status,
    agent_identity_status: request.agent_identity_status,
    payment_intent_status: request.payment_intent_status,
  };
}

function disableFeeMeteringPlaceholder(event: FeeMeteringEvent): FeeMeteringEvent {
  return {
    ...event,
    fee_readiness_status: "not_enabled",
    possible_fee_model: "not_configured",
    possible_fee_amount: "not_configured",
    possible_fee_currency: "not_configured",
  };
}

function toReceiptInput(decision: AgentClearingDecision): AgentClearingReceiptInput {
  return {
    clearing_decision_id: decision.clearing_decision_id,
    clearing_request_id: decision.clearing_request_id,
    decision: decision.decision,
    action_allowed: decision.action_allowed,
    action_blocked: decision.action_blocked,
    approval_required: decision.approval_required,
    evidence_required: decision.evidence_required,
    identity_verification_required: decision.identity_verification_required,
    payment_intent_clarification_required: decision.payment_intent_clarification_required,
    spend_limit_recommended: decision.spend_limit_recommended,
    refusalgraph_caution_level: decision.refusalgraph_caution_level,
    refusalgraph_matched_signal_count: decision.refusalgraph_matched_signal_count,
    reason_codes: decision.reason_codes,
    required_next_steps: decision.required_next_steps,
    receipt_recommended: decision.receipt_recommended,
    private_data_included: decision.private_data_included,
    network_lookup_performed: decision.network_lookup_performed,
    external_lookup_performed: decision.external_lookup_performed,
    payment_or_fee_triggered: decision.payment_or_fee_triggered,
    action_executed: decision.action_executed,
    status: decision.status,
    created_at: decision.created_at,
  };
}

function toVerificationInput(receipt: AgentClearingReceipt): ReceiptVerificationInput {
  return {
    receipt_id: receipt.receipt_id,
    receipt_type: receipt.receipt_type,
    source_clearing_decision_id: receipt.source_clearing_decision_id,
    source_clearing_request_id: receipt.source_clearing_request_id,
    decision: receipt.decision,
    action_allowed: receipt.action_allowed,
    action_blocked: receipt.action_blocked,
    approval_required: receipt.approval_required,
    evidence_required: receipt.evidence_required,
    identity_verification_required: receipt.identity_verification_required,
    payment_intent_clarification_required: receipt.payment_intent_clarification_required,
    spend_limit_recommended: receipt.spend_limit_recommended,
    refusalgraph_caution_level: receipt.refusalgraph_caution_level,
    refusalgraph_matched_signal_count: receipt.refusalgraph_matched_signal_count,
    reason_codes: receipt.reason_codes,
    required_next_steps: receipt.required_next_steps,
    verification_status: receipt.verification_status,
    receipt_status: receipt.receipt_status,
    private_data_included: receipt.private_data_included,
    network_lookup_performed: receipt.network_lookup_performed,
    external_lookup_performed: receipt.external_lookup_performed,
    payment_or_fee_triggered: receipt.payment_or_fee_triggered,
    action_executed: receipt.action_executed,
    receipt_persisted: receipt.receipt_persisted,
    settlement_triggered: receipt.settlement_triggered,
    billing_triggered: receipt.billing_triggered,
    machine_to_machine_fee_triggered: receipt.machine_to_machine_fee_triggered,
    status: receipt.status,
    created_at: receipt.created_at,
  };
}

function safeTimestamp(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "unknown" : date.toISOString();
}
