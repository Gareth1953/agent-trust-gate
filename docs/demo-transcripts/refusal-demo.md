# Refusal Demo Transcript

```text
$ npm run demo:gate -- --input examples/local-demo-no-mandate-refuse.json
Agent Trust Gate Local Demo
Request: demo-no-mandate
Verdict: refuse_no_mandate
Receipt: refusal_receipt
Settlement allowed: false
Failed checks: mandate
Reason codes: MANDATE_REQUIRED
Local proof only; no action or settlement was executed.
```

No valid mandate was supplied. The refusal receipt records the failed check and keeps settlement blocked.
