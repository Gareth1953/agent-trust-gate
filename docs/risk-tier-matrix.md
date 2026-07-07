# Risk Tier Matrix

| Risk Tier | Example Action | Required Checks | Possible Verdict | Settlement Allowed | Notes |
| --- | --- | --- | --- | --- | --- |
| Low | Read-only summary; low-risk internal classification; safe local update check; non-customer-impacting draft | Mandate, fresh evidence, verified intent, limits | `allow_signed_gate_pass` or refusal | True only for local allow artifact | Fast path only after every check passes. |
| Medium | Customer-facing draft; supplier comparison; workflow recommendation; non-binding purchase recommendation | All base checks plus review/approval | `review_required`, approved allow, or refusal | False until approved allow | Gated when uncertainty exists. |
| High | Money movement; purchase authorization; contract commitment; legal/compliance-impacting action; customer-impacting external communication | All checks and explicit approval | `review_required`, approved allow, or refusal | False without explicit approval | No signed gate pass without approval. |
| Prohibited / unsafe | No mandate; stale evidence; missing verified intent; over limit; unsupported unsafe request; restricted authentication-material handling; autonomous payment execution | Fail-closed safety checks | refusal verdict | False | Refusal receipt; speed never overrides trust. |

**Fast when safe. Gated when uncertain. Stopped when unsafe.**

The matrix is local demo policy, not permission to execute an action or settlement.
