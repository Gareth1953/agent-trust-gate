# Mission 05: PayeeShield supplier-change demonstration

This optional **source-only, local synthetic demo** adapts Gareth's revised PayeeShield HTML into the existing ATG supplier-bank-change evaluation and exact-action execution path. It is not included in the published local.7 archive. No public site or standalone PayeeShield deployment is changed.

## Run locally

From this repository's root, using Node 20+ and an installed dependency tree:

```powershell
npm ci
npm run demo:payeeshield
```

Open http://127.0.0.1:8795 . Stop with Ctrl+C. The server binds IPv4 loopback, requires the exact Host, rejects foreign browser origins, and requires a per-process token for JSON mutations. It serves only three explicitly listed assets. It has an 8 KiB request limit, restrictive CSP, no external script, analytics or bank API. These controls do not isolate other processes running as the same OS user.

Use fictional fixture options only. Full account numbers, names and email addresses are not accepted. Do not paste customer data into this demonstration. All tabs share one process-local destination and one approval map. Restarting discards that fictional state; this is **not durable recovery** and must never be used as a way to reset real held state.

## Inspect the workflow

1. Evaluate the default valid scenario and inspect ATG's fixture controls and signed GatePass. Execute once: the synthetic ending changes from 1846 to 7319, version increases, and a second execution is refused.
2. Start a separate fictional run. Select a negative scenario, change supplier/ending, or set an amount above £10,000. No executable authority is returned. Above £40,000 is blocked; £10,000.01–£40,000 is REVIEW. Amounts are related-invoice context, **not payment authority**, exposure accounting or a calibrated fraud score.
3. Evaluate, then edit any input: the browser discards its execution handle. The server also compares the complete approved request, independently of the page. Simulate a destination version edit after approval to demonstrate the server's stale-state refusal.
4. Evaluate then revoke, or select expired GatePass before execution: no destination record is written.
5. In another fictional run, select 'Commit then lose acknowledgement'. The adapter records UNKNOWN and refuses retries. Reconcile reads its own same-process synthetic record and explicitly reports that this is **not independent destination evidence**. Changing the form does not discard this separate reconciliation handle.

JSON downloads contain the currently displayed result. The browser log is limited to 24 memory-only entries; neither is a durable audit service. There is no reset endpoint. At most 100 approvals are held per process; restart is only appropriate for new fictional demonstrations.

## Existing controls reused

- `evaluateSupplierBankChange` and the 16 registered supplier-change scenarios: fixture agent/delegation checks, exact supplier/account/action binding, verification evidence, separation of duties, role/limit/freshness/dual approval and refusal of unsupported execution claims.
- `issueExactActionGatePass`, `createVerifierContext` and `verifyAndExecuteSimulatedAction`: existing Ed25519 fixture signing, exact-action checks, fixed-clock expiry and nonce consumption.
- The adapter binds request and synthetic business version under those signed arguments, captures private approval state, and checks the destination synchronously before its in-memory commit. Multiple calls within this one process cannot commit the same record twice.

No core authority verifier, signing key handling, existing connector, durable store or published archive was replaced. This adapter's approvals, revocation, destination and UNKNOWN state are process-local. It does not inherit the separate multi-worker SQLite protocol or Mission 03 destination signatures merely by being inside this repository.

## Boundaries and next integration requirements

This is not Confirmation of Payee, sanctions/AML screening, account ownership verification, fraud prevention, payment execution or an ERP connector. There is no real human login/approval. Fixture keys and the fixed clock confer no operational authority. No new encryption, independent evidence, distributed transactions, customer-data isolation, certification or production readiness is claimed.

A partner pilot requires authenticated human identities and authority, trusted keys/time, a real verification source, destination-owned least-privilege credentials, conditional commits/idempotency, shared durable consumption/exposure controls, recovery/stop procedures, independent destination evidence and data-protection controls. These require a separately scoped adapter and review; this screen is not sufficient.

## Provenance

Adapted from user-supplied `Index (2).html`, SHA-256 `83507c5fcc1208babb13aacedd21fdb98ca0d490f15e35b7d2b2ae9cf4a24b41`. Original upload was preserved. The dark layout/style is retained and revised. Simulated name/score checks, real-data fields, ambiguous approval controls and checkout claims were replaced with ATG-backed fixture decisions and a functioning local execution path.

Base: `bcfb390914d520b75f90270444779fc6cf846e25`. Branch: `mission-05-payeeshield-demo`. No publication is authorised or performed by this work.

## Verification

Run `npm run test:payeeshield`. It covers all 16 scenarios, amount boundaries, strict fixture input, signed/private state isolation, exact-request edits, state version, revocation, expiry, repeated/concurrent calls, lost acknowledgement/reconciliation and HTTP boundaries. See `reports/mission-05/summary.json` for actual broader verification and outstanding limits.
