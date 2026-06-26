import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import type { RiskLevel, VerificationReceipt } from "./types.js";

export interface ReceiptAuditSummary {
  total_receipts: number;
  allowed_count: number;
  blocked_count: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
  approval_required_count: number;
  malformed_receipts_count: number;
  policy_profile_counts: Record<string, number>;
}

export interface ReceiptListEntry {
  filename: string;
  status: "valid" | "malformed";
  receipt_id?: string;
  timestamp?: string;
  allowed?: boolean;
  risk_level?: RiskLevel;
  human_approval_required?: boolean;
  policy_profile?: string;
  action_type?: string;
  actor?: string;
  target?: string;
  error?: string;
}

export interface ReceiptAuditResult {
  receipts_directory: string;
  summary: ReceiptAuditSummary;
  receipts: ReceiptListEntry[];
}

export function auditReceipts(receiptsDirectory = "receipts"): ReceiptAuditResult {
  const entries = readReceiptEntries(receiptsDirectory);

  const summary: ReceiptAuditSummary = {
    total_receipts: entries.length,
    allowed_count: 0,
    blocked_count: 0,
    high_risk_count: 0,
    medium_risk_count: 0,
    low_risk_count: 0,
    approval_required_count: 0,
    malformed_receipts_count: 0,
    policy_profile_counts: {},
  };

  for (const entry of entries) {
    if (entry.status === "malformed") {
      summary.malformed_receipts_count += 1;
      continue;
    }

    if (entry.allowed === true) {
      summary.allowed_count += 1;
    }

    if (entry.risk_level === "blocked") {
      summary.blocked_count += 1;
    } else if (entry.risk_level === "high") {
      summary.high_risk_count += 1;
    } else if (entry.risk_level === "medium") {
      summary.medium_risk_count += 1;
    } else if (entry.risk_level === "low") {
      summary.low_risk_count += 1;
    }

    if (entry.human_approval_required === true) {
      summary.approval_required_count += 1;
    }

    const policyProfile = entry.policy_profile ?? "standard";
    summary.policy_profile_counts[policyProfile] =
      (summary.policy_profile_counts[policyProfile] ?? 0) + 1;
  }

  return {
    receipts_directory: receiptsDirectory,
    summary,
    receipts: entries,
  };
}

export function listReceipts(receiptsDirectory = "receipts"): ReceiptListEntry[] {
  return readReceiptEntries(receiptsDirectory);
}

function readReceiptEntries(receiptsDirectory: string): ReceiptListEntry[] {
  if (!existsSync(receiptsDirectory)) {
    return [];
  }

  return readdirSync(receiptsDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => readReceiptEntry(receiptsDirectory, entry.name))
    .sort((a, b) => a.filename.localeCompare(b.filename));
}

function readReceiptEntry(receiptsDirectory: string, filename: string): ReceiptListEntry {
  try {
    const parsed = JSON.parse(readFileSync(join(receiptsDirectory, filename), "utf8"));
    if (!isReceiptLike(parsed)) {
      return {
        filename,
        status: "malformed",
        error: "JSON parsed but does not look like an Agent Trust Gate receipt.",
      };
    }

    return {
      filename,
      status: "valid",
      receipt_id: parsed.receipt_id,
      timestamp: parsed.timestamp,
      allowed: parsed.allowed,
      risk_level: parsed.risk_level,
      human_approval_required: parsed.human_approval_required,
      policy_profile: parsed.policy_profile ?? "standard",
      action_type: parsed.input_summary.action_type,
      actor: parsed.input_summary.actor,
      target: parsed.input_summary.target,
    };
  } catch (error) {
    return {
      filename,
      status: "malformed",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function isReceiptLike(value: unknown): value is VerificationReceipt {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const receipt = value as Partial<VerificationReceipt>;
  return (
    typeof receipt.receipt_id === "string" &&
    typeof receipt.timestamp === "string" &&
    typeof receipt.allowed === "boolean" &&
    isRiskLevel(receipt.risk_level) &&
    typeof receipt.human_approval_required === "boolean" &&
    (receipt.policy_profile === undefined || typeof receipt.policy_profile === "string") &&
    typeof receipt.input_summary === "object" &&
    receipt.input_summary !== null &&
    typeof receipt.input_summary.action_type === "string" &&
    typeof receipt.input_summary.actor === "string" &&
    typeof receipt.input_summary.target === "string"
  );
}

function isRiskLevel(value: unknown): value is RiskLevel {
  return value === "low" || value === "medium" || value === "high" || value === "blocked";
}
