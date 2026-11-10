# Split-custody validation — 10 November 2026

**28/28 distinct-principal checks pass for the optional synthetic service.
Production remains NO-GO.**

Evaluated source head: `a89189af0d2b00b577d36287f19a6065676b440a`.
GitHub's PR merge checkout: `2f628897fff871afe5d890b10ae73f6bf8ac0f0b`.
[Actual CI run 42800730943](https://github.com/Gareth1953/agent-trust-gate/actions/runs/42800730943),
isolation job `129777229739`; Node 24.22.2 on Ubuntu 26.04.1.
The [sanitized receipt](evidence/custody-service-pass-2026-11-10.json) retains
source hashes, exact observations and the original completion time. No private
key or private fixture directory is included. This evidence document is a later
documentation addition, not part of that earlier evaluated source head.

| Observation | Result |
| --- | --- |
| Actual issuer/writer/agent UIDs; zero capabilities and no_new_privs | PASS |
| Agent SQL overwrite/edit, chmod, state copy/replacement | Denied |
| Agent key, trust/config, code and process access | Denied |
| Writer read of issuer signing key | Denied |
| Same-owner service start | Refused |
| Missing/wrong client, wrong server pin and fake CA-valid endpoint | Refused |
| Changed payee, fixture signing key and agent admin/path commands | Refused |
| Two actual client processes racing one signed authority | Exactly one effect |
| Complete restore of agent cache and client credentials | Replay refused |
| Restart retained writer | Outcome found; replay refused |
| Custody outage and missing authoritative database | UNKNOWN/refused; no fallback/recreation |
| Trusted controller stop; agent attempt to resume | Stop retained; resume refused |

The authoritative synthetic resource remained at version 2: one approved
version-1-to-2 update, with no duplicate effect. Local focused tests also passed
28/28 (25 legacy witness + 3 new client/guard tests). Local full regression passed
1,695/1,695 (675 + 1,020), zero failures/skips, and typecheck passed. The completed
CI run cited above also completed successfully: 1,695 regression tests, 42 plugin
unit checks, typechecking and installed SDK/CLI/MCP/state-binding checks passed.
The final integration decision and any later documentation-only commit are
recorded in the PR description and Actions job history.

The [first failed isolation run](evidence/custody-first-run-failure.json)
remains disclosed. The workspace's actual distinct-UID test was BLOCKED; its
same-owner permissions were not treated as an isolation proof. Hosted CI tested
genuinely separate numeric identities on disposable fixtures, not separate
organisations or independently controlled infrastructure.

## Meaning and remaining exposure

This mode blocks the reproduced database-edit and complete-writer-copy routes
**from the tested compromised agent identity**. It changes the boundary instead
of claiming that the legacy common-owner architecture became safe. Legacy local
SDK/MCP evaluation modes still reproduce both attacks; those tests are retained.

The issuer, writer and root provisioner are trusted. Writer/root compromise,
whole-host snapshot restore and administrator rollback remain outside this
guarantee. There is no HSM or external anti-rollback anchor, real principal
authentication, payment-path adapter or external security assessment. One-use
is scoped to one retained authoritative writer database. This is not global
one-use across restored servers or proof of a real financial settlement.

No public website asset, downloadable archive, billing or customer delivery was
changed. Eight public archive/checksum files were byte-identical to the main
baseline `6f52f1e33b0076f7b6f7eadbe63231acf7658447`.
