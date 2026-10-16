# local.7 publication status and current release notes

This status-only revision is prepared for publication review and remains
**unpublished until deployed**. Website and README release wording describes
local.7 once deployed; it does not establish a live download or deployment.
Gareth's final approval must identify the exact wording commit and sealed archive.

- Reviewed candidate: `9c47333928c58016b0f26c94d18d4774f6f66e06`.
- Archive: `agent-trust-gate-plugin-0.1.0-local.7.tgz`, **157102 bytes**.
- SHA-256: `dcf75970db520fdd10afea63aa1a9d20780dc12a053c8e09f49b0f21ed1dddad`.
- No runtime, package contents, checksum manifest or archive bytes change.
- Published local.5 and retained unpublished local.6 remain unchanged.

Local.7 includes the reviewed Mission 04 signing/POSIX creation-mode fixes and
durable-write cleanup/error-diagnostic repair. The original Windows incident
remains **unattributed**. A matching EPERM replacement mechanism was reproduced
with an owned open file handle; that does not identify the original OS error,
failing operation or locking process. A separate cleanup defect was fixed.
Denied writes still fail closed; no retry, permission weakening or hold clearing
was added. Passing reruns do not clear the incident.

**POSIX runtime verification was not performed for this candidate.** The POSIX
test was skipped on Windows. POSIX modes do not enforce private Windows NTFS
DACLs. Provision and inspect a private new parent separately; existing held state
and permissions are not repaired or migrated. Same-user, administrator and SYSTEM
access are outside the isolation boundary. ATG does not encrypt local records.
Synthetic same-host evaluation, fixture authority/approval keys and clocks, and
a same-host destination key remain. No independent security assurance, live
partner integration, client-data approval or production readiness is claimed.

## Sealed preparation-time snapshots

The [preparation report](mission-04-local7-buyer-release.md),
[validation summary](../reports/mission-04-local7-buyer-release/summary.json),
public exact-archive recordings and bundled guides are preserved historical
evidence. Their candidate/unpublished wording describes preparation time.
The package-source [integration guide](standalone-plugin.md),
[destination guide](destination-evidence-evaluation.md),
[security boundary](mission-04-package-security.md) and
[release notes](mission-04-package-release-notes.md) remain byte-identical to the
sealed archive; older status/version references in those snapshots do not
supersede this current note. Their substantive security and recovery limitations
remain applicable. Do not rebuild the archive to update snapshot wording.

Use the [publication runbook](mission-04-publication-runbook.md) only after
separate explicit approval. Fresh remote identity/access/base checks, deployment
commit verification, live download hashes and prescribed live-byte Node 20/24
installation/security checks remain publication-time requirements. No push,
deployment or publication is authorised by this wording preparation.

## Wording revision validation

The [wording review record](../reports/mission-04-local7-publication-wording/review.json)
pins the new check logs and directly inspected screenshots. Claim/site validators,
all seven archive checksums and 54 compiled members, 20 website tests, and Edge
checks of all three changed pages at 1440/390/320 passed. All 7,875 protected
baseline files and original branch tips remained unchanged. A tiled desktop
capture was retained and resolved by a fresh capture-only browser run.
Full runtime regressions and exact-archive Node 20/24 suites were not repeated:
there are no runtime or archive changes, and their reviewed evidence is retained.
Local preview checks do not establish a live deployment.
