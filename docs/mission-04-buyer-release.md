# Mission 04 buyer release preparation — local.6

Status: **unpublished candidate, ready for Gareth and Dave's review**. No merge,
push, tag, GitHub Release, deployment, registry publication or authentication
restart is authorised or performed. The final exact local commit is reported
in the task handoff; the branch is `mission-04-buyer-release`.

## Source and preservation

Started from clean `review/mission-04-windows` at exact
`be72c69097c3faca1e5b2f91369e68b8aa777aba`. Verified its reviewed ancestry:
`8ca808a` (signing/POSIX fixes), `b94fe63` (Windows assessment), `ed7dd12`
(private-parent test), `5b0fb7c` and `be72c69` (website review). The new
release branch and worktree names were absent before creation. Original main
and the five existing worktrees were preserved; none was reset or moved.

A pre-change fingerprint covers 3,903 existing evaluation-state/download files
across all five original worktrees. The full baseline is retained locally at
`.atg-evaluation/mission04-release-preparation/preservation-baseline.json`;
its verification result is recorded in preservation.json. This is a bounded
integrity check, not a claim to have hashed every user file. Test commands
write only new release-worktree state or fresh temporary projects/profiles.
The original review worktree remains at be72c69. Historical Challenge,
local.4 worker and local.5 destination recordings in this release checkout
also remain unchanged. No held state, keys or databases were migrated/reset.

## Sealed archive

- Filename: `agent-trust-gate-plugin-0.1.0-local.6.tgz`.
- Repository location: `discovery-site/downloads/agent-trust-gate-plugin-0.1.0-local.6.tgz`.
- Size: **156138 bytes**.
- SHA-256: `bb22f8b3cad69e9b00182836adc81cd9b6df6cb9e4e621f0cbe4b4e58405fa10`.
- Five older versioned archives remain byte-identical. The draft checksum
  manifest appends one local.6 entry; it does not rewrite their entries.

The candidate was built once in fresh temporary staging and copied with an
exclusive no-overwrite operation. All subsequent checks installed these exact
bytes; no validation repacks it. The release byte validator compares 54
compiled runtime/declaration members with the reviewed build and checks
bundled authored files with Windows line-ending normalisation. It rejects
links, path traversal, duplicate members and accidental state/private-key files.
Package metadata remains private and is not an npm registry release.

The only runtime delta from the reviewed Windows parent is the plugin version
constant. The reviewed own-JSON-field signing fix and POSIX new-directory 0700 /
atomic-temp-file 0600 requests are inherited unchanged. Added bundled
SECURITY.md and RELEASE-NOTES.md make those controls and their limits explicit.
Legacy public receipt fixture signatures still verify; newly injected own
__proto__ fields fail the installed signature/action checks.

Updated README/guides, release notes, draft download links and Security & Trust
copy distinguish unpublished local.6 from published, unchanged local.5. A
new local.6 destination observation is captured from the exact installed
archive. The old local.5 record is neither relabelled nor regenerated. The
release validator verifies both records against their own archive hashes and
pinned public proofs. The draft Pages workflow requires the local.6 archive,
new recording and security page before artifact upload; Actions was not run.

## Actual validation

Actual runtimes: **Node 24.21.0** and preserved **Node 20.19.0**. Node 20 SHA-256:
`6e3a39787e667d50487f7335c85636c2823a53e636d73c2c841d45da4e57906c`.
`npm ci --ignore-scripts` completed in the new worktree.

| Check | Actual result |
| --- | --- |
| Full Node 24 regression | 1,627 passed, zero failures, one POSIX-only skip (1,628 total) |
| Node 20 compatible regression | Main 675 passed; compatible posttest 887 passed, zero failures, one POSIX-only skip (1,563 total; 1,562 passed) |
| Node 20 exclusions | 65 Node-24-only multi-worker/destination tests, explicitly listed by file in raw summary; their functionality is tested on Node 24 |
| Installed Mission 04 security, both actual runtimes | Each seven passed, zero failures, one POSIX-only skip; runtime imports resolve only into the installed exact archive |
| Installed Windows DACL observation, both runtimes | Initial, fsynced temporary and replacement files inspected in fresh stores; successful probe is not a private-ACL claim |
| Installed legacy SDK/CLI/MCP, both runtimes | Passed; five signed state-binding/change/commit-race/recovery scenarios on each |
| Installed Node 24 shared workers | Seven coordinated packaged process scenarios passed |
| Installed destination on Node 24 | Eight CLI scenarios and 35 installed-runtime cases passed, including actual Node 20 restricted public verification |
| Installed destination on Node 20 | Public verifier passed with writes and authority/private-key reads denied; optional Node 24 setup/exports reject without creating state; legacy root remains usable |
| Typecheck, reviewer, public claims, discovery site | Passed |
| Exact archive bytes/checksums/links/public evidence | Passed; six manifest entries, 54 compiled members, historical plus candidate proofs |
| Final website static checks | 20 passed after the CSS change |
| npm audit | Zero reported advisories; not a vulnerability-free assurance |

[Raw validation summary](../reports/mission-04-buyer-release/validation/run-Y7EEHr/summary.json),
[installed summaries](../reports/mission-04-buyer-release/installed-checks.json),
and the initial failed run are retained with log hashes. After the README-only
correction, the already passing installed checks were reused only after archive
SHA, actual runtime identities and original log hashes matched; the full
regression and remaining gates reran. The archive was never regenerated.

## Browser review and concrete correction

Installed `Edg/155.0.4283.45`, headless with a fresh TEMP profile,
served only by a 127.0.0.1 preview server. No normal profile, software install,
persistent browser-settings change or live deployment was used. All three
changed pages (index, plugin, security) were checked at 1440x900, 390x844 and
320x844. Every final requested layout width equals its viewport, with no
page-level horizontal overflow. All local page-link clicks passed: 17 security,
24 plugin and 23 index links per viewport, **192 clicks total**, plus keyboard
skip links. Mobile Menu button open/close and Escape/focus restoration passed.
Local download/checksum links returned 200 and served local.6 bytes with the
sealed SHA-256. External destinations/email were not activated.

The initial mobile plugin page genuinely widened to 534px at a requested
390px width: its grid item's long install command set an unwanted minimum
width, clipping adjacent copy and affecting pointer coordinates. Fixed with
`.split > * { min-width: 0; }`. Subsequent full interactions and focused
captures passed. Preformatted commands and homepage tables still intentionally
scroll inside their own containers; the detail run verified no uncontained
overflow. The CSS fix is outside the package and did not change archive bytes.

Directly inspected desktop full-page captures, changed release/install panels
at every viewport, both mobile footers and 320px menus. Labels and security
limits are readable, with no visible clipping/overlap in those inspected areas.
Full mobile captures are retained with raw metrics; this is a bounded
changed-page review, not a full audit of all historical homepage content.
See [visual assessment and image hashes](../reports/mission-04-buyer-release/website/assessment.json).
The full interaction run is edge-5WJgXg; focused captures are edge-rmZuTD.
Only the non-blocking absent favicon request returned 404; no final application
JavaScript exception was observed. Owned Edge processes/preview servers were
closed; fresh profiles and test state are retained.

## Failures recorded and resolved

The first full Node 24 run had five claim-copy failures. The README said
"No independent assurance or production readiness is claimed"; existing
negative-claim regexes matched the unqualified trailing phrase. Reworded the
new README sentence without weakening tests. The final full suite passed.

The first expanded browser runner incorrectly attempted a pointer click on
the intentionally off-screen skip link. It now uses the existing keyboard
check for that link. The next mobile plugin pointer failure exposed the real
grid overflow described above. All initial logs/results/screenshots are
retained alongside final evidence; no mobile pass was inferred from source.

## Unresolved limits and release handling

POSIX permission assertions skip on Windows. The supplied earlier Mission 04
POSIX review covers the same source requests, but this task does not claim a
new POSIX runtime isolation test of the final archive. NTFS ACLs must be
provisioned separately on a new private parent and verified through replacement;
ATG does not enforce them. Existing workspace/held-state ACLs were not changed.
The prior authorised private-parent test is reviewed ancestry, not a blanket
client-data approval. Same-user/administrator access, backup/restore, encryption,
real key custody/identity/trusted clocks and partner enforcement remain gaps.

All approval/operator authority, approval keys and clocks remain fixtures;
the separate destination evaluation key and records remain on one machine.
No ATG record encryption, independent external capture, independent security
assurance, live ERP/payment integration, physical mobile/Safari, screen-reader
or complete contrast/zoom audit, customer validation or production readiness
is established. Never retry UNKNOWN actions blindly or clear held exposure.

Remote/authentication/deployment state was not inspected or changed. Draft
copy intentionally remains unpublished/not-live. Publication requires separate
exact-commit/hash approval and a reviewed status-wording transition; do not
deploy this draft as though a live release has already occurred. See the
[publication runbook](mission-04-publication-runbook.md). It preserves divergent
original main and requires fresh remote-history verification on a separately
authorised route. No push, workflow dispatch, tag or Release is part of this task.
