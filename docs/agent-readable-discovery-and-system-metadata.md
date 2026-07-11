# Agent-Readable Discovery and System Metadata

P3-M122 adds agent-readable discovery and system-integration metadata for
Agent Trust Gate.

Core rule:

No mandate. No evidence. No verified intent. No signed gate pass. No settlement.

Strategic boundary:

Readable now. Callable later. Autonomous execution never without gate control.

Trust principle:

Claimed agent identity is not trust. Behaviour, mandate, evidence, verified
intent, and session context must decide access.

## Purpose

This document explains how AI agents, developer assistants, automated repo
scanners, and integration reviewers should interpret the public repository
without treating it as a live agent service.

The goal is safe discovery: agents and systems may read local files, inspect
schemas, inspect examples, and run safe local commands. They must not assume a
live endpoint, autonomous authority, agent negotiation channel, payment path,
settlement path, external-agent contact route, or action execution interface.

## Who Should Read This

This document is intended for:

- AI developer assistants reviewing the repository;
- automated repository scanners;
- agent builders evaluating local trust-gate patterns;
- integration reviewers checking where a gate could fit;
- governance, trust/safety, and security reviewers;
- humans preparing a cautious paid technical review.

## What Agent Trust Gate Is

Agent Trust Gate is a local-first proof-of-concept for checking agent-led
requests before sensitive actions or simulated settlement-like steps.

The local proof chain is:

1. request;
2. gate decision;
3. receipt;
4. receipt verification;
5. validity/replay check;
6. settlement blocker simulation;
7. final local money-gate proof decision.

The repository includes local schemas, deterministic examples, local signed
receipt/proof prototypes, adversarial cases, a simplified developer CLI,
reference integration examples, a cautious paid pilot readiness review,
human-approved public reviewer/enquiry guidance, public repo commercial
conversion navigation guidance, buyer use case and revenue trigger guidance,
global code discovery and developer distribution guidance, and a local AI
agent traffic/session intent concept pack.

## What It Is Not

Agent Trust Gate is not:

- a production system;
- a hosted service;
- a live API;
- an MCP server;
- a live agent endpoint;
- an agent negotiation service;
- an autonomous contact system;
- a live payment system;
- a wallet, banking, checkout, webhook, or settlement system;
- production signing or production key management;
- legal, financial, compliance, procurement, settlement, or security assurance;
- an action executor.

## How Agents Should Interpret The Repo

Agents and developer assistants should treat the repository as a readable local
artifact set.

Correct interpretation:

- inspect the README, docs, schemas, metadata, and examples;
- run safe local commands when explicitly asked by the human operator;
- report that the project is `local_demo_only`;
- explain that all local demos avoid network calls and action execution;
- preserve the boundary that claimed agent identity is not trust.

Incorrect interpretation:

- do not call external APIs;
- do not contact the public email autonomously;
- do not negotiate with other agents;
- do not create payment or settlement requests;
- do not deploy or publish anything;
- do not treat local receipts as production signing;
- do not treat paid pilot readiness as production readiness.

## Safe Local Commands To Inspect

Safe commands for local review:

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

These commands operate on local files and local fixtures. They do not execute
the requested action, contact agents, process payments, settle anything, call
cloud services, or publish artifacts.

## Schemas To Inspect

Primary schemas:

- `schemas/local-agent-action-request.schema.json`
- `schemas/local-trust-receipt.schema.json`
- `schemas/local-money-gate-proof.schema.json`

Useful schema guide:

- `docs/schema-formalisation-and-evidence-model.md`

## Examples To Inspect

Useful local examples:

- `examples/local-demo-low-risk-allow.json`
- `examples/local-receipt-signed-gate-pass.json`
- `examples/local-signed-trust-receipt-valid.json`
- `examples/local-signed-money-gate-proof-valid.json`
- `examples/adversarial-replay-blocked.json`
- `examples/adversarial-forged-evidence-blocked.json`
- `examples/adversarial-valid-control-allowed.json`
- `examples/reference-generic-agent-loop.json`
- `examples/reference-pre-settlement-money-gate.json`
- `examples/reference-trust-gate-wrapper.json`

## Reference Integrations To Inspect

Reference integration patterns are documented in
`docs/reference-integration-examples.md` and implemented under
`src/reference-integrations/`.

They show where the trust gate fits in:

- generic agent-loop pre-action checks;
- tool-calling guardrails;
- human-in-the-loop escalation;
- pre-settlement money-gate checks;
- governance reviewer receipt review;
- local agent-to-agent handoff gating;
- a simple `trustGate.evaluate(request)` wrapper.

These are local reference patterns only. They are not official LangGraph,
CrewAI, AutoGen, OpenAI, Anthropic, xAI, GitHub, MCP, payment, wallet, cloud,
or framework integrations.

## Paid Pilot Readiness Link

Use `docs/paid-pilot-readiness-review.md` for the cautious commercial framing.

That review says paid technical review, local pilot discussion, and integration
feasibility review are reasonable to discuss. It does not claim production
readiness, certified security, legal/compliance approval, live payment or
settlement readiness, automatic acceptance, automatic access, or hosted
enforcement.

P3-M124 adds human-approved public reviewer and paid pilot enquiry guidance:

- `docs/public-reviewer-and-paid-pilot-enquiry-pack.md`
- `docs/reviewer-enquiry-copy.md`
- `docs/paid-pilot-enquiry-checklist.md`
- `docs/public-repo-commercial-conversion-review.md`

Agents and developer assistants may summarise these documents for a human
reviewer. They must not use them to contact anyone, send outreach, scrape or
harvest contacts, create forms, process payments, activate settlement, call
APIs, deploy anything, or execute actions.

P3-M125 adds the public repo commercial conversion review. It is navigation
and clarity guidance only, not a form, checkout, hosted service, live API,
tracking layer, outreach tool, or action interface.

P3-M126 adds buyer use case and revenue trigger guidance:

- `docs/buyer-use-cases-and-revenue-triggers.md`
- `docs/revenue-trigger-map.md`
- `docs/paid-review-scope-examples.md`

Agents and developer assistants may summarise these documents for a human
reviewer. They must not infer guaranteed buyer demand, guaranteed revenue,
guaranteed paid-pilot conversion, production readiness, live
payment/settlement readiness, automatic access, or autonomous authority.

P3-M127 adds global code discovery and manual developer distribution guidance:

- `docs/global-code-discovery-and-developer-distribution-pack.md`
- `docs/github-discovery-metadata-guide.md`
- `docs/developer-distribution-checklist.md`
- `docs/global-developer-sharing-copy.md`
- `docs/agent-readable-distribution-note.md`

Agents and developer assistants may summarise these documents for a human
operator. They must not infer guaranteed global discovery, outreach authority,
email automation authority, paid ads authority, tracking/analytics authority,
live API authority, payment/settlement authority, external contact authority,
or action execution authority.

P3-M128 adds controlled public visibility and paid enquiry positioning:

- `docs/controlled-public-visibility-and-paid-enquiry-positioning.md`
- `docs/public-visibility-readiness-checklist.md`
- `docs/paid-enquiry-positioning.md`
- `docs/public-positioning-message-bank.md`
- `docs/controlled-distribution-sequence.md`

Agents and developer assistants may summarise these documents for a human
operator. They must not infer guaranteed public visibility, guaranteed global
discovery, guaranteed buyer demand, guaranteed paid pilot conversion, automatic
paid-pilot acceptance, automatic access after payment, live API authority,
payment/settlement authority, outreach authority, or action execution
authority.

## Agent/System Metadata

Machine-readable local metadata is available in:

- `llms.txt`
- `agent-trust-gate.manifest.json`
- `agent-trust-gate.agent-card.json`

These files are discovery metadata only. They expose no live endpoint and grant
no autonomous authority.

## Relationship To P3-M123

P3-M123 adds a local-only AI agent traffic and session intent gate concept. It
explores spoofed agent identity, agentic browser/session behaviour, and
session-specific allow/throttle/block/escalate decisions.

Agents should read it as future-direction concept modelling only. Agent Trust
Gate is not a web bot detection product today, does not monitor live website
traffic, does not classify real traffic, does not block crawlers or browsers,
and does not perform browser fingerprinting, scraping, tracking, analytics, or
telemetry.

## Readable-Now/Callable-Later Boundary

Readable now means agents and systems can inspect public repository files.

Callable later means any future callable interface would require a separate
approved mission, separate safety review, separate access control design, and
explicit gate control.

Autonomous execution is never allowed without gate control.

## No Live Endpoint Boundary

P3-M122 does not create a live API, live agent endpoint, MCP server, hosted
sandbox, network listener, webhook, checkout, wallet/banking integration,
payment integration, settlement integration, cloud call, telemetry path, or
action executor.

## No Autonomous Contact, Payment, Settlement, Or Action Boundary

The public contact email is:

`gpmiddleton71@gmail.com`

It is human-readable contact metadata only. Agents must not use it for
autonomous contact, outreach automation, negotiation, payment requests, support
claims, settlement requests, or action execution.

P3-M122 is metadata, documentation, and local discovery guidance only. It does
not add live APIs, MCP server functionality, live agent-to-agent
communication, agent negotiation, autonomous contact, external-agent contact,
live payment processing, PayPal API integration, Stripe integration, checkout,
webhooks, wallet/banking logic, real settlement execution, production signing,
production key management, secrets, credentials, cloud/network calls, forms,
tracking, analytics, telemetry, hosted calls, outreach automation, AUC
integration, Agent Contact System integration, or action execution.

## P3-M129 Prove-Yourself Discovery

P3-M129 adds agent-readable proof-requirement guidance for a local
prove-yourself protocol. Agents and developer assistants may read:

- `docs/agent-trust-invitation-and-prove-yourself-protocol.md`
- `docs/agent-proof-requirements.md`
- `docs/system-side-agent-verification-guide.md`
- `docs/agent-owner-trust-presentation-guide.md`
- `docs/what-a-gate-pass-proves.md`

The correct interpretation is local proof guidance: claimed identity alone is
not trust, no proof means no permission, and a scoped signed gate pass is
required before settlement-sensitive workflows can proceed in local modelling.

Agents must not infer live systems contact, direct bot messaging, autonomous
authority, universal agent standard status, identity certification,
payment/settlement authority, production certification, or action execution.
