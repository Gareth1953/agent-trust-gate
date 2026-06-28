# OpenAPI and SDK Wrappers

The tracked contract is `docs/agent-trust-gate.openapi.json`; while the local
gateway runs, use `GET /v1/openapi.json`. Export it with:

```sh
npm run verify -- --openapi --json
```

Inspectable, dependency-free clients are in `examples/gateway-sdk/`:

```sh
node examples/gateway-sdk/node-sdk-demo.mjs
powershell -ExecutionPolicy Bypass -File examples/gateway-sdk/powershell-sdk-demo.ps1
```

These wrappers are examples, not published or supported packages. They do not
execute actions, charge accounts, or enable automatic purchase.
