# Agent Trust Gate™ Local Developer Demo Pack

## A. What Agent Trust Gate™ Does

Agent Trust Gate™ is a local pre-action and pre-settlement trust enforcement layer for agent-led actions and payments. It checks whether an action has a valid mandate, current evidence, verified intent, acceptable limits, and any required approval before producing a local proof artifact.

## B. The Core Rule

**No mandate. No evidence. No verified intent. No signed gate pass. No settlement.**

## C. The Local Demo Flow

```text
local JSON request
→ mandate check
→ evidence check
→ verified intent check
→ limits / approval check
→ risk-tier decision
→ signed gate pass / review receipt / refusal receipt
```

Every outcome is inspectable. The demo records what passed, what failed, and why. It never executes the requested action.

## D. How To Run The CLI

```text
# Low-risk allow
npm run demo:gate -- --input examples/local-demo-low-risk-allow.json

# Human review required
npm run demo:gate -- --input examples/local-demo-money-review.json

# No mandate refusal
npm run demo:gate -- --input examples/local-demo-no-mandate-refuse.json

# Stale evidence refusal
npm run demo:gate -- --input examples/local-demo-stale-evidence-refuse.json

# Over-limit refusal
npm run demo:gate -- --input examples/local-demo-over-limit-refuse.json
```

Add `--full` to print the complete receipt or `--save <local-path>` to save it locally.

## E. How To Read The Output

- `verdict`: the local decision, such as `allow_signed_gate_pass`, `review_required`, or a refusal.
- `receipt_type`: `signed_gate_pass`, `review_receipt`, or `refusal_receipt`.
- `settlement_allowed`: whether the local artifact reached an allow verdict.
- `failed_checks`: checks that did not pass.
- `reason_codes`: stable reasons supporting the verdict.
- `signature_metadata`: a clearly labelled `local_demo_placeholder`; no cryptographic signature is created.
- `risk_tier` and `applied_policy`: the local policy classification and rule that explain the verdict.
- `fast_path_allowed` and `human_review_required`: whether the safe low-risk path passed or review is required.

Low risk is fast only when every check passes. Medium risk is gated when uncertain. High-risk money, legal, contractual, or customer-impacting actions require explicit approval. Unsafe or prohibited actions are refused. Speed never overrides trust.

## F. What `settlement_allowed` Means

`settlement_allowed` is a local trust artifact field. It does not move money, settle transactions, call APIs, contact agents, or execute actions. The receipt separately records `settlement_executed: false`.

## G. What This Demo Does Not Do

- No live payments or settlement.
- No live APIs or network calls.
- No x402 or AP2 activation.
- No external agents or action execution.
- No legal, compliance, audit, or safety guarantee.
- No real cryptographic signing; that requires a separate future mission.

## H. Future Bridge Possibilities

These are inactive future possibilities only:

- Agent Update Consortium™ may later provide update-proof signals.
- Fast Reaction Trust Gate may later add safe latency tiers without overriding trust.
- Future global agent outreach may use an agent-readable capability statement after separate approval.
- Post-quantum readiness remains a future placeholder; this demo is classical-first and does not claim quantum security.

No bridge, outreach, post-quantum integration, or live infrastructure is active today.
