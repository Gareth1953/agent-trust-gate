# P3-M162 Implementation and Validation Report

## Controlled baseline and lock target

- Repository: `Gareth1953/agent-trust-gate`
- Branch: `main`
- Baseline HEAD: `d615b85759f9cc13fe596d2dce34554001e159b1`
- Baseline parent: `3d9c18e5548d8c5964d24d5ce5b808cce3a10a57`
- Baseline position: five commits ahead of `origin/main`, zero behind
- Baseline worktree/index: clean
- Baseline focused regression: 80 passed, 0 failed
- Baseline complete suite: 1,474 passed, 0 failed
- Lock subject: `P3-M162 add customer trust evidence and buyer adoption pack`

The final commit hash is recorded by post-commit verification because a commit
cannot contain its own hash.

## Architecture and changed surface

P3-M162 adds a read-only evidence derivation module and CLI, five additive
schemas, deterministic synthetic example artefacts, one acceptance suite and
three controlled documents. `src/index.ts`, `package.json`, `README.md` and the
mission register expose only the necessary local APIs and commands.

The generator invokes the existing M161 demonstrator and derives immutable
evidence from it. The verifier regenerates the expected bundle and compares
every canonical section, receipt and manifest entry. It never authorises,
reserves, executes, retries, revokes or changes lifecycle state. No P3-M158–
M161 gateway, policy, store, adapter, receipt or MCP implementation was changed.

## Artefacts

- Ten `atg.customer-trust-receipt.local.v1` receipts.
- One `atg.assurance-coverage-map.local.v1` map: 18 demonstrated, 2 partial,
  3 not demonstrated and 2 out of scope.
- One `atg.assurance-metrics.local.v1` metric set with explicit sources and
  rate operands.
- One `atg.buyer-adoption-proof-pack.local.v1` machine pack and matching
  reviewer Markdown.
- One six-entry canonical evidence manifest and enclosing evidence bundle.

## Deterministic evidence observations

The ten cases contain 1 ACCEPT, 6 REJECT, 2 REFER and 1 SHADOW outcome.
Observed synthetic counts include 3 distinct issued GatePasses, 1 consumed,
1 revoked, 1 replay blocked, 3 altered actions rejected, 2 referrals, 1 Shadow
evaluation and 0 Shadow GatePasses. One synthetic execution is acknowledged;
automatic retry after uncertain state remains 0. These are fixed demonstration
measurements, not population statistics or real-world outcome claims.

## Validation record

The final command results are recorded at lock time:

- M162-focused acceptance suite: 19 passed, 0 failed.
- M158–M162 focused regression: 99 passed, 0 failed.
- Complete repository suite: 675 primary + 818 post-tests = 1,493 passed,
  0 failed.
- Typecheck and build: passed.
- All 39 repository schemas parsed; all five new schemas validated their
  generated artefacts.
- Two independent generated directories: byte-identical in focused tests.
- Receipt, source, linkage, coverage, metric and manifest tamper variants: rejected.
- Dependency/package-lock and website files: unchanged.
- ANEOS report: 44,428 bytes; SHA-256
  `B1FECE46AFFE1006E199179BCB0205455DD0785EF0B0E9A5155842FE5E74B657`.
- MCP `tools/list`: exactly `atg.evaluate_action`.

## Boundaries and non-claims

This remains local, synthetic and non-production. No real purchase, payment,
settlement, customer communication or external action occurred. The evidence
does not establish commercial wisdom, customer approval, production readiness,
certification, compliance, ROI, savings, prevented loss or risk elimination.
No push, tag, release, deployment, website work, outreach or P3-M163 work is
part of this mission.
