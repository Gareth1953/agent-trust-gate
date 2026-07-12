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

The methodology is local proof-of-concept scoring only. It does not provide production readiness, production-grade crypto, security certification, legal/compliance/security assurance, payment authorisation, settlement authorisation, or action execution.

Public contact: gpmiddleton71@gmail.com

## P3-M138 - GatePass Developer Wrapper and Local Integration Example
P3-M138 adds a local deterministic GatePass developer wrapper and local framework-style integration example. It shows `wrapGatePassTool` gating local mock tool calls before action, uses GatePass proof vocabulary and GatePass claims vocabulary as supporting material only, and adds no production middleware claim, production readiness claim, security certification claim, live framework execution, real tool execution, network calls, payment authorisation, settlement authorisation, or action execution.

## P3-M139 - One-Command Reviewer Demo Kit
P3-M139 adds a local deterministic one-command reviewer demo kit for the GatePass lifecycle, adversarial scorecard, developer wrapper, local integration summary, safety boundary, and JSON report output. It uses GatePass proof vocabulary and GatePass claims vocabulary as supporting material only, and adds no production middleware claim, production benchmark claim, security certification claim, production readiness claim, live tool execution, network calls, payment authorisation, settlement authorisation, or action execution.

## P3-M140A - Public README / Reviewer Positioning Polish

P3-M140A sharpens the public README and reviewer-facing positioning so the recommended first run is `npm run demo:reviewer-kit`, GatePass remains the headline proof primitive, and Agent Trust Language remains supporting material only. It uses GatePass proof vocabulary and GatePass claims vocabulary as supporting material and adds no feature layer, external integration, production middleware claim, production benchmark claim, security certification claim, legal/compliance/security assurance, real tool execution, network calls, payment authorisation, settlement authorisation, or action execution.

## P3-M140 - ATG Strategic Foresight Layer
P3-M140 adds a local-only strategic foresight advisory layer for manually supplied market, protocol, agent, AGI/agent-risk, quantum/post-quantum, standards, and reviewer/developer feedback signals. It follows Watch -> Analyse -> Compare -> Recommend -> Gareth approves -> Dave creates build mission -> Codex implements locally. It recommends only and adds no live monitoring, scraping, autonomous learning, autonomous outreach, autonomous product changes, autonomous roadmap changes, autonomous code changes, prediction guarantee, network calls, payment authorisation, settlement authorisation, real tool execution, or action execution.
