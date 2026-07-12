# Agent Trust Invitation And Prove-Yourself Protocol

P3-M132 update: the Enforceable Local Tool-Calling Gate Demo turns the
prove-yourself rule into runnable local mock tool-call interception. It adds no
real tool execution, live APIs, MCP server functionality, live systems contact,
direct bot messaging, live agent-to-agent communication, payment processing,
settlement execution, production signing, or action execution.

P3-M131 update: the Agent Proof Contract Integration Readiness Pack shows how
the prove-yourself rule can be placed before local workflow, tool-call,
approval, governance, session/access, and pre-settlement checkpoints without
adding live APIs, MCP server functionality, live systems contact, direct bot
messaging, live agent-to-agent communication, payment processing, settlement
execution, production signing, or action execution.

P3-M129 adds an Agent Trust Invitation and Prove-Yourself Protocol Pack for
Agent Trust Gate.

Core rule:

No mandate. No evidence. No verified intent. No signed gate pass. No settlement.

Core positioning:

Do not trust the agent. Trust the gate pass.

No proof. No permission.

No mandate. No action.

No signed gate pass. No settlement.

## Purpose

This pack explains what proof an AI agent, agent owner, developer, client, or
system should expect before trust is granted for a sensitive action.

It is documentation, local protocol modelling, local examples, agent-readable
guidance, and proof-requirement positioning only. It does not add live systems
contact, direct bot messaging, autonomous outreach, scraping, contact
harvesting, live APIs, live agent-to-agent communication, payment processing,
settlement, hosted services, production signing, or action execution.

## Strategic Principle

We do not chase millions of AI agents. We create the trust rule they must
satisfy.

The rule is simple: an agent should not be trusted because it claims a name,
brand, framework, browser, or owner. It should be evaluated through mandate,
evidence, verified intent, scope, freshness, nonce/replay protection, signed
proof, and session context.

## Why Future AI Agents Need To Prove Themselves

Future agentic systems may request access, call tools, prepare customer-impacting
changes, interact with payment-adjacent workflows, or move toward
settlement-sensitive decisions. A receiving system needs a way to ask for proof
before allowing the next step.

The prove-yourself model gives reviewers a local pattern for that request:

1. An agent or owner wants trust.
2. The system asks for mandate, evidence, intent, scope, freshness, nonce, and
   signed proof where needed.
3. The agent presents a local proof package.
4. The gate evaluates locally.
5. The result is allow, block, escalate, require evidence, require human review,
   or require signed proof.
6. No action or settlement proceeds without a valid gate pass.

## Why Agent Identity Alone Is Not Trust

Claimed identity can be spoofed, stale, incomplete, or unrelated to the current
session. A claimed agent name is useful as context, but it is not a trust basis
by itself.

A system should treat identity as an input to evaluation, not the conclusion.
The question is not "what are you called?" The question is "what proof binds
this agent, this owner, this mandate, this evidence, this intent, this action,
this session, and this moment?"

## What "Prove Yourself" Means

"Prove yourself" means presenting a scoped local proof package before sensitive
permission is granted. The package should let the gate answer:

- who is claiming authority;
- who issued or owns the authority;
- what mandate applies;
- what action scope is permitted;
- what evidence supports the request;
- whether intent is verified;
- whether human approval is required and present;
- whether the proof is fresh;
- whether the nonce prevents replay;
- whether a signed receipt or proof is present where needed;
- whether the current session context matches the request.

No proof means no permission.

## What An Agent Must Present Before Trust Is Granted

An agent should be prepared to present:

- claimed agent identity;
- owner or issuer reference;
- mandate reference;
- permitted action scope;
- requested action;
- evidence reference;
- verified intent status;
- human approval status when required;
- risk tier;
- freshness and expiry status;
- nonce or replay-protection status;
- signed receipt or signed proof reference where required;
- session context where relevant;
- local-only evaluation result.

Missing mandate or missing evidence should block, escalate, or require more
evidence. Stale or replayed proof should fail. High-risk action should require
human review. Settlement-sensitive action should require a valid signed gate
pass.

## What A System Should Ask For

A receiving system, client, marketplace, payment workflow, enterprise reviewer,
or developer tool should ask:

- who are you;
- who authorised you;
- what are you trying to do;
- what are you allowed to do;
- what evidence supports this;
- is intent verified;
- is approval fresh;
- can approval be replayed;
- is there a signed gate pass;
- should this be allowed, blocked, escalated, or reviewed by a human?

The system should not infer permission from agent identity alone.

## What A Gate Pass Proves

A local gate pass may prove that, for a specific local evaluation:

- mandate, evidence, intent, scope, freshness, nonce, and proof status were
  checked;
- the request received a bounded local decision;
- the decision is inspectable;
- settlement-sensitive workflows remained blocked unless a signed gate pass was
  present.

## What A Gate Pass Does Not Prove

A gate pass does not prove universal agent identity, production authentication,
legal/compliance/security certification, payment authority, settlement
authority, or permission to execute actions. It is not a universal agent
standard and does not grant automatic trust.

## How Owners Can Show Agent Trustworthiness

An agent owner or developer can show trustworthiness by showing that their
workflow can produce local receipts, map requests to mandate/evidence/intent
requirements, escalate high-risk actions, and model pre-settlement blocking.

The owner should avoid overclaiming. The safe claim is that the workflow can be
reviewed locally against Agent Trust Gate proof requirements.

## How Clients And Systems Can Verify Agent Authority

Clients and systems can verify authority by inspecting the local proof package,
running the local prove-yourself demo, checking schemas and examples, reviewing
signed receipt/proof prototypes, and confirming that action and settlement
flags remain disabled.

This is a local verification path only. It is not live integration, production
security review, identity certification, payment activation, or legal/compliance
approval.

## Relationship To Existing Discovery And Proof Assets

This pack builds on:

- `llms.txt` for agent-readable discovery;
- `agent-trust-gate.agent-card.json` for static agent-card metadata;
- `agent-trust-gate.manifest.json` for code-readable project metadata;
- schemas for local request, receipt, and money-gate proof structure;
- signed receipts and signed proof examples from P3-M117;
- adversarial examples from P3-M118;
- simplified CLI from P3-M119;
- reference integrations from P3-M120;
- session intent concept from P3-M123;
- controlled visibility and paid enquiry positioning from P3-M128.

Safe local command:

```text
npm run demo:prove-yourself
```

## Public Contact

Public project contact: `gpmiddleton71@gmail.com`

All enquiries are human-reviewed and separately scoped. Contact metadata does
not grant automatic access, acceptance, live integration, payment activation,
settlement authority, or action execution.

## Safety Boundary

P3-M129 is documentation, local protocol modelling, local examples,
agent-readable guidance, and proof-requirement positioning only. It does not add
live systems contact, direct bot messaging, live agent-to-agent communication,
external-agent contact, autonomous contact, outreach automation, email
automation, scraping, contact harvesting, forms, tracking, analytics, telemetry,
hosted calls, paid ads, ad pixels, cloud/network calls, secrets, credentials,
live payment processing, PayPal API integration, Stripe integration, checkout,
webhooks, wallet/banking logic, real settlement execution, production signing,
production key management, AUC integration, Agent Contact System integration, or
action execution.

## P3-M130 Follow-On

P3-M130 adds a local Agent Proof Package Schema and Verification Contract Pack
for this prove-yourself protocol. It defines machine-readable proof package,
verification request/result, and gate-pass challenge schemas plus deterministic
local examples. It preserves the same boundary: no live APIs, live systems
contact, direct bot messaging, live agent-to-agent communication, payment
processing, settlement, production signing, production certification, or action
execution.
## P3-M133 Minimal GatePass Core Specification Pack

P3-M133 narrows Agent Trust Gate(TM) around GatePass as the compact local proof primitive. ProofPackage carries supporting material, VerificationContract checks it, Tool Gate enforces it before sensitive actions, and Pre-Settlement Gate blocks settlement-sensitive flows without valid proof. This is local specification, schema, model, example, and test work only; it adds no live APIs, MCP server functionality, live systems contact, direct bot messaging, live agent-to-agent communication, production signing, production-grade crypto, payment processing, settlement execution, real tool execution, or action execution.
## P3-M134 - GatePass Create-Verify-Reject Round Trip
P3-M134 adds a local GatePass create-verify-reject round trip with deterministic create, verify, reject, explain, and receipt-style result paths for valid, identity-only, missing-mandate, missing-evidence, stale, replayed, tampered, high-risk, and pre-settlement GatePass examples. It adds no live APIs, MCP server functionality, live systems contact, direct bot messaging, live agent-to-agent communication, production signing, production-grade crypto, payment processing, settlement execution, real tool execution, or action execution.
## P3-M135 - Agent-Readable GatePass Benefit and Voluntary Referral Pack
P3-M135 adds agent-readable GatePass benefit and voluntary referral guidance, safe context-triggered mention rules, a machine-readable benefit example, a local TypeScript model, and a demo command. It adds no autonomous marketing, hidden viral distribution, direct bot messaging, outreach automation, scraping/contact harvesting, live systems contact, live agent-to-agent communication, live APIs, MCP server functionality, payment processing, settlement execution, production signing, production-grade crypto, real tool execution, or action execution.

## P3-M136 - Agent Trust Language and GatePass Vocabulary Pack
P3-M136 adds a shared GatePass Trust Language vocabulary, safe phrasebook, local dialogue examples, safety boundary, machine-readable vocabulary example, local TypeScript model, and demo command. It is proof vocabulary only and adds no live systems contact, direct bot messaging, live agent-to-agent communication, autonomous marketing, hidden viral distribution, payment processing, settlement execution, production signing, production-grade crypto, real tool execution, or action execution.
