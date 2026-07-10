import {
  createGateArtifacts,
  createReferenceIntegrationResult,
  createReferenceRequest,
  type ReferenceIntegrationResult,
} from "./shared.js";

export function runToolCallingGuardrailReference(): ReferenceIntegrationResult {
  const input = createReferenceRequest("tool_calling_guardrail", {
    requestedAction: "Call a local simulated supplier-update tool without an active mandate.",
    actionCategory: "supplier_review",
    approvalRequired: true,
    approvalStatus: "approved",
    mandatePresent: false,
  });
  const { receipt } = createGateArtifacts(input);

  return createReferenceIntegrationResult({
    patternId: "tool_calling_guardrail",
    patternTitle: "Tool-calling guardrail before sensitive tool use",
    frameworkShape: "tool-calling agent guardrail",
    trustGatePlacement: "Immediately before a sensitive local tool invocation would be dispatched.",
    sensitiveAction: "supplier_update_tool_call",
    result: "block",
    input,
    reasonCodes: ["tool_call_blocked_before_dispatch", ...receipt.reason_codes],
    evidenceTrail: [
      "tool_call_arguments_prepared_locally",
      `local_gate_verdict:${receipt.verdict}`,
      "tool_call_dispatch_skipped",
    ],
  });
}
