# Mission 05 review report

**Windows follow-up, 16 October 2026:** [Windows review and local reconciliation UI repair](mission-05-windows-review.md) records passing actual Node 20/24 checks and desktop/390px/320px Edge verification. The results below describe the original Linux implementation review.

Implemented PayeeShield as an optional ATG source demonstration on `mission-05-payeeshield-demo`, based on published local.7 commit `bcfb390914d520b75f90270444779fc6cf846e25`.

The revised user HTML now drives the existing ATG supplier-change evaluator and exact-action signer/verifier rather than browser-only approval strings. The server restricts requests to registered fictional data. Executable decisions sign the exact request and current synthetic business version. One-use intent and nonce consumption precede the synchronous destination recheck and simulated commit. Revoked, expired, replayed, changed-request and stale-state attempts cannot write. Lost acknowledgement produces UNKNOWN with no retry; explicit reconciliation reads the same process's synthetic record without claiming independent evidence.

The original supplier model, exact-action core, signing-security code, shared-worker protocol, durable stores and published SDK/CLI/MCP were not modified. The related amount is invoice context; it does not authorise payment or implement shared exposure accounting. The UI's APPROVE/REVIEW mismatch and unreachable high threshold were removed. No unsupported CoP, sanctions, account ownership, certification, PayPal checkout or operational protection claim was retained.

## Actual verification

- Linux Node 24.19.0 full repository run: **1,662 passed, zero failed, zero skipped** (675 main + 987 posttest), including all 32 new focused cases. Existing cross-runtime evidence test used actual Node 20.19.0 obtained from the official distribution and checksum verified.
- Focused adapter/HTTP cases on actual Node 20.19.0: **32 passed**. The full suite was not run under Node 20.
- Typecheck, reviewer, all three Challenge cases, public-claims validator, discovery-site validator and whitespace checks passed.
- Published-release validator passed: seven archive checksums and all 54 existing local.7 compiled package files match. No archive was regenerated.
- Temporary headless Chromium/Playwright checks passed at 1440, 390 and 320 pixels: 16 scenario options, BLOCK/REVIEW cannot execute, input edits disable execution, negative verification refuses, normal fixture approval works, lost acknowledgement retains UNKNOWN, form edits preserve reconciliation, final state updates to 7319/version 2, no external requests or JavaScript errors, no document/body horizontal overflow. Six full-page captures are retained. Desktop and 320px captures were visually inspected; automated layout/interaction checks cover all three widths.

An initial full run lacked `ATG_NODE20_PATH` and failed the existing Node 20 public-verification subprocess test. After supplying the checksum-verified runtime, the full run passed. Initial browser tests found 390px overflow from long identifiers; wrapping/grid fixes passed the repeated checks. Those initial logs are preserved alongside final results. No product test failure remains in the checks performed.

## Remaining review boundaries

Windows runtime verification for this integration, physical-device and screen-reader checks remain unperformed. This demo is loopback-only, uses public fixture keys and a fixed clock, and has volatile state. It authenticates no real human, bank or external destination, does not encrypt records and is not production ready. Same-user processes can access the loopback service. Restart is not recovery. Existing advanced ATG controls are not automatically applied to this new adapter.

See [the technical and reproduction guide](mission-05-payeeshield.md), [machine-readable evidence](../reports/mission-05/summary.json) and [Windows import instructions](mission-05-windows-handoff.md). The branch is ready for review, not release. No push, merge, deployment, authentication change or publication was performed.
