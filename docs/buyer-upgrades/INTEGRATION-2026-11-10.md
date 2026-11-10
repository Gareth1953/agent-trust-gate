# Integration record — 10 November 2026

Gareth explicitly authorised source integration and buyer-relevant improvements.
PR #28 merged at `5650e65bccec55846ac7fe166643e59d2d5bfa95`; PR #29 was
retargeted to main and merged at `8ea7b5fc0fbb95b12ea6a175d2dbbe135b77c6b7`.
The resulting runtime source matches the previously tested custody candidate.
Earlier dated validation reports remain historical records; statements that the
PRs were unmerged describe their status at the time those reports were written.

Fresh validation on the published #29 source: 30 focused custody/transport tests
passed, zero failures/skips/cancellations; TypeScript typecheck passed. The 25
custody cases include TWO reproduced successful common-owner attacks. Prior
complete validation for that identical source tree was 1,692 passing tests;
it was not repeated merely for documentation changes. Hosted CI subsequently
exposed a separate test portability defect, recorded below. See the custody
VALIDATION.md for the separate installed-plugin and LangGraph observations.

This follow-up adds a least-privilege GitHub regression workflow and the
PAYMENT-EVALUATION.md buyer acceptance matrix. CI executes typechecking, the
complete suite and installed-plugin checks using Node 24 and a retained actual
Node 20 compatibility runtime. Job success is not independent assurance or
production clearance. Consult the actual Actions run for hosted CI outcomes;
local workflow-structure validation alone does not establish a hosted run.

All seven public plugin archives and SHA256SUMS were compared byte-for-byte
against baseline main `91a1980` and remain unchanged. No discovery-site asset,
public fixture key, website deployment or plugin release was changed by this
integration. No paid AI, HSM, cloud service, assessor or payment call was used.

Production remains NO-GO: SQL editing and coherent witness cloning remain
successful common-owner attacks; effective OS custody isolation remains BLOCKED.
Principal/delegation services, shared root budgets, a non-bypassable real payment
route and external reconciliation are acceptance requirements, not newly
implemented features. A named buyer/partner must supply the agreed deployment,
sandbox ownership and scope before these properties can be tested honestly.

## Retained first hosted CI failure and portability repair

The first job in https://github.com/Gareth1953/agent-trust-gate/actions/runs/42794413522
failed: main suite 675 tests, 559 passed / 116 failed / 0 skipped. Reported
errors were EACCES during temporary-directory creation. Legacy tests concatenated
Windows separators to the OS temporary directory, producing sibling paths at the
Linux filesystem root instead of directories inside /tmp.

Repair: 90 temporary-directory prefixes in 31 test files now use node:path join.
The complete diff was mechanically checked: only those prefixes and required
join imports changed; no assertion, permission, skip or runtime code changed.
Do not elevate the runner or make the root filesystem writable to hide this bug.
The failed job remains retained. Full local and hosted regression must run again
on the repaired commit; consult its check run before treating CI as passed.
