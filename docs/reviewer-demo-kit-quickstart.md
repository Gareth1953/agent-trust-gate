# Reviewer Demo Kit Quickstart

## Assumptions

This quickstart assumes the repository has been cloned locally and Node dependencies can be installed locally.

```powershell
npm install
npm test
npm run demo:reviewer-kit
npm run demo:reviewer-kit -- --summary-only
npm run demo:reviewer-kit -- --json
```

## What Output To Expect

The default reviewer-kit output includes:

- an overview of GatePass;
- GatePass lifecycle summary;
- adversarial scorecard summary;
- developer wrapper and local integration summary;
- allow/block/require-evidence/require-human-review/require-signed-GatePass outcomes;
- local illustrative timing summary;
- safety boundary and limitations;
- public contact email.

`--summary-only` keeps the text shorter while still showing lifecycle, scorecard, wrapper, and safety summaries.

`--json` prints valid JSON only so reviewer tools can parse the local report.

## How To Read Outcomes

- `allow`: the proof is valid enough for local mock allowance only.
- `block`: proof is missing, stale, replayed, tampered, identity-only, out of scope, or unsafe.
- `require_evidence`: evidence is missing or incomplete.
- `require_human_review`: the action is high risk or approval is required.
- `require_signed_proof`: the action is settlement-sensitive or requires a signed GatePass.

## Boundary

GatePass is a scoped, time-bound, action-specific proof primitive for agent actions.

No signed GatePass. No settlement.

This quickstart is local mock/demo execution only. It is not production middleware, not a production benchmark, not security certification, and not a legal/compliance/security guarantee.

Public contact: gpmiddleton71@gmail.com
