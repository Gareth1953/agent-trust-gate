# P3-M155 Controlled Pilot Integration Guide

## Status and boundary

Agent Trust Gate™ — Exact Action Trust Gateway is a working local pilot-ready prototype. This guide describes a future controlled sandbox pattern; it does not represent a production integration, deployed service, certification or compliance guarantee.

```text
AI AGENT / TOOL
     ↓  exact proposed action + mandate/evidence references
ATG EXACT ACTION TRUST GATEWAY
     ↓  signed exact-action GatePass or structured refusal
ERP / PROCUREMENT / PAYMENT / CONTRACT SYSTEM
```

The current downstream component is a local synthetic procurement adapter. A future pilot component would be a buyer-controlled sandbox adapter. Production is **not included**.

## 1. Evaluate

Conceptual boundary: `evaluateExactAction(scenarioOrInput)`.

The caller supplies one complete proposed action and references to the human authority, mandate, agent standing and evidence. ATG canonicalises the action through the repository's existing exact-action envelope and checks all policy inputs at the point of action.

Output is an allow/refuse decision, 20 structured checks, a primary failure when refused, the canonical digest, policy decision evidence and an initial Trust Receipt. Missing, malformed, stale or unknown state refuses.

## 2. Issue or refuse

When every required check passes, the existing GatePass engine signs a short-lived one-use GatePass bound to the exact digest and nonce. When any check fails, no GatePass is issued. The structured refusal contains:

- `primaryFailure`, code, summary and relevant requested/permitted values;
- all failed checks for audit detail;
- consequential policy, issuance and execution blocks;
- explicit `gatePassIssued: false` and `executionPermitted: false`.

## 3. Execute with GatePass

Conceptual boundary: `executeWithGatePass(evaluation, options)`.

Immediately before a sandbox side effect, the adapter reconstructs the action and verifies signature, key state, exact digest, agent/session/tool/target/amount/currency bindings, validity time and process-local nonce state. A mismatch, missing or malformed GatePass, expiry, invalid signature, unresolved nonce or replay blocks. Only an exact valid GatePass reaches the callback that records the synthetic purchase reference.

The prototype server exposes no direct route to the synthetic adapter. `/api/execute` requires a server-held evaluated run and still invokes GatePass verification.

## 4. Verify receipt

Conceptual boundary: `verifyTrustReceipt(receipt)`.

The verifier recomputes the signed payload digest, verifies the deterministic local fixture signature, recomputes the exact-action digest, checks GatePass/decision consistency, checks execution and safety flags, and compares both executive and human-readable layers with the machine evidence. Malformed or changed receipts fail verification.

## Pilot adapter contract

A separately scoped buyer sandbox adapter should accept only a verified GatePass plus the exact canonical action it binds. It should return a sandbox acknowledgement/reference, never infer missing values, never accept a general agent token as purchase authority, and expose no bypass endpoint. Nonce consumption should be atomic in the pilot's chosen trust boundary.

## Buyer-controlled inputs

- pseudonymous test humans, roles and authority limits;
- synthetic or sanitised agents and standing/delegation fixtures;
- permitted action, supplier/category, amount, quantity, currency, jurisdiction and risk rules;
- evidence freshness and mandatory-reference rules;
- sandbox action schema and acknowledgement schema;
- failure escalation and audit retention requirements.

## Buyer-visible outputs

- allow/refuse and primary-failure evidence;
- signed exact-action GatePass where allowed;
- execution block or sandbox acknowledgement;
- signed machine-readable Trust Receipt;
- executive and full-detail human-readable receipt;
- test observations against agreed acceptance criteria.

## Controls required before any broader use

Production-grade identity federation, WebAuthn or equivalent authentication, authoritative HR/role sources, hardened key custody, persistent atomic replay protection, tenant isolation, operational monitoring, incident handling, privacy assessment, availability design, adapter authentication, independent security review and legal/compliance assessment are outside this prototype and would require separate engineering and buyer governance.
