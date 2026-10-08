# Standalone plugin verification — 8 October 2026

Package: `@agent-trust-gate/plugin`, version `0.1.0-local.2`.

Observed on Linux with Node.js 24.19.0:

- `npm test`: 675 tests in the primary run and 855 in posttest, **1530 passed, zero failed**. This includes seven standalone-plugin tests and ten purchase-order connector tests.
- Installed-archive smoke check: archive installed offline into a fresh Node.js project outside the repository. SDK import, exact-request substitution refusal, synthetic execution and reuse denial passed. The installed CLI purchase-order demonstration passed all four scenarios (normal, changed bank, lost acknowledgement and timeout before commit). CLI demonstration and MCP initialization, tool listing and shadow evaluation passed.
- `validate:public-claims` and `validate:discovery-site`: passed.
- `git diff --check`: passed.

The new plugin tests cover privately held approval snapshots, mutated returned receipts, substituted requests, shadow/referral/rejection denial, expired execution, malformed requests/options, unknown handles, consumed authority, restart, corrupt state, forgotten handles and concurrent session-capacity limits.

The full suite exposed two existing Windows-specific path assumptions: a log-path test expected a backslash, and the prototype's static-asset containment check used a backslash prefix. Both now use portable Node.js path operations. The public README URL test was extended only for the specific static plugin overview, checksum and archive URLs.

The downloadable archive is 118296 bytes. SHA-256:

```text
3303ae690b2b00de22e9b0ed6c52078d06fd1571d77984ea10d0f8484c02ee2a
```

These results establish local synthetic behaviour in the tested environment. Windows and Node.js 20 were not separately exercised. There is no customer validation, live execution, production key custody, distributed state guarantee, adaptive learning or implemented Salmon integration. The package's fixture clock and signing material must not be used as production trust infrastructure.

The purchase-order tests cover changed order/bank state, destination evidence substitution, caller tampering/injection, unavailable lookup, timeout before commit, lost acknowledgement, restart reconciliation, exclusive directory locking and concurrent execution/state-update denial. All effects are limited to a local synthetic destination. State snapshots and combined evidence digests are supplementary host-held records, not independent attestation or an extension of the signed GatePass schema.
