# Issue #46: synthetic checkpoint-enforced destination entry point

**Research only — production NO-GO.** Run with Node 24:

```sh
node --test experiments/mandatory-destination/anchored-destination.test.mjs
npm run test:antirollback-anchor
```

The opt-in `SyntheticAnchoredDestination` wrapper now requires a trusted writer `preflightForAnchor` check, and then reserves a signed-action-shaped GatePass ID and exact digest in a retained `SyntheticConsumptionAnchor` before invoking an injected **fictional** effect writer. Invalid material, repeat attempts and checkpoint outages cause no writer call. Uncertain outcomes hold authority and are not automatically retried.

**Limitations:** This wrapper does not verify cryptographic signatures. It is not connected to the actual OpenShell broker, released plugin, payment rail or an independently administered checkpoint. The original writer remains directly callable: tests intentionally demonstrate that direct unmediated invocation STILL succeeds. A SQLite checkpoint held by the same administrator is not an independent trust boundary; cloning both databases likewise still breaks global one-use. A passing test here is NOT production-grade mandatory enforcement.

Before release, a buyer-controlled destination must make checking unavoidable, deny agent access to every alternative writer/SQL/HTTP/IPC route, verify signed human and workload authority, bind root-account budgets and exact actions, protect its checkpoint from restoration by destination administrators, and independently test outages, concurrent clones and reconciled UNKNOWN states. External security assessment is required. Do not modify Windows authentication or publish buyer-facing claims on the strength of these fixtures.


## New ordering attack: invalid grant burns the reservation

The earlier optional wrapper reserved the GatePass **before** the writer cryptographically checked its proposed action and delegated authority. The previous red-team evidence reproduced a denial-of-service: an altered payee poisoned the reservation. The new experimental controller requires `CustodyWitness.preflightForAnchor`, which performs read-only signature, principal, approval, delegation, version and reuse checks. The revised test must demonstrate that an invalid grant does **not** reserve the checkpoint and the real grant can proceed. This is a scoped repair, not a claim of atomic cross-service enforcement.

**Design constraint for any protected destination:** authenticated/authorised grant validation must precede checkpoint consumption, while actual one-use reservation and effect admission must be coordinated across a protected boundary to avoid time-of-check/time-of-use races. Do not implement release/reset-on-rejection without independently authenticated proof that no effect occurred. Any crash after a reservation must remain UNKNOWN until authoritative reconciliation.

## Actual trust boundary required for the next stage

| Principal | May call | Must NOT control |
| --- | --- | --- |
| Restricted agent | Authenticated, narrow execute/lookup service | Writer process/SQLite, checkpoint, signing keys, service config or alternate effect route |
| Protected destination writer | Validate authority, atomically commit a fictional effect after checkpoint admission | Checkpoint history/admin reset, issuer signing key |
| Independent checkpoint custodian | Authenticate writer, make monotonic one-use decisions, provide durable lookup | Modify transaction effect, sign a human mandate |
| Trusted independent observer | Authenticate external effect evidence for UNKNOWN reconciliation | Automatically reset/replay authority on an unauthenticated agent request |
| Root/host operator | Provision isolated fixture and inspect evidence | **Not adversarially isolated in current single-host tests** |

The existing Linux split-custody service shows that a restricted agent cannot directly read protected writer state, execute its code or mutate its database under a distinct UID. That is **not proof** that an independently administered checkpoint is enforced. The existing OpenShell combined-mode service is separate from this experimental wrapper.

**Release tests still required:** an actual protected checkpoint service under a separately administered identity and retained state; cryptographically authenticated writer/checkpoint conversation; no agent-accessible alternate HTTP/IPC/direct SQL path; two independently restored writer instances; forged-grant poisoning resistance; exact root-budget binding; outage, crash and reconciliation checks. Independent administration and external assessment cannot be proven solely by code added to this repository.

## Current scope after preflight repair

The preflight and reservation are **separate steps**, and cannot by themselves guarantee cross-process atomic execution or independently protected monotonic history. An operator who can invoke or clone the unprotected writer still bypasses this wrapper. Do not merge this research as a production fix or claim that the direct-access bypass has been removed. The real Linux custody service has not yet been rewired to this checkpoint. Independent administration and destination-owner involvement remain required.


## Optional authenticated checkpoint service and Linux isolation experiment

The new research path consists of `checkpoint-tls-service.mjs`, `async-checkpointed-destination.mjs`, and the opt-in **separate-UID** test processes. The service binds only to 127.0.0.1 and requires TLS 1.3, CA validation and an exactly pinned certificate for both destination-to-checkpoint directions. The only service operation is `reserve`; the agent is given no release, reset or administration API. A failed connection, wrong identity, invalid reply or outage refuses effect permission and does not retry.

**Actual protected synthetic writer:** `isolated-writer-process.mjs` runs with a distinct writer UID, reads only its owned database/TLS client key, validates signed authority using `CustodyWitness.preflightForAnchor`, calls the checkpoint over mutual TLS, then revalidates at the protected synthetic commit. The checkpoint process holds its own file and TLS key under another UID. The untrusted agent UID has neither key nor database access.

Reproduce on a disposable Linux host with Node 24 and `setpriv`, after `npm ci --ignore-scripts && npm run build --silent`:

```sh
node --test experiments/mandatory-destination/checkpoint-tls-integration.test.mjs
# Disposable Linux CI host only; never run as root on a personal/work device:
sudo -- "$(command -v node)" experiments/mandatory-destination/linux-isolation-harness.mjs \
  --output /ABSOLUTE/NEW/evidence.json --disposable-host
```

The harness must demonstrate a first fictional effect through the authenticated writer, refusal of a restored writer through the retained checkpoint, actual OS denied access to writer/checkpoint state and secrets, and rejection of agent impersonation. It records a sanitized JSON receipt, never copies the fixture credentials into uploaded artifacts, and makes **no** persistent account or host ACL changes.

**Explicit limitations:** The test's root orchestrator controls both UIDs, all fixture credentials and the creation/restoration of both stores, so it does not establish independent *administrative* custody. A malicious destination operator with direct access to the writer process/code can still bypass the opt-in wrapper. The existing OpenShell broker and published plugin are not silently rerouted through this service. The service has no externally authoritative payment effect, global transaction ledger, durable remote acknowledgements, customer identity or independent audit. A permitted checkpoint reservation can still remain HELD if the subsequent writer action fails.

**Production acceptance remains blocked** until the actual buyer-owned destination makes this route non-bypassable, the checkpoint has a *different administrator/restore domain*, and a separate security assessor verifies those boundaries and recovery behaviours. This is a synthetic demonstration of separated *operating-system identities*, not production-grade anti-rollback.
