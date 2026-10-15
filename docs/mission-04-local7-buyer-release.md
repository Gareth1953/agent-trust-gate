# Mission 04 local.7 buyer-release preparation

Unpublished candidate for Gareth and Dave's renewed review. Branch
`mission-04-local7-buyer-release` starts at reviewed durable-write repair commit
`ce7259ad05d4f82cc0c865ea213ba90d9020d34a`; existing main and mission worktrees
are preserved. The final exact commit and sealed archive are reported in the
handoff and [validation summary](../reports/mission-04-local7-buyer-release/summary.json).

Local.7 contains the reviewed Mission 04 signing/POSIX fixes and durable-write
repair: exclusively create a mode-0600 temporary file, write/fsync through the
same descriptor, close, atomically replace and confirm; clean up only an owned
temporary file and retain the original native exception as Error.cause. It does
not add retries or make Windows open-handle replacement succeed.

The original Windows incident remains unattributed. The same test/transition/
stack was reproduced with an owned read handle causing native EPERM on rename;
a separate cleanup defect deleted colliding files and is now fixed. No claim
is made that a scanner, browser, permissions change or parallel test caused the
historical incident. Passing reruns do not clear it. Read the unchanged
[investigation record](mission-04-durable-write-investigation.md).

Published local.5 remains the published baseline. Local.6 remains an unchanged
unpublished candidate at its original size/hash; it contains the signing/POSIX
fixes but lacks the durable-write repair. All earlier archives and signed
recordings remain retained and are not relabelled.

The [publication runbook](mission-04-publication-runbook.md) specifies local
verification and future separately approved publication gates. This task does
not merge, push, deploy, publish, tag, create a GitHub Release, install software,
change browser settings, change existing permissions or restart authentication.

Synthetic same-host evaluation, fixture authority/approval keys/clocks, generated
same-host destination evaluation keys, no ATG record encryption, separate private
Windows DACL provisioning and same-user/administrator limitations remain. POSIX
mode checks skip on Windows; no independent security assurance or production
readiness is established. Use fresh synthetic test state only; never clear or
migrate held state to obtain passing checks.
