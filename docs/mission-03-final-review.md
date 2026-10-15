# Mission 03 final review

Reviewed the actual committed diff from
`0dcd8dfcb0583c0d242517764390acde9b244920` to
`b3ce99fca5d2372c7ad0205716f92a41fbd69bd5` and its connected legacy signature,
state-binding, lifecycle and packaging code. Review fixes are a new local
commit on `mission-03-destination-evidence`, preserving both earlier commits,
the divergent original main, other branches/worktrees and held state.

## Findings and fixes

1. **Canonical signed-byte coverage defect — fixed.** Both inherited
   canonicalizers assign sorted keys into ordinary objects. An own nested
   `__proto__` property can disappear from the serialized bytes. A reproducer
   against `b3ce99f` added unsigned data to a receipt's approved business state;
   verification incorrectly returned true. Mission 03 now validates complete
   strict JSON before signing, signature verification or inherited hash
   comparison. It rejects prototype properties, accessors without invoking
   them, hidden fields, non-JSON values, cycles and sparse arrays. The same
   protection applies to approval, trust and expected lookup inputs. Valid v1
   bytes are unchanged; legacy published runtime/archive bytes are untouched.

2. **Incomplete requested fence on EXECUTED lookup — fixed.** The original
   verifier allowed a valid execution response with a null fence even when the
   expected lookup requested fencing. This did not release committed exposure,
   but accepted incomplete recovery evidence. The verifier now requires that
   proof for every fenced lookup, and the schema enforces the same presence
   rule. A legitimately signed missing-fence response retains UNKNOWN.

3. **Verification test isolation gap — strengthened.** The original verifier
   test merely used a different working directory. Actual Node 20 now runs
   with experimental permissions denying all writes, ATG authority reads and
   destination-private-key reads. Explicit denial assertions run before
   successful verification. Only public inputs and runtime code are readable.
   This proves functional independence within the test, not hardware or
   production isolation.

4. **Crash and semantic-failure coverage — expanded.** Explicit barriers now
   exercise process kills inside uncommitted destination write/fence
   transactions, in addition to the existing after-commit boundaries. Another
   test kills an authority worker after durable registration before its
   acknowledgement. Signed wrong-destination, wrong-action and wrong-state
   evidence are tested without exposing the destination key to ATG. Shared
   budget, delayed worker, restart, replay and control-ordering tests remain.

## Reviewed boundaries

The destination generates and reads its own private key; ATG obtains only the
public key during explicit synthetic host bootstrap. Trusted issuer/key IDs,
destination identity and public-key pins are host configuration, not receipt
inputs. Reused signing-role keys and changed destination pins fail closed.
The ATG approval fixture key remains public synthetic material; this is not
production signing or proof of custody.

Signatures cover the versioned canonical envelope. The verifier additionally
checks exact approval/GatePass, action, request, signed business-state
digest/versions, idempotency, transaction/version/record digest, identity,
lookup challenge/request and fixed-clock freshness. ATG persists pending
challenges, supersedes older requests and consumes successful evidence with
the lifecycle transition. The stateless verifier requires the caller's honest
expected challenge; external consumers need durable replay tracking.

Signed absence is usable only after an authoritative records lookup and
permanent GatePass/idempotency fence commit in the destination transaction.
No signature is exposed to ATG until that transaction commits. The authority
holds exposure until verification and its separate lifecycle transaction
complete. Pre-commit rollback, post-commit lost acknowledgement, unavailable
lookup, invalid/partial evidence and delayed workers are all tested. No local
SQLite ordering is assumed across IPC; the destination owns write/fence
linearization. A write ordered before stop remains COMMITTED, never released.

## Packaging decision

**Source/demo local integration only.** The plugin builder and export map do
not include Mission 03. No Mission 03 plugin candidate or release is intended
in this mission. Local.4 installation tests cover **the prior release**, as
compatibility and archive-preservation checks. They do not demonstrate
installed Mission 03 functionality. New functionality is tested from compiled
Mission 03 source and separate processes, including the restricted verifier.

Future plugin inclusion must be a separate packaging change with a new
reviewed version, a temporary candidate containing all required runtime,
destination/verifier scripts/schema/guides, and fresh installed-functionality
tests. The published local.4 download must never be replaced.

## Authentication correction

Noninteractive Credential Manager account listing returns **Tempest1953**.
An explicit Gareth1953 credential lookup with `GCM_INTERACTIVE=never` and
`GIT_TERMINAL_PROMPT=0` returns no available credential. Earlier combined
output also printed **Gareth1953 as the repository username selection**;
that configuration value was not a second saved or API-verified account.
Gareth1953 authentication/write access therefore remains unverified. No browser
login was restarted and no credential, token or password was printed, removed
or changed during this review.

## Validation and readiness

**READY FOR LOCAL INTEGRATION**, within the source/demo scope above.
[Final machine-readable evidence](../reports/mission-03/final-review-summary.json)
records actual commands, exit codes, log/source hashes and retained state paths.
Final code/source hashes stayed unchanged during validation.

| Final check | Actual result |
| --- | --- |
| Focused Mission 03 | 35 passed, 0 failures |
| Full regression and posttest after substantive fixes | 675 + 945 = 1620 passed, 0 failures |
| Typecheck | Exit 0 |
| Actual Node 20.19.0 restricted standalone Mission 03 verifier | Passed with all writes and authority/private-key reads denied |
| Prior local.4 exact archive install on actual Node 20.19.0 | SDK/CLI/MCP and five signed-state cases passed; optional shared SDK/demo refused Node 20 clearly |
| Prior local.4 exact archive install on actual Node 24.21.0 | SDK/CLI/MCP, five signed-state cases, shared SDK and all seven packaged worker scenarios passed |
| Reviewer, Challenge, public claims, discovery and release validators | Exit 0 |
| Mission 03 source demo | Passed |
| Working/staged diff checks | Passed; line-ending notices only |
| Archive/Challenge preservation | Passed; local.4 hash remains 164a25d41fdda287c4da265f7511802af4f358e7a3f5460395d6bf9377a66800 |

Logs and fresh state are retained under
`.atg-evaluation/mission03-validation/run-IBqeZu/` and
`.atg-evaluation/mission03-tests/`; earlier evidence/state is also retained.
The final review commit is reported in the task handoff (`git rev-parse HEAD`).
No merge, push, publication, release, credential reset or state migration
occurred. Gareth1953 authentication remains a separate unresolved account-access
issue and is not required for local source integration.

The scope remains synthetic keys, one machine/same-host records and the fixed
test clock `2026-09-02T09:01:00.000Z`. Live-time freshness, external capture,
partner attestation, production key custody, multi-host safety, power-loss
durability and protection against the host administrator/dishonest signer are
not established. External integration still requires the
[partner adapter contract](mission-03-partner-adapter-contract.md).
