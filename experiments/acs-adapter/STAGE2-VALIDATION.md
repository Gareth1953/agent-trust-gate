# Upstream client and AP2 bridge validation

Continuation of the authorised global-interoperability work, 13 November 2026.
ATG base: `4328b2807da9869aacfd0f0ddf71a8fc71b54d9d`.

## Results actually observed locally

| Check | Result |
|---|---|
| Unmodified OWASP client over real loopback HTTP | 12 passed, zero failures/skips |
| ACS adapter + HTTP client + existing custody witness tests | 62 passed, zero failures/skips; includes the 12 above |
| Actual AP2 SDK / checkout / synthetic Node destination tests | 26 passed |
| Full existing `npm test` with actual Node 20.20.2 subprocess | 675 + 1,084 = 1,759 passed, zero failures/skips |
| Build (through npm test) and typecheck | Passed |
| Existing ACS walkthrough upstream-schema validation | Seven checks passed |
| Installed AP2 SDK identity | All 44 retained non-test Python source hashes matched the pinned upstream commit |
| Vendored OWASP reference client | Bytes matched pinned upstream file and retained checksum |
| Relative document links and whitespace checks | Passed |

Local runtime: Node 24.22.1. AP2 SDK source:
`e1ea56db72a6385bce3e5c1112b3a56ce60acb43`, installed with its declared
dependencies in an isolated Python environment. OWASP client source:
`834f3f0d51e7bbbd9a68ff682bec89f97ddd72d8`, unchanged, Apache-2.0.

The AP2 walkthrough recorded invalid-token rejection with zero destination
calls, one verified fictional £4,000 record update, and replay refusal at the
ATG writer. Fresh keys/tokens are ephemeral; the saved transcript has no
private keys or tokens. The synthetic destination is not a live merchant.

The HTTP tests covered permitted work, changed arguments, transport/ACS
correlation failures, missing correlation, unknown version, wrong action
digest, conflicting error/result, malformed response, timeout and outage.
The ATG host adds strict checks around the reference client's `post` method.

Passing existing custody assertions still includes successful common-owner
direct SQL and whole-store-clone attacks. These are retained limitations,
not attacks defeated by these adapters. The AP2 private pipe is a trusted
host seam, not an agent-accessible verification API. Its disposable store
does not establish cross-restart merchant idempotency.

No ACS-Core conformance, coding-agent host, external Guardian deployment,
live payment, actual organisational identity/custody, vendor endorsement,
independent assessment, buyer adoption or production readiness is claimed.

GitHub CI is extended to rerun both experiments; this local record does not
assert the outcome of a future workflow run.
