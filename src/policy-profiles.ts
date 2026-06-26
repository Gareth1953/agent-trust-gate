import type { RiskEvaluation, VerificationCheck } from "./types.js";

export type PolicyProfileName = "standard" | "strict" | "regulated";

export interface PolicyProfile {
  name: PolicyProfileName;
  notes: string[];
  regulated_policy: boolean;
}

export interface PolicyApplication {
  evaluation: RiskEvaluation;
  policy: PolicyProfile;
}

const POLICY_NOTES: Record<PolicyProfileName, string[]> = {
  standard: [
    "Standard policy profile applied: current Agent Trust Gate base rules were used.",
  ],
  strict: [
    "Strict policy profile applied: medium-risk and high-risk actions require explicit human approval.",
  ],
  regulated: [
    "Regulated-style policy profile applied: medium-risk and high-risk actions require explicit human approval.",
    "This is a local trust policy record and does not claim legal compliance.",
  ],
};

export function resolvePolicyProfile(profile?: string): PolicyProfile {
  const name = profile ?? "standard";

  if (!isPolicyProfileName(name)) {
    throw new TypeError(
      `Unknown policy profile "${name}". Expected one of: standard, strict, regulated.`,
    );
  }

  return {
    name,
    notes: [...POLICY_NOTES[name]],
    regulated_policy: name === "regulated",
  };
}

export function applyPolicyProfile(
  evaluation: RiskEvaluation,
  profileName?: string,
): PolicyApplication {
  const policy = resolvePolicyProfile(profileName);
  const nextEvaluation: RiskEvaluation = {
    ...evaluation,
    approval_reasons: [...evaluation.approval_reasons],
    checks: [...evaluation.checks],
  };

  if (policy.name === "strict" || policy.name === "regulated") {
    applyMediumHighApprovalPolicy(nextEvaluation, policy.name);
  }

  nextEvaluation.checks.push(policyCheck(policy));

  return {
    evaluation: nextEvaluation,
    policy,
  };
}

function applyMediumHighApprovalPolicy(
  evaluation: RiskEvaluation,
  profileName: Exclude<PolicyProfileName, "standard">,
): void {
  if (evaluation.risk_level !== "medium" && evaluation.risk_level !== "high") {
    return;
  }

  const reason =
    profileName === "regulated"
      ? "Regulated-style policy requires explicit human approval for medium-risk and high-risk actions."
      : "Strict policy requires explicit human approval for medium-risk and high-risk actions.";

  if (!evaluation.human_approval_required) {
    evaluation.human_approval_required = true;
  }

  if (!evaluation.approval_reasons.includes(reason)) {
    evaluation.approval_reasons.push(reason);
  }

  evaluation.checks.push({
    check: "policy_profile_threshold",
    passed: false,
    severity: evaluation.risk_level,
    message: reason,
  });
}

function policyCheck(policy: PolicyProfile): VerificationCheck {
  return {
    check: "policy_profile",
    passed: true,
    severity: policy.name === "standard" ? "low" : "medium",
    message: policy.notes.join(" "),
  };
}

function isPolicyProfileName(value: string): value is PolicyProfileName {
  return value === "standard" || value === "strict" || value === "regulated";
}
