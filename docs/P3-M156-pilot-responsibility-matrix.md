# P3-M156 Controlled Pilot Responsibility Matrix

## Control principle

**The buyer authorises people and agents and remains the only owner of any downstream execution decision and system. ATG evaluates the evidence presented for one exact action; an ATG PASS or GatePass is not a substitute for the buyer's corporate approval, legal authority or execution controls.**

The default pilot is evaluation-and-evidence only. No buyer execution system is connected. The existing ATG local adapter is a synthetic demonstration and is not a buyer system.

## Responsibility matrix

| Activity or truth source | Buyer responsibility | ATG responsibility | Shared responsibility |
|---|---|---|---|
| Pilot scope and accountable sponsor | Own and approve one bounded workflow | Explain prototype boundary and reject unsupported scope | Record scope, exclusions and change control |
| Human identity source | Own the authoritative identity record and its accuracy | Validate supplied evidence as implemented; fail closed when absent, malformed, unknown or stale | Map only approved test fields |
| Human authority and permissions | Own role, limits, dates, departments, jurisdictions and approval truth | Verify exact authority evidence against the proposed action | Agree interpretation and test cases |
| Human authentication | Own the pilot authentication assertion and provenance | Check required evidence in the implemented fixture/contract | Agree acceptable non-production evidence |
| Agent registration and standing | Own which test agents are registered, revoked and permitted | Verify standing, delegation, capability, binding and freshness as implemented | Map buyer records to pilot fixtures/contract |
| Organisational policy and mandate | Own the policy truth, approvers, scope and version | Evaluate mandate, scope, amount, risk, currency and policy references | Resolve mapping ambiguities before testing |
| Exact proposed action | Supply a complete test payload before any action | Canonicalise and calculate the exact-action digest | Agree execution-critical field list |
| Evidence and freshness | Supply genuine test evidence and source timestamps | Enforce required presence/freshness rules as implemented | Define acceptable evidence and staleness limits |
| Test data | Provide synthetic, anonymised or separately approved minimised data | Keep prototype fixtures synthetic and avoid unnecessary capture | Classify, approve and review all fields |
| Test environment | Provide approved local environment or buyer sandbox if separately scoped | Provide local prototype instructions; make no production connection | Confirm isolation before each run |
| Secrets and credentials | Keep production secrets out; provide no live payment credentials | Use only local fixture signing material in the current prototype | Review configuration for accidental exposure |
| ATG decision | Treat PASS/REFUSE as pilot control evidence | Produce deterministic fail-closed decision, reasons and evidence | Review unexplained outcomes |
| GatePass | Do not treat a test GatePass as corporate or production authority | Issue only after all checks pass; bind, sign, expire and enforce one-use semantics locally | Agree any future sandbox verifier contract |
| Refusal | Do not execute the refused test action | Issue no GatePass; return root cause, affected checks and refusal evidence | Investigate and classify expected/unexpected refusals |
| Downstream execution | **Solely own and control it; default pilot performs none** | Never silently execute; local adapter records only synthetic acknowledgements | Any future sandbox handoff requires separate approval and controls |
| Buyer sandbox | Own access, isolation, reset and test endpoints if later used | Supply an explicitly scoped adapter design, not a production connector | Test bypass resistance before enabling it |
| Logs and source records | Own buyer-source logs and authoritative evidence | Produce ATG decision, GatePass/refusal and receipt logs in the local run | Correlate via agreed action/receipt identifiers |
| Trust Receipt and full audit receipt | Interpret within buyer governance; do not treat as certification | Generate and verify executive and signed local-fixture machine evidence | Review usability and retention |
| Retention and deletion | Set buyer policy and delete buyer-controlled copies | Document local artifacts/state; do not claim managed retention | Agree cleanup evidence and exceptions |
| Legal, privacy and compliance approval | Solely own buyer approvals and lawful basis | State limitations and provide technical evidence; make no certification claim | Escalate issues to the buyer's accountable functions |
| Security review | Set buyer assurance requirements | Disclose prototype key, replay, deployment and isolation limitations | Review threats, findings and residual risk |
| Incident/abort decision | Stop buyer activity and protect buyer systems/data | Fail closed, preserve relevant local evidence and stop evaluation when required | Triage, record and agree restart criteria |
| Success criteria and findings | Decide whether the control adds value and whether to proceed | Report measured implemented behaviour and limitations | Agree measures and sign off findings |
| Production decision | Solely own any future procurement and governance decision | Make no readiness or certification assertion beyond evidence | Separate future phase; never implied by pilot completion |

## Decision rights

| Decision | Final decision owner |
|---|---|
| Is a human actually employed and authorised? | Buyer |
| Is an agent approved and in good standing? | Buyer supplies the authoritative truth; ATG evaluates it |
| Does this exact request satisfy the configured pilot evidence and policy? | ATG |
| Does a PASS allow a real action? | No. The controlled pilot does not confer real execution authority |
| May a buyer sandbox execute a test action? | Buyer, only under a separately approved scope |
| May a production action execute? | Outside this pilot; buyer governance and future production controls would decide |
| Does a Trust Receipt certify compliance or security? | No |

## Shared change control

Any change to action type, authority source, agent population, data classification, execution system, policy semantics, environment or success criteria pauses testing until the buyer and ATG owners record a new bounded scope. Scope disagreement is an abort condition, not permission to continue on a best-effort basis.
