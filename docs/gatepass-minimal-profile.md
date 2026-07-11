# GatePass Minimal Profile

P3-M133 defines local profiles for the Minimal GatePass Core. These are not formal standards. They are local profiles used to keep Agent Trust Gate(TM) focused around GatePass.

Core positioning:

Do not trust the agent. Trust the GatePass.
No proof. No permission.
No mandate. No action.
No signed GatePass. No settlement.

Public contact: gpmiddleton71@gmail.com

## Low-Risk Action Profile

Required fields: all minimal GatePass core fields.

Required proof strength:

- mandate present;
- evidence present;
- verified intent present;
- nonce present;
- fresh expiry;
- local signature reference present;
- human approval not required.

Expected local outcome: allow locally only.

Safety limitations: no action execution, no live API, no payment authority, no settlement authority, no production signing.

## Sensitive Tool-Call Profile

Required fields: all minimal GatePass core fields.

Required proof strength:

- bounded mandate;
- evidence bound to the proposed tool call;
- verified intent;
- human approval when policy requires it;
- fresh expiry and nonce;
- local signed proof reference.

Expected local outcome: allow locally only if required proof is present; otherwise block, escalate, require evidence, require human review, or require signed proof.

Safety limitations: the repo does not call the real tool.

## High-Risk Human-Review Profile

Required fields: all minimal GatePass core fields plus an approval state that can show human review.

Required proof strength:

- high-risk mandate and scope;
- supporting evidence;
- verified intent;
- fresh expiry and nonce;
- signed proof reference;
- human approval when required.

Expected local outcome: require human review when approval is missing.

Safety limitations: human-review status in this repo is local demo data only.

## Pre-Settlement Profile

Required fields: all minimal GatePass core fields plus `extensions.preSettlement`.

Required proof strength:

- settlement-sensitive mandate;
- settlement-sensitive scope;
- evidence;
- verified intent;
- fresh expiry;
- nonce;
- human approval where required;
- signed GatePass reference.

Expected local outcome: allow locally only when the signed GatePass is present; require signed proof or block when it is missing or invalid.

Safety limitations: no real settlement is executed and no settlement authority is granted.

## Invalid / Identity-Only Profile

Required fields: claimed identity alone is insufficient.

Required proof strength:

- claimed agent name or subject is not enough;
- mandate, evidence, verified intent, scope, freshness, nonce, and signature status are required.

Expected local outcome: block.

Safety limitations: identity-only claims must not be treated as trust.

