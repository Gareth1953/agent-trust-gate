# RefusalGraph Local Query Engine Pack

## Query Engine Status

The RefusalGraph Local Query Engine is pure, local-only, draft-only, in-memory logic. It compares a proposed action query with a caller-supplied set of local draft refusal signals and returns a privacy-minimised caution result.

The engine does not execute actions. The engine does not perform network lookups. The engine does not expose private data. It is not a live RefusalGraph service, public API, external lookup system, reputation network, or commercial product.

## Purpose

Future agents and an Agent Clearing House may need to know whether similar action patterns previously encountered refusal, missing evidence, missing approval, unclear identity, or high risk. This engine establishes deterministic local matching and recommendation semantics without creating a network or trusting a result as authorization.

A caution result is advisory negative trust intelligence. It does not establish identity, guilt, legality, compliance, or permanent reputation. No match does not prove that an action is trustworthy.

## Input: Local Query

The query declares a local query ID, requested action category and type, risk and impact levels, evidence and approval status, agent identity status, and payment-intent status. Unknown action categories and types are reduced to `other`.

The result does not copy the supplied query ID. It returns a deterministic SHA-256-derived local pseudonym so an arbitrary identifier cannot carry customer, company, account, wallet, system, or agent information into the output.

## Input: Local Signal Set

The caller supplies an in-memory array of safe RefusalGraph signals. Only signals marked `draft_only` or `local_only` can match. The engine does not read files, databases, APIs, remote services, or the live RefusalGraph network because no such network is enabled.

Signals may contain additional source properties. Matching and aggregation inspect only allowlisted action, refusal, risk, evidence, approval, next-step, and status fields. Raw receipt text, evidence, identities, targets, endpoints, and private properties are ignored.

## Output: Caution Result

The allowlisted output contains a pseudonymous query reference, match status and count, caution level, frequency-ranked safe refusal reason codes, one recommended decision, deduplicated safe next steps, fixed privacy and lookup indicators, and `draft_only` status.

`private_data_included`, `network_lookup_performed`, `external_lookup_performed`, and `payment_or_fee_triggered` are always false. The result contains no permission, execution instruction, fee request, payment action, or external destination.

## Matching Logic

Action category must match after closed-vocabulary normalization. Action type also matches when both the query and signal provide a specific supported type; `other` acts only as an unavailable-type fallback. Non-draft signals are excluded.

Risk, evidence, approval, identity, payment intent, refusal types, and refusal reason codes affect caution and recommendation rather than identifying a person or organisation. Repeated reason codes within one signal count once. Across matched signals, codes are ranked by frequency and then alphabetically for deterministic output.

## Private Data Boundary

The engine does not identify real customers, companies, accounts, wallets, systems, or agents. It constructs a fresh output object from an explicit allowlist and never spreads query or signal objects into the result.

It does not return signal IDs, receipt IDs, raw reasons, evidence, names, email content, payment details, document text, URLs, endpoints, API keys, access tokens, or arbitrary properties. Pseudonymisation is not a complete privacy guarantee; persistence or sharing requires dedicated privacy, security, retention, and legal review.

## Decision Recommendation Types

- `create_receipt_only`: no match exists and the action is not clearly low risk.
- `allow_low_risk_only`: no match exists and both risk and impact are explicitly low; current policy checks still apply.
- `require_human_approval`: approval or high-risk money/purchase controls are needed.
- `require_more_evidence`: matched patterns indicate missing or incomplete evidence.
- `require_identity_verification`: agent identity remains weak or unclear.
- `clarify_payment_intent`: payment purpose or authority remains unclear.
- `cap_spend_limit`: reserved for future controlled spend policy; it never authorizes spending here.
- `refuse_transaction`: repeated high-risk matches require refusal.
- `keep_blocked`: the matched pattern remains blocked without a more specific safe next step.

Three or more high-risk local matches produce critical caution and `refuse_transaction`. A recommendation never executes or approves the proposed action.

## Future Clearing House Use

A future Agent Clearing House could combine a current handshake, Agent Treaty, evidence status, local policy, and RefusalGraph caution result. It could then recommend acceptance with limits, refusal, stronger proof, or human review and create a receipt.

That future use requires safeguards against stale data, false associations, re-identification, feedback loops, discrimination, manipulation, denial-of-service abuse, and unreviewed automated refusal. The current result is not a clearance decision and cannot bypass current evidence or human approval.

## Current Safety Blocks

Query persistence, RefusalGraph network access, external lookup, public API, agent-to-agent lookup, machine-to-machine fees, payment, billing, settlement, tracking, signup, deployment, publishing, outreach, webhooks, third-party connections, live customer data, private-data export, automatic purchase, and action execution are disabled.

The engine performs no file writes, network calls, external dependency calls, fees, payment logic, billing logic, settlement, publication, contact, or execution.

## Gareth Final Approval Gate

All live, commercial, network, persistent, or external use requires Gareth final approval after technical validation, security and privacy review, legal review, and commercial validation.

The current decision is **BLOCKED: LOCAL QUERY DRAFT ONLY**. Tests and controlled local code may query supplied draft signals in memory; no system may publish, persist, charge for, externally expose, or act on the result.
