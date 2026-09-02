import assert from "node:assert/strict";
import test from "node:test";

import {
  ExactActionTrustGatewayPrototype,
  createExactActionPrototypeScenario,
  runExactActionPrototypeSmoke,
  verifyExactActionTrustReceipt,
  type AtgPrototypeCheck,
  type ExactActionPrototypeEvaluation,
} from "../src/exact-action-trust-gateway-prototype.js";
import { recomputeCanonicalActionDigest } from "../src/exact-action-gatepass.js";

async function evaluate(
  scenarioId: Parameters<ExactActionTrustGatewayPrototype["evaluateExactAction"]>[0],
): Promise<{ gateway: ExactActionTrustGatewayPrototype; evaluation: ExactActionPrototypeEvaluation }> {
  const gateway = new ExactActionTrustGatewayPrototype();
  const evaluation = await gateway.evaluateExactAction(scenarioId);
  return { gateway, evaluation };
}

function check(evaluation: ExactActionPrototypeEvaluation, id: string): AtgPrototypeCheck {
  const found = evaluation.checks.find((candidate) => candidate.id === id);
  assert.ok(found, `missing ATG check ${id}`);
  return found;
}

test("authorised human and active agent allow the £23,750 exact purchase", async () => {
  const { evaluation } = await evaluate("allowed");
  assert.equal(evaluation.decision, "GATEPASS_ISSUED");
  assert.equal(evaluation.humanAuthorityResult.decision.code, "VERIFIED_HUMAN_AUTHORITY");
  assert.equal(evaluation.humanAuthorityResult.gatePass, null, "human authority stage must not issue a competing purchase GatePass");
  assert.equal(evaluation.agentStandingReceipt.outcome, "STANDING_VERIFIED");
  assert.equal(evaluation.proposedAction.totalAmount, 23750);
  assert.equal(evaluation.checks.length, 20);
  assert.ok(evaluation.checks.every((candidate) => candidate.status === "PASS"));
});

test("wrong human authority fails closed with no GatePass", async () => {
  const { evaluation } = await evaluate("wrong_human_authority");
  assert.equal(evaluation.decision, "ACTION_REFUSED");
  assert.equal(evaluation.gatePass, null);
  assert.equal(check(evaluation, "human_identity_evidence").passed, true);
  assert.equal(check(evaluation, "human_authority").passed, false);
  assert.match(check(evaluation, "human_authority").reason, /not authorised/i);
});

test("expired Human Authority Proof is refused", async () => {
  const { evaluation } = await evaluate("expired_authority");
  assert.equal(evaluation.decision, "ACTION_REFUSED");
  assert.equal(evaluation.gatePass, null);
  assert.equal(check(evaluation, "human_authority_fresh").passed, false);
  assert.equal(evaluation.humanAuthorityResult.decision.code, "HUMAN_PROOF_EXPIRED");
});

test("disabled or revoked agent standing is refused", async () => {
  const { evaluation } = await evaluate("agent_standing_failure");
  assert.equal(evaluation.agentStandingReceipt.outcome, "STANDING_REFUSED");
  assert.ok(evaluation.agentStandingReceipt.reasonCodes.includes("STANDING_DELEGATION_REVOKED"));
  assert.equal(check(evaluation, "agent_standing").passed, false);
  assert.equal(evaluation.gatePass, null);
});

test("valid machine-readable mandate passes and retains bounded fields", async () => {
  const { evaluation } = await evaluate("allowed");
  assert.equal(check(evaluation, "mandate_present").passed, true);
  assert.equal(check(evaluation, "mandate_fresh").passed, true);
  assert.equal(evaluation.mandate.maximumAmount, 25000);
  assert.equal(evaluation.mandate.maximumQuantity, 200);
  assert.deepEqual(evaluation.mandate.permittedSupplierIds, ["SUP-HARBOUR-001"]);
  assert.ok(evaluation.mandate.digest.startsWith("sha256:"));
});

test("expired mandate is refused before GatePass issuance", async () => {
  const { evaluation } = await evaluate("expired_mandate");
  assert.equal(evaluation.decision, "ACTION_REFUSED");
  assert.equal(check(evaluation, "mandate_fresh").passed, false);
  assert.equal(evaluation.gatePass, null);
});

test("spend under the limit passes", async () => {
  const { evaluation } = await evaluate("allowed");
  assert.equal(check(evaluation, "amount").passed, true);
  assert.match(check(evaluation, "amount").reason, /£23,750.*£25,000/);
});

test("£31,000 overspend violates authority and mandate and produces no GatePass", async () => {
  const { evaluation } = await evaluate("overspend");
  assert.equal(evaluation.decision, "ACTION_REFUSED");
  assert.equal(check(evaluation, "amount").passed, false);
  assert.match(check(evaluation, "amount").reason, /£31,000.*£25,000/);
  assert.equal(evaluation.gatePass, null);
  assert.equal(evaluation.trustReceipt.gatePassIssued, false);
  assert.equal(evaluation.refusal?.primaryFailureCode, "AUTHORITY_LIMIT_EXCEEDED");
  assert.equal(evaluation.refusal?.primaryFailure.requestedValue, 31000);
  assert.equal(evaluation.refusal?.primaryFailure.permittedValue, 25000);
});

test("approved supplier and category pass", async () => {
  const { evaluation } = await evaluate("allowed");
  assert.equal(check(evaluation, "supplier_category").passed, true);
  assert.equal(evaluation.proposedAction.supplierId, "SUP-HARBOUR-001");
  assert.equal(evaluation.proposedAction.category, "product_x");
});

test("unapproved changed supplier is refused at pre-action evaluation", async () => {
  const scenario = createExactActionPrototypeScenario("allowed");
  scenario.proposedAction.supplierId = "SUP-UNAPPROVED-999";
  scenario.proposedAction.supplierName = "Unapproved Synthetic Supplier Ltd";
  const { evaluation } = await evaluate(scenario);
  assert.equal(evaluation.decision, "ACTION_REFUSED");
  assert.equal(check(evaluation, "supplier_category").passed, false);
  assert.equal(evaluation.gatePass, null);
});

test("canonical digest is generated by and recomputes through the existing ATG engine", async () => {
  const { evaluation } = await evaluate("allowed");
  assert.equal(evaluation.exactAction.actionDigest, recomputeCanonicalActionDigest(evaluation.exactAction));
  assert.equal(check(evaluation, "canonicalisation").passed, true);
  assert.equal(check(evaluation, "digest_binding").passed, true);
});

test("signed GatePass verifies and is consumed only at matching execution", async () => {
  const { gateway, evaluation } = await evaluate("allowed");
  assert.ok(evaluation.gatePass?.signature.signature);
  const result = await gateway.executeWithGatePass(evaluation);
  assert.equal(result.execution.status, "SIMULATED_PURCHASE_COMPLETED");
  assert.equal(result.execution.gatePassConsumed, true);
  assert.equal(result.execution.underlyingExactActionReceipt?.verification.signatureValid, true);
  assert.equal(result.execution.underlyingExactActionReceipt?.verification.verified, true);
});

test("execution without a GatePass is blocked and no purchase occurs", async () => {
  const { gateway, evaluation } = await evaluate("overspend");
  const result = await gateway.executeWithGatePass(evaluation);
  assert.equal(result.execution.status, "BLOCKED_NO_GATEPASS");
  assert.equal(result.execution.simulatedPurchaseReference, null);
  assert.equal(result.execution.realOrderCreated, false);
  assert.equal(result.execution.realPaymentProcessed, false);
});

test("malformed GatePass fails closed", async () => {
  const { gateway, evaluation } = await evaluate("allowed");
  const result = await gateway.executeWithGatePass(evaluation, { gatePass: { gatePassId: "malformed" } });
  assert.equal(result.execution.status, "BLOCKED_INVALID_GATEPASS");
  assert.deepEqual(result.execution.reasonCodes, ["MALFORMED_GATEPASS"]);
  assert.equal(result.execution.gatePassConsumed, false);
});

test("expired GatePass cannot execute", async () => {
  const { gateway, evaluation } = await evaluate("allowed");
  const result = await gateway.executeWithGatePass(evaluation, {
    executedAt: "2026-09-02T09:06:00.000Z",
  });
  assert.equal(result.execution.status, "BLOCKED_EXPIRED_GATEPASS");
  assert.ok(result.execution.reasonCodes.includes("GATEPASS_EXPIRED"));
  assert.equal(result.execution.simulatedPurchaseReference, null);
});

test("amount tampering fails exact-action digest binding and does not consume the GatePass", async () => {
  const { gateway, evaluation } = await evaluate("action_tampering");
  const result = await gateway.executeWithGatePass(evaluation, {
    actionPatch: { totalAmount: 24250 },
  });
  assert.equal(result.execution.status, "BLOCKED_ACTION_MISMATCH");
  assert.ok(result.execution.reasonCodes.includes("GATEPASS_ACTION_DIGEST_MISMATCH"));
  assert.notEqual(result.execution.proposedActionDigest, result.execution.expectedActionDigest);
  assert.equal(result.execution.gatePassConsumed, false);
  assert.equal(result.execution.simulatedPurchaseReference, null);
});

test("supplier tampering fails exact-action binding", async () => {
  const { gateway, evaluation } = await evaluate("allowed");
  const result = await gateway.executeWithGatePass(evaluation, {
    actionPatch: {
      supplierId: "SUP-BEACON-002",
      supplierName: "Beacon Industrial Ltd",
    },
  });
  assert.equal(result.execution.status, "BLOCKED_ACTION_MISMATCH");
  assert.ok(result.execution.reasonCodes.includes("GATEPASS_ACTION_DIGEST_MISMATCH"));
  assert.ok(result.execution.reasonCodes.includes("GATEPASS_TARGET_MISMATCH"));
});

test("one-use GatePass executes once then replay is refused", async () => {
  const { gateway, evaluation } = await evaluate("replay");
  const first = await gateway.executeWithGatePass(evaluation);
  const second = await gateway.executeWithGatePass(evaluation);
  assert.equal(first.execution.status, "SIMULATED_PURCHASE_COMPLETED");
  assert.equal(first.execution.gatePassConsumed, true);
  assert.equal(second.execution.status, "BLOCKED_REPLAY");
  assert.ok(second.execution.reasonCodes.includes("GATEPASS_ALREADY_CONSUMED"));
  assert.match(second.execution.reason, /already consumed.*replay refused/i);
  assert.equal(second.execution.simulatedPurchaseReference, null);
});

test("successful execution creates complete machine and human receipts", async () => {
  const { gateway, evaluation } = await evaluate("allowed");
  const result = await gateway.executeWithGatePass(evaluation);
  const receipt = result.trustReceipt;
  assert.equal(receipt.execution?.status, "SIMULATED_PURCHASE_COMPLETED");
  assert.equal(receipt.execution?.gatePassConsumed, true);
  assert.equal(receipt.executiveSummary.gatePassStatus, "CONSUMED");
  assert.equal(receipt.executiveSummary.receiptVerificationStatus, "VERIFIED_LOCAL_FIXTURE");
  assert.equal(receipt.exactActionDigest, evaluation.exactAction.actionDigest);
  assert.match(receipt.humanReadableReceipt, /Alex Morgan/);
  assert.match(receipt.humanReadableReceipt, /Harbour Supply Ltd/);
  assert.match(receipt.humanReadableReceipt, /£23,750 GBP/);
  assert.match(receipt.humanReadableReceipt, /SIMULATED_PURCHASE_COMPLETED/);
  assert.match(receipt.humanReadableReceipt, /EXECUTIVE SUMMARY/);
  assert.match(receipt.humanReadableReceipt, /FULL AUDIT DETAIL/);
  assert.match(receipt.humanReadableReceipt, new RegExp(receipt.exactActionDigest));
});

test("refusal creates a verified machine receipt and prominent human refusal evidence", async () => {
  const { gateway, evaluation } = await evaluate("overspend");
  const receipt = evaluation.trustReceipt;
  assert.equal(receipt.decision, "ACTION_REFUSED");
  assert.equal(receipt.gatePass, null);
  assert.equal(receipt.execution, null);
  assert.equal(receipt.refusal?.primaryFailureCode, "AUTHORITY_LIMIT_EXCEEDED");
  assert.match(receipt.humanReadableReceipt, /ACTION REFUSED/);
  assert.match(receipt.humanReadableReceipt, /Requested: £31,000/);
  assert.match(receipt.humanReadableReceipt, /Authorised maximum: £25,000/);
  assert.match(receipt.humanReadableReceipt, /No GatePass issued/);
  assert.match(receipt.humanReadableReceipt, /No purchase executed/);
  assert.equal(gateway.verifyTrustReceipt(receipt).verified, true);
});

test("Trust Receipt verification detects machine or human-readable tampering", async () => {
  const { evaluation } = await evaluate("allowed");
  assert.equal(verifyExactActionTrustReceipt(evaluation.trustReceipt).verified, true);
  const tampered = structuredClone(evaluation.trustReceipt);
  tampered.humanReadableReceipt = tampered.humanReadableReceipt.replace("£23,750", "£99,999");
  const verification = verifyExactActionTrustReceipt(tampered);
  assert.equal(verification.verified, false);
  assert.ok(verification.reasonCodes.includes("RECEIPT_INTEGRITY"));
});

test("all mandatory scenario flows preserve the no-network synthetic boundary", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (() => {
    throw new Error("External network access attempted by prototype scenario.");
  }) as typeof fetch;
  try {
    const smoke = await runExactActionPrototypeSmoke();
    assert.equal(smoke.passed, true);
    assert.equal(smoke.passedScenarios, 7);
    assert.equal(smoke.networkCallPerformed, false);
    assert.ok(smoke.scenarios.every((scenario) => scenario.passed));
  } finally {
    globalThis.fetch = originalFetch;
  }
});
