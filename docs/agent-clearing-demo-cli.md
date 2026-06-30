# Agent Clearing Demo CLI Pack

## Demo CLI Status

The Agent Clearing Demo CLI is a compiled local command for passing a JSON draft into the in-memory Agent Clearing Pipeline Demo. It is not a live CLI, network tool, public API, protocol, commercial service, or action executor.

The demo CLI does not execute actions. The demo CLI does not perform network lookups. The demo CLI does not move money. The demo CLI only returns local draft pipeline results.

## Purpose

The command gives developers a repeatable way to inspect the complete local sequence: RefusalGraph query, clearing decision, clearing receipt, local receipt-verification readiness, and fee-metering placeholder. It exercises existing engines without duplicating their decision logic.

## Local Command Usage

```text
npm run demo:clearing -- examples/agent-clearing-cli-input-draft.json
npm run demo:clearing -- examples/agent-clearing-cli-input-draft.json --pretty
```

The package script compiles local TypeScript and starts one short-lived Node process. It does not start a server or listener.

## Input File Format

Input is one local JSON object containing:

- `pipeline_id`, or a safe local fallback is used
- one required `clearing_request` object
- optional `local_refusal_signals`, defaulting to an empty array
- optional `fee_metering_requested`, defaulting to false
- a timestamp, with the clearing-request timestamp as fallback

The parser validates all fields required by the local engines. It rebuilds the request and signals from allowlisted fields, so extra fields are discarded before pipeline execution.

Missing files, invalid JSON, unsupported options, malformed signals, or incomplete requests produce a structured local error on stderr and exit code 1. Errors contain no stack trace, file path, or input value.

## Output Format

Successful stdout is one JSON Agent Clearing Pipeline Demo result. It includes the RefusalGraph query result, clearing decision, clearing receipt, receipt verification result, fee-metering event, pipeline status, and fixed false safety indicators.

Default output is compact JSON. `--pretty` changes whitespace only. Output is not persisted by the command.

## Example Run

The tracked blocked example finds local high-caution payment signals and returns `require_human_approval`. The tracked low-risk example returns `accept_with_limits`. Both create an unpersisted draft receipt, perform only local verification-readiness checks, trigger no fee, and execute no proposed action.

## Private Data Boundary

The CLI parser uses an allowlist and does not pass arbitrary fields to the pipeline. The pipeline and every nested engine also construct allowlisted outputs. Real customers, companies, accounts, wallets, emails, documents, endpoints, URLs, credentials, payment data, and raw evidence are not copied.

CLI input is local draft data only. Live customer data, collection, persistence, and private-data export remain disabled.

## Current Safety Blocks

The demo CLI does not trigger payment, billing, settlement, signup, tracking, analytics, deployment, publishing, outreach, webhooks, or third-party connections. Live CLI, CLI/clearing networks, external lookup, public APIs/protocols, agent-to-agent CLI, receipt networks, live/external receipt verification, live/external fee metering, billable events, machine fees, automatic purchase, and action execution are disabled.

## Future Agent Clearing House Use

A future approved developer tool could submit authenticated requests to controlled clearing infrastructure. That would require separate transport, identity, authorization, privacy, monitoring, incident, support, and abuse controls. This command provides none of those live capabilities.

## Future Fee Readiness

The output can contain a local fee-readiness placeholder. It does not create a usage ledger, tariff, invoice, billable event, payment, or settlement, and it cannot collect a fee.

## Gareth Final Approval Gate

All live, commercial, network, payment, verification, metering, billing, or settlement use requires Gareth final approval after technical validation, security and privacy review, legal review, and commercial validation.

The current decision is **BLOCKED: LOCAL JSON DEMO CLI ONLY**.
