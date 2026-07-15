# Public Technical Review Invitation

Agent Trust Gate(TM) is a local demonstrator for checking whether a proposed
agent action has a valid mandate, scope, evidence, approval state and GatePass
before a simulated settlement step.

The project explores a narrow trust-control problem: agent systems can propose
actions that affect money, deployments, customers, contracts or sensitive
tools, but the final action still needs to be checked against the authority the
human or organisation actually gave.

## What The GatePass Is For

A GatePass is a local-demo authorisation artefact. In this repository it records
that a proposed action passed the mandate, scope, value, evidence and approval
checks required by the local scenario.

It is not production signing, legal evidence, payment authority, settlement
authority, infrastructure enforcement or assurance that a real-world action is
safe.

## What Refusal Receipts Are For

A refusal receipt records why the proposed action should not proceed. The
refused P3-M145 scenario demonstrates a request that exceeds the authorised
value cap and is blocked before simulated settlement.

The refusal path is as important as the permitted path. Reviewers should assess
whether the blocking reasons are specific, inspectable and technically useful.

## Simulated Settlement Boundary

The settlement adapter is local and simulated. It does not call a payment rail,
banking system, wallet, retailer, external API, MCP server, agent endpoint or
production service. It permits a simulated settlement state only when the local
GatePass is valid for the scenario.

## Useful Reviewers

Feedback would be useful from:

- independent developers;
- security engineers;
- agent-system builders;
- payment and settlement infrastructure specialists;
- platform and runtime architects;
- AI governance and risk reviewers;
- developer-experience reviewers.

## Criticism Especially Welcome

Please look for:

- unclear setup instructions;
- fresh-clone failures;
- ambiguous GatePass or refusal boundaries;
- overstated claims;
- missing failure cases;
- weak evidence or audit output;
- security assumptions that are too broad;
- integration assumptions that would not survive a real customer environment;
- production responsibilities that should remain outside Agent Trust Gate.

We are seeking critical technical review, not promotional endorsement.

Specific, reproducible and technically grounded observations are preferred over
general approval. A useful review can be negative if it identifies a real
defect, unclear claim or integration blocker.

## Start Here

- [Independent technical review entry point](../TECHNICAL_REVIEW.md)
- [Independent reviewer runbook](independent-reviewer-runbook.md)
- [Technical review feedback framework](technical-review-feedback-framework.md)
- [End-to-end GatePass pilot](end-to-end-gatepass-pilot.md)
