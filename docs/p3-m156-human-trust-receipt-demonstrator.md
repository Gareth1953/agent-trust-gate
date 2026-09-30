# P3-M156 — Human Trust Receipt Demonstrator

## Purpose

P3-M156 turns the Human Trust Receipt design principle into a deterministic local demonstrator.

The human-facing principle is simple:

> Technical trust must ultimately become human-understandable proof.

Agent Trust Gate™ keeps the machine-verifiable evidence underneath. The Human Trust Receipt is a constrained presentation of that evidence for a person who should not need to understand cryptographic digests, policy-engine internals, nonce states or agent protocols.

## What the demonstrator adds

P3-M156 adds:

- `schemas/human-trust-receipt.schema.json` — closed local receipt schema;
- `src/human-trust-receipt.ts` — fail-closed evidence-to-receipt engine;
- `src/human-trust-receipt-cli.ts` — deterministic local scenarios and plain-language output;
- `test/human-trust-receipt.test.ts` — anti-tamper and false-assurance tests;
- `examples/human-trust-receipt-completed.json` — sample machine-readable completed receipt;
- `discovery-site/human-trust-receipt-demo.html` — static public-facing explanation and synthetic receipt examples.

## Core safety rule

> The receipt is not the proof. The underlying evidence is the proof.

The engine does not accept a loose `approved: true` assertion. An AUTHORISED or COMPLETED_EXACTLY_AS_AUTHORISED receipt requires an internally consistent evidence chain.

Where required, the chain must show:

1. verified Agent Standing bound to the exact action digest;
2. verified Human Authority Proof bound to the same exact action digest;
3. a checked policy decision;
4. a verified GatePass with the same GatePass ID and exact action digest; and
5. for a completed action, execution evidence referencing the same GatePass and exact action digest with successful verification.

Any material inconsistency becomes `UNVERIFIED`. The presentation layer must not guess, soften or hide a broken proof chain.

## Demonstrated statuses

The fixed local scenarios intentionally cover one example of each public status:

- `AUTHORISED` — the exact action is authorised but no execution is claimed;
- `COMPLETED_EXACTLY_AS_AUTHORISED` — execution evidence matches the same verified GatePass and exact action;
- `REFUSED` — a checked policy decision refuses the action and no GatePass is invented;
- `UNVERIFIED` — the evidence chain is inconsistent, incomplete or cannot support the requested trust claim.

The tampered scenario changes the execution action digest after authorisation. The Human Trust Receipt must display `UNVERIFIED`.

## Run locally

After building the repository:

```powershell
npm run build --silent
node dist/src/human-trust-receipt-cli.js
```

Summary only:

```powershell
node dist/src/human-trust-receipt-cli.js --summary-only
```

One scenario:

```powershell
node dist/src/human-trust-receipt-cli.js --scenario completed_refund
```

Machine-readable output:

```powershell
node dist/src/human-trust-receipt-cli.js --json
```

Dedicated tests after build:

```powershell
node --test dist/test/human-trust-receipt.test.js
```

## Human-facing interpretation

A customer-facing receipt can answer questions such as:

- What did the AI system propose or do?
- Which software agent acted?
- Was that agent's standing verified?
- Was a human approval required?
- If so, was current authority verified for the exact action?
- Was policy checked?
- Was the exact action protected by a matching GatePass?
- If execution is claimed, did it match what was authorised?
- What reference can be retained for later investigation or audit?

A simple presentation may therefore say:

> You do not have to trust the AI. Here is the evidence of what it was allowed to do.

This is a product-positioning statement, not a claim that the Human Trust Receipt independently proves every fact without its linked evidence.

## Relationship to existing ATG controls

P3-M156 does not replace Agent Standing, Human Authority Proof, GatePass, refusal receipts, policy decision evidence or execution receipts. It translates selected verified facts from those layers into human-readable form.

Conceptually:

```text
Agent Standing
      ↓
Human Authority when required
      ↓
Policy + exact-action GatePass
      ↓
Execution verification
      ↓
Human Trust Receipt
```

Machine-verifiable trust remains underneath. Human-understandable evidence sits on top.

## Strict boundaries

P3-M156 remains a safe local synthetic demonstrator.

It does not:

- authenticate real employees or customers;
- connect to enterprise identity directories;
- execute a refund, transfer, payment or settlement;
- intercept live AI-agent actions;
- provide production key custody;
- certify legal, regulatory, security or AI-safety compliance;
- prove that an AI system is universally trustworthy, truthful, conscious or safe;
- make the visible receipt a substitute for the underlying evidence.

All names, accounts, agents, actions, references, policies and receipts in the demonstration are fictional fixtures.

## Positioning

Technical / enterprise:

> **Agent Trust Gate™ — Verify Before Action.**

Human / customer:

> **Agent Trust Gate™ — Making AI Trust Visible to Humans.**

The second line is a human-facing explanation of the ATG evidence model, not a separate product or a weaker trust standard.
