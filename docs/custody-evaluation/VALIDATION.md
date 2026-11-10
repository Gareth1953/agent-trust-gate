# Validation — 10 November 2026

**Production NO-GO. Independent review NOT PERFORMED.**

| Check | Observed result |
| --- | --- |
| Final `npm test`, Node 24.22.1 | 1,692 passed: 675 main + 1,017 posttest; 0 failed, cancelled or skipped |
| New custody tests included above | 25 passed, including expected reproductions of TWO successful security attacks |
| TypeScript typecheck | Passed |
| `npm run test:plugin` | 42 unit checks passed; installed SDK/CLI/MCP, five state-binding cases, seven packaged worker cases passed |
| Actual LangGraph 1.2.20 | Six deterministic synthetic cases passed; no model-provider requests or live external effects |
| OS isolation capability probe | BLOCKED: NETLINK_ROUTE socket not permitted; no fallback; effective role isolation not demonstrated |
| Common-owner direct SQL | SECURITY FAIL: unauthorized business-state edit succeeds |
| Common-owner coherent witness clone | SECURITY FAIL: the same authority executes once in each copy |
| Published artifacts | All seven existing plugin archives and SHA256SUMS unchanged against main baseline |

The 1,692 total counts test assertions, not independently defeated attacks.
The initial full run passed 1,691 tests. Final review then found that a grant
could expire while acquiring the database lock. The writer now revalidates
under the lock. A new clock-advancement regression refuses the write and leaves
both destination and consumption unchanged. The final complete suite includes
that fix and passed 1,692. Earlier runs and attack evidence were retained locally.

A fresh signing key was generated per disposable fixture. The verification path
uses its pinned public key and rejects the repository fixture signer. Every role
still shares the host user: this is neither hardware key custody nor proof of
anti-rollback against the host owner. Private keys/databases are excluded from
publication. Evidence JSON contains only synthetic public result identifiers.

The framework walkthrough uses genuine LangGraph interrupt/resume/checkpoint
APIs, but approvals and time are fixtures and the record is local synthetic data.
It does not validate real human identity, autonomous LLM reasoning, native-control
superiority, buyer requirements, payment rails, network partitions or global
one-use. See DEPLOYMENT-GATES.md before further claims or deployment.

No paid provider, HSM, cloud account, real transaction, assessor engagement,
customer communication, website deployment, main merge or plugin release was
performed. The original PR #28 stays a separate unmerged draft.
