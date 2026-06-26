import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import type { ApprovalPack } from "./approval-pack.js";
import { CONTRACT_VERSION } from "./contract.js";

export const REVIEW_RECORD_VERSION = "atg.review.v1" as const;
export type HumanDecision = "approved" | "rejected" | "needs_more_info";

export interface HumanReviewRecord {
  contract_version: string;
  review_record_version: typeof REVIEW_RECORD_VERSION;
  approval_pack_path: string;
  approval_pack_hash: string;
  reviewed_at: string;
  human_reviewer: string;
  human_decision: HumanDecision;
  human_review_status: HumanDecision;
  review_note?: string;
  original_action_type: string;
  original_actor: string;
  original_target: string;
  original_allowed: boolean;
  original_risk_level: string;
  original_human_approval_required: boolean;
  original_policy_profile: string;
  original_regulated_policy: boolean;
  safety_statement: string;
}

export interface HumanReviewInput {
  approval_pack_path: string;
  decision: string;
  reviewer: string;
  review_note?: string;
}

export interface SavedHumanReviewRecord extends HumanReviewRecord {
  review_record_saved: boolean;
  review_record_path?: string;
}

export interface HumanReviewDetail {
  field: string;
  issue: string;
}

export class HumanReviewError extends Error {
  readonly code = "INVALID_HUMAN_REVIEW";
  readonly details: HumanReviewDetail[];

  constructor(message: string, details: HumanReviewDetail[] = []) {
    super(message);
    this.name = "HumanReviewError";
    this.details = details;
  }
}

export function createHumanReviewRecord(input: HumanReviewInput): HumanReviewRecord {
  const details = validateHumanReviewInput(input);
  if (details.length > 0) {
    throw new HumanReviewError("Invalid human review input.", details);
  }

  let approvalPackBytes: Buffer;
  try {
    approvalPackBytes = readFileSync(input.approval_pack_path);
  } catch (error) {
    throw new HumanReviewError(`Unable to read approval pack: ${errorMessage(error)}`, [
      { field: "approval_pack_path", issue: "Approval pack file could not be read." },
    ]);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(approvalPackBytes.toString("utf8"));
  } catch (error) {
    throw new HumanReviewError(`Malformed approval pack JSON: ${errorMessage(error)}`, [
      { field: "approval_pack_path", issue: "Approval pack file is not valid JSON." },
    ]);
  }

  if (!isApprovalPackLike(parsed)) {
    throw new HumanReviewError("Approval pack is missing required fields.", [
      { field: "approval_pack", issue: "Approval pack does not match atg.v1 approval pack shape." },
    ]);
  }

  const decision = input.decision as HumanDecision;
  const reviewRecord: HumanReviewRecord = {
    contract_version: CONTRACT_VERSION,
    review_record_version: REVIEW_RECORD_VERSION,
    approval_pack_path: input.approval_pack_path,
    approval_pack_hash: createHash("sha256").update(approvalPackBytes).digest("hex"),
    reviewed_at: new Date().toISOString(),
    human_reviewer: input.reviewer.trim(),
    human_decision: decision,
    human_review_status: decision,
    original_action_type: parsed.action_type,
    original_actor: parsed.actor,
    original_target: parsed.target,
    original_allowed: parsed.allowed,
    original_risk_level: parsed.risk_level,
    original_human_approval_required: parsed.human_approval_required,
    original_policy_profile: parsed.policy_profile,
    original_regulated_policy: parsed.regulated_policy,
    safety_statement:
      "Human review records are local evidence records. Agent Trust Gate does not execute actions.",
  };

  if (input.review_note !== undefined && input.review_note.trim().length > 0) {
    reviewRecord.review_note = input.review_note;
  }

  return reviewRecord;
}

export function saveHumanReviewRecord(
  reviewRecord: HumanReviewRecord,
  archiveDirectory = "approval-reviews",
): string {
  mkdirSync(archiveDirectory, { recursive: true });

  const safeTimestamp = reviewRecord.reviewed_at
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
  const shortHash = reviewRecord.approval_pack_hash.slice(0, 12);
  const fileName = `${safeTimestamp}_${reviewRecord.human_decision}_${shortHash}_review.json`;
  const archivePath = join(archiveDirectory, fileName);

  writeFileSync(archivePath, `${JSON.stringify(reviewRecord, null, 2)}\n`, "utf8");
  return archivePath;
}

export function withReviewRecordSaveStatus(
  reviewRecord: HumanReviewRecord,
  reviewRecordPath?: string,
): SavedHumanReviewRecord {
  const output: SavedHumanReviewRecord = {
    ...reviewRecord,
    review_record_saved: reviewRecordPath !== undefined,
  };

  if (reviewRecordPath !== undefined) {
    output.review_record_path = reviewRecordPath;
  }

  return output;
}

export function formatHumanReviewRecordForConsole(
  reviewRecord: HumanReviewRecord,
  reviewRecordPath?: string,
): string {
  return [
    "Human review decision record",
    `contract_version: ${reviewRecord.contract_version}`,
    `review_record_version: ${reviewRecord.review_record_version}`,
    "",
    `approval_pack_path: ${reviewRecord.approval_pack_path}`,
    `approval_pack_hash: ${reviewRecord.approval_pack_hash}`,
    `reviewed_at: ${reviewRecord.reviewed_at}`,
    `human_reviewer: ${reviewRecord.human_reviewer}`,
    `human_decision: ${reviewRecord.human_decision}`,
    `human_review_status: ${reviewRecord.human_review_status}`,
    ...(reviewRecord.review_note === undefined
      ? []
      : [`review_note: ${reviewRecord.review_note}`]),
    "",
    "Original action:",
    `- action_type: ${reviewRecord.original_action_type}`,
    `- actor: ${reviewRecord.original_actor}`,
    `- target: ${reviewRecord.original_target}`,
    `- allowed: ${reviewRecord.original_allowed}`,
    `- risk_level: ${reviewRecord.original_risk_level}`,
    `- human_approval_required: ${reviewRecord.original_human_approval_required}`,
    `- policy_profile: ${reviewRecord.original_policy_profile}`,
    `- regulated_policy: ${reviewRecord.original_regulated_policy}`,
    ...(reviewRecordPath === undefined
      ? ["", "review_record_saved: false"]
      : ["", "review_record_saved: true", `review_record_path: ${reviewRecordPath}`]),
    "",
    reviewRecord.safety_statement,
  ].join("\n");
}

function validateHumanReviewInput(input: HumanReviewInput): HumanReviewDetail[] {
  const details: HumanReviewDetail[] = [];

  if (input.approval_pack_path.trim().length === 0) {
    details.push({
      field: "approval_pack_path",
      issue: "--review-approval-pack must point to a local approval pack JSON file.",
    });
  }

  if (!isHumanDecision(input.decision)) {
    details.push({
      field: "decision",
      issue: "decision must be one of: approved, rejected, needs_more_info.",
    });
  }

  if (input.reviewer.trim().length === 0) {
    details.push({
      field: "reviewer",
      issue: "--reviewer is required and must be non-empty.",
    });
  }

  return details;
}

function isHumanDecision(value: string): value is HumanDecision {
  return value === "approved" || value === "rejected" || value === "needs_more_info";
}

function isApprovalPackLike(value: unknown): value is ApprovalPack {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Partial<ApprovalPack>;
  return (
    candidate.contract_version === CONTRACT_VERSION &&
    typeof candidate.checked_at === "string" &&
    typeof candidate.action_type === "string" &&
    typeof candidate.actor === "string" &&
    typeof candidate.target === "string" &&
    typeof candidate.allowed === "boolean" &&
    typeof candidate.risk_level === "string" &&
    typeof candidate.human_approval_required === "boolean" &&
    typeof candidate.policy_profile === "string" &&
    typeof candidate.regulated_policy === "boolean"
  );
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
