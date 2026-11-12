# OpenShell integration validation — 12 November 2026

**PASS_SCOPED: one synthetic destination integration. Production NO-GO.**

The new broker was exercised from an actual OpenShell **0.1.8** workload on a
disposable GitHub-hosted Linux/Docker runner. No model provider or payment rail
was configured. This is internal engineering evidence, not independent review,
NVIDIA certification, buyer acceptance or proof of superiority.

## Exact runtime evidence

- Candidate branch head: `4f2a2eefc04ce56d100a6e7b3f4c756edfd79b63`.
- GitHub PR merge checkout: `d6f5604db7e23494a22fed9be75caaa09dc5cd4c`.
- [Actual OpenShell run 43186605253](https://github.com/Gareth1953/agent-trust-gate/actions/runs/43186605253), job `131075213468`.
- Execution: **2026-11-12 08:53:17.344–08:53:28.172 UTC**.
- [Sanitized result and exact five source hashes](evidence/ci-06-openshell-pass.json).
- Official release binary SHA-256 digests are pinned and checked in the workflow.
  The receipt also records the actual agent-image digest and accepted policy.

| Actual workload check | Observed result |
|---|---|
| Seven changed payload fields: payee, amount, currency, tenant, resource, expected version, value | Each REJECTED |
| Administrator route, expired authority, forged signature | Each REJECTED |
| Missing client identity or wrong endpoint pin | UNKNOWN; no execution |
| Two concurrent requests carrying the same authority | One EXECUTED, one REJECTED |
| Replay after the commit | REJECTED |
| Historical lookup of the exact committed action | EXECUTED receipt; no second effect |
| Separate live TLS decoy, reachable by host control | No workload request reached it; workload returned UNKNOWN |
| Stopped broker | UNKNOWN; no retry or fallback |

The authoritative resource advanced once, from version 1 to **2**. The runtime
matrix contains 15 checks plus the network-denial and outage checks. OpenShell
enforced the destination/port/binary policy; ATG enforced the HTTP route, actual
payload, signature and one-use synthetic commit. End-to-end TLS 1.3 mutual
authentication stayed enabled; the gateway used separate authenticated mTLS and
Ed25519 launch credentials. No authentication bypass was used to obtain a pass.

## Local and regression evidence

The final local run passed **1,713 tests** across the two `npm test` runners
(675 + 1,038), including **18 focused broker tests**. Those 18 include real
loopback TLS, parser/body bounds, identity, inconsistent completion receipts,
revocation and emergency stop. They are not additional actual-OpenShell checks.
`npm run typecheck` and `npm run test:plugin` also passed, including the plugin's
42 unit tests and installed SDK/CLI/MCP/state-binding checks.

The first local full-suite run failed because the genuine Node 20 compatibility
runtime was missing. That failure was retained in the session log. The full
suite was rerun with actual Node **20.20.2** alongside Node 24 and passed. The
local real-OpenShell harness returned [BLOCKED](evidence/local-runtime-blocked-2026-11-12.json)
because this workspace lacks disposable root/Docker; it was not counted as a
pass or replaced with a same-owner simulation.

The [candidate regression CI run 43186605266](https://github.com/Gareth1953/agent-trust-gate/actions/runs/43186605266)
also passed both jobs: full typecheck/regression/plugin validation (job
`131075214021`) and **28 distinct-UID synthetic custody checks** (job
`131075213774`). This checks the existing custody boundary alongside the new
route; it does not extend that boundary to administrator compromise.

## Earlier real-runtime failures retained

| Attempt | Fault | Correction before the scoped pass |
|---|---|---|
| [1](evidence/ci-01-name-limit-failure.json) | Sandbox name exceeded OpenShell's limit | Bounded name |
| [2](evidence/ci-02-ip-policy-failure.json) | Native TCP rule rejected a literal-IP host | Official host alias with exact private-IP allowlist |
| [3](evidence/ci-03-launch-auth-failure.json) | Separate launch-signing configuration missing | Disposable Ed25519 gateway signing identity |
| [4](evidence/ci-04-callback-failure.json) | Supervisor callback defaulted to loopback | Explicit authenticated private gateway endpoint |
| [5](evidence/ci-05-upload-failure.json) | Directory-upload placement differed from expected probe path | Upload each named client file to its exact path |

These failures were not successful transaction tests. They remain alongside
the successful receipt, without being overwritten or relabelled.

## Limits and buyer meaning

This demonstrates a concrete complementary role: a sandboxed agent can reach
one protected destination, while ATG checks what exact synthetic change it may
make there. A buyer can reproduce that bounded integration before defining a
real business operation and adapter.

Principal authority is a fixture. Only one retained SQLite writer is
authoritative. Root/Docker/writer administrators, complete-writer rollback and
whole-host cloning remain outside this proof. Old common-owner attack
reproductions remain successful counterexamples. The result does not establish
global one-use under rollback, real payment settlement, production custody,
multi-tenancy, high availability, regulatory compliance or external assurance.
The optional source integration does not update old SDK/MCP modes, downloadable
plugin archives or the public website. No customer delivery is authorised by
this engineering record.
