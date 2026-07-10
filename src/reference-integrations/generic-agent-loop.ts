import {
  createGateArtifacts,
  createReferenceIntegrationResult,
  createReferenceRequest,
  signAndVerifyLocalReceipt,
  type ReferenceIntegrationResult,
} from "./shared.js";

export function runGenericAgentLoopReference(): ReferenceIntegrationResult {
  const input = createReferenceRequest("generic_agent_loop", {
    requestedAction: "Prepare a local synthetic inventory summary for an agent loop.",
    actionCategory: "local_review",
  });
  const { receipt } = createGateArtifacts(input);
  const signature = signAndVerifyLocalReceipt(receipt);

  return createReferenceIntegrationResult({
    patternId: "generic_agent_loop",
    patternTitle: "Generic agent-loop pre-action gate",
    frameworkShape: "generic agent loop",
    trustGatePlacement: "Before the loop dispatches a proposed sensitive step.",
    sensitiveAction: "agent_loop_step_dispatch",
    result: "allow",
    input,
    reasonCodes: ["pre_action_gate_allowed_local_step", ...receipt.reason_codes],
    evidenceTrail: [
      "agent_loop_proposed_step_captured",
      `local_gate_verdict:${receipt.verdict}`,
      "sensitive_step_not_executed_by_example",
    ],
    signedProofVerification: signature,
  });
}
