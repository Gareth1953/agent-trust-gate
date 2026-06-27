# Incident Response Template

This template must be assigned, reviewed, tested, and adapted before hosting.

## Detection

- Record alert source, time, affected service, request IDs, and initial indicators.
- Preserve relevant logs without collecting unnecessary secrets or customer data.

## Triage

- Assign severity, incident lead, technical lead, communications lead, and scribe.
- Identify affected tenants, data, credentials, decisions, and infrastructure.

## Containment

- Revoke exposed keys, isolate affected components, and block confirmed abuse.
- Preserve evidence and record every containment decision and approval.

## Eradication

- Remove the root cause, vulnerable dependency, malicious access, or unsafe config.
- Validate clean builds and unaffected trust-decision behavior.

## Recovery

- Restore through reviewed deployment and rollback procedures.
- Monitor for recurrence and confirm service, log, and entitlement integrity.

## Customer communication

- Use approved legal and communications processes for required notifications.
- State verified facts, impact, mitigations, and next updates without speculation.

## Post-incident review

- Document timeline, causes, control failures, corrective actions, owners, and dates.
- Retest controls and update threat models, runbooks, alerts, and training.

## Key rotation and log preservation

- Rotate impacted credentials and verify revocation across every environment.
- Preserve access-controlled evidence according to approved retention and legal guidance.

This template does not create an operational incident response capability and is
not a security certification.
