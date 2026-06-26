import { readFileSync } from "node:fs";

import { ActionValidationError } from "./action-validation.js";
import {
  createApprovalPack,
  formatApprovalPackForConsole,
  saveApprovalPackToArchive,
} from "./approval-pack.js";
import { BatchDirectoryError, reviewBatch } from "./batch-review.js";
import {
  CONTRACT_VERSION,
  formatContractForConsole,
  getContractDescription,
} from "./contract.js";
import { auditReceipts, listReceipts } from "./receipt-audit.js";
import { saveReceiptToArchive } from "./receipt-archive.js";
import { verifyBeforeAction } from "./verify-before-action.js";
import {
  createHumanReviewRecord,
  formatHumanReviewRecordForConsole,
  HumanReviewError,
  saveHumanReviewRecord,
  withReviewRecordSaveStatus,
} from "./human-review.js";
import type { VerifyBeforeActionInput } from "./types.js";

const USAGE =
  "Usage: npm run verify -- <path-to-action.json> [--save] [--approval-pack] [--save-approval-pack] [--json] [--fail-on-block] [--policy standard|strict|regulated]\n       npm run verify -- --review-approval-pack <approval-pack.json> --decision approved|rejected|needs_more_info --reviewer <name> [--review-note <note>] [--save-review-record] [--json]\n       npm run verify -- --batch <directory> [--save] [--approval-pack] [--json] [--fail-on-block] [--policy standard|strict|regulated]\n       npm run verify -- --audit [--json]\n       npm run verify -- --list-receipts [--json]\n       npm run verify -- --contract [--json]";

export function runCli(args: string[]): number {
  const jsonMode = args.includes("--json");
  const failOnBlock = args.includes("--fail-on-block");

  if (args.includes("--contract")) {
    if (jsonMode) {
      console.log(JSON.stringify(getContractDescription(), null, 2));
    } else {
      console.log(formatContractForConsole());
    }
    return 0;
  }

  if (args.includes("--audit")) {
    console.log(JSON.stringify(auditReceipts(), null, 2));
    return 0;
  }

  if (args.includes("--list-receipts")) {
    console.log(JSON.stringify(listReceipts(), null, 2));
    return 0;
  }

  if (args.includes("--review-approval-pack")) {
    if (args.includes("--batch")) {
      printError(
        "UNSUPPORTED_REVIEW_MODE",
        "Batch human review decisions are not supported. Review one approval pack at a time.",
        jsonMode,
      );
      return 1;
    }

    return runHumanReviewMode(args, jsonMode);
  }

  if (args.includes("--batch")) {
    return runBatchMode(args, jsonMode, failOnBlock);
  }

  const saveReceipt = args.includes("--save");
  const approvalPackRequested = args.includes("--approval-pack");
  const saveApprovalPack = args.includes("--save-approval-pack");
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

    if (approvalPackRequested) {
      const approvalPack = createApprovalPack(receipt);
      const approvalPackPath = saveApprovalPack
        ? saveApprovalPackToArchive(approvalPack)
        : undefined;

      if (jsonMode) {
        console.log(
          JSON.stringify(
            toApprovalPackResult(approvalPack, approvalPackPath),
            null,
            2,
          ),
        );
      } else {
        console.log(formatApprovalPackForConsole(approvalPack, approvalPackPath));
      }

      return failOnBlock && !receipt.allowed ? 2 : 0;
    }

    if (jsonMode) {
      console.log(JSON.stringify(toIntegrationResult(receipt, receiptPath), null, 2));
    } else {
      console.log(JSON.stringify(receipt, null, 2));
    }

    return failOnBlock && !receipt.allowed ? 2 : 0;
  } catch (error) {
    printError(
      errorCode(error),
      `Unable to verify action: ${errorMessage(error)}`,
      jsonMode,
      error instanceof ActionValidationError ? error.details : undefined,
    );
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
  if (error instanceof HumanReviewError) {
    return error.code;
  }
  if (error instanceof ActionValidationError) {
    return "INVALID_ACTION_DESCRIPTOR";
  }
  return "VERIFY_ACTION_ERROR";
}

function printError(
  code: string,
  message: string,
  jsonMode: boolean,
  details?: unknown[],
): void {
  if (jsonMode) {
    const errorOutput: {
      ok: false;
      contract_version: string;
      error: {
        code: string;
        message: string;
        details?: unknown[];
      };
    } = {
      ok: false,
      contract_version: CONTRACT_VERSION,
      error: {
        code,
        message,
      },
    };

    if (details !== undefined) {
      errorOutput.error.details = details;
    }

    console.log(JSON.stringify(errorOutput, null, 2));
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
    contract_version: string;
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
    contract_version: receipt.contract_version,
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

    if (
      arg === "--save" ||
      arg === "--approval-pack" ||
      arg === "--save-approval-pack" ||
      arg === "--json" ||
      arg === "--fail-on-block" ||
      arg === "--contract"
    ) {
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

function runBatchMode(args: string[], jsonMode: boolean, failOnBlock: boolean): number {
  const parsedArgs = parseBatchArgs(args);
  if (parsedArgs.error !== undefined) {
    printError(parsedArgs.errorCode ?? "CLI_ARGUMENT_ERROR", parsedArgs.error, jsonMode);
    return 1;
  }

  try {
    const result = reviewBatch(parsedArgs.batchDirectory, {
      ...(parsedArgs.policyProfile === undefined
        ? {}
        : { policy_profile: parsedArgs.policyProfile }),
      save_receipts: args.includes("--save"),
      include_approval_pack: args.includes("--approval-pack"),
    });

    if (jsonMode) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(formatBatchForConsole(result));
    }

    return failOnBlock && result.summary.blocked_count > 0 ? 2 : 0;
  } catch (error) {
    printError(batchErrorCode(error), errorMessage(error), jsonMode);
    return 1;
  }
}

function runHumanReviewMode(args: string[], jsonMode: boolean): number {
  const parsedArgs = parseHumanReviewArgs(args);
  if (parsedArgs.error !== undefined) {
    printError(
      parsedArgs.errorCode ?? "INVALID_HUMAN_REVIEW",
      parsedArgs.error,
      jsonMode,
      parsedArgs.details,
    );
    return 1;
  }

  try {
    const reviewRecord = createHumanReviewRecord({
      approval_pack_path: parsedArgs.approvalPackPath,
      decision: parsedArgs.decision,
      reviewer: parsedArgs.reviewer,
      ...(parsedArgs.reviewNote === undefined ? {} : { review_note: parsedArgs.reviewNote }),
    });
    const reviewRecordPath = args.includes("--save-review-record")
      ? saveHumanReviewRecord(reviewRecord)
      : undefined;

    if (jsonMode) {
      console.log(
        JSON.stringify(withReviewRecordSaveStatus(reviewRecord, reviewRecordPath), null, 2),
      );
    } else {
      console.log(formatHumanReviewRecordForConsole(reviewRecord, reviewRecordPath));
    }

    return 0;
  } catch (error) {
    printError(
      errorCode(error),
      errorMessage(error),
      jsonMode,
      error instanceof HumanReviewError ? error.details : undefined,
    );
    return 1;
  }
}

function parseHumanReviewArgs(args: string[]): {
  approvalPackPath: string;
  decision: string;
  reviewer: string;
  reviewNote?: string;
  error?: string;
  errorCode?: string;
  details?: Array<{ field: string; issue: string }>;
} {
  let approvalPackPath: string | undefined;
  let decision: string | undefined;
  let reviewer: string | undefined;
  let reviewNote: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--json" || arg === "--save-review-record") {
      continue;
    }

    if (arg === "--review-approval-pack") {
      const value = args[index + 1];
      if (value === undefined || value.startsWith("--")) {
        return humanReviewArgError("approval_pack_path", "--review-approval-pack is required.");
      }
      approvalPackPath = value;
      index += 1;
      continue;
    }

    if (arg === "--decision") {
      const value = args[index + 1];
      if (value === undefined || value.startsWith("--")) {
        return humanReviewArgError("decision", "--decision is required.");
      }
      decision = value;
      index += 1;
      continue;
    }

    if (arg === "--reviewer") {
      const value = args[index + 1];
      if (value === undefined || value.startsWith("--")) {
        return humanReviewArgError("reviewer", "--reviewer is required.");
      }
      reviewer = value;
      index += 1;
      continue;
    }

    if (arg === "--review-note") {
      const value = args[index + 1];
      if (value === undefined || value.startsWith("--")) {
        return humanReviewArgError("review_note", "--review-note requires a value.");
      }
      reviewNote = value;
      index += 1;
      continue;
    }

    if (arg?.startsWith("--")) {
      return humanReviewArgError("argument", `Unknown option "${arg}".`);
    }

    return humanReviewArgError("argument", `Unexpected extra argument "${arg}".`);
  }

  const details: Array<{ field: string; issue: string }> = [];
  if (approvalPackPath === undefined || approvalPackPath.trim().length === 0) {
    details.push({
      field: "approval_pack_path",
      issue: "--review-approval-pack is required.",
    });
  }
  if (decision === undefined || decision.trim().length === 0) {
    details.push({ field: "decision", issue: "--decision is required." });
  }
  if (reviewer === undefined || reviewer.trim().length === 0) {
    details.push({ field: "reviewer", issue: "--reviewer is required and must be non-empty." });
  }

  if (details.length > 0) {
    return {
      approvalPackPath: "",
      decision: "",
      reviewer: "",
      error: "Invalid human review input.",
      errorCode: "INVALID_HUMAN_REVIEW",
      details,
    };
  }

  const validApprovalPackPath = approvalPackPath!;
  const validDecision = decision!;
  const validReviewer = reviewer!;

  return reviewNote === undefined
    ? {
        approvalPackPath: validApprovalPackPath,
        decision: validDecision,
        reviewer: validReviewer,
      }
    : {
        approvalPackPath: validApprovalPackPath,
        decision: validDecision,
        reviewer: validReviewer,
        reviewNote,
      };
}

function humanReviewArgError(field: string, issue: string) {
  return {
    approvalPackPath: "",
    decision: "",
    reviewer: "",
    error: issue,
    errorCode: "INVALID_HUMAN_REVIEW",
    details: [{ field, issue }],
  };
}

function parseBatchArgs(args: string[]): {
  batchDirectory: string;
  policyProfile?: string;
  error?: string;
  errorCode?: string;
} {
  let batchDirectory: string | undefined;
  let policyProfile: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (
      arg === "--json" ||
      arg === "--fail-on-block" ||
      arg === "--save" ||
      arg === "--approval-pack"
    ) {
      continue;
    }

    if (arg === "--batch") {
      const value = args[index + 1];
      if (value === undefined || value.startsWith("--")) {
        return {
          batchDirectory: "",
          error: "Missing batch directory after --batch.",
          errorCode: "MISSING_BATCH_DIRECTORY",
        };
      }
      batchDirectory = value;
      index += 1;
      continue;
    }

    if (arg === "--policy") {
      const value = args[index + 1];
      if (value === undefined || value.startsWith("--")) {
        return {
          batchDirectory: "",
          error: "Missing policy profile after --policy.",
          errorCode: "MISSING_POLICY_PROFILE",
        };
      }
      policyProfile = value;
      index += 1;
      continue;
    }

    if (arg?.startsWith("--")) {
      return {
        batchDirectory: "",
        error: `Unknown option "${arg}".`,
        errorCode: "UNKNOWN_CLI_OPTION",
      };
    }

    return {
      batchDirectory: "",
      error: `Unexpected extra argument "${arg}".`,
      errorCode: "UNEXPECTED_ARGUMENT",
    };
  }

  if (batchDirectory === undefined) {
    return {
      batchDirectory: "",
      error: "Missing batch directory after --batch.",
      errorCode: "MISSING_BATCH_DIRECTORY",
    };
  }

  return policyProfile === undefined
    ? { batchDirectory }
    : { batchDirectory, policyProfile };
}

function toApprovalPackResult(
  approvalPack: ReturnType<typeof createApprovalPack>,
  approvalPackPath?: string,
) {
  const result: ReturnType<typeof createApprovalPack> & {
    approval_pack_saved: boolean;
    approval_pack_path?: string;
  } = {
    ...approvalPack,
    approval_pack_saved: approvalPackPath !== undefined,
  };

  if (approvalPackPath !== undefined) {
    result.approval_pack_path = approvalPackPath;
  }

  return result;
}

function formatBatchForConsole(result: ReturnType<typeof reviewBatch>): string {
  return [
    `Batch preflight review: ${result.batch_directory}`,
    `contract_version: ${result.contract_version}`,
    "",
    "Summary:",
    `- total_files: ${result.summary.total_files}`,
    `- valid_actions: ${result.summary.valid_actions}`,
    `- invalid_actions: ${result.summary.invalid_actions}`,
    `- malformed_json_count: ${result.summary.malformed_json_count}`,
    `- allowed_count: ${result.summary.allowed_count}`,
    `- blocked_count: ${result.summary.blocked_count}`,
    `- approval_required_count: ${result.summary.approval_required_count}`,
    `- high_risk_count: ${result.summary.high_risk_count}`,
    `- medium_risk_count: ${result.summary.medium_risk_count}`,
    `- low_risk_count: ${result.summary.low_risk_count}`,
    "",
    "Results:",
    ...result.results.map((entry) => {
      if (entry.status === "valid") {
        return `- ${entry.filename}: ${entry.allowed ? "allowed" : "blocked"} (${entry.risk_level}, policy=${entry.policy_profile})`;
      }

      return `- ${entry.filename}: ${entry.status} (${entry.error?.code ?? "ERROR"})`;
    }),
    "",
    "Batch review does not execute actions.",
  ].join("\n");
}

function batchErrorCode(error: unknown): string {
  const message = errorMessage(error);
  if (error instanceof BatchDirectoryError) {
    return error.code;
  }
  if (message.includes("Unknown policy profile")) {
    return "UNKNOWN_POLICY_PROFILE";
  }
  return "BATCH_REVIEW_ERROR";
}

if (require.main === module) {
  process.exitCode = runCli(process.argv.slice(2));
}
