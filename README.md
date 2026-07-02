# Agent Trust Gate

Agent Trust Gate is a machine-to-machine AI internet utility concept for checking
trust, risk, and approval boundaries before an automated system takes an
important action.

## First local purpose

This initial version is a local, deterministic TypeScript engine. It accepts a
proposed action, applies conservative risk rules, and returns a structured JSON
receipt. It performs no network calls and takes no action itself.

The engine is intended to automate routine internal checks while keeping Gareth
at the final safety gate for public, financial, legal, customer-facing, or
externally binding actions.

## Usage

```ts
import { verifyBeforeAction } from "agent-trust-gate";

const receipt = verifyBeforeAction({
  action_type: "local_file_update",
  description: "Update a local test fixture",
  actor: "build-agent",
  target: "local-workspace",
  estimated_cost_gbp: 0,
  public_action: false,
  external_commitment: false,
  money_movement: false,
  legal_or_compliance_sensitive: false,
  customer_or_user_facing: false,
  evidence: ["Tests cover the intended behavior"],
  rollback_plan: "Revert the local file",
  human_approval_status: "not_requested",
});
```

Example output (IDs and timestamps vary):

```json
{
  "allowed": true,
  "risk_level": "low",
  "human_approval_required": false,
  "approval_reason": null,
  "checks": [
    {
      "check": "public_action",
      "passed": true,
      "severity": "high",
      "message": "public_action is not present."
    }
  ],
  "receipt_id": "atg_8f1a39b0-6a8d-40db-b11e-8c6326f681ac",
  "timestamp": "2026-06-25T10:00:00.000Z",
  "input_summary": {
    "action_type": "local_file_update",
    "description": "Update a local test fixture",
    "actor": "build-agent",
    "target": "local-workspace",
    "estimated_cost_gbp": 0,
    "public_action": false,
    "external_commitment": false,
    "money_movement": false,
    "legal_or_compliance_sensitive": false,
    "customer_or_user_facing": false,
    "evidence_count": 1,
    "has_rollback_plan": true,
    "human_approval_status": "not_requested"
  },
  "recommended_next_step": "Proceed locally as described and retain this receipt.",
  "limitations": [
    "Not legal advice.",
    "Not compliance certification.",
    "Not a security audit.",
    "Does not guarantee safety.",
    "Does not move money.",
    "Does not approve high-risk actions by itself.",
    "Does not replace human approval for high-risk actions."
  ]
}
```

## Local CLI demo

Run the local CLI against one of the example action files:

```sh
npm run verify -- examples/low-risk-internal.json
npm run verify -- examples/public-post.json
npm run verify -- examples/money-movement.json
npm run verify -- examples/legal-sensitive.json
npm run verify -- examples/public-post-approved.json
npm run verify -- examples/money-movement-approved.json
npm run verify -- examples/legal-sensitive.json
```

The CLI reads the local JSON file and prints a formatted verification receipt.
It does not send data to the internet and does not perform the proposed action.

### Policy profiles

P3-M005 adds local policy profiles so different teams can run the same Trust
Gate checks with different trust modes without changing source code.

Available profiles:

- `standard`: default profile; matches the base Agent Trust Gate rules.
- `strict`: records a stricter approval threshold for medium-risk and high-risk
  actions.
- `regulated`: records a regulated-style local policy for medium-risk and
  high-risk actions and adds regulated policy metadata to the receipt.

Example commands:

```sh
npm run verify -- examples/public-post.json --policy standard
npm run verify -- examples/public-post.json --policy strict
npm run verify -- examples/public-post.json --policy regulated --save
npm run verify -- --audit
```

Policy profiles do not guarantee legal compliance. They provide local evidence
of which trust policy was applied before an AI action was allowed or blocked.
Profiles may tighten, label, or clarify requirements, but they do not weaken the
base safety rules.

### Machine-readable integration mode

P3-M006 adds machine-readable CLI output for agents, scripts, CI tools, and
business systems that need a stable local trust decision before an action runs.

Use `--json` to print integration-friendly JSON only:

```sh
npm run verify -- examples/public-post.json --json
npm run verify -- examples/public-post.json --policy regulated --json
npm run verify -- examples/public-post.json --policy regulated --save --json
npm run verify -- --audit --json
npm run verify -- --list-receipts --json
```

Use `--fail-on-block` when a calling script should treat a blocked or not
allowed action as a failed gate:

```sh
npm run verify -- examples/public-post.json --json --fail-on-block
```

Exit codes:

- `0`: command completed; when `--fail-on-block` is used, the action was
  allowed.
- `1`: input or configuration error, such as an unreadable file, invalid JSON,
  or unknown policy profile.
- `2`: action was not allowed when `--fail-on-block` was used.

Machine-readable mode is for integration with other systems. It does not execute
actions. It only returns a local trust decision.

### Stable Action & Decision Contract

P3-M007 defines a stable local contract for action descriptor input and
machine-readable trust decision output.

Current contract version:

```text
atg.v1
```

Contracts matter because other agents, scripts, CI tools, and business systems
need predictable input fields, predictable output fields, clear schema
versioning, and stable error behaviour before they can safely integrate with a
trust gate.

Inspect the contract locally:

```sh
npm run verify -- --contract
npm run verify -- --contract --json
npm run verify -- examples/public-post.json --json
```

The minimum required action descriptor fields are:

- `action_type`
- `actor`
- `target`
- `description`

The contract defines the shape of the local trust decision. It does not
guarantee safety, truth, legality, or compliance.

### Integration Starter Pack

P3-M008 adds local integration examples for scripts, agents, CI steps, and
business workflows that need to ask Agent Trust Gate for a pre-action decision.

Example commands:

```sh
npm run verify -- examples/integrations/sample-public-post.json --json
npm run verify -- examples/integrations/sample-public-post.json --json --fail-on-block
node examples/integrations/node-preflight.mjs
powershell -ExecutionPolicy Bypass -File examples/integrations/powershell-preflight.ps1
```

The starter pack includes:

- a Node.js preflight example
- a PowerShell preflight example
- safe sample action descriptors for public posting, customer-facing messages,
  and synthetic money movement checks
- a local integration README under `examples/integrations/`

Integration examples do not execute actions. They demonstrate how another system
can ask Agent Trust Gate for a local trust decision before proceeding.

### Batch Preflight Review

P3-M009 adds batch review for local folders of proposed action descriptors. This
matters for agent workflows because real agents and business systems often
prepare several actions before doing anything. Batch review lets a supervising
system or human see which proposed actions are allowed, blocked, invalid, or
require approval before anything proceeds.

Example commands:

```sh
npm run verify -- --batch examples/integrations
npm run verify -- --batch examples/integrations --json
npm run verify -- --batch examples/integrations --policy regulated --json
npm run verify -- --batch examples/integrations --json --fail-on-block
```

Batch mode reads local `.json` files from the selected directory, ignores
non-JSON files, and returns one summary plus per-action results. Malformed JSON
and invalid action descriptors are reported in the batch result instead of
crashing the review.

Batch review does not execute actions. It reviews local proposed action
descriptors and returns trust decisions before anything proceeds.

### Human Approval Pack

P3-M010 adds local approval packet generation for actions that need human
review. Approval packets matter because they create a simple evidence record of
what the AI wanted to do, why the action was risky, which policy was applied,
whether the gate allowed or blocked it, and what a human must review before
anything proceeds.

Example commands:

```sh
npm run verify -- examples/public-post.json --approval-pack
npm run verify -- examples/public-post.json --policy regulated --approval-pack
npm run verify -- examples/public-post.json --policy regulated --approval-pack --json
npm run verify -- examples/public-post.json --policy regulated --approval-pack --save-approval-pack
```

Approval packets are local evidence records. Saved packets are written to
`approval-packs/`, and generated `approval-packs/*.json` files are ignored by
Git by default.

Approval packets do not execute actions. They do not guarantee legal compliance.
They help a human reviewer decide whether an AI action should proceed.

### Human Review Decision Record

P3-M011 adds local human review decision records after an approval pack has been
reviewed. This matters because businesses need evidence of the full oversight
chain: the AI proposed an action, Agent Trust Gate assessed it, an approval pack
was created, a human reviewed it, and a separate decision record was saved.

Review records are local append-only evidence files. Creating a review record
does not mutate or overwrite the original approval pack.

Example commands:

```sh
npm run verify -- --review-approval-pack approval-packs/example_approval_pack.json --decision approved --reviewer "Gareth Price"
npm run verify -- --review-approval-pack approval-packs/example_approval_pack.json --decision rejected --reviewer "Gareth Price"
npm run verify -- --review-approval-pack approval-packs/example_approval_pack.json --decision needs_more_info --reviewer "Gareth Price"
npm run verify -- --review-approval-pack approval-packs/example_approval_pack.json --decision approved --reviewer "Gareth Price" --json
npm run verify -- --review-approval-pack approval-packs/example_approval_pack.json --decision approved --reviewer "Gareth Price" --save-review-record
```

Human review records are local evidence records. They do not execute actions,
authenticate reviewers, guarantee legality, or prove compliance.

### Human Review Audit Viewer

P3-M012 adds local audit and list commands for saved human review decision
records. Review audits matter because businesses need to inspect the approval
trail after decisions are made: how many decisions were approved, rejected, or
marked `needs_more_info`, which approval packs were reviewed, and whether the
stored approval pack hash still matches the referenced approval pack.

Example commands:

```sh
npm run verify -- --audit-reviews
npm run verify -- --audit-reviews --json
npm run verify -- --list-review-records
npm run verify -- --list-review-records --json
```

Approval pack integrity status:

- `match`: the referenced approval pack exists and its SHA-256 hash matches the
  hash stored in the review record.
- `mismatch`: the referenced approval pack exists but its hash differs.
- `missing`: the referenced approval pack path does not exist.
- `not_checked`: integrity was not checked.

Review audit mode inspects local evidence records only. It does not execute
actions, authenticate reviewers, guarantee legality, or prove compliance.

### Evidence Bundle Export

P3-M013 adds local evidence bundle export. Evidence bundles consolidate one
human review record and its linked approval pack into a single explanation file
for demos, client review, or internal audit support.

Bundles show the proposed AI action, Agent Trust Gate decision, applied policy
profile, whether human approval was required, the human review decision, approval
pack hash integrity, and safety disclaimers.

Example commands:

```sh
npm run verify -- --evidence-bundle approval-reviews/example_review.json
npm run verify -- --evidence-bundle approval-reviews/example_review.json --json
npm run verify -- --evidence-bundle approval-reviews/example_review.json --save-evidence-bundle
npm run verify -- --evidence-bundle approval-reviews/example_review.json --save-evidence-bundle --json
```

Approval pack integrity status:

- `match`: the linked approval pack exists and its SHA-256 hash matches the
  review record.
- `mismatch`: the linked approval pack exists but its hash differs, or it cannot
  be parsed as a valid approval pack.
- `missing`: the linked approval pack path does not exist.

Evidence bundles are local explanation records. They do not execute actions,
authenticate reviewers, guarantee legality, or prove compliance.

### Local Gateway API Mode

P3-M014 adds Local Gateway API Mode so agents, scripts, CI steps, and local
business workflows can call Agent Trust Gate as machine-to-machine
infrastructure before taking high-impact actions.

This mode starts a local HTTP API bound to `127.0.0.1` by default. It is for
local development and local integration only, not production internet hosting.
Do not expose it publicly. API keys, authentication, and stronger deployment
hardening are future work.

Example commands:

```sh
npm run verify -- --serve
npm run verify -- --serve --port 8787
```

Example endpoints:

```text
GET  http://127.0.0.1:8787/v1/health
POST http://127.0.0.1:8787/v1/decision
POST http://127.0.0.1:8787/v1/approval-pack
POST http://127.0.0.1:8787/v1/evidence-bundle
```

Example decision request:

```json
{
  "policy_profile": "regulated",
  "action": {
    "action_type": "public_post",
    "description": "Publish a project update on a public channel.",
    "actor": "communications-agent",
    "target": "public-channel",
    "public_action": true,
    "customer_or_user_facing": true,
    "rollback_plan": "Delete the post and issue a correction if needed.",
    "human_approval_status": "not_requested"
  }
}
```

Local Gateway API Mode is for local machine-to-machine integration. It returns
trust decisions and evidence objects only. It does not execute actions, expose a
public service, authenticate users, guarantee legality, or prove compliance.

### Gateway Request Logging & Decision Metering

P3-M015 adds local gateway request logging and decision metering. This makes
Local Gateway API Mode measurable: teams can see how many machine-to-machine
trust decisions, approval packs, evidence bundles, health checks, and errors
were requested through the local gateway.

Local metering matters because Agent Trust Gate is infrastructure. Usage records
are the local foundation for future usage-based pricing, subscription limits,
billing analytics, and enterprise reporting. This version does not add payments,
cloud services, public hosting, scraping, external services, or autonomous
execution.

Gateway requests are logged locally to:

```text
gateway-logs/gateway-requests.jsonl
```

Generated gateway logs are ignored by Git. The tracked `gateway-logs/.gitkeep`
file keeps the local log folder present.

Example commands:

```sh
npm run verify -- --serve --port 8787
npm run verify -- --gateway-usage
npm run verify -- --gateway-usage --json
npm run verify -- --list-gateway-requests
npm run verify -- --list-gateway-requests --json
```

Gateway usage summary includes request counts, endpoint counts, method counts,
allowed and blocked counts, approval-required counts, risk counts, regulated
policy counts, policy profile counts, error counts, malformed log line counts,
and first/last request timestamps.

Recent gateway request listing defaults to the latest 20 entries:

```sh
npm run verify -- --list-gateway-requests --limit 50
```

Gateway request logs are local usage records only. They do not execute actions,
bill customers, expose a public service, authenticate users, guarantee legality,
or prove compliance.

### Local Client Identity & API Key Gate

P3-M016 adds local client identity and optional local API key gating for Local
Gateway API Mode. Client identity matters because metered infrastructure needs
to group usage by calling system: local agents, dashboards, scripts, CI jobs, or
future customer integrations.

By default, API key enforcement is off and existing local gateway calls continue
to work. Requests can include a local client identity header:

```text
X-ATG-Client-ID: local-demo-agent
```

If the header is omitted or empty, Agent Trust Gate records the request as:

```text
local-anonymous
```

Optional local API key mode can be enabled at startup:

```sh
npm run verify -- --serve --port 8787
npm run verify -- --serve --port 8787 --require-api-key
npm run verify -- --serve --port 8787 --require-api-key --clients-file gateway-clients.json
```

Protected endpoints require `X-ATG-API-Key` only when `--require-api-key` is
enabled:

```text
X-ATG-Client-ID: local-demo-agent
X-ATG-API-Key: replace-with-local-dev-key
```

Protected endpoints:

- `POST /v1/decision`
- `POST /v1/approval-pack`
- `POST /v1/evidence-bundle`

`GET /v1/health` remains open and reports whether `api_key_required` is true.

Local client configuration lives in:

```text
gateway-clients.json
```

That file is ignored by Git because it may contain local secrets. The tracked
`gateway-clients.example.json` file is a safe example config with a placeholder
API key. Raw API keys are not written to gateway request logs.

Local API key mode is for local development hardening and client attribution. It
does not expose a public service, bill customers, authenticate real-world
identities, guarantee legality, or prove compliance.

### Local Client Usage Limits & Decision Allowances

P3-M017 adds local client usage limits and decision allowances. Allowances matter
because metered infrastructure needs a way to enforce local decision quotas
before future subscription tiers, monthly allowances, over-limit controls, and
enterprise reporting can exist.

This is local only. It is not billing, does not process payments, does not add
cloud services, and does not expose a public service.

Example `gateway-clients.json` entry:

```json
{
  "clients": [
    {
      "client_id": "local-demo-agent",
      "api_key": "replace-with-local-dev-key",
      "label": "Local Demo Agent",
      "decision_allowance": 1000,
      "allowance_window": "monthly"
    }
  ]
}
```

Supported allowance windows:

- `all_time`
- `daily`
- `monthly`

When `--require-api-key` is enabled and a matched client has
`decision_allowance`, Agent Trust Gate counts previous successful protected
gateway requests for that client from `gateway-logs/gateway-requests.jsonl`.
Protected requests are:

- `POST /v1/decision`
- `POST /v1/approval-pack`
- `POST /v1/evidence-bundle`

If the client is at or over its local allowance, the gateway returns HTTP `429`
with error code `CLIENT_USAGE_LIMIT_EXCEEDED`. The protected decision, approval
pack, or evidence bundle logic does not run for that over-limit request. The
rejection is still logged locally.

Example commands:

```sh
npm run verify -- --serve --port 8787 --require-api-key
npm run verify -- --gateway-usage
npm run verify -- --client-usage
npm run verify -- --client-usage --json
```

Clients without `decision_allowance` are treated as local unlimited clients.

Local decision allowances are local control records only. They do not bill
customers, process payments, expose a public service, authenticate real-world
identities, guarantee legality, or prove compliance.

### Local Gateway Admin Summary

P3-M018 adds a local gateway admin summary for human operators. It gives one
place to inspect gateway health, client usage, local allowances, over-limit
events, authentication activity, and decision outcomes from local gateway logs.

This matters for infrastructure operation because machine-to-machine products
need an operator view: who is using the gateway, how many trust decisions were
requested, which clients are near or over local allowance, and whether the
gateway is producing useful metering records.

The admin summary reads local gateway logs and, when provided, the local client
configuration file. It never displays raw API keys. Configured clients are shown
with `has_api_key_configured: true` or `false` only.

Example commands:

```sh
npm run verify -- --gateway-admin
npm run verify -- --gateway-admin --json
npm run verify -- --gateway-admin --clients-file gateway-clients.json
npm run verify -- --gateway-admin --clients-file gateway-clients.json --json
```

The summary includes:

- gateway request totals and malformed log line counts
- decision, approval pack, evidence bundle, and health request counts
- allowed, blocked, approval-required, risk, and regulated-policy counts
- authenticated, unauthenticated, and unauthorized request counts
- over-limit request counts and usage-limited client counts
- per-client usage, allowance, remaining decisions, and allowance status

If `gateway-clients.json` is missing, the command does not crash. If gateway
logs are missing, it returns zero usage and still shows configured clients when
a clients file is provided.

Local Gateway Admin Summary reads local usage logs and local client
configuration only. It does not execute actions, bill customers, expose a public
service, authenticate real-world identities, guarantee legality, or prove
compliance.

### Gateway Developer Quickstart Pack

P3-M019 adds a local developer quickstart pack for calling Agent Trust Gate
through Local Gateway API Mode in minutes. The examples are under:

```text
examples/gateway-quickstart/
```

The pack includes:

- a quickstart README with curl, PowerShell, and API-key examples
- safe sample action descriptors for public posts, customer emails, and
  synthetic money movement checks
- a safe demo client config with fake local credentials
- a Node.js gateway client example
- a PowerShell gateway client example

Example local flow:

```sh
npm run verify -- --serve --port 8787
npm run verify -- --serve --port 8787 --require-api-key --clients-file examples/gateway-quickstart/gateway-clients.demo.json
node examples/gateway-quickstart/node-gateway-client.mjs
powershell -ExecutionPolicy Bypass -File examples/gateway-quickstart/powershell-gateway-client.ps1
npm run verify -- --gateway-usage
npm run verify -- --gateway-admin
```

The quickstart demonstrates the basic integration loop:

1. start the local gateway
2. call `GET /v1/health`
3. call `POST /v1/decision`
4. interpret `ALLOW`, `BLOCK`, or `REQUEST HUMAN`
5. inspect local usage and admin summaries

Gateway quickstart examples are local demos only. They do not execute actions,
bill customers, expose a public service, authenticate real-world identities,
guarantee legality, or prove compliance.

### Gateway OpenAPI / API Contract Export

P3-M020 adds an OpenAPI 3.1 contract for professional local gateway
integration. The machine-readable contract documents endpoint request and
response shapes, stable action fields, errors, local client headers, optional
API-key gating, usage limits, and safety boundaries. It can support future SDK,
testing, onboarding, and enterprise evaluation work without adding a hosted
developer portal or public API.

The stable tracked contract is at:

```text
docs/agent-trust-gate.openapi.json
```

Generate, inspect, or export the same contract locally:

```sh
npm run verify -- --openapi
npm run verify -- --openapi --json
npm run verify -- --openapi --output openapi/agent-trust-gate.openapi.json
npm run verify -- --serve --port 8787
```

The running local gateway serves the contract without requiring an API key:

```text
GET http://127.0.0.1:8787/v1/openapi.json
```

The contract documents these optional local headers:

- `X-ATG-Client-ID` identifies the local calling system.
- `X-ATG-API-Key` is used only when optional local API-key mode is enabled.

API-key mode is local development hardening only. It does not authenticate
real-world identities, and raw API keys must not be logged.

The OpenAPI contract describes the local gateway interface. It does not expose
a public service, execute actions, bill customers, authenticate real-world
identities, guarantee legality, or prove compliance.

### Gateway SDK Starter Pack

P3-M021 adds small SDK-style wrappers that remove repetitive HTTP setup for
local Agent Trust Gate integrations. The dependency-free examples are under:

```text
examples/gateway-sdk/
```

The pack includes an ES module client, a PowerShell function library, and safe
demos for both. Each wrapper supports health checks, trust decisions, approval
packs, evidence bundles, OpenAPI retrieval, optional local client headers, and
consistent JSON error handling.

This is inspectable starter code, not a published npm or PowerShell Gallery SDK.
Run the demos against a local gateway:

```sh
node examples/gateway-sdk/node-sdk-demo.mjs
powershell -ExecutionPolicy Bypass -File examples/gateway-sdk/powershell-sdk-demo.ps1
```

See `examples/gateway-sdk/README.md` for gateway startup, optional demo API-key
mode, wrapper methods, and ALLOW / BLOCK / REQUEST HUMAN handling.

Gateway SDK starter wrappers are local demo clients only. They do not execute
actions, bill customers, expose a public service, authenticate real-world
identities, guarantee legality, or prove compliance.

### Agent Integration Manifest & MCP Tool Adapter Pack

P3-M022 adds machine-readable local discovery for AI agents and agent
developers. The Agent Integration Manifest describes gateway capabilities,
tools, schemas, local authentication headers, usage and allowance handling, and
safety limits. The MCP-style adapter pack shows how those capabilities can be
presented to an agent framework without implementing or publishing a production
MCP server.

Inspect or export the manifest:

```sh
npm run verify -- --agent-manifest
npm run verify -- --agent-manifest --json
npm run verify -- --agent-manifest --output manifests/agent-trust-gate.agent-manifest.json
```

The stable tracked manifest is `docs/agent-trust-gate.agent-manifest.json`.
When the local gateway is running, agents can discover it at:

```text
GET http://127.0.0.1:8787/v1/agent-manifest.json
```

Run the dependency-free local MCP-style demonstration:

```sh
node examples/mcp-adapter/node-mcp-style-adapter.mjs
```

The manifest explicitly reports `purchase_enabled: false`,
`automatic_purchase_enabled: false`, and `billing_enabled: false`. Usage and
allowance fields remain local controls only. No action, purchase, billing, or
payment processing is performed.

Agent Integration Manifest and MCP-style adapter examples are local
discovery/integration aids only. They do not execute actions, bill customers,
process payments, expose a public service, authenticate real-world identities,
guarantee legality, or prove compliance.

### Agent Entitlement & Upgrade Signal Layer

P3-M023 adds a machine-readable local entitlement status so agents and
developers can inspect client identity, configured decision allowance, usage,
remaining decisions, over-limit state, and whether a future commercial upgrade
would be required. This creates a stable entitlement interface without adding
payments, billing, customer accounts, or automatic purchasing.

Inspect entitlement locally:

```sh
npm run verify -- --entitlement
npm run verify -- --entitlement --json
npm run verify -- --entitlement --client-id local-demo-agent --clients-file gateway-clients.json
```

When Local Gateway API Mode is running:

```text
GET http://127.0.0.1:8787/v1/entitlement
```

The endpoint accepts `X-ATG-Client-ID`. When the gateway runs with
`--require-api-key`, entitlement lookup also requires a matching
`X-ATG-API-Key` because usage status is client-specific.

Entitlement statuses:

- `active`: a configured allowance has remaining decisions.
- `unlimited_local`: the known local client has no configured allowance.
- `at_limit`: the configured allowance is exactly exhausted.
- `over_limit`: usage exceeded allowance or an over-limit request was recorded.
- `unknown_client`: the client has no configuration or protected usage record.

`at_limit` and `over_limit` return `upgrade_required: true`, but all entitlement
responses retain `purchase_enabled: false`, `automatic_purchase_enabled: false`,
and `billing_enabled: false`. No purchase or payment can be initiated.

Entitlement and upgrade signals are local control signals only. They do not bill
customers, process payments, enable automatic purchase, expose a public service,
authenticate real-world identities, guarantee legality, or prove compliance.

### Commercial Readiness Snapshot

P3-M024 adds a deterministic local planning snapshot that separates three
different measures instead of treating local MVP progress as full commercial
completion:

- local product readiness: the local trust, evidence, gateway, metering, and
  integration foundations
- commercial MVP readiness: the work needed for a responsibly sellable and
  supportable developer/agent product
- full target readiness: hosted global infrastructure, accounts, production
  security and monitoring, payments, billing, automatic machine purchasing,
  distribution, legal positioning, and governed adaptive recommendations

Inspect or export the snapshot:

```sh
npm run verify -- --commercial-readiness
npm run verify -- --commercial-readiness --json
npm run verify -- --commercial-readiness --output reports/commercial-readiness.json
```

When Local Gateway API Mode is running:

```text
GET http://127.0.0.1:8787/v1/commercial-readiness
```

The snapshot records evidence, gaps, and next steps for each readiness category.
It does not claim Agent Trust Gate is 100% complete. Production hosting,
payment processing, automatic machine-to-machine purchase, billing records,
global automated marketing, and self-learning market scanning remain
`not_started` or `future` targets. The scores are static planning judgments and
do not implement any missing capability.

Commercial readiness is a local planning snapshot only. It does not bill
customers, process payments, enable automatic purchase, execute actions, expose
a public service, authenticate real-world identities, guarantee legality, or
prove compliance.

### Hosted Deployment Readiness Pack

P3-M025 adds a local, machine-readable preparation pack for a future hosted
deployment review. It identifies existing local foundations, critical blockers,
required controls, safe environment defaults, and migration work without
deploying Agent Trust Gate or changing the gateway's localhost-only behavior.

Run the readiness report locally:

```sh
npm run verify -- --hosted-readiness
npm run verify -- --hosted-readiness --json
npm run verify -- --hosted-readiness --output reports/hosted-readiness.json
```

When Local Gateway API Mode is running:

```text
GET http://127.0.0.1:8787/v1/hosted-readiness
```

The gateway still binds to `127.0.0.1` by default. This mission does not add a
public binding option, cloud deployment, production authentication, customer
accounts, payments, billing, automatic purchase, or production monitoring.

Deployment readiness documents:

- `docs/deployment-readiness/README.md`
- `docs/deployment-readiness/production-checklist.md`
- `docs/deployment-readiness/env.example`
- `docs/deployment-readiness/local-to-hosted-notes.md`

The commercial readiness snapshot now records `production_hosting` as partial
preparation, not a hosted or production-ready service. Public hosting still
requires production security, HTTPS/TLS, authentication, authorization, tenant
isolation, rate limiting, abuse controls, monitoring, retention, legal review,
staging, incident response, and tested rollback.

Hosted readiness is a local planning and configuration aid only. It does not
deploy Agent Trust Gate, expose a public service, bill customers, process
payments, enable automatic purchase, execute actions, authenticate real-world
identities, guarantee legality, or prove compliance.

### Production Security Readiness Pack

P3-M026 adds a deterministic local production security readiness report. It
separates existing local safeguards from the authentication, secret storage,
transport security, rate limiting, abuse prevention, monitoring, retention,
privacy, legal, incident response, and dependency controls still required before
public hosting. It is planning evidence, not an audit or certification.

Run the report locally:

```sh
npm run verify -- --security-readiness
npm run verify -- --security-readiness --json
npm run verify -- --security-readiness --output reports/security-readiness.json
```

When Local Gateway API Mode is running:

```text
GET http://127.0.0.1:8787/v1/security-readiness
```

The gateway remains bound to `127.0.0.1` by default. The report does not scan,
deploy, expose, authenticate, monitor, or certify a production service.

Security readiness documents:

- `docs/security-readiness/README.md`
- `docs/security-readiness/production-security-checklist.md`
- `docs/security-readiness/secret-handling.md`
- `docs/security-readiness/incident-response-template.md`
- `docs/security-readiness/rate-limiting-and-abuse-prevention.md`

Security readiness is a local planning snapshot only. It does not deploy Agent
Trust Gate, expose a public service, certify security, bill customers, process
payments, enable automatic purchase, execute actions, authenticate real-world
identities, guarantee legality, prove compliance, or provide SOC2, ISO27001,
GDPR, or payment certification.

### Local Rate Limit And Abuse-Control Signal Layer

P3-M027 adds optional per-client request limits for one local gateway runtime.
It returns deterministic limit and abuse-control signals and rejects an
over-limit protected request with HTTP `429` and `ATG_RATE_LIMIT_EXCEEDED`
before trust-decision or evidence logic runs.

```sh
npm run verify -- --rate-limit-status
npm run verify -- --rate-limit-status --json
npm run verify -- --rate-limit-status --client-id local-demo-agent --clients-file gateway-clients.example.json --json
npm run verify -- --rate-limit-status --output reports/rate-limit-status.json
```

When the local gateway is running:

```text
GET http://127.0.0.1:8787/v1/rate-limit-status
```

The optional client configuration is documented under
`docs/rate-limit-abuse-control/`. Runtime counters reset when the gateway
process restarts. CLI inspection reads local logs as an audit snapshot, while
the live endpoint reports the current process counter.

Rate limit and abuse-control signals are local controls only. They do not deploy
Agent Trust Gate, expose a public service, provide production-grade abuse
prevention, bill customers, process payments, enable automatic purchase,
execute actions, authenticate real-world identities, guarantee legality, prove
compliance, or provide security certification.

### Production Monitoring And Health Signal Pack

P3-M028 adds a deterministic local operational health report using existing
gateway health, request IDs, structured request logs, usage, authentication,
malformed-line, and rate-limit signals. A live gateway report includes uptime
for that local gateway process; CLI output marks gateway uptime unavailable.

```sh
npm run verify -- --monitoring-health
npm run verify -- --monitoring-health --json
npm run verify -- --monitoring-health --output reports/monitoring-health.json
```

When the local gateway is running:

```text
GET http://127.0.0.1:8787/v1/monitoring-health
```

Supporting documents are in `docs/monitoring-health/`. This pack does not add
an external observability vendor, external alerts, hosted dashboard, public
probe, availability commitment, or deployment behavior.

Monitoring health is a local planning and operational signal only. It does not
deploy Agent Trust Gate, expose a public service, provide production monitoring,
enable external alerting, provide a public uptime SLA, bill customers, process
payments, enable automatic purchase, execute actions, authenticate real-world
identities, guarantee legality, prove compliance, or provide security
certification.

## P3-M029: Incident Response & Operational Recovery Pack

P3-M029 adds a deterministic local incident readiness report, severity model,
containment and recovery guidance, and a blank incident record export. It moves
incident planning from missing to partial/local only; it does not establish a
staffed, exercised, or production incident response capability.

```sh
npm run verify -- --incident-response-readiness
npm run verify -- --incident-response-readiness --json
npm run verify -- --incident-response-readiness --output reports/incident-response-readiness.json
npm run verify -- --incident-template
npm run verify -- --incident-template --json
npm run verify -- --incident-template --output incidents/example-incident-record.json
```

With the local gateway running, the same readiness report is available at:

```text
GET http://127.0.0.1:8787/v1/incident-response-readiness
```

Supporting guidance is in `docs/incident-response/`. Generated incident JSON
records under `incidents/` are ignored by Git. The record template must not be
used to store raw API keys or unrelated sensitive payloads.

Incident response readiness is a local planning snapshot only. It does not
deploy Agent Trust Gate, expose a public service, provide production incident
response, enable external alerting, notify customers, bill customers, process
payments, enable automatic purchase, execute actions, authenticate real-world
identities, guarantee legality, prove compliance, or provide security
certification.

## P3-M030: Customer Account & Tenant Readiness Pack

P3-M030 adds a deterministic local account, tenant, client ownership, plan, and
future billing-readiness model. An optional parser reads safe placeholder tenant
configuration without creating accounts, changing entitlements, or establishing
a billing relationship.

```sh
npm run verify -- --customer-tenant-readiness
npm run verify -- --customer-tenant-readiness --json
npm run verify -- --customer-tenant-readiness --output reports/customer-tenant-readiness.json
npm run verify -- --customer-tenant-readiness --tenants-file examples/customer-tenants/customer-tenants.example.json --json
```

With the local gateway running:

```text
GET http://127.0.0.1:8787/v1/customer-tenant-readiness
```

The safe placeholder config is at
`examples/customer-tenants/customer-tenants.example.json`; supporting guidance is
under `docs/customer-tenant-readiness/`. Production authentication, secure account
storage, tenant isolation, privacy and terms review, support, deletion/export,
billing terms, payment integration, and customer incident communication remain
future requirements.

Customer and tenant readiness is a local planning snapshot only. It does not
create real customer accounts, collect personal data, provide login/signup, bill
customers, process payments, enable automatic purchase, expose a public service,
execute actions, authenticate real-world identities, guarantee legality, prove
compliance, or provide security certification.

## P3-M031: Billing & Payment Readiness Pack

P3-M031 adds price-free placeholder plans and deterministic local models for
billing status, payment status, future provider requirements, and governed
machine-purchase readiness. It does not activate a tariff or transaction path.

```sh
npm run verify -- --billing-payment-readiness
npm run verify -- --billing-payment-readiness --json
npm run verify -- --billing-payment-readiness --output reports/billing-payment-readiness.json
npm run verify -- --billing-payment-readiness --plans-file examples/billing-payment/billing-plans.example.json --json
```

With the local gateway running:

```text
GET http://127.0.0.1:8787/v1/billing-payment-readiness
```

The safe placeholder catalogue is at
`examples/billing-payment/billing-plans.example.json`; supporting guidance is in
`docs/billing-payment-readiness/`. No payment provider or payment SDK is added.

Billing and payment readiness is a local planning snapshot only. It does not bill
customers, process payments, collect payment details, enable automatic purchase,
create real invoices, expose a public service, execute actions, authenticate
real-world identities, guarantee legality, prove compliance, provide PCI
compliance, or provide security certification.

## P3-M032: Machine-to-Machine Purchase Policy Readiness Pack

This pack adds a strict local deny policy with zero spending limits, mandatory
human approval, and purchase evidence requirements. It adds no purchase endpoint.

```sh
npm run verify -- --machine-purchase-policy-readiness
npm run verify -- --machine-purchase-policy-readiness --json
npm run verify -- --machine-purchase-policy-readiness --output reports/machine-purchase-policy-readiness.json
npm run verify -- --machine-purchase-policy-readiness --policy-file examples/machine-purchase-policy/machine-purchase-policy.example.json --json
```

`GET http://127.0.0.1:8787/v1/machine-purchase-policy-readiness`

Machine-to-machine purchase policy readiness is a local planning snapshot only.
It does not enable automatic purchase, bill customers, process payments, collect
payment details, create real purchases, expose a public service, execute actions,
authenticate real-world identities, guarantee legality, prove compliance, provide
PCI compliance, or provide security certification.

## P3-M033: Public Developer Documentation & Launch Readiness Pack

P3-M033 adds a structured local external-developer documentation set and a
deterministic launch-gate report. Nothing is published or deployed.

```sh
npm run verify -- --launch-readiness
npm run verify -- --launch-readiness --json
npm run verify -- --launch-readiness --output reports/launch-readiness.json
```

`GET http://127.0.0.1:8787/v1/launch-readiness`

The documentation starts at `docs/public-developer/README.md` and covers product
overview, local quickstart, gateway API, OpenAPI and SDKs, agent manifest and MCP,
approval/evidence, usage/entitlements/rate limits, commerce boundaries, hosted
roadmap, and safety limitations.

Launch readiness is a local planning snapshot only. It does not publish Agent
Trust Gate, deploy a hosted service, expose a public API, collect signups, bill
customers, process payments, enable automatic purchase, execute actions,
authenticate real-world identities, guarantee legality, prove compliance, provide
PCI compliance, or provide security certification.

## P3-M034: Global Marketing & Distribution Readiness Pack

P3-M034 adds a deterministic local positioning and distribution-readiness model.
It inventories prospective developer and agent-builder channels, current adoption
assets, draft message boundaries, launch risks, and mandatory approval gates.
Nothing is published, advertised, tracked, deployed, or sent externally.

```sh
npm run verify -- --global-marketing-readiness
npm run verify -- --global-marketing-readiness --json
npm run verify -- --global-marketing-readiness --output reports/global-marketing-readiness.json
```

`GET http://127.0.0.1:8787/v1/global-marketing-readiness`

The supporting local documents are in `docs/global-marketing-readiness/`. Every
distribution channel remains non-live and requires explicit review and approval.

Global marketing readiness is a local planning snapshot only. It does not publish
Agent Trust Gate, deploy a hosted service, expose a public API, send outreach, run
ads, add analytics or tracking, collect signups, bill customers, process payments,
enable automatic purchase, execute actions, authenticate real-world identities,
guarantee legality, prove compliance, provide PCI compliance, or provide security
certification.

Agent-to-agent discovery and invitation readiness is local planning only. It does
not contact external agents, scan the web, send outreach, publish an agent card,
expose a public endpoint, process payments, enable automatic purchase, or execute
actions.

## P3-M035: Commercial Launch Control Pack

P3-M035 adds a deny-by-default local governance document and machine-readable
control record for any future commercial launch decision. See
`docs/commercial-launch-control.md` and
`config/commercial-launch-control.json`. The blocked and placeholder examples are
`examples/commercial-launch-blocked.json` and
`examples/commercial-launch-approved-placeholder.json`.

Every launch, deployment, publishing, outreach, signup, billing, payment,
tracking, scanning, customer-charging, and automatic-purchase flag defaults to
false. Technical validation, commercial validation, legal review, human approval,
and Gareth's final approval are all required. This pack does not launch, deploy,
publish, sell, contact, sign up, bill, charge, track, scan, buy, or execute
anything.

## P3-M036: Public Trust Page Pack

P3-M036 adds local draft trust content for developers, businesses, procurement,
compliance teams, agent platforms, and cautious human decision makers. The pack
includes `docs/public-trust-page.md`, `docs/public-trust-faq.md`,
`config/public-trust-page.json`, and blocked preview/publication examples.

The page is not live or published. Public-page, deployment, tracking, analytics,
signup, contact-form, email, billing, payment, outreach, scanning, and automatic-
purchase flags all remain false. Commercial launch control, legal review, and
Gareth final approval are required before any future publication decision.

## P3-M037: Developer Integration Safety Pack

P3-M037 adds local draft guidance for integrating developers, internal tools,
future agent platforms, and other AI systems without exposing or activating an
external service. See `docs/developer-integration-safety.md`,
`docs/developer-integration-api-draft.md`, and
`config/developer-integration-safety.json`.

External/public APIs, agent networking, third-party connections, webhooks, live
customer data, execution, deployment, publishing, outreach, tracking, signup,
billing, payment, scanning, and automatic purchase remain disabled. Technical
validation, security review, legal review, human approval, commercial launch
control, and Gareth final approval are required before external integration.

## P3-M038: Agent-to-Agent Trust Handshake Pack

P3-M038 backfills a local-only declaration and verification model for future
agent-to-agent trust decisions. It adds the handshake guide, schema draft,
false-default safety config, blocked request/response examples, and a non-enabling
approval placeholder while preserving the later RefusalGraph work.

Agent networking, external connections, public protocol/API access,
machine-to-machine trust, third-party connections, webhooks, live customer data,
RefusalGraph live lookup, execution, deployment, publishing, outreach, tracking,
signup, billing, payment, scanning, and purchase remain disabled. External use
requires technical, security, privacy, legal, human, and Gareth final approval.

## P3-M039: RefusalGraph Core Pack

P3-M039 adds a local-only refusal-intelligence concept, draft signal vocabulary,
false-default safety config, privacy-minimised refusal example, non-executing
lookup drafts, and a blocked commercial fee placeholder. See
`docs/refusalgraph-core.md`, `docs/refusalgraph-signal-schema-draft.md`, and
`config/refusalgraph-safety.json`.

RefusalGraph, networks, external or agent lookups, public APIs, machine-to-machine
fees, payments, billing, private-data export, third-party connections, webhooks,
deployment, publishing, outreach, tracking, signup, purchase, and action execution
remain disabled. All external and commercial use requires Gareth final approval.

## P3-M040: Agent Clearing House Foundation Pack

P3-M040 adds a local-only foundation showing how Agent Trust Gate, the
Agent-to-Agent Handshake, RefusalGraph, draft Agent Treaties, Agent Receipts, and
clearance decisions could fit into a future machine-to-machine clearing layer.
See `docs/agent-clearing-house-foundation.md`, `docs/agent-treaty-draft.md`,
`docs/agent-clearing-decision-types.md`, and
`config/agent-clearing-house-safety.json`.

The clearing house, network, treaty activation, receipt exchange, RefusalGraph
live lookup, external agents, public APIs/protocols, machine fees, payment,
billing, settlement, private-data export, deployment, publishing, outreach,
tracking, signup, purchase, and action execution remain disabled. All live or
commercial use requires Gareth final approval.

## P3-M041: RefusalGraph Signal Engine Pack

P3-M041 adds the first pure local RefusalGraph logic layer. It converts blocked,
refused, limited, approval-required, missing-evidence, unclear-identity/payment,
high-risk, or policy-blocked receipt-like outcomes into allowlisted,
pseudonymised, hash-only draft signals. Fully allowed low-risk receipts produce no
refusal signal.

The engine performs no I/O or network calls and copies no raw reason, evidence,
identity, customer, company, payment, document, endpoint, URL, or email content.
Signal persistence, network/external/agent lookup, public APIs, machine fees,
payment, billing, settlement, private-data export, deployment, publishing,
outreach, tracking, signup, purchase, and action execution remain disabled.

## P3-M042: RefusalGraph Local Query Engine Pack

P3-M042 adds a pure in-memory query layer for local draft RefusalGraph signals.
It matches allowlisted action categories and types, aggregates safe refusal reason
codes, assigns a deterministic caution level, and recommends evidence, identity,
approval, payment-intent, or refusal controls. No match is not proof of trust.

Query IDs are pseudonymised and results contain no raw reasons, evidence, signal
identifiers, identities, customer, company, payment, document, endpoint, URL, or
email content. Persistence, network and external lookup, public APIs,
agent-to-agent lookup, machine fees, payment, billing, settlement, private-data
export, deployment, publishing, outreach, tracking, signup, purchase, and action
execution remain disabled.

## P3-M043: Agent Clearing Decision Engine Pack

P3-M043 adds a pure local decision layer that combines a draft clearing request,
evidence, approval, identity, risk and payment-intent state, and a local
RefusalGraph caution result. Deterministic fail-closed rules return only
allowlisted draft decisions such as requiring evidence, identity verification,
human approval, refusal, receipt creation, or acceptance with limits.

Request IDs are pseudonymised and outputs contain no agent identity, proposed
value or fee, raw evidence, refusal text, customer, company, payment, document,
endpoint, URL, or email content. Decision persistence, clearing networks,
external and agent lookup, public APIs/protocols, machine fees, payment, billing,
settlement, private-data export, deployment, publishing, outreach, tracking,
signup, purchase, and action execution remain disabled.

## P3-M044: Agent Clearing Receipt Engine Pack

P3-M044 adds a pure local receipt projection for Agent Clearing decisions. It
records the normalized decision, control requirements, RefusalGraph caution,
safe reason codes and next steps, and explicit non-execution state. Source IDs
are pseudonymised and arbitrary reason or next-step text is never copied.

Receipts remain unpersisted and not externally verified. Clearing networks,
external and agent lookup, public APIs/protocols, receipt exchange, machine fees,
payment, billing, settlement, private-data export, deployment, publishing,
outreach, tracking, signup, purchase, and action execution remain disabled.

## P3-M045: Unique Advantage Radar Pack

P3-M045 adds a pure local strategic scoring discipline for future missions. Ten
equally weighted criteria test uniqueness, defensibility, agent and clearing
value, future fee potential, RefusalGraph contribution, private-data safety,
developer adoption, commercial clarity, resistance to large-company bundling,
and simplicity. Scores are planning hypotheses, not market findings or build
authorization.

The radar uses human-supplied local scores only. Live market scanning,
competitor scraping, external lookup, public APIs, analytics, tracking,
publishing, deployment, outreach, signup, machine fees, payment, billing,
settlement, private-data export, third-party connections, automatic purchase,
and action execution remain disabled.

## P3-M046: Receipt Verification Readiness Pack

P3-M046 adds a pure local consistency checker for Agent Clearing Receipts. It
checks required receipt and decision references, draft status, closed reason and
next-step vocabularies, and every private-data, network, external-lookup,
payment, billing, settlement, fee, persistence, and execution indicator. A
`locally_valid` result is structural only and is not external verification.

Live and external receipt verification, receipt networks, public APIs/protocols,
agent-to-agent verification, machine fees, payment, billing, settlement,
analytics, tracking, signup, deployment, publishing, outreach, webhooks,
third-party connections, private-data export, automatic purchase, and action
execution remain disabled.

## P3-M047: Fee Metering Readiness Pack

P3-M047 adds a pure local classifier for future fee-relevant RefusalGraph,
clearing, receipt, verification, treaty, handshake, and strategic review events.
It produces deterministic pseudonymous placeholder events and discards actor,
linked-object, arbitrary category, and raw fee amount data.

No billable event is recorded. Live metering, external metering, tracking,
analytics, public APIs/protocols, receipt networks, agent metering, machine fees,
billing, payment, settlement, signup, deployment, publishing, outreach,
third-party connections, private-data export, automatic purchase, and action
execution remain disabled.

## P3-M048: Agent Clearing Pipeline Demo Pack

P3-M048 composes the local RefusalGraph query, clearing decision, clearing
receipt, receipt verification-readiness, and fee-metering placeholder engines
into one deterministic in-memory demonstration. High-caution requests fail
closed; low-risk requests may produce `accept_with_limits`, but no proposed
action is executed.

The demo uses no network or external lookup and records no billable event. Live
pipelines, public APIs/protocols, agent-to-agent pipelines, receipt networks,
external verification, live/external metering, machine fees, tracking,
analytics, billing, payment, settlement, signup, deployment, publishing,
outreach, third-party connections, private-data export, automatic purchase, and
action execution remain disabled.

## P3-M049: Agent Clearing Demo CLI Pack

P3-M049 exposes the local pipeline demo through a short-lived compiled command:

```text
npm run demo:clearing -- examples/agent-clearing-cli-input-draft.json --pretty
```

The command rebuilds an allowlisted local input, prints the draft pipeline JSON
to stdout, and returns structured errors without paths, values, or stack traces.
It starts no server and writes no output file. Live CLI/network use, public
APIs/protocols, agent-to-agent CLI, receipt networks, external verification,
live/external metering, billable events, tracking, analytics, machine fees,
billing, payment, settlement, signup, deployment, publishing, outreach,
third-party connections, private-data export, automatic purchase, and action
execution remain disabled.

## P3-M050: Agent Clearing Demo Report Pack

P3-M050 converts a local pipeline/CLI result into an allowlisted human-readable
report object and optional in-memory Markdown. Request context is derived only
from normalized reason codes; raw request text, identities, targets, values, and
private fields are never interpolated.

The tracked local example explains high RefusalGraph caution, required human
approval, draft receipt creation, local verification, and placeholder-only fee
metering. No report is written, exported, or published. Live reporting,
publishing/export, tracking, analytics, networks, external verification,
billable events, metering, billing, payment, settlement, deployment, outreach,
third-party connections, private-data export, automatic purchase, and action
execution remain disabled.

## P3-M051: Agent Clearing Public Demo Narrative Pack

P3-M051 adds draft public-facing narrative, one-page summary, FAQ, and a pure
local narrative builder. The core positioning is: "Before an agent says yes, it
can check who already said no - and why."

The materials explain the request-to-RefusalGraph-to-decision-to-receipt-to-
verification-to-fee-placeholder flow without publishing a page or activating a
service. Live pages, publishing, deployment, tracking, analytics, signup,
contact forms, billing, payment, settlement, fees, outreach, email, webhooks,
third-party connections, public interfaces, agent/clearing/receipt networks,
live verification, live metering, private-data export, automatic purchase, and
action execution remain disabled.

## P3-M052: Agent Clearing Investor / Partner Brief Pack

P3-M052 adds an internal draft investor/partner brief, concise partner summary,
founder strategic memo, and pure local brief/Markdown builder. The materials
position Agent Clearing House as a protocol-neutral clearing layer and
RefusalGraph as privacy-minimized negative trust intelligence, while treating
adoption, defensibility, and fee points as hypotheses rather than guarantees.

Nothing is externally shared, published, emailed, or sent as outreach. CRM,
tracking, analytics, public pages, deployment, signup, contact forms, billing,
payment, settlement, machine fees, webhooks, third-party connections, public
interfaces, agent/clearing/receipt networks, live verification, live metering,
private-data export, automatic purchase, and action execution remain disabled.

## P3-M053: Local Clearing Ledger Pack

P3-M053 adds an immutable in-memory ledger for allowlisted pipeline, decision,
receipt, verification, fee-placeholder, RefusalGraph, and demo-report records.
It supports deterministic IDs, pseudonymous references, deduplication, listing,
lookup, and safe aggregate counts. No file persistence, database, cloud sync,
tracking, network, billing, payment, settlement, or execution is enabled.

### Approval-status examples

Use `human_approval_status` to make the approval boundary explicit:

- `not_requested`: no approval has been requested.
- `requested`: approval has been requested but not granted.
- `approved`: explicit human approval exists for the exact described action.
- `rejected`: approval was rejected, so the action is blocked.

Approved high-risk examples can be run locally:

```sh
npm run verify -- examples/public-post-approved.json
npm run verify -- examples/money-movement-approved.json
npm run verify -- examples/customer-facing-approved.json
npm run verify -- examples/high-risk-not-approved.json
```

Money movement remains high risk. Without `human_approval_status: "approved"`,
it is blocked. With explicit approval, the receipt can allow it only within the
exact approved scope and still records the high-risk status.

### Local receipt archive

Add `--save` to write the generated receipt into the local `receipts/` folder:

```sh
npm run verify -- examples/public-post.json --save
```

Saved receipts are local only. They are not uploaded, published, transmitted, or
used to perform the proposed action. Receipt JSON files are ignored by Git by
default; `receipts/.gitkeep` keeps the archive folder present in the project.

### Local receipt audit viewer

P3-M004 adds a local-only audit viewer for saved receipts. It reads JSON receipt
files from `receipts/`, ignores non-JSON files, handles a missing archive folder,
and marks malformed receipt files instead of crashing.

Create a local receipt:

```sh
npm run verify -- examples/public-post.json --save
```

Print an audit summary:

```sh
npm run verify -- --audit
```

List saved receipts and key fields:

```sh
npm run verify -- --list-receipts
```

Receipts are local evidence records for review and demos. They are not sent,
uploaded, published, or used to perform the proposed action.

## Human approval boundary

Explicit human approval is required for public posting, spending, legal or
compliance-sensitive work, customer commitments, external commitments, outreach,
capital movement, payment or money movement, and other high-risk actions.

Money movement is blocked unless `human_approval_status` is explicitly
`"approved"`. Approval applies only to the exact action described in the input;
the receipt does not grant broader authority.

If `human_approval_status` is `"rejected"`, the action is blocked.

Low-risk local or internal actions can be allowed when they have no cost, are
not public or externally binding, do not move money, are not legal,
compliance-sensitive, customer-facing, or user-facing, and include a rollback
plan.

## Limits

- Not legal advice.
- Not compliance certification.
- Not a security audit.
- Does not guarantee safety.
- Does not move money.
- Does not approve high-risk actions by itself.
- Does not replace human approval for high-risk actions.

This first version uses explicit input flags and deterministic rules. It does not
independently verify evidence, identity, authorization, intent, or whether the
input is complete and truthful.

## Future machine-to-machine direction

Future versions may harden Local Gateway API Mode with authentication, API keys,
policy administration, and deployment guidance. Payment handling and x402
integration are intentionally excluded from this version.
### RefusalGraph Local Signal Store Pack

The local signal store collects, queries, and summarises allowlisted RefusalGraph signals in memory. It performs no persistence, scraping, network lookup, tracking, analytics, commerce, or action execution. See `docs/refusalgraph-local-signal-store.md`.

### Batch Agent Clearing Runner Pack

The batch runner composes multiple local draft requests through RefusalGraph matching, clearing, receipts, verification, fee placeholders, reports, and one in-memory ledger. It performs no scheduling, networking, persistence, tracking, commerce, or action execution. See `docs/batch-agent-clearing-runner.md`.

### Receipt Verification CLI Pack

The local CLI validates and checks one draft clearing receipt with the existing readiness engine, then prints allowlisted JSON. It performs no live, network, external, blockchain, payment, or action verification. See `docs/receipt-verification-cli.md`.

### Fee Metering Ledger Pack

The immutable local ledger records bounded placeholder value events for clearing, RefusalGraph, receipts, verification, batches, approvals, and blocks. It performs no billing, payment, settlement, invoicing, tax reporting, tracking, network metering, or execution. See `docs/fee-metering-ledger.md`.

### Clearing Evidence Bundle Pack

The local bundle combines pseudonymous clearing, RefusalGraph, receipt, verification, ledger, fee-placeholder, report, and batch references into an allowlisted object and Markdown view. It is not legal evidence, certification, audit, public proof, or network verification. See `docs/clearing-evidence-bundle.md`.

### Clearing Replay Runner Pack

The local replay runner compares two allowlisted clearing snapshots for decision, receipt, verification, RefusalGraph, ledger, fee-placeholder, and safety consistency. It performs no production replay, action re-execution, audit, proof, network, or commercial activity. See `docs/clearing-replay-runner.md`.

### Clearing Integrity Snapshot Pack

The local snapshot combines allowlisted counts from clearing, RefusalGraph, evidence, replay, verification, fee-placeholder, and batch summaries into a deterministic demo integrity indicator. It performs no live monitoring, analytics, tracking, audit, proof, network, or commercial activity. See `docs/clearing-integrity-snapshot.md`.

### Local Agent Clearing Engine

The local engine composes one request through RefusalGraph, clearing, receipt verification, ledgers, evidence, replay, and integrity checks without networking, commerce, tracking, or action execution. See `docs/local-agent-clearing-engine.md`.

### Machine-to-Machine Paid Use Profit Test

The local profit test gates clearing-engine use behind a simulated paid-use entitlement and counts bounded repeat-use revenue placeholders without charging, networking, tracking, or executing actions. See `docs/machine-to-machine-paid-use-profit-test.md`.

### Profit Demo Scenario Runner

The local runner shows entitled clearing use, pre-use denial without entitlement, and repeat-use hypothetical revenue events in one command. See `docs/profit-demo-scenario-runner.md`.

### Controlled Sandbox Readiness

The offline sandbox permits only allowlisted test agents with local entitlement placeholders to use the clearing engine. See `docs/controlled-sandbox-readiness.md`.

### Sandbox End-to-End Smoke Test

One local command checks allowed engine use plus denied-agent and missing-entitlement controls. See `docs/sandbox-end-to-end-smoke-test.md`.

### Private Sandbox Decision Gate

The local gate converts profit, sandbox, smoke, safety, and approval checks into a Gareth review recommendation. See `docs/private-sandbox-decision-gate.md`.

### Gareth Go / No-Go Review Brief

The local owner brief turns readiness evidence into GO preparation only, HOLD, or STOP. See `docs/gareth-go-no-go-review-brief.md`.

### Private Sandbox Preparation Plan

The local plan defines fake-agent scope, prohibited capabilities, approvals, boundaries, and stop criteria. See `docs/private-sandbox-preparation-plan.md`.

### Private Sandbox Test Harness

The offline harness runs the approved local plan against fake/test-agent allowlist, entitlement, denial, and real-agent rejection cases. See `docs/private-sandbox-test-harness.md`.

### Private Sandbox Final Readiness Certificate

The local non-certification summary combines final fake-agent sandbox readiness for Gareth review only. See `docs/private-sandbox-final-readiness-certificate.md`.

### Gareth Final Approval Record

The local owner record stores GO, HOLD, or STOP while limiting GO to fake-agent demo-pack preparation only. See `docs/gareth-final-approval-record.md`.

### Direct Agent/System Pilot Offer Pack

The local pack generates draft private-pilot positioning, qualification, pricing, machine-readable offer, and unsent contact material for manual Gareth review. See `docs/direct-agent-system-pilot-offer-pack.md`.

### Direct Target List Builder

The local builder scores and ranks manually supplied placeholder pilot targets without search, scraping, contact, or sending. See `docs/direct-target-list-builder.md`.

### Global Direct Target Expansion Pack

The global extension adds worldwide placeholder targeting, global fit scores, region summaries, and manual jurisdiction cautions without discovery or contact. See `docs/global-direct-target-expansion-pack.md`.

### Global Educational Technical Review Pack

The local pack creates education-first technical review material, feedback questions, cautious quantum-readiness positioning, and unsent message drafts. See `docs/global-educational-technical-review-pack.md`.
