import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { ActionValidationError } from "./action-validation.js";
import { CONTRACT_VERSION } from "./contract.js";
import { resolvePolicyProfile } from "./policy-profiles.js";
import { saveReceiptToArchive } from "./receipt-archive.js";
import { verifyBeforeAction } from "./verify-before-action.js";
import type { RiskLevel } from "./types.js";

export interface BatchReviewOptions {
  policy_profile?: string;
  save_receipts?: boolean;
}

export interface BatchReviewSummary {
  total_files: number;
  valid_actions: number;
  invalid_actions: number;
  allowed_count: number;
  blocked_count: number;
  approval_required_count: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
  malformed_json_count: number;
  policy_profile_counts: Record<string, number>;
}

export interface BatchActionResult {
  filename: string;
  status: "valid" | "invalid" | "malformed";
  allowed?: boolean;
  risk_level?: RiskLevel;
  human_approval_required?: boolean;
  action_type?: string;
  actor?: string;
  target?: string;
  policy_profile?: string;
  regulated_policy?: boolean;
  receipt_saved?: boolean;
  receipt_path?: string;
  error?: {
    code: string;
    message: string;
    details?: unknown[];
  };
}

export interface BatchReviewResult {
  ok: true;
  contract_version: string;
  batch_directory: string;
  summary: BatchReviewSummary;
  results: BatchActionResult[];
}

export class BatchDirectoryError extends Error {
  readonly code = "BATCH_DIRECTORY_ERROR";

  constructor(message: string) {
    super(message);
    this.name = "BatchDirectoryError";
  }
}

export function reviewBatch(
  batchDirectory: string,
  options: BatchReviewOptions = {},
): BatchReviewResult {
  assertReadableDirectory(batchDirectory);
  resolvePolicyProfile(options.policy_profile);

  const jsonFiles = readdirSync(batchDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));

  const summary: BatchReviewSummary = {
    total_files: jsonFiles.length,
    valid_actions: 0,
    invalid_actions: 0,
    allowed_count: 0,
    blocked_count: 0,
    approval_required_count: 0,
    high_risk_count: 0,
    medium_risk_count: 0,
    low_risk_count: 0,
    malformed_json_count: 0,
    policy_profile_counts: {},
  };

  const results = jsonFiles.map((filename) =>
    reviewBatchFile(batchDirectory, filename, options, summary),
  );

  return {
    ok: true,
    contract_version: CONTRACT_VERSION,
    batch_directory: batchDirectory,
    summary,
    results,
  };
}

function assertReadableDirectory(batchDirectory: string): void {
  if (!existsSync(batchDirectory)) {
    throw new BatchDirectoryError(`Batch directory "${batchDirectory}" does not exist.`);
  }

  let stat;
  try {
    stat = statSync(batchDirectory);
  } catch (error) {
    throw new BatchDirectoryError(
      `Unable to read batch directory "${batchDirectory}": ${errorMessage(error)}`,
    );
  }

  if (!stat.isDirectory()) {
    throw new BatchDirectoryError(`Batch path "${batchDirectory}" is not a directory.`);
  }
}

function reviewBatchFile(
  batchDirectory: string,
  filename: string,
  options: BatchReviewOptions,
  summary: BatchReviewSummary,
): BatchActionResult {
  const filePath = join(batchDirectory, filename);
  let input: unknown;

  try {
    input = JSON.parse(readFileSync(filePath, "utf8"));
  } catch (error) {
    summary.malformed_json_count += 1;
    return {
      filename,
      status: "malformed",
      error: {
        code: "MALFORMED_JSON",
        message: `Malformed JSON: ${errorMessage(error)}`,
      },
    };
  }

  try {
    const receipt = verifyBeforeAction(
      input,
      options.policy_profile === undefined ? {} : { policy_profile: options.policy_profile },
    );
    const receiptPath = options.save_receipts === true ? saveReceiptToArchive(receipt) : undefined;

    summary.valid_actions += 1;
    if (receipt.allowed) {
      summary.allowed_count += 1;
    } else {
      summary.blocked_count += 1;
    }

    if (receipt.human_approval_required) {
      summary.approval_required_count += 1;
    }

    if (receipt.risk_level === "high") {
      summary.high_risk_count += 1;
    } else if (receipt.risk_level === "medium") {
      summary.medium_risk_count += 1;
    } else if (receipt.risk_level === "low") {
      summary.low_risk_count += 1;
    }

    summary.policy_profile_counts[receipt.policy_profile] =
      (summary.policy_profile_counts[receipt.policy_profile] ?? 0) + 1;

    const result: BatchActionResult = {
      filename,
      status: "valid",
      allowed: receipt.allowed,
      risk_level: receipt.risk_level,
      human_approval_required: receipt.human_approval_required,
      action_type: receipt.input_summary.action_type,
      actor: receipt.input_summary.actor,
      target: receipt.input_summary.target,
      policy_profile: receipt.policy_profile,
      regulated_policy: receipt.regulated_policy,
      receipt_saved: receiptPath !== undefined,
    };

    if (receiptPath !== undefined) {
      result.receipt_path = receiptPath;
    }

    return result;
  } catch (error) {
    summary.invalid_actions += 1;
    const result: BatchActionResult = {
      filename,
      status: "invalid",
      error: {
        code: error instanceof ActionValidationError ? error.code : "INVALID_ACTION_DESCRIPTOR",
        message: errorMessage(error),
        ...(error instanceof ActionValidationError ? { details: error.details } : {}),
      },
    };

    const actionType = getStringField(input, "action_type");
    const actor = getStringField(input, "actor");
    const target = getStringField(input, "target");

    if (actionType !== undefined) {
      result.action_type = actionType;
    }
    if (actor !== undefined) {
      result.actor = actor;
    }
    if (target !== undefined) {
      result.target = target;
    }

    return result;
  }
}

function getStringField(input: unknown, field: string): string | undefined {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return undefined;
  }

  const value = (input as Record<string, unknown>)[field];
  return typeof value === "string" ? value : undefined;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
