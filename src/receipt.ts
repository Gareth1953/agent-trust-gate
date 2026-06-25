import { randomUUID } from "node:crypto";

import type {
  HumanApprovalStatus,
  InputSummary,
  RiskEvaluation,
  VerificationReceipt,
  VerifyBeforeActionInput,
} from "./types.js";

export const LIMITATIONS = [
  "Not legal advice.",
  "Not compliance certification.",
  "Not a security audit.",
  "Does not guarantee safety.",
  "Does not move money.",
  "Does not approve high-risk actions by itself.",
  "Does not replace human approval for high-risk actions.",
] as const;

function summarizeInput(input: VerifyBeforeActionInput): InputSummary {
  const status: HumanApprovalStatus = input.human_approval_status ?? "not_requested";

  return {
    action_type: input.action_type,
    description: input.description,
    actor: input.actor,
    target: input.target,
    estimated_cost_gbp: input.estimated_cost_gbp ?? 0,
    public_action: input.public_action ?? false,
    external_commitment: input.external_commitment ?? false,
    money_movement: input.money_movement ?? false,
    legal_or_compliance_sensitive: input.legal_or_compliance_sensitive ?? false,
    customer_or_user_facing: input.customer_or_user_facing ?? false,
    evidence_count: input.evidence?.length ?? 0,
    has_rollback_plan:
      typeof input.rollback_plan === "string" && input.rollback_plan.trim().length > 0,
    human_approval_status: status,
  };
}

export function createReceipt(
  input: VerifyBeforeActionInput,
  evaluation: RiskEvaluation,
): VerificationReceipt {
  const approvalGranted = input.human_approval_status === "approved";
  const allowed =
    evaluation.risk_level !== "blocked" &&
    (!evaluation.human_approval_required || approvalGranted);

  let recommendedNextStep: string;
  if (allowed && evaluation.human_approval_required) {
    recommendedNextStep =
      "Proceed only within the exact scope of the recorded human approval and retain this receipt.";
  } else if (allowed) {
    recommendedNextStep = "Proceed locally as described and retain this receipt.";
  } else if (input.human_approval_status === "denied") {
    recommendedNextStep = "Do not proceed. Revise or abandon the action.";
  } else {
    recommendedNextStep =
      "Do not proceed. Obtain explicit human approval after reviewing the flagged checks.";
  }

  return {
    allowed,
    risk_level: evaluation.risk_level,
    human_approval_required: evaluation.human_approval_required,
    approval_reason:
      evaluation.approval_reasons.length > 0
        ? evaluation.approval_reasons.join(" ")
        : null,
    checks: evaluation.checks,
    receipt_id: `atg_${randomUUID()}`,
    timestamp: new Date().toISOString(),
    input_summary: summarizeInput(input),
    recommended_next_step: recommendedNextStep,
    limitations: [...LIMITATIONS],
  };
}
