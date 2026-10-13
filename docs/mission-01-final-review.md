# Mission 01 — final code review

Reviewed integration commit `e659874495c782cbb29c752e6e5deee54c0778f1` against base `2730a9379a1f620b8d2ab934b62eddf2c7d934be`, including the actual diff, complete connector, gateway/signature path, plugin/MCP/Challenge entrypoints, package launcher and tests. Review fixes are on `mission-01-current-main` in `C:/Users/Gareth/agent-trust-gate/.worktrees/mission-01-current-main`. The original `mission-01-preserved` branch remains at `2e452b6db73bd5784ab7fff5696711d5f86d2667`.

## Findings, ordered by severity

1. **P2 — fixed: a retagged journal handle could falsely establish destination absence.** Rehashing only the journal evaluation ID after a lost acknowledgement hid the existing order from a handle-only lookup. Reconciliation returned NOT_EXECUTED and released UNKNOWN exposure despite one recorded order. This lookup weakness was inherited from the base connector. The destination lookup now also matches GatePass identity and the signed action digest; an inconsistent handle fails the outcome comparison and retains UNKNOWN. Source: [connector](../src/purchase-order-connector.ts), lines 238–244. The regression at [binding tests](../test/purchase-order-state-binding.test.ts), line 140, failed before the fix and now proves the order and hold remain intact.

2. **P2 — fixed: invalid signed recovery evidence could release an UNKNOWN hold when no record existed.** The signed comparison previously gated only a found record. A rehashed invalid journal binding following timeout-before-commit still returned NOT_EXECUTED. Signed recovery fields now require valid original signed authority for both presence and absence outcomes. Source: [connector](../src/purchase-order-connector.ts), lines 241–243. The regression at [binding tests](../test/purchase-order-state-binding.test.ts), line 150, failed before the fix and now confirms retained UNKNOWN exposure. The documented legacy journal absence-only recovery remains compatible; it grants no execution authority.

3. **P3 — fixed: an accessor-based host binding option was evaluated twice before signing.** A computed option could return approved state on its first read and newer state on its second; the newer binding was copied and signed. The normal connector already supplied a protected plain object, so this affected the optional host gateway API. It now reads once and immediately copies that value. Source: [gateway](../src/mcp-exact-action-gateway.ts), lines 506–508. The regression at [binding tests](../test/purchase-order-state-binding.test.ts), line 159, reproduced two reads and now checks both one read and the original signed digest.

4. **P3 — fixed: the package-test launcher converted numeric child failure codes to 1.** Throwing an ordinary error preserved failure but lost the child status, and diagnostics could omit it when stderr was populated. [Checked command helper](../scripts/checked-command.mjs), lines 3–16, preserves the numeric status and output diagnostics; [package smoke](../scripts/test-standalone-plugin-package.mjs), line 62, propagates that status after cleanup. [Launcher tests](../test/checked-command.test.mjs) use real child processes, check stdout/stderr failures, spawn failure and timeout, and verify that the complete smoke process exits 23 with a spaced npm CLI path and an isolated cache.

No unresolved blocking finding remains within the bounded local synthetic scope. These fixes do not establish protection against an administrator rewriting all local files or possessing the fixture signing keys.

## Boundary review

- The connector captures the exact state and request before assessment, passes a copy to the gateway, privately retains the original binding, and refuses a different signed snapshot. The gateway snapshots once before awaiting and does not reload destination state for signing. Assessment races and replacement with correctly signed newer state are tested.
- At commit, the destination re-verifies the signed binding and compares the current record identity/version, bank state and revision synchronously. A state edit after preliminary verification produces no order and retains UNKNOWN pending reconciliation. Supplier/amount/currency and destination are bound to the exact approved request and fixed synthetic destination; they are not independently sourced ERP terms.
- Invalid signatures, unsupported/missing state bindings, legacy unbound authority, replay, SHADOW, REFER and REJECT cannot write. Tests include cryptographically valid unbound and substituted-state GatePasses, rather than relying only on malformed signatures.
- Lost acknowledgement preserves the durable UNKNOWN hold and denies retry/fresh work until destination-derived reconciliation. The journal retains the original signed GatePass; reconciliation compares its request/state to the destination record. New regressions prove inconsistent recovery data cannot clear the hold.
- The plugin facade, closed MCP request schemas, evaluation-only tool list and three Challenge cases remain compatible. Packed-archive installation tests run outside the repository. Published archives and Challenge recordings remain untouched.
- The launcher uses direct argument arrays without a shell, retains the scratch cache, preserves child exit codes and diagnostics, and treats spawn/timeout errors as failure.
- The tests check observable writes, signed digest continuity, real signature failure, durable exposure status, denial/recovery and actual process exit codes. Newly reproduced defects were tested failing before repair.

## Actual final validation

| Check | Result |
| --- | --- |
| Focused connector/binding/plugin/lifecycle/policy/MCP/launcher regression | 102/102 passed |
| `npm test`, including posttest | 675 + 880 = 1,555 passed; zero failures |
| `npm run test:plugin` | 42/42 passed, plus fresh-project packed installation, SDK, CLI and MCP smoke |
| `npm run typecheck` | Exit 0 |
| `npm run reviewer` | Exit 0 |
| `npm run demo:challenge` | Exit 0; all three cases passed |
| `npm run validate:public-claims` | Exit 0 |
| `npm run validate:discovery-site` | Exit 0 |
| `git diff --check` | Exit 0; line-ending conversion notices only |

[Machine-readable validation summary](../reports/mission-01-final-review/summary.json); full output is retained in ignored local logs beside it. Reproduce with `npm run test:purchase-order-state-binding` and `npm run test:plugin`.

Review fixes and their tests/documentation are preserved in a local follow-up commit; final working-tree status is verified after committing. The original checkout has only its nested worktree directory as an untracked path, with no changes to preserved mission files. No push, publication, release or merge occurred.

**Recommendation: READY FOR LOCAL MERGE.** This recommendation covers the bounded synthetic implementation. Real human approval to an external authoritative snapshot, production key custody, destination access control, distributed exposure transactions and independent external execution evidence remain future work.
