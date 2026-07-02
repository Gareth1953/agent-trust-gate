# Gareth Global Launch Approval + Upload Instructions

This local pack records whether Gareth approves manual upload of `global-discovery-launch/` for static discovery only. It does not approve a backend, API, live agents, payment, tracking, analytics, or execution.

Cloudflare Pages Direct Upload is recommended because it supports a manual static-folder upload without exposing the engine. Alternatives remain subject to separate Gareth review.

Run `npm run launch:approval -- examples/gareth-global-launch-approval-input-go.json --pretty`. Renderer flags produce the approval record, upload instructions, pre-upload checklist, post-upload verification checklist, and rollback checklist.

Nothing is uploaded by this command. Gareth must complete every manual approval and verification step. No legal, compliance, audit, quantum-security, or PQC-compliance claim is made.
