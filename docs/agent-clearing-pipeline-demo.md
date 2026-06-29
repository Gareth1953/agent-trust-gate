# Agent Clearing Pipeline Demo Pack

## Pipeline Demo Status

The Agent Clearing Pipeline Demo is a pure, local, in-memory composition of existing draft engines. It is not a live pipeline, clearing network, API, protocol, commercial service, or execution path.

The pipeline demo does not execute actions. The pipeline demo does not perform network lookups. The pipeline demo does not move money. The pipeline demo only returns local draft pipeline results.

## Purpose

The demo shows how RefusalGraph caution intelligence can flow into an Agent Clearing House decision, receipt, local verification check, and fee-readiness placeholder. It proves local contract compatibility without activating a service or repeating the underlying engine logic.

## Pipeline Steps

1. Accept a supplied local draft clearing request and local refusal signals.
2. Build and run a local RefusalGraph query.
3. Create a local clearing decision from request state and query caution.
4. Create an unpersisted local clearing receipt from that decision.
5. check the receipt with local verification-readiness logic.
6. Create a non-billable fee-metering placeholder, or mark metering `not_enabled`.

Each stage returns an allowlisted draft object. No stage performs the proposed action.

## Input: Local Clearing Request

Input contains a local pipeline ID, a draft clearing request, supplied draft refusal signals, a fee-placeholder request flag, and a timestamp. Request fields cover action category/type, risk, impact, evidence, approval, local identity state, payment-intent state, and requested decision.

Actor labels, raw request IDs, source signal IDs, private fields, arbitrary values, and evidence content are not copied to the pipeline output.

## Step 1: Local RefusalGraph Query

The demo builds a query from allowlisted request state and calls `queryRefusalGraphSignals` with only the supplied local signal list. Matching, caution, refusal reason aggregation, and recommendations remain local. No RefusalGraph network or external lookup is used.

## Step 2: Local Clearing Decision

The request and local caution result are passed to `createAgentClearingDecision`. High-risk, incomplete, unclear, or approval-gated requests fail closed according to the decision engine rules. The decision does not authorize execution.

## Step 3: Local Clearing Receipt

The decision is passed to `createAgentClearingReceipt`. The receipt uses pseudonymous references, safe reason and next-step codes, and fixed false execution, network, payment, billing, settlement, persistence, and machine-fee flags.

## Step 4: Local Receipt Verification Readiness

The receipt is passed to `verifyAgentClearingReceiptLocal`. A locally valid result means only that the supplied draft receipt has the expected local structure, linkage, vocabulary, and safe flags. It is not externally verified and cannot establish real-world truth, identity, legality, payment, or execution.

## Step 5: Local Fee Metering Placeholder

The verification result is passed to `createFeeMeteringEvent`. If placeholder metering was requested, the output remains non-billable and `placeholder_only`. If it was not requested, fee readiness and fee fields become `not_enabled` or `not_configured`.

No fee is charged, recorded as billable, paid, billed, or settled.

## Output: Local Pipeline Result

Output contains the five nested stage results plus fixed false pipeline-level indicators for action execution, network/external lookup, payment/fee, billing, settlement, machine fee, tracking, analytics, and private data.

`pipeline_status` is `draft_only_completed`. Completion means the local pure functions returned; it does not mean the requested action was accepted or executed.

## Private Data Boundary

The orchestrator constructs output from an allowlist, and each nested engine independently uses an allowlist. It does not expose real customers, companies, accounts, wallets, agents, emails, documents, endpoints, URLs, credentials, payment data, or raw evidence.

Live customer data, private-data collection, private-data export, persistence, and external verification remain disabled.

## Current Safety Blocks

The pipeline demo does not trigger payment, billing, settlement, signup, tracking, analytics, deployment, publishing, outreach, webhooks, or third-party connections. Live pipelines, clearing networks, external lookup, public APIs/protocols, agent-to-agent pipelines, receipt networks, live/external receipt verification, live/external fee metering, billable events, machine fees, automatic purchase, and action execution are disabled.

## Future Agent Clearing House Use

A future controlled clearing service could apply authenticated inputs, policy ownership, persistence, signed receipts, abuse controls, monitoring, incident response, and explicit authorization around this sequence. None of those live capabilities are active here.

## Future Fee Readiness

Future commercial validation may assess whether clearing, receipt, verification, or RefusalGraph services justify a fee. This demo records no customer, usage ledger, tariff, invoice, billable event, payment, or settlement.

## Gareth Final Approval Gate

All live, commercial, network, payment, verification, metering, billing, or settlement use requires Gareth final approval after technical validation, security and privacy review, legal review, and commercial validation.

The current decision is **BLOCKED: LOCAL IN-MEMORY PIPELINE DEMO ONLY**.
