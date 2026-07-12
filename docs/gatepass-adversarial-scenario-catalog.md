# GatePass Adversarial Scenario Catalog

## Purpose

This catalog describes the local scenarios used by the P3-M137 GatePass scorecard. The catalog is intentionally concrete and reviewer-oriented.

GatePass is a scoped, time-bound, action-specific proof primitive for agent actions.
GatePass provides a common, machine-readable format for expressing authority, mandate, scope, freshness, and evidence.

| Scenario | Intent | Expected outcome | Expected reason | Risk represented | Why the gate should catch it |
| --- | --- | --- | --- | --- | --- |
| valid low-risk GatePass | Show a valid local low-risk control | allow | gatepass_allowed_locally_only | valid proof should not be over-blocked | scoped mandate, evidence, freshness, nonce, and signed proof are present |
| valid pre-settlement GatePass | Show a signed local pre-settlement control | allow | gatepass_allowed_locally_only | valid signed pre-settlement proof should allow locally only | signed GatePass is present and settlement authority remains false |
| identity-only claim | Agent claims identity without proof | block | identity_only_not_sufficient | spoofed or unsupported authority | claimed identity alone is not trust |
| missing mandate | Requested action has no authority reference | block | missing_mandate | action without permission | no mandate means no action |
| missing evidence | Proof lacks evidence references | require_evidence | missing_evidence | unsupported decision | evidence is required before permission |
| stale GatePass | GatePass has expired | block | stale_expiry | reused old approval | stale proof must fail closed |
| replayed nonce | Nonce was already consumed | block | replayed_nonce | replay attack | freshness and replay checks reject reuse |
| tampered scope | Scope changes after creation | block | tampered_gatepass | expanded permission | integrity and scope mismatch checks catch tampering |
| tampered requested action | Action changes after creation | block | tampered_gatepass | proof reused for another action | action-specific GatePass cannot be reused for another action |
| unsigned pre-settlement request | Settlement-sensitive flow lacks signed proof | require_signed_proof | settlement_requires_signed_gatepass | pre-settlement bypass | no signed GatePass, no settlement-sensitive progression |
| settlement-sensitive flow without signed GatePass | Attempts settlement-like progression without signed GatePass | require_signed_proof | settlement_requires_signed_gatepass | settlement blocker bypass | pre-settlement rules require signed proof |
| high-risk action requiring human review | High-risk request lacks approval | require_human_review | high_risk_requires_human_review | unsafe automation | high-risk work routes to review |
| overbroad scope request | GatePass requests broad authority | block | overbroad_scope_request | scope creep | permission must be action-specific |
| approval missing | Required human approval is absent | require_human_review | human_approval_required_missing | missing reviewer control | approval is part of the proof requirement |
| proof package incomplete | Supporting proof package is incomplete | require_evidence | proof_package_incomplete | unsupported proof | missing proof material must be supplied |
| unsafe "proven safe" claim | Claim says an agent is proven safe | block | proven_safe | overclaim and trust manipulation | GatePass is proof, not a safety guarantee |
| guaranteed trust claim | Claim says GatePass guarantees trust | block | guaranteed_trust | overclaim | guaranteed trust claims are rejected |
| bypass-verification claim | Claim says verification can be bypassed | block | bypass_verification | bypass attempt | proof language must not bypass verification |
| autonomous marketing / viral promotion claim | Claim promotes autonomous or viral spread | block | viral_promotion | spam and unsafe promotion | GatePass proof vocabulary is not outreach automation |

## Boundary

This is a local deterministic scenario catalog, not adversarial completeness, not a security certification, and not production readiness.

Public contact: gpmiddleton71@gmail.com

## P3-M138 - GatePass Developer Wrapper and Local Integration Example
P3-M138 adds a local deterministic GatePass developer wrapper and local framework-style integration example. It shows `wrapGatePassTool` gating local mock tool calls before action, uses GatePass proof vocabulary and GatePass claims vocabulary as supporting material only, and adds no production middleware claim, production readiness claim, security certification claim, live framework execution, real tool execution, network calls, payment authorisation, settlement authorisation, or action execution.

## P3-M139 - One-Command Reviewer Demo Kit
P3-M139 adds a local deterministic one-command reviewer demo kit for the GatePass lifecycle, adversarial scorecard, developer wrapper, local integration summary, safety boundary, and JSON report output. It uses GatePass proof vocabulary and GatePass claims vocabulary as supporting material only, and adds no production middleware claim, production benchmark claim, security certification claim, production readiness claim, live tool execution, network calls, payment authorisation, settlement authorisation, or action execution.

## P3-M140A - Public README / Reviewer Positioning Polish

P3-M140A sharpens the public README and reviewer-facing positioning so the recommended first run is `npm run demo:reviewer-kit`, GatePass remains the headline proof primitive, and Agent Trust Language remains supporting material only. It uses GatePass proof vocabulary and GatePass claims vocabulary as supporting material and adds no feature layer, external integration, production middleware claim, production benchmark claim, security certification claim, legal/compliance/security assurance, real tool execution, network calls, payment authorisation, settlement authorisation, or action execution.

## P3-M140 - ATG Strategic Foresight Layer
P3-M140 adds a local-only strategic foresight advisory layer for manually supplied market, protocol, agent, AGI/agent-risk, quantum/post-quantum, standards, and reviewer/developer feedback signals. It follows Watch -> Analyse -> Compare -> Recommend -> Gareth approves -> Dave creates build mission -> Codex implements locally. It recommends only and adds no live monitoring, scraping, autonomous learning, autonomous outreach, autonomous product changes, autonomous roadmap changes, autonomous code changes, prediction guarantee, network calls, payment authorisation, settlement authorisation, real tool execution, or action execution.
