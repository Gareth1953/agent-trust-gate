import { validateActionDescriptor } from "./action-validation.js";
import { createReceipt } from "./receipt.js";
import { applyPolicyProfile } from "./policy-profiles.js";
import { evaluateRisk } from "./risk-rules.js";
import type {
  VerificationReceipt,
  VerifyBeforeActionInput,
  VerifyBeforeActionOptions,
} from "./types.js";

export function verifyBeforeAction(
  input: unknown,
  options: VerifyBeforeActionOptions = {},
): VerificationReceipt {
  validateActionDescriptor(input);
  const policyApplication = applyPolicyProfile(
    evaluateRisk(input),
    options.policy_profile,
  );
  return createReceipt(input, policyApplication.evaluation, policyApplication.policy);
}
