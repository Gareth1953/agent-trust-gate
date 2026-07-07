# Local Gate Pass Demo Flow

The local demo proves the Agent Trust Gate™ decision sequence without executing an action.

1. An agent submits an action request.
2. The gate checks the mandate.
3. The gate checks evidence presence and freshness.
4. The gate checks verified intent.
5. The gate checks spend and action limits.
6. The gate checks approval status where required.
7. The gate produces one local proof artifact:
   - `signed_gate_pass`
   - `gated_review_required`
   - `refusal_receipt`

The implementation uses `signature_mode: local_demo_placeholder`. It creates no cryptographic signature and grants no operational access.

**No mandate. No evidence. No verified intent. No signed gate pass. No settlement.**

This is a local proof-of-flow only. It does not execute the action, contact agents, move money, call cloud services, or settle anything.
