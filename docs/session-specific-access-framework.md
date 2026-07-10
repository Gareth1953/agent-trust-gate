# Session-Specific Access Framework

P3-M123 defines a local conceptual access framework for AI agent and agentic
browser sessions.

Core rule:

No mandate. No evidence. No verified intent. No signed gate pass. No settlement.

Core principle:

Claimed agent identity is not trust. Behaviour, mandate, evidence, verified
intent, and session context must decide access.

## Purpose

This framework shows how Agent Trust Gate principles could support future
pre-access or pre-session decisions for AI agent traffic. It is local concept
documentation only and does not monitor, classify, throttle, or block real
traffic today.

## Local Conceptual Outcomes

### Allow

Allow means the local concept model has a mandate, evidence, verified intent,
fresh context, acceptable behaviour, and low enough risk for the local demo.
It does not execute any action.

### Throttle

Throttle means the session may have some trust basis but behaviour or volume
suggests constrained access. In the local model, extractive high-volume
patterns can be throttled when mandate, evidence, and verified intent are
present but the session remains risky.

This is not real crawler throttling.

### Block

Block means the local model refuses the session conceptually. Spoofed identity,
conflicting intent, burst extraction, or unsafe context can block locally.

This is not real crawler blocking or website enforcement.

### Escalate

Escalate means the session should not proceed without more review or a clearer
mandate. Missing mandate on a sensitive session can escalate locally.

### Require More Evidence

Require more evidence means the session lacks fresh evidence, verified intent,
or freshness/nonce context. The model asks for evidence rather than trusting a
claimed agent name.

### Require Human Review

Require human review means the session is high-risk or sensitive even when
some trust inputs are present. The local model pauses the session conceptually
and routes it to human review.

## Same Identity, Different Outcomes

The same claimed agent identity may receive different outcomes:

- a referred, low-volume, fresh, in-scope documentation session may allow;
- a high-volume extractive session may throttle;
- a spoofed session with conflicting behaviour may block;
- a sensitive session without mandate may escalate;
- a high-risk workflow may require human review.

The difference is behaviour, mandate, evidence, verified intent, and session
context, not the claimed name.

## Local Model Fields

The local reference model uses:

- `claimedAgentName`;
- `claimedAgentType`;
- `claimedPurpose`;
- `mandateId`;
- `evidenceId`;
- `verifiedIntentStatus`;
- `sessionPattern`;
- `requestVolumeTier`;
- `behaviourSignals`;
- `riskTier`;
- `freshnessStatus`;
- `localDemoOnly`.

The model returns:

- `decision`;
- `reasons`;
- `localDemoOnly: true`;
- `liveTrafficMonitoring: false`;
- `botDetectionProduct: false`;
- `paymentAuthorisation: false`;
- `settlementAuthorisation: false`;
- `actionExecution: false`.

## How To Run The Local Demo

```powershell
npm run demo:session-intent
```

The command prints deterministic local examples only. It does not inspect
real browser sessions, live traffic, IPs, cookies, fingerprints, user data,
web logs, analytics, telemetry, payments, settlement, networks, or external
agents.

## Safety Boundary

P3-M123 is local reference modelling only. It does not add live APIs, MCP
server functionality, live traffic monitoring, real bot detection, crawler
blocking, browser fingerprinting, tracking, scraping, analytics, telemetry,
cloud/network calls, live agent-to-agent communication, payment processing,
settlement execution, production signing, AUC integration, Agent Contact
System integration, outreach automation, or action execution.

Public project contact: `gpmiddleton71@gmail.com`
