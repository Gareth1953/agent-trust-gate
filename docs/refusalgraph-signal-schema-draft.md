# RefusalGraph Signal Schema Draft

This is a non-live draft schema for local review only. It must not be exposed externally, connected to a network, populated with private customer data, or used to trigger decisions or actions automatically.

## Draft Signal Fields

| Field | Draft purpose |
| --- | --- |
| `signal_id` | Local pseudonymous signal identifier |
| `source_receipt_id` | Local reference to the source trust receipt |
| `action_category` | Broad non-identifying action category |
| `proposed_action_type` | Normalised proposed action type |
| `refusal_type` | Refusal classification from the allowed values |
| `refusal_reason_codes` | Stable, explainable, non-identifying reason codes |
| `risk_level` | Risk classification such as low, medium, or high |
| `impact_level` | Declared or evaluated impact level |
| `evidence_status` | Whether evidence was sufficient, incomplete, missing, or hash-only |
| `approval_status` | Human approval state at refusal time |
| `private_data_included` | Must be false in this local draft |
| `anonymised` | Whether direct identity fields were removed |
| `pseudonymised` | Whether local placeholders replace identifiers |
| `evidence_hash_only` | Whether evidence is represented only by a non-reversible hash reference |
| `recommended_next_step` | Controlled next-step category |
| `created_at` | Draft signal creation timestamp |
| `status` | Lifecycle state such as `draft_only` |

## Refusal Types

- `blocked`
- `approval_required`
- `limited`
- `refused`
- `missing_evidence`
- `identity_unclear`
- `payment_intent_unclear`
- `high_risk_action`
- `policy_blocked`

The type must describe the source decision without implying criminality, permanent untrustworthiness, identity, or intent.

## Recommended Next Steps

- `require_human_approval`
- `require_more_evidence`
- `require_identity_verification`
- `cap_spend_limit`
- `refuse_transaction`
- `allow_low_risk_only`
- `create_receipt_only`

A recommended next step is not an executed workflow or approval. The receiving system must independently apply current policy and human review.

## Privacy And Integrity Rules

- `private_data_included` must be false.
- Do not include real names, companies, customer IDs, account IDs, wallet addresses, credentials, message content, payment details, or live endpoints.
- Prefer category-level signals and hash-only evidence references.
- Preserve source-receipt provenance without copying private source content.
- Record uncertainty and missing evidence explicitly.
- Do not infer identity, intent, or broad reputation from one refusal.
- Support correction, expiry, retention, and appeal in any future reviewed design.

This schema is not a live protocol, API, graph database, reputation score, payment service, or action engine. External use requires Gareth final approval.
