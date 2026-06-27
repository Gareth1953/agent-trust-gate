# Hosted Deployment Readiness Pack

This pack prepares Agent Trust Gate for a future security and deployment review.
It does not deploy the gateway, create cloud resources, bind publicly, or enable
payments. The gateway remains local-only and defaults to `127.0.0.1:8787`.

## Local readiness commands

```sh
npm run verify -- --hosted-readiness
npm run verify -- --hosted-readiness --json
npm run verify -- --hosted-readiness --output reports/hosted-readiness.json
```

With Local Gateway API Mode running:

```text
GET http://127.0.0.1:8787/v1/hosted-readiness
```

## Pack contents

- `production-checklist.md`: mandatory security, operations, data, legal, and
  rollback review areas.
- `env.example`: non-secret local defaults and disabled hosted/commercial flags.
- `local-to-hosted-notes.md`: architecture changes required before any public
  deployment decision.

## Gate before public deployment

Do not expose Agent Trust Gate publicly until production authentication,
authorization, tenant isolation, managed secrets, HTTPS/TLS, distributed rate
limiting, abuse controls, monitoring, incident response, retention policies,
legal terms, vulnerability review, staging, and rollback plans are implemented
and independently reviewed.

Local API keys, JSONL logs, client allowances, and readiness reports are useful
development foundations. They are not production security controls or evidence
of legal compliance.

Hosted readiness is a local planning and configuration aid only. It does not
deploy Agent Trust Gate, expose a public service, bill customers, process
payments, enable automatic purchase, execute actions, authenticate real-world
identities, guarantee legality, or prove compliance.
