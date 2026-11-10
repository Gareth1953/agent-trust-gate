# Third-party payment authority — buyer evaluation brief

10 November 2026. **Research integration; production NO-GO.** This document
adopts requirements for a future buyer-defined evaluation. It does not implement
an HSM, delegation service, payment adapter, certification or independent audit.

## Current evidence a buyer can reproduce

The custody source candidate verifies exact actions with a freshly pinned public
key and commits one-use consumption and one synthetic destination record in one
SQLite transaction. Tests cover two writer processes, expiry after lock waiting,
replay and kill-after-commit lookup. A real LangGraph walkthrough exercises six
deterministic synthetic cases without a model or payment provider. The public
downloadable plugin archives remain a separately scoped, unchanged release.

Both common-owner attacks still succeed: direct SQL bypass and duplicate
execution across coherent witness clones. The isolation probe was BLOCKED.
Integration into main does not change these findings. An ordinary signature,
another process, an HSM key alone or an unkeyed state checksum cannot establish
the missing whole-system custody boundary.

## Agree one protected operation before building adapters

Buyer: __________ Technical owner: __________ Destination owner: __________

Define the principal, account, tenant, payee, currency, exact maximum debit,
fees/FX treatment, purpose, validity window, destination and API operation.
An upstream AI delegates only authority traceable to an accountable root
principal. A signature establishes key use, not independently authenticated
human intent. Specify who authenticates approval and which actors are trusted.

Agree a deployment boundary, allowed attack actions, sandbox, evidence handling,
cost/time ceiling and acceptance thresholds before the exercise. No provider,
assessor or infrastructure has been purchased or engaged by this brief.

## Acceptance matrix — all rows require deployment-specific evidence

| Requirement | Concrete test / observation needed | Current limit |
| --- | --- | --- |
| Independent custody | From the real agent principal attempt key reads, signing misuse, SQL/replacement, process access, trust-pin changes and backup restore; retain effective denials and every bypass | Not demonstrated; common owner bypasses state |
| Non-bypassable payment route | Remove alternate credentials and direct payment paths; attempt the protected effect without ATG, including queued jobs and recovery tools | Synthetic writer only; no real rail |
| Principal-bound authority | Substitute principal/account/tenant/payee/amount/currency/purpose/time/destination independently; require exact matching approval | Existing fixture approvals are not real human identity |
| Delegation without privilege expansion | Human/organisation → agent → sub-agent; attempt wider scope, deeper delegation, changed payee, longer expiry and cross-tenant use; reject a child exceeding any ancestor | Chained production mandates not implemented |
| Shared cumulative allowance | Race multiple agents and distinct valid GatePasses against one root budget; reserve outstanding obligations atomically; include fees/FX bounds; never reset allowance by issuing another child | New witness has no shared principal budget; legacy synthetic exposure checks do not prove this deployment |
| One use and restore resistance | Replay concurrently, restore everything within the agent's powers and repeat across instances while the independent authority remains retained | Same retained SQLite store tested; whole-witness clone succeeds |
| Revocation ordering | Specify the admission/commit cutoff; race revoke/stop with queued and in-flight requests; record propagation and partition behaviour | Local controller methods only; no worldwide immediacy or settled-payment reversal |
| Unknown outcomes | Drop the response after provider acceptance; reconcile through a bound destination reference before any retry; test expiry/pruning of destination idempotency records | Local synthetic crash recovery tested; no external API reconciliation |
| Trustworthy evidence | Link approval, policy version, action digest, consumption, request and destination outcome; attempt deletion, substitution, rollback and false completion | Local records are inspectable; independent retention/custody not proven |
| Operations and failure policy | Test stale clock/pins, service outage, restart, restore and network partition; deny new effects when fresh authority cannot be established; measure resulting availability | No production HA, SLA or disaster-recovery proof |

For remote payments, local consumption and a payment API call are not one atomic
transaction. Design destination idempotency/fencing and reconciliation together.
Keep unknown outcomes held; do not infer failure from a timeout or success from
an ATG receipt. State idempotency scope, retention and retry windows explicitly.
For example, Stripe documents API v1 key pruning after at least 24 hours; a new
request can result after pruning. Check the exact chosen provider/version.

Revocation cannot promise instantaneous knowledge on disconnected instances.
Define the maximum acceptable stale-authority window and refuse new execution
when freshness cannot be established. Specify how an already admitted payment
is handled; stopping future authority does not reverse a settled payment.

## Demonstrate additional value against the buyer's existing controls

Run the same scenarios with the buyer's native IAM, policy, approval, token and
destination-idempotency controls configured correctly, then with ATG added.
Record prevented unauthorised effects, duplicates, false refusals, reconciliation
effort, latency (including p95/p99), integration time and operating cost. Retain
cases where ATG adds no value or makes the result worse. No improvement is
established by the current synthetic evidence.

Start with one framework plus one provider sandbox chosen by that buyer. The
existing LangGraph demo supplies framework evidence, not a buyer reference or
live payment proof. Visa TAP already specifies identity, operation/domain binding
and replay-related controls; an adapter must show complementary value. These
protocols, payment APIs and identity systems are different components, not
interchangeable rails. Integration is not network certification or endorsement.

## What could be acquired or contracted

Separate public MIT code from any verified owned brand/domain assets, unpublished
work, deployment engineering, integration work and separately agreed support.
MIT recipients retain the licence rights already granted; do not promise
exclusive ownership of public code. Audit contributor/title, third-party assets
and dependencies before agreeing a transaction. No exclusivity, valuation,
liability allocation or support commitment is created by this brief.

A bounded partner-supported evaluation is the next proposal. Do not commit to
several adapters, certification programmes, production operation or independent
assessment before scope, responsible owners and funding are agreed. SOC 2,
ISO 27001 and payment-related requirements need a scoped applicability review;
none is achieved or automatically required merely by this demonstration.

## Claim discipline and handover

Present today: an inspectable synthetic authority-control core, retained attack
reproductions and a framework integration for technical evaluation.

Future acceptance target, **not a current product guarantee**: within the named
deployment, every protected payment submission requires current principal-bound
authority, and retained independent consumption/destination controls prevent
duplicate effects under the agreed adversarial conditions.

Request an external assessor to reproduce the original attacks and the matrix
against the exact deployment and commit. Report PASS, FAIL, BLOCKED and OUT OF
SCOPE separately. A green regression job includes successful attack
reproductions and is not independent security clearance. See EXTERNAL-REVIEW.md
and ../custody-evaluation/DEPLOYMENT-GATES.md.

Primary references (no endorsement; verify at evaluation time):
- https://docs.stripe.com/api/idempotent_requests
- https://www.rfc-editor.org/rfc/rfc7009.html
- https://www.rfc-editor.org/rfc/rfc9700.html
- https://github.com/visa/trusted-agent-protocol
- https://www.pcisecuritystandards.org/standards/pts-hardware-security-module-hsm/
