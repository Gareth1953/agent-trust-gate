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
| `risk_tier` | `low`, `high`, or `blocked`. |
| `checks` | Mandate, evidence, verified-intent, limits, and approval results with reasons. |
| `reason_codes` | Stable reasons supporting the decision. |
| `checked_at` | Local decision timestamp. |
| `signature_metadata` | Explicit non-cryptographic `local_demo_placeholder` metadata. |

`settlement_allowed` means the local artifact says the trust gate would allow settlement in the demo. It does not execute settlement, move money, call a service, or authorize a production transaction. `settlement_executed` remains false.

This is a local demo receipt schema, not a production response contract or signed legal record.
