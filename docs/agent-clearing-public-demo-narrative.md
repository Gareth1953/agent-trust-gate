# Agent Clearing House + RefusalGraph Public Demo Narrative

## Demo Narrative Status

This is a draft public narrative only. It is not published. It is not a live website. It is local planning material for explaining a local demonstration.

It does not activate tracking, analytics, signup, billing, payment, settlement, deployment, outreach, webhooks, or third-party connections. It does not execute agent actions. It does not perform network lookups. It does not expose private data.

## The Problem

AI agents will increasingly ask other agents and systems to do work, access data, call tools, publish content, make purchases, or accept transactions. Communication and payment rails can carry those requests, but carrying a request does not make it trustworthy.

## Why Agent Requests Need Clearing

An agent request may be unclear, high impact, missing evidence, missing approval, outside policy, or connected to risky behavior seen before. The receiving system needs a pre-action checkpoint that can accept with limits, refuse, block, or request stronger proof and human approval.

## What Agent Clearing House Does

Agent Clearing House is a future pre-action clearing and receipt layer. It evaluates a declared request against local risk, evidence, approval, identity, payment-intent, and refusal-intelligence signals before another system decides whether to proceed.

It does not replace the tool or service that would perform an action. It does not move money. It returns a clearing decision and a receipt describing what was checked.

## What RefusalGraph Adds

RefusalGraph is privacy-minimized negative trust intelligence. It records patterns from actions that were blocked, refused, limited, missing evidence, approval-required, or high risk.

Before an agent says yes, it can check who already said no - and why.

That differs from a reputation score based only on successful activity. RefusalGraph helps a receiving system understand what proof or approval was missing and what should remain blocked.

## The Local Demo Flow

The draft demonstration follows one local in-memory chain:

`request -> RefusalGraph caution -> clearing decision -> receipt -> local verification -> fee placeholder`

Every stage returns machine-readable output. No stage executes the requested action.

## Step 1: Agent Request

A placeholder agent declares an intended action, its category, risk and impact, evidence state, approval state, local identity state, and payment intent. Real customer identities and raw private content are not needed.

## Step 2: RefusalGraph Caution

The system queries only supplied local draft refusal signals. It counts similar refusal patterns and returns a caution level with normalized reason codes. No live RefusalGraph network or external lookup is used.

## Step 3: Clearing Decision

The local decision engine combines the request state with RefusalGraph caution. It may return `accept_with_limits`, request evidence or identity verification, require human approval, refuse, or keep the request blocked.

High-impact actions do not gain automatic approval from the demo.

## Step 4: Clearing Receipt

The system creates an unpersisted draft receipt describing the local decision, safe reasons, required next steps, approval state, and RefusalGraph caution. The receipt records that nothing was executed, paid, billed, settled, or networked.

## Step 5: Local Receipt Verification

The verification-readiness check confirms local structure, decision linkage, safe vocabularies, and disabled activity flags. This is not external verification and does not prove real-world identity, truth, legality, compliance, or payment.

## Step 6: Fee Metering Placeholder

The demo classifies verification as a possible future fee-relevant event. The event is placeholder-only and non-billable. It does not create a charge, invoice, payment, settlement, customer ledger, or machine-to-machine fee.

## Why This Is Different

Agent payment systems move value. Agent communication protocols exchange messages and capabilities. Agent Clearing House does neither. It supplies a draft clearing decision, receipt, and refusal-intelligence layer before a risky action is accepted.

Refusal intelligence is the differentiator: it helps agents learn what not to trust without requiring raw private records.

## Why Private Data Is Not Required

Signals and reports use normalized categories, reason codes, pseudonymous references, counts, hashes, and control states. They do not need customer names, emails, account numbers, wallet addresses, documents, credentials, endpoints, or message content.

Unknown or unsafe input values map to conservative safe defaults and are not copied into narrative output.

## What The Demo Does Not Do

The demo does not connect agents, operate a clearing network, expose a public API, publish content, deploy a website, collect signups, send outreach, track or analyse users, process payments, create bills, settle funds, call webhooks, connect third parties, or execute actions.

## Future Machine-to-Machine Fee Potential

A future approved service could charge a small fee for receipt verification, refusal lookup, or clearance checks. That is a possible commercial checkpoint because a receiving machine may value evidence that a request was checked before accepting risk.

No fee is enabled, recorded, billed, paid, or settled in this draft.

## Safety And Human Approval

High-impact actions require explicit human approval. Draft decisions and receipts do not authorize execution. Safety, privacy, legal, technical, and commercial reviews remain required before any external use.

## Current Status

All narrative, pipeline, verification, and fee materials remain local-only and draft-only. Public pages, publishing, deployment, tracking, analytics, signup, contact forms, billing, payment, settlement, fees, outreach, email, webhooks, third-party connections, public interfaces, agent networks, live verification, live metering, customer data, private-data export, automatic purchase, and action execution remain disabled.

## Gareth Final Approval Gate

Gareth final approval is required before any publication or commercial activation. Publication also requires explicit publication approval after technical, security, privacy, legal, and commercial review.

The current decision is **BLOCKED: DRAFT NARRATIVE ONLY**.
