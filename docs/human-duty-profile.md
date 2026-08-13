# Human Duty Profile — Agent-to-Human Responsibility Constraints

## Purpose

Agent Trust Gate™ should recognise that a consequential AI-agent task is not defined only by what the agent has been asked to achieve.

Where an agent acts for a company, bank, retailer, insurer, platform, public body or other organisation and its action may affect a human, the organisation may also have duties, policies, limits, disclosures, escalation requirements and recourse obligations that shape what the agent is permitted to do.

> **The task is not the whole mandate. The human relationship is part of the mandate.**

A future **Human Duty Profile** is the proposed ATG layer for translating those organisation-defined human-facing responsibilities into machine-checkable constraints before a consequential agent action can receive a GatePass.

The goal is not to pretend that an AI agent has human judgment, empathy or independent legal personhood. The goal is to prevent the surrounding system from treating a business objective as if it were the only relevant instruction.

## Why this layer is needed

An agent can technically complete its assigned task and still produce an unacceptable human outcome.

Examples include an agent that:

- collects money while ignoring a valid dispute;
- changes a customer's account without the required confirmation;
- continues an automated process when human review is required;
- treats an ambiguous human statement as certain consent;
- infers facts about vulnerability, intent or circumstances that are not supported by evidence;
- withholds a required disclosure;
- exceeds the discretion the organisation intended to delegate;
- gives a person no clear route to challenge or correct a consequential action.

ATG should therefore ask not only:

> **Is this action within the agent's delegated authority?**

but also:

> **Is this action permissible within the organisation's defined responsibilities to the human affected?**

## Reverse-coding the human relationship

For consequential agent activity, the safer design direction is to work backwards from the affected human before allowing execution.

A future Human Duty Profile may require the organisation or policy layer to determine:

1. **Who may be affected?** — customer, client, employee, supplier, account holder, borrower, claimant, beneficiary or other person.
2. **What is the relationship?** — payment, purchase, credit, refund, service, collection, account administration, claims handling, support or another defined context.
3. **What is at stake?** — money, access, rights, service outcome, reputation, account status, financial obligation or another consequential interest.
4. **What duties or policy constraints apply?** — organisation policy, contract, approved process, human-review rule, disclosure requirement, mandate, jurisdiction or other validated source.
5. **What may the agent decide?** — the specific discretion delegated to the agent.
6. **What is locked?** — facts, amounts, recipients, outcomes, statements or decisions the agent must not change or infer.
7. **When must autonomy reduce or stop?** — dispute, ambiguity, missing evidence, uncertainty, vulnerability signal, conflicting instructions, high consequence or required human judgment.
8. **What human involvement is required?** — approval, confirmation, second review, specialist review or direct human handling.
9. **What evidence must be retained?** — request, policy, authority, decision, escalation, GatePass/refusal and execution evidence.
10. **What recourse route applies?** — dispute, correction, reversal, complaint, escalation or remediation process supplied by the accountable organisation.

The Human Duty Profile would become an input to ATG policy evaluation rather than an instruction that the agent is trusted to interpret freely.

## Proposed Human Duty Profile fields

A future profile may include fields such as:

- **affectedHumanRole** — the role of the person affected;
- **relationshipType** — the organisation-agent-human relationship;
- **consequenceClass** — financial, account, access, service, employment or other consequential class;
- **accountableOrganisation** — the organisation responsible for the deployed process;
- **policyReferences** — validated policy, mandate or process references;
- **jurisdiction / riskTier** — where applicable;
- **requiredDisclosures** — information the human must receive before or during the action;
- **permittedAgentDiscretion** — what the agent may choose or alter;
- **lockedFields / prohibitedChanges** — what the agent must not change;
- **prohibitedInferences** — facts the agent must not infer without evidence;
- **humanApprovalRequirement** — whether a human approval is required and at what stage;
- **humanEscalationTriggers** — conditions that require human handling;
- **disputeState** — whether a dispute blocks or changes the permitted workflow;
- **uncertaintyState** — whether unresolved uncertainty affects permission to proceed;
- **evidenceRequirements** — evidence required before a GatePass may be issued;
- **recourseReference** — the organisation's declared dispute, correction or remediation route;
- **retentionReference** — how the decision and action evidence should be linked for later review.

These are roadmap concepts. The current public repository does not yet implement a production Human Duty Profile schema or live policy service.

## Agent accountability: operational, not independent legal personhood

ATG should be precise about what "agent accountability" means.

The agent should not be described as an independent legal person that absorbs the organisation's liability or duties.

Instead, **operational agent accountability** means that the system can determine and later evidence:

- which agent acted;
- under whose organisational authority it acted;
- which Human Duty Profile applied;
- what the agent was permitted to decide;
- what it was prohibited from doing;
- whether required human involvement occurred;
- whether the exact proposed action satisfied the applicable duty constraints;
- whether execution matched the authorised action;
- which organisation and recourse route remained attached to the outcome.

The organisation remains the accountable principal unless applicable law or contract establishes otherwise. ATG does not determine legal liability.

## Human nuance: do not infer beyond the evidence

Human communication is often ambiguous, contextual and emotionally complex. An AI agent should not be treated as if it reliably possesses the lived experience or human judgment required to interpret every nuance.

A safer ATG principle is:

> **When human meaning is consequential and the evidence is insufficient, reduce autonomy rather than invent certainty.**

A Human Duty Profile may therefore require escalation when the agent encounters conditions such as:

- an expressed dispute;
- conflicting or ambiguous instructions;
- uncertainty about consent or authority;
- signs that an approved human-support path may be required;
- a request the agent is not authorised to resolve;
- missing evidence for a consequential inference;
- a high-impact outcome requiring human judgment;
- a policy-defined vulnerability or sensitivity trigger.

ATG should not claim that it diagnoses emotion, vulnerability, mental state or intent. It can require the surrounding workflow to stop, narrow the agent's discretion or escalate when validated policy signals require it.

## Example: customer payment collection

Suppose an organisation instructs an agent:

> **Recover an overdue £850 payment from this customer.**

The business objective alone is incomplete.

An illustrative Human Duty Profile might state:

```text
Affected human: retail customer
Relationship: overdue payment collection
Financial consequence: yes
Permitted agent actions: explain verified balance; present approved payment options
Amount: £850 maximum verified balance
Agent may change balance: no
Agent may invent fees or consequences: no
Dispute raised: stop collection path and escalate
Hardship / vulnerability policy signal: route to approved human-support process
Human review: required for non-standard arrangement
Required disclosure: organisation identity and approved payment information
Recourse: customer dispute / complaint reference
Money movement: separate exact-action GatePass required
Evidence retention: required
```

The agent is not asked to "be empathetic" as a substitute for control. It is constrained by the organisation's declared duties and must escalate where the relationship requires human judgment.

## Relationship to GatePass

The proposed future flow is:

```text
Human / customer context
→ organisational mandate
→ Human Duty Profile
→ Agent Standing
→ proposed agent plan or exact action
→ Human Duty Check
→ Verified Human Authority where required
→ exact-action GatePass or refusal
→ execution-match evidence
→ Human Trust Receipt
→ accountability and recourse reference
```

A GatePass should not be issued for a consequential human-facing action merely because the agent has technical authority if a required Human Duty Profile condition remains unresolved.

Candidate future refusal states may include concepts such as:

- HUMAN_DUTY_PROFILE_MISSING;
- HUMAN_IMPACT_UNRESOLVED;
- REQUIRED_DISCLOSURE_MISSING;
- HUMAN_ESCALATION_REQUIRED;
- DISPUTE_REQUIRES_HUMAN;
- AGENT_DISCRETION_EXCEEDED;
- RECOURSE_ROUTE_MISSING.

These names are illustrative roadmap vocabulary only and are not current implemented failure codes.

## Money and financial activity

The Human Duty Profile is especially relevant where company-controlled agents may affect a person's money or financial position, including:

- payments and transfers;
- purchases and checkout;
- refunds, repayments and reversals;
- collections and arrears workflows;
- account or beneficiary changes;
- credit and lending workflows;
- insurance and claims;
- subscriptions and cancellations;
- fraud or account-restriction actions;
- customer-service decisions with financial consequences.

The profile does not itself authorise payment or settlement. Money-moving actions remain subject to ATG's exact-action authority, limit, evidence, approval, replay and execution-match controls.

## Human-facing proof

A Human Trust Receipt should eventually be able to show, where supported by verified evidence:

- which Human Duty Profile applied;
- which organisation remained accountable;
- what the agent was allowed to decide;
- what was locked or prohibited;
- whether human review was required and completed;
- whether an escalation or dispute state applied;
- whether the final action matched the authorised action;
- what recourse reference applies.

This allows the person to see not only that the agent had authority, but that the action was checked against the organisation's declared responsibilities to them.

## Claims boundary

This roadmap layer does not claim that ATG:

- gives an agent independent legal personhood or liability;
- determines all legal duties in every jurisdiction;
- replaces lawyers, compliance functions, regulated complaints processes or human judgment;
- understands human psychology, emotion or vulnerability with certainty;
- proves that an AI decision is correct or fair;
- guarantees a good outcome;
- is a production policy engine;
- is regulator-approved or compliance-certified.

The current repository remains a local, synthetic, non-production demonstrator unless a capability is separately implemented, tested and documented.

## Strategic principle

> **The task is not the whole mandate. The human relationship is part of the mandate.**

For future consequential AI-agent systems, technical authority should be necessary but not sufficient. The surrounding system should also be able to prove that the proposed action respected the organisation's defined responsibilities to the human who would experience the consequence.
