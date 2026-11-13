# ATG independent administration and complete-mediation acceptance record

**Date:** 13 November 2026  
**Scope:** ATG + optional checkpointed OpenShell 0.1.8 synthetic mode, draft PR #47.  
**Disposition:** **BLOCKED for production**. This file is a qualification contract, not proof that a separately operated custody system already exists.

## The two non-negotiable acceptance statements

**A. Independently administered checkpoint.** The custodian for the one-use checkpoint is a distinct security administration domain from the buyer's effect-system/writer administrator. The effect-system administrator **cannot** restore, replace, erase, clone, downgrade, disable or issue fresh permissions from the checkpoint (including keys, backup, disaster recovery, security policies, deployment and logs). This must be demonstrated by an actual destructive rollback test on an approved disposable environment and by an independent security assessor; a separate Linux UID on a root-owned machine is insufficient.

**B. Complete mediation.** In a buyer-owned destination, the restricted agent has no consequential effect path except the protected ATG checkpointed endpoint. Inventory and attack every alternate API, payment credential, SQL writer, admin interface, job queue, legacy connector, external callback, alternate identity, offline batch route, replay and copy of deployment. Every attempted effect outside the approved route must be denied by *that destination's enforced permission boundary*. The current repository alone cannot establish this property for an as-yet-unselected buyer system.

## Known evidence

| Control | Evidence | Decision |
| --- | --- | --- |
| Actual checkpointed OpenShell 0.1.8 synthetic transaction | https://github.com/Gareth1953/agent-trust-gate/actions/runs/43470797145 | PASS_SCOPED |
| Separate unprivileged writer/checkpoint identities; denied agent SQL/key access | https://github.com/Gareth1953/agent-trust-gate/actions/runs/43438270387 | PASS_SCOPED |
| Optional broker guard all non-lookup routes; added alternate-path red team | Draft PR #47 latest CI; inspect complete result for latest head | Pending exact head validation |
| Writer/checkpoint administered by different independent operators | No operator or external domain designated | BLOCKED |
| Buyer-owned actual effect system with all alternate paths removed | No buyer environment provided | BLOCKED |
| Restoring both stores under common root | Historical successful attack retained | FAILED THREAT BOUNDARY |
| Genuine human/organisation mandates; real payment outcome witness | Fixtures only | BLOCKED |
| External penetration assessment and buyer sign-off | Neither completed | BLOCKED |

## Precise operator handoff — no secrets, purchases or host changes

**Checkpoint custody operator** must provide a separately owned service, mTLS client/server trust roots, protected monotonic record history, independent administrator roster, storage/backup restore permissions, immutable event export, availability and retention policy, outage/UNKNOWN procedures and a written refusal to expose a reset or release API to the agent/writer. Credential material is supplied only through an approved secure channel, never a GitHub issue or email.

**Buyer effect-system operator** must enumerate the real protected effect and every alternate path, remove agent permissions on all alternate paths, define a single effect-commit boundary that consults ATG, supply an idempotency key contract and an independent outcome source, and run the complete route-denial matrix from compromised-agent and compromised-writer identities.

**External assessor** must witness separate operator authority, destination restore with retained checkpoint, checkpoint outage, forged signatures, replay, same-action racing writers, change of payee/value, root-account overspend, crash/late ACK and separate administrative backup restore. Preserve full positive *and* successful-attack results with version/commit/evidence hashes.

**Founder gate:** authorise operator selection, infrastructure expenditure and any live customer data/action separately. This approval to engineer/test does **not** authorise those external activities.

## Verification script for the partner test day

1. Prove two independently administered accounts/organisations, each with separate operator/backup/recovery permissions; show account grants and record denials (redact secrets).
2. Execute one *fictional* signed transaction through the checkpointed route; save the independently observed effect and checkpoint sequence.
3. As the writer/buyer administrator, restore all writer-accessible states and keys. Reattempt the same signed transaction. The independent checkpoint must refuse it; no second effect.
4. Attempt to reach the effect through every alternate path and credential. The restricted agent must be denied; check actual destination audit logs and effect version.
5. Simulate checkpoint outage and lost acknowledgements on fresh transactions. No fallback or automatic retry; record HELD/UNKNOWN and independent reconciliation.
6. As a separate checkpoint administrator, test checkpoint backup recovery while the effect owner has no restore privileges. If root or support staff control both domains, independence **fails**.
7. Complete independent review and signed risk acceptance. If anything remains unproven, NO-GO for production.

**Authorisation status:** engineering research GO, actual external custody/buyer deployment NO-GO until separate approvals. No single-site project administrator can self-certify a jointly administered test as independent.
