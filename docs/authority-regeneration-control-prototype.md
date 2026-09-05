# ATG Authority Regeneration Control — controlled synthetic prototype

Status: isolated experimental prototype. It is not connected to live trading, real money, external APIs, or production credentials.

## Core rule

**Economic capacity can change without human permission. Delegated AI authority cannot.**

This prototype keeps current institutional `COUNTERPARTY_PFE` capacity separate from the authority actually delegated to an AI-agent group. A reduction in PFE is evidence input only; it does not directly refill authority.

Any authority re-credit must be derived from:

1. the originating authority;
2. its explicit `regenerationMode`;
3. an eligible confirmed economic event;
4. approved and fresh PFE evidence;
5. an attribution method and attributed eligible release;
6. the originating purpose/scope;
7. regeneration caps/cycle controls; and
8. the absence of another material unauthorised consequence.

## Prototype boundary

- Synthetic `PFE_ENGINE` only.
- One primary consequence: `COUNTERPARTY_PFE`.
- No live market data.
- No trade execution.
- No external settlement.
- No real payment.
- No production keys or secrets.

Supported regeneration semantics in the model:

- `NONE`
- `LIVE_CEILING`
- `SAME_PURPOSE`
- `REVERSAL_BOUND`
- `SETTLEMENT_BOUND`
- `HUMAN_REISSUE`

The initial demonstration focuses on `NONE`, `SAME_PURPOSE`, `REVERSAL_BOUND`, and `LIVE_CEILING`.

## Red-team amendments implemented

The implementation includes the required corrections from the final invention audit:

- separate risk-capacity and delegated-authority state;
- no direct `risk delta -> authority credit` rule;
- explicit eligible attribution;
- event-type eligibility;
- multi-consequence event vector;
- causal attribution status;
- stale-evidence refusal;
- risk-model-version refusal;
- regeneration cap and cycle limit;
- duplicate-event protection;
- indeterminate lifecycle fencing;
- atomic in-process reservations across agents;
- revocation propagation to regenerated descendants and GatePasses;
- release of unconsumed GatePass reservations;
- one-use GatePass with regeneration lineage.

## Key demonstration

A Credit Committee delegates GBP 10m PFE authority for `CLIENT_HEDGE`.

GBP 9m is consumed, leaving GBP 1m delegated authority.

A confirmed unwind reduces measured PFE by GBP 7m. The approved attribution method identifies GBP 6m as eligible for regeneration. Under `SAME_PURPOSE`, ATG creates a GBP 6m regeneration credit restricted to the original client-hedge purpose.

A new client-hedge action can receive a GatePass using original plus regenerated authority.

A proprietary action can still be refused even though the firm's PFE engine reports ample headroom:

`ATG-ARC-003 REGENERATION_PURPOSE_MISMATCH`

This demonstrates the target control gap: **firm risk capacity exists; delegated authority for that purpose does not.**

## Local commands after installing normal repository dependencies

```bash
npm run build
node dist/src/authority-regeneration-control-cli.js
node --test dist/test/authority-regeneration-control.test.js
```

## Test coverage

The prototype test suite currently covers:

1. capacity returns while `NONE` keeps authority unchanged;
2. raw risk delta is not the regeneration amount;
3. same-purpose unwind creates valid lineage;
4. cross-purpose risk-capacity laundering refusal;
5. market movement fails `REVERSAL_BOUND` regeneration;
6. model recalibration does not manufacture authority;
7. indeterminate lifecycle event fencing;
8. cross-dimensional unauthorised consequence refusal;
9. duplicate regeneration-event refusal;
10. competing-agent reservation protection;
11. revocation propagation;
12. one-use GatePass/replay refusal;
13. stale evidence refusal;
14. unapproved risk-model-version refusal; and
15. release of an unconsumed GatePass restores its reservation.

## Non-claims

This prototype does not claim patent novelty, does not claim no competition, and does not replace risk systems such as Aladdin, Murex, SimCorp, Bloomberg, exchange controls, or institutional risk engines.

Its role is narrower: existing systems say what economic capacity exists; ATG determines whether autonomous agents possess legitimate authority to reuse that capacity.
