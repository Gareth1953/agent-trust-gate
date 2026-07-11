# Tool-Calling Proof Gate Adapter Guide

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
