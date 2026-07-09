# Agent-Readable Capability Statement

This is a future-facing, local, non-operational draft for review. It is not a live endpoint, public agent registry entry, API service, or invitation for agents to execute actions.

```json
{
  "service_name": "Agent Trust Gate",
  "purpose": "Pre-action / pre-settlement trust enforcement",
  "public_contact_email": "gpmiddleton71@gmail.com",
  "public_contact_purpose": "Human developer, agent-system, integration, security, and public project enquiries only",
  "public_contact_boundary": "Not a live API endpoint, automated agent contact route, outreach automation, support SLA, payment, settlement, or hosted service",
  "current_status": "local_demo_only",
  "live_payments": false,
  "live_settlement": false,
  "external_agent_contact": false,
  "network_calls": false,
  "action_execution": false
}
```

## A. What The Gate Accepts

Local demo action requests only. Inputs describe synthetic requests for local review; they are not transmitted to an external service.

## B. What The Gate Checks

- Mandate presence, scope, and expiry.
- Evidence presence and freshness.
- Verified intent.
- Spend or action limits.
- Approval status.
- Risk tier.
- Receipt and audit output.

## C. Possible Outputs

- `signed_gate_pass`
- `review_receipt`
- `refusal_receipt`

## D. Refusal And Review Conditions

- No mandate.
- Missing evidence.
- Stale evidence.
- Missing verified intent.
- Over limit.
- Missing approval.
- Unsafe or unsupported request.

## E. Safety Boundaries

The statement describes local proof-of-flow capability only. No real agent can connect, act, pay, settle, call tools, or execute through it. Future publication, hosted sandbox use, or agent-system integration requires separate Gareth approval and a separate readiness gate.

The public contact email is human-readable project metadata only. It does not activate autonomous outreach, automated agent contact, live support, payment, settlement, or hosted service availability.

## F. Code-Readable Integration Assets

Future developers and agent systems can inspect the static agent-trust-gate.manifest.json, documentation schemas in schemas/, synthetic examples/integration-*.json files, and the [local money-gate proof](local-end-to-end-money-gate-proof-pack.md). The [code-readable integration pack](code-readable-developer-integration-pack.md) explains how these files fit together.

These are local files only. They do not create a live API, hosted sandbox, external-agent connection, payment rail, settlement capability, or action executor.

**No mandate. No evidence. No verified intent. No signed gate pass. No settlement.**
