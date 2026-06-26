import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { CONTRACT_VERSION } from "./contract.js";
import { REVIEW_RECORD_VERSION, type HumanDecision, type HumanReviewRecord } from "./human-review.js";

export type ReviewRecordStatus = "valid" | "invalid" | "malformed";
export type ApprovalPackIntegrityStatus = "match" | "mismatch" | "missing" | "not_checked";

export interface ReviewAuditSummary {
  total_files: number;
  valid_review_records: number;
  invalid_review_records_count: number;
  malformed_review_records_count: number;
  approved_count: number;
  rejected_count: number;
  needs_more_info_count: number;
  regulated_policy_count: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
  policy_profile_counts: Record<string, number>;
  approval_pack_hash_match_count: number;
  approval_pack_hash_mismatch_count: number;
  approval_pack_missing_count: number;
}

export interface ReviewListEntry {
  filename: string;
  status: ReviewRecordStatus;
  contract_version?: string;
  review_record_version?: string;
  reviewed_at?: string;
  human_reviewer?: string;
  human_decision?: HumanDecision;
  human_review_status?: HumanDecision;
  approval_pack_path?: string;
  approval_pack_hash?: string;
  approval_pack_integrity_status?: ApprovalPackIntegrityStatus;
  original_action_type?: string;
  original_actor?: string;
  original_target?: string;
  original_allowed?: boolean;
  original_risk_level?: string;
  original_human_approval_required?: boolean;
  original_policy_profile?: string;
  original_regulated_policy?: boolean;
  error?: string;
}

export interface ReviewAuditResult {
  contract_version: string;
  review_records_directory: string;
  summary: ReviewAuditSummary;
  records: ReviewListEntry[];
}

export function auditReviewRecords(
  reviewRecordsDirectory = "approval-reviews",
): ReviewAuditResult {
  const records = listReviewRecords(reviewRecordsDirectory);
  const summary = createEmptySummary(records.length);

  for (const record of records) {
    if (record.status === "malformed") {
      summary.malformed_review_records_count += 1;
      continue;
    }

    if (record.status === "invalid") {
      summary.invalid_review_records_count += 1;
      continue;
    }

    summary.valid_review_records += 1;
    if (record.human_decision === "approved") {
      summary.approved_count += 1;
    } else if (record.human_decision === "rejected") {
      summary.rejected_count += 1;
    } else if (record.human_decision === "needs_more_info") {
      summary.needs_more_info_count += 1;
    }

    if (record.original_regulated_policy === true) {
      summary.regulated_policy_count += 1;
    }

    if (record.original_risk_level === "high") {
      summary.high_risk_count += 1;
    } else if (record.original_risk_level === "medium") {
      summary.medium_risk_count += 1;
    } else if (record.original_risk_level === "low") {
      summary.low_risk_count += 1;
    }

    const policy = record.original_policy_profile ?? "unknown";
    summary.policy_profile_counts[policy] = (summary.policy_profile_counts[policy] ?? 0) + 1;

    if (record.approval_pack_integrity_status === "match") {
      summary.approval_pack_hash_match_count += 1;
    } else if (record.approval_pack_integrity_status === "mismatch") {
      summary.approval_pack_hash_mismatch_count += 1;
    } else if (record.approval_pack_integrity_status === "missing") {
      summary.approval_pack_missing_count += 1;
    }
  }

  return {
    contract_version: CONTRACT_VERSION,
    review_records_directory: reviewRecordsDirectory,
    summary,
    records,
  };
}

export function listReviewRecords(reviewRecordsDirectory = "approval-reviews"): ReviewListEntry[] {
  if (!existsSync(reviewRecordsDirectory)) {
    return [];
  }

  return readdirSync(reviewRecordsDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => readReviewRecordEntry(reviewRecordsDirectory, entry.name))
    .sort((a, b) => a.filename.localeCompare(b.filename));
}

function readReviewRecordEntry(
  reviewRecordsDirectory: string,
  filename: string,
): ReviewListEntry {
  const filePath = join(reviewRecordsDirectory, filename);
  let parsed: unknown;

  try {
    parsed = JSON.parse(readFileSync(filePath, "utf8"));
  } catch (error) {
    return {
      filename,
      status: "malformed",
      error: `Malformed review record JSON: ${errorMessage(error)}`,
    };
  }

  if (!isHumanReviewRecordLike(parsed)) {
    return {
      filename,
      status: "invalid",
      error: "Review record is missing required atg.review.v1 fields.",
    };
  }

  return {
    filename,
    status: "valid",
    contract_version: parsed.contract_version,
    review_record_version: parsed.review_record_version,
    reviewed_at: parsed.reviewed_at,
    human_reviewer: parsed.human_reviewer,
    human_decision: parsed.human_decision,
    human_review_status: parsed.human_review_status,
    approval_pack_path: parsed.approval_pack_path,
    approval_pack_hash: parsed.approval_pack_hash,
    approval_pack_integrity_status: approvalPackIntegrityStatus(parsed),
    original_action_type: parsed.original_action_type,
    original_actor: parsed.original_actor,
    original_target: parsed.original_target,
    original_allowed: parsed.original_allowed,
    original_risk_level: parsed.original_risk_level,
    original_human_approval_required: parsed.original_human_approval_required,
    original_policy_profile: parsed.original_policy_profile,
    original_regulated_policy: parsed.original_regulated_policy,
  };
}

function createEmptySummary(totalFiles: number): ReviewAuditSummary {
  return {
    total_files: totalFiles,
    valid_review_records: 0,
    invalid_review_records_count: 0,
    malformed_review_records_count: 0,
    approved_count: 0,
    rejected_count: 0,
    needs_more_info_count: 0,
    regulated_policy_count: 0,
    high_risk_count: 0,
    medium_risk_count: 0,
    low_risk_count: 0,
    policy_profile_counts: {},
    approval_pack_hash_match_count: 0,
    approval_pack_hash_mismatch_count: 0,
    approval_pack_missing_count: 0,
  };
}

function approvalPackIntegrityStatus(
  record: HumanReviewRecord,
): ApprovalPackIntegrityStatus {
  if (!existsSync(record.approval_pack_path)) {
    return "missing";
  }

  const approvalPackHash = createHash("sha256")
    .update(readFileSync(record.approval_pack_path))
    .digest("hex");

  return approvalPackHash === record.approval_pack_hash ? "match" : "mismatch";
}

function isHumanReviewRecordLike(value: unknown): value is HumanReviewRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Partial<HumanReviewRecord>;
  return (
    candidate.contract_version === CONTRACT_VERSION &&
    candidate.review_record_version === REVIEW_RECORD_VERSION &&
    typeof candidate.approval_pack_path === "string" &&
    candidate.approval_pack_path.trim().length > 0 &&
    typeof candidate.approval_pack_hash === "string" &&
    candidate.approval_pack_hash.trim().length > 0 &&
    typeof candidate.reviewed_at === "string" &&
    typeof candidate.human_reviewer === "string" &&
    isHumanDecision(candidate.human_decision) &&
    isHumanDecision(candidate.human_review_status) &&
    typeof candidate.original_action_type === "string" &&
    typeof candidate.original_actor === "string" &&
    typeof candidate.original_target === "string" &&
    typeof candidate.original_allowed === "boolean" &&
    typeof candidate.original_risk_level === "string" &&
    typeof candidate.original_human_approval_required === "boolean" &&
    typeof candidate.original_policy_profile === "string" &&
    typeof candidate.original_regulated_policy === "boolean"
  );
}

function isHumanDecision(value: unknown): value is HumanDecision {
  return value === "approved" || value === "rejected" || value === "needs_more_info";
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
