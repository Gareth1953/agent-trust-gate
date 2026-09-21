# P3-M162 Customer Trust Receipt and Assurance Evidence

## Purpose

P3-M162 translates the locked P3-M161 ten-case local purchasing demonstration
into deterministic evidence that a reviewer can reproduce. It does not create
authority. The M161 decision receipts, GatePasses, lifecycle records and
synthetic execution receipt remain authoritative for their own purposes.

## Customer Trust Receipt

Each of the ten source cases produces one schema-bound receipt containing the
source-case digest, verdict, Shadow status, evidenced GatePass and synthetic
execution status, decision/execution references, lifecycle reference,
controls, fixture logical time, limitations and explicit non-authority and
non-production statements. The exact authorised case additionally embeds
verified digests for the locked decision receipt, execution receipt and their
evidence link. Other cases truthfully distinguish repository references from
embedded evidence.

The receipt is canonical and digest-bound. Verification regenerates it from
the locked M161 evidence and compares canonical content. A receipt is
structurally and semantically non-executable: `authorityGranted`, `executable`,
`reservable`, `retryPermitted` and `revocationControl` are all `false`. It is
never accepted as a GatePass.

## Assurance Coverage Map

The machine-readable map uses four statuses:

- `DEMONSTRATED`: direct case evidence and an acceptance-test reference exist.
- `PARTIALLY_DEMONSTRATED`: some direct/test evidence exists, with the gap stated.
- `NOT_DEMONSTRATED`: the capability is absent from the locked evidence.
- `OUT_OF_SCOPE`: the control is deliberately outside this demonstrator.

Each entry includes a stable control ID, objective, concern, implementation,
applicable cases, evidence digest/reference, test reference where applicable,
plain-English explanation, limitation and verification method. The generated
map reports 18 demonstrated, 2 partially demonstrated, 3 not demonstrated and
2 out-of-scope controls.

## Metrics and verification

Metrics are observations of exactly ten synthetic cases. Rates expose their
numerator and denominator; materially relevant zeroes remain visible. Sources
are named per metric. No statistical significance, ROI, savings, compliance,
adoption, reliability or real-world risk-reduction inference is made.

```powershell
npm run evidence:m162 -- --output-dir examples/p3-m162
npm run verify:m162 -- --input examples/p3-m162/evidence-bundle.json
npm run test:customer-trust-evidence
```

Verification returns non-zero for content or manifest tampering, missing or
substituted evidence, broken linkage, unsupported versions, unsupported
coverage claims, metric mismatch, authority-like receipt flags, or any output
that differs from deterministic regeneration.

## Boundaries

Generation and verification are local filesystem operations. They make no
network call and cannot reach the synthetic adapter. MCP remains local stdio
and exposes only `atg.evaluate_action`; pack operations are not MCP tools. All
data is synthetic and uses opaque references. No purchase, payment, settlement,
customer communication, production activity or other external effect occurs.
