# GatePass wrapTool Developer Guide

## Minimal Pattern

```ts
import {
  createGatePassToolPolicy,
  runGatePassRoundTripScenario,
  wrapGatePassTool,
} from "agent-trust-gate";

const mockTool = {
  toolName: "local_publish_draft",
  description: "Local mock tool only.",
  callLocalMock: (input: { text: string }) => ({
    acceptedDraft: input.text,
    localMockExecution: true,
    realToolExecution: false,
    actionExecution: false,
  }),
};

const policy = createGatePassToolPolicy({
  policyName: "local_low_risk_gatepass_policy",
  allowedAction: "read_public_docs",
  allowedScope: "read_public_docs",
});

const wrappedTool = wrapGatePassTool(mockTool, policy);
const gatePass = runGatePassRoundTripScenario("valid_allow_local");

const result = wrappedTool.call({
  input: { text: "local demo payload only" },
  requestedAction: "read_public_docs",
  gatePass,
  proofPackage: {
    proofPackageId: "local_proof_package_001",
    evidenceComplete: true,
    mandateReferencePresent: true,
    localDemoOnly: true,
  },
  localDemoOnly: true,
});
```

## Outcomes

- valid proof: `allow`, with local mock output only;
- identity-only proof: `block`;
- missing mandate: `block`;
- missing evidence: `require_evidence`;
- high-risk action without approval: `require_human_review`;
- settlement-sensitive action without signed GatePass: `require_signed_proof`.

## Policy Example

Policies describe the action and proof requirements: action scope, risk tier,
mandate, evidence, freshness, nonce, approval, and signed GatePass requirements.
The wrapper compares the proposed action and GatePass against this policy before
the local mock handler can run.

## No Real Execution Warning

The wrapper is local-only. It can call deterministic mock functions, but it does
not call live tools, external APIs, live frameworks, payment systems, settlement
systems, customer messaging systems, file-writing tools, or procurement systems.

Public contact: gpmiddleton71@gmail.com
