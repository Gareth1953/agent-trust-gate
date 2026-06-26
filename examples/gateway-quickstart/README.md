# Agent Trust Gate Gateway Quickstart

This quickstart shows how a local agent, script, or developer tool can call
Agent Trust Gate through Local Gateway API Mode.

Local Gateway API Mode is a local HTTP API for pre-action trust decisions. It
binds to `127.0.0.1`, accepts structured action descriptors, and returns a
decision object. It does not execute the proposed action.

## 1. Start the local gateway

```sh
npm run verify -- --serve --port 8787
```

The server listens locally at:

```text
http://127.0.0.1:8787
```

Do not expose this local development gateway to the public internet.

## 2. Check health

```sh
curl http://127.0.0.1:8787/v1/health
```

PowerShell:

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8787/v1/health"
```

## 3. Request a trust decision

Windows `cmd.exe` curl example:

```bat
curl -X POST http://127.0.0.1:8787/v1/decision ^
  -H "Content-Type: application/json" ^
  -d "@examples/gateway-quickstart/public-post-action.json"
```

PowerShell:

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri "http://127.0.0.1:8787/v1/decision" `
  -ContentType "application/json" `
  -InFile "examples/gateway-quickstart/public-post-action.json"
```

## 4. Run with optional local API key mode

The demo client config uses fake local values only:

```text
examples/gateway-quickstart/gateway-clients.demo.json
```

Start the gateway with local API key enforcement:

```sh
npm run verify -- --serve --port 8787 --require-api-key --clients-file examples/gateway-quickstart/gateway-clients.demo.json
```

Call the decision endpoint with demo headers:

```bat
curl -X POST http://127.0.0.1:8787/v1/decision ^
  -H "Content-Type: application/json" ^
  -H "X-ATG-Client-ID: quickstart-demo-agent" ^
  -H "X-ATG-API-Key: quickstart-demo-key" ^
  -d "@examples/gateway-quickstart/customer-email-action.json"
```

These are fake demo credentials. Do not reuse them as real secrets.

## 5. Use the sample clients

Node.js:

```sh
node examples/gateway-quickstart/node-gateway-client.mjs
```

PowerShell:

```sh
powershell -ExecutionPolicy Bypass -File examples/gateway-quickstart/powershell-gateway-client.ps1
```

Both examples:

- call `GET /v1/health`
- call `POST /v1/decision`
- include optional demo client headers
- print the request ID, client ID, decision, risk, policy, and remaining usage
- do not execute the proposed action

## 6. Interpret the decision

Use the gateway response as a pre-action control:

- `ALLOW`: `allowed` is `true` and `human_approval_required` is `false`.
- `BLOCK`: `allowed` is `false`.
- `REQUEST HUMAN`: `human_approval_required` is `true`.

If the decision is `BLOCK` or `REQUEST HUMAN`, the calling system should stop
and ask a human to review the action. Agent Trust Gate does not take the action
for you.

## 7. View local usage and admin summaries

```sh
npm run verify -- --gateway-usage
npm run verify -- --gateway-admin
npm run verify -- --gateway-admin --clients-file examples/gateway-quickstart/gateway-clients.demo.json
```

These commands read local usage logs and local demo client configuration only.

## Sample action files

- `public-post-action.json`: a public post requiring human review.
- `customer-email-action.json`: a customer-facing email requiring human review.
- `money-movement-action.json`: a synthetic money movement action requiring
  explicit approval.

The examples contain no private data and do not cause real-world effects.

Gateway quickstart examples are local demos only. They do not execute actions,
bill customers, expose a public service, authenticate real-world identities,
guarantee legality, or prove compliance.

Agent Trust Gate returns local trust decisions only and does not execute actions.
