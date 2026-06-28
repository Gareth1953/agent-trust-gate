# Billing and Machine Purchase Boundaries

Billing and payment modules are readiness models only. `billing_enabled`,
`payment_processing_enabled`, `real_charges_enabled`, and provider configuration
are false. Plans have null prices. No payment details are collected and no payable
invoice is created.

Machine purchase policy defaults to `deny_automatic_purchase`, zero spending
limits, and mandatory human approval. `automatic_purchase_enabled` and payment
execution are false. No account is charged and there is no purchase endpoint.
