# ATG-ANEOS-R001 — Agent-Native Enterprise OS: strategic kill and reinvention

**Research date:** 28 August 2026  
**Scope:** research and architecture only. No ATG code, deployment, service connection, purchase, installation or external contact was performed.

## 1. Executive verdict

### CONDITIONAL GO — IMPORTANT CONCEPT BUT MAJOR QUESTIONS MUST BE RESOLVED

**Short answer.** An agent-native enterprise operating layer is technically credible as a *bounded, event-driven decision-and-execution architecture*. It is not novel as a broad category. Major platforms already sell increasingly close variants: multi-agent teams, enterprise graphs/context, workflow orchestration, human approvals, agent marketplaces and lifecycle control. Oracle, SAP, Microsoft, Salesforce, UiPath, Celonis and Workday make a generic “digital workforce OS” strategy commercially redundant.

The potentially valuable extension is narrower and sharper: an independent **Authority and Consequence Control Plane** that deterministically decides whether one canonical proposed action may happen, verifies the *currently authorised natural person* when needed, binds approval to that exact action, and preserves a cryptographically verifiable decision-to-execution chain across providers. This is not proven unique, but it is substantially more specific than the role-/RBAC-/approval controls publicly described by the platforms reviewed.

**Recommendation:** structure this as **B. ATG Enterprise extension**, initially sold as a provider-neutral authority kernel and consequential-action control plane. Do **not** launch a separate “Enterprise OS” intended to replace ERP/CRM/workflow platforms. The OS language is a future architecture and a design-partner narrative, not a near-term product claim.

**One bounded next mission only:** write an architecture specification and minimal demonstrator design for a *Customer Revenue Recovery Decision Loop*, including an ATG adapter contract, canonical decision/action envelopes, synthetic event/state fixtures and an authority escalation UI. Do not implement it in that mission.

## 2. Exact concept definition

**DESIGN PROPOSAL.** ATG Agent-Native Enterprise OS is a cross-provider operating layer in which specialist agents observe governed enterprise events, investigate hypotheses against a shared temporal business model, debate bounded alternatives, create an intervention plan, and request execution. ATG is a separable, fail-closed trust kernel at consequential action boundaries.

The operating cycle is:

```text
observe → detect → investigate → challenge → decide → plan → authorise → act → verify → measure → learn
                                      │                          │
                         probabilistic reasoning       deterministic ATG control
```

**FACT.** “Confidence” is a probabilistic model output; it is not a delegation, board mandate, legal entitlement, valid employee status or payment authority. Therefore the governing rule is defensible:

> **Authority outranks AI confidence.**

This does not mean confidence is irrelevant. Confidence and evidence quality decide investigation depth and escalation; they never create authority or silently enlarge it.

## 3. What local ATG can be reused—and what it cannot yet prove

**EVIDENCE — local repository review, 28 August 2026.** The current repository describes a local-only deterministic demonstrator. It has no live API, enterprise directory, production key custody, real tool interception, real action execution, payment/settlement, distributed replay store or production authentication.

| Existing ATG element | Reuse role in ANEOS | Important gap before production |
|---|---|---|
| Agent Standing | verify declared software identity, accountable principal and signed delegation before a request reaches authority evaluation | live issuer trust, workload identity, attestation, revocation feeds |
| Canonical exact-action digest | bind a proposed consequential command to immutable parameters | enterprise action schema registry and adapters |
| GatePass | short-lived, scoped, one-use permission for a single execution intent | HA service, distributed replay/nonce store, HSM/KMS and enforcement points |
| Human Authority Proof | verify active identity, role, limits, separation of duties and exact-action approval | IdP/HR/board-delegation integrations and legal policy ownership |
| Refusal receipt | explain fail-closed refusal without converting lack of evidence into permission | retention, privacy, operational incident workflow |
| Decision versus execution receipt | distinguish “permitted” from “actually executed” | signed downstream execution attestations and reconciliation |
| Crypto-agile evidence model | future migration path for signing algorithms | production key lifecycle and validated PQ implementation |

**INFERENCE.** This is a credible foundation for the *last mile of consequential execution*, not evidence that ATG can yet operate an enterprise control plane. Any commercial positioning must preserve that distinction.

## 4. Current architecture proposed

### 4.1 Enterprise Agent Workforce

**DESIGN PROPOSAL.** Use stable functional agents (sales, service, operations, finance, procurement, risk) as capability owners, not permanent autonomous personalities. A functional agent owns a bounded read model, permitted tools, hypotheses and a declared action vocabulary. It may propose actions; it does not own ultimate authority.

Temporary mission agents are worthwhile only when they package a bounded case: Customer Recovery, Supplier Replacement, Regulatory Change or Crisis Response. They receive a case lease, narrow data/tool grants, a budget, objective, expiry and mandatory hand-back record. They should terminate automatically. Creating a new agent for every task is architecture theatre and a security liability.

### 4.2 Shared enterprise state

**DESIGN PROPOSAL — combination, not one “company brain database.”**

| Layer | Contents | Why |
|---|---|---|
| Event ledger | immutable, timestamped source events and provenance | replay, freshness, audit |
| Operational read models | orders, tickets, inventory, delivery, ledger and workflow state | fast deterministic questions |
| Semantic/entity graph | customer, supplier, contract, product, ownership and policy relationships | cross-system identity and dependencies |
| Process graph | actual process paths, waits, exceptions and bottlenecks | detect operational deviation |
| Evidence store | source references, extraction method, confidence, retention/classification | prevent “because the model said so” |
| Decision/case graph | hypotheses, alternatives, challenge, action, prediction and outcome | causal memory and learning |
| Authority graph | principals, roles, delegations, limits, SoD, jurisdiction and time | ATG evaluation |

An enterprise knowledge graph alone is stale and weak on transaction semantics; a digital twin alone is normally a model, not authority; vector memory alone is not a source of truth. Source-of-record data remains authoritative. Every state assertion needs timestamp, source, transformation and freshness status.

### 4.3 Enterprise Decision Brain

**DESIGN PROPOSAL.** Do not build one omniscient LLM orchestrator or consensus parliament. Use a **hierarchical, event-driven blackboard architecture**:

1. An event router classifies signal, materiality and candidate investigation playbooks.
2. A case coordinator creates a bounded case graph and assigns specialists.
3. Specialists write signed/structured claims, evidence references, confidence calibration and proposed actions to the blackboard.
4. A deterministic policy/planner selects permissible next steps and invokes challenge roles where material.
5. A strategy synthesiser emits alternatives, expected effects, constraints and action decomposition.
6. The ATG adapter evaluates each consequential execution command independently.

Specialists must communicate typed evidence claims, not free-form chat. Consensus is not a control: preserve minority views and require explicit resolution. A model should not self-select its authority, introduce new tools or rewrite policy.

### 4.4 Structured disagreement and decision challenge

**DESIGN PROPOSAL.** For material cases instantiate a small, bounded challenge panel: Proposal Agent, Risk/Downside Agent, Evidence Agent and Policy Agent. It has no unlimited debate loop. It evaluates a fixed decision packet: claim, sources, counterfactual, uncertainty, affected parties, downside, policy constraints and exact candidate actions.

This is not a unique idea—red teaming, debate and critic models exist—but a *mandatory evidence-and-authority challenge before consequential execution* may be a useful product behaviour. Use it only above thresholds; ordinary incidents should follow deterministic playbooks.

## 5. Proactive intervention, causal memory and agent performance

### 5.1 Intervention engine

**DESIGN PROPOSAL.** Convert streams to four states: noise (record/ignore), weak signal (monitor), credible issue/opportunity (open investigation) and material consequence (case + authority path). Thresholds are owned by policy and changed through normal governance, not learned autonomously.

For the 55% customer-order decline, Sales opens a case; Service contributes unresolved complaints; Operations contributes late deliveries; Finance rejects credit distress; Procurement links supplier reliability. The correct output is a ranked *hypothesis*, not “proven cause.” The system may prioritise delivery and service remediation, delay discounting, and request a supplier review. It may autonomously send a pre-approved status update or expedite under a fixed policy; replacement contract, discount, credit change or spend enters ATG.

**FACT.** Modern AI can correlate cross-domain signals, retrieve evidence and propose causal hypotheses. **INFERENCE.** It cannot reliably establish real-world causality from observational enterprise data alone. Require causal labels: `correlation`, `plausible mechanism`, `tested hypothesis`, `causal evidence`; require experiment, quasi-experiment or domain proof for the last label.

### 5.2 Enterprise Causal Memory

**DESIGN PROPOSAL.** Persist an append-only decision record:

`case → evidence snapshot → hypotheses → disagreement → alternatives → policy/authority → predicted effect → action → execution receipt → outcome window → attribution confidence → lesson`.

This can become a compounding asset only if outcome labels are timely, the counterfactual problem is explicit, records are versioned, and learning recommendations require approval. It must not become a vector database that overwrites inconvenient history.

### 5.3 Reputation

**DESIGN PROPOSAL.** Maintain multidimensional calibration, not a single reputation score: domain, action class, evidence completeness, abstention quality, prediction calibration, outcome quality, drift, human-override results and attribution confidence. Never use a good historic score to expand an agent’s authority. Authority is delegated by the organisation; performance informs routing, supervision and re-evaluation.

## 6. Dynamic human interface and human-on-the-loop

**FACT.** Task-specific generated interfaces and human-review workflow primitives are becoming commonplace. Microsoft provides human review/AI approval stages; LangGraph supports durable pauses and reviewed tool calls. This lowers UI implementation cost but does not solve authority selection.

**DESIGN PROPOSAL.** The Personal Interface Compiler should render from a signed `Decision Packet` schema—not arbitrary agent HTML—and include: recommendation, exact action summary/hash, alternatives, financial/customer/regulatory impact, evidence links, dissent, policy rule, required authority, eligible approvers, expiry, approve/reject/modify/request-evidence. A modification creates a new action digest and restarts ATG evaluation; it must never mutate an approved action in place.

Human-on-the-loop is the correct default for routine, reversible work. The intervention score should consider consequence, irreversibility, financial value, novel action/model/tool, uncertainty, legal/regulatory impact, customer/human duty, accumulated exposure, concentration and policy. Fixed ceilings, prohibited classes and authority tiers are constitution-controlled. Learning may recommend a threshold change, but only a verified authorised policy change can enact it.

Human takeover means: verified person + scope + case/action boundary + suspension token + durable checkpoint + action queue freeze + accountable transfer receipt. Resume requires a new policy/authority evaluation; a human’s presence alone must not bless stale plans.

## 7. ATG trust kernel, constitution and resilience

### 7.1 Authority evaluation

**DESIGN PROPOSAL.** Consequential commands pass a gateway only after ATG independently verifies: agent standing; canonical exact command; source and destination/account; value/currency; mandate; time; jurisdiction; policy; evidence; risk tier; human-duty constraints; eligible active human authority where required; auth freshness; SoD; replay/expiry and execution adapter capability.

Return only: `AUTONOMOUSLY_AUTHORISED`, `VERIFIED_HUMAN_AUTHORITY_REQUIRED`, `INSUFFICIENT_EVIDENCE`, `OUTSIDE_MANDATE`, or `REFUSED`, plus a receipt. “Allowed” is not “executed.”

### 7.2 Enterprise Constitution

**DESIGN PROPOSAL.** A versioned, machine-readable policy hierarchy: external law/regulation and contractual obligations; board risk appetite; corporate policy; delegated authority; department rules; local playbooks. Rules have owners, effective dates, jurisdictions, tests, source references and conflict semantics. Policy-as-code engines are commodity; the differentiated work is mapping policy to canonical enterprise actions and verified human authority. Agents may propose policy changes but cannot apply them.

### 7.3 Fail-safe/degradation

| Condition | Safe response |
|---|---|
| stale/unknown source state | refuse consequential action; observe-only or request refresh |
| model/API/tool failure | deterministic workflow fallback; queue bounded work; no fabricated completion |
| irreconcilable material disagreement | escalate with dissent packet |
| ATG/identity/replay service unavailable | fail closed for consequential execution |
| suspicious agent/tool behaviour | revoke lease/credentials, quarantine case, preserve evidence |
| partial execution | reconcile adapter receipts, compensate only through a new authorised action |
| corrupted memory/policy | pin last verified version, isolate, human incident command |

Company Shadow is **OPTIONAL high-end**, not MVP core. Process/digital twins can test constrained operational scenarios, but an enterprise-wide simulation reliable enough to predict pricing, staffing, customer or market effects is research-heavy and easily misleading. Use it as scenario and sensitivity analysis, never as permission evidence.

## 8. Adaptive Capability Fabric and digital employee lifecycle

**DESIGN PROPOSAL.** A Capability Fabric identifies a gap against a defined capability contract (inputs, expected outputs, benchmark, cost ceiling, data classification, permitted jurisdiction, latency, licence, observability, exit plan). It searches an approved catalogue; it does not search-and-connect the open internet from production.

Candidate evaluation occurs in an isolated sandbox with synthetic/de-identified or explicitly approved data, egress controls, tool manifest hash/version, fixed credentials, tests, red-team cases, cost measurement and reproducible scorecard. A recommendation can be produced automatically. Production installation, purchase, contract, credentials, data disclosure, role assignment and authority expansion require separate ATG/verified-human processes.

**EVIDENCE.** Marketplace/lifecycle concepts are already occupied: Oracle has an AI Agent Marketplace; Workday ASOR manages registration through retirement; Google A2A enables interoperable agent discovery; MCP creates a broad tool ecosystem. The opportunity is not to “invent an agent marketplace.” It is to provide a cross-provider **capability admission and action-authority gate**.

Onboarding should register provider and artefact/version, owner/principal, purpose, data/tool scopes, action vocabulary, limits, escalation, model/tool attestations, test baseline, kill switch and expiry. Offboarding must revoke keys/tokens/leases, block queued work, retain immutable decision evidence, hand off open cases, destroy/delete data according to policy and reconcile actual removal. This is commercially meaningful, but Workday and platform governance vendors already cover material portions.

## 9. Competitor and prior-art sweep

**EVIDENCE.** The following is a public-documentation comparison as at the research date; blank/“not publicly evidenced” is not proof a vendor lacks the feature.

| Vendor/product | Publicly evidenced capability | Main overlap | Material gap versus proposed ATG position |
|---|---|---|---|
| Microsoft Copilot Studio / Foundry | agent flows, multi-agent patterns, human review and AI approvals | orchestration, approvals, governance | no public evidence reviewed of independent, canonical exact-action human-authority proof across arbitrary systems |
| Salesforce Agentforce / MuleSoft Agent Fabric | multi-agent orchestration, MCP/A2A, Data Cloud, Trust Layer, governance/observability | cross-system action and agent controls | primarily Salesforce-centred trust/control plane; exact-action authority proof not established in sources reviewed |
| SAP Joule / Joule Studio | functional agents, SAP Knowledge Graph, data cloud, central identity/authorisation, custom agents | enterprise graph and multi-agent coordination | SAP gravity; no reviewed evidence of ATG-style external action receipt primitive |
| Oracle Fusion AI Agent Studio | agent teams, native business objects, testing, HITL, external agents/models, marketplace | closest suite-level “agent workforce” claim | Fusion-centred security and RBAC; complete independent authority kernel not established |
| ServiceNow AI Agent Fabric | connects siloed agents and A2A | workflow/service orchestration | not an enterprise-wide authority solution on evidence reviewed |
| UiPath Maestro / Agentic Automation | orchestration across humans/agents/systems, long-lived state, policy guardrails | execution/process control | strong direct adjacent competitor; policy/approvals are not proof of exact-action active-human authority |
| Celonis AgentC / PI Graph | process intelligence graph, living operational twin, agent orchestration/API | shared process state, proactive improvement | not principally a trust/authority kernel |
| Workday ASOR / Agent Gateway | discovery, registration, lifecycle, roles/access, monitoring, costs, partner agents | digital employee onboarding/offboarding | workforce management, not cross-enterprise consequential action binding |
| IBM Decision Intelligence / digital-twin research | decision logic, explainability, agentic digital-twin research | decision/simulation | lacks public evidence reviewed of broad agent workforce and ATG-style enforcement |
| OpenAI/Anthropic/Google agent ecosystems | tools, MCP/A2A, models, evaluation and connectors | capability fabric substrate | not an enterprise authority system; connector security remains user responsibility |

### 9.1 Feature matrix

Legend: **Y** publicly evidenced; **P** partial/adjacent; **—** not established from sources reviewed.

| Capability | MS | SF | SAP | Oracle | UiPath | Celonis | Workday | Proposed ATG Enterprise |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| specialist/multi-agent interaction | Y | Y | Y | Y | Y | P | P | Y |
| shared enterprise/process state | P | Y | Y | Y | P | Y | P | Y |
| proactive intervention | P | P | Y | Y | Y | Y | P | Y |
| autonomous execution / workflow | Y | Y | Y | Y | Y | P | P | Y, bounded |
| human escalation | Y | Y | Y | Y | Y | Y | Y | Y |
| verified active human, exact-action authority binding | P | P | P | P | P | — | P | **core** |
| cross-department coordination | P | P | Y | Y | Y | Y | P | Y |
| dynamic task UI | P | P | P | P | P | P | P | Y |
| external capability marketplace/discovery | P | Y | P | Y | P | P | Y | P, admission only |
| sandbox tool evaluation | P | P | P | Y | P | P | P | Y, governed |
| agent onboarding/offboarding | Y | P | P | P | Y | P | Y | Y |
| causal decision memory/reputation | P | P | P | P | P | P | P | Y, proposal |
| constitution/policy | Y | Y | Y | Y | Y | P | Y | Y |
| digital-twin simulation | P | — | P | P | P | Y | — | Optional |
| ATG-equivalent proof/receipt kernel | — | — | — | — | — | — | — | **target** |

### 9.2 Commoditised versus differentiated

**Already commoditising:** foundation models; RAG/vector stores; agent frameworks; workflow engines; API/MCP connectors; approval screens; dashboards; basic RBAC; agent marketplaces; process mining; observability; task-specific apps.

**Potentially differentiated, if implemented and independently validated:**

1. provider-neutral, deterministic policy/authority evaluation at every consequential action boundary;
2. current-employment/appointment and delegated-authority verification for the *eligible human*, bound to the exact canonical action digest;
3. one-use GatePass plus a separate execution-match receipt across heterogeneous execution systems;
4. authority graph + human-duty constraints + case decision graph, rather than LLM confidence or generic approval routing;
5. capability admission that separates sandbox evaluation from production authority and data release.

**INFERENCE.** This is a defensible wedge only if ATG interoperates better than native controls and gains credible external validation. Platform vendors can reproduce much of it. The moat comes from standard-like interoperability, difficult-to-copy action/authority semantics, integration network effects and evidence history—not secrecy.

## 10. Platform absorption and cross-provider neutrality test

**FACT.** The major platforms own valuable data, workflow and identity context. They have enormous distribution, budgets and the ability to bundle agents. A broad neutral OS adds integration burden, latency, liability and political resistance.

**INFERENCE.** Neutrality creates value only at seams: an action spans SAP procurement, Salesforce customer context, a bank/payment rail, Workday authority data and a third-party agent/tool; no single provider can be trusted to decide organisational authority for all. It becomes a disadvantage where one platform is already the authoritative process owner.

Therefore use **federated deployment**, not a replacement database: adapters pull minimum evidence; source systems retain records; ATG issues/validates an action authority decision at egress. Start with a single domain and two systems. Do not promise a universal enterprise brain.

## 11. Banking, finance and trading

**DESIGN PROPOSAL.** Banking is attractive because authority, limits, audit and segregation of duties already matter, but it is also the least forgiving market. Agents can investigate, reconcile, triage exceptions, detect fraud signals, compose cases, perform bounded customer/service actions, recommend credit/risk actions and prepare trading/risk scenarios. Deterministic systems should retain hard limits, market controls and settlement logic.

For an investment example, Market/Strategy/Risk/Liquidity/Compliance agents form a proposal packet. The execution adapter independently enforces instrument, client mandate, liquidity, jurisdiction, exposure, concentration, price/limit, trading window and delegated portfolio-manager authority. It may execute only inside pre-authorised rules; anything above a configured bound requires verified authority. No uncontrolled autonomous trading recommendation is made.

This differs from existing quant/risk systems chiefly if the cross-agent recommendation is connected to verifiable organisational authority and exact action proof. It does not replace market risk, model risk, best execution, AML, sanctions, surveillance or regulatory accountability.

## 12. External technology landscape and Build/Buy/Plug-in

| Component | Examples / role | Route |
|---|---|---|
| reasoning/multimodal models | OpenAI, Anthropic, Google, open-weight models; investigation/synthesis only | **PLUG-IN**; model routing and test corpus required |
| durable orchestration | Temporal, LangGraph, cloud workflows, platform workflow engines | **BUY/OPEN SOURCE** |
| agent interoperability | MCP, Google A2A, APIs | **PLUG-IN**; allowlisted manifests only |
| identity/workload identity | enterprise IdP, OAuth/OIDC, SPIFFE/SPIRE, cloud workload identity | **BUY/OPEN SOURCE** |
| policy execution | OPA, Cedar, cloud policy engines | **BUY/OPEN SOURCE**; own policy-to-action semantics |
| graphs/process intelligence | Neo4j, RDF/knowledge graphs, Celonis, ERP semantic layers | **PLUG-IN/BUY** |
| process mining | Celonis, SAP Signavio, UiPath Process Mining | **BUY** |
| optimisation/forecasting | specialist SaaS/OR tools and internal models | **PLUG-IN** behind capability contracts |
| digital twin/simulation | industrial/operations twin vendors, discrete-event/optimisation engines | **PLUG-IN**, optional |
| evaluation/observability | model-provider evals, tracing, SIEM, data quality | **BUY/OPEN SOURCE** |
| sandbox/containment | isolated compute, egress firewall, secrets broker, malware/content scanning | **BUY/BUILD integration** |
| ATG action/authority semantics, GatePass, receipts | canonical action, authority graph, proof and verifier/adapters | **BUILD — proprietary core** |
| case/decision/causal memory | decision packet, dissent, prediction/outcome/attribution graph | **BUILD — differentiated data model** |

Public prices change frequently and enterprise terms are usually negotiated; no price should be embedded in product design without a quote. Use data-minimisation, region/tenant controls, DPA review, retention and self-hosted alternatives where required. The Capability Fabric must compare providers by a tenant-owned benchmark, not vendor marketing claims.

## 13. Security red team and catastrophic scenarios

**EVIDENCE.** OWASP’s 2025 agentic Top 10 explicitly identifies agent goal hijack, tool misuse, identity/privilege abuse, supply-chain vulnerabilities, memory poisoning, insecure inter-agent communication, cascading failures and human-agent trust exploitation. Anthropic cautions that remote MCP tools can change behaviour after approval and recommends fake-data isolation.

| Catastrophic / near-catastrophic scenario | Prevent / detect | Contain / recover / evidence |
|---|---|---|
| agent emails 100,000 customers with wrong terms | batch cap, template binding, dry run, ATG bulk envelope | stop queue, revoke lease, correction via authorised action, execution list/receipts |
| supplier agent terminates critical contract | prohibited action class, contract/human authority gate | block; preserve proposal/dissent; no unilateral rollback claim |
| agent makes major payment error | exact beneficiary/amount/currency/action digest, one-use GatePass | payment adapter reject/reconcile; authorised reversal; immutable receipts |
| colluding agents reinforce false premise | independent evidence sources, challenge agent, correlation detection | case freeze/escalation; retain reasoning/provenance |
| malicious prompt injects tool instructions | content quarantine, untrusted-data labels, tool schemas, least privilege | revoke session/credentials; preserve context and traces |
| compromised agent impersonates owner | workload identity, signed delegation, short leases, attestation roadmap | revoke key/standing, quarantine actions, incident receipt |
| poisoned external MCP/API exfiltrates data | allowlist, manifest pinning, sandbox/evasion tests, egress DLP | cut egress, revoke connector, rotate secrets, audit exports |
| fake executive approval | IdP/WebAuthn evidence, current HR/role/limits/SoD, exact digest | invalidate proof; suspend dependent actions; fraud investigation record |
| corrupted enterprise state makes wrong causal plan | freshness/provenance checks, dual-source reconciliation, anomaly detection | observe-only, restore verified snapshot, replay event ledger |
| external model silently changes | model/version pin, canary/eval and behavioural drift alarms | route to fallback/observe-only; re-approve deployment |
| trading/exposure cascade | hard independent limits, concentration and kill switch | cancel outstanding orders where possible, reconciliation, human incident command |
| policy change grants excess autonomy | versioned constitution, dual control, policy tests, time delay | rollback signed policy version, invalidate affected passes |

ATG materially reduces blast radius at an integrated egress point. It does not protect read-only data misuse, an execution system that bypasses it, false source data, a compromised authorised human, or unsafe designs outside its coverage. Enforcement coverage must be measurable; “all consequential actions are gated” is not credible until adapters prove it.

## 14. Technical feasibility in 2026

| Category | Assessment |
|---|---|
| **Possible now** | bounded agents, tool use, event routing, shared case state, deterministic workflows, policy checks, task UIs, approvals, durable queues/checkpoints, process mining, sandbox tests, audit/event capture |
| **Possible with significant engineering** | cross-platform identity/authority graph, reliable canonical action adapters, provenance/freshness, distributed GatePass/replay control, constrained agent teams, action-to-outcome measurement, governed external capability admission |
| **Research frontier** | robust causal discovery from messy enterprise events, calibrated multi-agent disagreement, outcome attribution, enterprise-wide simulation, agent reliability reputation, safe automated capability evaluation at scale |
| **Not currently reliable** | unconstrained autonomous cross-company strategy, fully autonomous legal/HR/credit/market decisions, proving causal claims from correlation, self-modifying authority, universal “company brain,” safe general-purpose autonomous trading |

## 15. Commercial analysis and product position

**Buyer.** The first buyer is likely a CIO/Chief AI Officer plus COO/CRO sponsor at a regulated or high-consequence organisation with a cross-system agent programme: financial services, insurance, payments, retail/commerce, logistics or large digital businesses. The economic case is not “replace employees”; it is faster safe automation, reduced approval fatigue, avoided loss/fraud/control failure, and an audit path for actions that already cross systems.

**Commercial reality.** Sales cycles will be long (security, architecture, identity, procurement, legal, data and process owners); integrations and support are expensive; liability expectations are high. A platform-bundle alternative will be common. Sell a paid, fixed-scope design/evaluation pilot around one action family and two systems—not an enterprise transformation. Pricing should combine platform/control-plane subscription with adapters, implementation and support; do not claim high-margin SaaS until integration reuse is demonstrated.

### Product ladder

1. **ATG Core:** exact-action evidence and GatePass primitives.
2. **ATG Enterprise:** authoritative action adapter, policy/authority graph, verified human escalation, egress receipts, agent onboarding controls.
3. **ATG Coordinated Decisions (future):** case graph, bounded specialist coordination, intervention/UI and causal memory modules.

Avoid branding stage 3 as an “OS” until it performs repeatable cross-system outcomes. This protects ATG’s core from a speculative product surface.

## 16. Up to ten new architectural concepts

| Concept | Gap solved / feasibility | Commercial relevance / competitor evidence | Disposition |
|---|---|---|---|
| **Authority Coverage Map** | graph every consequential action route and whether it actually passes ATG; feasible | turns an architectural promise into measurable control coverage; not found as a central platform claim | **CORE** |
| **Action Capability Passport** | machine-readable contract for one action adapter: schema, evidence, limits, simulation/reversal and receipt semantics | enables portable connectors; adjacent to manifests, but not identical | **CORE** |
| **Dissent Escrow** | preserve minority agent/human objection and require explicit disposition before high-impact execution | makes debate accountable rather than performative | **CORE** |
| **Autonomy Budget Ledger** | policy-owned, time-bound aggregate exposure budget across many individually low-risk actions | solves slow accumulation and correlated action risk | **CORE** |
| **Counterfactual Holdback** | randomly preserve a policy-safe control cohort to measure interventions where ethical/legal | improves causal memory; technically feasible only selectively | **OPTIONAL** |
| **Evidence Decay Clock** | evidence types expire at different rates; action fails/requires refresh when a critical source ages | protects against stale enterprise state; mostly absent from generic RAG tooling | **CORE** |
| **Capability Quarantine Ladder** | promotion stages: catalogue → synthetic sandbox → de-identified test → supervised production → bounded autonomy | operationalises safe tool admission | **CORE** |
| **Mandate Conflict Compiler** | detects conflicts across contracts, policies, delegations and objectives, returning unsatisfiable constraints | hard but feasible for structured policies; agent should not “resolve” legal conflicts | **FUTURE** |
| **Responsibility Handoff Chain** | explicit transfer of an open case/action from agent to agent or verified human with scope and evidence | valuable for incident response and offboarding | **OPTIONAL** |
| **Outcome Warranty Reserve** | reserves an exposure budget/insurance-style holdback before autonomous action | commercially imaginative but capital/regulatory heavy | **REJECT** now |

## 17. Minimal demonstrator

**Recommendation: Customer Revenue Recovery Decision Loop.** It is stronger than a generic agent demo because it demonstrates cross-functional causal hypotheses, disagreement, a routine action and a financially consequential action without implying that an LLM controls money.

Use synthetic data and five specialists: Sales, Customer Service, Operations, Finance and Procurement. Event: 55% order decline. Service and Operations support delivery/service explanation; Finance contradicts credit explanation; Sales proposes a discount; Operations/Risk oppose it. The coordinator outputs the intervention plan.

* Autonomous simulated action: send a pre-approved delivery-status/customer-care task under a fixed template and low-value service mandate.
* Consequential simulated action: change supplier allocation or issue a £x recovery credit; ATG reconstructs the canonical action and returns `VERIFIED_HUMAN_AUTHORITY_REQUIRED`.
* Dynamic UI shows evidence, dissent, impact, qualified approvers and the exact action digest. A verified synthetic CFO/Procurement Director approval produces a GatePass; a simulated adapter emits execution feedback; the case records predicted/actual recovery.

Success criteria: deterministic refusal on changed amount/supplier/approver/expiry; no agent can self-approve; complete case reconstruction; one action goes through automatic policy, one through human authority. It does **not** prove production readiness, causal truth, ROI or enterprise autonomy.

## 18. Strategic kill test, score and fatal flaws

### Kill test

* **Novelty:** the umbrella is crowded; “AI workforce,” agent lifecycle, marketplace, orchestration and process graph are already products.
* **Competition:** platform vendors can bundle this into systems already bought. UiPath and Workday are especially close to agent control-plane language; Oracle and SAP are closest in business-suite scope.
* **Integration:** a neutral layer must master difficult schema, identity, process-owner and egress integrations before value appears.
* **Liability/trust:** gating an action makes ATG a control people may rely upon; false allow/refusal and outage handling demand production-grade engineering and contracts.
* **AI limits:** LLMs are useful investigators and planners, not dependable enterprise causal engines.
* **Security:** MCP/A2A and model/tool supply chain enlarge the attack surface faster than most organisations can govern it.
* **Commercial burden:** enterprise buyers may prefer native controls or consultants; pilots can become bespoke integration work.
* **Absorption:** independent value disappears if ATG cannot be technically and commercially neutral at a real cross-platform egress seam.

### Weighted score

| Criterion | Weight | Score / weight | Rationale |
|---|---:|---:|---|
| Enterprise problem/opportunity | 12 | 10 | real need, but scope is too broad |
| Differentiation | 12 | 5 | broad proposition occupied; narrow kernel differentiates |
| ATG integration value | 12 | 10 | highly coherent if enforcement is real |
| Technical feasibility | 10 | 6 | bounded system feasible; general OS not |
| Willingness to pay | 10 | 6 | credible in regulated action families, not generic |
| Defensible proprietary core | 10 | 6 | possible but unproven network/integration moat |
| Cross-platform value | 8 | 6 | valuable at seams, costly elsewhere |
| Security/governance architecture | 8 | 7 | strong direction; massive implementation gap |
| Expansion potential | 6 | 5 | substantial but platform-constrained |
| External-tool adaptability | 5 | 3 | useful, highly risky and already ecosystem-driven |
| MVP feasibility | 4 | 4 | demonstrator is feasible |
| Founder/capital practicality | 3 | 1 | difficult enterprise/security integration business |
| **Total** | **100** | **69** | **Conditional Go only** |

**Fatal flaws that override the score:**

1. If ATG cannot gain a reliable enforcement position at real action egress points, it is documentation beside the action, not a trust kernel.
2. If verified human authority cannot be integrated with authoritative IdP/HR/delegation systems without unacceptable friction, the claimed differentiation collapses into ordinary approval routing.
3. If the first product tries to own shared enterprise state, generic orchestration and every agent function, it will lose to platforms and systems integrators.
4. If the product implies causal certainty or autonomous consequential decisions beyond explicit mandates, it becomes unsafe and commercially indefensible.

## 19. Final answers

**Does it represent a credible differentiated extension, or will platforms make it redundant?** It is credible only as a high-end ATG Enterprise extension focused on cross-provider authority and controlled execution. The generic enterprise-agent OS is already being built by major platforms and is not a viable independent first product. Platforms do not automatically make the narrow independent control-plane redundant, but they make differentiation and integration proof non-negotiable.

**What has not been sufficiently considered?** The highest-value additions are Authority Coverage Map, Autonomy Budget Ledger, Evidence Decay Clock, Dissent Escrow, Capability Quarantine Ladder and a formal action-adapter passport. These turn attractive agent behaviour into auditable, bounded operational controls.

**What must be uniquely owned?** The irreducible proprietary core is the **cross-provider Action Authority Graph and verifier**: canonical action semantics; current agent/principal/human standing; policy/mandate/human-duty evaluation; one-use GatePass; evidence freshness; change/refusal semantics; and independently verifiable execution receipts. The case/decision graph is a second important asset. Models, generic orchestration, UI generation, graphs, marketplaces and tool connectivity should remain replaceable.

## 20. Sources (primary/public, accessed 28 August 2026)

1. [Agent Trust Gate™ repository README](../README.md) and local architecture documents, repository review, 28 August 2026.
2. [Oracle AI Agent Studio for Fusion Applications](https://docs.oracle.com/en/cloud/saas/readiness/common/25c/common25c/25C-common-wn-f38824.htm), Oracle, accessed 28 August 2026.
3. [Oracle AI for Fusion Applications](https://www.oracle.com/applications/fusion-ai/), Oracle, accessed 28 August 2026.
4. [How SAP delivers Joule agents](https://news.sap.com/2025/02/joule-sap-uniquely-delivers-ai-agents/), SAP, 13 February 2025.
5. [Microsoft Copilot Studio overview](https://learn.microsoft.com/microsoft-copilot-studio/fundamentals-what-is-copilot-studio), Microsoft, accessed 28 August 2026.
6. [Microsoft AI approvals FAQ](https://learn.microsoft.com/en-us/microsoft-copilot-studio/faqs-ai-approvals), Microsoft, accessed 28 August 2026.
7. [Salesforce Agentforce platform](https://www.salesforce.com/platform/agentforce-platform), Salesforce, accessed 28 August 2026.
8. [Salesforce SOMA/A2A governance](https://help.salesforce.com/s/articleView?id=005317683&language=en_US&type=1), Salesforce, accessed 28 August 2026.
9. [Google A2A developer toolkit](https://cloud.google.com/blog/products/ai-machine-learning/agent2agent-protocol-is-getting-an-upgrade), Google Cloud, 31 July 2025.
10. [UiPath agentic automation platform](https://www.uipath.com/platform/agentic-automation), UiPath, accessed 28 August 2026.
11. [UiPath governance and security](https://www.uipath.com/blog/product-and-updates/agentic-enterprise-governance-and-security-2025-10-release), UiPath, 19 November 2025.
12. [Celonis AgentC and Process Intelligence Graph](https://www.celonis.com/news/press/celonis-showcases-latest-process-intelligence-and-ai-innovations-at-next-2025), Celonis, 13 May 2025.
13. [Workday Agent System of Record announcement](https://newsroom.workday.com/2025-02-11-The-Next-Generation-of-Workforce-Management-is-Here-Workday-Unveils-New-Agent-System-of-Record), Workday, 11 February 2025.
14. [Workday ASOR general availability](https://blog.workday.com/en-us/managing-ai-powered-future-of-work.html), Workday, accessed 28 August 2026.
15. [OpenAI agentic workflows](https://openai.com/solutions/use-case/agents/), OpenAI, accessed 28 August 2026.
16. [OpenAI practical guide to building agents](https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf), OpenAI, accessed 28 August 2026.
17. [Anthropic remote MCP connector security guidance](https://support.anthropic.com/en/articles/11175166-getting-started-with-custom-connectors-using-remote-mcp-servers), Anthropic, accessed 28 August 2026.
18. [Anthropic containment and connector risk](https://www.anthropic.com/engineering/how-we-contain-claude), Anthropic, accessed 28 August 2026.
19. [NIST AI RMF: Generative AI Profile](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence), NIST, 26 July 2024.
20. [NIST TEVV-Athlon framework](https://www.nist.gov/artificial-intelligence/ai-research/tevv-athlon-framework-evaluating-ai-systems), NIST, 7 August 2026.
21. [OWASP Top 10 for Agentic Applications](https://genai.owasp.org/2025/12/09/owasp-top-10-for-agentic-applications-the-benchmark-for-agentic-security-in-the-age-of-autonomous-ai/), OWASP, 9 December 2025.
22. [LangGraph human-in-the-loop](https://docs.langchain.com/oss/python/langchain/human-in-the-loop), LangChain, accessed 28 August 2026.
23. [IBM agentic AI for digital twin](https://research.ibm.com/publications/agentic-ai-for-digital-twin), IBM Research, 25 February 2025.

### Evidence boundary

Vendor publications describe vendor claims and announced/available features, not independent proof of capability, security or market adoption. “Not publicly evidenced” in this report means not established in the sources reviewed; it does not establish absence. All architecture recommendations are labelled as design proposals or inferences and must be independently validated before any production claim.
