import {
  GATEPASS_CORE_EXAMPLE_FILES,
  GATEPASS_CORE_SAFETY_FLAGS,
  getGatePassCoreExample,
  runGatePassCoreDemo,
  summariseGatePassCoreDemo,
  validateGatePassCore,
  type GatePassCore,
  type GatePassCoreDemoPack,
  type GatePassCoreDemoSummary,
  type GatePassCoreExampleId,
  type GatePassCoreValidationResult,
} from "./gatepass-core.js";

export type GatePassCoreCliErrorCode =
  | "UNKNOWN_OPTION"
  | "MISSING_EXAMPLE"
  | "EXAMPLE_NOT_FOUND"
  | "UNEXPECTED_ARGUMENT"
  | "GATEPASS_CORE_ERROR";

export interface GatePassCoreCliIo {
  stdout: (value: string) => void;
  stderr: (value: string) => void;
}

class GatePassCoreCliError extends Error {
  constructor(readonly code: GatePassCoreCliErrorCode, message: string) {
    super(message);
    this.name = "GatePassCoreCliError";
  }
}

const defaultIo: GatePassCoreCliIo = {
  stdout: (value) => console.log(value),
  stderr: (value) => console.error(value),
};

export function runGatePassCoreCli(
  args: readonly string[],
  io: GatePassCoreCliIo = defaultIo,
): number {
  try {
    const options = parseArgs(args);
    const output = selectOutput(options);
    io.stdout(JSON.stringify(output, null, options.pretty ? 2 : 0));
    return 0;
  } catch (error) {
    const known = error instanceof GatePassCoreCliError;
    io.stderr(JSON.stringify({
      error: {
        code: known ? error.code : "GATEPASS_CORE_ERROR",
        message: known ? error.message : "The local GatePass core demo could not complete safely.",
      },
      availableExamples: Object.keys(GATEPASS_CORE_EXAMPLE_FILES),
      note: "No production signing, production-grade crypto, live systems contact, direct bot messaging, live agent-to-agent communication, payment, settlement, real tool execution, network call, or action execution occurred.",
      ...GATEPASS_CORE_SAFETY_FLAGS,
    }, null, 2));
    return 1;
  }
}

function parseArgs(args: readonly string[]): {
  pretty: boolean;
  summaryOnly: boolean;
  example?: GatePassCoreExampleId;
  resultOnly: boolean;
} {
  let pretty = false;
  let summaryOnly = false;
  let example: GatePassCoreExampleId | undefined;
  let resultOnly = false;
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
    if (arg === "--result-only") {
      resultOnly = true;
      continue;
    }
    if (arg === "--example") {
      const value = args[index + 1];
      if (value === undefined || value.startsWith("--")) {
        throw cliError("MISSING_EXAMPLE", "--example requires a local GatePass example id.");
      }
      example = parseExample(value);
      index += 1;
      continue;
    }
    if (arg.startsWith("--")) {
      throw cliError("UNKNOWN_OPTION", "The GatePass core command contains an unsupported option.");
    }
    throw cliError("UNEXPECTED_ARGUMENT", "The GatePass core command does not accept positional input files.");
  }
  if (summaryOnly && example !== undefined) {
    throw cliError("UNEXPECTED_ARGUMENT", "--summary-only cannot be combined with --example.");
  }
  const options = { pretty, summaryOnly, resultOnly } as {
    pretty: boolean;
    summaryOnly: boolean;
    example?: GatePassCoreExampleId;
    resultOnly: boolean;
  };
  if (example !== undefined) options.example = example;
  return options;
}

function selectOutput(options: {
  summaryOnly: boolean;
  example?: GatePassCoreExampleId;
  resultOnly: boolean;
}): GatePassCoreDemoPack | GatePassCoreDemoSummary | GatePassCore | GatePassCoreValidationResult {
  if (options.example !== undefined) {
    const gatePass = getGatePassCoreExample(options.example);
    return options.resultOnly ? validateGatePassCore(gatePass) : gatePass;
  }
  const pack = runGatePassCoreDemo();
  return options.summaryOnly ? summariseGatePassCoreDemo(pack) : pack;
}

function parseExample(value: string): GatePassCoreExampleId {
  if (Object.hasOwn(GATEPASS_CORE_EXAMPLE_FILES, value)) return value as GatePassCoreExampleId;
  throw cliError("EXAMPLE_NOT_FOUND", "The requested local GatePass core example was not found.");
}

function cliError(code: GatePassCoreCliErrorCode, message: string): GatePassCoreCliError {
  return new GatePassCoreCliError(code, message);
}

if (require.main === module) {
  process.exitCode = runGatePassCoreCli(process.argv.slice(2));
}
