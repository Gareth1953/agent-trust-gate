# Agent Clearing Decision Types

These are draft local outcome categories for future clearing review. They do not execute actions, establish identity, create legal terms, move money, connect agents, or settle transactions.

## `accept_with_limits`

The proposal may satisfy a narrow policy path if explicit limits, evidence, authorization, and approval are maintained. No action is executed by this decision.

## `refuse`

The proposal is declined under current evidence, identity, policy, approval, or risk conditions. A refusal should include explainable reasons and appropriate review options.

## `block`

A hard safety or disabled-control condition prevents further automated processing. The caller must not proceed.

## `approval_required`

The proposal requires exact-scope human approval before reconsideration. Agent self-approval is not valid.

## `require_more_evidence`

Relevant evidence is missing, incomplete, stale, conflicting, or unverifiable. No-match or silence is not evidence.

## `require_identity_verification`

The claimed participant identity or authority is insufficient for the requested permission. The local draft does not perform real-world identity verification.

## `require_refusalgraph_check`

Current policy would require a permitted privacy-preserving refusal-intelligence check. Live RefusalGraph lookup is disabled, so the current result remains blocked or draft-only.

## `create_receipt_only`

Record the evaluation and reasons without permitting or executing the proposed action.

## `draft_only_not_executed`

The request is a local planning artifact and no clearing, connection, lookup, fee, payment, settlement, or action occurred.

All decisions require current policy and may require human review. Gareth final approval is required before any external or commercial use.
