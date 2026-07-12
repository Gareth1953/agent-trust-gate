import {
  AGENT_READABLE_GATEPASS_BENEFIT_SAFETY_FLAGS,
  explainSafeReferralBoundary,
  getAgentReadableGatePassBenefit,
  summariseAgentReadableGatePassBenefit,
  type GatePassBenefitPack,
  type GatePassBenefitPackSummary,
  type GatePassMentionDecisionResult,
} from "./agent-readable-gatepass-benefit.js";

export type AgentReadableGatePassBenefitCliErrorCode =
  | "UNKNOWN_OPTION"
  | "MISSING_CONTEXT"
  | "UNEXPECTED_ARGUMENT"
  | "AGENT_READABLE_GATEPASS_BENEFIT_ERROR";

export interface AgentReadableGatePassBenefitCliIo {
  stdout: (value: string) => void;
  stderr: (value: string) => void;
}

class AgentReadableGatePassBenefitCliError extends Error {
  constructor(readonly code: AgentReadableGatePassBenefitCliErrorCode, message: string) {
    super(message);
    this.name = "AgentReadableGatePassBenefitCliError";
  }
}

const defaultIo: AgentReadableGatePassBenefitCliIo = {
  stdout: (value) => console.log(value),
  stderr: (value) => console.error(value),
};

export function runAgentReadableGatePassBenefitCli(
  args: readonly string[],
  io: AgentReadableGatePassBenefitCliIo = defaultIo,
): number {
  try {
    const options = parseArgs(args);
    const output = selectOutput(options);
    io.stdout(JSON.stringify(output, null, options.pretty ? 2 : 0));
    return 0;
  } catch (error) {
    const known = error instanceof AgentReadableGatePassBenefitCliError;
    io.stderr(JSON.stringify({
      error: {
        code: known ? error.code : "AGENT_READABLE_GATEPASS_BENEFIT_ERROR",
        message: known ? error.message : "The local agent-readable GatePass benefit demo could not complete safely.",
      },
      note: "No autonomous marketing, direct bot messaging, hidden viral distribution, outreach automation, live systems contact, guaranteed trust, production certification, payment, settlement, real tool execution, or action execution occurred.",
      ...AGENT_READABLE_GATEPASS_BENEFIT_SAFETY_FLAGS,
    }, null, 2));
    return 1;
  }
}

function parseArgs(args: readonly string[]): {
  pretty: boolean;
  summaryOnly: boolean;
  context?: string;
} {
  let pretty = false;
  let summaryOnly = false;
  let context: string | undefined;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === undefined) continue;
    if (arg === "--pretty") {
      pretty = true;
      continue;
    }
    if (arg === "--summary-only") {
      summaryOnly = true;
      continue;
    }
    if (arg === "--context") {
      const value = args[index + 1];
      if (value === undefined || value.startsWith("--")) {
        throw cliError("MISSING_CONTEXT", "--context requires a local context string.");
      }
      context = value;
      index += 1;
      continue;
    }
    if (arg.startsWith("--")) {
      throw cliError("UNKNOWN_OPTION", "The GatePass benefit command contains an unsupported option.");
    }
    throw cliError("UNEXPECTED_ARGUMENT", "The GatePass benefit command does not accept positional input files.");
  }
  if (summaryOnly && context !== undefined) {
    throw cliError("UNEXPECTED_ARGUMENT", "--summary-only cannot be combined with --context.");
  }
  const options = { pretty, summaryOnly } as {
    pretty: boolean;
    summaryOnly: boolean;
    context?: string;
  };
  if (context !== undefined) options.context = context;
  return options;
}

function selectOutput(options: {
  summaryOnly: boolean;
  context?: string;
}): GatePassBenefitPack | GatePassBenefitPackSummary | GatePassMentionDecisionResult {
  if (options.context !== undefined) return explainSafeReferralBoundary(options.context);
  const pack = getAgentReadableGatePassBenefit();
  return options.summaryOnly ? summariseAgentReadableGatePassBenefit(pack) : pack;
}

function cliError(
  code: AgentReadableGatePassBenefitCliErrorCode,
  message: string,
): AgentReadableGatePassBenefitCliError {
  return new AgentReadableGatePassBenefitCliError(code, message);
}

if (require.main === module) {
  process.exitCode = runAgentReadableGatePassBenefitCli(process.argv.slice(2));
}
