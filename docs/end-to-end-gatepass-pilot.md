# End-to-End GatePass Pilot

P3-M145 adds a local-only reviewer journey showing how Agent Trust Gate(TM) can protect a delegated purchasing or payment-style action before simulated settlement.

The pilot keeps the existing rule:

**No mandate. No evidence. No verified intent. No signed GatePass. No settlement.**

## What It Demonstrates

The pilot runs two deterministic synthetic scenarios:

- permitted action: a delegated supplier-payment-style request with mandate, scope, spend cap, evidence, verified intent, and human approval present;
- refused action: a similar request that exceeds the authorised value limit and receives a refusal receipt.

For each scenario the local pilot displays:

- the original proposed agent action;
- mandate and scope checks;
- spend-cap checks;
- evidence checks;
- approval checks;
- GatePass or refusal receipt;
- local-demo signature verification where a GatePass is issued;
- simulated settlement adapter decision;
- audit evidence file paths.

## Run It

```powershell
npm run demo:gatepass-pilot
npm run demo:gatepass-pilot -- --scenario permitted
npm run demo:gatepass-pilot -- --scenario refused
npm run demo:gatepass-pilot -- --summary-only
npm run demo:gatepass-pilot -- --json
```

The command writes local audit artefacts under `reports/gatepass-pilot/`. That directory is ignored by Git.

## Flow

1. A fictional delegated agent submits a proposed supplier-payment-style action.
2. Agent Trust Gate checks the mandate.
3. It checks the action scope against the mandate scope.
4. It checks the requested value against the authorised cap.
5. It checks local evidence and verified intent.
6. It checks whether approval is required and present.
7. It creates either a local-demo signed GatePass receipt or a refusal receipt.
8. The simulated settlement adapter permits only a valid, fresh, scoped, signed GatePass.
9. The audit path is saved locally.

## Settlement Adapter Boundary

The settlement adapter is a local simulation. It does not process payments, authorise settlement, contact an API, call a payment rail, use customer data, use credentials, or execute an action.

The adapter blocks when the GatePass is missing, refused, invalid, expired, mismatched, outside scope, not locally signed, or already consumed by replay protection.

## Examples

- [Permitted action input](../examples/gatepass-pilot-permitted-action.json)
- [Refused action input](../examples/gatepass-pilot-refused-action.json)
- [Deterministic pilot report](../examples/end-to-end-gatepass-pilot-report.json)

## Related Commercial Pack

- [Commercial feasibility pilot](commercial-feasibility-pilot.md)
- [Pilot inputs, outputs and boundaries](pilot-inputs-outputs-boundaries.md)
- [Pilot conversion path](pilot-conversion-path.md)
