import { createHash } from "node:crypto";

import {
  runLocalAgentClearingEngine,
  type LocalAgentClearingEngineResult,
} from "./local-agent-clearing-engine.js";
import type { BatchAgentClearingRequestInput } from "./batch-agent-clearing-runner.js";
import type { RefusalGraphLocalSignalInput } from "./refusalgraph-local-signal-store.js";

export const MACHINE_TO_MACHINE_PAID_USE_PROFIT_TEST_VERSION =
  "atg.machine-to-machine-paid-use-profit-test.v1" as const;

export interface LocalProfitTestAgentInput {
  [key: string]: unknown;
  agent_id: string;
  agent_type: string;
  agent_role?: string;
  service_name?: string;
  requested_goal?: string;
  local_goal_outcome?: string;
  requires_paid_entitlement?: boolean;
}

export interface LocalPaidUseEntitlementInput {
  [key: string]: unknown;
  source_id: string;
  entitlement_id?: string;
  entitlement_type?: string;
  entitlement_status?: string;
  paid_placeholder?: boolean;
  billable_if_live?: boolean;
  uses_allowed?: number;
  uses_remaining?: number;
  payment_enabled?: boolean;
  billing_enabled?: boolean;
  settlement_enabled?: boolean;
  machine_to_machine_fee_enabled?: boolean;
}

export interface LocalPaidUseEntitlement {
  entitlement_id: string;
  entitlement_type: "local_paid_use_placeholder";
  entitlement_status: "active_placeholder" | "missing" | "exhausted";
  paid_placeholder: boolean;
  billable_if_live: boolean;
  uses_allowed: number;
  uses_remaining: number;
  payment_enabled: false;
  billing_enabled: false;
  settlement_enabled: false;
  machine_to_machine_fee_enabled: false;
  status: "draft_only";
}

export interface MachineToMachinePaidUseProfitTestInput {
  [key: string]: unknown;
  profit_test_id?: string;
  source_id: string;
  buyer_agent: LocalProfitTestAgentInput;
  clearing_service_agent: LocalProfitTestAgentInput;
  target_service_agent: LocalProfitTestAgentInput;
  paid_use_entitlement?: LocalPaidUseEntitlementInput | null;
  clearing_request: BatchAgentClearingRequestInput;
  local_refusal_signals?: readonly RefusalGraphLocalSignalInput[];
  repeat_use_attempts?: number;
  created_at: string;
}

export interface MachineToMachinePaidUseProfitTestResult {
  profit_test_id: string;
  test_type: "local_m2m_paid_use_profit_test";
  source_id: string;
  buyer_agent_id: string;
  clearing_service_agent_id: string;
  target_service_agent_id: string;
  access_status: "paid_entitlement_accepted" | "paid_entitlement_required";
  paid_entitlement_present: boolean;
  paid_placeholder: boolean;
  billable_if_live: boolean;
  uses_allowed: number;
  uses_consumed: number;
  uses_remaining: number;
  engine_run_id: string | null;
  decision: string | null;
  caution_level: string | null;
  approval_required: boolean;
  action_allowed: boolean;
  action_blocked: boolean;
  requested_goal: string;
  local_goal_outcome: string;
  goal_status: "locally_achieved" | "blocked" | "approval_required" | "not_attempted";
  clearing_receipt_id: string | null;
  verification_result: string | null;
  evidence_bundle_id: string | null;
  replay_status: string | null;
  integrity_score: number | null;
  fee_placeholder_count: number;
  repeat_use_attempts: number;
  repeat_use_success_count: number;
  repeat_use_blocked_count: number;
  repeat_use_approval_required_count: number;
  hypothetical_revenue_event_count: number;
  hypothetical_revenue_summary: string;
  final_profit_test_summary: string;
  recommended_next_steps: string[];
  private_data_included: false;
  network_lookup_performed: false;
  external_lookup_performed: false;
  tracking_triggered: false;
  analytics_triggered: false;
  payment_or_fee_triggered: false;
  billing_triggered: false;
  settlement_triggered: false;
  machine_to_machine_fee_triggered: false;
  action_executed: false;
  published: false;
  status: "draft_only";
  created_at: string;
}

export type MachineToMachinePaidUseProfitTestSummary = Pick<
  MachineToMachinePaidUseProfitTestResult,
  "profit_test_id" | "access_status" | "paid_entitlement_present" |
  "uses_allowed" | "uses_consumed" | "uses_remaining" | "decision" |
  "goal_status" | "fee_placeholder_count" | "repeat_use_attempts" |
  "hypothetical_revenue_event_count" | "final_profit_test_summary" |
  "private_data_included" | "network_lookup_performed" |
  "external_lookup_performed" | "tracking_triggered" | "analytics_triggered" |
  "payment_or_fee_triggered" | "billing_triggered" | "settlement_triggered" |
  "machine_to_machine_fee_triggered" | "action_executed" | "published" | "status"
>;

export function runMachineToMachinePaidUseProfitTest(
  input: MachineToMachinePaidUseProfitTestInput,
): MachineToMachinePaidUseProfitTestResult {
  const createdAt = safeTimestamp(input.created_at);
  const profitTestId = createMachineToMachineProfitTestId(input.profit_test_id ?? input.source_id);
  const entitlement = createLocalPaidUseEntitlement({
    ...(input.paid_use_entitlement ?? {}), source_id: input.source_id,
  });
  const present = entitlement.entitlement_status === "active_placeholder"
    && entitlement.paid_placeholder && entitlement.uses_remaining > 0;
  const repeatAttempts = safeCount(input.repeat_use_attempts);
  const requestedGoal = safeText(input.buyer_agent.requested_goal, "local_service_goal");
  const localGoalOutcome = safeText(input.target_service_agent.local_goal_outcome,
    "local_goal_outcome_placeholder");
  const common = {
    profit_test_id: profitTestId,
    test_type: "local_m2m_paid_use_profit_test" as const,
    source_id: safeId("source", input.source_id),
    buyer_agent_id: safeId("buyer_agent", input.buyer_agent.agent_id),
    clearing_service_agent_id: safeId("clearing_agent", input.clearing_service_agent.agent_id),
    target_service_agent_id: safeId("target_agent", input.target_service_agent.agent_id),
    requested_goal: requestedGoal,
    local_goal_outcome: localGoalOutcome,
    repeat_use_attempts: repeatAttempts,
    private_data_included: false as const,
    network_lookup_performed: false as const,
    external_lookup_performed: false as const,
    tracking_triggered: false as const,
    analytics_triggered: false as const,
    payment_or_fee_triggered: false as const,
    billing_triggered: false as const,
    settlement_triggered: false as const,
    machine_to_machine_fee_triggered: false as const,
    action_executed: false as const,
    published: false as const,
    status: "draft_only" as const,
    created_at: createdAt,
  };
  if (!present) return deniedResult(common, entitlement);

  const engine = runLocalAgentClearingEngine({
    engine_run_id: profitTestId,
    source_id: input.source_id,
    clearing_request: input.clearing_request,
    local_refusal_signals: Array.isArray(input.local_refusal_signals)
      ? input.local_refusal_signals : [],
    created_at: createdAt,
  });
  const totalRequestedUses = 1 + repeatAttempts;
  const usesConsumed = Math.min(totalRequestedUses, entitlement.uses_remaining);
  const remaining = Math.max(0, entitlement.uses_remaining - usesConsumed);
  const repeatUsesConsumed = Math.max(0, usesConsumed - 1);
  const goalStatus = goalStatusFor(engine);
  const repeats = repeatCounts(goalStatus, repeatUsesConsumed);
  const feeCount = engine.fee_metering_summary.total_events;
  return {
    ...common,
    access_status: "paid_entitlement_accepted",
    paid_entitlement_present: true,
    paid_placeholder: true,
    billable_if_live: entitlement.billable_if_live,
    uses_allowed: entitlement.uses_allowed,
    uses_consumed: usesConsumed,
    uses_remaining: remaining,
    engine_run_id: engine.engine_run_id,
    decision: engine.decision,
    caution_level: engine.caution_level,
    approval_required: engine.approval_required,
    action_allowed: engine.action_allowed,
    action_blocked: engine.action_blocked,
    goal_status: goalStatus,
    clearing_receipt_id: engine.clearing_receipt_id,
    verification_result: engine.verification_result,
    evidence_bundle_id: engine.evidence_bundle_id,
    replay_status: engine.replay_status,
    integrity_score: engine.integrity_score,
    fee_placeholder_count: feeCount,
    ...repeats,
    hypothetical_revenue_event_count: usesConsumed,
    hypothetical_revenue_summary: `${usesConsumed} local paid-use placeholder event(s) recorded; no real charge occurred.`,
    final_profit_test_summary: acceptedSummary(goalStatus),
    recommended_next_steps: nextSteps(engine, remaining, totalRequestedUses > usesConsumed),
  };
}

export function createLocalPaidUseEntitlement(
  input: LocalPaidUseEntitlementInput,
): LocalPaidUseEntitlement {
  const allowed = safeCount(input.uses_allowed);
  const remaining = Math.min(allowed, safeCount(input.uses_remaining ?? allowed));
  const placeholder = input.paid_placeholder === true;
  const active = placeholder && remaining > 0
    && (input.entitlement_status === "active_placeholder" || input.entitlement_status === "present");
  return {
    entitlement_id: safeId("paid_use_entitlement", input.entitlement_id ?? input.source_id),
    entitlement_type: "local_paid_use_placeholder",
    entitlement_status: active ? "active_placeholder" : placeholder && allowed > 0
      ? "exhausted" : "missing",
    paid_placeholder: active,
    billable_if_live: input.billable_if_live === true,
    uses_allowed: allowed,
    uses_remaining: active ? remaining : 0,
    payment_enabled: false,
    billing_enabled: false,
    settlement_enabled: false,
    machine_to_machine_fee_enabled: false,
    status: "draft_only",
  };
}

export function createMachineToMachineProfitTestId(sourceId: string): string {
  const digest = createHash("sha256").update(sourceId, "utf8").digest("hex");
  return "m2m_profit_test_" + digest.slice(0, 24);
}

export function summariseMachineToMachinePaidUseProfitTest(
  result: MachineToMachinePaidUseProfitTestResult,
): MachineToMachinePaidUseProfitTestSummary {
  return {
    profit_test_id: result.profit_test_id,
    access_status: result.access_status,
    paid_entitlement_present: result.paid_entitlement_present,
    uses_allowed: result.uses_allowed,
    uses_consumed: result.uses_consumed,
    uses_remaining: result.uses_remaining,
    decision: result.decision,
    goal_status: result.goal_status,
    fee_placeholder_count: result.fee_placeholder_count,
    repeat_use_attempts: result.repeat_use_attempts,
    hypothetical_revenue_event_count: result.hypothetical_revenue_event_count,
    final_profit_test_summary: result.final_profit_test_summary,
    private_data_included: false,
    network_lookup_performed: false,
    external_lookup_performed: false,
    tracking_triggered: false,
    analytics_triggered: false,
    payment_or_fee_triggered: false,
    billing_triggered: false,
    settlement_triggered: false,
    machine_to_machine_fee_triggered: false,
    action_executed: false,
    published: false,
    status: "draft_only",
  };
}

type CommonResult = Pick<MachineToMachinePaidUseProfitTestResult,
  "profit_test_id" | "test_type" | "source_id" | "buyer_agent_id" |
  "clearing_service_agent_id" | "target_service_agent_id" | "requested_goal" |
  "local_goal_outcome" | "repeat_use_attempts" | "private_data_included" |
  "network_lookup_performed" | "external_lookup_performed" | "tracking_triggered" |
  "analytics_triggered" | "payment_or_fee_triggered" | "billing_triggered" |
  "settlement_triggered" | "machine_to_machine_fee_triggered" | "action_executed" |
  "published" | "status" | "created_at">;

function deniedResult(common: CommonResult, entitlement: LocalPaidUseEntitlement): MachineToMachinePaidUseProfitTestResult {
  return {
    ...common,
    access_status: "paid_entitlement_required",
    paid_entitlement_present: false,
    paid_placeholder: false,
    billable_if_live: true,
    uses_allowed: entitlement.uses_allowed,
    uses_consumed: 0,
    uses_remaining: 0,
    engine_run_id: null,
    decision: null,
    caution_level: null,
    approval_required: false,
    action_allowed: false,
    action_blocked: true,
    goal_status: "not_attempted",
    clearing_receipt_id: null,
    verification_result: null,
    evidence_bundle_id: null,
    replay_status: null,
    integrity_score: null,
    fee_placeholder_count: 0,
    repeat_use_success_count: 0,
    repeat_use_blocked_count: common.repeat_use_attempts,
    repeat_use_approval_required_count: 0,
    hypothetical_revenue_event_count: 0,
    hypothetical_revenue_summary: "Paid use would be required if live; no real payment was triggered.",
    final_profit_test_summary: "Paid-use entitlement placeholder missing. The clearing service was not made available. No action was executed. This demonstrates the pre-use payment gate without triggering real payment.",
    recommended_next_steps: ["provide_local_paid_use_placeholder", "keep_action_unexecuted"],
  };
}

function goalStatusFor(engine: LocalAgentClearingEngineResult): MachineToMachinePaidUseProfitTestResult["goal_status"] {
  if (engine.approval_required) return "approval_required";
  if (engine.action_blocked) return "blocked";
  return engine.action_allowed ? "locally_achieved" : "not_attempted";
}

function repeatCounts(status: MachineToMachinePaidUseProfitTestResult["goal_status"], count: number) {
  return {
    repeat_use_success_count: status === "locally_achieved" ? count : 0,
    repeat_use_blocked_count: status === "blocked" ? count : 0,
    repeat_use_approval_required_count: status === "approval_required" ? count : 0,
  };
}

function acceptedSummary(status: MachineToMachinePaidUseProfitTestResult["goal_status"]): string {
  return `Local paid-use placeholder accepted. Buyer agent used the clearing service before the target service action. The local goal was ${status}. Receipt, verification, evidence, replay, integrity, and fee placeholders were created locally. No real payment, billing, settlement, network call, or action execution occurred. This demonstrates a repeatable future fee point if live approval is granted.`;
}

function nextSteps(engine: LocalAgentClearingEngineResult, remaining: number, exhausted: boolean): string[] {
  const steps = [...engine.recommended_next_steps];
  if (exhausted || remaining === 0) steps.push("renew_local_paid_use_placeholder_before_further_use");
  steps.push("keep_payment_billing_settlement_disabled");
  return [...new Set(steps)];
}

function safeCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.floor(value) : 0;
}

function safeText(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() !== ""
    ? value.trim().slice(0, 160) : fallback;
}

function safeId(prefix: string, source: string): string {
  const digest = createHash("sha256").update(source, "utf8").digest("hex");
  return `${prefix}_${digest.slice(0, 20)}`;
}

function safeTimestamp(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? "1970-01-01T00:00:00.000Z" : parsed.toISOString();
}
