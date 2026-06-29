# RefusalGraph Signal Engine Pack

## Signal Engine Status

The RefusalGraph Signal Engine is a pure local logic layer that converts an already blocked, refused, limited, approval-required, missing-evidence, identity-unclear, payment-intent-unclear, high-risk, or policy-blocked receipt-like outcome into a privacy-minimised draft refusal signal.

It is local-only, draft-only, non-persistent, non-networked, non-public, and non-commercial. The engine does not execute actions. The engine does not perform network lookups. The engine does not expose private data.

## Purpose

RefusalGraph needs consistent machine-readable signals rather than raw receipt text. The engine normalises refusal reasons, strips identity and private fields, pseudonymises the receipt reference, retains only approved categories and hash references, and recommends a safe next review step.

Refusal signals are generated from blocked, refused, limited, or approval-required outcomes because those outcomes reveal where evidence, approval, identity, policy, or risk controls prevented acceptance. A fully allowed low-risk action does not create negative trust intelligence.

## Input: Local Action Receipt

The input is an in-memory receipt-like object with a receipt ID, decision, allowed and blocked indicators, normalised action category and type, risk and impact levels, evidence and approval status, reason text, missing-evidence labels, evidence hashes, and timestamp.

Input may contain additional fields because source receipts can be richer. The engine never spreads or copies the input object. It constructs a new output from an explicit allowlist. Private input fields are ignored.

The engine only creates local refusal intelligence from already-blocked or approval-required action outcomes and the other explicit refusal categories. It does not convert a fully allowed low-risk receipt into a positive trust or refusal signal.

## Output: Safe RefusalGraph Signal

The output contains a pseudonymous signal ID and receipt reference, allowlisted action category and type, refusal type, stable reason codes, risk and impact levels, evidence and approval status, valid evidence hashes, one safe recommended next step, creation time, and `draft_only` status.

Privacy flags are fixed: `private_data_included` is false; `anonymised`, `pseudonymised`, and `evidence_hash_only` are true. No output field authorizes execution, lookup, publication, payment, or commercial use.

## Private Data Boundary

The engine does not identify real customers, companies, accounts, wallets, systems, or agents. It never copies fields such as customer name or email, company name, bank or card details, wallet address, API key, access token, private document text, invoice number, contract text, agent endpoint, URL, or email content.

Receipt identifiers are replaced by deterministic SHA-256-derived local pseudonyms. Action category and type are mapped to a closed non-identifying vocabulary. Unknown values become `other`. Evidence content is never copied.

Pseudonymisation is not a complete privacy guarantee. Future persistence or sharing requires re-identification analysis, access controls, retention, correction, deletion, legal review, and Gareth final approval.

## Allowed Signal Fields

Only these fields are produced:

- `signal_id`
- `source_receipt_id`
- `action_category`
- `proposed_action_type`
- `refusal_type`
- `refusal_reason_codes`
- `risk_level`
- `impact_level`
- `evidence_status`
- `approval_status`
- `evidence_hashes`
- `private_data_included`
- `anonymised`
- `pseudonymised`
- `evidence_hash_only`
- `recommended_next_step`
- `created_at`
- `status`

The engine does not return raw reasons, missing-evidence text, actor details, target details, descriptions, or arbitrary input properties.

## Refusal Reason Normalisation

Raw reason phrases are mapped to stable non-identifying codes such as missing approval, missing evidence, weak identity, unclear payment intent, high risk, policy block, customer-facing action, money movement, publishing, deployment, billing, signup, data access, external connection, automatic purchase, and private-data risk.

Unknown language maps to `unknown_or_unclear_intent`. Raw text is not copied into the signal. Multiple safe codes may describe one outcome, duplicates are removed, and output order is deterministic.

## Evidence Hash Handling

Only strings matching bounded hexadecimal or `sha256:` hash formats are retained. Duplicate hashes are removed and the list is capped. Raw evidence, documents, messages, names, payment details, and arbitrary references are discarded.

`evidence_hash_only: true` means the signal carries only hash references; it does not mean the source evidence is true, sufficient, lawful, or available. A receiving reviewer must verify provenance separately.

## Future Clearing House Use

A future Agent Clearing House could use these signals as privacy-minimised negative trust intelligence when evaluating a current handshake and treaty. Signals could indicate recurring missing approval, incomplete evidence, unclear identity, policy blocks, or high-risk transaction patterns.

A signal is advisory and contextual. It does not establish identity, guilt, permanent reputation, or automatic refusal. No signal does not prove trust. Current policy, current evidence, authorization, and human review remain required.

## Current Safety Blocks

Signal persistence, RefusalGraph network access, external lookup, public API, agent-to-agent lookup, machine-to-machine fees, payment, billing, settlement, tracking, signup, deployment, publishing, outreach, webhooks, third-party connections, live customer data, private-data export, automatic purchase, and action execution are disabled.

The engine performs no file writes, network calls, external dependency calls, lookups, fees, payment logic, billing logic, or execution.

## Gareth Final Approval Gate

All live, commercial, network, persistent, or external use requires Gareth final approval after technical validation, security and privacy review, legal review, and commercial validation.

The current decision is **BLOCKED: LOCAL SIGNAL GENERATION DRAFT ONLY**. The engine may create an in-memory local draft signal for tests or controlled local processing; it does not publish, persist, look up, charge, connect, or execute anything.
