# Agent Proof Package Field Guide

P3-M132 update: the Enforceable Local Tool-Calling Gate Demo shows how proof
fields such as mandate, evidence, verified intent, freshness, nonce, approval,
and signed proof affect local mock tool-call outcomes. It adds no real tool
execution, live APIs, MCP server functionality, live systems contact, direct
bot messaging, live agent-to-agent communication, payment processing,
settlement execution, production signing, or action execution.

P3-M131 update: the Agent Proof Contract Integration Readiness Pack shows how
these P3-M130 fields can be used in local workflow, tool-call, approval,
governance, session/access, and pre-settlement adapters without adding live
APIs, MCP server functionality, live systems contact, direct bot messaging,
live agent-to-agent communication, payment processing, settlement execution,
production signing, or action execution.

This P3-M130 field guide explains the local agent proof package fields in plain
English. The fields are used by `schemas/agent-proof-package.schema.json` and
`src/agent-proof-contract.ts`.

Core positioning:

Do not trust the agent. Trust the gate pass.

No proof. No permission.

No mandate. No action.

No signed gate pass. No settlement.

No mandate. No evidence. No verified intent. No signed gate pass. No settlement.

## Field Guide

| Field | Why It Exists | When Required | Missing Or Weak Result | What Not To Infer |
|---|---|---|---|---|
| `packageId` | Gives the local proof package a deterministic reference. | Always. | The package cannot be clearly cited. | It is not a production identifier. |
| `contractVersion` | Binds the package to the local P3-M130 contract version. | Always. | Reviewers cannot tell which contract shape is being used. | It is not a live API version. |
| `claimedAgentName` | Captures the agent's claimed name. | Always. | The package is incomplete. | The name alone is not trust. |
| `claimedAgentType` | Describes the local category of claimed agent or owner. | Always. | The verifier cannot reason about expected behaviour. | It is not identity certification. |
| `ownerReference` | Points to the claimed owner or responsible party. | For sensitive or gated actions. | Blocks or escalates when owner context is required. | It is not legal ownership proof. |
| `issuerReference` | Points to the local issuer/verifier reference for the proof. | For signed or gate-pass flows. | Blocks or escalates when issuer context is required. | It is not production key management. |
| `mandateReference` | Shows who authorised the action or review scope. | Required before sensitive action. | Missing mandate blocks or escalates. | It is not a legal mandate guarantee. |
| `permittedActionScope` | States what the agent is allowed to do. | Required before any scoped allow decision. | Scope ambiguity escalates or blocks. | It does not grant action execution. |
| `requestedAction` | States what the agent wants to do now. | Always. | The verifier cannot compare request to scope. | It does not mean the action may run. |
| `evidenceReference` | Points to supporting local evidence. | Required for allow decisions. | Missing evidence requires evidence or blocks. | It is not proof that evidence is true in the outside world. |
| `verifiedIntentStatus` | Indicates whether intent has been checked locally. | Required for sensitive action. | Missing or conflicting intent blocks; unverified intent escalates. | It is not user identity certification. |
| `humanApprovalStatus` | Shows whether human approval is approved, missing, not required, or rejected. | Required for high-risk or human-review flows. | Missing required approval leads to human review. | It is not legal approval. |
| `riskTier` | Captures local risk level. | Always. | High or critical risk requires human review. | It is not a compliance classification. |
| `freshnessStatus` | Shows whether the proof is fresh, missing, stale, replayed, tampered, or malformed. | Required for replay-sensitive gates. | Stale or replayed freshness blocks. | It is not production clock assurance. |
| `nonce` | Provides a local replay-resistance reference. | Required for fresh gate-pass decisions. | Missing nonce blocks or escalates when required. | It is not a production nonce service. |
| `nonceStatus` | Shows whether the nonce is present, stale, replayed, tampered, or malformed. | Required for replay-sensitive gates. | Stale or replayed nonce blocks. | It is not global replay prevention. |
| `signedProofReference` | Points to a local signed proof or signed gate pass. | Required for signed-proof and settlement-sensitive flows. | Missing signed proof requires signed proof. | It is not production signing. |
| `signedProofStatus` | Shows whether the signed proof is present, missing, stale, replayed, tampered, or malformed. | Required for signed-proof gates. | Tampered or malformed proof blocks; missing proof requires signed proof. | It is not production signature validation. |
| `sessionContextReference` | Binds the package to a local session context. | Required where session-specific access matters. | Missing context escalates if required. | It is not browser fingerprinting or tracking. |
| `settlementSensitive` | Marks whether the request is settlement-sensitive. | Required for pre-settlement checks. | Settlement-sensitive flows require signed proof before any local allow. | It does not authorise settlement. |
| `localDemoOnly` | Keeps the artifact inside the local proof boundary. | Always true. | Non-local packages block. | It does not create a live service. |

## Field Rules

- Claimed identity alone is not enough.
- Missing mandate should block or escalate.
- Missing evidence should require evidence or block.
- Missing or unverified intent should block or escalate.
- Stale or replayed nonce/freshness should fail.
- High-risk action should require human review.
- Settlement-sensitive action should require signed proof.
- Valid local control may allow locally only.

## Local Boundary

The field guide is documentation only. It adds no live systems contact, direct
bot messaging, live agent-to-agent communication, autonomous outreach, scraping,
contact harvesting, payment processing, settlement execution, production
signing, production certification, cloud/network calls, or action execution.

Public contact: `gpmiddleton71@gmail.com`.
## P3-M133 Minimal GatePass Core Specification Pack

P3-M133 narrows Agent Trust Gate(TM) around GatePass as the compact local proof primitive. ProofPackage carries supporting material, VerificationContract checks it, Tool Gate enforces it before sensitive actions, and Pre-Settlement Gate blocks settlement-sensitive flows without valid proof. This is local specification, schema, model, example, and test work only; it adds no live APIs, MCP server functionality, live systems contact, direct bot messaging, live agent-to-agent communication, production signing, production-grade crypto, payment processing, settlement execution, real tool execution, or action execution.
## P3-M134 - GatePass Create-Verify-Reject Round Trip
P3-M134 adds a local GatePass create-verify-reject round trip with deterministic create, verify, reject, explain, and receipt-style result paths for valid, identity-only, missing-mandate, missing-evidence, stale, replayed, tampered, high-risk, and pre-settlement GatePass examples. It adds no live APIs, MCP server functionality, live systems contact, direct bot messaging, live agent-to-agent communication, production signing, production-grade crypto, payment processing, settlement execution, real tool execution, or action execution.
