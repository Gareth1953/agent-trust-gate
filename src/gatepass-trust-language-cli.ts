import {
  buildAgentTrustStatement,
  classifyTrustLanguagePhrase,
  explainTrustLanguageBoundary,
  GATEPASS_TRUST_LANGUAGE_SAFETY_FLAGS,
  getGatePassTrustVocabulary,
  summariseGatePassTrustVocabulary,
  type BuiltAgentTrustStatement,
  type GatePassTrustLanguageSafetyFlags,
  type GatePassTrustPhraseClassification,
  type GatePassTrustVocabularyPack,
  type GatePassTrustVocabularySummary,
} from "./gatepass-trust-language.js";

export type GatePassTrustLanguageCliErrorCode =
  | "UNKNOWN_OPTION"
  | "MISSING_PHRASE"
  | "UNEXPECTED_ARGUMENT"
  | "GATEPASS_TRUST_LANGUAGE_ERROR";

export interface GatePassTrustLanguageCliIo {
  stdout: (value: string) => void;
  stderr: (value: string) => void;
}

interface GatePassTrustLanguageBoundaryOutput extends GatePassTrustLanguageSafetyFlags {
  boundary: string;
}

class GatePassTrustLanguageCliError extends Error {
  constructor(readonly code: GatePassTrustLanguageCliErrorCode, message: string) {
    super(message);
    this.name = "GatePassTrustLanguageCliError";
  }
}

const defaultIo: GatePassTrustLanguageCliIo = {
  stdout: (value) => console.log(value),
  stderr: (value) => console.error(value),
};

export function runGatePassTrustLanguageCli(
  args: readonly string[],
  io: GatePassTrustLanguageCliIo = defaultIo,
): number {
  try {
    const options = parseArgs(args);
    const output = selectOutput(options);
    io.stdout(JSON.stringify(output, null, options.pretty ? 2 : 0));
    return 0;
  } catch (error) {
    const known = error instanceof GatePassTrustLanguageCliError;
    io.stderr(JSON.stringify({
      error: {
        code: known ? error.code : "GATEPASS_TRUST_LANGUAGE_ERROR",
        message: known ? error.message : "The local GatePass Trust Language demo could not complete safely.",
      },
      note: "No live systems contact, direct bot messaging, live agent-to-agent communication, autonomous marketing, hidden viral distribution, guaranteed trust, production certification, payment, settlement, real tool execution, or action execution occurred.",
      ...GATEPASS_TRUST_LANGUAGE_SAFETY_FLAGS,
    }, null, 2));
    return 1;
  }
}

function parseArgs(args: readonly string[]): {
  pretty: boolean;
  summaryOnly: boolean;
  phrase?: string;
  statement: boolean;
  boundary: boolean;
} {
  let pretty = false;
  let summaryOnly = false;
  let phrase: string | undefined;
  let statement = false;
  let boundary = false;
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
    if (arg === "--statement") {
      statement = true;
      continue;
    }
    if (arg === "--boundary") {
      boundary = true;
      continue;
    }
    if (arg === "--phrase") {
      const value = args[index + 1];
      if (value === undefined || value.startsWith("--")) {
        throw cliError("MISSING_PHRASE", "--phrase requires a local phrase string.");
      }
      phrase = value;
      index += 1;
      continue;
    }
    if (arg.startsWith("--")) {
      throw cliError("UNKNOWN_OPTION", "The GatePass Trust Language command contains an unsupported option.");
    }
    throw cliError("UNEXPECTED_ARGUMENT", "The GatePass Trust Language command does not accept positional input files.");
  }
  const selectedModes = [summaryOnly, phrase !== undefined, statement, boundary].filter(Boolean).length;
  if (selectedModes > 1) {
    throw cliError("UNEXPECTED_ARGUMENT", "Choose only one of --summary-only, --phrase, --statement, or --boundary.");
  }
  const options = { pretty, summaryOnly, statement, boundary } as {
    pretty: boolean;
    summaryOnly: boolean;
    phrase?: string;
    statement: boolean;
    boundary: boolean;
  };
  if (phrase !== undefined) options.phrase = phrase;
  return options;
}

function selectOutput(options: {
  summaryOnly: boolean;
  phrase?: string;
  statement: boolean;
  boundary: boolean;
}): GatePassTrustVocabularyPack
  | GatePassTrustVocabularySummary
  | GatePassTrustPhraseClassification
  | BuiltAgentTrustStatement
  | GatePassTrustLanguageBoundaryOutput {
  if (options.phrase !== undefined) return classifyTrustLanguagePhrase(options.phrase);
  if (options.statement) {
    return buildAgentTrustStatement({
      agentSubject: "local-demo-agent",
      requestedAction: "publish_public_post",
      scope: "public-post-draft-only",
      proofStatus: "proof_present",
      mandateReference: "local-mandate-demo-001",
      evidenceReference: "local-evidence-demo-001",
      intentStatus: "verified_intent",
      approvalStatus: "approval_present",
      gatePassStatus: "fresh_signed_gatepass",
      issuedAt: "2026-07-12T09:00:00.000Z",
      expiresAt: "2026-07-12T09:10:00.000Z",
      localDemoOnly: true,
    });
  }
  if (options.boundary) {
    return {
      boundary: explainTrustLanguageBoundary(),
      ...GATEPASS_TRUST_LANGUAGE_SAFETY_FLAGS,
    };
  }
  const pack = getGatePassTrustVocabulary();
  return options.summaryOnly ? summariseGatePassTrustVocabulary(pack) : pack;
}

function cliError(
  code: GatePassTrustLanguageCliErrorCode,
  message: string,
): GatePassTrustLanguageCliError {
  return new GatePassTrustLanguageCliError(code, message);
}

if (require.main === module) {
  process.exitCode = runGatePassTrustLanguageCli(process.argv.slice(2));
}
