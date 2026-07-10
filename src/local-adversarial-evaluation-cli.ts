import {
  runLocalAdversarialEvaluation,
  summariseLocalAdversarialEvaluation,
  type LocalAdversarialEvaluationResult,
  type LocalAdversarialScenarioResult,
} from "./local-adversarial-evaluation.js";

export type LocalAdversarialEvaluationCliErrorCode =
  | "UNKNOWN_OPTION"
  | "MISSING_SCENARIO"
  | "SCENARIO_NOT_FOUND"
  | "UNEXPECTED_ARGUMENT"
  | "ADVERSARIAL_EVALUATION_ERROR";

export interface LocalAdversarialEvaluationCliIo {
  stdout: (value: string) => void;
  stderr: (value: string) => void;
}

class LocalAdversarialEvaluationCliError extends Error {
  constructor(readonly code: LocalAdversarialEvaluationCliErrorCode, message: string) {
    super(message);
    this.name = "LocalAdversarialEvaluationCliError";
  }
}

const defaultIo: LocalAdversarialEvaluationCliIo = {
  stdout: (value) => console.log(value),
  stderr: (value) => console.error(value),
};

export function runLocalAdversarialEvaluationCli(
  args: readonly string[],
  io: LocalAdversarialEvaluationCliIo = defaultIo,
): number {
  try {
    const options = parseArgs(args);
    const result = runLocalAdversarialEvaluation();
    const output = selectOutput(result, options);
    io.stdout(JSON.stringify(output, null, options.pretty ? 2 : 0));
    return result.evaluationPassed ? 0 : 2;
  } catch (error) {
    const known = error instanceof LocalAdversarialEvaluationCliError;
    io.stderr(JSON.stringify({
      error: {
        code: known ? error.code : "ADVERSARIAL_EVALUATION_ERROR",
        message: known
          ? error.message
          : "The local adversarial evaluation could not complete safely.",
      },
      localDemoOnly: true,
      localOnly: true,
      productionSigning: false,
      paymentAuthorisation: false,
      settlementAuthorisation: false,
      privateDataIncluded: false,
      networkCallPerformed: false,
      externalAgentContacted: false,
      paymentTriggered: false,
      settlementExecuted: false,
      actionExecuted: false,
    }, null, 2));
    return 1;
  }
}

function parseArgs(args: readonly string[]): {
  pretty: boolean;
  summaryOnly: boolean;
  scenario?: string;
} {
  let pretty = false;
  let summaryOnly = false;
  let scenario: string | undefined;
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
        throw cliError("MISSING_SCENARIO", "--scenario requires a local scenario id or type.");
      }
      if (scenario !== undefined) {
        throw cliError("UNEXPECTED_ARGUMENT", "Only one local adversarial scenario may be selected.");
      }
      scenario = value;
      index += 1;
      continue;
    }
    if (arg.startsWith("--")) {
      throw cliError("UNKNOWN_OPTION", "The local adversarial command contains an unsupported option.");
    }
    throw cliError("UNEXPECTED_ARGUMENT", "The local adversarial command does not accept positional input files.");
  }
  if (summaryOnly && scenario !== undefined) {
    throw cliError("UNEXPECTED_ARGUMENT", "--summary-only cannot be combined with --scenario.");
  }
  return scenario === undefined
    ? { pretty, summaryOnly }
    : { pretty, summaryOnly, scenario };
}

function selectOutput(
  result: LocalAdversarialEvaluationResult,
  options: { summaryOnly: boolean; scenario?: string },
): LocalAdversarialEvaluationResult | ReturnType<typeof summariseLocalAdversarialEvaluation> | LocalAdversarialScenarioResult {
  if (options.summaryOnly) return summariseLocalAdversarialEvaluation(result);
  if (options.scenario === undefined) return result;
  const selected = result.scenarios.find(
    (scenario) =>
      scenario.scenarioId === options.scenario
      || scenario.scenarioType === options.scenario,
  );
  if (selected === undefined) {
    throw cliError("SCENARIO_NOT_FOUND", "The requested local adversarial scenario was not found.");
  }
  return selected;
}

function cliError(
  code: LocalAdversarialEvaluationCliErrorCode,
  message: string,
): LocalAdversarialEvaluationCliError {
  return new LocalAdversarialEvaluationCliError(code, message);
}

if (require.main === module) {
  process.exitCode = runLocalAdversarialEvaluationCli(process.argv.slice(2));
}
