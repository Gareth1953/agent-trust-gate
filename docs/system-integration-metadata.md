# System Integration Metadata

P3-M132 update: system integration metadata now points reviewers to the
enforceable local tool-calling gate demo for runnable mock-agent interception
before sensitive tool calls. It adds no real tool execution, live APIs, MCP
server functionality, live systems contact, direct bot messaging, live
agent-to-agent communication, payment processing, settlement execution,
production signing, or action execution.

P3-M131 update: system integration metadata now points reviewers to local
proof-contract integration readiness guidance for workflow, tool-call, approval,
governance, session/access, and pre-settlement checkpoints. It adds no live
APIs, MCP server functionality, live systems contact, direct bot messaging,
live agent-to-agent communication, payment processing, settlement execution,
production signing, or action execution.

P3-M122 provides a safe read order and local evaluation guide for developer
assistants and integration reviewers. P3-M123 adds local-only AI agent
traffic and session intent gate concept guidance without live traffic
monitoring, real bot detection, crawler blocking, browser fingerprinting,
tracking, scraping, analytics, telemetry, or action execution.

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
12. `docs/public-reviewer-and-paid-pilot-enquiry-pack.md`
13. `docs/reviewer-enquiry-copy.md`
14. `docs/paid-pilot-enquiry-checklist.md`
15. `docs/public-repo-commercial-conversion-review.md`
16. `docs/buyer-use-cases-and-revenue-triggers.md`
17. `docs/revenue-trigger-map.md`
18. `docs/paid-review-scope-examples.md`
19. `docs/global-code-discovery-and-developer-distribution-pack.md`
20. `docs/github-discovery-metadata-guide.md`
21. `docs/developer-distribution-checklist.md`
22. `docs/global-developer-sharing-copy.md`
23. `docs/agent-readable-distribution-note.md`
24. `docs/controlled-public-visibility-and-paid-enquiry-positioning.md`
25. `docs/public-visibility-readiness-checklist.md`
26. `docs/paid-enquiry-positioning.md`
27. `docs/public-positioning-message-bank.md`
28. `docs/controlled-distribution-sequence.md`
29. `docs/ai-agent-traffic-and-session-intent-gate.md`
30. `docs/spoofed-agent-risk-model.md`
31. `docs/session-specific-access-framework.md`

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
npm run demo:session-intent
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
- `docs/public-reviewer-and-paid-pilot-enquiry-pack.md`
- `docs/reviewer-enquiry-copy.md`
- `docs/paid-pilot-enquiry-checklist.md`
- `docs/public-repo-commercial-conversion-review.md`
- `docs/buyer-use-cases-and-revenue-triggers.md`
- `docs/revenue-trigger-map.md`
- `docs/paid-review-scope-examples.md`
- `docs/global-code-discovery-and-developer-distribution-pack.md`
- `docs/github-discovery-metadata-guide.md`
- `docs/developer-distribution-checklist.md`
- `docs/global-developer-sharing-copy.md`
- `docs/agent-readable-distribution-note.md`
- `docs/controlled-public-visibility-and-paid-enquiry-positioning.md`
- `docs/public-visibility-readiness-checklist.md`
- `docs/paid-enquiry-positioning.md`
- `docs/public-positioning-message-bank.md`
- `docs/controlled-distribution-sequence.md`

The readiness framing is cautious. Paid technical review and local pilot
discussion may be reasonable, but production deployment readiness and live
payment/settlement readiness remain `not yet`.

P3-M124 adds human-approved reviewer and paid pilot enquiry copy only. P3-M125
adds public repo commercial conversion navigation clarity only. P3-M126 adds
buyer use case and revenue trigger documentation only. P3-M127 adds global
code discovery and manual developer distribution guidance only. P3-M128 adds
controlled public visibility and paid enquiry positioning only. They do not
add outreach automation, scraping, contact harvesting, forms, tracking,
analytics, paid ads, ad pixels, live payment processing, settlement, automatic
acceptance, automatic access, hosted services, or action execution.

## Where To Find The AI Agent Traffic Concept

Use:

- `docs/ai-agent-traffic-and-session-intent-gate.md`
- `docs/spoofed-agent-risk-model.md`
- `docs/session-specific-access-framework.md`

The local model is in:

- `src/session-intent-gate.ts`

Run:

```powershell
npm run demo:session-intent
```

This is a concept demo only. It is not live traffic monitoring, real bot
detection, crawler blocking, browser fingerprinting, scraping, tracking,
analytics, telemetry, or production access control.

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
- live traffic monitoring exists;
- real bot detection exists;
- crawler blocking, browser fingerprinting, scraping, tracking, analytics, or
  telemetry is active;
- paid pilot readiness means production readiness;
- local proof artifacts are legal, financial, compliance, procurement,
  settlement, or security assurance.

## Safety Boundary

This repository is readable by agents and systems, but it exposes no live
agent endpoint and grants no autonomous authority.

P3-M122, P3-M123, P3-M124, P3-M125, P3-M126, P3-M127, and P3-M128 are
metadata, documentation, local discovery/concept guidance, human-approved
communication copy, navigation clarity, buyer/revenue trigger guidance, manual
developer distribution guidance, and controlled public visibility guidance
only. They do not add live APIs, MCP server functionality, live agent-to-agent
communication, agent negotiation, autonomous contact,
external-agent contact, live payment processing, PayPal API integration,
Stripe integration, checkout, webhooks, wallet/banking logic, real settlement
execution, production signing, production key management, secrets,
credentials, cloud/network calls, forms, live traffic monitoring, real bot
detection, crawler blocking, browser fingerprinting, scraping, contact
harvesting, tracking, analytics, telemetry, hosted calls, paid ads, ad pixels,
outreach automation, AUC integration, Agent Contact System integration, or
action execution.

Public project contact: `gpmiddleton71@gmail.com`

## P3-M129 Integration Review Note

For P3-M129, integration reviewers should inspect the local prove-yourself
protocol docs, `src/prove-yourself-protocol.ts`, the deterministic examples
under `examples/prove-yourself-*.json`, and `npm run demo:prove-yourself`.
The correct inference is proof-requirement guidance only: claimed agent
identity is not trust, and no proof means no permission. Do not infer live
systems contact, direct bot messaging, live agent-to-agent communication,
identity certification, payment/settlement authority, production certification,
or action execution.

## P3-M130 Integration Review Note

For P3-M130, integration reviewers should inspect the local proof contract docs,
schemas, `src/agent-proof-contract.ts`, deterministic examples under
`examples/agent-proof-*.json` and `examples/gate-pass-challenge-*.json`, and:

```powershell
npm run demo:agent-proof-contract
```

The correct inference is structured local proof-contract guidance only: claimed
identity alone is not sufficient proof, missing mandate/evidence fails or
escalates, stale/replayed proof fails, settlement-sensitive requests require
signed proof, and valid controls allow locally only. Do not infer live APIs, MCP
server functionality, live systems contact, direct bot messaging, live
agent-to-agent communication, identity/authentication certification,
payment/settlement authority, production certification, or action execution.
## P3-M133 Minimal GatePass Core Specification Pack

P3-M133 narrows Agent Trust Gate(TM) around GatePass as the compact local proof primitive. ProofPackage carries supporting material, VerificationContract checks it, Tool Gate enforces it before sensitive actions, and Pre-Settlement Gate blocks settlement-sensitive flows without valid proof. This is local specification, schema, model, example, and test work only; it adds no live APIs, MCP server functionality, live systems contact, direct bot messaging, live agent-to-agent communication, production signing, production-grade crypto, payment processing, settlement execution, real tool execution, or action execution.