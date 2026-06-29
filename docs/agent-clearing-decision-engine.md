# Agent Clearing Decision Engine Pack

## Decision Engine Status

The Agent Clearing Decision Engine is pure, local-only, draft-only, in-memory logic. It combines a local clearing or handshake request, declared evidence, approval, identity, risk and payment-intent state, and an already-produced local RefusalGraph query result.

The engine only returns local draft clearing decisions. The engine does not execute actions. The engine does not perform network lookups. The engine does not move money. It is not a live clearing house, public API, protocol, payment rail, settlement service, or commercial system.

## Purpose

Agent communication alone does not establish authority, evidence, acceptable risk, human approval, clear payment intent, or trustworthy history. This engine provides deterministic fail-closed composition rules for those inputs before a future receiving system could separately decide whether to proceed.

The result is advisory governance output. It is not authorization, a legal agreement, proof of identity, proof of compliance, payment approval, or confirmation that an action occurred.

## Input: Agent Clearing Request

The request supplies a local request ID, placeholder requesting and receiving agent types, action category and type, optional proposed value and fee, requested decision, and timestamp. The engine does not trust agent claims or requested decisions and never copies agent types, values, fees, arbitrary fields, or raw text into output.

Request IDs are replaced with deterministic SHA-256-derived local pseudonyms. Categories and action types use closed vocabularies. Unknown values become `other` and fail closed.

## Input: RefusalGraph Query Result

The RefusalGraph input is a local query result with a caution level and matched-signal count. It is accepted as local context only when its status is `draft_only` and all private-data, network, external-lookup, and fee indicators are false.

The engine never performs the RefusalGraph lookup itself and does not return signal IDs, raw signal content, or reason text. Critical caution refuses the transaction; high caution requires human approval. Medium caution cannot produce `accept_with_limits`.

## Input: Evidence, Risk, and Approval State

Evidence must be complete, sufficient, verified, or hash-only. Agent identity must be locally verified. Protected actions require explicit approval. Payment, billing, settlement, purchase, or fee-related actions require clear declared payment intent.

Risk and impact are normalized. High or blocked risk and high impact remain approval-gated. A supplied approval applies only to the exact proposed action and does not authorize execution outside this draft decision.

## Output: Local Clearing Decision

Possible decisions are `accept_with_limits`, `require_more_evidence`, `require_human_approval`, `require_identity_verification`, `clarify_payment_intent`, `cap_spend_limit`, `refuse_transaction`, `keep_blocked`, `create_receipt_only`, and `draft_only_not_executed`.

The output contains only pseudonymous IDs, decision and control booleans, normalized RefusalGraph caution/count, safe reason codes, safe next steps, receipt recommendation, fixed privacy/lookup/payment/execution indicators, status, and timestamp.

Even `accept_with_limits` does not perform or authorize execution. It means only that the supplied local draft fields satisfy this narrow policy branch. Current policy, scoped human authority, downstream controls, and a separate execution system would still be required.

## Decision Priority Rules

1. Non-local or unsafe RefusalGraph metadata returns `keep_blocked`.
2. Critical RefusalGraph caution returns `refuse_transaction`.
3. High RefusalGraph caution returns `require_human_approval`.
4. Missing approval on high-impact or protected actions returns `require_human_approval`.
5. Missing or incomplete evidence returns `require_more_evidence`.
6. Missing or unclear identity returns `require_identity_verification`.
7. Unclear payment intent on a money action returns `clarify_payment_intent`.
8. Protected or high-impact actions without valid approval remain approval-gated.
9. Complete, verified, approved or approval-not-required low/medium-risk requests with no/low caution may return `accept_with_limits`.
10. Unknown or unresolved input returns `keep_blocked`.

Every branch recommends creation of a local receipt and records `draft_only_not_executed` as a required boundary.

## Private Data Boundary

The engine constructs a fresh output from an explicit allowlist. It does not identify or return real customers, companies, accounts, wallets, systems, agents, endpoints, URLs, email content, documents, credentials, payment details, proposed values, proposed fees, or arbitrary input fields.

Pseudonymisation is not a complete privacy guarantee. Persistence or sharing would require access, retention, deletion, correction, re-identification, security, privacy, and legal controls plus Gareth final approval.

## Future Clearing House Use

A future Agent Clearing House could combine a validated handshake, Agent Treaty, current evidence, local policy, RefusalGraph caution, and this decision to prepare a receipt. A separately secured and approved system could then enforce limits or request human review.

No current result can clear a transaction, connect agents, exchange receipts, move money, or execute an action. Future automation requires defenses against false declarations, stale refusal signals, manipulated evidence, replay, collusion, denial-of-service, and unreviewed automated refusal.

## Current Safety Blocks

Decision persistence, clearing network access, external lookup, public API and protocol, agent-to-agent lookup, machine-to-machine fees, payment, billing, settlement, tracking, signup, deployment, publishing, outreach, webhooks, third-party connections, live customer data, private-data export, automatic purchase, and action execution are disabled.

The engine does not trigger payment, billing, settlement, signup, tracking, deployment, publishing, outreach, webhooks, or third-party connections. It performs no file writes, network calls, fee logic, payment logic, settlement, publication, contact, or execution.

## Gareth Final Approval Gate

All live, commercial, network, persistent, or external use requires Gareth final approval after technical validation, security and privacy review, legal review, and commercial validation.

The current decision is **BLOCKED: LOCAL CLEARING DECISION DRAFT ONLY**. Tests and controlled local code may evaluate supplied draft objects in memory; no system may publish, persist, charge for, externally expose, or act on the result.
