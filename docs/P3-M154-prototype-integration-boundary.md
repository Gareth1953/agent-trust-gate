# P3-M154 local integration boundary

## Intended pattern

```text
AI AGENT / TOOL
    ↓ proposes one fully specified action
ATG EXACT ACTION GATEWAY
    ↓ supplies a signed, fresh, one-use GatePass or refuses
ERP / PROCUREMENT / PAYMENT / CONTRACT SYSTEM
```

P3-M154 substitutes a local synthetic procurement adapter for the downstream system. No external connector or network action is present.

## In-process API

The primary integration object is `ExactActionTrustGatewayPrototype`:

```ts
const atg = new ExactActionTrustGatewayPrototype();

const evaluation = await atg.evaluateExactAction("allowed");

const execution = await atg.executeWithGatePass(evaluation);

const verification = atg.verifyTrustReceipt(execution.trustReceipt);
```

The boundary has three deliberately small operations:

### `evaluateExactAction(...)`

Input: a known synthetic scenario or a complete scenario input.

Output includes:

- verified or refused Human Authority Proof evidence;
- Agent Standing decision receipt;
- machine-readable mandate and digest;
- research and negotiation evidence with freshness;
- canonical exact-action envelope and existing ATG digest;
- all 20 pre-action checks;
- policy decision receipt;
- a signed one-use GatePass only when every check passes;
- initial human-readable and JSON Trust Receipt.

### `executeWithGatePass(...)`

Input: the evaluation plus an optional action patch, GatePass value or verifier-owned execution time.

The method calls the existing exact-action point-of-execution verifier. Signature, key, action digest, agent/session/run/mandate/tool/target/environment bindings, validity and nonce state are checked before the adapter callback can run. The nonce is consumed as part of successful verification. Mismatch, malformed input, expiry or replay prevents adapter execution.

Output includes the underlying existing ATG `ExecutionReceipt`, the synthetic procurement receipt and an updated complete Trust Receipt.

### `verifyTrustReceipt(...)`

Input: an unknown receipt value.

The verifier checks:

- the local fixture signature and payload digest;
- canonical exact-action digest recomputation;
- decision/GatePass consistency;
- execution/digest and safety consistency;
- agreement between human-readable and machine evidence;
- local synthetic no-network boundaries.

## Local HTTP API

The browser server exposes:

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/health` | Local prototype status and safety flags. |
| `GET` | `/api/scenarios` | Seven buyer scenario definitions. |
| `GET` | `/api/preview?scenario=allowed` | Human, agent, mandate, evidence and proposed-action preview. |
| `POST` | `/api/evaluate` | Run all pre-action checks and issue/refuse. Body: `{ "scenarioId": "allowed" }`. |
| `POST` | `/api/execute` | Verify GatePass and cross the synthetic adapter boundary. Body: `{ "runId": "..." }`. |
| `POST` | `/api/replay` | Re-present the same GatePass to prove consumption/replay refusal. |
| `POST` | `/api/verify-receipt` | Verify the latest run receipt or a supplied receipt object. |

The default server binds only to `127.0.0.1`. `localhost` and `::1` are the only other permitted host values at the exported start boundary. Static assets carry a self-only Content Security Policy, no-store caching, no-sniff and frame-deny headers. JSON bodies are capped at 128 KiB.

The focused server directly reuses:

- `gateway-auth.ts` for optional local API-key authentication;
- `gateway-rate-limits.ts` for process-local limits;
- `gateway-logging.ts` for JSONL audit logs.

Default browser mode requires no API key so a buyer can run one command. Authentication can be enabled programmatically for integration evaluation.

## Exact action fields

The canonical arguments bind organisation, Human Authority Proof reference, mandate ID, agent ID, supplier ID/name, product/category, quantity, total amount, currency, commercial terms reference, action type, jurisdiction, risk tier, timestamp, nonce and policy version. The existing canonical envelope additionally binds issuer/key/profile, session/run, operator, mandate/policy/evidence/approval digests, tool/schema/operation, target, environment, validity and one-shot semantics.

## Production integration points

A future real adapter would replace only the callback after successful point-of-action verification. Before that is appropriate, a customer would need to supply:

- real organisational identity and appointment evidence;
- production authentication/WebAuthn or equivalent assurance;
- governed authority and mandate sources;
- registered agent identity and real key custody;
- customer policy configuration and approval workflows;
- durable, atomic and distributed nonce/idempotency storage;
- a tenant-isolated gateway deployment with production authentication, rate limiting, secrets and monitoring;
- a customer-owned ERP/procurement/payment/contract adapter;
- reconciliation, incident response and operational governance.

No current artifact claims production readiness, certification, guaranteed compliance or legal compliance.
