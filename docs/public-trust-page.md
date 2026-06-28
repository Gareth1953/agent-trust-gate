# Agent Trust Gate Public Trust Page Draft

## What Agent Trust Gate Is

Agent Trust Gate is a pre-action governance and receipt layer for AI agent actions. It evaluates proposed actions before they happen and returns a clear result: `ALLOW`, `BLOCK`, or `REQUEST HUMAN`.

It is designed for developers, businesses, procurement teams, compliance teams, future agent platforms, and cautious human decision makers who need a visible control point before an AI-enabled system takes a high-impact action.

## Why It Exists

AI agents can prepare or propose actions faster than people can review them. Some actions are routine and reversible. Others may publish information, contact customers, create commitments, affect regulated work, expose data, or move money.

Agent Trust Gate exists to place an explicit governance boundary between an agent's proposal and any real-world execution. It helps humans and organisations inspect risk, require approval, and retain evidence before deciding what happens next.

## The Problem It Solves

Without a pre-action checkpoint, an agent workflow may move directly from intent to execution with incomplete context or weak accountability. Agent Trust Gate gives the calling system a deterministic decision, reasons, policy context, request ID, and evidence record before the caller acts.

The gate does not make an unsafe system safe by itself. The caller must respect blocked and human-review decisions and must remain responsible for execution, authorization, accuracy, and outcomes.

## What It Checks Before Agent Action

Agent Trust Gate evaluates a structured description of the proposed action. Depending on the configured local policy, it can consider:

- whether the action is public or externally binding
- whether it affects customers or users
- whether it moves money or creates financial impact
- whether it is legal, compliance, or policy sensitive
- whether it has a rollback plan
- whether explicit human approval exists
- whether local usage, entitlement, or rate-limit controls apply
- whether required evidence is present

The result reflects the supplied description and deterministic local rules. Agent Trust Gate does not independently prove that input data is complete, truthful, authorized, or current.

## Human Approval Gate

High-impact actions can be blocked or marked `REQUEST HUMAN`. Approval must relate to the exact proposed action. A prior approval does not grant general authority, and an agent cannot approve itself.

Human approval remains mandatory for actions whose impact, policy, or risk requires it. Gareth final approval is required before commercial launch or live activation of Agent Trust Gate itself.

## Evidence and Receipts

Agent Trust Gate creates evidence-backed receipts. A trust receipt records the described action, decision, risk level, policy profile, approval requirement, reasons, request identifier, and timestamp. Approval packs, human review records, and evidence bundles can add a local audit trail around important decisions.

Receipts support review and accountability. They do not prove that an action was legal, safe, truthful, compliant, executed correctly, or free from harm. They are not a substitute for independent records, professional review, or proper authorization.

## What Agent Trust Gate Does Not Claim

Agent Trust Gate does not guarantee legality, truth, safety, compliance, security, accuracy, or zero harm. It does not authenticate real-world identities and does not certify SOC2, ISO27001, GDPR, PCI, or any other legal, regulatory, or security standard.

It does not replace legal, financial, compliance, security, medical, or other professional advice. Organisations remain responsible for their decisions, systems, data, permissions, and obligations.

## What Agent Trust Gate Will Never Do Automatically

Agent Trust Gate must not autonomously publish, email, charge, buy, sell, sign up users, deploy, scan live targets, or move money. It must not activate billing, payment processing, tracking, outreach, public binding, or automatic purchase from a readiness report, receipt, agent request, or placeholder approval.

The gate returns decisions and evidence. It does not execute the proposed action.

## Current Status

Agent Trust Gate is currently local-only, non-live, non-deployed, and not commercially launched. This trust page is a draft document in the repository. It is not a live website, has no public URL, and includes no signup, contact, analytics, tracking, billing, or payment capability.

Public release requires the Commercial Launch Control Pack, technical validation, commercial validation, legal review, explicit human approval, and Gareth final approval. Those conditions are not currently complete.

## Trust Commitments

- Keep the default state local, blocked, and non-executing.
- Make high-impact approval requirements explicit.
- Preserve request IDs, reasons, policy context, and evidence where available.
- Do not log raw API keys.
- Keep payment, billing, automatic purchase, outreach, signup, tracking, scanning, and public deployment disabled until separately reviewed and explicitly approved.
- Describe limitations without legal, compliance, safety, or security overclaims.
- Keep humans responsible for final high-impact decisions and live activation.

## Example Use Cases

- A developer asks whether an agent-generated public post needs human approval.
- A business checks a proposed customer email before a system sends it.
- A procurement team reviews how a future agent platform would record trust decisions.
- A compliance team inspects approval evidence for a policy-sensitive action.
- An agent platform requests a local trust decision before proposing a financial action.
- A cautious operator blocks deployment or publication because launch controls remain disabled.

These examples describe evaluation and evidence only. Agent Trust Gate does not send the email, publish the post, move money, deploy software, or perform the reviewed action.

## Final Human Control Statement

Humans retain final authority. Agent Trust Gate may evaluate proposed agent actions, prepare materials, and create evidence-backed receipts, but it must not perform high-impact actions or activate commercial/public capabilities automatically. Gareth final approval is required before any commercial launch or live activation.
