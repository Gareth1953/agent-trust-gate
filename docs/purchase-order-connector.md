# Purchase-order connector — controlled local evaluation

Available in `@agent-trust-gate/plugin` **0.1.0-local.6**. This adds a host-owned synthetic destination to the existing authority core. It contacts no ERP, payment system or external API and executes no real purchase. It is not production ready or customer validated.

The unpublished local.6 candidate archive retains the reviewed signed state-binding/recovery controls and the optional shared-worker path introduced earlier. Published local.5 and all older archives remain unchanged. The candidate also includes reviewed Mission 04 signed-JSON and POSIX state-creation fixes. This is a local release candidate until Gareth approves GitHub/Pages publication.

## What can be demonstrated

| Situation | Local behaviour | Client question it helps evaluate |
|---|---|---|
| Exact approved request, unchanged business state | One synthetic order recorded; decision, execution and destination evidence linked | Did the recorded outcome match the approved action? |
| Order version or supplier bank reference changes after approval | Blocked until fresh approval of the current state | Can stale approval reach the commit boundary? |
| Destination commits but acknowledgement is lost | UNKNOWN; local destination lookup confirms execution; no retry | Can an uncertain result cause a duplicate order? |
| Timeout before destination commit | UNKNOWN until lookup confirms absence; old attempt stays spent | When is fresh approval appropriate? |
| Destination unavailable or evidence mismatched | UNKNOWN; further work blocked | Does uncertainty preserve the hold? |

These are reusable evaluation scenarios, not measured financial benefits, competitor superiority or a live connector certification.

## Run the installed demonstration

Use a **new absolute directory for each run**, outside the installed package. Node.js 20 or newer is required.

```sh
npm install C:\path\to\agent-trust-gate-plugin-0.1.0-local.6.tgz
npx --no-install atg-plugin order-demo --state /absolute/path/to/new-atg-order-evaluation
```

On Windows use an absolute directory such as `C:\ATG-Evaluation\OrderRun1`. The command runs four scenarios in separate subdirectories and outputs JSON with `passed`, execution/reconciliation results and destination record counts. It fails on reused completed scenario state; it does not reset evidence silently.

## SDK example

```js
import { AtgPurchaseOrderConnector, createSyntheticPluginRequest } from '@agent-trust-gate/plugin';
import { resolve } from 'node:path';

const connector = new AtgPurchaseOrderConnector({
  stateDirectory: resolve('new-order-evaluation'),
});
try {
  const request = createSyntheticPluginRequest('enforced');
  const approval = await connector.approve(request);
  const uncertain = await connector.execute(approval.evaluationId, request, {
    fault: 'timeout_after_commit', // Synthetic lost acknowledgement only.
  });
  console.log(uncertain.outcome); // UNKNOWN
  const confirmed = connector.reconcile(approval.evaluationId);
  console.log(confirmed.outcome); // EXECUTED
  console.log(confirmed.evidence.authorisedRequestMatchesRecordedOutcome); // true
} finally {
  connector.close();
}
```

`updateBusinessState({ orderVersion: 2 })` and `updateBusinessState({ supplierBankReference: 'fixture-bank-B' })` are explicit host test operations. Only fixture bank references are accepted. This is not a payment instruction or bank-detail change tool. The one-order fixture does not accept caller-selected destinations or executor callbacks. Only enforced ACCEPT can execute; shadow, referral and rejection remain non-authorising. MCP still exposes evaluation only.

## Authority and evidence boundaries

The connector captures the exact business-state snapshot and digest before assessment, then passes a copy to the existing signing path. `atg.purchase-order-state-binding.local.v1` lives inside the canonical arguments covered by the GatePass signature. It binds order identity/version, supplier-bank reference/version and revision, the exact approved request digest, supplier, amount in minor units, currency and the fixed destination identity. Supplier/amount/currency are approved request terms; this fixture has no independent pre-existing ERP order terms. The binding itself is not an authority token.

The gateway snapshots the host-approved binding before any assessment await and never refreshes destination state at signing. `approve()` returns `businessState`, `approvedBusinessStateDigest` and `businessStateBinding` for inspection; returned objects cannot mutate private authority. Execution requires the same approved digest in the signed payload, existing signature verification and a durable reservation. The destination re-verifies those signed bytes and compares current state synchronously immediately before its local write. A newer snapshot cannot be substituted even with a valid fixture signature. Legacy unbound authority cannot authorise this connector path. The original standalone evaluation facade and generic simulated adapter remain API-compatible and do not acquire a destination-state guarantee.

`approve()` still uses repository synthetic authority/approval fixtures. No real human sees and signs an ERP snapshot here. The cryptographic state binding is under ATG's existing fixture signature, not an independently authenticated human approval to authoritative external state.

Approval handles are process-local and do not survive restart. The attempt journal, authority lifecycle and local destination records persist. Reconciliation derives its finding from the local destination; it never accepts a caller-supplied finding. The old attempt is never automatically retried. Confirmed absence releases its lifecycle hold and requires a fresh request/approval. Unused approvals rejected because state changed remain conservatively outstanding under existing lifecycle rules.

Evidence includes request, business-state, decision receipt, execution receipt and destination record digests, plus an explicit outcome comparison. The journal retains the signed GatePass and exact binding; reconciliation verifies them and reports `signedBusinessStateVerified`. Legacy journal records without a signed binding cannot establish matching executed-state evidence and remain UNKNOWN when a destination record exists. Confirmed absence may still release the old hold without granting old authority. These are **same-host synthetic records**, not independent execution capture, an external cryptographic attestation, or proof that a real ERP executed correctly. Hash wrappers detect accidental/unrehash edits; an administrator able to rewrite all local state can forge them. The combined evidence digest is not a signature. The existing synthetic execution receipt alone does not resolve an acknowledgement loss; the separately recorded destination outcome does.

## Storage and recovery limits

The connector locks its directory exclusively for its lifetime and serialises in-process approval/execution. A second instance is rejected. `close()` releases the owned lock. A crash leaves a lock deliberately: an operator must first establish that the original process is stopped, preserve the directory, and remove only its stale `connector.lock` before reopening and reconciling. Do not remove active locks or edit/reset state to get around uncertainty.

Files use restricted modes, file fsync and atomic replacement. They are not a distributed transaction; directories are not fsynced, power-loss durability is not established, and network filesystems are not supported. A pending journal attempt or unresolved RESERVED/UNKNOWN lifecycle blocks new work, including an orphan reservation after a journal write failure. Missing/corrupt records fail closed. An orphan reservation without a journal entry requires manual investigation; no automatic repair is offered. A trusted local complete destination lookup makes absence meaningful in this fixture. Eventual-consistency lookups in real systems require stronger proof before releasing holds.

## Next engineering step for a real integration

Select one customer/partner sandbox and its purchase-order API. Define authoritative state versions, destination idempotency and status queries; carry the exact approved state binding to the partner destination; use destination-native conditional writes or transactions to prevent races. Establish protected keys, trusted time, agent bypass prevention, recovery operations and an externally maintained audit record. Validate with that partner before claiming live purchasing, production safety, independent verification or commercial savings. Shared exposure controls remain in the existing local core; distributed multi-agent budgeting is not added by this connector.

`fault: "business_state_change_before_commit"` is a bounded synthetic host fault that advances the order version after preliminary verification and before the synchronous commit check. It writes no order, retains UNKNOWN exposure, requires reconciliation to confirm absence, and then requires fresh approval. No arbitrary callback, executor or caller-selected destination is introduced.

## Verification

`npm run test:purchase-order-state-binding` tests the approval-to-signing and approval-to-commit boundaries. `npm run test:plugin` covers the connector failure cases and installs the packed archive in a separate fresh project to run the CLI scenarios. Full regression and public-claims checks are recorded in [standalone-plugin-verification.md](standalone-plugin-verification.md).

## Final Mission 01 review

Reconciliation searches by the journal handle, GatePass identity and signed action digest. An inconsistent handle cannot hide a destination record for the same approved action and release its UNKNOWN hold. When signed recovery fields are present, invalid signatures or state bindings retain UNKNOWN even if no destination record is found. Legacy journals without either signed field retain the documented absence-only recovery behaviour. See [the final code review](mission-01-final-review.md) for reproduced defects, fixes and current validation.

## Separate-process evaluation in local.4

This guide describes the legacy single-owner AtgPurchaseOrderConnector. Use the separate [Node 24+ shared-worker guide](shared-worker-evaluation.md) for SQLite v2 and multiple worker processes on one machine. The legacy root, CLI and MCP remain Node 20 compatible. Shared v1 directories fail closed and must be preserved; no automatic migration or reset is implemented. Neither path establishes multi-machine distributed safety or independently captured evidence.

Local records are not encrypted by ATG. The candidate does not configure Windows NTFS ACLs: provision and verify a private new parent separately, including temporary and replacement-file inheritance. See the [candidate security boundary](mission-04-package-security.md).
