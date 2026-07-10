import {
  runReferenceIntegrationExamples,
  runReferenceIntegrationPattern,
  summariseReferenceIntegrationExamples,
  type ReferenceIntegrationPack,
  type ReferenceIntegrationPackSummary,
  type ReferenceIntegrationPatternId,
  type ReferenceIntegrationResult,
} from "./reference-integrations/index.js";
import {
  REFERENCE_INTEGRATION_EXAMPLE_FILES,
  REFERENCE_SAFETY_FLAGS,
} from "./reference-integrations/shared.js";

export type ReferenceIntegrationsCliErrorCode =
  | "UNKNOWN_OPTION"
  | "MISSING_PATTERN"
  | "PATTERN_NOT_FOUND"
  | "UNEXPECTED_ARGUMENT"
  | "REFERENCE_INTEGRATIONS_ERROR";

export interface ReferenceIntegrationsCliIo {
  stdout: (value: string) => void;
  stderr: (value: string) => void;
}

class ReferenceIntegrationsCliError extends Error {
  constructor(readonly code: ReferenceIntegrationsCliErrorCode, message: string) {
    super(message);
    this.name = "ReferenceIntegrationsCliError";
  }
}

const defaultIo: ReferenceIntegrationsCliIo = {
  stdout: (value) => console.log(value),
  stderr: (value) => console.error(value),
};

export function runReferenceIntegrationsCli(
  args: readonly string[],
  io: ReferenceIntegrationsCliIo = defaultIo,
): number {
  try {
    const options = parseArgs(args);
    const output = selectOutput(options);
    io.stdout(JSON.stringify(output, null, options.pretty ? 2 : 0));
    return 0;
  } catch (error) {
    const known = error instanceof ReferenceIntegrationsCliError;
    io.stderr(JSON.stringify({
      error: {
        code: known ? error.code : "REFERENCE_INTEGRATIONS_ERROR",
        message: known
          ? error.message
          : "The local reference integration examples could not complete safely.",
      },
      availablePatterns: Object.keys(REFERENCE_INTEGRATION_EXAMPLE_FILES),
      note: "No framework adapter, action, payment, settlement, network call, external-agent contact, or production signing occurred.",
      ...REFERENCE_SAFETY_FLAGS,
    }, null, 2));
    return 1;
  }
}

function parseArgs(args: readonly string[]): {
  pretty: boolean;
  summaryOnly: boolean;
  pattern?: ReferenceIntegrationPatternId;
} {
  let pretty = false;
  let summaryOnly = false;
  let pattern: ReferenceIntegrationPatternId | undefined;
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
    if (arg === "--pattern") {
      const value = args[index + 1];
      if (value === undefined || value.startsWith("--")) {
        throw cliError("MISSING_PATTERN", "--pattern requires a local reference pattern id.");
      }
      pattern = parsePattern(value);
      index += 1;
      continue;
    }
    if (arg.startsWith("--")) {
      throw cliError("UNKNOWN_OPTION", "The reference integrations command contains an unsupported option.");
    }
    throw cliError("UNEXPECTED_ARGUMENT", "The reference integrations command does not accept positional input files.");
  }
  if (summaryOnly && pattern !== undefined) {
    throw cliError("UNEXPECTED_ARGUMENT", "--summary-only cannot be combined with --pattern.");
  }
  const options = { pretty, summaryOnly } as {
    pretty: boolean;
    summaryOnly: boolean;
    pattern?: ReferenceIntegrationPatternId;
  };
  if (pattern !== undefined) options.pattern = pattern;
  return options;
}

function selectOutput(options: {
  summaryOnly: boolean;
  pattern?: ReferenceIntegrationPatternId;
}): ReferenceIntegrationPack | ReferenceIntegrationPackSummary | ReferenceIntegrationResult {
  if (options.pattern !== undefined) return runReferenceIntegrationPattern(options.pattern);
  const pack = runReferenceIntegrationExamples();
  return options.summaryOnly ? summariseReferenceIntegrationExamples(pack) : pack;
}

function parsePattern(value: string): ReferenceIntegrationPatternId {
  if (Object.hasOwn(REFERENCE_INTEGRATION_EXAMPLE_FILES, value)) {
    return value as ReferenceIntegrationPatternId;
  }
  throw cliError("PATTERN_NOT_FOUND", "The requested local reference integration pattern was not found.");
}

function cliError(
  code: ReferenceIntegrationsCliErrorCode,
  message: string,
): ReferenceIntegrationsCliError {
  return new ReferenceIntegrationsCliError(code, message);
}

if (require.main === module) {
  process.exitCode = runReferenceIntegrationsCli(process.argv.slice(2));
}
