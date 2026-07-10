# Simplified Developer CLI

P3-M119 adds a simplified developer-facing CLI for Agent Trust Gate™. It gives
developers, agent builders, and integration reviewers a shorter local command
path for the core trust-gate flows without removing the specialised local demo
scripts.

Core rule:

No mandate. No evidence. No verified intent. No signed gate pass. No settlement.

## Purpose

The simplified CLI addresses reviewer feedback that the project needed clearer
CLI ergonomics and more discoverable developer commands. It groups the most
important local flows under plain command names:

- `gate evaluate`
- `receipt verify`
- `proof money-gate`
- `proof signed`
- `demo adversarial`
- `demo quickstart`

This is local developer experience only. It does not add live APIs, live
payments, settlement execution, production signing, external-agent contact, or
action execution.

## Relationship To Existing Local Demos

The existing specialised scripts remain available for focused testing and
documentation. P3-M119 adds a top-level facade over the local flows:

- local gate pass demo;
- local trust receipt verification;
- local end-to-end money-gate proof;
- local signed receipt/proof verification;
- local adversarial evaluation pack.

The simplified CLI defaults to safe local examples and emits bounded JSON
summaries. It does not replace the specialised scripts used by tests and docs.

## Help

```powershell
npm run cli -- help
```

The help output lists the supported local commands and the local-only safety
boundary.

## Gate Evaluation

```powershell
npm run cli -- gate evaluate
```

By default this evaluates `examples/local-demo-low-risk-allow.json` and prints a
local gate summary: request ID, verdict, receipt type, risk tier, failed checks,
reason codes, gate-pass expiry, and replay-protection mode.

Use a different local request fixture:

```powershell
npm run cli -- gate evaluate --input examples/local-demo-no-mandate-refuse.json
```

## Receipt Verification

```powershell
npm run cli -- receipt verify
```

By default this verifies `examples/local-receipt-signed-gate-pass.json` with the
local trust receipt verifier. It reports whether the receipt is structurally
valid, fresh, replay-safe, and valid for simulated settlement.

Use a local receipt or local request fixture:

```powershell
npm run cli -- receipt verify --input examples/local-receipt-refusal-no-mandate.json
```

## Money-Gate Proof

```powershell
npm run cli -- proof money-gate
```

By default this runs the local end-to-end money-gate proof with
`examples/local-end-to-end-money-gate-proof-input.json`. It reports proof
status, scenario count, controls proven, failure reasons, and local execution
flags.

## Signed Proof Verification

```powershell
npm run cli -- proof signed
```

By default this verifies both local signed examples:

- `examples/local-signed-trust-receipt-valid.json`
- `examples/local-signed-money-gate-proof-valid.json`

It reports payload hash matching, signature validity, local demo key metadata,
and the authorisation flags:

- `productionSigning: false`
- `paymentAuthorisation: false`
- `settlementAuthorisation: false`

Verify one signed artifact:

```powershell
npm run cli -- proof signed --kind receipt --input examples/local-signed-trust-receipt-valid.json
```

## Adversarial Demo

```powershell
npm run cli -- demo adversarial
```

This runs the P3-M118 local adversarial evaluation summary. It reports the
blocked scenario count, allowed local control count, and whether the evaluation
passed.

Run one adversarial scenario:

```powershell
npm run cli -- demo adversarial --scenario replay_attempt
```

## Quickstart

```powershell
npm run cli -- demo quickstart
```

This is the shortest useful local command path. It composes:

1. `gate evaluate`
2. `receipt verify`
3. `proof money-gate`
4. `proof signed`
5. `demo adversarial`

The output is a compact local summary showing whether the gate, receipt,
money-gate proof, signed proof verification, and adversarial pack all pass
their local checks.

## Expected Local-Only Output

Every command keeps the local boundary visible. Results include:

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

## Package Scripts

P3-M119 adds:

- `npm run cli -- help`
- `npm run gate`
- `npm run demo:quickstart`

Existing specialised scripts remain available, including `demo:gate`,
`proof:money-gate`, `demo:adversarial`, and `demo:integrations`.

## Relationship To P3-M120

P3-M120 adds local reference integration examples for common agent-system
patterns. They can be run with:

```powershell
npm run demo:integrations
```

The simplified CLI remains focused on the core trust-gate flows. The P3-M120
runner is a specialised local demo script, not a live framework integration.

## Safety Boundary

Agent Trust Gate™ remains local-first and `local_demo_only`.

P3-M119 does not add live APIs, live payment processing, real settlement
execution, production signing, production key management, secrets, credentials,
cloud/network calls, forms, tracking, analytics, telemetry, hosted calls,
external-agent contact, outreach automation, AUC integration, Agent Contact
System integration, or action execution.

Public project contact: `gpmiddleton71@gmail.com`
