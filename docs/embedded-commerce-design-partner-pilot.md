# Embedded Commerce Design-Partner Pilot

P3-M144 adds an Embedded Commerce GatePass demonstrator for local deterministic basket verification before checkout.

This page describes a possible paid synthetic evaluation or design-partner scoping conversation. It does not promise production deployment, retailer access, payment integration, guaranteed commercial results, or legal/compliance/security certification.

## Who It Is For

The pilot may be relevant for:

- supermarkets and grocery retailers evaluating AI-assisted basket preparation controls;
- general retailers reviewing delegated basket and checkout-adjacent risk;
- AI-shopping and agent platforms exploring pre-checkout proof requirements;
- payment and checkout providers reviewing trust signals before payment authorisation;
- commerce infrastructure teams handling basket, checkout, approval, or settlement-adjacent workflows;
- retail-system architects designing mandate, basket, approval, and audit models;
- AI governance, trust and safety, or risk teams reviewing mandate enforcement.

## What A Paid Synthetic Evaluation Can Include

Subject to written agreement, a paid evaluation can include:

- mapping buyer mandates, basket snapshots, final basket fields, approval records, evidence references, and replay/nonce requirements;
- evaluating mandate enforcement, basket integrity, substitution controls, price and fee limits, approval freshness, merchant checks, delivery-destination checks, replay protection, and evidence sufficiency;
- running deterministic synthetic scenarios through the local commerce GatePass model;
- producing commerce GatePass examples for allowed synthetic baskets;
- producing structured refusal receipts for blocked synthetic baskets;
- documenting integration assumptions, missing evidence, and real-system data requirements;
- writing a short findings summary for design-partner planning.

Indicative Agent Trust Gate Paid Evaluation Pilot pricing remains available from **£1,500**, subject to scope and written agreement.

## Buyer Inputs Required

A scoped evaluation normally needs synthetic or sanitized descriptions of:

- mandate fields and approval rules;
- product category and variant restrictions;
- substitution policy;
- quantity, price, fee, subtotal, and final-total limits;
- merchant or merchant-category constraints;
- delivery destination reference model;
- currency rules;
- basket snapshot and final basket comparison requirements;
- evidence and audit requirements;
- replay or nonce expectations.

Do not send secrets, credentials, payment details, card data, wallet or banking details, customer records, regulated personal information, production logs, or confidential datasets in a first enquiry.

## Expected Outputs

Expected outputs may include:

- a local synthetic scenario pack;
- a deterministic report showing allowed and refused cases;
- commerce GatePass and refusal-receipt examples;
- a boundary note separating recommendation, basket preparation, checkout, payment authorisation, and settlement;
- an integration-readiness gap list for a future design-partner scope.

## Exclusions

The pilot does not include:

- live retailer integration;
- shopping-agent integration;
- named AI-provider integration;
- browser automation;
- real customer accounts;
- real addresses;
- real purchases;
- cart creation on external sites;
- live checkout;
- card handling;
- payment credentials or payment tokens;
- PayPal, Stripe, wallet, banking, webhook, refund, subscription, or settlement logic;
- live API, A2A, MCP, npm publication, production signing, or production cryptography;
- guaranteed prevention of incorrect purchases;
- guaranteed financial protection;
- legal, regulatory, medical, product-safety, fraud-prevention, compliance, or security certification.

## Real Integration Boundary

Real integration would require separate written scope, commercial agreement, security review, data review, architecture review, deployment plan, and human approval.

The current repository proves the trust-control architecture locally. It does not operate a live shopping platform, checkout service, payment service, settlement enforcement service, API, A2A service, MCP server, autonomous buying system, or hosted production product.

Public enquiry route: `gpmiddleton71@gmail.com`
