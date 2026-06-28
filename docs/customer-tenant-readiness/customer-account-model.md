# Customer Account Model

The local model separates an account owner from one or more tenants. A tenant may
own local client identifiers, a plan code, usage attribution, and a future billing
relationship. Placeholder account and tenant IDs are non-personal identifiers.

There is no real account database, login, signup, password, session, recovery,
suspension, or customer support workflow. No real customer accounts are created.
Production operation requires authentication, authorization, lifecycle controls,
secure storage, tenant isolation, audit records, support, deletion, and recovery.
