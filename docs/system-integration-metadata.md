# System Integration Metadata

P3-M122 provides a safe read order and local evaluation guide for developer
assistants and integration reviewers.

Core rule:

No mandate. No evidence. No verified intent. No signed gate pass. No settlement.

Strategic boundary:

Readable now. Callable later. Autonomous execution never without gate control.

## Purpose

This document explains how to evaluate Agent Trust Gate as a public repository
without assuming live integration, live endpoints, agent communication,
payments, settlement, or action execution.

## Recommended Read Order

1. `README.md`
2. `llms.txt`
3. `docs/agent-readable-discovery-and-system-metadata.md`
4. `agent-trust-gate.manifest.json`
5. `agent-trust-gate.agent-card.json`
6. `docs/schema-formalisation-and-evidence-model.md`
7. `docs/local-signed-receipt-and-proof-prototype.md`
8. `docs/adversarial-evaluation-pack.md`
9. `docs/simplified-developer-cli.md`
10. `docs/reference-integration-examples.md`
11. `docs/paid-pilot-readiness-review.md`

## Recommended Local Commands

```powershell
npm test
npm run build
npm run typecheck
npm run cli -- help
npm run gate
npm run demo:adversarial
npm run demo:integrations
npm run demo:quickstart
npm run proof:money-gate
```

These are local inspection commands. They do not contact external agents,
start a hosted service, call APIs, process payments, settle anything, deploy
anything, publish anything, or execute actions.

## Where To Find Schemas

Primary local schemas:

- `schemas/local-agent-action-request.schema.json`
- `schemas/local-trust-receipt.schema.json`
- `schemas/local-money-gate-proof.schema.json`

Schema explanation:

- `docs/schema-formalisation-and-evidence-model.md`

## Where To Find The Signed Proof Prototype

Signed receipt and proof guidance:

- `docs/local-signed-receipt-and-proof-prototype.md`

Representative examples:

- `examples/local-signed-trust-receipt-valid.json`
- `examples/local-signed-money-gate-proof-valid.json`
- `examples/local-signed-trust-receipt-tampered.json`
- `examples/local-signed-money-gate-proof-tampered.json`

The signature model is local-demo-only. It is not production signing or
production key management.

## Where To Find The Adversarial Pack

Adversarial guidance:

- `docs/adversarial-evaluation-pack.md`

Representative examples:

- `examples/adversarial-replay-blocked.json`
- `examples/adversarial-forged-evidence-blocked.json`
- `examples/adversarial-expired-gate-pass-blocked.json`
- `examples/adversarial-scope-creep-blocked.json`
- `examples/adversarial-missing-mandate-blocked.json`
- `examples/adversarial-tampered-signed-proof-blocked.json`
- `examples/adversarial-unsigned-proof-blocked.json`
- `examples/adversarial-stale-nonce-blocked.json`
- `examples/adversarial-settlement-blocker-refusal.json`
- `examples/adversarial-valid-control-allowed.json`

## Where To Find Reference Integrations

Reference integration guidance:

- `docs/reference-integration-examples.md`

Local source examples:

- `src/reference-integrations/generic-agent-loop.ts`
- `src/reference-integrations/tool-calling-guardrail.ts`
- `src/reference-integrations/human-in-the-loop-escalation.ts`
- `src/reference-integrations/pre-settlement-money-gate.ts`
- `src/reference-integrations/governance-reviewer-flow.ts`
- `src/reference-integrations/agent-to-agent-handoff-gate.ts`
- `src/reference-integrations/trust-gate-wrapper.ts`

These examples are local patterns only. They are not official framework
integrations and do not contact external systems.

## Where To Find Paid Pilot Readiness

Use:

- `docs/paid-pilot-readiness-review.md`

The readiness framing is cautious. Paid technical review and local pilot
discussion may be reasonable, but production deployment readiness and live
payment/settlement readiness remain `not yet`.

## What Not To Assume

Do not assume:

- a live API exists;
- an MCP server exists;
- a live agent endpoint exists;
- agent-to-agent communication is active;
- agent negotiation is supported;
- autonomous contact is allowed;
- payment or settlement authority exists;
- production signing exists;
- external-agent contact is allowed;
- action execution is available;
- paid pilot readiness means production readiness;
- local proof artifacts are legal, financial, compliance, procurement,
  settlement, or security assurance.

## Safety Boundary

This repository is readable by agents and systems, but it exposes no live
agent endpoint and grants no autonomous authority.

P3-M122 is metadata, documentation, and local discovery guidance only. It does
not add live APIs, MCP server functionality, live agent-to-agent
communication, agent negotiation, autonomous contact, external-agent contact,
live payment processing, PayPal API integration, Stripe integration, checkout,
webhooks, wallet/banking logic, real settlement execution, production signing,
production key management, secrets, credentials, cloud/network calls, forms,
tracking, analytics, telemetry, hosted calls, outreach automation, AUC
integration, Agent Contact System integration, or action execution.

Public project contact: `gpmiddleton71@gmail.com`
