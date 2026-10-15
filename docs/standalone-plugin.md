# ATG standalone plugin — local evaluation edition

Version: **0.1.0-local.7 — unpublished candidate**. This is an installable Node.js package using ATG's existing exact-action authority core, not a second policy engine. It provides an SDK facade, the existing local MCP evaluation server and an optional gated **synthetic** purchasing example.

**Current boundaries:** repository-registered synthetic authority, policies, evidence and fixture signing keys; a fixed synthetic reference clock; legacy single-process lifecycle storage, plus optional Node 24+ shared-worker SQLite v2 storage on one machine. Not production ready, customer validated, a hosted service or a live purchasing/payment connector. There is no self-learning or automatic authority expansion. Installation does not make fixture credentials trustworthy for real actions.

## Install into an existing Node.js project

Requires Node.js 20 or newer and npm. From your project's directory:

```powershell
npm install C:\path\to\agent-trust-gate-plugin-0.1.0-local.7.tgz
npx --no-install atg-plugin --help
npx --no-install atg-plugin request
```

The local.7 candidate is prepared locally for Gareth and Dave's review; published local.5 remains unchanged. Its candidate link is not a live release. The local.7 archive is prepared locally for approval; its website URL activates only after publication. Until then install the local archive path. The versioned archive is served by the ATG website after approval; it is **not published to the npm registry**. Review the repository and compare the downloaded archive against [the published checksum](https://agenttrustgate.com/downloads/SHA256SUMS). On Windows, `Get-FileHash -Algorithm SHA256 <downloaded-file>` reports the checksum. Keep the state file in a host-controlled directory outside `node_modules`. Use one process per legacy state file. The optional shared-worker export supports separate processes on one machine through local SQLite; it provides no multi-machine guarantee. Do not provide production credentials or personal/customer data.

To build the archive yourself from a reviewed repository checkout:

```powershell
npm ci --ignore-scripts
npm run plugin:pack
```

The archive appears in `plugin-build/`. Install it using `npm install <absolute-path-to-archive>`. Packaging includes compiled runtime dependencies, TypeScript declarations, the synthetic human-authority module, documentation and licence. It excludes tests, stored state, secrets and the rest of the repository. No registry publication occurs.

## Run the gated synthetic example

```powershell
npx --no-install atg-plugin demo --state "C:\ATG-Evaluation\state.json"
```

Use an absolute writable state path suitable for your machine; on Linux, for example, `/tmp/atg-evaluation/state.json`. The parent directory is created when state is persisted. Expected: an accepted proposal, one synthetic acknowledgement with linked receipts, then a refused reuse. Repeated runs reserve additional synthetic exposure; the demonstration can eventually refer when the fixed-window limit is reached. A non-zero exit indicates the expected sequence did not pass. Never erase real authority history as a recovery strategy; all state in this edition is synthetic.

## SDK integration

Save the following as `atg-example.mjs` in the project and run `node atg-example.mjs`:

```javascript
import { resolve } from 'node:path';
import { AtgStandalonePlugin, createSyntheticPluginRequest } from '@agent-trust-gate/plugin';

const plugin = new AtgStandalonePlugin({
  statePath: resolve('.atg-evaluation/state.json'),
});
const request = createSyntheticPluginRequest('enforced');
const evaluation = await plugin.evaluate(request);
console.log(evaluation.decision.outcome, evaluation.decision.reasonCodes);

// This method can reach only the built-in synthetic adapter. No executable
// callback, payment connector or arbitrary tool is accepted by this package.
const execution = await plugin.executeSynthetic(evaluation.evaluationId, request);
console.log(execution.outcome, execution.evidenceLink);
```

`createSyntheticPluginRequest()` defaults to **shadow** mode and creates a fresh nonce; its remaining records and timestamps are synthetic fixtures. `evaluate()` accepts the existing v2 business-policy request and validates and snapshots it. Decisions remain ACCEPT / REFER / REJECT, or SHADOW with a proposed outcome. Only an enforced ACCEPT can carry authority. Malformed evaluation input throws; the host must treat errors as denial.

The host must retain the original request and opaque session evaluation ID. Changed requests, unknown IDs, shadow/refused/referred decisions and expired or consumed GatePasses cannot reach the synthetic adapter. Editing a returned decision cannot modify the privately held approval. Lifecycle reservations and one-use checks use the existing ATG implementation. Decisions and synthetic execution receipts remain distinct and digest-linked.

Session handles are not persisted. Restart cannot execute an old session handle; durable lifecycle/exposure records still survive. Default session capacity is 100 evaluations, configurable from 1–10000 with `maximumEvaluations`. `discardEvaluation(id)` removes a handle; it does not release exposure or revoke a durable GatePass. After an uncertain execution failure, do not automatically retry. The host should surface the failure for review.

## MCP host configuration

Use the installed executable with a host-selected absolute state path. For MCP clients supporting a `mcpServers` configuration, adapt this example to your installation:

```json
{
  "mcpServers": {
    "atg-local-evaluation": {
      "command": "node",
      "args": [
        "C:\\YourProject\\node_modules\\@agent-trust-gate\\plugin\\dist\\src\\standalone-plugin-cli.js",
        "mcp", "--state", "C:\\ATG-Evaluation\\mcp-state.json"
      ]
    }
  }
}
```

This starts the existing MCP-over-stdio protocol (`2025-06-18`) with exactly one tool, `atg.evaluate_action`. It supports existing v1 and v2 requests. `atg-plugin request` prints a v2 **shadow** example. No execution, policy-administration, revocation or emergency tool is exposed through MCP. Stdout contains protocol responses only; CLI diagnostics use stderr. No HTTP service is opened.

Do not run the SDK and MCP process concurrently against the same state file. Evaluation through MCP is not enforcement of an external tool: the host must not interpret an optional ACCEPT check as proof that real execution has been gated.

## What a live partner integration would need

A separately engineered host-owned execution adapter must verify the exact proposed request and GatePass immediately before the action, prevent bypass and reuse, and reconcile actual external effects. It also needs real authority/evidence registration, trusted time, protected signing/key custody, concurrency controls and security review. This package has not established those production properties. Salmon/Archipelo integration is exploratory; there is no implemented integration or agreed partnership.

Learning is a possible later advisory capability: anomaly detection and human-reviewed policy suggestions. It must not grant new authority, increase limits, rewrite enforcement code or turn repeated activity into permission.

## Verification

```powershell
npm run test:plugin
npm run validate:public-claims
npm run validate:discovery-site
```

The plugin tests include exact-request substitution, receipt tampering, refusal/referral/shadow denial, expiry, reuse, restart, corrupt state and bounded session capacity. Packaging verification installs the actual archive in a fresh project outside the repository and exercises both the SDK and MCP initialization/evaluation. These are local synthetic tests, not evidence of customer adoption or production safety.

Repository: https://github.com/Gareth1953/agent-trust-gate

Controlled evaluation enquiries: gareth@agenttrustgate.com

## Signed purchase-order business state in local.3

The SDK exports `AtgPurchaseOrderConnector`. In local.3, the exact synthetic approval snapshot and request digest are included in the canonical arguments covered by the existing GatePass signature. The destination checks that same approved state again at its synchronous synthetic commit boundary, and reconciliation verifies it against the recorded outcome. State changes require fresh approval; changing state between preliminary verification and commit records no order. Invalid recovery evidence retains UNKNOWN exposure, and replay remains blocked.

Run `atg-plugin order-demo --state <new-absolute-directory>` to reproduce an unchanged order, changed supplier-bank state, lost acknowledgement and timeout before commit. `npm run test:plugin -- --archive discovery-site/downloads/agent-trust-gate-plugin-0.1.0-local.7.tgz` installs that exact archive in a fresh temporary project and checks SDK, CLI, MCP, signature tampering, changed state, the commit race and recovery.

The earlier local.2 and local.3 archives are retained unchanged. Approvals are synthetic fixtures, signing keys and time are fixtures, records are same-host evidence, and controls are single-process. No live ERP integration, distributed safety, independently sourced external execution evidence or production readiness is claimed. See the [purchase-order connector guide](https://github.com/Gareth1953/agent-trust-gate/blob/main/docs/purchase-order-connector.md) for the SDK example and recovery limits.

## New in local.4: optional shared workers

The package adds the Node 24+ optional export @agent-trust-gate/plugin/shared-purchase-order and the packaged atg-multi-worker demonstration. Legacy root/SDK/CLI/MCP remain Node 20 compatible. Run npx --no-install atg-multi-worker --state ABSOLUTE_NEW_DIRECTORY. This creates fresh SQLite v2 state, retains it for inspection, and prints seven coordinated separate-process scenarios.

Read the [shared-worker guide](https://github.com/Gareth1953/agent-trust-gate/blob/main/docs/shared-worker-evaluation.md) for fresh setup, expected reserved exposure/write counts and recovery. Existing shared v1 directories fail closed: preserve them, do not reset or automatically migrate them. Synthetic fixture authority, fixed time and same-host destination records do not establish independent evidence or multi-machine distributed safety.


## New in local.5: separately signed destination evidence

The optional public verifier supports Node 20; separate destination/shared authority requires Node 24+. Run `npx --no-install atg-destination-evidence --state ABSOLUTE_NEW_DIRECTORY` only for explicit fresh synthetic setup, then verify copied public inputs with `atg-evidence-verify`. The destination process generates/owns its key; ATG receives only the host-pinned public key. This is one-machine, same-host synthetic evidence and fixed time, not independent external capture, host-administrator protection or live partner integration. Existing v1/v2 state is preserved with no reset/automatic migration, and UNKNOWN is never blindly retried. See bundled DESTINATION-EVIDENCE.md and the repository buyer guide at docs/destination-evidence-evaluation.md.

## Mission 04 fixes in the unpublished local.7 candidate


- Legacy exact-action and receipt serializers retain own enumerable JSON
  __proto__ fields in signed/hash bytes. Previously omitted fields now change
  the digest and cause a changed signed receipt or approved action to fail.
- Newly created durable JSON containing directories request POSIX mode 0700;
  atomic temporary files request mode 0600, which replacement retains.
  Existing directories and ancestors are not repaired or migrated.

## Windows and data handling

POSIX modes do not configure a private NTFS DACL. Provision and inspect a new
host-controlled evaluation parent before creating state. Restrict directory
inheritance through the separately authorised OS process; check temporary,
initial and replacement file DACLs. Restricting one existing state file does
not establish the permissions inherited by a replacement. ATG does not
implement Windows ACL enforcement, and existing held state must be preserved.

The Windows review observed broader inherited sandbox access in its workspace.
A separately authorised test on one new disposable parent verified inheritance
of only the evaluation user, SYSTEM and Administrators Full control through
fresh state creation and replacement. It did not secure existing stores or
test impersonation/effective access, administrator/SYSTEM token execution,
backup/restore or same-user isolation. Same-user code and administrators can
read local keys and records. No client-data deployment approval follows.

ATG does not encrypt local evaluation records. Use synthetic information only;
do not add client records, real credentials or production keys. Approval and
operator authority, approval signing keys and clocks remain fixtures. The
separate destination evaluation key remains on the same host. These are
one-machine, same-host synthetic controls, not independent external capture,
live ERP/payment integration, production key custody or multi-machine safety.
UNKNOWN outcomes retain holds and require explicit reconciliation; never reset,
migrate or discard held exposure merely to get a passing run.

Legacy SDK/CLI/MCP and public verification support Node 20+. SQLite shared
workers and the separate destination require Node 24+. Unsupported optional
use fails closed. No live execution or administrative tool is exposed by MCP.


Read bundled SECURITY.md and RELEASE-NOTES.md. These source fixes do not update published local.5.

## local.7 durable-write repair and retained local.6

The original Windows DURABLE_WRITE_FAILED incident remains unattributed. A matching EPERM atomic-replacement mechanism was reproduced with an owned open file handle; this does not identify the original failing operation or process. A separate cleanup defect was fixed: colliding temporary files are now preserved and native filesystem errors are retained in Error.cause. Denied writes still fail closed; no automatic retries, permission weakening or clearing of held state was added.

[Unpublished local.6 retained unchanged](../discovery-site/downloads/agent-trust-gate-plugin-0.1.0-local.6.tgz). Local.6 includes the earlier signing/POSIX fixes but not this repair. Published local.5 remains unchanged. Read [the investigation](mission-04-durable-write-investigation.md); passing reruns do not clear the original incident.
