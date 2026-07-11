import {
  AGENT_PROOF_CONTRACT_SAFETY_FLAGS,
} from "./agent-proof-contract.js";
import {
  AGENT_PROOF_INTEGRATION_EXAMPLE_FILES,
  runAgentProofIntegrationAdapterExamples,
  runAgentProofIntegrationAdapterScenario,
  summariseAgentProofIntegrationAdapterPack,
  type AgentProofIntegrationAdapterPack,
  type AgentProofIntegrationAdapterPackSummary,
  type AgentProofIntegrationScenarioId,
  type LocalAgentProofIntegrationResult,
} from "./agent-proof-integration-adapter.js";

export type AgentProofIntegrationAdapterCliErrorCode =
  | "UNKNOWN_OPTION"
  | "MISSING_SCENARIO"
  | "SCENARIO_NOT_FOUND"
  | "UNEXPECTED_ARGUMENT"
  | "AGENT_PROOF_INTEGRATION_ERROR";

export interface AgentProofIntegrationAdapterCliIo {
  stdout: (value: string) => void;
  stderr: (value: string) => void;
}

class AgentProofIntegrationAdapterCliError extends Error {
  constructor(readonly code: AgentProofIntegrationAdapterCliErrorCode, message: string) {
    super(message);
    this.name = "AgentProofIntegrationAdapterCliError";
  }
}

const defaultIo: AgentProofIntegrationAdapterCliIo = {
  stdout: (value) => console.log(value),
  stderr: (value) => console.error(value),
};

export function runAgentProofIntegrationAdapterCli(
  args: readonly string[],
  io: AgentProofIntegrationAdapterCliIo = defaultIo,
): number {
  try {
    const options = parseArgs(args);
    const output = selectOutput(options);
    io.stdout(JSON.stringify(output, null, options.pretty ? 2 : 0));
    return 0;
  } catch (error) {
    const known = error instanceof AgentProofIntegrationAdapterCliError;
    io.stderr(JSON.stringify({
      error: {
        code: known ? error.code : "AGENT_PROOF_INTEGRATION_ERROR",
        message: known
          ? error.message
          : "The local agent proof integration adapter demo could not complete safely.",
      },
      availableScenarios: Object.keys(AGENT_PROOF_INTEGRATION_EXAMPLE_FILES),
      note: "No live systems contact, direct bot messaging, live agent-to-agent communication, payment, settlement, network call, tool call, or action execution occurred.",
      ...AGENT_PROOF_CONTRACT_SAFETY_FLAGS,
    }, null, 2));
    return 1;
  }
}

function parseArgs(args: readonly string[]): {
  pretty: boolean;
  summaryOnly: boolean;
  scenario?: AgentProofIntegrationScenarioId;
} {
  let pretty = false;
  let summaryOnly = false;
  let scenario: AgentProofIntegrationScenarioId | undefined;
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
    if (arg === "--scenario") {
      const value = args[index + 1];
      if (value === undefined || value.startsWith("--")) {
        throw cliError("MISSING_SCENARIO", "--scenario requires a local integration scenario id.");
      }
      scenario = parseScenario(value);
      index += 1;
      continue;
    }
    if (arg.startsWith("--")) {
      throw cliError("UNKNOWN_OPTION", "The agent proof integration adapter command contains an unsupported option.");
    }
    throw cliError("UNEXPECTED_ARGUMENT", "The agent proof integration adapter command does not accept positional input files.");
  }
  if (summaryOnly && scenario !== undefined) {
    throw cliError("UNEXPECTED_ARGUMENT", "--summary-only cannot be combined with --scenario.");
  }
  const options = { pretty, summaryOnly } as {
    pretty: boolean;
    summaryOnly: boolean;
    scenario?: AgentProofIntegrationScenarioId;
  };
  if (scenario !== undefined) options.scenario = scenario;
  return options;
}

function selectOutput(options: {
  summaryOnly: boolean;
  scenario?: AgentProofIntegrationScenarioId;
}): AgentProofIntegrationAdapterPack | AgentProofIntegrationAdapterPackSummary | LocalAgentProofIntegrationResult {
  if (options.scenario !== undefined) return runAgentProofIntegrationAdapterScenario(options.scenario);
  const pack = runAgentProofIntegrationAdapterExamples();
  return options.summaryOnly ? summariseAgentProofIntegrationAdapterPack(pack) : pack;
}

function parseScenario(value: string): AgentProofIntegrationScenarioId {
  if (Object.hasOwn(AGENT_PROOF_INTEGRATION_EXAMPLE_FILES, value)) {
    return value as AgentProofIntegrationScenarioId;
  }
  throw cliError("SCENARIO_NOT_FOUND", "The requested local integration scenario was not found.");
}

function cliError(
  code: AgentProofIntegrationAdapterCliErrorCode,
  message: string,
): AgentProofIntegrationAdapterCliError {
  return new AgentProofIntegrationAdapterCliError(code, message);
}

if (require.main === module) {
  process.exitCode = runAgentProofIntegrationAdapterCli(process.argv.slice(2));
}
