# Refusal Condition Matrix

| Condition | Verdict | Receipt Type | Settlement Allowed | Human Review Needed | Reason Code |
| --- | --- | --- | --- | --- | --- |
| Valid low-risk request | `allow_signed_gate_pass` | `signed_gate_pass` | true, local artifact only | No | `MANDATE_VALID` and pass codes |
| Money/high-risk without approval | `review_required` | `review_receipt` | false | Yes | `HUMAN_REVIEW_REQUIRED` |
| Missing mandate | `refuse_no_mandate` | `refusal_receipt` | false | No | `MANDATE_REQUIRED` |
| Missing evidence | `refuse_no_evidence` | `refusal_receipt` | false | No | `EVIDENCE_REQUIRED` |
| Stale evidence | `refuse_stale_evidence` | `refusal_receipt` | false | No | `EVIDENCE_STALE` |
| Missing verified intent | `refuse_no_verified_intent` | `refusal_receipt` | false | No | `VERIFIED_INTENT_REQUIRED` |
| Over limit | `refuse_over_limit` | `refusal_receipt` | false | No | `LIMIT_EXCEEDED` |
| Unsupported unsafe action | refuse before execution | `refusal_receipt` | false | As separately determined | `UNSUPPORTED_UNSAFE_ACTION` |

No signed gate pass means no settlement. This matrix documents local demo behavior and does not execute or authorize actions.
