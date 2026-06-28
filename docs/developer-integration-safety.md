# Developer Integration Safety Pack

## Integration Status

Agent Trust Gate integration is currently local-only, draft-only, not live, not deployed, and not public. External API access, agent-to-agent networking, third-party connections, webhooks, live customer data, and action execution are disabled.

External integration is disabled unless explicitly approved by Gareth after technical validation, security review, legal review, and the Commercial Launch Control Pack requirements are complete. This guide does not enable integration or create an authorization path.

## Integration Purpose

Agent Trust Gate evaluates proposed actions before they happen. A future developer, internal tool, agent platform, or AI system could submit a structured description of an intended action and receive a trust decision before its own execution layer acts.

Agent Trust Gate can produce receipts, decisions, risk signals, reasons, missing-evidence indicators, and approval requirements. It does not perform the action itself and does not autonomously approve high-impact actions.

## Safe Input Requirements

A safe request should describe one exact proposed action and include only the information needed to assess it. Inputs should use the stable action contract or a reviewed future equivalent and should identify:

- a local request or action identifier
- the actor type and non-sensitive actor label
- the proposed action and category
- the intended target without unnecessary personal data
- expected impact and external commitment
- relevant evidence and rollback plan
- current human approval status
- the decision or evidence output requested

Developers must not submit credentials, API keys, payment details, unnecessary personal data, secrets, or unverified claims as evidence. Draft examples must use placeholders. The caller remains responsible for authorization and input accuracy.

## Safe Output Requirements

A safe response should be structured, versioned, attributable to a request ID, and explicit about uncertainty. It may contain:

- `ALLOW`, `BLOCK`, or `REQUEST HUMAN`
- allowed and blocked indicators
- risk level and policy profile
- human and Gareth approval requirements where applicable
- reasons and missing evidence
- receipt identifier and receipt status
- timestamp and local usage signals

The receiving system must treat `BLOCK` and `REQUEST HUMAN` as hard control outcomes. It must not reinterpret missing fields, errors, timeouts, or unavailable service as permission to act. Integration failure must fail closed for high-impact actions.

## Trust Receipt Structure

A trust receipt records the action description, decision, risk assessment, approval requirement, reasons, policy context, request or receipt ID, and timestamp. Related approval packs, human review records, and evidence bundles can support local audit.

Receipts are evidence of what the gate evaluated and returned. They do not prove identity, authority, legality, truth, compliance, safe execution, or outcome. A receipt must never be converted into execution authority outside its exact reviewed scope.

## Human Approval Flow

1. The caller prepares one structured proposed action.
2. Agent Trust Gate evaluates it before execution.
3. Low-risk actions may receive `ALLOW` under the configured policy.
4. High-impact or incomplete actions receive `BLOCK` or `REQUEST HUMAN`.
5. A responsible human reviews the exact action, evidence, risks, and rollback plan.
6. If approved, the approval is recorded for that exact action only.
7. The caller may make a separate execution decision under its own authorization controls.

An agent cannot approve itself. Approval after execution is not a substitute for approval before execution. Gareth final approval is separately required before any external integration or live activation of Agent Trust Gate.

## Blocked Action Categories

The following remain blocked by default unless the exact action and all applicable controls are explicitly approved:

- money movement, purchasing, billing, charging, or financial commitments
- public publishing, external messaging, email, or outreach
- customer or user commitments
- signup, account creation, or personal-data collection
- legal, compliance, policy, or regulated decisions
- software deployment, package publication, or infrastructure changes
- tracking, analytics, live scanning, scraping, or target discovery
- irreversible, high-impact, or poorly evidenced actions

Integration flags being false is itself a blocking condition. A draft request, receipt, placeholder approval, SDK example, manifest, or readiness report cannot override it.

## Agent-to-Agent Safety Rules

Future agent-to-agent use could expose machine-readable tool descriptions and accept a proposed action from another agent platform. Safe use would require authenticated and authorized identities, tenant isolation, strict schemas, replay protection, request IDs, quotas, rate limits, audit records, abuse monitoring, and fail-closed handling.

No agent may self-authorize, infer approval, contact another agent automatically, discover live targets, or execute the reviewed action. Agent-to-agent integration must remain bounded to decision and evidence exchange. External networking is currently disabled.

## Developer Do / Do Not Table

| Do | Do not |
| --- | --- |
| Evaluate actions before execution | Treat the gate as an execution engine |
| Send the minimum structured data needed | Send credentials, payment details, or unnecessary personal data |
| Honor `BLOCK` and `REQUEST HUMAN` | Fail open after errors, timeouts, or missing evidence |
| Preserve request IDs, reasons, and receipts | Rewrite or discard the audit context |
| Require exact-scope human approval | Allow agent self-approval or broad reusable approval |
| Keep local examples and demo keys separate | Connect drafts to live third parties or production systems |
| Review legal, security, privacy, and operational risks | Claim guaranteed legality, compliance, safety, or identity |
| Keep all activation flags false until approved | Enable publishing, outreach, signup, billing, payment, tracking, webhooks, or execution |

## External Integration Readiness Checklist

- [ ] Gareth final approval recorded for the exact integration scope
- [ ] Commercial Launch Control Pack gates complete
- [ ] Production threat model and security review complete
- [ ] Authentication, authorization, tenant isolation, and secret management implemented
- [ ] Input schemas, data minimization, privacy, and retention reviewed
- [ ] Fail-closed behavior and blocked-action enforcement tested
- [ ] Human approval identity, integrity, expiry, and revocation defined
- [ ] Request logging, monitoring, alerting, rate limiting, and incident response operational
- [ ] Third-party, webhook, and network boundaries reviewed
- [ ] Legal terms, support ownership, and customer data responsibilities approved
- [ ] No payment, billing, signup, tracking, outreach, or automatic-purchase claim exceeds implementation
- [ ] Staging, rollback, recovery, and compatibility testing complete

## Gareth Final Approval Gate

External integration is disabled unless explicitly approved by Gareth. Approval must follow technical validation, security review, legal review, and commercial launch control. It must name the exact system, data, interface, purpose, controls, and duration.

Agent Trust Gate must not move money, publish, email, deploy, buy, sell, sign up users, track users, scrape targets, activate billing, call webhooks, connect third-party services, or expose a public API automatically. The current integration decision is **BLOCKED: LOCAL DRAFT ONLY**.
