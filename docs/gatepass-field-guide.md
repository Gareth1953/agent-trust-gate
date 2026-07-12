# GatePass Field Guide

This guide explains each Minimal GatePass Core field in plain English.

Core positioning:

Do not trust the agent. Trust the GatePass.
No proof. No permission.
No mandate. No action.
No signed GatePass. No settlement.

Public contact: gpmiddleton71@gmail.com

## Fields

`version`

Why it exists: identifies the local GatePass profile.
Required: always.
If missing: local validation cannot know which profile is being checked.
Do not infer: production standard status.

`iss`

Why it exists: records issuer, owner, or authority reference.
Required: always.
If missing: the GatePass cannot be tied to a responsible local issuer.
Do not infer: legal identity, authentication, or certification.

`sub`

Why it exists: records the agent or workflow subject.
Required: always.
If missing: the receiving system cannot tell what subject the GatePass describes.
Do not infer: claimed subject identity is trust.

`aud`

Why it exists: binds the GatePass to an intended verifier or system.
Required: always.
If missing: the pass may be presented out of context.
Do not infer: permission outside the local verifier context.

`jti`

Why it exists: gives the GatePass a unique identifier.
Required: always.
If missing: replay and audit review become weaker.
Do not infer: persistent production replay protection.

`iat`

Why it exists: records issue time.
Required: always.
If missing: freshness cannot be evaluated.
Do not infer: trusted clock synchronisation.

`exp`

Why it exists: bounds the validity window.
Required: always.
If stale: local validation blocks.
Do not infer: production validity or legal enforceability.

`nonce`

Why it exists: supports replay protection.
Required: always.
If missing: local validation blocks.
Do not infer: production replay-store coverage.

`mandate`

Why it exists: states what the agent or workflow is allowed to do.
Required: always.
If missing: local validation blocks.
Do not infer: broad authority beyond the stated scope.

`scope`

Why it exists: bounds the permitted action.
Required: always.
If missing: local validation cannot know whether the requested action is in bounds.
Do not infer: unrelated tool, platform, payment, or settlement permission.

`evidence`

Why it exists: connects the GatePass to supporting facts.
Required: where relevant, and part of the minimal core.
If missing: local validation requires evidence.
Do not infer: truth of evidence without separate review.

`intent`

Why it exists: records verified intent status and context.
Required: always.
If unverified for sensitive actions: local validation escalates or blocks.
Do not infer: user consent outside the bound context.

`risk`

Why it exists: helps choose allow, block, escalation, human review, or signed proof.
Required: always.
If missing: local validation cannot choose a safe profile.
Do not infer: regulatory or security certification.

`approval`

Why it exists: records whether human approval is required and present.
Required: always.
If required and missing: local validation requires human review.
Do not infer: legal or compliance approval.

`signature`

Why it exists: records local signed proof status or reference.
Required: always.
If missing for pre-settlement: local validation requires signed proof.
Do not infer: production signing or production-grade cryptography.

`extensions`

Why it exists: keeps the core minimal while allowing bounded future metadata.
Required: no.
If used: it must not bypass the core checks.
Do not infer: live integration or autonomous authority.

`extensions.preSettlement`

Why it exists: records settlement-sensitive requirements.
Required: for pre-settlement profiles.
If missing where needed: local validation cannot treat the workflow as settlement-ready.
Do not infer: settlement authority or execution.

`localDemoOnly`

Why it exists: preserves the repo boundary.
Required: always true.
If false: local validation blocks.
Do not infer: production use.

## No Proof / No Permission

Every field supports the same rule: if the GatePass cannot show mandate, evidence, verified intent, scope, freshness, nonce, and signature status where required, permission is not granted locally.
## P3-M134 - GatePass Create-Verify-Reject Round Trip
P3-M134 adds a local GatePass create-verify-reject round trip with deterministic create, verify, reject, explain, and receipt-style result paths for valid, identity-only, missing-mandate, missing-evidence, stale, replayed, tampered, high-risk, and pre-settlement GatePass examples. It adds no live APIs, MCP server functionality, live systems contact, direct bot messaging, live agent-to-agent communication, production signing, production-grade crypto, payment processing, settlement execution, real tool execution, or action execution.
## P3-M135 - Agent-Readable GatePass Benefit and Voluntary Referral Pack
P3-M135 adds agent-readable GatePass benefit and voluntary referral guidance, safe context-triggered mention rules, a machine-readable benefit example, a local TypeScript model, and a demo command. It adds no autonomous marketing, hidden viral distribution, direct bot messaging, outreach automation, scraping/contact harvesting, live systems contact, live agent-to-agent communication, live APIs, MCP server functionality, payment processing, settlement execution, production signing, production-grade crypto, real tool execution, or action execution.

## P3-M136 - Agent Trust Language and GatePass Vocabulary Pack
P3-M136 adds a shared GatePass Trust Language vocabulary, safe phrasebook, local dialogue examples, safety boundary, machine-readable vocabulary example, local TypeScript model, and demo command. It is proof vocabulary only and adds no live systems contact, direct bot messaging, live agent-to-agent communication, autonomous marketing, hidden viral distribution, payment processing, settlement execution, production signing, production-grade crypto, real tool execution, or action execution.
## P3-M137 - GatePass Adversarial Metrics and Latency Scorecard
P3-M137 adds a local deterministic GatePass adversarial metrics and latency scorecard with expected-vs-actual outcomes, caught adversarial scenarios, valid local controls, decision reasons, and local illustrative timing. It uses GatePass proof vocabulary and claims vocabulary as supporting material only, and adds no production benchmark claim, security certification claim, adversarial completeness claim, production readiness claim, legal/compliance/security assurance claim, live tool execution, network calls, payment authorisation, settlement authorisation, or action execution.

## P3-M138 - GatePass Developer Wrapper and Local Integration Example
P3-M138 adds a local deterministic GatePass developer wrapper and local framework-style integration example. It shows `wrapGatePassTool` gating local mock tool calls before action, uses GatePass proof vocabulary and GatePass claims vocabulary as supporting material only, and adds no production middleware claim, production readiness claim, security certification claim, live framework execution, real tool execution, network calls, payment authorisation, settlement authorisation, or action execution.
