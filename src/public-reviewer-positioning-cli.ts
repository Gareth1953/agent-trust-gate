import {
  PUBLIC_REVIEWER_POSITIONING_SAFETY_FLAGS,
  getPublicReviewerPositioningSummary,
  summarisePublicReviewerPositioning,
} from "./public-reviewer-positioning.js";

export type PublicReviewerPositioningCliErrorCode =
  | "UNKNOWN_OPTION"
  | "UNEXPECTED_ARGUMENT"
  | "PUBLIC_POSITIONING_ERROR";

export interface PublicReviewerPositioningCliIo {
  stdout: (value: string) => void;
  stderr: (value: string) => void;
}

class PublicReviewerPositioningCliError extends Error {
  constructor(readonly code: PublicReviewerPositioningCliErrorCode, message: string) {
    super(message);
    this.name = "PublicReviewerPositioningCliError";
  }
}

const defaultIo: PublicReviewerPositioningCliIo = {
  stdout: (value) => console.log(value),
  stderr: (value) => console.error(value),
};

export function runPublicReviewerPositioningCli(
  args: readonly string[],
  io: PublicReviewerPositioningCliIo = defaultIo,
): number {
  try {
    const options = parseArgs(args);
    const summary = getPublicReviewerPositioningSummary();
    if (options.json) {
      io.stdout(JSON.stringify(options.summaryOnly ? summarisePublicReviewerPositioning(summary) : summary));
      return 0;
    }
    io.stdout(renderPublicReviewerPositioning(summary, options.summaryOnly));
    return 0;
  } catch (error) {
    const known = error instanceof PublicReviewerPositioningCliError;
    io.stderr(JSON.stringify({
      error: {
        code: known ? error.code : "PUBLIC_POSITIONING_ERROR",
        message: known ? error.message : "The public reviewer positioning summary could not complete safely.",
      },
      note: "No production middleware, production benchmark, security certification, network call, real tool execution, payment, settlement, or action execution occurred.",
      ...PUBLIC_REVIEWER_POSITIONING_SAFETY_FLAGS,
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
      throw cliError("UNKNOWN_OPTION", "The public positioning command contains an unsupported option.");
    }
    throw cliError("UNEXPECTED_ARGUMENT", "The public positioning command does not accept positional input files.");
  }
  return { summaryOnly, json };
}

function renderPublicReviewerPositioning(
  summary: ReturnType<typeof getPublicReviewerPositioningSummary>,
  summaryOnly: boolean,
): string {
  const lines = [
    "Public README / reviewer positioning summary",
    `version: ${summary.version}`,
    `recommended first command: ${summary.recommendedFirstCommand}`,
    "",
    "core positioning:",
    ...summary.corePositioning.map((phrase) => `- ${phrase}`),
    "",
    "reviewer path:",
    ...summary.latestReviewerPath.map((step) => `- ${step}`),
    "",
    "secondary commands:",
    ...summary.secondaryCommands.map((command) => `- ${command}`),
    "",
    "safety boundary:",
    `- ${summary.safetyBoundary}`,
    "- Agent Trust Language remains supporting material; GatePass remains the headline proof primitive.",
  ];

  if (!summaryOnly) {
    lines.push(
      "",
      "allowed claims:",
      ...summary.allowedClaims.map((claim) => `- ${claim}`),
      "",
      "disallowed claims:",
      ...summary.disallowedClaims.map((claim) => `- ${claim}`),
    );
  }

  lines.push("", JSON.stringify(summaryOnly ? summarisePublicReviewerPositioning(summary) : summary, null, 2));
  return lines.join("\n");
}

function cliError(
  code: PublicReviewerPositioningCliErrorCode,
  message: string,
): PublicReviewerPositioningCliError {
  return new PublicReviewerPositioningCliError(code, message);
}

if (require.main === module) {
  process.exitCode = runPublicReviewerPositioningCli(process.argv.slice(2));
}
