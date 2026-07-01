import { readFileSync } from "node:fs";
import { runControlledSandboxReadiness, type ControlledSandboxReadinessInput } from "./controlled-sandbox-readiness.js";

export type ControlledSandboxCliErrorCode = "MISSING_INPUT_FILE" | "UNKNOWN_OPTION" |
  "UNEXPECTED_ARGUMENT" | "INPUT_FILE_UNREADABLE" | "INVALID_JSON" | "INVALID_INPUT" | "SANDBOX_ERROR";
export interface ControlledSandboxCliIo { stdout: (value: string) => void; stderr: (value: string) => void }
class SandboxCliError extends Error { constructor(readonly code: ControlledSandboxCliErrorCode, message: string) { super(message); } }
const defaultIo: ControlledSandboxCliIo = { stdout: console.log, stderr: console.error };

export function runControlledSandboxReadinessCli(args: readonly string[], io: ControlledSandboxCliIo = defaultIo): number {
  try {
    const { path, pretty } = parseArgs(args);
    io.stdout(JSON.stringify(runControlledSandboxReadiness(readControlledSandboxReadinessInput(path)), null, pretty ? 2 : 0));
    return 0;
  } catch (error) {
    io.stderr(JSON.stringify(safeError(error), null, 2));
    return 1;
  }
}

export function readControlledSandboxReadinessInput(path: string): ControlledSandboxReadinessInput {
  let source: string;
  try { source = readFileSync(path, "utf8"); }
  catch { throw new SandboxCliError("INPUT_FILE_UNREADABLE", "The local sandbox input file could not be read."); }
  let value: unknown;
  try { value = JSON.parse(source) as unknown; }
  catch { throw new SandboxCliError("INVALID_JSON", "The local sandbox input file is not valid JSON."); }
  const root = record(value, "The sandbox input must be a JSON object.");
  if (!Array.isArray(root.allowed_sandbox_agents)) throw invalid("The sandbox input must contain allowed_sandbox_agents.");
  record(root.requesting_agent, "The sandbox input must contain requesting_agent.");
  record(root.target_agent, "The sandbox input must contain target_agent.");
  record(root.clearing_request, "The sandbox input must contain clearing_request.");
  if (root.local_refusal_signals !== undefined && !Array.isArray(root.local_refusal_signals)) throw invalid("local_refusal_signals must be an array.");
  return root as unknown as ControlledSandboxReadinessInput;
}

function parseArgs(args: readonly string[]): { path: string; pretty: boolean } {
  let path: string | undefined; let pretty = false;
  for (const arg of args) {
    if (arg === "--pretty") { pretty = true; continue; }
    if (arg.startsWith("--")) throw new SandboxCliError("UNKNOWN_OPTION", "Unsupported local sandbox option.");
    if (path !== undefined) throw new SandboxCliError("UNEXPECTED_ARGUMENT", "The sandbox command accepts one input file.");
    path = arg;
  }
  if (!path) throw new SandboxCliError("MISSING_INPUT_FILE", "A local JSON input file path is required.");
  return { path, pretty };
}
function record(value: unknown, message: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw invalid(message);
  return value as Record<string, unknown>;
}
function invalid(message: string) { return new SandboxCliError("INVALID_INPUT", message); }
function safeError(error: unknown) {
  const known = error instanceof SandboxCliError;
  return { error: { code: known ? error.code : "SANDBOX_ERROR", message: known ? error.message : "The sandbox run could not complete safely." },
    private_data_included: false, network_lookup_performed: false, external_lookup_performed: false,
    public_api_enabled: false, tracking_triggered: false, analytics_triggered: false,
    payment_or_fee_triggered: false, billing_triggered: false, settlement_triggered: false,
    machine_to_machine_fee_triggered: false, action_executed: false, deployed: false,
    published: false, status: "sandbox_only" };
}
if (process.argv[1]?.endsWith("controlled-sandbox-readiness-cli.js")) {
  process.exitCode = runControlledSandboxReadinessCli(process.argv.slice(2));
}
