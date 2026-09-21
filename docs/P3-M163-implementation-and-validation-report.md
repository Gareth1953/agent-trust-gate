# P3-M163 Implementation and Validation Report

## Baseline and lock target

- Baseline HEAD: `6314a41d21b4d49fda9636c35dce472546b6b0e6`
- Baseline parent: `d615b85759f9cc13fe596d2dce34554001e159b1`
- Branch: `main`, six commits ahead of `origin/main`, zero behind
- Baseline worktree/index: clean
- Baseline suite: 1,493 passed, 0 failed
- Lock subject: `P3-M163 reposition README and website on verified evidence`

The immutable final commit is recorded after commit because a commit cannot
contain its own hash.

## Implementation

The README and existing static site now use one evidence-controlled product
narrative: Agent Integration Gateway → Exact Action Trust Gateway → Business
Assurance and Customer Trust. The home page contains the full M161 ten-case
table, M162 Coverage Map totals and selected metrics, non-authorising Customer
Trust Receipt explanation, safety boundaries, pilot qualification and reviewer
routes. Technology and evidence pages provide supporting detail; contact and
privacy wording now match the controlled pilot and zero-analytics boundary.

A small local validator and JSON claim register bind material public claims to
locked repository evidence. The validator rejects altered numerical claims,
missing limitations, unsupported authority implications, invalid public
commands/links, analytics/network code and drift from the one-tool MCP surface.

No gateway, GatePass, policy, lifecycle, adapter, M162 generated evidence,
dependency, package lock or schema was changed.

## Validation record

- M163-focused tests: 14 passed, 0 failed.
- M158–M163 focused regression: 113 passed, 0 failed.
- Complete suite: 1,507 passed, 0 failed (675 primary and 832 post-tests).
- Typecheck and build: passed. Schema parsing: 39 schemas parsed.
- M162 regeneration and verification: two independent generation directories
  produced the seven expected byte-identical files; the regenerated bundle
  digest was
  `sha256:925e257812d22b89b9ae07f69c9fbb1dde8e9141f8184b3236748a67a7e3c8ac`,
  and all 16 artefacts verified.
- Link, package-command, claims and prohibited-implication checks: all 25
  public-claims checks and all 23 discovery-site checks passed.
- Accessibility/static responsive checks: one logical H1 per modified public
  page, labelled navigation, descriptive links, non-colour verdict labels,
  visible focus, reduced-motion handling, a focusable responsive table and
  explicit desktop/tablet/mobile breakpoints passed automated inspection.
- Browser viewport and hands-on keyboard inspection: unavailable because the
  execution environment exposed no runnable browser. No screenshot or manual
  rendering claim is made; a 360 px, 768 px and 1440 px browser pass remains a
  pre-publication check.
- Package lock remained at
  `D1EDC17391C3390A7DD0962801845BC643893B570F12B0ECD2DDF408F349903D`.
  ANEOS remained 44,428 bytes with SHA-256
  `B1FECE46AFFE1006E199179BCB0205455DD0785EF0B0E9A5155842FE5E74B657`.
  MCP exposure remained exactly `atg.evaluate_action`.

## Boundaries

No push, tag, release, deployment, publication, outreach, authenticated account
access, payment, purchase, settlement, customer communication or external
action is part of P3-M163. The site remains static and the repository remains a
local synthetic demonstrator, not production infrastructure.
