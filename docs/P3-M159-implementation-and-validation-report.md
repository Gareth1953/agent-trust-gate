# P3-M159 Implementation and Validation Report

## Controlled baseline and final state

- Repository: `Gareth1953/agent-trust-gate`
- Branch: `main`
- Baseline HEAD: `58806b4ee944fd260eca11c222c389c09410ec62`
- Baseline parent: `3002d896c0daefa7bece3917a638bc9161c8e866`
- Baseline position: two commits ahead of `origin/main`, zero behind
- Baseline worktree and index: clean
- Intended lock subject: `P3-M159 add business policy shadow and refer controls`
- Intended final position: three commits ahead of `origin/main`, zero behind,
  with a clean worktree and index; the exact immutable commit ID is reported by
  the Git lock verification because a commit cannot contain its own hash.

No push, merge, tag, release, deployment, network access, external action,
downstream execution, account access, outreach or purchase occurred.

## Architecture

P3-M159 reuses the P3-M158 local MCP server, registered Action Capability
Passport and exact-action core. It does not create a parallel authority engine.
The existing prototype now exposes a non-issuing `assessExactAction` operation;
the established `evaluateExactAction` method calls that assessment and retains
its existing GatePass issuance path. The MCP gateway uses assessment for both
v2 modes, then applies the registered buyer policy and issues a GatePass only
for an enforced final `ACCEPT`.

The policy path is additive:

1. Strict v2 request validation and integer-minor-unit amount binding.
2. Registered Action Capability Passport integrity and tool/schema binding.
3. Registered Business Policy Contract integrity, status and time checks.
4. Existing exact-action authority, standing, mandate and evidence assessment.
5. Deterministic business risk and Evidence Decay Clock evaluation.
6. Enforced `ACCEPT`, `REFER` or `REJECT`, or observational Shadow result.

The v1 P3-M158 request/result schemas, serialized outcomes and default passport
remain unchanged and supported. MCP protocol `2025-06-18`, local stdio, exactly
one public tool and stdout protocol purity are preserved.

## Schemas and controlled records

New versioned schemas:

- `schemas/business-policy-contract.schema.json`
- `schemas/shadow-decision-receipt.schema.json`
- `schemas/mcp-exact-action-request-v2.schema.json`
- `schemas/mcp-exact-action-result-v2.schema.json`

The default synthetic purchasing policy and evidence-observation sets are
machine-readable repository constants. The v2 Action Capability Passport binds
`atg.evaluate_action`, `evaluate_exact_action`, schema version `2.0.0`, its
canonical schema digest, purchase actions and the local synthetic environment.

The Shadow Decision Receipt has a unique receipt version/type and intentionally
lacks GatePass version, signature and issuance-reference fields. It records
`wouldOutcome`, deterministic rules, risk, freshness and explicit
non-authorising flags.

## Deterministic outcomes and reason codes

Controlled policy outcomes are `ACCEPT`, `REFER` and `REJECT`; Shadow uses the
outer `SHADOW` label and one of those three values in `wouldOutcome`. `REVOKE`
remains deferred.

P3-M159 policy registration codes:

- `POLICY_VERIFIED`, `POLICY_UNKNOWN`, `POLICY_VERSION_MISMATCH`
- `POLICY_DIGEST_MISMATCH`, `POLICY_MALFORMED`
- `POLICY_NOT_YET_EFFECTIVE`, `POLICY_EXPIRED`, `POLICY_INACTIVE`, `POLICY_REVOKED`

New binding and orchestration codes:

- `POLICY_PASSPORT_MISMATCH`, `EVIDENCE_SET_UNKNOWN`
- `SHADOW_OBSERVATIONAL_NON_AUTHORISING`
- `EXACT_ACTION_AUTHORISED`, `PASSPORT_VERIFIED`
- existing exact-action primary refusal and `CHECK_<CHECK_ID>_FAILED` codes

Business-policy and risk codes:

- `ROUTINE_POLICY_RULES_PASSED`
- `CUSTOMER_IMPACT_REVIEW_REQUIRED`
- `HUMAN_REVIEW_AMOUNT_BAND`
- `ADDITIONAL_APPROVAL_REQUIRED`
- `PROHIBITED_ACTION_TIER`

Freshness and clock codes:

- `EVIDENCE_FRESHNESS_VERIFIED`
- `EVIDENCE_<TYPE>_STALE`, `EVIDENCE_<TYPE>_MISSING`
- `EVIDENCE_<TYPE>_INVALID`, `EVIDENCE_<TYPE>_FUTURE_DATED`
- `EVIDENCE_<TYPE>_MALFORMED`
- `CLOCK_UNAVAILABLE`, `CLOCK_ROLLBACK_DETECTED`

Existing deterministic passport/tool binding codes remain applicable:
`PASSPORT_UNKNOWN`, `PASSPORT_VERSION_MISMATCH`, `PASSPORT_DIGEST_MISMATCH`,
`PASSPORT_INTEGRITY_INVALID`, `PASSPORT_NOT_YET_EFFECTIVE`,
`PASSPORT_EXPIRED`, `PASSPORT_REVOKED`, `MCP_SERVER_IDENTITY_MISMATCH`,
`TOOL_IDENTITY_MISMATCH`, `OPERATION_MISMATCH`, `SCHEMA_IDENTITY_MISMATCH`,
`SCHEMA_VERSION_MISMATCH`, `SCHEMA_DIGEST_MISMATCH`,
`ACTION_TYPE_NOT_PERMITTED`, `ENVIRONMENT_NOT_PERMITTED` and
`EVIDENCE_REFERENCE_MISMATCH`. Strict input-validation failures keep the
specific field code or `UNEXPECTED_OR_MISSING_FIELD` and fail before evaluation.

Machine-readable rule identifiers are:

- `RISK-ROUTINE-001`, `RISK-ELEVATED-001`, `RISK-HIGH-001`,
  `RISK-PROHIBITED-001`
- `AMOUNT-REVIEW-001`, `SOD-ADDITIONAL-APPROVAL-001`
- `FRESH-HUMAN-AUTHORITY-001`, `FRESH-HUMAN-APPROVAL-001`
- `FRESH-AGENT-STANDING-001`, `FRESH-MANDATE-001`
- `FRESH-PROCUREMENT-EVIDENCE-001`, `EVIDENCE-CLOCK-FAIL-CLOSED-001`

## Purchasing fixture behavior

All fixture data are synthetic. The controlled action is 100 units from
Supplier A (`SUP-HARBOUR-001`), GBP, an approved warehouse and approved
supplier-account class, in the local synthetic environment. £4,000 accepts in
enforced mode and would accept in Shadow Mode. £6,000 refers. More than £10,000,
120 units, a changed supplier, changed account class or changed destination
rejects. Stale or missing refreshable procurement evidence refers. Invalid
authority or standing and future-dated evidence reject. Self-asserted authority
expansion or policy approval rejects.

## Files created

- `src/business-policy-contract.ts`
- `src/shadow-decision-receipt.ts`
- `test/business-policy-shadow-refer.test.ts`
- `schemas/business-policy-contract.schema.json`
- `schemas/shadow-decision-receipt.schema.json`
- `schemas/mcp-exact-action-request-v2.schema.json`
- `schemas/mcp-exact-action-result-v2.schema.json`
- `docs/P3-M159-business-policy-shadow-and-refer.md`
- `docs/P3-M159-implementation-and-validation-report.md`

## Files modified

- `src/exact-action-trust-gateway-prototype.ts`
- `src/mcp-exact-action-gateway.ts`
- `src/index.ts`
- `package.json`
- `README.md`
- `docs/p3-mission-register.md`

The public discovery website is unchanged. No existing v1 schema was modified.

## Dependency evidence

No dependency was added, removed or updated. `package-lock.json` is unchanged.
The implementation uses only existing TypeScript/Node facilities and existing
repository canonicalisation, receipt, clock, passport and exact-action code.

## Validation

Focused validation after implementation:

- `npm run test:business-policy-shadow`: 36 passed, 0 failed (18 P3-M159 tests
  plus 18 unchanged P3-M158 tests).
- `npm run test:mcp-exact-action`: 18 passed, 0 failed (covered by the focused
  combined command).
- `npm run typecheck`: passed.
- `npm run build`: passed.
- Full `npm test`: 675 primary tests plus 755 post-tests = 1,430 passed,
  0 failed after adding the final above-maximum policy case.
- `git diff --check`: passed.

The focused tests cover policy registration and integrity; inactive/expired and
altered policies; passport/policy/action mismatch; integer minor units; all
four risk tiers; enforced and shadow ACCEPT/REFER/REJECT; above-maximum amount;
no GatePass on REFER/REJECT/Shadow; structural Shadow/GatePass separation;
mode verdict equivalence; no Shadow state consumption; freshness, invalid,
future-dated, missing and stale evidence; clock failure/rollback; self-
authority claims; unknown tool/operation/schema/evidence; MCP lifecycle and
one-tool exposure; and schema conformance.

## Preservation and security evidence

- Existing authority, standing, mandate, exact-action canonicalisation,
  one-use/expiry and decision-versus-execution semantics remain independently
  mandatory.
- P3-M158 v1 focused tests pass unchanged.
- Shadow calls use the non-issuing assessment path and report
  `enforcementStateMutated: false`.
- REFER, REJECT and Shadow have `gatePass: null`, `executionReceipt: null`,
  `executionAvailable: false` and `actionExecuted: false`.
- No MCP execution or administration tool exists; the tool list contains only
  `atg.evaluate_action`.
- No HTTP/remote transport, runtime network call, telemetry, secret, credential,
  personal data or real customer/supplier/bank data was added.
- The preserved ANEOS report and P3-M158 historical commit remain unchanged by
  this mission except for authorised additive integration in current source,
  exports, package scripts, README and mission register.

## Known limitations and P3-M160 deferral

This remains local, synthetic and not production ready. Policy and evidence
registries are process-local repository fixtures. No durable lifecycle or
nonce state, aggregate exposure accounting, GatePass-specific post-issuance
revocation, emergency stop, crash recovery/UNKNOWN reconciliation, Customer
Trust Receipt, execution tool, remote transport, OAuth, A2A or real-system
adapter exists.

The exact next proposed mission is **P3-M160 — durable lifecycle state,
aggregate exposure ledger, GatePass revocation, emergency stop and crash
recovery/UNKNOWN reconciliation**, under a separate controlled authorisation.
P3-M160 was not begun.
