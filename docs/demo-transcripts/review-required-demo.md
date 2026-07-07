# Review-Required Demo Transcript

```text
$ npm run demo:gate -- --input examples/local-demo-money-review.json
Agent Trust Gate Local Demo
Request: demo-money-review
Verdict: review_required
Receipt: review_receipt
Risk tier: high
Applied policy: high-risk-approval-required
Human review required: true
Fast path allowed: false
Settlement allowed: false
Failed checks: approval
Reason codes: HUMAN_REVIEW_REQUIRED
Local proof only; no action or settlement was executed.
```

The synthetic money-related request requires human approval. The review receipt keeps settlement blocked.
