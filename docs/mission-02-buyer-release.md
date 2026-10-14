# Mission 02 buyer release candidate — local.4

## Candidate identity

- Base: 56cd3707c767f9e40d211617ad9b4b17867f9419, clean local main before preparation.
- Candidate branch: mission-02-buyer-release. Main and mission-02-multi-worker remain at the reviewed Mission 02 commit.
- Plugin version: 0.1.0-local.4, private evaluation package.
- Archive: discovery-site/downloads/agent-trust-gate-plugin-0.1.0-local.4.tgz (131985 bytes).
- SHA-256: **164a25d41fdda287c4da265f7511802af4f358e7a3f5460395d6bf9377a66800**.
- No merge, push, tag, upload, registry publication, website deployment or release occurred. The final local release commit identity is supplied in the task handoff after committing this candidate.

The new archive was copied exclusively into a previously absent versioned path. SHA256SUMS adds its entry and retains all earlier entries. Published local.2 remains 3303ae690b2b00de22e9b0ed6c52078d06fd1571d77984ea10d0f8484c02ee2a; local.3 remains 62086a6cf7740ff72dafa81b821097d593b262ec019481654fb84caca5b673f0. The local.1 archive and original local.3 Challenge recording are also unchanged. Branches, worktrees and existing state were preserved; development demo directories were exclusively created and retained.

## What is packaged

The legacy package root, SDK, atg-plugin CLI and evaluation-only MCP retain Node 20 support. SharedPurchaseOrder remains available through the optional @agent-trust-gate/plugin/shared-purchase-order export and requires Node 24+. The new atg-multi-worker executable and bundled SHARED-WORKERS.md guide make the reviewed controls runnable from an installed archive outside the repository. Unsupported optional SDK/demo use produces the explicit Node 24 requirement error without breaking legacy imports.

The package adds only the demonstration and its existing worker helper, shared guide and bin metadata; the reviewed shared authority implementation is unchanged. The version constant advances to local.4. The demonstration uses explicit child-process IPC/stdout/stdin barriers and SIGKILL at known crash boundaries. It retains fresh SQLite v2 state and results.json for inspection, refuses an existing root, and does not migrate or reset v1 state.

This is multiple processes on one machine, local SQLite, synthetic authority/keys, fixed time and same-host destination evidence. It is not multi-machine distributed safety or independently captured evidence. Each scenario has one synthetic order. Distinct budget reservations are observed before any destination write. Authority and destination database commits remain independent; ambiguity holds exposure until validated fencing and reconciliation.

## Actual exact-archive observations

[Prepared public evidence](../discovery-site/multi-worker-results-local.4.json) was captured by installing the checksum-identified archive in a fresh temporary project on actual Node 24.21.0, then running the bundled command.

| Case | Actual writes | Exposure/recovery observation |
| --- | ---: | --- |
| Same approval competition | 1 | One claim; 400000 reserved, then committed |
| Distinct approvals / 600000 budget | 0 | One ACCEPT, one REFER; 400000 reserved |
| Distinct approvals / 1000000 budget | 0 | Two ACCEPT/two claims; 800000 reserved before submission |
| Kill after reservation | 0 | 400000 retained until NOT_EXECUTED reconciliation; then zero |
| Kill after destination commit | 1 | 400000 retained; EXECUTED reconciliation records COMMITTED |
| Delayed worker after recovery | 0 | STALE_AUTHORITY; released only after fenced absence |
| Kill after recovery fence commit | 0 | DESTINATION_FENCED while 400000 remains reserved; repeat lookup yields NOT_EXECUTED and releases |

All seven packaged scenarios passed. Amounts are GBP minor units. Results are reproducible observations of synthetic fixtures, not a partner attestation, performance claim or proof of power-loss durability.

## Actual validation

[Machine-readable validation](../reports/mission-02-buyer-release/summary.json) records exact commands, exit codes, test totals, runtime hashes, archive/evidence hashes and hashes of ignored local logs.

| Check | Result |
| --- | --- |
| Full regression, including posttest and 30 separate-process tests | 675 + 910 = 1585 passed; zero failures |
| Exact local.4 archive plugin tests on Node 24.21.0 | 42/42 passed plus installed SDK, CLI, MCP, signed-state and shared SDK checks |
| Exact archive packaged process demonstration | 7/7 passed from fresh installed project |
| Actual temporary Node 20.19.0 exact-archive SDK, CLI, MCP | Passed; all five installed signed-state cases passed |
| Node 20 optional shared export/demo denial | Clear Node 24 requirement; subsequent legacy import passed |
| Typecheck | Exit 0 |
| Reviewer | Exit 0; demonstration passed |
| Challenge | Exit 0; all three current-run cases passed; existing public recording retained |
| Public claims validator | Exit 0 |
| Discovery-site validator | Exit 0; relative links/assets and JSON valid |
| Archive/checksum/link validator | Exit 0; four archive checksums, 48 compiled runtime files, package bins/export/guide/scripts, retained Challenge signatures and seven recorded worker cases verified |
| Final working/staged diff checks | Exit 0; line-ending notices only |

The first complete regression found one release-specific failure: the README URL allowlist was hard-coded to local.3. It was narrowed to the current STANDALONE_PLUGIN_VERSION, preserving the existing URL restrictions. The failure log was retained, and the complete checks reran successfully. Initial demo development also fixed a closed-vs-close IPC acknowledgement mismatch before the archive was built. No authority-core change was needed.

Archive validation checks compiled runtime bytes exactly and authored scripts/docs after CRLF/LF normalization, so a Windows Git checkout cannot cause a false text mismatch. Binary archive/checksum validation remains exact. Success output now follows all release/evidence checks. The archive was not rebuilt or replaced after its exact-runtime tests.

Pages preparation continues to copy the selected static tree and verify SHA256SUMS. Its required-file checks now include local.4 and the new worker evidence JSON while retaining the local.3/Challenge checks. This edits the workflow locally without triggering it.

## Scope, state and approval handoff

Shared storage format v2 is explicit. Existing v1 directories fail closed and are preserved; no automatic migration/reset is provided. Fresh evaluation uses another new directory, not a way to erase existing ambiguity. Issuance/handle and fence-registration/authority-commit crashes can leave held orphan authority; no automatic orphan release/reuse is offered. The fixed clock does not establish live window rollover safety. See [buyer setup and recovery limits](shared-worker-evaluation.md).

The candidate is ready for Gareth's publication decision within this synthetic scope. Review the release commit, checksum and [publication runbook](mission-02-publication-runbook.md). Publication is a separate explicitly approved action; no public upload or release has occurred.
