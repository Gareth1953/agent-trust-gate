# Local Agent Clearing Engine

The local engine runs one draft request through local RefusalGraph matching, clearing, receipt creation and verification, ledger recording, fee placeholders, evidence bundling, replay, and an integrity snapshot.

```text
npm run engine:clearing -- examples/local-agent-clearing-engine-input-draft.json --pretty
```

It is offline and draft-only. It does not execute actions, use a network, expose private data, publish, track, analyse, bill, pay, or settle. Gareth final approval is required before any live, network, commercial, payment, deployment, or publication use.
