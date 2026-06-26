import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import type { ApprovalPack } from "./approval-pack.js";
import { CONTRACT_VERSION } from "./contract.js";
import { REVIEW_RECORD_VERSION, type HumanDecision, type HumanReviewRecord } from "./human-review.js";
import type { ApprovalPackIntegrityStatus } from "./review-audit.js";

export const EVIDENCE_BUNDLE_VERSION = "atg.evidence.v1" as const;

export interface EvidenceBundle {
  contract_version: string;
  evidence_bundle_version: typeof EVIDENCE_BUNDLE_VERSION;
  created_at: string;
  source_review_record_path: string;
  source_approval_pack_path: string;
  approval_pack_hash: string;
  approval_pack_integrity_status: Exclude<ApprovalPackIntegrityStatus, "not_checked">;
  action: {
    action_type: string;
    actor: string;
    target: string;
    description: string | null;
  };
  trust_decision: {
    allowed: boolean;
    risk_level: string;
    human_approval_required: boolean;
    policy_profile: string;
    regulated_policy: boolean;
    approval_reason: string | null;
    reasons: string[];
  };
  human_review: {
    human_reviewer: string;
    human_decision: HumanDecision;
    human_review_status: HumanDecision;
    reviewed_at: string;
    review_note?: string;
  };
  timeline: {
    checked_at: string | null;
    reviewed_at: string;
    evidence_bundle_created_at: string;
  };
  safety_statement: string;
}

export interface SavedEvidenceBundle extends EvidenceBundle {
  evidence_bundle_saved: boolean;
  evidence_bundle_path?: string;
}

export interface EvidenceBundleDetail {
  field: string;
  issue: string;
}

export class EvidenceBundleError extends Error {
  readonly code = "INVALID_EVIDENCE_BUNDLE_INPUT";
  readonly details: EvidenceBundleDetail[];

  constructor(message: string, details: EvidenceBundleDetail[] = []) {
    super(message);
    this.name = "EvidenceBundleError";
    this.details = details;
  }
}

export function createEvidenceBundle(reviewRecordPath: string): EvidenceBundle {
  if (reviewRecordPath.trim().length === 0) {
    throw new EvidenceBundleError("Review record path is required.", [
      { field: "review_record_path", issue: "--evidence-bundle must point to a review record JSON file." },
    ]);
  }

  let reviewRecordBytes: Buffer;
  try {
    reviewRecordBytes = readFileSync(reviewRecordPath);
  } catch (error) {
    throw new EvidenceBundleError(`Unable to read review record: ${errorMessage(error)}`, [
      { field: "review_record_path", issue: "Review record file could not be read." },
    ]);
  }

  let parsedReviewRecord: unknown;
  try {
    parsedReviewRecord = JSON.parse(reviewRecordBytes.toString("utf8"));
  } catch (error) {
    throw new EvidenceBundleError(`Malformed review record JSON: ${errorMessage(error)}`, [
      { field: "review_record_path", issue: "Review record file is not valid JSON." },
    ]);
  }

  if (!isHumanReviewRecordLike(parsedReviewRecord)) {
    throw new EvidenceBundleError("Review record is missing required fields.", [
      { field: "review_record", issue: "Review record does not match atg.review.v1 shape." },
    ]);
  }

  const approvalPackRead = readLinkedApprovalPack(
    parsedReviewRecord.approval_pack_path,
    parsedReviewRecord.approval_pack_hash,
  );
  const createdAt = new Date().toISOString();
  const approvalPack = approvalPackRead.approvalPack;

  const evidenceBundle: EvidenceBundle = {
    contract_version: CONTRACT_VERSION,
    evidence_bundle_version: EVIDENCE_BUNDLE_VERSION,
    created_at: createdAt,
    source_review_record_path: reviewRecordPath,
    source_approval_pack_path: parsedReviewRecord.approval_pack_path,
    approval_pack_hash: parsedReviewRecord.approval_pack_hash,
    approval_pack_integrity_status: approvalPackRead.integrityStatus,
    action: {
      action_type: parsedReviewRecord.original_action_type,
      actor: parsedReviewRecord.original_actor,
      target: parsedReviewRecord.original_target,
      description: approvalPack?.description ?? null,
    },
    trust_decision: {
      allowed: parsedReviewRecord.original_allowed,
      risk_level: parsedReviewRecord.original_risk_level,
      human_approval_required: parsedReviewRecord.original_human_approval_required,
      policy_profile: parsedReviewRecord.original_policy_profile,
      regulated_policy: parsedReviewRecord.original_regulated_policy,
      approval_reason: approvalPack?.approval_reason ?? null,
      reasons: approvalPack?.reasons ?? [],
    },
    human_review: {
      human_reviewer: parsedReviewRecord.human_reviewer,
      human_decision: parsedReviewRecord.human_decision,
      human_review_status: parsedReviewRecord.human_review_status,
      reviewed_at: parsedReviewRecord.reviewed_at,
    },
    timeline: {
      checked_at: approvalPack?.checked_at ?? null,
      reviewed_at: parsedReviewRecord.reviewed_at,
      evidence_bundle_created_at: createdAt,
    },
    safety_statement:
      "Evidence bundles are local explanation records. Agent Trust Gate does not execute actions, authenticate reviewers, guarantee legality, or prove compliance.",
  };

  if (parsedReviewRecord.review_note !== undefined) {
    evidenceBundle.human_review.review_note = parsedReviewRecord.review_note;
  }

  return evidenceBundle;
}

export function saveEvidenceBundle(
  evidenceBundle: EvidenceBundle,
  archiveDirectory = "evidence-bundles",
): string {
  mkdirSync(archiveDirectory, { recursive: true });

  const safeTimestamp = evidenceBundle.created_at
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
  const shortHash = evidenceBundle.approval_pack_hash.slice(0, 12);
  const fileName = `${safeTimestamp}_${shortHash}_evidence_bundle.json`;
  const archivePath = join(archiveDirectory, fileName);

  writeFileSync(archivePath, `${JSON.stringify(evidenceBundle, null, 2)}\n`, "utf8");
  return archivePath;
}

export function withEvidenceBundleSaveStatus(
  evidenceBundle: EvidenceBundle,
  evidenceBundlePath?: string,
): SavedEvidenceBundle {
  const output: SavedEvidenceBundle = {
    ...evidenceBundle,
    evidence_bundle_saved: evidenceBundlePath !== undefined,
  };

  if (evidenceBundlePath !== undefined) {
    output.evidence_bundle_path = evidenceBundlePath;
  }

  return output;
}

export function formatEvidenceBundleForConsole(
  evidenceBundle: EvidenceBundle,
  evidenceBundlePath?: string,
): string {
  return [
    "Evidence bundle created",
    `contract_version: ${evidenceBundle.contract_version}`,
    `evidence_bundle_version: ${evidenceBundle.evidence_bundle_version}`,
    `created_at: ${evidenceBundle.created_at}`,
    "",
    `source_review_record_path: ${evidenceBundle.source_review_record_path}`,
    `source_approval_pack_path: ${evidenceBundle.source_approval_pack_path}`,
    `approval_pack_integrity_status: ${evidenceBundle.approval_pack_integrity_status}`,
    "",
    "Action:",
    `- action_type: ${evidenceBundle.action.action_type}`,
    `- actor: ${evidenceBundle.action.actor}`,
    `- target: ${evidenceBundle.action.target}`,
    "",
    "Trust decision:",
    `- allowed: ${evidenceBundle.trust_decision.allowed}`,
    `- risk_level: ${evidenceBundle.trust_decision.risk_level}`,
    `- human_approval_required: ${evidenceBundle.trust_decision.human_approval_required}`,
    `- policy_profile: ${evidenceBundle.trust_decision.policy_profile}`,
    "",
    "Human review:",
    `- human_decision: ${evidenceBundle.human_review.human_decision}`,
    `- human_reviewer: ${evidenceBundle.human_review.human_reviewer}`,
    `- reviewed_at: ${evidenceBundle.human_review.reviewed_at}`,
    ...(evidenceBundlePath === undefined
      ? ["", "evidence_bundle_saved: false"]
      : ["", "evidence_bundle_saved: true", `evidence_bundle_path: ${evidenceBundlePath}`]),
    "",
    evidenceBundle.safety_statement,
  ].join("\n");
}

function readLinkedApprovalPack(
  approvalPackPath: string,
  expectedHash: string,
): {
  integrityStatus: Exclude<ApprovalPackIntegrityStatus, "not_checked">;
  approvalPack?: ApprovalPack;
} {
  if (!existsSync(approvalPackPath)) {
    return { integrityStatus: "missing" };
  }

  const approvalPackBytes = readFileSync(approvalPackPath);
  const computedHash = createHash("sha256").update(approvalPackBytes).digest("hex");
  let approvalPack: ApprovalPack | undefined;

  try {
    const parsed = JSON.parse(approvalPackBytes.toString("utf8"));
    if (isApprovalPackLike(parsed)) {
      approvalPack = parsed;
    }
  } catch {
    approvalPack = undefined;
  }

  return {
    integrityStatus: computedHash === expectedHash ? "match" : "mismatch",
    ...(approvalPack === undefined ? {} : { approvalPack }),
  };
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
    typeof candidate.approval_pack_hash === "string" &&
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

function isHumanDecision(value: unknown): value is HumanDecision {
  return value === "approved" || value === "rejected" || value === "needs_more_info";
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
