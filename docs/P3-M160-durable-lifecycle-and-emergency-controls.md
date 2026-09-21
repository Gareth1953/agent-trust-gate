# P3-M160 Durable Lifecycle and Emergency Controls

## Boundary

P3-M160 is a local, single-process, synthetic durability demonstrator beneath
the existing P3-M158/P3-M159 gateway. It adds no MCP tool: the public MCP
surface remains local stdio protocol `2025-06-18` with exactly
`atg.evaluate_action`. There is no execution, administration, revocation,
reconciliation or emergency-control MCP method.

No live action, payment, settlement, customer communication, network call or
external system occurs. Durability does not establish production readiness.
The store is not distributed, tamper-proof or high availability.

## Storage model

`LocalDurableLifecycleStore` persists one versioned JSON snapshot containing:

- exact-action lifecycle records;
- aggregate-exposure entries;
- specific GatePass revocation receipts;
- emergency-stop state and activation/deactivation records;
- reconciliation records;
- a canonical SHA-256 integrity digest and monotonic store revision.

Each mutation clones the verified in-memory state, applies one transaction,
writes a same-directory temporary file, flushes it, atomically replaces the
configured state file, re-reads it, and verifies its version, revision,
structure, cross-record bindings and digest before authority is returned.
Process-local synchronous transactions serialize competing calls.

Set `ATG_LOCAL_STATE_PATH` to the same explicit local path across launches for
restart persistence. A caller may instead pass `durableStatePath` or a store
instance internally. With no explicit path the gateway uses an isolated OS
temporary path. Tests use dedicated temporary directories and remove them.

The atomic-replacement model depends on local filesystem rename and flush
semantics. It does not promise protection from all power-loss, hardware,
malicious-host, multi-process or network-filesystem failures. Multiple
processes must not share a file. Corruption, truncation, unsupported versions,
inconsistent links, unavailable storage or unconfirmed writes fail closed.

## Lifecycle transition table

| From | Permitted next state |
| --- | --- |
| `ISSUED` | `RESERVED`, `REVOKED`, `EXPIRED`, `ABANDONED` |
| `RESERVED` | `EXECUTED`, `FAILED`, `ABANDONED` through reconciliation, `UNKNOWN` |
| `UNKNOWN` | `EXECUTED`, `ABANDONED`, or remain `UNKNOWN` through reconciliation |
| `EXECUTED` | none |
| `REJECTED` | none |
| `REFERRED` | none |
| `REVOKED` | none |
| `EXPIRED` | none |
| `FAILED` | none |
| `ABANDONED` | none |

Every lifecycle record binds its GatePass ID where present, action digest,
policy digest, passport digest, subject agent, nonce, timestamps, amount,
currency and exposure entry. `REJECTED` and `REFERRED` have no GatePass or
exposure entry. Reservation uses lifecycle revision compare-and-set; one caller
can move `ISSUED` to `RESERVED`. Terminal states never return to `ISSUED`.

## Aggregate exposure

The registered additive exposure rule is bound to the buyer policy ID/version,
purchase action family, GBP, `supplier_a` counterparty class and a 24-hour
window. Its synthetic fixture ceiling is £10,000 in integer minor units with an
optional action-count ceiling. Exhaustion produces the rule's configured
`REFER` outcome.

`OUTSTANDING`, `RESERVED`, `COMMITTED` and `UNKNOWN` entries count. Thus several
small actions cannot overcommit by holding multiple unused GatePasses.
Execution moves exposure to `COMMITTED`. Unused authority releases exactly once
only after valid revocation, expiry, formal abandonment, or confirmed-not-
executed reconciliation. `UNKNOWN` remains counted until reconciliation.
Cross-currency aggregation fails closed; P3-M160 implements no conversion.
Shadow Mode returns a simulated exposure preview and writes nothing.

## Specific GatePass revocation

Revocation is an exported internal control, never an MCP tool. It requires the
registered synthetic operator-authority evidence and binds GatePass ID, action
digest, reason, actor, evidence digest and time in a distinct receipt.

- `ISSUED` may become `REVOKED`, preventing later reservation and releasing
  unused exposure.
- Repeating the same revocation returns the existing evidence without another
  transition or release.
- `EXECUTED` history is immutable; revocation does not claim reversal.
- A request after `RESERVED` moves uncertainty to `UNKNOWN`, creates no false
  revocation receipt and requires explicit reconciliation.
- A revoked GatePass cannot be revived.

Agent input cannot supply operator controls, and no MCP method exposes them.

## Emergency stop

The persistent scope is `global_local_gateway`. Activation and deactivation
both require registered synthetic operator authority and create checksummed
evidence. While active:

- enforced acceptance cannot issue a GatePass;
- an outstanding GatePass cannot be newly reserved;
- Shadow evaluation may continue but is observational and would reject;
- existing `EXECUTED` history is unchanged;
- `RESERVED` and `UNKNOWN` are not described as stopped or reversed.

Storage-read failure fails enforcement closed. An agent cannot activate,
deactivate or bypass the stop through MCP.

## Crash and reconciliation rules

- Before confirmed durable `ISSUED`: no GatePass is returned.
- Durable `ISSUED` before reservation: restart preserves it; reservation still
  requires exact binding and compare-and-set verification.
- `RESERVED` before known invocation: restart leaves it `RESERVED`; no automatic
  retry occurs and operator reconciliation is required.
- Possible effect without acknowledgement: internal code records `UNKNOWN`.
- `UNKNOWN`: never automatically retried and remains exposure-counted.
- Confirmed not executed: `ABANDONED`, with eligible exposure released.
- Confirmed executed: `EXECUTED`, exposure committed, without replay.
- Still unknown: remains `UNKNOWN`.

Reconciliation is internal/operator-only and records the finding, evidence
reference, actor, resulting state, and explicit false flags for automatic retry
and external-action reversal. Changing local state cannot undo an irreversible
external action.

## MCP interaction

The existing passport, exact-action, authority, standing, mandate, business
policy, risk and Evidence Decay Clock checks remain mandatory. After they pass:

1. Shadow reads stop/exposure state, returns `wouldOutcome`, and mutates nothing.
2. Enforced acceptance evaluates the stop and aggregate ledger.
3. The GatePass, `ISSUED` lifecycle and `OUTSTANDING` exposure are committed as
   one durable snapshot.
4. Only confirmed persistence permits the GatePass to be returned.

Aggregate exhaustion returns configured `REFER` or `REJECT` with no GatePass.
Emergency stop, corrupt state and write failure return `REJECT` with no
GatePass. MCP creates no execution receipt and invokes no downstream adapter.

## Deterministic reason codes

Lifecycle: `LIFECYCLE_ISSUED`, `LIFECYCLE_RESERVED`, `LIFECYCLE_EXECUTED`,
`LIFECYCLE_FAILED`, `LIFECYCLE_ABANDONED`, `LIFECYCLE_EXPIRED`,
`LIFECYCLE_UNKNOWN`, `LIFECYCLE_INVALID_TRANSITION`,
`LIFECYCLE_RECORD_NOT_FOUND`, `LIFECYCLE_BINDING_MISMATCH`,
`LIFECYCLE_COMPARE_AND_SET_FAILED`, `LIFECYCLE_TERMINAL`,
`LIFECYCLE_RECONCILIATION_REQUIRED`,
`LIFECYCLE_UNKNOWN_NO_AUTOMATIC_RETRY`, and durable recording codes for
`REJECTED` and `REFERRED`.

Storage: `DURABLE_STATE_UNAVAILABLE`, `DURABLE_STATE_CORRUPTED`,
`DURABLE_STATE_VERSION_UNSUPPORTED`, `DURABLE_WRITE_FAILED`, and
`DURABLE_WRITE_NOT_CONFIRMED`.

Exposure: `EXPOSURE_WITHIN_LIMIT`, `EXPOSURE_AMOUNT_LIMIT_EXCEEDED`,
`EXPOSURE_ACTION_COUNT_LIMIT_EXCEEDED`, `EXPOSURE_CURRENCY_MISMATCH`,
`EXPOSURE_RULE_MISMATCH`, `EXPOSURE_RELEASED`, and
`EXPOSURE_ALREADY_RELEASED`.

Revocation/operator: `GATEPASS_REVOKED`, `GATEPASS_ALREADY_REVOKED`,
`GATEPASS_REVOCATION_AFTER_EXECUTION_REFUSED`,
`GATEPASS_REVOCATION_REQUIRES_RECONCILIATION`, and
`OPERATOR_AUTHORITY_INVALID`.

Emergency/reconciliation: `EMERGENCY_STOP_ACTIVE`, activation/deactivation and
already-active/inactive codes, plus `RECONCILIATION_CONFIRMED_NOT_EXECUTED`,
`RECONCILIATION_CONFIRMED_EXECUTED`, and `RECONCILIATION_STILL_UNKNOWN`.

## Privacy, retention and limitations

Records use synthetic identifiers, digests, controlled reasons and integer
amounts. They contain no credential, private key, bank data or customer data.
P3-M160 provides no automated retention or secure deletion policy; the local
operator owns the configured file and must remove it under an approved local
retention process.

Deferred work includes multi-process locking, database transactions,
distributed consensus, production key custody, real identity integration,
external execution acknowledgements, Customer Trust Receipts, the final
ten-case purchasing demonstration and the Buyer Adoption Proof Pack.
