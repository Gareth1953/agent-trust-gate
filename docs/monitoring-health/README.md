# Production Monitoring And Health Signal Pack

This pack summarizes local Agent Trust Gate operational signals from the health
endpoint, request IDs, structured gateway logs, usage metering, authentication
errors, malformed log lines, and rate-limit events.

Run locally:

```powershell
npm run verify -- --monitoring-health
npm run verify -- --monitoring-health --json
npm run verify -- --monitoring-health --output reports/monitoring-health.json
```

The gateway endpoint is `GET /v1/monitoring-health`. A live gateway report can
include uptime for that gateway process. CLI output does not present the CLI
process lifetime as gateway uptime.

This is not production monitoring. No external alerting, hosted dashboard,
public uptime SLA, cloud observability service, or public deployment is enabled.
