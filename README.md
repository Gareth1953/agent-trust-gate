# Agent Trust Gate

Agent Trust Gate is a machine-to-machine AI internet utility concept for checking
trust, risk, and approval boundaries before an automated system takes an
important action.

## First local purpose

This initial version is a local, deterministic TypeScript engine. It accepts a
proposed action, applies conservative risk rules, and returns a structured JSON
receipt. It performs no network calls and takes no action itself.

The engine is intended to automate routine internal checks while keeping Gareth
at the final safety gate for public, financial, legal, customer-facing, or
externally binding actions.

## Usage

```ts
import { verifyBeforeAction } from "agent-trust-gate";

const receipt = verifyBeforeAction({
  action_type: "local_file_update",
  description: "Update a local test fixture",
  actor: "build-agent",
  target: "local-workspace",
  estimated_cost_gbp: 0,
  public_action: false,
  external_commitment: false,
  money_movement: false,
  legal_or_compliance_sensitive: false,
  customer_or_user_facing: false,
  evidence: ["Tests cover the intended behavior"],
  rollback_plan: "Revert the local file",
  human_approval_status: "not_requested",
});
```

Example output (IDs and timestamps vary):

```json
{
  "allowed": true,
  "risk_level": "low",
  "human_approval_required": false,
  "approval_reason": null,
  "checks": [
    {
      "check": "public_action",
      "passed": true,
      "severity": "high",
      "message": "public_action is not present."
    }
  ],
  "receipt_id": "atg_8f1a39b0-6a8d-40db-b11e-8c6326f681ac",
  "timestamp": "2026-06-25T10:00:00.000Z",
  "input_summary": {
    "action_type": "local_file_update",
    "description": "Update a local test fixture",
    "actor": "build-agent",
    "target": "local-workspace",
    "estimated_cost_gbp": 0,
    "public_action": false,
    "external_commitment": false,
    "money_movement": false,
    "legal_or_compliance_sensitive": false,
    "customer_or_user_facing": false,
    "evidence_count": 1,
    "has_rollback_plan": true,
    "human_approval_status": "not_requested"
  },
  "recommended_next_step": "Proceed locally as described and retain this receipt.",
  "limitations": [
    "Not legal advice.",
    "Not compliance certification.",
    "Not a security audit.",
    "Does not guarantee safety.",
    "Does not move money.",
    "Does not approve high-risk actions by itself.",
    "Does not replace human approval for high-risk actions."
  ]
}
```

## Local CLI demo

Run the local CLI against one of the example action files:

```sh
npm run verify -- examples/low-risk-internal.json
npm run verify -- examples/public-post.json
npm run verify -- examples/money-movement.json
npm run verify -- examples/legal-sensitive.json
npm run verify -- examples/public-post-approved.json
npm run verify -- examples/money-movement-approved.json
npm run verify -- examples/legal-sensitive.json
```

The CLI reads the local JSON file and prints a formatted verification receipt.
It does not send data to the internet and does not perform the proposed action.

### Approval-status examples

Use `human_approval_status` to make the approval boundary explicit:

- `not_requested`: no approval has been requested.
- `requested`: approval has been requested but not granted.
- `approved`: explicit human approval exists for the exact described action.
- `rejected`: approval was rejected, so the action is blocked.

Approved high-risk examples can be run locally:

```sh
npm run verify -- examples/public-post-approved.json
npm run verify -- examples/money-movement-approved.json
npm run verify -- examples/customer-facing-approved.json
npm run verify -- examples/high-risk-not-approved.json
```

Money movement remains high risk. Without `human_approval_status: "approved"`,
it is blocked. With explicit approval, the receipt can allow it only within the
exact approved scope and still records the high-risk status.

### Local receipt archive

Add `--save` to write the generated receipt into the local `receipts/` folder:

```sh
npm run verify -- examples/public-post.json --save
```

Saved receipts are local only. They are not uploaded, published, transmitted, or
used to perform the proposed action. Receipt JSON files are ignored by Git by
default; `receipts/.gitkeep` keeps the archive folder present in the project.

## Human approval boundary

Explicit human approval is required for public posting, spending, legal or
compliance-sensitive work, customer commitments, external commitments, outreach,
capital movement, payment or money movement, and other high-risk actions.

Money movement is blocked unless `human_approval_status` is explicitly
`"approved"`. Approval applies only to the exact action described in the input;
the receipt does not grant broader authority.

If `human_approval_status` is `"rejected"`, the action is blocked.

Low-risk local or internal actions can be allowed when they have no cost, are
not public or externally binding, do not move money, are not legal,
compliance-sensitive, customer-facing, or user-facing, and include a rollback
plan.

## Limits

- Not legal advice.
- Not compliance certification.
- Not a security audit.
- Does not guarantee safety.
- Does not move money.
- Does not approve high-risk actions by itself.
- Does not replace human approval for high-risk actions.

This first version uses explicit input flags and deterministic rules. It does not
independently verify evidence, identity, authorization, intent, or whether the
input is complete and truthful.

## Future machine-to-machine direction

Future versions may expose the same receipt model through a machine-to-machine
interface so agents, bots, apps, and automated systems can request a check before
acting. Payment handling and x402 integration are intentionally excluded from
this version.
