# Production Security Readiness Pack

This pack records the security controls that Agent Trust Gate would need before
public hosting. It is local planning material only. It does not deploy the
gateway, change the `127.0.0.1` default, or enable a public service.

Run the report locally:

```powershell
npm run verify -- --security-readiness
npm run verify -- --security-readiness --json
npm run verify -- --security-readiness --output reports/security-readiness.json
```

The local gateway also serves `GET /v1/security-readiness`. The endpoint reads
deterministic repository metadata, includes a request ID, and writes the normal
local request log. It performs no security scan and makes no network calls.

Before public hosting, complete and independently review production identity,
authorization, secret storage, key rotation, HTTPS/TLS, rate limiting, abuse
controls, monitoring, alerting, retention, privacy, legal terms, incident
response, rollback, recovery, staging, and dependency security.

This is not a security certification. It does not establish SOC2, ISO27001,
GDPR, legal, privacy, payment, or production compliance.
