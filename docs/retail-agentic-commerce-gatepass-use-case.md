# Retail Agentic Commerce GatePass Use Case

This note describes a generic retail-sector use case for Agent Trust Gate(TM).
It uses a fictional UK supermarket, fictional customer, fictional shopping
agent and synthetic basket values.

It does not describe any named retailer's current systems. It does not imply a
customer relationship, partnership, integration, endorsement or production
deployment.

## Controlled Agentic Basket-To-Checkout GatePass

As shopping assistants move from recommendations toward delegated customer
actions, a retailer may need an explicit trust decision before an agent moves a
basket toward checkout.

Agent Trust Gate can be evaluated as a local, protocol-agnostic decision layer
before a simulated high-impact retail action:

> Before an AI shopping agent moves from recommendation to a high-impact
> customer action, Agent Trust Gate verifies mandate, scope, value, evidence
> and approval.

An alternative concise expression is:

> No verified basket. No valid mandate. No current GatePass. No checkout.

These are proposed positioning statements for a synthetic design-partner
conversation, not claims about any live retailer.

## Fictional Scenario

Northbridge Grocers is testing a household shopping assistant in a local
non-production lab. A fictional customer has authorised a household agent to
prepare a weekly grocery basket, subject to:

- a current customer or account mandate;
- permitted action scope;
- a basket-value cap;
- product category and substitution constraints;
- required evidence about basket contents and policy checks;
- approval requirements for sensitive actions;
- action identity, nonce and freshness checks;
- GatePass validity and replay protection.

The local demonstration does not call a retailer app, checkout, payment rail,
loyalty account, customer database, external API or production endpoint.

## GatePass Decision

A valid local-demo GatePass can permit only the simulated next step. A refusal
receipt blocks the simulated next step and records the reason.

The local decision can check:

- mandate presence and expiry;
- action scope against the mandate;
- basket value against an authorised cap;
- required evidence presence and freshness;
- approval state;
- action and mandate matching;
- GatePass integrity and expiry;
- replay or mismatch conditions;
- refusal reason codes and audit evidence.

## Architecture Boundary

Agent Trust Gate remains positioned as:

- a policy-decision layer;
- a mandate and scope gate;
- an approval layer;
- a GatePass authorisation artefact layer;
- a refusal-receipt layer;
- an audit-evidence layer.

A retailer or its technology partners remain responsible for:

- customer identity and authentication;
- mobile and web applications;
- payment processing;
- checkout systems;
- customer databases;
- loyalty infrastructure;
- execution environments;
- network isolation;
- secrets management;
- fraud systems;
- runtime enforcement;
- legal and regulatory compliance;
- production monitoring.

Agent Trust Gate does not replace those systems.

## Synthetic Example Inputs

- [Permitted retail checkout example](../examples/retail-agentic-checkout-permitted.json)
- [Refused retail checkout example](../examples/retail-agentic-checkout-refused.json)

These examples reuse the existing local agent-action request shape. They are
documentation fixtures only and do not add a live retailer connector or a
competing pilot implementation.

## Related Material

- [End-to-end GatePass pilot](end-to-end-gatepass-pilot.md)
- [Commercial feasibility pilot](commercial-feasibility-pilot.md)
- [Pilot inputs, outputs and boundaries](pilot-inputs-outputs-boundaries.md)
