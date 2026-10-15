# Mission 03 local implementation and review report

This records the initial `b3ce99f` validation. The subsequent
[final review](mission-03-final-review.md) supersedes its readiness assessment
and records additional fixes and current results. The local.4 installation
results below cover the prior release, not installed Mission 03 functionality.

Branch: `mission-03-destination-evidence`.
Worktree: `C:\Users\Gareth\agent-trust-gate\.worktrees\mission-03-destination-evidence`.
Base: `0dcd8dfcb0583c0d242517764390acde9b244920`.
The final local commit is reported in the task handoff (`git rev-parse HEAD`).

Fetched origin without interactive login and verified the supplied upstream
commit. Its tree `5565c917f520e856c1ef0292856ce886cf15f194` exactly matches preserved
local release `8044c65b3ffba8da5ee0bea6eb6933882e3e56e0`. The original divergent
local main and all prior branches/worktrees remain intact. No merge, push,
publication, registry operation, tag, downloaded-archive replacement or state
migration/reset occurred.

## Implemented behavior

A separate destination process owns records, idempotency registrations,
permanent fences and a distinct generated Ed25519 signing key. ATG receives
only its explicitly pinned public key. The signed canonical envelope binds
approval/action/business state, transaction/idempotency IDs, outcome/version,
destination identity, challenge, authoritative lookup, fixed-clock freshness
and completed fencing. Approval evidence and execution evidence stay distinct.

The public-key verifier works without ATG writable state or the destination
private key. Shared authority uses the existing lifecycle/exposure rules but
does not hold authority SQLite locks across IPC. Invalid/unavailable/stale or
incomplete evidence retains the hold. Signed unfenced absence is refused.
Verified fenced absence abandons/revokes the old authority; delayed submissions
and registrations cannot write afterward. Verified execution commits exposure
and cannot be undone by stop/revocation. Unclaimed issued approvals are also
fenced before revocation can release their exposure.

Code review corrected explicit issuer pinning, interrupted-stop completion,
and the issued-approval revocation boundary. Tests exercise valid signatures
with semantically invalid evidence in the destination process itself, not by
giving its private key to ATG. All current mission inputs/source hashes stayed
unchanged during the final validation run.

## Actual validation

[Machine-readable summary](../reports/mission-03/summary.json) records exact
commands, runtimes, exit codes, durations, source/archive hashes, and retained
local log hashes. Final validation used Node **24.21.0** and the existing
temporary Node **20.19.0**; installed Node was not replaced.

| Check | Actual final result |
| --- | --- |
| Typecheck | Exit 0 |
| Focused Mission 03 tests | 25 passed, 0 failures |
| Full regression and posttest | 675 + 935 = 1610 passed, 0 failures |
| Actual Node 20 exact local.4 archive install | SDK, CLI, MCP shadow evaluation and all five signed-state cases passed; optional shared SDK/demo refused Node 20 clearly; subsequent legacy import passed |
| Actual Node 24 exact local.4 archive install | SDK, CLI, MCP, five signed-state cases, optional shared SDK and all seven packaged worker scenarios passed |
| Separate public-input verifier on actual Node 20 | Passed within focused/full tests |
| Reviewer and current-run Challenge | Exit 0; prior public Challenge recording retained |
| Public claims, discovery site and release validator | Exit 0 |
| Mission 03 demo | Passed: omitted acknowledgement, signed lookup recovery, consumed-response replay rejected |
| Working/staged diff checks | Passed; CRLF conversion notices only |
| Archive/Challenge preservation and source stability | Passed |

Focused failures include altered receipts, key injection, wrong keys/identity,
action/state substitution, replay, stale/future evidence, missing/unavailable
lookup, genuine signed unfenced absence, signed incomplete/non-authoritative
absence, transaction substitution, kills after destination write/fence commits,
destination restart, competing separate workers/budgets, delayed workers,
stop/revocation ordering, interrupted stop, unclaimed revocation and refusal to
overwrite existing state. Process barriers are explicit; timing sleeps do not
establish correctness.

Local.4 remains SHA-256
`164a25d41fdda287c4da265f7511802af4f358e7a3f5460395d6bf9377a66800`.
Local.2/local.3 remain their recorded hashes, and the release validator checks
all four checksum entries. Fresh Windows checkout CRLF bytes for Challenge
JSON were verified against reviewed LF content, then held byte-for-byte during
validation. No existing public evidence was regenerated.

All Mission 03 test/demo databases and newly installed smoke state are retained.
Final validation logs and demo inputs/results are under
`.atg-evaluation/mission03-validation/run-RmsHoq/`; test states are under
`.atg-evaluation/mission03-tests/`. Synthetic destination private keys stay in
ignored destination-owned evaluation directories and are excluded from this
commit. The immutable local.4 package was installed directly, never repacked.
Mission 03 remains source/demo work pending review and a separately versioned
package decision.

## Limits and review entry points

This demonstrates separate processes and signing roles on one machine with
synthetic keys, local SQLite records and the fixed clock
`2026-09-02T09:01:00.000Z`. It does not establish independent external capture,
hardware isolation, partner attestation, production key custody, live-time
freshness, multi-host safety, power-loss durability, or protection against a
host administrator or dishonest trusted signer. Offline verifiers need their
own durable pending-challenge tracking; ATG's integration supplies its own.

Start with [boundary and reproduction guidance](mission-03-destination-evidence.md),
the [evidence schema](../schemas/destination-evidence.synthetic.v1.schema.json),
and the [partner adapter contract](mission-03-partner-adapter-contract.md).
Genuine external evidence still requires partner-owned keys/custody and ledger,
authenticated out-of-band pins/transport, durable atomic idempotency/fencing,
live clock/replay/key-revocation semantics, partner-run evidence capture and
independent audits/failure tests against the actual integration.

Ready for Gareth and Dave's local review within this synthetic scope.
