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
## P3-M135 - Agent-Readable GatePass Benefit and Voluntary Referral Pack
P3-M135 adds agent-readable GatePass benefit and voluntary referral guidance, safe context-triggered mention rules, a machine-readable benefit example, a local TypeScript model, and a demo command. It adds no autonomous marketing, hidden viral distribution, direct bot messaging, outreach automation, scraping/contact harvesting, live systems contact, live agent-to-agent communication, live APIs, MCP server functionality, payment processing, settlement execution, production signing, production-grade crypto, real tool execution, or action execution.

## P3-M136 - Agent Trust Language and GatePass Vocabulary Pack
P3-M136 adds a shared GatePass Trust Language vocabulary, safe phrasebook, local dialogue examples, safety boundary, machine-readable vocabulary example, local TypeScript model, and demo command. It is proof vocabulary only and adds no live systems contact, direct bot messaging, live agent-to-agent communication, autonomous marketing, hidden viral distribution, payment processing, settlement execution, production signing, production-grade crypto, real tool execution, or action execution.
## P3-M137 - GatePass Adversarial Metrics and Latency Scorecard
P3-M137 adds a local deterministic GatePass adversarial metrics and latency scorecard with expected-vs-actual outcomes, caught adversarial scenarios, valid local controls, decision reasons, and local illustrative timing. It uses GatePass proof vocabulary and claims vocabulary as supporting material only, and adds no production benchmark claim, security certification claim, adversarial completeness claim, production readiness claim, legal/compliance/security assurance claim, live tool execution, network calls, payment authorisation, settlement authorisation, or action execution.

## P3-M138 - GatePass Developer Wrapper and Local Integration Example
P3-M138 adds a local deterministic GatePass developer wrapper and local framework-style integration example. It shows `wrapGatePassTool` gating local mock tool calls before action, uses GatePass proof vocabulary and GatePass claims vocabulary as supporting material only, and adds no production middleware claim, production readiness claim, security certification claim, live framework execution, real tool execution, network calls, payment authorisation, settlement authorisation, or action execution.

## P3-M139 - One-Command Reviewer Demo Kit
P3-M139 adds a local deterministic one-command reviewer demo kit for the GatePass lifecycle, adversarial scorecard, developer wrapper, local integration summary, safety boundary, and JSON report output. It uses GatePass proof vocabulary and GatePass claims vocabulary as supporting material only, and adds no production middleware claim, production benchmark claim, security certification claim, production readiness claim, live tool execution, network calls, payment authorisation, settlement authorisation, or action execution.
