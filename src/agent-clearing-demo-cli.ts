import { readFileSync } from "node:fs";

import {
  runAgentClearingPipelineDemo,
  type AgentClearingPipelineDemoInput,
  type AgentClearingPipelineDemoResult,
  type AgentClearingPipelineRequest,
} from "./agent-clearing-pipeline-demo.js";
import type { LocalRefusalGraphSignal } from "./refusalgraph-query-engine.js";

export const AGENT_CLEARING_DEMO_CLI_VERSION = "atg.agent-clearing-demo-cli.v1" as const;

export interface AgentClearingDemoCliErrorResult {
  error: {
    code: AgentClearingDemoCliErrorCode;
    message: string;
  };
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
}

export type AgentClearingDemoCliErrorCode =
  | "MISSING_INPUT_FILE"
  | "UNEXPECTED_ARGUMENT"
  | "UNKNOWN_OPTION"
  | "INPUT_FILE_UNREADABLE"
  | "INVALID_JSON"
  | "INVALID_INPUT"
  | "PIPELINE_DEMO_ERROR";

export interface AgentClearingDemoCliIo {
  stdout: (value: string) => void;
  stderr: (value: string) => void;
}

class AgentClearingDemoCliError extends Error {
  constructor(
    readonly code: AgentClearingDemoCliErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AgentClearingDemoCliError";
  }
}

const defaultIo: AgentClearingDemoCliIo = {
  stdout: (value) => console.log(value),
  stderr: (value) => console.error(value),
};

export function runAgentClearingDemoCli(
  args: readonly string[],
  io: AgentClearingDemoCliIo = defaultIo,
): number {
  try {
    const { inputPath, pretty } = parseArgs(args);
    const input = readAgentClearingDemoInput(inputPath);
    const result = runAgentClearingPipelineDemo(input);
    io.stdout(formatJson(result, pretty));
    return 0;
  } catch (error) {
    const safeError = toSafeError(error);
    io.stderr(formatJson(safeError, true));
    return 1;
  }
}

export function readAgentClearingDemoInput(inputPath: string): AgentClearingPipelineDemoInput {
  let source: string;
  try {
    source = readFileSync(inputPath, "utf8");
  } catch {
    throw new AgentClearingDemoCliError(
      "INPUT_FILE_UNREADABLE",
      "The local demo input file could not be read.",
    );
  }

  let value: unknown;
  try {
    value = JSON.parse(source) as unknown;
  } catch {
    throw new AgentClearingDemoCliError(
      "INVALID_JSON",
      "The local demo input file is not valid JSON.",
    );
  }

  return validateInput(value);
}

function parseArgs(args: readonly string[]): { inputPath: string; pretty: boolean } {
  let inputPath: string | undefined;
  let pretty = false;

  for (const arg of args) {
    if (arg === "--pretty") {
      pretty = true;
      continue;
    }
    if (arg.startsWith("--")) {
      throw new AgentClearingDemoCliError(
        "UNKNOWN_OPTION",
        "The local demo command contains an unsupported option.",
      );
    }
    if (inputPath !== undefined) {
      throw new AgentClearingDemoCliError(
        "UNEXPECTED_ARGUMENT",
        "The local demo command accepts one input file path.",
      );
    }
    inputPath = arg;
  }

  if (inputPath === undefined || inputPath.trim() === "") {
    throw new AgentClearingDemoCliError(
      "MISSING_INPUT_FILE",
      "A local JSON input file path is required.",
    );
  }
  return { inputPath, pretty };
}

function validateInput(value: unknown): AgentClearingPipelineDemoInput {
  const root = requireRecord(value, "The demo input must be a JSON object.");
  const requestValue = root.clearing_request;
  if (!isRecord(requestValue)) {
    throw invalidInput("The demo input must contain a clearing_request object.");
  }
  const clearingRequest = validateClearingRequest(requestValue);
  const signals = root.local_refusal_signals === undefined
    ? []
    : validateSignals(root.local_refusal_signals);
  const feeMeteringRequested = root.fee_metering_requested === undefined
    ? false
    : requireBoolean(root.fee_metering_requested, "fee_metering_requested must be boolean.");

  return {
    pipeline_id: optionalString(root.pipeline_id) ?? "local-cli-pipeline-placeholder",
    clearing_request: clearingRequest,
    local_refusal_signals: signals,
    fee_metering_requested: feeMeteringRequested,
    timestamp: optionalString(root.timestamp) ?? clearingRequest.timestamp,
  };
}

function validateClearingRequest(value: Record<string, unknown>): AgentClearingPipelineRequest {
  return {
    clearing_request_id: requiredString(value, "clearing_request_id"),
    requesting_agent_type: requiredString(value, "requesting_agent_type"),
    receiving_agent_type: requiredString(value, "receiving_agent_type"),
    requested_action_category: requiredString(value, "requested_action_category"),
    requested_action_type: requiredString(value, "requested_action_type"),
    proposed_value: nullableFiniteNumber(value.proposed_value, "proposed_value"),
    proposed_fee: nullableFiniteNumber(value.proposed_fee, "proposed_fee"),
    risk_level: requiredString(value, "risk_level"),
    impact_level: requiredString(value, "impact_level"),
    evidence_status: requiredString(value, "evidence_status"),
    approval_status: requiredString(value, "approval_status"),
    agent_identity_status: requiredString(value, "agent_identity_status"),
    payment_intent_status: requiredString(value, "payment_intent_status"),
    requested_decision: requiredString(value, "requested_decision"),
    timestamp: requiredString(value, "timestamp"),
  };
}

function validateSignals(value: unknown): LocalRefusalGraphSignal[] {
  if (!Array.isArray(value)) {
    throw invalidInput("local_refusal_signals must be an array when provided.");
  }
  return value.map((item) => {
    const signal = requireRecord(item, "Each local refusal signal must be an object.");
    const reasonCodes = signal.refusal_reason_codes;
    if (!Array.isArray(reasonCodes) || !reasonCodes.every((entry) => typeof entry === "string")) {
      throw invalidInput("Each local refusal signal must contain string refusal_reason_codes.");
    }
    return {
      signal_id: requiredString(signal, "signal_id"),
      action_category: requiredString(signal, "action_category"),
      proposed_action_type: requiredString(signal, "proposed_action_type"),
      refusal_type: requiredString(signal, "refusal_type"),
      refusal_reason_codes: reasonCodes.map((entry) => safeBoundedString(entry)),
      risk_level: requiredString(signal, "risk_level"),
      impact_level: requiredString(signal, "impact_level"),
      evidence_status: requiredString(signal, "evidence_status"),
      approval_status: requiredString(signal, "approval_status"),
      recommended_next_step: requiredString(signal, "recommended_next_step"),
      status: requiredString(signal, "status"),
    };
  });
}

function requiredString(value: Record<string, unknown>, key: string): string {
  const output = optionalString(value[key]);
  if (output === undefined) throw invalidInput(`The clearing input is missing ${key}.`);
  return output;
}

function optionalString(value: unknown): string | undefined {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  return safeBoundedString(value);
}

function safeBoundedString(value: string): string {
  return value.trim().slice(0, 256);
}

function nullableFiniteNumber(value: unknown, key: string): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw invalidInput(`${key} must be a finite number or null.`);
  }
  return value;
}

function requireBoolean(value: unknown, message: string): boolean {
  if (typeof value !== "boolean") throw invalidInput(message);
  return value;
}

function requireRecord(value: unknown, message: string): Record<string, unknown> {
  if (!isRecord(value)) throw invalidInput(message);
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function invalidInput(message: string): AgentClearingDemoCliError {
  return new AgentClearingDemoCliError("INVALID_INPUT", message);
}

function toSafeError(error: unknown): AgentClearingDemoCliErrorResult {
  const known = error instanceof AgentClearingDemoCliError;
  return {
    error: {
      code: known ? error.code : "PIPELINE_DEMO_ERROR",
      message: known
        ? error.message
        : "The local pipeline demo could not be completed safely.",
    },
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
  };
}

function formatJson(
  value: AgentClearingPipelineDemoResult | AgentClearingDemoCliErrorResult,
  pretty: boolean,
): string {
  return JSON.stringify(value, null, pretty ? 2 : undefined);
}

if (require.main === module) {
  process.exitCode = runAgentClearingDemoCli(process.argv.slice(2));
}
