# Separately signed destination evidence — local.5 buyer evaluation

Package: `@agent-trust-gate/plugin`, **0.1.0-local.5**. This candidate includes
the reviewed Mission 03 functionality. Its website download activates only
after explicit publication approval. Before publication, install the exact
local candidate archive. It is not published to the npm registry.

## Runtime and trust boundary

Legacy SDK/CLI/MCP and the public evidence verifier require Node 20+.
Destination/shared authority and SQLite worker demonstrations require Node
24+. Importing the legacy root does not load the optional SQLite authority.
Unsupported optional use reports `ATG_SHARED_WORKER_REQUIRES_NODE_24`; the
legacy root remains usable. Do not replace an installed runtime for testing.

This is separately signed **same-host synthetic destination evidence**:
different processes and signing roles on **one machine**, synthetic approval
authority, a generated destination evaluation key, local SQLite records and a
fixed test clock. It is not independent external capture, protection against
the host administrator, production key custody, partner attestation, a live
partner integration or multi-machine distributed safety. A trusted signer can
lie; a signature authenticates its statement, not the truth of its ledger.

The destination generates and owns its private key in its separate process
only during an explicitly requested fresh setup. No destination private key
is included in the package or returned to ATG. Importing modules, installing
the package or asking for help generates no keys/state. Local administrators
can access that synthetic key file; no isolation from the administrator is
claimed. Never use production credentials, keys or customer data.

## Install and reproduce

Verify the archive SHA-256 against the reviewed checksum manifest first. Use
a new project and the downloaded/local archive, never an unreviewed repack:

```powershell
npm init -y
npm install C:\path\to\agent-trust-gate-plugin-0.1.0-local.5.tgz
npx --no-install atg-plugin --help
npx --no-install atg-destination-evidence --help
```

On Node 24+, the parent `C:\ATG-Evaluation` must already exist and the run
directory must not exist:

```powershell
npx --no-install atg-destination-evidence --state C:\ATG-Evaluation\new-destination-run-001
```

The command retains eight cases and `results.json`: signed outcome, tampering,
lookup replay/staleness, incomplete fence proof, destination kill after commit
before acknowledgement, signed fenced absence, delayed worker and missing
evidence. Workers coordinate through explicit process barriers, not sleeps.
Each case has a separate fresh synthetic order, authority database, destination
database/key and `public/` verification inputs. All state is retained; the
command refuses an existing run root.

Use actual Node 20 or newer to verify copied public inputs. The host must select
the trusted public-key configuration and expected lookup; never select a key
from an untrusted receipt:

```powershell
npx --no-install atg-evidence-verify --trust C:\ATG-Evaluation\new-destination-run-001\signed-outcome\public\trust.json --approval C:\ATG-Evaluation\new-destination-run-001\signed-outcome\public\approval.json --evidence C:\ATG-Evaluation\new-destination-run-001\signed-outcome\public\evidence.json --lookup C:\ATG-Evaluation\new-destination-run-001\signed-outcome\public\lookup.json --now 2026-09-02T09:01:00.000Z
```

The public verifier reads those public files only. It needs neither writable
ATG state nor the destination private key. Exact-archive tests run it on actual
Node 20 with all writes and authority/private-key reads explicitly denied by
Node's experimental permission model. That is a functional dependency test,
not production hardware isolation.

The clock is `2026-09-02T09:01:00.000Z`, ID `mission-03-fixed-test-clock`, with
a 5,000 ms configured maximum lookup age. The demo varies supplied verification
time for stale/future rejection. It does not establish live-time freshness,
clock synchronisation, live expiry/window rollover or power-loss durability.

## Optional SDK exports

- `@agent-trust-gate/plugin/destination-evidence`: Node 20+ pure public-key
  verifier and strict canonical evidence validation.
- `@agent-trust-gate/plugin/destination-evidence-schema`: versioned JSON schema
  (resolve with `createRequire(...).resolve(...)` when reading as a file).
- `@agent-trust-gate/plugin/destination-process-client`: fixed local process
  client; `start(directory, true)` explicitly initialises a fresh destination
  on Node 24+. `start(directory, false, trust)` reopens with a pinned key.
- `@agent-trust-gate/plugin/separate-destination-authority`: Node 24+ shared
  authority, lifecycle and exposure controls. It never opens destination records
  or the destination private key and holds no authority lock across IPC.
- `@agent-trust-gate/plugin/destination-evidence-fixture`:
  `createMission03Fixture(absoluteNewRun)` performs explicit synthetic host
  setup, pins the public key before approval and returns authority/client.

The older `shared-purchase-order` export and `atg-multi-worker` command remain
available on Node 24+, with legacy SDK/CLI/MCP on Node 20. Historical local.4
worker evidence remains available separately; it is not relabelled as local.5.

## Recovery and state

Approval and execution evidence are distinct. The canonical signed envelope
binds destination identity/schema, approval/GatePass, action/request/state
digests and versions, transaction/idempotency IDs, outcome/record version,
challenge/request, freshness information and completed fence proof. Strict JSON
validation refuses prototype/accessor/hidden/non-JSON content. Keys and identity
are explicit host trust configuration, never fields supplied by a receipt.

Missing, invalid, unavailable, stale, mismatched or incomplete evidence retains
UNKNOWN exposure. Signed not-found alone cannot release a hold. Absence is
usable only after authoritative lookup and a permanent destination fence have
committed together, preventing old submissions and registrations from later
writing. A requested fence proof is required even on EXECUTED lookup evidence.
Confirmed execution keeps COMMITTED exposure; stop/revocation cannot reverse
it. A write that wins the destination ordering race must be reported executed.
There is no blind retry or automatic reauthorisation.

Existing Mission 01/Mission 02 v1/v2 state directories are preserved, never
reset or automatically migrated. Mission 03 uses distinct fresh authority and
destination formats. Creating another run is not permission to discard held
exposure in an old run. Orphan issuance/registration or unavailable storage
fails closed and requires explicit investigation/recovery. Preserve SQLite
databases, keys, trusted public configuration and results for inspection.

External partner evidence still requires partner-owned key custody and ledger,
authenticated out-of-band trust pins/transport, durable atomic idempotency and
fencing, live clock/replay/key-revocation semantics and actual partner-run
failure/audit evidence. See bundled `PARTNER-ADAPTER-CONTRACT.md`.
