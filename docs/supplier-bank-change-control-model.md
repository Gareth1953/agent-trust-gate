# Supplier Bank-Change Control Model

## Purpose and boundary

This document defines a deterministic fictional workflow for evaluating a supplier payment bank-detail amendment before an ERP or payment-master-data update. It is a local model: no company directory, supplier-verification service, ERP, bank or payment system is connected; no real data is accepted; no external action is performed.

The model distinguishes identity verification, authority verification, business-policy evaluation, GatePass decision and execution evidence. Cryptographic fixtures support local integrity, binding and signer-related evidence only. They do not prove truth, honesty, legality, fraud absence, bank-detail correctness, competence, compliance, payment validity or general agent safety.

## Fictional workflow and actors

| Actor or object | Fictional fixture role |
| --- | --- |
| Procurement Change Agent 12 | Requests one supplier bank-detail amendment |
| Procurement Operations Department | Accountable principal for the requesting agent |
| Independent Supplier Verification Analyst | Records approved verification evidence through a route separate from the request |
| Supplier Master Data Manager | First authorised human approver |
| Finance Controls Manager | Second authorised human approver for the configured risk tier |
| ATG local evaluator | Applies deterministic fixture policy and creates a GatePass or refusal |
| Simulated ERP adapter | Creates only a local execution-evidence fixture; never connects externally |

The supplier is fictional `Northbridge Office Systems Ltd`, reference `SUP-10482`. The current account ends `1846`; the proposed account ends `7319`. Four-digit endings are labels only and are not bank-account validation data.

## Principal, delegation and Agent Standing

The accountable principal is the fictional Procurement Operations Department. Its delegation identifies the subject agent, principal, permitted action `supplier_bank_detail_change`, permitted resource `supplier_payment_master`, supplier category, risk tier, validity period, revocation state and exact request binding.

Agent Standing requires verifiable fixture identity evidence, principal evidence and an active delegation whose scope covers the proposed action. A delegation that permits supplier-record review but not bank-detail change is refused. Standing is a precondition to policy evaluation, not proof that an agent is generally safe or that its claims are true.

## Independent verification

The configured policy requires evidence that the supplier-requested change was checked through an approved fictional route independent of the requester. The evidence binds the supplier reference, proposed four-digit account ending, verifier identity, method identifier, evidence timestamp and expiry.

The requester cannot verify its own request. The model tests only whether the configured local fixture evidence meets policy; it does not contact a supplier or establish that bank information is correct.

## Human authority, separation of duties and dual approval

Two distinct active human fixture identities must approve the same exact-action digest:

- a Supplier Master Data Manager with authority for the supplier category and risk tier; and
- a Finance Controls Manager with the configured second-approval authority.

Neither approver may be the requester or independent verifier. Both authorities must be current at decision time. A known identity with the wrong role, exceeded risk-tier limit or revoked authority is refused. Authentication is evidence of identity participation, not business authority by itself.

## Canonical action fields

The exact-action digest binds all of these fields:

| Field | Reference value or rule |
| --- | --- |
| action version | `atg.supplier-bank-change.action.v1` |
| action type | `supplier_bank_detail_change` |
| supplier name | `Northbridge Office Systems Ltd` |
| supplier reference | `SUP-10482` |
| current account ending | `1846` |
| proposed account ending | `7319` |
| change type | `supplier_payment_bank_detail_amendment` |
| reason | `Supplier-requested banking update` |
| destination | `fictional_erp_supplier_payment_master` |
| requested by | `procurement-change-agent-12` |
| accountable principal | `fictional-procurement-operations-department` |
| supplier category | configured fictional category |
| risk tier | configured fictional tier |

Canonical JSON key ordering and SHA-256 produce the local digest. Any field or character change creates a different digest. A digest proves integrity and binding of the represented bytes, not factual correctness of those fields.

## Freshness, expiry, nonce and replay

The reference decision time is deterministic. Independent-verification evidence and both exact approvals must be valid then. Approval validity may not exceed 30 minutes. A GatePass carries one nonce and one-use semantics. A consumed nonce refuses replay; local in-memory or fixture state is not a production replay store and does not provide distributed atomicity.

## Decision and refusal contract

A successful evaluation issues a GatePass scoped to exactly one supplier master-data amendment and records:

- GatePass identifier;
- exact-action digest;
- supplier reference and four-digit account-ending transition;
- requesting agent and accountable principal;
- policy and evidence references;
- two approval references;
- issued-at and expires-at times;
- nonce and one-use state;
- deterministic Ed25519 local-fixture signature evidence;
- `externalActionPerformed: false`.

Every refusal contains a human-readable reason, stable machine-readable reason code, failed control, exact-action digest or comparison, and an explicit statement that no external action occurred.

## GatePass scope exclusions

The GatePass does not authorise payment, invoice approval, contract acceptance, supplier creation, broad ERP access, an unrelated account change, a future change, repeated use or settlement. Treating master-data approval as commercial payment authority results in `COMMERCIAL_AUTHORITY_CONFUSION`.

## Decision receipt and execution-receipt separation

The GatePass and decision receipt answer whether the proposal passed the configured pre-action controls. The deterministic local-fixture signature supports integrity, binding and fixture-key signer evidence; it is not production key custody and does not make underlying assertions true. A signed GatePass does not prove that an ERP update occurred. A distinct simulated execution receipt may reference the GatePass, action digest, nonce and a local simulated acknowledgement. It always states that no external action occurred.

If someone claims execution without that separate evidence, the model returns `EXECUTION_RECEIPT_MISSING`; the GatePass may remain valid evidence of a prior decision, but the execution claim is not accepted.

## Audit evidence

The local audit record includes the proposed and approved canonical actions; both digests; agent, principal and delegation results; standing outcome; verification evidence; human identities, roles and current authority states; separation-of-duties and dual-approval results; decision timestamp; expiry; nonce state; GatePass or refusal; and separate execution-evidence status.

## Limitations

This is synthetic evaluation logic, not production control or an integration design. It does not authenticate real identities, confirm a supplier request, validate account ownership, assess fraud, apply a real organisation’s authority matrix, handle credentials, write to an ERP, make a payment, guarantee compliance, or provide operational security assurance. A production design would require organisation-specific policy ownership, trustworthy identity and verification sources, protected keys, durable replay state, availability design, privacy controls, integration security, monitoring, reconciliation and independent assurance.
