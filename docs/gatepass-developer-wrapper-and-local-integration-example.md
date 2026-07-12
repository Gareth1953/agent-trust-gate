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
