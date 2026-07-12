# GatePass Create-Verify-Reject Round Trip

P3-M134 adds a deterministic local lifecycle for GatePass as a concrete developer primitive:

create GatePass locally -> verify GatePass locally -> reject invalid, stale, replayed, tampered, or missing-proof GatePasses locally -> explain every decision -> execute nothing.

Do not trust the agent. Trust the GatePass.
No proof. No permission.
No mandate. No action.
No signed GatePass. No settlement.
No mandate. No evidence. No verified intent. No signed GatePass. No settlement.

## Purpose

This pack turns the P3-M133 Minimal GatePass Core Specification into a local create/verify/reject loop that developers can inspect and run. It shows how Agent Trust Gate can create local GatePass examples, verify them against expected action context, reject bad GatePasses, and emit local receipt-style summaries.

## Relationship to P3-M132 and P3-M133

P3-M132 showed mock sensitive tool calls being intercepted by an enforceable local tool gate before any action could proceed.

P3-M133 narrowed the project around GatePass as the compact local proof primitive.

P3-M134 makes the GatePass lifecycle operational in local code. It keeps GatePass central while showing the full round trip that a developer would expect from a proof primitive.

## Local GatePass Lifecycle

1. Create a GatePass from local intended-action inputs.
2. Verify the GatePass against mandate, scope, evidence, intent, expiry, nonce, signature status, and expected verifier context.
3. Reject, escalate, or request more proof when checks fail.
4. Explain the decision with deterministic reasons and next proof requirements.
5. Emit a local receipt summary.
6. Execute no real-world action.

## Create Step

`createLocalGatePass(input)` builds a local GatePass object with:

- issuer, subject, and verifier references
- mandate reference
- permitted action scope
- evidence references
- verified intent status
- risk and human approval status
- expiry and nonce
- local signed GatePass proof reference where present
- `localDemoOnly: true`

The create step is deterministic. It does not perform production signing, generate production keys, contact systems, call APIs, or execute actions.

## Verify Step

`verifyLocalGatePass(gatePass, verificationContext)` verifies the local GatePass against the core GatePass validator and adds round-trip checks:

- expected audience
- expected requested action
- local integrity hash
- consumed nonce list
- settlement-sensitive signed GatePass requirement

## Reject Step

Invalid GatePasses fail closed locally. Rejection or proof-request scenarios include:

- identity-only GatePass
- missing mandate
- missing evidence
- stale expiry
- replayed nonce
- tampered scope
- missing signed GatePass for pre-settlement
- high-risk action without human review

## Explanation Step

Every result includes:

- decision
- reasons
- rejection reasons
- required next proof
- receipt summary
- explicit no-action boundary

## Local Scenarios

The local demo includes:

- valid GatePass example
- invalid identity-only example
- missing mandate example
- missing evidence example
- stale expiry example
- replayed nonce example
- tampered field example
- missing signed GatePass for pre-settlement example
- valid pre-settlement local GatePass example

## Run Locally

```powershell
npm run demo:gatepass-round-trip
npm run demo:gatepass-round-trip -- --summary-only
```

## What This Proves

This proves a GatePass can be created, verified, rejected, and explained locally in a deterministic developer loop. It proves fail-closed examples can be modelled for stale, replayed, tampered, missing-mandate, missing-evidence, and missing-signed-GatePass conditions.

## What This Does Not Prove

This does not prove production readiness, production-grade crypto, identity/authentication status, legal/compliance/security certification, live payment readiness, live settlement readiness, or integration with live frameworks. It does not execute tools, call APIs, contact external systems, or perform settlement.

## Safety Boundary

This is local modelling only. `localDemoOnly` remains true. Production signing, payment authorisation, settlement authorisation, live systems contact, direct bot messaging, live agent-to-agent communication, real tool execution, and action execution remain false.

Public contact: gpmiddleton71@gmail.com
