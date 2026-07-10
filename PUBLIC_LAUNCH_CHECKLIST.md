# Public Launch Checklist

This checklist covers global publication of the repository as code and documentation only.

## Repository

- [ ] README positioning and links are accurate.
- [ ] License, security policy, contribution guide, changelog, and release notes are present.
- [ ] Public launch record is present: [Public launch record](docs/public-launch-record.md).
- [ ] Public repo discovery polish is present: [Public repo discovery polish](docs/public-repo-discovery-polish.md).
- [ ] Commercial payment-capture pack is present: [Commercial payment-capture pack](docs/commercial-payment-capture-pack.md).
- [ ] Paid pilot offer is present: [Paid pilot offer](docs/paid-pilot-offer.md).
- [ ] Commercial contact copy is present: [Commercial contact copy](docs/commercial-contact-copy.md).
- [ ] Pricing and paid pilot menu draft is present: [Pricing and paid pilot menu](docs/pricing-and-paid-pilot-menu.md).
- [ ] External reviewer signal and hardening roadmap is present: [External reviewer signal and hardening roadmap](docs/external-reviewer-signal-and-hardening-roadmap.md).
- [ ] Schema formalisation and evidence model hardening is present: [Schema formalisation and evidence model](docs/schema-formalisation-and-evidence-model.md).
- [ ] Local signed receipt and proof prototype is present: [Local signed receipt and proof prototype](docs/local-signed-receipt-and-proof-prototype.md).
- [ ] Reference integration examples are present: [Reference integration examples](docs/reference-integration-examples.md).
- [ ] Manifest reports `local_demo_only`.
- [ ] Schemas and JSON examples parse.
- [ ] Tests, build, and typecheck pass.
- [ ] `.env`, generated logs, and private artifacts remain ignored.

## Public contact identity

- [ ] Approved public contact email is `gpmiddleton71@gmail.com`.
- [ ] README, SECURITY, manifest, and static landing page use the approved public contact email.
- [ ] Public contact wording is limited to developer, agent-system, integration, security, and public project enquiries.
- [ ] Public contact wording does not imply a live API endpoint, automated agent contact, autonomous outreach, live support SLA, payment channel, settlement channel, or hosted service availability.
- [ ] Git commit identity remains `Agent Trust Gate <291836990+Gareth1953@users.noreply.github.com>`.

## Commercial enquiries

- [ ] P3-M112 commercial payment-capture pack is documentation only.
- [ ] Paid pilot, commercial review, and integration discussion enquiries route to `gpmiddleton71@gmail.com`.
- [ ] Payment remains human-approved and external to the repository.
- [ ] No automatic acceptance or automatic access is implied.
- [ ] No live payment processing, PayPal API integration, Stripe integration, checkout, webhook, settlement execution, wallet/banking logic, or payment rail is active.
- [ ] P3-M113 paid pilot offer and commercial contact copy are documentation only.
- [ ] Paid pilot option names are discussion labels, not fixed prices or binding service terms.
- [ ] Contact templates do not promise acceptance, availability, outcome, compliance, integration, payment activation, settlement, or automatic access.
- [ ] Invoice-ready and PayPal-request-ready wording remains future human-approved and external to the repository.
- [ ] No live payment processing, hosted checkout, webhook, settlement execution, wallet/banking logic, or automatic access is introduced by P3-M113.
- [ ] P3-M114 indicative price bands are discussion ranges only.
- [ ] P3-M114 price bands are not offers, invoices, quotes, or guarantees.
- [ ] P3-M114 pricing remains subject to human review and separate agreement.
- [ ] Payment remains external to the repository.
- [ ] No checkout, payment API, webhook, wallet/banking logic, settlement execution, or automatic access is introduced by P3-M114.

## External reviewer signal

- [ ] P3-M115 reviewer feedback is framed as external AI reviewer signal only.
- [ ] No endorsement, partnership, certification, sale, guarantee, official approval, or market validation is claimed.
- [ ] Paid-pilot readiness is not overclaimed.
- [ ] Technical hardening roadmap includes schemas, signed receipts/proofs, integration examples, CLI simplification, and adversarial evaluation.
- [ ] No live capability, payment processing, deployment, external-agent contact, or production signing is introduced by P3-M115.

## Schema Formalisation and Evidence Model

- [ ] P3-M116 schema formalisation and evidence model hardening is local-only.
- [ ] Local request schema includes mandate, evidence, verified intent, risk, proof metadata, expiry, nonce, issuer/verifier, freshness, replay, and local-only fields.
- [ ] Local trust receipt schema includes proof metadata and local issuer/verifier references.
- [ ] Local money-gate proof schema includes proof metadata and freshness/replay fields.
- [ ] P3-M116 does not claim production signing, paid-pilot readiness, production readiness, legal/compliance certification, or settlement assurance.
- [ ] No live API, payment processing, settlement execution, external-agent contact, AUC merge, Agent Contact System integration, production signing, or action execution is activated by this hardening.

## Local Signed Receipt and Proof Prototype

- [ ] P3-M117 local signed receipt/proof prototype is local-demo-only.
- [ ] Valid local signed trust receipt and money-gate proof examples verify locally.
- [ ] Tampered local signed trust receipt and money-gate proof examples fail local verification.
- [ ] `productionSigning`, `paymentAuthorisation`, and `settlementAuthorisation` remain false.
- [ ] No production signing, production key management, live API, payment processing, settlement execution, hosted verification, wallet/banking logic, external-agent contact, or action execution is activated by P3-M117.
- [ ] Demo key material is clearly labelled local-demo-only, non-secret, and not for production.

## Adversarial Evaluation Pack

- [ ] P3-M118 local adversarial evaluation pack is local-demo-only.
- [ ] Replay, forged evidence, expired gate pass, scope creep, missing mandate, tampered signed proof, unsigned proof, stale nonce/freshness, and settlement blocker refusal cases are blocked.
- [ ] Valid control case is allowed locally only.
- [ ] `localDemoOnly` remains true.
- [ ] `productionSigning`, `paymentAuthorisation`, and `settlementAuthorisation` remain false.
- [ ] `docs/adversarial-evaluation-pack.md` is linked from README.
- [ ] `npm run demo:adversarial` is a local deterministic command only.
- [ ] No production security certification, production signing, live API, payment processing, settlement execution, hosted verification, wallet/banking logic, external-agent contact, or action execution is activated by P3-M118.

## Simplified Developer CLI

- [ ] P3-M119 simplified developer CLI is local-demo-only.
- [ ] `npm run cli -- help` lists `gate evaluate`, `receipt verify`, `proof money-gate`, `proof signed`, `demo adversarial`, and `demo quickstart`.
- [ ] `npm run cli -- demo quickstart` runs the shortest local developer path.
- [ ] `npm run gate` runs local gate evaluation with a safe default fixture.
- [ ] `npm run demo:quickstart` runs the simplified local quickstart.
- [ ] `localDemoOnly` remains true.
- [ ] `productionSigning`, `paymentAuthorisation`, and `settlementAuthorisation` remain false where relevant.
- [ ] `docs/simplified-developer-cli.md` is linked from README.
- [ ] No live API, payment processing, settlement execution, hosted verification, wallet/banking logic, production signing, external-agent contact, or action execution is activated by P3-M119.

## Reference Integration Examples

- [ ] P3-M120 reference integration examples are local-demo-only.
- [ ] `npm run demo:integrations` runs deterministic local summaries.
- [ ] Generic agent-loop, tool-calling guardrail, human-in-the-loop escalation, pre-settlement money-gate, governance reviewer, agent handoff, and `trustGate.evaluate(request)` wrapper patterns are covered.
- [ ] `localDemoOnly` remains true.
- [ ] `productionSigning`, `paymentAuthorisation`, and `settlementAuthorisation` remain false where relevant.
- [ ] `docs/reference-integration-examples.md` is linked from README.
- [ ] The examples do not claim official LangGraph, CrewAI, AutoGen, model-provider, cloud, payment, settlement, or external-agent integration.
- [ ] No live API, payment processing, settlement execution, hosted verification, wallet/banking logic, production signing, external-agent contact, or action execution is activated by P3-M120.

## Release-candidate checklist

- [ ] Run `npm test`.
- [ ] Run `npm run build`.
- [ ] Run `npm run typecheck`.
- [ ] Confirm JSON examples, schemas, and manifest validation.
- [ ] Confirm local README links resolve.
- [ ] Confirm no live integrations.
- [ ] Confirm no real secrets or credentials.
- [ ] Confirm no external agent contact.
- [ ] Confirm no AUC merge; AUC is not integrated.
- [ ] Confirm no Agent Contact System integration; Agent Contact System is not integrated.
- [ ] No package publish or remote tag push.

## Omnichannel Code Launch

- [ ] GitHub/repo assets ready.
- [ ] README/docs ready.
- [ ] Manifest/schemas ready.
- [ ] Examples parse.
- [ ] CLI proof works.
- [ ] Static developer page not yet created.
- [ ] npm/package readiness not yet approved.
- [ ] MCP/A2A not yet active.
- [ ] AUC bridge not yet integrated; AUC is not integrated.
- [ ] Agent Contact System not integrated.
- [ ] Hosted sandbox not active.
- [ ] Live payments/settlement not active.
- [ ] GitHub description and topics remain metadata only.

## Static landing page

- [ ] `public/index.html` exists.
- [ ] No external scripts.
- [ ] No analytics.
- [ ] No tracking.
- [ ] No forms.
- [ ] No external network dependencies.
- [ ] No live API references.
- [ ] No payment or settlement activation.
- [ ] No external agent contact.
- [ ] AUC is not integrated.
- [ ] Agent Contact System is not integrated.

## Public GitHub Release Execution

Use the human-controlled launch documents only after explicit Gareth approval:

- [Public GitHub release execution checklist](docs/public-github-release-execution-checklist.md)
- [GitHub repository profile](docs/github-repository-profile.md)
- [Public launch post-checks](docs/public-launch-post-checks.md)

P3-M108 public GitHub launch is complete. P3-M109 records the public launch and
post-launch safety state. Tag/package publish/deployment remain future
human-approved steps.

## Post-launch safety checklist

- [ ] Confirm the public launch record matches the public repository state.
- [ ] Confirm the public branch is `main`.
- [ ] Confirm the approved contact email remains `gpmiddleton71@gmail.com`.
- [ ] Confirm no old or unapproved public contact email is present.
- [ ] Confirm public repo description and topics match the discovery polish guidance.
- [ ] Confirm no tag, package publish, or deployment has been performed unless separately approved.
- [ ] Confirm no live API, payment, settlement, cloud/network call, external-agent contact, AUC merge, Agent Contact System integration, production signing, or action execution has been added.

## Required safety boundary

- [ ] No live APIs.
- [ ] No live or real payments.
- [ ] No real settlement or settlement execution.
- [ ] No external agent contact.
- [ ] No live endpoint, cloud call, or network call.
- [ ] No secret, token, or credential.
- [ ] No banking or wallet logic.
- [ ] No x402 or AP2 activation.
- [ ] No public outreach automation.
- [ ] No autonomous action execution.
- [ ] No production cryptographic signing.
- [ ] AUC is not integrated.
- [ ] Agent Contact System is not integrated.

**No mandate. No evidence. No verified intent. No signed gate pass. No settlement.**

Passing this checklist is not production payment readiness, legal or compliance certification, a security audit, or live deployment approval.
