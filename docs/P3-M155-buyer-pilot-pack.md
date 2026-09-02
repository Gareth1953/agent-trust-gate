# Agent Trust Gate™ — Exact Action Trust Gateway

## Buyer pilot pack

**Status:** Working local pilot-ready prototype

**Boundary:** Synthetic data and simulated procurement execution only. No real payment or external action.

### 1. What ATG is

Agent Trust Gate™ is a verify-before-action gateway. It evaluates whether one exact proposed AI-agent action is supported by current human authority, a bounded mandate, valid agent standing, fresh evidence and the active policy. Only a complete match can produce a signed, short-lived, one-use GatePass.

> Verify the exact human authority behind the exact AI-agent action before the action is allowed to happen.

### 2. The exact problem ATG solves

An agent's confidence, identity or general permission does not prove that a particular purchase is authorised now. Systems need a point-of-action control that binds the human, organisation, agent, mandate, evidence, supplier, amount and terms to the action that will actually execute.

### 3. What the working prototype proves

The prototype runs the full local software control flow: synthetic human authority verification, machine-readable delegation, agent standing, deterministic procurement work, exact-action canonicalisation, a 20-check policy decision, GatePass issuance or refusal, a simulated downstream boundary, one-use consumption and signed audit evidence.

### 4. Six-stage control flow

1. **Human Authority** — identify Alex Morgan and verify the bounded Northstar purchasing authority fixture.
2. **Mandate** — bind Alex, Northstar Procurement Agent 04 and the permitted purchase scope.
3. **Agent Activity** — compare three synthetic offers and record a deterministic negotiation.
4. **Proposed Action** — canonicalise the exact supplier, product, quantity, amount, terms and context.
5. **ATG Decision** — perform all required checks and issue a one-use GatePass or refuse.
6. **Execution & Audit** — verify again at the synthetic irreversible boundary, consume once, and create a Trust Receipt.

### 5. Allowed example

Alex's verified purchasing authority permits up to £25,000. The agent proposes 200 units of Product X from Harbour Supply Ltd for £23,750 GBP. All 20 checks pass, ATG issues a GatePass bound to the canonical action digest, and the local adapter records a simulated purchase. The GatePass is consumed.

### 6. Refused £31,000 example

The same proposed purchase is changed to £31,000. The receipt identifies `AUTHORITY_LIMIT_EXCEEDED` as the primary cause, displays £31,000 requested against £25,000 authorised, issues no GatePass and permits no execution. Policy refusal and the blocked execution path are shown as consequences, not competing root causes.

### 7. Replay-block example

After the allowed GatePass is consumed, a second presentation returns `BLOCKED_REPLAY`. No second simulated purchase reference is created. The receipt identifies `GATEPASS_REPLAY` and retains the first action's audit chain.

### 8. Human Authority Proof

The local signed fixture links an active synthetic employee, organisation, role, authentication evidence, action authority, department, jurisdiction, supplier/category scope, risk tier, £25,000 limit, validity window and the proposed action. It is not a real identity-provider or WebAuthn credential.

### 9. Agent Standing

The existing standing verifier checks the registered software-agent identity, key-control evidence, accountable principal, signed delegation, revocation state, capability scope and request binding. Unknown, revoked or out-of-scope standing fails closed.

### 10. Exact Action Binding

The existing canonical action envelope covers the organisation, Human Authority Proof reference, mandate, agent, supplier, product/category, quantity, amount, currency, terms, action type, jurisdiction, risk tier, timestamp, nonce and policy version. Changing an execution-critical field changes the digest.

### 11. GatePass

The GatePass is signed with deterministic local fixture keys, bound to one exact digest, expires after a short verifier-controlled interval and has one-shot semantics. Local nonce state enforces freshness and consumption. This prototype does not provide production key custody or a distributed replay store.

### 12. Trust Receipt

Every allow, refusal and execution block creates a signed local Trust Receipt. An executive layer answers who, which agent, what action, how much, why, GatePass state, execution state, time and verification state. Collapsible detail retains all checks, evidence references and machine JSON.

### 13. Integration boundary

```text
AI AGENT / TOOL
        ↓
ATG EXACT ACTION TRUST GATEWAY
        ↓
ERP / PROCUREMENT / PAYMENT / CONTRACT SYSTEM
```

V1 ends at a synthetic procurement adapter. It exposes the conceptual operations `evaluateExactAction(...)`, `executeWithGatePass(...)` and `verifyTrustReceipt(...)`.

### 14. What a controlled buyer pilot would require

A separately agreed pilot would require a buyer-owned sandbox, named accountable owners, approved synthetic or sanitised scenarios, authority-policy mappings, an adapter contract, test identities/agents, audit handling, success criteria, failure escalation and an explicit no-production boundary.

### 15. What data the buyer would provide

Only agreed sandbox data: pseudonymous test human and agent identifiers, role/authority fixtures, bounded mandate fields, permitted suppliers/categories, policy version, test action payloads, evidence freshness rules and sandbox adapter schemas. No production secret, payment credential or live customer record belongs in this V1 repository.

### 16. What ATG would evaluate

ATG would evaluate identity evidence presence, employment/appointment state, exact authority and expiry, agent standing, mandate presence/freshness/scope, supplier/category, quantity, amount, currency, jurisdiction, risk tier, evidence presence/freshness, policy, canonicalisation, digest binding, nonce freshness and replay state.

### 17. What the buyer would receive

The buyer would receive scenario decisions, structured primary-failure codes, human-readable explanations with relevant values, issued or refused GatePass evidence, synthetic execution receipts, signed Trust Receipts, raw JSON and an agreed test-results summary.

### 18. Current limitations

The prototype uses fixed synthetic fixtures, deterministic local keys, a verifier-controlled clock, process-local nonce memory and a synthetic adapter. It has no live directory, identity provider, production WebAuthn, external procurement API, distributed storage, HSM/KMS, real order, payment, settlement or production operational controls.

### 19. Pilot safety boundaries

Run only on loopback. Use synthetic or properly sanitised information. Do not provide credentials, tokens, bank details or personal/customer records. Keep all downstream effects in a buyer-controlled sandbox. Require human approval for scope changes. Treat any missing, malformed, stale or unknown state as refusal.

### 20. Claims boundary

This is a **working local pilot-ready prototype**, not production software. It demonstrates control behaviour; it does not claim regulatory certification, guaranteed legal compliance, security certification, bank-grade deployment, guaranteed security, production readiness or real payment processing.
