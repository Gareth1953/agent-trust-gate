# Packaged shared-worker evaluation — local.4

This optional demonstration and SDK support multiple worker processes on **one Windows machine**, using local SQLite and the existing ATG authority core. They require **Node 24+**. The legacy package root, SDK, atg-plugin CLI and evaluation-only MCP remain compatible with Node 20.

This is synthetic evaluation: repository fixture authority and keys, fixed 2 September 2026 clock, one synthetic order per scenario, and same-host destination evidence. There is no multi-machine distributed-safety claim, live partner connector, customer validation or independent execution capture.

## Install and run the prepared archive

local.4 is a release candidate. The hosted URL becomes available only after Gareth approves publication. Until then, use the local archive:

~~~powershell
mkdir C:\ATG-Buyer-Evaluation
cd C:\ATG-Buyer-Evaluation
npm init -y
npm install C:\Users\Gareth\agent-trust-gate\discovery-site\downloads\agent-trust-gate-plugin-0.1.0-local.4.tgz
node --version
npx --no-install atg-plugin --help
npx --no-install atg-multi-worker --state C:\ATG-Buyer-Evaluation\fresh-shared-run-001
~~~

Choose a new absolute state directory appropriate for your machine. Its parent must exist. The demo exclusively creates that directory; it refuses an existing one and never removes it. It writes results.json and preserves each scenario's SQLite databases for inspection. Use another new directory for another run.

The archive's prepared hosted path is https://agenttrustgate.com/downloads/agent-trust-gate-plugin-0.1.0-local.4.tgz. Compare Get-FileHash -Algorithm SHA256 against the SHA256SUMS entry before installation. The local.2/local.3 archives remain unchanged.

## Expected observations

The packaged command spawns separate Node worker processes and coordinates IPC barriers. Crash barriers block on stdin after explicitly signalling the tested boundary; no timing-only sleeps coordinate the proof.

| Scenario | Observed writes | Held/reserved exposure and outcome |
| --- | ---: | --- |
| Same approval, two workers | 1 | One claim; 400000 reserved before submission, then committed |
| Distinct approvals, 600000 budget | 0 | One ACCEPT and one REFER; 400000 reserved |
| Distinct approvals, 1000000 budget | 0 | Two ACCEPT approvals and two claims; 800000 reserved before any write |
| Death after reservation before submission | 0 | 400000 retained until fenced absence; recovery yields NOT_EXECUTED and releases |
| Death after commit before acknowledgement | 1 | 400000 retained; recovery yields EXECUTED/COMMITTED |
| Delayed worker after recovery | 0 | Old token refused as STALE_AUTHORITY |
| Death after recovery fence commit | 0 | Original token refused as DESTINATION_FENCED while 400000 is still reserved; repeat reconciliation releases only after verified absence |

Amounts are GBP minor units. The budget observations are made before submission, independently of the one-order destination limit. The destination permits only one synthetic order; two accepted reservations are not two purchase writes.

The command prints actual JSON and exits nonzero if an expected observation fails. Prepared website evidence is [multi-worker-results-local.4.json](https://agenttrustgate.com/multi-worker-results-local.4.json). It is a recorded synthetic run of the exact archive, not an independent attestation or a promise of hardware durability. The existing [Challenge](https://agenttrustgate.com/challenge.html) and its local.3 recording are retained.

## Optional SDK

~~~javascript
import { resolve } from 'node:path';
import { createSyntheticPluginRequest } from '@agent-trust-gate/plugin';
import { SharedPurchaseOrder } from '@agent-trust-gate/plugin/shared-purchase-order';

const directory = resolve('fresh-shared-sdk-evaluation');
SharedPurchaseOrder.initialise(directory); // New directory only.
const host = new SharedPurchaseOrder({ stateDirectory: directory });
try {
  const request = createSyntheticPluginRequest('enforced');
  const approval = await host.approve(request);
  if (approval.approvalId) {
    const claim = host.claim(approval.approvalId, request);
    if (claim) {
      console.log(host.submit(claim)); // Destination commit; acknowledgement pending.
      console.log(host.acknowledge(claim)); // Destination-derived reconciliation.
    }
  }
} finally {
  host.close();
}
~~~

Other processes open the same directory with new SharedPurchaseOrder; they must not call initialise again. SDK errors are denial/uncertainty, never permission for another executor. Only enforced ACCEPT can provide an approval; SHADOW, REFER and REJECT do not authorise. Unsupported runtime imports produce ATG_SHARED_WORKER_REQUIRES_NODE_24 without affecting the legacy root.

## Shared storage v2 and recovery

Each fresh directory contains independently committed authority.sqlite and destination.sqlite, bound by a store identity. SQLite IMMEDIATE transactions serialize authority/exposure updates across processes. This is not one atomic transaction spanning the two databases.

A destination can commit before authority acknowledgement. A claim's death/timeout never automatically frees exposure or permits another claim. Recovery validates the original signed approval and every destination record, commits token invalidation before using absence, then updates authority. Matching records keep exposure COMMITTED; trustworthy absence makes the consumed approval ABANDONED and releases its hold. Fresh approval is required for a new attempt. Unavailable or inconsistent evidence retains the hold.

Shared v1 directories **fail closed**. Preserve them and their holds. Do not delete, reset or automatically migrate them. This candidate has no migration or automated orphan administration. Fresh evaluation requires a separate new directory; that is not a recovery strategy for old state. Death between issuance and handle storage, or fence registration and authority commit, can create unreachable held authority/fences; such holds cannot be reused or automatically cleared.

Revocation/stop serialize against submission under the authority lock: a control committed first blocks submission; a destination committed first is retained and reconciled. Stop deactivation alone does not release exposure or create authority. The clock is fixed, so this does not establish live expiry/window rollover safety.

Local disk locking, host-owned ACLs and unmodified same-host state are prerequisites. Network shares, multiple machines, hostile local administrators, database rollback, fixture-key compromise and direct destination writes are unsupported. Process-kill tests do not establish power-loss, disk/controller or hardware-fsync guarantees. A real partner needs independently engineered authority, keys, time, destination enforcement/reconciliation and security review.
