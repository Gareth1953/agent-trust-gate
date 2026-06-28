# Incident Record Template

`npm run verify -- --incident-template` prints a blank local record. Use
`--output incidents/<name>.json` to save it. Generated JSON records in
`incidents/` are ignored by Git.

The template captures severity, status, summary, timeline, affected clients and
endpoints, request IDs, suspected cause, containment and recovery actions,
evidence links, and lessons learned. Do not place raw API keys or unrelated
sensitive payloads in incident records.

The template does not send external alerts, automate customer notification, file
legal reports, process payments, or execute actions.
