# Tool-Calling Proof Gate Adapter Guide

P3-M132 update: the Enforceable Local Tool-Calling Gate Demo implements this
local adapter concept as a runnable mock tool-call gate with receipt-style
results. It adds no real tool execution, live APIs, MCP server functionality,
live systems contact, direct bot messaging, live agent-to-agent communication,
payment processing, settlement execution, production signing, or action
execution.

This guide explains how a local tool-calling layer could call the P3-M130 proof
contract before allowing sensitive tool calls.

Do not trust the agent. Trust the gate pass.

No proof. No permission.

No mandate. No action.

No signed gate pass. No settlement.

## Local Tool-Call Types

A developer might place a proof gate before local tool categories such as:

- public post;
- customer-facing message;
- file write;
- data export;
- purchase/payment preparation;
- procurement step;
- access/session escalation;
- settlement-sensitive step.

## Adapter Concept

The local adapter should:

1. receive the proposed tool call;
2. create or retrieve a gate-pass challenge;
3. require an agent proof package;
4. create a verification request;
5. evaluate the proof contract locally;
6. return a local result;
7. avoid invoking the actual tool unless a separate safe system later decides to
   do so outside this repo.

`src/agent-proof-integration-adapter.ts` demonstrates this through
`evaluateLocalToolCallProofGate`.

## Local Outcomes

The adapter may return:

- `allow`
- `block`
- `escalate`
- `require_evidence`
- `require_human_review`
- `require_signed_proof`

The adapter always records `calledTool: false` and `actionExecution: false`.

## Sensitive Tool-Call Rule

Sensitive tool calls should not proceed on claimed identity. They need mandate,
evidence, verified intent, scope, freshness, nonce/replay checks, signed proof
where required, and human review where risk requires it.

If verified intent is missing or unverified, the local adapter escalates.

If proof is stale or replayed, the local adapter blocks.

If the tool call is settlement-sensitive, the local adapter requires signed
proof.

## No Real Tool Execution

The adapter blocks or escalates locally only. No real tools are called. No
public posts are published. No customer message is sent. No file write is
performed. No export runs. No procurement step is executed. No payment or
settlement step is triggered.

## No Production Integration Claim

This guide is not an official production integration. It adds no live APIs, MCP
server functionality, hosted service, direct bot messaging, live
agent-to-agent communication, payment processing, settlement execution,
production signing, production key management, or action execution.

Public contact: `gpmiddleton71@gmail.com`.
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
