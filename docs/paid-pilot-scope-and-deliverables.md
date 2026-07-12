# Paid Pilot Scope And Deliverables

P3-M141 defines the practical scope for an **Agent Trust Gate(TM) Paid Evaluation Pilot**.

This is a local, controlled, non-production evaluation scope only. It does not create live APIs, hosted services, payment processing, settlement execution, production signing, or action execution.

Core rule:

**No mandate. No evidence. No verified intent. No signed GatePass. No settlement.**

## Included Activities

A scoped pilot may include:

- reviewer kit walkthrough;
- GatePass create, verify, reject, and explanation review;
- adversarial scorecard review;
- local developer wrapper review;
- local mock sensitive-action scenario mapping;
- mandate, evidence, intent, approval, scope, value-limit, and GatePass validity review;
- refusal reason and trust-receipt output review;
- written findings if included in the agreed scope.

## Buyer Inputs Required

The buyer should provide only non-sensitive evaluation information:

- organisation or project name;
- general use case;
- proposed agent or workflow type;
- proposed action categories;
- desired evaluation outcome;
- known high-level safety or governance concerns.

Do not provide credentials, private datasets, customer records, payment details, secrets, production logs, wallet details, banking details, private keys, regulated personal information, or confidential material in the first enquiry.

## Evaluation Stages

1. **Scope check** - confirm the local evaluation question and safety boundary.
2. **Reviewer kit run-through** - use the one-command reviewer kit as the first technical view.
3. **Local scenario mapping** - map proposed actions to GatePass controls and refusal reasons.
4. **Wrapper review** - inspect how local mock actions can be gated before action.
5. **Pre-settlement review, if relevant** - confirm where a signed GatePass would be required before settlement-sensitive steps.
6. **Findings summary** - document local observations, gaps, boundaries, and next steps.

## Expected Outputs

Expected outputs may include:

- local evaluation notes;
- GatePass control mapping;
- refusal reason summary;
- local audit/trust-receipt review notes;
- developer integration observations;
- non-production pilot findings;
- recommended next safe evaluation steps.

## Exclusions

The pilot excludes:

- production deployment;
- production middleware;
- production signing or key management;
- live APIs;
- MCP server functionality;
- network or cloud calls from this repo;
- real tool execution;
- action execution;
- real payment processing;
- PayPal API integration;
- Stripe integration;
- checkout;
- payment links;
- webhooks;
- wallet or banking logic;
- real settlement execution;
- legal, financial, compliance, procurement, settlement, identity, authentication, or security certification;
- automatic acceptance;
- automatic access after payment.

## Human Approval Requirements

Every scope, price, timetable, deliverable, data boundary, and payment method must be agreed by a human in writing. A commercial enquiry, agreed invoice, or external payment does not override the GatePass safety boundary and does not grant deployment, access, payment activation, settlement authority, production signing, or action execution.

## Completion Criteria

A paid evaluation pilot is complete when the agreed local evaluation activities and written outputs have been delivered under the agreed scope. Completion does not mean production readiness, certification, integration success, legal approval, security approval, compliance approval, or settlement readiness.

## No-Production-Use Boundary

All P3-M141 material is for local evaluation only. The pilot is not a production system, payment system, settlement system, hosted service, security certification, legal/compliance assurance, or autonomous action controller.
