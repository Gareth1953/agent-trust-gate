# GatePass Round Trip Developer Guide

This guide shows the local developer pattern for the P3-M134 GatePass create-verify-reject round trip.

Do not trust the agent. Trust the GatePass.
No proof. No permission.
No mandate. No action.
No signed GatePass. No settlement.

## Pattern

1. Define the intended action.
2. Create a local GatePass.
3. Verify the GatePass against local context.
4. Receive a structured decision.
5. Reject with clear reasons if invalid.
6. Emit a local receipt/result.
7. Do not execute any real action from this repo.

## Copy-Paste Style Pseudocode

```ts
import {
  createLocalGatePass,
  createGatePassIntegrityHash,
  verifyLocalGatePass,
} from "./gatepass-round-trip.js";

const gatePass = createLocalGatePass({
  scenarioId: "valid_allow_local",
  issuerReference: "issuer_local_gatepass_round_trip",
  subjectReference: "local_demo_agent_or_workflow",
  audienceReference: "agent_trust_gate_local_verifier",
  requestedAction: "read_public_docs",
  mandateReference: "mandate_read_public_docs",
  evidenceReferences: ["evidence_read_public_docs"],
  intentStatus: "verified",
  riskTier: "low",
  sensitiveToolCall: false,
  highRiskAction: false,
  approvalRequired: false,
  approvalStatus: "not_required",
  approverReference: null,
  exp: "2030-01-01T00:00:00.000Z",
  nonce: "nonce_local_round_trip_example",
  signatureStatus: "present",
  signedProofReference: "local_signed_gatepass_reference",
  settlementSensitive: false,
  localDemoOnly: true,
});

const result = verifyLocalGatePass(gatePass, {
  scenarioId: "valid_allow_local",
  expectedAudience: "agent_trust_gate_local_verifier",
  expectedAction: "read_public_docs",
  expectedIntegrityHash: createGatePassIntegrityHash(gatePass),
  consumedNonces: [],
  settlementSensitive: false,
  requireSignedGatePass: false,
  localDemoOnly: true,
  localOnly: true,
  liveSystemsContact: false,
  directBotMessaging: false,
  autonomousOutreach: false,
  outreachAutomation: false,
  liveAgentToAgentCommunication: false,
  externalAgentContact: false,
  liveApi: false,
  mcpServer: false,
  cloudNetworkCall: false,
  secretsOrCredentials: false,
  paymentAuthorisation: false,
  settlementAuthorisation: false,
  walletBankingLogic: false,
  productionSigning: false,
  productionGradeCrypto: false,
  productionCertification: false,
  actionExecution: false,
  realToolExecuted: false,
});
```

## Decision Shape

The result decision is one of:

- `allow`
- `block`
- `escalate`
- `require_evidence`
- `require_human_review`
- `require_signed_proof`

An `allow` means local allowance only. It is not permission to execute real tools, send messages, make payments, settle anything, or contact external systems.

## Developer Responsibilities

Developers using the pattern outside this repo would need their own safe system design for:

- real signing and key management
- durable nonce storage
- approval workflow
- audit logging
- tool execution boundaries
- production threat modelling
- legal, compliance, and security review

This repo provides local modelling only.

Public contact: gpmiddleton71@gmail.com
## P3-M135 - Agent-Readable GatePass Benefit and Voluntary Referral Pack
P3-M135 adds agent-readable GatePass benefit and voluntary referral guidance, safe context-triggered mention rules, a machine-readable benefit example, a local TypeScript model, and a demo command. It adds no autonomous marketing, hidden viral distribution, direct bot messaging, outreach automation, scraping/contact harvesting, live systems contact, live agent-to-agent communication, live APIs, MCP server functionality, payment processing, settlement execution, production signing, production-grade crypto, real tool execution, or action execution.

## P3-M136 - Agent Trust Language and GatePass Vocabulary Pack
P3-M136 adds a shared GatePass Trust Language vocabulary, safe phrasebook, local dialogue examples, safety boundary, machine-readable vocabulary example, local TypeScript model, and demo command. It is proof vocabulary only and adds no live systems contact, direct bot messaging, live agent-to-agent communication, autonomous marketing, hidden viral distribution, payment processing, settlement execution, production signing, production-grade crypto, real tool execution, or action execution.
## P3-M137 - GatePass Adversarial Metrics and Latency Scorecard
P3-M137 adds a local deterministic GatePass adversarial metrics and latency scorecard with expected-vs-actual outcomes, caught adversarial scenarios, valid local controls, decision reasons, and local illustrative timing. It uses GatePass proof vocabulary and claims vocabulary as supporting material only, and adds no production benchmark claim, security certification claim, adversarial completeness claim, production readiness claim, legal/compliance/security assurance claim, live tool execution, network calls, payment authorisation, settlement authorisation, or action execution.

## P3-M138 - GatePass Developer Wrapper and Local Integration Example
P3-M138 adds a local deterministic GatePass developer wrapper and local framework-style integration example. It shows `wrapGatePassTool` gating local mock tool calls before action, uses GatePass proof vocabulary and GatePass claims vocabulary as supporting material only, and adds no production middleware claim, production readiness claim, security certification claim, live framework execution, real tool execution, network calls, payment authorisation, settlement authorisation, or action execution.

## P3-M139 - One-Command Reviewer Demo Kit
P3-M139 adds a local deterministic one-command reviewer demo kit for the GatePass lifecycle, adversarial scorecard, developer wrapper, local integration summary, safety boundary, and JSON report output. It uses GatePass proof vocabulary and GatePass claims vocabulary as supporting material only, and adds no production middleware claim, production benchmark claim, security certification claim, production readiness claim, live tool execution, network calls, payment authorisation, settlement authorisation, or action execution.
