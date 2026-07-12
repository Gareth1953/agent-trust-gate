# Agent Proof Package Schema and Verification Contract

P3-M132 update: the Enforceable Local Tool-Calling Gate Demo uses the P3-M130
proof package and verification contract to intercept mock sensitive tool calls
locally. It emits receipt-style results and adds no real tool execution, live
APIs, MCP server functionality, live systems contact, direct bot messaging,
live agent-to-agent communication, payment processing, settlement execution,
production signing, or action execution.

P3-M131 update: the Agent Proof Contract Integration Readiness Pack shows how
this P3-M130 proof contract can be used in local workflow, tool-call, approval,
governance, session/access, and pre-settlement adapters without adding live
APIs, MCP server functionality, live systems contact, direct bot messaging,
live agent-to-agent communication, payment processing, settlement execution,
production signing, or action execution.

P3-M130 turns the P3-M129 prove-yourself protocol into local, structured,
machine-readable proof package schemas, verification request/result schemas,
challenge examples, TypeScript helpers, and deterministic local demo output.

Strategic principle:

We do not chase millions of AI agents. We create the trust rule they must satisfy.

Core positioning:

Do not trust the agent. Trust the gate pass.

No proof. No permission.

No mandate. No action.

No signed gate pass. No settlement.

No mandate. No evidence. No verified intent. No signed gate pass. No settlement.

## Purpose

The purpose of this pack is to show what an AI agent, agent owner, or local
workflow should present before trust is granted. The pack is designed for local
developer review, automated repo inspection, and integration feasibility
discussion. It does not create a live API, live agent endpoint, direct bot
messaging route, payment rail, settlement rail, hosted verifier, production
signing service, or action executor.

## Why Structured Proof Packages Matter

Plain claims such as "I am a trusted agent" are weak. A receiving system needs a
structured object it can inspect for mandate, issuer/owner references, evidence,
verified intent, action scope, freshness, nonce/replay status, signed proof
status, and session context.

The schemas in this pack make those expectations explicit:

- [Agent proof package schema](../schemas/agent-proof-package.schema.json)
- [Agent proof verification request schema](../schemas/agent-proof-verification-request.schema.json)
- [Agent proof verification result schema](../schemas/agent-proof-verification-result.schema.json)
- [Gate pass challenge schema](../schemas/gate-pass-challenge.schema.json)

## Relationship To P3-M129

P3-M129 defined the prove-yourself protocol in human-readable form and local
TypeScript logic. P3-M130 adds the contract layer that makes that protocol easier
to inspect by tools:

- `src/prove-yourself-protocol.ts` remains the local protocol model.
- `src/agent-proof-contract.ts` maps proof packages and verifier requests into
  deterministic local decisions.
- `src/agent-proof-contract-cli.ts` prints deterministic local examples.
- `examples/agent-proof-*.json` and `examples/gate-pass-challenge-*.json` show
  machine-readable examples.

## What An Agent Proof Package Is

An agent proof package is a local JSON object that states:

- who the agent claims to be;
- who owns or issued the proof;
- what mandate authorises the request;
- what action scope is allowed;
- what evidence supports the request;
- whether intent is verified;
- whether human approval is required or present;
- whether freshness and nonce checks are present;
- whether a signed proof reference is present;
- whether the request is settlement-sensitive;
- that the package is local-demo-only.

Claimed identity alone is not enough. A package with a name but no mandate,
evidence, verified intent, freshness, nonce, or signed proof should block or
escalate.

## What A Verification Contract Is

A verification contract is the receiving side's local request for proof. It says
which proof items are required, what purpose is being verified, the verifier and
system references, whether human review is required, whether the request is
settlement-sensitive, and the local-only boundary.

The local verifier then produces a result:

- `allow`
- `block`
- `escalate`
- `require_evidence`
- `require_human_review`
- `require_signed_proof`

The result includes reasons, missing proof items, required next proof, gate-pass
meaning, `localDemoOnly: true`, and disabled authority flags for live systems
contact, direct bot messaging, live agent-to-agent communication, payment,
settlement, production certification, and action execution.

## What A Receiving System Should Require

A receiving system, developer tool, client, marketplace, payment-adjacent
workflow, or enterprise reviewer should ask:

- Who are you?
- Who owns or issued this proof?
- What mandate authorises this action?
- What are you allowed to do?
- What evidence supports the request?
- Is intent verified?
- Is approval fresh and scoped?
- Can the approval be replayed?
- Is there a signed proof or signed gate pass reference?
- Should this be allowed, blocked, escalated, or reviewed by a human?

## Code-First Discovery Support

P3-M130 helps code-first reviewers inspect the project without guessing where
the proof boundary sits. A developer assistant can read `llms.txt`, the agent
card, the root manifest, the docs, the schemas, and examples to understand the
local contract.

Readable now. Callable later. Autonomous execution never without gate control.

This repository is readable by agents and systems, but it exposes no live agent
endpoint and grants no autonomous authority.

## What It Proves Locally

The local proof contract may show that:

- a proof package was checked against required fields;
- claimed identity was not treated as trust;
- missing mandate/evidence fails, blocks, or escalates;
- stale or replayed nonce/freshness fails;
- high-risk requests require human review;
- settlement-sensitive requests require signed proof;
- a valid local control can allow locally only.

## What It Does Not Prove

The proof contract does not prove universal identity, production authentication,
legal/compliance/security certification, payment authority, settlement
authority, production signing, live system access, external-agent contact, or
permission to execute actions.

It is not a universal agent standard. It is not production-ready. It is not a
certified security, identity, authentication, legal, financial, compliance,
procurement, payment, or settlement system.

## Local-Only Boundary

The pack is local schema modelling, local verification contract design,
examples, documentation, and tests only. It adds no live APIs, MCP server
functionality, live systems contact, direct bot messaging, live agent-to-agent
communication, external-agent contact, autonomous outreach, scraping, contact
harvesting, hosted services, payment processing, settlement execution,
production signing, production key management, cloud/network calls, or action
execution.

Public contact for human-reviewed developer, reviewer, and paid technical
review enquiries: `gpmiddleton71@gmail.com`.
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
