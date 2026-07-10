import {
  SESSION_INTENT_EXAMPLE_FILES,
  SESSION_INTENT_SAFETY_FLAGS,
  runSessionIntentGateExamples,
  runSessionIntentGateScenario,
  summariseSessionIntentGatePack,
  type SessionIntentGatePack,
  type SessionIntentGatePackSummary,
  type SessionIntentGateResult,
  type SessionIntentScenarioId,
} from "./session-intent-gate.js";

export type SessionIntentGateCliErrorCode =
  | "UNKNOWN_OPTION"
  | "MISSING_SCENARIO"
  | "SCENARIO_NOT_FOUND"
  | "UNEXPECTED_ARGUMENT"
  | "SESSION_INTENT_GATE_ERROR";

export interface SessionIntentGateCliIo {
  stdout: (value: string) => void;
  stderr: (value: string) => void;
}

class SessionIntentGateCliError extends Error {
  constructor(readonly code: SessionIntentGateCliErrorCode, message: string) {
    super(message);
    this.name = "SessionIntentGateCliError";
  }
}

const defaultIo: SessionIntentGateCliIo = {
  stdout: (value) => console.log(value),
  stderr: (value) => console.error(value),
};

export function runSessionIntentGateCli(
  args: readonly string[],
  io: SessionIntentGateCliIo = defaultIo,
): number {
  try {
    const options = parseArgs(args);
    const output = selectOutput(options);
    io.stdout(JSON.stringify(output, null, options.pretty ? 2 : 0));
    return 0;
  } catch (error) {
    const known = error instanceof SessionIntentGateCliError;
    io.stderr(JSON.stringify({
      error: {
        code: known ? error.code : "SESSION_INTENT_GATE_ERROR",
        message: known
          ? error.message
          : "The local session intent gate concept demo could not complete safely.",
      },
      availableScenarios: Object.keys(SESSION_INTENT_EXAMPLE_FILES),
      note: "No live traffic monitoring, real bot detection, crawler blocking, browser fingerprinting, tracking, network call, payment, settlement, external-agent contact, or action execution occurred.",
      ...SESSION_INTENT_SAFETY_FLAGS,
    }, null, 2));
    return 1;
  }
}

function parseArgs(args: readonly string[]): {
  pretty: boolean;
  summaryOnly: boolean;
  scenario?: SessionIntentScenarioId;
} {
  let pretty = false;
  let summaryOnly = false;
  let scenario: SessionIntentScenarioId | undefined;
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
        throw cliError("MISSING_SCENARIO", "--scenario requires a local session intent scenario id.");
      }
      scenario = parseScenario(value);
      index += 1;
      continue;
    }
    if (arg.startsWith("--")) {
      throw cliError("UNKNOWN_OPTION", "The session intent gate command contains an unsupported option.");
    }
    throw cliError("UNEXPECTED_ARGUMENT", "The session intent gate command does not accept positional input files.");
  }
  if (summaryOnly && scenario !== undefined) {
    throw cliError("UNEXPECTED_ARGUMENT", "--summary-only cannot be combined with --scenario.");
  }
  const options = { pretty, summaryOnly } as {
    pretty: boolean;
    summaryOnly: boolean;
    scenario?: SessionIntentScenarioId;
  };
  if (scenario !== undefined) options.scenario = scenario;
  return options;
}

function selectOutput(options: {
  summaryOnly: boolean;
  scenario?: SessionIntentScenarioId;
}): SessionIntentGatePack | SessionIntentGatePackSummary | SessionIntentGateResult {
  if (options.scenario !== undefined) return runSessionIntentGateScenario(options.scenario);
  const pack = runSessionIntentGateExamples();
  return options.summaryOnly ? summariseSessionIntentGatePack(pack) : pack;
}

function parseScenario(value: string): SessionIntentScenarioId {
  if (Object.hasOwn(SESSION_INTENT_EXAMPLE_FILES, value)) {
    return value as SessionIntentScenarioId;
  }
  throw cliError("SCENARIO_NOT_FOUND", "The requested local session intent scenario was not found.");
}

function cliError(
  code: SessionIntentGateCliErrorCode,
  message: string,
): SessionIntentGateCliError {
  return new SessionIntentGateCliError(code, message);
}

if (require.main === module) {
  process.exitCode = runSessionIntentGateCli(process.argv.slice(2));
}
