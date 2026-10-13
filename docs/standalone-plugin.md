# ATG standalone plugin — local evaluation edition

Version: **0.1.0-local.2**. This is an installable Node.js package using ATG's existing exact-action authority core, not a second policy engine. It provides an SDK facade, the existing local MCP evaluation server and an optional gated **synthetic** purchasing example.

**Current boundaries:** repository-registered synthetic authority, policies, evidence and fixture signing keys; a fixed synthetic reference clock; local single-process lifecycle storage. Not production ready, customer validated, a hosted service or a live purchasing/payment connector. There is no self-learning or automatic authority expansion. Installation does not make fixture credentials trustworthy for real actions.

## Install into an existing Node.js project

Requires Node.js 20 or newer and npm. From your project's directory:

```powershell
npm install https://agenttrustgate.com/downloads/agent-trust-gate-plugin-0.1.0-local.2.tgz
npx --no-install atg-plugin --help
npx --no-install atg-plugin request
```

The versioned archive is served by the ATG website; it is **not published to the npm registry**. Review the repository and compare the downloaded archive against [the published checksum](https://agenttrustgate.com/downloads/SHA256SUMS). On Windows, `Get-FileHash -Algorithm SHA256 <downloaded-file>` reports the checksum. Keep the state file in a host-controlled directory outside `node_modules`. Use one process per state file; this edition has no cross-process locking or distributed storage guarantees. Do not provide production credentials or personal/customer data.

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

## Purchase-order evaluation added in local.2

The installed SDK now exports `AtgPurchaseOrderConnector`. Run `atg-plugin order-demo --state <new-absolute-directory>` to reproduce an unchanged order, a changed supplier bank reference, an acknowledgement lost after commit and a timeout before commit. The published archive binds approval to a privately held state snapshot. The Mission 01 local source candidate additionally includes the exact approved state digest in signed canonical arguments, verifies it at commit and reconciliation, and records the local destination outcome. The published download has not been replaced. No live ERP integration or independent execution capture is claimed. See the [purchase-order connector guide](https://github.com/Gareth1953/agent-trust-gate/blob/main/docs/purchase-order-connector.md) for the complete SDK example, recovery procedure and trust boundaries.
