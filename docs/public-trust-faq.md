# Agent Trust Gate Public Trust FAQ Draft

## Is Agent Trust Gate live?

No. It is currently a local-only, non-live, non-deployed project. The public trust page and FAQ are repository drafts, not published web pages.

## Does Agent Trust Gate perform actions itself?

No. It evaluates a structured proposed action and returns `ALLOW`, `BLOCK`, or `REQUEST HUMAN` with reasons and evidence. The caller remains responsible for deciding whether and how any action is executed.

## Can it approve money movement automatically?

No. Money movement is high risk and requires explicit approval under the current rules. Agent Trust Gate does not move money, process payments, create charges, or enable automatic purchase.

## Does it guarantee compliance?

No. It does not guarantee legality, truth, safety, compliance, security, accuracy, or zero harm. It does not provide SOC2, ISO27001, GDPR, PCI, or other certification and does not replace qualified legal or compliance review.

## Does it replace human approval?

No. High-impact actions can require a human decision. Approval must cover the exact proposed action, and an agent cannot approve itself. Gareth final approval is required before commercial launch or live activation.

## Does it store private customer data?

The current project does not provide production customer accounts or enable real customer-data collection. Local action descriptors, logs, receipts, and evidence may contain information supplied by the operator, so users must avoid unnecessary sensitive data and manage local files appropriately. No privacy or data-protection compliance is guaranteed.

## Can it be used by other agents?

Locally, developers can integrate through the gateway API, OpenAPI contract, SDK-style wrappers, Agent Manifest, and MCP-style examples. These interfaces return trust decisions and evidence only. No public endpoint, external agent contact, hosted registry, or autonomous invitation system is enabled.

## What is a trust receipt?

A trust receipt is a local evidence record of the proposed action and the gate's decision. It can include risk, reasons, policy context, approval requirements, request ID, and timestamp. It supports audit and review but does not prove legality, compliance, truth, safe execution, or outcome.

## What happens when an action is too risky?

The result is `BLOCK` or `REQUEST HUMAN`, depending on the rules and available approval. The calling system must not treat that result as permission to continue. Agent Trust Gate itself does not execute the action.

## Who makes the final decision?

The responsible human or organisation makes the final operational decision. For commercial launch or live activation of Agent Trust Gate, Gareth's final approval is required after technical, commercial, and legal review.

## Can it be connected to commercial systems yet?

Not as a live commercial service. Billing, payments, signups, tracking, outreach, public deployment, automatic purchase, and customer charging remain disabled. Readiness models and examples are planning artifacts only.

## Does it replace professional advice?

No. Agent Trust Gate does not replace legal, financial, compliance, security, medical, or other professional advice. Its output must be interpreted within the organisation's own governance and review processes.

## Can the trust page be published automatically?

No. Publication and deployment controls are false. Legal review and Gareth final approval are required before any future publication decision. This FAQ does not publish itself or create a public URL.
