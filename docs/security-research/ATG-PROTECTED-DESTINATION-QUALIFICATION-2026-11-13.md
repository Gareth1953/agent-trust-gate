# Protected-destination custody and anti-rollback qualification plan

**13 November 2026 — design and tests only. No production deployment approval.**  
Companion to [production security gate](ATG-PRODUCTION-SECURITY-GATE-2026-11-13.md) and [Issue #46](https://github.com/Gareth1953/agent-trust-gate/issues/46).

## Deployment boundary that must be enforced

The restriction is a property of **who owns the actual business effect**, not of an optional SDK wrapper:

1. **Agent principal** can call only an authenticated narrow request/lookup API. The agent has no writer/admin key, direct database access, alternate execution callback or way to choose a destination/state path.
2. **Destination principal** verifies *actual* signing, mandating, delegation, payee, value, destination version and human approval against pinned trust. It has the sole authority to create the consequential effect. No direct SQL/effect fallback is accessible to the agent.
3. **Checkpoint principal/operator** owns a monotonic, retained one-use ledger. The destination authenticates to it using distinct credentials; the agent has none. The destination operator cannot reset or restore this ledger; checkpoint administrator cannot create business effects. The contract is exact action ID, digest, domain and root-account budget, with safe reservation/held/confirmed states.
4. **Independent outcome observer** provides authenticated evidence when effect acknowledgement is lost. UNKNOWN is held, not optimistically retried or released.
5. **Operational separation** covers principals, service binaries, keys, data/WAL/journal files, backups, snapshots, host administration, deployment permissions, and disaster recovery. Two UIDs under a single root owner do **not** prove independence from that root owner.

## Admission/commit order, for buyer review

- Authenticate the client and origin at the protected entry point.
- Validate signed scope and complete grant including the real action payload, delegation, human approval, principal and destination; never consume a legitimate reservation on an invalid request.
- Consult authoritative destination state and root-account budget. Restrict concurrent admissions with the protected writer and checkpoint protocol.
- Ask the independently administered checkpoint to reserve the exact permission. If missing/uncertain, fail closed; never fall back.
- Commit exactly one protected effect and record/reconcile its outcome. A reservation is only a held intent; it does not prove a real purchase or authorise replay.
- An interrupted operation remains UNKNOWN until independently authenticated proof resolves it. Never release or retry because an agent reports a failure.

**Cross-service atomicity is not established by the current wrapper.** A crash between checkpoint reservation and destination execution must remain held. A buyer-owned idempotent destination and a defined authoritative reconciliation protocol are prerequisites. No false “all-or-nothing financial transaction” assertion.

## Required actual attack evidence (not merely unit mocks)

| Attack | Required result |
| --- | --- |
| Agent directly connects to effect writer/other HTTP or IPC routes | OS/network denial, no effect |
| Agent edits SQL, DB journal/WAL, config, executables or backup | Actual access denied, no trusted-state change |
| Forged payee, amount, agent or human-approval evidence | No effect, **no checkpoint reservation** |
| Two unrelated approvals under one root budget | Atomic shared allowance not exceeded |
| Two restored writers with same action | Exactly one checkpoint permission and at most one externally confirmed effect |
| Destination operator restores its full environment | Retained checkpoint still refuses replay under separately administered recovery |
| Agent copies/restores its credential/cache | No expanded authority or second effect |
| Witness outage, false ACK, partition or late reply | UNKNOWN/held, no fallback or auto retry |
| Separate checkpoint owner deliberately restores ledger | Explicit privileged trust failure or independent monotonic retention preventing it |
| Revocation/emergency stop during admission | Block further effects; produce retained reason evidence |

## Current engineering evidence and limits

- The optional anchored experiment now invokes `CustodyWitness.preflightForAnchor` before reserving the checkpoint. Validates grant and approval without mutating them; execution repeats checks. **This is a scoped fix for checkpoint poisoning, not complete mediation or cross-service atomicity.**
- Existing Linux distinct-UID custody service exercises denied-access paths for a restricted agent and authenticates via pinned loopback TLS. It does **not** yet enforce the independent checkpoint.
- Existing OpenShell combined mode exercises genuine OpenShell runtime with synthetic identities and effect records. It does **not** establish external checkpoint custody.
- Successful direct-writer and full-checkpoint-clone attack cases are preserved. They remain blockers.
- No real buyer payment adapter, genuine human-device enrollment, independent checkpoint operator, or independent external assessment has been proven.

## Release decision

**Source-only research: GO. Buyer supervised synthetic evaluation: conditional GO. Live financial execution: NO-GO.**  

A customer security owner, destination/payment operator, independent checkpoint custodian and outside assessor must provide named sign-off, scoped threat model, recovery responsibility, independent retained proof, actual attack logs and evidence hashes. Founder approval remains required before any expenditure, credentials, new infrastructure or release/public claims.
