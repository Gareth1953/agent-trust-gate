# Agent Trust Gate v0.1.0 Reviewer Release Preparation

## Release purpose

Version 0.1.0 is prepared for stable technical review as a deterministic,
local-only GatePass demonstrator. This document prepares a possible future
GitHub release; it does not publish, tag, upload or push anything.

Suggested future GitHub release title:

`Agent Trust Gate v0.1.0 — Local Reviewer Demonstrator`

## Exact reviewer command

```powershell
npm run reviewer
```

## Included reviewer evidence

- Exact-action GatePass allow with verifier-controlled time.
- Separate policy decision and simulated execution receipts.
- Changed-action, replay and expiry refusals.
- Missing mandate, evidence and approval outcomes.
- Settlement-sensitive refusal without valid current authority.
- Versioned canonical action, GatePass, verification, nonce and receipt schemas.
- Focused deterministic, failure-exit and no-external-action tests.
- OWASP Agentic Top 10 technical control map and NIST reference map.

## Prerequisites

- Git.
- Node.js 20 or newer.
- npm and the checked-in `package-lock.json`.
- No credentials, accounts, API access, payment system or external service.

## Validation commands

```powershell
npm run build
npm run typecheck
npm run reviewer
npm test
git diff --check
```

Reviewers should also confirm that a second `npm run reviewer` produces the same
demonstration output and that `package.json` remains at version `0.1.0`.

## Current boundaries

The release candidate is private-package, local-demo code. It performs no
network call, live agent interception, external tool execution, payment,
settlement, customer-data processing, hosted verification or production
enforcement.

## Known limitations

- Local fixture signing without production key custody.
- Same-process, non-durable nonce state.
- Fixed synthetic identities, evidence, mandates and approvals.
- In-process simulated acknowledgement only.
- No distributed transaction, crash recovery or reconciliation.
- No live protocol, IAM, payment, tool or agent-framework integration.
- No penetration test, deployment assessment or formal performance benchmark.
- Standards maps are discussion aids, not assessments or certifications.

## No-production-use notice

Version 0.1.0 is a reviewer demonstrator only. It must not be used as
production middleware, a live proxy, a payment/settlement control, an
authentication system or a substitute for deployment security controls.

## Publication status

Prepared locally only. No package was published, GitHub release created, tag
created, artifact uploaded or remote push performed by P3-M151.
