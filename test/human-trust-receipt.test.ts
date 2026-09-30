import assert from "node:assert/strict";
import test from "node:test";

import {
  createHumanTrustReceipt,
  HUMAN_TRUST_RECEIPT_CLAIM_BOUNDARY,
  HUMAN_TRUST_RECEIPT_VERSION,
  renderHumanTrustReceiptText,
} from "../src/human-trust-receipt.js";
import {
  createHumanTrustReceiptScenarios,
  runHumanTrustReceiptDemo,
  runHumanTrustReceiptScenario,
} from "../src/human-trust-receipt-cli.js";

test("P3-M156 produces one deterministic example of each public receipt status", () => {
  const report = runHumanTrustReceiptDemo();
  assert.equal(report.summary.scenarioCount, 4);
  assert.equal(report.summary.authorised, 1);
  assert.equal(report.summary.completed, 1);
  assert.equal(report.summary.refused, 1);
  assert.equal(report.summary.unverified, 1);
  assert.equal(report.summary.externalActionsPerformed, false);
});

test("authorised receipt requires the linked standing, authority, policy and GatePass chain", () => {
  const result = runHumanTrustReceiptScenario("authorised_refund");
  assert.equal(result.chainVerified, true);
  assert.equal(result.receipt.status, "AUTHORISED");
  assert.equal(result.receipt.agent.standingVerified, true);
  assert.equal(result.receipt.authority.verified, true);
  assert.equal(result.receipt.checks.policyChecked, true);
  assert.equal(result.receipt.checks.exactActionVerified, true);
  assert.equal(result.receipt.checks.executionMatched, null);
  assert.equal(result.receipt.receiptVersion, HUMAN_TRUST_RECEIPT_VERSION);
  assert.equal(result.receipt.claimBoundary, HUMAN_TRUST_RECEIPT_CLAIM_BOUNDARY);
});

test("completed receipt is emitted only for an executed acknowledgement linked to the same GatePass and action digest", () => {
  const result = runHumanTrustReceiptScenario("completed_refund");
  assert.equal(result.chainVerified, true);
  assert.equal(result.receipt.status, "COMPLETED_EXACTLY_AS_AUTHORISED");
  assert.equal(result.receipt.checks.executionMatched, true);
  assert.equal(result.receipt.evidence.executionReceiptReference, "EXEC-REFUND-77291");
});

test("a legitimate refusal remains human-readable without inventing a GatePass", () => {
  const result = runHumanTrustReceiptScenario("refused_missing_evidence");
  assert.equal(result.chainVerified, true);
  assert.equal(result.receipt.status, "REFUSED");
  assert.equal(result.receipt.refusalReason, "REQUIRED_RETURN_EVIDENCE_MISSING");
  assert.equal(result.receipt.evidence.gatePassId, null);
  assert.equal(result.receipt.checks.executionMatched, null);
});

test("changed execution digest fails closed as UNVERIFIED", () => {
  const result = runHumanTrustReceiptScenario("tampered_execution_digest");
  assert.equal(result.chainVerified, false);
  assert.equal(result.receipt.status, "UNVERIFIED");
  assert.ok(result.verificationFailures.includes("EXECUTION_ACTION_DIGEST_MISMATCH"));
  assert.equal(result.receipt.checks.exactActionVerified, false);
  assert.equal(result.receipt.checks.executionMatched, false);
});

test("missing required human authority proof cannot become an authorised receipt", () => {
  const input = structuredClone(createHumanTrustReceiptScenarios().authorised_refund);
  input.humanAuthority.proofReference = null;
  const result = createHumanTrustReceipt(input);
  assert.equal(result.receipt.status, "UNVERIFIED");
  assert.ok(result.verificationFailures.includes("HUMAN_AUTHORITY_PROOF_MISSING"));
});

test("changed GatePass id cannot become an authorised receipt", () => {
  const input = structuredClone(createHumanTrustReceiptScenarios().authorised_refund);
  input.gatePass.gatePassId = "GP-TAMPERED";
  const result = createHumanTrustReceipt(input);
  assert.equal(result.receipt.status, "UNVERIFIED");
  assert.ok(result.verificationFailures.includes("GATEPASS_ID_MISMATCH"));
});

test("unverified execution cannot claim completion", () => {
  const input = structuredClone(createHumanTrustReceiptScenarios().completed_refund);
  input.execution.verificationVerified = false;
  const result = createHumanTrustReceipt(input);
  assert.equal(result.receipt.status, "UNVERIFIED");
  assert.ok(result.verificationFailures.includes("EXECUTION_VERIFICATION_NOT_VERIFIED"));
});

test("plain-language renderer exposes an unverified chain rather than a false verified claim", () => {
  const result = runHumanTrustReceiptScenario("tampered_execution_digest");
  const text = renderHumanTrustReceiptText(result.receipt);
  assert.match(text, /Status: UNVERIFIED/);
  assert.match(text, /Exact action verified: NO/);
  assert.match(text, /Execution matched authority: NO/);
  assert.match(text, /underlying machine-verifiable evidence remains the source of proof/i);
});
