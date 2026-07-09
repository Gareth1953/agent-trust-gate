# Clone and Run Quickstart

This quickstart is for developers, agent-system builders, and integration
reviewers who want to inspect Agent Trust Gate™ locally after the public GitHub
launch.

Agent Trust Gate™ is a local-first pre-action / pre-settlement trust
enforcement layer for agent-led actions and payments. It evaluates a proposed
action before execution, records the decision as a structured receipt, and keeps
settlement blocked unless the local trust chain passes.

**No mandate. No evidence. No verified intent. No signed gate pass. No settlement.**

No signed gate pass means no settlement.

## What this is

This repository provides code, documentation, schemas, examples, static
manifest metadata, local CLI proof commands, and deterministic tests for
developer review.

It demonstrates how an agent-led action can be checked for:

- mandate;
- evidence;
- verified intent;
- policy and risk tier;
- receipt validity;
- replay safety;
- settlement-blocker eligibility.

## What this is not

This is not a hosted service, live API, production payment system, settlement
system, wallet, bank integration, compliance certification, legal approval,
security certification, agent-contact network, or production signing service.

It does not execute actions, move money, call payment rails, contact external
agents, deploy infrastructure, collect analytics, run telemetry, or provide a
live support SLA.

## Prerequisites

Use Node.js 20 or newer. The package metadata declares:

```text
node >=20
```

## Clone

```sh
git clone https://github.com/Gareth1953/agent-trust-gate.git
cd agent-trust-gate
```

The clone command retrieves the public code repository for local review. It does
not activate a service, API, payment, settlement, hosted system, or agent
contact path.

## Install

```sh
npm install
```

Dependencies are installed locally for development and validation.

## Run validation

Run the local test suite:

```sh
npm test
```

Build the TypeScript project:

```sh
npm run build
```

Run the typecheck:

```sh
npm run typecheck
```

## Run local demos

Run a simple allowed gate demo:

```sh
npm run demo:gate:allow
```

Run the local money-gate proof:

```sh
npm run proof:money-gate -- --input examples/local-end-to-end-money-gate-proof-input.json --summary-only
```

Inspect receipt verification and settlement-blocker simulation:

```sh
npm run demo:gate -- --input examples/local-demo-low-risk-allow.json --verify-receipt
npm run demo:gate -- --input examples/local-demo-low-risk-allow.json --simulate-replay-protection
npm run demo:gate -- --input examples/local-demo-low-risk-allow.json --simulate-settlement-blocker
```

These commands read local synthetic fixtures and print local results. They do
not execute the requested action or settlement.

## Inspect the review assets

Start with these local files:

- `README.md` for the public overview and safety boundary.
- `agent-trust-gate.manifest.json` for code-readable project status.
- `schemas/` for request, receipt, and money-gate proof shapes.
- `examples/` for synthetic local fixtures.
- `docs/` for proof-chain, launch, and safety documentation.
- `public/index.html` for the static developer landing page file.

Receipts and proof output are local artifacts only. Generated runtime artifacts
should not be treated as public proof, legal evidence, compliance certification,
or settlement authority.

## Public contact

Public project contact: `gpmiddleton71@gmail.com`

Use this email for developer, agent-system, integration, security, and public
project enquiries. It is not a live API endpoint, automated agent contact route,
autonomous outreach channel, live support SLA, payment channel, settlement
channel, or hosted service availability claim.

## Safety boundary

Current status remains `local_demo_only`.

No live APIs, hosted service, live payments, real settlement, x402 or AP2
activation, banking or wallet logic, cloud or network calls in the product,
external-agent contact, outreach automation, Agent Update Consortium
integration, Agent Contact System integration, production cryptographic signing,
or action execution is active.

Tag creation, package publishing, deployment, hosted sandbox work, live API
work, payment activation, settlement activation, external-agent contact, AUC
bridge work, Agent Contact System integration, production signing, and action
execution remain future human-approved steps only.
