# GatePass Round Trip Threat Model

This local threat model supports the P3-M134 GatePass create-verify-reject round trip.

Do not trust the agent. Trust the GatePass.
No proof. No permission.
No mandate. No action.
No signed GatePass. No settlement.

## Local Threat Cases

| Threat case | Local response |
| --- | --- |
| Agent claims identity without proof | Reject as `identity_only_not_sufficient`. |
| Agent tries to reuse old GatePass | Reject stale expiry or replayed nonce. |
| Agent tampers with scope/action | Reject as `tampered_gatepass` or `scope_mismatch`. |
| Agent omits evidence | Require evidence or reject. |
| Agent claims broad mandate | Verify scope against the expected action and reject mismatch. |
| Agent uses stale approval | Require fresh GatePass and approval context. |
| Agent tries settlement-sensitive action without signed GatePass | Require signed GatePass or block. |
| High-risk action attempts to bypass human review | Require human review. |

## What Is Checked Locally

- issuer, subject, and intended verifier
- mandate and scope
- evidence references
- verified intent status
- risk and approval status
- expiry and nonce
- local signed GatePass proof reference
- local integrity hash against expected verification context

## Boundary

This is a local threat model only. It is not production security certification, not production-grade cryptography, not a legal/compliance/security assurance claim, and not a live traffic, bot-detection, identity, authentication, payment, settlement, or tool-execution system.

Public contact: gpmiddleton71@gmail.com
## P3-M135 - Agent-Readable GatePass Benefit and Voluntary Referral Pack
P3-M135 adds agent-readable GatePass benefit and voluntary referral guidance, safe context-triggered mention rules, a machine-readable benefit example, a local TypeScript model, and a demo command. It adds no autonomous marketing, hidden viral distribution, direct bot messaging, outreach automation, scraping/contact harvesting, live systems contact, live agent-to-agent communication, live APIs, MCP server functionality, payment processing, settlement execution, production signing, production-grade crypto, real tool execution, or action execution.

## P3-M136 - Agent Trust Language and GatePass Vocabulary Pack
P3-M136 adds a shared GatePass Trust Language vocabulary, safe phrasebook, local dialogue examples, safety boundary, machine-readable vocabulary example, local TypeScript model, and demo command. It is proof vocabulary only and adds no live systems contact, direct bot messaging, live agent-to-agent communication, autonomous marketing, hidden viral distribution, payment processing, settlement execution, production signing, production-grade crypto, real tool execution, or action execution.
## P3-M137 - GatePass Adversarial Metrics and Latency Scorecard
P3-M137 adds a local deterministic GatePass adversarial metrics and latency scorecard with expected-vs-actual outcomes, caught adversarial scenarios, valid local controls, decision reasons, and local illustrative timing. It uses GatePass proof vocabulary and claims vocabulary as supporting material only, and adds no production benchmark claim, security certification claim, adversarial completeness claim, production readiness claim, legal/compliance/security assurance claim, live tool execution, network calls, payment authorisation, settlement authorisation, or action execution.
