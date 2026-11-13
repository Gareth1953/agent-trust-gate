# ATG checkpoint-enforced broker inside real NVIDIA OpenShell 0.1.8

**Scoped evaluation result — 13 November 2026, 17:15 UTC. Production NO-GO.**

## Evidence identity

- Tested PR #47 source commit: `89b764e20b4f43271f9a6c905ad33be1c4952a4f`.
- [Actual OpenShell integration run 43470797145](https://github.com/Gareth1953/agent-trust-gate/actions/runs/43470797145): **SUCCESS**, including the new `--require-checkpoint` scenario.
- The regression/custody/browser run for that head is [43470796895](https://github.com/Gareth1953/agent-trust-gate/actions/runs/43470796895), independently tracked; do not infer it passed from the OpenShell job.
- Source and exact test fixture hashes are printed in the CI log. Do not upload fixture private keys or directories.

## What actually ran

A fresh OpenShell 0.1.8 workload, using the real CLI and gateway binaries with verified download digests, connected through its restricted network policy to a pinned-TLS HTTPS ATG broker. The broker was started in **optional checkpoint-enforced mode**. It used a private loopback pinned-mutual-TLS checkpoint service for one-use admission before the synthetic destination writer committed the exact record.

The agent workload held only its disposable client certificate/key and fictional signed action. It did not hold the checkpoint key, writer database or issuer signing key. No AI model provider, real payment system or customer credentials were used.

## Observed results (scoped to this test)

| Attack or permitted operation | Actual result |
| --- | --- |
| First exact authorised fictional transaction | One `EXECUTED` |
| Different payee, value, amount, tenant, version, currency, resource | `REJECTED` |
| Forged/expired signed action | `REJECTED` |
| Wrong/absent client identity and wrong pinned server | `UNKNOWN`; no effect |
| Two simultaneous requests for same action | One `EXECUTED`, one `REJECTED` |
| Exact replay after commitment | `REJECTED` |
| Historical lookup | Original synthetic effect found; no extra effect |
| Forbidden admin route / reachable unlisted network endpoint | Refused; no protected effect |
| **Checkpoint stopped; fresh valid version-2 grant from actual workload** | **`UNKNOWN`, no fallback or automatic retry** |
| ATG broker stopped | `UNKNOWN`, no fallback |

The new source hashes and source commit are retained by the integration harness. The required checkpoint code is loaded only in the optional `checkpoint` broker configuration; protected code ownership is checked. No previous broker mode or published plugin archive is silently changed.

## Critical qualifications

1. The checkpoint in the **real OpenShell workload run** is provisioned by the same disposable root orchestrator as the broker. It is a separate mutually authenticated service and database, but **not independently administered**. Earlier disposable Linux tests demonstrate separate process/UID access denial; they do not make this run an independent-admin production environment.
2. The historical direct-writer and whole-host/whole-checkpoint-restore attacks remain successful outside the restricted agent's protected path. The existing unauthenticated internal `CustodyWitness.execute` API must not be reachable by agents in a production destination; no complete inventory of a buyer's alternate effect rails exists.
3. The checkpointed OpenShell mode was tested as an **independent optional path** with software fixture authority. The separate combined delegated-budget/passkey route is also tested, but **the checkpoint + delegated budget + genuine human/device approval are not proven together as a single live deployment**.
4. The checkpoint reservation and destination effect are not one cross-service atomic financial transaction. A crash between them holds permission UNKNOWN pending independent outcome reconciliation. No payment-provider idempotency, external settlement observation, service HA or live buyer integration is claimed.
5. A real organisation, real enrolled user, independent checkpoint custodian and outside assessor have not yet accepted this system. This is **neither NVIDIA endorsement nor production security certification**.

## Decision

**GO:** further supervised, synthetic partner/buyer evaluation using this exact evidence and attack limitations.

**NO-GO:** real money, unreviewed production integration, public claims of guaranteed anti-rollback/complete mediation, or promotion of this optional experimental code into a production release.

Next prerequisite is a buyer-controlled non-bypassable transaction destination and a **separately administered checkpoint** with proven rollback denial, incident recovery, independently authenticated outcome evidence, and an external red-team assessment.
