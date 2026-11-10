# Validation receipt — 10 November 2026

Base: `91a1980e4c6b06dad600d3bbf6884de6b4f54d6b` (published main at checkout).
Candidate branch: `buyer-evaluation-hardening-2026-11-10`.
Linux, Node **24.22.1**; compatibility subprocess **20.19.0**.
No production system, Windows account/ACL, live key, bank/payment API or
customer record was used. No public website, main merge or plugin release is
part of this source candidate. Existing evidence and archives are preserved.

## Observed results

| Check | Actual result |
| --- | --- |
| Final `npm test` with actual `ATG_NODE20_PATH` | **1,667 PASS**, 0 FAIL, 0 SKIP: 675 main + 992 posttest |
| Typecheck | Exit 0 |
| Focused transport checks | 5/5 PASS; included in final posttest total |
| Focused destination/website recheck | 44/44 PASS; not additional independent assurance |
| `npm run test:plugin` | 42/42 unit checks; installed SDK/CLI/MCP, 5 state-binding scenarios and 7 packaged worker scenarios passed |
| Buyer evaluation | 6 expected synthetic controls observed; **2 successful attacks, security FAIL** |
| Null-message pre-fix reproduction | Unchanged checkout child exited 1; null dereference observed |
| Null-message repaired behaviour | Refusal, child remains alive; client session fails closed |
| Preservation | All 7 published versioned `.tgz` archives and SHA256SUMS match the unchanged base |
| Diff whitespace check | Exit 0 |

The installed-package test builds a temporary source candidate using the
existing local.7 metadata. It does not replace or newly publish local.7. The
old downloadable archive remains different from this source candidate.

## Failures and corrections retained

The first attempted baseline overlapped source editing and became invalid as
a clean baseline when the source script referenced a not-yet-built module. Its
failed log is retained, not counted as a product baseline or passing validation.
An unchanged detached worktree was then installed and tested independently:
675 main PASS, 980 posttest PASS, 7 posttest FAIL. Six failures concerned
outdated website/README wording or exact cache-version checks; one required an
actual Node 20 executable unavailable at that initial run.

The exact existing local script/CSS cache suffix and two existing research URLs
were admitted explicitly. Production boundaries, no-third-party-script checks,
secret scanning and other restrictions remain. Current homepage wording is
accepted alongside the older allowed formulation. No live website changed.

The first modified full run passed 675 + 990 tests and failed two: an additional
old stylesheet assertion, and the crash test's formerly ignored `token` field
on a non-submission lookup. The stylesheet assertion now accepts only the exact
approved cache suffix. The crash fixture sends `token` only for `submit`, so its
intended before-commit crash is reached through the stricter command boundary.
The actual crash/rollback/recovery assertions were retained. The 44-case
recheck and final full run passed afterward.

No initial failure or successful bypass was reclassified as a security pass.
Detailed intermediate logs remain in the ignored, private evaluation directory;
only redacted public result summaries are checked into this pack.

## Security failures that remain

`evidence/results.json` records the actual direct-SQL state edit and coherent
all-role clone replay. Both succeed. The evaluator's exit 0 means those
expected observations were reproduced; **production remains NO-GO**. Source
hashes in that receipt identify the four runner/transport source files.

This work repairs protocol validation and reproducibility. It does not provide
independent custody, global one-use enforcement, a partner-run sandbox,
independent security review, certification, buyer acceptance or guaranteed
commercial value. The unpushed Windows PI3 code/evidence was not present in
this checkout and was not validated or replaced.
