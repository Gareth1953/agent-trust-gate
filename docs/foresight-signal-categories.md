# Foresight Signal Categories

GatePass provides a common, machine-readable format for expressing authority,
mandate, scope, freshness, and evidence. These categories help identify future
GatePass hardening opportunities without adding live monitoring or scraping.

| Category | What to watch manually | Why it matters to ATG | Possible upgrade implication | Affects |
|---|---|---|---|---|
| AI agent frameworks | New local agent execution patterns, tool APIs, and approval hooks | GatePass should fit where developers already intercept agent actions | Better local adapters or wrapper examples | GatePass, wrapper, reviewer kit |
| Tool-calling patterns | How tools are described, called, approved, and audited | Sensitive tool calls need pre-action proof gates | Stronger `wrapGatePassTool` policies | wrapper, scorecard |
| Developer wrapper patterns | Minimal SDK ergonomics and copy-paste examples | Reviewers asked for simple developer usefulness | Smaller local wrapper API examples | wrapper, reviewer kit |
| MCP-style protocols | Local protocol shapes, tool schemas, permission models | Future protocol readiness may need GatePass mapping | Local-only contract mapping docs | GatePass, future protocol readiness |
| Agent-to-agent protocols | Identity, delegation, handoff, and authority claims | Agent identity alone is not trust | Proof challenge and handoff checks | GatePass, VerificationContract |
| AI payment protocols | Pre-payment authorisation, invoice, and settlement concepts | Money-adjacent actions require strong pre-settlement gates | Pre-settlement proof requirements | pre-settlement |
| Machine-to-machine payment signals | Automated payment preparation and delegation signals | ATG must distinguish preparation from authorisation | Stronger no-settlement boundary examples | pre-settlement, scorecard |
| Pre-settlement trust signals | Mandate, evidence, signed proof, freshness, and replay requirements | "No signed GatePass. No settlement." is central | More settlement-sensitive scenarios | GatePass, pre-settlement |
| Agent security/governance competitors | Review language, proof claims, and governance workflows | Helps avoid overclaiming and improves reviewer framing | Claims boundary and reviewer artifacts | scorecard, reviewer kit |
| Enterprise agent adoption | Procurement, approval, audit, and access-control concerns | Enterprise workflows need evidence before action | Local governance review examples | reviewer kit, wrapper |
| Developer integration trends | What developers expect from local packages and examples | GatePass must be easy to inspect and run | Package ergonomics and local adapters | wrapper, reviewer kit |
| AGI and agent-risk signals | High-autonomy risk, delegation risk, and tool-use escalation | ATG should stay scoped and cautious | Human-review and escalation scenarios | scorecard, safety boundary |
| Quantum computing signals | Long-term cryptographic risk discussion | GatePass should not claim production-grade crypto | Watch-only post-quantum readiness notes | future protocol readiness |
| Post-quantum security signals | Migration discussions and signature expectations | Future signed proof may need stronger crypto design | Local crypto-agility planning only | GatePass, future protocol readiness |
| Standards and regulation signals | Emerging proof, audit, agent, and payment requirements | Standards may influence schema shape | Schema mapping and terminology updates | VerificationContract |
| Reviewer/developer feedback signals | Confusion, friction, requested demos, missing examples | External feedback directly improves usefulness | Build missions for measurable local demos | reviewer kit, wrapper, scorecard |

All entries are manual-input categories only. They do not create live watchlists,
background jobs, scraping, outreach, or autonomous product changes.

