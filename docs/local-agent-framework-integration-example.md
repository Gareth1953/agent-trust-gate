# Local Agent Framework Integration Example

## Purpose

This page shows a LangGraph-style local integration pattern without importing
LangGraph or any external framework package. It is a framework-inspired local
adapter only.

## Pattern

1. A local agent step proposes a tool call.
2. The local adapter creates or receives a GatePass and proof package.
3. `wrapGatePassTool` intercepts the proposed call.
4. GatePass checks proof before the local mock tool is considered.
5. The wrapper returns an audit-style local result.
6. No live agent framework execution occurs.

## What The Demo Includes

- one allowed low-risk local mock tool call;
- one identity-only blocked call;
- one require-evidence result;
- one require-human-review result;
- one require-signed-GatePass result.

## Integration Boundary

This is a LangGraph-style local integration pattern, not a LangGraph dependency,
not an official LangGraph integration, not a production adapter, and not live
agent framework execution. There is no external network call, no live systems
contact, no direct bot messaging, no live agent-to-agent communication, and no
action execution.

Public contact: gpmiddleton71@gmail.com

## P3-M139 - One-Command Reviewer Demo Kit
P3-M139 adds a local deterministic one-command reviewer demo kit for the GatePass lifecycle, adversarial scorecard, developer wrapper, local integration summary, safety boundary, and JSON report output. It uses GatePass proof vocabulary and GatePass claims vocabulary as supporting material only, and adds no production middleware claim, production benchmark claim, security certification claim, production readiness claim, live tool execution, network calls, payment authorisation, settlement authorisation, or action execution.

## P3-M140A - Public README / Reviewer Positioning Polish

P3-M140A sharpens the public README and reviewer-facing positioning so the recommended first run is `npm run demo:reviewer-kit`, GatePass remains the headline proof primitive, and Agent Trust Language remains supporting material only. It uses GatePass proof vocabulary and GatePass claims vocabulary as supporting material and adds no feature layer, external integration, production middleware claim, production benchmark claim, security certification claim, legal/compliance/security assurance, real tool execution, network calls, payment authorisation, settlement authorisation, or action execution.

## P3-M140 - ATG Strategic Foresight Layer
P3-M140 adds a local-only strategic foresight advisory layer for manually supplied market, protocol, agent, AGI/agent-risk, quantum/post-quantum, standards, and reviewer/developer feedback signals. It follows Watch -> Analyse -> Compare -> Recommend -> Gareth approves -> Dave creates build mission -> Codex implements locally. It recommends only and adds no live monitoring, scraping, autonomous learning, autonomous outreach, autonomous product changes, autonomous roadmap changes, autonomous code changes, prediction guarantee, network calls, payment authorisation, settlement authorisation, real tool execution, or action execution.
