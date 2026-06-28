# Tenant and Client Mapping

Future mapping concepts are `client_id`, `tenant_id`, `account_id`, `plan_code`,
`entitlement_status`, `usage_owner`, and `billing_owner`. The safe example maps a
placeholder local client to one placeholder tenant and account.

The example contains no API key and no personal data. Mapping is local planning
metadata only; it does not authorize a real identity, create an account, change
entitlements, or establish a billing relationship. Production mappings require
tenant isolation, least privilege, auditable changes, revocation, and review.
