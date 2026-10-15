# Mission 04 local.6 publication runbook

This is an **unpublished local candidate for Gareth and Dave's review**, not
permission to publish. The exact final release-preparation commit is reported
in the task handoff; resolve `mission-04-buyer-release` and compare it with
that full hash before approval. No tag, GitHub Release or registry publication
has been created. No authentication was started or restarted.

- Reviewed signing/POSIX fix: `8ca808a05afd46f2c034f9ced613b9929d11710d`.
- Reviewed Windows/browser parent: `be72c69097c3faca1e5b2f91369e68b8aa777aba`.
- Candidate: `discovery-site/downloads/agent-trust-gate-plugin-0.1.0-local.6.tgz`.
- Size: **156138 bytes**.
- SHA-256: `bb22f8b3cad69e9b00182836adc81cd9b6df6cb9e4e621f0cbe4b4e58405fa10`.
- Published local.5 retained hash: `672484c3d3ac3e2efe69f2dee66fef465f10700c73c992274a6b1ea382bb2d7e`.

The candidate is sealed. Do not rerun the preparation/packing command to
replace it. Install and validate these exact bytes. All local.1–local.5
archives, old signed recordings and held evaluation state must be retained.

## Local review, without publication

Read [release preparation](mission-04-buyer-release.md),
[validation summary](../reports/mission-04-buyer-release/summary.json),
[package security boundary](mission-04-package-security.md), and the new
[local.6 exact-archive observations](../discovery-site/destination-evidence-results-local.6.json).

Run from this new release worktree:

```powershell
git status --short --branch
git worktree list --porcelain
git rev-parse mission-04-buyer-release
git merge-base --is-ancestor be72c69097c3faca1e5b2f91369e68b8aa777aba mission-04-buyer-release
Get-FileHash -Algorithm SHA256 discovery-site/downloads/agent-trust-gate-plugin-0.1.0-local.6.tgz
node scripts/validate-plugin-release.mjs
$env:ATG_NODE20_PATH = 'C:\Users\Gareth\agent-trust-gate\.atg-evaluation\mission-02-node20\node.exe'
npm run validate:mission-04-buyer-release
node scripts/review-mission-04-release-pages.mjs
```

Validation creates fresh retained test state and logs, never repacks the
archive, and runs actual Node 24/20. The optional --reuse-installed mode is
only for an already passing installed-check log against identical archive
bytes and actual runtime identities; a default run performs fresh installs.
Historical Mission 02/03 source-release validators belong to their original
checkouts; the Mission 04 command is the current local.6 gate.

## Gates before a separately authorised publication phase

1. Gareth and Dave review the exact candidate commit, archive hash, initial
   failures/corrections and unresolved limits. Request explicit approval for
   the exact future publication commit and bytes; current approval is local
   preparation only.
2. The current website copy intentionally says unpublished and not a live
   release. Prepare any publication-status-only wording change for separate
   review, rerun changed-page validators/visual checks, and obtain approval
   for its final exact commit. Keep this archive unchanged; bundled notes
   remain the preparation-time provenance snapshot. Do not silently relabel
   the draft as a completed publication.
3. Use a separately authorised clean publication checkout/machine. Verify
   repository origin is https://github.com/Gareth1953/agent-trust-gate.git and
   noninteractively inspect the actual remote main. The last documented
   published Mission 04 source baseline is e8d398b7165c3bf8f6df23809fadb9b2b127b92d;
   remote state was **not fetched or verified in this session**. Stop if it
   differs from the agreed publication base or history conflicts; do not
   reset, force, rebase or merge into the preserved divergent original main.
4. Require that agreed remote main and the reviewed Windows parent are
   ancestors of the exact approved publication commit. Require a clean
   publication checkout and unchanged archived bytes, checksum entries and
   retained local.3/.4/.5 recordings. Preserve original main at
   8044c65b3ffba8da5ee0bea6eb6933882e3e56e0 and all original worktrees/held state.
5. Do not restart authentication. If existing authorised repository access
   is unavailable, stop and report the blocker; use a newly authorised route
   only on a separate user instruction. Transfer by a Git bundle only if
   requested, and verify its refs/commit/history without force.
6. Only explicit publication authorisation can permit a normal fast-forward
   update of remote main from the exact approved history. A main push that
   includes these files triggers **Deploy discovery Pages** automatically;
   workflow_dispatch is also publication. That workflow also sends IndexNow
   notifications. None of those actions is authorised or performed here.
   No force push, npm publish, tag or GitHub Release is part of this runbook.

## Verify only after an approved deployment

Require the successful workflow and remote main to identify the approved
commit. Verify the deployed artifact includes security.html, the local.6
archive/recording and all six manifest entries. The draft workflow now checks
these before upload, but this local task did not execute Actions or deployment.

From a fresh download directory, independently verify the hosted bytes:

- https://agenttrustgate.com/downloads/agent-trust-gate-plugin-0.1.0-local.6.tgz
- https://agenttrustgate.com/downloads/SHA256SUMS
- https://agenttrustgate.com/destination-evidence-results-local.6.json
- https://agenttrustgate.com/plugin.html and /security.html and the home page
- All old versioned downloads and local.3/.4/.5 recordings.

Require the approved size/SHA-256, not a filename or cached page alone. Install
those downloaded bytes into new projects using actual Node 24 and Node 20;
run the installed-security helper and legacy package helper with --archive.
For the destination helper pass --expected-version 0.1.0-local.6 on both
runtimes and, on Node 20, --public-case pointing to public inputs retained by
the Node 24 run. Keep the actual Node 20 executable pinned; do not replace
installed Node, regenerate keys as recovery, remove UNKNOWN holds, reset or
migrate old state, or rebuild a versioned archive to hide a failure.

Record live commit, workflow result, URLs, hashes, installed checks and visible
status wording. A future publication does not remove synthetic same-host,
fixture-key/clock, no-encryption, Windows ACL, administrator/same-user or
independent-assurance limitations. Stop distribution and preserve evidence on
any discrepancy; obtain new review for changed bytes or scope.
