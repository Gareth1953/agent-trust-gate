# Mission 03 local.5 publication runbook

This is a locally prepared buyer candidate, **not approval to publish**.
Obtain explicit approval of the final `mission-03-buyer-release` commit,
including reviewed Mission 03 ancestors, and this exact archive/hash. The
final release commit is supplied in the task handoff after the local commit.

- Published base: `0dcd8dfcb0583c0d242517764390acde9b244920`.
- Reviewed Mission 03: `327ab2fcae590de89e886abfc12fc181f56f8dac`.
- Archive: `discovery-site/downloads/agent-trust-gate-plugin-0.1.0-local.5.tgz`.
- SHA-256: `672484c3d3ac3e2efe69f2dee66fef465f10700c73c992274a6b1ea382bb2d7e`.
- Size: 154124 bytes. Do not rebuild or replace these reviewed bytes.

The original local main is deliberately divergent at
`8044c65b3ffba8da5ee0bea6eb6933882e3e56e0`. Preserve it, all other mission
branches/worktrees, v1/v2/held state, temporary candidate archives and recorded
evidence. Never reset, force, migrate or merge into that original main.

## Review before any publication

Read [the release report](mission-03-buyer-release.md),
[machine-readable validation](../reports/mission-03-buyer-release/summary.json),
[buyer guide](destination-evidence-evaluation.md), and
[recorded exact-archive proofs](../discovery-site/destination-evidence-results-local.5.json).

```powershell
git status --short --branch
git worktree list --porcelain
git rev-parse mission-03-buyer-release
Get-FileHash discovery-site/downloads/agent-trust-gate-plugin-0.1.0-local.5.tgz -Algorithm SHA256
npm run validate:plugin-release
$env:ATG_NODE20_PATH = 'C:\Users\Gareth\agent-trust-gate\.atg-evaluation\mission-02-node20\node.exe'
npm run validate:mission-03-buyer-release
```

The validation command never repacks the candidate and retains fresh test
state/logs. It checks actual Node 20 and Node 24, installed Mission 03 exports,
CLIs, signatures/replay/fencing/crashes, legacy SDK/CLI/MCP, all five archive
checksums, preserved Challenge/local.4 recording and source/byte stability.
Check all working trees before publication and require the approved branch
to equal the approved final commit. Stop on unreviewed files or divergence.

GitHub laptop authentication is unresolved. Do not restart browser login as
part of this runbook without a new user instruction. Use a separately
authorised route/machine with verified repository write access; never display
credentials. If transferring locally, a branch-only Git bundle may be created
after the user requests it. Bundle verification is not publication approval.

## Only after explicit approval

1. Verify origin is `https://github.com/Gareth1953/agent-trust-gate.git`, fetch
   noninteractively, and require remote main still equals the published base
   above. Stop if it changed; do not reset or force.
2. Require `origin/main` to be an ancestor of the exact approved candidate,
   and the reviewed Mission 03 commit to be its ancestor. Recheck archive,
   checksums, old downloads, Challenge and recorded public proofs.
3. Preserve divergent original main. A normal branch-to-main refspec publishes
   the reviewed history without changing that local main:

   ```powershell
   git merge-base --is-ancestor origin/main mission-03-buyer-release
   git merge-base --is-ancestor 327ab2fcae590de89e886abfc12fc181f56f8dac mission-03-buyer-release
   git push origin mission-03-buyer-release:main
   ```

   Run the push only after exact commit/hash approval and verified authorised
   access. Do not run `git push origin main` from the preserved divergent main.
   Alternatively, on an authorised clean publication checkout based on the
   verified remote main, fast-forward its main to the exact approved candidate
   using `git merge --ff-only`, then normal `git push origin main`.
4. A main push containing the static changes automatically starts **Deploy
   discovery Pages**. Monitor the exact approved-commit workflow through
   completion. Manual dispatch is also publication and needs explicit approval.
   No registry publication, force push, tag or separate GitHub Release.

## Verify after approved deployment

Require remote main and the successful workflow to identify the exact approved
commit. Confirm the Pages artifact and hosted bytes, not merely a cached page:

- `https://agenttrustgate.com/plugin.html`
- `https://agenttrustgate.com/downloads/agent-trust-gate-plugin-0.1.0-local.5.tgz`
- `https://agenttrustgate.com/downloads/SHA256SUMS`
- `https://agenttrustgate.com/destination-evidence-results-local.5.json`
- `https://agenttrustgate.com/schemas/destination-evidence.synthetic.v1.schema.json`
- Retained local.2/local.3/local.4 downloads, local.4 worker recording and
  `https://agenttrustgate.com/challenge.html` / `challenge-results.json`.

Download live local.5 to a **fresh** path and independently calculate its
SHA-256. Require the exact approved hash above and matching published checksum.
Install those downloaded bytes in fresh projects on actual Node 24 and Node
20. Run `scripts/test-installed-destination-evidence.mjs --archive LIVE_ARCHIVE`
on Node 24 with the preserved actual Node 20 path configured; it prints a
retained public verification directory. Then run the same helper on actual
Node 20 with `--archive LIVE_ARCHIVE --public-case THAT_PUBLIC_DIRECTORY`.
Also run `scripts/test-standalone-plugin-package.mjs --archive LIVE_ARCHIVE`
on both actual runtimes with `npm_execpath` pointing to a compatible npm CLI.
Do not replace installed Node or regenerate the approved archive.

Verify visible Node floors, explicit fresh setup, no v1/v2 reset/migration,
UNKNOWN/no-retry handling, fixed-clock and separately signed same-host,
one-machine synthetic limits. No independent external capture,
host-administrator protection or live partner integration may be claimed.

Record commit, workflow/result, deployed URL, independently verified live hash,
actual installed checks and final Git status. On any failure stop distribution
and report it; do not replace a versioned download or delete held state.
