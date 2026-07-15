# Independent Technical Review

Agent Trust Gate(TM) is a local demonstrator of a protocol-agnostic trust layer
that can sit before high-impact agent actions, sensitive tools, deployments or
payment-style settlement operations.

It demonstrates:

- policy-decision checks;
- mandate and scope checks;
- approval gating;
- GatePass authorisation artefacts;
- refusal receipts;
- local audit evidence.

It is not a production service, payment processor, settlement system, endpoint
enforcement layer, infrastructure-isolation system, MCP proxy, SSO integration,
secrets-management system, legal or regulatory certification, safety assurance
or truth assurance.

## Why Review Is Requested

Independent review is requested to test whether the project is understandable,
reproducible, technically bounded and honest about what it does and does not
prove.

We are seeking critical technical review, not promotional endorsement.

Useful reviewers include independent developers, security engineers,
agent-system builders, payments-infrastructure specialists, platform architects
and governance reviewers.

## Prerequisites

- Git.
- Node.js 20 or newer.
- npm compatible with the checked-in `package-lock.json`.
- No credentials, payment accounts, customer data, secrets or live services.

## Fresh-Clone Reviewer Path

```powershell
git clone https://github.com/Gareth1953/agent-trust-gate.git
cd agent-trust-gate
npm ci
npm run build
npm run typecheck
npm run demo:gatepass-pilot -- --scenario permitted --summary-only
npm run demo:gatepass-pilot -- --scenario refused --summary-only
npm test
```

## Expected Permitted Result

The permitted scenario requests `480 GBP`. The mandate, scope, spend, evidence
and approval checks pass. A local-demo GatePass is issued and the simulated
settlement result is `permitted_to_proceed`.

## Expected Refused Result

The refused scenario requests `875 GBP` against an authorised cap of `500 GBP`.
The GatePass is not issued. Refusal evidence is produced and simulated
settlement is blocked.

## Evidence Location

Runtime reports are written locally under:

```text
reports/gatepass-pilot/
```

That directory is ignored by Git. The reports are local reviewer artefacts, not
production audit records.

## Five Focused Review Questions

1. Can a new reviewer understand the project purpose within five minutes?
2. Does the end-to-end GatePass pilot run from a fresh clone without secrets or
   source-code edits?
3. Is the GatePass decision boundary clear enough to critique?
4. Does the refused path reliably block simulated settlement?
5. Are any public claims overstated, ambiguous or likely to mislead a technical
   buyer?

## Feedback Route

Use the structured GitHub issue template:

- [Technical review feedback issue template](.github/ISSUE_TEMPLATE/technical-review-feedback.yml)

If the report contains sensitive security detail, do not include credentials,
private keys, customer data, exploit secrets, confidential employer information
or production-only details in a public issue.

## Related Documents

- [Public technical review invitation](docs/public-technical-review-invitation.md)
- [Independent reviewer runbook](docs/independent-reviewer-runbook.md)
- [Technical review feedback framework](docs/technical-review-feedback-framework.md)
- [End-to-end GatePass pilot](docs/end-to-end-gatepass-pilot.md)
- [Commercial feasibility pilot](docs/commercial-feasibility-pilot.md)
- [Pilot inputs, outputs and boundaries](docs/pilot-inputs-outputs-boundaries.md)
- [Pilot conversion path](docs/pilot-conversion-path.md)
