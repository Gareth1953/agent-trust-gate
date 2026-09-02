# P3-M156 Controlled Buyer Pilot Test Plan

## Purpose

This plan tests whether Agent Trust Gate™ can add an understandable, fail-closed exact-action control to one bounded buyer workflow without connecting to production or performing a real action. It validates a local decision-and-evidence boundary, not production readiness or certification.

## Entry conditions

Testing may start only when:

- the [pilot intake checklist](P3-M156-pilot-intake-checklist.md) is complete;
- one action class and one accountable buyer owner are named;
- every test input is synthetic, anonymised or separately approved and minimised;
- no production credential, live payment instrument, customer secret or live endpoint is present;
- the authority, mandate, agent-standing and policy field mappings are reviewed;
- expected outcomes, success measures, abort rules, retention and deletion are agreed; and
- the prototype baseline passes typecheck, build, full tests, adversarial tests and smoke tests.

## Execution boundary under test

The default pilot calls the conceptual `evaluateExactAction(...)` operation and inspects its PASS/REFUSE evidence. It does **not** connect ATG to a buyer executor. The repository's `executeWithGatePass(...)` path may be used only as a local synthetic control test to prove exact binding, expiry, consumption and replay handling. `verifyTrustReceipt(...)` validates the signed local-fixture receipt.

```text
buyer-approved synthetic input → ATG evaluation → decision/evidence → buyer review
                                                     └─ no real execution
```

## Core scenario acceptance tests

| ID | Scenario and method | Expected result | Evidence retained |
|---|---|---|---|
| P156-S1 | Valid human and authority, active agent, valid mandate/evidence and exact action within amount/scope/time | PASS / `GATEPASS_ISSUED`; all required checks pass | action digest, proof/standing/mandate refs, GatePass, executive and full receipts |
| P156-S2 | Request above human/mandate amount, or another agreed authority/mandate violation | REFUSE; root-cause code and requested/permitted values; no GatePass | refusal block, failed checks, consequential blocks, receipt verification |
| P156-S3A | Alter amount, supplier, quantity, currency, policy or agent/action binding after issuance | altered action has no valid execution authority; exact-action mismatch recorded | expected/presented digests and block receipt |
| P156-S3B | Present the same one-use GatePass after its successful local synthetic consumption | replay refused; no second acknowledgement | consumed nonce evidence and `GATEPASS_REPLAY` block receipt |

The standard synthetic examples are £23,750 allowed within £25,000, £31,000 refused, an altered action, and a one-use GatePass replay. Buyer-specific synthetic examples supplement rather than replace these regression cases.

## Functional and adversarial coverage

| Control family | Cases |
|---|---|
| Human authority | valid, wrong human, missing proof, inactive/unknown identity, expired proof, amount/scope mismatch |
| Agent standing | active, revoked/disabled, unknown agent, capability mismatch, stale/invalid evidence where mapped |
| Mandate and policy | valid, missing, expired, wrong action class, supplier/category, quantity, amount, currency, jurisdiction, risk tier, policy version |
| Evidence | present/fresh, missing, malformed, stale |
| Exact action | valid canonical action, malformed action, each execution-critical field changed |
| GatePass | present, missing, malformed, invalid signature, expired, nonce mismatch, consumed/replayed |
| Receipt | verified, malformed, signed-content tampering, machine/executive/detail correlation |
| Boundary | no network call, no real order/payment, no execution after refusal, no direct adapter bypass |

Every unsafe, missing, malformed, stale or unknown state must fail closed. Tests may not be deleted, skipped or relaxed to obtain a passing result.

## Evidence and usability review

For each core scenario, a non-developer reviewer should be able to identify from the executive receipt:

1. the proposed action and amount;
2. the agent and human authority source;
3. applicable limit/scope;
4. ATG's decision and primary reason;
5. GatePass and execution state;
6. tamper or replay outcome where relevant; and
7. the receipt verification status.

The full JSON must correlate action ID/digest, Human Authority Proof, mandate, agent standing, policy version, checks, decision, GatePass/refusal, time, execution state and integrity block. Any ambiguity is recorded as a usability finding; inability to explain a refusal is an abort condition.

## Operational repeatability and latency measurement

- Run each agreed scenario from a clean documented local process state at least three times.
- Record repository commit, Node version, operating system, hardware description, command, sample size and whether build/start-up time is included.
- Measure evaluation duration with a monotonic clock around evaluation only; report each observation plus median, p95 (when sample size makes it meaningful), minimum and maximum.
- Do not state an acceptance latency until the buyer and ATG owners agree one from the workflow need and an observed baseline. No unsupported target is assumed.
- Confirm identical decision, primary code and canonical digest for identical deterministic inputs and state.
- Confirm reset boundaries are understood: the current nonce store is process-local, so cross-process replay resistance is not claimed.
- Record every unexplained error or output difference; zero unexplained failures are allowed at exit.

## Pilot success criteria

### Functional

- Valid authorised actions pass; invalid actions refuse.
- Exact-action alteration, wrong/expired authority, agent-standing failure, replay and tampering are detected.
- No GatePass is issued on refusal and no invalid GatePass authorises the local synthetic adapter.

### Evidence

- A non-technical reviewer can understand the executive Trust Receipt without source access.
- Full audit evidence reconstructs the decision and correlates exact action with authority and standing.
- Stable reason codes and relevant values support buyer review.
- Receipt tampering is detected by the local verifier.

### Operational

- Outcomes are deterministic and repeatable within the documented fixture/state boundary.
- Latency is measured and reported transparently without an invented target.
- There are zero unexplained failures.
- Replay/reset behaviour and integration steps are documented.

### Commercial

- The buyer identifies at least one real workflow shape where the control could add value, without running that workflow live.
- The buyer can state the required data, mapping, governance and adapter burden.
- The buyer can compare ATG with existing controls and decide whether it addresses an otherwise material exact-action gap.

## Abort criteria

Stop the affected run or pilot immediately if any of these occurs:

- inconsistent PASS/REFUSE for identical input and state;
- authority, mandate or agent-standing bypass;
- exact-action binding, signature, expiry, nonce or replay failure;
- unexplained evidence or receipt integrity mismatch;
- a reviewer cannot determine why an action was refused;
- a live credential, unapproved PII, customer secret or production endpoint appears;
- demonstrating value requires live money movement, ordering or another real effect;
- execution occurs after refusal or for an altered action;
- the workflow, action class, data or environment expands beyond approved scope; or
- evidence is described as certification, regulatory approval or guaranteed protection.

After an abort, preserve minimal evidence, follow the risk-register response, correct the root cause, and rerun the full regression set before any recorded restart.

## Exit evidence

The pilot readout contains the agreed scope and commit, field map, all scenario results, raw receipts or their approved redacted equivalents, test totals, latency observations and method, failures/findings, retention/deletion confirmation, residual risks, and an explicit decision to stop, refine, or separately scope a buyer-controlled sandbox phase.

Pilot completion never constitutes a production approval.
