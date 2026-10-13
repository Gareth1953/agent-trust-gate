# Mission 01 — integration with current upstream main

Ready for Gareth and Dave to review. No push, merge, publication or release occurred.

## Preserved state and integration base

- Verified origin fetch/push URL: `https://github.com/Gareth1953/agent-trust-gate.git`.
- Starting checkout: `main`, `953f585d1818db0d29c9fa8cdfbc34dd2e4c2d41`, with exactly the Mission 01 tracked changes and five untracked mission files. No unrelated user changes were found.
- Preserved branch: `mission-01-preserved`; commit: `2e452b6db73bd5784ab7fff5696711d5f86d2667`. Its ten reviewed files include the original destination, tests, documentation and summary. Logs remain untouched and excluded from staging; no secrets were included.
- Fetched upstream base: `2730a9379a1f620b8d2ab934b62eddf2c7d934be`, “Add three-case ATG Challenge with recorded synthetic evidence”. Fetch did not change the working tree.
- Integration branch: `mission-01-current-main`.
- Separate worktree: `C:/Users/Gareth/agent-trust-gate/.worktrees/mission-01-current-main`.
- No applicable AGENTS.md was present in either checkout or its ancestors. The preserved checkout now has only the new worktree directory as an untracked path; its tracked mission files are unchanged from the preservation commit.

## Architecture and actual change

Current main includes `AtgPurchaseOrderConnector`, standalone plugin exports and the three-case Challenge. The connector already had an exclusive directory lock, a privately captured state snapshot, synchronous conditional comparison at commit, a durable attempt journal and destination-derived reconciliation. Its state snapshot was explicitly outside the GatePass signature.

The integration adapts the original mission's binding/check semantics into that connector. It does not copy the original parallel destination or modify the generic simulated adapter. Existing core signing/verifying, lifecycle and exposure authority are reused; the binding is payload under the existing GatePass, never a second authority token.

The approval-to-outcome chain is now:

`approve().approvedBusinessStateDigest = signed canonicalArguments.businessStateBinding.businessStateDigest = journal.businessStateDigest = hash(destinationRecord.businessState)`

The versioned payload also binds the approved request digest, supplier, amount in minor units, currency and fixed destination identity. The authoritative fixture snapshot binds order identity/version, supplier-bank reference/version and revision. Supplier/amount/currency come from the exact approved request; this fixture has no independent pre-existing ERP order terms.

Approval captures and copies state before assessment. The gateway copies those exact host-approved bytes before its assessment await and validates digest/request correspondence; it never reloads newer state for signing. An edit during assessment can leave a signed stale approval, which execution refuses. It cannot become approval of newer state. A correctly signed substituted newer snapshot is also refused against the connector's retained approved bytes.

Execution requires enforced ACCEPT, the exact request, matching signed state and the existing durable reservation. The destination re-verifies the GatePass and approved binding, reads current state, compares versions/digests and writes synchronously without an intervening await. The existing one-record constraint, lock and journal continue to prevent replay. The new race fault advances state after preliminary verification and before commit; it records no order and conservatively retains UNKNOWN until lookup confirms absence. Fresh approval is then required.

The journal retains the signed GatePass and exact binding. Reconciliation verifies them against the request and recorded state and reports `signedBusinessStateVerified`. Lost acknowledgement retains UNKNOWN/exposure; destination lookup confirms the one existing order without retry. Legacy unbound GatePasses cannot execute this connector. Existing journals remain readable, but a legacy executed record without signed state cannot satisfy the new signed-evidence comparison and remains UNKNOWN for review. Confirmed absence can release its hold without authorising reuse.

## Files changed

- [purchase-order-state-binding.ts](../src/purchase-order-state-binding.ts): versioned canonical payload and state/request validation; no destination or authority store.
- [mcp-exact-action-gateway.ts](../src/mcp-exact-action-gateway.ts) (lines 504, 606, 650): optional host-approved binding, immediate snapshot and inclusion in existing signed canonical arguments. MCP schemas and ordinary plugin evaluation remain compatible.
- [purchase-order-connector.ts](../src/purchase-order-connector.ts) (approval 134, execution 152, commit 203, evidence 313, verifier 331): exact approved digest retention, signature/binding checks, bounded commit-race fault and signed recovery evidence.
- [standalone-plugin.ts](../src/standalone-plugin.ts): exports the binding type alongside existing connector types; existing SDK methods stay available.
- [purchase-order-state-binding.test.ts](../test/purchase-order-state-binding.test.ts): 16 meaningful tests for digest continuity, assessment/signing races, commit races, field tampering, substituted snapshots, valid legacy unbound authority, valid newer signed state refusal and journal substitution after lost acknowledgement.
- `package.json`: focused command; tests included in `posttest` and `test:plugin`.
- [Package-install smoke test](../scripts/test-standalone-plugin-package.mjs): runs npm's CLI through Node and uses a scratch cache; fixes the baseline Windows launcher/cache failure without changing product behaviour.
- Technical guides: purchase-order connector, standalone plugin, plugin verification and Challenge now distinguish this local candidate from unchanged published archives/recordings.
- This report and [validation summary](../reports/mission-01-integration-checks/summary.json). Full output remains in ignored local .log files beside the summary.

## Actual validation

| Command/check | Result |
| --- | --- |
| Focused binding + connector + plugin + lifecycle + policy + MCP regression | 93/93 passed |
| `npm run typecheck` | Exit 0 |
| `npm test` including posttest | Exit 0; 675 main + 871 posttest = 1,546 passed; zero failures |
| `npm run test:plugin` | Exit 0; 33/33 tests plus packing/offline installation in a fresh external project; SDK, CLI purchase-order recovery and MCP smoke passed |
| `npm run reviewer` | Exit 0; all reviewer scenarios passed |
| `npm run demo:challenge` | Exit 0; all three cases passed; published challenge-results.json was not rewritten |
| `npm run validate:public-claims` | Exit 0 |
| `npm run validate:discovery-site` | Exit 0 |
| `git diff --check` | Exit 0; only line-ending conversion notices |

Baseline: before integration, current-main plugin/connector unit tests passed 17/17; Challenge and both validators passed. The package-install stage of `test:plugin` failed on the Windows npm.cmd launcher. Running npm directly exposed a restricted default cache path; the isolated-cache launcher fixes both. No failing unit-test baseline or remaining regression was observed.

Reproduce from the integration worktree with `npm run test:purchase-order-state-binding`, then `npm run test:plugin` and `npm run demo:challenge`.

## Explicit limits and partner sandbox requirements

Approval still evaluates repository synthetic human-authority/approval fixtures. It does not show an ERP snapshot to a real approver or obtain an independently authenticated human signature on that state. Signing keys and time remain fixtures. Destination records and combined evidence hashes are same-host data, not independent external evidence. This candidate has not changed the downloaded plugin or published Challenge recording.

Single-process locking and synchronous writes are not multi-worker transactions. The journal, authority store and destination remain separate files; power-loss durability and crash-lock recovery remain limited as documented in the connector guide. No live ERP, payment, customer data, distributed safety or production readiness is claimed.

A real partner sandbox needs explicit non-production authorisation and synthetic data; authoritative order/supplier/payment versions and terms; exact-state human review and trusted keys/time; destination-owned least-privilege credentials and closure of bypass write routes; native conditional transactions and idempotency; shared atomic consumption/exposure controls; crash and lost-acknowledgement recovery; authenticated independent destination/audit reads; and agreed stop/reconciliation procedures. Those external capabilities remain future work.

## Final review follow-up

The final review found and fixed recovery consistency, a double-read of a host binding accessor, and numeric subprocess exit-code propagation. [Final code review and validation](mission-01-final-review.md) records the updated result: 1,555 regression tests, 42 plugin/launcher tests plus installed-archive smoke, and all requested compatibility checks passed. The earlier validation above remains the historical integration result.
