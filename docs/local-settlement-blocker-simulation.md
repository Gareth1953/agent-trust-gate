# Local Settlement Blocker Simulation

The local settlement blocker checks a local gate receipt and decides whether settlement would remain blocked or be eligible in a demo-only environment.

```text
agent/action request
→ gate decision
→ receipt produced
→ settlement blocker checks receipt
→ settlement_simulation_allowed or settlement_simulation_blocked
```

Only a complete local allow receipt with `receipt_type: signed_gate_pass`, `verdict: allow_signed_gate_pass`, `allowed: true`, `settlement_allowed: true`, all critical checks passed, no refusal reason codes, no human-review requirement, a current validity window, and an unused replay key can produce an allowed simulation. Review, refusal, expired, not-yet-valid, malformed, and replayed receipts always block.

The blocker produces a local decision artifact only. It does not execute settlement, move money, call payment services, activate x402 or AP2, contact agents, call external systems, or execute actions.

Run it with the existing local CLI:

```text
npm run demo:gate -- --input examples/local-demo-money-review.json --simulate-settlement-blocker
```

The CLI reports the simulated decision, reason codes, `local_simulation_only` mode, and the no-execution warning.

See [gate pass validity and replay protection](gate-pass-validity-replay-protection.md) for the five-minute maximum validity window, exclusive expiry rule, and process-local single-use store.

**No mandate. No evidence. No verified intent. No signed gate pass. No settlement.**
