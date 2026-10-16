# Mission 05 Windows review

Reviewed locally on 16 October 2026 for Gareth and Dave. The supplied bundle verified as complete history and advertised exactly `0d8b4c2ae8fd57a661f274bf7d235334f19837de` on `mission-05-payeeshield-demo`. Bundle SHA-256: `1ba5839d8c19630b386d0ed6921e089e9aedb1c241f65db62ca95cb6a8cccac2`.

The original checkout was clean, and neither the requested branch nor worktree path existed. Imported into `.worktrees/mission-05-payeeshield-demo` without changing main or existing worktrees. The implementation diff against `bcfb390914d520b75f90270444779fc6cf846e25` was reviewed, including the adapter, HTTP boundary, browser code, styles, tests and supporting claims. No core verifier or published package change was needed.

## Finding and repair

After `Commit then lose acknowledgement`, entering an invalid amount and pressing Evaluate disabled Reconcile even though the separate UNKNOWN handle remained in memory. Reproduced in Edge before changing the code. The operation cleanup now restores reconciliation whenever that handle exists. Execution remains disabled. The Windows browser harness includes this regression and checks successful reconciliation without another write.

## Actual results

- Windows Node **24.21.0**: typecheck passed; focused PayeeShield suite **32 passed, 0 failed, 0 skipped**.
- Preserved Windows Node **20.19.0**: typecheck passed; focused suite **32 passed, 0 failed, 0 skipped**. Executable: `C:/Users/Gareth/agent-trust-gate/.atg-evaluation/mission-02-node20/node.exe`; SHA-256 `6e3a39787e667d50487f7335c85636c2823a53e636d73c2c841d45da4e57906c`, matching the retained Mission 02 provenance. Installed Node was not replaced.
- Installed Edge **155.0.4283.45**, headless, disposable profile, local ephemeral-port demo servers: **1440, 390 and 320px passed**. Checked approval and normal one-use execution, all four input invalidations, server-side exact-request refusal, stale destination version, revocation (including server refusal), expiry without a record, replay without another write, UNKNOWN/no retry, and reconciliation after an invalid evaluation. REVIEW and BLOCK returned no approval handle and kept execution disabled. Sixteen registered scenarios were present; all negative scenarios are also exercised by the focused suite.
- No page JavaScript exceptions, external page requests or document/body horizontal overflow were observed. Nine final full-page screenshots are retained. Visually inspected desktop approval, 390px reconciliation and 320px execution captures. The banner, fixture/time/state limitations and same-process evidence disclosure remain visible.
- Published-release validator passed: all **seven** retained archive checksums and **54** compiled runtime files match. local.7 remains `dcf75970db520fdd10afea63aa1a9d20780dc12a053c8e09f49b0f21ed1dddad`. No archive was rebuilt.
- JavaScript syntax checks and Git whitespace checks passed.

The requested npm scripts were invoked on both runtimes; final evidence also uses their direct equivalents: `node node_modules/typescript/bin/tsc -p tsconfig.json --noEmit`, compilation with the same project, and `node --test dist/test/payeeshield-demo.test.js`. Logs and browser results are in [the Windows evidence directory](../reports/mission-05/windows/summary.json). Empty typecheck logs indicate successful checks with no diagnostics.

The initial Node 20 invocation failed before loading TypeScript because the sandbox denied an ancestor-directory `lstat`; it passed outside that restriction. Sandboxed Edge/CDP also timed out; the disposable-profile run outside that restriction reproduced the product defect. One subsequent harness replay check incorrectly reused a handle intentionally discarded by form edits; retaining the original test request corrected that harness error. Initial evidence is retained separately from the passing run.

## Remaining limits

This is an unpublished, synthetic, one-process, volatile demonstration with public fixture keys and fixed time. Reconciliation reads the same process's synthetic record, not independent destination evidence. No live bank/ERP/payment verification or real human authentication was performed. Browser reload/restart recovery, arbitrary transport failure recovery, physical devices and screen readers were not validated. The full repository suite was not rerun on Windows for this scoped review; the imported Linux results remain historical evidence, not a Windows full-suite claim.

No merge, push, publication, authentication change, archive rebuild, existing held-state reset or existing worktree modification was performed. The repair and review evidence are committed locally on the imported branch for review.
