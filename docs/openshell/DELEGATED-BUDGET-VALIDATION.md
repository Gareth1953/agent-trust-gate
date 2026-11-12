# Combined delegation, passkey and allowance validation — 12 November 2026

**PASS_SCOPED: synthetic destination inside real OpenShell 0.1.8. Production NO-GO.**

- Source head: `0fa27493ae89127cbfd8e22c982a38bbd3cb9aea`, [PR #40](https://github.com/Gareth1953/agent-trust-gate/pull/40).
- CI merge checkout: `8c92fed55a2519558d90eee57f7f825454789bd0`.
- [Actual OpenShell workflow 43223297604](https://github.com/Gareth1953/agent-trust-gate/actions/runs/43223297604), job `131200012993`.
- Combined execution: **2026-11-12 13:02:24.026–13:02:30.312 UTC**.
- [Sanitized combined receipt](evidence/combined-delegated-budget-2026-11-12.json): all 13 recorded source SHA-256 values matched the merged source before this documentation update.

## Actual observations

| Workload / destination check | Observed result |
|---|---|
| Missing/forged passkey proof, changed effect fields, forged/expired authority | Refused |
| Wrong pinned client identity / wrong endpoint pin | No effect |
| Two concurrent copies of one authority | One EXECUTED, one REJECTED |
| Replay and explicit historical lookup | Replay refused; lookup found original effect |
| Another enrolled TLS leaf acting for the wrong sub-agent | REJECTED |
| Agent B: GBP3,000 under one signed mandate | EXECUTED |
| Agent A: GBP2,500 under a distinct signed mandate | Shared root budget exceeded; REJECTED |
| Agent A: GBP2,000 remaining allowance | EXECUTED |
| Further spending by agent B | Shared root budget exceeded; REJECTED |
| Separate observer-key fixture testimony checked against exact action/record | Accepted in protected controller, not agent API |
| Live reachable decoy outside network policy | No workload request reached it |
| Broker stopped | UNKNOWN, no retry or fallback |

Authoritative account spending was exactly **500,000 GBP minor units**, with two
delegated-action records (agent B 300,000; agent A 200,000), destination version
**3**, and two approval audit entries (software counters 1 and 3). The declined
overspend did not consume its approval or advance the destination. The workload
matrix has 21 checks; network-denial and outage checks are separate observations.
The same job also revalidated the legacy and passkey-only real-runtime modes.

## Other actual checks

- [Regression/custody CI 43223297404](https://github.com/Gareth1953/agent-trust-gate/actions/runs/43223297404): all jobs passed. Actual Node 20 compatibility runtime, Node 24 regression/plugin checks, standalone delegation suite, combined suite/demo and distinct-UID custody checks were run.
- Final local full regression: **675 + 1,080 = 1,755 tests**, zero failures/skips.
- Combined local suite: **13 tests**, including real pinned mTLS, rollback of budget/approval/effect, wrong identity, altered exact body, historical delegation relabelling, revoked mandate, clock rollback, signed outcome mismatch and a retained successful coherent-clone attack.
- Installed plugin validation: 42 unit checks plus clean-project SDK/CLI/MCP/state-binding/recovery walkthrough passed; published archives were not replaced.

The initial local full regression failed because actual Node 20 was absent. Its
log remains `atg-combined-regression.log` in the execution workspace. Official
Node 20.20.2 was then fetched and checked against the official SHASUMS256 manifest
(archive SHA-256 `df770b2a6f130ed8627c9782c988fda9669fa23898329a61a871e32f965e007d`), and the full suite was rerun successfully. An additional historical-lookup adversarial check initially hit a protocol rejection; the lookup wire shape was corrected without allowing unapproved execution, then focused and full checks passed. Initial logs were retained, not overwritten.

## What remains unproven

The two client identities occupy one workload, not independently isolated agent
hosts. Root, approver and observer identities/keys are controlled test setup;
the passkey is a software authenticator, with `liveHumanCeremony: false`.
Separately signed testimony is not an independently administered observation.
The one retained destination database is authoritative only while its trusted
administrator does not replace it. Coherent full-store cloning still succeeds
and is deliberately tested as a security failure boundary.

No real person/device registration, production organisation identity, external
anti-rollback custody, live ERP/payment adapter, cross-host global allowance,
independent security assessment, buyer acceptance or production clearance is
established. [Issue #37](https://github.com/Gareth1953/agent-trust-gate/issues/37)
remains open. Existing stores and local.7 downloads do not acquire these controls.
