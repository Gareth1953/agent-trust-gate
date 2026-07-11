# Tool-Call Enforcement Scenarios

P3-M132 adds deterministic local tool-call enforcement scenarios.

Do not trust the agent. Trust the gate pass.

No proof. No permission.

No mandate. No action.

No signed gate pass. No settlement.

No mandate. No evidence. No verified intent. No signed gate pass. No settlement.

## Scenarios

- Public post with valid proof allows locally. The mock `publish_public_post`
  call has mandate, evidence, verified intent, fresh nonce, approval, and signed
  proof, so the local decision is `allow`.
- Customer-facing message without approval escalates. The mock
  `send_customer_message` call is intercepted and routed to local review.
- Data export without mandate blocks. The mock `export_data` call fails closed
  because mandate is missing.
- Prepare payment without signed proof requires signed proof. The mock
  `prepare_payment` call is payment-adjacent and cannot proceed without signed
  proof.
- Procurement approval with stale proof blocks. The mock `approve_procurement`
  call has stale freshness and replayed nonce.
- High-risk access/session escalation requires human review. The mock
  `escalate_access_session` call is high risk and lacks required approval.
- Settlement instruction without signed gate pass blocks. The mock
  `create_settlement_instruction` call is settlement-sensitive and has no signed
  gate pass.
- Missing proof requires evidence. A mock `write_file` call without a proof
  package cannot receive permission.
- Valid local control allows locally only. A scoped low-risk mock `write_file`
  call can allow locally while still executing nothing.

Run:

```text
npm run demo:enforceable-tool-gate
```

The scenarios emit local JSON only. They do not execute tools, payments,
settlement, network calls, live contact, browser automation, or action
execution.

Public contact: `gpmiddleton71@gmail.com`.
