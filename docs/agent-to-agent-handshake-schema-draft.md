# Agent-to-Agent Handshake Schema Draft

This is a non-live draft schema for future local or tightly controlled review. It is not a live protocol, must not be exposed externally, must not trigger actions, must not accept live customer data, and must not connect to third-party systems. RefusalGraph references are local and draft-only if present.

## Draft Request Fields

| Field | Draft purpose |
| --- | --- |
| `handshake_id` | Local correlation and replay-control identifier |
| `acting_agent_id` | Pseudonymous local acting-agent identifier |
| `acting_agent_name` | Non-sensitive local label |
| `acting_agent_type` | Declared agent or system type |
| `acting_agent_purpose` | Exact declared purpose for this request |
| `receiving_system` | Local placeholder for the intended receiver |
| `proposed_action` | Exact action proposed for later execution by another system |
| `action_category` | Stable policy category |
| `impact_level` | Declared expected impact |
| `target` | Minimum non-sensitive target description |
| `evidence_summary` | Concise evidence description without private content |
| `evidence_references` | Local, controlled evidence or hash references |
| `requested_permissions` | Narrow permissions requested for this action only |
| `human_approval_status` | Explicit approval state |
| `prior_receipt_ids` | Relevant local trust receipt references |
| `requested_decision` | Decision and evidence outputs requested |
| `timestamp` | Draft declaration time |

## Draft Response Fields

| Field | Draft purpose |
| --- | --- |
| `handshake_decision` | `blocked`, `request_human`, `limited`, or future reviewed value |
| `trust_allowed` | Whether the handshake established sufficient trust for its narrow scope |
| `action_allowed` | Whether policy permits the separately controlled action |
| `blocked` | Explicit fail-closed indicator |
| `risk_level` | Evaluated risk classification |
| `approval_required` | Whether exact-scope human approval is required |
| `gareth_final_approval_required` | External/live handshake activation gate |
| `reasons` | Stable decision reason codes |
| `missing_evidence` | Evidence required before reconsideration |
| `required_next_steps` | Non-executing review steps |
| `receipt_id` | Local decision receipt identifier |
| `receipt_status` | Receipt lifecycle state such as `draft_only` |
| `refusalgraph_signal_reference` | Optional local draft refusal-signal reference |
| `timestamp` | Draft response time |

## Draft Request Example

```json
{
  "handshake_id": "handshake-placeholder",
  "acting_agent_id": "agent-placeholder",
  "acting_agent_name": "local-procurement-agent",
  "acting_agent_type": "procurement_agent",
  "acting_agent_purpose": "Request review of a proposed software purchase.",
  "receiving_system": "local-trust-gate-placeholder",
  "proposed_action": "Buy a software service after approval.",
  "action_category": "software_purchase",
  "impact_level": "high",
  "target": "service-placeholder",
  "evidence_summary": "No approved need, vendor review, or spend authority supplied.",
  "evidence_references": [],
  "requested_permissions": ["request_purchase_review"],
  "human_approval_status": "not_requested",
  "prior_receipt_ids": [],
  "requested_decision": ["handshake_decision", "receipt"],
  "timestamp": "placeholder-iso-timestamp"
}
```

## Draft Response Example

```json
{
  "handshake_decision": "blocked",
  "trust_allowed": false,
  "action_allowed": false,
  "blocked": true,
  "risk_level": "high",
  "approval_required": true,
  "gareth_final_approval_required": true,
  "reasons": ["HANDSHAKE_DISABLED", "EVIDENCE_INCOMPLETE", "APPROVAL_MISSING"],
  "missing_evidence": ["approved_business_need", "spend_authority"],
  "required_next_steps": ["require_human_approval", "require_more_evidence"],
  "receipt_id": "local-receipt-placeholder",
  "receipt_status": "draft_only",
  "refusalgraph_signal_reference": "local-refusal-signal-placeholder",
  "timestamp": "placeholder-iso-timestamp"
}
```

The response returns a decision and evidence only. It does not establish real identity, create permanent trust, perform RefusalGraph lookup, authorize a purchase, move money, connect agents, or execute an action. External use requires Gareth final approval.
