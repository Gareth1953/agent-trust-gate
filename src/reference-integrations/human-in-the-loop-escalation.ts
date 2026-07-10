import {
  createGateArtifacts,
  createReferenceIntegrationResult,
  createReferenceRequest,
  type ReferenceIntegrationResult,
} from "./shared.js";

export function runHumanInTheLoopEscalationReference(): ReferenceIntegrationResult {
  const input = createReferenceRequest("human_in_the_loop_escalation", {
    requestedAction: "Review a local high-risk purchase recommendation pending human approval.",
    actionCategory: "purchase_authorization",
    spendAmountGbp: 20,
    maxAllowedGbp: 50,
    approvalRequired: true,
    approvalStatus: "pending",
  });
  const { receipt } = createGateArtifacts(input);

  return createReferenceIntegrationResult({
    patternId: "human_in_the_loop_escalation",
    patternTitle: "Human-in-the-loop escalation for high-risk actions",
    frameworkShape: "human approval checkpoint",
    trustGatePlacement: "Before a high-risk action leaves the local review queue.",
    sensitiveAction: "high_risk_purchase_authorization",
    result: "escalate",
    input,
    reasonCodes: ["human_review_escalation_recorded", ...receipt.reason_codes],
    evidenceTrail: [
      "high_risk_action_detected",
      `local_gate_verdict:${receipt.verdict}`,
      "queued_for_human_review_without_execution",
    ],
  });
}
