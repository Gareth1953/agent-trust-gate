# Mission 02: shared worker controls and recovery

This initial implementation report is supplemented by the [final code and compatibility review](mission-02-final-review.md), which documents recovery fixes, the v2 shared format, expanded tests and actual Node 20 validation.

## Baseline and scope

Exact base: c93d25aa810d3a813cfa5aefe2f85997089dc7f8 (Mission 01). On 14 October 2026, fetched origin and verified HEAD and upstream main both matched this commit, with no diff or user changes. Created mission-02-multi-worker from origin/main. No applicable AGENTS.md was found in the repository or its ancestor directories. Preserved the existing Mission 01 branch/worktree. No merge, push, publication, release, or published archive replacement is part of this mission.

This is one host-owned local synthetic order, one fixture mandate/policy/currency/counterparty scope, on one Windows machine. It is an opt-in SDK workflow; MCP continues to expose evaluation only. The legacy connector remains single-owner. Multiple workers must use the new shared store together; legacy and shared state directories are not interchangeable.

## Storage and authority reuse

Two independent SQLite databases, authority.sqlite and destination.sqlite, have matching random store identities. Each contains a versioned, digest-checked snapshot row. JSON is the serialized payload inside SQLite, not a replacement-file transaction mechanism. BEGIN IMMEDIATE encloses read, validation, mutation, and commit, using SQLite's OS file locks across processes. Rollback journaling uses journal_mode=DELETE, synchronous=EXTRA, a 5-second busy timeout, and startup quick_check. See [SQLite locking and journaling](https://sqlite.org/lockingv3.html) and [synchronous settings](https://sqlite.org/pragma.html#pragma_synchronous).

The existing LocalDurableLifecycleStore now accepts a host-owned transactional snapshot adapter. Its existing transition, exposure, operator-evidence and integrity validation functions run unchanged on the current SQLite snapshot within each transaction. The core snapshot's legacy single-process flag describes that internal rules object, not the shared facade; the facade advertises multipleProcesses. The evaluation gateway accepts the four lifecycle methods it actually needs. The Mission 01 signed-state verifier is reused at approval load and destination commit. Existing filesystem-backed behavior remains the default.

The rule is persisted once and worker rule mismatches fail closed. Approval issuance atomically checks and adds OUTSTANDING exposure before an approval handle becomes usable. Concurrent evaluation previews cannot oversubscribe the shared ceiling. Claim changes ISSUED to RESERVED and stores one random token under the same authority lock. Only one worker obtains it. Destination registration is a separate commit; no token is returned before authority claim commit succeeds.

Submission holds the authority transaction while checking stop/status/token and committing the independent destination transaction. The destination verifies its fence token, original signature, exact request, supplier, amount/currency, fixed destination, and current order/bank/revision binding. GatePass, nonce and order identity are idempotency guards. There is at most one record for the fixed synthetic order.

There is **no atomic transaction spanning authority and destination**. Destination commit can survive while the authority transaction rolls back. An EXECUTED submission response means destination commit with acknowledgement pending; authority remains RESERVED until destination-derived reconciliation.

## Recovery and control ordering

- Death, missing acknowledgement, failed storage, and waiting do not expire a worker claim or release exposure. There is no lease-stealing, timed retry, or background release.
- Recovery validates the stored signed approval and registered synthetic operator evidence. Under the authority lock it commits a null destination fence and authoritative destination lookup, then commits the resulting authority lifecycle/exposure. Absence is usable only after this fence commit; caller-supplied absence is never accepted.
- Matching record: EXECUTED/COMMITTED, exposure retained. Verified absence: ABANDONED/RELEASED, old approval remains consumed, fresh approval required. Unavailable or inconsistent evidence: UNKNOWN response and hold retained. Repeated reconciliation is safe.
- Crash after fence commit but before authority commit: the old snapshot remains RESERVED while the destination token is invalid. The real old token is rejected by DESTINATION_FENCED. Recovery can repeat the lookup. A delayed worker after completed recovery is rejected by STALE_AUTHORITY.
- Revocation and emergency stop serialize against submission on the authority SQLite lock. If control commits first, submission cannot write. If destination commit happens first, control cannot erase/reverse it; reconciliation records the write and keeps exposure. Reserved revocation changes status to UNKNOWN and requires reconciliation. Stop deactivation does not itself release exposure or grant a new claim; an existing still-valid claim can submit after deactivation if it has not been reconciled/revoked.
- Changed state at commit writes nothing and preserves the reservation until fenced absence reconciliation. SHADOW, REFER and REJECT return no usable approval handle.

## Dependencies and supported boundaries

The new runtime dependency is the Node built-in node:sqlite; no npm/native-addon package or compiler installation is added. This workflow is supported on Node 24+, tested on Windows with Node v24.21.0. Node 24 emits an experimental SQLite warning. The optional packed export is @agent-trust-gate/plugin/shared-purchase-order; the legacy package root still uses the existing Node >=20 entrypoint without eagerly importing SQLite. The final review subsequently verified the packed legacy SDK, CLI and MCP on an isolated actual Node 20.19.0 runtime. The installed-package test conditionally runs the optional SQLite smoke on Node 24+ and continues its legacy smoke on older supported runtimes. [Node SQLite API](https://nodejs.org/api/sqlite.html).

Use a local disk with working SQLite Windows file locking and host-controlled ACLs. Network shares, multiple machines, hostile administrators, database rollback/restoration, fixture signing-key compromise, and direct writes outside the facade are unsupported. Digests detect accidental corruption and inconsistency; they are not authentication against an attacker rewriting all local state. Windows ACL hardening is a deployment requirement, not supplied by POSIX mode bits. Initialization exclusively creates a new directory; missing, corrupt, incomplete or mismatched existing state is never automatically recreated.

The trusted clock remains the existing fixed synthetic reference time (2 September 2026); this mission does not introduce real-time expiry/window rollover. Reservations/UNKNOWN therefore never age out of shared accounting. A live clock requires explicit rules retaining ambiguous exposure across windows. There is no production key custody or independent external evidence capture.

The conservative issuance-to-handle and destination-fence-registration-to-authority-commit gaps can leave held, unreachable approvals after a crash. This mission never automatically releases or reissues these. A claim-registration rollback leaves an orphan destination fence that refuses reuse. Automated orphan administration, migration, backups and throughput/compaction are outside this workflow; they need separately reviewed evidence-driven tooling. The tested recoverable worker-death cases begin with a committed claim.

## Reproduction and actual validation

Run npm run demo:multi-worker (or npm run test:multi-worker). It builds and runs coordinated separate Node processes using IPC readiness/operation barriers. Faults inside synchronous transactions signal a stdout barrier and block on stdin; the parent kills the worker at that exact boundary. Tests contain no timing-only sleeps. The 15-second barrier deadline and SQLite busy timeout are failure bounds, not race coordination.

Run npm run validate:mission-02 for the complete sequence. [Machine-readable results](../reports/mission-02/summary.json) contain real exit codes, test totals and SHA-256 hashes of ignored local logs. Each log is retained beside the summary.

| Check | Actual result |
| --- | --- |
| Focused separate-process suite | 18/18 passed |
| Typecheck | Exit 0 |
| Full regression, including posttest | 675 + 898 = 1573 passed, zero failures |
| test:plugin | 42/42 passed; fresh-project archive install, SDK, CLI, MCP and optional shared SQLite SDK smoke passed |
| reviewer | Exit 0 |
| Challenge | Exit 0; three cases passed |
| validate:public-claims | Exit 0 |
| validate:discovery-site | Exit 0 |
| git diff --check and staged diff check | Exit 0; line-ending notices only |

Observed counts are in GBP minor units:

| Scenario | Destination writes | Exposure after recovery/control | Observation |
| --- | ---: | ---: | --- |
| Two workers, same approval | 1 | 400000 | One claim; destination replay refused |
| Two approvals, ceiling 600000 | 1 | 400000 | One ACCEPT, one REFER; no overspend |
| Kill after reserved claim, before submission | 0 | 0 | 400000 held before lookup; fenced absence releases |
| Kill after destination commit, before acknowledgement | 1 | 400000 | RESERVED survives; lookup records EXECUTED |
| Delayed worker after recovery and fresh execution | 1 | 400000 | Old token refused; only fresh approval writes |
| Changed state, then reconciliation | 0 | 0 | Hold retained until fenced absence |
| Revocation/stop before and after commit | 1 | 400000 | Early submission denied; later committed write retained |
| Locked authority or unavailable destination lookup | 0 | 400000 | UNKNOWN response without release |
| Kill before authority commit | 0 | 0 | Stop mutation rolls back; 400000 held until recovery |
| Kill after destination commit inside authority transaction | 1 | 400000 | Independent destination commit survives |
| Kill after fencing inside recovery | 0 | 0 | Original token refused by destination before repeat recovery |

Physical database corruption, snapshot digest corruption, invalid signature, missing destination, wrong database pairing and policy mismatch refuse open. Invalid operator evidence refuses reconciliation while retaining exposure. Tests demonstrate process termination/restart, rollback of uncommitted mutations, independent committed-write persistence, and fence persistence on this machine. They do **not** demonstrate power loss, disk/controller failures, torn sectors, hardware fsync compliance, every instruction-level crash point, or an exhaustive hot-journal/pager recovery campaign.

Initial focused runs found a Windows child-cleanup defect and an ineffective REFER fixture; both were corrected. Signature corruption injection was corrected to mutate the actual signature field. Final tests passed after these changes. Complete regression and packaging suites ran once. Final diff review also fixed an initialization error-path database-handle leak and moved rule validation before directory creation. Typecheck, focused process tests and installed-package smoke were rerun for that small initialization-only change; complete suites were not repeated.

## Files changed

- src/shared-purchase-order.ts: shared facade, persisted policy/approvals, single claim, idempotency/fences, reconciliation and ordered controls.
- src/durable-action-lifecycle.ts: snapshot/persistence adapter around existing authority rules.
- src/mcp-exact-action-gateway.ts: narrow evaluation-store interface; evaluation-only behavior preserved.
- src/purchase-order-connector.ts: export existing Mission 01 signed-state verifier for reuse.
- scripts/multi-worker-child.mjs and test/multi-worker.test.mjs: processes, barriers, kills, restart/fencing and corruption tests.
- scripts/build-standalone-plugin.mjs and scripts/test-standalone-plugin-package.mjs: opt-in packed export and installed shared SDK smoke.
- package.json and scripts/validate-mission-02.mjs: demonstration, regression integration and evidence commands.
- This report and reports/mission-02/summary.json: design and actual validation evidence.

## Requirements for a real partner sandbox

Real signed human authority and mandate registries; production keys and clock; authenticated worker/operator roles; hardened store/destination ACLs; authoritative partner state/version checks; partner-enforced fencing/idempotency and auditable lookup; explicit commit/control ordering across the partner boundary; persistent ambiguous holds across policy windows; orphan administration; consistent backup/restore and anti-rollback controls; disk/power-loss testing; and independent destination evidence. A remote partner cannot inherit local SQLite lock ordering automatically. A distributed protocol must be designed and tested rather than treating the two stores as a single transaction.
