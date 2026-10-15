# Mission 04 durable-write failure investigation

The original incident is **not cleared**. A native Windows replacement failure
has been reproduced at the same test, transition and stack, but the original
call's native error and any locking process cannot be recovered from its log.
The approved commit and sealed local.6 archive remain unchanged. This repair
branch is for renewed source review, not publication approval.

## Evidence and attribution

The investigation first read `PUBLICATION-STOPPED.md`, the complete failed
regression log and its validation summary. The original log remains SHA-256
`b7e5cc6b6b98d0f0abb8d9a3e5f6626002f403a3c07e7f8774bdb85c1c5d0f18`.
The nine original validation logs still match their recorded hashes.

The old writer catches native filesystem exceptions and discards their details.
Consequently `DURABLE_WRITE_FAILED` alone does not distinguish an access denial,
sharing conflict, collision, disk failure or another write error. Its demo also
removes its owned temporary directory in `finally`; the original failed state
and its per-file ACL cannot now be inspected. No historical filesystem trace
identifies the original failing operation or process. Do not attribute it to
antivirus, Edge, a permission change or parallel tests as an established fact.

Controlled tests used fresh state only, with no ACL changes:

| Observation | Actual result |
| --- | --- |
| Exact failed customer-trust test, deliberately hold its case-10 state open at revision 6 | Real `renameSync` fails `EPERM`, errno `-4048`; attempted revision 7; same `markPossibleExternalEffect` / `verifyM162EvidenceBundle` stack as the incident |
| Direct Win32 `MoveFileExW(REPLACE_EXISTING)` with an owned reader open | Error 5, `Access is denied`; committed bytes remain intact |
| Close that owned reader and replace fresh synthetic state | Replacement succeeds; before/after DACL strings match; files have `Archive`, not `ReadOnly`, attributes |
| Reader with `ReadWrite` sharing, then reader with `ReadWrite, Delete` sharing | Both replacement controls fail on this host; delete sharing alone did not make this replacement succeed |
| Pre-create the next temporary filename | Native `EEXIST`, errno `-4075`, syscall `open`; old code fails closed but deletes the colliding file |
| Ordinary replacement without a held reader or collision | Succeeds |

These prove possible causes and the collision cleanup defect. They do **not**
prove which cause occurred in the original run. Microsoft's
[CreateFile sharing documentation](https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-createfilea)
describes sharing restrictions; the results above are measurements on this host,
not an inference from the documentation.

The same failed test passed in 20 isolated directories. Three corrected parallel
post-test runs each reported 953 tests: 952 passed and one POSIX skip. Complete
traces contain 1,140 case-10 replacements across 114 distinct state paths, with
no case-10 native error or state path written by multiple processes. Two observed
`connector.lock` EEXIST errors belong to expected `assert.throws` cases elsewhere.
These observations do not rule out a transient external handle in the incident.
Tracing changes timing. Ten empty process-exit traces are retained and are not
used to infer missing events.

Windows reports NTFS healthy with ample free space. Observed parent DACLs grant
Gareth, administrators and SYSTEM access; normal create/write/replace probes
succeeded. These observations neither reconstruct the deleted original file's
ACL nor establish private Windows isolation. Defender was running, but its
operational log had no matching events in the original 18:30–18:35 UTC window.
That neither proves nor rules out a scanner holding a file open.

## Repair

`mission-04-durable-write-repair` starts at approved commit
`807c5faf017bd15e4114594fa9e5296b2a723392` in a new worktree.

The writer now exclusively opens the temporary file with mode `0600`, writes and
fsyncs through that same descriptor, closes it, then uses the existing atomic
replacement and read-back confirmation. Cleanup unlinks only a temporary file
successfully created by that attempt. An EEXIST collision is preserved.

The original error is retained as standard, non-enumerable `Error.cause`, with
its native code, errno, syscall and paths available to a local diagnostic caller.
The public reason code remains fail-closed. Full errors may contain local paths;
the cause is diagnostic data, not a public response field.

No retries, permission relaxation, hold clearing or fallback write path were
introduced. A denied replacement still fails and makes that store unavailable.
The committed reservation remains `RESERVED` after restart. The repair does not
make Windows open-handle replacement succeed or claim to fix the original
unattributed environmental condition.

Two regression tests fail against the original runtime and pass against the
repair. They verify collision preservation, native-cause retention, owned-temp
cleanup, unavailable-store behaviour and unchanged committed reservation bytes.
Real reader/collision controls also pass their expected failure-preservation
assertions on actual Node 24.21.0 and 20.19.0.

## Validation and release boundary

| Check on repaired source | Actual result |
| --- | --- |
| Node 24 full regression | 1,630 total; 1,629 passed; 0 failed; 1 POSIX skip |
| Node 20 compatible regression | 1,565 total; 1,564 passed; 0 failed; 1 POSIX skip; 65 Node-24-only tests excluded |
| Original failed customer-trust test | Passes on both runtimes; this does not clear the incident |
| Build, typecheck, reviewer, public-claims and discovery-site validators | Passed |
| Fresh copied staged-package installs on both runtimes | 54 compiled members compared per runtime; two repair tests and seven security tests passed per runtime; one POSIX security skip |
| Six exact-archive installed checks | Passed on the original sealed archive; these do not test the repaired runtime |
| npm audit and diff whitespace check | Zero advisories; passed |
| Normal release archive guard on repair branch | **Failed**, correctly: `package/dist/src/durable-action-lifecycle.js` differs from the sealed archive |

The guard was not bypassed. Its failure is a release blocker, not a passing
release gate. The final audit and diff checks were run separately after that
guard stopped the release orchestrator. No archive was packed, replaced or
rebuilt; the staged directory install is not exact-archive release validation.

The approved archive remains 156138 bytes, SHA-256
`bb22f8b3cad69e9b00182836adc81cd9b6df6cb9e4e621f0cbe4b4e58405fa10`.
It does not contain this repair. A future distributable repair requires a new
versioned candidate, matching package/release metadata, exact-archive checks and
renewed explicit approval. The existing local.6 archive must be preserved.

No POSIX runtime validation, independent security assurance or production
readiness is established. Synthetic same-host fixtures, fixture authority/keys/
clocks, no record encryption, separate Windows DACL provisioning and same-user/
administrator limitations remain. Website files did not change; the prior
desktop/mobile review is preserved, not presented as a new live-site review.

## Retained records and preservation

The committed [summary](../reports/mission-04-durable-write-investigation/summary.json)
records hashes, absolute local evidence paths, scope and limitations. Raw traces,
controls and all initial diagnostic attempts remain in the buyer-release
worktree under `.atg-evaluation/mission04-investigation/run-20261015/`. Repair
validation and staging logs remain in this new repair worktree under
`.atg-evaluation/mission04-repair-validation/`.

The first diagnostic logger used PID-only filenames; Windows PID reuse caused
four diagnostic exit failures. That logger was corrected to UUID filenames and
the three corrected runs passed. Initial control harness failures (a child
PowerShell module dependency, an incorrect expectation about delete sharing,
and missing instrumentation of the repaired exclusive open) are also retained.
They are not classified as application regressions or silently discarded.

All 3,903 protected original state/download files and all original branch tips
remain unchanged. Divergent local main remains
`8044c65b3ffba8da5ee0bea6eb6933882e3e56e0`. Original failure evidence, archives
and worktrees are retained. Existing ACLs and holds were not changed. No push,
deployment, publication, authentication restart, tag or GitHub Release occurred.
