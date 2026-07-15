# Independent Reviewer Runbook

This runbook is for a fresh, local review of Agent Trust Gate(TM). It uses the
existing public repository and the verified end-to-end GatePass pilot.

## Environment Prerequisites

- Git.
- Node.js 20 or newer.
- npm compatible with `package-lock.json`.
- A terminal capable of running npm commands.

No credentials, private keys, payment accounts, checkout accounts, API tokens,
customer data, live services or production configuration are required.

## Fresh Clone

```powershell
git clone https://github.com/Gareth1953/agent-trust-gate.git
cd agent-trust-gate
```

Confirm the commit you reviewed:

```powershell
git rev-parse HEAD
```

## Install

```powershell
npm ci
```

## Build And Typecheck

```powershell
npm run build
npm run typecheck
```

## Permitted Scenario

```powershell
npm run demo:gatepass-pilot -- --scenario permitted --summary-only
```

Expected result:

- requested amount: `480 GBP`;
- mandate, scope, spend, evidence and approval checks pass;
- a local-demo GatePass is issued;
- simulated settlement result: `permitted_to_proceed`.

## Refused Scenario

```powershell
npm run demo:gatepass-pilot -- --scenario refused --summary-only
```

Expected result:

- requested amount: `875 GBP`;
- authorised cap: `500 GBP`;
- GatePass is not issued;
- refusal evidence is produced;
- simulated settlement is blocked.

## Optional Full Test Run

```powershell
npm test
```

The full suite is useful for checking broader repository consistency. It is not
required to understand the two pilot paths, but it helps identify clone,
line-ending or platform differences.

## Report Files

The GatePass pilot writes local runtime reports under:

```text
reports/gatepass-pilot/
```

The directory is ignored by Git. These files are local reviewer artefacts and
should not be treated as production audit records.

## Troubleshooting

Windows PowerShell, macOS shells and Linux shells may differ in quoting and line
ending display. The documented commands avoid shell-specific features where
possible. If a command fails, record:

- operating system;
- shell;
- Node and npm versions;
- commit reviewed;
- exact command;
- exact error output.

On Windows, use `npm.cmd` only if your shell cannot resolve `npm`. On macOS and
Linux, the documented `npm` commands should be sufficient.

If local reports are generated, they should remain untracked because
`reports/gatepass-pilot/` is ignored.

## Clean-Up

To remove local generated reports from a temporary clone, delete:

```text
reports/gatepass-pilot/
```

To remove the whole temporary clone, delete the clone directory using your
normal file manager or terminal command. Do not delete a directory unless you
are certain it is only your temporary review clone.

## No Live Operation

The review run does not perform live payment processing, real settlement,
network calls, endpoint enforcement, MCP proxying, SSO, secrets management or
autonomous financial execution.
