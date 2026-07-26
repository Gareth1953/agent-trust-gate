# P3-M151 Reviewer Conversion and Standards Mapping Pack

## Problem addressed

The repository already contained strong local GatePass demonstrations, but a
public technical visitor had to choose among many commands and documents before
reaching the exact-action evidence. P3-M151 creates a short, outcome-checked
path from first visit to serious review or bounded pilot enquiry.

## Bounded scope

P3-M151 composes the existing P3-M150 exact-action verifier and the existing
GatePass wrapper scenarios. It does not add another GatePass engine, verifier,
nonce model, live proxy, production middleware, external API, real agent
interception, payment or settlement path.

## Files created

- `REVIEWER_START_HERE.md`
- `src/reviewer-conversion-cli.ts`
- `test/reviewer-conversion-cli.test.ts`
- `docs/owasp-agentic-top-10-2026-control-map.md`
- `docs/nist-agent-security-identity-authorisation-reference-map.md`
- `docs/reviewer-release-v0.1.0.md`
- `docs/github-reviewer-metadata.md`
- `docs/p3-m151-reviewer-conversion-and-standards-mapping-pack.md`

## Files changed

- `README.md`
- `package.json`
- `src/index.ts`
- `CHANGELOG.md`

## Reviewer journey

1. Read the root reviewer start page.
2. Install with `npm ci`.
3. Run `npm run reviewer`.
4. Confirm the observed allow, refusals, replay protection, exact-action
   binding, separate receipt and no-external-action scorecard.
5. Inspect the linked implementation, schemas, threat boundaries and tests.
6. Use the standards maps as discussion aids.
7. Submit technical feedback or a human-reviewed pilot enquiry without sending
   sensitive material.

## Standards-source dates

- OWASP Top 10 for Agentic Applications for 2026 resource page: 9 December
  2025; versioned document: December 2025.
- NIST identity and authorization Initial Public Draft concept paper: 5
  February 2026; public comments closed 2 April 2026.
- NIST AI Agent Standards Initiative page: created 17 February 2026 and shown
  as updated 20 April 2026.
- NIST Trustworthy and Responsible AI 800-5 RFI response summary: published 18
  May 2026.
- Source status checked: 26 July 2026.

## Claim boundaries

The mission claims only deterministic local observations. It makes no claim of
production readiness, security or compliance certification, full OWASP risk
mitigation, NIST approval, production identity, durable distributed replay
state, external enforcement, live action execution, real payment/settlement
control, penetration testing or formal performance.

## Validation results

Final requested validation results:

- `npm run build`: passed.
- `npm run typecheck`: passed.
- `npm run reviewer`: passed with all eight scenarios matched, all scorecard
  invariants passed and external actions reported as none.
- `npm test`: passed — main test phase 675/675 and posttest phase 568/568;
  1,243 total tests passed, 0 failures, 0 skipped, 0 cancelled.
- `git diff --check`: passed.
- deterministic reviewer output: identical across two command runs; focused
  determinism test passed.
- unexpected-allow behavior: injected broken invariant produced exit code 1 in
  the focused automated test.
- README local links: 206 targets resolved.
- new reviewer/standards documents: 73 local targets resolved across the start
  page and two maps.
- standards references and dates: checked against the official OWASP and NIST
  pages on 26 July 2026.
- package version: `0.1.0`.

The first full-suite run exposed one mission-caused README compatibility
failure because an older test expected the literal `Current status:
local_demo_only` without code formatting. The wording was restored and the
final full suite passed.

## Release-preparation status

The stable reviewer release notes for version 0.1.0 are prepared locally in
`docs/reviewer-release-v0.1.0.md`. No package, tag, GitHub release or artifact
has been published.

## Items deliberately deferred

- Production IAM, approver authentication and key custody.
- Durable distributed nonce and idempotency storage.
- Live enforcement adapters, proxying and agent interception.
- Real tool, payment or settlement integrations.
- Runtime monitoring, sandboxing, network isolation and incident response.
- Supply-chain and model security.
- Distributed transaction recovery and signed external acknowledgements.
- Penetration testing and formal latency or throughput benchmarking.
- Applying GitHub About metadata, creating a release, tagging or pushing.
