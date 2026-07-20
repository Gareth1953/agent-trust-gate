import {
  runExactActionGatePassDemo,
  summariseExactActionGatePassDemo,
  type ExactActionDemoPack,
  type ExactActionDemoScenario,
  type ExactActionDemoScenarioId,
  type ExactActionDemoSummary,
} from "./exact-action-gatepass.js";

export type ExactActionGatePassCliErrorCode =
  | "UNKNOWN_OPTION"
  | "MISSING_SCENARIO"
  | "SCENARIO_NOT_FOUND"
  | "UNEXPECTED_ARGUMENT"
  | "EXACT_ACTION_GATEPASS_ERROR";

export interface ExactActionGatePassCliIo {
  stdout: (value: string) => void;
  stderr: (value: string) => void;
}

class ExactActionGatePassCliError extends Error {
  constructor(readonly code: ExactActionGatePassCliErrorCode, message: string) {
    super(message);
    this.name = "ExactActionGatePassCliError";
  }
}

const scenarioIds: ExactActionDemoScenarioId[] = [
  "exact_action_executed",
  "replay_refused",
  "changed_amount_refused",
  "changed_target_refused",
  "changed_tool_schema_refused",
  "expired_refused",
  "revoked_key_refused",
  "unknown_key_refused",
  "verifier_unavailable",
  "allowed_not_executed",
];

const defaultIo: ExactActionGatePassCliIo = {
  stdout: (value) => console.log(value),
  stderr: (value) => console.error(value),
};

export async function runExactActionGatePassCli(
  args: readonly string[],
  io: ExactActionGatePassCliIo = defaultIo,
): Promise<number> {
  try {
    const options = parseArgs(args);
    const pack = await runExactActionGatePassDemo();
    const output = selectOutput(pack, options);
    io.stdout(JSON.stringify(output, null, options.pretty ? 2 : 0));
    return 0;
  } catch (error) {
    const known = error instanceof ExactActionGatePassCliError;
    io.stderr(JSON.stringify({
      error: {
        code: known ? error.code : "EXACT_ACTION_GATEPASS_ERROR",
        message: known ? error.message : "The local exact-action GatePass demo could not complete safely.",
      },
      availableScenarios: scenarioIds,
      note: "Local reference simulation only; no real payment, settlement, email, external API, live agent, production gateway, or external action occurred.",
    }, null, 2));
    return 1;
  }
}

function parseArgs(args: readonly string[]): {
  pretty: boolean;
  summaryOnly: boolean;
  scenario?: ExactActionDemoScenarioId;
} {
  let pretty = false;
  let summaryOnly = false;
  let scenario: ExactActionDemoScenarioId | undefined;
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
        throw cliError("MISSING_SCENARIO", "--scenario requires a local exact-action scenario id.");
      }
      if (!scenarioIds.includes(value as ExactActionDemoScenarioId)) {
        throw cliError("SCENARIO_NOT_FOUND", "The requested local exact-action scenario was not found.");
      }
      scenario = value as ExactActionDemoScenarioId;
      index += 1;
      continue;
    }
    if (arg.startsWith("--")) throw cliError("UNKNOWN_OPTION", "The exact-action command contains an unsupported option.");
    throw cliError("UNEXPECTED_ARGUMENT", "The exact-action command does not accept positional input files.");
  }
  if (summaryOnly && scenario !== undefined) {
    throw cliError("UNEXPECTED_ARGUMENT", "--summary-only cannot be combined with --scenario.");
  }
  return scenario === undefined ? { pretty, summaryOnly } : { pretty, summaryOnly, scenario };
}

function selectOutput(
  pack: ExactActionDemoPack,
  options: { summaryOnly: boolean; scenario?: ExactActionDemoScenarioId },
): ExactActionDemoPack | ExactActionDemoSummary | ExactActionDemoScenario {
  if (options.scenario !== undefined) return pack.scenarios[options.scenario];
  return options.summaryOnly ? summariseExactActionGatePassDemo(pack) : pack;
}

function cliError(
  code: ExactActionGatePassCliErrorCode,
  message: string,
): ExactActionGatePassCliError {
  return new ExactActionGatePassCliError(code, message);
}

if (require.main === module) {
  void runExactActionGatePassCli(process.argv.slice(2)).then((code) => {
    process.exitCode = code;
  });
}
