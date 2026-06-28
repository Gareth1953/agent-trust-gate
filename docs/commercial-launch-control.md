# Commercial Launch Control Pack

## Launch Status

Agent Trust Gate is local-only, non-live, non-deployed, and not commercially launched. The current repository can evaluate structured proposed agent actions, generate trust receipts, prepare approval packs and evidence bundles, and produce local readiness materials. These capabilities do not authorize publication, deployment, sale, outreach, signup collection, billing, payment, tracking, scanning, or purchase.

The machine-readable control record is `config/commercial-launch-control.json`. Its safe default is `local_readiness_only`, and every live or commercial capability is disabled.

## Disabled Capabilities

The following remain disabled:

- commercial launch and hosted deployment
- public publishing and package distribution
- email, agent-to-agent, social, partner, or other outreach
- customer signup, login, and personal-data collection
- billing, payment processing, customer charging, and payment links
- analytics, tracking IDs, pixels, and behavioural monitoring
- live-target scanning, scraping, and autonomous market discovery
- automatic purchase and autonomous commercial decisions

Prepared documentation, manifests, Agent Card drafts, invitation drafts, receipts, and readiness reports are local artifacts only.

## Human Approval Requirements

Every proposed launch-related action requires explicit human approval for its exact scope. Approval for one action does not authorize another action, a broader campaign, deployment, or future repetition.

Gareth's final approval is required after technical, commercial, and legal review. Agent Trust Gate may prepare materials and evaluate proposals, but it must not publish, sell, email, sign up users, charge, bill, buy, scan live targets, or deploy without explicit human approval.

## Technical Readiness Checklist

- [ ] Production threat model and independent security review complete
- [ ] Production authentication, authorization, tenant isolation, and secret storage complete
- [ ] HTTPS, abuse prevention, distributed rate limiting, and secure defaults complete
- [ ] Monitoring, alerting, incident response, backup, rollback, and recovery tested
- [ ] Data retention, deletion, audit integrity, and privacy controls implemented
- [ ] Hosted staging environment validated before any production decision
- [ ] OpenAPI, SDK, manifest, and examples compatibility-reviewed
- [ ] No critical readiness or dependency-review gaps remain

## Commercial Readiness Checklist

- [ ] Target customer and validated use case defined
- [ ] Product scope, support boundaries, and service ownership agreed
- [ ] Pricing and plan model reviewed without placeholder claims
- [ ] Customer onboarding, account lifecycle, and support process designed
- [ ] Entitlement, usage, quota, refund, cancellation, and billing semantics agreed
- [ ] Pilot success criteria and controlled feedback process approved
- [ ] Public repository, package, docs, brand, domain, and release decisions approved
- [ ] No marketing or distribution channel is activated before its launch gate passes

## Legal / Compliance Readiness Checklist

- [ ] Qualified legal review of terms, acceptable use, privacy, and commercial claims complete
- [ ] Data-controller/processor roles and retention obligations understood
- [ ] Customer contract, support, liability, and service terms reviewed
- [ ] Tax, VAT, invoice, refund, cancellation, and payment-provider obligations reviewed
- [ ] Marketing consent and communication rules reviewed before any outreach
- [ ] No legality, compliance, identity, security-certification, PCI, SOC2, ISO27001, or GDPR claim is made without a valid basis
- [ ] Human review confirms that launch materials accurately describe current capabilities

## Absolute Safety Blocks

The following must never happen automatically:

- enabling launch, deployment, public binding, publishing, or package release
- contacting people, companies, agents, platforms, or live targets
- collecting signups, credentials, personal data, analytics, or tracking data
- creating charges, invoices, payment requests, billing records, or purchases
- enabling automatic purchase, autonomous spending, or self-approval
- scraping, scanning, or discovering external targets
- converting a readiness report, receipt, invitation, or placeholder approval into execution authority
- bypassing Gareth's final approval or any required technical, commercial, or legal gate

## Launch Decision Table

| Proposed action | Required control | Additional gates | Current decision |
| --- | --- | --- | --- |
| Publish a landing page or docs | `launch_enabled` and `publishing_enabled` | Technical, claims, legal, and Gareth approval | BLOCKED |
| Send an invitation email or agent message | `launch_enabled` and `outreach_enabled` | Consent, target, message, legal, and Gareth approval | BLOCKED |
| Enable customer signups | `launch_enabled` and `signup_enabled` | Account security, privacy, support, and Gareth approval | BLOCKED |
| Activate billing or payment | `launch_enabled`, `billing_enabled`, and `payment_enabled` | Provider, tax, legal, PCI scope, incident, and Gareth approval | BLOCKED |
| Publish a package or deploy a service | `launch_enabled`, `publishing_enabled`, and `deployment_enabled` | Release, security, monitoring, rollback, and Gareth approval | BLOCKED |
| Add analytics or tracking | `launch_enabled` and `tracking_enabled` | Privacy, consent, retention, and Gareth approval | BLOCKED |
| Enable machine purchase | `launch_enabled` and `automatic_purchase_enabled` | Payment, spending, approval, evidence, fraud, and Gareth approval | BLOCKED |

No row can become allowed from this document or config alone. A future reviewed implementation would still need to verify every gate and exact action scope.

## Gareth Final Approval Gate

Gareth's approval is the final manual gate, not a default or inferred state. It may be considered only after technical validation, commercial validation, and legal review are complete and recorded. Silence, a draft, a readiness percentage, a test result, an agent request, or a previous approval does not count.

The current decision is **BLOCKED: LOCAL READINESS ONLY**. This pack does not launch, deploy, publish, contact, sell, sign up, bill, charge, track, scan, buy, or execute anything.
