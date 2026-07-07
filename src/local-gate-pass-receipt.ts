import { createHash } from "node:crypto";

import {
  runLocalGatePassDemo,
  type LocalGatePassDemoInput,
  type LocalGatePassReceiptType,
  type LocalGatePassVerdict,
} from "./local-gate-pass-demo.js";

export type LocalGatePassRiskTier = "low" | "high" | "blocked";

export interface LocalAuditCheck {
  passed: boolean;
  reason: string;
}

export interface LocalEvidenceAuditCheck extends LocalAuditCheck {
  fresh: boolean;
}

export interface LocalApprovalAuditCheck extends LocalAuditCheck {
  required: boolean;
}

export interface LocalGatePassAuditReceipt {
  receipt_id: string;
  request_id: string;
  agent_id: string;
  requested_action: string;
  action_category: string;
  verdict: LocalGatePassVerdict;
  allowed: boolean;
  settlement_allowed: boolean;
  settlement_executed: false;
  receipt_type: LocalGatePassReceiptType;
  risk_tier: LocalGatePassRiskTier;
  checks: {
    mandate: LocalAuditCheck;
    evidence: LocalEvidenceAuditCheck;
    verified_intent: LocalAuditCheck;
    limits: LocalAuditCheck;
    approval: LocalApprovalAuditCheck;
  };
  reason_codes: string[];
  checked_at: string;
  signature_metadata: {
    signature_mode: "local_demo_placeholder";
    algorithm: "none";
    note: "Local demo placeholder only; not cryptographic signing.";
  };
  audit_metadata: {
    schema_version: "atg.local-gate-pass-receipt.v1";
    source: "local_gate_pass_demo";
    local_only: true;
    private_data_included: false;
    network_call_performed: false;
    external_agent_contacted: false;
    payment_triggered: false;
    action_executed: false;
  };
}

export interface LocalGatePassAuditSummary {
  request_id: string;
  verdict: LocalGatePassVerdict;
  receipt_type: LocalGatePassReceiptType;
  settlement_allowed: boolean;
  failed_checks: string[];
  reason_codes: string[];
}

export function createLocalGatePassAuditReceipt(
  input: LocalGatePassDemoInput,
): LocalGatePassAuditReceipt {
  const decision = runLocalGatePassDemo(input);
  const checkedAt = decision.checked_at;
  const mandate = checkMandate(input, checkedAt);
  const evidence = checkEvidence(input);
  const verifiedIntent = checkVerifiedIntent(input);
  const limits = checkLimits(input);
  const approval = checkApproval(input);

  return {
    receipt_id: createLocalGatePassReceiptId(input.request_id, checkedAt),
    request_id: safeText(input.request_id, "demo_request", 80),
    agent_id: safeText(input.agent_id, "demo_agent", 80),
    requested_action: safeText(input.requested_action, "unspecified_local_demo_action", 160),
    action_category: safeText(input.action_category, "unknown_local_category", 80),
    verdict: decision.verdict,
    allowed: decision.allowed,
    settlement_allowed: decision.verdict === "allow_signed_gate_pass",
    settlement_executed: false,
    receipt_type: decision.receipt_type,
    risk_tier: riskTier(decision.verdict, input),
    checks: {
      mandate,
      evidence,
      verified_intent: verifiedIntent,
      limits,
      approval,
    },
    reason_codes: [...decision.reason_codes],
    checked_at: checkedAt,
    signature_metadata: {
      signature_mode: "local_demo_placeholder",
      algorithm: "none",
      note: "Local demo placeholder only; not cryptographic signing.",
    },
    audit_metadata: {
      schema_version: "atg.local-gate-pass-receipt.v1",
      source: "local_gate_pass_demo",
      local_only: true,
      private_data_included: false,
      network_call_performed: false,
      external_agent_contacted: false,
      payment_triggered: false,
      action_executed: false,
    },
  };
}

export function createLocalGatePassReceiptId(
  requestId: string,
  checkedAt: string,
): string {
  const digest = createHash("sha256")
    .update(`${requestId}|${checkedAt}`, "utf8")
    .digest("hex");
  return `receipt_demo_${digest.slice(0, 24)}`;
}

export function summariseLocalGatePassAudit(
  receipt: LocalGatePassAuditReceipt,
): LocalGatePassAuditSummary {
  return {
    request_id: receipt.request_id,
    verdict: receipt.verdict,
    receipt_type: receipt.receipt_type,
    settlement_allowed: receipt.settlement_allowed,
    failed_checks: Object.entries(receipt.checks)
      .filter(([, check]) => !check.passed)
      .map(([name]) => name),
    reason_codes: [...receipt.reason_codes],
  };
}

function checkMandate(input: LocalGatePassDemoInput, checkedAt: string): LocalAuditCheck {
  if (input.mandate?.present !== true) return { passed: false, reason: "mandate_missing" };
  if (!input.mandate.scope?.trim()) return { passed: false, reason: "mandate_scope_missing" };
  const expiry = new Date(input.mandate.expires_at ?? "");
  const checked = new Date(checkedAt);
  if (Number.isNaN(expiry.valueOf()) || expiry.valueOf() <= checked.valueOf()) {
    return { passed: false, reason: "mandate_expired" };
  }
  return { passed: true, reason: "mandate_present_in_scope_and_current" };
}

function checkEvidence(input: LocalGatePassDemoInput): LocalEvidenceAuditCheck {
  const present = input.evidence?.present === true;
  const fresh = present && input.evidence?.fresh === true;
  return {
    passed: fresh,
    fresh,
    reason: !present ? "evidence_missing" : fresh ? "evidence_present_and_fresh" : "evidence_stale",
  };
}

function checkVerifiedIntent(input: LocalGatePassDemoInput): LocalAuditCheck {
  const passed = input.verified_intent?.present === true;
  return { passed, reason: passed ? "intent_verified" : "verified_intent_missing" };
}

function checkLimits(input: LocalGatePassDemoInput): LocalAuditCheck {
  const spend = amount(input.limits?.spend_amount_gbp);
  const maximum = amount(input.limits?.max_allowed_gbp);
  const passed = spend <= maximum;
  return { passed, reason: passed ? "within_configured_limit" : "configured_limit_exceeded" };
}

function checkApproval(input: LocalGatePassDemoInput): LocalApprovalAuditCheck {
  const required = input.approval?.required === true;
  const passed = !required || input.approval?.status === "approved";
  return {
    passed,
    required,
    reason: !required
      ? "approval_not_required"
      : passed
        ? "required_approval_present"
        : "required_approval_missing_or_pending",
  };
}

function riskTier(
  verdict: LocalGatePassVerdict,
  input: LocalGatePassDemoInput,
): LocalGatePassRiskTier {
  if (verdict.startsWith("refuse_")) return "blocked";
  if (verdict === "review_required" || input.approval?.required === true) return "high";
  return "low";
}

function amount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0;
}

function safeText(value: unknown, fallback: string, maximum: number): string {
  if (typeof value !== "string") return fallback;
  const normalised = value.trim().replace(/[\u0000-\u001f\u007f]/g, " ").slice(0, maximum);
  return normalised || fallback;
}
