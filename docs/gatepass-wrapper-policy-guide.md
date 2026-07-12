# GatePass Wrapper Policy Guide

## Purpose

GatePass wrapper policies define what proof is required before a local mock tool
call can be allowed.

## Policy Concepts

- low-risk local action: may allow locally when mandate, scope, evidence,
  freshness, nonce, and local safety flags are present;
- customer-facing action: usually requires evidence and human approval;
- data export: requires explicit mandate, evidence, scope, nonce, and review;
- high-risk action: requires human review;
- settlement-sensitive action: requires a signed GatePass.

## Proof Requirements

Policies can require:

- mandate reference;
- evidence reference;
- verified intent;
- human approval;
- signed GatePass;
- freshness and expiry;
- nonce/replay protection;
- exact scope match.

If proof is missing or stale, the wrapper returns `block`, `require_evidence`,
`require_human_review`, or `require_signed_proof`. It does not execute a real
tool.

Public contact: gpmiddleton71@gmail.com

## P3-M139 - One-Command Reviewer Demo Kit
P3-M139 adds a local deterministic one-command reviewer demo kit for the GatePass lifecycle, adversarial scorecard, developer wrapper, local integration summary, safety boundary, and JSON report output. It uses GatePass proof vocabulary and GatePass claims vocabulary as supporting material only, and adds no production middleware claim, production benchmark claim, security certification claim, production readiness claim, live tool execution, network calls, payment authorisation, settlement authorisation, or action execution.

## P3-M140A - Public README / Reviewer Positioning Polish

P3-M140A sharpens the public README and reviewer-facing positioning so the recommended first run is `npm run demo:reviewer-kit`, GatePass remains the headline proof primitive, and Agent Trust Language remains supporting material only. It uses GatePass proof vocabulary and GatePass claims vocabulary as supporting material and adds no feature layer, external integration, production middleware claim, production benchmark claim, security certification claim, legal/compliance/security assurance, real tool execution, network calls, payment authorisation, settlement authorisation, or action execution.

## P3-M140 - ATG Strategic Foresight Layer
P3-M140 adds a local-only strategic foresight advisory layer for manually supplied market, protocol, agent, AGI/agent-risk, quantum/post-quantum, standards, and reviewer/developer feedback signals. It follows Watch -> Analyse -> Compare -> Recommend -> Gareth approves -> Dave creates build mission -> Codex implements locally. It recommends only and adds no live monitoring, scraping, autonomous learning, autonomous outreach, autonomous product changes, autonomous roadmap changes, autonomous code changes, prediction guarantee, network calls, payment authorisation, settlement authorisation, real tool execution, or action execution.
