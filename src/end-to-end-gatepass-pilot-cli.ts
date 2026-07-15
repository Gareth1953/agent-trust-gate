import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import {
  END_TO_END_GATEPASS_PILOT_COMMAND,
  END_TO_END_GATEPASS_PILOT_CORE_RULE,
  END_TO_END_GATEPASS_PILOT_NOTE,
  END_TO_END_GATEPASS_PILOT_OUTPUT_DIR,
  runEndToEndGatePassPilot,
  summariseEndToEndGatePassPilot,
  type EndToEndGatePassPilotReport,
  type EndToEndGatePassPilotScenarioId,
  type EndToEndGatePassPilotScenarioResult,
  type EndToEndGatePassPilotSummary,
} from "./end-to-end-gatepass-pilot.js";

export type EndToEndGatePassPilotCliErrorCode =
  | "UNKNOWN_OPTION"
  | "MISSING_SCENARIO"
  | "SCENARIO_NOT_FOUND"
  | "MISSING_OUTPUT_DIR"
  | "UNEXPECTED_ARGUMENT"
  | "GATEPASS_PILOT_ERROR";

export interface EndToEndGatePassPilotCliIo {
  stdout: (value: string) => void;
  stderr: (value: string) => void;
}

export interface EndToEndGatePassPilotSavedEvidence {
  outputDirectory: string;
  files: string[];
}

export interface EndToEndGatePassPilotCliOutput {
  report: EndToEndGatePassPilotReport | EndToEndGatePassPilotSummary;
  selectedScenario: EndToEndGatePassPilotScenarioId | "all";
  selectedScenarioResult: EndToEndGatePassPilotScenarioResult | null;
  savedEvidence: EndToEndGatePassPilotSavedEvidence;
  localOnly: true;
  simulatedSettlementOnly: true;
  networkCallPerformed: false;
  livePaymentProcessed: false;
  realSettlementExecuted: false;
  actionExecuted: false;
  note: typeof END_TO_END_GATEPASS_PILOT_NOTE;
}

class EndToEndGatePassPilotCliError extends Error {
  constructor(readonly code: EndToEndGatePassPilotCliErrorCode, message: string) {
    super(message);
    this.name = "EndToEndGatePassPilotCliError";
  }
}

const defaultIo: EndToEndGatePassPilotCliIo = {
  stdout: (value) => console.log(value),
  stderr: (value) => console.error(value),
};

export function runEndToEndGatePassPilotCli(
  args: readonly string[],
  io: EndToEndGatePassPilotCliIo = defaultIo,
): number {
  try {
    const options = parseArgs(args);
    const report = runEndToEndGatePassPilot({ outputDirectory: options.outputDirectory });
    const savedEvidence = writePilotEvidence(report, options.outputDirectory);
    const selectedScenarioResult = options.scenario === "all" ? null : report.scenarios[options.scenario];
    const output: EndToEndGatePassPilotCliOutput = {
      report: options.summaryOnly ? summariseEndToEndGatePassPilot(report) : report,
      selectedScenario: options.scenario,
      selectedScenarioResult,
      savedEvidence,
      localOnly: true,
      simulatedSettlementOnly: true,
      networkCallPerformed: false,
      livePaymentProcessed: false,
      realSettlementExecuted: false,
      actionExecuted: false,
      note: END_TO_END_GATEPASS_PILOT_NOTE,
    };
    if (options.json) {
      io.stdout(JSON.stringify(output));
      return 0;
    }
    io.stdout(renderPilotOutput(output, options.summaryOnly));
    return 0;
  } catch (error) {
    const known = error instanceof EndToEndGatePassPilotCliError;
    io.stderr(JSON.stringify({
      error: {
        code: known ? error.code : "GATEPASS_PILOT_ERROR",
        message: known
          ? error.message
          : "The end-to-end GatePass pilot could not complete safely.",
      },
      localOnly: true,
      simulatedSettlementOnly: true,
      networkCallPerformed: false,
      livePaymentProcessed: false,
      realSettlementExecuted: false,
      actionExecuted: false,
    }, null, 2));
    return 1;
  }
}

function parseArgs(args: readonly string[]): {
  scenario: EndToEndGatePassPilotScenarioId | "all";
  summaryOnly: boolean;
  json: boolean;
  outputDirectory: string;
} {
  let scenario: EndToEndGatePassPilotScenarioId | "all" = "all";
  let summaryOnly = false;
  let json = false;
  let outputDirectory: string = END_TO_END_GATEPASS_PILOT_OUTPUT_DIR;
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
    if (arg === "--scenario") {
      const value = args[index + 1];
      if (value === undefined || value.startsWith("--")) {
        throw cliError("MISSING_SCENARIO", "--scenario requires permitted, refused, or all.");
      }
      scenario = parseScenario(value);
      index += 1;
      continue;
    }
    if (arg === "--output-dir") {
      const value = args[index + 1];
      if (value === undefined || value.startsWith("--")) {
        throw cliError("MISSING_OUTPUT_DIR", "--output-dir requires a local directory path.");
      }
      outputDirectory = value;
      index += 1;
      continue;
    }
    if (arg.startsWith("--")) {
      throw cliError("UNKNOWN_OPTION", "The GatePass pilot command contains an unsupported option.");
    }
    throw cliError("UNEXPECTED_ARGUMENT", "The GatePass pilot command accepts only named options.");
  }
  return { scenario, summaryOnly, json, outputDirectory };
}

function parseScenario(value: string): EndToEndGatePassPilotScenarioId | "all" {
  if (value === "all") return "all";
  if (value === "permitted" || value === "permitted_action") return "permitted_action";
  if (value === "refused" || value === "refused_action") return "refused_action";
  throw cliError("SCENARIO_NOT_FOUND", "The requested GatePass pilot scenario was not found.");
}

function writePilotEvidence(
  report: EndToEndGatePassPilotReport,
  outputDirectory: string,
): EndToEndGatePassPilotSavedEvidence {
  mkdirSync(outputDirectory, { recursive: true });
  const files: string[] = [];
  const write = (relativeName: string, value: unknown): void => {
    const path = join(outputDirectory, relativeName);
    writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
    files.push(path.replace(/\\/g, "/"));
  };
  write("end-to-end-gatepass-pilot-report.json", report);
  for (const [scenarioId, scenario] of Object.entries(report.scenarios)) {
    const stem = scenarioId.replace("_", "-");
    write(`${stem}-proposed-action.json`, scenario.proposedAction);
    write(`${stem}-gatepass-receipt.json`, scenario.gatePassReceipt);
    if (scenario.signedGatePass !== null) write(`${stem}-signed-gatepass.json`, scenario.signedGatePass);
    write(`${stem}-settlement-decision.json`, scenario.settlement);
  }
  return {
    outputDirectory: outputDirectory.replace(/\\/g, "/"),
    files,
  };
}

function renderPilotOutput(
  output: EndToEndGatePassPilotCliOutput,
  summaryOnly: boolean,
): string {
  const report = output.report;
  const scenarioLines = output.selectedScenarioResult === null
    ? renderScenarioList("scenarios" in report ? Object.values(report.scenarios) : [])
    : renderScenarioList([output.selectedScenarioResult]);
  const lines = [
    "End-to-end GatePass pilot",
    `command: ${END_TO_END_GATEPASS_PILOT_COMMAND}`,
    END_TO_END_GATEPASS_PILOT_CORE_RULE,
    "",
    `selected scenario: ${output.selectedScenario}`,
    `audit evidence directory: ${output.savedEvidence.outputDirectory}`,
    "saved evidence files:",
    ...output.savedEvidence.files.map((file) => `- ${file}`),
    "",
    ...scenarioLines,
    "",
    "Settlement is simulated and local-only. No real payment, settlement, API call, network call, credential, secret, production signing, or action execution occurred.",
  ];
  if (!summaryOnly) {
    lines.push("", JSON.stringify(output, null, 2));
  }
  return lines.join("\n");
}

function renderScenarioList(scenarios: EndToEndGatePassPilotScenarioResult[]): string[] {
  if (scenarios.length === 0) {
    return [
      "summary:",
      "- full report omitted by --summary-only",
      "- run without --summary-only to inspect scenario details",
    ];
  }
  const lines: string[] = [];
  for (const scenario of scenarios) {
    lines.push(
      `scenario: ${scenario.scenarioId}`,
      `- proposed action: ${scenario.actionType}`,
      `- requested value: ${scenario.requestedValue.amount} ${scenario.requestedValue.currency}`,
      `- decision: ${scenario.decision}`,
      `- approval result: ${scenario.approvalResult}`,
      `- GatePass: ${scenario.gatePassIdentifier ?? "not issued"}`,
      `- simulated settlement: ${scenario.settlement.result}`,
      `- blocking reasons: ${scenario.settlement.blockingReasons.length === 0 ? "none" : scenario.settlement.blockingReasons.join(", ")}`,
      `- failed checks: ${scenario.checks.filter((check) => !check.passed).map((check) => check.id).join(", ") || "none"}`,
      "",
    );
  }
  return lines;
}

function cliError(
  code: EndToEndGatePassPilotCliErrorCode,
  message: string,
): EndToEndGatePassPilotCliError {
  return new EndToEndGatePassPilotCliError(code, message);
}

if (require.main === module) {
  process.exitCode = runEndToEndGatePassPilotCli(process.argv.slice(2));
}
