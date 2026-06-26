import { createReceipt } from "./receipt.js";
import { applyPolicyProfile } from "./policy-profiles.js";
import { evaluateRisk } from "./risk-rules.js";
import type {
  VerificationReceipt,
  VerifyBeforeActionInput,
  VerifyBeforeActionOptions,
} from "./types.js";

export function verifyBeforeAction(
  input: VerifyBeforeActionInput,
  options: VerifyBeforeActionOptions = {},
): VerificationReceipt {
  validateInput(input);
  const policyApplication = applyPolicyProfile(
    evaluateRisk(input),
    options.policy_profile,
  );
  return createReceipt(input, policyApplication.evaluation, policyApplication.policy);
}

function validateInput(input: VerifyBeforeActionInput): void {
  for (const field of ["action_type", "description", "actor", "target"] as const) {
    if (typeof input[field] !== "string" || input[field].trim().length === 0) {
      throw new TypeError(`${field} must be a non-empty string.`);
    }
  }

  if (
    input.estimated_cost_gbp !== undefined &&
    (!Number.isFinite(input.estimated_cost_gbp) || input.estimated_cost_gbp < 0)
  ) {
    throw new RangeError("estimated_cost_gbp must be a finite, non-negative number.");
  }

  if (
    input.human_approval_status !== undefined &&
    !["not_requested", "requested", "approved", "rejected"].includes(
      input.human_approval_status,
    )
  ) {
    throw new TypeError(
      "human_approval_status must be one of: not_requested, requested, approved, rejected.",
    );
  }
}
