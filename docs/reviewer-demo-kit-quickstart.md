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
- optional Embedded Commerce GatePass summary;
- allow/block/require-evidence/require-human-review/require-signed-GatePass outcomes;
- local illustrative timing summary;
- safety boundary and limitations;
- public contact email.

`--summary-only` keeps the text shorter while still showing lifecycle, scorecard, wrapper, and safety summaries.

`--json` prints valid JSON only so reviewer tools can parse the local report.

After the reviewer kit, reviewers assessing commerce use cases can run the optional specialist demo:

```powershell
npm run demo:commerce-gatepass
npm run demo:commerce-gatepass -- --summary-only
npm run demo:commerce-gatepass -- --json
```

It checks synthetic final baskets against mandate, limits, substitution policy, delivery reference, approval, replay state, and evidence. It creates no checkout, payment authorisation, settlement execution, retailer integration, AI-provider integration, network call, A2A service, or MCP service.

## How To Read Outcomes

- `allow`: the proof is valid enough for local mock allowance only.
- `block`: proof is missing, stale, replayed, tampered, identity-only, out of scope, or unsafe.
- `require_evidence`: evidence is missing or incomplete.
- `require_human_review`: the action is high risk or approval is required.
- `require_signed_proof`: the action is settlement-sensitive or requires a signed GatePass.

## Boundary

GatePass is a scoped, time-bound, action-specific proof primitive for agent actions.

No signed GatePass. No settlement.

This quickstart is local mock/demo execution only. It is not production middleware, not a production benchmark, not security certification, and not a legal/compliance/security assurance.

Public contact: gpmiddleton71@gmail.com

## P3-M140A - Public README / Reviewer Positioning Polish

P3-M140A sharpens the public README and reviewer-facing positioning so the recommended first run is `npm run demo:reviewer-kit`, GatePass remains the headline proof primitive, and Agent Trust Language remains supporting material only. It uses GatePass proof vocabulary and GatePass claims vocabulary as supporting material and adds no feature layer, external integration, production middleware claim, production benchmark claim, security certification claim, legal/compliance/security assurance, real tool execution, network calls, payment authorisation, settlement authorisation, or action execution.

## P3-M140 - ATG Strategic Foresight Layer
P3-M140 adds a local-only strategic foresight advisory layer for manually supplied market, protocol, agent, AGI/agent-risk, quantum/post-quantum, standards, and reviewer/developer feedback signals. It follows Watch -> Analyse -> Compare -> Recommend -> Gareth approves -> Dave creates build mission -> Codex implements locally. It recommends only and adds no live monitoring, scraping, autonomous learning, autonomous outreach, autonomous product changes, autonomous roadmap changes, autonomous code changes, prediction guarantee, network calls, payment authorisation, settlement authorisation, real tool execution, or action execution.
