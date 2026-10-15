# Mission 03: separately signed synthetic destination evidence

This records the reviewed source/demo boundary. The subsequent local.5 buyer
candidate packages this functionality; see
[buyer release](mission-03-buyer-release.md) and
[installed evaluation guide](destination-evidence-evaluation.md). The earlier
source-only packaging decision below is historical, superseded for local.5.

This is local review work for Gareth and Dave. It starts from upstream
`0dcd8dfcb0583c0d242517764390acde9b244920`, whose tree matches preserved local
`8044c65b3ffba8da5ee0bea6eb6933882e3e56e0`. The divergent original local main,
mission branches/worktrees, approved local.4 archive, earlier downloads and
Challenge evidence remain intact. No publication or package replacement is
part of this mission.

## Evidence boundary

Mission 01 binds business state inside the signed approval. Mission 02 adds
atomic shared-budget reservations and destination fencing, but ATG reads that
destination's local records directly. Mission 03 introduces a **separate
synthetic destination process and signing role**, and keeps those earlier
implementations unchanged.

`scripts/destination-process.mjs` owns its SQLite records, registrations,
permanent fences, destination sequence and an Ed25519 private key generated
inside that process. The authority/client never receive or open that private
key. Authority state and destination state use different directories and
databases. The only key sent on IPC is the public key during explicit synthetic
host bootstrap. The host pins it in `host-trust.json` before approval/lookup.
Reopening requires that same pin. The ATG issuer identity and existing fixture
public key are configured explicitly as a different signing role.

This demonstrates separation of processes and signing roles **on one machine**.
It is not independent external capture, hardware isolation, partner attestation,
production key custody, or protection against the host administrator. The host
administrator can read the destination's key file or alter its storage. The
approved ATG signing key remains a public synthetic fixture. A trusted signer
can lie; signature verification authenticates statements, not their truth.

There is no arbitrary live callback, network endpoint, ERP/payment integration,
key selected from a receipt, or agent-controlled trust bootstrap. The fixed
child-process script and local IPC operations are synthetic host tooling.

## Signed envelope and public verification

The [schema](../schemas/destination-evidence.synthetic.v1.schema.json) defines
`atg.destination-evidence.synthetic.v1`. Ed25519 signs the entire unsigned
envelope (schema, algorithm, configured key ID and payload) as UTF-8 canonical
JSON: recursively sorted object keys, unchanged array order, JSON scalar
encoding, no whitespace. GatePass signatures retain their established strict
canonical JSON serializer. Schema/domain fields distinguish destination
execution evidence from ATG approval evidence.

Mission 03 validates the complete JSON shape before signing, hash comparison or
signature verification. It rejects own `__proto__` properties, accessors, hidden
fields, cycles, sparse arrays and non-JSON values. This prevents an inherited
serializer's prototype-key omission from introducing unsigned nested content.
Valid v1 envelope bytes remain unchanged; published legacy modules/archives
are not rewritten. A requested fence proof is mandatory even when the lookup
reports EXECUTED, so an incomplete response cannot complete reconciliation.

The destination payload binds its trusted identity, schema, approval/GatePass
IDs (the approval handle is the signed GatePass ID), canonical action digest,
request digest, approved business-state digest and full versions, signed nonce
as idempotency ID, destination transaction ID, outcome, resulting record
version/digest, destination sequence, lookup request/challenge, observation
time, clock ID, and completed fence proof when requested. Record versions
increase on a write; the approved order/supplier versions remain distinct
from the resulting record version.

`src/destination-evidence.ts` is a pure verifier. It receives only host trust,
the signed approval, expected lookup and destination evidence. It checks the
ATG signature using the pinned issuer/key, existing signed business-state
binding, the distinct destination signature, exact identity/action/state/nonce
bindings, transaction/record-version consistency and all lookup/freshness
fields. Extra envelope or payload fields are refused. A key embedded in a
receipt is never a trust source. It has no filesystem writes or database access
and works in a separate Node 20 process.

An offline verifier cannot know whether its caller reused an old expected
challenge. It verifies against the supplied expectation, not global replay
state. ATG persists a randomly generated pending request/challenge, supersedes
old requests, and consumes a successful response atomically with the lifecycle
transition. Replayed old responses or reused accepted evidence cannot change
ATG state. External consumers need their own durable challenge/replay tracking.

## Recovery and ordering

`SeparateDestinationAuthority` uses the existing durable lifecycle and budget
policy with a new shared authority-only SQLite snapshot format. Atomic issuance
reserves OUTSTANDING exposure; one worker's compare-and-set claim reserves the
approval before destination registration. A one-shot send intent and UNKNOWN
exposure are committed before submission IPC. Registration or send failures
retain the hold. No retry or reconstruction of orphan approvals is automatic.

Revoking an unclaimed ISSUED approval also requires destination fencing: a
worker may already hold its signed bytes. The authority durably blocks claims
and normally reserves/marks that approval UNKNOWN before the lookup. If an
active stop prevents reservation, its ISSUED/OUTSTANDING hold remains until
verified fenced absence permits core revocation. An unexpected executed record
for that unreserved stopped approval retains the hold for manual investigation.
No local revocation releases that exposure before the destination fence.

There is **no authority SQLite transaction held across an IPC await**, and no
claim that Mission 02 lock ordering crosses process/network boundaries.
Destination-side registration, idempotency, state comparison, records and
permanent fencing are checked and committed atomically in its own database.
The authority commits a result only after independently verifying evidence
against the current pending lookup and eligible lifecycle. Competing lookups
can supersede a pending challenge; a late response fails closed.

A signed ABSENT result releases UNKNOWN exposure only when it comes from the
authoritative records lookup in the same committed destination transaction as
a permanent GatePass/idempotency tombstone. The tombstone forbids delayed
submission **and registration**, including after process restart. A plain
signed not-found without this fence is insufficient. An EXECUTED result records
COMMITTED exposure; it cannot release or reverse the write. Invalid, stale,
missing, unavailable, mismatched or incomplete evidence keeps the UNKNOWN hold.
Unavailable authority storage may prevent writing an UNKNOWN label; its prior
durable RESERVED/UNKNOWN exposure remains held and must not be reset.

Authority stop first blocks new local claims/sends, then obtains destination
stop acknowledgement. Recovery/revocation fences destination-side in-flight
capabilities before any ambiguous hold is released. Destination stop/fence
linearizes against writes at the destination transaction, not at the local
authority flag. A write already committed or ordered ahead of destination stop
can still be EXECUTED and must be reconciled; local stop is not retroactive.
The demo offers no automatic destination-stop clearing or reauthorisation.
An operator can explicitly repeat an interrupted stop to complete destination
blocking after restart; this is an idempotent control operation, not an
execution retry.

Fixed fixture faults (`incomplete-fence`, `non-authoritative`, `stale`, and
`wrong-transaction`) are signed only inside the synthetic destination process
to test semantic rejection after a valid signature. They do not provide a
general signing oracle or allow a caller-selected payload/key.

## Reproduce locally

Use actual Node 24+ for shared authority/destination SQLite. The legacy plugin
root, SDK, CLI and MCP remain Node 20 compatible. The public-key verifier also
runs on Node 20. Mission 03 is source/demo review work; it is not added to or
repacked into the immutable published local.4 package. Any future packaged
Mission 03 release needs its own reviewed version and archive.

**Packaging decision for this mission: source/demo integration only.** The
local.4 fresh-install checks are prior-release compatibility checks and do not
test installed Mission 03 functionality. This work does not export Mission 03
from the plugin or intend a plugin candidate/release. If later approved for the
plugin, build and test a separately versioned temporary candidate containing
its runtime, destination process, verifier, schema and guides before making
any installed-functionality claim. Never replace the local.4 download.

From this worktree, with the existing temporary Node 20 runtime:

```powershell
$env:ATG_NODE20_PATH = 'C:\Users\Gareth\agent-trust-gate\.atg-evaluation\mission-02-node20\node.exe'
npm run test:destination-evidence
npm run validate:mission-03
```

The parent below must exist, and `new-mission03-run` must not exist. Both
destination and authority initialise exclusively; existing Mission 01/Mission
02 v1/v2 state is never migrated, reset or overwritten. All Mission 03 test,
demo and validation state is retained. New evaluation directories are for
separate runs, not permission to abandon held exposure.

```powershell
npm run demo:destination-evidence -- --state C:\ATG-Evaluation\new-mission03-run
node scripts/verify-destination-evidence.mjs --trust C:\ATG-Evaluation\new-mission03-run\host-trust.json --approval C:\ATG-Evaluation\new-mission03-run\approval.json --evidence C:\ATG-Evaluation\new-mission03-run\evidence.json --lookup C:\ATG-Evaluation\new-mission03-run\lookup.json --now 2026-09-02T09:01:00.000Z
```

The verifier accepts copied public inputs from a directory with no writable ATG
state and no destination private key. The synthetic demo keeps state/results
for inspection and deliberately omits the initial acknowledgement, then
reconciles through a signed lookup. Focused tests additionally kill destination
processes at explicit before-operation/after-commit barriers and use distinct
authority workers. No sleep-based correctness assertions are used.
The final-review verifier test runs actual Node 20 with its experimental
permission model: all writes and reads of authority state/destination private
key are denied and explicitly asserted, while public inputs/runtime code are
readable. This is a functional dependency test, not production isolation.
Crash tests also kill destination processes inside uncommitted write/fence
transactions and kill an authority worker after durable claim registration
before acknowledgement. Held exposure survives until verified recovery.

All observations use the documented fixed test clock
`2026-09-02T09:01:00.000Z`, clock ID `mission-03-fixed-test-clock`, and a configured
5,000 ms maximum lookup age. Staleness/future-time tests vary the supplied
verification time. This does not establish live-time freshness, clock
synchronisation, live expiry/window rollover safety, or power-loss durability.

See the [partner adapter contract](mission-03-partner-adapter-contract.md) for
requirements that remain before genuine external partner evidence.
