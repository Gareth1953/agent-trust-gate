# Mock Sensitive Tools Catalog

P3-M132 defines local mock tools for the enforceable tool-calling gate demo.
No real tool is executed.

No mandate. No evidence. No verified intent. No signed gate pass. No settlement.

| Mock tool | Description | Risk tier | Required proof | Required approval | Signed proof required | Settlement-sensitive | Missing-proof outcome | Valid-proof outcome |
|---|---|---:|---|---|---|---|---|---|
| `send_customer_message` | Draft a customer-facing message. | Medium | mandate, evidence, verified intent, freshness, nonce, signed proof | Yes | Yes | No | escalate | allow locally only |
| `write_file` | Prepare a deterministic local demo output summary. | Low | mandate, evidence, verified intent, freshness, nonce | No | Optional in demo control | No | require evidence | allow locally only |
| `export_data` | Export local review data. | High | mandate, evidence, verified intent, freshness, nonce, signed proof | Yes | Yes | No | block when mandate is missing | allow locally only with full proof and approval |
| `prepare_payment` | Prepare a simulated payment-like instruction. | High | mandate, evidence, verified intent, freshness, nonce, signed proof | Yes | Yes | Yes | require signed proof or block | allow locally only with signed proof |
| `approve_procurement` | Approve a local procurement step. | High | mandate, evidence, verified intent, freshness, nonce, signed proof | Yes | Yes | No | block stale or replayed proof | allow locally only with fresh proof and approval |
| `publish_public_post` | Publish a local demo announcement draft. | Medium | mandate, evidence, verified intent, freshness, nonce, signed proof | Yes | Yes | No | escalate or block when proof is missing | allow locally only |
| `escalate_access_session` | Escalate local session access for a high-risk workflow. | High | mandate, evidence, verified intent, freshness, nonce, signed proof | Yes | Yes | No | require human review | allow locally only after approval |
| `create_settlement_instruction` | Create a simulated settlement instruction. | Critical | mandate, evidence, verified intent, freshness, nonce, signed gate pass | Yes | Yes | Yes | block without signed gate pass | allow locally only after valid signed gate pass |

Every catalog entry is a local mock tool. The demo does not write real files,
send customer messages, export data, prepare payments, approve procurement,
publish posts, escalate access, create settlement instructions, contact live
systems, or execute actions.

Public contact: `gpmiddleton71@gmail.com`.
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
