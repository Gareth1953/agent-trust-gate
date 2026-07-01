import { readFileSync } from "node:fs";

import {
  runLocalAgentClearingEngine,
  type LocalAgentClearingEngineInput,
} from "./local-agent-clearing-engine.js";
import type { BatchAgentClearingRequestInput } from "./batch-agent-clearing-runner.js";
import type { RefusalGraphLocalSignalInput } from "./refusalgraph-local-signal-store.js";

export type LocalAgentClearingEngineCliErrorCode =
  | "MISSING_INPUT_FILE" | "UNKNOWN_OPTION" | "UNEXPECTED_ARGUMENT"
  | "INPUT_FILE_UNREADABLE" | "INVALID_JSON" | "INVALID_INPUT"
  | "ENGINE_ERROR";

export interface LocalAgentClearingEngineCliIo {
  stdout: (value: string) => void;
  stderr: (value: string) => void;
}

export interface LocalAgentClearingEngineCliErrorResult {
  error: { code: LocalAgentClearingEngineCliErrorCode; message: string };
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
}

class EngineCliError extends Error {
  constructor(readonly code: LocalAgentClearingEngineCliErrorCode, message: string) {
    super(message);
  }
}

const defaultIo: LocalAgentClearingEngineCliIo = {
  stdout: (value) => console.log(value),
  stderr: (value) => console.error(value),
};

export function runLocalAgentClearingEngineCli(
  args: readonly string[], io: LocalAgentClearingEngineCliIo = defaultIo,
): number {
  try {
    const { path, pretty } = parseArgs(args);
    const input = readLocalAgentClearingEngineInput(path);
    io.stdout(JSON.stringify(runLocalAgentClearingEngine(input), null, pretty ? 2 : 0));
    return 0;
  } catch (error) {
    io.stderr(JSON.stringify(safeError(error), null, 2));
    return 1;
  }
}

export function readLocalAgentClearingEngineInput(path: string): LocalAgentClearingEngineInput {
  let source: string;
  try { source = readFileSync(path, "utf8"); }
  catch { throw new EngineCliError("INPUT_FILE_UNREADABLE", "The local engine input file could not be read."); }
  let value: unknown;
  try { value = JSON.parse(source) as unknown; }
  catch { throw new EngineCliError("INVALID_JSON", "The local engine input file is not valid JSON."); }
  return validateInput(value);
}

function parseArgs(args: readonly string[]): { path: string; pretty: boolean } {
  let path: string | undefined;
  let pretty = false;
  for (const arg of args) {
    if (arg === "--pretty") { pretty = true; continue; }
    if (arg.startsWith("--")) throw new EngineCliError("UNKNOWN_OPTION", "The local engine command contains an unsupported option.");
    if (path !== undefined) throw new EngineCliError("UNEXPECTED_ARGUMENT", "The local engine command accepts one input file path.");
    path = arg;
  }
  if (path === undefined || path.trim() === "") throw new EngineCliError("MISSING_INPUT_FILE", "A local JSON input file path is required.");
  return { path, pretty };
}

function validateInput(value: unknown): LocalAgentClearingEngineInput {
  const root = record(value, "The local engine input must be a JSON object.");
  const request = record(root.clearing_request, "The local engine input must contain a clearing_request object.");
  const createdAt = text(root.created_at ?? request.created_at, "created_at");
  const engineRunId = optionalText(root.engine_run_id);
  return {
    ...(engineRunId === undefined ? {} : { engine_run_id: engineRunId }),
    source_id: text(root.source_id ?? root.engine_run_id ?? request.request_id, "source_id"),
    clearing_request: validateRequest(request, createdAt),
    local_refusal_signals: validateSignals(root.local_refusal_signals),
    previous_receipts: validateRecordArray(root.previous_receipts, "previous_receipts"),
    previous_evidence_bundles: validateRecordArray(root.previous_evidence_bundles, "previous_evidence_bundles"),
    previous_replay_runs: validateRecordArray(root.previous_replay_runs, "previous_replay_runs"),
    created_at: createdAt,
  };
}

function validateRequest(value: Record<string, unknown>, fallbackCreatedAt: string): BatchAgentClearingRequestInput {
  const agentId = optionalText(value.agent_id);
  const targetAgentId = optionalText(value.target_agent_id);
  return {
    request_id: text(value.request_id, "request_id"),
    ...(agentId === undefined ? {} : { agent_id: agentId }),
    ...(targetAgentId === undefined ? {} : { target_agent_id: targetAgentId }),
    intent_category: text(value.intent_category, "intent_category"),
    action_category: text(value.action_category, "action_category"),
    requested_action: text(value.requested_action, "requested_action"),
    risk_level: text(value.risk_level, "risk_level"),
    evidence_level: text(value.evidence_level, "evidence_level"),
    approval_status: text(value.approval_status, "approval_status"),
    created_at: optionalText(value.created_at) ?? fallbackCreatedAt,
  };
}

function validateSignals(value: unknown): RefusalGraphLocalSignalInput[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw invalid("local_refusal_signals must be an array.");
  return value.map((item) => {
    const signal = record(item, "Each local refusal signal must be an object.");
    return {
      signal_type: text(signal.signal_type, "signal_type"),
      source_id: text(signal.source_id ?? signal.signal_id, "source_id"),
      related_request_id: optionalText(signal.related_request_id) ?? null,
      related_agent_id: optionalText(signal.related_agent_id) ?? null,
      intent_category: optionalText(signal.intent_category) ?? null,
      action_category: optionalText(signal.action_category) ?? null,
      refusal_reason: optionalText(signal.refusal_reason) ?? null,
      caution_level: optionalText(signal.caution_level) ?? null,
      approval_required: optionalBoolean(signal.approval_required) ?? false,
      action_allowed: optionalBoolean(signal.action_allowed) ?? false,
      action_blocked: optionalBoolean(signal.action_blocked) ?? false,
      evidence_level: optionalText(signal.evidence_level) ?? null,
      signal_status: optionalText(signal.signal_status) ?? null,
      created_at: text(signal.created_at, "created_at"),
    };
  });
}

function validateRecordArray(value: unknown, key: string): Record<string, unknown>[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw invalid(`${key} must be an array.`);
  return value.map((item) => record(item, `Each ${key} item must be an object.`));
}

function record(value: unknown, message: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw invalid(message);
  return value as Record<string, unknown>;
}
function text(value: unknown, key: string): string {
  const result = optionalText(value);
  if (result === undefined) throw invalid(`The local engine input is missing ${key}.`);
  return result;
}
function optionalText(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value.trim().slice(0, 256) : undefined;
}
function optionalBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}
function invalid(message: string): EngineCliError { return new EngineCliError("INVALID_INPUT", message); }
function safeError(error: unknown): LocalAgentClearingEngineCliErrorResult {
  const known = error instanceof EngineCliError;
  return {
    error: { code: known ? error.code : "ENGINE_ERROR", message: known ? error.message : "The local clearing engine could not complete safely." },
    private_data_included: false, network_lookup_performed: false,
    external_lookup_performed: false, tracking_triggered: false,
    analytics_triggered: false, payment_or_fee_triggered: false,
    billing_triggered: false, settlement_triggered: false,
    action_executed: false, status: "draft_only",
  };
}

if (process.argv[1]?.endsWith("local-agent-clearing-engine-cli.js")) {
  process.exitCode = runLocalAgentClearingEngineCli(process.argv.slice(2));
}
