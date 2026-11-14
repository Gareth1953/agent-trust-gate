# AWS contract and automatic evidence validation

Local source base: `80a4f0fd103e82e23a9f1b28d07067f30a86f6a9`.
Work authorised by Gareth Price on 13 November 2026.

| Check actually run | Result |
|---|---|
| Actual Cedar WASM version | 4.14.0 |
| AWS-contract adapter tests | 20 passed, zero failures/skips |
| Automatic collector run | ACS 37, AWS-contract 20, AP2 26 passed |
| Evidence guard tests | Eight passed |
| Actual collector without AP2 runtime | AP2 BLOCKED / zero tests, process exited 1 |
| Full existing regression with actual Node 20 compatibility subprocess | 675 + 1,084 = 1,759 passed, zero failures/skips |
| Build through regression and separate typecheck | Passed |
| Whitespace / relative documentation links / npm lock installation | Passed |

The initial AWS-contract test run had one failing permitted-case assertion;
19 checks passed. The failure arose because a canonical snapshot reordered
body keys before comparing raw compact JSON. The snapshot now preserves parsed
key order after safety validation. The complete focused suite passed after
that correction; the initial failure is not counted as a pass.

The actual collector reports include UUID run identities, source hashes and
dirty-tree flags. Local development reports correctly identified an uncommitted
tree; their Git base is not misrepresented as the exact source tested. Source
stability checks passed. Reports/diagnostic logs used for this local validation
are in the task's temporary output directories; CI will generate its own reports
for the pushed source and retain sanitised JSON artifacts.

No production cloud resources, paid services, accounts, keys or membership
were created. No external messages were sent. No production permission was
expanded and no autonomous policy learning was enabled. The collector's outputs
are review evidence only. Existing successful common-owner attacks remain.

The prior ACS/AP2 commit's GitHub regression run 43529695926 passed. That result
does not validate these additional changes. New CI must run on the new head.
