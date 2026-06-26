import assert from "node:assert/strict";
import test from "node:test";

import { verifyBeforeAction, type VerifyBeforeActionInput } from "../src/index.js";

function baseInput(
  overrides: Partial<VerifyBeforeActionInput> = {},
): VerifyBeforeActionInput {
  return {
    action_type: "local_file_update",
    description: "Update a local test fixture.",
    actor: "test-agent",
    target: "local-workspace",
    estimated_cost_gbp: 0,
    public_action: false,
    external_commitment: false,
    money_movement: false,
    legal_or_compliance_sensitive: false,
    customer_or_user_facing: false,
    evidence: ["Unit tests cover the change."],
    rollback_plan: "Revert the local fixture.",
    human_approval_status: "not_requested",
    ...overrides,
  };
}

test("defaults to the standard policy profile", () => {
  const receipt = verifyBeforeAction(baseInput());

  assert.equal(receipt.policy_profile, "standard");
  assert.equal(receipt.regulated_policy, false);
  assert.match(receipt.policy_notes.join(" "), /standard policy profile/i);
});

test("strict profile records approval policy for a medium-risk action", () => {
  const input = baseInput();
  delete input.rollback_plan;

  const receipt = verifyBeforeAction(input, { policy_profile: "strict" });

  assert.equal(receipt.allowed, false);
  assert.equal(receipt.risk_level, "medium");
  assert.equal(receipt.human_approval_required, true);
  assert.equal(receipt.policy_profile, "strict");
  assert.match(receipt.approval_reason ?? "", /strict policy/i);
});

test("regulated profile adds regulated policy metadata without claiming compliance", () => {
  const receipt = verifyBeforeAction(baseInput({ public_action: true }), {
    policy_profile: "regulated",
  });

  assert.equal(receipt.policy_profile, "regulated");
  assert.equal(receipt.regulated_policy, true);
  assert.match(receipt.policy_notes.join(" "), /regulated-style policy/i);
  assert.match(receipt.policy_notes.join(" "), /does not claim legal compliance/i);
});

test("unknown policy profile is rejected clearly", () => {
  assert.throws(
    () => verifyBeforeAction(baseInput(), { policy_profile: "unknown" }),
    /Unknown policy profile "unknown"/,
  );
});
