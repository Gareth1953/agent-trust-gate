import { readFileSync } from "node:fs";

import {
  runProfitDemoScenarioRunner,
  type ProfitDemoScenarioInput,
  type ProfitDemoScenarioRunnerInput,
} from "./profit-demo-scenario-runner.js";

export type ProfitDemoScenarioRunnerCliErrorCode =
  | "MISSING_INPUT_FILE" | "UNKNOWN_OPTION" | "UNEXPECTED_ARGUMENT"
  | "INPUT_FILE_UNREADABLE" | "INVALID_JSON" | "INVALID_INPUT" | "DEMO_ERROR";

export interface ProfitDemoScenarioRunnerCliIo {
  stdout: (value: string) => void;
  stderr: (value: string) => void;
}

class DemoCliError extends Error {
  constructor(readonly code: ProfitDemoScenarioRunnerCliErrorCode, message: string) {
    super(message);
  }
}

const defaultIo: ProfitDemoScenarioRunnerCliIo = {
  stdout: (value) => console.log(value), stderr: (value) => console.error(value),
};

export function runProfitDemoScenarioRunnerCli(
  args: readonly string[], io: ProfitDemoScenarioRunnerCliIo = defaultIo,
): number {
  try {
    const { path, pretty } = parseArgs(args);
    const input = readProfitDemoScenarioRunnerInput(path);
    io.stdout(JSON.stringify(runProfitDemoScenarioRunner(input), null, pretty ? 2 : 0));
    return 0;
  } catch (error) {
    io.stderr(JSON.stringify(safeError(error), null, 2));
    return 1;
  }
}

export function readProfitDemoScenarioRunnerInput(path: string): ProfitDemoScenarioRunnerInput {
  let source: string;
  try { source = readFileSync(path, "utf8"); }
  catch { throw new DemoCliError("INPUT_FILE_UNREADABLE", "The local profit demo input file could not be read."); }
  let value: unknown;
  try { value = JSON.parse(source) as unknown; }
  catch { throw new DemoCliError("INVALID_JSON", "The local profit demo input file is not valid JSON."); }
  return validateInput(value);
}

function parseArgs(args: readonly string[]): { path: string; pretty: boolean } {
  let path: string | undefined;
  let pretty = false;
  for (const arg of args) {
    if (arg === "--pretty") { pretty = true; continue; }
    if (arg.startsWith("--")) throw new DemoCliError("UNKNOWN_OPTION", "The local profit demo command contains an unsupported option.");
    if (path !== undefined) throw new DemoCliError("UNEXPECTED_ARGUMENT", "The local profit demo command accepts one input file path.");
    path = arg;
  }
  if (path === undefined || path.trim() === "") throw new DemoCliError("MISSING_INPUT_FILE", "A local JSON input file path is required.");
  return { path, pretty };
}

function validateInput(value: unknown): ProfitDemoScenarioRunnerInput {
  const root = record(value, "The profit demo input must be a JSON object.");
  if (!Array.isArray(root.scenarios)) throw invalid("The profit demo input must contain a scenarios array.");
  if (root.scenarios.length === 0) throw invalid("The profit demo scenarios array must not be empty.");
  const scenarios = root.scenarios.map(validateScenario);
  const demoId = optionalText(root.demo_id);
  return {
    ...(demoId === undefined ? {} : { demo_id: demoId }),
    source_id: requiredText(root.source_id ?? demoId, "source_id"),
    scenarios,
    created_at: requiredText(root.created_at, "created_at"),
  };
}

function validateScenario(value: unknown): ProfitDemoScenarioInput {
  const scenario = record(value, "Each profit demo scenario must be an object.");
  for (const key of ["buyer_agent", "clearing_service_agent", "target_service_agent",
    "clearing_request"] as const) record(scenario[key], `Each scenario must contain ${key}.`);
  if (scenario.local_refusal_signals !== undefined && !Array.isArray(scenario.local_refusal_signals)) {
    throw invalid("Scenario local_refusal_signals must be an array.");
  }
  const entitlement = scenario.paid_use_entitlement;
  return {
    scenario_id: requiredText(scenario.scenario_id, "scenario_id"),
    scenario_type: requiredText(scenario.scenario_type, "scenario_type"),
    buyer_agent: scenario.buyer_agent as ProfitDemoScenarioInput["buyer_agent"],
    clearing_service_agent: scenario.clearing_service_agent as ProfitDemoScenarioInput["clearing_service_agent"],
    target_service_agent: scenario.target_service_agent as ProfitDemoScenarioInput["target_service_agent"],
    ...(entitlement === undefined ? {}
      : { paid_use_entitlement: entitlement as NonNullable<ProfitDemoScenarioInput["paid_use_entitlement"]> | null }),
    clearing_request: scenario.clearing_request as ProfitDemoScenarioInput["clearing_request"],
    local_refusal_signals: (scenario.local_refusal_signals ?? []) as NonNullable<ProfitDemoScenarioInput["local_refusal_signals"]>,
    repeat_use_attempts: safeCount(scenario.repeat_use_attempts),
  };
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
  if (result === undefined) throw invalid(`The profit demo input is missing ${key}.`);
  return result;
}
function safeCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}
function invalid(message: string): DemoCliError { return new DemoCliError("INVALID_INPUT", message); }
function safeError(error: unknown) {
  const known = error instanceof DemoCliError;
  return {
    error: { code: known ? error.code : "DEMO_ERROR",
      message: known ? error.message : "The local profit demo could not complete safely." },
    private_data_included: false, network_lookup_performed: false,
    external_lookup_performed: false, tracking_triggered: false,
    analytics_triggered: false, payment_or_fee_triggered: false,
    billing_triggered: false, settlement_triggered: false,
    machine_to_machine_fee_triggered: false, action_executed: false,
    published: false, status: "draft_only",
  };
}

if (process.argv[1]?.endsWith("profit-demo-scenario-runner-cli.js")) {
  process.exitCode = runProfitDemoScenarioRunnerCli(process.argv.slice(2));
}
