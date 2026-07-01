# Machine-to-Machine Paid Use Profit Test

This local test gates a buyer agent's clearing request behind a simulated paid-use entitlement, runs the Local Agent Clearing Engine, and counts bounded repeat-use and hypothetical revenue placeholders.

```text
npm run profit:m2m-test -- examples/machine-to-machine-paid-use-profit-test-input-draft.json --pretty
```

It demonstrates a pre-use commercial gate and repeatable fee point. It does not contact agents, execute actions, use a network, charge, bill, settle, track, analyse, deploy, or publish. Real payment, billing, settlement, and machine fees remain disabled. Gareth final approval is required before any live or commercial use.
