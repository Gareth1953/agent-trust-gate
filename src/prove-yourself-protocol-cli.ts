import {
  PROVE_YOURSELF_EXAMPLE_FILES,
  PROVE_YOURSELF_SAFETY_FLAGS,
  runProveYourselfProtocolExamples,
  runProveYourselfProtocolScenario,
  summariseProveYourselfProtocolPack,
  type ProveYourselfProtocolPack,
  type ProveYourselfProtocolPackSummary,
  type ProveYourselfProtocolResult,
  type ProveYourselfScenarioId,
} from "./prove-yourself-protocol.js";

export type ProveYourselfProtocolCliErrorCode =
  | "UNKNOWN_OPTION"
  | "MISSING_SCENARIO"
  | "SCENARIO_NOT_FOUND"
  | "UNEXPECTED_ARGUMENT"
  | "PROVE_YOURSELF_PROTOCOL_ERROR";

export interface ProveYourselfProtocolCliIo {
  stdout: (value: string) => void;
  stderr: (value: string) => void;
}

class ProveYourselfProtocolCliError extends Error {
  constructor(readonly code: ProveYourselfProtocolCliErrorCode, message: string) {
    super(message);
    this.name = "ProveYourselfProtocolCliError";
  }
}

const defaultIo: ProveYourselfProtocolCliIo = {
  stdout: (value) => console.log(value),
  stderr: (value) => console.error(value),
};

export function runProveYourselfProtocolCli(
  args: readonly string[],
  io: ProveYourselfProtocolCliIo = defaultIo,
): number {
  try {
    const options = parseArgs(args);
    const output = selectOutput(options);
    io.stdout(JSON.stringify(output, null, options.pretty ? 2 : 0));
    return 0;
  } catch (error) {
    const known = error instanceof ProveYourselfProtocolCliError;
    io.stderr(JSON.stringify({
      error: {
        code: known ? error.code : "PROVE_YOURSELF_PROTOCOL_ERROR",
        message: known
          ? error.message
          : "The local prove-yourself protocol demo could not complete safely.",
      },
      availableScenarios: Object.keys(PROVE_YOURSELF_EXAMPLE_FILES),
      note: "No live systems contact, direct bot messaging, live agent-to-agent communication, outreach automation, payment, settlement, network call, or action execution occurred.",
      ...PROVE_YOURSELF_SAFETY_FLAGS,
    }, null, 2));
    return 1;
  }
}

function parseArgs(args: readonly string[]): {
  pretty: boolean;
  summaryOnly: boolean;
  scenario?: ProveYourselfScenarioId;
} {
  let pretty = false;
  let summaryOnly = false;
  let scenario: ProveYourselfScenarioId | undefined;
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
        throw cliError("MISSING_SCENARIO", "--scenario requires a local prove-yourself scenario id.");
      }
      scenario = parseScenario(value);
      index += 1;
      continue;
    }
    if (arg.startsWith("--")) {
      throw cliError("UNKNOWN_OPTION", "The prove-yourself protocol command contains an unsupported option.");
    }
    throw cliError("UNEXPECTED_ARGUMENT", "The prove-yourself protocol command does not accept positional input files.");
  }
  if (summaryOnly && scenario !== undefined) {
    throw cliError("UNEXPECTED_ARGUMENT", "--summary-only cannot be combined with --scenario.");
  }
  const options = { pretty, summaryOnly } as {
    pretty: boolean;
    summaryOnly: boolean;
    scenario?: ProveYourselfScenarioId;
  };
  if (scenario !== undefined) options.scenario = scenario;
  return options;
}

function selectOutput(options: {
  summaryOnly: boolean;
  scenario?: ProveYourselfScenarioId;
}): ProveYourselfProtocolPack | ProveYourselfProtocolPackSummary | ProveYourselfProtocolResult {
  if (options.scenario !== undefined) return runProveYourselfProtocolScenario(options.scenario);
  const pack = runProveYourselfProtocolExamples();
  return options.summaryOnly ? summariseProveYourselfProtocolPack(pack) : pack;
}

function parseScenario(value: string): ProveYourselfScenarioId {
  if (Object.hasOwn(PROVE_YOURSELF_EXAMPLE_FILES, value)) {
    return value as ProveYourselfScenarioId;
  }
  throw cliError("SCENARIO_NOT_FOUND", "The requested local prove-yourself scenario was not found.");
}

function cliError(
  code: ProveYourselfProtocolCliErrorCode,
  message: string,
): ProveYourselfProtocolCliError {
  return new ProveYourselfProtocolCliError(code, message);
}

if (require.main === module) {
  process.exitCode = runProveYourselfProtocolCli(process.argv.slice(2));
}
