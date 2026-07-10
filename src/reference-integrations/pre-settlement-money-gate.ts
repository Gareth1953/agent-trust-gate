import {
  createMoneyGateProof,
  createReferenceIntegrationResult,
  createReferenceRequest,
  createSettlementBlocker,
  type ReferenceIntegrationResult,
} from "./shared.js";

export function runPreSettlementMoneyGateReference(): ReferenceIntegrationResult {
  const input = createReferenceRequest("pre_settlement_money_gate", {
    requestedAction: "Evaluate a simulated payment-like settlement with missing mandate.",
    actionCategory: "money_movement",
    spendAmountGbp: 25,
    maxAllowedGbp: 50,
    approvalRequired: true,
    approvalStatus: "approved",
    mandatePresent: false,
    proofPurpose: "pre_settlement_money_gate",
  });
  const proof = createMoneyGateProof(input);
  const blocker = createSettlementBlocker(input);

  return createReferenceIntegrationResult({
    patternId: "pre_settlement_money_gate",
    patternTitle: "Pre-settlement money-gate check before simulated payment-like action",
    frameworkShape: "pre-settlement workflow guard",
    trustGatePlacement: "After local gate evaluation and before any settlement-like action would run.",
    sensitiveAction: "simulated_payment_like_settlement",
    result: "block",
    input,
    reasonCodes: ["pre_settlement_blocked_without_valid_gate_pass", ...blocker.block_reason_codes],
    evidenceTrail: [
      "money_gate_proof_run_locally",
      `money_gate_proof_passed:${String(proof.proof_passed)}`,
      `settlement_blocker:${blocker.settlement_simulation}`,
      "simulated_settlement_not_executed",
    ],
    settlementBlocker: blocker,
    moneyGateProof: proof,
  });
}
