import {
  createGateArtifacts,
  createReferenceIntegrationResult,
  createReferenceRequest,
  type ReferenceIntegrationResult,
} from "./shared.js";

export function runAgentToAgentHandoffGateReference(): ReferenceIntegrationResult {
  const input = createReferenceRequest("agent_to_agent_handoff_gate", {
    requestedAction: "Hand off a local task to another simulated agent without verified intent.",
    actionCategory: "workflow_recommendation",
    approvalRequired: true,
    approvalStatus: "approved",
    verifiedIntentPresent: false,
  });
  const { receipt } = createGateArtifacts(input);

  return createReferenceIntegrationResult({
    patternId: "agent_to_agent_handoff_gate",
    patternTitle: "Agent-to-agent handoff gate pattern",
    frameworkShape: "local agent-to-agent handoff",
    trustGatePlacement: "Before a simulated handoff message would be sent to another agent.",
    sensitiveAction: "agent_handoff_message",
    result: "block",
    input,
    reasonCodes: ["handoff_blocked_before_external_agent_contact", ...receipt.reason_codes],
    evidenceTrail: [
      "handoff_request_prepared_locally",
      `local_gate_verdict:${receipt.verdict}`,
      "handoff_message_not_sent",
    ],
    handoffSummary: {
      sourceAgent: input.agent_id,
      targetAgent: "simulated_target_agent_local_only",
      externalAgentContacted: false,
      handoffAllowed: false,
    },
  });
}
