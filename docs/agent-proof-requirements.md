# Agent Proof Requirements

P3-M132 update: the Enforceable Local Tool-Calling Gate Demo shows how missing
or stale proof requirements block, escalate, require evidence, require human
review, or require signed proof before mock tool calls. It adds no real tool
execution, live APIs, MCP server functionality, live systems contact, direct
bot messaging, live agent-to-agent communication, payment processing,
settlement execution, production signing, or action execution.

P3-M131 update: the Agent Proof Contract Integration Readiness Pack shows how
these proof requirements can be used by local workflow, tool-call, approval,
governance, session/access, and pre-settlement adapters without adding live
APIs, MCP server functionality, live systems contact, direct bot messaging,
live agent-to-agent communication, payment processing, settlement execution,
production signing, or action execution.

P3-M129 defines local proof requirements for an agent or owner that wants trust
from Agent Trust Gate.

Core rule:

No mandate. No evidence. No verified intent. No signed gate pass. No settlement.

Core positioning:

Do not trust the agent. Trust the gate pass.

No proof. No permission.

No mandate. No action.

No signed gate pass. No settlement.

## Purpose

This document lists the proof items an agent should present before sensitive
action, tool use, access, or settlement-adjacent workflow review.

These are local proof requirements only. They are not production
authentication, identity certification, legal/compliance/security approval, live
API requirements, payment authorisation, settlement authorisation, or action
execution authority.

## Required Proof Items

A local prove-yourself package should include:

- claimed agent identity;
- owner / issuer reference;
- mandate reference;
- permitted action scope;
- requested action;
- evidence reference;
- verified intent status;
- human approval status if required;
- risk tier;
- freshness / expiry status;
- nonce / replay-protection status;
- signed receipt or signed proof reference where required;
- session context where relevant;
- local-only evaluation result.

## Proof Item Meanings

Claimed agent identity:
The name or type the agent claims. It is context only. Claimed identity alone is
not enough.

Owner / issuer reference:
A local reference to the owner, issuer, or authority source. It is not a live
identity system and does not certify identity.

Mandate reference:
The local mandate that explains why this agent may request this action. Missing
mandate should block or escalate.

Permitted action scope:
The bounded scope the mandate allows. Scope should be specific enough to prevent
scope creep.

Evidence reference:
The local evidence supporting the request. Missing evidence should require
evidence or block higher-risk requests.

Verified intent status:
Whether the user/client/system intent is verified for the requested action.
Unverified or conflicting intent should block or escalate.

Human approval status:
Whether human approval is required and present. High-risk action requires human
review.

Risk tier:
The local risk level for the requested action. High or critical risk should not
be allowed without human review.

Freshness / expiry:
Whether the proof is fresh enough for the current session. Stale proof should
fail.

Nonce / replay protection:
Whether the proof is single-use or otherwise protected against replay. Replayed
proof should fail.

Signed receipt or signed proof reference:
A local signed proof reference when the workflow requires stronger evidence,
especially for settlement-sensitive decisions.

Session context:
Whether current session behaviour is consistent with the claimed purpose and
requested action.

Local-only evaluation result:
The local gate decision: allow, block, escalate, require evidence, require human
review, or require signed proof.

## Evaluation Rules

- Claimed identity alone is not enough.
- Missing mandate should block or escalate.
- Missing evidence should require evidence or block.
- Unverified intent should block or escalate.
- Stale or replayed proof should fail.
- High-risk action requires human review.
- Settlement-sensitive action requires a valid signed gate pass.
- No proof means no permission.

## Local Demo

Run the deterministic local proof examples:

```text
npm run demo:prove-yourself
```

## Public Contact

Public project contact: `gpmiddleton71@gmail.com`

## Safety Boundary

This is proof-requirement documentation only. It does not add live systems
contact, direct bot messaging, live agent-to-agent communication, live APIs,
payment processing, settlement execution, production signing, production
certification, or action execution.

## P3-M130 Structured Proof Contract

P3-M130 turns these proof requirements into local JSON schemas and deterministic
verification examples:

- `schemas/agent-proof-package.schema.json`
- `schemas/agent-proof-verification-request.schema.json`
- `schemas/agent-proof-verification-result.schema.json`
- `schemas/gate-pass-challenge.schema.json`

The structured contract keeps the same rule: claimed identity alone is not
sufficient proof, no proof means no permission, and settlement-sensitive local
flows require signed proof before any allow decision.
## P3-M133 Minimal GatePass Core Specification Pack

P3-M133 narrows Agent Trust Gate(TM) around GatePass as the compact local proof primitive. ProofPackage carries supporting material, VerificationContract checks it, Tool Gate enforces it before sensitive actions, and Pre-Settlement Gate blocks settlement-sensitive flows without valid proof. This is local specification, schema, model, example, and test work only; it adds no live APIs, MCP server functionality, live systems contact, direct bot messaging, live agent-to-agent communication, production signing, production-grade crypto, payment processing, settlement execution, real tool execution, or action execution.
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
