# Agent Trust Gate Gateway SDK Starter Pack

This folder contains small, inspectable local client wrappers for Agent Trust
Gate Local Gateway API Mode. It is an SDK starter pack, not a published npm,
PowerShell Gallery, generated, or supported production SDK.

The wrappers call the local gateway only. They return trust decisions and
evidence objects; they never execute the described action.

## Start the local gateway

Without local API-key enforcement:

```sh
npm run verify -- --serve --port 8787
```

With the safe quickstart demo credentials:

```sh
npm run verify -- --serve --port 8787 --require-api-key --clients-file examples/gateway-quickstart/gateway-clients.demo.json
```

The demo credentials are fake local values. Do not use them as real secrets.

## Run the demos

Node.js 20 or later:

```sh
node examples/gateway-sdk/node-sdk-demo.mjs
```

Windows PowerShell:

```sh
powershell -ExecutionPolicy Bypass -File examples/gateway-sdk/powershell-sdk-demo.ps1
```

Both demos call health and decision methods, print the decision summary, stop
for BLOCK or REQUEST HUMAN, and explicitly report that no action was executed.

## Node wrapper

```js
import { createAgentTrustGateClient } from "./agent-trust-gate-client.mjs";

const client = createAgentTrustGateClient({
  baseUrl: "http://127.0.0.1:8787",
  clientId: "quickstart-demo-agent",
  apiKey: "quickstart-demo-key",
});

const health = await client.health();
const decision = await client.decide(action);
```

The Node wrapper exports `AgentTrustGateClient`, `AgentTrustGateError`, and
`createAgentTrustGateClient`. Non-2xx responses throw `AgentTrustGateError`
with `status`, `code`, `details`, and the parsed gateway `response`.

## PowerShell wrapper

Dot-source `AgentTrustGateClient.ps1`, then create a client with
`New-AgentTrustGateClient`. Gateway failures produce a terminating error with
the gateway error code and message when available.

## Methods

The wrappers expose equivalent operations:

- `health()` / `Invoke-ATGHealth`
- `decide()` / `Invoke-ATGDecision`
- `createApprovalPack()` / `Invoke-ATGApprovalPack`
- `createEvidenceBundle()` / `Invoke-ATGEvidenceBundle`
- `openapi()` / `Invoke-ATGOpenApi`
- `entitlement()` / `Invoke-ATGEntitlement`
- `commercialReadiness()` / `Invoke-ATGCommercialReadiness`
- `hostedReadiness()` / `Invoke-ATGHostedReadiness`
- `securityReadiness()` / `Invoke-ATGSecurityReadiness`
- `rateLimitStatus()` / `Invoke-ATGRateLimitStatus`
- `monitoringHealth()` / `Invoke-ATGMonitoringHealth`
- `incidentResponseReadiness()` / `Invoke-ATGIncidentResponseReadiness`
- `customerTenantReadiness()` / `Invoke-ATGCustomerTenantReadiness`

Client ID and API key headers are optional. The wrappers add
`X-ATG-Client-ID` and `X-ATG-API-Key` only when values are supplied. They do
not print credentials.

Entitlement responses expose local allowance and upgrade-required signals.
`purchase_enabled`, `automatic_purchase_enabled`, and `billing_enabled` remain
false; the wrappers do not purchase usage or process payments.

Commercial readiness methods return local planning scores, category evidence,
gaps, and next steps. They do not implement any missing commercial capability.

Hosted readiness methods return pre-deployment checks and blockers. They do not
deploy the gateway, change its localhost binding, or expose a public service.

Security readiness methods return local production-security gaps and recommended
controls. They do not certify security, deploy the gateway, or expose a service.

Rate-limit status methods return current local-process counters and deterministic
abuse signals. They are not production-grade abuse prevention and buy nothing.

Monitoring-health methods return local runtime and request-log signals. They do
not provide production monitoring, external alerting, or a public uptime SLA.

Incident-response-readiness methods return local severity, containment, recovery,
and readiness guidance. They do not provide production incident response, send
notifications, or execute actions.

Customer-tenant-readiness methods return local planning metadata only. They do
not create real customer accounts, collect personal data, provide login/signup,
bill customers, process payments, or execute actions.

## Handle decisions

- `ALLOW`: `allowed` is true and `human_approval_required` is false. The caller
  decides separately whether to perform the exact action.
- `BLOCK`: `allowed` is false. Stop.
- `REQUEST HUMAN`: `human_approval_required` is true. Stop and obtain explicit
  human review.

Agent Trust Gate returns local trust decisions only. It does not execute
actions. These wrappers are local-only demo integration code and must not be
used to expose the gateway as a public internet service.
