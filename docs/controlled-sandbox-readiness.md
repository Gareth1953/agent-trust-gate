# Controlled Sandbox Readiness

The controlled sandbox allows only locally allowlisted test agents with a usable sandbox entitlement to invoke the Local Agent Clearing Engine. Other agents and missing entitlements are denied before engine use.

```text
npm run sandbox:readiness -- examples/controlled-sandbox-readiness-input-allowed.json --pretty
```

It proves local access control, entitlement gating, and safe clearing outputs. Public APIs, real agents, networking, payment, billing, settlement, tracking, analytics, deployment, publishing, and action execution remain disabled. Gareth final approval is required before any live or global testing.
