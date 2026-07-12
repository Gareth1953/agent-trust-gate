# One-Command Reviewer Demo Kit

## Purpose

P3-M139 adds a local-only reviewer demo kit for Agent Trust Gate. It gives reviewers one command that runs the core GatePass proof flow without hunting through the separate round-trip, scorecard, and wrapper commands.

```powershell
npm run demo:reviewer-kit
```

## Why this exists after P3-M138

P3-M138 made GatePass more developer-useful with a copy-paste-style `wrapGatePassTool` wrapper. External reviewer feedback still pointed to one remaining friction point: the repo needed a single reviewer-friendly command that shows the strongest local proof evidence quickly.

P3-M139 answers that by assembling:

- GatePass create / verify / reject lifecycle;
- GatePass adversarial metrics and local illustrative timing scorecard;
- GatePass developer wrapper and local framework-style integration example;
- safety boundary summary;
- JSON report output.

## What one command runs

`npm run demo:reviewer-kit` runs deterministic local models already present in the repo:

- GatePass round trip: create, verify, reject, and explain local GatePass decisions.
- GatePass scorecard: expected-vs-actual adversarial scenarios and local illustrative timing.
- GatePass wrapper: `wrapGatePassTool` gating local mock tool calls.
- Local framework-style integration: a LangGraph-style local adapter with no LangGraph dependency.

## What reviewers should look for

Reviewers should check whether the kit clearly shows:

- what GatePass is;
- what valid proof allows locally;
- what identity-only or missing-proof claims block;
- what requires evidence;
- what requires human review;
- what requires signed GatePass;
- how the local scorecard behaves;
- how the wrapper pattern works;
- what the project does not claim.

## What this proves locally

GatePass is a scoped, time-bound, action-specific proof primitive for agent actions.

GatePass provides a common, machine-readable format for expressing authority, mandate, scope, freshness, and evidence.

The reviewer kit proves locally that:

- GatePass lifecycle checks can be run deterministically.
- Invalid, stale, replayed, tampered, identity-only, and missing-proof cases can fail closed locally.
- Scorecard scenarios can produce expected allow/block/require-evidence/require-human-review/require-signed-GatePass outcomes.
- A wrapper can intercept a local mock tool call before any mock action is allowed.
- JSON report output can summarize the local proof evidence.

## What this does not prove

This kit is not production middleware. It is not a production benchmark. It is not security certification. It is not legal, compliance, procurement, settlement, identity, authentication, or security assurance. It does not perform production signing, live payment processing, settlement execution, live tool execution, network calls, live systems contact, direct bot messaging, live agent-to-agent communication, or action execution.

## Relationship to other GatePass work

The reviewer kit depends on earlier local proof layers:

- P3-M134 GatePass create-verify-reject round trip.
- P3-M137 GatePass adversarial metrics and latency scorecard.
- P3-M138 GatePass developer wrapper and local integration example.

P3-M135 and P3-M136 remain supporting material. Public reviewer language should keep GatePass as the headline: the core proof primitive, a machine-readable proof format, and a common format for expressing authority, mandate, scope, freshness, and evidence.

## Safety Boundary

No signed GatePass. No settlement.

Do not trust the agent. Trust the GatePass.

No proof. No permission.

No mandate. No action.

All reviewer-kit execution is local deterministic demo execution. `localDemoOnly` is true. `mockToolExecutionOnly` is true. `realToolExecution`, `actionExecution`, `networkCalls`, `productionMiddleware`, `productionBenchmark`, `productionCertification`, `securityCertification`, `paymentAuthorisation`, and `settlementAuthorisation` remain false.

Public contact: gpmiddleton71@gmail.com

## P3-M140A - Public README / Reviewer Positioning Polish

P3-M140A sharpens the public README and reviewer-facing positioning so the recommended first run is `npm run demo:reviewer-kit`, GatePass remains the headline proof primitive, and Agent Trust Language remains supporting material only. It uses GatePass proof vocabulary and GatePass claims vocabulary as supporting material and adds no feature layer, external integration, production middleware claim, production benchmark claim, security certification claim, legal/compliance/security assurance, real tool execution, network calls, payment authorisation, settlement authorisation, or action execution.
