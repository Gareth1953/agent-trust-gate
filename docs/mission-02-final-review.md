# Mission 02: final code and compatibility review

Reviewed the actual diff from base c93d25aa810d3a813cfa5aefe2f85997089dc7f8 to mission-02-multi-worker, starting at ca60aa12e1cd4b260ff17d438e5a9237962dd178. Read the complete shared facade, lifecycle persistence adapter and rules, gateway issuance path, Mission 01 signature verifier, package builder/installed smoke, and separate-process tests. The initial working tree was clean. No applicable AGENTS.md was found. The existing Mission 01 worktree and published archives remain preserved.

## Findings and fixes

1. **P1, fixed: retagged destination identifiers could establish false absence and release committed exposure.** Previously recovery searched only GatePass ID or nonce, and did not compare those fields after finding a record. A rehashed destination with both fields substituted returned NOT_EXECUTED despite one write. Substituting either field alone returned EXECUTED with inconsistent identifiers. New regressions reproduced these outcomes before repair. Recovery now validates every record against its original signed approval before inferring absence, and requires approval ID, GatePass ID, nonce, action digest, exact proposed action, request digest and complete signed state binding to match. Destination records now retain the action digest and actual proposed action. Invalid evidence returns UNKNOWN and retains the 400000-unit reservation. Sources: [submission/recovery](../src/shared-purchase-order.ts), lines 144 and 173–179; [exact record comparison](../src/shared-purchase-order.ts), line 258; [regressions](../test/multi-worker.test.mjs), line 169. The before-fix log contains five failed assertions; the binding inconsistency was already refused.

2. **P2, fixed: orphan fence registration could be treated as unused authority during revocation.** A death after destination fence registration but before authority commit leaves an ISSUED lifecycle and a null authority token, with a live destination fence. The old revocation path called the core's unused-approval revocation and could release that hold. The facade now detects a fence on an ISSUED lifecycle and refuses release with GATEPASS_REVOCATION_REQUIRES_RECONCILIATION. It grants no new execution authority. There is deliberately no automated orphan recovery/reissue API. Sources: [revocation guard](../src/shared-purchase-order.ts), lines 198–202; [orphan process tests](../test/multi-worker.test.mjs), line 192.

3. **P2, fixed: unsupported optional imports produced an opaque built-in-module error.** The shared entrypoint eagerly imported node:sqlite, so Node 20 could fail before explaining the runtime requirement. A type-only import plus an explicit Node 24 floor now precede loading SQLite. Actual Node 20 packed import tests receive ATG_SHARED_WORKER_REQUIRES_NODE_24, then successfully import the legacy root in the same process. Sources: [runtime guard](../src/shared-purchase-order.ts), lines 1 and 12–16; [installed unsupported-runtime smoke](../scripts/test-standalone-plugin-package.mjs), lines 75–82.

4. **Coverage gap, closed: one-order idempotency could conceal an accounting regression.** Added concurrent distinct approval tests that inspect exposure entries and both persisted destination fences before submission. At a 1000000-unit ceiling, both approvals and claims succeed: two OUTSTANDING entries, then two RESERVED entries, totalling 800000 with zero writes and distinct GatePass IDs/tokens. At 600000, one approval/claim succeeds and the other is REFER: one entry totalling 400000, again with zero writes. Subsequent submission with sufficient budget produces one write and one DESTINATION_ALREADY_RECORDED; both 400000 reservations remain held until reconciliation. Source: [budget tests](../test/multi-worker.test.mjs), line 182.

The shared storage format is now atg.shared-purchase-order.local.v2 because stronger destination evidence adds fields. Prior v1 shared directories are refused without modification or automatic migration. Legacy filesystem connector formats, plugin root API and package version remain unchanged. This is a local unreleased format change; do not discard old held state to work around the refusal.

## Review of all requested boundaries

| Check | Source and assessment |
| --- | --- |
| Concurrent lifecycle/exposure updates | SharedPurchaseOrder.#tx (shared source line 71) begins a SQLite IMMEDIATE transaction before loading the latest snapshot, constructs a fresh core, saves the resulting state, then commits (transaction helper line 236). There is no cached core across operations/processes. Core issue rechecks the actual limit and adds exposure together (durable-action-lifecycle.ts line 417), independent of the gateway preview. Concurrent sufficient/insufficient budget tests prove both updates/counts directly. |
| Issuance and approval-handle storage | Issuance is a committed authority transaction before handle storage (shared lines 90–103). The new issuance_committed barrier proves death in this gap leaves 400000 OUTSTANDING exposure and no approval handle. Replay/fresh work cannot reuse or exceed the hold. |
| Claim and fence registration | Claim reserves and sets its token within authority serialization, registers the destination fence in its independent transaction, and returns only after authority commit (shared lines 107–126). Death at fence_registered leaves ISSUED/null token plus the orphan fence. Reclaim, a raw recovered fence token, reconciliation and revocation cannot reuse/release it. |
| Destination commit and acknowledgement | Submission checks token/status/stop under the authority lock, then verifies the destination token and original signature/current state under the destination transaction (shared lines 130–149). Destination commit can survive authority rollback; it is not one atomic transaction. The kill-before-ack and destination_committed barriers demonstrate one write with exposure still held. |
| Reconciliation and stale authority | Recovery commits destination token invalidation and validated lookup before authority can release exposure (shared lines 168–190). Death at destination_fenced leaves the old core RESERVED, but the actual old token receives DESTINATION_FENCED. Completed recovery also clears the authority token; delayed workers receive STALE_AUTHORITY. Tests at multi-worker.test.mjs line 135 verify the independent fence, not only the authority check. |
| Original signed evidence | validateApproval reuses signedStateAuthorityMatches (shared line 221; purchase-order-connector.ts line 334). DestinationRecordMatches compares every recorded identity/action/state field to that approval. Every record is checked before declaring absence, including records whose identifiers no longer match the requested approval. Six rehashed evidence regressions preserve one write and 400000 held units. |
| Revocation/emergency stop ordering | Both controls serialize on the same authority transaction as submission (shared lines 195–207). Existing tests prove control-before-commit denial. New separate-process tests pause after destination commit while the authority lock remains held, submit the competing control, then release the worker: the committed write survives and reconciliation retains 400000. Stop deactivation does not release exposure or create a claim; unreconciled/unrevoked valid claims can resume afterward. Sources: multi-worker.test.mjs lines 106 and 211. |
| Legacy and optional runtime isolation | Package builder adds the optional subpath without importing it from the legacy root. Installed validation actually executes SDK, CLI, state-binding and MCP on Node 20.19.0; Node 24.21.0 additionally exercises the shared subpath. Unsupported shared imports fail with the explicit floor error and do not poison legacy imports. |

## Actual runtime and validation evidence

Temporary official Windows x64 Node 20.19.0 was downloaded to the ignored .atg-evaluation/mission-02-node20 directory. Its node.exe SHA-256 was checked against the official version's SHASUMS256.txt:

6e3a39787e667d50487f7335c85636c2823a53e636d73c2c841d45da4e57906c

No PATH, installation or machine-wide Node setting was changed. The installed Node remains v24.21.0. The Node 20 package test uses process.execPath for SDK, CLI and MCP children, so they execute the real temporary runtime rather than merely testing a version flag. It installs the freshly packed archive offline in a temporary project outside the repository.

| Check | Result |
| --- | --- |
| Expanded separate-process suite | 30/30 passed |
| Full regression and posttest after core fixes | 675 + 910 = 1585 passed; zero failures |
| Typecheck | Exit 0 |
| Node 24 test:plugin and installed-package smoke | 42/42 passed; optional shared SDK installed smoke passed |
| Actual Node 20 packed root/SDK/CLI/MCP | Exit 0; five state-binding cases passed |
| Node 20 optional import | Clear Node 24 requirement error; subsequent legacy root import passed |
| Reviewer, Challenge, both public validators | All exit 0; three Challenge cases passed |
| Final working/staged diff checks | Exit 0; line-ending notices only |

[Final validation summary](../reports/mission-02-final-review/summary.json) records actual exits, totals and hashes of local ignored logs. Original Mission 02 evidence remains intact. Additional before-fix, focused and Node 20 logs are retained locally, with hashes added to the review summary. One later replay assertion expected REJECT while the exhausted policy legitimately returned REFER; it was corrected to require a non-authorising outcome, null GatePass and null handle. The validation runner stopped at that assertion before running the complete regression. Complete suites were then run after the correction.

Reproduce the full Node 24 sequence with npm run validate:mission-02 (set ATG_VALIDATION_REPORT_DIR to reports/mission-02-final-review to retain the original summary). Reproduce the Node 20 smoke by supplying npm_execpath and invoking the temporary node.exe on scripts/test-standalone-plugin-package.mjs. npm run demo:multi-worker runs the expanded process tests.

## Remaining limits and decision

The destination still supports exactly one synthetic order. Two successful approvals/reservations do not imply two destination writes. The 800000-unit sufficient-budget observation is made before writes and is therefore independent of that restriction.

Recovery is authoritative only within host-owned local files and fixture signatures on this one Windows machine. Digests are not protection against an administrator rewriting all state or possessing fixture keys. The clock remains fixed, there is no automatic expiry/window rollover, no distributed transaction, no independent partner evidence, and no production credentials. Crash orphans remain held until separately reviewed administrative tooling exists. Process-kill tests establish the tested commit/rollback/fencing behavior; they do not establish power-loss or hardware durability.

**READY FOR LOCAL MERGE** within the bounded local synthetic scope. Final local commit identity and clean working-tree status are verified in the task handoff after committing this reviewed diff. No merge, push, publication, release or published archive changes were performed.
