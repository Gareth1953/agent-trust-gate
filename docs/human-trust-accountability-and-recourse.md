# Human Trust, Accountability and Recourse for Consequential AI-Agent Actions

## Purpose

Agent Trust Gate™ should not treat trust as a problem that exists only between machines, agents, security systems, auditors and organisations.

Companies increasingly use, or may in future use, AI agents and automated systems to interact with customers, clients, employees, suppliers and other people in workflows that can affect money, access, purchases, refunds, credit, payments, account changes, service outcomes and other consequential decisions or actions.

The person affected may have little or no knowledge of AI, agent architecture, cryptography, policy engines or governance frameworks. Technical controls therefore remain incomplete from the human point of view unless their effect can be understood, retained and challenged by the person who ultimately experiences the consequence.

> **AI does not exist for AI. It serves people.**

> **Trust for the machine. Accountability for the organisation. Proof for the human. Recourse when something goes wrong.**

## The problem: authorisation is necessary but not sufficient

ATG's core exact-action controls answer an important question:

> **Was this exact consequential action properly authorised within the applicable mandate, scope, limits, evidence and approval conditions?**

That is necessary, but an ordinary customer or client may also need answers to different questions:

- Why should I rely on this action or outcome?
- What is the AI allowed to decide or change?
- What is outside the AI's authority?
- Was a human required to approve this action?
- Which organisation remains accountable for the action?
- What evidence can I keep?
- What happens if the action is wrong, disputed or harmful?
- Who can I contact or challenge?

ATG should therefore distinguish technical authorisation from **humanly justified reliance**.

The aim is not to maximise human trust in AI. The aim is to **calibrate trust** by making relevant authority, limits, evidence, accountability and recourse visible.

> **Do not ask people to trust the AI. Give them enough evidence to decide whether reliance on this exact action is justified.**

## Human trust model

For consequential company-agent-human interactions, ATG should consider five distinct dimensions:

### 1. Authority

Can the organisation prove that the exact proposed action was within current delegated authority, scope, value limits, account or counterparty restrictions, jurisdiction, risk tier, evidence requirements and human-approval requirements?

This remains part of ATG's core GatePass / refusal model.

### 2. Reliance evidence

Where the action depends on AI judgment rather than only deterministic execution, what evidence is available about the basis, limitations or uncertainty relevant to that specific action?

ATG must not invent a competence score or claim that an AI is reliable merely because it has a valid GatePass. A GatePass proves scoped authority conditions, not universal intelligence, correctness or good judgment.

A future human-facing layer may reference validated evidence supplied by the surrounding system, such as an escalation state, unresolved uncertainty, required human review, applicable policy reference or other decision evidence. Unsupported confidence claims must not be converted into trust claims.

### 3. Legibility

Can a non-technical person understand, in plain language:

- what is happening;
- what the AI may and may not do;
- who authorised it;
- what limits apply;
- whether a human checked it where required;
- whether the final action matched the authorised action?

The Human Trust Receipt is the proposed ATG presentation layer for this requirement.

### 4. Organisational accountability

The use of an AI agent must not make responsibility disappear.

Where a company deploys an agent to interact with a customer, client or other affected person, the human-facing proof should be capable of identifying the accountable organisation or responsible operational route associated with the action.

ATG should not imply that the agent itself absorbs legal, financial or organisational responsibility.

### 5. Human recourse

Trust is incomplete if the affected person can see what happened but has no clear way to challenge, dispute, reverse, escalate or seek remediation where appropriate.

A future human-facing trust layer should therefore be able to carry or reference a human-readable recourse path, such as:

- dispute reference;
- responsible organisation;
- escalation route;
- human-review route;
- refund / reversal / correction status where applicable;
- evidence-retention reference;
- applicable complaint or remediation process supplied by the organisation.

ATG does not itself create legal rights, guarantee compensation or determine a regulator's required complaints process. It can, however, make the organisation's declared recourse route and the exact-action evidence easier to connect.

## Company-agent-human interaction model

The broader ATG human-trust chain is:

```text
Human intent / customer need
→ organisational mandate and responsibility
→ agent standing and delegated authority
→ exact proposed action
→ policy / scope / value / evidence checks
→ Verified Human Authority where required
→ one-use GatePass or refusal
→ execution-match evidence
→ Human Trust Receipt
→ accountability and recourse reference
```

This chain begins with a human need and ends with human-understandable evidence and accountability. The AI agent sits inside the chain; it is not the final beneficiary of the trust architecture.

## Money and customer-impacting actions

This human trust model is particularly relevant where agents may affect money or other high-impact customer/client outcomes.

Illustrative future/current categories include:

- payments and transfers;
- purchases and checkout;
- refunds, repayments and reversals;
- returns, exchanges and credit notes;
- account or beneficiary changes;
- subscriptions and cancellations;
- credit, lending or affordability-related workflows;
- fraud or account-restriction actions;
- insurance, claims or financial-service workflows;
- procurement and supplier payments;
- customer service actions with financial consequences;
- other consequential actions where a company-controlled agent acts toward or on behalf of a person.

These categories describe design relevance only. The current public ATG repository does not execute live payments, make real customer decisions, operate production financial infrastructure, determine legal liability or provide regulatory certification.

## Human-visible proof should answer ordinary questions

A person affected by an agent action should not need specialist AI knowledge to ask:

1. **What happened?**
2. **Who allowed it?**
3. **What exactly was the AI permitted to do?**
4. **What could it not change?**
5. **Did the actual action match the authorised action?**
6. **Which organisation stands behind this action?**
7. **What can I do if I dispute it or something went wrong?**

A useful human trust layer is one that answers those questions with evidence rather than persuasion.

## Design principle: calibrated trust, not persuasive trust

ATG should avoid interface patterns whose purpose is merely to make an AI appear more human, confident, friendly or authoritative.

Human trust should not be manufactured through tone, anthropomorphism, long explanations, badges or unsupported confidence claims.

The preferred design principle is:

> **Make authority, limits, uncertainty where relevant, accountability and evidence visible. Let the human decide whether reliance is justified.**

This preserves an important distinction:

- **trustworthy presentation** is not the same as **trustworthy action**;
- **explanation** is not the same as **evidence**;
- **confidence** is not the same as **authority**;
- **a valid GatePass** is not proof that every underlying judgment is correct;
- **human-friendly proof** must remain anchored to machine-verifiable evidence.

## Human Trust Receipt extensions

The existing Human Trust Receipt roadmap may therefore evolve beyond authority and execution fields to include, where supported by real evidence and policy:

- **Accountable organisation** — who stands behind the agent-mediated action;
- **Human review status** — whether human review was required, completed or escalated;
- **AI discretion** — what details the agent was permitted to choose or change;
- **Non-discretionary limits** — what was locked and could not be changed;
- **Relevant uncertainty / escalation** — only where supported by validated surrounding-system evidence;
- **Execution match** — whether the resulting action matched the exact authorised action;
- **Recourse reference** — dispute, escalation, correction or remediation route supplied by the organisation;
- **Evidence reference** — stable link between the human-readable receipt and the underlying proof package.

## Example human-facing outcome

A future presentation might say:

```text
AI ACTION RECEIPT

Status: COMPLETED EXACTLY AS AUTHORISED
Action: Pay £620.00 to ABC Ltd
Purpose: Invoice 4821
Authority: Verified
Human approval: Required and verified
AI discretion: Recipient locked; amount cannot increase
Valid until: 10:42
Execution match: Yes
Accountable organisation: Example Bank plc
Dispute / review reference: ATG-47281
Evidence retained: Yes
```

This is an illustrative design example only. It is not a live receipt, bank integration, payment authorisation, legal notice or regulatory disclosure.

## Relationship to current ATG proof

This human trust layer does not replace the existing ATG core:

- Agent Standing;
- organisational mandate and policy;
- Verified Human Authority where required;
- exact-action canonicalisation and digest binding;
- GatePass / refusal;
- freshness, expiry and replay controls;
- execution-match evidence;
- decision and execution receipts.

Instead, it broadens the final interface between those controls and the humans, clients and customers affected by consequential agent activity.

Technical proof remains the source. Human-readable trust material is a constrained representation of verified facts and declared organisational recourse.

## Claims boundary

ATG must not claim that this human trust model:

- makes an AI universally trustworthy;
- proves an AI's judgment is correct;
- guarantees safety or a good outcome;
- proves all source data is true;
- determines legal liability;
- creates consumer rights or compensation obligations;
- replaces regulated complaints, audit, risk or compliance functions;
- certifies an organisation, agent or model;
- constitutes regulatory approval;
- is already implemented as production customer-facing infrastructure.

The current repository remains a local, synthetic, non-production demonstrator unless separately documented functionality has actually been implemented and validated.

## Strategic principle for future ATG work

Future ATG submissions, reviewer materials, demos and design-partner conversations should preserve the full human loop:

> **AI does not exist for AI. It serves people.**

> **Trust for the machine. Accountability for the organisation. Proof for the human. Recourse when something goes wrong.**

The commercial and governance question is therefore larger than whether an agent can technically be authorised.

It is also:

> **Can the company prove to the affected human what this exact agent action was allowed to do, why it was permitted, whether it stayed inside its limits, who remains accountable, and what the person can do if something goes wrong?**
