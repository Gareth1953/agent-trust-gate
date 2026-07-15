# Retail GatePass Buyer Guide

This guide helps a retail technology, product or governance team assess whether
Agent Trust Gate(TM) is relevant to a future delegated-shopping workflow.

It is generic and public-safe. It does not name or target a specific retailer.

## When It May Be Relevant

Agent Trust Gate may be worth evaluating when a shopping or commerce agent can
prepare, modify or advance an action that affects:

- basket value;
- product substitutions;
- restricted or sensitive product categories;
- customer approval;
- account authority;
- checkout-adjacent state;
- audit or dispute evidence.

The core question is whether a separate pre-action decision is needed before the
agent moves from advice toward a high-impact customer action.

## Buyer Questions

Ask:

1. Which agent actions are permitted, refused or escalated?
2. What mandate proves that the customer or account allowed the action?
3. What value cap applies to the basket or action?
4. Which substitutions are allowed, restricted or blocked?
5. What evidence must be present before the action proceeds?
6. When is explicit approval required?
7. How long should a GatePass remain valid?
8. What prevents replay, stale basket use or action mismatch?
9. What audit evidence is needed when the action is refused?
10. Which production responsibilities remain outside Agent Trust Gate?

## Evidence To Review

Useful Agent Trust Gate evidence includes:

- [Independent technical review entry point](../TECHNICAL_REVIEW.md)
- [End-to-end GatePass pilot](end-to-end-gatepass-pilot.md)
- [Independent reviewer runbook](independent-reviewer-runbook.md)
- [Technical review feedback framework](technical-review-feedback-framework.md)
- [Retail agentic commerce GatePass use case](retail-agentic-commerce-gatepass-use-case.md)
- [Retail design-partner feasibility pilot](retail-design-partner-feasibility-pilot.md)

## Decision Boundary

Agent Trust Gate should be treated as a pre-action decision and evidence layer.
It can demonstrate local GatePass or refusal artefacts, but it does not provide
customer authentication, checkout execution, payment processing, fraud
guarantees, legal certification, production monitoring, secrets management or
endpoint enforcement by itself.

## Public-Safety Boundary

Do not share credentials, customer records, payment data, loyalty records,
private keys, production logs, confidential supplier data or security-sensitive
details in public review channels.

Any real retailer review should start with synthetic or sanitised examples and
clear written boundaries.
