# Sandbox End-to-End Smoke Test

This local command verifies allowed sandbox engine use, non-allowlisted denial, missing-entitlement denial, and disabled live capabilities.

`npm run smoke:sandbox -- examples/sandbox-end-to-end-smoke-test-input.json --pretty`

A pass means all three checks behaved correctly with no action, network, public API, payment, billing, settlement, tracking, analytics, deployment, or publishing. Gareth approval is required before live or global testing.
