# Agent Trust Gate integration examples

These examples show how another local agent, script, CI step, or business
workflow can ask Agent Trust Gate for a trust decision before an AI action runs.

They do not execute actions. They only call the local CLI, parse the decision,
and stop when the Trust Gate blocks the action.

## Node.js preflight example

```sh
node examples/integrations/node-preflight.mjs
```

The Node example calls Agent Trust Gate in JSON mode with `--fail-on-block`,
parses the result, and prints one of:

- `allowed`
- `blocked`
- `error`

## PowerShell preflight example

```powershell
powershell -ExecutionPolicy Bypass -File examples/integrations/powershell-preflight.ps1
```

The PowerShell example runs:

```powershell
npm run verify -- examples/integrations/sample-public-post.json --json --fail-on-block
```

It exits with code `2` if the local trust decision blocks the action.

## Sample action descriptors

- `sample-public-post.json`
- `sample-customer-facing.json`
- `sample-money-movement.json`

All samples use the `atg.v1` action contract. They contain synthetic demo data
only and have no real-world effect.

Agent Trust Gate returns a trust decision only. Blocked actions must not proceed.
Humans remain responsible for final approval where required.
