# GatePass Developer Wrapper and Local Integration Example

## Purpose

P3-M138 adds a local-only developer wrapper that makes GatePass easier to use
from code. It follows P3-M137, which added measurable local scorecards, by
showing a small wrapper a developer can copy into a local mock workflow.

GatePass is a scoped, time-bound, action-specific proof primitive for agent
actions. GatePass provides a common, machine-readable format for expressing
authority, mandate, scope, freshness, and evidence.

No signed GatePass. No settlement. Do not trust the agent. Trust the GatePass.
No proof. No permission. No mandate. No action.

## Reviewer Feedback Addressed

External reviewer feedback asked for fewer conceptual layers and more runnable
developer evidence. This pack shows the concrete pattern:

```ts
const wrappedTool = wrapGatePassTool(mockTool, policy);
const result = wrappedTool.call({ input, gatePass, proofPackage, localDemoOnly: true });
```

The wrapper checks GatePass evidence before the local mock tool is allowed. A
valid local GatePass may allow a deterministic local mock handler. Invalid proof
blocks, escalates, requires evidence, requires human review, or requires a
signed GatePass.

## What The Wrapper Does

- receives a local mock tool and a local GatePass policy;
- checks GatePass, proof package, mandate, evidence, scope, freshness, nonce,
  human approval, and signed GatePass requirements;
- returns a structured local result and receipt;
- allows only deterministic local mock execution when proof is valid.

## What It Does Not Do

It is not production middleware, not a live framework integration, not a
security certification, not production signing, not live payment or settlement,
and not action execution. It makes no network calls and executes no real tool.

## Safety Boundary

This is a local deterministic proof-of-concept wrapper only. `localDemoOnly` and
`mockToolExecutionOnly` are true. `realToolExecution`, `actionExecution`,
`networkCalls`, `paymentAuthorisation`, `settlementAuthorisation`,
`productionMiddleware`, `productionCertification`, and `securityCertification`
remain false.

Public contact: gpmiddleton71@gmail.com

## P3-M139 - One-Command Reviewer Demo Kit
P3-M139 adds a local deterministic one-command reviewer demo kit for the GatePass lifecycle, adversarial scorecard, developer wrapper, local integration summary, safety boundary, and JSON report output. It uses GatePass proof vocabulary and GatePass claims vocabulary as supporting material only, and adds no production middleware claim, production benchmark claim, security certification claim, production readiness claim, live tool execution, network calls, payment authorisation, settlement authorisation, or action execution.

## P3-M140A - Public README / Reviewer Positioning Polish

P3-M140A sharpens the public README and reviewer-facing positioning so the recommended first run is `npm run demo:reviewer-kit`, GatePass remains the headline proof primitive, and Agent Trust Language remains supporting material only. It uses GatePass proof vocabulary and GatePass claims vocabulary as supporting material and adds no feature layer, external integration, production middleware claim, production benchmark claim, security certification claim, legal/compliance/security assurance, real tool execution, network calls, payment authorisation, settlement authorisation, or action execution.

## P3-M140 - ATG Strategic Foresight Layer
P3-M140 adds a local-only strategic foresight advisory layer for manually supplied market, protocol, agent, AGI/agent-risk, quantum/post-quantum, standards, and reviewer/developer feedback signals. It follows Watch -> Analyse -> Compare -> Recommend -> Gareth approves -> Dave creates build mission -> Codex implements locally. It recommends only and adds no live monitoring, scraping, autonomous learning, autonomous outreach, autonomous product changes, autonomous roadmap changes, autonomous code changes, prediction guarantee, network calls, payment authorisation, settlement authorisation, real tool execution, or action execution.
