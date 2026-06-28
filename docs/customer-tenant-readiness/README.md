# Customer Account and Tenant Readiness

This pack defines local-only customer, account, tenant, client ownership, plan,
and future billing concepts. It is not real customer account management. It
creates no accounts, collects no personal data, and provides no login or signup.

```sh
npm run verify -- --customer-tenant-readiness
npm run verify -- --customer-tenant-readiness --json
npm run verify -- --customer-tenant-readiness --tenants-file examples/customer-tenants/customer-tenants.example.json --json
```

Billing, payment processing, and automatic purchase remain disabled. Production
authentication, secure storage, tenant isolation, privacy review, terms, support,
and incident communication must exist before customer onboarding.
