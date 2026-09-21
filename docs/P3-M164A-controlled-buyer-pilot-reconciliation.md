# P3-M164A Controlled Buyer-Pilot Reconciliation

## Baseline and graph

- First-parent baseline: `d81d82e4eff3bd16d7f15b8662cd9359d9dc7627`
- Remote second parent: `d2856c1242bbe49e077d88e2e5b8bbb7f1e9eedb`
- Merge base: `06b9349c30b73f8351afb2d740789bdd450043f6`
- Starting position: local `main` seven commits ahead and three behind
- Starting worktree/index: clean

The final immutable merge hash is reported after commit because a commit cannot
contain its own hash. P3-M164 browser validation and publication remain a
separate pending mission.

## Remote commit inspection

### `8226527` — Add controlled buyer pilot page to corporate site

Added `discovery-site/controlled-buyer-pilot.html`. Its useful intent was a
bounded buyer evaluation, synthetic or approved test inputs, buyer-retained
execution control and explicit non-production limits. The original page also
contained outdated `93/100` and `1,394 tests` figures, PASS/REFUSE-only outcome
language, an “Executive Trust Receipt” formulation, broad “ready” wording and a
new backup Gmail address. Those elements conflicted with M163 claims control or
privacy minimisation and were revised or removed.

### `4b21a8f` — Add controlled buyer pilot page to sitemap

Added the pilot URL to `discovery-site/sitemap.xml`. The entry was retained and
the page was added to repository validators and the selected Pages-artifact
checks so it cannot become an orphan or disappear silently.

### `d2856c1` — Surface controlled buyer pilot on corporate homepage

Added pilot navigation and homepage calls to action, overlapping the fully
repositioned M163 `discovery-site/index.html`. The M163 homepage remained the
deliberate base, while a dedicated Pilot navigation link and an evidence-
controlled pilot-page call to action were integrated. No wholesale ours/theirs
selection determined the final content.

## Claims treatment and conflict resolution

The retained page uses the locked M163 product position, ACCEPT/REJECT/REFER
vocabulary, internal revocation boundary, one-tool MCP surface, non-authorising
Customer Trust Receipts, exact M161/M162 figures and the required synthetic-
observation label. It preserves “Paid evaluation pilots starting from £1,500”
as indicative and scope-dependent.

Unsupported or stale claims were rejected rather than added to the claims
register. The bounded pilot scope was added as a PARTIALLY_DEMONSTRATED public
claim backed by the M162 Buyer Adoption Proof Pack. No production readiness,
customer validation, certification, compliance/safety guarantee, ROI, loss
reduction, statistical significance, live procurement/payment, distributed
guarantee or business-outcome correctness is claimed.

The page contains no analytics, tracking, PostHog, external font or script,
form, checkout, submission endpoint or runtime network code. The existing
corporate email remains the sole enquiry route.

## Preserved boundaries

- P3-M158–P3-M163 exact-action, policy, lifecycle, Shadow Mode, exposure,
  revocation, emergency, recovery, demonstrator and evidence semantics remain
  unchanged.
- MCP exposes exactly `atg.evaluate_action`.
- Locked M162 schemas, receipts, metrics, Coverage Map and generated examples
  remain unchanged.
- Dependencies and `package-lock.json` remain unchanged.
- No live purchase, payment, settlement, customer communication or other
  external action is introduced.

## Validation

- Conflict-marker and whitespace checks: passed.
- Public claims: 25/25 passed.
- Discovery site, internal links, sitemap, assets and runtime boundaries: 23/23
  passed.
- M163-focused tests: 15 passed, 0 failed.
- P3-M158–P3-M163 focused regression: 114 passed, 0 failed.
- Complete suite: 1,508 passed, 0 failed (675 primary and 833 post-tests).
- Typecheck and build: passed.
- Schema parsing: 39 schemas parsed.
- M162 verification: 16 artefacts verified; authority granted `false` and
  execution attempted `false`; canonical bundle digest remains
  `sha256:925e257812d22b89b9ae07f69c9fbb1dde8e9141f8184b3236748a67a7e3c8ac`.
- `package-lock.json` remained byte-identical at SHA-256
  `D1EDC17391C3390A7DD0962801845BC643893B570F12B0ECD2DDF408F349903D`.
- ANEOS remained 44,428 bytes at SHA-256
  `B1FECE46AFFE1006E199179BCB0205455DD0785EF0B0E9A5155842FE5E74B657`.
- MCP exposure remained exactly `atg.evaluate_action`.

The first complete-suite attempt encountered one isolated
`DURABLE_WRITE_FAILED` filesystem write in an existing aggregate-exposure
test. The exact test passed immediately in isolation without a code change, and
the subsequent complete-suite run passed all 1,508 tests. This transient local
filesystem event did not alter product state or the reconciliation.

No real-browser validation is claimed; that remains mandatory in P3-M164.

## Publication boundary

No push, browser validation, publication, deployment, tag or release occurs in
P3-M164A. The next permitted mission is a fresh P3-M164 real-browser validation
and controlled-publication gate.
