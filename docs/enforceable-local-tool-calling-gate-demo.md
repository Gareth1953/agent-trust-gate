# Enforceable Local Tool-Calling Gate Demo

P3-M132 adds a runnable local mock tool-calling gate demo for Agent Trust Gate.

Strategic principle:

We do not chase millions of AI agents. We create the trust rule they must satisfy.

Core positioning:

Do not trust the agent. Trust the gate pass.

No proof. No permission.

No mandate. No action.

No signed gate pass. No settlement.

No mandate. No evidence. No verified intent. No signed gate pass. No settlement.

## Purpose

This pack demonstrates a realistic local mock agent workflow where proposed
sensitive tool calls are intercepted before any tool would be allowed. It moves
the project from reference architecture into runnable local enforcement without
executing real tools.

## Relationship To P3-M129, P3-M130, And P3-M131

P3-M129 defined the prove-yourself rule for agents and owners.

P3-M130 turned that rule into local proof package, verification request/result,
and gate-pass challenge schemas plus a local proof contract evaluator.

P3-M131 showed local adapter placement for workflow, tool-call, approval,
governance, session/access, and pre-settlement checkpoints.

P3-M132 wraps those pieces around mock sensitive tool calls so a developer can
run a local gate and inspect allow, block, escalate, require-evidence,
require-human-review, and require-signed-proof outcomes.

## Why Runnable Enforcement Matters

External reviewer feedback was clear: Agent Trust Gate must feel like a
runnable gate, not only a reference architecture. This demo shows a mock agent
proposing a tool call, the gate intercepting it, proof being checked, and a
local receipt-style result being emitted before any action is allowed.

## Mock Agent Workflow

```text
mock agent proposes tool call
-> local gate wrapper intercepts the call
-> proof package, mandate, evidence, intent, freshness, nonce, signed proof, and policy are checked
-> local decision is emitted
-> receipt summary explains the gate result
-> no real tool is executed
```

## Tool-Call Interception Flow

The demo is implemented in `src/enforceable-tool-gate.ts`.

The gate evaluates:

- the mock tool name and proposed action;
- the local proof package, if present;
- required mandate and permitted scope;
- evidence reference;
- verified intent status;
- freshness and nonce/replay status;
- signed proof or signed gate pass status;
- human approval requirements;
- settlement-sensitive policy requirements.

The CLI runner is `src/enforceable-tool-gate-cli.ts`.

Run it locally:

```text
npm run demo:enforceable-tool-gate
npm run demo:enforceable-tool-gate -- --summary-only
```

## Local Outcomes

The demo covers:

- `allow`: valid scoped local proof allows locally only.
- `block`: missing mandate, stale/replayed proof, or missing settlement gate pass fails closed.
- `escalate`: customer-facing tool calls without required approval escalate.
- `require_evidence`: missing proof package or missing evidence requires proof.
- `require_human_review`: high-risk session/access escalation requires human review.
- `require_signed_proof`: payment-like preparation requires signed proof before any local allow.

## What This Demo Proves Locally

This proves that local interception can be modelled and run deterministically.
It proves proposed tool calls can be evaluated before action, and that missing,
stale, unsigned, replayed, or out-of-scope proof can block or escalate locally.
It also proves receipt-style results can explain why the gate allowed or refused
the mock call.

## What This Demo Does Not Prove

This is not production readiness, production integration, certified security,
identity/authentication certification, legal/compliance certification, payment
readiness, settlement readiness, or a universal agent standard.

It does not execute real tools, write real files, send customer messages, send
email, prepare real payments, approve procurement, create settlement
instructions, call live APIs, contact live systems, contact agents, use MCP
server functionality, call networks, or perform action execution.

## Safety Boundary

The demo is local-only. It preserves `localDemoOnly: true` and keeps
`realToolExecuted`, `liveSystemsContact`, `directBotMessaging`,
`autonomousOutreach`, `liveAgentToAgentCommunication`, `paymentAuthorisation`,
`settlementAuthorisation`, `actionExecution`, and `productionCertification`
false.

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
