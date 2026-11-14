# Validation record — 13 November 2026

This records the first schema/adapter stage. Subsequent actual upstream-client
and AP2 SDK integration results are in [STAGE2-VALIDATION.md](STAGE2-VALIDATION.md).

ATG base: `29dda2b3790b16047b7aff5a7797a59cb8bc5172`.
Upstream ACS: `834f3f0d51e7bbbd9a68ff682bec89f97ddd72d8`, release v0.1.4.
Local runtime: Node 24.22.1; compatibility subprocess: actual Node 20.20.2.
Schema validator: Python jsonschema 4.26.0, offline registry and format checks.

| Check actually run | Result |
|---|---|
| `npm run build --silent` | Passed |
| `npm run typecheck` | Passed |
| Final `ATG_NODE20_PATH=<actual Node 20 path> npm test` | 675 + 1,084 = 1,759 passed; zero failures/skips |
| Adapter tests alone | 25 passed; zero failures/skips |
| Adapter plus existing custody witness suite | 50 passed; zero failures/skips; overlaps the adapter run |
| Retained walkthrough against upstream request/hook/response schemas | Seven schema checks passed |
| Vendored-file comparison and SHA-256 manifest | All 46 vendored files matched pinned upstream bytes |
| JavaScript syntax and `git diff --check` | Passed |

The first full regression attempt had 675 passing tests in its first suite and
1,083 passing / one failing in the second suite. The failure explicitly required
an actual Node 20 executable, absent in this fresh session. Node 20.20.2 was
provisioned as a temporary test dependency and the complete regression rerun
passed as recorded above. This was a compatibility-test setup failure, not a
security protection result. The failed run was not counted as a pass.

The 50 focused checks include retained successful common-owner SQL and coherent
whole-store-clone attacks: passing those assertions does not mean those attacks
were prevented. The adapter restart case actually resets the preflight nonce
store, obtains another preflight admission, then observes the retained synthetic
destination refuse another execution. This documents why durable destination
enforcement remains necessary.

No third-party host/runtime integration test, ACS-Core conformance harness,
external reviewer result, live cloud test, genuine device/organisation ceremony,
production assurance, new buyer or commercial advantage is established here.
Existing GitHub workflows have been extended to rerun the experiment; this
local record does not assert a future CI outcome.
