# Agent Trust Gate MCP-Style Adapter Pack

This folder demonstrates how an agent framework could expose Agent Trust Gate
as local MCP-style tools. It is not a production MCP server, does not implement
an MCP transport, and is not published to an MCP registry.

The examples are local-only integration aids. They call the gateway at
`127.0.0.1`, return trust decisions or evidence, and never execute actions.

## Files

- `agent-trust-gate-mcp-tools.json`: machine-readable tool names and schemas.
- `node-mcp-style-adapter.mjs`: dependency-free tool dispatch and gateway calls.

The tool metadata exposes:

- `atg_health`
- `atg_decide`
- `atg_get_entitlement`
- `atg_get_commercial_readiness`
- `atg_get_hosted_readiness`
- `atg_get_security_readiness`
- `atg_get_rate_limit_status`
- `atg_get_monitoring_health`
- `atg_get_incident_response_readiness`
- `atg_get_customer_tenant_readiness`
- `atg_get_billing_payment_readiness`
- `atg_get_machine_purchase_policy_readiness`
- `atg_get_launch_readiness`
- `atg_get_global_marketing_readiness`
- `atg_create_approval_pack`
- `atg_create_evidence_bundle`

Every tool declares `executes_actions: false`.

`atg_get_entitlement` reports local usage, allowance, and upgrade-required
signals. Purchase, automatic purchase, and billing remain disabled.

`atg_get_commercial_readiness` reports deterministic planning scores and gaps.
It does not implement hosting, payments, billing, marketing, or self-learning.

`atg_get_hosted_readiness` reports pre-deployment checks and blockers. It does
not deploy, bind publicly, or expose a service.

`atg_get_security_readiness` reports local production-security preparation gaps.
It does not certify production security, deploy, bind publicly, or expose a service.

`atg_get_rate_limit_status` reports local runtime request limits and abuse
signals. It is not production-grade abuse prevention and never buys capacity.

`atg_get_monitoring_health` reports local runtime and request-log health. It is
not production monitoring, external alerting, or a public uptime SLA.

`atg_get_incident_response_readiness` reports local severity, containment,
recovery, and readiness guidance. It is not production incident response, does
not send notifications, and never executes actions.

`atg_get_customer_tenant_readiness` reports local account, tenant, ownership,
and future billing-readiness concepts. It creates no accounts, collects no
personal data, processes no payments, and never executes actions.

`atg_get_billing_payment_readiness` reports price-free placeholder plans and
payment-control gaps. It bills nobody, collects no payment details, processes no
payments, enables no automatic purchase, and never executes actions.

## Run locally

Start the gateway:

```sh
npm run verify -- --serve --port 8787
```

Run the adapter demonstration:

```sh
node examples/mcp-adapter/node-mcp-style-adapter.mjs
```

Optional local API-key mode can use the safe quickstart demo config:

```sh
npm run verify -- --serve --port 8787 --require-api-key --clients-file examples/gateway-quickstart/gateway-clients.demo.json
```

The adapter loads its tool definitions, calls `atg_health`, submits the safe
public-post example to `atg_decide`, prints ALLOW / BLOCK / REQUEST HUMAN, and
stops. It does not perform the proposed action.

Usage and allowance responses are local control records. Purchase, automatic
purchase, billing, payment processing, hosted discovery, and public exposure
remain disabled.

These MCP-style examples are local discovery and integration aids only. They do
not execute actions, bill customers, process payments, expose a public service,
authenticate real-world identities, guarantee legality, or prove compliance.
