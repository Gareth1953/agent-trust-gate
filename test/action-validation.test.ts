import assert from "node:assert/strict";
import test from "node:test";

import { ActionValidationError, validateActionDescriptor } from "../src/index.js";

function validAction(overrides: Record<string, unknown> = {}) {
  return {
    action_type: "local_file_update",
    actor: "test-agent",
    target: "local-workspace",
    description: "Update a local test fixture.",
    ...overrides,
  };
}

test("missing required action field fails validation", () => {
  const action = validAction();
  delete (action as Partial<typeof action>).actor;

  assert.throws(
    () => validateActionDescriptor(action),
    (error) =>
      error instanceof ActionValidationError &&
      error.details.some((detail) => detail.field === "actor"),
  );
});

test("empty required action field fails validation", () => {
  assert.throws(
    () => validateActionDescriptor(validAction({ description: " " })),
    (error) =>
      error instanceof ActionValidationError &&
      error.details.some((detail) => detail.field === "description"),
  );
});

test("invalid field type fails validation", () => {
  assert.throws(
    () => validateActionDescriptor(validAction({ public_action: "yes" })),
    (error) =>
      error instanceof ActionValidationError &&
      error.details.some((detail) => detail.field === "public_action"),
  );
});

test("unknown extra fields do not fail validation", () => {
  assert.doesNotThrow(() =>
    validateActionDescriptor(validAction({ unknown_extra_field: "kept-compatible" })),
  );
});
