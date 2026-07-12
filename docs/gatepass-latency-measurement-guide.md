# GatePass Latency Measurement Guide

## Purpose

The P3-M137 scorecard includes local illustrative timing so reviewers can see that each local scenario records decision duration. This timing is useful for local developer review, but it is not a production benchmark.

## How To Run

```bash
npm run demo:gatepass-scorecard
npm run demo:gatepass-scorecard -- --summary-only
npm run demo:gatepass-scorecard -- --json
```

## Timing Fields

- `decisionDurationMs`: local elapsed time for one scenario evaluation
- `totalDurationMs`: local elapsed time for the whole scorecard run
- `averageDecisionMs`: average local decision time across scenarios
- `minDecisionMs`: shortest local scenario decision time
- `maxDecisionMs`: longest local scenario decision time
- `timingMode`: `local_illustrative`

## What Timing Means

Timing is local illustrative measurement only. It is not cloud latency, not representative of all machines, not a production benchmark, and not evidence of production readiness.

Timing varies by machine, Node.js runtime state, operating system scheduling, and run conditions.

## Why Fast Rejection Matters

Pre-action gates should reject obvious invalid proof before sensitive work proceeds. Fast rejection can improve developer ergonomics, but correctness, fail-closed behavior, and clear decision reasons matter more than speed.

## Safety Boundary

The scorecard does not call networks, execute tools, contact agents, process payments, prepare real payments, execute settlement, use production signing, or execute actions.

Public contact: gpmiddleton71@gmail.com

## P3-M138 - GatePass Developer Wrapper and Local Integration Example
P3-M138 adds a local deterministic GatePass developer wrapper and local framework-style integration example. It shows `wrapGatePassTool` gating local mock tool calls before action, uses GatePass proof vocabulary and GatePass claims vocabulary as supporting material only, and adds no production middleware claim, production readiness claim, security certification claim, live framework execution, real tool execution, network calls, payment authorisation, settlement authorisation, or action execution.

## P3-M139 - One-Command Reviewer Demo Kit
P3-M139 adds a local deterministic one-command reviewer demo kit for the GatePass lifecycle, adversarial scorecard, developer wrapper, local integration summary, safety boundary, and JSON report output. It uses GatePass proof vocabulary and GatePass claims vocabulary as supporting material only, and adds no production middleware claim, production benchmark claim, security certification claim, production readiness claim, live tool execution, network calls, payment authorisation, settlement authorisation, or action execution.
