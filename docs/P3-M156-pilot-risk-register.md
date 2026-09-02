# P3-M156 Controlled Pilot Risk Register

## Rating method

Probability and impact use qualitative `Low`, `Medium` or `High` ratings because there is no external pilot dataset from which defensible numerical likelihoods can be calculated. A stop condition means the affected run or pilot pauses until an accountable review resolves the issue.

| ID | Pilot risk | Probability | Impact | Mitigation and evidence | Owner | Pilot stop condition |
|---|---|---:|---:|---|---|---|
| R1 | Buyer interprets the demonstrator as a production product | Medium | High | Repeat status boundary in intake, UI, receipts, one-page and readout; require sponsor acknowledgement | Shared | Any request to rely on prototype output for a live action |
| R2 | Buyer identity source is inaccurate | Medium | High | Buyer owns authoritative source; use synthetic records; include known-invalid identity tests | Buyer | Identity truth cannot be attested by the buyer owner |
| R3 | Authority directory is stale or mis-mapped | Medium | High | Explicit effective/expiry times, field mapping review, expired/wrong-authority tests | Buyer / Shared | Authority bypass, unexplained mismatch or no reliable update time |
| R4 | Agent-standing evidence is stale | Medium | High | Require standing timestamp, revocation state and capability scope; run revoked/unknown tests | Buyer / ATG | Revoked or unknown agent receives PASS |
| R5 | Integration mapping changes field meaning | Medium | High | Data dictionary, exact-action field inventory, paired example review and digest tests | Shared | Execution-critical field is omitted or ambiguously transformed |
| R6 | Buyer policy and ATG rule interpretation diverge | Medium | High | Version policy, test both sides of every boundary, record precedence and expected result | Shared | Inconsistent PASS/REFUSE or unresolved policy ownership |
| R7 | Malformed or non-canonical action is accepted | Low | High | Required schema validation, canonical digest recomputation and malformed-action tests | ATG | Malformed input produces PASS or a GatePass |
| R8 | GatePass is replayed or action is tampered with | Low | High | Exact digest binding, signature/expiry verification, nonce registration/consumption and adversarial suite | ATG | Replay, invalid signature or changed action is accepted |
| R9 | Sensitive data or a live credential enters the pilot | Medium | High | Synthetic-by-default intake, field minimisation, secret scan, no upload route, cleanup procedure | Buyer / Shared | Any production secret, payment credential or unapproved PII is found |
| R10 | Executive receipt is misunderstood | Medium | Medium | Two-layer receipt, root-cause-first refusal, glossary and multi-role walkthrough | Shared | Reviewer cannot state action, authority, decision and reason accurately |
| R11 | Execution occurs outside ATG control or after refusal | Medium | High | Default evaluation-only boundary; buyer owns downstream; no direct prototype bypass route; reconcile logs | Buyer | Any live effect, or any sandbox effect after REFUSE/mismatch |
| R12 | Pilot scope expands into production or another workflow | Medium | High | Written one-workflow scope and change control; new intake for material changes | Shared | Live system/data requested or agreed action class changes without approval |
| R13 | Security expectations exceed prototype maturity | Medium | High | Disclose deterministic fixture keys, in-memory nonce store, loopback deployment and no certification | ATG | Buyer requires production assurance as an entry condition |
| R14 | Receipt or source evidence cannot be correlated | Low | High | Use action, proof, mandate, agent, digest, GatePass and receipt identifiers; reconciliation test | Shared | Decision cannot be reconstructed from retained evidence |
| R15 | Local state reset causes misleading replay results | Medium | Medium | Record process/run boundary; test replay within one trust boundary; disclose non-persistence | ATG | Results are represented as cross-process replay protection |
| R16 | Pilot logs persist longer than intended | Medium | Medium | Agree location, owner, retention period and deletion confirmation before testing | Buyer / Shared | Retention owner or deletion method is absent |
| R17 | Test results are cherry-picked or non-repeatable | Low | High | Pre-agree cases, retain raw output, rerun deterministic suite and report all unexplained failures | Shared | Same input/state produces an unexplained different decision |
| R18 | A test GatePass is mistaken for reusable authority | Low | High | Label local-fixture status, short expiry and one-use semantics; never connect it to production | ATG / Buyer | Attempt to present a pilot GatePass to a live or unapproved system |

## Residual risk position

The mitigations make a local, synthetic, evaluation-only exercise defensible; they do not make the prototype a production control. The largest residual risks are inaccurate buyer-supplied truth, semantic mapping error, human over-reliance on pilot evidence, process-local replay state and accidental scope expansion. These remain explicit buyer/shared governance concerns.

## Required response to a stop condition

1. Stop the affected run and prevent any downstream test action.
2. Preserve only the minimum non-sensitive evidence needed to diagnose it.
3. Record the input, expected result, observed result and environment.
4. Identify the accountable owner from the matrix.
5. Correct the root cause and rerun the full agreed regression set.
6. Resume only after the buyer and ATG pilot owners record the decision.
