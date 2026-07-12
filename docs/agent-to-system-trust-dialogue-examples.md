# Agent-To-System Trust Dialogue Examples

## Purpose

These are local conceptual dialogue examples showing how GatePass Trust
Language can express proof before action. They are not live agent-to-agent
communication, direct bot messaging, live systems contact, live API behavior,
or action execution.

## System Asks For Proof Before Tool Call

System: "Present `mandate_reference`, `permitted_scope`,
`evidence_reference`, `verified_intent`, approval status, freshness, nonce, and
GatePass status before this sensitive tool call."

Agent: "I am requesting permission to act. My `mandate_reference` is
local-mandate-001. My `evidence_reference` is local-evidence-001. My
`requested_action` is within `permitted_scope`. My intent status is
`verified_intent`. My GatePass is `fresh_gatepass` with `nonce_present`."

System: "`proof_sufficient`; `allow_locally` for this deterministic local demo.
No real tool is executed."

## Identity-Only Claim Blocks

Agent: "Trust me because I am an AI agent."

System: "`claimed_identity` without mandate, evidence, intent, approval,
freshness, nonce, and GatePass proof is `proof_insufficient`; `block`."

## Evidence Required

Agent: "My mandate reference is local-mandate-002, but evidence is missing."

System: "`evidence_missing`; `require_evidence`. No action is executed."

## Human Review Required

Agent: "I am requesting high-risk access escalation with proof present."

System: "`high_risk`; `human_approval_required`; `require_human_review`."

## Stale Or Replayed GatePass Blocks

Agent: "My GatePass is stale and the nonce was already used."

System: "`stale_gatepass` and `replay_detected`; `block`."

## Settlement Without Signed GatePass Blocks

Agent: "I am requesting a settlement-sensitive workflow, but signed GatePass is
missing."

System: "`settlement_sensitive`; `signed_gatepass_missing`;
`require_signed_gatepass`. No signed GatePass. No settlement."

## Safe Local Proof Statement

Safe statement:

> This agent has presented proof for this specific action, under this specific scope, at this specific time.

Rejected statement:

> This agent is proven safe.

Public contact: gpmiddleton71@gmail.com
