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
