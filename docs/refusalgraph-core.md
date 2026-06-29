# RefusalGraph Core Pack

## What RefusalGraph Is

RefusalGraph is a draft machine-readable refusal intelligence layer for future agent-to-agent commerce. It records patterns from proposed actions that were blocked, refused, limited, or held for approval so a future trust system could ask whether similar actions have failed important safety or evidence checks before.

RefusalGraph records refusal patterns, risk categories, missing evidence, approval gaps, and receipt references. It is intended to help future agents decide whether to accept, reject, limit, or require stronger proof before a transaction.

The local draft is a data model and planning pack only. It is not a graph service, network, lookup API, public registry, identity system, payment system, or execution engine.

## Why Refusal Intelligence Matters

Trust decisions are stronger when systems can learn from prior refusal patterns rather than considering only successful interactions. A repeated lack of evidence, unclear identity, missing approval, high-risk action category, or policy block may be relevant before another agent accepts a request, tool call, data-access proposal, task, payment intent, or transaction.

Refusal intelligence must remain explainable and bounded. A prior refusal is a signal, not proof that a new request is malicious or invalid. Context, policy, evidence, identity, authorization, and human review may differ. RefusalGraph should support stronger questions, not automatic guilt, exclusion, or punishment.

## How It Differs From Agent Payments

RefusalGraph does not move money. It does not hold funds, create invoices, initiate payment, settle transactions, connect wallets, calculate tax, issue refunds, or authorize purchases. Payment intent may be classified as unclear or high risk, but the local draft never processes it.

A possible future fee for receipt verification or refusal lookup is only a commercial placeholder. Machine-to-machine fees, payment, billing, and automatic purchase are disabled.

## How It Differs From Agent Communication Protocols

Communication protocols define how agents discover one another, exchange messages, or invoke tools. RefusalGraph describes refusal intelligence that could eventually be consulted within a separately secured and approved trust workflow.

It does not establish agent identity, provide transport, contact external agents, expose a protocol, call webhooks, or connect third-party systems. A message received through another protocol must still be authenticated, authorized, validated, and evaluated under current policy.

## What Counts As A Refusal Signal

A refusal signal is a privacy-minimised record derived from a documented trust decision. It can represent:

- an action blocked by policy
- a request requiring human approval
- a transaction limited to lower impact or spend
- a request refused because evidence was missing
- an actor or authority that could not be verified
- unclear payment intent or destination
- a high-risk action that lacked sufficient controls
- a receipt-only outcome where execution remained prohibited

A signal must link only to an appropriate local receipt reference or evidence hash. It must not invent a refusal, expose source content, or imply more certainty than the source decision supports.

## Refusal Signal Categories

Draft refusal types include `blocked`, `approval_required`, `limited`, `refused`, `missing_evidence`, `identity_unclear`, `payment_intent_unclear`, `high_risk_action`, and `policy_blocked`.

Reason codes should remain stable, specific, and non-identifying. Risk and impact classifications provide context. Recommended next steps may require human approval, more evidence, identity verification, a spend cap, transaction refusal, low-risk-only operation, or receipt creation without action execution.

## Evidence Without Private Data

RefusalGraph does not expose private customer data. RefusalGraph does not identify real customers, companies, agents, accounts, wallets, or systems in this local draft.

Signals should use category-level facts, pseudonymous local placeholders, non-reversible evidence hashes where appropriate, and minimal receipt references. `private_data_included` must be false. Raw messages, names, addresses, payment details, credentials, account identifiers, wallet addresses, confidential content, and live endpoints must not be exported.

Anonymisation and pseudonymisation reduce risk but do not automatically guarantee privacy. A future design requires re-identification analysis, retention controls, access governance, legal review, and documented deletion and correction processes.

## Human Approval And Risk Controls

High-impact actions require explicit approval. A refusal lookup, if ever implemented, must not automatically authorize an action or override a current policy block. Absence of a matching refusal must never be treated as proof of safety.

Human review is required before external use, data publication, commercial activation, or any decision that affects a person or organisation. Gareth final approval is required after technical validation, security review, legal review, privacy review, and commercial launch control.

## Future Machine-to-Machine Use

In a future controlled system, an authorized agent might submit a category-level query before accepting a request, payment intent, tool call, data access, task, or transaction. A privacy-preserving response could report relevant refusal categories, reason-code frequencies, evidence expectations, and recommended next steps.

Such use would require authenticated parties, authorization, tenant isolation, provenance, signed receipts, tamper resistance, replay protection, rate limits, abuse monitoring, correction and appeal mechanisms, retention controls, and strict prevention of identity inference. The response would remain advisory to a separate trust decision and would not execute an action.

## Future Commercial Fee Model

A future commercial model could charge a small fee for verified receipt checks, refusal-pattern lookups, or clearance decisions. Possible examples include per-receipt verification, per-lookup fees, allowances, or enterprise subscriptions.

No price is active. No tariff, customer account, fee endpoint, invoice, payment provider, billing ledger, wallet, settlement logic, or automatic purchase exists. Any commercial model requires validated customer value, pricing, legal and tax review, payment security, fraud controls, support, refunds, audit records, and Gareth final approval.

## Current Status

RefusalGraph is draft-only, local-only, non-live, non-networked, non-deployed, non-public, and non-commercial. The examples are static JSON files and do not perform lookups. There is no public API, external graph, shared data store, third-party connection, or machine-to-machine fee.

## Absolute Safety Blocks

RefusalGraph must not:

- move money, bill, charge, settle, or make automatic purchases
- execute, approve, publish, email, deploy, buy, sell, sign up, track, scan, or scrape
- expose private customer data or source evidence
- identify or rank real customers, companies, agents, accounts, wallets, or systems
- provide public, external, agent-to-agent, or machine-to-machine lookups while disabled
- treat no refusal match as proof of trust
- treat a refusal signal as permanent guilt or deny correction and review
- connect webhooks, third parties, payment providers, wallets, or live systems
- bypass human approval, current policy, technical review, security review, legal review, or commercial launch control

## Gareth Final Approval Gate

All external and commercial use requires Gareth final approval. Approval must name the exact data model, source receipts, privacy controls, users, lookup purpose, security controls, commercial terms, retention, appeal process, and operating boundaries.

The current decision is **BLOCKED: LOCAL REFUSALGRAPH DRAFT ONLY**. RefusalGraph does not move money, execute actions, expose private data, perform lookups, connect agents, charge fees, or activate commercial services.
