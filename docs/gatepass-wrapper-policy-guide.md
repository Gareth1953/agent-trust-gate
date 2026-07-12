# GatePass Wrapper Policy Guide

## Purpose

GatePass wrapper policies define what proof is required before a local mock tool
call can be allowed.

## Policy Concepts

- low-risk local action: may allow locally when mandate, scope, evidence,
  freshness, nonce, and local safety flags are present;
- customer-facing action: usually requires evidence and human approval;
- data export: requires explicit mandate, evidence, scope, nonce, and review;
- high-risk action: requires human review;
- settlement-sensitive action: requires a signed GatePass.

## Proof Requirements

Policies can require:

- mandate reference;
- evidence reference;
- verified intent;
- human approval;
- signed GatePass;
- freshness and expiry;
- nonce/replay protection;
- exact scope match.

If proof is missing or stale, the wrapper returns `block`, `require_evidence`,
`require_human_review`, or `require_signed_proof`. It does not execute a real
tool.

Public contact: gpmiddleton71@gmail.com
