import { readFileSync } from "node:fs";

import {
  runMachineToMachinePaidUseProfitTest,
  type LocalProfitTestAgentInput,
  type MachineToMachinePaidUseProfitTestInput,
} from "./machine-to-machine-paid-use-profit-test.js";
import type { BatchAgentClearingRequestInput } from "./batch-agent-clearing-runner.js";
import type { RefusalGraphLocalSignalInput } from "./refusalgraph-local-signal-store.js";

export type MachineToMachineProfitTestCliErrorCode =
  | "MISSING_INPUT_FILE" | "UNKNOWN_OPTION" | "UNEXPECTED_ARGUMENT"
  | "INPUT_FILE_UNREADABLE" | "INVALID_JSON" | "INVALID_INPUT" | "PROFIT_TEST_ERROR";

export interface MachineToMachineProfitTestCliIo {
  stdout: (value: string) => void;
  stderr: (value: string) => void;
}

class ProfitCliError extends Error {
  constructor(readonly code: MachineToMachineProfitTestCliErrorCode, message: string) {
    super(message);
  }
}

const defaultIo: MachineToMachineProfitTestCliIo = {
  stdout: (value) => console.log(value), stderr: (value) => console.error(value),
};

export function runMachineToMachinePaidUseProfitTestCli(
  args: readonly string[], io: MachineToMachineProfitTestCliIo = defaultIo,
): number {
  try {
    const { path, pretty } = parseArgs(args);
    const input = readMachineToMachinePaidUseProfitTestInput(path);
    io.stdout(JSON.stringify(runMachineToMachinePaidUseProfitTest(input), null, pretty ? 2 : 0));
    return 0;
  } catch (error) {
    io.stderr(JSON.stringify(safeError(error), null, 2));
    return 1;
  }
}

export function readMachineToMachinePaidUseProfitTestInput(
  path: string,
): MachineToMachinePaidUseProfitTestInput {
  let source: string;
  try { source = readFileSync(path, "utf8"); }
  catch { throw new ProfitCliError("INPUT_FILE_UNREADABLE", "The local profit test input file could not be read."); }
  let value: unknown;
  try { value = JSON.parse(source) as unknown; }
  catch { throw new ProfitCliError("INVALID_JSON", "The local profit test input file is not valid JSON."); }
  return validateInput(value);
}

function parseArgs(args: readonly string[]): { path: string; pretty: boolean } {
  let path: string | undefined;
  let pretty = false;
  for (const arg of args) {
    if (arg === "--pretty") { pretty = true; continue; }
    if (arg.startsWith("--")) throw new ProfitCliError("UNKNOWN_OPTION", "The local profit test command contains an unsupported option.");
    if (path !== undefined) throw new ProfitCliError("UNEXPECTED_ARGUMENT", "The local profit test command accepts one input file path.");
    path = arg;
  }
  if (path === undefined || path.trim() === "") throw new ProfitCliError("MISSING_INPUT_FILE", "A local JSON input file path is required.");
  return { path, pretty };
}

function validateInput(value: unknown): MachineToMachinePaidUseProfitTestInput {
  const root = record(value, "The profit test input must be a JSON object.");
  const buyer = validateAgent(root.buyer_agent, "buyer_agent");
  const clearing = validateAgent(root.clearing_service_agent, "clearing_service_agent");
  const target = validateAgent(root.target_service_agent, "target_service_agent");
  const requestRecord = record(root.clearing_request,
    "The profit test input must contain a clearing_request object.");
  const createdAt = requiredText(root.created_at ?? requestRecord.created_at, "created_at");
  const profitTestId = optionalText(root.profit_test_id);
  const entitlement = root.paid_use_entitlement === undefined || root.paid_use_entitlement === null
    ? null : validateEntitlement(root.paid_use_entitlement);
  return {
    ...(profitTestId === undefined ? {} : { profit_test_id: profitTestId }),
    source_id: requiredText(root.source_id ?? profitTestId ?? requestRecord.request_id, "source_id"),
    buyer_agent: buyer,
    clearing_service_agent: clearing,
    target_service_agent: target,
    paid_use_entitlement: entitlement,
    clearing_request: validateRequest(requestRecord, createdAt),
    local_refusal_signals: validateSignals(root.local_refusal_signals),
    repeat_use_attempts: nonNegativeInteger(root.repeat_use_attempts),
    created_at: createdAt,
  };
}

function validateAgent(value: unknown, key: string): LocalProfitTestAgentInput {
  const item = record(value, `The profit test input must contain a ${key} object.`);
  const role = optionalText(item.agent_role);
  const service = optionalText(item.service_name);
  const goal = optionalText(item.requested_goal);
  const outcome = optionalText(item.local_goal_outcome);
  return {
    agent_id: requiredText(item.agent_id, `${key}.agent_id`),
    agent_type: requiredText(item.agent_type, `${key}.agent_type`),
    ...(role === undefined ? {} : { agent_role: role }),
    ...(service === undefined ? {} : { service_name: service }),
    ...(goal === undefined ? {} : { requested_goal: goal }),
    ...(outcome === undefined ? {} : { local_goal_outcome: outcome }),
    ...(typeof item.requires_paid_entitlement === "boolean"
      ? { requires_paid_entitlement: item.requires_paid_entitlement } : {}),
  };
}

function validateEntitlement(value: unknown) {
  const item = record(value, "paid_use_entitlement must be an object when provided.");
  const entitlementId = optionalText(item.entitlement_id);
  const entitlementType = optionalText(item.entitlement_type);
  const entitlementStatus = optionalText(item.entitlement_status);
  return {
    source_id: requiredText(item.source_id ?? item.entitlement_id ?? "local-entitlement", "entitlement source_id"),
    ...(entitlementId === undefined ? {} : { entitlement_id: entitlementId }),
    ...(entitlementType === undefined ? {} : { entitlement_type: entitlementType }),
    ...(entitlementStatus === undefined ? {} : { entitlement_status: entitlementStatus }),
    paid_placeholder: item.paid_placeholder === true,
    billable_if_live: item.billable_if_live === true,
    uses_allowed: nonNegativeInteger(item.uses_allowed),
    uses_remaining: nonNegativeInteger(item.uses_remaining),
    payment_enabled: false,
    billing_enabled: false,
    settlement_enabled: false,
    machine_to_machine_fee_enabled: false,
  };
}

function validateRequest(value: Record<string, unknown>, createdAt: string): BatchAgentClearingRequestInput {
  const agentId = optionalText(value.agent_id);
  const targetAgentId = optionalText(value.target_agent_id);
  return {
    request_id: requiredText(value.request_id, "request_id"),
    ...(agentId === undefined ? {} : { agent_id: agentId }),
    ...(targetAgentId === undefined ? {} : { target_agent_id: targetAgentId }),
    intent_category: requiredText(value.intent_category, "intent_category"),
    action_category: requiredText(value.action_category, "action_category"),
    requested_action: requiredText(value.requested_action, "requested_action"),
    risk_level: requiredText(value.risk_level, "risk_level"),
    evidence_level: requiredText(value.evidence_level, "evidence_level"),
    approval_status: requiredText(value.approval_status, "approval_status"),
    created_at: optionalText(value.created_at) ?? createdAt,
  };
}

function validateSignals(value: unknown): RefusalGraphLocalSignalInput[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw invalid("local_refusal_signals must be an array.");
  return value.map((entry) => {
    const item = record(entry, "Each local refusal signal must be an object.");
    return {
      signal_type: requiredText(item.signal_type, "signal_type"),
      source_id: requiredText(item.source_id ?? item.signal_id, "signal source_id"),
      intent_category: optionalText(item.intent_category) ?? null,
      action_category: optionalText(item.action_category) ?? null,
      refusal_reason: optionalText(item.refusal_reason) ?? null,
      caution_level: optionalText(item.caution_level) ?? null,
      approval_required: item.approval_required === true,
      action_allowed: item.action_allowed === true,
      action_blocked: item.action_blocked === true,
      evidence_level: optionalText(item.evidence_level) ?? null,
      signal_status: optionalText(item.signal_status) ?? null,
      created_at: requiredText(item.created_at, "signal created_at"),
    };
  });
}

function record(value: unknown, message: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw invalid(message);
  return value as Record<string, unknown>;
}
function optionalText(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value.trim().slice(0, 256) : undefined;
}
function requiredText(value: unknown, key: string): string {
  const result = optionalText(value);
  if (result === undefined) throw invalid(`The profit test input is missing ${key}.`);
  return result;
}
function nonNegativeInteger(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}
function invalid(message: string): ProfitCliError { return new ProfitCliError("INVALID_INPUT", message); }
function safeError(error: unknown) {
  const known = error instanceof ProfitCliError;
  return {
    error: { code: known ? error.code : "PROFIT_TEST_ERROR",
      message: known ? error.message : "The local profit test could not complete safely." },
    private_data_included: false, network_lookup_performed: false,
    external_lookup_performed: false, tracking_triggered: false,
    analytics_triggered: false, payment_or_fee_triggered: false,
    billing_triggered: false, settlement_triggered: false,
    machine_to_machine_fee_triggered: false, action_executed: false,
    published: false, status: "draft_only",
  };
}

if (process.argv[1]?.endsWith("machine-to-machine-paid-use-profit-test-cli.js")) {
  process.exitCode = runMachineToMachinePaidUseProfitTestCli(process.argv.slice(2));
}
