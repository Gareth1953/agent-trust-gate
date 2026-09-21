# P3-M158 Local MCP Exact-Action Gateway

## Status and purpose

P3-M158 provides a genuine local Model Context Protocol stdio boundary over
the existing Agent Trust Gate exact-action evaluator. It lets an MCP client ask
whether one synthetic proposed action is authorised. It does not execute the
action or forward it to another tool.

The supported protocol version is `2025-06-18`. The supported transport is
local standard input/output only. There is no HTTP listener, remote transport,
OAuth implementation, network access, telemetry or external dependency.

## Start the server

Prerequisites are Node.js 20 or later and the repository's existing installed
development dependencies.

```powershell
npm run build
npm run --silent mcp:stdio
```

The build command creates the existing ignored `dist/` output according to
repository practice. MCP clients should launch
`node dist/src/mcp-stdio-server.js` as a subprocess. The `--silent` flag is
required when using the npm script so npm does not contaminate protocol output.

The server reads one UTF-8 JSON-RPC message per line on stdin. It writes only
JSON-RPC protocol messages to stdout. Diagnostic transport failures, if any,
go to stderr. The maximum input line is 65,536 bytes.

## Protocol surface

The server implements:

- `initialize` for MCP protocol `2025-06-18`;
- `notifications/initialized`;
- `ping`;
- `tools/list`;
- `tools/call`.

Requests before lifecycle completion fail closed. Unsupported methods,
unknown tools, malformed JSON-RPC, invalid UTF-8, invalid tool arguments and
oversized lines return deterministic errors. End of stdin cleanly shuts down
the process.

`tools/list` exposes exactly:

```text
atg.evaluate_action
```

No execution, administration, policy mutation, authority expansion,
revocation-administration or emergency-stop tool is exposed.

## Tool contract

`atg.evaluate_action` accepts:

- request schema version;
- Action Capability Passport ID, version and digest;
- MCP server, tool, operation and input-schema binding;
- references to repository-owned human authority, approval, agent standing and
  mandate evidence;
- one complete proposed procurement action.

The request schema is
`schemas/mcp-exact-action-request.schema.json`. The additive result schema is
`schemas/mcp-exact-action-result.schema.json`.

An existing valid exact-action authorisation maps to `ACCEPT` and returns the
existing local GatePass and policy-decision receipt. An existing refusal maps
to `REJECT` and returns no GatePass. Existing `allowed`, `refused`,
`GATEPASS_ISSUED` and `ACTION_REFUSED` values are not renamed or reinterpreted.

P3-M158 implements only `ACCEPT` and `REJECT`. `REFER` and `REVOKE` are listed
as deferred vocabulary and are not claimed as available.

Every result states:

- `executionReceipt: null`;
- `executionAvailable: false`;
- `actionExecuted: false`;
- `localOnly: true`;
- `productionReady: false`;
- `commercialWisdomAssessed: false`.

## Action Capability Passport

The passport is a versioned repository registry record. Its schema is
`schemas/action-capability-passport.schema.json`, and the registered synthetic
passport is shown in
`examples/mcp-exact-action-gateway/action-capability-passport.json`.

It binds:

- passport ID and version;
- MCP server identity;
- `atg.evaluate_action` tool identity;
- `evaluate_exact_action` operation;
- input-schema identity, version and digest;
- permitted action type and local synthetic environment;
- the non-executable adapter class;
- risk and reversibility classifications;
- evidence requirements;
- effective and expiry times;
- active or revoked status and revocation reference;
- its own canonical digest.

Only repository-registered passports resolve. Unknown, changed, expired,
revoked or schema-mismatched passports fail closed. A passport is a capability
registration record only. It does not create or prove human authority, human
approval, agent standing, mandate scope or business correctness.

## Trust boundary

Agent-supplied descriptions, MCP annotations, claimed approvals and claimed
authority are untrusted. The request contract rejects additional authority
objects. Evidence references resolve only to repository-owned synthetic
fixtures. The existing ATG evaluator verifies the registered human authority,
approval, mandate, standing, evidence freshness, supplier, quantity, amount,
currency, jurisdiction, risk, policy, canonical digest and nonce state.

The GatePass canonical arguments bind the resolved passport reference and the
complete action. Tool name, operation and the schema identity/version/digest
are bound into the exact-action envelope. Changed tool, operation, schema,
passport, supplier target, amount, currency, environment, evidence reference
or out-of-scope action arguments fail closed.

## Limitations

- Local deterministic fixture authority only.
- Synthetic procurement action family only.
- In-memory nonce state inherited from the existing exact-action core.
- No Shadow Mode.
- No buyer-defined business-policy contract.
- No `REFER` or `REVOKE` lifecycle.
- No durable state, aggregate exposure, emergency stop or crash recovery.
- No simulated or live action execution through MCP.
- No Customer Trust Receipt.
- No production authentication, key custody, deployment or security claim.

ATG verifies configured declared authority and limits for an exact action. It
does not determine whether an action is commercially wise, factually correct,
legally sufficient or beneficial.
