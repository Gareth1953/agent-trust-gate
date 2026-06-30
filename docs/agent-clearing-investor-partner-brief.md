# Agent Clearing House + RefusalGraph Investor / Partner Brief

## Brief Status

This is a draft-only brief. It is not published. It is not outreach. It is not investment advice. It does not claim legal, financial, regulatory, compliance, or safety guarantees, and it does not activate any commercial system.

It does not execute actions, move money, perform network lookups, or expose private data.

## One-Sentence Summary

Agent Clearing House is a future pre-action clearing, refusal-intelligence, receipt, and verification layer for agent-to-agent requests before risky actions proceed.

## The Big Problem

As agents transact and delegate work, a request can be technically deliverable and payable while still being unclear, unauthorized, high risk, missing evidence, or outside policy. Communication and payment infrastructure do not answer the full trust question: should the receiving system proceed?

## Why Agent-to-Agent Commerce Needs Clearing

Agent commerce needs a checkpoint between intent and action. That checkpoint must evaluate risk, evidence, identity state, approval, payment intent, limits, and prior refusal patterns, then return a decision and receipt that another machine can understand.

## Why Communication Protocols Are Not Enough

Communication protocols help agents discover capabilities and exchange messages. They do not inherently decide whether a proposed action should be accepted, refused, limited, or escalated to a human.

## Why Payment Rails Are Not Enough

Payment rails move value and verify payment-related state. They do not establish that the underlying requested action is authorized, adequately evidenced, low risk, or consistent with local policy.

## What Agent Clearing House Does

The local architecture combines declared intent, local RefusalGraph caution, deterministic decision rules, a clearing receipt, local verification-readiness checks, and a non-billable fee placeholder. The output can accept with limits, request more evidence, require human approval, refuse, or remain blocked.

## What RefusalGraph Adds

Before an agent says yes, it can check who already said no - and why.

RefusalGraph captures privacy-minimized patterns from blocked, refused, limited, evidence-missing, approval-required, and high-risk actions. It is negative trust intelligence rather than a payment transfer, message protocol, or generic reputation score.

## Why Refusal Intelligence Could Become A Moat

Safe refusal patterns can improve the usefulness of future clearing checks as coverage grows. The advantage is not raw data volume; it is a structured vocabulary that explains recurring control failures without exposing private records. If agents rely on those checks before accepting risk, the signal layer becomes harder to replace.

This is a strategic hypothesis, not a guarantee of adoption, defensibility, or return.

## Current Local Demo Capability

The local demo runs a draft request through supplied refusal signals, a RefusalGraph caution result, clearing decision, unpersisted receipt, local verification-readiness check, fee placeholder, CLI output, readable report, and draft narrative. It uses no external service and executes no action.

## What Has Already Been Built

- pre-action trust decisions and approval/evidence records
- local gateway, OpenAPI, SDK, Agent Manifest, and MCP-style integration assets
- entitlement, usage, rate-limit, customer/tenant, billing/payment, and purchase-policy readiness
- agent handshake, RefusalGraph signal/query engines, and clearing foundation
- clearing decision, receipt, local verification-readiness, and fee-placeholder engines
- pipeline demo, CLI, human-readable report, and draft public narrative
- safety configs and regression tests that keep live/commercial flags disabled

## Future Commercial Fee Points

Potential fee points include clearing checks, receipt creation, receipt verification, refusal lookups, and machine-to-machine trust signals. Pricing, demand, customer ownership, billing terms, payment providers, tax, fraud, monitoring, incident response, and support all remain unvalidated or disabled.

No fee is active, billable, charged, paid, or settled.

## Private Data Boundary

The design favors normalized categories, reason codes, pseudonymous references, hashes, counts, and control states. It does not require raw customer names, emails, accounts, wallets, documents, credentials, endpoints, or message content for the local demonstration.

## Safety And Human Approval

High-impact actions require human approval. Draft decisions, receipts, reports, and briefs do not authorize execution. External use requires technical, security, privacy, legal, and commercial review.

## Current Disabled Capabilities

External sharing, publication, outreach, email, CRM, tracking, analytics, public pages, deployment, signup, contact forms, billing, payment, settlement, fees, webhooks, third-party connections, public interfaces, agent/clearing/receipt networks, live verification, live metering, billable events, customer data, private-data export, automatic purchase, and action execution are disabled.

## Strategic Differentiation

Project 3 should not compete as generic AI governance, another payment rail, or another agent messaging layer. Its sharper position is pre-action agent clearing plus privacy-minimized refusal intelligence and receipts that can be verified before risk is accepted.

## Future Roadmap

1. Validate whether developers and platforms experience the clearing problem.
2. Validate whether receipt verification and refusal lookup reduce measurable risk.
3. Define a narrow controlled pilot with human approval and no autonomous execution.
4. Complete production security, privacy, legal, monitoring, and incident controls.
5. Decide hosting, identity, customer ownership, pricing, billing, and payment architecture separately.
6. Keep all network and fee activation behind explicit final approval.

## Gareth Final Approval Gate

Gareth final approval is required before any external use, publication, outreach, partner sharing, commercial activation, deployment, billing, payment, or settlement. External sharing and publication also require their explicit approval gates.

The current decision is **BLOCKED: INTERNAL DRAFT BRIEF ONLY**.
