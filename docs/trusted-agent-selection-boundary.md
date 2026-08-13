# Trusted Agent Selection Boundary — Future ATG Integration

## Status

**Future integration direction only. Not a current implemented capability.**

Agent Trust Gate™ should not become an agent marketplace, general-purpose agent router, orchestration framework or clearing house.

Instead, as specialist-agent registries, marketplaces and discovery systems mature, ATG may sit **between agent discovery and consequential execution** as a trust and authority qualification boundary.

> **Discovery asks: Which agent can do this?**
>
> **ATG asks: Which capable agent is actually permitted to do this exact task, for this organisation, under this mandate, for this affected human, within these limits?**

## Strategic purpose

Future agent ecosystems are likely to contain multiple specialist agents rather than one agent performing every task.

A registry, marketplace, orchestrator or discovery protocol may identify several agents that advertise the required capability. Capability alone should not be treated as sufficient authority for a consequential action.

The proposed ATG role is therefore not to rank agents by popularity or become the marketplace itself. It is to verify whether a candidate agent has sufficient standing, delegation, authority, human-duty compatibility and exact-action permission before execution.

## Proposed future flow

```text
Task / Human Need
→ Agent Registry / Marketplace / Discovery Layer
→ Candidate Capable Agents
→ ATG Trusted Agent Selection Boundary
→ Agent Standing Verification
→ Organisational Mandate / Delegation Check
→ Human Duty Profile Check where applicable
→ Scope / Amount / Account / Jurisdiction / Risk Limits
→ Verified Human Authority where required
→ Exact-Action GatePass or Refusal
→ Execution
→ Execution Evidence
→ Human Trust Receipt / Accountability / Recourse
```

## Example

A discovery system returns three agents capable of processing a refund.

```text
Agent A — capable, but not delegated for UK customer data
Result: REFUSE

Agent B — capable, but authority limit is £500
Requested refund: £850
Result: REFUSE

Agent C — capability declared, standing verified, correct delegation,
Human Duty Profile satisfied, amount within authority and required human
approval verified
Result: ELIGIBLE FOR EXACT-ACTION GATE EVALUATION
```

The discovery system identifies capability. ATG determines whether the exact consequential use of that capability is permissible under the required trust conditions.

## Why this belongs inside ATG

This integration naturally extends existing ATG controls:

- **Agent Standing** — which software agent is acting and under whose principal/delegation;
- **Organisational Authority** — whether the principal has granted authority for the relevant task;
- **Human Duty Profile** — whether organisation-defined responsibilities to the affected human constrain the action;
- **Verified Human Authority** — whether an authorised natural person must approve the exact action;
- **Exact-Action GatePass** — whether this exact action may proceed now;
- **Execution Evidence** — whether the resulting action matched what was authorised;
- **Human Trust Receipt** — human-understandable proof, accountability and recourse.

The Trusted Agent Selection Boundary therefore complements external discovery infrastructure without duplicating it.

## What ATG should not become

ATG should not, by default:

- build a general public agent marketplace;
- compete with agent registries or discovery protocols;
- rank agents by popularity, reviews or speculative reputation scores;
- claim that a capability declaration proves competence, safety or suitability;
- autonomously purchase agent services;
- autonomously negotiate commercial terms;
- execute live payments or settlements;
- treat discovery metadata as sufficient authority;
- claim a discovered agent is legally compliant merely because ATG permits an exact action.

## Candidate future qualification inputs

When a credible integration opportunity appears, an ATG adapter could evaluate candidate-agent evidence including:

- declared agent identity;
- accountable principal;
- signed delegation or authority evidence;
- capability/scope requested by the external discovery layer;
- action type;
- target / counterparty;
- value or spend limits;
- account / department;
- jurisdiction;
- risk tier;
- Human Duty Profile requirements;
- required human approval;
- policy/evidence references;
- freshness and expiry;
- one-use nonce / replay state;
- exact canonical action digest.

## Selection result

ATG should avoid claiming that it selects the "best" agent unless a future validated ranking model is separately defined.

A safer future output would classify candidates by permission state, for example:

- `ELIGIBLE_FOR_GATE_EVALUATION`
- `STANDING_UNVERIFIED`
- `DELEGATION_INVALID`
- `SCOPE_NOT_AUTHORISED`
- `VALUE_LIMIT_EXCEEDED`
- `HUMAN_DUTY_UNRESOLVED`
- `HUMAN_APPROVAL_REQUIRED`
- `POLICY_EVIDENCE_MISSING`
- `REFUSED`

These names are roadmap vocabulary only and are not current implemented failure codes.

## Commercial positioning

The future commercial wedge is not:

> "We find the best AI agent."

It is:

> **"Your discovery system can find agents that claim they can do the job. Agent Trust Gate verifies which candidate is actually permitted to perform this exact consequential action before execution."**

This preserves ATG's position close to the consequential action and money gate rather than moving upstream into generic marketplace discovery.

## Integration trigger

Do not build this layer merely because agent registries or marketplaces exist.

Consider implementation only when a credible buyer, design partner, reviewer, registry provider, agent platform, payment infrastructure provider or protocol integration opportunity requires ATG to qualify candidate agents before consequential execution.

Until then, retain this as a documented future integration direction.

## Claims boundary

The current public repository does not provide live agent discovery, registry search, marketplace routing, external agent ranking, automatic agent selection, A2A negotiation, live integration, production enforcement, live payment, settlement, production identity infrastructure or autonomous execution.

This document records a future ATG integration architecture only.

## Strategic principle

> **Capability is not authority. Discovery is not permission. The agent that can do the job is not necessarily the agent allowed to do the job.**
