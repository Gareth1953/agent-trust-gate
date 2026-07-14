# Embedded Commerce GatePass

P3-M144 adds a compact local demonstrator for a pre-checkout commerce trust gate.

The use case is an AI-generated shopping basket. Before checkout or payment authorisation, a verifier compares the final proposed basket with the buyer's original mandate, limits, substitution policy, delivery destination, approval state, freshness, nonce, and evidence.

Core position:

**No mandate. No evidence. No verified intent. No signed GatePass. No settlement.**

Commerce support line:

**No verified basket. No valid mandate. No current approval. No GatePass. No checkout.**

## Commercial Relevance

Embedded Commerce GatePass is a featured commercial application of Agent Trust Gate for organisations evaluating AI-created baskets and agent-assisted checkout controls. It is relevant to supermarkets, grocery retailers, general retailers, AI-shopping and agent platforms, payment and checkout providers, commerce infrastructure teams, retail-system architects, and AI governance or transaction-risk teams.

The current capability is still a local synthetic demonstrator. It shows the trust-control pattern; it does not connect to a retailer, shopping account, checkout system, payment provider, live API, A2A service, or MCP service.

## Emerging Trust Problem

Embedded commerce and agent-prepared baskets create a final-mile trust problem. A recommendation is not a basket. A prepared basket is not checkout. Checkout is not settlement. Settlement is not permitted merely because an assistant or workflow says the basket is ready.

The risk sits in the gap between the buyer's original intent and the final cart state:

- a product category may drift;
- a strict variant may change;
- a substitution may be outside policy;
- quantity, price, fees, or total may exceed limits;
- delivery destination or currency may change;
- approval may be missing, expired, or bound to an older basket;
- a request nonce may be replayed;
- evidence may be insufficient.

## Commerce GatePass Flow

The local demonstrator follows this flow:

1. Receive a synthetic buyer mandate.
2. Receive a synthetic approved basket snapshot.
3. Receive a final proposed basket.
4. Check merchant, products, variants, quantities, prices, fees, total, delivery reference, currency, approval, replay state, and evidence.
5. Emit either a commerce GatePass or a structured refusal receipt.

The GatePass is a local demo proof object only. It is not production signing, not payment authority, not checkout authority, and not settlement authority.

## Checks Performed

The TypeScript model evaluates:

- buyer mandate exists;
- mandate is active and not expired;
- merchant or merchant category is authorised;
- product categories match the mandate;
- strict product variants match the mandate;
- quantities remain within limits;
- per-item prices remain within limits;
- subtotal remains within cap;
- delivery, service, and other fees remain within limits;
- final total remains within cap;
- substitutions are allowed when substitutions occur;
- substituted products comply with substitution policy;
- delivery destination reference matches;
- currency matches;
- human approval is present when required;
- approval remains current;
- basket content has not changed since approval;
- merchant, basket, approval, request, and mandate identifiers are consistent;
- nonce has not been replayed;
- evidence is sufficient.

## Refusal Conditions

Any failed check produces a refusal receipt. The receipt records failed checks, refusal reasons, required next steps, and explicit no-checkout, no-payment-authorisation, and no-settlement-execution flags.

Synthetic scenarios include valid basket allowance, unauthorised substitution, wrong product variant, excess quantity, per-item price breach, total cap breach, unexpected fee, address-reference change, merchant change, currency change, expired approval, missing required approval, basket changed after approval, replayed nonce, and missing evidence.

The infant-formula-style fixture is synthetic and demonstrates strict variant and substitution controls only. It is not medical advice, clinical guidance, product safety assessment, or suitability guidance.

## How To Run

```powershell
npm run demo:commerce-gatepass
npm run demo:commerce-gatepass -- --summary-only
npm run demo:commerce-gatepass -- --json
npm run demo:commerce-gatepass -- --scenario unauthorised_substitution
```

The JSON mode prints valid JSON only.

## Current Status

This is a local deterministic demonstrator. It uses fictional merchants, generic synthetic products, synthetic delivery references, synthetic approvals, and synthetic evidence references.

It does not create or use live retailer APIs, shopping accounts, browser automation, external product fetching, price fetching, cart creation, checkout, payment links, card handling, payment tokens, wallets, banking logic, payment processing, settlement execution, network calls, A2A, MCP, npm publication, production signing, production-grade cryptography, or action execution.

## Design-Partner Opportunity

The public proposition may be discussed as a paid evaluation or design-partner pilot:

**We prove the trust architecture. The design partner funds the real integration.**

A funded pilot may evaluate mandate enforcement, basket integrity, substitutions, price and fee limits, approval freshness, merchant and destination checks, replay protection, and GatePass or refusal-receipt outputs using synthetic or sanitized inputs.

Real retailer, agent-platform, commerce-infrastructure, or payment-provider integration would require separate written scope, security review, data review, commercial terms, implementation work, and approval.
