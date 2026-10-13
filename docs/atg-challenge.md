# ATG Challenge

The [public challenge](https://agenttrustgate.com/challenge.html) displays **recorded synthetic fixture results**, not a browser-run agent test. It is an invitation to investigate a workflow, not certification, a production safety score or customer validation.

Three cases use the existing `AtgPurchaseOrderConnector`:

1. **Changed details:** approve the synthetic order, change the fixture bank reference, attempt execution; expect `BUSINESS_STATE_CHANGED_REAPPROVAL_REQUIRED` and zero records.
2. **Reused approval:** execute once, then present the same approval; expect rejection and exactly one record. This fixture includes an already-recorded-order guard; it does not prove distributed idempotency.
3. **Lost acknowledgement:** commit locally and simulate lost acknowledgement; expect UNKNOWN, then lookup-derived EXECUTED with an approved-request/outcome match and exactly one record.

## Reproduce

From a clone, with Node.js 20 or newer:

```sh
npm ci --ignore-scripts
npm run demo:challenge
```

The runner creates fresh temporary directories, uses synthetic authority and the connector's fixed fixture clock, outputs actual JSON and exits nonzero if expectations fail. It closes connectors and removes temporary state, contacting no external services. To refresh the checked-in website evidence after a verified build, run `node scripts/run-atg-challenge.mjs --write` from the repository root, then inspect and commit `discovery-site/challenge-results.json` together with any related page changes. Browser case summaries must agree with the generated observations.

The prepared local.3 archive supports SDK reproduction and its four-scenario `order-demo`; the three-case Challenge runner remains in the repository. The local.2 archive is retained unchanged. Refreshed evidence records the local.3 version, approved snapshot, signed GatePass and outcome checks.

## Boundaries and next step

Recorded results include actual reason codes and linked local evidence. Same-host records/hashes are not independent execution capture or cryptographic destination attestation. The refreshed recording embeds the exact approved snapshot digest in signed canonical arguments and checks it at synthetic commit and reconciliation. This is a local publication candidate, not an independently authenticated human approval or external destination attestation. Production keys, trusted time, live connectors, bypass prevention and distributed transactions are not established. Full [connector recovery/trust limits](purchase-order-connector.md) apply.

A prospective buyer or implementation partner can bring one bounded workflow for a separately scoped non-production discussion. Testing their agent requires integration, authoritative destination state and agreed success criteria; the website neither accepts agent credentials nor tests visitors' systems.
