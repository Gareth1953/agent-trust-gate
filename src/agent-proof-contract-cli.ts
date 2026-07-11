import {
  AGENT_PROOF_CONTRACT_EXAMPLE_FILES,
  AGENT_PROOF_CONTRACT_SAFETY_FLAGS,
  getAgentProofContractArtifact,
  runAgentProofContractExamples,
  summariseAgentProofContractPack,
  type AgentProofArtifactId,
  type AgentProofContractArtifact,
  type AgentProofContractPack,
  type AgentProofContractPackSummary,
} from "./agent-proof-contract.js";

export type AgentProofContractCliErrorCode =
  | "UNKNOWN_OPTION"
  | "MISSING_ARTIFACT"
  | "ARTIFACT_NOT_FOUND"
  | "UNEXPECTED_ARGUMENT"
  | "AGENT_PROOF_CONTRACT_ERROR";

export interface AgentProofContractCliIo {
  stdout: (value: string) => void;
  stderr: (value: string) => void;
}

class AgentProofContractCliError extends Error {
  constructor(readonly code: AgentProofContractCliErrorCode, message: string) {
    super(message);
    this.name = "AgentProofContractCliError";
  }
}

const defaultIo: AgentProofContractCliIo = {
  stdout: (value) => console.log(value),
  stderr: (value) => console.error(value),
};

export function runAgentProofContractCli(
  args: readonly string[],
  io: AgentProofContractCliIo = defaultIo,
): number {
  try {
    const options = parseArgs(args);
    const output = selectOutput(options);
    io.stdout(JSON.stringify(output, null, options.pretty ? 2 : 0));
    return 0;
  } catch (error) {
    const known = error instanceof AgentProofContractCliError;
    io.stderr(JSON.stringify({
      error: {
        code: known ? error.code : "AGENT_PROOF_CONTRACT_ERROR",
        message: known
          ? error.message
          : "The local agent proof contract demo could not complete safely.",
      },
      availableArtifacts: Object.keys(AGENT_PROOF_CONTRACT_EXAMPLE_FILES),
      note: "No live systems contact, direct bot messaging, live agent-to-agent communication, outreach automation, payment, settlement, network call, or action execution occurred.",
      ...AGENT_PROOF_CONTRACT_SAFETY_FLAGS,
    }, null, 2));
    return 1;
  }
}

function parseArgs(args: readonly string[]): {
  pretty: boolean;
  summaryOnly: boolean;
  artifact?: AgentProofArtifactId;
} {
  let pretty = false;
  let summaryOnly = false;
  let artifact: AgentProofArtifactId | undefined;
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
    if (arg === "--artifact") {
      const value = args[index + 1];
      if (value === undefined || value.startsWith("--")) {
        throw cliError("MISSING_ARTIFACT", "--artifact requires a local agent proof contract artifact id.");
      }
      artifact = parseArtifact(value);
      index += 1;
      continue;
    }
    if (arg.startsWith("--")) {
      throw cliError("UNKNOWN_OPTION", "The agent proof contract command contains an unsupported option.");
    }
    throw cliError("UNEXPECTED_ARGUMENT", "The agent proof contract command does not accept positional input files.");
  }
  if (summaryOnly && artifact !== undefined) {
    throw cliError("UNEXPECTED_ARGUMENT", "--summary-only cannot be combined with --artifact.");
  }
  const options = { pretty, summaryOnly } as {
    pretty: boolean;
    summaryOnly: boolean;
    artifact?: AgentProofArtifactId;
  };
  if (artifact !== undefined) options.artifact = artifact;
  return options;
}

function selectOutput(options: {
  summaryOnly: boolean;
  artifact?: AgentProofArtifactId;
}): AgentProofContractPack | AgentProofContractPackSummary | AgentProofContractArtifact {
  if (options.artifact !== undefined) return getAgentProofContractArtifact(options.artifact);
  const pack = runAgentProofContractExamples();
  return options.summaryOnly ? summariseAgentProofContractPack(pack) : pack;
}

function parseArtifact(value: string): AgentProofArtifactId {
  if (Object.hasOwn(AGENT_PROOF_CONTRACT_EXAMPLE_FILES, value)) {
    return value as AgentProofArtifactId;
  }
  throw cliError("ARTIFACT_NOT_FOUND", "The requested local agent proof contract artifact was not found.");
}

function cliError(
  code: AgentProofContractCliErrorCode,
  message: string,
): AgentProofContractCliError {
  return new AgentProofContractCliError(code, message);
}

if (require.main === module) {
  process.exitCode = runAgentProofContractCli(process.argv.slice(2));
}
