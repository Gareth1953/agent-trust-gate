# P3-M160 Implementation and Validation Report

## Controlled baseline and final state

- Repository: `Gareth1953/agent-trust-gate`
- Branch: `main`
- Baseline HEAD: `c54043d5818fa9649a9c5cd8cbb019b9a46ec091`
- Baseline parent: `58806b4ee944fd260eca11c222c389c09410ec62`
- Baseline position: three commits ahead of `origin/main`, zero behind
- Baseline worktree and index: clean
- Lock subject: `P3-M160 add durable lifecycle and emergency controls`
- Intended final position: four commits ahead of `origin/main`, zero behind,
  clean; the immutable commit ID is recorded by post-commit verification because
  a commit cannot contain its own hash.

No push, merge, tag, release, deployment, external account access, outreach,
website change, downstream invocation, simulated execution, live execution,
payment, settlement, customer communication or purchase occurred.

## Files created

- `src/durable-action-lifecycle.ts`
- `test/durable-action-lifecycle.test.ts`
- `schemas/durable-action-lifecycle-state.schema.json`
- `schemas/aggregate-exposure-ledger-entry.schema.json`
- `schemas/gatepass-revocation-receipt.schema.json`
- `schemas/emergency-stop-record.schema.json`
- `schemas/lifecycle-reconciliation-record.schema.json`
- `docs/P3-M160-durable-lifecycle-and-emergency-controls.md`
- `docs/P3-M160-implementation-and-validation-report.md`

## Files modified

- `src/mcp-exact-action-gateway.ts`
- `src/index.ts`
- `package.json`
- `README.md`
- `docs/p3-mission-register.md`

No public discovery-site file and no existing v1 or v2 schema was changed.

## Storage architecture

The implementation adds a dependency-free `LocalDurableLifecycleStore` using
Node standard-library filesystem operations. One versioned JSON snapshot holds
lifecycle, exposure, revocation, emergency-stop and reconciliation records,
plus a monotonic revision and canonical integrity digest.

Within one process, mutations are synchronous and serialized. Each transaction
clones verified state, performs a same-directory exclusive temporary write,
flushes the file, atomically replaces the target, re-reads it, and validates
version, revision, digest, record versions, identifier uniqueness, transition
consistency and cross-record bindings. No authority is returned before this
confirmation. Deterministic fault injection covers interrupted writes.

An explicit `ATG_LOCAL_STATE_PATH`, constructor path, or injected store enables
restart reuse. The no-configuration fallback is an isolated OS-temp path. Test
cases use dedicated temporary directories and remove them. No state artefact is
committed.

This is a local single-process design. It makes no guarantee for shared
multi-process writers, distributed deployment, network filesystems, all power-
loss conditions, hostile hosts, high availability or tamper-proof storage.

## Transition table

| From | Permitted next state |
| --- | --- |
| `ISSUED` | `RESERVED`, `REVOKED`, `EXPIRED`, `ABANDONED` |
| `RESERVED` | `EXECUTED`, `FAILED`, reconciled `ABANDONED`, `UNKNOWN` |
| `UNKNOWN` | reconciled `EXECUTED`, `ABANDONED`, or `UNKNOWN` |
| `EXECUTED`, `REJECTED`, `REFERRED`, `REVOKED`, `EXPIRED`, `FAILED`, `ABANDONED` | none |

Reservation uses lifecycle-revision compare-and-set. Records bind GatePass,
action, policy and passport digests, subject, nonce, timestamps, amount,
currency, action family and exposure entry. `REJECTED` and `REFERRED` contain
neither a GatePass nor exposure authority. `EXECUTED` is immutable.

## Aggregate exposure accounting

The additive registered exposure rule binds the existing synthetic buyer policy
ID/version, purchase family, GBP, supplier class and a 24-hour window. The
fixture ceiling is 1,000,000 minor units (£10,000), with maximum action count
three and exhaustion outcome `REFER`.

`OUTSTANDING`, `RESERVED`, `COMMITTED` and `UNKNOWN` count toward the ceiling.
Issuance and exposure creation occur in one snapshot transaction. Execution
commits exposure. Eligible revocation, expiry, formal abandonment or confirmed-
not-executed reconciliation releases unused exposure once. `UNKNOWN` remains
counted. Shadow returns a simulated preview without mutation. Cross-currency
aggregation rejects; no conversion exists.

## Revocation and emergency stop

Specific GatePass revocation is internal-only and requires registered synthetic
operator-authority evidence. Its distinct receipt binds GatePass ID, action
digest, reason, actor, authority digest and time. Revocation of `ISSUED` persists,
blocks reservation and releases unused exposure. Repetition returns the same
receipt without a second transition. `EXECUTED` history is not changed. A
revocation request after `RESERVED` records `UNKNOWN` and requires
reconciliation; it does not claim the possible action was stopped or reversed.

The global local-gateway emergency stop is persistent. Activation blocks new
GatePass issuance and new reservations. Shadow continues observationally and
mutates nothing. Activation and deactivation require operator evidence and each
creates a checksummed audit record. Existing execution history is unchanged,
and reserved/unknown work is never described as reversed.

No revocation, stop, reconciliation, administration or execution method is
exposed through MCP.

## Crash recovery

- A write interruption before confirmed `ISSUED` returns no GatePass.
- Restart preserves `ISSUED`; altered GatePass binding fails before reservation.
- Restart preserves `RESERVED`; retry does not reset it to `ISSUED`.
- Possible-effect/no-ack transitions to `UNKNOWN`.
- `UNKNOWN` cannot be reserved or retried automatically.
- Confirmed-not-executed reconciliation records `ABANDONED` and releases
  eligible exposure.
- Confirmed-executed reconciliation records `EXECUTED` and committed exposure
  without replay.
- Unresolved reconciliation remains `UNKNOWN` and counted.
- Truncated, digest-altered, inconsistent and unsupported-version state fails
  closed rather than resetting.

No lifecycle primitive invokes a downstream action.

## MCP integration and preservation

P3-M158 v1 and P3-M159 v2 requests remain supported. Existing passport,
canonicalisation, authority, standing, mandate, business policy, risk and
Evidence Decay Clock checks remain mandatory.

Legacy and v2 enforced `ACCEPT` paths now persist `ISSUED` before returning a
GatePass. V2 adds optional orchestration evidence for lifecycle, aggregate
exposure, emergency status and durable-state status without changing existing
serialized meanings. `REFER`, `REJECT` and Shadow still return no GatePass or
execution receipt. MCP remains protocol `2025-06-18`, local stdio, and exactly
one public tool: `atg.evaluate_action`.

P3-M158/P3-M159 controlled reports and schemas, the ANEOS report, GatePass
canonical digest/signature semantics, decision/execution separation and public
website remain protected.

## Deterministic reason codes

Lifecycle:

- `LIFECYCLE_ISSUED`, `LIFECYCLE_REJECTED_RECORDED`,
  `LIFECYCLE_REFERRED_RECORDED`, `LIFECYCLE_RESERVED`, `LIFECYCLE_EXECUTED`,
  `LIFECYCLE_FAILED`, `LIFECYCLE_ABANDONED`, `LIFECYCLE_EXPIRED`,
  `LIFECYCLE_UNKNOWN`
- `LIFECYCLE_INVALID_TRANSITION`, `LIFECYCLE_RECORD_NOT_FOUND`,
  `LIFECYCLE_BINDING_MISMATCH`, `LIFECYCLE_COMPARE_AND_SET_FAILED`,
  `LIFECYCLE_TERMINAL`, `LIFECYCLE_RECONCILIATION_REQUIRED`,
  `LIFECYCLE_UNKNOWN_NO_AUTOMATIC_RETRY`

Storage and exposure:

- `DURABLE_STATE_UNAVAILABLE`, `DURABLE_STATE_CORRUPTED`,
  `DURABLE_STATE_VERSION_UNSUPPORTED`, `DURABLE_WRITE_FAILED`,
  `DURABLE_WRITE_NOT_CONFIRMED`
- `EXPOSURE_WITHIN_LIMIT`, `EXPOSURE_AMOUNT_LIMIT_EXCEEDED`,
  `EXPOSURE_ACTION_COUNT_LIMIT_EXCEEDED`, `EXPOSURE_CURRENCY_MISMATCH`,
  `EXPOSURE_RULE_MISMATCH`, `EXPOSURE_RELEASED`,
  `EXPOSURE_ALREADY_RELEASED`

Revocation, operator and stop:

- `GATEPASS_REVOKED`, `GATEPASS_ALREADY_REVOKED`,
  `GATEPASS_REVOCATION_AFTER_EXECUTION_REFUSED`,
  `GATEPASS_REVOCATION_REQUIRES_RECONCILIATION`,
  `OPERATOR_AUTHORITY_INVALID`
- `EMERGENCY_STOP_ACTIVE`, `EMERGENCY_STOP_ACTIVATED`,
  `EMERGENCY_STOP_ALREADY_ACTIVE`, `EMERGENCY_STOP_DEACTIVATED`,
  `EMERGENCY_STOP_ALREADY_INACTIVE`

Reconciliation:

- `RECONCILIATION_CONFIRMED_NOT_EXECUTED`
- `RECONCILIATION_CONFIRMED_EXECUTED`
- `RECONCILIATION_STILL_UNKNOWN`

## Validation results

- Focused P3-M160 plus unchanged P3-M159/P3-M158 suites:
  `npm run test:durable-lifecycle` — **60 passed, 0 failed**.
- P3-M160-specific tests: **24 passed, 0 failed**.
- Complete repository `npm test`: **675 primary + 779 post-tests = 1,454
  passed, 0 failed**.
- `npm run typecheck`: passed.
- `npm run build`: passed.
- All repository schema JSON parses; all five new record types validate against
  their schemas.
- `git diff --check`: passed.

Focused coverage includes confirmed issuance-before-return, transition/CAS
safety, restart, corruption/version/truncation, deterministic write failure,
aggregate amount and concurrency, outstanding/committed/unknown accounting,
release-once rules, Shadow non-mutation, currency isolation, revocation and
idempotence, post-reservation/after-execution behavior, stop persistence and
authority, storage failure, all reconciliation findings, schema validation and
absence of MCP administration/execution tools.

## Dependencies, privacy and security

No dependency was added, removed or updated. `package-lock.json` is unchanged.
The implementation uses Node filesystem/path/OS facilities and existing ATG
canonical hashing, exact-action, policy and MCP machinery.

Only synthetic identifiers, controlled reasons, digests and integer amounts
are stored. No credential, token, private key, personal data, customer data,
real supplier/bank data or operational secret was added. Retention and deletion
remain explicit local-operator responsibilities; there is no automated
retention service.

## Limitations and deferred work

This remains a single-process local demonstrator and is not production ready.
It has no multi-process lock, database transaction, distributed consensus,
replication, high availability, production identity/key custody, live
execution acknowledgement or external effect reconciliation source.

P3-M161 was not begun. The exact next proposed mission is
`GO-ATG-P3-M161-LOCAL-PURCHASING-LIFECYCLE-DEMONSTRATION`, under separate
authorisation. The final ten-case purchasing demonstration, Customer Trust
Receipt and Buyer Adoption Proof Pack remain deferred.
