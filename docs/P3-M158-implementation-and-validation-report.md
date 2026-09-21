# P3-M158 Implementation and Validation Report

## Mission result

P3-M158 implements a dependency-free local MCP stdio gateway over the existing
Agent Trust Gate exact-action core. The gateway performs evaluation only and
exposes exactly one MCP tool, `atg.evaluate_action`. It does not execute or
forward an action.

## Controlled baseline

- Repository: `Gareth1953/agent-trust-gate`
- Branch: `main`
- Starting HEAD: `3002d896c0daefa7bece3917a638bc9161c8e866`
- Starting upstream position: one commit ahead of `origin/main`, zero behind
- Starting worktree and index: clean
- Starting HEAD content: only
  `docs/ATG-ANEOS-R001-strategic-kill-and-reinvention.md`
- Preserved report size: 44,428 bytes
- Preserved report SHA-256:
  `B1FECE46AFFE1006E199179BCB0205455DD0785EF0B0E9A5155842FE5E74B657`

The lock target is one P3-M158 commit with subject
`P3-M158 add local MCP exact-action gateway foundation`. The exact final commit
hash is reported by the post-commit verification because embedding a commit's
own hash inside its content is self-referential.

## Files created

- `src/action-capability-passport.ts`
- `src/mcp-exact-action-gateway.ts`
- `src/mcp-stdio-server.ts`
- `schemas/action-capability-passport.schema.json`
- `schemas/mcp-exact-action-request.schema.json`
- `schemas/mcp-exact-action-result.schema.json`
- `examples/mcp-exact-action-gateway/action-capability-passport.json`
- `examples/mcp-exact-action-gateway/evaluate-action-request.json`
- `test/mcp-exact-action-gateway.test.ts`
- `docs/P3-M158-local-mcp-exact-action-gateway.md`
- `docs/P3-M158-implementation-and-validation-report.md`

## Files modified

- `README.md`
- `docs/p3-mission-register.md`
- `package.json`
- `src/index.ts`

No public discovery-site file was changed.

## Architecture decisions

1. The existing `ExactActionTrustGatewayPrototype` remains the authority,
   mandate, approval, standing, evidence and policy evaluator. P3-M158 does
   not create a second policy authority.
2. The existing exact-action canonical envelope, policy decision receipt and
   GatePass issuer are reused without changing their v1 serialized forms.
3. The MCP result is an additive orchestration object. Existing valid issuance
   maps to `ACCEPT`; existing refusal maps to `REJECT`.
4. `REFER` and `REVOKE` are identified only as deferred vocabulary. They are
   not implemented.
5. A repository-owned Action Capability Passport binds server, tool,
   operation, schema identity/version/digest, action type, local environment,
   evidence requirements and non-executable adapter class.
6. Passport reference and complete resolved action arguments are included in
   the exact-action canonical arguments. Tool, operation and encoded schema
   identity/version/digest use the existing exact-action binding fields.
7. Evidence references resolve only to existing synthetic repository fixtures.
   Agent-supplied authority or extra fields are rejected.
8. The server contains no downstream forwarding or execution path.

## MCP compatibility

- Protocol version: `2025-06-18`
- Transport: local newline-delimited UTF-8 stdio only
- Lifecycle: `initialize`, followed by `notifications/initialized`
- Operations: `ping`, `tools/list`, `tools/call`
- Tool: exactly `atg.evaluate_action`
- Maximum input line: 65,536 bytes
- stdout: JSON-RPC protocol responses only
- stderr: transport diagnostics only
- Shutdown: clean exit on stdin EOF

Unsupported protocol versions, lifecycle misuse, unknown methods, unknown
tools, malformed JSON-RPC, invalid UTF-8, invalid arguments and oversized input
fail closed with deterministic errors.

## Dependency review

No dependency was added. The implementation uses Node.js standard-library
streams, buffers and the existing repository modules. `package-lock.json` is
unchanged. No package was installed or updated.

## Passport behaviour

The registered passport is local, synthetic and evaluation-only. Its input
schema digest is:

`sha256:604880696812076db94a2f8903c11287cb52f3fc7ef3f68ec242432b8951e8cf`

Its passport digest is:

`sha256:b9a0ed1a81e393d7adb2cc776d6b42dd0e295e31fe75f1756d57beec445e7f93`

Unknown, version-mismatched, digest-mismatched, internally altered, not-yet
effective, expired or revoked passports fail closed. MCP descriptions and
annotations remain untrusted metadata. A passport creates no human authority,
approval, mandate or agent standing.

## Validation results

### Focused P3-M158 acceptance suite

- Command: `npm run test:mcp-exact-action`
- Result: **PASS — 18 passed, 0 failed**

Coverage includes initialization, exact tool listing, valid `ACCEPT`, refused
`REJECT`, unknown tool, malformed JSON-RPC, invalid input, self-asserted
authority, passport states and mutation, schema/tool/operation mutation,
supplier/amount/currency/quantity/evidence mutation, environment exclusion,
input-size enforcement, stdout purity, determinism, fixture alignment, secret
screening and absence of HTTP/network/execution code.

### Complete repository suite

- Command: `npm test`
- Primary phase: **675 passed, 0 failed**
- Post-test phase, including P3-M158: **737 passed, 0 failed**
- Combined configured invocations: **1,412 passed, 0 failed**

### Build and typecheck

- `npm run build`: **PASS**
- `npm run typecheck`: **PASS**
- `git diff --check`: **PASS**

The build refreshed the existing ignored `dist/` output in accordance with
repository practice. No build output is staged or committed.

## Preservation evidence

- Existing exact-action v1 schemas are unchanged.
- Existing canonical action digest implementation is unchanged.
- Existing GatePass semantics are unchanged.
- Existing one-use, expiry and decision-versus-execution behaviour is
  unchanged.
- Existing CLIs, fixtures, examples and demonstrations pass the complete suite.
- No execution receipt is created by the MCP gateway.
- No simulated or live downstream action is available through MCP.
- No HTTP listener, remote transport, OAuth, telemetry or runtime network call
  is introduced.
- No credential, secret, personal, customer, bank or real supplier data is in
  the new fixtures, schemas or logs.
- No production, customer, beta, savings, ROI or independent-validation claim
  is made.

## Known limitations

- One synthetic procurement capability and repository fixture set only.
- Local stdio only.
- MCP protocol `2025-06-18` only.
- Local deterministic fixture signatures, not production key custody.
- In-memory nonce state inherited from the existing exact-action core.
- No arbitrary buyer evidence adapter.
- No production authentication, authorization, isolation or deployment.
- `ACCEPT` proves only that configured authority and policy checks passed for
  the recorded action; it does not prove commercial wisdom or outcome quality.

## Deferred P3-M159 scope

P3-M158 does not begin P3-M159. Deferred work includes Shadow Mode,
buyer-defined business-policy contracts, deterministic customer-impact tiers,
`REFER`, evidence-decay policy generalisation and the separately controlled
transition from observation to enforcement. `REVOKE`, aggregate exposure,
durable lifecycle state, emergency stop, crash recovery and Customer Trust
Receipts also remain unimplemented and require later separately authorised
missions.
