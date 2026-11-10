# Split-custody service evaluation — 10 November 2026

**Synthetic research implementation. Production NO-GO. Not a plugin release.**

The [dated validation and retained receipt](SPLIT-CUSTODY-VALIDATION-2026-11-10.md)
record 28/28 actual Linux distinct-principal checks passing for the cited source
head. They do not clear the trusted-administrator or whole-host restore limits.

## What is being repaired

The old local evaluation remains deliberately reproducible: a common owner can
edit authoritative SQL, copy the issuer's key, or restore both sides before use.
Application code cannot prevent an administrator who controls that code, every
key, every copy of the state, and every execution destination from replacing it.
Those historical attack tests and outputs are retained, not relabelled as fixes.

The new **optional service mode** changes the agent's authority boundary. A
compromised agent holds a TLS client credential, a signed grant and a cache. It
does not own the signing key, writer database, server key, pinned trust, service
configuration or executable code. Its restored/cloned clients all contact one
retained authoritative writer; a copied client credential grants no extra use.

| Role | Held assets | Trust assumption |
| --- | --- | --- |
| Issuer UID | Fresh evaluation signing key | Trusted issuer; approval is still synthetic |
| Writer UID | Synthetic record/consumption database, TLS server key | Trusted writer code and storage operator |
| Agent UID | Grant, cache, client TLS key | May be malicious, copied or restored |
| Root provisioner | Public-key/config pins, immutable code, test CA | Trusted administrator; outside attacker scope |

The writer has only the issuer's public verification key. No signing operation,
database selection, clock override, setup, revoke, stop or reset is exposed to
the agent network channel. The existing trusted controller API remains local
and separately privileged. The service uses the actual host clock, not the
older demonstration worker's fixed fixture clock.

## Enforced controls

- Linux startup requires a non-root writer UID distinct from issuer and agent,
  zero capability sets and `no_new_privs`. Missing isolation fails startup; no
  same-owner downgrade is offered by the service entry point.
- Root-owned configuration/code/public trust and private writer state paths are
  checked for ownership, symlinks and permissions. The operator must install the
  **entire** code/runtime tree under trusted ownership before launching it.
- TLS 1.3 requires a CA-valid client certificate **and its exact pinned leaf**.
  The client verifies the server hostname, CA and exact pinned leaf. No trust on
  first use, plaintext mode, local writer fallback or automatic retry exists.
- Loopback binding only. This is an isolated-host reference implementation,
  not a supported internet deployment. TLS still protects against another local
  agent process impersonating the endpoint. Certificates require explicit
  operator rotation/restart; no online rotation service is claimed.
- At most 32 connections, 3-second connection/handshake deadlines, one strict
  JSON frame per connection and a 64 KiB pre-parse byte bound. These are resource
  bounds, not a denial-of-service or throughput guarantee.
- Existing atomic synthetic effect/consumption, exact-action verification,
  one-use collision, version and stop/revocation checks are reused. Missing
  authoritative state refuses startup; outages return UNKNOWN without replay.

## Reproduction and evidence

Regular local regression (Node 24 and OpenSSL required):

```sh
npm ci --ignore-scripts
npm run build --silent
node --test test/custody-service.test.mjs test/custody-witness.test.mjs
```

Actual distinct-principal checks run in the added GitHub Actions job. Its trusted
root orchestrator provisions only disposable files and numeric subprocess UIDs;
it creates no system accounts, changes no host service, and connects only to
loopback. The writer and attacker subprocesses have all capabilities dropped,
empty supplementary groups and `no_new_privs`; protected code and a copied Node
runtime are root-owned. No production resource, cloud plan or external API is
used. Do not run the root harness on a working/shared production machine.

```sh
# DISPOSABLE Linux host only, after build; new output path required.
sudo -- /ABSOLUTE/PATH/TO/NODE scripts/test-custody-isolation.mjs \
  --output /ABSOLUTE/NEW/report.json --disposable-host
```

The harness tests actual denied SQL/key/config/code/memory/signal access, missing
and wrong TLS identities, fake endpoint pinning, changed-action/issuer refusal,
two racing client processes, full agent-cache/credential restore, writer restart,
custody outage, missing-store refusal and persistent emergency stop. Its JSON
records source hashes, actual UIDs, case observations and limitations. The runner
prints only this sanitized receipt; **never upload its private fixture directory**.
That directory contains disposable CA/signing/client keys and databases.

The [first hosted failure](evidence/custody-first-run-failure.json) is retained:
six checks passed, then Node's native directory-copy probe aborted on denied
access. This did not count as a passing attack refusal. The repaired probe uses
POSIX `cp` and requires an explicit permission-denied result; no protected path
or permission is relaxed. Consult subsequent CI results, not this failure, for
the completed attack matrix.

This workspace's unprivileged execution records BLOCKED rather than pretending
to have tested distinct identities. Passing TLS unit tests alone is not an OS
custody proof. Consult the PR's actual completed CI job and receipt for the exact
tested commit; failures remain in the job history.

## Guarantees deliberately not claimed

The service cannot stop its trusted writer/root administrator from changing or
restoring the writer database. It has no externally held monotonic checkpoint,
HSM, attested host, multi-region consensus, independent security assessment,
real principal authentication or payment-provider enforcement. A root snapshot
of issuer, server keys, pins and writer state can still reproduce the attack.

One-use in this mode is scoped to **one retained writer database**, across its
clients and restarts. It is not a proof of global one-use across restored servers
or other payment rails. Root/custody-admin compromise and complete host restore
still require an independently administered authority/destination or checkpoint.
Key storage is OS isolation, not hardware backing. Protecting a key from the
agent does not make the issuer's approval true or prove a payment occurred.

The old local MCP/SDK modes and downloadable archives do not automatically use
this service. No arbitrary live tool callback or payment adapter is added. A
buyer must agree its deployment threat model, own the custody boundary and test
the actual protected destination before production consideration.

Implementation references: [Node TLS](https://nodejs.org/api/tls.html),
[Linux capabilities](https://man7.org/linux/man-pages/man7/capabilities.7.html),
[setpriv](https://man7.org/linux/man-pages/man1/setpriv.1.html).
