# Local Response And Receipt Schema

The P3-M091 receipt layer produces a local audit artifact:

| Field | Meaning |
| --- | --- |
| `receipt_id` | Deterministic local receipt reference. |
| `request_id` | Reference to the reviewed local request. |
| `agent_id` | Placeholder demo-agent identity. |
| `verdict` | Allow, review, or refusal decision. |
| `allowed` | True only for `allow_signed_gate_pass`. |
| `settlement_allowed` | Local trust-artifact eligibility, true only for the allow verdict. |
| `receipt_type` | `signed_gate_pass`, `review_receipt`, or `refusal_receipt`. |
| `risk_tier` | Local policy tier (`low`, `medium`, or `high`) or `blocked` after refusal. |
| `policy_pack_version` | Local policy contract version, currently `local-demo-v1`. |
| `applied_policy` | Stable local rule explaining the verdict. |
| `risk_reason` | Plain-language reason for the tier. |
| `fast_path_allowed` | True only for a successful low-risk path. |
| `human_review_required` | True for a review verdict. |
| `checks` | Mandate, evidence, verified-intent, limits, and approval results with reasons. |
| `reason_codes` | Stable reasons supporting the decision. |
| `checked_at` | Local decision timestamp. |
| `gate_pass_validity` | Allow-only issue, valid-from, exclusive expiry, and maximum-TTL metadata; null for review/refusal. |
| `replay_protection` | Allow-only deterministic single-use local replay key; null for review/refusal. |
| `signature_metadata` | Explicit non-cryptographic `local_demo_placeholder` metadata. |

`settlement_allowed` means the local artifact says the trust gate would allow settlement in the demo. It does not execute settlement, move money, call a service, or authorize a production transaction. `settlement_executed` remains false.

This is a local demo receipt schema, not a production response contract or signed legal record.

The v2 local receipt schema adds bounded validity and replay metadata. The local settlement blocker requires a current, unused `signed_gate_pass`, allow verdict, both allow booleans, all critical checks passed, no refusal codes, and no human-review requirement. Any other receipt remains blocked.
