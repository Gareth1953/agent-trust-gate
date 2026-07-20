# Exact-Action GatePass and Execution Receipts

P3-M150 adds a safe local reference for binding a GatePass to one exact
consequential action and checking it at the component closest to a simulated
side effect.

> **Permission must be verified at the point of action. Decision does not equal execution.**

> **Allowed does not mean executed.**

Agent Trust Gate™ exists to make digital trust verifiable before action,
observable during execution and accountable afterwards.

Control before action. Evidence during execution. Accountability after the
event.

No mandate. No evidence. No signed GatePass. No settlement.

This implementation is local reference code. It is not a production
enforcement proxy, live gateway, authentication service, key-management
service, payment system, settlement system or distributed transaction system.
Every example uses synthetic data and a local simulated side effect. No real
tool, payment, settlement, email, external communication, API or customer
system is contacted.

## Exact-action binding

`src/exact-action-gatepass.ts` defines
`atg.canonical-action-envelope.v1`. Its digest payload includes:

- envelope and canonicalisation versions plus the SHA-256 algorithm label;
- issuer identity, issuer key ID and verification profile;
- subject agent, native session and native run identifiers;
- operator and mandate identities where applicable;
- mandate, policy, evidence and human-approval references and digests;
- whether human approval is required;
- tool identity, tool schema version and operation name;
- canonical arguments, target, amount and currency;
- operating environment;
- issued-at, not-before and expiry timestamps;
- nonce, idempotency key and one-shot semantics.

Optional identities and approval values are represented explicitly as `null`.
They are never silently omitted from the digest payload. Amount and currency
must either both be present or both be `null`.

The GatePass embeds the complete envelope and action digest. Its local fixture
signature covers the GatePass fields, including the digest, identity bindings,
timestamps and one-use semantics. A permitted GatePass is authority to attempt
verification of that exact action. It is not an execution acknowledgement.

## Canonical digest construction

The canonicalisation format is `atg.canonical-json.v1` and the digest is
formatted as `sha256:<lowercase hexadecimal>`.

- Object keys are sorted recursively.
- Array order is retained.
- Strings, booleans and `null` use JSON representation.
- Finite numbers use JSON number representation; negative zero is normalised
  to zero.
- Undefined values, functions, symbols, big integers, non-finite numbers,
  sparse arrays, accessor properties, non-plain objects and cycles are
  rejected.
- Explicit `null` is distinct from a missing value.

Equivalent supported inputs therefore produce the same digest regardless of
object insertion order. A change to any bound field produces a different
digest. SHA-256 hashing detects changed content; it does not authenticate the
issuer. The separate Ed25519 local fixture signature demonstrates the signing
boundary. The repository provides no production key custody.

## Point-of-action verification

`verifyAndExecuteSimulatedAction` calls
`verifyExactActionAtExecution` synchronously before invoking the supplied local
simulated executor. The verifier:

1. reconstructs and canonicalises the proposed action;
2. recomputes and compares the action digest;
3. checks the GatePass's own envelope digest and local fixture signature;
4. resolves issuer and key ID through a local verification profile;
5. uses a verifier-owned clock for issued-at, not-before and expiry checks;
6. validates agent, session, run, mandate, approval, tool, schema, target and
   environment bindings;
7. resolves nonce state;
8. atomically changes an unused nonce to consumed within the same JavaScript
   process;
9. only then calls the local simulated executor;
10. creates a separate execution receipt from the verification and simulated
    acknowledgement outcome.

The requesting agent's assertion, timestamp or claimed verification result is
not accepted as proof that verification occurred. If the verifier, profile,
nonce store or trusted clock is unavailable, the action fails closed before
the simulated executor is called.

## One-use nonce and replay state

`InMemoryNonceStore` exposes explicit `unused`, `reserved`, `consumed`,
`expired`, `failed` and `abandoned` states. The current path registers an
unused nonce and atomically consumes it in one synchronous same-process state
transition after all verification checks pass. Repeated and concurrently
started local attempts cannot both consume it.

If the simulated executor fails or does not return a complete acknowledgement,
the already-consumed nonce advances to `failed` or `abandoned`. It is not made
reusable because the real outcome would be uncertain in a consequential
system.

This in-memory model does not provide durable persistence or cross-process
atomicity. Process restart loses its state. It is a reference boundary, not a
production replay store.

## Decision receipt and execution receipt

The policy decision receipt records `allowed`, `refused` or `escalated`, the
policy basis, evidence state, approval state and GatePass issuance reference.
Its execution state is always `not_executed`.

The separate execution receipt records one of:

- `executed` — the local simulated side effect returned an acknowledgement;
- `execution_refused`;
- `expired_before_execution`;
- `replay_rejected`;
- `action_mismatch`;
- `verifier_unavailable`;
- `execution_failed`;
- `abandoned_not_acknowledged`.

It references the GatePass ID, action digest, nonce, verifier, verification
timestamp, acknowledgement timestamp where available, stable reason codes,
synthetic simulated-side-effect reference and policy decision receipt.
`executed` in these examples means only that an in-process simulated callback
acknowledged; `externalActionOccurred` remains `false`.

An allowed action that is never presented to the verifier retains its decision
receipt and GatePass but has no execution receipt. An execution failure does
not rewrite the original allowed policy decision. These are separate facts.

## Fail-closed reason codes

The local verifier exposes these stable codes:

- `GATEPASS_INVALID_SIGNATURE`
- `GATEPASS_UNKNOWN_KEY`
- `GATEPASS_KEY_REVOKED`
- `GATEPASS_NOT_YET_VALID`
- `GATEPASS_EXPIRED`
- `GATEPASS_ACTION_DIGEST_MISMATCH`
- `GATEPASS_AGENT_MISMATCH`
- `GATEPASS_SESSION_MISMATCH`
- `GATEPASS_RUN_MISMATCH`
- `GATEPASS_MANDATE_MISMATCH`
- `GATEPASS_TOOL_MISMATCH`
- `GATEPASS_TARGET_MISMATCH`
- `GATEPASS_ENVIRONMENT_MISMATCH`
- `GATEPASS_ALREADY_CONSUMED`
- `GATEPASS_NONCE_UNRESOLVED`
- `GATEPASS_VERIFIER_UNAVAILABLE`
- `GATEPASS_APPROVAL_MISSING`
- `GATEPASS_VERIFICATION_PROFILE_MISMATCH`
- `EXECUTION_NOT_ACKNOWLEDGED`
- `EXECUTION_FAILED`

Every refusal is emitted before the local simulated executor unless
verification succeeded and the later simulated execution or acknowledgement
failed.

## Verification-key status

The non-production key fixture supports `active`, `rotated`, `revoked` and
`unknown`.

- Active keys can issue and verify local fixture GatePasses.
- Rotated keys cannot issue new GatePasses in the reference profile but may
  verify existing GatePasses while explicitly retained for verification.
- Revoked keys fail with `GATEPASS_KEY_REVOKED`.
- Missing or unknown key material fails with `GATEPASS_UNKNOWN_KEY`.

A future system would need authenticated key distribution, protected private
keys, durable rotation metadata, revocation freshness and operational recovery.
None is claimed here.

## Trusted-clock assumptions

Issued-at, not-before and expiry are ISO 8601 UTC timestamps. The local
verification profile permits 30 seconds of clock skew. Tests inject a
deterministic verifier-controlled clock. The proposed action and requesting
agent cannot provide trusted current time. Missing, invalid or throwing clock
implementations are treated as verifier unavailability and fail closed.

A production architecture would need a monitored trusted-time source, defined
skew policy, time rollback detection and an outage procedure.

## Crash and recovery boundary

The important sequence is:

1. GatePass issued and policy decision receipt recorded;
2. point-of-action verification started;
3. nonce atomically consumed in the local process;
4. simulated side effect attempted;
5. simulated execution acknowledged, failed or left unacknowledged;
6. execution receipt issued.

The difficult boundary is between nonce consumption, side-effect attempt and
acknowledgement. This demonstrator does not solve distributed transactions. A
crash after consumption but before receipt issuance leaves an uncertain
outcome that must not be retried blindly.

Credible future options include a durable nonce store, transactional outbox,
idempotent execution endpoint, recovery worker, reconciliation process and
signed execution acknowledgement. Their exact combination depends on the
side-effect system and remains future production architecture.

## Local demonstration

Run:

```powershell
npm run demo:exact-action
npm run demo:exact-action -- --summary-only
npm run demo:exact-action -- --scenario replay_refused
```

The deterministic scenarios cover exact-action execution, replay, changed
amount, changed target, changed tool schema, expiry, revoked key, unknown key,
verifier unavailability and allowed-but-not-executed. No scenario triggers a
real side effect.

## External technical review acknowledgement

These requirements were strengthened following an external technical review
in GitHub Discussion #1. The implementation responds to the substance of that
feedback; mentioning the discussion does not imply endorsement, certification
or approval by the reviewer.
