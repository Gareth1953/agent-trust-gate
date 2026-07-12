import {
  GATEPASS_ROUND_TRIP_EXAMPLE_FILES,
  GATEPASS_ROUND_TRIP_SAFETY_FLAGS,
  runGatePassRoundTripDemo,
  runGatePassRoundTripScenario,
  summariseGatePassRoundTripDemo,
  type GatePassRoundTripDemoPack,
  type GatePassRoundTripDemoSummary,
  type GatePassRoundTripResult,
  type GatePassRoundTripScenarioId,
} from "./gatepass-round-trip.js";

export type GatePassRoundTripCliErrorCode =
  | "UNKNOWN_OPTION"
  | "MISSING_SCENARIO"
  | "SCENARIO_NOT_FOUND"
  | "UNEXPECTED_ARGUMENT"
  | "GATEPASS_ROUND_TRIP_ERROR";

export interface GatePassRoundTripCliIo {
  stdout: (value: string) => void;
  stderr: (value: string) => void;
}

class GatePassRoundTripCliError extends Error {
  constructor(readonly code: GatePassRoundTripCliErrorCode, message: string) {
    super(message);
    this.name = "GatePassRoundTripCliError";
  }
}

const defaultIo: GatePassRoundTripCliIo = {
  stdout: (value) => console.log(value),
  stderr: (value) => console.error(value),
};

export function runGatePassRoundTripCli(
  args: readonly string[],
  io: GatePassRoundTripCliIo = defaultIo,
): number {
  try {
    const options = parseArgs(args);
    const output = selectOutput(options);
    io.stdout(JSON.stringify(output, null, options.pretty ? 2 : 0));
    return 0;
  } catch (error) {
    const known = error instanceof GatePassRoundTripCliError;
    io.stderr(JSON.stringify({
      error: {
        code: known ? error.code : "GATEPASS_ROUND_TRIP_ERROR",
        message: known ? error.message : "The local GatePass round-trip demo could not complete safely.",
      },
      availableScenarios: Object.keys(GATEPASS_ROUND_TRIP_EXAMPLE_FILES),
      note: "No production signing, production-grade crypto, live systems contact, direct bot messaging, live agent-to-agent communication, payment, settlement, real tool execution, network call, or action execution occurred.",
      ...GATEPASS_ROUND_TRIP_SAFETY_FLAGS,
    }, null, 2));
    return 1;
  }
}

function parseArgs(args: readonly string[]): {
  pretty: boolean;
  summaryOnly: boolean;
  scenario?: GatePassRoundTripScenarioId;
} {
  let pretty = false;
  let summaryOnly = false;
  let scenario: GatePassRoundTripScenarioId | undefined;
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
        throw cliError("MISSING_SCENARIO", "--scenario requires a local GatePass round-trip scenario id.");
      }
      scenario = parseScenario(value);
      index += 1;
      continue;
    }
    if (arg.startsWith("--")) {
      throw cliError("UNKNOWN_OPTION", "The GatePass round-trip command contains an unsupported option.");
    }
    throw cliError("UNEXPECTED_ARGUMENT", "The GatePass round-trip command does not accept positional input files.");
  }
  if (summaryOnly && scenario !== undefined) {
    throw cliError("UNEXPECTED_ARGUMENT", "--summary-only cannot be combined with --scenario.");
  }
  const options = { pretty, summaryOnly } as {
    pretty: boolean;
    summaryOnly: boolean;
    scenario?: GatePassRoundTripScenarioId;
  };
  if (scenario !== undefined) options.scenario = scenario;
  return options;
}

function selectOutput(options: {
  summaryOnly: boolean;
  scenario?: GatePassRoundTripScenarioId;
}): GatePassRoundTripDemoPack | GatePassRoundTripDemoSummary | GatePassRoundTripResult {
  if (options.scenario !== undefined) return runGatePassRoundTripScenario(options.scenario);
  const pack = runGatePassRoundTripDemo();
  return options.summaryOnly ? summariseGatePassRoundTripDemo(pack) : pack;
}

function parseScenario(value: string): GatePassRoundTripScenarioId {
  if (Object.hasOwn(GATEPASS_ROUND_TRIP_EXAMPLE_FILES, value)) return value as GatePassRoundTripScenarioId;
  throw cliError("SCENARIO_NOT_FOUND", "The requested local GatePass round-trip scenario was not found.");
}

function cliError(
  code: GatePassRoundTripCliErrorCode,
  message: string,
): GatePassRoundTripCliError {
  return new GatePassRoundTripCliError(code, message);
}

if (require.main === module) {
  process.exitCode = runGatePassRoundTripCli(process.argv.slice(2));
}
