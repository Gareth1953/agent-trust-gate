import {
  ATG_STRATEGIC_FORESIGHT_SAFETY_FLAGS,
  buildStrategicForesightReport,
  summariseStrategicForesightReport,
} from "./atg-strategic-foresight.js";

export type StrategicForesightCliErrorCode =
  | "UNKNOWN_OPTION"
  | "UNEXPECTED_ARGUMENT"
  | "FORESIGHT_ERROR";

export interface StrategicForesightCliIo {
  stdout: (value: string) => void;
  stderr: (value: string) => void;
}

class StrategicForesightCliError extends Error {
  constructor(readonly code: StrategicForesightCliErrorCode, message: string) {
    super(message);
    this.name = "StrategicForesightCliError";
  }
}

const defaultIo: StrategicForesightCliIo = {
  stdout: (value) => console.log(value),
  stderr: (value) => console.error(value),
};

export function runStrategicForesightCli(
  args: readonly string[],
  io: StrategicForesightCliIo = defaultIo,
): number {
  try {
    const options = parseArgs(args);
    const report = buildStrategicForesightReport();
    const output = options.summaryOnly ? summariseStrategicForesightReport(report) : report;
    if (options.json) {
      io.stdout(JSON.stringify(output));
      return 0;
    }
    io.stdout(renderStrategicForesight(report, options.summaryOnly));
    return 0;
  } catch (error) {
    const known = error instanceof StrategicForesightCliError;
    io.stderr(JSON.stringify({
      error: {
        code: known ? error.code : "FORESIGHT_ERROR",
        message: known ? error.message : "The strategic foresight demo could not complete safely.",
      },
      note:
        "No live monitoring, scraping, autonomous learning, autonomous outreach, network call, product change, code change, roadmap change, prediction guarantee, or action execution occurred.",
      ...ATG_STRATEGIC_FORESIGHT_SAFETY_FLAGS,
    }, null, 2));
    return 1;
  }
}

function parseArgs(args: readonly string[]): { summaryOnly: boolean; json: boolean } {
  let summaryOnly = false;
  let json = false;
  for (const arg of args) {
    if (arg === "--summary-only") {
      summaryOnly = true;
      continue;
    }
    if (arg === "--json") {
      json = true;
      continue;
    }
    if (arg.startsWith("--")) {
      throw cliError("UNKNOWN_OPTION", "The foresight command contains an unsupported option.");
    }
    throw cliError("UNEXPECTED_ARGUMENT", "The foresight command does not accept positional input files.");
  }
  return { summaryOnly, json };
}

function renderStrategicForesight(
  report: ReturnType<typeof buildStrategicForesightReport>,
  summaryOnly: boolean,
): string {
  const summary = summariseStrategicForesightReport(report);
  const lines = [
    "ATG Strategic Foresight Layer",
    `version: ${report.version}`,
    "mode: local advisory only",
    "recommended first reviewer command remains: npm run demo:reviewer-kit",
    "",
    "core positioning:",
    ...report.corePhrases.map((phrase) => `- ${phrase}`),
    "",
    "workflow:",
    `- ${report.workflow.join(" -> ")}`,
    "",
    "signal categories:",
    ...report.signalCategories.map((category) => `- ${category.name}: ${category.whatToWatchManually}`),
    "",
    "sample signal analysis:",
    ...report.sampleSignals.map((signal) => `- ${signal.title}: ${signal.summary}`),
    "",
    "recommended missions:",
    ...report.recommendedMissions.map((mission) => `- ${mission.title} (${mission.status})`),
    "",
    "human approval workflow:",
    "- Foresight recommends only.",
    "- Gareth approves before any build.",
    "- Dave creates a bounded mission.",
    "- Codex implements locally only after approval.",
    "",
    "safety boundary:",
    `- ${report.safetyBoundary}`,
  ];

  if (!summaryOnly) {
    lines.push(
      "",
      "sample scores:",
      ...report.recommendedMissions.map((mission) =>
        `- ${mission.signalId}: relevance=${mission.score.relevanceToGatePass}, urgency=${mission.score.urgency}, safetyRisk=${mission.score.safetyRisk}`,
      ),
    );
  }

  lines.push("", JSON.stringify(summaryOnly ? summary : report, null, 2));
  return lines.join("\n");
}

function cliError(
  code: StrategicForesightCliErrorCode,
  message: string,
): StrategicForesightCliError {
  return new StrategicForesightCliError(code, message);
}

if (require.main === module) {
  process.exitCode = runStrategicForesightCli(process.argv.slice(2));
}

