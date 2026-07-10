import type { LocalGatePassDemoInput } from "../local-gate-pass-demo.js";
import {
  createGateArtifacts,
  createReferenceIntegrationResult,
  createReferenceRequest,
  signAndVerifyLocalReceipt,
  type ReferenceIntegrationResult,
  type ReferenceIntegrationVerdict,
} from "./shared.js";

export interface LocalTrustGateWrapper {
  evaluate: (request: LocalGatePassDemoInput) => ReferenceIntegrationResult;
}

export function createLocalTrustGateWrapper(): LocalTrustGateWrapper {
  return {
    evaluate: (request) => evaluateWithWrapper(request),
  };
}

export function runTrustGateWrapperReference(): ReferenceIntegrationResult {
  const request = createReferenceRequest("trust_gate_wrapper", {
    requestedAction: "Evaluate a local wrapper request before a developer action callback.",
    actionCategory: "safe_local_update_check",
  });
  return createLocalTrustGateWrapper().evaluate(request);
}

function evaluateWithWrapper(input: LocalGatePassDemoInput): ReferenceIntegrationResult {
  const { receipt, verification } = createGateArtifacts(input);
  const signature = signAndVerifyLocalReceipt(receipt);
  const verdict: ReferenceIntegrationVerdict = receipt.verdict === "review_required"
    ? "escalate"
    : verification.verified && receipt.allowed
      ? "allow"
      : "block";

  return createReferenceIntegrationResult({
    patternId: "trust_gate_wrapper",
    patternTitle: "Developer trustGate.evaluate(request) wrapper",
    frameworkShape: "small developer abstraction",
    trustGatePlacement: "Inside a wrapper before the caller decides whether to run a callback.",
    sensitiveAction: "developer_action_callback",
    result: verdict,
    input,
    reasonCodes: ["wrapper_evaluate_returned_deterministic_result", ...receipt.reason_codes],
    evidenceTrail: [
      "trustGate.evaluate(request)",
      `local_gate_verdict:${receipt.verdict}`,
      "developer_callback_not_executed_by_example",
    ],
    signedProofVerification: signature,
    wrapperSummary: {
      apiShape: "trustGate.evaluate(request)",
      deterministic: true,
      returnType: "allow_block_escalate",
    },
  });
}
