import { readFileSync } from "node:fs";

import {
  runLocalEndToEndMoneyGateProof,
  summariseLocalEndToEndMoneyGateProof,
  type LocalEndToEndMoneyGateProofInput,
} from "./local-end-to-end-money-gate-proof.js";

export type LocalMoneyGateProofCliErrorCode =
  | "MISSING_INPUT_FILE"
  | "INPUT_FILE_UNREADABLE"
  | "INVALID_JSON"
  | "INVALID_INPUT"
  | "PRIVATE_OR_LIVE_DATA_REJECTED"
  | "UNKNOWN_OPTION"
  | "UNEXPECTED_ARGUMENT"
  | "MONEY_GATE_PROOF_ERROR";

export interface LocalMoneyGateProofCliIo {
  stdout: (value: string) => void;
  stderr: (value: string) => void;
}

class LocalMoneyGateProofCliError extends Error {
  constructor(readonly code: LocalMoneyGateProofCliErrorCode, message: string) {
    super(message);
    this.name = "LocalMoneyGateProofCliError";
  }
}

const defaultIo: LocalMoneyGateProofCliIo = {
  stdout: (value) => console.log(value),
  stderr: (value) => console.error(value),
};

const FORBIDDEN_KEYS = /(?:customer|person|recipient|bank|card|wallet|account|routing|sort_code|iban|api_key|access_token|password|secret|credential|endpoint|url|email|phone|invoice|contract)/i;

export function runLocalEndToEndMoneyGateProofCli(
  args: readonly string[],
  io: LocalMoneyGateProofCliIo = defaultIo,
): number {
  try {
    const options = parseArgs(args);
    const input = readLocalEndToEndMoneyGateProofInput(options.inputPath);
    const result = runLocalEndToEndMoneyGateProof(input);
    const output = options.summaryOnly ? summariseLocalEndToEndMoneyGateProof(result) : result;
    io.stdout(JSON.stringify(output, null, options.pretty ? 2 : 0));
    return result.proof_passed ? 0 : 2;
  } catch (error) {
    const known = error instanceof LocalMoneyGateProofCliError;
    io.stderr(JSON.stringify({
      error: {
        code: known ? error.code : "MONEY_GATE_PROOF_ERROR",
        message: known ? error.message : "The local money-gate proof could not complete safely.",
      },
      local_only: true,
      private_data_included: false,
      network_call_performed: false,
      payment_triggered: false,
      settlement_executed: false,
      action_executed: false,
    }, null, 2));
    return 1;
  }
}

export function readLocalEndToEndMoneyGateProofInput(
  path: string,
): LocalEndToEndMoneyGateProofInput {
  let source: string;
  try {
    source = readFileSync(path, "utf8");
  } catch {
    throw cliError("INPUT_FILE_UNREADABLE", "The local proof input file could not be read.");
  }

  let value: unknown;
  try {
    value = JSON.parse(source) as unknown;
  } catch {
    throw cliError("INVALID_JSON", "The local proof input file is not valid JSON.");
  }
  if (!isRecord(value)) {
    throw cliError("INVALID_INPUT", "The local proof input must be an object.");
  }
  if (containsForbiddenKey(value)) {
    throw cliError(
      "PRIVATE_OR_LIVE_DATA_REJECTED",
      "Private, credential, payment-rail, contact, or live endpoint fields are not accepted.",
    );
  }

  const input: LocalEndToEndMoneyGateProofInput = {
    request_id: requiredString(value, "request_id"),
    agent_id: requiredString(value, "agent_id"),
    requested_action: requiredString(value, "requested_action"),
    action_category: requiredString(value, "action_category"),
    mandate: {
      present: nestedBoolean(value, "mandate", "present"),
      scope: nestedString(value, "mandate", "scope"),
      expires_at: nestedString(value, "mandate", "expires_at"),
    },
    verified_intent: {
      present: nestedBoolean(value, "verified_intent", "present"),
      source: nestedString(value, "verified_intent", "source"),
    },
    evidence: {
      present: nestedBoolean(value, "evidence", "present"),
      fresh: nestedBoolean(value, "evidence", "fresh"),
      source: nestedString(value, "evidence", "source"),
    },
    limits: {
      spend_amount_gbp: nestedAmount(value, "limits", "spend_amount_gbp"),
      max_allowed_gbp: nestedAmount(value, "limits", "max_allowed_gbp"),
    },
    approval: {
      required: nestedBoolean(value, "approval", "required"),
      status: approvalStatus(value),
    },
    checked_at: requiredString(value, "checked_at"),
  };
  if (typeof value.proof_id === "string" && value.proof_id.trim() !== "") {
    input.proof_id = value.proof_id.trim().slice(0, 160);
  }
  return input;
}

function parseArgs(args: readonly string[]): {
  inputPath: string;
  pretty: boolean;
  summaryOnly: boolean;
} {
  let inputPath: string | undefined;
  let pretty = false;
  let summaryOnly = false;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === undefined) continue;
    if (arg === "--input") {
      const value = args[index + 1];
      if (value === undefined || value.startsWith("--")) {
        throw cliError("MISSING_INPUT_FILE", "--input requires a local JSON file.");
      }
      if (inputPath !== undefined) {
        throw cliError("UNEXPECTED_ARGUMENT", "Only one local proof input file is accepted.");
      }
      inputPath = value;
      index += 1;
      continue;
    }
    if (arg === "--pretty") pretty = true;
    else if (arg === "--summary-only") summaryOnly = true;
    else if (arg.startsWith("--")) {
      throw cliError("UNKNOWN_OPTION", "The local proof command contains an unsupported option.");
    } else if (inputPath !== undefined) {
      throw cliError("UNEXPECTED_ARGUMENT", "Only one local proof input file is accepted.");
    } else inputPath = arg;
  }
  if (inputPath === undefined) {
    throw cliError("MISSING_INPUT_FILE", "A local money-gate proof JSON input file is required.");
  }
  return { inputPath, pretty, summaryOnly };
}

function approvalStatus(value: Record<string, unknown>): "not_required" | "pending" | "approved" | "rejected" | "unknown" {
  const status = nestedString(value, "approval", "status");
  if (!["not_required", "pending", "approved", "rejected", "unknown"].includes(status)) {
    throw cliError("INVALID_INPUT", "The approval status is unsupported.");
  }
  return status as "not_required" | "pending" | "approved" | "rejected" | "unknown";
}

function nestedRecord(value: Record<string, unknown>, key: string): Record<string, unknown> {
  const item = value[key];
  if (!isRecord(item)) throw cliError("INVALID_INPUT", `${key} must be an object.`);
  return item;
}

function nestedString(value: Record<string, unknown>, parent: string, key: string): string {
  return requiredString(nestedRecord(value, parent), key);
}

function nestedBoolean(value: Record<string, unknown>, parent: string, key: string): boolean {
  const item = nestedRecord(value, parent)[key];
  if (typeof item !== "boolean") throw cliError("INVALID_INPUT", `${parent}.${key} must be boolean.`);
  return item;
}

function nestedAmount(value: Record<string, unknown>, parent: string, key: string): number {
  const item = nestedRecord(value, parent)[key];
  if (typeof item !== "number" || !Number.isFinite(item) || item < 0) {
    throw cliError("INVALID_INPUT", `${parent}.${key} must be a non-negative number.`);
  }
  return item;
}

function requiredString(value: Record<string, unknown>, key: string): string {
  const item = value[key];
  if (typeof item !== "string" || item.trim() === "") {
    throw cliError("INVALID_INPUT", `${key} must be a non-empty string.`);
  }
  return item.trim().slice(0, 256);
}

function containsForbiddenKey(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsForbiddenKey);
  if (!isRecord(value)) return false;
  return Object.entries(value).some(
    ([key, item]) => FORBIDDEN_KEYS.test(key) || containsForbiddenKey(item),
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cliError(
  code: LocalMoneyGateProofCliErrorCode,
  message: string,
): LocalMoneyGateProofCliError {
  return new LocalMoneyGateProofCliError(code, message);
}

if (require.main === module) {
  process.exitCode = runLocalEndToEndMoneyGateProofCli(process.argv.slice(2));
}
