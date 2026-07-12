# GatePass Trust Language Vocabulary

## Purpose

This document defines controlled local vocabulary for proof before action. It
is not a formal standard and does not claim universal adoption. It is a
local-first vocabulary for Agent Trust Gate and GatePass examples.

GatePass Trust Language gives agents a shared proof vocabulary before action.

## Identity Terms

- `claimed_identity`: the agent or workflow name being asserted.
- `verified_authority`: local evidence that the claimed agent or workflow has
  authority for the requested action.

Claimed identity alone is not trust.

## Mandate Terms

- `mandate_reference`: local reference to the permission or instruction.
- `mandate_present`: a mandate reference exists.
- `mandate_missing`: no mandate reference exists.

No mandate. No action.

## Scope Terms

- `permitted_scope`: the allowed boundary of action.
- `requested_action`: the action the agent asks to perform.
- `scope_match`: requested action fits the permitted scope.
- `scope_mismatch`: requested action exceeds the permitted scope.

## Evidence Terms

- `evidence_reference`: local evidence reference supporting the decision.
- `evidence_present`: evidence exists.
- `evidence_missing`: evidence is missing.

No proof. No permission.

## Intent Terms

- `verified_intent`: intent has been checked locally.
- `unverified_intent`: intent is missing, unclear, or not checked.

## Approval Terms

- `human_approval_required`: human review is required before action.
- `approval_present`: approval exists.
- `approval_missing`: approval is missing.
- `approval_not_required`: local policy does not require approval for this
  action.

## Freshness Terms

- `fresh_gatepass`: GatePass is within its local validity window.
- `stale_gatepass`: GatePass is expired or outside its local validity window.

## Nonce And Replay Terms

- `nonce_present`: replay-protection value exists.
- `nonce_missing`: replay-protection value is missing.
- `replay_detected`: GatePass or proof appears reused.

## Signature And GatePass Terms

- `signed_gatepass_present`: local signed GatePass or signed proof reference is
  present.
- `signed_gatepass_missing`: signed GatePass is required but missing.
- `unsigned_gatepass`: GatePass lacks signed proof.

No signed GatePass. No settlement.

## Risk Terms

- `low_risk`: lower-impact local action.
- `sensitive_action`: action affects tools, users, data, access, publication,
  procurement, money-like preparation, or customer outcomes.
- `high_risk`: action requires human review.
- `settlement_sensitive`: action touches settlement-sensitive workflow design.

## Decision Terms

- `proof_sufficient`: required local proof is present.
- `proof_insufficient`: required local proof is missing, stale, replayed, or
  out of scope.
- `allow_locally`: allow only in the deterministic local demo context.
- `block`: refuse locally.

## Escalation Terms

- `escalate`: move to review path.
- `require_evidence`: evidence must be provided before action.
- `require_human_review`: human review is required.
- `require_signed_gatepass`: signed GatePass is required.

## Pre-Settlement Terms

- `settlement_sensitive`: settlement-sensitive workflow.
- `no_signed_gatepass_no_settlement`: settlement-sensitive flow must not
  proceed without signed GatePass proof.

## Unsafe Claim Terms

- `proven_safe_claim_rejected`: reject "this agent is proven safe" wording.
- `guaranteed_trust_claim_rejected`: reject guaranteed-trust wording.

Safe phrase:

> This agent has presented proof for this specific action, under this specific scope, at this specific time.

Unsafe phrase:

> This agent is proven safe.

Public contact: gpmiddleton71@gmail.com
