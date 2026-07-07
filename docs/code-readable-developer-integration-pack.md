# Code-Readable Developer Integration Pack

P3-M101 makes Agent Trust Gate™ easier to understand through static code-readable assets. A developer or future agent system can inspect the local capability, request and receipt shapes, proof output, and CLI demonstrations without connecting to any service.

The operating idea is:

> Humans do not chase systems. Systems understand the code. Agents read the capability. Trust Gate proves the decision.

## Code-readable assets

The pack connects these local artifacts:

- [static project manifest](../agent-trust-gate.manifest.json)
- [agent-readable capability statement](agent-readable-capability-statement.md)
- [local request documentation](local-request-schema.md)
- [local receipt/response documentation](local-response-receipt-schema.md)
- [request JSON Schema-style document](../schemas/local-agent-action-request.schema.json)
- [receipt JSON Schema-style document](../schemas/local-trust-receipt.schema.json)
- [money-gate proof JSON Schema-style document](../schemas/local-money-gate-proof.schema.json)
- [local money-gate proof](local-end-to-end-money-gate-proof-pack.md)
- [settlement blocker simulation](local-settlement-blocker-simulation.md)
- [receipt verification](local-trust-receipt-verification.md)
- [gate-pass validity and replay checks](gate-pass-validity-replay-protection.md)
- static examples/integration-*.json request and response artifacts

The schema files are documentation only. They add no runtime schema dependency and do not advertise a transport.

## Local CLI proof commands

    npm run demo:gate -- --input examples/local-demo-low-risk-allow.json
    npm run demo:gate -- --input examples/local-demo-low-risk-allow.json --verify-receipt
    npm run demo:gate -- --input examples/local-demo-low-risk-allow.json --simulate-replay-protection
    npm run demo:gate -- --input examples/local-demo-low-risk-allow.json --simulate-settlement-blocker
    npm run proof:money-gate -- --input examples/local-end-to-end-money-gate-proof-input.json --summary-only

These commands read local files, run deterministic local logic, and print local proof artifacts. They do not perform the described action.

## Interpretation boundary

A signed_gate_pass is a local placeholder artifact. Receipt verification checks local structure, consistency, scope, freshness, replay state, and settlement-blocker compatibility. money_gate_allowed means simulated eligibility inside the proof pack, not authorization to move money.

This pack is not a live API.

This pack is not a public agent endpoint.

This pack is not a hosted sandbox.

This pack is not payment authorization.

This pack is not settlement execution.

It adds no HTTP server, external agent contact, registry submission, outreach, payment rail, banking or wallet logic, cloud or network call, secret, credential, production signing, or autonomous action execution.

**No mandate. No evidence. No verified intent. No signed gate pass. No settlement.**
