import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import {
  verifyAgentClearingReceiptLocal,
  type ReceiptVerificationInput,
  type ReceiptVerificationReadinessResult,
} from "./receipt-verification-readiness.js";

export const RECEIPT_VERIFICATION_CLI_VERSION = "atg.receipt-verification-cli.v1" as const;

export type ReceiptVerificationCliErrorCode =
  | "MISSING_INPUT_FILE"
  | "UNEXPECTED_ARGUMENT"
  | "UNKNOWN_OPTION"
  | "INPUT_FILE_UNREADABLE"
  | "INVALID_JSON"
  | "MISSING_RECEIPT"
  | "UNSUPPORTED_RECEIPT_SHAPE"
  | "RECEIPT_VERIFICATION_ERROR";

export interface ReceiptVerificationCliSafetySummary {
  local_input_only: true;
  live_verification_performed: false;
  blockchain_verification_performed: false;
  private_data_included: false;
  network_lookup_performed: false;
  external_lookup_performed: false;
  tracking_triggered: false;
  analytics_triggered: false;
  payment_or_fee_triggered: false;
  billing_triggered: false;
  settlement_triggered: false;
  action_executed: false;
}

export interface ReceiptVerificationCliResult {
  verification_cli_id: string;
  verification_type: "local_receipt_verification_cli";
  source_receipt_id: string;
  receipt_status: "draft_only" | "local_only" | "invalid";
  verification_result: ReceiptVerificationReadinessResult["verification_result"];
  verification_passed: boolean;
  verification_failed: boolean;
  failure_reasons: string[];
  checked_fields: string[];
  safety_summary: ReceiptVerificationCliSafetySummary;
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
  created_at: string;
}

export interface ReceiptVerificationCliErrorResult {
  error: {
    code: ReceiptVerificationCliErrorCode;
    message: string;
  };
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

export interface ReceiptVerificationCliIo {
  stdout: (value: string) => void;
  stderr: (value: string) => void;
}

class ReceiptVerificationCliError extends Error {
  constructor(
    readonly code: ReceiptVerificationCliErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ReceiptVerificationCliError";
  }
}

const CHECKED_FIELDS = [
  "receipt_id", "receipt_type", "source_clearing_decision_id",
  "source_clearing_request_id", "receipt_status", "status", "reason_codes",
  "required_next_steps", "private_data_included", "network_lookup_performed",
  "external_lookup_performed", "payment_or_fee_triggered", "billing_triggered",
  "settlement_triggered", "machine_to_machine_fee_triggered", "action_executed",
  "receipt_persisted", "verification_status",
].sort();

const defaultIo: ReceiptVerificationCliIo = {
  stdout: (value) => console.log(value),
  stderr: (value) => console.error(value),
};

export function runReceiptVerificationCli(
  args: readonly string[],
  io: ReceiptVerificationCliIo = defaultIo,
): number {
  try {
    const { inputPath, pretty } = parseArgs(args);
    const input = readReceiptVerificationCliInput(inputPath);
    io.stdout(formatJson(createReceiptVerificationCliResult(input), pretty));
    return 0;
  } catch (error) {
    io.stderr(formatJson(toSafeError(error), true));
    return 1;
  }
}

export function readReceiptVerificationCliInput(inputPath: string): ReceiptVerificationInput {
  let source: string;
  try {
    source = readFileSync(inputPath, "utf8");
  } catch {
    throw cliError("INPUT_FILE_UNREADABLE", "The local receipt input file could not be read.");
  }
  let value: unknown;
  try {
    value = JSON.parse(source) as unknown;
  } catch {
    throw cliError("INVALID_JSON", "The local receipt input file is not valid JSON.");
  }
  return validateReceiptContainer(value);
}

export function runLocalReceiptVerificationFromObject(input: unknown): ReceiptVerificationCliResult {
  return createReceiptVerificationCliResult(validateReceiptContainer(input));
}

export function createReceiptVerificationCliResult(
  input: ReceiptVerificationInput,
): ReceiptVerificationCliResult {
  const verification = verifyAgentClearingReceiptLocal(input);
  const passed = verification.verification_result === "locally_valid";
  return {
    verification_cli_id: createReceiptVerificationCliId(input.receipt_id),
    verification_type: "local_receipt_verification_cli",
    source_receipt_id: verification.source_receipt_id,
    receipt_status: verification.receipt_status,
    verification_result: verification.verification_result,
    verification_passed: passed,
    verification_failed: !passed,
    failure_reasons: passed
      ? []
      : verification.verification_reason_codes.filter((code) =>
        code !== "external_verification_not_enabled"
        && code !== "fee_readiness_placeholder_only"
        && code !== "draft_only_not_externally_verified"),
    checked_fields: [...CHECKED_FIELDS],
    safety_summary: safetySummary(),
    private_data_included: false,
    network_lookup_performed: false,
    external_lookup_performed: false,
    tracking_triggered: false,
    analytics_triggered: false,
    payment_or_fee_triggered: false,
    billing_triggered: false,
    settlement_triggered: false,
    action_executed: false,
    status: "draft_only",
    created_at: safeTimestamp(input.created_at),
  };
}

export function createReceiptVerificationCliId(receiptId: string): string {
  const digest = createHash("sha256").update(receiptId, "utf8").digest("hex");
  return `receipt_verify_cli_${digest.slice(0, 24)}`;
}

function validateReceiptContainer(value: unknown): ReceiptVerificationInput {
  if (!isRecord(value)) {
    throw cliError("MISSING_RECEIPT", "The local input must contain a receipt object.");
  }
  if (!Object.hasOwn(value, "receipt")) {
    throw cliError("MISSING_RECEIPT", "The local input must contain a receipt object.");
  }
  if (!isRecord(value.receipt)) {
    throw cliError("UNSUPPORTED_RECEIPT_SHAPE", "The receipt object has an unsupported local shape.");
  }
  return validateReceipt(value.receipt);
}

function validateReceipt(value: Record<string, unknown>): ReceiptVerificationInput {
  try {
    return {
      receipt_id: requiredString(value, "receipt_id"),
      receipt_type: requiredString(value, "receipt_type"),
      source_clearing_decision_id: requiredString(value, "source_clearing_decision_id", true),
      source_clearing_request_id: requiredString(value, "source_clearing_request_id", true),
      decision: requiredString(value, "decision"),
      action_allowed: requiredBoolean(value, "action_allowed"),
      action_blocked: requiredBoolean(value, "action_blocked"),
      approval_required: requiredBoolean(value, "approval_required"),
      evidence_required: requiredBoolean(value, "evidence_required"),
      identity_verification_required: requiredBoolean(value, "identity_verification_required"),
      payment_intent_clarification_required: requiredBoolean(value, "payment_intent_clarification_required"),
      spend_limit_recommended: requiredBoolean(value, "spend_limit_recommended"),
      refusalgraph_caution_level: requiredString(value, "refusalgraph_caution_level"),
      refusalgraph_matched_signal_count: requiredCount(value, "refusalgraph_matched_signal_count"),
      reason_codes: requiredStringArray(value, "reason_codes"),
      required_next_steps: requiredStringArray(value, "required_next_steps"),
      verification_status: requiredString(value, "verification_status"),
      receipt_status: requiredString(value, "receipt_status"),
      private_data_included: requiredBoolean(value, "private_data_included"),
      network_lookup_performed: requiredBoolean(value, "network_lookup_performed"),
      external_lookup_performed: requiredBoolean(value, "external_lookup_performed"),
      payment_or_fee_triggered: requiredBoolean(value, "payment_or_fee_triggered"),
      action_executed: requiredBoolean(value, "action_executed"),
      receipt_persisted: requiredBoolean(value, "receipt_persisted"),
      settlement_triggered: requiredBoolean(value, "settlement_triggered"),
      billing_triggered: requiredBoolean(value, "billing_triggered"),
      machine_to_machine_fee_triggered: requiredBoolean(value, "machine_to_machine_fee_triggered"),
      status: requiredString(value, "status"),
      created_at: requiredString(value, "created_at"),
    };
  } catch {
    throw cliError(
      "UNSUPPORTED_RECEIPT_SHAPE",
      "The receipt object has an unsupported local shape.",
    );
  }
}

function parseArgs(args: readonly string[]): { inputPath: string; pretty: boolean } {
  let inputPath: string | undefined;
  let pretty = false;
  for (const arg of args) {
    if (arg === "--pretty") {
      pretty = true;
    } else if (arg.startsWith("--")) {
      throw cliError("UNKNOWN_OPTION", "The local receipt command contains an unsupported option.");
    } else if (inputPath !== undefined) {
      throw cliError("UNEXPECTED_ARGUMENT", "The local receipt command accepts one input file path.");
    } else {
      inputPath = arg;
    }
  }
  if (inputPath === undefined || inputPath.trim() === "") {
    throw cliError("MISSING_INPUT_FILE", "A local receipt JSON input file path is required.");
  }
  return { inputPath, pretty };
}

function requiredString(
  value: Record<string, unknown>,
  key: string,
  allowEmpty = false,
): string {
  const item = value[key];
  if (typeof item !== "string" || (!allowEmpty && item.trim() === "")) throw new Error(key);
  return item.trim().slice(0, 256);
}

function requiredBoolean(value: Record<string, unknown>, key: string): boolean {
  if (typeof value[key] !== "boolean") throw new Error(key);
  return value[key];
}

function requiredCount(value: Record<string, unknown>, key: string): number {
  const item = value[key];
  if (!Number.isSafeInteger(item) || (item as number) < 0) throw new Error(key);
  return Math.min(item as number, 1_000_000);
}

function requiredStringArray(value: Record<string, unknown>, key: string): string[] {
  const item = value[key];
  if (!Array.isArray(item) || !item.every((entry) => typeof entry === "string")) throw new Error(key);
  return item.map((entry) => entry.trim().slice(0, 96));
}

function safetySummary(): ReceiptVerificationCliSafetySummary {
  return {
    local_input_only: true,
    live_verification_performed: false,
    blockchain_verification_performed: false,
    private_data_included: false,
    network_lookup_performed: false,
    external_lookup_performed: false,
    tracking_triggered: false,
    analytics_triggered: false,
    payment_or_fee_triggered: false,
    billing_triggered: false,
    settlement_triggered: false,
    action_executed: false,
  };
}

function toSafeError(error: unknown): ReceiptVerificationCliErrorResult {
  const known = error instanceof ReceiptVerificationCliError;
  return {
    error: {
      code: known ? error.code : "RECEIPT_VERIFICATION_ERROR",
      message: known
        ? error.message
        : "The local receipt could not be verified safely.",
    },
    private_data_included: false,
    network_lookup_performed: false,
    external_lookup_performed: false,
    tracking_triggered: false,
    analytics_triggered: false,
    payment_or_fee_triggered: false,
    billing_triggered: false,
    settlement_triggered: false,
    action_executed: false,
    status: "draft_only",
  };
}

function cliError(
  code: ReceiptVerificationCliErrorCode,
  message: string,
): ReceiptVerificationCliError {
  return new ReceiptVerificationCliError(code, message);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function safeTimestamp(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "unknown" : date.toISOString();
}

function formatJson(
  value: ReceiptVerificationCliResult | ReceiptVerificationCliErrorResult,
  pretty: boolean,
): string {
  return JSON.stringify(value, null, pretty ? 2 : undefined);
}

if (require.main === module) {
  process.exitCode = runReceiptVerificationCli(process.argv.slice(2));
}
