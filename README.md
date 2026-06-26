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

### Policy profiles

P3-M005 adds local policy profiles so different teams can run the same Trust
Gate checks with different trust modes without changing source code.

Available profiles:

- `standard`: default profile; matches the base Agent Trust Gate rules.
- `strict`: records a stricter approval threshold for medium-risk and high-risk
  actions.
- `regulated`: records a regulated-style local policy for medium-risk and
  high-risk actions and adds regulated policy metadata to the receipt.

Example commands:

```sh
npm run verify -- examples/public-post.json --policy standard
npm run verify -- examples/public-post.json --policy strict
npm run verify -- examples/public-post.json --policy regulated --save
npm run verify -- --audit
```

Policy profiles do not guarantee legal compliance. They provide local evidence
of which trust policy was applied before an AI action was allowed or blocked.
Profiles may tighten, label, or clarify requirements, but they do not weaken the
base safety rules.

### Machine-readable integration mode

P3-M006 adds machine-readable CLI output for agents, scripts, CI tools, and
business systems that need a stable local trust decision before an action runs.

Use `--json` to print integration-friendly JSON only:

```sh
npm run verify -- examples/public-post.json --json
npm run verify -- examples/public-post.json --policy regulated --json
npm run verify -- examples/public-post.json --policy regulated --save --json
npm run verify -- --audit --json
npm run verify -- --list-receipts --json
```

Use `--fail-on-block` when a calling script should treat a blocked or not
allowed action as a failed gate:

```sh
npm run verify -- examples/public-post.json --json --fail-on-block
```

Exit codes:

- `0`: command completed; when `--fail-on-block` is used, the action was
  allowed.
- `1`: input or configuration error, such as an unreadable file, invalid JSON,
  or unknown policy profile.
- `2`: action was not allowed when `--fail-on-block` was used.

Machine-readable mode is for integration with other systems. It does not execute
actions. It only returns a local trust decision.

### Stable Action & Decision Contract

P3-M007 defines a stable local contract for action descriptor input and
machine-readable trust decision output.

Current contract version:

```text
atg.v1
```

Contracts matter because other agents, scripts, CI tools, and business systems
need predictable input fields, predictable output fields, clear schema
versioning, and stable error behaviour before they can safely integrate with a
trust gate.

Inspect the contract locally:

```sh
npm run verify -- --contract
npm run verify -- --contract --json
npm run verify -- examples/public-post.json --json
```

The minimum required action descriptor fields are:

- `action_type`
- `actor`
- `target`
- `description`

The contract defines the shape of the local trust decision. It does not
guarantee safety, truth, legality, or compliance.

### Integration Starter Pack

P3-M008 adds local integration examples for scripts, agents, CI steps, and
business workflows that need to ask Agent Trust Gate for a pre-action decision.

Example commands:

```sh
npm run verify -- examples/integrations/sample-public-post.json --json
npm run verify -- examples/integrations/sample-public-post.json --json --fail-on-block
node examples/integrations/node-preflight.mjs
powershell -ExecutionPolicy Bypass -File examples/integrations/powershell-preflight.ps1
```

The starter pack includes:

- a Node.js preflight example
- a PowerShell preflight example
- safe sample action descriptors for public posting, customer-facing messages,
  and synthetic money movement checks
- a local integration README under `examples/integrations/`

Integration examples do not execute actions. They demonstrate how another system
can ask Agent Trust Gate for a local trust decision before proceeding.

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

### Local receipt audit viewer

P3-M004 adds a local-only audit viewer for saved receipts. It reads JSON receipt
files from `receipts/`, ignores non-JSON files, handles a missing archive folder,
and marks malformed receipt files instead of crashing.

Create a local receipt:

```sh
npm run verify -- examples/public-post.json --save
```

Print an audit summary:

```sh
npm run verify -- --audit
```

List saved receipts and key fields:

```sh
npm run verify -- --list-receipts
```

Receipts are local evidence records for review and demos. They are not sent,
uploaded, published, or used to perform the proposed action.

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
