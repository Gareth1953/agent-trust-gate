# Allow Demo Transcript

```text
$ npm run demo:gate -- --input examples/local-demo-low-risk-allow.json
Agent Trust Gate Local Demo
Request: demo-low-risk-allow
Verdict: allow_signed_gate_pass
Receipt: signed_gate_pass
Risk tier: low
Applied policy: low-risk-local-demo
Human review required: false
Fast path allowed: true
Settlement allowed: true
Failed checks: none
Reason codes: MANDATE_VALID, EVIDENCE_FRESH, INTENT_VERIFIED, WITHIN_LIMITS, APPROVAL_SATISFIED
Local proof only; no action or settlement was executed.
```

The local checks passed, so the artifact is a placeholder signed gate pass. Settlement is only locally eligible; it was not executed.
