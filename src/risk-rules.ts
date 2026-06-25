import type {
  HumanApprovalStatus,
  RiskEvaluation,
  VerifyBeforeActionInput,
  VerificationCheck,
} from "./types.js";

function approvalStatus(input: VerifyBeforeActionInput): HumanApprovalStatus {
  return input.human_approval_status ?? "not_requested";
}

function addApprovalCheck(
  checks: VerificationCheck[],
  reasons: string[],
  condition: boolean,
  check: string,
  message: string,
): void {
  checks.push({
    check,
    passed: !condition,
    severity: "high",
    message: condition ? message : `${check} is not present.`,
  });

  if (condition) {
    reasons.push(message);
  }
}

export function evaluateRisk(input: VerifyBeforeActionInput): RiskEvaluation {
  const checks: VerificationCheck[] = [];
  const approvalReasons: string[] = [];
  const estimatedCost = input.estimated_cost_gbp ?? 0;

  addApprovalCheck(
    checks,
    approvalReasons,
    input.public_action === true,
    "public_action",
    "Public actions require explicit human approval.",
  );
  addApprovalCheck(
    checks,
    approvalReasons,
    input.external_commitment === true,
    "external_commitment",
    "External commitments require explicit human approval.",
  );
  addApprovalCheck(
    checks,
    approvalReasons,
    input.legal_or_compliance_sensitive === true,
    "legal_or_compliance_sensitive",
    "Legal or compliance-sensitive actions require explicit human approval.",
  );
  addApprovalCheck(
    checks,
    approvalReasons,
    input.customer_or_user_facing === true,
    "customer_or_user_facing",
    "Customer- or user-facing actions require explicit human approval.",
  );
  addApprovalCheck(
    checks,
    approvalReasons,
    estimatedCost > 0,
    "estimated_cost_gbp",
    "Any action with an estimated cost above £0 requires explicit human approval.",
  );

  const moneyMovement = input.money_movement === true;
  checks.push({
    check: "money_movement",
    passed: !moneyMovement,
    severity: "high",
    message: moneyMovement
      ? "Money movement is blocked unless explicit human approval exists."
      : "No money movement is present.",
  });
  if (moneyMovement) {
    approvalReasons.push("Money movement requires explicit human approval.");
  }

  const hasInitialHighRisk = approvalReasons.length > 0;
  const hasRollbackPlan =
    typeof input.rollback_plan === "string" && input.rollback_plan.trim().length > 0;
  const missingRollbackNeedsApproval = !hasRollbackPlan && (hasInitialHighRisk || !isLowRiskCandidate(input));

  checks.push({
    check: "rollback_plan",
    passed: hasRollbackPlan,
    severity: missingRollbackNeedsApproval ? "medium" : "low",
    message: hasRollbackPlan
      ? "A rollback plan is present."
      : "No rollback plan was supplied.",
  });

  if (!hasRollbackPlan) {
    approvalReasons.push("A rollback plan is required before this action can be treated as low risk.");
  }

  const status = approvalStatus(input);
  const humanApprovalRequired = approvalReasons.length > 0;

  if (moneyMovement && status !== "approved") {
    return {
      risk_level: "blocked",
      human_approval_required: true,
      approval_reasons: approvalReasons,
      checks,
    };
  }

  if (status === "denied" && humanApprovalRequired) {
    return {
      risk_level: "blocked",
      human_approval_required: true,
      approval_reasons: [...approvalReasons, "Human approval was denied."],
      checks,
    };
  }

  if (humanApprovalRequired) {
    return {
      risk_level: hasInitialHighRisk ? "high" : "medium",
      human_approval_required: true,
      approval_reasons: approvalReasons,
      checks,
    };
  }

  return {
    risk_level: "low",
    human_approval_required: false,
    approval_reasons: [],
    checks,
  };
}

function isLowRiskCandidate(input: VerifyBeforeActionInput): boolean {
  return (
    (input.estimated_cost_gbp ?? 0) === 0 &&
    input.public_action !== true &&
    input.external_commitment !== true &&
    input.money_movement !== true &&
    input.legal_or_compliance_sensitive !== true &&
    input.customer_or_user_facing !== true
  );
}
