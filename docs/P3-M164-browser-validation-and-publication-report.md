# P3-M164 Browser Validation and Publication Report

Date: 21 September 2026

## Scope and baseline

P3-M164 validates the reconciled P3-M164A public site in an installed browser
before the separately gated commit and normal push. The starting branch was
`main` at `480bce3d61f1bd7a821e6af6150812d62cb3ebd8`, eight commits ahead of
`origin/main` at `d2856c1242bbe49e077d88e2e5b8bbb7f1e9eedb` and zero behind. The worktree
and index were clean, and no tag pointed at the starting HEAD.

The outgoing history inspected before validation was:

1. `3002d89` — preserve the ANEOS strategic research report;
2. `58806b4` — local MCP exact-action gateway foundation;
3. `c54043d` — buyer policy, Shadow Mode and REFER controls;
4. `3d9c18e` — durable lifecycle and emergency controls;
5. `d615b85` — local purchasing lifecycle demonstration;
6. `6314a41` — customer trust evidence and buyer adoption pack;
7. `d81d82e` — evidence-controlled README and website positioning; and
8. `480bce3` — controlled buyer-pilot reconciliation.

## Browser method

- Browser: Microsoft Edge `153.0.4234.32` (`Edg/153.0.4234.32`).
- Protocol: native Chrome DevTools Protocol 1.3 over a localhost-only debugging
  endpoint.
- Serving: a temporary Node.js static HTTP server bound only to
  `127.0.0.1:8765`, serving `discovery-site`.
- Isolation: a newly created temporary Edge profile was used and removed after
  the run. Gareth's normal browser profile was not opened.
- Evidence: 18 full-page browser-rendered screenshots were generated under
  `C:\Users\Gareth\AppData\Local\Temp\atg-p3-m164-pass-72b926a15b364430b3fd3f230815bb96`,
  visually inspected, and removed after the validation record was completed.

No browser package, driver, extension or project dependency was installed.

## Page and viewport inspection

Each page passed at all three viewports. “Pass” means the rendered screenshot
was visually inspected and the corresponding DevTools measurements found no
body overflow, clipping, overlap, hidden or unreadable content, broken local
asset, or unexpected blank region.

| Page | 360 x 800 | 768 x 1024 | 1440 x 900 |
| --- | --- | --- | --- |
| `index.html` | Pass | Pass | Pass |
| `technology.html` | Pass | Pass | Pass |
| `evidence.html` | Pass | Pass | Pass |
| `controlled-buyer-pilot.html` | Pass | Pass | Pass |
| `contact.html` | Pass | Pass | Pass |
| `privacy.html` | Pass | Pass | Pass |

The home ten-case evidence table remained keyboard reachable. Its mobile
container measured 315 CSS pixels against 760 pixels of scrollable content and
moved 80 pixels on Arrow Right. Tablet scrolling and the non-overflowing desktop
layout also passed. Each page retained one logical H1 and readable verdict text
that did not depend on colour alone.

## Keyboard, focus, motion, console and network

- All links and controls encountered in the tab sequence were reachable.
- The responsive menu opened from the keyboard and closed with Escape on all
  six mobile page checks; focus returned to the menu button.
- Visible `:focus-visible` treatment was observed and no keyboard trap occurred.
- The responsive evidence table was focusable and operable with Arrow Left and
  Arrow Right.
- Reduced-motion emulation selected the repository's reduced-motion override
  on every page and viewport without breaking navigation or layout.
- Console messages: 0.
- Runtime errors: 0.
- Failed HTTP responses: 0.
- Unexpected requests: 0.
- External resources, analytics, PostHog, trackers, external fonts, external
  scripts, forms, checkout and submission endpoints: 0.

Only expected localhost HTML, CSS, JavaScript and checked-in assets were loaded.

## Confirmed defects and repairs

Four defects were observed in the initial installed-browser run and repaired
with the smallest shared changes:

1. `evidence.html` cards exceeded the 360-pixel viewport because long code text
   contributed a grid min-content width. `.card { min-width: 0; }` removed the
   body-level overflow.
2. The controlled-pilot “Visible limitations” dark surface inherited white
   background styling, making its light text unreadable. Explicit dark-surface
   background, border and paragraph colours restored contrast.
3. The responsive menu opened by keyboard but did not close with Escape. A
   shared close handler now closes it and restores focus to the toggle.
4. The focusable evidence table did not respond to horizontal arrow keys. The
   shared script now scrolls `.table-scroll` containers deterministically.

All affected pages and viewports were re-rendered and re-inspected after the
repairs. Five focused repository tests lock these behaviours.

## Pre-publication validation

| Gate | Result |
| --- | --- |
| P3-M164 focused browser-readiness tests | 5 passed, 0 failed |
| P3-M158–P3-M164A focused regression | 119 passed, 0 failed |
| Primary suite | 675 passed, 0 failed |
| Post-test suite | 838 passed, 0 failed |
| Complete suite | 1,513 passed, 0 failed |
| Typecheck | Passed |
| Build | Passed |
| Schema parsing | 39 passed |
| Public-claims validation | 25/25 passed |
| Discovery-site validation | 23/23 passed |
| M162 independent generations | 7/7 files byte-identical |
| M162 comparison with locked examples | 7/7 files byte-identical |
| M162 verifier | 16 artefacts verified |
| M162 bundle digest | `sha256:925e257812d22b89b9ae07f69c9fbb1dde8e9141f8184b3236748a67a7e3c8ac` |
| M162 authority granted | `false` |
| M162 external execution attempted | `false` |
| Package-lock SHA-256 | `D1EDC17391C3390A7DD0962801845BC643893B570F12B0ECD2DDF408F349903D` |
| ANEOS report | 44,428 bytes; `B1FECE46AFFE1006E199179BCB0205455DD0785EF0B0E9A5155842FE5E74B657` |

Conflict-marker, whitespace, internal-link, sitemap, package-command,
prohibited-implication, secret-sensitive diff and protected-artefact checks
passed. Dependencies, `package-lock.json`, locked M162 examples and schemas,
exact-action semantics, and the sole MCP tool `atg.evaluate_action` remain
unchanged.

During repeated validation, two post-test attempts encountered a transient
Windows filesystem write failure in the existing M162 durable-state fixture.
The store failed closed with `DURABLE_WRITE_FAILED`; the isolated 19-test M162
suite then passed, and the final unmodified complete `npm test` command passed
all 1,513 tests. No lifecycle code or test-runner concurrency setting was
changed. This local filesystem sensitivity remains a limitation rather than an
authority or execution bypass.

## Publication boundary

This committed record authorises only the normal, non-force push specified by
P3-M164 after the commit gate passes. At commit time no push, Pages deployment,
tag or release has occurred. Repository and live Pages results are verified and
reported after the push; no unverified live result is asserted here.

No live purchase, payment, settlement, customer communication or other
commercial external action occurred during validation.
