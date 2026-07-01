import { createHash } from "node:crypto";

import {
  runMachineToMachinePaidUseProfitTest,
  type LocalPaidUseEntitlementInput,
  type LocalProfitTestAgentInput,
} from "./machine-to-machine-paid-use-profit-test.js";
import type { BatchAgentClearingRequestInput } from "./batch-agent-clearing-runner.js";
import type { RefusalGraphLocalSignalInput } from "./refusalgraph-local-signal-store.js";

export const PROFIT_DEMO_SCENARIO_RUNNER_VERSION = "atg.profit-demo-scenario-runner.v1" as const;

export type ProfitDemoScenarioType =
  | "entitled_use" | "missing_entitlement" | "repeat_use" | "unknown_local_scenario";

export interface ProfitDemoScenarioInput {
  [key: string]: unknown;
  scenario_id: string;
  scenario_type: string;
  title?: string;
  buyer_agent: LocalProfitTestAgentInput;
  clearing_service_agent: LocalProfitTestAgentInput;
  target_service_agent: LocalProfitTestAgentInput;
  paid_use_entitlement?: LocalPaidUseEntitlementInput | null;
  clearing_request: BatchAgentClearingRequestInput;
  local_refusal_signals?: readonly RefusalGraphLocalSignalInput[];
  repeat_use_attempts?: number;
}

export interface ProfitDemoScenarioRunnerInput {
  [key: string]: unknown;
  demo_id?: string;
  source_id: string;
  scenarios: readonly ProfitDemoScenarioInput[];
  created_at: string;
}

export interface ProfitDemoScenarioResult {
  scenario_id: string;
  scenario_type: ProfitDemoScenarioType;
  access_status: "paid_entitlement_accepted" | "paid_entitlement_required";
  paid_entitlement_present: boolean;
  uses_consumed: number;
  uses_remaining: number;
  decision: string | null;
  approval_required: boolean;
  action_allowed: boolean;
  action_blocked: boolean;
  goal_status: "locally_achieved" | "blocked" | "approval_required" | "not_attempted";
  hypothetical_revenue_event_count: number;
  engine_run_id: string | null;
  final_profit_test_summary: string;
  status: "draft_only";
}

export interface ProfitDemoScenarioRunnerResult {
  demo_id: string;
  demo_type: "local_profit_demo_scenario_runner";
  source_id: string;
  scenario_count: number;
  scenario_results: ProfitDemoScenarioResult[];
  entitled_use_passed: boolean;
  missing_entitlement_denied: boolean;
  repeat_use_revenue_events: number;
  total_hypothetical_revenue_events: number;
  total_placeholder_uses_consumed: number;
  total_approval_required: number;
  total_blocked: number;
  total_allowed: number;
  final_demo_summary: string;
  plain_english_result: string;
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

export type ProfitDemoScenarioRunnerSummary = Omit<ProfitDemoScenarioRunnerResult,
  "scenario_results" | "recommended_next_steps" | "created_at">;

const SCENARIO_TYPES = new Set<ProfitDemoScenarioType>([
  "entitled_use", "missing_entitlement", "repeat_use", "unknown_local_scenario",
]);

export function runProfitDemoScenarioRunner(
  input: ProfitDemoScenarioRunnerInput,
): ProfitDemoScenarioRunnerResult {
  const createdAt = safeTimestamp(input.created_at);
  const demoId = createProfitDemoScenarioRunnerId(input.demo_id ?? input.source_id);
  const scenarioResults = (Array.isArray(input.scenarios) ? input.scenarios : [])
    .map((scenario) => runScenario(input.source_id, scenario, createdAt));
  const entitledPassed = scenarioResults.some((result) => result.scenario_type === "entitled_use"
    && result.access_status === "paid_entitlement_accepted" && result.engine_run_id !== null);
  const missingDenied = scenarioResults.some((result) => result.scenario_type === "missing_entitlement"
    && result.access_status === "paid_entitlement_required" && result.engine_run_id === null);
  const repeatRevenue = sum(scenarioResults
    .filter((result) => result.scenario_type === "repeat_use")
    .map((result) => result.hypothetical_revenue_event_count));
  const totalRevenue = sum(scenarioResults.map((result) => result.hypothetical_revenue_event_count));
  const totalUses = sum(scenarioResults.map((result) => result.uses_consumed));
  return {
    demo_id: demoId,
    demo_type: "local_profit_demo_scenario_runner",
    source_id: safeId("source", input.source_id),
    scenario_count: scenarioResults.length,
    scenario_results: scenarioResults,
    entitled_use_passed: entitledPassed,
    missing_entitlement_denied: missingDenied,
    repeat_use_revenue_events: repeatRevenue,
    total_hypothetical_revenue_events: totalRevenue,
    total_placeholder_uses_consumed: totalUses,
    total_approval_required: count(scenarioResults, "approval_required"),
    total_blocked: count(scenarioResults, "action_blocked"),
    total_allowed: count(scenarioResults, "action_allowed"),
    final_demo_summary: `Local profit demo ran ${scenarioResults.length} scenario(s), consumed ${totalUses} placeholder use(s), and recorded ${totalRevenue} hypothetical revenue event(s).`,
    plain_english_result: "Local profit demo completed. Entitled agent access ran the clearing engine. Missing entitlement was denied before use. Repeat-use entitlement consumed placeholder uses and created hypothetical revenue events. No real payment, billing, settlement, network call, tracking, analytics, deployment, publishing, or action execution occurred.",
    recommended_next_steps: recommendations(entitledPassed, missingDenied, repeatRevenue),
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
    created_at: createdAt,
  };
}

export function createProfitDemoScenarioRunnerId(sourceId: string): string {
  const digest = createHash("sha256").update(sourceId, "utf8").digest("hex");
  return "profit_demo_" + digest.slice(0, 24);
}

export function summariseProfitDemoScenarioRunner(
  result: ProfitDemoScenarioRunnerResult,
): ProfitDemoScenarioRunnerSummary {
  const { scenario_results: _scenarios, recommended_next_steps: _steps,
    created_at: _createdAt, ...summary } = result;
  return summary;
}

function runScenario(sourceId: string, scenario: ProfitDemoScenarioInput,
  createdAt: string): ProfitDemoScenarioResult {
  const scenarioType = safeScenarioType(scenario.scenario_type);
  const result = runMachineToMachinePaidUseProfitTest({
    profit_test_id: `${sourceId}:${scenario.scenario_id}`,
    source_id: `${sourceId}:${scenario.scenario_id}`,
    buyer_agent: scenario.buyer_agent,
    clearing_service_agent: scenario.clearing_service_agent,
    target_service_agent: scenario.target_service_agent,
    ...(scenario.paid_use_entitlement === undefined ? {}
      : { paid_use_entitlement: scenario.paid_use_entitlement }),
    clearing_request: scenario.clearing_request,
    local_refusal_signals: Array.isArray(scenario.local_refusal_signals)
      ? scenario.local_refusal_signals : [],
    repeat_use_attempts: safeCount(scenario.repeat_use_attempts),
    created_at: createdAt,
  });
  return {
    scenario_id: safeId("scenario", scenario.scenario_id),
    scenario_type: scenarioType,
    access_status: result.access_status,
    paid_entitlement_present: result.paid_entitlement_present,
    uses_consumed: result.uses_consumed,
    uses_remaining: result.uses_remaining,
    decision: result.decision,
    approval_required: result.approval_required,
    action_allowed: result.action_allowed,
    action_blocked: result.action_blocked,
    goal_status: result.goal_status,
    hypothetical_revenue_event_count: result.hypothetical_revenue_event_count,
    engine_run_id: result.engine_run_id,
    final_profit_test_summary: result.final_profit_test_summary,
    status: "draft_only",
  };
}

function safeScenarioType(value: string): ProfitDemoScenarioType {
  return SCENARIO_TYPES.has(value as ProfitDemoScenarioType)
    ? value as ProfitDemoScenarioType : "unknown_local_scenario";
}

function count(results: readonly ProfitDemoScenarioResult[],
  key: "approval_required" | "action_allowed" | "action_blocked") {
  return results.filter((result) => result[key]).length;
}

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function recommendations(entitled: boolean, denied: boolean, repeatRevenue: number): string[] {
  const steps = ["keep_real_payment_billing_settlement_disabled"];
  if (!entitled || !denied || repeatRevenue === 0) steps.unshift("review_incomplete_demo_scenario");
  else steps.unshift("review_local_profit_demo_results");
  return steps;
}

function safeCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.floor(value) : 0;
}

function safeId(prefix: string, value: string): string {
  const digest = createHash("sha256").update(value, "utf8").digest("hex");
  return `${prefix}_${digest.slice(0, 20)}`;
}

function safeTimestamp(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? "1970-01-01T00:00:00.000Z" : parsed.toISOString();
}
