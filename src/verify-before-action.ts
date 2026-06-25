import { createReceipt } from "./receipt.js";
import { evaluateRisk } from "./risk-rules.js";
import type { VerificationReceipt, VerifyBeforeActionInput } from "./types.js";

export function verifyBeforeAction(
  input: VerifyBeforeActionInput,
): VerificationReceipt {
  validateInput(input);
  return createReceipt(input, evaluateRisk(input));
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
}
