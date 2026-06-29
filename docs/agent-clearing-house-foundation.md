# Agent Clearing House Foundation Pack

## What The Agent Clearing House Is

The Agent Clearing House is a future clearing and decision layer for agent-to-agent transactions. It would evaluate whether an agent request should be accepted, refused, limited, or require stronger proof before any separately controlled action occurs.

The foundation combines Agent Trust Gate decisions, Agent-to-Agent Handshakes, RefusalGraph refusal intelligence, draft Agent Treaty terms, and Agent Receipts. The current pack defines how those concepts fit together. It does not provide a service, network, API, payment rail, settlement system, or execution engine.

The Agent Clearing House does not execute actions. The Agent Clearing House does not publish, email, buy, sell, bill, deploy, sign up users, track users, or make purchases.

## Why Agents Need A Clearing Layer

Agents can exchange messages and request actions, but communication alone does not establish identity, authority, evidence, acceptable risk, approval, or enforceable limits. A clearing layer creates a checkpoint where declared intent, requested permission, evidence, risk, prior refusal patterns, and proposed terms can be evaluated consistently.

A clearing outcome should help the receiving system decide whether to accept with limits, refuse, block, require approval, request evidence, verify identity, check refusal intelligence, or create a receipt without execution. It must fail closed when material facts are missing.

## How It Differs From Agent Communication

Agent communication protocols transport messages, advertise capabilities, and invoke tools. The Agent Clearing House evaluates the trust and governance conditions around a proposed transaction. It does not discover agents, establish a public protocol, route messages, call webhooks, or connect third-party systems.

A message or capability claim is an input to verification, not proof of identity, safety, authority, or reliability.

## How It Differs From Agent Payments

The Agent Clearing House does not move money. It does not charge fees, hold funds, create invoices, connect wallets, execute payment, settle transactions, calculate tax, issue refunds, or purchase services.

Payment intent, proposed value, and a possible verification fee can be declared as draft treaty fields. They remain non-executing context for policy and approval. Payment, billing, settlement, and machine-to-machine fees are disabled.

## How It Uses Agent-to-Agent Handshakes

The handshake presents the requesting agent's claimed identity, purpose, proposed action, target, impact, requested permissions, evidence, approval state, and prior receipt references. The clearing layer validates the declaration against current policy and determines what additional checks are needed.

A handshake does not mean automatic trust and cannot bypass human approval. Disabled handshake, network, external connection, or execution flags are hard blocks.

## How It Uses RefusalGraph

RefusalGraph provides negative trust intelligence from blocked, refused, limited, approval-required, identity-unclear, and missing-evidence action patterns. A future authorized clearance check could use privacy-minimised refusal categories and receipt references to ask stronger questions about a similar request.

RefusalGraph does not determine guilt, identity, or permanent reputation. No match does not prove trust, and a match does not automatically refuse a new request. Live RefusalGraph lookup is disabled; only local draft references are used in this pack.

## Agent Treaty Concept

Agent Treaty defines the proposed machine-to-machine agreement before action. It describes the parties as local placeholders, requested action, permissions, evidence, value and fee intent, risk, approval, clearance requirement, completion terms, dispute terms, expiry, and status.

The treaty is a machine-readable proposal, not a legal contract or execution authorization. It does not bind real parties, transfer value, connect agents, or execute terms. A treaty can be refused, limited, revised, expired, or held for human review.

## Agent Receipt Concept

Agent Receipt records the decision, evidence status, limits, approval state, and refusal or clearance outcome. It may include the handshake and treaty identifiers, risk, reasons, missing evidence, required next steps, relevant local refusal references, policy version, receipt status, and timestamp.

A receipt proves only what the clearing logic evaluated and returned. It does not prove identity, legality, compliance, payment, execution, completion, or outcome. Receipt exchange is disabled and a receipt must never execute an action.

## Clearance Decision Types

Draft outcomes include:

- `accept_with_limits`
- `refuse`
- `block`
- `approval_required`
- `require_more_evidence`
- `require_identity_verification`
- `require_refusalgraph_check`
- `create_receipt_only`
- `draft_only_not_executed`

Every current outcome is a local draft output. Even `accept_with_limits` would describe policy conditions only and would not execute or settle the transaction.

## Future Machine-to-Machine Fee Model

A future commercial model could charge a small fee for clearance checks, receipt verification, refusal lookups, or signed decision evidence. A possible model is per clearance or receipt verification, potentially combined with allowances or subscriptions.

No fee is active. No tariff, customer account, billing ledger, payment provider, settlement rail, wallet, checkout, invoice, tax process, refund process, or automatic purchase exists. Any future fee requires validated demand, commercial terms, legal and tax review, payment security, fraud controls, monitoring, incident response, and Gareth final approval.

## Current Status

The Agent Clearing House is draft-only, local-only, non-live, non-networked, non-deployed, non-public, and non-commercial. The Agent Treaty and Agent Receipt are concepts and static examples. There is no public API, public protocol, external agent connection, live customer data, receipt exchange, RefusalGraph lookup, fee collection, payment, billing, or settlement.

## Absolute Safety Blocks

The Agent Clearing House must not:

- move money, charge fees, bill, settle, or make purchases
- execute, approve, publish, email, buy, sell, deploy, sign up, track, scan, or scrape
- expose private customer data or export source evidence
- connect external agents, third parties, webhooks, public APIs, or protocols
- perform live RefusalGraph lookups while disabled
- treat a handshake, treaty, receipt, refusal signal, or no-match result as automatic trust
- permit agent self-approval or bypass exact-scope human approval
- create legally binding terms or imply payment completion
- enable commercial use from a draft config, example, readiness score, or placeholder approval

## Gareth Final Approval Gate

All live external use requires Gareth final approval. Approval must follow technical validation, security and privacy review, legal review, commercial validation, and Commercial Launch Control. It must specify the exact participants, protocol, data, treaty semantics, receipt guarantees, RefusalGraph use, fees, support, retention, appeal, monitoring, and incident controls.

The current decision is **BLOCKED: LOCAL AGENT CLEARING HOUSE DRAFT ONLY**. The Agent Clearing House does not move money, execute actions, publish, email, buy, sell, bill, deploy, sign up users, track users, make purchases, connect agents, perform lookups, or collect fees.
