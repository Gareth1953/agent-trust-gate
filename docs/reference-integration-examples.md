# Reference Integration Examples

P3-M120 adds local-only reference integration examples for Agent Trust Gate™.
They show where a trust gate can sit inside common agent-system shapes without
adding live framework integrations, external agents, network calls, payments,
settlement, or action execution.

Core rule:

No mandate. No evidence. No verified intent. No signed gate pass. No settlement.

## Purpose

The examples address reviewer feedback that developers need clearer patterns
for placing Agent Trust Gate™ in agent loops, tool-use guards, human review
queues, pre-settlement checks, governance review, handoff flows, and small
developer wrappers.

This is reference-integration documentation and demo code only. The examples
are deterministic local fixtures and TypeScript functions.

## Relationship To P3-M116/P3-M117/P3-M118/P3-M119

P3-M116 hardened the local request, receipt, evidence, mandate, verified
intent, proof metadata, expiry, nonce, freshness, and replay fields.

P3-M117 added local signed receipt/proof verification and tamper detection
while keeping `productionSigning`, `paymentAuthorisation`, and
`settlementAuthorisation` false.

P3-M118 added adversarial cases proving replay, forged evidence, expired pass,
scope creep, missing mandate, tampered proof, unsigned proof, stale nonce, and
settlement refusal are blocked locally.

P3-M119 added the simplified developer CLI for the core local flows.

P3-M120 shows how those local pieces can be arranged as reference patterns
inside agent-system workflows without becoming official framework adapters.

## Patterns Covered

| Pattern | Local result |
| --- | --- |
| Generic agent-loop pre-action gate | Allows one local in-scope step, but does not execute it. |
| Tool-calling guardrail | Blocks a sensitive tool call when the mandate is missing. |
| Human-in-the-loop escalation | Escalates a high-risk pending-approval action. |
| Pre-settlement money gate | Blocks a simulated payment-like settlement without a valid gate pass. |
| Governance reviewer flow | Produces an auditable local review receipt. |
| Agent-to-agent handoff gate | Blocks a handoff when verified intent is missing and contacts no external agent. |
| `trustGate.evaluate(request)` wrapper | Returns a deterministic allow/block/escalate-style result. |

## How To Run

Run all reference examples:

```powershell
npm run demo:integrations
```

Run a compact summary after build:

```powershell
node dist/src/reference-integrations-cli.js --summary-only
```

Run one pattern:

```powershell
node dist/src/reference-integrations-cli.js --pattern pre_settlement_money_gate --pretty
```

The generated example outputs are under `examples/reference-*.json`.

## Where The Gate Fits

The generic loop example places the trust gate before the loop dispatches a
proposed step.

The tool-calling example places the trust gate immediately before a sensitive
tool invocation would be made.

The human-in-the-loop example places the trust gate before a high-risk action
leaves a local review queue.

The pre-settlement example places the trust gate and settlement blocker before
any payment-like action would run.

The governance reviewer example creates an auditable local receipt for a
reviewer queue.

The handoff example places the gate before a simulated message would be sent
to another agent.

The wrapper example shows a small `trustGate.evaluate(request)` abstraction
that returns a deterministic result to the caller.

## Allowed, Blocked, And Escalated

Allowed means the local gate conditions pass and the example records that the
step would be eligible locally. The sensitive action is still not executed.

Blocked means a required trust condition is missing or invalid.

Escalated means the gate records that human review is required before any
sensitive step can proceed.

Every example keeps:

- `localDemoOnly: true`
- `localOnly: true`
- `productionSigning: false`
- `paymentAuthorisation: false`
- `settlementAuthorisation: false`
- `networkCallPerformed: false`
- `externalAgentContacted: false`
- `paymentTriggered: false`
- `settlementExecuted: false`
- `actionExecuted: false`

## Why These Are Local-Only

The examples use local TypeScript functions, local request fixtures, local
receipts, local proof summaries, and static JSON outputs. They do not import
or call external agent frameworks, model APIs, cloud APIs, payment APIs, hosted
services, webhooks, wallets, banks, or settlement rails.

No sensitive action is executed. The examples record where the action would be
blocked, escalated, or allowed locally.

## Why These Are Not Official LangGraph/CrewAI/AutoGen Integrations

The examples are inspired by common framework shapes, but they are not
official LangGraph/CrewAI/AutoGen integrations. They do not depend on those
frameworks, call their APIs, register plugins, start workers, contact agents,
or execute framework actions.

They are local reference patterns only.

## No Live APIs, Payments, Settlement, Or External Agents

P3-M120 does not add live APIs, live payment processing, PayPal API
integration, Stripe integration, checkout, webhooks, wallet/banking logic,
real settlement execution, production signing, production key management,
secrets, credentials, cloud/network calls, forms, tracking, analytics,
telemetry, hosted calls, external-agent contact, outreach automation, AUC
integration, Agent Contact System integration, or action execution.

## Future Integration Hardening Areas

Future hardening could add, if separately approved:

- stricter adapter interface contracts;
- framework-specific pseudocode test matrices;
- durable replay-store interface design;
- richer receipt-to-reviewer UX examples;
- threat model coverage for handoffs and tool calls;
- compatibility versioning for wrapper APIs;
- production integration requirements that remain explicitly out of scope here.

## Safety Boundary

Agent Trust Gate™ remains local-first and `local_demo_only`.

These examples are not production integration, production security
certification, paid-pilot readiness, legal proof, financial proof, compliance
proof, procurement approval, payment authorisation, settlement authorisation,
or a guarantee.

Public project contact: `gpmiddleton71@gmail.com`
