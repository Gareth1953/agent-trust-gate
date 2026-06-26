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

test("allows a low-risk internal action", () => {
  const receipt = verifyBeforeAction(baseInput());

  assert.equal(receipt.allowed, true);
  assert.equal(receipt.risk_level, "low");
  assert.equal(receipt.human_approval_required, false);
});

test("requires approval for a public post", () => {
  const receipt = verifyBeforeAction(baseInput({ public_action: true }));

  assert.equal(receipt.allowed, false);
  assert.equal(receipt.risk_level, "high");
  assert.equal(receipt.human_approval_required, true);
});

test("allows an approved public action while keeping it high risk", () => {
  const receipt = verifyBeforeAction(
    baseInput({ public_action: true, human_approval_status: "approved" }),
  );

  assert.equal(receipt.allowed, true);
  assert.equal(receipt.risk_level, "high");
  assert.equal(receipt.human_approval_required, true);
  assert.match(receipt.recommended_next_step, /exact scope/i);
});

test("rejected approval status blocks the action", () => {
  const receipt = verifyBeforeAction(
    baseInput({ public_action: true, human_approval_status: "rejected" }),
  );

  assert.equal(receipt.allowed, false);
  assert.equal(receipt.risk_level, "blocked");
  assert.equal(receipt.human_approval_required, true);
  assert.match(receipt.approval_reason ?? "", /rejected/i);
});

test("blocks money movement without explicit approval", () => {
  const receipt = verifyBeforeAction(baseInput({ money_movement: true }));

  assert.equal(receipt.allowed, false);
  assert.equal(receipt.risk_level, "blocked");
  assert.equal(receipt.human_approval_required, true);
});

test("allows approved money movement while keeping it high risk", () => {
  const receipt = verifyBeforeAction(
    baseInput({ money_movement: true, human_approval_status: "approved" }),
  );

  assert.equal(receipt.allowed, true);
  assert.equal(receipt.risk_level, "high");
  assert.equal(receipt.human_approval_required, true);
  assert.match(
    receipt.checks.find((check) => check.check === "human_approval_status")?.message ?? "",
    /explicit human approval is recorded/i,
  );
});

test("requires approval for a legal or compliance-sensitive action", () => {
  const receipt = verifyBeforeAction(
    baseInput({ legal_or_compliance_sensitive: true }),
  );

  assert.equal(receipt.allowed, false);
  assert.equal(receipt.human_approval_required, true);
});

test("requires approval for a customer- or user-facing action", () => {
  const receipt = verifyBeforeAction(baseInput({ customer_or_user_facing: true }));

  assert.equal(receipt.allowed, false);
  assert.equal(receipt.human_approval_required, true);
});

test("missing rollback plan increases the approval requirement", () => {
  const input = baseInput();
  delete input.rollback_plan;
  const receipt = verifyBeforeAction(input);

  assert.equal(receipt.allowed, false);
  assert.equal(receipt.risk_level, "medium");
  assert.equal(receipt.human_approval_required, true);
  assert.match(receipt.approval_reason ?? "", /rollback plan/i);
});

test("receipt contains an ID and ISO timestamp", () => {
  const receipt = verifyBeforeAction(baseInput());

  assert.match(receipt.receipt_id, /^atg_[0-9a-f-]{36}$/);
  assert.equal(new Date(receipt.timestamp).toISOString(), receipt.timestamp);
});
