# Verified Agent Standing

P3-M154 adds a deterministic local Agent Standing gate before normal GatePass evaluation.

> No verified agent identity. No verified principal. No valid delegation. No standing to request a GatePass.

The defensible public claim is:

> ATG locally demonstrates how a requester can prove control of a registered software-agent identity, present signed evidence of its accountable principal and delegated authority, and bind the exact request to that standing before GatePass evaluation begins.

## Why identity is not authority

A software-agent identifier distinguishes one declared requester from another. An account or platform identity can add account-bound evidence, and a key-control challenge can show control of a declared fixture key. Neither fact alone identifies the accountable principal or establishes permission to act for that principal.

Principal delegation is a separate assertion. The delegation must identify its issuer, subject agent, permitted purpose and actions, monetary and resource limits, permitted counterparties where applicable, validity window, revocation reference, delegation depth and exact request digest. ATG checks the evidence and constraints; it does not grant authority merely because a requester writes an assurance label into a proof.

The relevant concepts are distinct:

- **software-agent identity** identifies the declared software requester;
- **account or platform identity** associates the requester with a fixture account but does not itself delegate authority;
- **principal** is the accountable individual or organisation represented by the agent;
- **delegation** is signed, scoped authority from that principal or organisation sponsor;
- **autonomy** describes how independently software operates and is not proved by Agent Standing;
- **exact-action authorisation** is the later GatePass decision for one canonical current request.

Agent Standing is therefore a precondition to GatePass evaluation, not a guarantee that an agent is safe.

## Assurance classifications

The classifications describe ATG-local evidence, not universal trust levels:

| Level | Local meaning |
| --- | --- |
| S0 | Self-declared |
| S1 | Account-bound |
| S2 | Cryptographically identified |
| S3 | Principal delegated |
| S4 | Organisation sponsored |
| S5 | Runtime attested |

S5 is a future, higher-assurance category. This repository does not implement production runtime, hardware or confidential-computing attestation. The deterministic evaluator derives at most S4 from the evidence it actually verifies and refuses a proof that claims S5.

## Local cryptographic chain

The demonstration reuses the existing canonical exact-action envelope and Ed25519 local-fixture proof pattern:

1. The proposed standing request is mapped into the existing canonical action envelope.
2. Its existing SHA-256 exact-action digest is used as the standing request digest.
3. The declared agent fixture key signs a challenge containing the nonce, agent identity, request digest and supplied session/run bindings.
4. The individual principal or organisation sponsor fixture key signs the delegation.
5. The declared agent fixture key signs the complete Agent Standing Proof.
6. The verifier reconstructs the current exact request and verifies all identities, evidence references, signatures, scope, limits, validity, revocation, depth and bindings.
7. Only `STANDING_VERIFIED` makes `gatePassEvaluationMayBegin` true. `STANDING_REFUSED` and `STANDING_UNVERIFIABLE` both fail closed.

The fixture keys are derived deterministically from public fixture labels. They are non-secret, local-demo material and are not production keys. A signature authenticates an assertion and detects changes to signed material; it does not make every assertion factually true.

The closed machine-readable contract is [AgentStandingProof schema](../schemas/agent-standing-proof.schema.json). Monetary limits use integer minor units, so £25.00 is represented as `2500`.

## Deterministic checks

The evaluator checks:

- registered fixture agent identity evidence and the declared public-key reference;
- the signed nonce challenge and complete proof signature;
- principal evidence, plus organisation and accountable-human sponsorship where applicable;
- delegation presence, issuer key, signature, subject agent and principal binding;
- issue time, expiry, active revocation state and revocation evidence;
- permitted purpose, action, integer-minor-unit amount, resource and counterparty limits;
- delegation depth against the signed maximum;
- the current exact-request digest and supplied session/run bindings;
- every required fixture evidence reference;
- Agent Standing before any GatePass evaluation attempt.

Reason codes are fixed, machine-readable strings. Missing evidence is not converted into permission. `STANDING_UNVERIFIABLE` is never an allow result.

## Synthetic scenarios

Run all scenarios or select one:

```bash
npm run demo:agent-standing
npm run demo:agent-standing -- --summary-only
npm run demo:agent-standing -- --scenario valid_organisation_sponsored_agent
npm run demo:agent-standing -- --json
npm run test:agent-standing
```

The twelve fixed scenarios cover self-declaration only, invalid key challenge, key control without delegation, expired and revoked delegation, scope mismatch, a £25.00/£40.00 authority breach, changed request digest, exceeded delegation depth, valid individual sponsorship at S3, valid organisation sponsorship at S4, and verified standing followed by the existing local GatePass evaluator. Expected refusals and the expected unverifiable result count as passes only when the observed outcome matches.

No scenario performs an external action, payment or settlement.

## What the local fixture proves

The demo proves that, for fixed local data, ATG can deterministically:

- distinguish a declared software-agent identity from its account and accountable principal;
- verify possession of the corresponding fixture private key through a signed challenge;
- verify integrity and issuer-key origin of a signed fixture delegation;
- enforce its signed scope, limits, validity, revocation, counterparty and depth constraints;
- detect changed signed material and changed exact requests;
- block GatePass evaluation until Agent Standing verifies.

## Claims boundary

P3-M154 does not:

- prove that software is intelligent or conscious;
- prove that a remote message was composed without human assistance;
- prove complete autonomy;
- verify a real company or individual through live registries;
- provide production organisational identity assurance;
- provide live WebAuthn, SSO, enterprise identity or credential integration;
- provide production runtime or hardware attestation;
- certify an agent as honest, safe or compliant;
- issue legal identity;
- execute actions;
- process payments;
- authorise settlement;
- contact agents;
- operate a hosted identity service.

It also does not prove philosophical “AI-ness,” consciousness, intelligence, honesty or complete autonomy. It does not establish that a remote assertion is true merely because fixture-key integrity verifies.

## Future compatibility

The versioned proof separates identities, evidence references, signature metadata and exact-request bindings so later profiles could map verifiable credentials, enterprise identity providers, organisation directories or standard runtime-attestation evidence into those fields. Those integrations would require their own trust anchors, issuer policy, freshness and revocation rules, privacy controls and production security review. No such live integration is claimed or implemented here.

For the foundations reused by this mission, see the [Prove-Yourself Protocol](agent-trust-invitation-and-prove-yourself-protocol.md), [Agent Proof Package contract](agent-proof-package-schema-and-verification-contract.md), [proof-contract integration readiness](agent-proof-contract-integration-readiness.md), [exact-action GatePass](exact-action-gatepass-and-execution-receipts.md), and [verified Human Authority demonstrator](verified-human-authority-working-demonstrator.md).
