# Local-To-Hosted Migration Notes

Agent Trust Gate currently runs as a localhost-only gateway. Moving it to hosted
infrastructure is an architecture and security program, not a host flag change.
P3-M025 does not deploy anything.

## Network Boundary

Keep `127.0.0.1` as the default. Binding to `0.0.0.0` would expose a wider
network surface and is a future deployment decision requiring a threat model,
security review, firewall and ingress policy, rate limits, abuse controls, and
verified production authentication. Do not treat public binding as a normal
local configuration option.

Terminate HTTPS/TLS at a reviewed ingress or in the service, enforce modern TLS,
automate certificate renewal, and preserve client/request correlation through
trusted proxies. Define trusted proxy behavior before accepting forwarded
identity or address headers.

## Identity, Authorization, And Tenancy

Local API keys provide development hardening and attribution only. A hosted
service needs authenticated workload/customer identity, authorization,
least-privilege roles, tenant isolation, credential rotation and revocation,
account recovery, and auditable administrative changes.

## Secrets And Configuration

Move credentials to managed secret storage. Separate staging and production
configuration, restrict access, audit changes, and test rotation and emergency
revocation. Never place real secrets in `env.example`, source, logs, or images.

## Monitoring And Reliability

Add centralized metrics, tracing, structured logs, alerts, service objectives,
capacity planning, backups, restore tests, incident response, disaster recovery,
and deployment rollback. Local JSONL logs are not a production telemetry or
billing ledger.

## Data, Privacy, And Retention

Inventory action metadata, client identity, usage, reviews, and evidence. Define
minimization, redaction, encryption, access, retention, deletion, backup, and
data-location requirements. Complete privacy and legal review before receiving
customer data.

## Abuse And Commercial Controls

Implement distributed rate limiting, request limits, abuse detection, suspension
workflows, acceptable-use enforcement, and safe error handling. Customer
accounts, payments, billing, and automatic purchase require separate legal,
security, consent, fraud, reconciliation, tax, refund, and dispute designs.
They remain disabled.

## Deployment Decision

Public deployment should follow evidence-backed completion of the production
checklist, staging validation, vulnerability review, operational approval, legal
approval, and a tested rollback plan. This readiness pack does not authorize or
perform deployment and does not expose a public service.
