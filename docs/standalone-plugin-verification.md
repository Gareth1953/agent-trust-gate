# Standalone plugin verification — 8 October 2026

Package: `@agent-trust-gate/plugin`, version `0.1.0-local.1`.

Observed on Linux with Node.js 24.19.0:

- `npm test`: 675 tests in the primary run and 845 in posttest, **1520 passed, zero failed**. This includes seven new plugin tests.
- Installed-archive smoke check: archive installed offline into a fresh Node.js project outside the repository. SDK import, exact-request substitution refusal, synthetic execution and reuse denial passed. CLI demonstration and MCP initialization, tool listing and shadow evaluation passed.
- `validate:public-claims` and `validate:discovery-site`: passed.
- `git diff --check`: passed.

The new plugin tests cover privately held approval snapshots, mutated returned receipts, substituted requests, shadow/referral/rejection denial, expired execution, malformed requests/options, unknown handles, consumed authority, restart, corrupt state, forgotten handles and concurrent session-capacity limits.

The full suite exposed two existing Windows-specific path assumptions: a log-path test expected a backslash, and the prototype's static-asset containment check used a backslash prefix. Both now use portable Node.js path operations. The public README URL test was extended only for the specific static plugin overview, checksum and archive URLs.

The downloadable archive is 112582 bytes. SHA-256:

```text
636b4e50e78af5560588663ac761700a637c1643974b31b3c4cbacf22bd64590
```

These results establish local synthetic behaviour in the tested environment. Windows and Node.js 20 were not separately exercised. There is no customer validation, live execution, production key custody, distributed state guarantee, adaptive learning or implemented Salmon integration. The package's fixture clock and signing material must not be used as production trust infrastructure.
