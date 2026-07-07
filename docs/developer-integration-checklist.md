# Developer Integration Checklist

This checklist is for local code inspection and demonstration only.

## A. Before running locally

- [ ] Install dependencies with npm install.
- [ ] Run the complete tests with npm test.
- [ ] Run the build with npm run build.
- [ ] Run strict typechecking with npm run typecheck.

## B. Run local proof

- [ ] Run the gate demo with npm run demo:gate -- --input examples/local-demo-low-risk-allow.json.
- [ ] Verify the receipt with --verify-receipt.
- [ ] Validate gate-pass freshness and replay behavior with --simulate-replay-protection.
- [ ] Simulate the settlement blocker with --simulate-settlement-blocker.
- [ ] Run the money-gate proof with npm run proof:money-gate -- --input examples/local-end-to-end-money-gate-proof-input.json --summary-only.
- [ ] Confirm every command states that no action, payment, or settlement was executed.

## C. Inspect code-readable assets

- [ ] Read agent-trust-gate.manifest.json.
- [ ] Read the three files in schemas/.
- [ ] Parse the static examples/integration-*.json files.
- [ ] Read docs/agent-readable-capability-statement.md.
- [ ] Read docs/code-readable-developer-integration-pack.md.

## D. Safety checks

- [ ] No live API or public endpoint is enabled.
- [ ] No external agent is contacted.
- [ ] No payment is initiated.
- [ ] No settlement is executed.
- [ ] No secret or credential is present.
- [ ] No action is executed.

## E. Not approved yet

- [ ] AUC is not integrated.
- [ ] Agent Contact System is not integrated.
- [ ] A hosted sandbox is not approved.
- [ ] x402 and AP2 are not activated.
- [ ] Live settlement is not approved.
- [ ] Production cryptographic signing is not approved.

**No mandate. No evidence. No verified intent. No signed gate pass. No settlement.**
