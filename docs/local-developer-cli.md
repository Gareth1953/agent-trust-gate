# Local Developer CLI Demo

The CLI reads one local example, runs the Local Gate Pass Demo Flow, creates the P3-M091 receipt/audit artifact, and prints a short summary.

```text
npm run demo:gate -- --input examples/local-demo-low-risk-allow.json
npm run demo:gate -- --input examples/local-demo-money-review.json --summary-only
npm run demo:gate -- --input examples/local-demo-no-mandate-refuse.json
npm run demo:gate -- --input examples/local-demo-stale-evidence-refuse.json --full
npm run demo:gate -- --input examples/local-demo-over-limit-refuse.json --save local-receipt.json
```

The default and `--summary-only` modes show request ID, verdict, receipt type, settlement eligibility, failed checks, and reason codes. `--full` prints the complete receipt JSON. `--save` writes the complete receipt to the specified local path and still prints the selected console output.

The summary also shows risk tier, applied policy, whether human review is required, and whether the low-risk fast path was allowed. Low risk can be fast-pathed only after every check passes. Medium risk is gated, high-risk money/legal/customer-impacting work needs explicit approval, and prohibited requests are refused.

`settlement_allowed` describes only whether the local verdict artifact is an allow result. It does not initiate or execute real-world settlement. The receipt also records `settlement_executed: false`.

**No mandate. No evidence. No verified intent. No signed gate pass. No settlement.**

This CLI is a local proof/demo tool only. It performs no network calls, external agent contact, action execution, payment, billing, or settlement.
