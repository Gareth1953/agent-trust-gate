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

### Batch Preflight Review

P3-M009 adds batch review for local folders of proposed action descriptors. This
matters for agent workflows because real agents and business systems often
prepare several actions before doing anything. Batch review lets a supervising
system or human see which proposed actions are allowed, blocked, invalid, or
require approval before anything proceeds.

Example commands:

```sh
npm run verify -- --batch examples/integrations
npm run verify -- --batch examples/integrations --json
npm run verify -- --batch examples/integrations --policy regulated --json
npm run verify -- --batch examples/integrations --json --fail-on-block
```

Batch mode reads local `.json` files from the selected directory, ignores
non-JSON files, and returns one summary plus per-action results. Malformed JSON
and invalid action descriptors are reported in the batch result instead of
crashing the review.

Batch review does not execute actions. It reviews local proposed action
descriptors and returns trust decisions before anything proceeds.

### Human Approval Pack

P3-M010 adds local approval packet generation for actions that need human
review. Approval packets matter because they create a simple evidence record of
what the AI wanted to do, why the action was risky, which policy was applied,
whether the gate allowed or blocked it, and what a human must review before
anything proceeds.

Example commands:

```sh
npm run verify -- examples/public-post.json --approval-pack
npm run verify -- examples/public-post.json --policy regulated --approval-pack
npm run verify -- examples/public-post.json --policy regulated --approval-pack --json
npm run verify -- examples/public-post.json --policy regulated --approval-pack --save-approval-pack
```

Approval packets are local evidence records. Saved packets are written to
`approval-packs/`, and generated `approval-packs/*.json` files are ignored by
Git by default.

Approval packets do not execute actions. They do not guarantee legal compliance.
They help a human reviewer decide whether an AI action should proceed.

### Human Review Decision Record

P3-M011 adds local human review decision records after an approval pack has been
reviewed. This matters because businesses need evidence of the full oversight
chain: the AI proposed an action, Agent Trust Gate assessed it, an approval pack
was created, a human reviewed it, and a separate decision record was saved.

Review records are local append-only evidence files. Creating a review record
does not mutate or overwrite the original approval pack.

Example commands:

```sh
npm run verify -- --review-approval-pack approval-packs/example_approval_pack.json --decision approved --reviewer "Gareth Price"
npm run verify -- --review-approval-pack approval-packs/example_approval_pack.json --decision rejected --reviewer "Gareth Price"
npm run verify -- --review-approval-pack approval-packs/example_approval_pack.json --decision needs_more_info --reviewer "Gareth Price"
npm run verify -- --review-approval-pack approval-packs/example_approval_pack.json --decision approved --reviewer "Gareth Price" --json
npm run verify -- --review-approval-pack approval-packs/example_approval_pack.json --decision approved --reviewer "Gareth Price" --save-review-record
```

Human review records are local evidence records. They do not execute actions,
authenticate reviewers, guarantee legality, or prove compliance.

### Human Review Audit Viewer

P3-M012 adds local audit and list commands for saved human review decision
records. Review audits matter because businesses need to inspect the approval
trail after decisions are made: how many decisions were approved, rejected, or
marked `needs_more_info`, which approval packs were reviewed, and whether the
stored approval pack hash still matches the referenced approval pack.

Example commands:

```sh
npm run verify -- --audit-reviews
npm run verify -- --audit-reviews --json
npm run verify -- --list-review-records
npm run verify -- --list-review-records --json
```

Approval pack integrity status:

- `match`: the referenced approval pack exists and its SHA-256 hash matches the
  hash stored in the review record.
- `mismatch`: the referenced approval pack exists but its hash differs.
- `missing`: the referenced approval pack path does not exist.
- `not_checked`: integrity was not checked.

Review audit mode inspects local evidence records only. It does not execute
actions, authenticate reviewers, guarantee legality, or prove compliance.

### Evidence Bundle Export

P3-M013 adds local evidence bundle export. Evidence bundles consolidate one
human review record and its linked approval pack into a single explanation file
for demos, client review, or internal audit support.

Bundles show the proposed AI action, Agent Trust Gate decision, applied policy
profile, whether human approval was required, the human review decision, approval
pack hash integrity, and safety disclaimers.

Example commands:

```sh
npm run verify -- --evidence-bundle approval-reviews/example_review.json
npm run verify -- --evidence-bundle approval-reviews/example_review.json --json
npm run verify -- --evidence-bundle approval-reviews/example_review.json --save-evidence-bundle
npm run verify -- --evidence-bundle approval-reviews/example_review.json --save-evidence-bundle --json
```

Approval pack integrity status:

- `match`: the linked approval pack exists and its SHA-256 hash matches the
  review record.
- `mismatch`: the linked approval pack exists but its hash differs, or it cannot
  be parsed as a valid approval pack.
- `missing`: the linked approval pack path does not exist.

Evidence bundles are local explanation records. They do not execute actions,
authenticate reviewers, guarantee legality, or prove compliance.

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
