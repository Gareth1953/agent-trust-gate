# Executive Decision Brief: Supplier Bank-Detail Change

**Decision audience:** CISO, finance-controls leader, procurement transformation leader, IAM leader and enterprise architect.<br>
**Status:** Local, synthetic, non-production evaluation material.

## The expensive problem

A supplier bank-detail amendment is a small master-data action with potentially large downstream consequences. The costly failure is not only a malicious request. It can also be an agent acting under the wrong principal, an expired delegation, a valid employee approving outside their role, self-verification, missing second approval, stale evidence, a change after approval or an unsupported claim that an ERP update occurred.

Authentication can establish which account or fixture identity participated. It does not by itself answer: Who is accountable for this agent? What was delegated? Was the human currently authorised for this supplier category and risk tier? Did independent verification occur? Did two independent people approve the same canonical action? Is the approval fresh and unused? Does the action presented now match exactly?

## What ATG tests

ATG locally evaluates one synthetic control chain: agent identity, accountable principal, scoped delegation, Agent Standing, exact supplier master-data proposal, approved independent-verification evidence, current human authority, separation of duties, dual approval, freshness, replay state and exact-action digest. The output is either a one-use GatePass for that exact proposal or a refusal with a stable reason code and comparison evidence.

The stages remain distinct: identity verification; authority verification; business-policy evaluation; GatePass decision; and separate execution evidence. Local cryptographic fixtures support integrity, binding and signer-related evidence in the configured model. They do not establish truth, legality, correct bank information, absence of fraud, competence, compliance, payment validity or general agent safety.

## One valid example

The fictional Procurement Change Agent 12, accountable to a fictional Procurement Operations Department, proposes changing `SUP-10482`, Northbridge Office Systems Ltd, from an account ending `1846` to one ending `7319`. The agent’s identity, principal, supplier-maintenance delegation and Agent Standing verify. Approved independent-verification evidence is current. Two different active humans hold the required supplier-master-data authority and approve the same canonical digest. The approval remains inside 30 minutes and the nonce is unused.

Result: the local model issues a one-use GatePass, signed by a deterministic non-secret local fixture key, and scopes it only to that exact supplier master-data change. The signature supports integrity and fixture-key binding, not truth or production identity. The GatePass does not authorise payment, settlement, invoice approval, contract acceptance, supplier creation, broader ERP access or another change. A separate simulated receipt can illustrate execution evidence, while `externalActionPerformed` remains `false`.

## Three strong refusals

1. **Changed account details — `ACCOUNT_DETAILS_CHANGED`.** Human approvals bind to ending `7319`; the presented action uses ending `8842`. The approved and proposed digests differ. No GatePass is issued and no external action occurs.
2. **Missing independent verification — `INDEPENDENT_VERIFICATION_MISSING`.** A supplier request exists, but no evidence from an approved independent route exists. The policy refuses before GatePass issuance. No external action occurs.
3. **Commercial authority confusion — `COMMERCIAL_AUTHORITY_CONFUSION`.** Approval to amend supplier master data is presented as authority to initiate payment. The permission does not cross that boundary. No payment is made and no external action occurs.

The suite also covers changed supplier, self-verification, wrong role, authority-limit breach, missing dual approval, expired approval, replay, general digest mismatch, unverifiable Agent Standing, out-of-scope delegation, unsupported execution claim and revoked human authority.

## What ATG does not currently do

This pack does not connect to identity infrastructure, a supplier-verification service, an ERP, a bank or a payment system. It does not validate bank details, process real data, write master data, execute payments, provide production controls, give legal advice, certify compliance or security, or guarantee prevention of fraud. It is not a complete enterprise AI-transformation platform.

Existing IAM, PAM, ERP workflow and monitoring controls may already be sufficient for an organisation’s workflow. The assessment tests whether a complementary exact-action evidence layer adds material value; it does not presume replacement.

## Proposed commercial next step

Run an **ATG Consequential-Action Workflow Governance Assessment** for one fictional or sanitised consequential workflow. The estimated engagement is 2–4 weeks at **£5,000–£10,000 plus VAT where applicable**. **ESTIMATED AND NOT YET MARKET-VALIDATED.** It maps the current control and evidence chain, defines the exact action, tests synthetic refusals and identifies integration gaps before any pilot recommendation.

**Primary call to action:** “Request a scoped workflow-governance assessment.”

Send only a fictional or sanitised outline of one consequential action, its current approvals and the system it would affect. Do not send credentials, bank details, personal data, supplier records or customer information.
