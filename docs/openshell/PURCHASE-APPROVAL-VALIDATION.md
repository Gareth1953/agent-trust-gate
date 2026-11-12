# Purchase approval validation — 12 November 2026

**PASS_SCOPED: implementation and synthetic integration. Live human ceremony outstanding.**

Candidate branch head: `cf6e8a185b7f60954eae2a30ecce8ffbf12bf40d`.
Actual PR merge checkout: `7195d1a7f7a2fd2f42fd6d6f99cee85ba0abcc8a`.

## Actual OpenShell evidence

[Run 43190646163](https://github.com/Gareth1953/agent-trust-gate/actions/runs/43190646163),
job `131088779288`, passed both modes with exact official OpenShell **0.1.8**:

| Mode | UTC execution | Evidence | Result |
|---|---|---|---|
| Original broker | 09:21:06.000–09:21:16.523 | [Baseline receipt](evidence/purchase-baseline-2026-11-12.json) | PASS_SCOPED |
| Passkey-required broker | 09:21:16.626–09:21:21.816 | [Approval-required receipt](evidence/purchase-passkey-required-2026-11-12.json) | PASS_SCOPED |

The approval-required workload refused missing and forged passkey assertions,
seven changed transaction fields, forged/expired issuer authority and an
administrator route. Two concurrent requests carrying the same exact authority
and assertion produced one EXECUTED and one REJECTED. Replay was refused and
lookup found the recorded effect. A listening decoy reachable from the host
received no workload request; broker outage returned UNKNOWN without retry.
These comprise 17 matrix checks plus the two network/outage checks.

The authoritative resource advanced to version **2** once. There was exactly
**one approval audit row**, bound to the synthetic principal and counter **1**.
Nine source-file SHA-256 hashes, image digest, accepted OpenShell policy and
authenticated gateway details are retained in each receipt.

Both modes used pinned end-to-end mTLS and a distinct-UID writer with protected
code/configuration. Gateway credentials and the software authenticator signing
key were not given to the agent. No external model or payment was used.

## Protocol, atomicity and regression

The **27 new focused approval tests** passed. They include origin/RP/principal/
credential substitution, wrong ceremony type, missing UP/UV, duplicate/escaped
JSON names, invalid signatures, caller-provided key rejection, unsupported
credential profiles, expired or self-chosen challenges and reused authority.
An injected SQLite effect failure rolled back approval consumption, counter,
audit and execution together; the result was UNKNOWN. Restart preserved the
counter and one-use decision. Two different valid GatePasses could not reuse a
stale credential counter. Changing pinned enrollment trust could not reopen the
same authoritative store.

The local full regression passed **1,740 tests** (675 + 1,065), including those
27 tests, and installed plugin checks passed. This local full run preceded the
final public-key/counter input guard; the final focused 27 tests passed again.
The exact final source is also checked by the mandatory GitHub regression run
below, rather than treating that earlier local full run as final-source evidence.

[Regression run 43190646057](https://github.com/Gareth1953/agent-trust-gate/actions/runs/43190646057)
checks type safety, both full regression runners, the 42 plugin unit tests and
installed SDK/CLI/MCP/state-binding checks, plus the existing **28 distinct-UID
custody checks**. Both jobs completed successfully: custody job `131088777744`
and full regression/plugin job `131088778126`. The full final-source counts were
675 + 1,065 tests, with zero failures or skips, and all 42 plugin unit tests
passed. These counts are not independent-assessment or production clearance.
Passing legacy tests still includes expected reproduction of successful
common-owner attacks; those attacks have not been relabelled as fixed.

The seven-step `npm run demo:purchase-approval` walkthrough also passed, using
software fixtures and the local broker protocol. It is not itself an OpenShell
or live-person run. Earlier OpenShell setup failures from PR #33 remain intact.

## What this evidence does not establish

**`liveHumanCeremony` is false in every automated receipt.** No genuine device,
human review, identity enrollment, authenticator attestation, independent review
or owner approval has occurred. The browser helper has not been demonstrated
with a real enrolled person. No real payment or customer delivery is enabled.

This is an optional, restricted ES256/UP+UV/non-backup/advancing-counter profile;
synced or zero-counter credentials are refused. Registration, trusted UI/session,
identity proofing, device suitability and credential recovery/revocation remain
host-application/deployment work. Root/writer/Docker administration and
whole-host/writer rollback remain outside the protection. Existing stores and
downloaded legacy plugins are not silently upgraded. Production remains NO-GO.

See [implementation, buyer walkthrough and live-human gate](PURCHASE-APPROVAL.md).
