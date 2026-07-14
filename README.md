# Agent Trust Gate™

Agent Trust Gate™ is a local-first proof-of-concept for checking whether an AI
agent or automated workflow has enough scoped proof before a sensitive action.
It remains a local-first, pre-action and pre-settlement trust enforcement layer
for local demo review, with no production or live execution authority.

GatePass is a scoped, time-bound, action-specific proof primitive for agent
actions. GatePass provides a common, machine-readable format for expressing
authority, mandate, scope, freshness, and evidence.

> **No signed GatePass. No settlement. Do not trust the agent. Trust the GatePass. No proof. No permission. No mandate. No action.**

Current status: local_demo_only. The repository provides deterministic local
software and proof artifacts, not a production service, production middleware,
production benchmark, security certification, legal/compliance/security
guarantee, payment system, settlement system, hosted service, or live API.

## 30-second reviewer summary

Agent Trust Gate™ is now centered on GatePass: a scoped, time-bound,
action-specific proof object for AI agent actions, sensitive tool calls, and
pre-settlement workflows. Reviewers can run one command to see the GatePass
lifecycle, adversarial scorecard, and developer wrapper demo locally. The demo
is local-only proof-of-concept code: it executes no real tools, authorises no
payment, authorises no settlement, and claims no production benchmark or
security certification.

## What to run first

```powershell
npm run demo:reviewer-kit
npm run demo:reviewer-kit -- --summary-only
npm run demo:reviewer-kit -- --json
```

The reviewer kit runs local deterministic demos only. It shows what GatePass
allows locally, what it blocks, what requires evidence, what requires human
review, what requires a signed GatePass, and where the safety boundary sits.

Secondary commands:

```powershell
npm run demo:gatepass-round-trip
npm run demo:gatepass-scorecard
npm run demo:gatepass-wrapper
```

## Reviewer quickstart

1. Run the [one-command reviewer demo kit](docs/one-command-reviewer-demo-kit.md).
2. Inspect the [GatePass create-verify-reject round trip](docs/gatepass-create-verify-reject-round-trip.md).
3. Inspect the [GatePass adversarial metrics and latency scorecard](docs/gatepass-adversarial-metrics-and-latency-scorecard.md).
4. Inspect the [GatePass developer wrapper and local integration example](docs/gatepass-developer-wrapper-and-local-integration-example.md).
5. Read the [reviewer demo limitations and safety boundary](docs/reviewer-demo-limitations-and-safety-boundary.md).
6. Contact `gpmiddleton71@gmail.com` for a human-reviewed paid technical review or local pilot discussion, with no automatic paid-pilot acceptance and no automatic access after payment.

## Reviewer path

- Start with `npm run demo:reviewer-kit`.
- Confirm the lifecycle demo shows create, verify, reject, and explanation paths.
- Confirm the scorecard catches adversarial cases and reports local illustrative timing only.
- Confirm `wrapGatePassTool` gates local mock tool calls before action.
- Confirm the claims boundary is restrained: local-only, no production readiness, no production benchmark, no security certification, no legal/compliance/security assurance.
- Use the public contact email only for human-reviewed technical review, local pilot, or integration feasibility discussion.

## Paid Evaluation Pilot

P3-M141 adds a concise commercial entry route without changing the reviewer-first
technical path:

1. **SEE IT** - run `npm run demo:reviewer-kit`.
2. **TEST IT** - evaluate the local GatePass round trip, scorecard, and wrapper.
3. **BUY A PILOT** - request a human-approved, non-production **Agent Trust Gate(TM) Paid Evaluation Pilot**.

The paid pilot is a local, manual-input only, controlled evaluation of how
proposed AI-agent actions can be checked for mandate, evidence, intent,
approval status, scope, value or spend limits, GatePass validity, refusal
reasons, and audit/trust-receipt output. Indicative pricing starts from
**£1,500** for a defined local evaluation pilot, subject to scope and written
agreement.

- [Paid pilot commercial entry](docs/paid-pilot-commercial-entry.md)
- [Paid pilot scope and deliverables](docs/paid-pilot-scope-and-deliverables.md)
- [Buyer evaluation journey](docs/buyer-evaluation-journey.md)
- [Paid pilot pricing boundary](docs/paid-pilot-pricing-boundary.md)
- [Paid pilot enquiry template](docs/paid-pilot-enquiry-template.md)
- [Machine-readable paid pilot offer](examples/paid-pilot-offer.json)

```powershell
npm run demo:paid-pilot
npm run demo:paid-pilot -- --summary-only
npm run demo:paid-pilot -- --json
```

This is not production middleware, not a payment or settlement system, not
production signing, not legal/compliance/security certification, and not a
guarantee of safety, trust, integration success, commercial result, acceptance,
or access after payment.

## Machine and Developer Discovery

P3-M142 adds passive machine-readable discovery and registry-readiness metadata.
P3-M143A records the public passive discovery site as **active and verified** at
the GitHub Pages URL below. This is a static discovery route only. It does not
add a live A2A server, MCP server, npm publication, remote API endpoint,
outreach system, payment route, settlement route, analytics, tracking, or
executable remote service.

Discovery route:

1. Read the [canonical discovery record](agent-trust-gate.discovery.json).
2. Run the reviewer kit: `npm run demo:reviewer-kit`.
3. Inspect GatePass, schemas, examples, and local wrapper demos.
4. Review the technical and safety boundaries.
5. Use the [Paid Evaluation Pilot](docs/paid-pilot-commercial-entry.md) route for a human-reviewed commercial enquiry.

- [Machine discovery and registry readiness](docs/machine-discovery-and-registry-readiness.md)
- [Machine-readable entry points](docs/machine-readable-entry-points.md)
- [GitHub Pages discovery readiness](docs/github-pages-discovery-readiness.md)
- [GitHub Pages passive discovery activation](docs/github-pages-passive-discovery-activation.md)
- [Passive discovery live verification checklist](docs/passive-discovery-live-verification-checklist.md)
- [Repository social preview upload](docs/repository-social-preview-upload.md)
- [Passive discovery activation record](docs/passive-discovery-activation-record.md)
- [Passive discovery activation record template](docs/passive-discovery-activation-record-template.md)
- [A2A discovery readiness boundary](docs/a2a-discovery-readiness-boundary.md)
- [MCP Registry readiness boundary](docs/mcp-registry-readiness-boundary.md)
- [npm publication readiness](docs/npm-publication-readiness.md)
- [Registry readiness scorecard](docs/registry-readiness-scorecard.md)
- [Machine-readable discovery report](examples/machine-discovery-report.json)
- [Static discovery-site source](discovery-site/README.md)
- [Pages deployment workflow](.github/workflows/deploy-discovery-pages.yml)

```powershell
npm run demo:discovery
npm run demo:discovery -- --summary-only
npm run demo:discovery -- --json
npm run validate:discovery-site
```

Public passive discovery site:
`https://gareth1953.github.io/agent-trust-gate/`.

The Pages artifact is limited to `discovery-site/`,
`agent-trust-gate.discovery.json`, `agent-trust-gate.agent-card.json`,
`agent-trust-gate.manifest.json`, and `llms.txt`. GitHub topics are documented
as manually configured through GitHub. This repository does not alter GitHub
settings automatically. GatePass remains the headline proof primitive; Agent
Trust Language remains supporting material.

## Core proof flow

```text
requested action
-> GatePass / proof package checked
-> policy evaluation
-> allow locally / block / require evidence / require human review / require signed GatePass
-> local receipt / report
```

## What this proves locally

- A GatePass can be created, verified, rejected, and explained locally.
- Invalid, stale, replayed, tampered, identity-only, missing-mandate, and missing-evidence cases can fail closed in deterministic examples.
- Local adversarial scenarios can be counted against expected outcomes with local illustrative timing.
- A developer wrapper can gate local mock tool calls before action.

## What this does not prove

- It does not prove production readiness, production middleware, production signing, production-grade crypto, security certification, legal/compliance/security status, real-world benchmark performance, complete adversarial coverage, payment readiness, settlement readiness, or live integration readiness.
- It does not execute real tools, call networks, contact live systems, send messages, process payments, create settlement instructions, or perform action execution.
- It does not claim an agent is proven safe or that trust is guaranteed.

## Core demos

- [GatePass round trip](docs/gatepass-create-verify-reject-round-trip.md): create, verify, reject, and explain local GatePass decisions.
- [GatePass scorecard](docs/gatepass-adversarial-metrics-and-latency-scorecard.md): local deterministic adversarial scenarios, expected-vs-actual outcomes, and local illustrative timing.
- [GatePass developer wrapper](docs/gatepass-developer-wrapper-and-local-integration-example.md): copy-paste style `wrapGatePassTool` pattern for local mock tool gating.
- [One-command reviewer kit](docs/one-command-reviewer-demo-kit.md): lifecycle, scorecard, wrapper, safety boundary, and JSON report in one local command.

## Why GatePass exists

Claimed agent identity is not enough. A receiving system needs scoped proof of
authority, mandate, evidence, intent, freshness, approval where required, and
signed GatePass status before sensitive action. GatePass proof vocabulary and
GatePass claims vocabulary support this machine-readable proof format; Agent
Trust Language remains supporting material only, not the public headline.

## Safety boundary

This is local-only proof-of-concept code. The reviewer kit runs local
deterministic demos only. No real tool execution occurs. No network calls occur.
No payment or settlement is authorised. No production benchmark or security certification is claimed.

## Public contact

Human-reviewed technical review, local pilot, and integration feasibility
enquiries may be sent to `gpmiddleton71@gmail.com`. Contact does not imply
availability, acceptance, hosted access, automatic access after payment,
payment activation, settlement authority, or production integration.

## Public reviewer positioning

P3-M140A records the reviewer-first README polish and claims boundary:

- [Public README / reviewer positioning polish](docs/public-readme-reviewer-positioning-polish.md)
- [Reviewer-first public positioning](docs/reviewer-first-public-positioning.md)
- [Public positioning claims boundary](docs/public-positioning-claims-boundary.md)
- [Machine-readable public reviewer positioning summary](examples/public-reviewer-positioning-summary.json)

## ATG Strategic Foresight Layer

P3-M140 adds a local advisory layer for manually supplied AI-agent market,
protocol, AGI/agent-risk, quantum/post-quantum, standards, and reviewer signals.
It helps identify possible future GatePass missions without changing the
roadmap or product automatically.

- [ATG Strategic Foresight Layer](docs/atg-strategic-foresight-layer.md)
- [Agent market radar methodology](docs/agent-market-radar-methodology.md)
- [Foresight signal categories](docs/foresight-signal-categories.md)
- [Foresight recommendation scoring guide](docs/foresight-recommendation-scoring-guide.md)
- [Foresight human approval workflow](docs/foresight-human-approval-workflow.md)
- [Foresight sample market radar report](docs/foresight-sample-market-radar-report.md)
- [Machine-readable foresight report](examples/atg-strategic-foresight-report.json)

```powershell
npm run demo:foresight
npm run demo:foresight -- --summary-only
npm run demo:foresight -- --json
```

This is a local advisory layer only. It does not fetch live market data. It
does not scrape. It does not monitor in the background. It does not change the
roadmap or product automatically. Gareth approval is required before any build
mission.

## What changed recently

- P3-M137 made GatePass measurable with a local adversarial scorecard.
- P3-M138 made GatePass developer-useful with `wrapGatePassTool`.
- P3-M139 made GatePass reviewer-friendly with a one-command reviewer kit.
- P3-M140A sharpens this README so the reviewer kit is the recommended first run and the public claims boundary is explicit.
- P3-M140 adds a local-only strategic foresight advisory layer with manual-input sample signals and human approval required before any future build mission.
- P3-M141 adds a paid pilot and commercial entry pack for a human-approved, local, non-production Agent Trust Gate(TM) Paid Evaluation Pilot.
- P3-M142 adds canonical passive machine-discovery metadata and registry-readiness boundaries.
- P3-M143A records GitHub Pages passive discovery as active and verified.

## Start here for reviewers

For a fast public review, use this path:

1. Clone and run locally: [clone and run quickstart](docs/clone-and-run-quickstart.md).
2. Run the simplified CLI: [simplified developer CLI](docs/simplified-developer-cli.md).
3. Inspect schemas: [schema formalisation and evidence model](docs/schema-formalisation-and-evidence-model.md).
4. Inspect signed local proof material: [local signed receipt and proof prototype](docs/local-signed-receipt-and-proof-prototype.md).
5. Inspect attack cases: [adversarial evaluation pack](docs/adversarial-evaluation-pack.md).
6. Inspect integration patterns: [reference integration examples](docs/reference-integration-examples.md).
7. Inspect commercial readiness: [paid pilot readiness review](docs/paid-pilot-readiness-review.md).
8. Inspect enquiry guidance: [public reviewer and paid pilot enquiry pack](docs/public-reviewer-and-paid-pilot-enquiry-pack.md) and [paid pilot enquiry checklist](docs/paid-pilot-enquiry-checklist.md).
9. Inspect agent-readable metadata: [llms.txt](llms.txt) and [agent card metadata](agent-trust-gate.agent-card.json).
10. Inspect buyer fit and commercial triggers: [buyer use cases and revenue triggers](docs/buyer-use-cases-and-revenue-triggers.md), [revenue trigger map](docs/revenue-trigger-map.md), and [paid review scope examples](docs/paid-review-scope-examples.md).
11. Inspect global discovery and manual sharing guidance: [global code discovery and developer distribution pack](docs/global-code-discovery-and-developer-distribution-pack.md).
12. Inspect controlled visibility and paid enquiry positioning: [controlled public visibility and paid enquiry positioning](docs/controlled-public-visibility-and-paid-enquiry-positioning.md).
13. Inspect agent trust proof requirements: [agent trust invitation and prove-yourself protocol](docs/agent-trust-invitation-and-prove-yourself-protocol.md).
14. Inspect machine-readable proof contracts: [agent proof package schema and verification contract](docs/agent-proof-package-schema-and-verification-contract.md).
15. Inspect proof-contract integration readiness: [agent proof contract integration readiness](docs/agent-proof-contract-integration-readiness.md).
16. Run the enforceable local tool-calling gate demo: [enforceable local tool-calling gate demo](docs/enforceable-local-tool-calling-gate-demo.md).
17. Inspect the minimal GatePass core: [minimal GatePass core specification](docs/minimal-gatepass-core-specification.md).
18. Run the GatePass create-verify-reject round trip: [GatePass create-verify-reject round trip](docs/gatepass-create-verify-reject-round-trip.md).
19. Run the GatePass scorecard: [GatePass adversarial metrics and latency scorecard](docs/gatepass-adversarial-metrics-and-latency-scorecard.md).
20. Run the one-command reviewer kit: [one-command reviewer demo kit](docs/one-command-reviewer-demo-kit.md).
21. Inspect the developer wrapper: [GatePass developer wrapper and local integration example](docs/gatepass-developer-wrapper-and-local-integration-example.md).
22. Inspect supporting GatePass proof vocabulary and GatePass claims vocabulary: [Agent Trust Language and GatePass vocabulary](docs/agent-trust-language-and-gatepass-vocabulary.md).
23. Inspect supporting agent-readable GatePass benefit and voluntary referral guidance: [agent-readable GatePass benefit and voluntary referral](docs/agent-readable-gatepass-benefit-and-voluntary-referral.md).

P3-M125 adds the [public repo commercial conversion review](docs/public-repo-commercial-conversion-review.md)
to make this path easier to assess without adding forms, tracking, payment
processing, hosted services, outreach automation, or action execution.
P3-M126 adds a buyer use case and revenue trigger pack to explain when a
human-reviewed paid technical review, local pilot discussion, integration
feasibility review, or governance/safety review may be commercially relevant.
P3-M127 adds global code discovery and manual developer distribution guidance
without adding outreach automation, paid ads, tracking, analytics, live APIs,
hosted services, payment processing, settlement, or action execution.
P3-M128 adds controlled public visibility and paid enquiry positioning without
adding outreach automation, paid ads, tracking, analytics, live APIs, payment
processing, settlement, hosted services, or action execution.
P3-M129 adds an Agent Trust Invitation and Prove-Yourself Protocol Pack without
adding live systems contact, direct bot messaging, live agent-to-agent
communication, live APIs, payment processing, settlement, hosted services,
production signing, or action execution.
P3-M130 adds agent proof package schemas, gate-pass challenge schemas,
verification result schemas, deterministic local examples, and a local proof
contract demo without adding live APIs, MCP server functionality, live systems
contact, direct bot messaging, live agent-to-agent communication, payment
processing, settlement, hosted services, production signing, or action
execution.
P3-M131 adds proof-contract integration readiness guidance, local reference
adapter code, deterministic examples, and a local demo without adding live
APIs, MCP server functionality, live systems contact, direct bot messaging,
live agent-to-agent communication, payment processing, settlement execution,
production signing, or action execution.
P3-M132 adds an enforceable local tool-calling gate demo with a mock agent,
mock sensitive tools, local interception, receipt-style results, and no real
tool execution, live APIs, MCP server functionality, live systems contact,
direct bot messaging, live agent-to-agent communication, payment processing,
settlement execution, production signing, or action execution.
P3-M133 adds the Minimal GatePass Core Specification Pack to make GatePass the
central compact proof primitive with local schema, TypeScript model, examples,
and demo command without adding live APIs, MCP server functionality, live
systems contact, direct bot messaging, live agent-to-agent communication,
payment processing, settlement execution, production signing,
production-grade crypto, real tool execution, or action execution.
P3-M133 adds the Minimal GatePass Core Specification Pack to narrow the project
around GatePass as the compact local proof primitive for high-risk AI agent
actions, sensitive tool calls, and pre-settlement workflows without adding live
APIs, MCP server functionality, production signing, production-grade crypto,
payment processing, settlement execution, real tool execution, or action
execution.
P3-M134 adds the GatePass Create-Verify-Reject Round Trip Pack to create,
verify, reject, and explain GatePass decisions locally without adding live
APIs, MCP server functionality, production signing, production-grade crypto,
payment processing, settlement execution, real tool execution, or action
execution.
P3-M135 adds agent-readable GatePass benefit and voluntary referral guidance
without adding autonomous marketing, hidden viral distribution, direct bot
messaging, outreach automation, live systems contact, payment processing,
settlement execution, real tool execution, or action execution.
P3-M136 adds supporting GatePass proof vocabulary and GatePass claims vocabulary guidance without
adding live systems contact, direct bot messaging, live agent-to-agent
communication, autonomous marketing, hidden viral distribution, payment
processing, settlement execution, production signing, production-grade crypto,
real tool execution, or action execution.
P3-M137 adds a local deterministic GatePass adversarial metrics and latency
scorecard for reviewer-friendly expected-vs-actual outcomes and local
illustrative timing without claiming production benchmarks, security
certification, adversarial completeness, production readiness, legal/compliance/
security assurance claims, live tool execution, payment or settlement authority,
network calls, or action execution.
P3-M138 adds a local deterministic GatePass developer wrapper and local
framework-style integration example so developers can see `wrapGatePassTool`
gate local mock tool calls before action without adding production middleware,
live framework execution, real tool execution, network calls, payment,
settlement, or action execution.
P3-M139 adds a one-command reviewer demo kit that runs the GatePass lifecycle,
local adversarial scorecard, developer wrapper, local integration summary, and
JSON report output without adding production middleware, production benchmark
claims, security certification claims, live tool execution, network calls,
payment, settlement, or action execution.

## One-command reviewer demo kit

For a fast local technical review, run:

```powershell
npm run demo:reviewer-kit
npm run demo:reviewer-kit -- --summary-only
npm run demo:reviewer-kit -- --json
```

The reviewer kit links the core proof flow in one place:

- [One-command reviewer demo kit](docs/one-command-reviewer-demo-kit.md)
- [Reviewer demo kit quickstart](docs/reviewer-demo-kit-quickstart.md)
- [Reviewer demo output guide](docs/reviewer-demo-output-guide.md)
- [Reviewer demo limitations and safety boundary](docs/reviewer-demo-limitations-and-safety-boundary.md)
- [Reviewer evaluation checklist](docs/reviewer-evaluation-checklist.md)
- [Machine-readable reviewer kit report](examples/gatepass-reviewer-kit-report.json)

GatePass is a scoped, time-bound, action-specific proof primitive for agent
actions. No signed GatePass. No settlement.

This is a local deterministic reviewer kit, not production middleware, not a
production benchmark, and not security certification.

## What to inspect first

- The local commands: `npm run cli -- help`, `npm run demo:adversarial`,
  `npm run demo:integrations`, and `npm run proof:money-gate`.
- The hardened request, receipt, and money-gate proof schemas.
- The local signed receipt/proof prototype and tamper examples.
- The adversarial pack showing replay, forged evidence, expired pass, scope
  creep, missing mandate, tampered proof, unsigned proof, stale freshness/nonce,
  and settlement blocker refusal.
- The reference integrations showing where the trust gate fits before
  sensitive actions without executing those actions.
- The paid pilot readiness and reviewer enquiry docs before considering any
  commercial discussion.
- The buyer use case and revenue trigger docs to connect local proof assets to
  practical risk-reduction review needs.
- The proof-contract integration readiness docs to see how the P3-M130 proof
  package, verification request/result, and gate-pass challenge fit before
  local workflow, tool-call, approval, governance, session/access, and
  pre-settlement checkpoints.
- The enforceable local tool-calling gate demo to see a mock agent propose
  sensitive tool calls and the local gate intercept allow/block/escalate/
  require-evidence/require-human-review/require-signed-proof outcomes before
  any real tool can run.
- The minimal GatePass core docs and schema to see the compact proof primitive
  that ProofPackage, VerificationContract, Tool Gate, and Pre-Settlement Gate
  should support.
- The GatePass round-trip demo to see local create, verify, reject, and
  explanation paths for valid, stale, replayed, tampered, missing-mandate,
  missing-evidence, high-risk, and pre-settlement GatePasses.
- The GatePass scorecard to see local expected-vs-actual outcomes, caught
  adversarial scenarios, allowed valid controls, decision reasons, and local
  illustrative timing.
- The one-command reviewer kit to run GatePass lifecycle, scorecard, wrapper,
  local integration, safety summary, and JSON report output from one local
  command.
- The GatePass developer wrapper to see a copy-paste style `wrapGatePassTool`
  pattern that allows only deterministic local mock execution when proof is
  valid.
- The GatePass proof vocabulary and claims vocabulary docs to see supporting controlled terms for
  mandate, evidence, intent, approval, freshness, nonce, scope, GatePass status,
  review outcomes, and rejected unsafe claims.

## Commercial enquiry path

Human-reviewed enquiries may be sent to `gpmiddleton71@gmail.com` for:

- paid technical review;
- local pilot discussion;
- integration feasibility review;
- AI governance/safety review;
- pre-settlement trust workflow review.

The strongest enquiries name a concrete trigger: an agent or automated
workflow may affect money, settlement, access, publication, procurement,
customer outcomes, sensitive tools, or another high-impact action.

All enquiries are human-reviewed and separately scoped. No enquiry or payment
grants automatic acceptance, automatic access after payment, hosted access,
payment activation, settlement capability, external-agent contact, or action
execution.

## What this repo does not do

Agent Trust Gate™ is not ready for production deployment. This repo does not
provide a live API, hosted service, live payment processing, settlement
execution, wallet/banking logic, production signing, legal/compliance/security
approval, or autonomous action execution.

## Clone and run locally

New developers, agent-system builders, and integration reviewers can start with
the public quickstart:

- [Clone and run quickstart](docs/clone-and-run-quickstart.md)

The quickstart covers clone, install, tests, build, typecheck, local demo
commands, review assets, public contact, and the safety boundary. It does not
activate a live API, payment, settlement, hosted service, external-agent
contact, deployment, or action execution.

## Repository profile

P3-M111 records recommended GitHub description, topics, public tagline, public
summary, audience, and safety-boundary wording for repository discoverability.

- [Public repo discovery polish](docs/public-repo-discovery-polish.md)

This is public metadata guidance only. It does not push, tag, publish, deploy,
activate live APIs, enable payments, execute settlement, contact external
agents, merge AUC, integrate Agent Contact System, or execute actions.

## Why this matters

AI agents can request actions, delegate tasks, and call tools. Future systems
may also ask agents to participate in buying or payment workflows. Before an
action or settlement is considered, the surrounding system needs deterministic
controls for mandate, evidence, intent, limits, approval, receipt integrity,
freshness, and replay risk.

Agent Trust Gate™ demonstrates those controls locally. It does not claim
production adoption, legal or compliance certification, or live payment
readiness.

## What it proves locally

    agent request
    → gate decision
    → receipt/audit artifact
    → receipt verification
    → gate pass validity/replay check
    → settlement blocker simulation
    → final money-gate proof decision

The proof chain produces local, inspectable evidence of allow, review, refusal,
expiry, replay, scope mismatch, and settlement-blocking behavior.

- No action is executed.
- No money is moved.
- No payment rail is called.
- No agents are contacted.
- Only local proof artifacts are produced.

## Quick local demo

Install dependencies first, then use the existing project scripts:

    npm test
    npm run build
    npm run typecheck
    npm run demo:gate:allow
    npm run proof:money-gate -- --input examples/local-end-to-end-money-gate-proof-input.json --summary-only
    npm run demo:adversarial
    npm run demo:gatepass-core
    npm run demo:integrations
    npm run demo:prove-yourself
    npm run demo:agent-proof-contract
    npm run demo:agent-proof-integration
    npm run demo:enforceable-tool-gate
    npm run cli -- demo quickstart

Receipt verification and settlement controls can be inspected with supported
local CLI flags:

    npm run demo:gate -- --input examples/local-demo-low-risk-allow.json --verify-receipt
    npm run demo:gate -- --input examples/local-demo-low-risk-allow.json --simulate-replay-protection
    npm run demo:gate -- --input examples/local-demo-low-risk-allow.json --simulate-settlement-blocker

These commands read local fixtures and print local results. They do not execute
the requested action or settlement.

## Code-readable assets

- [Static manifest](agent-trust-gate.manifest.json)
- [Agent card metadata](agent-trust-gate.agent-card.json)
- [llms.txt](llms.txt)
- [Local action-request schema](schemas/local-agent-action-request.schema.json)
- [Local trust-receipt schema](schemas/local-trust-receipt.schema.json)
- [Local money-gate proof schema](schemas/local-money-gate-proof.schema.json)
- [Agent proof package schema](schemas/agent-proof-package.schema.json)
- [Agent proof verification request schema](schemas/agent-proof-verification-request.schema.json)
- [Agent proof verification result schema](schemas/agent-proof-verification-result.schema.json)
- [Gate-pass challenge schema](schemas/gate-pass-challenge.schema.json)
- [Agent-readable capability statement](docs/agent-readable-capability-statement.md)
- [Agent-readable discovery and system metadata](docs/agent-readable-discovery-and-system-metadata.md)
- [System integration metadata](docs/system-integration-metadata.md)
- [Example agent discovery prompts](docs/example-agent-discovery-prompts.md)
- [Code-readable developer integration pack](docs/code-readable-developer-integration-pack.md)
- [Developer integration checklist](docs/developer-integration-checklist.md)

## Agent-readable discovery

P3-M122 adds local agent-readable discovery metadata for AI agents, developer
assistants, automated repo scanners, and integration reviewers.

- [llms.txt](llms.txt)
- [Agent-readable discovery and system metadata](docs/agent-readable-discovery-and-system-metadata.md)
- [System integration metadata](docs/system-integration-metadata.md)
- [Example agent discovery prompts](docs/example-agent-discovery-prompts.md)
- [Agent card metadata](agent-trust-gate.agent-card.json)

Readable now. Callable later. Autonomous execution never without gate control.
The repository is readable by agents and systems, but it exposes no live agent
endpoint and grants no autonomous authority, payment/settlement authority,
external-agent contact, or action execution.

## AI agent traffic and session intent gate concept

P3-M123 adds a local-only concept pack for AI agent traffic, spoofed agent
identity, agentic browser behaviour, and session-specific access decisions.

- [AI agent traffic and session intent gate](docs/ai-agent-traffic-and-session-intent-gate.md)
- [Spoofed agent risk model](docs/spoofed-agent-risk-model.md)
- [Session-specific access framework](docs/session-specific-access-framework.md)

Agent Trust Gate™ is not a bot detection product today. It does not monitor
live website traffic, classify real traffic, block crawlers, fingerprint
browsers, track users, scrape websites, or execute access-control decisions.
This is a local-only concept pack and demo model.

## Agent trust invitation and prove-yourself protocol

P3-M129 adds a local-only prove-yourself protocol pack for agents, owners,
developers, clients, and systems that need proof before trust.

Core positioning:

Do not trust the agent. Trust the gate pass.

No proof. No permission.

No mandate. No action.

No signed gate pass. No settlement.

- [Agent trust invitation and prove-yourself protocol](docs/agent-trust-invitation-and-prove-yourself-protocol.md)
- [Agent proof requirements](docs/agent-proof-requirements.md)
- [System-side agent verification guide](docs/system-side-agent-verification-guide.md)
- [Agent owner trust presentation guide](docs/agent-owner-trust-presentation-guide.md)
- [What a gate pass proves](docs/what-a-gate-pass-proves.md)

Run the deterministic local examples:

```text
npm run demo:prove-yourself
```

This is local protocol modelling and proof-requirement guidance only. It does
not add live systems contact, direct bot messaging, live agent-to-agent
communication, live APIs, payment processing, settlement, hosted services,
production signing, production certification, or action execution.

## Agent proof package and verification contract

P3-M130 turns the prove-yourself protocol into local, machine-readable proof
package and verifier contract artifacts.

Core positioning:

Do not trust the agent. Trust the gate pass.

No proof. No permission.

No mandate. No action.

No signed gate pass. No settlement.

- [Agent proof package schema and verification contract](docs/agent-proof-package-schema-and-verification-contract.md)
- [Agent proof package field guide](docs/agent-proof-package-field-guide.md)
- [Gate-pass challenge and response flow](docs/gate-pass-challenge-and-response-flow.md)
- [Agent proof package schema](schemas/agent-proof-package.schema.json)
- [Agent proof verification request schema](schemas/agent-proof-verification-request.schema.json)
- [Agent proof verification result schema](schemas/agent-proof-verification-result.schema.json)
- [Gate-pass challenge schema](schemas/gate-pass-challenge.schema.json)

Run the deterministic local contract examples:

```text
npm run demo:agent-proof-contract
```

This is local schema modelling, local verification contract design, examples,
documentation, and tests only. It does not add live APIs, live systems contact,
direct bot messaging, live agent-to-agent communication, payment processing,
settlement, hosted services, production signing, production certification, or
action execution.

## Agent proof contract integration readiness

P3-M131 shows how the local P3-M130 proof package, verification request/result,
and gate-pass challenge can be placed before local agent workflows, local
tool-calling gates, local human approval flows, local governance review, local
session/access review, and local pre-settlement review.

Core positioning:

Do not trust the agent. Trust the gate pass.

No proof. No permission.

No mandate. No action.

No signed gate pass. No settlement.

- [Agent proof contract integration readiness](docs/agent-proof-contract-integration-readiness.md)
- [Local agent workflow integration guide](docs/local-agent-workflow-integration-guide.md)
- [Tool-calling proof gate adapter guide](docs/tool-calling-proof-gate-adapter-guide.md)
- [Pre-settlement proof contract integration](docs/pre-settlement-proof-contract-integration.md)
- [Integration readiness checklist](docs/integration-readiness-checklist.md)

Run the deterministic local adapter examples:

```text
npm run demo:agent-proof-integration
```

The adapter demonstrates local allow/block/escalate/require-evidence/
require-human-review/require-signed-proof outcomes while keeping tool calls,
settlement, payment, live systems contact, direct bot messaging, live
agent-to-agent communication, production certification, and action execution
disabled.

## Enforceable local tool-calling gate demo

P3-M132 shows a runnable local mock agent workflow where proposed sensitive
tool calls are intercepted by Agent Trust Gate before any action is allowed.

Core positioning:

Do not trust the agent. Trust the gate pass.

No proof. No permission.

No mandate. No action.

No signed gate pass. No settlement.

- [Enforceable local tool-calling gate demo](docs/enforceable-local-tool-calling-gate-demo.md)
- [Local tool-call gate wrapper guide](docs/local-tool-call-gate-wrapper-guide.md)
- [Mock sensitive tools catalog](docs/mock-sensitive-tools-catalog.md)
- [Tool-call enforcement scenarios](docs/tool-call-enforcement-scenarios.md)
- [What the enforceable tool gate demo proves](docs/what-the-enforceable-tool-gate-demo-proves.md)

Run the deterministic local enforcement examples:

```text
npm run demo:enforceable-tool-gate
npm run demo:enforceable-tool-gate -- --summary-only
```

The demo covers mock public posts, customer messages, data export, payment
preparation, procurement, access/session escalation, settlement instruction,
and local control cases. It emits local receipt-style results while keeping
`realToolExecuted`, `wouldExecute`, `mockToolInvoked`, and `actionExecution`
false.

## Minimal GatePass core

P3-M133 narrows Agent Trust Gate around GatePass as the compact local proof
primitive for high-risk AI agent actions, sensitive tool calls, and
pre-settlement workflows.

Core positioning:

Do not trust the agent. Trust the GatePass.

No proof. No permission.

No mandate. No action.

No signed GatePass. No settlement.

- [Minimal GatePass core specification](docs/minimal-gatepass-core-specification.md)
- [GatePass field guide](docs/gatepass-field-guide.md)
- [GatePass minimal profile](docs/gatepass-minimal-profile.md)
- [GatePass / ProofPackage consolidation](docs/gatepass-proofpackage-consolidation.md)
- [Why minimal GatePass matters](docs/why-minimal-gatepass-matters.md)
- [GatePass core schema](schemas/gatepass-core.schema.json)

Run the deterministic local GatePass examples:

```text
npm run demo:gatepass-core
npm run demo:gatepass-core -- --summary-only
```

GatePass is the core proof primitive. ProofPackage carries supporting
evidence/mandate/context. VerificationContract checks it. Tool Gate enforces it
before sensitive actions. Pre-Settlement Gate blocks settlement-sensitive flows
without valid proof. This pack adds no live API, production signing,
production-grade crypto, payment processing, settlement execution, real tool
execution, or action execution.

## GatePass create-verify-reject round trip

P3-M134 makes GatePass operational in a deterministic local lifecycle:
create GatePass locally, verify GatePass locally, reject invalid GatePasses
locally with clear reasons, and emit a local receipt-style result while
executing no real tool or action.

Core positioning:

Do not trust the agent. Trust the GatePass.

No proof. No permission.

No mandate. No action.

No signed GatePass. No settlement.

- [GatePass create-verify-reject round trip](docs/gatepass-create-verify-reject-round-trip.md)
- [GatePass round trip developer guide](docs/gatepass-round-trip-developer-guide.md)
- [GatePass rejection reason catalog](docs/gatepass-rejection-reason-catalog.md)
- [GatePass round trip threat model](docs/gatepass-round-trip-threat-model.md)
- [What the GatePass round trip proves](docs/what-the-gatepass-round-trip-proves.md)

Run the deterministic local round-trip examples:

```text
npm run demo:gatepass-round-trip
npm run demo:gatepass-round-trip -- --summary-only
```

The demo covers valid local allowance, identity-only rejection, missing
mandate, missing evidence, stale expiry, replayed nonce, tampered scope,
high-risk human review, pre-settlement signed-GatePass requirement, and valid
local pre-settlement control. `realToolExecuted`, `paymentAuthorisation`,
`settlementAuthorisation`, and `actionExecution` remain false.

## GatePass adversarial metrics and latency scorecard

P3-M137 adds a reviewer-friendly local deterministic scorecard for GatePass
attack and control scenarios. It reports expected-vs-actual outcomes, decision
reasons, caught adversarial scenarios, valid scenarios allowed locally, and
local illustrative timing.

GatePass is a scoped, time-bound, action-specific proof primitive for agent actions.
GatePass provides a common, machine-readable format for expressing authority, mandate, scope, freshness, and evidence.
No signed GatePass. No settlement.
Do not trust the agent. Trust the GatePass.
No proof. No permission.
No mandate. No action.

- [GatePass adversarial metrics and latency scorecard](docs/gatepass-adversarial-metrics-and-latency-scorecard.md)
- [GatePass metrics methodology](docs/gatepass-metrics-methodology.md)
- [GatePass adversarial scenario catalog](docs/gatepass-adversarial-scenario-catalog.md)
- [GatePass latency measurement guide](docs/gatepass-latency-measurement-guide.md)
- [GatePass reviewer scorecard guide](docs/gatepass-reviewer-scorecard-guide.md)
- [GatePass adversarial scorecard JSON](examples/gatepass-adversarial-scorecard.json)

Run the local scorecard:

```text
npm run demo:gatepass-scorecard
npm run demo:gatepass-scorecard -- --summary-only
npm run demo:gatepass-scorecard -- --json
```

This is a local deterministic scorecard, not a production benchmark or
security certification. It is not adversarial completeness and not evidence of
production readiness.

## GatePass developer wrapper and local integration example

P3-M138 adds a developer-facing local wrapper that shows how a sensitive action
can be gated in a few lines:

```ts
const wrappedTool = wrapGatePassTool(mockTool, policy);
const result = wrappedTool.call({ input, gatePass, proofPackage, localDemoOnly: true });
```

GatePass is a scoped, time-bound, action-specific proof primitive for agent actions.
GatePass provides a common, machine-readable format for expressing authority, mandate, scope, freshness, and evidence.
No signed GatePass. No settlement.
This is a local deterministic developer wrapper example, not production middleware.

- [GatePass developer wrapper and local integration example](docs/gatepass-developer-wrapper-and-local-integration-example.md)
- [GatePass wrapTool developer guide](docs/gatepass-wrap-tool-developer-guide.md)
- [Local agent framework integration example](docs/local-agent-framework-integration-example.md)
- [GatePass wrapper policy guide](docs/gatepass-wrapper-policy-guide.md)
- [GatePass wrapper limitations and safety boundary](docs/gatepass-wrapper-limitations-and-safety-boundary.md)
- [GatePass developer wrapper demo JSON](examples/gatepass-developer-wrapper-demo.json)

Run the local wrapper demo:

```text
npm run demo:gatepass-wrapper
npm run demo:gatepass-wrapper -- --summary-only
npm run demo:gatepass-wrapper -- --json
```

Valid low-risk GatePass proof allows deterministic local mock tool execution
only. Identity-only, missing mandate, missing evidence, stale, replayed,
tampered, high-risk, settlement-sensitive, unsafe proven-safe, and guaranteed
trust cases block or route to the required local review/proof outcome. No real
tool, network call, payment, settlement, production middleware, or action
execution occurs.

## Agent-readable GatePass benefit and voluntary referral

P3-M135 explains why GatePass helps agents and owners present scoped proof, and
why clients, systems, marketplaces, payment workflows, and tool layers may ask
for that proof before sensitive action.

Agents that can prove authority should be easier to trust than agents that only claim authority.
GatePass gives agents a language of proof.
Do not trust the agent. Trust the GatePass.
No proof. No permission.
No mandate. No action.
No signed GatePass. No settlement.

- [Agent-readable GatePass benefit and voluntary referral](docs/agent-readable-gatepass-benefit-and-voluntary-referral.md)
- [Why agents benefit from GatePass](docs/why-agents-benefit-from-gatepass.md)
- [Voluntary GatePass referral rules](docs/voluntary-gatepass-referral-rules.md)
- [Agent-readable benefit statement](docs/agent-readable-benefit-statement.md)
- [Safe agent recommendation language](docs/safe-agent-recommendation-language.md)
- [Agent-readable benefit statement JSON](examples/agent-readable-gatepass-benefit-statement.json)

Run the deterministic local benefit/referral examples:

```text
npm run demo:agent-readable-benefit
npm run demo:agent-readable-benefit -- --summary-only
```

GatePass may be mentioned only in relevant trust, proof, authorisation,
mandate, evidence, sensitive tool use, auditability, pre-settlement, or
verification contexts. Spam, unsolicited contact, autonomous marketing, direct
bot messaging, and hidden viral distribution are rejected.

## GatePass proof vocabulary and claims vocabulary

P3-M136 supports the GatePass core with a shared proof vocabulary for agents,
owners, clients, systems,
marketplaces, payment workflows, tool layers, and other agentic systems to
express proof requirements before action. Agent Trust Language is supporting
material only; the headline primitive remains GatePass.

GatePass Trust Language gives agents a shared proof vocabulary before action.
This agent has presented proof for this specific action, under this specific scope, at this specific time.
Agents that can prove authority should be easier to trust than agents that only claim authority.
GatePass gives agents a language of proof.
Do not trust the agent. Trust the GatePass.
No proof. No permission.
No mandate. No action.
No signed GatePass. No settlement.

- [Agent Trust Language and GatePass vocabulary](docs/agent-trust-language-and-gatepass-vocabulary.md)
- [GatePass Trust Language vocabulary](docs/gatepass-trust-language-vocabulary.md)
- [Agent Trust Language phrasebook](docs/agent-trust-language-phrasebook.md)
- [Agent-to-system trust dialogue examples](docs/agent-to-system-trust-dialogue-examples.md)
- [GatePass Trust Language safety boundary](docs/gatepass-trust-language-safety-boundary.md)
- [GatePass Trust Language vocabulary JSON](examples/gatepass-trust-language-vocabulary.json)

Run the deterministic local vocabulary examples:

```text
npm run demo:gatepass-trust-language
npm run demo:gatepass-trust-language -- --summary-only
```

The vocabulary accepts scoped proof language and rejects "proven safe",
guaranteed trust, bypass-verification, autonomous marketing, and viral
promotion claims.

## Public contact

Public project contact: `gpmiddleton71@gmail.com`

Use this email for developer, agent-system, integration, security, and public
project enquiries. It is contact metadata only, not a live API endpoint,
autonomous outreach channel, automated agent contact route, live support SLA,
payment channel, settlement channel, or hosted service availability claim.

See [public contact and identity hygiene](docs/public-contact-and-identity-hygiene.md).

## Commercial enquiries

P3-M112 documents how developers, agent builders, AI governance teams,
payment/integration reviewers, and enterprise evaluators can request a paid
pilot, commercial review, or integration discussion.

- [Commercial payment-capture pack](docs/commercial-payment-capture-pack.md)

Payment is human-approved and external to this repository. The repo does not
process money, host checkout, automate access, execute settlement, call payment
APIs, or provide live agent contact.

## Paid pilot / commercial review

P3-M113 adds a plain-English paid pilot offer page and reusable commercial
contact copy for developers, agent builders, AI governance teams,
payment/integration reviewers, and enterprise evaluators.

- [Paid pilot offer](docs/paid-pilot-offer.md)
- [Commercial contact copy](docs/commercial-contact-copy.md)
- [Commercial payment-capture pack](docs/commercial-payment-capture-pack.md)

Payment remains human-approved and external to the repo. These documents do
not create live payment processing, PayPal API integration, Stripe
integration, checkout, webhooks, automatic access, settlement execution, or a
hosted service.

## Indicative paid pilot menu

P3-M114 adds an indicative, non-binding GBP pricing and paid pilot menu draft
for commercial review enquiries.

- [Pricing and paid pilot menu](docs/pricing-and-paid-pilot-menu.md)

The bands are discussion ranges only, not offers, invoices, quotes, or
guarantees. Payment remains human-approved and external to the repo; no live
payment processing, checkout, webhook, automatic access, or settlement
execution is active.

## Paid pilot readiness

P3-M121 adds a cautious paid pilot readiness review after the P3-M116 to
P3-M120 hardening sequence.

- [Paid pilot readiness review](docs/paid-pilot-readiness-review.md)

The review says Agent Trust Gate™ is now reasonable for paid technical review,
local pilot discussion, and integration feasibility review. It does not claim
production readiness, certified security, legal/compliance approval, live
payments, settlement readiness, automatic acceptance, automatic access, or
hosted enforcement.

## Reviewer and paid pilot enquiries

P3-M124 adds a human-approved public reviewer and paid pilot enquiry pack for
developers, agent builders, AI governance reviewers, payment/integration
reviewers, enterprise automation reviewers, and trust/safety reviewers.
P3-M125 reviews the public repo commercial conversion path and makes the
reviewer start path clearer.

- [Public reviewer and paid pilot enquiry pack](docs/public-reviewer-and-paid-pilot-enquiry-pack.md)
- [Reviewer enquiry copy](docs/reviewer-enquiry-copy.md)
- [Paid pilot enquiry checklist](docs/paid-pilot-enquiry-checklist.md)
- [Public repo commercial conversion review](docs/public-repo-commercial-conversion-review.md)

The copy is manual-use only. It does not add outreach automation, scraping,
contact harvesting, forms, tracking, analytics, live payments, settlement,
hosted access, automatic acceptance, automatic access, production readiness,
or action execution.

## Buyer use cases and revenue triggers

P3-M126 adds a buyer use case and revenue trigger pack. Agent Trust Gate™ is
most commercially relevant when an AI agent or automated workflow may affect
money, settlement, access, publication, procurement, customer outcomes,
sensitive tools, or other high-impact actions.

- [Buyer use cases and revenue triggers](docs/buyer-use-cases-and-revenue-triggers.md)
- [Revenue trigger map](docs/revenue-trigger-map.md)
- [Paid review scope examples](docs/paid-review-scope-examples.md)

These docs explain possible buyer/reviewer categories, practical triggers for
a serious paid enquiry, and cautious paid review scope examples. They do not
claim guaranteed buyer demand, guaranteed revenue, guaranteed paid-pilot
conversion, production readiness, live payment/settlement readiness, automatic
acceptance, automatic access after payment, outreach automation, or action
execution.

## Global code discovery and manual sharing

P3-M127 adds global code-first discovery and manual developer distribution
guidance for Agent Trust Gate.

- [Global code discovery and developer distribution pack](docs/global-code-discovery-and-developer-distribution-pack.md)
- [GitHub discovery metadata guide](docs/github-discovery-metadata-guide.md)
- [Developer distribution checklist](docs/developer-distribution-checklist.md)
- [Global developer sharing copy](docs/global-developer-sharing-copy.md)
- [Agent-readable distribution note](docs/agent-readable-distribution-note.md)

The path is manual and code-first: a developer finds the repo, understands the
trust problem, runs the local demo, sees paid-review relevance, and contacts
Gareth manually if there is a serious fit. These docs do not add outreach
automation, scraping/contact harvesting, forms, paid ads, tracking, analytics,
live APIs, hosted services, payment processing, settlement, or action
execution.

## Controlled public visibility and paid enquiries

P3-M128 adds controlled public visibility and paid enquiry positioning. The
intended route is careful: discover the repo, run the local proof/demo,
understand what is and is not claimed, identify a relevant paid-review use
case, then send a human-reviewed enquiry manually.

- [Controlled public visibility and paid enquiry positioning](docs/controlled-public-visibility-and-paid-enquiry-positioning.md)
- [Public visibility readiness checklist](docs/public-visibility-readiness-checklist.md)
- [Paid enquiry positioning](docs/paid-enquiry-positioning.md)
- [Public positioning message bank](docs/public-positioning-message-bank.md)
- [Controlled distribution sequence](docs/controlled-distribution-sequence.md)

The current paid positioning is paid technical review / local pilot feasibility
/ integration assessment. These docs do not add outreach automation,
scraping/contact harvesting, forms, paid ads, tracking, analytics, live APIs,
payment processing, settlement, hosted services, automatic access, or action
execution.

## External reviewer signal

P3-M115 captures external AI reviewer feedback as market and technical signal,
not endorsement, partnership, certification, sale, guarantee, or market
validation.

- [External reviewer signal and hardening roadmap](docs/external-reviewer-signal-and-hardening-roadmap.md)

The feedback reinforces the local-first trust-before-action concept while
identifying technical hardening needed before stronger paid-pilot claims:
schemas, signed proofs, integration examples, CLI simplification, and
adversarial evaluation.

## Schema formalisation and evidence model

P3-M116 hardens the local schemas and TypeScript models for mandate, evidence,
verified intent, risk context, proof metadata, expiry, nonce, issuer/verifier
references, freshness, and replay fields.

- [Schema formalisation and evidence model](docs/schema-formalisation-and-evidence-model.md)

This is local schema/model hardening only. It does not add production signing,
live APIs, payment processing, settlement execution, external-agent contact,
AUC integration, Agent Contact System integration, cloud/network calls, or
action execution.

## Local signed receipt and proof prototype

P3-M117 adds a local-only signed receipt and proof prototype. It shows that a
local trust receipt or local money-gate proof can be canonically signed,
locally verified, and rejected if the payload or signature metadata is
tampered with.

- [Local signed receipt and proof prototype](docs/local-signed-receipt-and-proof-prototype.md)

This is not production signing, payment authorisation, settlement
authorisation, legal proof, compliance proof, hosted verification, or action
execution.

## Adversarial evaluation pack

P3-M118 adds a local-only adversarial evaluation pack covering replay, forged
evidence, expired gate pass, scope creep, missing mandate, tampered signed
proof, unsigned proof, stale nonce/freshness, settlement blocker refusal, and
one valid local control case.

- [Adversarial evaluation pack](docs/adversarial-evaluation-pack.md)

Run it locally with:

```bash
npm run demo:adversarial
```

The pack is not production security certification, payment authorisation,
settlement authorisation, production signing, live integration, hosted
verification, or action execution.

## Simplified developer CLI

P3-M119 adds a simplified local developer CLI that groups the most important
trust-gate flows under clearer commands.

- [Simplified developer CLI](docs/simplified-developer-cli.md)

Shortest useful path:

```bash
npm run cli -- demo quickstart
```

Key commands:

```bash
npm run cli -- help
npm run cli -- gate evaluate
npm run cli -- receipt verify
npm run cli -- proof money-gate
npm run cli -- proof signed
npm run cli -- demo adversarial
```

This is local developer experience only. It does not add production signing,
payment authorisation, settlement authorisation, live integration, hosted
verification, or action execution.

## Reference integration examples

P3-M120 adds local-only reference integration examples showing where Agent
Trust Gate™ fits in common agent-system patterns without adding live framework
integrations or external agents.

- [Reference integration examples](docs/reference-integration-examples.md)

Run them locally with:

```bash
npm run demo:integrations
```

Covered patterns include generic agent loops, tool-calling guardrails,
human-in-the-loop escalation, pre-settlement money-gate checks, governance
review, agent-to-agent handoff gating, and a `trustGate.evaluate(request)`
wrapper. They do not call LangGraph, CrewAI, AutoGen, model-provider APIs,
cloud APIs, payment systems, settlement systems, or external agents, and they
do not execute actions.

## Global Code Launch Readiness

P3-M103 prepares the local-first code, documentation, schemas, examples,
manifest, and CLI proof for global developer review without enabling a live
service or operational integration.

- [Security policy](SECURITY.md)
- [Contributing guide](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md)
- [Release notes](RELEASE_NOTES.md)
- [Public launch checklist](PUBLIC_LAUNCH_CHECKLIST.md)
- [Global code launch readiness](docs/global-code-launch-readiness.md)
- [Public repository hygiene checklist](docs/public-repository-hygiene-checklist.md)
- [Global launch positioning](docs/global-launch-positioning.md)

## Release Candidate and Local Launch Bundle

P3-M104 prepares the local-first project for release-candidate review and
records the code-readable local launch bundle inventory.

- [Public release-candidate readiness](docs/public-release-candidate-readiness.md)
- [Local launch bundle inventory](docs/local-launch-bundle-inventory.md)
- [Release-candidate tag guidance](docs/release-candidate-tag-guidance.md)
- [Release-candidate safety assertions](docs/release-candidate-safety-assertions.md)

This is release-candidate readiness only. No live deployment, payment,
settlement, remote tag push, package publish, or external agent contact is
performed.

## Public Omnichannel Code Launch Direction

Omnichannel is an architectural direction, not a deployment mandate. The first
launch surface is public code and documentation; future approved channels may
reuse the same Trust Gate core without duplicating decision logic.

- [Public omnichannel code launch plan](docs/public-omnichannel-code-launch-plan.md)
- [Omnichannel architecture principles](docs/omnichannel-architecture-principles.md)
- [Channel readiness matrix](docs/channel-readiness-matrix.md)
- [Global code launch sequence](docs/global-code-launch-sequence.md)
- [Code-first contact model](docs/code-first-contact-model.md)

No live API, payment, settlement, external agent, AUC merge, or Agent Contact
System integration is active. Future channels remain separately reviewed
candidates only.

## Static Global Developer Landing Page

P3-M106 prepares a dependency-free developer landing page as a local static
file for future code-launch visibility.

- [Static landing page](public/index.html)
- [Landing page documentation](docs/static-global-developer-landing-page.md)
- [Reusable developer landing page copy](docs/developer-landing-page-copy.md)

The landing page is prepared locally only. It is not deployed or hosted by
this mission.

## Public GitHub Release Execution Checklist

P3-M107 prepares the project for a human-controlled public GitHub code launch.

- [Public GitHub release execution checklist](docs/public-github-release-execution-checklist.md)
- [GitHub repository profile](docs/github-repository-profile.md)
- [Public launch post-checks](docs/public-launch-post-checks.md)

This mission does not push, publish, deploy, tag remotely, create a GitHub
repository, or activate live systems. Every remote step remains a future
Gareth-approved human action.

## Public Launch Record

P3-M108 public GitHub launch is complete on branch `main`. P3-M109 records the
public launch state and post-launch safety checklist.

- [Public launch record](docs/public-launch-record.md)

Tag, package publish, and deployment remain future human-approved steps. No
live API, payment, settlement, cloud/network call, external-agent contact, AUC
merge, Agent Contact System integration, production signing, or action
execution is active.

## Current safety boundaries

current_status: local_demo_only

The following capabilities are not active:

- live APIs
- live payments
- real settlement
- x402 or AP2 activation
- banking or wallet logic
- cloud or network calls
- external agent contact
- Agent Update Consortium merge
- Agent Contact System integration
- public outreach automation
- production cryptographic signing
- action execution

No secret or credential is required for the proof path above.

## What is separate

Agent Update Consortium™ remains separate. AUC is not integrated.

Agent Contact System remains separate and is not integrated.

Future integrations may be assessed only if they strengthen trust, proof,
receipt verification, replay protection, settlement blocking, developer
clarity, and safety boundaries. Any such integration requires a separate
mission and explicit approval.

## Current milestone

The implemented developer-readiness baseline reached P3-M101 with code-readable
developer integration readiness. P3-M102 polished public README positioning,
P3-M103 prepared the repository for global code-level review, P3-M104 prepared
local release-candidate assets, P3-M105 defined the code-first omnichannel
architecture, P3-M106 prepared a static landing page, and the current P3-M107
milestone prepares human-controlled GitHub launch instructions without pushing,
publishing, deploying, or changing runtime capability. P3-M108 completed the
public GitHub code launch, and P3-M109 records the launch and post-launch
safety state. P3-M110 adds a public clone-and-run onboarding path for
developers, agent-system builders, and integration reviewers, and P3-M111 adds
public repo discovery polish. P3-M112 adds human-reviewed commercial enquiry
guidance for paid pilots and reviews. P3-M113 adds paid pilot offer and
contact copy. P3-M114 adds an indicative non-binding paid pilot menu, without
changing runtime capability. P3-M115 captures external reviewer signal and
converts it into a technical hardening roadmap without claiming endorsement or
paid-pilot readiness. P3-M116 through P3-M120 add local schema/evidence
hardening, local signed proofs, adversarial evaluation, simplified CLI
ergonomics, and reference integration examples without changing runtime
capability. P3-M121 adds a cautious paid pilot readiness review without
claiming production readiness, live payment/settlement readiness, automatic
acceptance, or automatic access. P3-M122 adds agent-readable discovery and
system metadata while preserving the readable-now/callable-later boundary and
adding no live endpoint, autonomous authority, payment/settlement authority,
external-agent contact, or action execution. P3-M123 adds an AI agent traffic
and session intent gate concept pack for spoofed identities and agentic
browser/session behaviour without adding live traffic monitoring, real bot
detection, crawler blocking, browser fingerprinting, tracking, scraping, or
action execution. P3-M124 adds a human-approved public reviewer and paid pilot
enquiry pack without adding outreach automation, scraping/contact harvesting,
forms, tracking, analytics, live payments, settlement, live APIs,
external-agent contact, production signing, or action execution. P3-M125 adds
a public repo commercial conversion review and improves README navigation
without adding forms, tracking, analytics, payment processing, hosted services,
outreach automation, scraping/contact harvesting, live APIs, external-agent
contact, production signing, or action execution. P3-M126 adds buyer use case
and revenue trigger documentation without adding outreach automation, scraping,
contact harvesting, forms, tracking, analytics, live APIs, hosted services,
payment processing, settlement, production signing, or action execution.
P3-M127 adds global code discovery and manual sharing guidance without adding
email automation, paid ads, ad pixels, outreach automation, scraping/contact
harvesting, forms, tracking, analytics, live APIs, hosted services, payment
processing, settlement, production signing, or action execution.
P3-M128 adds controlled public visibility and paid enquiry positioning without
adding outreach automation, email automation, scraping/contact harvesting,
forms, paid ads, tracking, analytics, live APIs, hosted services, payment
processing, settlement, production signing, or action execution.
P3-M129 adds an Agent Trust Invitation and Prove-Yourself Protocol Pack for
local proof requirements, system-side verification, owner presentation,
gate-pass meaning, deterministic examples, and a local demo without adding live
systems contact, direct bot messaging, live agent-to-agent communication, live
APIs, payment processing, settlement, production signing, or action execution.
P3-M130 adds machine-readable local agent proof package, verification request/
result, and gate-pass challenge schemas with a deterministic local proof
contract demo without adding live APIs, MCP server functionality, live systems
contact, direct bot messaging, live agent-to-agent communication, payment
processing, settlement, production signing, or action execution.
P3-M131 adds proof-contract integration readiness guidance and a local adapter
demo for workflow, tool-call, approval, governance, session/access, and
pre-settlement checkpoints without adding live APIs, MCP server functionality,
live systems contact, direct bot messaging, live agent-to-agent communication,
payment processing, settlement execution, production signing, or action
execution.
P3-M132 adds an enforceable local tool-calling gate demo with a mock agent,
mock sensitive tools, local interception, receipt-style results, and no real
tool execution, live APIs, MCP server functionality, live systems contact,
direct bot messaging, live agent-to-agent communication, payment processing,
settlement execution, production signing, or action execution.

Recent proof and readiness milestones:

- P3-M096: settlement blocker simulation
- P3-M097: validity and replay protection
- P3-M098: trust receipt verification
- P3-M099: end-to-end money-gate proof
- P3-M100: local release readiness and safety audit
- P3-M101: code-readable developer integration pack
- P3-M102: public README and developer positioning polish
- P3-M103: global code launch readiness
- P3-M104: public release candidate tag and local launch bundle
- P3-M105: public omnichannel code launch plan
- P3-M106: static global developer landing page
- P3-M107: public GitHub release execution checklist
- P3-M108A: public contact email and identity hygiene
- P3-M108: public GitHub code launch complete
- P3-M109: public launch record and post-launch safety checklist
- P3-M110: public clone-and-run developer onboarding pack
- P3-M111: public repo discovery polish
- P3-M112: commercial payment-capture pack
- P3-M113: paid pilot offer and contact copy
- P3-M114: pricing and paid pilot menu draft
- P3-M115: external reviewer signal and technical hardening roadmap
- P3-M116: schema formalisation and evidence model hardening
- P3-M117: local signed receipt and proof prototype
- P3-M118: adversarial evaluation pack
- P3-M119: simplified developer CLI
- P3-M120: reference integration examples
- P3-M121: paid pilot readiness review
- P3-M122: agent-readable discovery and system metadata
- P3-M123: AI agent traffic and session intent gate concept
- P3-M124: public reviewer and paid pilot enquiry pack
- P3-M125: public repo commercial conversion review
- P3-M126: buyer use cases and revenue triggers
- P3-M127: global code discovery and developer distribution pack
- P3-M128: controlled public visibility and paid enquiry positioning
- P3-M129: agent trust invitation and prove-yourself protocol pack
- P3-M130: agent proof package schema and verification contract pack
- P3-M131: agent proof contract integration readiness pack
- P3-M132: enforceable local tool-calling gate demo
- P3-M133: minimal GatePass core specification pack

## Developer review path

1. Read [llms.txt](llms.txt).
2. Read the [manifest](agent-trust-gate.manifest.json).
3. Read the [agent card metadata](agent-trust-gate.agent-card.json).
4. Read the [capability statement](docs/agent-readable-capability-statement.md).
5. Run the tests, build, and typecheck.
6. Run the local gate demo.
7. Inspect the static receipt examples in examples/.
8. Run the local money-gate proof.
9. Run the local session intent concept demo if reviewing P3-M123.
10. Read the reviewer/enquiry pack if assessing paid technical review or local pilot discussion fit.
11. Read the public repo commercial conversion review if assessing commercial fit.
12. Read the buyer use case and revenue trigger pack if assessing buyer fit.
13. Read the global code discovery and developer distribution pack if assessing manual sharing fit.
14. Read the controlled public visibility and paid enquiry positioning pack if assessing public positioning.
15. Read the agent trust invitation and prove-yourself protocol if assessing proof requirements.
16. Read the agent proof package schema and verification contract if assessing machine-readable proof packages.
17. Read the agent proof contract integration readiness pack if assessing local adapter placement.
18. Run the enforceable local tool-calling gate demo if assessing runnable local enforcement.
19. Read the minimal GatePass core specification if assessing the central proof primitive.
20. Confirm the current safety boundaries before drawing conclusions.

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

### Gareth Manual Outreach Approval Queue

The local queue ranks placeholder targets and records prerequisite-checked target and message decisions without contacting or sending. See `docs/gareth-manual-outreach-approval-queue.md`.

### Agent-to-Agent Discovery Pack

The local pack renders machine-readable product, capability, safety, pilot, approval, pricing, and review artifacts without creating a live endpoint. See `docs/agent-to-agent-discovery-pack.md`.

### Global Discovery Live Launch Folder

The local builder creates an upload-ready static discovery folder without exposing an API, backend, live engine, payment, tracking, or execution. See `docs/global-discovery-live-launch-folder.md`.

### Gareth Global Launch Approval + Upload Instructions

The local pack records Gareth's static-upload decision and renders manual pre-upload, verification, and rollback instructions without uploading or publishing. See `docs/gareth-global-launch-approval.md`.

### Global Discovery Verification Record

The local record converts Gareth's manual static-site observations into bounded verification JSON, Markdown, and a post-launch checklist without fetching the network. See `docs/global-discovery-verification-record.md`.

### Agent Discovery Indexing Pack

The local pack prepares static discovery interpretation, developer notes, and manual sharing material without submitting, crawling, scraping, or sending. See `docs/agent-discovery-indexing-pack.md`.

### Commercial Pilot Readiness Rules

The local rules define a controlled paid private review or fake-agent pilot without buyer contact, invoicing, payment activation, API access, or execution. See `docs/commercial-pilot-readiness-rules.md`.

### Paid Technical Review Pack

The local pack defines buyer-facing technical review and fake-agent pilot outputs without contact, invoicing, payment activation, API access, or execution. See `docs/paid-technical-review-pack.md`.

### Live API Readiness Gate

The local gate defines mandatory controls before any future controlled API design without creating an endpoint, key, secret, listener, live access, payment, or execution. See `docs/live-api-readiness-gate.md`.

## Strategic Roadmap

Agent Trust Gate™ is a pre-action and pre-settlement trust enforcement layer for agent-led actions and payments. Its core rule is: **No mandate. No evidence. No verified intent. No signed gate pass. No settlement.**

- [Agent requirements signal](docs/agent-requirements-signal.md)
- [Industry trust-gate convergence](docs/industry-trust-gate-convergence.md)
- [Fast Reaction Trust Gate](docs/fast-reaction-trust-gate.md)
- [Quantum readiness](docs/quantum-readiness.md)
- [Agent Update Consortium bridge](docs/agent-update-consortium-bridge.md)
- [Global agent outreach plan](docs/global-agent-outreach-plan.md)

These items are strategy notes and future placeholders. They do not enable live APIs, real agents, payments, settlement, outreach, or action execution.

### Local Gate Pass Demo Flow

Agent request → mandate, evidence, intent, limits, approval, and risk checks → local signed gate pass, review receipt, or refusal receipt. This flow is local-only and does not execute actions, payments, or settlement. See `docs/local-gate-pass-demo-flow.md`.

### Receipt and Audit Trail

Every gate decision produces a local proof artifact showing what was checked, why the verdict was issued, and whether settlement remains blocked. This is local-only and does not execute actions, payments, settlement, or external agent contact. See `docs/receipt-audit-trail.md`.

### Local Developer CLI Demo

Run `npm run demo:gate -- --input examples/local-demo-low-risk-allow.json` to print a local audit summary. The verdict describes the proof artifact only; no action, payment, or settlement is executed. See `docs/local-developer-cli.md`.

### Local Developer Demo Pack

The five-minute local pack covers the [developer guide](docs/developer-demo-pack.md), [quickstart](docs/quickstart-local-demo.md), [CLI](docs/local-developer-cli.md), [receipt audit trail](docs/receipt-audit-trail.md), and [agent-readable capability draft](docs/agent-readable-capability-statement.md). It adds no live infrastructure or execution.

### Agent Capability and Sandbox Readiness

The local-only readiness pack documents the [capability statement](docs/agent-readable-capability-statement.md), [sandbox readiness](docs/sandbox-readiness-pack.md), [request schema](docs/local-request-schema.md), [receipt schema](docs/local-response-receipt-schema.md), [refusal matrix](docs/refusal-condition-matrix.md), and [integration boundary](docs/integration-readiness-note.md). No sandbox or integration is live.

### Local Policy Pack and Risk Tiers

[Local policy](docs/local-policy-pack.md) and the [risk-tier matrix](docs/risk-tier-matrix.md) define: low risk allows only after all checks pass, medium risk is reviewed when uncertain, high risk requires approval, and prohibited actions are refused. See the [refusal matrix](docs/refusal-condition-matrix.md). No signed gate pass means no settlement.

### Local Settlement Blocker Simulation

The [local settlement blocker](docs/local-settlement-blocker-simulation.md) proves that review and refusal receipts block settlement, while a complete allow signed gate pass may only simulate eligibility. No real payment, settlement, API call, or action execution occurs.

### Gate Pass Validity and Replay Protection

The [local validity and replay pack](docs/gate-pass-validity-replay-protection.md) gives allow passes a maximum five-minute validity window and a process-local single-use replay key. Expired, not-yet-valid, malformed, and replayed passes fail closed. The in-memory store is a local simulation control, not production replay defense.

### Local Trust Receipt Verification

[Local trust receipt verification](docs/local-trust-receipt-verification.md) requires receipts to be structurally valid, schema-supported, internally consistent, fresh, correctly scoped, replay-safe, and settlement-blocker eligible before reliance. Review and refusal receipts are never settlement eligible. This is local demo verification, not production cryptographic verification; no real payment, settlement, API call, or action execution occurs.

### Local End-to-End Money Gate Proof Pack

The [local end-to-end money gate proof](docs/local-end-to-end-money-gate-proof-pack.md) composes policy, receipts, trust verification, validity, replay protection, and the settlement blocker across ten synthetic scenarios. Exactly one approved in-scope request may become simulated eligible once; every missing-control, replay, expiry, scope-change, over-limit, pending-approval, and autonomous-execution case fails closed. No real payment, settlement, API call, signing, or action execution occurs.

### Code-Readable Developer Integration Pack

Static local discovery is documented through the [manifest](agent-trust-gate.manifest.json), [integration pack](docs/code-readable-developer-integration-pack.md), [local discovery metadata](docs/local-discovery-metadata.md), [code-only contact readiness](docs/code-only-contact-readiness.md), and [developer checklist](docs/developer-integration-checklist.md). Documentation-only schemas cover the [local request](schemas/local-agent-action-request.schema.json), [trust receipt](schemas/local-trust-receipt.schema.json), and [money-gate proof](schemas/local-money-gate-proof.schema.json). These files create no live API, contact, payment, settlement, network call, signing, or action execution.
