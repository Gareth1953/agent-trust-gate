# Local Agent Workflow Integration Guide

P3-M132 update: the Enforceable Local Tool-Calling Gate Demo provides a
runnable local mock-agent workflow where proposed sensitive tool calls are
intercepted before action. It adds no real tool execution, live APIs, MCP server
functionality, live systems contact, direct bot messaging, live agent-to-agent
communication, payment processing, settlement execution, production signing, or
action execution.

This guide shows a safe local pattern for placing the P3-M130 proof contract
inside a developer-owned agent workflow.

Do not trust the agent. Trust the gate pass.

No proof. No permission.

No mandate. No action.

No signed gate pass. No settlement.

No mandate. No evidence. No verified intent. No signed gate pass. No settlement.

## Local Pattern

```text
agent proposes action
-> system creates gate-pass challenge
-> agent/owner presents proof package
-> verifier creates verification request
-> proof contract evaluates locally
-> result returns allow/block/escalate/require_evidence/require_human_review/require_signed_proof
-> no real action is executed by this repo
```

## Local-Only Pseudocode

```ts
import {
  evaluateLocalAgentWorkflowIntegration,
  createAgentProofIntegrationScenarioInputs,
} from "./agent-proof-integration-adapter.js";

const scenarios = createAgentProofIntegrationScenarioInputs();
const result = evaluateLocalAgentWorkflowIntegration(scenarios.valid_local_workflow);

if (result.decision !== "allow") {
  // Stop or route locally. Do not execute the proposed action.
}
```

The pseudocode is illustrative. It does not call live APIs, execute actions, or
contact agents.

## Integration Checkpoints

- Define the proposed action before evaluation.
- Create a local gate-pass challenge.
- Require a proof package before sensitive action.
- Create a local verification request.
- Evaluate the package locally.
- Record the result in a local audit/logging route owned by the developer.
- Stop, escalate, require evidence, require human review, or require signed
  proof when the adapter says so.

## What Developers Must Provide Themselves

Developers must provide their own safe system design for:

- collecting real mandates;
- validating evidence sources;
- verifying user intent;
- routing human approval;
- deciding risk tiers;
- maintaining freshness/expiry rules;
- managing nonce/replay protection;
- producing production signing if ever separately approved;
- storing audit logs;
- enforcing real tool execution boundaries.

This repo does not provide those production systems.

## What Not To Infer

Do not infer:

- production readiness;
- certified security;
- legal/compliance/procurement assurance;
- identity or authentication certification;
- live API availability;
- MCP server functionality;
- live agent-to-agent communication;
- payment or settlement authority;
- action execution.

## No Live Integration Claim

This guide is local integration guidance only. It is not an official integration
with any agent framework, browser, payment provider, wallet, bank, cloud
service, marketplace, identity provider, or production system.

Public contact: `gpmiddleton71@gmail.com`.
## P3-M133 Minimal GatePass Core Specification Pack

P3-M133 narrows Agent Trust Gate(TM) around GatePass as the compact local proof primitive. ProofPackage carries supporting material, VerificationContract checks it, Tool Gate enforces it before sensitive actions, and Pre-Settlement Gate blocks settlement-sensitive flows without valid proof. This is local specification, schema, model, example, and test work only; it adds no live APIs, MCP server functionality, live systems contact, direct bot messaging, live agent-to-agent communication, production signing, production-grade crypto, payment processing, settlement execution, real tool execution, or action execution.