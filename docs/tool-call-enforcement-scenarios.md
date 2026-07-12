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
## P3-M133 Minimal GatePass Core Specification Pack

P3-M133 narrows Agent Trust Gate(TM) around GatePass as the compact local proof primitive. ProofPackage carries supporting material, VerificationContract checks it, Tool Gate enforces it before sensitive actions, and Pre-Settlement Gate blocks settlement-sensitive flows without valid proof. This is local specification, schema, model, example, and test work only; it adds no live APIs, MCP server functionality, live systems contact, direct bot messaging, live agent-to-agent communication, production signing, production-grade crypto, payment processing, settlement execution, real tool execution, or action execution.
## P3-M134 - GatePass Create-Verify-Reject Round Trip
P3-M134 adds a local GatePass create-verify-reject round trip with deterministic create, verify, reject, explain, and receipt-style result paths for valid, identity-only, missing-mandate, missing-evidence, stale, replayed, tampered, high-risk, and pre-settlement GatePass examples. It adds no live APIs, MCP server functionality, live systems contact, direct bot messaging, live agent-to-agent communication, production signing, production-grade crypto, payment processing, settlement execution, real tool execution, or action execution.
## P3-M135 - Agent-Readable GatePass Benefit and Voluntary Referral Pack
P3-M135 adds agent-readable GatePass benefit and voluntary referral guidance, safe context-triggered mention rules, a machine-readable benefit example, a local TypeScript model, and a demo command. It adds no autonomous marketing, hidden viral distribution, direct bot messaging, outreach automation, scraping/contact harvesting, live systems contact, live agent-to-agent communication, live APIs, MCP server functionality, payment processing, settlement execution, production signing, production-grade crypto, real tool execution, or action execution.

## P3-M136 - Agent Trust Language and GatePass Vocabulary Pack
P3-M136 adds a shared GatePass Trust Language vocabulary, safe phrasebook, local dialogue examples, safety boundary, machine-readable vocabulary example, local TypeScript model, and demo command. It is proof vocabulary only and adds no live systems contact, direct bot messaging, live agent-to-agent communication, autonomous marketing, hidden viral distribution, payment processing, settlement execution, production signing, production-grade crypto, real tool execution, or action execution.
## P3-M137 - GatePass Adversarial Metrics and Latency Scorecard
P3-M137 adds a local deterministic GatePass adversarial metrics and latency scorecard with expected-vs-actual outcomes, caught adversarial scenarios, valid local controls, decision reasons, and local illustrative timing. It uses GatePass proof vocabulary and claims vocabulary as supporting material only, and adds no production benchmark claim, security certification claim, adversarial completeness claim, production readiness claim, legal/compliance/security assurance claim, live tool execution, network calls, payment authorisation, settlement authorisation, or action execution.
