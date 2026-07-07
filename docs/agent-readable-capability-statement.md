# Agent-Readable Capability Statement

This is a future-facing, local, non-operational draft for review. It does not advertise or expose a live service.

```json
{
  "service_name": "Agent Trust Gate",
  "purpose": "Local pre-action and pre-settlement trust review",
  "accepts": "Local synthetic action request JSON",
  "checks_performed": [
    "mandate",
    "evidence freshness",
    "verified intent",
    "limits",
    "required approval"
  ],
  "possible_outputs": [
    "signed_gate_pass",
    "review_receipt",
    "refusal_receipt"
  ],
  "refusal_conditions": [
    "missing or expired mandate",
    "missing or stale evidence",
    "missing verified intent",
    "limit exceeded",
    "required approval missing"
  ],
  "safety_boundaries": [
    "local proof artifacts only",
    "no action execution",
    "no payment or settlement execution",
    "no network or external agent contact"
  ],
  "current_status": "local_demo_only",
  "live_payments": false,
  "live_settlement": false,
  "external_agent_contact": false
}
```

**No mandate. No evidence. No verified intent. No signed gate pass. No settlement.**

Future publication or agent-system use requires separate Gareth approval and a separate readiness gate.
