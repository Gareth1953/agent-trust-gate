import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import type { VerificationReceipt } from "./types.js";

export type HumanReviewStatus = "pending" | "not_required";

export interface ApprovalPack {
  contract_version: string;
  checked_at: string;
  action_type: string;
  actor: string;
  target: string;
  description: string;
  allowed: boolean;
  risk_level: string;
  human_approval_required: boolean;
  policy_profile: string;
  regulated_policy: boolean;
  approval_reason: string | null;
  reasons: string[];
  human_review_status: HumanReviewStatus;
  human_reviewer: null;
  human_reviewed_at: null;
  approval_statement: string;
  safety_statement: string;
  receipt_id: string;
}

export function createApprovalPack(receipt: VerificationReceipt): ApprovalPack {
  const humanApprovalRequired = receipt.human_approval_required;

  return {
    contract_version: receipt.contract_version,
    checked_at: receipt.timestamp,
    action_type: receipt.input_summary.action_type,
    actor: receipt.input_summary.actor,
    target: receipt.input_summary.target,
    description: receipt.input_summary.description,
    allowed: receipt.allowed,
    risk_level: receipt.risk_level,
    human_approval_required: humanApprovalRequired,
    policy_profile: receipt.policy_profile,
    regulated_policy: receipt.regulated_policy,
    approval_reason: receipt.approval_reason,
    reasons: receipt.approval_reason === null ? [] : [receipt.approval_reason],
    human_review_status: humanApprovalRequired ? "pending" : "not_required",
    human_reviewer: null,
    human_reviewed_at: null,
    approval_statement: humanApprovalRequired
      ? "Human approval is required before this action may proceed."
      : "Human approval was not required by the selected policy profile.",
    safety_statement:
      "Agent Trust Gate does not execute actions. It returns a local trust decision for human review.",
    receipt_id: receipt.receipt_id,
  };
}

export function saveApprovalPackToArchive(
  approvalPack: ApprovalPack,
  archiveDirectory = "approval-packs",
): string {
  mkdirSync(archiveDirectory, { recursive: true });

  const safeTimestamp = approvalPack.checked_at
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
  const fileName = `${safeTimestamp}_${approvalPack.receipt_id}_approval_pack.json`;
  const archivePath = join(archiveDirectory, fileName);

  writeFileSync(archivePath, `${JSON.stringify(approvalPack, null, 2)}\n`, "utf8");
  return archivePath;
}

export function formatApprovalPackForConsole(
  approvalPack: ApprovalPack,
  approvalPackPath?: string,
): string {
  return [
    "Human approval pack",
    `contract_version: ${approvalPack.contract_version}`,
    `checked_at: ${approvalPack.checked_at}`,
    "",
    "Action:",
    `- action_type: ${approvalPack.action_type}`,
    `- actor: ${approvalPack.actor}`,
    `- target: ${approvalPack.target}`,
    `- description: ${approvalPack.description}`,
    "",
    "Decision:",
    `- allowed: ${approvalPack.allowed}`,
    `- risk_level: ${approvalPack.risk_level}`,
    `- human_approval_required: ${approvalPack.human_approval_required}`,
    `- policy_profile: ${approvalPack.policy_profile}`,
    `- regulated_policy: ${approvalPack.regulated_policy}`,
    `- approval_reason: ${approvalPack.approval_reason ?? "none"}`,
    "",
    "Human review:",
    `- human_review_status: ${approvalPack.human_review_status}`,
    `- human_reviewer: ${approvalPack.human_reviewer}`,
    `- human_reviewed_at: ${approvalPack.human_reviewed_at}`,
    `- approval_statement: ${approvalPack.approval_statement}`,
    ...(approvalPackPath === undefined
      ? []
      : ["", `approval_pack_saved: true`, `approval_pack_path: ${approvalPackPath}`]),
    "",
    approvalPack.safety_statement,
  ].join("\n");
}
