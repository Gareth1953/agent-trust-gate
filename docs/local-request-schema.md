# Local Request Schema

The P3-M090 and P3-M092 demo flow reads a local JSON object with these fields:

| Field | Meaning |
| --- | --- |
| `request_id` | Local identifier for the synthetic request. |
| `agent_id` | Placeholder identity for the demo agent. |
| `requested_action` | Plain description of the action being reviewed, not executed. |
| `action_category` | Local category used to interpret risk and approval needs. |
| `mandate` | `present`, `scope`, and `expires_at` values describing local authority. |
| `verified_intent` | `present` and local `source` values for declared intent. |
| `evidence` | `present`, `fresh`, and local `source` values. |
| `limits` | Synthetic `spend_amount_gbp` and `max_allowed_gbp` values used only for comparison. |
| `approval` | Whether approval is required and its local status. |
| `checked_at` | Deterministic demo timestamp used for expiry checks and receipts. |

Nested objects are required by the local CLI. No field grants operational access or permission outside the demo.

This is a local demo schema. It is not a production API contract.
