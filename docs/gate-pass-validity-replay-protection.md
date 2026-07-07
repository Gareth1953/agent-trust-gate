# Gate Pass Validity And Replay Protection

P3-M097 adds two fail-closed controls to the local gate-pass and settlement simulation:

- **Bounded validity:** an allow gate pass is valid from its issue time for no more than 300 seconds and never beyond the supplied mandate expiry.
- **Single use:** each allow gate pass carries a deterministic local replay key. A retained `LocalGatePassReplayStore` consumes it on the first eligible simulation and blocks later attempts as `gate_pass_replay_detected`.

The expiry boundary is exclusive: a pass is expired when `evaluated_at >= expires_at`. A time before `valid_from`, an invalid evaluation time, missing or extended validity metadata, and an altered replay key all fail closed.

Review and refusal receipts are not gate passes. Their `gate_pass_validity` and `replay_protection` fields are null.

## Local demonstration

```text
npm run demo:gate -- --input examples/policy-low-risk-fast-path-allow.json --simulate-replay-protection
```

The command evaluates the same local receipt twice with one in-memory replay store. The first attempt is eligible; the second is blocked. Both are simulation results only.

## Boundary

The replay store is process-local and non-persistent. It does not provide distributed coordination, durable replay defense, cryptographic signing, production identity, payment authorization, or legal proof. Restarting the process clears it. A future production design would require an atomic durable store, authenticated identities, trusted time, cryptographic signatures, key management, and an approved operational threat model.

No network call, external agent contact, action execution, payment, or settlement occurs.

**No current, unused signed gate pass means no settlement.**
