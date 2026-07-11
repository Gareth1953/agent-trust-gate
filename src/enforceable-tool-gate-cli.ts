import {
  ENFORCEABLE_TOOL_GATE_EXAMPLE_FILES,
  runEnforceableToolGateDemo,
  runEnforceableToolGateScenario,
  summariseEnforceableToolGateDemo,
  type EnforceableToolGateDemoPack,
  type EnforceableToolGateDemoSummary,
  type EnforceableToolGateResult,
  type EnforceableToolGateScenarioId,
} from "./enforceable-tool-gate.js";

export type EnforceableToolGateCliErrorCode =
  | "UNKNOWN_OPTION"
  | "MISSING_SCENARIO"
  | "SCENARIO_NOT_FOUND"
  | "UNEXPECTED_ARGUMENT"
  | "ENFORCEABLE_TOOL_GATE_ERROR";

export interface EnforceableToolGateCliIo {
  stdout: (value: string) => void;
  stderr: (value: string) => void;
}

class EnforceableToolGateCliError extends Error {
  constructor(readonly code: EnforceableToolGateCliErrorCode, message: string) {
    super(message);
    this.name = "EnforceableToolGateCliError";
  }
}

const defaultIo: EnforceableToolGateCliIo = {
  stdout: (value) => console.log(value),
  stderr: (value) => console.error(value),
};

export function runEnforceableToolGateCli(
  args: readonly string[],
  io: EnforceableToolGateCliIo = defaultIo,
): number {
  try {
    const options = parseArgs(args);
    const output = selectOutput(options);
    io.stdout(JSON.stringify(output, null, options.pretty ? 2 : 0));
    return 0;
  } catch (error) {
    const known = error instanceof EnforceableToolGateCliError;
    io.stderr(JSON.stringify({
      error: {
        code: known ? error.code : "ENFORCEABLE_TOOL_GATE_ERROR",
        message: known
          ? error.message
          : "The enforceable local tool-calling gate demo could not complete safely.",
      },
      availableScenarios: Object.keys(ENFORCEABLE_TOOL_GATE_EXAMPLE_FILES),
      localDemoOnly: true,
      realToolExecuted: false,
      liveSystemsContact: false,
      directBotMessaging: false,
      autonomousOutreach: false,
      liveAgentToAgentCommunication: false,
      paymentAuthorisation: false,
      settlementAuthorisation: false,
      actionExecution: false,
      productionCertification: false,
      note: "No real tool, payment, settlement, network call, live systems contact, direct bot message, or action execution occurred.",
    }, null, 2));
    return 1;
  }
}

function parseArgs(args: readonly string[]): {
  pretty: boolean;
  summaryOnly: boolean;
  scenario?: EnforceableToolGateScenarioId;
} {
  let pretty = false;
  let summaryOnly = false;
  let scenario: EnforceableToolGateScenarioId | undefined;
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
        throw cliError("MISSING_SCENARIO", "--scenario requires an enforceable tool gate scenario id.");
      }
      scenario = parseScenario(value);
      index += 1;
      continue;
    }
    if (arg.startsWith("--")) {
      throw cliError("UNKNOWN_OPTION", "The enforceable tool gate command contains an unsupported option.");
    }
    throw cliError("UNEXPECTED_ARGUMENT", "The enforceable tool gate command does not accept positional input files.");
  }
  if (summaryOnly && scenario !== undefined) {
    throw cliError("UNEXPECTED_ARGUMENT", "--summary-only cannot be combined with --scenario.");
  }
  const options = { pretty, summaryOnly } as {
    pretty: boolean;
    summaryOnly: boolean;
    scenario?: EnforceableToolGateScenarioId;
  };
  if (scenario !== undefined) options.scenario = scenario;
  return options;
}

function selectOutput(options: {
  summaryOnly: boolean;
  scenario?: EnforceableToolGateScenarioId;
}): EnforceableToolGateDemoPack | EnforceableToolGateDemoSummary | EnforceableToolGateResult {
  if (options.scenario !== undefined) return runEnforceableToolGateScenario(options.scenario);
  const pack = runEnforceableToolGateDemo();
  return options.summaryOnly ? summariseEnforceableToolGateDemo(pack) : pack;
}

function parseScenario(value: string): EnforceableToolGateScenarioId {
  if (Object.hasOwn(ENFORCEABLE_TOOL_GATE_EXAMPLE_FILES, value)) {
    return value as EnforceableToolGateScenarioId;
  }
  throw cliError("SCENARIO_NOT_FOUND", "The requested enforceable tool gate scenario was not found.");
}

function cliError(
  code: EnforceableToolGateCliErrorCode,
  message: string,
): EnforceableToolGateCliError {
  return new EnforceableToolGateCliError(code, message);
}

if (require.main === module) {
  process.exitCode = runEnforceableToolGateCli(process.argv.slice(2));
}
