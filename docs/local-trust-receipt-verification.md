# Local Trust Receipt Verification

An Agent Trust Gate™ receipt is not trusted merely because it exists. It must be verified locally before it can support any simulated settlement decision.

P3-M098 verifies the v2 local gate-pass receipt contract in ordered layers:

1. **Structure:** required receipt, identity, action, policy, check, reason, time, signature, validity, replay, and audit fields must exist with the expected local types.
2. **Schema:** `atg.local-gate-pass-receipt.v2` is supported. Earlier or unknown schemas fail closed as unsupported rather than being silently interpreted.
3. **Internal consistency:** receipt type must match the verdict; `allowed`, `settlement_allowed`, human-review, and risk-tier values must agree with that verdict.
4. **Checks and reasons:** mandate, evidence, verified-intent, limits, and approval checks must be well formed. The decisive failed check must have its corresponding reason code. A failed critical check always prevents settlement eligibility.
5. **Policy:** local policy version, applied rule, risk reason, risk tier, and fast-path metadata must be present and consistent.
6. **Signature metadata:** the current `local_demo_placeholder` with algorithm `none` is required and reported as `signature_not_cryptographic`. It is not treated as a real signature.
7. **Scope:** optional expected request ID, agent ID, and requested action must exactly match the receipt.
8. **Freshness and replay:** the verifier applies its bounded TTL and reuses the P3-M097 gate-pass validity and in-memory replay checks for signed gate passes.
9. **Settlement compatibility:** the P3-M096 settlement blocker must allow the same receipt at the same evaluation time. Review and refusal receipts never qualify for simulated settlement.

## Receipt trust and settlement eligibility

`verified` means the local receipt is structurally valid, supported, internally consistent, fresh, scoped as requested, and replay-safe. A review or refusal receipt can be verified as a faithful local decision artifact while `valid_for_simulated_settlement` remains false.

A signed pass is valid for simulated settlement only when all verification checks pass, its P3-M097 validity/replay protection passes, and the P3-M096 blocker allows it. `require_settlement_eligibility` can make non-eligibility block the overall verification result when a caller specifically needs settlement use.

Run the local demonstration:

```text
npm run demo:gate -- --input examples/policy-low-risk-fast-path-allow.json --verify-receipt
```

## Safety boundary

This is local demo verification only. It is not production cryptographic verification, legal or compliance certification, live payment authorization, or real settlement security. It performs no network call, external-agent contact, payment, settlement, banking or wallet operation, credential creation, signing, or action execution.

The replay store is process-local and non-persistent. Production verification would require separately approved cryptographic identities, trusted time, key management, durable atomic replay storage, and an operational threat model.

**No mandate. No evidence. No verified intent. No signed gate pass. No settlement.**
