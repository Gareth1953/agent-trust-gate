import { readFileSync } from "node:fs";

import { readLocalDemoInput } from "./local-demo-cli.js";
import {
  createLocalGatePassAuditReceipt,
  summariseLocalGatePassAudit,
  type LocalGatePassAuditReceipt,
} from "./local-gate-pass-receipt.js";
import {
  runLocalEndToEndMoneyGateProof,
  summariseLocalEndToEndMoneyGateProof,
} from "./local-end-to-end-money-gate-proof.js";
import { readLocalEndToEndMoneyGateProofInput } from "./local-end-to-end-money-gate-proof-cli.js";
import {
  runLocalAdversarialEvaluation,
  summariseLocalAdversarialEvaluation,
} from "./local-adversarial-evaluation.js";
import {
  verifyLocalMoneyGateProofSignature,
  verifyLocalSignedProof,
  verifyLocalTrustReceiptSignature,
  type LocalSignedProofVerificationDecision,
} from "./local-signed-proof.js";
import {
  verifyLocalTrustReceipt,
  type LocalTrustReceiptVerificationDecision,
} from "./local-trust-receipt-verifier.js";

export const DEVELOPER_CLI_VERSION = "atg.developer-cli.v1" as const;
export const DEVELOPER_CLI_RULE =
  "No mandate. No evidence. No verified intent. No signed gate pass. No settlement." as const;
export const DEVELOPER_CLI_PUBLIC_CONTACT = "gpmiddleton71@gmail.com" as const;

export type DeveloperCliErrorCode =
  | "UNKNOWN_COMMAND"
  | "UNKNOWN_OPTION"
  | "MISSING_OPTION_VALUE"
  | "INPUT_FILE_UNREADABLE"
  | "INVALID_JSON"
  | "INVALID_INPUT"
  | "DEVELOPER_CLI_ERROR";

export interface DeveloperCliIo {
  stdout: (value: string) => void;
  stderr: (value: string) => void;
}

export interface DeveloperCliSafetyFlags {
  localDemoOnly: true;
  localOnly: true;
  productionSigning: false;
  paymentAuthorisation: false;
  settlementAuthorisation: false;
  privateDataIncluded: false;
  networkCallPerformed: false;
  externalAgentContacted: false;
  paymentTriggered: false;
  settlementExecuted: false;
  actionExecuted: false;
}

export interface DeveloperCliResult extends DeveloperCliSafetyFlags {
  cliVersion: typeof DEVELOPER_CLI_VERSION;
  command: string;
  rule: typeof DEVELOPER_CLI_RULE;
  publicContactEmail: typeof DEVELOPER_CLI_PUBLIC_CONTACT;
  result: Record<string, unknown>;
  note: "Local developer CLI only; no live API, payment, settlement, external-agent contact, production signing, or action execution occurred.";
}

export interface DeveloperCliErrorResult extends DeveloperCliSafetyFlags {
  error: {
    code: DeveloperCliErrorCode;
    message: string;
  };
  availableCommands: string[];
  note: "No action, payment, settlement, network call, external-agent contact, or production signing occurred.";
}

class DeveloperCliError extends Error {
  constructor(readonly code: DeveloperCliErrorCode, message: string) {
    super(message);
    this.name = "DeveloperCliError";
  }
}

const DEFAULT_GATE_INPUT = "examples/local-demo-low-risk-allow.json";
const DEFAULT_RECEIPT_INPUT = "examples/local-receipt-signed-gate-pass.json";
const DEFAULT_MONEY_GATE_INPUT = "examples/local-end-to-end-money-gate-proof-input.json";
const DEFAULT_SIGNED_RECEIPT = "examples/local-signed-trust-receipt-valid.json";
const DEFAULT_SIGNED_PROOF = "examples/local-signed-money-gate-proof-valid.json";
const NOTE =
  "Local developer CLI only; no live API, payment, settlement, external-agent contact, production signing, or action execution occurred." as const;

const SAFETY_FLAGS: DeveloperCliSafetyFlags = {
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
};

const AVAILABLE_COMMANDS = [
  "help",
  "gate evaluate",
  "receipt verify",
  "proof money-gate",
  "proof signed",
  "demo adversarial",
  "demo quickstart",
] as const;

const defaultIo: DeveloperCliIo = {
  stdout: (value) => console.log(value),
  stderr: (value) => console.error(value),
};

export function runDeveloperCli(
  args: readonly string[],
  io: DeveloperCliIo = defaultIo,
): number {
  try {
    if (args.length === 0 || args[0] === "help" || args[0] === "--help" || args[0] === "-h") {
      io.stdout(formatHelp());
      return 0;
    }

    const [group, command, ...rest] = args;
    if (group === undefined) {
      io.stdout(formatHelp());
      return 0;
    }
    const result = runCommand(group, command, rest);
    io.stdout(JSON.stringify(result, null, 2));
    return 0;
  } catch (error) {
    const known = error instanceof DeveloperCliError;
    const result: DeveloperCliErrorResult = {
      error: {
        code: known ? error.code : "DEVELOPER_CLI_ERROR",
        message: known
          ? error.message
          : "The local developer CLI command could not complete safely.",
      },
      availableCommands: [...AVAILABLE_COMMANDS],
      note: "No action, payment, settlement, network call, external-agent contact, or production signing occurred.",
      ...SAFETY_FLAGS,
    };
    io.stderr(JSON.stringify(result, null, 2));
    return 1;
  }
}

export function formatDeveloperCliHelp(): string {
  return formatHelp();
}

function runCommand(group: string, command: string | undefined, rest: readonly string[]): DeveloperCliResult {
  const commandName = command === undefined ? group : `${group} ${command}`;
  if (group === "gate" && command === "evaluate") return runGateEvaluate(rest);
  if (group === "receipt" && command === "verify") return runReceiptVerify(rest);
  if (group === "proof" && command === "money-gate") return runProofMoneyGate(rest);
  if (group === "proof" && command === "signed") return runProofSigned(rest);
  if (group === "demo" && command === "adversarial") return runDemoAdversarial(rest);
  if (group === "demo" && command === "quickstart") return runDemoQuickstart(rest);
  throw cliError(
    "UNKNOWN_COMMAND",
    `Unknown local developer command: ${commandName}. Run "help" to see available commands.`,
  );
}

function runGateEvaluate(args: readonly string[]): DeveloperCliResult {
  const options = parseOptions(args, { input: true });
  const inputPath = options.inputPath ?? DEFAULT_GATE_INPUT;
  const input = readLocalDemoInput(inputPath);
  const receipt = createLocalGatePassAuditReceipt(input);
  const summary = summariseLocalGatePassAudit(receipt);
  return result("gate evaluate", {
    inputPath,
    requestId: summary.request_id,
    verdict: summary.verdict,
    receiptType: summary.receipt_type,
    riskTier: summary.risk_tier,
    settlementAllowedByGate: summary.settlement_allowed,
    humanReviewRequired: summary.human_review_required,
    fastPathAllowed: summary.fast_path_allowed,
    failedChecks: summary.failed_checks,
    reasonCodes: summary.reason_codes,
    gatePassExpiresAt: summary.gate_pass_expires_at,
    replayProtection: summary.replay_protection,
  });
}

function runReceiptVerify(args: readonly string[]): DeveloperCliResult {
  const options = parseOptions(args, { input: true });
  const inputPath = options.inputPath ?? DEFAULT_RECEIPT_INPUT;
  const receipt = readReceiptOrCreateFromRequest(inputPath);
  const decision = verifyLocalTrustReceipt(receipt, {
    expected_request_id: receipt.request_id,
    expected_agent_id: receipt.agent_id,
    expected_requested_action: receipt.requested_action,
    current_time: receipt.checked_at,
    require_settlement_eligibility: true,
  });
  return result("receipt verify", {
    inputPath,
    receiptId: decision.receipt_id,
    requestId: decision.request_id,
    verified: decision.verified,
    validForSimulatedSettlement: decision.valid_for_simulated_settlement,
    structurallyValid: decision.structurally_valid,
    schemaSupported: decision.schema_supported,
    internallyConsistent: decision.internally_consistent,
    fresh: decision.fresh,
    replaySafe: decision.replay_safe,
    settlementBlockerAllowed: decision.settlement_blocker_allowed,
    receiptType: decision.receipt_type,
    gateVerdict: decision.verdict,
    reasonCodes: decision.reason_codes,
    warnings: decision.warnings,
    mode: decision.mode,
  });
}

function runProofMoneyGate(args: readonly string[]): DeveloperCliResult {
  const options = parseOptions(args, { input: true });
  const inputPath = options.inputPath ?? DEFAULT_MONEY_GATE_INPUT;
  const proof = runLocalEndToEndMoneyGateProof(readLocalEndToEndMoneyGateProofInput(inputPath));
  const summary = summariseLocalEndToEndMoneyGateProof(proof);
  return result("proof money-gate", {
    inputPath,
    proofId: summary.proof_id,
    proofStatus: summary.proof_status,
    proofPassed: summary.proof_passed,
    scenarioCount: summary.scenario_count,
    controlsProven: summary.controls_proven,
    simulatedSettlementEligibleCount: summary.simulated_settlement_eligible_count,
    failureReasons: summary.failure_reasons,
    controls: summary.controls,
    localOnly: summary.local_only,
    networkCallPerformed: summary.network_call_performed,
    externalAgentContacted: summary.external_agent_contacted,
    paymentTriggered: summary.payment_triggered,
    settlementExecuted: summary.settlement_executed,
    actionExecuted: summary.action_executed,
  });
}

function runProofSigned(args: readonly string[]): DeveloperCliResult {
  const options = parseOptions(args, { input: true, kind: true });
  if (options.inputPath !== undefined) {
    const verification = verifySignedProofFile(options.inputPath, options.kind);
    return result("proof signed", {
      inputPath: options.inputPath,
      verifications: [verification],
    });
  }
  return result("proof signed", {
    verifications: [
      verifySignedProofFile(DEFAULT_SIGNED_RECEIPT, "receipt"),
      verifySignedProofFile(DEFAULT_SIGNED_PROOF, "money-gate"),
    ],
  });
}

function runDemoAdversarial(args: readonly string[]): DeveloperCliResult {
  const options = parseOptions(args, { full: true, scenario: true });
  const evaluation = runLocalAdversarialEvaluation();
  if (options.scenario !== undefined) {
    const selected = evaluation.scenarios.find(
      (scenario) =>
        scenario.scenarioId === options.scenario
        || scenario.scenarioType === options.scenario,
    );
    if (selected === undefined) {
      throw cliError("INVALID_INPUT", "The requested local adversarial scenario was not found.");
    }
    return result("demo adversarial", { scenario: selected });
  }
  const output = options.full ? evaluation : summariseLocalAdversarialEvaluation(evaluation);
  return result("demo adversarial", output as unknown as Record<string, unknown>);
}

function runDemoQuickstart(args: readonly string[]): DeveloperCliResult {
  parseOptions(args, {});
  const gate = runGateEvaluate([]).result;
  const receipt = runReceiptVerify([]).result;
  const moneyGate = runProofMoneyGate([]).result;
  const signed = runProofSigned([]).result;
  const adversarial = runDemoAdversarial([]).result;
  return result("demo quickstart", {
    steps: [
      "gate evaluate",
      "receipt verify",
      "proof money-gate",
      "proof signed",
      "demo adversarial",
    ],
    gateVerdict: gate.verdict,
    receiptVerified: receipt.verified,
    moneyGateProofPassed: moneyGate.proofPassed,
    signedProofsVerified: Array.isArray(signed.verifications)
      && signed.verifications.every((item) => isRecord(item) && item.verified === true),
    adversarialEvaluationPassed: adversarial.evaluationPassed,
    shortestUsefulCommand: "npm run cli -- demo quickstart",
  });
}

function verifySignedProofFile(
  path: string,
  kind: "receipt" | "money-gate" | undefined,
): Record<string, unknown> {
  const value = readJson(path);
  let decision: LocalSignedProofVerificationDecision;
  if (kind === "receipt") decision = verifyLocalTrustReceiptSignature(value);
  else if (kind === "money-gate") decision = verifyLocalMoneyGateProofSignature(value);
  else if (isRecord(value) && value.signedPayloadType === "local_trust_receipt") {
    decision = verifyLocalTrustReceiptSignature(value);
  } else if (isRecord(value) && value.signedPayloadType === "local_money_gate_proof") {
    decision = verifyLocalMoneyGateProofSignature(value);
  } else decision = verifyLocalSignedProof(value);

  return {
    inputPath: path,
    verified: decision.verified,
    structurallyValid: decision.structurallyValid,
    payloadHashMatches: decision.payloadHashMatches,
    signatureValid: decision.signatureValid,
    signedPayloadType: decision.signedPayloadType,
    algorithm: decision.algorithm,
    keyId: decision.keyId,
    reasonCodes: decision.reasonCodes,
    localDemoOnly: decision.localDemoOnly,
    productionSigning: decision.productionSigning,
    paymentAuthorisation: decision.paymentAuthorisation,
    settlementAuthorisation: decision.settlementAuthorisation,
  };
}

function readReceiptOrCreateFromRequest(path: string): LocalGatePassAuditReceipt {
  const value = readJson(path);
  if (isLocalReceipt(value)) return value;
  return createLocalGatePassAuditReceipt(readLocalDemoInput(path));
}

function isLocalReceipt(value: unknown): value is LocalGatePassAuditReceipt {
  return isRecord(value)
    && typeof value.receipt_id === "string"
    && typeof value.request_id === "string"
    && typeof value.agent_id === "string"
    && typeof value.requested_action === "string"
    && typeof value.checked_at === "string"
    && typeof value.receipt_type === "string"
    && typeof value.verdict === "string"
    && typeof value.allowed === "boolean"
    && typeof value.settlement_allowed === "boolean"
    && typeof value.human_review_required === "boolean"
    && Array.isArray(value.reason_codes)
    && isRecord(value.checks);
}

function parseOptions(
  args: readonly string[],
  allowed: {
    input?: boolean;
    kind?: boolean;
    full?: boolean;
    scenario?: boolean;
  },
): {
  inputPath?: string;
  kind?: "receipt" | "money-gate";
  full: boolean;
  scenario?: string;
} {
  let inputPath: string | undefined;
  let kind: "receipt" | "money-gate" | undefined;
  let full = false;
  let scenario: string | undefined;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === undefined) continue;
    if (arg === "--input") {
      if (allowed.input !== true) throw cliError("UNKNOWN_OPTION", "--input is not supported for this command.");
      inputPath = readOptionValue(args, index, "--input");
      index += 1;
      continue;
    }
    if (arg === "--kind") {
      if (allowed.kind !== true) throw cliError("UNKNOWN_OPTION", "--kind is not supported for this command.");
      const value = readOptionValue(args, index, "--kind");
      if (value !== "receipt" && value !== "money-gate") {
        throw cliError("INVALID_INPUT", "--kind must be receipt or money-gate.");
      }
      kind = value;
      index += 1;
      continue;
    }
    if (arg === "--scenario") {
      if (allowed.scenario !== true) throw cliError("UNKNOWN_OPTION", "--scenario is not supported for this command.");
      scenario = readOptionValue(args, index, "--scenario");
      index += 1;
      continue;
    }
    if (arg === "--full") {
      if (allowed.full !== true) throw cliError("UNKNOWN_OPTION", "--full is not supported for this command.");
      full = true;
      continue;
    }
    throw cliError("UNKNOWN_OPTION", `Unsupported option for local developer CLI: ${arg}.`);
  }
  const options = { full } as {
    inputPath?: string;
    kind?: "receipt" | "money-gate";
    full: boolean;
    scenario?: string;
  };
  if (inputPath !== undefined) options.inputPath = inputPath;
  if (kind !== undefined) options.kind = kind;
  if (scenario !== undefined) options.scenario = scenario;
  return options;
}

function readOptionValue(args: readonly string[], index: number, option: string): string {
  const value = args[index + 1];
  if (value === undefined || value.startsWith("--") || value.trim() === "") {
    throw cliError("MISSING_OPTION_VALUE", `${option} requires a local value.`);
  }
  return value;
}

function readJson(path: string): unknown {
  let source: string;
  try {
    source = readFileSync(path, "utf8");
  } catch {
    throw cliError("INPUT_FILE_UNREADABLE", "The local input file could not be read.");
  }
  try {
    return JSON.parse(source) as unknown;
  } catch {
    throw cliError("INVALID_JSON", "The local input file is not valid JSON.");
  }
}

function result(command: string, value: Record<string, unknown>): DeveloperCliResult {
  return {
    cliVersion: DEVELOPER_CLI_VERSION,
    command,
    rule: DEVELOPER_CLI_RULE,
    publicContactEmail: DEVELOPER_CLI_PUBLIC_CONTACT,
    result: value,
    note: NOTE,
    ...SAFETY_FLAGS,
  };
}

function formatHelp(): string {
  return [
    "Agent Trust Gate Developer CLI",
    "",
    DEVELOPER_CLI_RULE,
    "",
    "Usage:",
    "  npm run cli -- help",
    "  npm run cli -- gate evaluate [--input examples/local-demo-low-risk-allow.json]",
    "  npm run cli -- receipt verify [--input examples/local-receipt-signed-gate-pass.json]",
    "  npm run cli -- proof money-gate [--input examples/local-end-to-end-money-gate-proof-input.json]",
    "  npm run cli -- proof signed [--kind receipt|money-gate --input examples/local-signed-trust-receipt-valid.json]",
    "  npm run cli -- demo adversarial [--scenario replay_attempt] [--full]",
    "  npm run cli -- demo quickstart",
    "",
    "Commands:",
    "  gate evaluate     Evaluate a local action request and produce a gate summary.",
    "  receipt verify    Verify a local trust receipt for simulated settlement eligibility.",
    "  proof money-gate  Run the local end-to-end money-gate proof summary.",
    "  proof signed      Verify local signed receipt/proof examples.",
    "  demo adversarial  Run the local adversarial evaluation summary.",
    "  demo quickstart   Run the shortest local developer path across the core flows.",
    "",
    "Local-only boundary:",
    "  localDemoOnly=true, productionSigning=false, paymentAuthorisation=false, settlementAuthorisation=false.",
    "  No live API, payment, settlement, external-agent contact, production signing, or action execution occurs.",
    "",
    `Public contact: ${DEVELOPER_CLI_PUBLIC_CONTACT}`,
  ].join("\n");
}

function cliError(code: DeveloperCliErrorCode, message: string): DeveloperCliError {
  return new DeveloperCliError(code, message);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

if (require.main === module) {
  process.exitCode = runDeveloperCli(process.argv.slice(2));
}
