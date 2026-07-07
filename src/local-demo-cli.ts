import { readFileSync, writeFileSync } from "node:fs";

import type { LocalGatePassDemoInput } from "./local-gate-pass-demo.js";
import {
  createLocalGatePassAuditReceipt,
  summariseLocalGatePassAudit,
  type LocalGatePassAuditReceipt,
  type LocalGatePassAuditSummary,
} from "./local-gate-pass-receipt.js";

export type LocalDemoCliErrorCode =
  | "MISSING_INPUT_FILE"
  | "INPUT_FILE_UNREADABLE"
  | "INVALID_JSON"
  | "INVALID_INPUT"
  | "UNKNOWN_OPTION"
  | "MISSING_OPTION_VALUE"
  | "CONFLICTING_OUTPUT_MODE"
  | "RECEIPT_WRITE_FAILED"
  | "LOCAL_DEMO_ERROR";

export interface LocalDemoCliIo {
  stdout: (value: string) => void;
  stderr: (value: string) => void;
}

interface LocalDemoCliOptions {
  inputPath: string;
  full: boolean;
  savePath?: string;
}

class LocalDemoCliError extends Error {
  constructor(readonly code: LocalDemoCliErrorCode, message: string) {
    super(message);
    this.name = "LocalDemoCliError";
  }
}

const defaultIo: LocalDemoCliIo = {
  stdout: (value) => console.log(value),
  stderr: (value) => console.error(value),
};

export function runLocalDemoCli(
  args: readonly string[],
  io: LocalDemoCliIo = defaultIo,
): number {
  try {
    const options = parseArgs(args);
    const input = readLocalDemoInput(options.inputPath);
    const receipt = createLocalGatePassAuditReceipt(input);
    const summary = summariseLocalGatePassAudit(receipt);

    if (options.savePath !== undefined) saveReceipt(options.savePath, receipt);
    io.stdout(options.full ? JSON.stringify(receipt, null, 2) : formatLocalDemoAuditSummary(summary));
    return 0;
  } catch (error) {
    const known = error instanceof LocalDemoCliError;
    io.stderr([
      "Agent Trust Gate Local Demo Error",
      `Code: ${known ? error.code : "LOCAL_DEMO_ERROR"}`,
      known ? error.message : "The local demo could not be completed safely.",
      "No action, payment, settlement, network call, or external contact occurred.",
    ].join("\n"));
    return 1;
  }
}

export function readLocalDemoInput(inputPath: string): LocalGatePassDemoInput {
  let source: string;
  try {
    source = readFileSync(inputPath, "utf8");
  } catch {
    throw cliError("INPUT_FILE_UNREADABLE", "The local input file could not be read.");
  }

  let value: unknown;
  try {
    value = JSON.parse(source) as unknown;
  } catch {
    throw cliError("INVALID_JSON", "The local input file is not valid JSON.");
  }
  return validateInput(value);
}

export function formatLocalDemoAuditSummary(summary: LocalGatePassAuditSummary): string {
  return [
    "Agent Trust Gate Local Demo",
    `Request: ${summary.request_id}`,
    `Verdict: ${summary.verdict}`,
    `Receipt: ${summary.receipt_type}`,
    `Risk tier: ${summary.risk_tier}`,
    `Applied policy: ${summary.applied_policy}`,
    `Human review required: ${summary.human_review_required}`,
    `Fast path allowed: ${summary.fast_path_allowed}`,
    `Settlement allowed: ${summary.settlement_allowed}`,
    `Failed checks: ${summary.failed_checks.length === 0 ? "none" : summary.failed_checks.join(", ")}`,
    `Reason codes: ${summary.reason_codes.length === 0 ? "none" : summary.reason_codes.join(", ")}`,
    "Local proof only; no action or settlement was executed.",
  ].join("\n");
}

function saveReceipt(path: string, receipt: LocalGatePassAuditReceipt): void {
  try {
    writeFileSync(path, `${JSON.stringify(receipt, null, 2)}\n`, { encoding: "utf8", flag: "w" });
  } catch {
    throw cliError("RECEIPT_WRITE_FAILED", "The local receipt output file could not be written.");
  }
}

function parseArgs(args: readonly string[]): LocalDemoCliOptions {
  let inputPath: string | undefined;
  let savePath: string | undefined;
  let full = false;
  let summaryOnly = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--input" || arg === "--save") {
      const value = args[index + 1];
      if (value === undefined || value.startsWith("--")) {
        throw cliError("MISSING_OPTION_VALUE", `${arg} requires a local file path.`);
      }
      if (arg === "--input") inputPath = value;
      else savePath = value;
      index += 1;
    } else if (arg === "--full") {
      full = true;
    } else if (arg === "--summary-only") {
      summaryOnly = true;
    } else {
      throw cliError("UNKNOWN_OPTION", "The local demo command contains an unsupported option.");
    }
  }

  if (full && summaryOnly) {
    throw cliError("CONFLICTING_OUTPUT_MODE", "Choose either --full or --summary-only.");
  }
  if (inputPath === undefined || inputPath.trim() === "") {
    throw cliError("MISSING_INPUT_FILE", "Use --input with a local example JSON file.");
  }
  const options: LocalDemoCliOptions = { inputPath, full };
  if (savePath !== undefined) options.savePath = savePath;
  return options;
}

function validateInput(value: unknown): LocalGatePassDemoInput {
  if (!isRecord(value)) throw cliError("INVALID_INPUT", "The local demo input must be an object.");
  try {
    return {
      request_id: requiredString(value, "request_id"),
      agent_id: requiredString(value, "agent_id"),
      requested_action: requiredString(value, "requested_action"),
      action_category: requiredString(value, "action_category"),
      mandate: validateMandate(value.mandate),
      verified_intent: validatePresenceSource(value.verified_intent),
      evidence: validateEvidence(value.evidence),
      limits: validateLimits(value.limits),
      approval: validateApproval(value.approval),
      checked_at: requiredString(value, "checked_at"),
    };
  } catch (error) {
    if (error instanceof LocalDemoCliError) throw error;
    throw cliError("INVALID_INPUT", "The local demo input has an unsupported shape.");
  }
}

function validateMandate(value: unknown): NonNullable<LocalGatePassDemoInput["mandate"]> {
  const item = requiredRecord(value);
  return { present: requiredBoolean(item, "present"), scope: requiredString(item, "scope"), expires_at: requiredString(item, "expires_at") };
}

function validatePresenceSource(value: unknown): NonNullable<LocalGatePassDemoInput["verified_intent"]> {
  const item = requiredRecord(value);
  return { present: requiredBoolean(item, "present"), source: requiredString(item, "source") };
}

function validateEvidence(value: unknown): NonNullable<LocalGatePassDemoInput["evidence"]> {
  const item = requiredRecord(value);
  return { present: requiredBoolean(item, "present"), fresh: requiredBoolean(item, "fresh"), source: requiredString(item, "source") };
}

function validateLimits(value: unknown): NonNullable<LocalGatePassDemoInput["limits"]> {
  const item = requiredRecord(value);
  return { spend_amount_gbp: requiredAmount(item, "spend_amount_gbp"), max_allowed_gbp: requiredAmount(item, "max_allowed_gbp") };
}

function validateApproval(value: unknown): NonNullable<LocalGatePassDemoInput["approval"]> {
  const item = requiredRecord(value);
  const status = requiredString(item, "status");
  if (!["not_required", "pending", "approved", "rejected", "unknown"].includes(status)) throw new Error("status");
  return {
    required: requiredBoolean(item, "required"),
    status: status as "not_required" | "pending" | "approved" | "rejected" | "unknown",
  };
}

function requiredRecord(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) throw new Error("object");
  return value;
}

function requiredString(value: Record<string, unknown>, key: string): string {
  const item = value[key];
  if (typeof item !== "string" || item.trim() === "") throw new Error(key);
  return item.trim().slice(0, 256);
}

function requiredBoolean(value: Record<string, unknown>, key: string): boolean {
  if (typeof value[key] !== "boolean") throw new Error(key);
  return value[key];
}

function requiredAmount(value: Record<string, unknown>, key: string): number {
  const item = value[key];
  if (typeof item !== "number" || !Number.isFinite(item) || item < 0) throw new Error(key);
  return item;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cliError(code: LocalDemoCliErrorCode, message: string): LocalDemoCliError {
  return new LocalDemoCliError(code, message);
}

if (require.main === module) {
  process.exitCode = runLocalDemoCli(process.argv.slice(2));
}
