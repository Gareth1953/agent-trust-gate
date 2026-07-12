# Adversarial Evaluation Pack

P3-M118 adds a local-only adversarial evaluation pack for Agent Trust Gate™.
It exercises common trust-gate failure and attack scenarios against the local
receipt, gate-pass protection, signed-proof, freshness, and settlement-blocker
logic.

Core rule:

No mandate. No evidence. No verified intent. No signed gate pass. No settlement.

## Purpose

The purpose is to show deterministic fail-closed behaviour for realistic local
attack cases, not only happy-path proof examples. The pack records why each
attack is blocked and why the one valid control case is allowed locally.

This is local adversarial testing only. It does not add live integrations,
third-party payment integrations, real settlement, production signing,
production key management, external-agent contact, outreach automation, hosted
calls, or action execution.

## Relationship to P3-M116 and P3-M117

P3-M116 hardened local request, receipt, and money-gate proof schemas around
mandate, evidence, verified intent, proof metadata, expiry, nonce,
issuer/verifier references, freshness, and replay fields.

P3-M117 added a local signed receipt/proof prototype with canonical payload
hashing and local signature verification. It detects payload tampering and
unsafe signature metadata while keeping `localDemoOnly: true`,
`productionSigning: false`, `paymentAuthorisation: false`, and
`settlementAuthorisation: false`.

P3-M118 combines those pieces into adversarial cases that demonstrate local
blocking decisions for replay, forged evidence, expired passes, scope creep,
missing mandate, tampered proof, unsigned proof, stale nonce/freshness, and
settlement blocker refusal.

## Threat Cases Covered

| Case | Local result |
| --- | --- |
| Replay attempt | Blocked after the local replay store sees the pass consumed once. |
| Forged evidence | Blocked when the observed local evidence digest does not match the expected digest. |
| Expired gate pass | Blocked at the gate-pass expiry boundary. |
| Scope creep | Blocked when the attempted action no longer matches the signed scope. |
| Missing mandate | Blocked as a refusal receipt with mandate failure reason codes. |
| Tampered signed proof | Blocked when payload hash and local signature verification fail. |
| Unsigned or malformed proof | Blocked when no valid signed-proof envelope is present. |
| Stale nonce/freshness | Blocked after the local freshness window expires. |
| Settlement blocker refusal | Recorded as blocked by the local settlement blocker. |
| Valid control | Allowed locally once, with no payment or settlement authorisation. |

## How To Run

Build and run the full pack:

```powershell
npm run demo:adversarial
```

Run the compiled CLI directly after a build:

```powershell
node dist/src/local-adversarial-evaluation-cli.js --pretty
```

Run a summary:

```powershell
node dist/src/local-adversarial-evaluation-cli.js --summary-only
```

Run one scenario:

```powershell
node dist/src/local-adversarial-evaluation-cli.js --scenario replay_attempt --pretty
```

## What Each Blocked Case Means

Replay attempt blocked means a gate pass that was already consumed in the
process-local replay store cannot be reused for another local settlement
simulation.

Forged evidence blocked means the adversarial evaluator treats a local evidence
digest mismatch as fatal even when the surrounding receipt shape is otherwise
valid.

Expired gate pass blocked means an otherwise valid gate pass is not accepted
when evaluated at or after its expiry time.

Scope creep blocked means a pass tied to one requested action cannot be reused
for a wider or different attempted action.

Missing mandate blocked means no local signed gate pass is produced when the
mandate check fails.

Tampered signed proof blocked means changing a signed proof payload after local
signing breaks the stored payload hash and local signature verification.

Unsigned or malformed proof blocked means a proof payload without the expected
local signed-proof envelope is rejected.

Stale nonce/freshness blocked means the local proof nonce is outside the
configured freshness window.

Settlement blocker refusal recorded means a refusal receipt stays blocked when
presented to the local settlement blocker.

## Valid Control Case

The valid control has a current mandate, fresh local evidence, verified intent,
explicit approval, matching scope, a valid local signed trust receipt, and a
fresh single-use gate pass. It is allowed locally once.

The result still preserves:

- `localDemoOnly: true`
- `productionSigning: false`
- `paymentAuthorisation: false`
- `settlementAuthorisation: false`
- `paymentTriggered: false`
- `settlementExecuted: false`
- `actionExecuted: false`

## Why This Is Local-Only

The pack uses deterministic local fixtures and process-local replay state. It
does not call external services, contact agents, write durable replay state,
move money, execute settlement, or execute actions.

The JSON examples under `examples/adversarial-*.json` are static local
artifacts for review and tests.

## Why This Is Not Production Security Certification

P3-M118 is not production security certification, a security audit, legal
proof, financial proof, compliance proof, procurement approval, paid-pilot
readiness, production readiness, or settlement assurance.

It is a focused local test pack showing that these specific scenarios are
detected and blocked by local demo logic.

## Why This Is Not Payment Or Settlement Authorisation

The valid control case is allowed only as a local simulation. It is not payment
or settlement authorisation. The signed metadata and scenario-level flags keep
`paymentAuthorisation` and `settlementAuthorisation` false.

No real payment, real settlement, payment-provider integration, banking logic,
or action execution is added by this pack.

## Future Hardening Areas

Future missions could strengthen:

- durable replay storage;
- stronger evidence custody and provenance checks;
- independent verifier identity;
- production-grade key custody if separately approved;
- broader malformed receipt fuzzing;
- cross-process nonce replay testing;
- threat model documentation;
- static analysis and coverage reporting;
- reference integration examples that remain local-only.

## Relationship To P3-M119

P3-M119 adds the simplified developer CLI that makes this adversarial pack
easier to run through `npm run cli -- demo adversarial` and the quickstart path
`npm run cli -- demo quickstart`. It is developer experience only and does not
change the local-only safety boundary.

## Relationship To P3-M120

P3-M120 adds local reference integration examples that show where adversarially
hardened trust-gate checks can sit in agent loops, tool-call guards,
human-review queues, pre-settlement workflows, governance review, handoff
patterns, and a small developer wrapper. They remain local-only and are not
official framework integrations.

## Relationship To P3-M121

P3-M121 treats this adversarial pack as one reason paid technical review is now
reasonable to discuss. The pack is still local adversarial testing only. It is
not production security certification, live enforcement, payment
authorisation, settlement authorisation, or a security assurance claim.

## Safety Boundary

Agent Trust Gate™ remains local-first and `local_demo_only`.

P3-M118 does not add live APIs, live payment processing, real settlement
execution, production signing, production key management, secrets, credentials,
cloud/network calls, forms, tracking, analytics, telemetry, hosted calls,
external-agent contact, outreach automation, AUC integration, Agent Contact
System integration, or action execution.

Public project contact: `gpmiddleton71@gmail.com`
