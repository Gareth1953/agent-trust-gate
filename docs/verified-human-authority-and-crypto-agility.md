# P3-M152A — Verified Human Authority and Crypto-Agile Proof

**Status:** Approved roadmap and documentation mission. Implementation remains pending.

## Purpose

P3-M152A makes the human-in-the-loop requirement independently verifiable for consequential AI-agent actions.

A human approval record alone is insufficient. The intended future evidence chain must show that an identifiable natural person authenticated through an organisation-approved mechanism, was active in the organisation's authoritative identity source, and held current authority for the exact action type, value, account, department, jurisdiction and risk tier.

## Core rule

> No verified identity.  
> No confirmed authority.  
> No exact-action Human Authority Proof.  
> No valid GatePass.  
> No action.

## Proposed trust chain

```text
organisation mandate
  -> agent and delegation identity
  -> exact proposed action
  -> policy and evidence evaluation
  -> natural-person authentication result
  -> organisation authority check
  -> separation-of-duties / co-approval check
  -> Human Authority Proof
  -> one-use GatePass
  -> execution receipt
  -> linked return / refund / exchange / credit-note / repayment evidence
```

The human must review a verifier-rendered canonical action, not an agent-written summary. Any change to the amount, recipient, destination, account, product, order, invoice, reason, scope or other action-defining field invalidates the approval.

## Business-action coverage

The proposed pattern applies to synthetic local examples for:

- returns and return acceptance;
- refunds and repayments;
- exchanges and price adjustments;
- credit notes;
- cancellations;
- write-offs;
- reversals and corrections;
- consequential procurement, purchasing and settlement-style actions.

Each later remedial action must create fresh authority evidence and remain linked to the original transaction.

## Identity, authentication and authority

The future verifier should distinguish:

1. **Identity:** which natural person is represented?
2. **Authentication:** did that person use an organisation-approved registered credential?
3. **Active status:** does the authoritative organisation source confirm that the identity is current and not suspended or revoked?
4. **Business authority:** may that person approve this exact category, value, account, jurisdiction and risk tier?
5. **Separation of duties:** is the approver independent from the requester where policy requires it?
6. **Co-approval:** is a second independently authorised human required?

A company-issued password, PIN or one-time code may be part of an organisation-controlled authentication policy, but ATG must never store the secret, expose it in a receipt, accept a reusable enterprise password in the public demonstrator, or treat knowledge of a password alone as proof of authority.

## Proposed Human Authority Proof

A future Human Authority Proof may include:

- proof ID and version;
- organisation and controlled natural-person identifiers;
- identity-provider and authoritative-directory references;
- active, suspended or revoked status result;
- role and relevant authority attributes;
- authentication and assurance metadata;
- user-presence and user-verification result;
- authority-policy ID and version;
- canonical exact-action digest;
- action type, value, currency, account and jurisdiction;
- original order, transaction or invoice reference;
- separation-of-duties and co-approval results;
- decision and reason code;
- issued-at, expiry, nonce and replay state;
- signature suite, digest algorithm and key IDs;
- revocation-check result;
- linked GatePass and execution-receipt IDs;
- linked return, refund, exchange, repayment, reversal or credit-note IDs;
- archival re-sealing history.

## Crypto-agility and post-quantum readiness

Current WebAuthn and passkey deployments must not be described as automatically quantum-safe.

ATG should remain crypto-agile:

- algorithm, digest, key and policy identifiers are explicit;
- verification suites are replaceable;
- classical human-authentication evidence and organisation-authority evidence can bind to the same canonical action digest;
- future hybrid or dual evidence can be represented;
- key rotation, revocation and algorithm deprecation remain visible;
- archived evidence can be re-sealed without deleting or rewriting the original record.

NIST-standard ML-DSA or SLH-DSA may be named as candidate future evidence-signature suites when mature and independently validated support is available. Their mention is architectural planning only.

## Current claims boundary

This roadmap update does not add or claim:

- live HR, IAM, SSO or enterprise-directory integration;
- real WebAuthn ceremonies;
- production identity proofing or authentication;
- production authorisation enforcement;
- biometrics;
- production cryptographic key custody;
- implemented production ML-DSA or SLH-DSA;
- quantum safety;
- regulatory certification or endorsement;
- real returns, refunds, exchanges, credit notes, repayments, payments or settlement.

The repository remains a local-only reference demonstrator using synthetic data and no production secrets.