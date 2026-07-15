# Show HN-Style Technical Review Draft

This is a draft only. Do not submit it to Hacker News or any other platform
automatically.

## Restrained Title Options

- Show HN: Agent Trust Gate - a local GatePass before high-impact AI-agent actions
- Show HN: Local GatePass demo for checking AI-agent actions before simulated settlement
- Show HN: Agent Trust Gate, a local pre-action trust-control demo for agent workflows
- Show HN: A local refusal-receipt and GatePass demo for delegated agent actions

## Draft Body

I am looking for critical technical review of Agent Trust Gate(TM), a local
demonstrator for checking high-impact AI-agent actions before a simulated
settlement step.

The problem it explores: an agent can propose an action, but a separate layer
should still check whether that action matches the mandate, scope, value limit,
evidence and approval state before anything settlement-adjacent is allowed.

The current repo demonstrates two deterministic local paths:

- permitted path: a 480 GBP delegated payment-style action passes mandate,
  scope, spend, evidence and approval checks, receives a local-demo GatePass and
  reaches simulated settlement state permitted_to_proceed;
- refused path: an 875 GBP action exceeds a 500 GBP cap, receives no GatePass,
  produces refusal evidence and is blocked before simulated settlement.

Repository:
https://github.com/Gareth1953/agent-trust-gate

Review entry point:
https://github.com/Gareth1953/agent-trust-gate/blob/main/TECHNICAL_REVIEW.md

Fresh-clone path:

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

This is local-only. Settlement is simulated. There are no live payment rails,
retailer integrations, external APIs, production endpoint enforcement, MCP
proxying, SSO, secrets management or production signing.

I am seeking criticism rather than endorsement. Useful responses include
defects, unclear setup instructions, overstated claims, weak boundaries,
security concerns and integration objections.

## Limitations To Acknowledge

- The project is not production-ready.
- It does not execute real actions.
- It does not process payments or settlement.
- It does not provide legal, compliance or security certification.
- It does not assure safety, truth or prevention of harm.
- Real integration would require separate customer-specific engineering,
  security review and written agreement.
