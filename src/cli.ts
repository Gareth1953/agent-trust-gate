import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { auditReceipts, listReceipts } from "./receipt-audit.js";
import { verifyBeforeAction } from "./verify-before-action.js";
import type { VerifyBeforeActionInput } from "./types.js";

const USAGE =
  "Usage: npm run verify -- <path-to-action.json> [--save] [--json] [--fail-on-block] [--policy standard|strict|regulated]\n       npm run verify -- --audit [--json]\n       npm run verify -- --list-receipts [--json]";

export function runCli(args: string[]): number {
  const jsonMode = args.includes("--json");
  const failOnBlock = args.includes("--fail-on-block");

  if (args.includes("--audit")) {
    console.log(JSON.stringify(auditReceipts(), null, 2));
    return 0;
  }

  if (args.includes("--list-receipts")) {
    console.log(JSON.stringify(listReceipts(), null, 2));
    return 0;
  }

  const saveReceipt = args.includes("--save");
  const parsedArgs = parseVerificationArgs(args);
  if (parsedArgs.error !== undefined) {
    printError(parsedArgs.errorCode ?? "CLI_ARGUMENT_ERROR", parsedArgs.error, jsonMode);
    return 1;
  }

  const { filePath, policyProfile } = parsedArgs;

  if (filePath === undefined || filePath.trim().length === 0) {
    printError("MISSING_ACTION_FILE", USAGE, jsonMode);
    return 1;
  }

  let fileContents: string;
  try {
    fileContents = readFileSync(filePath, "utf8");
  } catch (error) {
    printError(
      "ACTION_FILE_READ_ERROR",
      `Unable to read action file "${filePath}": ${errorMessage(error)}`,
      jsonMode,
    );
    return 1;
  }

  let input: unknown;
  try {
    input = JSON.parse(fileContents);
  } catch (error) {
    printError(
      "INVALID_ACTION_JSON",
      `Invalid JSON in action file "${filePath}": ${errorMessage(error)}`,
      jsonMode,
    );
    return 1;
  }

  try {
    const receipt = verifyBeforeAction(
      input as VerifyBeforeActionInput,
      policyProfile === undefined ? {} : { policy_profile: policyProfile },
    );
    let receiptPath: string | undefined;
    if (saveReceipt) {
      receiptPath = saveReceiptToArchive(receipt);
      if (!jsonMode) {
        console.error(`Saved receipt to ${receiptPath}`);
      }
    }

    if (jsonMode) {
      console.log(JSON.stringify(toIntegrationResult(receipt, receiptPath), null, 2));
    } else {
      console.log(JSON.stringify(receipt, null, 2));
    }

    return failOnBlock && !receipt.allowed ? 2 : 0;
  } catch (error) {
    printError(errorCode(error), `Unable to verify action: ${errorMessage(error)}`, jsonMode);
    return 1;
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function errorCode(error: unknown): string {
  const message = errorMessage(error);
  if (message.includes("Unknown policy profile")) {
    return "UNKNOWN_POLICY_PROFILE";
  }
  return "VERIFY_ACTION_ERROR";
}

function printError(code: string, message: string, jsonMode: boolean): void {
  if (jsonMode) {
    console.log(
      JSON.stringify(
        {
          ok: false,
          error: {
            code,
            message,
          },
        },
        null,
        2,
      ),
    );
    return;
  }

  console.error(message);
  if (code === "CLI_ARGUMENT_ERROR") {
    console.error(USAGE);
  }
}

function toIntegrationResult(
  receipt: ReturnType<typeof verifyBeforeAction>,
  receiptPath?: string,
) {
  const result: {
    ok: true;
    allowed: boolean;
    risk_level: string;
    human_approval_required: boolean;
    action_type: string;
    actor: string;
    target: string;
    policy_profile: string;
    regulated_policy: boolean;
    approval_reason: string | null;
    reasons: string[];
    receipt_id: string;
    receipt_saved: boolean;
    receipt_path?: string;
    timestamp: string;
    checked_at: string;
  } = {
    ok: true,
    allowed: receipt.allowed,
    risk_level: receipt.risk_level,
    human_approval_required: receipt.human_approval_required,
    action_type: receipt.input_summary.action_type,
    actor: receipt.input_summary.actor,
    target: receipt.input_summary.target,
    policy_profile: receipt.policy_profile,
    regulated_policy: receipt.regulated_policy,
    approval_reason: receipt.approval_reason,
    reasons: receipt.approval_reason === null ? [] : [receipt.approval_reason],
    receipt_id: receipt.receipt_id,
    receipt_saved: receiptPath !== undefined,
    timestamp: receipt.timestamp,
    checked_at: receipt.timestamp,
  };

  if (receiptPath !== undefined) {
    result.receipt_path = receiptPath;
  }

  return result;
}

function parseVerificationArgs(args: string[]): {
  filePath?: string;
  policyProfile?: string;
  error?: string;
  errorCode?: string;
} {
  let filePath: string | undefined;
  let policyProfile: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--save" || arg === "--json" || arg === "--fail-on-block") {
      continue;
    }

    if (arg === "--policy") {
      const value = args[index + 1];
      if (value === undefined || value.startsWith("--")) {
        return {
          error: "Missing policy profile after --policy.",
          errorCode: "MISSING_POLICY_PROFILE",
        };
      }
      policyProfile = value;
      index += 1;
      continue;
    }

    if (arg?.startsWith("--")) {
      return { error: `Unknown option "${arg}".`, errorCode: "UNKNOWN_CLI_OPTION" };
    }

    if (filePath !== undefined) {
      return {
        error: `Unexpected extra argument "${arg}".`,
        errorCode: "UNEXPECTED_ARGUMENT",
      };
    }

    filePath = arg;
  }

  const result: {
    filePath?: string;
    policyProfile?: string;
  } = {};

  if (filePath !== undefined) {
    result.filePath = filePath;
  }

  if (policyProfile !== undefined) {
    result.policyProfile = policyProfile;
  }

  return result;
}

function saveReceiptToArchive(receipt: ReturnType<typeof verifyBeforeAction>): string {
  const archiveDirectory = "receipts";
  mkdirSync(archiveDirectory, { recursive: true });

  const safeTimestamp = receipt.timestamp.replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const fileName = `${safeTimestamp}_${receipt.receipt_id}.json`;
  const archivePath = join(archiveDirectory, fileName);

  writeFileSync(archivePath, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  return archivePath;
}

if (require.main === module) {
  process.exitCode = runCli(process.argv.slice(2));
}
