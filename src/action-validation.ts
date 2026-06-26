import { REQUIRED_INPUT_FIELDS } from "./contract.js";
import type { VerifyBeforeActionInput } from "./types.js";

export interface ActionValidationDetail {
  field: string;
  issue: string;
}

export class ActionValidationError extends TypeError {
  readonly code = "INVALID_ACTION_DESCRIPTOR";
  readonly details: ActionValidationDetail[];

  constructor(details: ActionValidationDetail[]) {
    super(formatValidationMessage(details));
    this.name = "ActionValidationError";
    this.details = details;
  }
}

export function validateActionDescriptor(input: unknown): asserts input is VerifyBeforeActionInput {
  const details: ActionValidationDetail[] = [];

  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new ActionValidationError([
      {
        field: "action_descriptor",
        issue: "Action descriptor must be a JSON object.",
      },
    ]);
  }

  const descriptor = input as Record<string, unknown>;

  for (const field of REQUIRED_INPUT_FIELDS) {
    const value = descriptor[field];
    if (value === undefined) {
      details.push({
        field,
        issue: `${field} is required.`,
      });
    } else if (typeof value !== "string") {
      details.push({
        field,
        issue: `${field} must be a string.`,
      });
    } else if (value.trim().length === 0) {
      details.push({
        field,
        issue: `${field} must be a non-empty string.`,
      });
    }
  }

  validateOptionalNumber(descriptor, "estimated_cost_gbp", details);
  for (const field of [
    "public_action",
    "external_commitment",
    "money_movement",
    "legal_or_compliance_sensitive",
    "customer_or_user_facing",
  ]) {
    validateOptionalBoolean(descriptor, field, details);
  }

  if (
    descriptor.evidence !== undefined &&
    (!Array.isArray(descriptor.evidence) ||
      !descriptor.evidence.every((item) => typeof item === "string"))
  ) {
    details.push({
      field: "evidence",
      issue: "evidence must be an array of strings when supplied.",
    });
  }

  if (
    descriptor.rollback_plan !== undefined &&
    typeof descriptor.rollback_plan !== "string"
  ) {
    details.push({
      field: "rollback_plan",
      issue: "rollback_plan must be a string when supplied.",
    });
  }

  if (
    descriptor.human_approval_status !== undefined &&
    (typeof descriptor.human_approval_status !== "string" ||
      !["not_requested", "requested", "approved", "rejected"].includes(
        descriptor.human_approval_status,
      ))
  ) {
    details.push({
      field: "human_approval_status",
      issue:
        "human_approval_status must be one of: not_requested, requested, approved, rejected.",
    });
  }

  if (details.length > 0) {
    throw new ActionValidationError(details);
  }
}

function validateOptionalNumber(
  descriptor: Record<string, unknown>,
  field: string,
  details: ActionValidationDetail[],
): void {
  const value = descriptor[field];
  if (value === undefined) {
    return;
  }

  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    details.push({
      field,
      issue: `${field} must be a finite, non-negative number when supplied.`,
    });
  }
}

function validateOptionalBoolean(
  descriptor: Record<string, unknown>,
  field: string,
  details: ActionValidationDetail[],
): void {
  const value = descriptor[field];
  if (value === undefined) {
    return;
  }

  if (typeof value !== "boolean") {
    details.push({
      field,
      issue: `${field} must be a boolean when supplied.`,
    });
  }
}

function formatValidationMessage(details: ActionValidationDetail[]): string {
  return `Invalid action descriptor: ${details.map((detail) => detail.issue).join(" ")}`;
}
