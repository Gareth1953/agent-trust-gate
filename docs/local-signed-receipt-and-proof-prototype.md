# Local Signed Receipt and Proof Prototype

P3-M117 adds a local-only signed receipt and proof prototype for Agent Trust
Gate™. It demonstrates that a local receipt or local money-gate proof can be
canonically signed, locally verified, and rejected when the payload or
signature metadata is tampered with.

Core rule:

No mandate. No evidence. No verified intent. No signed gate pass. No settlement.

## Purpose

P3-M116 hardened the schema and evidence model for mandate, evidence, verified
intent, risk context, proof metadata, expiry, nonce, issuer/verifier
references, freshness, and replay fields.

P3-M117 adds a local signature prototype on top of that stricter payload shape.
The goal is to give the local proof chain more technical substance without
claiming production cryptography or live enforcement.

## What is signed

The prototype signs the canonical JSON payload for:

- a local trust receipt;
- a local end-to-end money-gate proof.

The signed envelope contains:

- `signedPayloadType`;
- `payload`;
- `signatureMetadata`.

The signature metadata includes:

- `signatureSchemaVersion`;
- `algorithm`;
- `keyId`;
- `issuerReference`;
- `verifierReference`;
- `signedAt`;
- `payloadHash`;
- `signature`;
- `localDemoOnly: true`;
- `productionSigning: false`;
- `paymentAuthorisation: false`;
- `settlementAuthorisation: false`.

## How local verification works

The local verifier:

1. canonicalises the payload;
2. recomputes the SHA-256 payload hash;
3. checks the stored `payloadHash`;
4. verifies the local Ed25519 demo signature;
5. rejects unsupported algorithms, unsupported key IDs, malformed metadata, or
   unsafe authorisation flags.

Verification is local and deterministic. It does not call a network service,
cloud key service, wallet, bank, payment provider, settlement rail, external
agent, or hosted API.

## How tampering is detected

If a signed receipt or proof payload is changed after signing, the recomputed
payload hash no longer matches the stored hash and the signature verification
fails.

The repository includes local examples for both paths:

- `examples/local-signed-trust-receipt-valid.json`;
- `examples/local-signed-trust-receipt-tampered-invalid.json`;
- `examples/local-signed-money-gate-proof-valid.json`;
- `examples/local-signed-money-gate-proof-tampered-invalid.json`.

The tampered examples intentionally keep the original signature metadata while
changing the payload. They must fail local verification.

## Relationship to P3-M116

P3-M116 made the payloads more explicit. P3-M117 signs those local structured
payloads. The signature is only useful because the receipt and proof now carry
clearer local fields for IDs, issuer/verifier references, nonce, expiry,
freshness, replay, evidence, and proof status.

## Relationship to P3-M118

P3-M118 uses this local signed receipt/proof prototype inside the adversarial
evaluation pack. The pack shows tampered signed proof and unsigned/malformed
proof cases being blocked locally while preserving `localDemoOnly: true`,
`productionSigning: false`, `paymentAuthorisation: false`, and
`settlementAuthorisation: false`.

## Why this is not production signing

The prototype uses clearly labelled local demo key material. It is non-secret,
tracked for deterministic local tests, and not suitable for production.

This prototype does not include:

- production key management;
- hardware security modules;
- cloud key management;
- certificate chains;
- trusted timestamping;
- revocation;
- key rotation;
- custody controls;
- audit-grade signing policy;
- independent identity assurance.

It must not be described as production-grade cryptography.

## Why this is not payment authorisation

A locally signed Agent Trust Gate™ receipt or proof does not authorise real
money movement, live payment processing, PayPal API use, Stripe use, checkout,
webhooks, wallet activity, banking activity, or payment rail activity.

The signed metadata explicitly keeps `paymentAuthorisation` false.

## Why this is not settlement authorisation

A locally signed proof does not execute or authorise settlement. It only
demonstrates that the local payload was unchanged since local signing.

The signed metadata explicitly keeps `settlementAuthorisation` false.

## Future production requirements

Future production cryptography would require a separate mission, separate
approval, and a much stronger design covering:

- production key custody;
- signing-policy governance;
- key rotation;
- revocation;
- independent identity verification;
- durable replay storage;
- timestamp authority;
- audit logging;
- threat modelling;
- incident response;
- security review;
- legal and compliance review.

None of that is added by P3-M117.

## Safety boundary

Agent Trust Gate™ remains local-first and `local_demo_only`.

P3-M117 does not add live APIs, live payment processing, PayPal API
integration, Stripe integration, checkout, webhooks, wallet/banking logic,
real settlement execution, production signing, production key management,
secrets, credentials, cloud/network calls, forms, tracking, analytics,
telemetry, hosted calls, external-agent contact, outreach automation, AUC
integration, Agent Contact System integration, or action execution.

Public project contact: `gpmiddleton71@gmail.com`
