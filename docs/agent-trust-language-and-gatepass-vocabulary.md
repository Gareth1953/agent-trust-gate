# Agent Trust Language and GatePass Vocabulary

## Purpose

P3-M136 defines a shared proof vocabulary for Agent Trust Gate. It is both
agent-readable and human-readable, so agents, owners, clients, systems,
marketplaces, payment workflows, tool layers, and other agentic systems can
express trust requirements before action.

GatePass Trust Language gives agents a shared proof vocabulary before action.

This is not a "proven safe" language. It is not a guarantee of agent safety. It
is a scoped proof language for mandate, evidence, intent, approval, freshness,
scope, GatePass status, and review outcomes.

Safe phrase:

> This agent has presented proof for this specific action, under this specific scope, at this specific time.

Rejected phrase:

> This agent is proven safe.

## Why Agents Need A Shared Proof Vocabulary

Claimed agent identity is not enough. A system needs language for asking:

- What is the requested action?
- What mandate allows it?
- What evidence supports it?
- Is intent verified?
- Is approval present or required?
- Is the GatePass fresh, scoped, non-replayed, and signed where needed?
- Should the result allow locally, block, escalate, require evidence, require
  human review, or require a signed GatePass?

Without a controlled vocabulary, agents and systems can blur identity, trust,
approval, and safety claims. GatePass Trust Language keeps those concepts
separate.

## What Agent Trust Language Is

Agent Trust Language is the local proof vocabulary used by Agent Trust Gate to
describe proof before action. It lets an agent or owner say what proof exists,
what proof is missing, what action is being requested, and what local decision
is appropriate.

Core positioning:

- Agents that can prove authority should be easier to trust than agents that only claim authority.
- GatePass gives agents a language of proof.
- Do not trust the agent. Trust the GatePass.
- No proof. No permission.
- No mandate. No action.
- No signed GatePass. No settlement.

## What GatePass Trust Language Is

GatePass Trust Language is the GatePass-specific controlled vocabulary for
terms such as `mandate_reference`, `evidence_reference`, `verified_intent`,
`fresh_gatepass`, `replay_detected`, `signed_gatepass_present`,
`proof_sufficient`, `require_human_review`, and
`no_signed_gatepass_no_settlement`.

It supports:

- GatePass: the compact local proof primitive.
- ProofPackage: broader supporting material and context.
- VerificationContract: local requirements for checking proof.
- Tool Gate: local interception before sensitive tool calls.
- Pre-Settlement Gate: local blocking before settlement-sensitive flows.

## What This Language Is Not

This language is not:

- a safety guarantee;
- production readiness;
- production-grade cryptography;
- legal, financial, compliance, procurement, settlement, identity,
  authentication, or security certification;
- a universal agent language standard;
- a way to bypass verification;
- a marketing automation system;
- a direct bot messaging protocol;
- live agent-to-agent communication;
- action execution.

## How Agents, Systems, Owners, And Clients Use It

Agents can use the vocabulary to express proof status: "my mandate reference is
present", "my evidence reference is present", "my intent status is verified",
or "my GatePass is stale".

Systems can challenge or verify agents by asking for required terms before
action: `mandate_reference`, `permitted_scope`, `evidence_reference`,
`verified_intent`, `fresh_gatepass`, `nonce_present`, and
`signed_gatepass_present`.

Owners can explain agent authority without overclaiming: "this workflow can
present local proof for this scoped action", not "this agent is proven safe".

Clients can ask for proof before sensitive action: "show mandate, evidence,
intent, approval, freshness, nonce, and signed GatePass where required".

## Safety Boundary

P3-M136 is documentation, vocabulary modelling, structured examples, local
deterministic language helpers, metadata updates, and tests only. It adds no
live APIs, MCP server functionality, live systems contact, direct bot
messaging, live agent-to-agent communication, autonomous marketing, hidden viral
distribution, scraping/contact harvesting, live payment processing, settlement
execution, production signing, production-grade crypto, real tool execution,
or action execution.

Public contact: gpmiddleton71@gmail.com
## P3-M137 - GatePass Adversarial Metrics and Latency Scorecard
P3-M137 adds a local deterministic GatePass adversarial metrics and latency scorecard with expected-vs-actual outcomes, caught adversarial scenarios, valid local controls, decision reasons, and local illustrative timing. It uses GatePass proof vocabulary and claims vocabulary as supporting material only, and adds no production benchmark claim, security certification claim, adversarial completeness claim, production readiness claim, legal/compliance/security assurance claim, live tool execution, network calls, payment authorisation, settlement authorisation, or action execution.

## P3-M138 - GatePass Developer Wrapper and Local Integration Example
P3-M138 adds a local deterministic GatePass developer wrapper and local framework-style integration example. It shows `wrapGatePassTool` gating local mock tool calls before action, uses GatePass proof vocabulary and GatePass claims vocabulary as supporting material only, and adds no production middleware claim, production readiness claim, security certification claim, live framework execution, real tool execution, network calls, payment authorisation, settlement authorisation, or action execution.
