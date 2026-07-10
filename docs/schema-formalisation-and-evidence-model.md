# Schema Formalisation and Evidence Model Hardening

P3-M116 hardens the local Agent Trust Gate™ schema and evidence model so the
project relies less on trust-by-documentation and more on stricter local
schema/model expectations.

Core rule:

No mandate. No evidence. No verified intent. No signed gate pass. No settlement.

## Purpose

This mission responds to external reviewer feedback that mandate, evidence,
verified intent, risk scoring, proof metadata, expiry, nonce, issuer/verifier
references, IDs, timestamps, and freshness/replay fields need clearer local
structure before the project can make stronger technical claims.

This is schema/model hardening only. It is not production readiness, paid-pilot
readiness, legal review, financial review, compliance review, security
certification, procurement approval, or settlement assurance.

## What was hardened

The local request, local trust receipt, and local money-gate proof schemas now
make the following fields explicit:

- schema version
- request ID
- action ID
- mandate ID
- mandate scope
- evidence ID
- evidence type
- local evidence reference
- evidence hash reference
- verified-intent status
- risk tier
- policy decision
- issuer reference
- verifier reference
- created-at timestamp
- expires-at timestamp
- nonce
- replay/freshness metadata
- proof purpose
- proof status
- local-only status

The TypeScript local models and deterministic examples were updated to carry
matching local metadata through the receipt and money-gate proof path.

## Why mandate, evidence, and verified intent matter

Agent Trust Gate™ treats an action as unsafe unless the local proof chain can
show three separate preconditions:

1. a mandate exists and has a bounded local scope;
2. evidence exists, is fresh, and is tied to a local reference/hash;
3. verified intent has been recorded by a local verifier reference.

These are still local proof fields. They do not prove legal authority, payment
authority, user identity, real-world consent, or production enforceability.

## Evidence structure

The hardened local evidence structure includes:

- `evidence_id`
- `evidence_type`
- `source`
- `local_reference`
- `evidence_hash`
- `verified_at`
- `freshness.checked_at`
- `freshness.expires_at`
- `freshness.max_age_seconds`

The evidence hash is a static local reference field. It is not production cryptographic signing.
It does not prove custody and does not connect to an
external evidence service.

## Freshness and replay fields

The hardened schemas and local models include nonce and freshness metadata:

- `nonce`
- `created_at`
- `expires_at`
- `replay_freshness.nonce`
- `replay_freshness.single_use`
- `replay_freshness.freshness_window_seconds`
- `replay_freshness.replay_protection`

The current replay protection remains process-local and deterministic. It is
not durable production replay protection and does not write persistent replay
state.

## Issuer and verifier references

Issuer and verifier fields are local references only:

- `issuer_ref`
- `verifier_ref`

They are not identity verification, public-key infrastructure, certificate
chains, legal signatures, payment authority, or third-party attestations.

## Proof metadata

Receipt and money-gate proof artifacts now include structured proof metadata:

- `schema_version`
- `proof_purpose`
- `proof_status`
- `issuer_ref`
- `verifier_ref`
- `created_at`
- `expires_at`
- `nonce`
- `local_only`
- `replay_freshness`

This makes the local proof chain easier to inspect and validate before P3-M117.

## What remains local-only

P3-M116 does not add:

- live APIs;
- hosted services;
- network calls;
- cloud calls;
- external-agent contact;
- action execution;
- live payment processing;
- PayPal API integration;
- Stripe integration;
- checkout;
- webhooks;
- wallet or banking logic;
- real settlement execution;
- AUC integration;
- Agent Contact System integration;
- production signing.

## What is not yet cryptographic signing

The current receipt `signature_metadata` still states that signing is a local
demo placeholder with algorithm `none`. The new proof metadata makes fields
stricter and more inspectable, but it does not create production cryptographic
signatures, key management, certificate validation, revocation, or trusted
timestamping.

## Future P3-M117

P3-M117 should prototype local signed receipt/proof behaviour in a constrained,
non-production way. P3-M117 now adds that local signed receipt and proof
prototype: payloads can be canonically signed, locally verified, and rejected
if tampered with. It still avoids production cryptographic signing, payments,
settlement execution, live APIs, cloud/network calls, external-agent contact,
and action execution.

## P3-M118 adversarial evaluation

P3-M118 builds on the hardened schema/evidence fields and the P3-M117 local
signed-proof prototype with a local adversarial evaluation pack. It covers
replay, forged evidence, expired gate pass, scope creep, missing mandate,
tampered signed proof, unsigned proof, stale nonce/freshness, settlement
blocker refusal, and one valid local control case.

P3-M118 remains local-only. It does not add production signing, paid-pilot
readiness, production readiness, live APIs, payment processing, settlement
execution, cloud/network calls, external-agent contact, or action execution.

## P3-M119 simplified developer CLI

P3-M119 adds a simplified developer CLI that makes the local schema-backed
flows easier to run through `gate evaluate`, `receipt verify`, `proof
money-gate`, `proof signed`, `demo adversarial`, and `demo quickstart`.

This is CLI ergonomics only. It does not alter the schema safety boundary or
activate live APIs, production signing, payment processing, settlement
execution, external-agent contact, or action execution.

## Safety boundary

Agent Trust Gate™ remains local-first and `local_demo_only`. The hardened
schemas and models improve local reviewability only. They do not activate a
hosted product, payment rail, settlement rail, agent contact system, outreach
automation, production signing system, or autonomous action runner.

Public project contact: `gpmiddleton71@gmail.com`
