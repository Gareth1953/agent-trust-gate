# AI Agent Traffic and Session Intent Gate Concept

P3-M123 adds a local-only concept pack for AI agent traffic, spoofed agent
identity, agentic browser behaviour, and session-specific access decisions.

Core rule:

No mandate. No evidence. No verified intent. No signed gate pass. No settlement.

Core principle:

Claimed agent identity is not trust. Behaviour, mandate, evidence, verified
intent, and session context must decide access.

## Purpose

This concept pack explores how Agent Trust Gate principles may apply to future
pre-access and pre-session trust reasoning for AI agents and agentic systems.

It is concept documentation and local reference modelling only. Agent Trust
Gate is not a web bot detection product today. It does not monitor live
website traffic, classify real traffic, block crawlers, fingerprint browsers,
track users, scrape websites, or execute access-control decisions.

## Market Signal

Public market signal around AI agent traffic points to a practical problem:
organisations increasingly see automated sessions, agentic browsers, AI
crawlers, and tool-using agents interacting with public web surfaces. The
claimed identity of those sessions may be incomplete, spoofed, or unrelated to
the actual behaviour of the session.

The signal is useful because it shows a future trust problem adjacent to Agent
Trust Gate: before a session receives access, rate, workflow, or settlement
privileges, the system may need evidence of mandate, intent, behaviour, and
fresh session context.

This document does not claim that Agent Trust Gate currently solves live
traffic classification or bot detection.

## Why AI Agent Traffic Matters

AI agent traffic matters because agentic sessions can:

- read public pages at machine speed;
- operate through browsers or browser-like tools;
- claim to represent a user, platform, assistant, or buyer;
- shift from benign reading to extractive collection;
- enter sensitive workflows without a clear mandate;
- look similar to ordinary automation while carrying different intent.

The question is not only "What is this user agent string?" The trust question
is "What is this session trying to do, under whose mandate, with what evidence,
and within what context?"

## Spoofed AI-Agent Identity Problem

A session can claim a trusted agent name without proving that it is that
agent, that it has a mandate, or that the current behaviour matches the
declared purpose.

Weak signals include:

- user-agent strings;
- self-declared agent names;
- unverifiable purpose statements;
- unauthenticated headers;
- names copied from known tools or platforms.

These may be useful context, but they are not trust.

## Agentic Browser And Session Behaviour Problem

Agentic browsers can blend user-driven browsing, model-driven planning, and
tool-like automation in one session. A session may begin with a benign public
read and later attempt a sensitive workflow, high-volume extraction, or a
payment-like step.

A future trust gate may need to reason per session, not just per agent name.
The same claimed agent identity may deserve different outcomes depending on:

- mandate;
- evidence;
- verified intent;
- session pattern;
- request volume;
- freshness;
- risk tier;
- behaviour signals;
- whether the session context changed.

## Why Claimed Identity Is Not Trust

Claimed agent identity is not trust.

An allowlist by name alone is weak because names can be copied, spoofed, or
used outside their expected mandate. A future gate should not treat
`HelpfulAgent`, `KnownCrawler`, or any other declared name as sufficient.

The trust decision should depend on behaviour, mandate, evidence, verified
intent, freshness, nonce/session context, issuer/verifier references, and
risk.

## Future Agent Trust Gate Application

Agent Trust Gate principles may eventually apply before a session receives a
privileged path:

1. read claimed identity as an untrusted declaration;
2. check mandate and scope;
3. check evidence and provenance;
4. verify intent;
5. inspect session context and freshness;
6. evaluate behaviour signals;
7. produce a bounded allow/throttle/block/escalate decision;
8. record a local receipt or review artifact.

Any future live implementation would require a separate approved mission,
threat model, privacy review, abuse controls, legal/compliance review,
security review, and production architecture. P3-M123 does not add that.

## Pre-Access / Pre-Session Trust Gate Concept

The local concept is a pre-access or pre-session gate:

- before sensitive routes;
- before high-volume access;
- before agentic browser workflows;
- before payment-adjacent or settlement-like steps;
- before agent-to-agent handoff;
- before automated actions.

The gate asks whether the session has enough trust evidence for the requested
context. If not, it can require more evidence, throttle, block, escalate, or
require human review.

## Session-Specific Outcomes

The local model uses these conceptual outcomes:

- `allow`;
- `throttle`;
- `block`;
- `escalate`;
- `require_evidence`;
- `require_human_review`.

The same claimed agent identity can receive different outcomes across
different sessions. A low-volume referred documentation read with a fresh
mandate may be allowed locally. The same name used with conflicting behaviour
and burst extraction may be blocked.

## Local Reference Model

P3-M123 adds `src/session-intent-gate.ts`, a deterministic local model for
concept review.

Run the local demo:

```powershell
npm run demo:session-intent
```

The model is deterministic and local-only. It does not inspect real traffic,
connect to browsers, call bot-detection services, fingerprint clients, track
users, scrape websites, call networks, or execute actions.

## What Agent Trust Gate Is Not Doing Today

Agent Trust Gate is not doing these things today:

- not a web bot detection product;
- not live traffic monitoring;
- not real traffic classification;
- not crawler blocking;
- not browser fingerprinting;
- not user tracking;
- not scraping;
- not analytics or telemetry;
- not a live endpoint;
- not an MCP server;
- not live agent-to-agent communication;
- not payment or settlement authority;
- not production signing;
- not action execution.

## Relationship To P3-M122

P3-M122 made the repository easier for AI agents and systems to read safely.
P3-M123 uses that discovery layer to describe a future direction: AI agents
may read Agent Trust Gate today, but Agent Trust Gate does not let agents
operate it, call it as a live endpoint, negotiate with it, or gain autonomous
authority.

Readable now. Callable later. Autonomous execution never without gate control.

## Local-Only Concept Boundary

P3-M123 is concept documentation and local reference modelling only. It does
not add live APIs, MCP server functionality, live traffic monitoring, real bot
detection, crawler blocking, browser fingerprinting, real user tracking,
scraping, analytics/tracking pixels, forms, telemetry, cloud/network calls,
secrets, credentials, live agent-to-agent communication, external-agent
contact, autonomous contact, outreach automation, live payment processing,
PayPal API integration, Stripe integration, checkout, webhooks, wallet/banking
logic, real settlement execution, production signing, production key
management, AUC integration, Agent Contact System integration, or action
execution.

Public project contact: `gpmiddleton71@gmail.com`
