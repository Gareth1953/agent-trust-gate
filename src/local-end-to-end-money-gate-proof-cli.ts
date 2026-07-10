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
  setIfDefined(input, "schema_version", optionalLiteral(value, "schema_version", "atg.local-agent-action-request.v2"));
  setIfDefined(input, "action_id", optionalString(value, "action_id"));
  setIfDefined(input, "local_only", optionalTrue(value, "local_only"));
  setIfDefined(input, "issuer_ref", optionalString(value, "issuer_ref"));
  setIfDefined(input, "verifier_ref", optionalString(value, "verifier_ref"));
  setIfDefined(input, "nonce", optionalString(value, "nonce"));
  setIfDefined(input.mandate!, "mandate_id", optionalNestedString(value, "mandate", "mandate_id"));
  setIfDefined(input.mandate!, "issuer_ref", optionalNestedString(value, "mandate", "issuer_ref"));
  setIfDefined(input.verified_intent!, "status", optionalIntentStatus(value));
  setIfDefined(input.verified_intent!, "verifier_ref", optionalNestedString(value, "verified_intent", "verifier_ref"));
  setIfDefined(input.verified_intent!, "verified_at", optionalNestedString(value, "verified_intent", "verified_at"));
  Object.assign(input.evidence!, optionalEvidenceMetadata(value));

  const riskContext = optionalRiskContext(value);
  if (riskContext !== undefined) input.risk_context = riskContext;
  const proofMetadata = optionalProofMetadata(value);
  if (proofMetadata !== undefined) input.proof_metadata = proofMetadata;
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

function optionalString(value: Record<string, unknown>, key: string): string | undefined {
  const item = value[key];
  return typeof item === "string" && item.trim() !== "" ? item.trim().slice(0, 256) : undefined;
}

function optionalLiteral<T extends string>(
  value: Record<string, unknown>,
  key: string,
  expected: T,
): T | undefined {
  return value[key] === expected ? expected : undefined;
}

function optionalTrue(value: Record<string, unknown>, key: string): true | undefined {
  return value[key] === true ? true : undefined;
}

function optionalNestedString(value: Record<string, unknown>, parent: string, key: string): string | undefined {
  const item = value[parent];
  if (!isRecord(item)) return undefined;
  return optionalString(item, key);
}

function optionalIntentStatus(value: Record<string, unknown>): "verified" | "unverified" | "missing" | undefined {
  const status = optionalNestedString(value, "verified_intent", "status");
  return status === "verified" || status === "unverified" || status === "missing" ? status : undefined;
}

function optionalEvidenceMetadata(
  value: Record<string, unknown>,
): Partial<NonNullable<LocalEndToEndMoneyGateProofInput["evidence"]>> {
  const evidence = nestedRecord(value, "evidence");
  const type = optionalString(evidence, "evidence_type");
  const freshness = isRecord(evidence.freshness) ? evidence.freshness : undefined;
  const output: Partial<NonNullable<LocalEndToEndMoneyGateProofInput["evidence"]>> = {};
  setIfDefined(output, "evidence_id", optionalString(evidence, "evidence_id"));
  setIfDefined(
    output,
    "evidence_type",
    type === "local_fixture" || type === "local_document" || type === "local_receipt" || type === "local_policy" || type === "synthetic_observation" ? type : undefined,
  );
  setIfDefined(output, "local_reference", optionalString(evidence, "local_reference"));
  setIfDefined(output, "evidence_hash", optionalString(evidence, "evidence_hash"));
  setIfDefined(output, "verified_at", optionalString(evidence, "verified_at"));
  if (freshness !== undefined) {
    const freshnessOutput: NonNullable<NonNullable<LocalEndToEndMoneyGateProofInput["evidence"]>["freshness"]> = {};
    setIfDefined(freshnessOutput, "checked_at", optionalString(freshness, "checked_at"));
    setIfDefined(freshnessOutput, "expires_at", optionalString(freshness, "expires_at"));
    setIfDefined(freshnessOutput, "max_age_seconds", typeof freshness.max_age_seconds === "number" ? freshness.max_age_seconds : undefined);
    output.freshness = freshnessOutput;
  }
  return output;
}

function optionalRiskContext(value: Record<string, unknown>): LocalEndToEndMoneyGateProofInput["risk_context"] | undefined {
  const risk = value.risk_context;
  if (!isRecord(risk)) return undefined;
  const tier = optionalString(risk, "risk_tier");
  const decision = optionalString(risk, "policy_decision");
  if (!(tier === "low" || tier === "medium" || tier === "high" || tier === "blocked")) return undefined;
  if (!(decision === "allow" || decision === "review_required" || decision === "refuse")) return undefined;
  const output: NonNullable<LocalEndToEndMoneyGateProofInput["risk_context"]> = {
    risk_tier: tier,
    policy_decision: decision,
  };
  if (risk.policy_pack_version === "local-demo-v1") output.policy_pack_version = "local-demo-v1";
  return output;
}

function optionalProofMetadata(value: Record<string, unknown>): LocalEndToEndMoneyGateProofInput["proof_metadata"] | undefined {
  const metadata = value.proof_metadata;
  if (!isRecord(metadata)) return undefined;
  const purpose = optionalString(metadata, "proof_purpose");
  const status = optionalString(metadata, "proof_status");
  const freshness = isRecord(metadata.replay_freshness) ? metadata.replay_freshness : undefined;
  const output: NonNullable<LocalEndToEndMoneyGateProofInput["proof_metadata"]> = {};
  setIfDefined(output, "schema_version", metadata.schema_version === "atg.local-proof-metadata.v1" ? "atg.local-proof-metadata.v1" : undefined);
  setIfDefined(output, "proof_purpose", purpose === "pre_action_trust_gate" || purpose === "pre_settlement_money_gate" ? purpose : undefined);
  setIfDefined(output, "proof_status", status === "candidate" || status === "verified" || status === "review_required" || status === "blocked" ? status : undefined);
  setIfDefined(output, "issuer_ref", optionalString(metadata, "issuer_ref"));
  setIfDefined(output, "verifier_ref", optionalString(metadata, "verifier_ref"));
  setIfDefined(output, "created_at", optionalString(metadata, "created_at"));
  setIfDefined(output, "expires_at", optionalString(metadata, "expires_at"));
  setIfDefined(output, "nonce", optionalString(metadata, "nonce"));
  setIfDefined(output, "local_only", metadata.local_only === true ? true : undefined);
  if (freshness !== undefined) {
    const replay: NonNullable<NonNullable<LocalEndToEndMoneyGateProofInput["proof_metadata"]>["replay_freshness"]> = {};
    setIfDefined(replay, "nonce", optionalString(freshness, "nonce"));
    setIfDefined(replay, "single_use", freshness.single_use === true ? true : undefined);
    setIfDefined(replay, "freshness_window_seconds", typeof freshness.freshness_window_seconds === "number" ? freshness.freshness_window_seconds : undefined);
    setIfDefined(
      replay,
      "replay_protection",
      freshness.replay_protection === "local_in_memory_single_use" || freshness.replay_protection === "not_applicable" ? freshness.replay_protection : undefined,
    );
    output.replay_freshness = replay;
  }
  return output;
}

function setIfDefined<T extends object, K extends keyof T>(
  target: T,
  key: K,
  value: T[K] | undefined,
): void {
  if (value !== undefined) target[key] = value;
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
