# Spoofed Agent Risk Model

P3-M123 adds a local-only risk model for spoofed AI agent identity and
session-specific trust reasoning.

Core rule:

No mandate. No evidence. No verified intent. No signed gate pass. No settlement.

Core principle:

Claimed agent identity is not trust. Behaviour, mandate, evidence, verified
intent, and session context must decide access.

## Purpose

This document frames the risk of relying on claimed AI-agent identity, user
agent strings, self-declared names, or unauthenticated headers.

It is a concept model only. Agent Trust Gate does not perform live traffic
monitoring, real bot detection, crawler blocking, browser fingerprinting,
tracking, scraping, or production access control today.

## Claimed Identity vs Verified Behaviour

Claimed identity is a declaration. Verified behaviour is an evaluated pattern
in a specific context.

A future trust gate should treat identity claims as one input, not as proof.
The decision should be based on:

- mandate;
- evidence;
- verified intent;
- session context;
- freshness;
- nonce or session-specific replay control;
- issuer/verifier references;
- behaviour signals;
- risk tier.

## Spoofed Trusted-Agent Examples

Local conceptual examples:

- A session claims `KnownReferralAgent` but performs burst extraction.
- A browser automation client claims user assistance but enters a sensitive
  workflow without a mandate.
- A crawler claims research purpose but lacks fresh evidence of scope.
- A session copies the name of a trusted platform agent while behaviour
  conflicts with the declared purpose.
- A session presents an old or stale proof context as if it still applies.

These examples are local risk patterns only. They are not live observations,
real traffic labels, or bot-detection claims.

## Why Name-Only Allowlisting Is Weak

Allowlisting by agent name alone is weak because:

- names can be copied;
- user-agent strings can be spoofed;
- intent can change during a session;
- a trusted agent in one context may be untrusted in another;
- high-volume or sensitive behaviour may exceed the original mandate;
- old evidence may be replayed into a new session.

The gate should ask what the session is doing now, not only what it calls
itself.

## Future Trust Gate Requirements

A future pre-session trust gate might require:

- `mandateId` proving the session has scope;
- `evidenceId` tying the session to local evidence;
- verified intent status;
- session context and behaviour pattern;
- freshness status;
- nonce or replay controls;
- issuer reference;
- verifier reference;
- risk tier;
- human review for high-risk sessions.

The P3-M123 local model represents these as deterministic local fields in
`src/session-intent-gate.ts`.

## Local Risk Outcomes

The local concept model can return:

- allow;
- throttle;
- block;
- escalate;
- require more evidence;
- require human review.

The same claimed agent identity can be allowed in one local session and
blocked in another because behaviour and session context differ.

## No Live Detection Claims

This risk model does not claim:

- real bot detection;
- live website protection;
- crawler blocking;
- browser fingerprinting;
- real user tracking;
- traffic classification;
- production access control;
- web security certification;
- legal, financial, compliance, procurement, settlement, bot-detection, or
  security guarantee.

It is local concept documentation only.

Public project contact: `gpmiddleton71@gmail.com`
