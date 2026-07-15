# GitHub Discussion Draft: Technical Review Request

This is draft text Gareth can manually paste into a GitHub Discussion if
Discussions are enabled later. Do not post it automatically.

## Draft

Title:

```text
Technical review requested: Agent Trust Gate local GatePass pilot
```

Body:

Agent Trust Gate(TM) is a local demonstrator of a protocol-agnostic trust layer
that can sit before high-impact AI-agent actions, sensitive tools, deployments
or payment-style settlement operations.

It demonstrates a policy-decision layer, mandate and scope checks, approval
gating, GatePass authorisation artefacts, refusal receipts and local audit
evidence. It does not provide live payment processing, real settlement,
production endpoint enforcement, infrastructure isolation, live MCP proxying,
SSO, secrets management, legal certification or safety assurance.

Start here:
https://github.com/Gareth1953/agent-trust-gate/blob/main/TECHNICAL_REVIEW.md

Core local demo commands:

```powershell
npm run demo:gatepass-pilot -- --scenario permitted --summary-only
npm run demo:gatepass-pilot -- --scenario refused --summary-only
```

The permitted scenario requests 480 GBP, passes mandate, scope, spend, evidence
and approval checks, issues a local-demo GatePass and reaches simulated
settlement state permitted_to_proceed.

The refused scenario requests 875 GBP against a 500 GBP cap, does not issue a
GatePass, produces refusal evidence and blocks simulated settlement.

Critical review is welcome. Positive endorsement is not being requested.

Most useful questions:

1. Does the project purpose make sense within five minutes?
2. Does the fresh-clone runbook work?
3. Is the GatePass decision boundary technically clear?
4. Does the refused path block simulated settlement for the right reasons?
5. Are any claims overstated or ambiguous?
6. What would prevent real integration into an agent or payment workflow?

Please do not include credentials, private keys, customer data, exploit secrets,
confidential employer information or production-only details in a public reply.

## Boundary

This draft is not a publication action. It does not enable GitHub Discussions,
open an issue, contact reviewers, post to social media or create a release.
