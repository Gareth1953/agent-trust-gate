# Agent Trust Gate Reviewer Start Here

## What Agent Trust Gate is

Agent Trust Gate™ (ATG) is a local-only reference demonstrator for checking
whether a proposed AI-agent or automated-workflow action has scoped, current
authority before it may proceed. Its GatePass is bound to the exact action,
time window, mandate, evidence, approval, tool, target, nonce and local
verification profile.

## What it proves today

ATG demonstrates locally that:

- a valid exact-action GatePass can be verified at the point of a simulated
  side effect;
- an allowed policy decision is separate from an execution receipt;
- a material action change, replay, expiry or unavailable verifier fails closed;
- missing mandate, evidence or approval prevents a required action;
- a settlement-sensitive action cannot proceed without valid current
  authority;
- refusal evidence can be explicit and machine-readable.

These are deterministic local observations, not claims about a deployed system.

## Prerequisites

- Git.
- Node.js 20 or newer.
- npm compatible with the checked-in `package-lock.json`.
- No account, API, credential, payment service, customer data or network
  service.

## Clone and install

```powershell
git clone https://github.com/Gareth1953/agent-trust-gate.git
cd agent-trust-gate
npm ci
```

## Run the reviewer sequence

```powershell
npm run reviewer
```

The command builds silently, uses fixed synthetic fixtures and a
verifier-controlled clock, prints each observed allow/refusal, and finishes
with an `ATG REVIEWER RESULT` scorecard.

## Agent discovery and safe scenario route

An agent or operator can inspect the static
[review invitation](agent-trust-gate.agent-review-invitation.json), then run:

```powershell
npm run demo:agent-standing -- --summary-only
npm run demo:human-authority -- --summary-only
npm run demo:gatepass-round-trip
npm run validate:agent-invitation
```

The [Bring Your Agent Scenario](docs/bring-your-agent-scenario.md) pack accepts
only synthetic or properly sanitised information. An agent may prepare a
scenario, but an accountable human must decide whether it is shared. Technical
and paid-pilot contact is human reviewed and subject to separate written scope;
there is no upload, automatic enrolment, autonomous purchase, remote service,
live A2A, MCP server or hosted GatePass API.

## What successful output means

`Overall: REVIEWER DEMONSTRATION PASSED` means every scenario observed the
expected local result, the successful simulated action produced a separate
execution receipt, replay and exact-action binding checks held, and all
external-action flags remained false. Expected refusals are successful test
outcomes; an unexpected allow makes the command exit non-zero.

## What this deliberately does not prove

The command does not prove production readiness, system-wide security,
standards conformity, legal or regulatory compliance, real-agent interception,
durable replay prevention, production identity, production key custody,
distributed consistency, infrastructure isolation, payment safety, settlement
safety, incident readiness or operational performance. It moves no money,
contacts no service and modifies no external system.

The repository is not production middleware, a live proxy, a cloud service, a
payment system, a settlement system or a security certification.

## Technical evidence

- [Exact-action design, verifier flow and crash boundary](docs/exact-action-gatepass-and-execution-receipts.md)
- [Canonical action envelope schema](schemas/canonical-action-envelope.schema.json)
- [Exact-action GatePass schema](schemas/exact-action-gatepass.schema.json)
- [Execution receipt schema](schemas/execution-receipt.schema.json)
- [Exact-action implementation](src/exact-action-gatepass.ts)
- [Exact-action tests](test/exact-action-gatepass.test.ts)
- [GatePass round-trip threat model](docs/gatepass-round-trip-threat-model.md)
- [Reviewer limitations and safety boundary](docs/reviewer-demo-limitations-and-safety-boundary.md)
- [OWASP Agentic Top 10 technical control map](docs/owasp-agentic-top-10-2026-control-map.md)
- [NIST identity and authorisation reference map](docs/nist-agent-security-identity-authorisation-reference-map.md)

## Paid pilot route

A serious reviewer or potential design partner may use the
[paid evaluation pilot route](docs/paid-pilot-commercial-entry.md) or email
`gpmiddleton71@gmail.com`. Enquiries are reviewed by a human and require
separate scope and written agreement. Do not send secrets, credentials,
customer records, payment details or confidential production data.

## Local-only notice

ATG version 0.1.0 remains a local reviewer demonstrator with no production-use
claim. No external action, network call, payment, settlement or live system
access occurs when `npm run reviewer` runs.

## P3-M152A roadmap note — verified human authority

The repository now records a future human-in-the-loop control objective: prove that an identifiable, authenticated and currently authorised natural person approved the exact action represented by the GatePass.

This is a roadmap/documentation addition only. Reviewers should not infer live employee identity verification, enterprise-directory integration, WebAuthn, production post-quantum signing, real refunds/payments or compliance certification.

See [Verified Human Authority and Crypto-Agile Proof](docs/verified-human-authority-and-crypto-agility.md).

## Run verified human authority

P3-M153 provides a focused human-in-the-loop evidence path:

```bash
npm run demo:human-authority -- --summary-only
npm run test:human-authority
```

Then inspect:

- `src/human-authority-demo.mjs`
- `test/human-authority-demo.test.mjs`
- `examples/human-authority-demo-report.json`
- `docs/verified-human-authority-working-demonstrator.md`
- `discovery-site/human-authority-demo.html`

The browser demonstration is intended for rapid buyer understanding. The local Node.js model and automated tests are the technical evidence. Everything remains synthetic and local; there is no live identity-provider, employee-directory, WebAuthn, payment or post-quantum integration.

## Integration advantage — consume trusted authority evidence

ATG is designed to complement trusted identity, authority and approval systems rather than replace them.

A future organisation-specific integration can treat suitable external identity, organisational standing, mandate, delegation or approval evidence as input. ATG then performs its own narrower exact-action decision:

> **Does this evidence authorise this agent to perform this exact action, here and now, within these limits?**

This means ATG need not become another enterprise identity directory, authentication platform or universal credential issuer. Existing systems can establish upstream facts; ATG can evaluate whether those facts are sufficient for the exact proposed action and then issue an action-bound GatePass or refuse the action.

```text
trusted authority evidence
        -> ATG exact-action verification
        -> GatePass or recorded refusal
        -> separately controlled execution
```

The current public repository demonstrates this principle with deterministic synthetic/local evidence only. It does not currently connect to live IAM, SSO, identity-provider, enterprise-directory, external credential or production approval systems.

See [External Authority Evidence Integration Principle](docs/external-authority-evidence-integration-principle.md).
