# Mission 01 — buyer release candidate

Prepared on local `main` from reviewed commit `3f46e8640fdfdf117e05106a6ddf9659d678c1ca` in `Gareth1953/agent-trust-gate`. Nothing has been pushed, published, uploaded, tagged or released. Gareth’s approval is the remaining publication gate.

## Candidate and integrity

- Version: **0.1.0-local.3**, following the existing local evaluation edition convention.
- Archive: [agent-trust-gate-plugin-0.1.0-local.3.tgz](../discovery-site/downloads/agent-trust-gate-plugin-0.1.0-local.3.tgz).
- SHA-256: `62086a6cf7740ff72dafa81b821097d593b262ec019481654fb84caca5b673f0`.
- [Checksum manifest](../discovery-site/downloads/SHA256SUMS) includes all three editions. Published local.1 and local.2 bytes/hashes remain unchanged.
- The archive contains 50 files: 46 compiled runtime/declaration files plus metadata, README, licence and synthetic authority module. Compiled files and packaged README/fixture source match the reviewed build. Tests, logs, worktrees and live credentials are excluded.

The plugin uses the existing GatePass/core authority. Its purchase-order approval carries the exact signed business-state binding; the destination checks it again at synthetic commit and reconciliation. State changes, including a commit race, cannot silently become new approval. UNKNOWN exposure and replay denial retain the reviewed recovery behaviour.

Approvals, signing keys and time are fixtures. Destination records and evidence are same-host data. Controls are single-process. There is no live ERP integration, distributed safety, independently sourced external outcome evidence or production readiness.

## Files changed

- `src/standalone-plugin.ts` and `scripts/build-standalone-plugin.mjs`: local.3 version, shared runtime/package version source; existing packaging mechanism retained.
- `scripts/test-standalone-plugin-package.mjs` and new `scripts/plugin-installed-state-binding-smoke.mjs`: optional exact-archive installation, SDK/CLI/MCP smoke, signed digest/tampering checks, state change, commit race, acknowledgement loss/restart and invalid recovery evidence.
- `scripts/run-atg-challenge.mjs` and `discovery-site/challenge-results.json`: refreshed through the existing runner; records version, approved snapshot/binding, signed GatePass and observed results.
- New local.3 archive and `downloads/SHA256SUMS`; download/install links in README, plugin/home pages and technical guides now target local.3.
- Plugin/Challenge/home copy and technical guides: implemented signed-state checks plus explicit synthetic limitations; old “snapshot is not signed” wording removed from current surfaces.
- `docs/P3-M163-public-claims-evidence-register.json`: bounded state-binding claim points to its actual tests.
- New `scripts/validate-plugin-release.mjs` and package command: checks metadata, hashes, compiled bytes, current links and Challenge signatures/outcome bindings.
- `.github/workflows/deploy-discovery-pages.yml`: Pages artifact must include the plugin/Challenge/current archive; all archive checksums are verified before upload.
- `.gitignore`: excludes the preserved nested worktree from repository-wide file scans. No worktree or mission branch was deleted or altered.
- README archive URL test, candidate changelog, verification report, this runbook and [machine-readable results](../reports/mission-01-buyer-release/summary.json).

## Actual validation

| Check | Result |
| --- | --- |
| `npm test`, including posttest | 675 + 880 = **1,555 passed**, zero failures |
| `npm run test:plugin` | **42/42 passed**, plus fresh-project installation, SDK, CLI and MCP |
| Exact checked-in archive installation | **42/42 passed** plus all five installed connector scenarios and signature tampering checks |
| `npm run typecheck` | Exit 0 |
| `npm run reviewer` | Exit 0 |
| `npm run demo:challenge` | Exit 0; three cases passed |
| `npm run validate:public-claims` | Exit 0 |
| `npm run validate:discovery-site` | Exit 0 |
| `npm run validate:plugin-release` | Exit 0; three hashes, 46 compiled files, links and three signed Challenge approvals verified |
| Existing `plugin:pack` with workspace cache | Exit 0 |
| `git diff --check` | Exit 0; line-ending conversion notices only |

The initial original-checkout run had 14 existing scans fail with EISDIR on the preserved nested repository. Ignoring `.worktrees/` fixed the workspace enumeration issue; no test or product authority check was weakened. The full rerun passes. Full command output remains in ignored local logs beside the summary.

Reproduce the exact candidate check:

```powershell
npm run test:plugin -- --archive discovery-site/downloads/agent-trust-gate-plugin-0.1.0-local.3.tgz
npm run validate:plugin-release
```

The checked-in archive is the approved candidate. Do not replace it with a new build without updating its checksum and repeating exact-archive validation. For pre-publication evaluation, install its absolute local path; the website URL becomes available only after approved deployment.

## Publication steps — only after Gareth approves

**Pushing this main commit also triggers website publication automatically.** The existing `Deploy discovery Pages` workflow watches `main` changes under `discovery-site/`, builds `_site`, copies the entire downloads directory and evidence, verifies checksums, uploads the Pages artifact and deploys it. No separate npm registry publication, GitHub tag, GitHub Release or manual archive upload is needed.

1. In the original checkout, verify `main`, the approved release commit, clean status, both preserved mission branches and the integration worktree. Inspect the release commit with `git show --stat HEAD`. Run `git fetch origin` to refresh remote state without changing files.
2. Run `git merge-base --is-ancestor origin/main main`. Continue only on exit 0. If remote main diverged, status changed or the approved commit differs, stop; do not force, reset or resolve divergence automatically.
3. After those checks and explicit publication approval, publish the repository commit:

   ```powershell
   git push origin main
   ```

4. In `Gareth1953/agent-trust-gate` → Actions → **Deploy discovery Pages**, verify that the run is for the approved commit and that both build and deploy jobs succeed. The checksum check runs before artifact upload. If the push-triggered run did not start, the workflow also supports manual **Run workflow** on `main`; do not dispatch a different/unapproved commit. Respect any configured GitHub environment approval.
5. Confirm the deployed plugin/home/Challenge pages show local.3 and signed-state wording. Verify these exact endpoints: `/downloads/agent-trust-gate-plugin-0.1.0-local.3.tgz`, `/downloads/SHA256SUMS`, `/challenge-results.json`. The recorded evidence must have `pluginVersion` equal to `0.1.0-local.3` and `passed` equal to `true`.
6. Check the deployed archive bytes against the approved hash, then install that deployed archive in a fresh project:

   ```powershell
   $atgPublishedArchive = New-TemporaryFile
   Invoke-WebRequest -Uri 'https://agenttrustgate.com/downloads/agent-trust-gate-plugin-0.1.0-local.3.tgz' -OutFile $atgPublishedArchive.FullName
   $atgPublishedHash = (Get-FileHash -LiteralPath $atgPublishedArchive.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
   if ($atgPublishedHash -ne '62086a6cf7740ff72dafa81b821097d593b262ec019481654fb84caca5b673f0') { throw 'Published archive differs from approved candidate' }
   npm run test:plugin -- --archive $atgPublishedArchive.FullName
   ```

No technical release blocker remains in the bounded local evaluation scope. Publication approval, refreshed remote ancestry and successful Pages deployment/served-byte verification are required before calling this candidate published. Both mission branches and the integration worktree are retained; `.worktrees/` is now ignored rather than removed.
