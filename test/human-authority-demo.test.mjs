import assert from "node:assert/strict";
import test from "node:test";

import {
  SCENARIOS,
  canonicalize,
  createSummary,
  runAllScenarios,
  runScenario,
  sha256,
  verifySignedObject,
} from "../src/human-authority-demo.mjs";

function result(id) {
  const scenario = SCENARIOS.find((item) => item.id === id);
  assert.ok(scenario, `Scenario ${id} should exist.`);
  return runScenario(scenario);
}

test("canonicalization is stable regardless of object key order", () => {
  assert.equal(
    sha256(canonicalize({ b: 2, a: 1 })),
    sha256(canonicalize({ a: 1, b: 2 })),
  );
});

test("authorised refund produces Human Authority Proof, GatePass and execution receipt", () => {
  const observed = result("authorised_refund");
  assert.equal(observed.observed, "allowed");
  assert.equal(observed.decision.code, "VERIFIED_HUMAN_AUTHORITY");
  assert.ok(observed.humanAuthorityProof);
  assert.ok(observed.gatePass);
  assert.ok(observed.executionReceipt);
  assert.equal(verifySignedObject(observed.humanAuthorityProof), true);
  assert.equal(verifySignedObject(observed.gatePass), true);
  assert.equal(verifySignedObject(observed.executionReceipt), true);
  assert.equal(
    observed.gatePass.actionDigest,
    observed.humanAuthorityProof.actionDigest,
  );
});

test("inactive identity fails closed", () => {
  const observed = result("inactive_employee_refused");
  assert.equal(observed.observed, "refused");
  assert.equal(observed.decision.code, "IDENTITY_INACTIVE");
  assert.equal(observed.gatePass, null);
});

test("authority limit fails closed", () => {
  const observed = result("authority_limit_refused");
  assert.equal(observed.decision.code, "AUTHORITY_LIMIT_EXCEEDED");
});

test("self-approval fails separation of duties", () => {
  const observed = result("self_approval_refused");
  assert.equal(observed.decision.code, "SEPARATION_OF_DUTIES_FAILED");
});

test("required second human approval is enforced", () => {
  const refused = result("dual_approval_missing_refused");
  assert.equal(refused.decision.code, "SECOND_APPROVER_REQUIRED");

  const allowed = result("dual_approval_allowed");
  assert.equal(allowed.observed, "allowed");
  assert.equal(allowed.humanAuthorityProof.secondApprover.employeeId, "EMP-3901");
});

test("changed action after approval is refused", () => {
  const observed = result("changed_action_refused");
  assert.equal(observed.decision.code, "EXACT_ACTION_MISMATCH");
  assert.ok(observed.humanAuthorityProof);
  assert.ok(observed.gatePass);
  assert.equal(observed.executionReceipt, null);
});

test("expired and replayed proofs fail closed", () => {
  assert.equal(
    result("expired_approval_refused").decision.code,
    "HUMAN_PROOF_EXPIRED",
  );
  assert.equal(
    result("replayed_approval_refused").decision.code,
    "HUMAN_PROOF_REPLAYED",
  );
});

test("every deterministic scenario matches its expected outcome", () => {
  const summary = createSummary(runAllScenarios());
  assert.equal(summary.total, 10);
  assert.equal(summary.matched, 10);
  assert.equal(summary.allMatched, true);
});
