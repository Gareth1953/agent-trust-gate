# Enforcement boundary and remaining repair plan

## Assets and adversaries

Assets: exact action/mandate, signing keys, revocation and one-use state,
destination records, recovery holds, audit evidence and trust configuration.
Consider a malicious agent; an unprivileged client; a compromised gateway; a
same-user process; a destination administrator; and an actor able to restore
all roles and backups. These are different adversaries with different powers.

The current code uses synthetic approval/operator evidence, known fixture keys,
a fixed reference clock, local SQLite and a destination-generated key on the
same host. The agent-facing MCP tool evaluates; it does not intercept every
alternative execution path. IPC validation authenticates neither the OS user
nor the truth of an external business event. A 256 KiB limit is applied to the
canonical message before dispatch/transaction; it does not prevent allocation
by Node's IPC decoder, recursive traversal work, same-user interference or all
memory/CPU exhaustion. Test barriers and evidence fault seams remain host-level
synthetic controls, never a production administrative API.

## Current controls and counterexamples

Exact-action verification, a destination-side state comparison, local atomic
records/fences, one-use lifecycle and UNKNOWN reconciliation protect the defined
cooperative evaluation path. Rejection is not evidence of complete mediation.

1. **Direct SQL edit succeeds:** the local owner can change the destination
   business state and recompute its unkeyed checksum. This is a real test of
   the shared-owner limitation, not a signature forgery.
2. **Coherent clone replay succeeds:** a copy of authority and destination state,
   keys and trust made before consumption permits the same GatePass in each
   copy. Each isolated local store observes one use; global one-use is unproven.
3. A trusted destination signer can make a false business claim. Signature
   validation establishes authorship/binding, not ledger truth or commercial wisdom.

## Proposed next architecture — not implemented here

| Role | Minimum custody requirement | Failure behaviour |
| --- | --- | --- |
| Agent/client | No authoriser or writer keys; no writable authority/destination storage | Cannot invoke protected effects through an alternative credential |
| Approval authority | Authenticated human mandate, bounded policy, key rotation/revocation | Missing or stale authority refuses new admission |
| Protected writer | Independently enforced credential and destination permission boundary | Exact conditional write plus authoritative idempotency |
| Anti-rollback witness | Monotonic checkpoint/consumption anchor outside the restorable common-owner domain | Unavailable/stale/conflicting checkpoint holds progression |
| Recovery operator | Separate authenticated authority and least-privilege reconciliation | UNKNOWN never triggers automatic resubmission |

Choose buyer-hosted custody or a partner destination that can actually enforce
these conditions. A distinct process, HSM alone, an extra local signature, an
agent-supplied identity claim or a cloned witness on the same administrator's
restore domain is insufficient. Define whether hostile host administrators are
in scope; do not imply protection from them if the deployment trusts them.

## Acceptance gates for that next milestone

- Demonstrate denied key/SQL/config access from each real lower-privilege role.
- Demonstrate endpoint/server and client authentication, squatting refusal and
  remote-client rejection for the selected OS/transport.
- Restore all attacker-accessible state and prove the independently retained
  consumption anchor still prevents duplicate effects. Test anchor loss too.
- Race revocation/stop against admission and commit; report ordering precisely.
- Kill between durable intent, commit and acknowledgement; retain exposure and
  reconcile from authoritative evidence without blind retries.
- Independently measure action-binding and full-path latency, capacity and
  recovery under an agreed workload. Do not infer an SLA from this demo.
- Have an external reviewer challenge the same deployment and evidence.

These require separately administered custody or partner access unavailable in
this checkout. Do not create Windows accounts, change host ACLs/services,
provision cloud resources or contact live finance APIs as part of this runner.
The historical Windows PI3 Stage 2B/2C holds and unrecovered PI2 diagnostic
overwrite remain disclosures; no historical evidence is regenerated or replaced.
