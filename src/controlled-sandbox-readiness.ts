import { createHash } from "node:crypto";

import { runMachineToMachinePaidUseProfitTest } from "./machine-to-machine-paid-use-profit-test.js";
import type { BatchAgentClearingRequestInput } from "./batch-agent-clearing-runner.js";
import type { RefusalGraphLocalSignalInput } from "./refusalgraph-local-signal-store.js";

export const CONTROLLED_SANDBOX_READINESS_VERSION = "atg.controlled-sandbox-readiness.v1" as const;

export interface SandboxAgentInput {
  [key: string]: unknown;
  agent_id: string;
  agent_type: string;
  sandbox_role: string;
  access_status?: string;
  requested_goal?: string;
  local_goal_outcome?: string;
}

export interface SandboxEntitlementInput {
  [key: string]: unknown;
  entitlement_id?: string;
  entitlement_status?: string;
  sandbox_only?: boolean;
  paid_placeholder?: boolean;
  billable_if_live?: boolean;
  uses_allowed?: number;
  uses_remaining?: number;
}

export interface ControlledSandboxReadinessInput {
  [key: string]: unknown;
  sandbox_run_id?: string;
  source_id: string;
  sandbox_status?: string;
  allowed_sandbox_agents: readonly SandboxAgentInput[];
  requesting_agent: SandboxAgentInput;
  target_agent: SandboxAgentInput;
  sandbox_entitlement?: SandboxEntitlementInput | null;
  clearing_request: BatchAgentClearingRequestInput;
  local_refusal_signals?: readonly RefusalGraphLocalSignalInput[];
  repeat_use_attempts?: number;
  created_at: string;
}

export type SandboxAccessStatus =
  | "sandbox_clearing_allowed" | "agent_not_allowlisted" | "sandbox_entitlement_required";

export interface SandboxAgentAccessValidation {
  sandbox_access_status: SandboxAccessStatus;
  requesting_agent_allowlisted: boolean;
  sandbox_entitlement_present: boolean;
}

export interface ControlledSandboxRunResult {
  sandbox_run_id: string;
  sandbox_type: "controlled_local_sandbox";
  source_id: string;
  sandbox_access_status: SandboxAccessStatus;
  requesting_agent_id: string;
  target_agent_id: string;
  requesting_agent_allowlisted: boolean;
  sandbox_entitlement_present: boolean;
  sandbox_only: true;
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
  clearing_receipt_id: string | null;
  verification_result: string | null;
  evidence_bundle_id: string | null;
  replay_status: string | null;
  integrity_score: number | null;
  fee_placeholder_count: number;
  hypothetical_revenue_event_count: number;
  sandbox_summary: string;
  final_sandbox_recommendation: string;
  recommended_next_steps: string[];
  private_data_included: false;
  network_lookup_performed: false;
  external_lookup_performed: false;
  public_api_enabled: false;
  tracking_triggered: false;
  analytics_triggered: false;
  payment_or_fee_triggered: false;
  billing_triggered: false;
  settlement_triggered: false;
  machine_to_machine_fee_triggered: false;
  action_executed: false;
  deployed: false;
  published: false;
  status: "sandbox_only";
  created_at: string;
}

export type ControlledSandboxRunSummary = Omit<ControlledSandboxRunResult,
  "recommended_next_steps" | "created_at">;

export function validateSandboxAgentAccess(
  input: ControlledSandboxReadinessInput,
): SandboxAgentAccessValidation {
  const allowlisted = Array.isArray(input.allowed_sandbox_agents)
    && input.allowed_sandbox_agents.some((agent) => agent.agent_id === input.requesting_agent.agent_id
      && agent.access_status !== "denied");
  const entitlement = input.sandbox_entitlement;
  const entitled = entitlement !== undefined && entitlement !== null
    && entitlement.sandbox_only === true
    && entitlement.paid_placeholder === true
    && (entitlement.entitlement_status === "active_placeholder"
      || entitlement.entitlement_status === "usable_local")
    && safeCount(entitlement.uses_remaining ?? entitlement.uses_allowed) > 0;
  return {
    sandbox_access_status: !allowlisted ? "agent_not_allowlisted"
      : !entitled ? "sandbox_entitlement_required" : "sandbox_clearing_allowed",
    requesting_agent_allowlisted: allowlisted,
    sandbox_entitlement_present: entitled,
  };
}

export function runControlledSandboxReadiness(
  input: ControlledSandboxReadinessInput,
): ControlledSandboxRunResult {
  const access = validateSandboxAgentAccess(input);
  const createdAt = safeTimestamp(input.created_at);
  const common = {
    sandbox_run_id: createControlledSandboxRunId(input.sandbox_run_id ?? input.source_id),
    sandbox_type: "controlled_local_sandbox" as const,
    source_id: safeId("source", input.source_id),
    sandbox_access_status: access.sandbox_access_status,
    requesting_agent_id: safeId("sandbox_agent", input.requesting_agent.agent_id),
    target_agent_id: safeId("target_agent", input.target_agent.agent_id),
    requesting_agent_allowlisted: access.requesting_agent_allowlisted,
    sandbox_entitlement_present: access.sandbox_entitlement_present,
    sandbox_only: true as const,
    private_data_included: false as const,
    network_lookup_performed: false as const,
    external_lookup_performed: false as const,
    public_api_enabled: false as const,
    tracking_triggered: false as const,
    analytics_triggered: false as const,
    payment_or_fee_triggered: false as const,
    billing_triggered: false as const,
    settlement_triggered: false as const,
    machine_to_machine_fee_triggered: false as const,
    action_executed: false as const,
    deployed: false as const,
    published: false as const,
    status: "sandbox_only" as const,
    created_at: createdAt,
  };
  if (access.sandbox_access_status !== "sandbox_clearing_allowed") {
    return deniedResult(common, input.sandbox_entitlement);
  }
  const entitlement = input.sandbox_entitlement!;
  const profit = runMachineToMachinePaidUseProfitTest({
    profit_test_id: common.sandbox_run_id,
    source_id: input.source_id,
    buyer_agent: {
      agent_id: input.requesting_agent.agent_id,
      agent_type: input.requesting_agent.agent_type,
      agent_role: input.requesting_agent.sandbox_role,
      requested_goal: safeText(input.requesting_agent.requested_goal, "sandbox_clearing_request"),
    },
    clearing_service_agent: {
      agent_id: "local-controlled-sandbox-clearing-service",
      agent_type: "sandbox_clearing_service",
      service_name: "Agent Trust Gate controlled sandbox",
      requires_paid_entitlement: true,
    },
    target_service_agent: {
      agent_id: input.target_agent.agent_id,
      agent_type: input.target_agent.agent_type,
      service_name: "local sandbox target",
      local_goal_outcome: safeText(input.target_agent.local_goal_outcome, "sandbox_result_only"),
    },
    paid_use_entitlement: {
      source_id: input.source_id,
      entitlement_id: entitlement.entitlement_id ?? input.source_id,
      entitlement_status: "active_placeholder",
      paid_placeholder: true,
      billable_if_live: entitlement.billable_if_live === true,
      uses_allowed: safeCount(entitlement.uses_allowed),
      uses_remaining: safeCount(entitlement.uses_remaining ?? entitlement.uses_allowed),
      payment_enabled: false, billing_enabled: false, settlement_enabled: false,
      machine_to_machine_fee_enabled: false,
    },
    clearing_request: input.clearing_request,
    local_refusal_signals: Array.isArray(input.local_refusal_signals)
      ? input.local_refusal_signals : [],
    repeat_use_attempts: safeCount(input.repeat_use_attempts),
    created_at: createdAt,
  });
  return {
    ...common,
    paid_placeholder: true,
    billable_if_live: profit.billable_if_live,
    uses_allowed: profit.uses_allowed,
    uses_consumed: profit.uses_consumed,
    uses_remaining: profit.uses_remaining,
    engine_run_id: profit.engine_run_id,
    decision: profit.decision,
    caution_level: profit.caution_level,
    approval_required: profit.approval_required,
    action_allowed: profit.action_allowed,
    action_blocked: profit.action_blocked,
    clearing_receipt_id: profit.clearing_receipt_id,
    verification_result: profit.verification_result,
    evidence_bundle_id: profit.evidence_bundle_id,
    replay_status: profit.replay_status,
    integrity_score: profit.integrity_score,
    fee_placeholder_count: profit.fee_placeholder_count,
    hypothetical_revenue_event_count: profit.hypothetical_revenue_event_count,
    sandbox_summary: "Allowlisted sandbox agent used a local entitlement placeholder and received a local clearing result.",
    final_sandbox_recommendation: profit.approval_required
      ? "Keep the action unexecuted until Gareth or human approval."
      : profit.action_blocked ? "Keep the sandbox request blocked."
        : "Locally cleared in sandbox mode only; do not execute the action.",
    recommended_next_steps: [...profit.recommended_next_steps, "keep_sandbox_offline"],
  };
}

export function createControlledSandboxRunId(sourceId: string): string {
  const digest = createHash("sha256").update(sourceId, "utf8").digest("hex");
  return "controlled_sandbox_" + digest.slice(0, 24);
}

export function summariseControlledSandboxRun(
  result: ControlledSandboxRunResult,
): ControlledSandboxRunSummary {
  const { recommended_next_steps: _steps, created_at: _createdAt, ...summary } = result;
  return summary;
}

type Common = Pick<ControlledSandboxRunResult,
  "sandbox_run_id" | "sandbox_type" | "source_id" | "sandbox_access_status" |
  "requesting_agent_id" | "target_agent_id" | "requesting_agent_allowlisted" |
  "sandbox_entitlement_present" | "sandbox_only" | "private_data_included" |
  "network_lookup_performed" | "external_lookup_performed" | "public_api_enabled" |
  "tracking_triggered" | "analytics_triggered" | "payment_or_fee_triggered" |
  "billing_triggered" | "settlement_triggered" | "machine_to_machine_fee_triggered" |
  "action_executed" | "deployed" | "published" | "status" | "created_at">;

function deniedResult(common: Common, entitlement: SandboxEntitlementInput | null | undefined): ControlledSandboxRunResult {
  const notAllowed = common.sandbox_access_status === "agent_not_allowlisted";
  return {
    ...common,
    paid_placeholder: false,
    billable_if_live: true,
    uses_allowed: safeCount(entitlement?.uses_allowed), uses_consumed: 0, uses_remaining: 0,
    engine_run_id: null, decision: null, caution_level: null, approval_required: false,
    action_allowed: false, action_blocked: true, clearing_receipt_id: null,
    verification_result: null, evidence_bundle_id: null, replay_status: null,
    integrity_score: null, fee_placeholder_count: 0, hypothetical_revenue_event_count: 0,
    sandbox_summary: notAllowed
      ? "Requesting sandbox agent was not allowlisted; the clearing engine did not run."
      : "Sandbox entitlement placeholder was missing or unusable; the clearing engine did not run.",
    final_sandbox_recommendation: "Keep access denied and do not execute the requested action.",
    recommended_next_steps: [notAllowed ? "add_agent_only_after_local_review"
      : "provide_usable_sandbox_entitlement", "keep_sandbox_offline"],
  };
}

function safeCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}
function safeText(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() !== "" ? value.trim().slice(0, 160) : fallback;
}
function safeId(prefix: string, value: string): string {
  return `${prefix}_${createHash("sha256").update(value, "utf8").digest("hex").slice(0, 20)}`;
}
function safeTimestamp(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "1970-01-01T00:00:00.000Z" : date.toISOString();
}
