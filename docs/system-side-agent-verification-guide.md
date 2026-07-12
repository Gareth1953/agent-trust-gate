# System-Side Agent Verification Guide

P3-M132 update: the Enforceable Local Tool-Calling Gate Demo gives
system-side reviewers a runnable local mock gate for checking proposed tool
calls before action. It adds no real tool execution, live APIs, MCP server
functionality, live systems contact, direct bot messaging, live agent-to-agent
communication, payment processing, settlement execution, production signing, or
action execution.

P3-M131 update: the Agent Proof Contract Integration Readiness Pack shows how
system-side verification questions map into local workflow, tool-call,
approval, governance, session/access, and pre-settlement adapters without
adding live APIs, MCP server functionality, live systems contact, direct bot
messaging, live agent-to-agent communication, payment processing, settlement
execution, production signing, or action execution.

P3-M129 adds a local system-side verification guide for clients, systems,
marketplaces, payment workflows, enterprise reviewers, and developer tools.

Core rule:

No mandate. No evidence. No verified intent. No signed gate pass. No settlement.

## Purpose

This guide explains what a receiving system should ask before trusting an AI
agent or agent-owner claim.

It is a local verification guide only. It does not create a live integration,
live API, MCP server, production security claim, legal/compliance guarantee,
payment authority, settlement authority, or action execution path.

## Questions To Ask

Before sensitive access or action, ask:

- Who are you?
- Who authorised you?
- What are you trying to do?
- What are you allowed to do?
- What evidence supports this?
- Is the intent verified?
- Is approval fresh?
- Can the approval be replayed?
- Is there a signed gate pass?
- Should this be allowed, blocked, escalated, or reviewed by a human?

## Safe Local Verification Path

1. Inspect the local proof package.
2. Confirm mandate, evidence, verified intent, permitted scope, risk tier,
   freshness, nonce, signed proof, and session context.
3. Run or inspect the local prove-yourself demo:

```text
npm run demo:prove-yourself
```

4. Confirm the result remains local-only.
5. Confirm action, payment, settlement, live systems contact, direct bot
   messaging, and production certification flags remain false.
6. Treat the result as a local review artifact, not live permission.

## What Not To Infer

Do not infer:

- claimed identity is trust;
- a gate pass is universal identity;
- a local proof is production authentication;
- the repo exposes a live API or live agent endpoint;
- the repo grants autonomous authority;
- the repo enables payment or settlement;
- the repo certifies legal/compliance/security status;
- a paid enquiry grants automatic access or acceptance.

## Allow, Block, Escalate, Or Review

The system-side outcome should be scoped:

- allow only when local proof requirements are satisfied;
- block when mandate, evidence, proof freshness, nonce, or signed proof fails;
- require evidence when evidence is missing;
- escalate when intent is unclear or context needs review;
- require human review for high-risk actions;
- require signed proof for settlement-sensitive workflows.

## No Live Integration Claim

This guide is not an official integration with any agent framework, marketplace,
payment provider, browser, identity provider, cloud service, or production
system. It is local documentation and reference modelling only.

## Public Contact

Public project contact: `gpmiddleton71@gmail.com`

## Safety Boundary

P3-M129 adds no live systems contact, direct bot messaging, live
agent-to-agent communication, external-agent contact, autonomous contact,
outreach automation, scraping, contact harvesting, tracking, analytics,
telemetry, hosted calls, live APIs, payment processing, settlement execution,
production signing, production key management, or action execution.

## P3-M130 Verification Contract

P3-M130 gives system-side reviewers a local contract to inspect:

- a gate-pass challenge says what proof is required;
- an agent proof package presents mandate, evidence, intent, freshness, nonce,
  signed proof, and session context fields;
- a verification result records allow/block/escalate/require-evidence/
  require-human-review/require-signed-proof outcomes.

The contract is local-only and grants no live systems contact, direct bot
messaging, payment/settlement authority, production certification, or action
execution.
## P3-M133 Minimal GatePass Core Specification Pack

P3-M133 narrows Agent Trust Gate(TM) around GatePass as the compact local proof primitive. ProofPackage carries supporting material, VerificationContract checks it, Tool Gate enforces it before sensitive actions, and Pre-Settlement Gate blocks settlement-sensitive flows without valid proof. This is local specification, schema, model, example, and test work only; it adds no live APIs, MCP server functionality, live systems contact, direct bot messaging, live agent-to-agent communication, production signing, production-grade crypto, payment processing, settlement execution, real tool execution, or action execution.
## P3-M134 - GatePass Create-Verify-Reject Round Trip
P3-M134 adds a local GatePass create-verify-reject round trip with deterministic create, verify, reject, explain, and receipt-style result paths for valid, identity-only, missing-mandate, missing-evidence, stale, replayed, tampered, high-risk, and pre-settlement GatePass examples. It adds no live APIs, MCP server functionality, live systems contact, direct bot messaging, live agent-to-agent communication, production signing, production-grade crypto, payment processing, settlement execution, real tool execution, or action execution.
