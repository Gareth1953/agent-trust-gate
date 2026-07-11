# Pre-Settlement Proof Contract Integration

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
