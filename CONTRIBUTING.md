# Contributing

## Approved operational upgrade scope

Gareth's explicit 18 October 2026 instruction authorises a separate operational
plugin path rather than further fixture-only demonstrations. The new
`src/operational/` entry points may run explicitly configured authenticated
HTTP/TLS services and commit versioned non-payment JSON records. Their identity,
keys, clock and data must come from the operator, never evaluation fixtures.
Gareth additionally approved Microsoft Entra support on 18 October: explicit
public-key discovery and MSAL-based human sign-in are within this operational
path. This does not authorise tenant purchases, creating cloud resources,
changing tenant security policies, or activating an unconfigured deployment.
The legacy evaluation package and sealed archives retain their boundaries.
No payment, banking, wallet, settlement, outreach or arbitrary third-party
execution is authorised by this bounded implementation. Operational changes
also require `npm run test:operational` and exact-archive installation tests.

The historical contribution rules below continue to apply to the evaluation
editions; they must not be used to imply the new candidate is fixture-only.

Contributions should preserve Agent Trust Gate™ as a local-first, `local_demo_only` trust-gate demonstration.

Before submitting a change:

1. Keep the core rule intact: **No mandate. No evidence. No verified intent. No signed gate pass. No settlement.**
2. Do not add live APIs, network or cloud calls, external-agent contact, outreach automation, payment execution, settlement execution, banking or wallet logic, secrets, credentials, action execution, or production cryptographic signing.
3. Use synthetic local fixtures only. Do not submit private, customer, financial, or operational data.
4. Run `npm test`, `npm run build`, and `npm run typecheck`.
5. Update tests and documentation when behavior or public claims change.

AUC is not integrated. Agent Contact System is not integrated. Changes to either boundary require a separate approved mission.
