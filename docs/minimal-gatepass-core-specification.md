# Minimal GatePass Core Specification

Agent Trust Gate(TM) is the project.
GatePass is the core proof primitive.

P3-M133 narrows the repo around a compact, local-first GatePass object that can sit before high-risk AI agent actions, sensitive tool calls, and pre-settlement workflows.

Core positioning:

Do not trust the agent. Trust the GatePass.
No proof. No permission.
No mandate. No action.
No signed GatePass. No settlement.

Core line:

No mandate. No evidence. No verified intent. No signed GatePass. No settlement.

Public contact: gpmiddleton71@gmail.com

## Purpose

This document defines the minimal local GatePass core profile used by Agent Trust Gate(TM).

The aim is to make GatePass simple enough to inspect, test, and reason about without spreading the project across too many separate concepts. ProofPackage, VerificationContract, enforceable tool gates, and pre-settlement blockers should support GatePass rather than replace it.

## Why GatePass Is Core

External reviewer feedback asked the project to stop expanding breadth and focus on the primitive that matters.

GatePass is that primitive:

- It is the compact decision/pass object.
- It binds claimed subject, issuer, audience, mandate, scope, evidence, intent, risk, approval, freshness, nonce, and signature status.
- It can be checked before a sensitive tool call.
- It can be checked before a settlement-sensitive workflow.
- It can be explained locally without granting live authority.

Claimed agent identity is not enough. The GatePass must carry the proof context needed for a receiving system to decide whether to allow, block, escalate, require evidence, require human review, or require signed proof.

## What GatePass Is

GatePass is a minimal, structured, local-first proof format for gated AI-agent workflows.

It may show locally that:

- a mandate reference exists;
- evidence is bound to the requested action;
- intent has been verified;
- the requested action is inside scope;
- approval is present where required;
- the GatePass is fresh and non-replayed;
- a signed proof reference exists where required;
- the local evaluation stayed inside safety boundaries.

## What GatePass Is Not

GatePass is not:

- a live API;
- an MCP server;
- a production signing system;
- production-grade cryptography;
- legal, financial, compliance, procurement, settlement, identity, authentication, or security certification;
- payment or settlement authority;
- permission to execute real tools;
- a universal agent standard;
- proof that an agent should be trusted everywhere.

## Minimal Field Set

The local minimal GatePass field set uses compact names:

- `version`: local GatePass profile version.
- `iss`: issuer, owner, or authority reference.
- `sub`: agent or workflow subject.
- `aud`: intended verifier or system.
- `jti`: unique GatePass identifier.
- `iat`: issued-at time.
- `exp`: expiry time.
- `nonce`: replay-protection value.
- `mandate`: what the agent or workflow is allowed to do.
- `scope`: boundaries of the permitted action.
- `evidence`: evidence references, hashes, or local references.
- `intent`: verified intent status and context.
- `risk`: risk tier or classification.
- `approval`: human approval status when required.
- `signature`: local signed proof reference or placeholder status.
- `localDemoOnly`: must be true in this repo.
- `extensions`: optional future-safe extension object.

The optional `extensions.preSettlement` object can carry settlement-sensitive metadata without bloating the core fields.

## Required Fields

The local core schema requires:

`version`, `iss`, `sub`, `aud`, `jti`, `iat`, `exp`, `nonce`, `mandate`, `scope`, `evidence`, `intent`, `risk`, `approval`, `signature`, and `localDemoOnly`.

The local model also requires live authority flags to remain disabled:

- `liveSystemsContact: false`
- `directBotMessaging: false`
- `autonomousOutreach: false`
- `liveAgentToAgentCommunication: false`
- `paymentAuthorisation: false`
- `settlementAuthorisation: false`
- `actionExecution: false`
- `productionCertification: false`

## Freshness And Replay

GatePass must be fresh and non-replayable. The minimal model checks:

- `exp` is not stale against a deterministic local reference time.
- `nonce` is present.
- `jti` identifies the GatePass.

This is a local model only. It does not create a production replay store.

## Relationship To ProofPackage

GatePass should remain compact.

ProofPackage carries broader supporting material: evidence detail, mandate detail, session context, issuer references, and proof material that may be too large for the GatePass itself.

## Relationship To VerificationContract

VerificationContract defines how a system checks GatePass plus ProofPackage against local requirements. GatePass is the object being judged; VerificationContract is the local checking rule.

## Relationship To Tool-Call Enforcement

The enforceable local tool gate can intercept a proposed tool call and require a GatePass before the mock tool would be allowed locally.

No real tool is executed by this repo.

## Relationship To Pre-Settlement Blocking

Pre-settlement workflows should require a signed GatePass. The local profile uses `extensions.preSettlement` to state that settlement-sensitive steps require a signed GatePass.

No signed GatePass. No settlement.

This repo does not execute settlement.

## Local-Only Boundary

P3-M133 is specification, schema, TypeScript modelling, examples, and tests only. It adds no live APIs, no live systems contact, no direct bot messaging, no live agent-to-agent communication, no payment processing, no real settlement execution, no production signing, no production key management, no real tool execution, and no action execution.

