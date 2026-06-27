# Local Rate Limit And Abuse-Control Signals

This pack documents optional local runtime request limits for Agent Trust Gate.
Configured clients can receive machine-readable status and a local `429`
response before protected gateway logic runs.

These controls are local to one gateway process. They are not production-grade abuse prevention.
They are not shared, durable, or edge-enforced, and restarting the process resets runtime counters.

Inspect local status with:

```powershell
npm run verify -- --rate-limit-status
npm run verify -- --rate-limit-status --json
npm run verify -- --rate-limit-status --client-id local-demo-agent --clients-file gateway-clients.example.json --json
```

The live gateway endpoint is `GET /v1/rate-limit-status`. In API-key mode it
requires a valid key and infers or validates the client ID.

No action is executed and no capacity is purchased. Payment, billing, and
automatic purchase remain disabled.
