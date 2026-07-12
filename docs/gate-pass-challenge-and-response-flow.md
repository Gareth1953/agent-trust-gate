# Gate Pass Challenge And Response Flow

P3-M132 update: the Enforceable Local Tool-Calling Gate Demo applies the
gate-pass challenge/response flow before mock sensitive tool calls. It emits
local receipt-style results and adds no real tool execution, live APIs, MCP
server functionality, live systems contact, direct bot messaging, live
agent-to-agent communication, payment processing, settlement execution,
production signing, or action execution.

P3-M131 update: the Agent Proof Contract Integration Readiness Pack shows how
this challenge/response flow can be used in local workflow, tool-call,
approval, governance, session/access, and pre-settlement adapters without
adding live APIs, MCP server functionality, live systems contact, direct bot
messaging, live agent-to-agent communication, payment processing, settlement
execution, production signing, or action execution.

P3-M130 adds a local challenge-and-response shape for agent proof packages. A
receiving system can state what proof it wants, an agent or owner can present a
local proof package, and the local verifier can return a deterministic result.

Core positioning:

Do not trust the agent. Trust the gate pass.

No proof. No permission.

No mandate. No action.

No signed gate pass. No settlement.

No mandate. No evidence. No verified intent. No signed gate pass. No settlement.

## Local Flow

1. The system asks for proof using a local gate-pass challenge.
2. The agent or owner presents a local agent proof package.
3. The verifier checks the package against a local verification request.
4. Missing mandate, evidence, intent, freshness, nonce, or signed proof fails,
   blocks, escalates, or requires more proof.
5. Stale or replayed proof fails.
6. High-risk proof packages require human review.
7. Settlement-sensitive proof packages require signed proof.
8. A valid local control may allow locally.
9. No live action or settlement is executed.

## Challenge

A gate-pass challenge states:

- challenge id;
- verifier reference;
- requested action;
- required mandate;
- required evidence;
- required intent verification;
- required human approval;
- required freshness;
- required nonce;
- required signed proof;
- expiry;
- `localDemoOnly: true`.

Example:

- [Basic gate-pass challenge](../examples/gate-pass-challenge-basic.json)
- [Settlement-sensitive gate-pass challenge](../examples/gate-pass-challenge-settlement-sensitive.json)

## Response

The agent proof package responds with:

- claimed agent name and type;
- owner and issuer references;
- mandate and action scope;
- requested action;
- evidence reference;
- verified intent status;
- human approval status;
- risk tier;
- freshness and nonce status;
- signed proof reference and status;
- session context reference;
- settlement sensitivity;
- `localDemoOnly: true`.

Examples:

- [Valid local proof package](../examples/agent-proof-package-valid-local-control.json)
- [Identity-only invalid package](../examples/agent-proof-package-identity-only-invalid.json)

## Verification Result

The local verifier returns one of:

- `allow`
- `block`
- `escalate`
- `require_evidence`
- `require_human_review`
- `require_signed_proof`

Example results:

- [Allowed local result](../examples/agent-proof-verification-result-allowed-local.json)
- [Requires evidence result](../examples/agent-proof-verification-result-requires-evidence.json)
- [Requires human review result](../examples/agent-proof-verification-result-requires-human-review.json)

Each result records reasons, missing proof items, next required proof, gate-pass
meaning, public contact metadata, and disabled authority flags:

- `liveSystemsContact: false`
- `directBotMessaging: false`
- `autonomousOutreach: false`
- `liveAgentToAgentCommunication: false`
- `paymentAuthorisation: false`
- `settlementAuthorisation: false`
- `actionExecution: false`
- `productionCertification: false`

## What Fails

- Claimed identity with no proof blocks.
- Missing mandate blocks or escalates.
- Missing evidence requires evidence or blocks.
- Unverified intent escalates or blocks.
- Stale or replayed nonce/freshness blocks.
- High-risk sessions require human review.
- Settlement-sensitive requests require signed proof.

## What Does Not Happen

This flow does not contact live systems, send direct bot messages, negotiate with
external agents, process payments, execute settlement, run wallet/banking logic,
perform production signing, certify identity, certify security, or execute
actions.

Public contact for human-reviewed enquiries: `gpmiddleton71@gmail.com`.
## P3-M133 Minimal GatePass Core Specification Pack

P3-M133 narrows Agent Trust Gate(TM) around GatePass as the compact local proof primitive. ProofPackage carries supporting material, VerificationContract checks it, Tool Gate enforces it before sensitive actions, and Pre-Settlement Gate blocks settlement-sensitive flows without valid proof. This is local specification, schema, model, example, and test work only; it adds no live APIs, MCP server functionality, live systems contact, direct bot messaging, live agent-to-agent communication, production signing, production-grade crypto, payment processing, settlement execution, real tool execution, or action execution.
## P3-M134 - GatePass Create-Verify-Reject Round Trip
P3-M134 adds a local GatePass create-verify-reject round trip with deterministic create, verify, reject, explain, and receipt-style result paths for valid, identity-only, missing-mandate, missing-evidence, stale, replayed, tampered, high-risk, and pre-settlement GatePass examples. It adds no live APIs, MCP server functionality, live systems contact, direct bot messaging, live agent-to-agent communication, production signing, production-grade crypto, payment processing, settlement execution, real tool execution, or action execution.
## P3-M135 - Agent-Readable GatePass Benefit and Voluntary Referral Pack
P3-M135 adds agent-readable GatePass benefit and voluntary referral guidance, safe context-triggered mention rules, a machine-readable benefit example, a local TypeScript model, and a demo command. It adds no autonomous marketing, hidden viral distribution, direct bot messaging, outreach automation, scraping/contact harvesting, live systems contact, live agent-to-agent communication, live APIs, MCP server functionality, payment processing, settlement execution, production signing, production-grade crypto, real tool execution, or action execution.

## P3-M136 - Agent Trust Language and GatePass Vocabulary Pack
P3-M136 adds a shared GatePass Trust Language vocabulary, safe phrasebook, local dialogue examples, safety boundary, machine-readable vocabulary example, local TypeScript model, and demo command. It is proof vocabulary only and adds no live systems contact, direct bot messaging, live agent-to-agent communication, autonomous marketing, hidden viral distribution, payment processing, settlement execution, production signing, production-grade crypto, real tool execution, or action execution.
## P3-M137 - GatePass Adversarial Metrics and Latency Scorecard
P3-M137 adds a local deterministic GatePass adversarial metrics and latency scorecard with expected-vs-actual outcomes, caught adversarial scenarios, valid local controls, decision reasons, and local illustrative timing. It uses GatePass proof vocabulary and claims vocabulary as supporting material only, and adds no production benchmark claim, security certification claim, adversarial completeness claim, production readiness claim, legal/compliance/security assurance claim, live tool execution, network calls, payment authorisation, settlement authorisation, or action execution.

## P3-M138 - GatePass Developer Wrapper and Local Integration Example
P3-M138 adds a local deterministic GatePass developer wrapper and local framework-style integration example. It shows `wrapGatePassTool` gating local mock tool calls before action, uses GatePass proof vocabulary and GatePass claims vocabulary as supporting material only, and adds no production middleware claim, production readiness claim, security certification claim, live framework execution, real tool execution, network calls, payment authorisation, settlement authorisation, or action execution.
