# GatePass Metrics Methodology

## Local-Only Method

P3-M137 uses deterministic local scenario inputs. It runs GatePass round-trip scenarios where practical and uses the GatePass claims vocabulary classifier for unsafe claim scenarios.

No network calls, live tools, live APIs, MCP server functionality, browser automation, real payments, real settlement, direct bot messaging, live agent-to-agent communication, or action execution are used.

## Scenario Counting

Each scenario defines:

- scenario id
- expected outcome
- scenario group
- source model
- expected reason
- risk represented
- whether it is adversarial
- whether it is a valid control

The scorecard compares expected outcome to actual outcome and records matched or mismatched outcomes.

## Outcome Categories

The supported outcomes are:

- `allow`
- `block`
- `escalate`
- `require_evidence`
- `require_human_review`
- `require_signed_proof`

The summary includes expected and actual counts for each category, plus adversarial caught and valid allowed counts.

## False Allow / False Block Representation

The local scorecard does not claim statistical false-positive or false-negative rates. It represents only deterministic expected-vs-actual outcomes:

- a false allow would be an adversarial scenario whose actual decision is `allow`
- a false block would be a valid scenario whose actual decision is `block`
- an expected block is a scenario that should fail closed
- an expected allow is a valid local control that should allow locally only

## Timing Method

The scorecard records local illustrative timing around each local scenario evaluation. Timing is captured in milliseconds and summarized as total, average, minimum, and maximum local decision duration.

These timings vary by machine and run. They are not cloud latency, not production latency, not a production benchmark, not a capacity test, and not evidence of production readiness.

## Why Timing Is Still Useful

Fast local rejection matters for pre-action gates because a gate should be able to stop obviously invalid requests before sensitive work proceeds. Correctness and clear reasons remain more important than speed.

## Safety Boundary

The methodology is local proof-of-concept scoring only. It does not provide production readiness, production-grade crypto, security certification, legal/compliance/security guarantee, payment authorisation, settlement authorisation, or action execution.

Public contact: gpmiddleton71@gmail.com
