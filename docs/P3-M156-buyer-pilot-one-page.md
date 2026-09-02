# Agent Trust Gate™ — Controlled Buyer Pilot

## Working local pilot-ready prototype

Agent Trust Gate™ (ATG) checks whether one exact AI-agent action is authorised **before** it is allowed to proceed. It binds the proposed action to verified synthetic human authority, a bounded mandate, current agent standing, policy, evidence, time and a one-use nonce.

> ATG does not decide whether an AI agent is generally trustworthy. It decides whether this exact action is authorised to happen now under this exact human and organisational authority.

## The buyer problem

An agent may be authenticated and still propose the wrong supplier, amount, currency, scope or timing. General access control does not prove that the exact payload at the irreversible boundary matches the action a properly authorised person delegated. ATG adds a fail-closed decision and evidence boundary in front of that action.

## What a controlled pilot proves

A bounded pilot tests whether ATG can:

- allow a valid, in-scope action and issue a signed one-use GatePass;
- refuse an authority or mandate violation with an intelligible root cause;
- detect action alteration, invalid signatures, expiry and replay;
- produce an executive Trust Receipt and full machine-readable audit receipt that reconstruct the decision; and
- give the buyer a credible integration and operating model without touching production systems.

The current implementation is a local prototype using synthetic Northstar Retail Ltd data and deterministic test fixtures. It is not production software or an external security assessment.

## Safe pilot boundary

```text
BUYER-CONTROLLED TEST INPUTS
human/authority + agent standing + mandate/policy + exact proposed action
                            ↓
             ATG EXACT ACTION TRUST GATEWAY
        canonicalise → verify → PASS or REFUSE → evidence
                            ↓
             BUYER RETAINS EXECUTION CONTROL
```

The default pilot is **decision-and-evidence only**. ATG returns PASS/REFUSE, reason codes, an exact-action digest, a GatePass when permitted, and receipts. No buyer execution system is connected. The existing local adapter may demonstrate a strictly synthetic handoff; it cannot create a real order, payment or external action.

## Three pilot scenarios

| Scenario | Test | Expected evidence |
|---|---|---|
| Valid authorised action | Approved human and agent; exact action within amount, scope and time | `PASS`, GatePass, Trust Receipt, full audit receipt |
| Authority or mandate violation | Overspend, wrong authority, expiry or out-of-scope action | `REFUSE`, primary reason and relevant values, no GatePass, refusal receipt |
| Adversarial or replay attempt | Change the action after approval or reuse the one-use GatePass | execution authority invalid, tamper/replay reason, no valid downstream authority |

All inputs are synthetic or explicitly approved test data. The standard demonstration uses £23,750 within a £25,000 authority limit, a £31,000 overspend refusal, and a consumed-GatePass replay block.

## What the buyer provides

- one precisely bounded test workflow and accountable owner;
- synthetic or minimised test identities, authority rules and agent-standing records;
- test mandates, policies, action payloads and evidence freshness rules;
- a mapping from buyer fields to the ATG pilot contract;
- agreed success, abort, retention and incident-review rules; and
- if separately approved, a buyer-owned non-production sandbox. No sandbox is required for the default evaluation-only pilot.

No production credentials, payment tokens, bank details, live customer data or live execution endpoints are permitted.

## What the buyer receives

- PASS or REFUSE with structured reason codes;
- the canonical exact-action digest;
- a signed local-fixture GatePass only for fully allowed actions;
- Human Authority Proof and Agent Standing evidence references;
- an executive Trust Receipt for non-technical review;
- a full JSON audit receipt for future audit/SIEM/GRC mapping assessment; and
- reproducible scenario and test results.

No SIEM, GRC, ERP, procurement, payment or contract-system integration is claimed to exist.

## Success and stop conditions

Success means deterministic correct decisions across the agreed scenarios, detection of authority/standing/expiry/tamper/replay failures, understandable reasons, reconstructable evidence and documented integration burden. Evaluation latency is measured and reported on the agreed hardware with sample size and configuration; no unsupported performance target is asserted in advance.

The pilot stops immediately for an authority bypass, inconsistent decision, action-binding or replay failure, unexplained receipt mismatch, need for live credentials or money movement, inability to explain a refusal, or scope expansion beyond the agreed workflow.

## Approximate implementation steps

1. Complete the intake and select one bounded workflow.
2. Agree ownership, data classification, field mapping, scenarios, success criteria and abort rules.
3. Convert buyer-approved synthetic examples into the local pilot contract.
4. Run repeatable evaluation, refusal and adversarial tests locally.
5. Review executive and machine receipts with business, security and control owners.
6. Issue a written findings decision: stop, refine, or separately scope a buyer-sandbox adapter.

## Claims boundary

This package is ready to support a suitable organisation in a **bounded controlled buyer pilot**. That means a safe evaluation of a defined workflow; it does not mean production readiness, certification, regulatory approval, guaranteed compliance, guaranteed fraud prevention, live payment processing or commercial validation.

See the [readiness report](P3-M156-controlled-buyer-pilot-readiness-report.md), [test plan](P3-M156-pilot-test-plan.md), [intake checklist](P3-M156-pilot-intake-checklist.md), [responsibility matrix](P3-M156-pilot-responsibility-matrix.md) and [risk register](P3-M156-pilot-risk-register.md).
