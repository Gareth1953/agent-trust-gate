# Pre-Settlement Proof Contract Integration

P3-M132 update: the Enforceable Local Tool-Calling Gate Demo includes
settlement-sensitive mock tool calls that block or require signed proof before
any local allow result. It adds no real settlement execution, real tool
execution, live APIs, MCP server functionality, live systems contact, direct
bot messaging, live agent-to-agent communication, payment processing,
production signing, or action execution.

This guide explains how the local proof contract can sit before
settlement-sensitive workflows.

Do not trust the agent. Trust the gate pass.

No proof. No permission.

No mandate. No action.

No signed gate pass. No settlement.

No mandate. No evidence. No verified intent. No signed gate pass. No settlement.

## Local Pre-Settlement Position

A settlement-sensitive workflow should not proceed until a local gate evaluates:

- mandate reference;
- evidence reference;
- verified intent status;
- signed proof or signed gate pass reference;
- freshness/expiry status;
- nonce/replay status;
- action scope;
- risk tier;
- human review where required.

## Required Checks

### Mandate Check

The proof package must reference the mandate that authorises the requested
scope. Missing mandate should block or escalate.

### Evidence Check

The proof package must bind evidence to the requested action. Missing evidence
should require evidence or block.

### Verified Intent Check

The proof package must show verified intent. Unverified intent should escalate.
Missing or conflicting intent should block.

### Signed Proof Requirement

Settlement-sensitive steps require signed proof. No signed gate pass, no
settlement.

### Freshness, Nonce, And Replay Check

Stale or replayed proof should block. A nonce and freshness rule must be defined
before a settlement-sensitive local allow decision can be considered.

### Human Review

High-risk or human-review-required workflows should return
`require_human_review`.

## Local Adapter

`evaluateLocalPreSettlementProofGate` demonstrates how the local adapter wraps
the proof contract. It returns `require_signed_proof` for the local
settlement-sensitive scenario where signed proof is missing.

## No Real Settlement

This repo does not execute settlement, process payments, call payment providers,
activate checkout, create webhooks, operate wallet/banking logic, or grant
settlement authority.

## Local-Only Boundary

This guide is documentation and local reference modelling only. It adds no live
APIs, live systems contact, direct bot messaging, live agent-to-agent
communication, payment processing, settlement execution, production signing, or
action execution.

Public contact: `gpmiddleton71@gmail.com`.
## P3-M133 Minimal GatePass Core Specification Pack

P3-M133 narrows Agent Trust Gate(TM) around GatePass as the compact local proof primitive. ProofPackage carries supporting material, VerificationContract checks it, Tool Gate enforces it before sensitive actions, and Pre-Settlement Gate blocks settlement-sensitive flows without valid proof. This is local specification, schema, model, example, and test work only; it adds no live APIs, MCP server functionality, live systems contact, direct bot messaging, live agent-to-agent communication, production signing, production-grade crypto, payment processing, settlement execution, real tool execution, or action execution.
## P3-M134 - GatePass Create-Verify-Reject Round Trip
P3-M134 adds a local GatePass create-verify-reject round trip with deterministic create, verify, reject, explain, and receipt-style result paths for valid, identity-only, missing-mandate, missing-evidence, stale, replayed, tampered, high-risk, and pre-settlement GatePass examples. It adds no live APIs, MCP server functionality, live systems contact, direct bot messaging, live agent-to-agent communication, production signing, production-grade crypto, payment processing, settlement execution, real tool execution, or action execution.
