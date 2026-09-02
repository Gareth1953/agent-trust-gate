# P3-M155A — Safe GitHub Reconciliation and Post-Merge Verification

Date: 2026-09-02

Product: Agent Trust Gate™ — Exact Action Trust Gateway

Repository: `Gareth1953/agent-trust-gate`
Verdict before the gated push: **SAFE TO COMMIT AND PUSH BY NORMAL FAST-FORWARD UPDATE**

## Executive result

The five local commits ending at P3-M155 commit `75292cc` have been reconciled
with all fifteen commits that were present on `origin/main` at fetch time. The
integration uses a normal merge and preserves both histories. No force-push,
rebase, test deletion, skipped test, trust-engine relaxation or unrelated site
rollback was used.

The Exact Action Trust Gateway implementation and its four dedicated test files
are byte-for-byte identical to the verified P3-M155 commit. The integrated full
suite passes 1,382 tests with zero failures, the M155 adversarial matrix passes
32/32, and the smoke run passes 7/7 with no prototype network call.

## Starting Git state and recovery point

- Branch: `main`
- Starting HEAD: `75292cc57b2b37ee190f2c0977fe69e9da6d0965`
- Starting divergence: five local commits ahead and fifteen upstream commits
  behind `origin/main`
- Freshly fetched upstream tip: `bbb589c202cfa957435f8b499cb0c9b9d7dbcd26`
- Merge base: `b3c2e5c6cab4226c2a0f2ea0117784945b342b5d`
- Safety reference: `safety/p3-m155a-pre-reconciliation-75292cc`
- Safety reference target: `75292cc57b2b37ee190f2c0977fe69e9da6d0965`
- Pre-existing untracked file retained and not modified:
  `docs/ATG-ANEOS-R001-strategic-kill-and-reinvention.md`

The local-only commits were:

1. `9c3b556` — P3-M156A enterprise positioning validation pack
2. `d0ded51` — P3-M156B enterprise evidence wording
3. `e990d9a` — P3-M156C enterprise reviewer validation pack
4. `2b8b027` — P3-M157 enterprise audit and public-authority strengthening
5. `75292cc` — P3-M155 Exact Action Trust Gateway pilot prototype

The upstream side contained the corporate site build, custom-domain switch,
resilient contact routes, external-authority-evidence positioning and examples,
and privacy-conscious PostHog analytics with a matching privacy notice.

## Divergence and conflict map

Only five paths were changed on both sides of the merge base.

| Path | Upstream intent | Local intent | Resolution |
|---|---|---|---|
| `.github/workflows/deploy-discovery-pages.yml` | Deploy and verify the new corporate assets; use the corporate domain for IndexNow | Preserve search-verification and demonstrator artifact checks | Auto-merged; both sets of deployment checks and the corporate-domain notification route remain |
| `REVIEWER_START_HERE.md` | Explain consumption of external authority evidence | Make the Exact Action prototype the first interactive reviewer experience | Auto-merged; both sections remain |
| `discovery-site/ai-catalog.json` | Switch public catalogue URLs to `agenttrustgate.com` | Keep ARD snapshot schema compatibility by using scalar metadata fields | Corporate URLs retained; the route list remains represented by named scalar URL fields because the checked-in schema permits scalar metadata values, not arrays |
| `discovery-site/index.html` | Replace the old discovery landing page with the corporate site | Retain machine-readable discovery, JSON-LD, citation and security evidence | Corporate page retained; JSON-LD and the AI-catalog link were restored, and citation/security links were added without restoring the displaced old layout |
| `discovery-site/sitemap.xml` | Use the corporate domain and corporate routes | Preserve the complete technical, reviewer, Human Authority and Agent Standing route inventory | Corporate-domain sitemap retained and expanded to include both corporate and technical discovery routes |

There was no upstream overlap in the Exact Action prototype source, server,
CLI, browser UI, Human Authority implementation, Agent Standing implementation,
prototype package commands or M155 test files. Package/build configuration had
no conflict; the only build/deployment overlap was the Pages workflow above.

## Root cause of the previous four discovery failures

The previous four failing test cases were reproduced after the normal merge:
23/27 targeted tests passed and four failed. They were not four independent ATG
security regressions. They were multiple assertions around one cross-branch
contract mismatch:

1. The local discovery validator and passive-site tests required the former
   GitHub Pages canonical URL and base path, while upstream intentionally moved
   the corporate site, robots file, sitemap, catalogue and IndexNow route to
   `https://agenttrustgate.com/`.
2. A test required the exact former homepage title and legacy status copy,
   while upstream deliberately introduced the new corporate title and
   proposition.
3. Local validation prohibited every runtime script and every analytics marker.
   Upstream deliberately introduced one checked-in `corporate.js` and a
   hostname-gated PostHog configuration, then documented it in `privacy.html`.
4. The compiled validator exited non-zero because the same stale checks failed;
   another test treated that shared result as a separate failure.

The failing validator checks covered metadata, sitemap membership, base path,
legacy wording, the former home-page link inventory and the blanket script
ban. The catalogue conflict also exposed an upstream array that did not conform
to the repository's checked-in ARD schema snapshot; the scalar local model was
therefore retained with upstream's new URLs.

This was a genuine integration-contract conflict: the upstream corporate work
was intentional, and the local safety tests were valid for the site they
originally protected but stale for that newer approved architecture.

## Resolution and hardening decisions

- The validator now models the current corporate site URL separately from the
  historical machine-discovery activation URL.
- Corporate files are required and all relative links/assets are checked.
- HTML may load only the checked-in `./corporate.js`; remote script `src`
  values, external styles, third-party images and video remain prohibited.
- The analytics check is an exact allowlist, not a general analytics exemption.
  It requires the public-hostname guard, the two approved PostHog URL literals,
  the three approved link-event names, `identified_only` profiles, disclosed
  local-storage persistence, DNT respect, GeoIP disablement, and disabled
  autocapture, page-leave capture, surveys and session recording.
- Visitor identification, explicit recording start, cookies, fingerprinting,
  `eval`, dynamic `Function`, fetch, XHR, WebSocket, EventSource, beacon and form
  submission remain rejected by the relevant checks.
- The public Evidence Centre now exposes the previously retained discovery,
  manifest, agent-card, invitation, schema and reviewer-kit links rather than
  forcing the legacy homepage layout back into the corporate design.
- The root and discovery-site READMEs now distinguish the public corporate
  analytics boundary from the no-network local Exact Action prototype.
- Three existing test files were updated to enforce the exact new corporate
  allowlist. No test was removed, skipped, weakened to a wildcard, or changed
  to ignore an unexplained failure.
- Two upstream Markdown trailing-space findings in `CONTACT.md` were corrected.

## Files changed by reconciliation decisions

In addition to the upstream files brought in by the merge, P3-M155A deliberately
changed:

- `CONTACT.md`
- `README.md`
- `discovery-site/README.md`
- `discovery-site/ai-catalog.json`
- `discovery-site/evidence.html`
- `discovery-site/index.html`
- `discovery-site/sitemap.xml`
- `src/discovery-site-validator.ts`
- `test/machine-discovery.test.ts`
- `test/passive-discovery-activation.test.ts`
- `test/public-readme-developer-positioning.test.ts`
- `docs/P3-M155A-safe-github-reconciliation-report.md`

The upstream merge also adds or updates its corporate pages, stylesheet,
script, privacy notice, contact and external-authority-evidence material,
deployment workflow and corporate positioning documents. The local history adds
the already committed P3-M154/P3-M155 prototype, its UI, tests and buyer pack,
plus the pre-existing P3-M156/P3-M157 work. None was discarded.

## Verification results

| Gate | Result |
|---|---:|
| `npm run typecheck` | PASS |
| `npm run build` | PASS |
| `npm test` invocation 1 | 675 passed / 0 failed |
| `npm test` invocation 2 | 707 passed / 0 failed |
| Full suite total | **1,382 passed / 0 failed** |
| Focused discovery/corporate tests | 48 passed / 0 failed |
| Discovery-site validator | PASS (23/23 checks) |
| Human Authority | 9 passed / 0 failed |
| Agent Standing | 13 passed / 0 failed |
| P3-M155 adversarial matrix | **32 passed / 0 failed** |
| P3-M155 buyer-pack tests | 6 passed / 0 failed |
| Exact Action prototype tests | 32 passed / 0 failed |
| Prototype smoke | **7 passed / 0 failed** |
| Prototype smoke network boundary | `networkCallPerformed: false` |
| Secret/private-path scan of changed files | PASS |
| Conflict-marker scan | PASS |
| `git diff --check` after staging | Required before commit |

## P3-M155 regression audit

The following P3-M155 implementation and test paths have the same Git blob hash
as commit `75292cc`:

- all three `src/exact-action-trust-gateway-prototype*` files;
- `src/agent-standing.ts` and `src/human-authority-demo.mjs`;
- all three `prototype/exact-action/` browser assets; and
- all four `test/exact-action-trust-gateway-*` files.

The dedicated tests additionally prove:

- fail-closed unknown, missing and malformed inputs;
- canonical coverage of every execution-critical action field;
- human identity, authority, mandate, amount, supplier, category, currency,
  jurisdiction, risk-tier and evidence enforcement;
- valid Agent Standing as a precondition;
- signature, expiry, digest and nonce verification;
- one-use consumption and replay refusal;
- amount, supplier, quantity, currency and policy-version tamper refusal;
- no execution after refusal or without a valid matching GatePass; and
- verified executive Trust Receipt plus full machine audit receipt, including
  tamper detection.

Compared with the P3-M155 baseline, all 1,382 full-suite tests still pass, all
32 adversarial cases still pass, all seven buyer smoke scenarios still pass,
and the trust implementation is unchanged. Reconciliation has therefore not
weakened exact-action binding, authority/scope controls, replay/tamper defence,
standing/expiry checks, refusal evidence or receipt integrity.

## Security and operational boundaries

- The Exact Action prototype remains loopback-only, synthetic and simulated.
- No procurement, payment, settlement, buyer or production system was called.
- No production credentials or customer data were introduced.
- The PostHog project key in `corporate.js` is an intentionally public browser
  ingestion identifier from upstream, not a production secret used by the ATG
  prototype.
- The public corporate site intentionally makes the narrowly documented
  analytics call only on the public ATG hostname. This is separate from the
  local prototype's no-network invariant.
- No security, legal, regulatory or production certification is claimed.

## Remaining risks

1. The public corporate site depends on an external analytics provider. Its
   checked-in configuration is now tightly tested, but provider availability,
   data processing and future policy remain operational governance concerns.
2. The older machine-discovery activation record retains the original GitHub
   Pages project URL while the corporate site uses `agenttrustgate.com`. The
   validator deliberately distinguishes those historical and current roles.
3. This reconciliation proves repository and local prototype behaviour. It is
   not a production deployment or an external buyer-system integration test.
4. The protected untracked ATG-ANEOS report remains outside this commit.

## Push gate and recommended next action

The repository is safe to push if the final staged diff check passes, the merge
commit succeeds, and an immediate pre-push fetch confirms that `origin/main`
has not advanced from `bbb589c202cfa957435f8b499cb0c9b9d7dbcd26`.

Recommended next action: stage the approved merge and P3-M155A files while
excluding the protected ATG-ANEOS report; run `git diff --cached --check`;
create the reconciliation merge commit; fetch `origin/main` again; and perform
only a normal push if the fetched upstream commit is unchanged and is an
ancestor of the new local commit.
