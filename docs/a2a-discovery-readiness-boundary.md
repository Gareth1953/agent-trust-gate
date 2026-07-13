# A2A Discovery Readiness Boundary

## Purpose

This document prevents machine-discovery metadata from being misread as an active A2A service.

## Current Boundary

A2A Agent Cards normally describe a real A2A server, endpoint, skills, and authentication model. Agent Trust Gate currently has no live A2A server and no live A2A endpoint.

The existing `agent-trust-gate.agent-card.json` is informational project metadata unless future repository evidence explicitly states otherwise. It must not be treated as an operational `/.well-known/agent-card.json` endpoint.

## What Must Not Be Published

Do not publish:

- a false operational endpoint;
- an active `/.well-known/agent-card.json` endpoint;
- an A2A server;
- A2A task handling;
- live skills;
- live messaging;
- remote agent communication;
- false protocol-conformance claims.

## Future Activation Requirements

Future A2A activation would require:

- explicit approved mission;
- endpoint security review;
- authentication design;
- protocol testing;
- human-governance review;
- clear public claims boundary;
- no payment, settlement, or action-execution authority without separate approved design.

## Safety Boundary

P3-M142 adds passive readiness documentation only. It adds no live A2A server, operational endpoint, direct bot messaging, live agent-to-agent communication, remote agent communication, autonomous contact, or action execution.
