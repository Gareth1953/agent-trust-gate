# P3-M161 Local Purchasing Lifecycle Demonstration

## Purpose and boundary

P3-M161 is a fixed, deterministic, local-only demonstration of Agent Trust
Gate checking whether an AI agent's proposed purchase remains within declared
human authority and buyer policy. It composes the locked P3-M158, P3-M159 and
P3-M160 machinery; it does not replace or weaken those decision paths.

The evidence chain is:

```text
synthetic human mandate
  -> exact proposed action
  -> ATG ACCEPT / REJECT / REFER / Shadow evidence
  -> one-use GatePass only when permitted
  -> durable reservation and point-of-action verification
  -> one registered in-process synthetic adapter
  -> separate execution receipt and digest-bound evidence link
```

No procurement, ERP, banking, payment, settlement, order placement, customer
communication, network call or external action occurs. `executed` means only
that an in-process synthetic callback acknowledged the exact action.

ATG verifies declared authority, evidence, deterministic policy, lifecycle and
exact-action integrity. It does not decide whether a purchase is commercially
wise, desirable, factually correct or beneficial.

## Run the demonstration

Prerequisite: the repository's existing Node.js development environment.

```powershell
npm run demo:purchasing-lifecycle
```

The default output is a concise buyer-readable table. Machine-readable evidence
is available separately:

```powershell
npm run demo:purchasing-lifecycle -- --json
```

Run the M161 acceptance suite together with all locked M158–M160 regressions:

```powershell
npm run test:purchasing-lifecycle
```

## Ten-case evidence table

| # | Case | Verdict | GatePass | Synthetic execution | Primary evidence |
|---:|---|---|---|---|---|
| 1 | Exact authorised purchase | `ACCEPT` | Issued, reserved and consumed | Acknowledged once | Decision receipt, GatePass, lifecycle, committed exposure, execution receipt and digest link |
| 2 | Quantity substitution | `REJECT` | None | Not attempted | Policy refusal and `REJECTED` lifecycle |
| 3 | Supplier substitution | `REJECT` | None | Not attempted | Mandate/policy refusal and `REJECTED` lifecycle |
| 4 | Price-band breach | `REFER` | None | Not attempted | Human-review rule identifiers and `REFERRED` lifecycle |
| 5 | GatePass reuse | `REJECT` | Already consumed | Blocked before adapter | Restarted durable `EXECUTED` lifecycle |
| 6 | GatePass revocation | `REJECT` | Persistently revoked | Blocked before adapter | Revocation receipt and restarted `REVOKED` lifecycle |
| 7 | Shadow Mode | `SHADOW`, would `ACCEPT` | None | Not attempted | Non-authorising Shadow Decision Receipt |
| 8 | Aggregate ceiling | `REFER` | None for breach | Not attempted | Two outstanding entries plus deterministic exposure refusal |
| 9 | Authority expansion attempt | `REJECT` | None | Not attempted | Prohibited-tier policy evidence; agent claims create no authority |
| 10 | Emergency/recovery lifecycle | `REJECT` | Outstanding authority blocked | No automatic retry | Persistent stop, nonce/revocation/exposure state, `UNKNOWN`, and explicit reconciliation |

## Synthetic execution boundary

Exactly one adapter registration exists:

- adapter: `adapter.local.synthetic-purchasing.v1`;
- resource: `resource.local.synthetic-purchase-ledger.v1`;
- class: `local_synthetic_purchasing_adapter`;
- external execution: false.

The adapter is not an MCP tool. The local orchestrator checks the registered
adapter and resource, requires a persisted GatePass lifecycle, performs a
compare-and-set reservation, invokes the existing exact-action signature,
digest, constraint, expiry and nonce verifier, and only then calls the
in-process callback. Unknown adapters/resources, absent authority, changed
actions, replay, revocation, stop state and lifecycle mismatch stop before the
adapter.

MCP remains protocol `2025-06-18` over local stdio and exposes exactly:

```text
atg.evaluate_action
```

There is no MCP purchasing, execution, reservation, lifecycle, revocation,
reconciliation, emergency or policy-administration tool.

## Receipt linkage

The existing policy decision receipt and existing synthetic execution receipt
remain separate. `atg.purchasing-execution-link.local.v1` binds their canonical
SHA-256 digests, IDs, GatePass ID, exact-action digest, adapter and resource.
Verification recomputes both receipt digests and the link digest. Changing
either receipt or the link causes deterministic verification failure.

The link proves that the local synthetic execution evidence refers to the same
authorised exact action. It does not prove a real purchase occurred or that the
business outcome was correct.

## Emergency and recovery interpretation

The final case persists outstanding and revoked authority, exposure and the
global local-gateway stop, then reopens the state file. The stop blocks
reservation. After explicit operator-controlled deactivation, the fixture
reserves authority and records a possible-effect/no-ack crash as `UNKNOWN`.
Restart does not retry it. An unresolved reconciliation keeps it `UNKNOWN`;
only explicit confirmed-not-executed evidence moves it to `ABANDONED` and
releases eligible exposure. Later evaluation uses a new complete action and
nonce.

## Privacy, security and limitations

- Synthetic/minimised identifiers and opaque fixture references only.
- No credential, token, production key, personal data, customer data or real
  supplier/bank data.
- Local single-process file storage; no multi-process or distributed safety.
- Fixture signing and local checksums are not production key custody or
  tamper-proof storage.
- No external acknowledgement source or real-effect reconciliation.
- No autonomous capital execution and no production identity/IAM integration.
- No guarantee of security, compliance, savings, loss prevention or business
  outcome.
- Not production ready and not customer-validated.

P3-M161 does not implement the Customer Trust Receipt, Buyer Adoption Proof
Pack or public website repositioning reserved for separately authorised work.
