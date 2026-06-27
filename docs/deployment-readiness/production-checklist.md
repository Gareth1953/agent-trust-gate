# Production Hosting Checklist

Every applicable item requires documented ownership, evidence, and review before
public hosting. This checklist does not authorize deployment.

## Security

- [ ] Complete a production threat model and architecture review.
- [ ] Define tenant isolation and authorization boundaries.
- [ ] Use managed secret storage; keep secrets out of source and logs.
- [ ] Implement secret rotation, revocation, and emergency invalidation.
- [ ] Define HTTPS/TLS termination and certificate renewal.
- [ ] Enforce request-size, timeout, concurrency, and input limits.
- [ ] Implement distributed rate limiting and denial-of-service protections.
- [ ] Complete dependency, vulnerability, and software supply-chain review.
- [ ] Define patching cadence and security disclosure handling.
- [ ] Run independent penetration and configuration testing.

## Authentication And Accounts

- [ ] Select production-grade workload and human authentication.
- [ ] Implement authorization and least-privilege roles.
- [ ] Define customer, organization, tenant, and service-account models.
- [ ] Implement onboarding, recovery, suspension, and offboarding.
- [ ] Record security-relevant account and authorization changes.
- [ ] Verify that local API keys are not presented as real-world identity proof.

## Monitoring And Operations

- [ ] Add production metrics, traces, structured logs, and correlation IDs.
- [ ] Define service-level indicators, objectives, and alert thresholds.
- [ ] Create on-call, escalation, and incident response procedures.
- [ ] Test backups, restore, disaster recovery, and regional failure behavior.
- [ ] Add capacity planning and saturation alerts.
- [ ] Define production support ownership and maintenance windows.
- [ ] Separate development, staging, and production environments.

## Data And Retention

- [ ] Inventory action, identity, usage, evidence, and log data.
- [ ] Minimize sensitive payload collection and document redaction.
- [ ] Define retention and deletion schedules for every data class.
- [ ] Restrict production log and evidence access.
- [ ] Define encryption requirements in transit and at rest.
- [ ] Document data location, backup retention, and customer deletion handling.
- [ ] Complete privacy and data-processing review.

## Abuse Prevention

- [ ] Define prohibited use and acceptable-use enforcement.
- [ ] Detect credential stuffing, scraping, flooding, and quota bypass attempts.
- [ ] Add account and network-level throttling.
- [ ] Define abuse investigation, suspension, appeal, and evidence handling.
- [ ] Prevent public error responses from leaking secrets or tenant data.

## Billing And Payments

- [ ] Validate pricing and entitlement semantics with pilot customers.
- [ ] Define an auditable usage and billing ledger.
- [ ] Complete tax, invoicing, refund, dispute, and revenue review.
- [ ] Select a payment processor only after legal and security review.
- [ ] Keep purchase and automatic purchase disabled until consent, fraud,
  authorization, and refund controls are approved.
- [ ] Reconcile metering, entitlements, invoices, and payment events.

## Legal And Terms

- [ ] Obtain qualified review of terms of service and acceptable use.
- [ ] Publish an accurate privacy notice and data-processing terms.
- [ ] Review safety, legality, compliance, and performance claims.
- [ ] Define service levels, support terms, warranties, and liability position.
- [ ] Document subprocessors and cross-border data considerations.

## Deployment And Rollback

- [ ] Define reproducible builds and controlled artifact promotion.
- [ ] Require reviewed infrastructure and configuration changes.
- [ ] Use a staging environment representative of production.
- [ ] Define database and contract migration compatibility.
- [ ] Document rollback criteria, steps, ownership, and verification.
- [ ] Test rollback, restore, and incident communication procedures.
- [ ] Confirm public binding is an explicit reviewed deployment decision.

No checklist item deploys Agent Trust Gate or enables payments, billing, or
automatic purchase.
