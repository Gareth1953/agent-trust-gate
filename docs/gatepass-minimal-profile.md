# GatePass Minimal Profile

P3-M133 defines local profiles for the Minimal GatePass Core. These are not formal standards. They are local profiles used to keep Agent Trust Gate(TM) focused around GatePass.

Core positioning:

Do not trust the agent. Trust the GatePass.
No proof. No permission.
No mandate. No action.
No signed GatePass. No settlement.

Public contact: gpmiddleton71@gmail.com

## Low-Risk Action Profile

Required fields: all minimal GatePass core fields.

Required proof strength:

- mandate present;
- evidence present;
- verified intent present;
- nonce present;
- fresh expiry;
- local signature reference present;
- human approval not required.

Expected local outcome: allow locally only.

Safety limitations: no action execution, no live API, no payment authority, no settlement authority, no production signing.

## Sensitive Tool-Call Profile

Required fields: all minimal GatePass core fields.

Required proof strength:

- bounded mandate;
- evidence bound to the proposed tool call;
- verified intent;
- human approval when policy requires it;
- fresh expiry and nonce;
- local signed proof reference.

Expected local outcome: allow locally only if required proof is present; otherwise block, escalate, require evidence, require human review, or require signed proof.

Safety limitations: the repo does not call the real tool.

## High-Risk Human-Review Profile

Required fields: all minimal GatePass core fields plus an approval state that can show human review.

Required proof strength:

- high-risk mandate and scope;
- supporting evidence;
- verified intent;
- fresh expiry and nonce;
- signed proof reference;
- human approval when required.

Expected local outcome: require human review when approval is missing.

Safety limitations: human-review status in this repo is local demo data only.

## Pre-Settlement Profile

Required fields: all minimal GatePass core fields plus `extensions.preSettlement`.

Required proof strength:

- settlement-sensitive mandate;
- settlement-sensitive scope;
- evidence;
- verified intent;
- fresh expiry;
- nonce;
- human approval where required;
- signed GatePass reference.

Expected local outcome: allow locally only when the signed GatePass is present; require signed proof or block when it is missing or invalid.

Safety limitations: no real settlement is executed and no settlement authority is granted.

## Invalid / Identity-Only Profile

Required fields: claimed identity alone is insufficient.

Required proof strength:

- claimed agent name or subject is not enough;
- mandate, evidence, verified intent, scope, freshness, nonce, and signature status are required.

Expected local outcome: block.

Safety limitations: identity-only claims must not be treated as trust.
## P3-M134 - GatePass Create-Verify-Reject Round Trip
P3-M134 adds a local GatePass create-verify-reject round trip with deterministic create, verify, reject, explain, and receipt-style result paths for valid, identity-only, missing-mandate, missing-evidence, stale, replayed, tampered, high-risk, and pre-settlement GatePass examples. It adds no live APIs, MCP server functionality, live systems contact, direct bot messaging, live agent-to-agent communication, production signing, production-grade crypto, payment processing, settlement execution, real tool execution, or action execution.
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
