# Mission 03 buyer release candidate — local.5

Ready for Gareth and Dave's approval of the final local release commit and
exact archive. No merge into main, push, publication, upload, tag or release
occurred. The final commit is supplied in the task handoff after committing.

- Branch/worktree: `mission-03-buyer-release` at
  `C:\Users\Gareth\agent-trust-gate\.worktrees\mission-03-buyer-release`.
- Reviewed Mission 03 parent: `327ab2fcae590de89e886abfc12fc181f56f8dac`.
- Verified published ancestor: `0dcd8dfcb0583c0d242517764390acde9b244920`.
- Preserved divergent original main: `8044c65b3ffba8da5ee0bea6eb6933882e3e56e0`.
- Archive: `discovery-site/downloads/agent-trust-gate-plugin-0.1.0-local.5.tgz`.
- SHA-256: **672484c3d3ac3e2efe69f2dee66fef465f10700c73c992274a6b1ea382bb2d7e**.
- Size: **154124 bytes**. These tested bytes were exclusively copied from the
  final temporary candidate, never rebuilt or replaced afterward.

## Integrated package

Unlike the prior source-only review, local.5 includes the reviewed Mission 03
runtime and separately signed destination process, optional public-verifier /
process-client / shared-authority / fresh-fixture exports, evidence-schema
export, `atg-destination-evidence` and `atg-evidence-verify` CLIs, buyer guide
and partner-adapter contract. Compiled code/types, schema and authored scripts
are checked against the exact archive. The legacy plugin root, SDK/CLI/MCP and
public verifier support Node 20; optional destination/shared SQLite requires
Node 24. Legacy imports never load the optional SQLite authority.

Synthetic destination keys are generated only inside the separate destination
process during explicit fresh setup. Installation/import/help creates no
keys/state. No destination private key, SQLite state, credentials or evaluation
directories are included in the archive. ATG obtains only a host-pinned public
key. Keys are not selected from receipts. All generated key/state directories
and test projects are retained.

First exact-archive Node 20 checks exposed an optional ESM/CommonJS import-cache
defect: after a failed optional module import, the fixture could see partial
CommonJS exports, or a related cached failure could escape. The release now
guards the ESM authority entry before loading its CommonJS SQLite dependency
and guards the fixture before dynamic authority loading. Repeated/mixed ESM
and CommonJS negative checks now pass; subsequent legacy imports remain usable.
The earlier temporary candidate archives and failed-check evidence are retained
under `.atg-evaluation/local5-candidate-001/` and `local5-candidate-002/`.
Final tested staging is `local5-candidate-003/`; no prior download was replaced.

## Actual validation

[Machine-readable validation](../reports/mission-03-buyer-release/summary.json)
records exact commands, runtimes, log hashes, source hashes, archive/proof
checks and retained fresh-project paths. Final tests used actual **Node
24.21.0** and the existing temporary **Node 20.19.0** executable. Installed
Node was not changed. No candidate pack/build command occurs during validation.

| Check | Final actual result |
| --- | --- |
| Typecheck | Exit 0 |
| Focused reviewed Mission 03 source tests | 35 passed, 0 failures |
| Full regression/posttest after release fixes | 675 + 945 = 1620 passed, 0 failures |
| Exact local.5 legacy install on actual Node 20 | SDK, CLI, MCP and all five signed-state cases passed; shared SDK/demo rejected unsupported runtime clearly |
| Exact local.5 legacy install on actual Node 24 | SDK, CLI, MCP, five signed-state cases, shared SDK and all seven worker scenarios passed |
| Exact local.5 Mission 03 install on actual Node 24 | Eight bundled CLI scenarios and all 35 reviewed cases passed against installed exports/runtime outside the repository |
| Exact local.5 Mission 03 install on actual Node 20 | Valid installed standalone verification passed with all writes and ATG-state/destination-private-key reads denied; optional exports/setup/demo rejected Node 20 without generating state/keys; legacy import still passed |
| Reviewer / current-run Challenge | Exit 0; existing public Challenge retained |
| Public claims / discovery / archive-checksums-links-evidence | Exit 0 |
| Checksummed archive contents | Five archive checksums; 54 exact compiled runtime/type files; new scripts/schema/guides/exports/bins verified; no state/private-key files |
| Working/staged diff checks | Passed; line-ending notices only |
| Preservation / source stability | Exact archive, earlier downloads, Challenge/local.4 recording and source hashes unchanged during final validation |

[Recorded local.5 evidence](../discovery-site/destination-evidence-results-local.5.json)
was produced by the **installed bundled CLI** from the checksum-identified
archive in a fresh project outside the repository. It contains public-key
verification inputs and signed proofs for eight cases: signed outcome,
tampering, replay/staleness, incomplete fence, killed destination after commit
before acknowledgement, fenced absence, delayed worker and missing evidence.
All recorded proofs verify; failure cases retain UNKNOWN until valid recovery.
The source and installed suites additionally exercise before-commit crashes,
wrong keys/identity/action/state, strict canonical JSON, repeated/mixed imports,
shared budgets, completed fences, restarts and control ordering.

The recorded local.4 worker results remain labelled local.4; the existing
Challenge remains local.3. Earlier downloads retain:

- local.2: `3303ae690b2b00de22e9b0ed6c52078d06fd1571d77984ea10d0f8484c02ee2a`.
- local.3: `62086a6cf7740ff72dafa81b821097d593b262ec019481654fb84caca5b673f0`.
- local.4: `164a25d41fdda287c4da265f7511802af4f358e7a3f5460395d6bf9377a66800`.

## Scope and approval handoff

This demonstrates separately signed, same-host synthetic destination evidence
on **one machine** with synthetic approval authority, generated destination
evaluation keys, local SQLite and the fixed clock
`2026-09-02T09:01:00.000Z`. It does not establish independent external capture,
host-administrator protection, live-time freshness, partner attestation,
production custody, power-loss durability, multi-host safety or a live partner
integration. Experimental Node 20 permission-denial tests prove functional
dependencies, not hardware isolation. External partner evidence still requires
the [partner adapter contract](mission-03-partner-adapter-contract.md).

Existing v1/v2 and held state is preserved, never reset or automatically
migrated. Missing/invalid/stale/incomplete evidence keeps UNKNOWN. Signed
absence requires committed authoritative lookup plus permanent fencing of old
submissions/registrations; execution remains COMMITTED. No blind retry or
automatic reauthorisation. Original divergent main, all prior mission branches
and worktrees remain intact. GitHub laptop authentication remains unresolved;
no browser login was restarted.

Follow [the publication runbook](mission-03-publication-runbook.md) **only after
explicit approval of the final commit, its Mission 03 ancestors and this exact
archive/hash**. The updated static site/workflow is prepared locally; the
local.5 URL activates only after that approved deployment.
