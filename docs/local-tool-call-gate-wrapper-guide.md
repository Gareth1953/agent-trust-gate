# Local Tool-Call Gate Wrapper Guide

P3-M132 adds a local wrapper pattern for intercepting mock sensitive tool calls
before any real action can happen.

Do not trust the agent. Trust the gate pass.

No proof. No permission.

No mandate. No action.

No signed gate pass. No settlement.

No mandate. No evidence. No verified intent. No signed gate pass. No settlement.

## Developer Pattern

The local pattern is:

```text
tool = define local mock tool
policy = define required proof/risk/scope
wrappedTool = gateToolCall(tool, policy)
mock agent proposes action
gate evaluates proof
result decides whether the mock tool would be allowed locally
no real tool action is executed
```

## Copy-Paste Style Example

```ts
import {
  createEnforceableToolGateScenarioInputs,
  evaluateEnforceableToolCall,
} from "./src/enforceable-tool-gate.js";

const input = createEnforceableToolGateScenarioInputs().public_post_allowed_local;
const result = evaluateEnforceableToolCall(input);

if (result.decision === "allow") {
  // Local demo only: record the receipt summary, but do not execute the tool.
  console.log(result.receiptSummary);
}
```

## Where Checks Happen

The wrapper checks:

- mandate: `mandateReference`;
- evidence: `evidenceReference`;
- intent: `verifiedIntentStatus`;
- freshness: `freshnessStatus`;
- replay protection: `nonce` and `nonceStatus`;
- signed proof: `signedProofReference` and `signedProofStatus`;
- human approval: `humanApprovalStatus`;
- risk and settlement policy: local mock tool policy.

## Blocked And Escalated Outcomes

Blocked, escalated, require-evidence, require-human-review, and
require-signed-proof outcomes are returned as local JSON. The result includes
`reasons`, `missingProofItems`, `requiredNextProof`, and `receiptSummary`.

The wrapper never invokes the real tool. `realToolExecuted`, `mockToolInvoked`,
`wouldExecute`, and `actionExecution` remain false.

## No Production Or Live Integration Claim

This guide is local-only. It does not add production integration, live APIs,
MCP server functionality, live systems contact, direct bot messaging, live
agent-to-agent communication, payment processing, settlement execution,
production signing, cloud/network calls, or action execution.

Public contact: `gpmiddleton71@gmail.com`.
## P3-M133 Minimal GatePass Core Specification Pack

P3-M133 narrows Agent Trust Gate(TM) around GatePass as the compact local proof primitive. ProofPackage carries supporting material, VerificationContract checks it, Tool Gate enforces it before sensitive actions, and Pre-Settlement Gate blocks settlement-sensitive flows without valid proof. This is local specification, schema, model, example, and test work only; it adds no live APIs, MCP server functionality, live systems contact, direct bot messaging, live agent-to-agent communication, production signing, production-grade crypto, payment processing, settlement execution, real tool execution, or action execution.
## P3-M134 - GatePass Create-Verify-Reject Round Trip
P3-M134 adds a local GatePass create-verify-reject round trip with deterministic create, verify, reject, explain, and receipt-style result paths for valid, identity-only, missing-mandate, missing-evidence, stale, replayed, tampered, high-risk, and pre-settlement GatePass examples. It adds no live APIs, MCP server functionality, live systems contact, direct bot messaging, live agent-to-agent communication, production signing, production-grade crypto, payment processing, settlement execution, real tool execution, or action execution.
## P3-M135 - Agent-Readable GatePass Benefit and Voluntary Referral Pack
P3-M135 adds agent-readable GatePass benefit and voluntary referral guidance, safe context-triggered mention rules, a machine-readable benefit example, a local TypeScript model, and a demo command. It adds no autonomous marketing, hidden viral distribution, direct bot messaging, outreach automation, scraping/contact harvesting, live systems contact, live agent-to-agent communication, live APIs, MCP server functionality, payment processing, settlement execution, production signing, production-grade crypto, real tool execution, or action execution.
