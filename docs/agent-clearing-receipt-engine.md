# Agent Clearing Receipt Engine Pack

## Receipt Engine Status

The Agent Clearing Receipt Engine is pure, local-only, draft-only, in-memory logic. It converts a supplied local Agent Clearing Decision into a privacy-minimised machine-readable receipt.

The receipt engine only returns local draft receipts. The receipt engine does not execute actions. The receipt engine does not perform network lookups. The receipt engine does not move money. It does not persist, exchange, publish, externally verify, or charge for receipts.

## Purpose

A clearing decision is easier to audit when its outcome, control requirements, RefusalGraph caution, and non-execution state are captured in a stable receipt. A future agent-to-agent clearing system could use receipts to demonstrate what local policy evaluated at a point in time without claiming that the requested action occurred.

Receipts support traceability and review. They do not prove that source claims were true, identity was real, evidence was valid, approval was authorized, payment occurred, or an external system obeyed the decision.

## Input: Agent Clearing Decision

The input is a local clearing decision with source IDs, decision, allowed/blocked state, approval/evidence/identity/payment-intent requirements, spend-limit recommendation, RefusalGraph caution and match count, normalized reasons and next steps, safety indicators, status, and creation time.

Only `draft_only` or `local_only` decisions with all private-data, network, external-lookup, fee, and execution indicators false are treated as safe local sources. Other inputs fail closed to `draft_only_not_executed`.

## Output: Agent Clearing Receipt

The engine returns a deterministic local receipt ID and pseudonymous source references. It records the normalized decision and controls, RefusalGraph caution and count, filtered reason and next-step codes, verification and receipt status, and fixed safety indicators.

`verification_status` is `not_verified_externally`. `receipt_status` and `status` are `draft_only`. Receipt persistence, settlement, billing, machine fees, payment, lookup, and execution are always false.

## Receipt Fields

Allowlisted fields include receipt type and ID, pseudonymous decision/request references, decision and control booleans, RefusalGraph caution/count, safe reasons and next steps, receipt/verification status, fixed privacy and operational safety flags, and creation time.

Reason codes and next steps use closed vocabularies. Duplicates are removed. Unsupported reason text maps only to `unknown_or_unclear_intent`; unsupported next steps map only to `draft_only_not_executed`. Raw text is never copied.

## Receipt vs RefusalGraph Signal

A clearing receipt records one local decision, its stated control context, and non-execution outcome. A RefusalGraph signal is narrower negative trust intelligence derived from blocked, limited, refused, or approval-required outcomes.

A future process might derive a privacy-minimised refusal signal from an eligible receipt. The receipt itself is not a reputation record, network lookup, public claim, identity assertion, or automatic refusal instruction.

## Private Data Boundary

The engine constructs a new output from an explicit allowlist. It does not copy real customers, companies, agents, accounts, wallets, endpoints, URLs, email content, documents, credentials, payment details, invoices, contracts, arbitrary reason text, or other input properties.

Source IDs are replaced with SHA-256-derived local pseudonyms. Pseudonymisation is not anonymisation or a complete privacy guarantee. Persistence or exchange requires retention, access, deletion, correction, re-identification, security, privacy, and legal controls plus Gareth final approval.

## Future Verification Use

A future controlled verifier could check receipt schema, policy version, signatures, evidence hashes, source-decision integrity, freshness, and revocation. A receipt could support audit, dispute handling, or a paid verification check.

None of those capabilities exist here. `not_verified_externally` means no external authority, network, signature service, customer, counterparty, or clearing system verified the receipt.

## Future Clearing House Use

A future Agent Clearing House could issue signed receipts after an authorized clearing decision and exchange them under a validated Agent Treaty. RefusalGraph could consume eligible privacy-reviewed refusal outcomes, while agents could verify receipts before deciding whether to proceed.

Future micro-fees for clearance, refusal lookup, or receipt verification require commercial validation, payment security, legal and tax review, fraud controls, monitoring, incident response, and Gareth final approval. No fee, payment, billing, or settlement is triggered now.

## Current Safety Blocks

Receipt persistence and external verification, clearing network access, external lookup, public API and protocol, agent-to-agent lookup, machine-to-machine fees, payment, billing, settlement, tracking, signup, deployment, publishing, outreach, webhooks, third-party connections, live customer data, private-data export, automatic purchase, and action execution are disabled.

The receipt engine does not trigger payment, billing, settlement, signup, tracking, deployment, publishing, outreach, webhooks, or third-party connections. It performs no file writes, network calls, fee logic, verification calls, publication, contact, or execution.

## Gareth Final Approval Gate

All live, commercial, network, persistent, verification, exchange, or external use requires Gareth final approval after technical validation, security and privacy review, legal review, and commercial validation.

The current decision is **BLOCKED: LOCAL CLEARING RECEIPT DRAFT ONLY**. Tests and controlled local code may create an unpersisted receipt in memory; no system may publish, exchange, verify externally, charge for, or act on it.
