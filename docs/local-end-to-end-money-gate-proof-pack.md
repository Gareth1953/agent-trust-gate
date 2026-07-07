# Local End-to-End Money Gate Proof Pack

P3-M099 composes the local policy gate, receipt/audit artifact, trust receipt verifier, validity window, replay store, and settlement blocker into one fail-closed money-gate proof.

Run the deterministic local proof:

```text
npm run proof:money-gate -- examples/local-end-to-end-money-gate-proof-input.json --pretty
```

The equivalent `--input examples/local-end-to-end-money-gate-proof-input.json` form is also supported. Use `--summary-only` for the top-level proof result without per-scenario evidence. A passing run exits `0`; a well-formed run whose controls do not all pass exits `2`; invalid or prohibited input exits `1`.

## What the proof establishes

The pack runs ten synthetic scenarios from one approved `money_movement` baseline:

1. an in-scope, approved request within its limit produces a locally verified signed gate pass and one simulated eligible result;
2. reuse of the same pass is blocked by the process-local replay store;
3. missing mandate, missing evidence, and missing verified intent each produce refusal receipts;
4. an over-limit request produces a refusal receipt;
5. pending approval produces a review receipt;
6. an expired gate pass is rejected before the settlement blocker can be invoked;
7. a changed action scope is rejected by receipt verification;
8. `autonomous_payment_execution` is prohibited.

Receipt verification is a mandatory orchestration boundary. The proof invokes the settlement blocker only when the receipt is verified and valid for simulated settlement. This prevents a scope-mismatched, expired, replayed, review, or refusal artifact from reaching the final simulated eligibility step.

`proof_passed` requires all ten controls and exactly one `simulated_eligible` result. That result is evidence of local gate behavior only. It is not payment authorization and does not execute settlement.

## Input boundary

The CLI accepts only the allowlisted local request shape. Fields suggesting private/customer data, contact details, credentials, bank/card/wallet data, payment rails, or live endpoints are rejected. Inputs and outputs must remain synthetic and local.

## Safety boundary

The pack creates no credential or cryptographic signature, opens no listener, performs no network call, contacts no agent, and executes no action, payment, or settlement. The replay store is in-memory and non-persistent. Placeholder signature metadata is explicitly non-cryptographic. This proof is not production security, financial authorization, legal evidence, compliance certification, or a substitute for durable replay storage and trusted identity.

**No mandate. No evidence. No verified intent. No signed gate pass. No settlement.**
