# Usage, Entitlements, and Rate Limits

Local JSONL logs support request metering by endpoint and client. Entitlement
status reports allowance, usage, remaining decisions, over-limit status, and an
`upgrade_required` signal. `purchase_enabled`, billing, payment processing, and
automatic purchase remain false.

Local rate limits can return HTTP 429 with `ATG_RATE_LIMIT_EXCEEDED`. They are
single-process development controls, not distributed production abuse prevention.
Usage and entitlement records do not create charges or a billing relationship.
