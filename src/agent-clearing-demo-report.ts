import { createHash } from "node:crypto";

import type { AgentClearingDecisionType } from "./agent-clearing-decision-engine.js";
import type { AgentClearingPipelineDemoResult } from "./agent-clearing-pipeline-demo.js";

export const AGENT_CLEARING_DEMO_REPORT_VERSION = "atg.agent-clearing-demo-report.v1" as const;

export interface AgentClearingDemoReport {
  report_id: string;
  report_type: "agent_clearing_demo_report";
  source_pipeline_id: string;
  report_status: "draft_only";
  title: "Agent Clearing Demo Report";
  summary: string;
  requested_action_summary: string;
  refusalgraph_summary: string;
  clearing_decision_summary: string;
  receipt_summary: string;
  verification_summary: string;
  fee_metering_summary: string;
  safety_summary: string;
  future_value_summary: string;
  recommended_next_steps: string[];
  private_data_included: false;
  network_lookup_performed: false;
  external_lookup_performed: false;
  payment_or_fee_triggered: false;
  billing_triggered: false;
  settlement_triggered: false;
  machine_to_machine_fee_triggered: false;
  tracking_triggered: false;
  analytics_triggered: false;
  action_executed: false;
  published: false;
  status: "draft_only";
  created_at: string;
}

const DECISIONS = new Set<AgentClearingDecisionType>([
  "accept_with_limits", "require_more_evidence", "require_human_approval",
  "require_identity_verification", "clarify_payment_intent", "cap_spend_limit",
  "refuse_transaction", "keep_blocked", "create_receipt_only",
  "draft_only_not_executed",
]);

const REASON_CODES = new Set([
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

const NEXT_STEPS = new Set([
  ...DECISIONS,
  "keep_local_only", "do_not_execute", "do_not_verify_externally",
  "do_not_trigger_fee", "Gareth_final_approval_required",
]);

export function createAgentClearingDemoReport(
  input: AgentClearingPipelineDemoResult,
): AgentClearingDemoReport {
  const caution = safeCaution(input.refusalgraph_query_result.caution_level);
  const matchCount = safeCount(input.refusalgraph_query_result.matched_signal_count);
  const decision = safeDecision(input.clearing_decision.decision);
  const reasonCodes = input.clearing_decision.reason_codes
    .map(safeToken)
    .filter((value) => REASON_CODES.has(value));
  const approvalRequired = input.clearing_decision.approval_required === true
    || decision === "require_human_approval";
  const verification = safeVerificationResult(
    input.receipt_verification_result.verification_result,
  );
  const feeStatus = safeFeeStatus(input.fee_metering_event.fee_readiness_status);
  const sourceSafe = hasSafeSourceFlags(input);
  const nextSteps = safeRecommendedNextSteps(input, decision, approvalRequired);

  return {
    report_id: createAgentClearingDemoReportId(input.pipeline_id),
    report_type: "agent_clearing_demo_report",
    source_pipeline_id: safePipelineReference(input.pipeline_id),
    report_status: "draft_only",
    title: "Agent Clearing Demo Report",
    summary: createSummary(caution, decision, verification, feeStatus),
    requested_action_summary: createRequestedActionSummary(reasonCodes),
    refusalgraph_summary: createRefusalGraphSummary(caution, matchCount),
    clearing_decision_summary: createDecisionSummary(decision, reasonCodes, approvalRequired),
    receipt_summary: createReceiptSummary(input),
    verification_summary: createVerificationSummary(verification),
    fee_metering_summary: createFeeSummary(feeStatus),
    safety_summary: createSafetySummary(sourceSafe),
    future_value_summary: "This local chain demonstrates how RefusalGraph caution, clearing decisions, receipts, verification readiness, and fee placeholders could support a future Agent Clearing House without exposing private data or executing transactions.",
    recommended_next_steps: nextSteps,
    private_data_included: false,
    network_lookup_performed: false,
    external_lookup_performed: false,
    payment_or_fee_triggered: false,
    billing_triggered: false,
    settlement_triggered: false,
    machine_to_machine_fee_triggered: false,
    tracking_triggered: false,
    analytics_triggered: false,
    action_executed: false,
    published: false,
    status: "draft_only",
    created_at: safeTimestamp(input.created_at),
  };
}

export function createAgentClearingDemoReportId(sourcePipelineId: string): string {
  const digest = createHash("sha256").update(sourcePipelineId, "utf8").digest("hex");
  return `acdr_local_${digest.slice(0, 24)}`;
}

export function renderAgentClearingDemoReportMarkdown(
  report: AgentClearingDemoReport,
): string {
  return [
    "# Agent Clearing Demo Report",
    "",
    `Report status: ${report.report_status}`,
    "Published: false",
    "",
    report.summary,
    "",
    "## Request Summary",
    "",
    report.requested_action_summary,
    "",
    "## RefusalGraph Result",
    "",
    report.refusalgraph_summary,
    "",
    "## Clearing Decision",
    "",
    report.clearing_decision_summary,
    "",
    "## Receipt Created",
    "",
    report.receipt_summary,
    "",
    "## Local Verification Result",
    "",
    report.verification_summary,
    "",
    "## Fee Metering Placeholder",
    "",
    report.fee_metering_summary,
    "",
    "## Safety Status",
    "",
    report.safety_summary,
    "No action was executed. No network lookup was performed. No payment, billing, settlement, tracking, analytics, publishing, or deployment occurred.",
    "",
    "## Future Value",
    "",
    report.future_value_summary,
    "",
    "## Required Next Steps",
    "",
    ...report.recommended_next_steps.map((step) => `- ${step}`),
    "",
    "All live, commercial, network, payment, verification, metering, billing, or settlement use requires Gareth final approval.",
  ].join("\n");
}

function createSummary(
  caution: string,
  decision: AgentClearingDecisionType,
  verification: string,
  feeStatus: string,
): string {
  return `Local Agent Clearing Demo completed. The request was not executed. RefusalGraph returned ${caution} caution. The clearing decision was ${decision}. A local draft clearing receipt was created and the local verification result was ${verification}. Fee metering remains ${feeStatus}. No network, payment, billing, settlement, tracking, analytics, publishing, or action execution occurred.`;
}

function createRequestedActionSummary(reasonCodes: readonly string[]): string {
  const label = reasonCodes.includes("payment_requested")
    || reasonCodes.includes("money_movement_requested")
    ? "a payment or money-movement action"
    : reasonCodes.includes("billing_requested")
      ? "a billing action"
      : reasonCodes.includes("settlement_requested")
        ? "a settlement action"
        : reasonCodes.includes("automatic_purchase_requested")
          ? "an automatic-purchase action"
          : reasonCodes.includes("deployment_requested")
            ? "a deployment action"
            : reasonCodes.includes("publishing_requested")
              ? "a publishing action"
              : reasonCodes.includes("customer_facing_action")
                ? "a customer-facing action"
                : reasonCodes.includes("private_data_access_requested")
                  ? "a private-data access action"
                  : reasonCodes.includes("external_connection_requested")
                    ? "an external-connection action"
                    : reasonCodes.includes("low_risk_receipt_only")
                      ? "a low-risk internal action"
                      : "a draft agent action with intentionally minimized details";
  return `The local clearing request concerned ${label}. Raw request content, real identities, targets, values, and private data are intentionally omitted.`;
}

function createRefusalGraphSummary(caution: string, matchCount: number): string {
  const matchLabel = matchCount === 1 ? "signal" : "signals";
  return `The local RefusalGraph query found ${matchCount} matching draft refusal ${matchLabel} and returned ${caution} caution. No network or external lookup was performed.`;
}

function createDecisionSummary(
  decision: AgentClearingDecisionType,
  reasonCodes: readonly string[],
  approvalRequired: boolean,
): string {
  const reasons = reasonCodes.map(reasonLabel).filter((value, index, all) => all.indexOf(value) === index);
  const reasonText = reasons.length > 0 ? reasons.join(", ") : "the request remained draft-only";
  const approvalText = approvalRequired
    ? "Human approval is required before any further action."
    : "No execution approval was granted by this report.";
  return `The local clearing decision was ${decision}. The safe reason summary is: ${reasonText}. ${approvalText}`;
}

function createReceiptSummary(input: AgentClearingPipelineDemoResult): string {
  const status = safeToken(input.clearing_receipt.receipt_status) === "local_only"
    ? "local_only"
    : "draft_only";
  return `A local Agent Clearing Receipt was created with ${status} status. It was not persisted, exchanged, published, billed, or used to execute the requested action.`;
}

function createVerificationSummary(verification: string): string {
  return `The receipt verification-readiness result was ${verification}. This is a local structural and safety-flag check only; no external verification or network validation occurred.`;
}

function createFeeSummary(feeStatus: string): string {
  return `The local fee-metering status was ${feeStatus}. No billable event, charge, payment, billing record, settlement, or machine-to-machine fee was triggered.`;
}

function createSafetySummary(sourceSafe: boolean): string {
  return sourceSafe
    ? "The source pipeline reported local safe flags. The report remained private-data-free, unpublished, untracked, non-networked, non-commercial, and non-executing."
    : "Unsafe or inconsistent source flags were detected. The report still remained private-data-free, unpublished, untracked, non-networked, non-commercial, and non-executing; the source must remain blocked.";
}

function safeRecommendedNextSteps(
  input: AgentClearingPipelineDemoResult,
  decision: AgentClearingDecisionType,
  approvalRequired: boolean,
): string[] {
  const values = [
    ...input.clearing_decision.required_next_steps,
    ...input.receipt_verification_result.required_next_steps,
  ].map(safeToken).filter((value) => NEXT_STEPS.has(value));
  const output = new Set(values);
  output.add(decision);
  if (approvalRequired) output.add("require_human_approval");
  output.add("keep_local_only");
  output.add("do_not_execute");
  output.add("Gareth_final_approval_required");
  return [...output].sort((left, right) => nextStepPriority(left) - nextStepPriority(right)
    || left.localeCompare(right));
}

function hasSafeSourceFlags(input: AgentClearingPipelineDemoResult): boolean {
  return input.private_data_included === false
    && input.network_lookup_performed === false
    && input.external_lookup_performed === false
    && input.payment_or_fee_triggered === false
    && input.billing_triggered === false
    && input.settlement_triggered === false
    && input.machine_to_machine_fee_triggered === false
    && input.tracking_triggered === false
    && input.analytics_triggered === false
    && input.action_executed === false;
}

function reasonLabel(code: string): string {
  const labels: Record<string, string> = {
    missing_human_approval: "human approval was missing",
    missing_evidence: "evidence was incomplete",
    weak_or_missing_identity: "agent identity was not sufficiently verified",
    payment_intent_unclear: "payment intent was unclear",
    refusalgraph_high_caution: "RefusalGraph caution was high",
    refusalgraph_critical_caution: "RefusalGraph caution was critical",
    high_risk_action: "the action was high risk",
    money_movement_requested: "money movement was requested",
    payment_requested: "payment was requested",
    billing_requested: "billing was requested",
    settlement_requested: "settlement was requested",
    automatic_purchase_requested: "automatic purchase was requested",
    deployment_requested: "deployment was requested",
    publishing_requested: "publishing was requested",
    customer_facing_action: "the action was customer-facing",
    signup_requested: "signup activation was requested",
    private_data_access_requested: "private-data access was requested",
    external_connection_requested: "an external connection was requested",
    low_risk_receipt_only: "the action was low risk and receipt-only",
    unknown_or_unclear_intent: "the intent was unclear",
    draft_only_not_executed: "the result remained draft-only and unexecuted",
  };
  return labels[code] ?? "the request remained blocked by local safety controls";
}

function safePipelineReference(value: string): string {
  if (/^acp_local_[a-f0-9]{24}$/.test(value)) return value;
  const digest = createHash("sha256").update(value, "utf8").digest("hex");
  return `pipeline_reference_${digest.slice(0, 24)}`;
}

function safeCaution(value: string): "none" | "low" | "medium" | "high" | "critical" | "unknown" {
  const token = safeToken(value);
  return token === "none" || token === "low" || token === "medium"
    || token === "high" || token === "critical" ? token : "unknown";
}

function safeDecision(value: string): AgentClearingDecisionType {
  const token = safeToken(value) as AgentClearingDecisionType;
  return DECISIONS.has(token) ? token : "keep_blocked";
}

function safeVerificationResult(value: string): string {
  const token = safeToken(value);
  return new Set([
    "locally_valid", "locally_invalid", "missing_required_fields",
    "unsafe_flags_detected", "private_data_detected", "decision_link_missing",
    "draft_only_not_externally_verified",
  ]).has(token) ? token : "draft_only_not_externally_verified";
}

function safeFeeStatus(value: string): "placeholder_only" | "not_enabled" {
  return safeToken(value) === "placeholder_only" ? "placeholder_only" : "not_enabled";
}

function safeCount(value: number): number {
  return Number.isSafeInteger(value) && value >= 0 ? Math.min(value, 1_000_000) : 0;
}

function safeToken(value: string): string {
  return value.trim().replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 96);
}

function safeTimestamp(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "unknown" : date.toISOString();
}

function nextStepPriority(value: string): number {
  const priorities: Record<string, number> = {
    keep_blocked: 0,
    refuse_transaction: 1,
    require_human_approval: 2,
    require_identity_verification: 3,
    require_more_evidence: 4,
    clarify_payment_intent: 5,
    cap_spend_limit: 6,
    accept_with_limits: 7,
    create_receipt_only: 8,
    draft_only_not_executed: 9,
    keep_local_only: 10,
    do_not_execute: 11,
    do_not_verify_externally: 12,
    do_not_trigger_fee: 13,
    Gareth_final_approval_required: 14,
  };
  return priorities[value] ?? 99;
}
