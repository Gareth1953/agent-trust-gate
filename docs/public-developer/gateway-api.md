# Gateway API

Local Gateway API Mode binds to `127.0.0.1`. Core routes include health,
decision, approval pack, evidence bundle, OpenAPI, agent manifest, entitlement,
rate-limit status, and readiness reports. Responses are JSON and include a
`request_id`; gateway responses also identify `client_id`.

Optional local development hardening uses `X-ATG-Client-ID` and
`X-ATG-API-Key`. This is not production identity authentication. Raw API keys
must not be logged. Unknown routes and invalid requests use structured errors.
The API returns decisions and evidence only and never executes actions.
