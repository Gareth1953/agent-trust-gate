import assert from "node:assert/strict";
import test from "node:test";

import {
  ExactActionTrustGatewayPrototype,
  createExactActionPrototypeScenario,
  verifyExactActionTrustReceipt,
  type ExactActionPrototypeEvaluation,
  type ExactActionPrototypeFaults,
  type ExactActionPrototypeScenarioInput,
  type ProposedProcurementAction,
  type PrototypePrimaryFailureCode,
} from "../src/exact-action-trust-gateway-prototype.js";
import { recomputeCanonicalActionDigest, type ExactActionGatePass } from "../src/exact-action-gatepass.js";

function scenario(
  patch: Partial<Omit<ProposedProcurementAction, "humanAuthorityProofReference" | "mandateId">> = {},
  faults: ExactActionPrototypeFaults = {},
): ExactActionPrototypeScenarioInput {
  const value = createExactActionPrototypeScenario("allowed");
  value.proposedAction = { ...value.proposedAction, ...patch };
  value.faults = faults;
  return value;
}

async function evaluate(input: Parameters<ExactActionTrustGatewayPrototype["evaluateExactAction"]>[0]) {
  const gateway = new ExactActionTrustGatewayPrototype();
  const evaluation = await gateway.evaluateExactAction(input);
  return { gateway, evaluation };
}

function expectRefusal(evaluation: ExactActionPrototypeEvaluation, code: PrototypePrimaryFailureCode): void {
  assert.equal(evaluation.decision, "ACTION_REFUSED");
  assert.equal(evaluation.gatePass, null);
  assert.equal(evaluation.refusal?.primaryFailureCode, code);
  assert.equal(evaluation.refusal?.gatePassIssued, false);
  assert.equal(evaluation.refusal?.executionPermitted, false);
}

test("adversarial 01 — valid purchase passes and the digest covers every execution-critical field", async () => {
  const { evaluation } = await evaluate("allowed");
  assert.equal(evaluation.decision, "GATEPASS_ISSUED");
  assert.equal(recomputeCanonicalActionDigest(evaluation.exactAction), evaluation.exactAction.actionDigest);
  const critical = [
    "organisationId", "humanAuthorityProofReference", "mandateId", "agentId", "supplierId",
    "product", "category", "quantity", "totalAmount", "currency", "commercialTermsReference",
    "actionType", "jurisdiction", "riskTier", "timestamp", "nonce", "policyVersion",
  ];
  for (const field of critical) {
    const changed = structuredClone(evaluation.exactAction);
    const args = changed.canonicalArguments as Record<string, unknown>;
    args[field] = typeof args[field] === "number" ? (args[field] as number) + 1 : `${String(args[field])}_changed`;
    assert.notEqual(recomputeCanonicalActionDigest(changed), evaluation.exactAction.actionDigest, `${field} must affect the digest`);
  }
});

test("adversarial 02 — overspend identifies the human authority limit as the primary failure", async () => {
  const { evaluation } = await evaluate("overspend");
  expectRefusal(evaluation, "AUTHORITY_LIMIT_EXCEEDED");
  assert.equal(evaluation.refusal?.primaryFailure.requestedValue, 31000);
  assert.equal(evaluation.refusal?.primaryFailure.permittedValue, 25000);
  assert.match(evaluation.refusal?.primaryFailureSummary ?? "", /exceeds verified human purchasing authority/i);
  assert.deepEqual(evaluation.refusal?.consequentialBlocks, [
    "Policy cannot permit execution.",
    "GatePass cannot be issued.",
    "Execution remains blocked.",
  ]);
  assert.doesNotMatch(evaluation.refusal?.primaryFailureSummary ?? "", /revoked/i);
});

test("adversarial 03 — unauthorised human fails closed", async () => {
  const { evaluation } = await evaluate("wrong_human_authority");
  expectRefusal(evaluation, "HUMAN_NOT_AUTHORISED");
});

test("adversarial 04 — expired human authority fails closed", async () => {
  const { evaluation } = await evaluate("expired_authority");
  expectRefusal(evaluation, "AUTHORITY_EXPIRED");
});

test("adversarial 05 — revoked agent fails closed", async () => {
  const { evaluation } = await evaluate("agent_standing_failure");
  expectRefusal(evaluation, "AGENT_STANDING_INVALID");
});

test("adversarial 06 — expired mandate fails closed", async () => {
  const { evaluation } = await evaluate("expired_mandate");
  expectRefusal(evaluation, "MANDATE_EXPIRED");
});

test("adversarial 07 — wrong supplier fails closed", async () => {
  const { evaluation } = await evaluate(scenario({ supplierId: "SUP-UNAPPROVED-999", supplierName: "Unapproved Synthetic Supplier Ltd" }));
  expectRefusal(evaluation, "SUPPLIER_NOT_PERMITTED");
});

test("adversarial 08 — wrong product fails closed", async () => {
  const { evaluation } = await evaluate(scenario({ product: "Product Y" }));
  expectRefusal(evaluation, "PRODUCT_CATEGORY_NOT_PERMITTED");
});

test("adversarial 09 — wrong currency fails closed", async () => {
  const { evaluation } = await evaluate(scenario({ currency: "USD" }));
  expectRefusal(evaluation, "CURRENCY_NOT_PERMITTED");
});

test("adversarial 10 — wrong jurisdiction fails closed", async () => {
  const { evaluation } = await evaluate(scenario({ jurisdiction: "US" }));
  expectRefusal(evaluation, "JURISDICTION_NOT_PERMITTED");
});

test("adversarial 11 — wrong risk tier fails closed", async () => {
  const { evaluation } = await evaluate(scenario({ riskTier: "high" }));
  expectRefusal(evaluation, "RISK_TIER_NOT_PERMITTED");
});

test("adversarial 12 — missing evidence fails closed", async () => {
  const { evaluation } = await evaluate(scenario({}, { missingEvidence: true }));
  expectRefusal(evaluation, "EVIDENCE_INVALID");
});

test("adversarial 13 — stale evidence fails closed", async () => {
  const { evaluation } = await evaluate(scenario({}, { staleEvidence: true }));
  expectRefusal(evaluation, "EVIDENCE_INVALID");
  assert.equal(evaluation.evidence.status, "stale");
});

test("adversarial 14 — missing mandate fails closed", async () => {
  const { evaluation } = await evaluate(scenario({}, { missingMandate: true }));
  expectRefusal(evaluation, "MANDATE_MISSING");
});

test("adversarial 15 — missing Human Authority Proof fails closed", async () => {
  const { evaluation } = await evaluate(scenario({}, { missingHumanAuthorityProof: true }));
  expectRefusal(evaluation, "HUMAN_AUTHORITY_PROOF_MISSING");
});

test("adversarial 16 — malformed exact action fails canonical input validation closed", async () => {
  const { evaluation } = await evaluate(scenario({}, { malformedExactAction: true }));
  expectRefusal(evaluation, "MALFORMED_EXACT_ACTION");
  assert.equal(evaluation.checks.find((item) => item.id === "canonicalisation")?.passed, false);
});

test("adversarial 17 — amount modified after GatePass is blocked", async () => {
  const { gateway, evaluation } = await evaluate("allowed");
  const result = await gateway.executeWithGatePass(evaluation, { actionPatch: { totalAmount: 24250 } });
  assert.equal(result.execution.status, "BLOCKED_ACTION_MISMATCH");
  assert.equal(result.trustReceipt.refusal?.primaryFailureCode, "EXACT_ACTION_MISMATCH");
});

test("adversarial 18 — supplier changed after GatePass is blocked", async () => {
  const { gateway, evaluation } = await evaluate("allowed");
  const result = await gateway.executeWithGatePass(evaluation, { actionPatch: { supplierId: "SUP-BEACON-002", supplierName: "Beacon Industrial Ltd" } });
  assert.equal(result.execution.status, "BLOCKED_ACTION_MISMATCH");
});

test("adversarial 19 — quantity changed after GatePass is blocked", async () => {
  const { gateway, evaluation } = await evaluate("allowed");
  const result = await gateway.executeWithGatePass(evaluation, { actionPatch: { quantity: 199 } });
  assert.equal(result.execution.status, "BLOCKED_ACTION_MISMATCH");
});

test("adversarial 20 — currency changed after GatePass is blocked", async () => {
  const { gateway, evaluation } = await evaluate("allowed");
  const result = await gateway.executeWithGatePass(evaluation, { actionPatch: { currency: "USD" } });
  assert.equal(result.execution.status, "BLOCKED_ACTION_MISMATCH");
});

test("adversarial 21 — policy version changed after GatePass is blocked", async () => {
  const { gateway, evaluation } = await evaluate("allowed");
  const result = await gateway.executeWithGatePass(evaluation, { actionPatch: { policyVersion: "unknown-policy.v9" } });
  assert.equal(result.execution.status, "BLOCKED_ACTION_MISMATCH");
});

test("adversarial 22 — expired GatePass is blocked", async () => {
  const { gateway, evaluation } = await evaluate("allowed");
  const result = await gateway.executeWithGatePass(evaluation, { executedAt: "2026-09-02T09:06:00.000Z" });
  assert.equal(result.execution.status, "BLOCKED_EXPIRED_GATEPASS");
  assert.equal(result.trustReceipt.refusal?.primaryFailureCode, "GATEPASS_EXPIRED");
});

test("adversarial 23 — replayed GatePass is blocked", async () => {
  const { gateway, evaluation } = await evaluate("allowed");
  assert.equal((await gateway.executeWithGatePass(evaluation)).execution.status, "SIMULATED_PURCHASE_COMPLETED");
  const replay = await gateway.executeWithGatePass(evaluation);
  assert.equal(replay.execution.status, "BLOCKED_REPLAY");
  assert.equal(replay.trustReceipt.refusal?.primaryFailureCode, "GATEPASS_REPLAY");
});

test("adversarial 24 — missing GatePass at execution is blocked", async () => {
  const { gateway, evaluation } = await evaluate("allowed");
  const result = await gateway.executeWithGatePass(evaluation, { gatePass: null });
  assert.equal(result.execution.status, "BLOCKED_NO_GATEPASS");
  assert.equal(result.trustReceipt.refusal?.primaryFailureCode, "GATEPASS_MISSING");
});

test("adversarial 25 — malformed GatePass is blocked", async () => {
  const { gateway, evaluation } = await evaluate("allowed");
  const result = await gateway.executeWithGatePass(evaluation, { gatePass: { gatePassId: "malformed" } });
  assert.equal(result.execution.status, "BLOCKED_INVALID_GATEPASS");
  assert.equal(result.trustReceipt.refusal?.primaryFailureCode, "GATEPASS_MALFORMED");
});

test("adversarial 26 — invalid GatePass signature is blocked", async () => {
  const { gateway, evaluation } = await evaluate("allowed");
  const gatePass = structuredClone(evaluation.gatePass) as ExactActionGatePass;
  gatePass.signature.signature = "invalid-local-fixture-signature";
  const result = await gateway.executeWithGatePass(evaluation, { gatePass });
  assert.equal(result.execution.status, "BLOCKED_INVALID_GATEPASS");
  assert.ok(result.execution.reasonCodes.includes("GATEPASS_INVALID_SIGNATURE"));
  assert.equal(result.trustReceipt.refusal?.primaryFailureCode, "GATEPASS_INVALID_SIGNATURE");
});

test("adversarial 27 — nonce mismatch is blocked", async () => {
  const { gateway, evaluation } = await evaluate("allowed");
  const result = await gateway.executeWithGatePass(evaluation, { actionPatch: { nonce: "nonce_changed_after_gatepass" } });
  assert.equal(result.execution.status, "BLOCKED_ACTION_MISMATCH");
  assert.ok(result.execution.reasonCodes.includes("NONCE_MISMATCH"));
  assert.equal(result.trustReceipt.refusal?.primaryFailureCode, "NONCE_MISMATCH");
});

test("adversarial 28 — unknown agent fails closed", async () => {
  const { evaluation } = await evaluate(scenario({ agentId: "AGENT-UNKNOWN-999" }, { unknownAgent: true }));
  expectRefusal(evaluation, "UNKNOWN_AGENT");
});

test("adversarial 29 — unknown human fails closed", async () => {
  const value = scenario();
  value.humanEmployeeId = "EMP-UNKNOWN-999";
  value.humanAuthenticationId = "AUTH-UNKNOWN-999";
  const { evaluation } = await evaluate(value);
  expectRefusal(evaluation, "UNKNOWN_HUMAN");
});

test("adversarial 30 — malformed receipt fails verification closed", () => {
  const result = verifyExactActionTrustReceipt({ receiptVersion: "malformed" });
  assert.equal(result.verified, false);
  assert.ok(result.reasonCodes.includes("MALFORMED_TRUST_RECEIPT"));
  const malformedIntegrity = verifyExactActionTrustReceipt({
    receiptId: "malformed",
    decision: "ACTION_REFUSED",
    exactAction: { actionDigest: "sha256:malformed", amount: 1, currency: "GBP" },
    integrity: {},
  });
  assert.equal(malformedIntegrity.verified, false);
  assert.ok(malformedIntegrity.reasonCodes.includes("MALFORMED_TRUST_RECEIPT"));
});

test("adversarial 31 — receipt tampering fails signature verification", async () => {
  const { evaluation } = await evaluate("allowed");
  const tampered = structuredClone(evaluation.trustReceipt);
  tampered.executiveSummary.amount = 1;
  const result = verifyExactActionTrustReceipt(tampered);
  assert.equal(result.verified, false);
  assert.ok(result.reasonCodes.includes("RECEIPT_INTEGRITY"));
});

test("adversarial 32 — execution attempted after refusal remains blocked with the root refusal retained", async () => {
  const { gateway, evaluation } = await evaluate("overspend");
  const result = await gateway.executeWithGatePass(evaluation);
  assert.equal(result.execution.status, "BLOCKED_NO_GATEPASS");
  assert.equal(result.execution.realOrderCreated, false);
  assert.equal(result.execution.realPaymentProcessed, false);
  assert.equal(result.trustReceipt.refusal?.primaryFailureCode, "AUTHORITY_LIMIT_EXCEEDED");
});
