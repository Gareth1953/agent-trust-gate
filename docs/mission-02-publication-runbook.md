# Mission 02 local.4 publication runbook

This is a prepared candidate, not permission to publish. Obtain Gareth's explicit approval of the final release commit and this exact archive/hash before any merge, push or deployment. Mission 02 core/review commits are still local; approval to push must cover those ancestor commits as well.

## Review locally

Branch: mission-02-buyer-release. Base: 56cd3707c767f9e40d211617ad9b4b17867f9419. Archive:

discovery-site/downloads/agent-trust-gate-plugin-0.1.0-local.4.tgz

SHA-256:

164a25d41fdda287c4da265f7511802af4f358e7a3f5460395d6bf9377a66800

~~~powershell
git status --short
git log -1 --format=fuller
git diff 56cd3707c767f9e40d211617ad9b4b17867f9419 mission-02-buyer-release --stat
Get-FileHash discovery-site/downloads/agent-trust-gate-plugin-0.1.0-local.4.tgz -Algorithm SHA256
npm run validate:plugin-release
~~~

Inspect the [release report](mission-02-buyer-release.md), [validation summary](../reports/mission-02-buyer-release/summary.json), [worker evidence](../discovery-site/multi-worker-results-local.4.json) and [buyer guide](shared-worker-evaluation.md). Compare old archive hashes too; local.2/local.3 and the existing Challenge must remain unchanged. Preserve mission branches/worktrees and all v1/v2 state.

To rerun the full candidate checks, use Node 24+ and set ATG_NODE20_PATH to an isolated actual Node 20 executable:

~~~powershell
$env:ATG_NODE20_PATH = 'C:\path\to\temporary-node20\node.exe'
node scripts/validate-mission-02-buyer-release.mjs
~~~

The prepared workspace has a checksum-verified Node 20.19.0 under .atg-evaluation/mission-02-node20/node.exe. For another machine, use a temporary official runtime and verify its official checksum; do not replace the installed runtime. The script checks the actual version and installs the exact staged archive on both runtimes, without repacking it or overwriting the recorded public evidence. It also checks the preserved archive/Challenge hashes.

Buyer reproduction, from a fresh project:

~~~powershell
npm init -y
npm install C:\path\to\agent-trust-gate-plugin-0.1.0-local.4.tgz
npx --no-install atg-plugin --help
npx --no-install atg-multi-worker --state C:\ATG-Evaluation\new-shared-run-001
~~~

The parent C:\ATG-Evaluation must already exist, and the run directory must not exist. The shared command requires Node 24+, retains databases/results.json and refuses existing state. Legacy atg-plugin works on Node 20. No v1 migration/reset is part of this release.

## Only after explicit approval

1. Fetch origin and inspect remote main versus local main and the approved release commit. Verify the remote is Gareth1953/agent-trust-gate, all working trees are clean and no unexpected divergence exists. Stop on changed/unreviewed state; do not reset or force.
2. Confirm local main can fast-forward to the approved mission-02-buyer-release commit. Merge only with --ff-only, preserving all branches/worktrees/state.
3. Recheck the approved archive hash, checksum manifest, old archives and retained Challenge after the merge. Do not rebuild/replace the approved archive.
4. Publish only through the approved normal main push, with no force, npm registry publication, tag or separate GitHub release unless separately authorised.

**A push to main containing discovery-site changes automatically triggers the existing Deploy discovery Pages workflow.** This is the publication boundary, not a harmless remote backup. The workflow copies discovery-site (including all preserved/new downloads and recorded evidence), verifies checksums/required files, uploads the Pages artifact and deploys it. Manual workflow_dispatch is also publication and requires approval. See [the workflow](../.github/workflows/deploy-discovery-pages.yml).

## After approved deployment

Verify the workflow succeeded and the hosted candidate endpoints resolve:

- https://agenttrustgate.com/plugin.html
- https://agenttrustgate.com/downloads/agent-trust-gate-plugin-0.1.0-local.4.tgz
- https://agenttrustgate.com/downloads/SHA256SUMS
- https://agenttrustgate.com/multi-worker-results-local.4.json
- Existing local.2/local.3 archive URLs and https://agenttrustgate.com/challenge.html

Download the hosted archive to a fresh path, verify the exact approved SHA-256, and repeat fresh-project install checks on actual Node 20 and Node 24. Confirm the source, Pages artifact and hosted bytes match; cached/CDN content must not be mistaken for the new version. Verify the buyer demo, Node floor, v2/no-migration guidance and explicit synthetic/same-host/one-machine boundaries remain visible.

Record the approved commit, deployed workflow run, hosted checksum and post-deployment observations. If any check fails, stop distribution and report it. Do not overwrite an existing versioned archive; corrective package changes need a new reviewed version. Never delete/reset held shared state as a rollback strategy.
