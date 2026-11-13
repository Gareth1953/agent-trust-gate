# Separated checkpoint and synthetic writer — tested Linux evidence

**13 November 2026, draft PR #47. No production approval.**

## Scope and source

- Tested source commit: `814f2b9d00578f551e3d5a4074ae50f14534f25e`.
- [Automated distinct-principal evidence run](https://github.com/Gareth1953/agent-trust-gate/actions/runs/43438270387).
- [OpenShell 0.1.8 synthetic regression](https://github.com/Gareth1953/agent-trust-gate/actions/runs/43438270401) — **separate workflow**; do not treat it as live checkpoint enforcement in OpenShell.
- Harness source: `experiments/mandatory-destination/linux-isolation-harness.mjs`.
- Client/service sources: `checkpoint-tls-service.mjs`, `async-checkpointed-destination.mjs`, `isolated-checkpoint-process.mjs`, `isolated-writer-process.mjs`.
- Published local.7 archive, live payment systems, Windows environment and production identity untouched.

## Actual checkpoint isolation observations

The new Linux job reported `PASS_SCOPED` with **14/14 checks**. An actual Linux subprocess ran the checkpoint under UID 62014, and a second subprocess ran the synthetic writer under UID 62012. An adversarial agent UID 62011 lacked access to protected state or credentials. The source-only loopback checkpoint service requires TLS 1.3, a trusted test CA, pinned writer certificate and exact pinned server certificate; only one `reserve` operation exists.

| Check | Observed |
| --- | --- |
| Distinct unprivileged checkpoint process | PASS |
| Authenticated real CustodyWitness fictional effect | PASS |
| Restored writer refused after checkpoint retention | PASS |
| Agent cannot read, rewrite checkpoint store or TLS private key | PASS |
| Agent cannot read, rewrite or directly open writer SQL | PASS |
| Agent cannot read writer TLS private key | PASS |
| Writer cannot read or rewrite checkpoint store | PASS |
| Writer cannot read checkpoint TLS private key | PASS |
| Agent cannot start trusted writer under writer UID | PASS |

The test fixture is created and destroyed on a disposable GitHub Linux machine. No real accounts are created; the JSON log is sanitized. Repository tests also cover wrong client certificate, wrong server certificate pin, expired/changed signed action, and checkpoint outage with **UNKNOWN/no retry**. For exact results see the CI workflows for this source revision.

## Attack boundary still outside the proof

**A common root operator can still restore both databases, replace code/keys or invoke a writer outside the opt-in controller. This is a successful administrator-level attack boundary, not solved production anti-rollback.** The test does not prove two separately administered hosts, independently retained checkpoint history, business transaction idempotency, complete routing of the existing OpenShell destination, genuine human/device approval, external effect reconciliation or security certification.

The old direct `CustodyWitness.execute` path remains available to trusted code, and historical tests deliberately show a restored common-owner clone can execute when it ignores the checkpoint. Accordingly: this check proves the *restricted agent* cannot bypass the isolated route in the disposable Linux environment; it does **not** prove all possible administrators or integration paths cannot bypass it.

## Acceptance gate before buyer production use

1. Name a customer-controlled effect system and independently controlled checkpoint custodian; prove the buyer destination cannot reach an alternative effect path.
2. Separate administrators, backups, recovery privileges, credentials and storage restore domains; reproduce a full destination restore with retained checkpoint state.
3. Authenticate actual organisation, human mandate and agent delegation. Extend the protected destination to check root-account budget across distinct effects.
4. Independently verify external effect outcome after timeout/crash; never equate checkpoint RESERVED with execution.
5. Commission an independent red-team assessment with exact deployment configuration and actual attack logs.
6. Preserve explicit founder and buyer-owner sign-offs, no paid services or real transactions without separate approval.

**Engineering decision: GO for further synthetic buyer-security evaluation, NO-GO for production.**
