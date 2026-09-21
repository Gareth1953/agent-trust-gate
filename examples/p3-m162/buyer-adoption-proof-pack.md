# P3-M162 Buyer Adoption Proof Pack

A reproducible ten-case local synthetic evaluation shows exact-action authority checks, bounded referral, durable replay/revocation controls and non-authorising Shadow evidence. It is evaluation evidence, not customer or production validation.

## Evidence boundary

Local synthetic evidence only. No external action occurred. This pack grants no authority and is not production, customer, compliance, ROI or business-outcome validation.

## What ATG does

- Evaluates exact proposed actions against registered authority and policy evidence.
- Issues one-use GatePasses only for enforced ACCEPT outcomes.
- Produces separate local decision and synthetic execution evidence.

## What ATG does not do

- Decide commercial wisdom.
- Execute real procurement, payment or settlement.
- Establish production readiness, compliance, ROI or customer validation.

## Exact-action purchasing scenario

Agent Trust Gate local purchasing lifecycle demonstration

| # | Case | Verdict | GatePass | Execution |
|---:|---|---|---|---|
| 01 | Exact authorised purchase | ACCEPT | ISSUED_AND_CONSUMED | SYNTHETIC_EXECUTED |
| 02 | Quantity substitution | REJECT | NOT_ISSUED | NOT_ATTEMPTED |
| 03 | Supplier substitution | REJECT | NOT_ISSUED | NOT_ATTEMPTED |
| 04 | Price-band breach | REFER | NOT_ISSUED | NOT_ATTEMPTED |
| 05 | GatePass reuse | REJECT | ISSUED_AND_CONSUMED | BLOCKED |
| 06 | GatePass revocation | REJECT | REVOKED | BLOCKED |
| 07 | Shadow Mode | SHADOW | NOT_ISSUED | NOT_ATTEMPTED |
| 08 | Aggregate ceiling | REFER | NOT_ISSUED | NOT_ATTEMPTED |
| 09 | Authority expansion attempt | REJECT | NOT_ISSUED | NOT_ATTEMPTED |
| 10 | Emergency and recovery lifecycle | REJECT | ISSUED | BLOCKED |

## Customer Trust Receipts

- 01_exact_authorised_purchase: `customer_trust_receipt_386ead92f31b1d7fce22b105` — ACCEPT; authority granted: false.
- 02_quantity_substitution: `customer_trust_receipt_157d09de915937606f04629b` — REJECT; authority granted: false.
- 03_supplier_substitution: `customer_trust_receipt_7066d41a91c114ac4e1d8fe2` — REJECT; authority granted: false.
- 04_price_band_breach: `customer_trust_receipt_7e46407228c1fac90c686ece` — REFER; authority granted: false.
- 05_gatepass_reuse: `customer_trust_receipt_71393cefa8b153bb9bb6970e` — REJECT; authority granted: false.
- 06_gatepass_revocation: `customer_trust_receipt_0ec9086454cb05ada54870ff` — REJECT; authority granted: false.
- 07_shadow_mode: `customer_trust_receipt_388759373b7844119797b578` — SHADOW; authority granted: false.
- 08_aggregate_ceiling: `customer_trust_receipt_52ff9126fdc35c4a721cb360` — REFER; authority granted: false.
- 09_authority_expansion_attempt: `customer_trust_receipt_0fd288b9fa8355be46b1d48f` — REJECT; authority granted: false.
- 10_emergency_recovery_lifecycle: `customer_trust_receipt_300aedc0c8fdb0027c291e2b` — REJECT; authority granted: false.

## Assurance Coverage Map

| Control | Status | Evidence | Limitation |
|---|---|---|---|
| CTRL-EXACT-001 | DEMONSTRATED | Canonical action binding accepts the exact action and rejects mutations. | Local fixture signatures only. |
| CTRL-MANDATE-001 | DEMONSTRATED | The valid mandate passes and agent expansion claims reject. | Synthetic registered authority only. |
| CTRL-MUTATION-001 | DEMONSTRATED | Quantity and supplier reject; the bounded price band refers. | Only the fixture action family is covered. |
| CTRL-OUTCOME-001 | DEMONSTRATED | Distinct evidence exists for acceptance, refusal/referral and revocation. | REVOKE is an internal lifecycle control, not an MCP verdict. |
| CTRL-SHADOW-001 | DEMONSTRATED | Shadow would accept but issues no GatePass. | One synthetic policy fixture. |
| CTRL-ONEUSE-001 | DEMONSTRATED | Consumed authority is blocked after restart. | Single-process store only. |
| CTRL-EXPIRY-001 | PARTIALLY_DEMONSTRATED | Revocation is in the ten-case run; expiry is proved by the M161 acceptance suite. | Expiry is test evidence rather than a named ten-case outcome. |
| CTRL-EXPOSURE-001 | DEMONSTRATED | Two outstanding actions count and the third refers. | No cross-currency conversion. |
| CTRL-STOP-001 | DEMONSTRATED | Stop state survives restart and blocks progression. | Global local-gateway scope only. |
| CTRL-RESTART-001 | DEMONSTRATED | All three evidence classes survive restart. | No multi-process guarantee. |
| CTRL-CRASH-001 | DEMONSTRATED | UNKNOWN is not retried and needs explicit reconciliation. | No real external acknowledgement source. |
| CTRL-CONCURRENCY-001 | DEMONSTRATED | Concurrent fixture attempts do not overcommit. | Not distributed or multi-process. |
| CTRL-ADAPTER-001 | DEMONSTRATED | Exactly one frozen synthetic adapter is registered. | Synthetic in-process callback only. |
| CTRL-RESOURCE-001 | DEMONSTRATED | Unknown resources stop before reservation. | One fixture resource. |
| CTRL-RECEIPT-001 | DEMONSTRATED | Receipts remain distinct and link to one action. | Synthetic acknowledgement only. |
| CTRL-TAMPER-001 | DEMONSTRATED | Receipt and link tampering fail verification. | Hashing is not hostile-host protection. |
| CTRL-FAILCLOSED-001 | PARTIALLY_DEMONSTRATED | Expiry and rollback are tested; not every production outage mode is modelled. | Fixture clock and local storage only. |
| CTRL-BYPASS-001 | DEMONSTRATED | Missing, mutated, replayed and revoked authority cannot reach the adapter. | No real platform enforcement integration. |
| CTRL-DATA-001 | DEMONSTRATED | Evidence uses synthetic opaque references and digests. | No production retention/deletion service. |
| CTRL-LOCAL-001 | DEMONSTRATED | All operational flags remain local and externalActionOccurred is false. | Does not prove safety of a future external adapter. |
| CTRL-IAM-001 | NOT_DEMONSTRATED | Only repository fixture identities and keys exist. | Production IAM and key custody are absent. |
| CTRL-DISTRIBUTED-001 | NOT_DEMONSTRATED | The store is local and single-process. | No distributed consensus or HA. |
| CTRL-EXTERNAL-REC-001 | NOT_DEMONSTRATED | Only synthetic reconciliation evidence exists. | No external acknowledgement source. |
| CTRL-COMPLIANCE-001 | OUT_OF_SCOPE | No compliance determination is made. | Requires buyer-specific legal assessment. |
| CTRL-REAL-PROC-001 | OUT_OF_SCOPE | No real order, payment or settlement is performed. | Buyer retains any real execution boundary. |

## Evidence-derived metrics

| Metric | Value | Numerator | Denominator | Percentage |
|---|---:|---:|---:|---:|
| METRIC-TOTAL-CASES | 10 | — | — | — |
| METRIC-VERDICT-ACCEPT | 1 | 1 | 10 | 10 |
| METRIC-VERDICT-REJECT | 6 | 6 | 10 | 60 |
| METRIC-VERDICT-REFER | 2 | 2 | 10 | 20 |
| METRIC-VERDICT-SHADOW | 1 | 1 | 10 | 10 |
| METRIC-GATEPASSES-ISSUED | 3 | — | — | — |
| METRIC-GATEPASSES-CONSUMED | 1 | — | — | — |
| METRIC-GATEPASSES-REVOKED | 1 | — | — | — |
| METRIC-REUSE-BLOCKED | 1 | — | — | — |
| METRIC-ALTERED-ACTIONS-REJECTED | 3 | — | — | — |
| METRIC-HUMAN-REVIEW-REFERRALS | 2 | — | — | — |
| METRIC-SHADOW-EVALUATIONS | 1 | — | — | — |
| METRIC-SHADOW-GATEPASSES | 0 | — | — | — |
| METRIC-UNAUTHORISED-EXECUTION-BLOCKED | 3 | — | — | — |
| METRIC-SYNTHETIC-EXECUTIONS | 1 | — | — | — |
| METRIC-AGGREGATE-INTERVENTIONS | 1 | — | — | — |
| METRIC-EMERGENCY-INTERVENTIONS | 1 | — | — | — |
| METRIC-AUTOMATIC-CRASH-RETRIES | 0 | — | — | — |
| METRIC-EVIDENCE-LINK-VERIFICATION | 1 | 1 | 1 | 100 |
| METRIC-TAMPER-DETECTION | 2 | 2 | 2 | 100 |
| METRIC-COVERAGE-DEMONSTRATED | 18 | — | — | — |
| METRIC-COVERAGE-PARTIALLY_DEMONSTRATED | 2 | — | — | — |
| METRIC-COVERAGE-NOT_DEMONSTRATED | 3 | — | — | — |
| METRIC-COVERAGE-OUT_OF_SCOPE | 2 | — | — | — |

## Verification and reproduction

- `npm run verify:m162 -- --input examples/p3-m162/evidence-bundle.json`
- `Treat any non-zero exit as verification failure.`
- `npm run evidence:m162 -- --output-dir examples/p3-m162`
- `npm run test:customer-trust-evidence`

## Architecture and trust boundary

- M162 reads M161 evidence and grants no authority.
- MCP remains local stdio with only atg.evaluate_action.
- The synthetic adapter is not reachable from M162 artefacts.

## Integration assumptions

- Node.js and existing repository dependencies.
- Synthetic fixtures and local filesystem only.
- A buyer would retain control of any future real adapter.

## Pilot entry requirements and buyer responsibilities

- One buyer-selected action family.
- Synthetic or explicitly approved data.
- No production execution during initial evaluation.
- Buyer-approved policy and human authority evidence.
- Define authority and policy boundaries.
- Provide approved non-sensitive test data.
- Review referrals and retain control of execution.
- Perform independent security, legal and operational review.

## Evidence manifest

Canonical artefact digests are recorded in `evidence-manifest.json`.

## Security, limitations and non-claims

- Opaque synthetic references and canonical digests.
- No credentials, personal data, customer data or production secrets.
- Local artefact retention remains the operator's responsibility.
- Ten synthetic cases are not statistically significant.
- No customer deployment or independent validation.
- No distributed durability, production IAM/key custody or real external reconciliation.
- No guaranteed compliance, ROI, savings, fraud reduction or business outcome.

Machine pack digest: `sha256:d4e73d462beb643f5c1a0cadcf337b3f83f5481909962e2899fa3777f7d1262a`
