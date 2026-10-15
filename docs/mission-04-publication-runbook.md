# Mission 04 local.7 publication runbook

This is an unpublished candidate for Gareth and Dave's renewed review. This
runbook does not authorise a push, deployment, publication, tag or GitHub Release.
Use the exact final candidate commit and archive hash in the handoff/summary.
Prior approval of local.6 does not approve local.7.

- Candidate branch: `mission-04-local7-buyer-release`.
- Reviewed parent: `ce7259ad05d4f82cc0c865ea213ba90d9020d34a`.
- Reviewed signing/POSIX ancestor: `8ca808a05afd46f2c034f9ced613b9929d11710d`.
- Reviewed Windows/browser ancestor: `be72c69097c3faca1e5b2f91369e68b8aa777aba`.
- Candidate: `discovery-site/downloads/agent-trust-gate-plugin-0.1.0-local.7.tgz`.
- Exact size: **157102 bytes**.
- SHA-256: `dcf75970db520fdd10afea63aa1a9d20780dc12a053c8e09f49b0f21ed1dddad`.
- Sealed archive record: `reports/mission-04-local7-buyer-release/archive.json`.
- Retained unpublished local.6: 156138 bytes, SHA-256
  `bb22f8b3cad69e9b00182836adc81cd9b6df6cb9e4e621f0cbe4b4e58405fa10`.
- Published local.5 retained SHA-256:
  `672484c3d3ac3e2efe69f2dee66fef465f10700c73c992274a6b1ea382bb2d7e`.

Read [local.7 preparation](mission-04-local7-buyer-release.md),
[the validation summary](../reports/mission-04-local7-buyer-release/summary.json),
[the durable-write investigation](mission-04-durable-write-investigation.md),
[the package security boundary](mission-04-package-security.md), and
[local.7 exact-archive observations](../discovery-site/destination-evidence-results-local.7.json).
The original Windows incident remains unattributed. The matching EPERM control
and separately fixed cleanup defect are not proof of its original cause.
Passing reruns do not clear it. No permission relaxation or automatic retry is
included. All limitations in these documents remain material review inputs.

## Local verification

From this candidate worktree, with the preserved actual Node 20 executable:

```powershell
git status --short --branch
git worktree list --porcelain
git rev-parse mission-04-local7-buyer-release
git merge-base --is-ancestor ce7259ad05d4f82cc0c865ea213ba90d9020d34a mission-04-local7-buyer-release
Get-FileHash -Algorithm SHA256 discovery-site/downloads/agent-trust-gate-plugin-0.1.0-local.7.tgz
$env:ATG_NODE20_PATH = 'C:\Users\Gareth\agent-trust-gate\.atg-evaluation\mission-02-node20\node.exe'
npm run validate:mission-04-local7-buyer-release
npm run review:mission-04-local7-pages
```

The validator does fresh exact-archive installations on actual Node 24/20 and
runs full/compatible regressions, security/repair cases, native Windows controls,
ACL observations, legacy SDK/CLI/MCP, destination evidence, reviewer/claim/site
validators, all seven archive checksums, compiled-member comparison and audit.
Node 20 excludes only the 65 existing Node-24-only worker/destination tests;
its restricted public verifier is still exercised. POSIX tests skip on Windows.
New test projects, temporary browser profiles and logs are retained. Browser
DOM checks alone do not constitute direct screenshot inspection.

Never run the candidate packing command again for an existing version. Stop on
changed bytes, failed checks, unexpected state, branch divergence or a changed
reviewed history. Do not retry a failed validation merely to suppress evidence;
diagnose failures and retain every run. Never reset, rebase, force, clear holds,
migrate state, change existing ACLs or replace an archive to obtain a pass.

## Gates for a future separately authorised publication

1. Review the final candidate commit, exact bytes, actual checks, original
   incident limitation and retained failure evidence. Local.7 has no publication
   authorisation yet. Any new source or archive requires renewed review.
2. Current website copy intentionally says unpublished/not live. Prepare any
   status-only publication wording first, run its relevant validators and browser
   checks, and obtain approval for the resulting exact publication commit while
   keeping this sealed archive unchanged. Do not silently relabel the candidate
   or treat a successful local test as deployment. If approval explicitly names
   the existing candidate-copy commit for publication, report that visible copy
   accurately; never infer permission to change its approved commit.
3. Preserve original divergent local main at
   `8044c65b3ffba8da5ee0bea6eb6933882e3e56e0` and every original branch/worktree.
   Use the separately approved clean buyer-release checkout. Verify origin is
   `https://github.com/Gareth1953/agent-trust-gate.git`, existing authentication,
   repository identity and authorised write access noninteractively. If auth
   fails, stop; do not restart login or change credentials.
4. Only after explicit publication approval, fetch origin without force, tags or
   pruning. The last verified remote main from the stopped publication attempt
   was `e8d398b7165c3bf8f6df23809fadb9b2b127b92d`; this preparation does not fetch
   or verify current remote state. Require that exact agreed base and reviewed
   repair parent to be ancestors of the approved final commit. Stop if remote
   base differs or history conflicts. Do not merge into preserved local main.
5. Recheck clean worktrees, exact candidate size/hash, seven manifest entries,
   local.1–local.6 archive bytes and local.3/.4/.5/.6 recordings. The historical
   local.6 runbook and investigation records remain provenance, not new approval.
6. Only explicit approval permits a normal fast-forward push from the exact
   reviewed buyer-release branch to `refs/heads/main`. Do not push preserved
   divergent local main. No force, npm registry publication, tag or separate
   GitHub Release. A main push triggers **Deploy discovery Pages** automatically,
   including IndexNow notifications; workflow_dispatch is also publication and
   is not authorised by this local preparation.

## Verification after a future approved deployment

Require successful workflow/deployment and remote main to identify the exact
approved publication commit. Save workflow URL, head SHA and deployment status.
Do not equate queued workflow, successful build or filename with deployment.
The Pages artifact guard requires security.html, local.6/local.7 archives and
recordings and verifies the complete checksum manifest before upload.

Fetch these into a fresh directory and verify canonical live bytes, not names:

- `https://agenttrustgate.com/downloads/agent-trust-gate-plugin-0.1.0-local.7.tgz`
- `https://agenttrustgate.com/downloads/SHA256SUMS`
- `https://agenttrustgate.com/destination-evidence-results-local.7.json`
- `/plugin.html`, `/security.html`, `/` and their local assets
- All retained local.1–local.6 archives and local.3/.4/.5/.6 recordings.

Require the approved exact size/SHA-256 and seven manifest entries. From the
reviewed checkout, pass the downloaded archive path to each helper below using
actual Node 24 and actual Node 20, with `npm_execpath` set to the installed npm
CLI and `ATG_NODE20_PATH` pinned to the preserved executable:

- `scripts/test-installed-mission-04-local7-security.mjs --archive LIVE_ARCHIVE`
  (includes installed repair tests and real native Windows failure controls).
- `scripts/test-standalone-plugin-package.mjs --archive LIVE_ARCHIVE`.
- `scripts/test-installed-destination-evidence.mjs --archive LIVE_ARCHIVE --expected-version 0.1.0-local.7`;
  on Node 20 also pass `--public-case NODE24_PUBLIC_INPUTS_DIRECTORY` from the
  fresh Node 24 summary. Public inputs only; never grant private-key access.

Check the deployed changed pages at desktop, 390px and 320px using installed
Edge with a new temporary profile. Record observed overflow, clipping, readable
limits, links and Menu open/close/Escape behaviour; never use Gareth's normal
profile or mark physical-device/accessibility checks passed without evidence.
Stop distribution and preserve evidence on discrepancies; obtain renewed review
for changed scope or bytes. Do not regenerate keys as recovery or alter holds.
No deployment removes synthetic/same-host/fixture-key/clock/no-encryption/NTFS,
same-user/admin, original-incident or independent-assurance limitations.
