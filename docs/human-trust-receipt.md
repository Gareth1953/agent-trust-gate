# Human Trust Receipt — Human-Visible Proof for AI Actions

## Purpose

Agent Trust Gate™ is designed around a simple principle: consequential AI actions should not depend on blind trust in an agent, model, provider or operator.

The technical proof is necessary, but it is not sufficient for ordinary human trust.

Most people do not need or want to understand canonical JSON, cryptographic digests, signature suites, nonce state, replay protection, policy engines or agent protocols. They need a simple answer to ordinary questions:

- Who authorised this action?
- What exactly is the AI allowed to do?
- What amount, recipient, account, purpose or other limits apply?
- How long is the authority valid?
- Can the AI change the authorised action?
- Was the final action executed exactly as authorised?
- If the action was refused, why was it stopped?
- What evidence can the person keep and verify later?

The proposed **Human Trust Receipt** is the human-visible layer over ATG's existing exact-action proof model.

> **You do not need to understand AI to verify what it is allowed to do.**

> **Do not trust the AI. Trust the proof.**

## Human-first design principle

AI systems, business processes and trust controls ultimately exist to serve people and organisations accountable to people.

ATG should therefore make consequential machine authority understandable to an ordinary person, not only to developers, security engineers, auditors or other machines.

The Human Trust Receipt should be designed so that a customer, employee, small-business owner, director, pensioner or other non-technical user can:

1. see the proposed action in plain language;
2. see who authorised it and what authority was verified;
3. see the exact limits that apply;
4. see whether the action is authorised, refused or completed;
5. save or print the receipt;
6. retain a stable reference for later audit or dispute;
7. verify that the human-readable receipt still corresponds to the underlying exact-action proof.

## Proposed human-readable receipt

A future receipt may present fields such as:

- **Status** — AUTHORISED / REFUSED / COMPLETED EXACTLY AS AUTHORISED;
- **Action** — plain-language description of the consequential action;
- **Purpose** — the authorised reason or business/customer purpose;
- **Authorised by** — the verified natural person or accountable authority where policy requires human approval;
- **Authority verified** — whether the applicable authority checks passed;
- **Recipient / counterparty** — when relevant;
- **Maximum amount / value** — when relevant;
- **Account / department / jurisdiction / risk tier** — where applicable;
- **Valid until** — the authority or GatePass freshness boundary;
- **May the AI change these details?** — explicit yes/no and permitted change scope;
- **Execution match** — whether the final executed action matched the exact authorised action;
- **Refusal reason** — plain-language explanation where ATG refused the action;
- **Receipt reference** — a stable human-visible identifier;
- **Verification reference** — a machine-verifiable link, QR code or equivalent future mechanism to the underlying proof package.

## Physical and retainable proof

The human-visible proof should not be limited to an ephemeral screen.

Future presentation formats may include:

- on-screen receipt;
- downloadable PDF;
- printable receipt;
- email or other human-readable confirmation;
- application or banking record;
- QR/reference-based verification of the retained receipt.

These are presentation and roadmap concepts only. The current public repository does not provide production PDF generation, email/SMS delivery, banking integration, QR verification service or live receipt registry.

## Relationship to existing ATG proof

The Human Trust Receipt does not replace GatePass, Human Authority Proof, refusal evidence or execution receipts.

It translates selected facts from those proof layers into a human-readable form.

The intended future relationship is:

```text
Exact proposed action
→ organisational mandate / policy / evidence checks
→ Verified Human Authority where required
→ one-use exact-action GatePass or refusal
→ execution-match evidence
→ Human Trust Receipt
```

The machine-verifiable evidence remains the source of proof. The human receipt is a constrained presentation of that evidence for people who should not need specialist AI or cryptographic knowledge to understand what happened.

## What the receipt must never claim

A Human Trust Receipt must not claim that:

- an AI model is universally safe;
- an agent is honest, conscious, reliable or compliant;
- every underlying data source is true;
- an organisation has satisfied all legal or regulatory obligations;
- the action is risk-free;
- a cryptographic signature makes every assertion true;
- ATG is production-certified or regulator-approved.

The receipt should make a narrower, testable statement:

> **For this exact action, these were the verified authority conditions and limits, this was the GatePass/refusal decision, and this is whether the resulting execution matched that authorised action.**

## Human trust, organisational trust and machine trust

ATG should distinguish three related layers:

1. **Machine proof** — can systems verify identity, delegation, exact-action binding, freshness, replay state and proof integrity?
2. **Organisational authority** — can the organisation show that the action was within current mandate, policy, limits and authorised human/organisational responsibility?
3. **Human-visible trust** — can an ordinary person understand what the machine was allowed to do and retain evidence of what actually happened?

The Human Trust Receipt is intended to bridge the third layer without weakening the first two.

## Crypto-agility and future trust

Human-readable trust must not depend on one permanent cryptographic algorithm.

ATG's wider roadmap remains crypto-agile and post-quantum-ready rather than claiming that today's authentication or signature choices are automatically quantum-safe. Future receipt verification should therefore be able to reference replaceable algorithm identifiers, key identifiers, signature suites and verification policy without exposing those technical details as a prerequisite for ordinary human understanding.

## Future submission principle

Where relevant, future ATG submissions, reviewer materials and design-partner discussions should explain the human problem as well as the machine problem:

> **The goal is not to ask customers to trust AI blindly. The goal is to give people simple, retainable proof of who authorised a consequential AI action, exactly what the AI was permitted to do, what limits applied, and whether the machine stayed inside those limits.**

This framing does not change the current claims boundary. The public repository remains a local, synthetic, non-production demonstrator unless and until separately documented capabilities are actually implemented and validated.
