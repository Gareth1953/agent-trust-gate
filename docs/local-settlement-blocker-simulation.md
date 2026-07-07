# Local Settlement Blocker Simulation

The local settlement blocker checks a local gate receipt and decides whether settlement would remain blocked or be eligible in a demo-only environment.

```text
agent/action request
→ gate decision
→ receipt produced
→ settlement blocker checks receipt
→ settlement_simulation_allowed or settlement_simulation_blocked
```

Only a complete local allow receipt with `receipt_type: signed_gate_pass`, `verdict: allow_signed_gate_pass`, `allowed: true`, `settlement_allowed: true`, all critical checks passed, no refusal reason codes, and no human-review requirement can produce an allowed simulation. Review and refusal receipts always block.

The blocker produces a local decision artifact only. It does not execute settlement, move money, call payment services, activate x402 or AP2, contact agents, call external systems, or execute actions.

Run it with the existing local CLI:

```text
npm run demo:gate -- --input examples/local-demo-money-review.json --simulate-settlement-blocker
```

The CLI reports the simulated decision, reason codes, `local_simulation_only` mode, and the no-execution warning.

**No mandate. No evidence. No verified intent. No signed gate pass. No settlement.**
