# P3-M161 Implementation and Validation Report

## Controlled baseline and lock target

- Repository: `Gareth1953/agent-trust-gate`
- Branch: `main`
- Baseline HEAD: `3d9c18e5548d8c5964d24d5ce5b808cce3a10a57`
- Baseline parent: `c54043d5818fa9649a9c5cd8cbb019b9a46ec091`
- Baseline position: four commits ahead of `origin/main`, zero behind
- Baseline worktree and index: clean
- Baseline locked regression: 60 passed, 0 failed
- Lock subject: `P3-M161 add local purchasing lifecycle demonstration`

The final immutable commit hash is recorded by post-commit verification because
a commit cannot contain its own hash.

## Files created

- `src/local-purchasing-lifecycle-demo.ts`
- `src/local-purchasing-lifecycle-demo-cli.ts`
- `test/local-purchasing-lifecycle-demo.test.ts`
- `schemas/purchasing-execution-evidence-link.schema.json`
- `schemas/purchasing-lifecycle-demo.schema.json`
- `docs/P3-M161-local-purchasing-lifecycle-demonstration.md`
- `docs/P3-M161-implementation-and-validation-report.md`

## Files modified

- `src/index.ts`
- `package.json`
- `README.md`
- `docs/p3-mission-register.md`

No dependency, lockfile, MCP server, existing v1/v2 schema or public website
file changed.

## Architecture

The implementation is an orchestration and evidence layer over the existing
gateway and store:

1. P3-M159's business-policy MCP request is evaluated by the existing
   `McpExactActionGateway`.
2. P3-M160 persists `ISSUED` lifecycle and outstanding exposure before an
   accepted GatePass is returned.
3. The local demonstration boundary validates the one registered adapter and
   resource.
4. P3-M160 compare-and-set reservation prevents duplicate progression.
5. P3-M150/P3-M158 exact-action verification rechecks signature, canonical
   digest, action bindings, expiry, constraints and one-use nonce before the
   in-process adapter callback.
6. The existing execution receipt remains distinct from the policy decision
   receipt. A new additive evidence link binds canonical digests of both.
7. P3-M160 commits `EXECUTED` and exposure status; replay cannot reserve again.

No second policy engine, generic proxy, network transport or external executor
was created. MCP remains local stdio with exactly `atg.evaluate_action`.

## Demonstrated outcomes

| Case | Outcome | GatePass | Execution |
|---|---|---|---|
| Exact authorised purchase | `ACCEPT` | One-use, consumed | Synthetic acknowledgement |
| Quantity substitution | `REJECT` | None | None |
| Supplier substitution | `REJECT` | None | None |
| Price review band | `REFER` | None | None |
| GatePass reuse | `REJECT` | Already consumed | Blocked |
| GatePass revocation | `REJECT` | Revoked | Blocked |
| Shadow Mode | `SHADOW` / would `ACCEPT` | None | None |
| Aggregate ceiling | `REFER` | None for overcommit | None |
| Authority expansion | `REJECT` | None | None |
| Emergency/recovery | `REJECT` | Progression blocked | No retry |

## Deterministic evidence and reason codes

The demonstration preserves underlying gateway, policy, lifecycle, exposure,
revocation, stop and reconciliation codes and adds presentation-neutral codes
for its fixed cases:

- `QUANTITY_SUBSTITUTION_REJECTED`
- `SUPPLIER_SUBSTITUTION_REJECTED`
- `PRICE_REVIEW_BAND_REFERRED`
- `GATEPASS_REUSE_REJECTED`
- `REVOKED_GATEPASS_USE_REJECTED`
- `TWO_OUTSTANDING_ACTIONS_COUNTED`
- `CONCURRENT_OVERCOMMIT_PREVENTED`
- `AGENT_AUTHORITY_EXPANSION_REJECTED`
- `RESTART_STATE_PRESERVED`
- `NONCE_STATE_PERSISTED`
- `REVOCATION_PERSISTED`
- `AGGREGATE_EXPOSURE_PERSISTED`
- `NO_AUTOMATIC_RETRY`
- `EXPLICIT_RECONCILIATION_REQUIRED`
- `SYNTHETIC_ADAPTER_NOT_REGISTERED`
- `SYNTHETIC_RESOURCE_NOT_REGISTERED`
- `EXECUTION_AUTHORITY_MISSING`

Machine-readable evidence and the human-readable renderer are separate. Two
runs with isolated stores produce identical evidence and presentation.

## Validation results

- M161 acceptance tests: **20 passed, 0 failed**.
- Focused M161 plus unchanged M158–M160 regressions:
  `npm run test:purchasing-lifecycle` — **80 passed, 0 failed**.
- Complete repository suite: **675 primary + 799 post-tests = 1,474 passed,
  0 failed**.
- `npm run typecheck`: passed.
- `npm run build`: passed.
- Additive demo/link schemas and reused decision/execution receipt schemas:
  passed.
- Demonstrator command produced all ten expected outcomes in order.
- `git diff --check`: passed.

The build refreshes only ignored `dist/` output under existing repository
practice.

## Security and preservation evidence

- Rejected, referred and Shadow cases never reach the synthetic adapter.
- Unregistered adapter/resource and absent authority stop before reservation.
- Exact-action mutation is rejected before adapter invocation.
- Receipt or evidence-link mutation fails digest verification.
- Replay, revocation, stop and `UNKNOWN` recovery state persist across restart.
- Concurrent attempts cannot reserve one GatePass twice or exceed aggregate
  exposure.
- Stale/future evidence and trusted-clock rollback fail closed.
- Crash reconciliation never performs an automatic retry.
- No MCP tool was added; `atg.evaluate_action` remains the only tool.
- No production credential, secret, personal data or real supplier/bank data
  was introduced.
- Package dependencies and `package-lock.json` are unchanged.
- P3-M158, P3-M159, P3-M160 and the ANEOS report remain protected.

## Non-claims and limitations

This is a local, single-process, synthetic demonstrator. It is not production
ready, distributed, highly available, tamper-proof or customer-validated. Its
synthetic acknowledgement is not a purchase, payment, settlement or external
effect. It provides no security, compliance, ROI, savings, prevented-loss or
business-outcome guarantee. The buyer retains control of any future real
execution boundary.

No push, tag, release, deployment, website change, external account access,
outreach or external action occurred. P3-M162 was not begun.
