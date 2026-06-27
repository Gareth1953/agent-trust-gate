# Production Security Checklist

This checklist is a planning gate. Every applicable item needs an owner,
evidence, review date, and approval before public hosting.

## Authentication and authorization

- [ ] Select production-grade workload and operator authentication.
- [ ] Define tenant isolation, roles, authorization, revocation, and recovery.
- [ ] Protect administrative endpoints separately from customer traffic.

## Secrets

- [ ] Use managed secret storage with least-privilege access.
- [ ] Define API-key rotation, emergency revocation, and audit procedures.
- [ ] Verify that logs, traces, errors, backups, and support tools redact secrets.

## Transport security

- [ ] Require HTTPS/TLS and define certificate ownership and renewal.
- [ ] Validate proxy headers, downgrade prevention, timeouts, and request limits.

## Rate limiting and abuse prevention

- [ ] Enforce distributed per-client, per-route, burst, and global limits.
- [ ] Define abuse signals, containment, investigation, and appeal handling.

## Logging, monitoring, and alerting

- [ ] Define security events, metrics, traces, dashboards, SLOs, and alerts.
- [ ] Protect logs and document retention, deletion, and access review.

## Privacy and data retention

- [ ] Map customer data flows and minimize collected fields.
- [ ] Approve retention, deletion, legal hold, region, and processor policies.

## Incident response

- [ ] Assign on-call and incident roles with tested escalation paths.
- [ ] Exercise containment, recovery, communication, evidence preservation, and review.

## Dependency review

- [ ] Maintain an inventory and vulnerability advisory workflow.
- [ ] Define patch SLAs, provenance checks, and supply-chain controls.

## Legal and terms

- [ ] Obtain qualified review of terms, privacy notices, acceptable use, and claims.
- [ ] Define vulnerability disclosure and customer security contacts.

## Payment security

- [ ] Keep payment, billing, and automatic purchase disabled.
- [ ] Complete a separate payment security and data-scope review before billing.

This is not a security certification and completion does not itself prove legal,
privacy, SOC2, ISO27001, GDPR, payment, or production compliance.
