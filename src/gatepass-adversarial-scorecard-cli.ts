import {
  GATEPASS_ADVERSARIAL_SCORECARD_SAFETY_FLAGS,
  runGatePassAdversarialScorecard,
  summariseGatePassAdversarialScorecard,
  type GatePassAdversarialScorecard,
  type GatePassAdversarialScorecardSummary,
} from "./gatepass-adversarial-scorecard.js";

export type GatePassAdversarialScorecardCliErrorCode =
  | "UNKNOWN_OPTION"
  | "UNEXPECTED_ARGUMENT"
  | "GATEPASS_SCORECARD_ERROR";

export interface GatePassAdversarialScorecardCliIo {
  stdout: (value: string) => void;
  stderr: (value: string) => void;
}

class GatePassAdversarialScorecardCliError extends Error {
  constructor(readonly code: GatePassAdversarialScorecardCliErrorCode, message: string) {
    super(message);
    this.name = "GatePassAdversarialScorecardCliError";
  }
}

const defaultIo: GatePassAdversarialScorecardCliIo = {
  stdout: (value) => console.log(value),
  stderr: (value) => console.error(value),
};

export function runGatePassAdversarialScorecardCli(
  args: readonly string[],
  io: GatePassAdversarialScorecardCliIo = defaultIo,
): number {
  try {
    const options = parseArgs(args);
    const scorecard = runGatePassAdversarialScorecard();
    if (options.json) {
      io.stdout(JSON.stringify(options.summaryOnly ? summariseGatePassAdversarialScorecard(scorecard) : scorecard));
    } else {
      io.stdout(renderScorecard(scorecard, options.summaryOnly));
    }
    return 0;
  } catch (error) {
    const known = error instanceof GatePassAdversarialScorecardCliError;
    io.stderr(JSON.stringify({
      error: {
        code: known ? error.code : "GATEPASS_SCORECARD_ERROR",
        message: known ? error.message : "The local GatePass scorecard demo could not complete safely.",
      },
      note: "No production benchmark, security certification, live systems contact, direct bot messaging, live agent-to-agent communication, payment, settlement, network call, live tool execution, real tool execution, or action execution occurred.",
      ...GATEPASS_ADVERSARIAL_SCORECARD_SAFETY_FLAGS,
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
      throw cliError("UNKNOWN_OPTION", "The GatePass scorecard command contains an unsupported option.");
    }
    throw cliError("UNEXPECTED_ARGUMENT", "The GatePass scorecard command does not accept positional input files.");
  }
  return { summaryOnly, json };
}

function renderScorecard(scorecard: GatePassAdversarialScorecard, summaryOnly: boolean): string {
  const summary: GatePassAdversarialScorecardSummary = summariseGatePassAdversarialScorecard(scorecard);
  const lines = [
    "GatePass adversarial metrics and latency scorecard",
    `version: ${scorecard.scorecardVersion}`,
    `scenarios: ${scorecard.scenarioSummary.totalScenarios}`,
    `matchedExpectedOutcomes: ${scorecard.scenarioSummary.matchedExpectedOutcomes}`,
    `mismatchedExpectedOutcomes: ${scorecard.scenarioSummary.mismatchedExpectedOutcomes}`,
    `adversarialCaught: ${scorecard.scenarioSummary.adversarialCaught}/${scorecard.scenarioSummary.adversarialScenarios}`,
    `validAllowed: ${scorecard.scenarioSummary.validAllowed}/${scorecard.scenarioSummary.validScenarios}`,
    `timing: total=${scorecard.timingSummary.totalDurationMs}ms avg=${scorecard.timingSummary.averageDecisionMs}ms min=${scorecard.timingSummary.minDecisionMs}ms max=${scorecard.timingSummary.maxDecisionMs}ms`,
    "timing note: local illustrative timing only; not a production benchmark",
    "safety: not a security certification, not adversarial completeness, not evidence of production readiness",
  ];
  if (!summaryOnly) {
    lines.push("", "scenario results:");
    for (const result of scorecard.scenarioResults) {
      lines.push(
        `- ${result.scenarioId}: expected=${result.expectedDecision} actual=${result.actualDecision} matched=${result.matchedExpectedOutcome} durationMs=${result.timing.decisionDurationMs}`,
      );
      lines.push(`  reasons: ${result.reasons.slice(0, 5).join(", ")}`);
    }
  }
  lines.push("", JSON.stringify(summary, null, 2));
  return lines.join("\n");
}

function cliError(
  code: GatePassAdversarialScorecardCliErrorCode,
  message: string,
): GatePassAdversarialScorecardCliError {
  return new GatePassAdversarialScorecardCliError(code, message);
}

if (require.main === module) {
  process.exitCode = runGatePassAdversarialScorecardCli(process.argv.slice(2));
}
