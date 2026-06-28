# Local Quickstart

Requires Node.js 20 or later.

```sh
npm install
npm test
npm run build
npm run typecheck
npm run verify -- --serve --port 8787
```

In another terminal:

```sh
curl http://127.0.0.1:8787/v1/health
curl -X POST http://127.0.0.1:8787/v1/decision -H "Content-Type: application/json" -d "@examples/gateway-quickstart/public-post-action.json"
node examples/gateway-sdk/node-sdk-demo.mjs
npm run verify -- --entitlement --json
npm run verify -- --rate-limit-status --json
```

The examples request local trust decisions only. No action, payment, billing, or
automatic purchase is executed.
