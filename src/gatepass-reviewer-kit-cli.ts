import {
  GATEPASS_REVIEWER_KIT_SAFETY_FLAGS,
  buildReviewerKitOutputForJson,
  getReviewerKitSafetyBoundary,
  runGatePassReviewerKit,
  summariseGatePassReviewerKit,
  summariseReviewerKitComponents,
  type GatePassReviewerKitReport,
} from "./gatepass-reviewer-kit.js";

export type GatePassReviewerKitCliErrorCode =
  | "UNKNOWN_OPTION"
  | "UNEXPECTED_ARGUMENT"
  | "GATEPASS_REVIEWER_KIT_ERROR";

export interface GatePassReviewerKitCliIo {
  stdout: (value: string) => void;
  stderr: (value: string) => void;
}

class GatePassReviewerKitCliError extends Error {
  constructor(readonly code: GatePassReviewerKitCliErrorCode, message: string) {
    super(message);
    this.name = "GatePassReviewerKitCliError";
  }
}

const defaultIo: GatePassReviewerKitCliIo = {
  stdout: (value) => console.log(value),
  stderr: (value) => console.error(value),
};

export function runGatePassReviewerKitCli(
  args: readonly string[],
  io: GatePassReviewerKitCliIo = defaultIo,
): number {
  try {
    const options = parseArgs(args);
    if (options.json) {
      io.stdout(JSON.stringify(buildReviewerKitOutputForJson(options.summaryOnly)));
      return 0;
    }
    const report = runGatePassReviewerKit();
    io.stdout(renderReviewerKit(report, options.summaryOnly));
    return 0;
  } catch (error) {
    const known = error instanceof GatePassReviewerKitCliError;
    io.stderr(JSON.stringify({
      error: {
        code: known ? error.code : "GATEPASS_REVIEWER_KIT_ERROR",
        message: known ? error.message : "The local GatePass reviewer kit could not complete safely.",
      },
      note: "No production middleware, production benchmark, security certification, live systems contact, direct bot messaging, live agent-to-agent communication, network call, real tool execution, payment, settlement, or action execution occurred.",
      ...GATEPASS_REVIEWER_KIT_SAFETY_FLAGS,
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
      throw cliError("UNKNOWN_OPTION", "The GatePass reviewer kit command contains an unsupported option.");
    }
    throw cliError("UNEXPECTED_ARGUMENT", "The GatePass reviewer kit command does not accept positional input files.");
  }
  return { summaryOnly, json };
}

function renderReviewerKit(report: GatePassReviewerKitReport, summaryOnly: boolean): string {
  const componentSummaries = summariseReviewerKitComponents(report);
  const lines = [
    "GatePass one-command reviewer demo kit",
    `version: ${report.kitVersion}`,
    `one command: ${report.oneCommand}`,
    "runs: GatePass round trip, adversarial scorecard, developer wrapper, and local framework-style integration summary",
    "",
    "GatePass is a scoped, time-bound, action-specific proof primitive for agent actions.",
    "GatePass provides a common, machine-readable format for expressing authority, mandate, scope, freshness, and evidence.",
    "No signed GatePass. No settlement.",
    "Do not trust the agent. Trust the GatePass.",
    "No proof. No permission.",
    "No mandate. No action.",
    "",
    "lifecycle summary:",
    `- scenarios: ${report.lifecycleSummary.scenarioCount}`,
    `- allows locally: ${report.lifecycleSummary.allowExamples.join(", ")}`,
    `- blocks: ${report.lifecycleSummary.rejectExamples.join(", ")}`,
    `- requires evidence: ${report.lifecycleSummary.requiresEvidenceExamples.join(", ")}`,
    `- requires human review: ${report.lifecycleSummary.requiresHumanReviewExamples.join(", ")}`,
    `- requires signed GatePass: ${report.lifecycleSummary.requiresSignedGatePassExamples.join(", ")}`,
    "",
    "scorecard summary:",
    `- total scenarios: ${report.scorecardSummary.totalScenarios}`,
    `- matched expected outcomes: ${report.scorecardSummary.matchedExpectedOutcomes}`,
    `- mismatched expected outcomes: ${report.scorecardSummary.mismatchedExpectedOutcomes}`,
    `- adversarial caught: ${report.scorecardSummary.adversarialCaught}/${report.scorecardSummary.adversarialScenarios}`,
    `- valid allowed locally: ${report.scorecardSummary.validAllowed}/${report.scorecardSummary.validScenarios}`,
    `- local illustrative timing: total=${report.scorecardSummary.timingSummary.totalDurationMs}ms avg=${report.scorecardSummary.timingSummary.averageDecisionMs}ms`,
    "",
    "wrapper summary:",
    `- pattern: ${report.wrapperSummary.wrapperPattern}`,
    `- wrapper scenarios: ${report.wrapperSummary.wrapperScenarioCount}`,
    `- local framework-style steps: ${report.wrapperSummary.localFrameworkStepCount}`,
    `- local mock allowed examples: ${report.wrapperSummary.allowedLocalMockExamples.join(", ")}`,
    `- blocked examples: ${report.wrapperSummary.blockedExamples.join(", ")}`,
    `- requires evidence: ${report.wrapperSummary.requiresEvidenceExamples.join(", ")}`,
    `- requires human review: ${report.wrapperSummary.requiresHumanReviewExamples.join(", ")}`,
    `- requires signed GatePass: ${report.wrapperSummary.requiresSignedGatePassExamples.join(", ")}`,
    "",
    "safety boundary:",
    `- ${getReviewerKitSafetyBoundary()}`,
    "- local mock execution only; no real tool execution, action execution, network calls, payment, or settlement",
    "- not production middleware, not a production benchmark, and not security certification",
  ];
  if (!summaryOnly) {
    lines.push(
      "",
      "decision highlights:",
      `- allows locally: ${report.decisionHighlights.allowsLocally.join(", ")}`,
      `- blocks: ${report.decisionHighlights.blocks.join(", ")}`,
      `- requires evidence: ${report.decisionHighlights.requiresEvidence.join(", ")}`,
      `- requires human review: ${report.decisionHighlights.requiresHumanReview.join(", ")}`,
      `- requires signed GatePass: ${report.decisionHighlights.requiresSignedGatePass.join(", ")}`,
      "",
      "next reviewer steps:",
      ...report.reviewerNextSteps.map((step) => `- ${step}`),
    );
  }
  const jsonPayload = summaryOnly
    ? { reviewerKit: summariseGatePassReviewerKit(report) }
    : {
      reviewerKit: summariseGatePassReviewerKit(report),
      components: componentSummaries,
    };
  lines.push("", JSON.stringify(jsonPayload, null, 2));
  return lines.join("\n");
}

function cliError(
  code: GatePassReviewerKitCliErrorCode,
  message: string,
): GatePassReviewerKitCliError {
  return new GatePassReviewerKitCliError(code, message);
}

if (require.main === module) {
  process.exitCode = runGatePassReviewerKitCli(process.argv.slice(2));
}
