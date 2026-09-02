# P3-M156 Controlled Buyer Pilot Intake Checklist

## How to use this checklist

Use this before accepting a workflow into an ATG controlled pilot. Record `Yes`, `No`, `Not applicable` and an accountable owner/evidence reference for every item. A required `No` is a hold unless the item explicitly permits later completion. Do not place buyer secrets or personal data in this document.

## 1. Business fit

- [ ] A named buyer sponsor owns the pilot question and findings.
- [ ] The buyer can describe one genuine high-impact agent workflow in plain language.
- [ ] The workflow has a clear proposed-action point before an irreversible or consequential action.
- [ ] The buyer can explain what existing controls do and what exact-action gap it wants to test.
- [ ] The pilot can demonstrate value without a live order, payment, refund, contract or customer effect.
- [ ] The buyer accepts that a pilot finding is not commercial validation, production approval or certification.

## 2. Bounded action

- [ ] One action class is in scope.
- [ ] The exact action has a stable action ID and machine-readable schema.
- [ ] Execution-critical fields are enumerated, including target/supplier, product/category, quantity, amount, currency, jurisdiction, risk, terms, timestamp, nonce and policy where applicable.
- [ ] Allowed and refused boundaries can be expressed deterministically.
- [ ] The action can be represented with synthetic or safely minimised data.
- [ ] Material scope changes will trigger a new intake and approval.

## 3. Human authority

- [ ] The buyer owns an authoritative test source for human identity and employment/appointment state.
- [ ] Role, action authority, department/account, amount, jurisdiction, risk tier and expiry can be represented.
- [ ] The buyer names the owner accountable for authority accuracy and updates.
- [ ] Wrong, missing, unknown and expired authority examples can be provided synthetically.
- [ ] No real identity-provider credential or production WebAuthn credential is required.

## 4. Agent standing

- [ ] The buyer can identify the test agent and accountable principal.
- [ ] Capability scope, delegation, key/reference, status, revocation and validity can be represented.
- [ ] The buyer owns the authoritative truth for agent approval and revocation.
- [ ] Active, revoked and unknown agent examples can be tested.

## 5. Mandate, policy and evidence

- [ ] The mandate binds human, organisation, agent, objective, action class, target/category, amount/quantity, currency, jurisdiction, risk and validity as applicable.
- [ ] Each policy has a stable version reference and an accountable buyer owner.
- [ ] Mandatory evidence and freshness windows are defined.
- [ ] Conflicts between buyer policy and pilot rules have an agreed escalation path.
- [ ] Missing, stale and malformed evidence cases are included.

## 6. Data and privacy

- [ ] Synthetic data is sufficient by default.
- [ ] Any proposed non-synthetic field has documented necessity, approval, minimisation, lawful handling and owner.
- [ ] No payment credential, bank detail, API key, production token, reusable shared password or customer secret will be supplied.
- [ ] Data locations, access, retention period and deletion method are agreed.
- [ ] Logs and receipts have an agreed classification and redaction rule.
- [ ] The buyer accepts that the repository is not a managed production data service.

## 7. Environment and execution boundary

- [ ] The default is local evaluation-and-evidence only.
- [ ] No production API, live buyer endpoint or external procurement/payment system is connected.
- [ ] The buyer remains the sole owner of any downstream execution system.
- [ ] If a sandbox handoff is proposed, it is non-production, buyer-controlled and separately scoped.
- [ ] The sandbox, if any, has no real money, customer or production side effect.
- [ ] There is no bypass endpoint that can treat an ATG PASS as an unverified execution command.
- [ ] Local process reset and in-memory replay limitations are understood.

## 8. Security and operations

- [ ] Missing, malformed, stale and unknown state must fail closed.
- [ ] Exact-action alteration, signature, expiry, nonce and replay cases are in the test plan.
- [ ] Production key custody, distributed replay storage, tenant isolation and high availability are explicitly out of current scope.
- [ ] Test commands, environment version and evidence collection are reproducible.
- [ ] A named person can stop the pilot and protect buyer systems/data.
- [ ] An incident/finding review and restart process is agreed.

## 9. Success, abort and review

- [ ] Functional, evidence, operational and commercial success criteria are agreed.
- [ ] Latency measurement method is agreed; no unsupported target is assumed.
- [ ] Abort conditions from the [test plan](P3-M156-pilot-test-plan.md) are accepted.
- [ ] Reviewers include appropriate business, AI/technology, security and control roles.
- [ ] The buyer will review both the executive Trust Receipt and full machine evidence.
- [ ] The final readout may conclude `stop`; continuation is not presumed.

## Suitability decision

| Decision | Meaning |
|---|---|
| `SUITABLE FOR CONTROLLED LOCAL PILOT` | Every safety-critical item is Yes; remaining items have bounded owners and due dates |
| `CONDITIONAL / HOLD` | A resolvable mapping, ownership, evidence or governance gap remains; no testing begins |
| `NOT SUITABLE` | Value requires production data/credentials, live effects, ambiguous authority, an unbounded workflow or unsupported assurance |

**Proposed decision:** ____________________

**Buyer accountable owner:** ____________________

**ATG pilot owner:** ____________________

**Scope identifier/version:** ____________________

**Decision date:** ____________________

**Open conditions and owners (no sensitive data):**

____________________________________________________________________

## Automatic rejection / stop triggers

Do not accept or continue the workflow if it requires production credentials, live payment or ordering, uncontrolled autonomous execution, real customer data without a separate lawful approval, an authority source with no accountable owner, removal of a fail-closed control, or a claim of certification/compliance that the evidence does not support.
