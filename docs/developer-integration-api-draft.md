# Developer Integration API Draft

This document illustrates a possible future local interface for review. It is a draft only, not a live public API, and must not be exposed externally. It must not accept real customer data, connect to live third-party systems, call webhooks, or trigger actions.

## Draft Request

```json
{
  "action_id": "local-action-placeholder",
  "actor_type": "ai_agent",
  "actor_name": "local-demo-agent",
  "proposed_action": "Prepare a customer-facing message for human review.",
  "action_category": "customer_communication",
  "target": "customer-record-placeholder",
  "impact_level": "high",
  "evidence": [
    "local-policy-reference-placeholder"
  ],
  "human_approval_status": "not_requested",
  "requested_output": [
    "decision",
    "risk_signals",
    "approval_requirements",
    "receipt"
  ]
}
```

Draft request fields:

- `action_id`: local correlation identifier, not execution authority
- `actor_type`: type of proposing system
- `actor_name`: non-sensitive local actor label
- `proposed_action`: exact action that would happen later
- `action_category`: stable policy category
- `target`: minimum non-sensitive target descriptor
- `impact_level`: caller's declared expected impact
- `evidence`: local references relevant to review
- `human_approval_status`: explicit approval state
- `requested_output`: requested decision/evidence objects

## Draft Response

```json
{
  "decision": "blocked",
  "allowed": false,
  "blocked": true,
  "risk_level": "high",
  "approval_required": true,
  "gareth_final_approval_required": true,
  "reasons": [
    "integration_disabled",
    "human_approval_missing"
  ],
  "missing_evidence": [
    "approved_message_content",
    "authorized_recipient_scope"
  ],
  "receipt_id": "local-receipt-placeholder",
  "receipt_status": "draft_only",
  "timestamp": "placeholder-iso-timestamp"
}
```

Draft response fields:

- `decision`: `allow`, `blocked`, or `request_human` in a reviewed future contract
- `allowed` and `blocked`: explicit booleans for defensive handling
- `risk_level`: policy risk classification
- `approval_required`: whether exact-scope human review is required
- `gareth_final_approval_required`: live/external integration gate
- `reasons`: deterministic decision reasons
- `missing_evidence`: required evidence not supplied
- `receipt_id`: local audit correlation identifier
- `receipt_status`: local evidence lifecycle state
- `timestamp`: response creation time

## Processing Boundary

The interface would return a policy decision and local evidence only. The caller must not use an `ALLOW` response as proof of identity, legality, compliance, authorization, or safe outcome. The caller would remain responsible for a separate execution decision and all real-world controls.

This draft must not be bound publicly, connected to customer systems, supplied with real customer data, or used to trigger email, publishing, deployment, signup, billing, payment, purchase, tracking, outreach, scanning, webhook, or other actions. External integration remains disabled pending Gareth final approval.
