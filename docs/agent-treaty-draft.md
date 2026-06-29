# Agent Treaty Draft

Agent Treaty is a draft machine-readable agreement between agents before any action is accepted. It gives the clearing layer a structured proposal to evaluate alongside the handshake, current policy, approval state, evidence, and any permitted refusal intelligence.

This is a draft only. It is not legally binding, does not execute payment, does not execute action, does not connect to external agents, and does not expose private data. It must remain local-only unless Gareth approves external use after all required reviews.

## Draft Treaty Fields

| Field | Draft purpose |
| --- | --- |
| `treaty_id` | Local proposal identifier |
| `requesting_agent_id` | Pseudonymous local requesting-agent placeholder |
| `receiving_agent_id` | Pseudonymous local receiving-agent placeholder |
| `requested_action` | Exact action proposed for later controlled execution |
| `action_category` | Stable policy category |
| `proposed_value` | Non-binding placeholder value context |
| `proposed_fee` | Non-active placeholder clearing or verification fee |
| `payment_intent_status` | Disabled, unclear, review-required, or future reviewed status |
| `requested_permissions` | Narrow permissions requested for this action only |
| `evidence_summary` | Minimal non-private evidence summary |
| `evidence_hashes` | Local hash-only evidence references |
| `approval_status` | Exact human approval state |
| `risk_level` | Current risk classification |
| `impact_level` | Expected impact and reversibility classification |
| `refusalgraph_check_status` | `not_executed` in the local draft |
| `clearance_required` | Whether clearing review is required before action |
| `completion_terms` | Proposed evidence-based completion conditions |
| `dispute_terms` | Proposed review and correction conditions |
| `expiry_time` | Time after which the proposal must be reevaluated |
| `status` | `draft_only`, blocked, expired, or future reviewed state |

## Safety Rules

- Use placeholders, categories, and hashes rather than private data.
- Do not include real customer, company, account, wallet, payment, credential, or endpoint details.
- Proposed value and fee do not authorize payment or establish a tariff.
- Permissions must be exact, minimal, time-bounded, and revocable.
- Approval must be attributable and valid for the exact treaty.
- Missing or stale evidence, unclear identity, or incomplete approval must block clearance.
- RefusalGraph references are local draft intelligence, not identity or guilt records.
- Completion and dispute terms are proposals, not automated enforcement.
- Treaty acceptance must not trigger action, payment, billing, settlement, or receipt exchange.

## Draft Treaty Example

```json
{
  "treaty_id": "treaty-placeholder",
  "requesting_agent_id": "requesting-agent-placeholder",
  "receiving_agent_id": "receiving-agent-placeholder",
  "requested_action": "Review a placeholder data-quality report.",
  "action_category": "professional_task",
  "proposed_value": "placeholder_only_not_priced",
  "proposed_fee": null,
  "payment_intent_status": "not_enabled",
  "requested_permissions": ["review_placeholder_report"],
  "evidence_summary": "No private source data is included.",
  "evidence_hashes": ["hash-placeholder"],
  "approval_status": "not_requested",
  "risk_level": "medium",
  "impact_level": "low",
  "refusalgraph_check_status": "not_executed",
  "clearance_required": true,
  "completion_terms": ["return_receipt_only"],
  "dispute_terms": ["require_human_review"],
  "expiry_time": "placeholder-iso-timestamp",
  "status": "draft_only"
}
```

The example creates no legal agreement, connection, fee, payment, settlement, receipt exchange, or action. External use requires Gareth final approval.
