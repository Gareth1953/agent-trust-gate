# Agent-to-Agent Trust Handshake Pack

## Handshake Status

The Agent-to-Agent Trust Handshake is draft-only, local-only, not live, not deployed, not public, and not connected to external agents or systems. It is a proposed information and governance boundary, not a networking feature or public protocol.

Agent Trust Gate evaluates proposed agent actions before they happen. External agent-to-agent use is disabled unless explicitly approved by Gareth after technical validation, security review, legal review, privacy review, and commercial launch control.

## Purpose

An agent-to-agent trust handshake is a structured declaration made before a receiving system accepts a requested action. The acting agent presents who or what it claims to be, its purpose, proposed action, target, impact, requested permissions, evidence, approval state, and prior receipt references.

The receiving system evaluates that declaration under current policy before deciding whether to reject it, limit it, require more evidence, request human approval, or permit a separately controlled low-risk step. A trust handshake does not mean automatic trust. A trust handshake does not execute the proposed action.

## Acting Agent Declaration

The acting agent should present one exact proposed action and include:

- a unique local handshake identifier
- pseudonymous acting-agent identifier and non-sensitive label
- agent type and declared purpose
- intended receiving system described with a local placeholder
- proposed action, category, target, impact, and rollback information
- evidence summary and controlled evidence references
- requested permissions bounded to the exact action
- current human approval status
- relevant prior trust receipt identifiers
- requested decision and timestamp

A declaration is a claim, not proof. The acting agent must not include credentials, payment details, unnecessary personal data, private customer content, real endpoints, or broad reusable authority.

## Receiving System Checks

The receiving system should verify independently:

- schema validity, freshness, replay protection, and request correlation
- authenticated identity and authorization in any future production design
- whether the declared purpose matches the exact requested permission
- target, impact, reversibility, external commitment, and spend exposure
- evidence provenance, integrity, sufficiency, and expiry
- approval identity, scope, integrity, and current status
- prior receipt relevance without assuming that a previous result still applies
- current policy, entitlement, quota, rate-limit, and refusal signals
- whether any ambiguity requires a fail-closed response

No agent should be trusted only because it claims to be safe, reputable, authorized, compliant, or previously approved. Self-description must never replace verification.

## Required Evidence

Evidence may include local policy references, approval records, rollback plans, hashes of reviewed content, authorization records, and prior receipt references. Evidence should be minimal, attributable, current, and relevant to the exact request.

Missing, conflicting, stale, unverifiable, or over-broad evidence must reduce trust. A hash proves only correspondence to some content when the source and hashing process are trustworthy; it does not prove that content is true, legal, safe, or authorized.

Private customer data, credentials, payment data, account identifiers, wallet addresses, and confidential content must not appear in these local drafts.

## Risk and Impact Classification

The handshake should classify both risk and impact. Risk considers policy sensitivity, uncertainty, evidence quality, identity, authorization, and likelihood of harm. Impact considers scale, reversibility, financial exposure, public reach, customer effect, legal consequence, and external commitment.

Low declared impact does not force an `ALLOW` decision. High-impact requests must fail closed when evidence, identity, authorization, or approval is incomplete.

## Human Approval Requirements

A trust handshake does not bypass human approval. High-impact actions require explicit approval for the exact proposed action, target, scope, evidence, and time window. An acting agent cannot approve itself, and one agent cannot grant another agent broader authority than the responsible human or organisation holds.

Approval after execution is not a substitute for approval before execution. Gareth final approval is separately required before any external handshake use, public protocol, live connection, or machine-to-machine trust service.

## Trust Receipt Exchange

Agent Trust Gate can produce a trust receipt describing the proposed action, decision, risk, reasons, missing evidence, approval requirements, policy context, request identifier, and timestamp. A receiving system could return a receipt reference so the acting system can understand why the request was blocked or limited.

A receipt is evidence of an evaluation, not proof of identity, legality, compliance, safe execution, or outcome. Receipt exchange must not trigger the proposed action and must not be treated as transferable execution authority.

## Blocked Action Categories

The following remain blocked by default without all applicable evidence, authorization, policy, and explicit approval:

- money movement, payments, purchases, billing, charging, or financial commitments
- public publishing, email, customer communication, or outreach
- signup, account creation, or personal-data collection
- software deployment, package publication, infrastructure change, or tool installation
- legal, compliance, regulated, or policy-sensitive decisions
- tracking, analytics, scraping, scanning, or live-target discovery
- access to private, confidential, customer, account, or credential data
- irreversible, high-impact, ambiguous, or poorly evidenced actions

Disabled handshake, connection, protocol, RefusalGraph lookup, or execution flags are hard blocking conditions.

## Agent-to-Agent Do / Do Not Table

| Do | Do not |
| --- | --- |
| Declare one exact purpose and proposed action | Request broad, reusable, or hidden authority |
| Minimise data and use local placeholders | Send private data, credentials, payment details, or live endpoints |
| Supply attributable evidence and receipt references | Treat claims or self-attestation as verified truth |
| Verify identity, authorization, scope, and freshness | Trust an agent only because it claims to be safe |
| Fail closed on ambiguity, missing evidence, or errors | Infer permission from silence, timeout, or no refusal match |
| Require exact-scope human approval for high impact | Permit self-approval or bypass a responsible human |
| Return decisions, reasons, and receipt references | Execute, pay, publish, email, deploy, or purchase |
| Keep external networking and live lookups disabled | Connect agents, webhooks, or third parties from a draft |

## Future Machine-to-Machine Trust Use

A future controlled clearing layer could receive a handshake, authenticate both parties, validate evidence, evaluate policy, check approved refusal intelligence, and return a signed decision receipt. This could help an agent decide whether to accept, reject, limit, or request stronger proof before a task, tool call, data exchange, payment intent, or transaction.

Such use requires production identity, authorization, tenant isolation, signed messages, replay protection, privacy controls, rate limits, abuse monitoring, correction and appeal processes, durable receipts, incident response, legal terms, and human governance. It remains advisory to a separate execution system.

The system must not move money, publish, email, deploy, buy, sell, sign up users, track users, scrape live targets, activate billing, or make automatic purchases.

## RefusalGraph Relationship

The handshake supplies current intent, evidence, risk, approval, and requested permissions. RefusalGraph can later provide privacy-minimised intelligence about similar refusal patterns, missing evidence, approval gaps, and policy blocks. Together they support the future Agent Clearing House direction: current-request evaluation plus relevant refusal history.

A RefusalGraph reference in a handshake is local and draft-only. Live lookup is disabled. A refusal signal is not proof of identity or wrongdoing, and absence of a refusal is not proof of trust. Current policy and human review remain authoritative.

## Gareth Final Approval Gate

External agent-to-agent use is disabled unless explicitly approved by Gareth. Approval must name the exact agents or systems, interface, data, permissions, trust rules, RefusalGraph use, security controls, retention, operating owner, and duration.

The current decision is **BLOCKED: LOCAL HANDSHAKE DRAFT ONLY**. No public protocol, agent connection, live customer data, RefusalGraph lookup, payment, billing, deployment, publishing, outreach, tracking, purchase, or action execution is enabled.
