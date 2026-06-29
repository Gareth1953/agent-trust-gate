# Fee Metering Readiness Pack

## Fee Metering Readiness Status

Fee Metering Readiness is a pure local draft model for classifying events that could have future commercial value. Fee metering readiness does not mean live charging. The system only returns local draft metering events.

The system does not bill users. The system does not collect payment. The system does not settle funds. The system does not call external services. The system does not track real users.

## Purpose

Future agents may need receipt creation, receipt verification, clearing decisions, or RefusalGraph lookups. A commercial clearing system may eventually meter those machine-readable services before a separate billing system calculates charges.

This pack establishes stable local event and category vocabularies without recording a billable event, customer, account, usage ledger, tariff, invoice, payment, or settlement.

## Meterable Event Types

Supported draft event types are refusal signal creation, refusal lookup request/completion, clearing decision creation, clearing receipt creation, receipt verification request/completion, Agent Treaty creation, agent handshake request, and advantage review completion.

Each maps to a closed placeholder category. Unknown event types become `unknown_or_unmetered` and have fee readiness `not_enabled`.

## Input: Local System Event

Input declares a local event ID and type, optional source-object references, actor type, requested category, fee model/amount/currency placeholders, and timestamp. The engine does not copy actor or source-object identifiers. Arbitrary fee amounts and category text are discarded.

## Output: Local Metering Event

Output contains a deterministic metering ID, pseudonymous source event reference, safe event type/category, closed fee placeholders, fixed non-billable and non-operational flags, and draft timestamp/status.

`billable_event_recorded`, billing, payment, settlement, machine fee, external metering, tracking, analytics, network lookup, external lookup, and action execution are always false.

## Fee Placeholder Fields

Allowed fee models are `per_receipt_verification`, `per_refusal_lookup`, and `per_clearing_event`. Supported placeholder currencies are GBP, USD, and EUR. Amount output is only `placeholder_only` or `not_configured`; input amounts are never copied.

These fields describe a possible future commercial unit. They are not tariffs, offers, invoices, payment requests, or authorization to charge.

## Difference Between Metering, Billing, Payment, And Settlement

- metering classifies a potentially valuable event
- billing applies commercial terms and creates an amount owed
- payment transfers value through a provider or rail
- settlement finalizes value movement between parties

This pack performs none of those live functions. It creates an unpersisted placeholder event only.

## Private Data Boundary

The engine constructs output from an allowlist and pseudonymises source event IDs. It does not return real users, customers, companies, agents, accounts, wallets, receipt IDs, verification IDs, decisions, signals, lookups, documents, messages, endpoints, URLs, credentials, or raw fee text.

Future persistence requires purpose limitation, retention, deletion, access, correction, abuse prevention, privacy, security, and legal review.

## Future Fee Readiness

Future fee models could meter receipt verification, refusal lookup, clearance, or receipt generation. Before activation they require validated demand, pricing, customer ownership, entitlements, fraud controls, tax and legal review, payment security, monitoring, incident response, support, and Gareth approval.

## Future Agent Clearing House Use

A future clearing house could emit authenticated service events into a controlled usage ledger. A separate approved billing system could aggregate them under explicit commercial terms. Current events are not authenticated, persisted, billable, externally metered, or connected to any customer.

## Current Safety Blocks

Live fee metering, billable events, billing, payment, settlement, machine fees, external metering, tracking, analytics, public APIs/protocols, receipt networks, agent metering, deployment, publishing, signup, outreach, webhooks, third-party connections, live customer data, private-data export, automatic purchase, and action execution are disabled.

## Gareth Final Approval Gate

All live, commercial, network, payment, metering, billing, or settlement use requires Gareth final approval after technical validation, security and privacy review, legal review, and commercial validation.

The current decision is **BLOCKED: LOCAL FEE METERING PLACEHOLDERS ONLY**. Local code may classify supplied placeholder events in memory; it must not persist usage, track users, bill, charge, settle, connect, or execute.
