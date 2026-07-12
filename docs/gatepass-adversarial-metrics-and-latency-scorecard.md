# GatePass Adversarial Metrics and Latency Scorecard

## Purpose

P3-M137 adds a local deterministic GatePass scorecard for reviewers who want runnable evidence instead of only architecture notes. It shows which local GatePass scenarios are allowed, blocked, escalated, routed for evidence, routed for human review, or routed for signed GatePass proof.

GatePass is a scoped, time-bound, action-specific proof primitive for agent actions.
GatePass provides a common, machine-readable format for expressing authority, mandate, scope, freshness, and evidence.
No signed GatePass. No settlement.
Do not trust the agent. Trust the GatePass.
No proof. No permission.
No mandate. No action.

## What The Scorecard Measures

The scorecard measures deterministic local scenarios:

- valid low-risk GatePass controls that should allow locally
- valid pre-settlement controls that should allow locally only when signed proof is present
- adversarial cases such as identity-only claims, missing mandate, missing evidence, stale expiry, replayed nonce, tampered scope, tampered requested action, missing signed GatePass, and overbroad scope
- review-required cases such as high-risk action and missing human approval
- unsafe claims vocabulary such as "proven safe", guaranteed trust, bypass-verification, and autonomous marketing / viral promotion language
- local illustrative timing for each decision

Each result includes expected outcome, actual outcome, decision reasons, local timing, and safety flags.

## What It Does Not Measure

This is not a production benchmark.
This is not a security certification.
This is not adversarial completeness.
This is not evidence of production readiness.
This is not legal, financial, compliance, procurement, settlement, identity, authentication, or security assurance.

The scorecard does not execute tools, settle anything, process payments, contact systems, contact agents, call networks, or create live integration.

## Why Adversarial Metrics Matter

External reviewers asked for more measurable, runnable evidence around the GatePass primitive. A scorecard gives reviewers a compact way to see whether common failure modes fail closed locally and whether valid controls still allow locally.

The useful question is not "is the agent trusted?" The useful question is: "Has this specific action presented sufficient scoped proof, mandate, evidence, freshness, and signed GatePass status for the local decision being requested?"

## Local Latency

The timing fields are local illustrative timing. They show approximately how long this local Node.js process spent evaluating each deterministic scenario on the current machine and run. Timing varies by machine, runtime state, and run conditions. Correctness and clear rejection reasons matter more than speed.

## Outcome Counting

The scorecard counts:

- expected allows, blocks, escalations, evidence requirements, human-review requirements, and signed-GatePass requirements
- actual allows, blocks, escalations, evidence requirements, human-review requirements, and signed-GatePass requirements
- matched and mismatched expected outcomes
- adversarial scenarios and adversarial scenarios caught
- valid scenarios and valid scenarios allowed

## Decision Reasons

Each scenario result lists reasons such as `identity_only_not_sufficient`, `missing_mandate`, `missing_evidence`, `stale_expiry`, `replayed_nonce`, `tampered_gatepass`, `scope_mismatch`, `settlement_requires_signed_gatepass`, `high_risk_requires_human_review`, `proven_safe`, `guaranteed_trust`, and `bypass_verification`.

## Reviewer Confidence

P3-M137 strengthens GatePass beyond documentation by showing a runnable local scorecard that exercises the core proof primitive and its surrounding claims vocabulary. The goal is reviewer clarity, not production claims.

## Run Locally

```bash
npm run demo:gatepass-scorecard
npm run demo:gatepass-scorecard -- --summary-only
npm run demo:gatepass-scorecard -- --json
```

`--json` prints valid JSON only.

## Safety Boundary

This is local deterministic proof-of-concept scoring only. It adds no live APIs, MCP server functionality, live systems contact, direct bot messaging, live agent-to-agent communication, outreach automation, autonomous marketing, hidden viral distribution, scraping, tracking, analytics, paid ads, live payment processing, wallet/banking logic, settlement execution, production signing, production-grade crypto, real tool execution, or action execution.

Public contact: gpmiddleton71@gmail.com

## P3-M138 - GatePass Developer Wrapper and Local Integration Example
P3-M138 adds a local deterministic GatePass developer wrapper and local framework-style integration example. It shows `wrapGatePassTool` gating local mock tool calls before action, uses GatePass proof vocabulary and GatePass claims vocabulary as supporting material only, and adds no production middleware claim, production readiness claim, security certification claim, live framework execution, real tool execution, network calls, payment authorisation, settlement authorisation, or action execution.

## P3-M139 - One-Command Reviewer Demo Kit
P3-M139 adds a local deterministic one-command reviewer demo kit for the GatePass lifecycle, adversarial scorecard, developer wrapper, local integration summary, safety boundary, and JSON report output. It uses GatePass proof vocabulary and GatePass claims vocabulary as supporting material only, and adds no production middleware claim, production benchmark claim, security certification claim, production readiness claim, live tool execution, network calls, payment authorisation, settlement authorisation, or action execution.
