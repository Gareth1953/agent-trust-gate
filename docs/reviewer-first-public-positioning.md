# Reviewer-First Public Positioning

## Public reviewer summary

Agent Trust Gate™ is a local-first proof-of-concept for checking whether an AI
agent has enough scoped proof before a sensitive action. Its core primitive is
GatePass: a scoped, time-bound, action-specific proof object for agent actions.

GatePass provides a common, machine-readable format for expressing authority,
mandate, scope, freshness, and evidence.

## Reviewer run order

1. Run the one-command reviewer kit.
2. Inspect the GatePass lifecycle.
3. Inspect the adversarial scorecard.
4. Inspect the developer wrapper.
5. Read the limitations and claims boundary.
6. Use the public contact email only for human-reviewed follow-up.

## Recommended first command

```powershell
npm run demo:reviewer-kit
```

Summary and JSON modes:

```powershell
npm run demo:reviewer-kit -- --summary-only
npm run demo:reviewer-kit -- --json
```

## Secondary demo commands

```powershell
npm run demo:gatepass-round-trip
npm run demo:gatepass-scorecard
npm run demo:gatepass-wrapper
```

## How to read the project without overclaiming

Read each result as local deterministic proof-of-concept evidence. The demos
show local create, verify, reject, scorecard, and wrapper behavior. They do not
show production middleware, real tool execution, real payment processing, real
settlement execution, production signing, security certification, or a legal /
compliance guarantee.

## What technical reviewers should examine

- Whether GatePass is simple enough to inspect and verify.
- Whether invalid proof fails closed in local examples.
- Whether the scorecard makes expected outcomes clear.
- Whether `wrapGatePassTool` is understandable for a developer.
- Whether the local safety flags remain explicit.

## What commercial reviewers should examine

- Whether a paid technical review could focus on a concrete workflow risk.
- Whether a local pilot discussion should examine mandate, evidence, intent,
  approval, freshness, nonce, scope, and signed GatePass requirements.
- Whether the project avoids promising production deployment or automatic
  paid-pilot acceptance.

## What should not be inferred

Do not infer production readiness, production benchmark performance, certified
security, legal/compliance/security guarantee, proven-safe status, guaranteed
trust, live integration readiness, real payment readiness, real settlement
readiness, automatic access after payment, or action execution authority.

Public contact: `gpmiddleton71@gmail.com`.

## P3-M140 - ATG Strategic Foresight Layer
P3-M140 adds a local-only strategic foresight advisory layer for manually supplied market, protocol, agent, AGI/agent-risk, quantum/post-quantum, standards, and reviewer/developer feedback signals. It follows Watch -> Analyse -> Compare -> Recommend -> Gareth approves -> Dave creates build mission -> Codex implements locally. It recommends only and adds no live monitoring, scraping, autonomous learning, autonomous outreach, autonomous product changes, autonomous roadmap changes, autonomous code changes, prediction guarantee, network calls, payment authorisation, settlement authorisation, real tool execution, or action execution.
