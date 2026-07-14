import { readFileSync } from "node:fs";

import {
  EMBEDDED_COMMERCE_CHECKOUT_POSITION,
  EMBEDDED_COMMERCE_CORE_POSITION,
  EMBEDDED_COMMERCE_GATEPASS_COMMAND,
  EMBEDDED_COMMERCE_SAFETY_FLAGS,
  evaluateEmbeddedCommerceGate,
  getEmbeddedCommerceScenarioRequest,
  isEmbeddedCommerceScenarioId,
  runEmbeddedCommerceGatepassDemo,
  summariseEmbeddedCommerceGatepassDemo,
  type CommerceGateEvaluation,
  type CommerceGateRequest,
  type CommerceGateScenarioId,
  type EmbeddedCommerceGatepassReport,
  type EmbeddedCommerceGatepassSummary,
} from "./embedded-commerce-gatepass.js";

export type EmbeddedCommerceGatepassCliErrorCode =
  | "UNKNOWN_OPTION"
  | "MISSING_SCENARIO"
  | "SCENARIO_NOT_FOUND"
  | "MISSING_INPUT_FILE"
  | "INPUT_FILE_UNREADABLE"
  | "INVALID_JSON"
  | "INVALID_INPUT"
  | "PRIVATE_OR_LIVE_DATA_REJECTED"
  | "UNEXPECTED_ARGUMENT"
  | "EMBEDDED_COMMERCE_GATEPASS_ERROR";

export interface EmbeddedCommerceGatepassCliIo {
  stdout: (value: string) => void;
  stderr: (value: string) => void;
}

class EmbeddedCommerceGatepassCliError extends Error {
  constructor(readonly code: EmbeddedCommerceGatepassCliErrorCode, message: string) {
    super(message);
    this.name = "EmbeddedCommerceGatepassCliError";
  }
}

const defaultIo: EmbeddedCommerceGatepassCliIo = {
  stdout: (value) => console.log(value),
  stderr: (value) => console.error(value),
};

const FORBIDDEN_INPUT_KEYS =
  /(?:card|wallet|bank|iban|sort_code|routing|account|password|secret|credential|api[_-]?key|access[_-]?token|payment[_-]?token|checkout[_-]?url|retailer[_-]?url|customer[_-]?(?:email|phone|name)|real[_-]?address|postcode|zip)/i;

export function runEmbeddedCommerceGatepassCli(
  args: readonly string[],
  io: EmbeddedCommerceGatepassCliIo = defaultIo,
): number {
  try {
    const options = parseArgs(args);
    const output = selectOutput(options);
    if (options.json) {
      io.stdout(JSON.stringify(output));
      return 0;
    }
    io.stdout(renderEmbeddedCommerceOutput(output, options.summaryOnly));
    return 0;
  } catch (error) {
    const known = error instanceof EmbeddedCommerceGatepassCliError;
    io.stderr(JSON.stringify({
      error: {
        code: known ? error.code : "EMBEDDED_COMMERCE_GATEPASS_ERROR",
        message: known
          ? error.message
          : "The embedded commerce GatePass demo could not complete safely.",
      },
      ...EMBEDDED_COMMERCE_SAFETY_FLAGS,
    }, null, 2));
    return 1;
  }
}

function parseArgs(args: readonly string[]): {
  summaryOnly: boolean;
  json: boolean;
  scenarioId?: CommerceGateScenarioId;
  inputPath?: string;
} {
  let summaryOnly = false;
  let json = false;
  let scenarioId: CommerceGateScenarioId | undefined;
  let inputPath: string | undefined;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === undefined) continue;
    if (arg === "--summary-only") {
      summaryOnly = true;
      continue;
    }
    if (arg === "--json") {
      json = true;
      continue;
    }
    if (arg === "--scenario" || arg === "--example") {
      const value = args[index + 1];
      if (value === undefined || value.startsWith("--")) {
        throw cliError("MISSING_SCENARIO", `${arg} requires a synthetic scenario id.`);
      }
      if (!isEmbeddedCommerceScenarioId(value)) {
        throw cliError("SCENARIO_NOT_FOUND", "The requested embedded commerce scenario was not found.");
      }
      scenarioId = value;
      index += 1;
      continue;
    }
    if (arg === "--input") {
      const value = args[index + 1];
      if (value === undefined || value.startsWith("--")) {
        throw cliError("MISSING_INPUT_FILE", "--input requires a local JSON file.");
      }
      inputPath = value;
      index += 1;
      continue;
    }
    if (arg.startsWith("--")) {
      throw cliError("UNKNOWN_OPTION", "The embedded commerce command contains an unsupported option.");
    }
    throw cliError("UNEXPECTED_ARGUMENT", "The embedded commerce command accepts only named options.");
  }
  if (scenarioId !== undefined && inputPath !== undefined) {
    throw cliError("UNEXPECTED_ARGUMENT", "--scenario cannot be combined with --input.");
  }
  const options = { summaryOnly, json } as {
    summaryOnly: boolean;
    json: boolean;
    scenarioId?: CommerceGateScenarioId;
    inputPath?: string;
  };
  if (scenarioId !== undefined) options.scenarioId = scenarioId;
  if (inputPath !== undefined) options.inputPath = inputPath;
  return options;
}

function selectOutput(options: {
  summaryOnly: boolean;
  scenarioId?: CommerceGateScenarioId;
  inputPath?: string;
}): EmbeddedCommerceGatepassReport | EmbeddedCommerceGatepassSummary | CommerceGateEvaluation {
  if (options.inputPath !== undefined) {
    return evaluateEmbeddedCommerceGate(readCommerceGateRequest(options.inputPath));
  }
  if (options.scenarioId !== undefined) {
    return evaluateEmbeddedCommerceGate(getEmbeddedCommerceScenarioRequest(options.scenarioId));
  }
  const report = runEmbeddedCommerceGatepassDemo();
  return options.summaryOnly ? summariseEmbeddedCommerceGatepassDemo(report) : report;
}

function renderEmbeddedCommerceOutput(
  output: EmbeddedCommerceGatepassReport | EmbeddedCommerceGatepassSummary | CommerceGateEvaluation,
  summaryOnly: boolean,
): string {
  if ("verdict" in output) {
    return [
      "Embedded Commerce GatePass scenario",
      `scenario: ${output.scenarioId}`,
      `request: ${output.requestId}`,
      `verdict: ${output.verdict}`,
      `failed checks: ${output.failedChecks.length === 0 ? "none" : output.failedChecks.join(", ")}`,
      "",
      EMBEDDED_COMMERCE_CHECKOUT_POSITION,
      "Local deterministic synthetic evaluation only.",
      "No retailer integration, checkout, payment authorisation, settlement execution, network call, A2A server, MCP server, or production signing.",
      "",
      JSON.stringify(output, null, 2),
    ].join("\n");
  }

  const lines = [
    "Embedded Commerce GatePass demonstrator",
    `command: ${EMBEDDED_COMMERCE_GATEPASS_COMMAND}`,
    `scenarios: ${output.scenarioCount}`,
    `allowed: ${output.allowedCount}`,
    `refused: ${output.refusedCount}`,
    `recommended first experience: ${output.recommendedFirstExperience}`,
    `optional specialist command: ${output.optionalSpecialistCommand}`,
    `featured application: ${output.commercialApplication}`,
    `target audiences: ${output.targetAudiences.join(", ")}`,
    `evaluation scope: ${output.evaluationScope.join(", ")}`,
    "",
    EMBEDDED_COMMERCE_CORE_POSITION,
    EMBEDDED_COMMERCE_CHECKOUT_POSITION,
    output.designPartnerPrinciple,
    "",
    "status:",
    "- local deterministic synthetic basket verification",
    "- no live retailer, shopping-agent, checkout, account, card, payment, settlement, API, network, A2A, MCP, or production integration",
    "- available for paid design-partner scoping subject to written agreement",
  ];
  if (!summaryOnly && "sampleRefusalReceipt" in output) {
    lines.push(
      "",
      "sample refusal:",
      `- receipt: ${output.sampleRefusalReceipt.receiptId}`,
      `- failed checks: ${output.sampleRefusalReceipt.failedChecks.join(", ")}`,
    );
  }
  lines.push("", JSON.stringify(output, null, 2));
  return lines.join("\n");
}

export function readCommerceGateRequest(path: string): CommerceGateRequest {
  let source: string;
  try {
    source = readFileSync(path, "utf8");
  } catch {
    throw cliError("INPUT_FILE_UNREADABLE", "The local commerce GatePass input file could not be read.");
  }

  let value: unknown;
  try {
    value = JSON.parse(source) as unknown;
  } catch {
    throw cliError("INVALID_JSON", "The local commerce GatePass input file is not valid JSON.");
  }
  if (!isRecord(value)) {
    throw cliError("INVALID_INPUT", "The local commerce GatePass input must be an object.");
  }
  if (containsForbiddenInputKey(value)) {
    throw cliError(
      "PRIVATE_OR_LIVE_DATA_REJECTED",
      "Private, account, credential, payment, checkout URL, or real customer data fields are not accepted.",
    );
  }
  return value as unknown as CommerceGateRequest;
}

function containsForbiddenInputKey(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsForbiddenInputKey);
  if (!isRecord(value)) return false;
  return Object.entries(value).some(
    ([key, item]) => FORBIDDEN_INPUT_KEYS.test(key) || containsForbiddenInputKey(item),
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cliError(
  code: EmbeddedCommerceGatepassCliErrorCode,
  message: string,
): EmbeddedCommerceGatepassCliError {
  return new EmbeddedCommerceGatepassCliError(code, message);
}

if (require.main === module) {
  process.exitCode = runEmbeddedCommerceGatepassCli(process.argv.slice(2));
}
