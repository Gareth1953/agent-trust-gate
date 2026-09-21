# P3-M162 Buyer Adoption Proof Pack Guide

## Contents

The generated pack contains or links:

1. an executive evidence summary;
2. bounded statements of what ATG does and does not do;
3. the exact-action synthetic purchasing scenario and ten-case outcomes;
4. ten Customer Trust Receipts;
5. the Assurance Coverage Map;
6. evidence-derived metrics;
7. local verification and reproduction instructions;
8. architecture and trust-boundary statements;
9. integration assumptions, pilot-entry requirements and buyer responsibilities;
10. security/data-handling boundaries, known limitations and non-claims; and
11. a canonical evidence manifest.

Machine-readable JSON and reviewer-readable Markdown are produced from the
same in-memory verified evidence. The tracked example is under
`examples/p3-m162/`.

## Review procedure

Run the verifier first, inspect the machine coverage/metrics files, then read
the Markdown pack. Treat any verification failure as a failed evidence bundle.
The pack distinguishes demonstrated local controls, partially demonstrated
designs, absent production integrations, and out-of-scope claims.

## Pilot-entry interpretation

The pack can support a decision to test ATG against one buyer-selected action
family using synthetic or explicitly approved data. A buyer must define its
policy and authority boundaries, approve test data, retain any real execution
control, and perform its own security, legal and operational review. The pack
does not itself approve a pilot or production use.

## Non-claims

This pack is not evidence of a customer deployment, customer adoption,
independent validation, production readiness, regulatory approval, guaranteed
compliance, ROI, fraud/loss reduction, distributed durability, production IAM
or key custody, real procurement/payment execution, or real external-effect
reconciliation. Ten synthetic cases are not statistically significant.
