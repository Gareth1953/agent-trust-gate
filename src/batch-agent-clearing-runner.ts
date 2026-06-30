import { createHash } from "node:crypto";

import {
  runAgentClearingPipelineDemo,
  type AgentClearingPipelineDemoResult,
  type AgentClearingPipelineRequest,
} from "./agent-clearing-pipeline-demo.js";
import {
  createAgentClearingDemoReport,
} from "./agent-clearing-demo-report.js";
import {
  addLocalClearingLedgerRecord,
  createLocalClearingLedger,
  summariseLocalClearingLedger,
  type LocalClearingLedger,
  type LocalClearingLedgerRecordInput,
  type LocalClearingLedgerSummary,
} from "./local-clearing-ledger.js";
import type { LocalRefusalGraphSignal } from "./refusalgraph-query-engine.js";
import {
  addRefusalGraphLocalSignals,
  createRefusalGraphLocalSignalStore,
  queryRefusalGraphLocalSignalStore,
  summariseRefusalGraphLocalSignalStore,
  type RefusalGraphLocalSignalInput,
  type RefusalGraphLocalSignalStore,
  type RefusalGraphLocalSignalStoreQueryResult,
  type RefusalGraphLocalSignalStoreSummary,
  type RefusalGraphLocalStoredSignal,
} from "./refusalgraph-local-signal-store.js";

export const BATCH_AGENT_CLEARING_RUNNER_VERSION = "atg.batch-agent-clearing-runner.v1" as const;

export interface BatchAgentClearingRequestInput {
  [key: string]: unknown;
  request_id: string;
  agent_id?: string;
  target_agent_id?: string;
  intent_category: string;
  action_category: string;
  requested_action: string;
  risk_level: string;
  evidence_level: string;
  approval_status: string;
  created_at: string;
}

export interface BatchAgentClearingRunInput {
  [key: string]: unknown;
  batch_id: string;
  batch_status?: string;
  clearing_requests: readonly BatchAgentClearingRequestInput[];
  local_refusal_signals: readonly RefusalGraphLocalSignalInput[];
  created_at: string;
}

export interface BatchAgentClearingRequestResult {
  request_id: string;
  pipeline_id: string;
  decision: string;
  caution_level: "none" | "low" | "medium" | "high" | "critical";
  approval_required: boolean;
  action_allowed: boolean;
  action_blocked: boolean;
  refusal_reasons: string[];
  clearing_decision_id: string;
  clearing_receipt_id: string;
  verification_id: string;
  metering_event_id: string;
  report_id: string;
  ledger_record_ids: string[];
  matched_signal_count: number;
  highest_refusalgraph_caution: "low" | "medium" | "high" | "critical" | "unknown";
  status: "draft_only";
  created_at: string;
}

export interface BatchAgentClearingSafetySummary {
  local_inputs_only: true;
  private_data_included: false;
  network_lookup_performed: false;
  external_lookup_performed: false;
  tracking_triggered: false;
  analytics_triggered: false;
  payment_or_fee_triggered: false;
  billing_triggered: false;
  settlement_triggered: false;
  action_executed: false;
}

export interface BatchAgentClearingRunResult {
  batch_id: string;
  batch_type: "local_agent_clearing_batch";
  batch_status: "draft_only_completed";
  total_requests: number;
  completed_count: number;
  allowed_count: number;
  blocked_count: number;
  approval_required_count: number;
  high_caution_count: number;
  critical_caution_count: number;
  receipts_created_count: number;
  verifications_completed_count: number;
  fee_placeholders_count: number;
  ledger_summary: LocalClearingLedgerSummary;
  signal_store_summary: RefusalGraphLocalSignalStoreSummary;
  request_results: BatchAgentClearingRequestResult[];
  safety_summary: BatchAgentClearingSafetySummary;
  recommended_next_steps: string[];
  private_data_included: false;
  network_lookup_performed: false;
  external_lookup_performed: false;
  tracking_triggered: false;
  analytics_triggered: false;
  payment_or_fee_triggered: false;
  billing_triggered: false;
  settlement_triggered: false;
  action_executed: false;
  status: "draft_only";
  created_at: string;
}

export interface BatchAgentClearingRunSummary {
  batch_id: string;
  total_requests: number;
  completed_count: number;
  allowed_count: number;
  blocked_count: number;
  approval_required_count: number;
  high_caution_count: number;
  critical_caution_count: number;
  receipts_created_count: number;
  verifications_completed_count: number;
  fee_placeholders_count: number;
  private_data_included: false;
  network_lookup_count: number;
  external_lookup_count: number;
  tracking_triggered_count: number;
  analytics_triggered_count: number;
  payment_triggered_count: number;
  billing_triggered_count: number;
  settlement_triggered_count: number;
  action_executed_count: number;
  status: "draft_only";
}

type ProcessedRequest = {
  result: BatchAgentClearingRequestResult;
  ledger: LocalClearingLedger;
};

const NEXT_STEPS = new Set([
  "require_human_approval", "require_more_evidence", "require_identity_verification",
  "clarify_payment_intent", "cap_spend_limit", "refuse_transaction", "keep_blocked",
  "create_receipt_only", "accept_with_limits", "draft_only_not_executed",
]);

export function createBatchAgentClearingRun(
  input: BatchAgentClearingRunInput,
): BatchAgentClearingRunResult {
  return runBatchAgentClearingRequests(input);
}

export function runBatchAgentClearingRequests(
  input: BatchAgentClearingRunInput,
): BatchAgentClearingRunResult {
  const batchId = createBatchAgentClearingRunId(input.batch_id);
  const createdAt = safeTimestamp(input.created_at);
  const store = addRefusalGraphLocalSignals(
    createRefusalGraphLocalSignalStore(),
    Array.isArray(input.local_refusal_signals) ? input.local_refusal_signals : [],
  );
  let ledger = createLocalClearingLedger();
  const requestResults: BatchAgentClearingRequestResult[] = [];

  for (const request of Array.isArray(input.clearing_requests) ? input.clearing_requests : []) {
    const processed = processRequest(batchId, request, store, ledger);
    ledger = processed.ledger;
    requestResults.push(processed.result);
  }

  const counts = countResults(requestResults);
  const ledgerSummary = summariseLocalClearingLedger(ledger);
  const signalStoreSummary = summariseRefusalGraphLocalSignalStore(store);
  return {
    batch_id: batchId,
    batch_type: "local_agent_clearing_batch",
    batch_status: "draft_only_completed",
    total_requests: requestResults.length,
    completed_count: requestResults.length,
    ...counts,
    ledger_summary: ledgerSummary,
    signal_store_summary: signalStoreSummary,
    request_results: requestResults,
    safety_summary: safetySummary(),
    recommended_next_steps: aggregateNextSteps(requestResults),
    private_data_included: false,
    network_lookup_performed: false,
    external_lookup_performed: false,
    tracking_triggered: false,
    analytics_triggered: false,
    payment_or_fee_triggered: false,
    billing_triggered: false,
    settlement_triggered: false,
    action_executed: false,
    status: "draft_only",
    created_at: createdAt,
  };
}

export function summariseBatchAgentClearingRun(
  result: BatchAgentClearingRunResult,
): BatchAgentClearingRunSummary {
  return {
    batch_id: result.batch_id,
    total_requests: result.total_requests,
    completed_count: result.completed_count,
    allowed_count: result.allowed_count,
    blocked_count: result.blocked_count,
    approval_required_count: result.approval_required_count,
    high_caution_count: result.high_caution_count,
    critical_caution_count: result.critical_caution_count,
    receipts_created_count: result.receipts_created_count,
    verifications_completed_count: result.verifications_completed_count,
    fee_placeholders_count: result.fee_placeholders_count,
    private_data_included: false,
    network_lookup_count: 0,
    external_lookup_count: 0,
    tracking_triggered_count: 0,
    analytics_triggered_count: 0,
    payment_triggered_count: 0,
    billing_triggered_count: 0,
    settlement_triggered_count: 0,
    action_executed_count: 0,
    status: "draft_only",
  };
}

export function createBatchAgentClearingRunId(source: string): string {
  const digest = createHash("sha256").update(source, "utf8").digest("hex");
  return `batch_agent_clearing_${digest.slice(0, 24)}`;
}

function processRequest(
  batchId: string,
  input: BatchAgentClearingRequestInput,
  store: RefusalGraphLocalSignalStore,
  ledger: LocalClearingLedger,
): ProcessedRequest {
  const requestId = safeReference("request", input.request_id);
  const pipelineIdSource = `${batchId}:${requestId}`;
  const storeQuery = queryRefusalGraphLocalSignalStore(store, {
    query_id: `${pipelineIdSource}:local-store-query`,
    intent_category: input.intent_category,
    action_category: input.action_category,
    created_at: input.created_at,
  });
  const pipeline = runAgentClearingPipelineDemo({
    pipeline_id: pipelineIdSource,
    clearing_request: toPipelineRequest(input, requestId),
    local_refusal_signals: storeQuery.matched_signals.map(toPipelineSignal),
    fee_metering_requested: true,
    timestamp: input.created_at,
  });
  const report = createAgentClearingDemoReport(pipeline);
  const before = new Set(ledger.records.map((record) => record.record_id));
  const nextLedger = ledgerInputs(pipeline, report.report_id).reduce(
    addLocalClearingLedgerRecord,
    ledger,
  );
  const ledgerRecordIds = nextLedger.records
    .filter((record) => !before.has(record.record_id))
    .map((record) => record.record_id);

  return {
    ledger: nextLedger,
    result: {
      request_id: requestId,
      pipeline_id: pipeline.pipeline_id,
      decision: pipeline.clearing_decision.decision,
      caution_level: pipeline.refusalgraph_query_result.caution_level,
      approval_required: pipeline.clearing_decision.approval_required,
      action_allowed: pipeline.clearing_decision.action_allowed,
      action_blocked: pipeline.clearing_decision.action_blocked,
      refusal_reasons: [...pipeline.refusalgraph_query_result.common_refusal_reason_codes],
      clearing_decision_id: pipeline.clearing_decision.clearing_decision_id,
      clearing_receipt_id: pipeline.clearing_receipt.receipt_id,
      verification_id: pipeline.receipt_verification_result.verification_id,
      metering_event_id: pipeline.fee_metering_event.metering_event_id,
      report_id: report.report_id,
      ledger_record_ids: ledgerRecordIds,
      matched_signal_count: storeQuery.matched_signal_count,
      highest_refusalgraph_caution: storeQuery.highest_caution_level,
      status: "draft_only",
      created_at: safeTimestamp(input.created_at),
    },
  };
}

function toPipelineRequest(
  input: BatchAgentClearingRequestInput,
  requestId: string,
): AgentClearingPipelineRequest {
  const risk = safeRisk(input.risk_level);
  const actionType = safeActionType(input.action_category, input.requested_action);
  return {
    clearing_request_id: requestId,
    requesting_agent_type: "local_requesting_agent",
    receiving_agent_type: "local_receiving_agent",
    requested_action_category: pipelineCategory(input.intent_category),
    requested_action_type: actionType,
    proposed_value: null,
    proposed_fee: null,
    risk_level: risk,
    impact_level: risk === "high" ? "high" : risk === "medium" ? "medium" : "low",
    evidence_status: safeEvidence(input.evidence_level),
    approval_status: safeApproval(input.approval_status),
    agent_identity_status: "verified_locally",
    payment_intent_status: isMoneyAction(actionType) ? "unclear" : "not_applicable",
    requested_decision: "request_clearance",
    timestamp: safeTimestamp(input.created_at),
  };
}

function toPipelineSignal(signal: RefusalGraphLocalStoredSignal): LocalRefusalGraphSignal {
  return {
    signal_id: signal.signal_id,
    action_category: pipelineCategory(signal.intent_category),
    proposed_action_type: safeActionType(signal.action_category, signal.action_category),
    refusal_type: refusalType(signal),
    refusal_reason_codes: [signal.refusal_reason],
    risk_level: signal.caution_level === "critical" || signal.caution_level === "high"
      ? "high" : signal.caution_level === "medium" ? "medium" : "low",
    impact_level: signal.caution_level === "critical" || signal.caution_level === "high"
      ? "high" : "medium",
    evidence_status: signal.evidence_level,
    approval_status: signal.approval_required ? "missing" : "not_required",
    recommended_next_step: nextStepForReason(signal.refusal_reason),
    status: "draft_only",
  };
}

function ledgerInputs(
  pipeline: AgentClearingPipelineDemoResult,
  reportId: string,
): LocalClearingLedgerRecordInput[] {
  const decision = pipeline.clearing_decision;
  const receipt = pipeline.clearing_receipt;
  const verification = pipeline.receipt_verification_result;
  const metering = pipeline.fee_metering_event;
  const common = {
    pipeline_id: pipeline.pipeline_id,
    clearing_request_id: decision.clearing_request_id,
    clearing_decision_id: decision.clearing_decision_id,
    clearing_receipt_id: receipt.receipt_id,
    verification_id: verification.verification_id,
    metering_event_id: metering.metering_event_id,
    refusalgraph_query_id: pipeline.refusalgraph_query_result.query_id,
    decision: decision.decision,
    caution_level: pipeline.refusalgraph_query_result.caution_level,
    approval_required: decision.approval_required,
    action_allowed: decision.action_allowed,
    action_blocked: decision.action_blocked,
    receipt_status: receipt.receipt_status,
    verification_result: verification.verification_result,
    fee_readiness_status: metering.fee_readiness_status,
    created_at: pipeline.created_at,
  };
  return [
    { ...common, record_type: "refusalgraph_query_result", source_id: pipeline.refusalgraph_query_result.query_id },
    { ...common, record_type: "clearing_decision", source_id: decision.clearing_decision_id },
    { ...common, record_type: "clearing_receipt", source_id: receipt.receipt_id },
    { ...common, record_type: "receipt_verification_result", source_id: verification.verification_id },
    { ...common, record_type: "fee_metering_event", source_id: metering.metering_event_id },
    { ...common, record_type: "pipeline_result", source_id: pipeline.pipeline_id },
    { ...common, record_type: "demo_report", source_id: reportId },
  ];
}

function countResults(results: readonly BatchAgentClearingRequestResult[]): Pick<
  BatchAgentClearingRunResult,
  "allowed_count" | "blocked_count" | "approval_required_count" | "high_caution_count"
  | "critical_caution_count" | "receipts_created_count" | "verifications_completed_count"
  | "fee_placeholders_count"
> {
  return {
    allowed_count: results.filter((item) => item.action_allowed).length,
    blocked_count: results.filter((item) => item.action_blocked).length,
    approval_required_count: results.filter((item) => item.approval_required).length,
    high_caution_count: results.filter((item) => item.caution_level === "high").length,
    critical_caution_count: results.filter((item) => item.caution_level === "critical").length,
    receipts_created_count: results.length,
    verifications_completed_count: results.length,
    fee_placeholders_count: results.length,
  };
}

function aggregateNextSteps(results: readonly BatchAgentClearingRequestResult[]): string[] {
  const values = new Set<string>();
  for (const result of results) {
    if (result.approval_required) values.add("require_human_approval");
    if (result.action_blocked) values.add("keep_blocked");
    if (result.action_allowed) values.add("create_receipt_only");
  }
  values.add("draft_only_not_executed");
  return [...values].filter((value) => NEXT_STEPS.has(value)).sort();
}

function safetySummary(): BatchAgentClearingSafetySummary {
  return {
    local_inputs_only: true,
    private_data_included: false,
    network_lookup_performed: false,
    external_lookup_performed: false,
    tracking_triggered: false,
    analytics_triggered: false,
    payment_or_fee_triggered: false,
    billing_triggered: false,
    settlement_triggered: false,
    action_executed: false,
  };
}

function refusalType(signal: RefusalGraphLocalStoredSignal): string {
  if (signal.refusal_reason === "missing_evidence") return "missing_evidence";
  if (signal.refusal_reason === "weak_or_missing_identity") return "identity_unclear";
  if (signal.refusal_reason === "payment_intent_unclear") return "payment_intent_unclear";
  if (signal.caution_level === "high" || signal.caution_level === "critical") return "high_risk_action";
  return signal.signal_type === "approval_required" ? "approval_required" : "blocked";
}

function nextStepForReason(reason: string): string {
  if (reason === "missing_evidence") return "require_more_evidence";
  if (reason === "weak_or_missing_identity") return "require_identity_verification";
  if (reason === "payment_intent_unclear") return "clarify_payment_intent";
  if (reason === "missing_human_approval") return "require_human_approval";
  return "keep_blocked";
}

function pipelineCategory(value: string): string {
  const token = safeToken(value);
  if (token === "payment" || token === "purchase" || token === "settlement") return "financial_action";
  const allowed = new Set([
    "publishing", "customer_communication", "deployment", "data_access",
    "external_connection", "signup", "billing", "automatic_purchase",
    "high_risk_action",
  ]);
  return allowed.has(token) ? token : "other";
}

function safeActionType(actionCategory: string, requestedAction: string): string {
  const candidates = [safeToken(actionCategory), safeToken(requestedAction)];
  const allowed = new Set([
    "initiate_payment", "publish_content", "buy_service", "email_customer",
    "access_data", "deploy_code", "enable_billing", "enable_signup",
    "connect_external_system", "automatic_purchase",
  ]);
  return candidates.find((value) => allowed.has(value)) ?? "other";
}

function safeRisk(value: string): "low" | "medium" | "high" {
  const token = safeToken(value);
  return token === "low" || token === "medium" ? token : "high";
}

function safeEvidence(value: string): string {
  const token = safeToken(value);
  if (token === "complete" || token === "sufficient" || token === "verified") return "complete";
  return token === "missing" ? "missing" : "incomplete";
}

function safeApproval(value: string): string {
  const token = safeToken(value);
  if (token === "approved" || token === "not_required") return token;
  return "missing";
}

function isMoneyAction(value: string): boolean {
  return value === "initiate_payment" || value === "buy_service"
    || value === "enable_billing" || value === "automatic_purchase";
}

function safeReference(kind: string, value: string): string {
  const digest = createHash("sha256").update(value, "utf8").digest("hex");
  return `${kind}_reference_${digest.slice(0, 20)}`;
}

function safeToken(value: string): string {
  return typeof value === "string"
    ? value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 96)
    : "";
}

function safeTimestamp(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "unknown" : date.toISOString();
}
