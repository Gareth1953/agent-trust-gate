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

## P3-M139 - One-Command Reviewer Demo Kit
P3-M139 adds a local deterministic one-command reviewer demo kit for the GatePass lifecycle, adversarial scorecard, developer wrapper, local integration summary, safety boundary, and JSON report output. It uses GatePass proof vocabulary and GatePass claims vocabulary as supporting material only, and adds no production middleware claim, production benchmark claim, security certification claim, production readiness claim, live tool execution, network calls, payment authorisation, settlement authorisation, or action execution.

## P3-M140A - Public README / Reviewer Positioning Polish

P3-M140A sharpens the public README and reviewer-facing positioning so the recommended first run is `npm run demo:reviewer-kit`, GatePass remains the headline proof primitive, and Agent Trust Language remains supporting material only. It uses GatePass proof vocabulary and GatePass claims vocabulary as supporting material and adds no feature layer, external integration, production middleware claim, production benchmark claim, security certification claim, legal/compliance/security assurance, real tool execution, network calls, payment authorisation, settlement authorisation, or action execution.

## P3-M140 - ATG Strategic Foresight Layer
P3-M140 adds a local-only strategic foresight advisory layer for manually supplied market, protocol, agent, AGI/agent-risk, quantum/post-quantum, standards, and reviewer/developer feedback signals. It follows Watch -> Analyse -> Compare -> Recommend -> Gareth approves -> Dave creates build mission -> Codex implements locally. It recommends only and adds no live monitoring, scraping, autonomous learning, autonomous outreach, autonomous product changes, autonomous roadmap changes, autonomous code changes, prediction guarantee, network calls, payment authorisation, settlement authorisation, real tool execution, or action execution.
