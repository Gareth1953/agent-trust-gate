# ATG security-readiness evidence and production decision gate

**Evidence checkpoint: 13 November 2026**  
**Candidate:** draft PR #47, head `75011decbe3413d305793b2d8e2e9e5879b1ea33`  
**CI:** https://github.com/Gareth1953/agent-trust-gate/actions/runs/43424887315  
**Decision:** **NO-GO for production**. **GO for synthetic evaluation and buyer review only**.  
**Scope:** Research branch only. This is not a deployment authorisation, certification or independent security assessment.

## What is actually proven on this source revision

| Evidence | Observed outcome | Limits |
| --- | --- | --- |
| Full regression job | PASS in CI run 43424887315 | Passing regression does not prove complete mediation |
| Linux distinct-principal custody job | PASS in same CI | Restricted agent is blocked from protected local writer resources in disposable Linux environment; root operator remains trusted |
| Local approval browser/app job | PASS in same CI | Virtual software authenticator, not genuine human/device identity |
| Checkpoint-only and cloned-writer tests | Included in passing regression job | Voluntary checkpointed route blocks duplicate synthetic reservation |
| Actual CustodyWitness under optional anchored wrapper | Included in passing regression job | Cloned writer is not invoked through this wrapper after reservation |
| Direct unmediated cloned writer | **SUCCESSFUL ATTACK deliberately reproduced** | Original writer is still callable, so there is no compulsory destination enforcement |
| Whole-state/checkpoint clone | **SUCCESSFUL ATTACK deliberately reproduced** | Same administrator can restore both stores |
| Forged request submitted ahead of valid request | **SUCCESSFUL checkpoint-poisoning counterexample reproduced** | Reservation occurs before true writer authority verification; legitimate grant can be held without a committed effect |

**Interpretation:** A test that expects an attacker to succeed can pass while security remains insufficient. Treat these as findings, not cleared protections.

## Attack-surface inventory and production boundary

| Route | Current evidence | Required disposition |
| --- | --- | --- |
| Optional `SyntheticAnchoredDestination.execute` | First reservation mediates fake writer and actual CustodyWitness tests | Only experimental; verify signed principal/action **before** reservation, and prevent later bypass |
| Underlying `CustodyWitness.execute` | Direct invocation succeeds if attacker can access the process/clone | Deny access outside a trusted writer identity; never expose as alternate effect API |
| Direct SQLite data/WAL/journal edits | Same-owner attacks known to succeed; distinct-UID Linux test denies restricted agent | Protect every writeable file, directory, backup, restored copy and privilege path; test attempted writes |
| Existing Linux custody TLS service | Distinct UID, pinned certificate, loopback channel; one authoritative writer | Integrate authenticated checkpoint under independent custody at actual effect boundary and confirm denial without it |
| OpenShell optional combined broker | Actual 0.1.8 synthetic combined route tested previously | Separately demonstrate mandatory checkpoint and no alternative effect path **in that actual route** |
| Retained SQLite checkpoint | Single shared file prevents second reservation | Must be administered outside destination operator's rollback authority; authentic communication and durable history required |
| Local WebAuthn approval | Software-device/virtual tests successful | Genuine human and organisation enrolment, mandate binding, recovery and anti-phishing validation still open |
| External purchase/payment path | No real payment adapter exercised | Buyer-owned non-bypassable destination and reliable independent effect observation required |

## Required security acceptance tests — do not approve until evidence exists

**G1 — Verified authority before consumption.** A forged, changed, expired, wrong-principal or wrong-destination grant must not consume legitimate approval, alter root budget or create an effect. A signature/credential check performed only by an untrusted agent is insufficient. Re-test checkpoint poisoning.

**G2 — Complete mediation.** Starting from a restricted agent identity, attempt every public and internal execute route, alternate endpoint, direct writer invocation, direct SQL, changed database path, file replacement and credential misuse. A single bypass is a failed gate. Preserve raw actual-denial evidence.

**G3 — Independent checkpoint.** Checkpoint administrator and retained history must be outside the destination's rollback/restore control. Demonstrate an agent or destination operator cannot rewrite, replace, clone-back or reset consumed authority. Independent operational and cost responsibilities documented.

**G4 — Coherent cloning and races.** Race distinct restored writers with the same signed action, then restore all attacker-controlled files. Exactly one independently confirmed consequential effect may be admitted. Distinct GatePasses must share the root-account allowance.

**G5 — Uncertain outcomes.** Crash, unavailable witness, lost acknowledgment, half-completed effect and network split must hold permission/obligation; never infer success from reservation, refund without trusted evidence, or retry blindly. Reconcile using authenticated independent observation.

**G6 — Genuine identities and delegated authority.** A real responsible organisation enrols authorisers and workload principals; verify mandate, delegate chain, expiry, revocation, tenant, payee, value, source and destination at the protected point of execution. Test key rotation and device loss.

**G7 — Buyer deployment evidence.** Reproduce G1–G6 in the intended customer's real security boundary, not merely GitHub CI or a same-host simulator. Confirm logging, retention, incident recovery, stop/revoke, monitoring and backup restore.

**G8 — Independent review and sign-off.** Independent security assessor records methods, test results, unresolved critical/high findings and retest. Buyer security owner accepts residual risk; operational owner and accountable authoriser approve a **narrowly scoped** production change. Separate founder approval is still required for spending/public releases.

## Safe next engineering increments

1. Prototype verified-authority admission **before** checkpoint reservation, using actual signed request verification inside the trusted writer boundary. Prove invalid submissions do not poison reservations; retain the old attack test for contrast.
2. Prototype a **distinct-identity authenticated checkpoint service** in disposable Linux CI: writer allowed, restricted agent denied, credentials and checkpoint backup inaccessible to writer; reject on outage. Do not pretend that two accounts owned by the same root operator are separate administrators.
3. Integrate checkpoint admission into a **single narrowly scoped synthetic destination**, keeping old modes unchanged. Run alternative-route, full-clone, second-writer and no-credential tests against the actual deployed process boundary.
4. Deliver a five-minute buyer walkthrough, source hashes, test receipts, an explicit known-failures register and risk-owner sign-off template. Consult external assessor and buyer before any live adapter.

## Decision record

**Owner/approver:** not yet recorded for an actual customer deployment.  
**Security assessor:** not engaged.  
**Protected checkpoint operator:** not designated.  
**Actual destination/payment operator:** not designated.  
**Independent rollback-resistant retention:** not established.  
**Genuine organisational identity / human mandate:** not established.  
**Complete mediation:** failed by deliberate red-team counterexample.  
**Production GO:** **NOT GRANTED**.

No live payment, production credentials, customer transactions, new cloud infrastructure, purchases or public certification claims are authorised by this document.
