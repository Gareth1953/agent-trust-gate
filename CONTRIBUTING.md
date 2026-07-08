# Contributing

Contributions should preserve Agent Trust Gate™ as a local-first, `local_demo_only` trust-gate demonstration.

Before submitting a change:

1. Keep the core rule intact: **No mandate. No evidence. No verified intent. No signed gate pass. No settlement.**
2. Do not add live APIs, network or cloud calls, external-agent contact, outreach automation, payment execution, settlement execution, banking or wallet logic, secrets, credentials, action execution, or production cryptographic signing.
3. Use synthetic local fixtures only. Do not submit private, customer, financial, or operational data.
4. Run `npm test`, `npm run build`, and `npm run typecheck`.
5. Update tests and documentation when behavior or public claims change.

AUC is not integrated. Agent Contact System is not integrated. Changes to either boundary require a separate approved mission.
