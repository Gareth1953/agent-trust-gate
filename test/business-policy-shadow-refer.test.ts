import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BusinessPolicyRegistry,
  DEFAULT_BUSINESS_POLICY,
  createBusinessPolicyContract,
} from "../src/business-policy-contract.js";
import { ActionCapabilityPassportRegistry } from "../src/action-capability-passport.js";
import {
  DEFAULT_BUSINESS_POLICY_ACTION_CAPABILITY_PASSPORT,
  McpExactActionGateway,
  McpExactActionInputError,
  createDefaultMcpBusinessPolicyRequest,
  validateMcpBusinessPolicyRequest,
  type McpBusinessPolicyRequest,
  type McpBusinessPolicyResult,
} from "../src/mcp-exact-action-gateway.js";
import { McpStdioProtocolServer } from "../src/mcp-stdio-server.js";
import { isStructurallyGatePass } from "../src/shadow-decision-receipt.js";
import { validateJsonSchemaFile } from "../src/json-schema-validator.js";

function clone<T>(value: T): T { return structuredClone(value); }

async function evaluate(
  request: McpBusinessPolicyRequest,
  gateway = new McpExactActionGateway(),
): Promise<McpBusinessPolicyResult> {
  return await gateway.evaluateAction(request) as McpBusinessPolicyResult;
}

function policyWith(patch: Partial<Omit<typeof DEFAULT_BUSINESS_POLICY, "policyDigest">>) {
  const { policyDigest: _digest, ...unsigned } = clone(DEFAULT_BUSINESS_POLICY);
  return createBusinessPolicyContract({ ...unsigned, ...patch });
}

test("registered policy permits enforced ACCEPT and preserves exact GatePass semantics", async () => {
  const result = await evaluate(createDefaultMcpBusinessPolicyRequest("enforced"));
  assert.equal(result.outcome, "ACCEPT");
  assert.equal(result.gatePassIssued, true);
  assert.ok(result.gatePass);
  assert.equal(result.policyDecisionReceipt?.decision, "allowed");
  assert.equal(result.executionReceipt, null);
  assert.equal(result.actionExecuted, false);
});

test("unknown, digest-mismatched, inactive and expired policies fail closed", async () => {
  const unknown = createDefaultMcpBusinessPolicyRequest();
  unknown.businessPolicyReference.policyId = "policy.unknown";
  assert.deepEqual((await evaluate(unknown)).reasonCodes, ["POLICY_UNKNOWN"]);

  const digest = createDefaultMcpBusinessPolicyRequest();
  digest.businessPolicyReference.policyDigest = `sha256:${"0".repeat(64)}`;
  assert.deepEqual((await evaluate(digest)).reasonCodes, ["POLICY_DIGEST_MISMATCH"]);

  for (const policy of [
    policyWith({ policyStatus: "inactive" }),
    policyWith({ expiresAt: "2026-09-02T08:59:59.000Z" }),
  ]) {
    const request = createDefaultMcpBusinessPolicyRequest();
    request.businessPolicyReference = {
      policyId: policy.policyId, policyVersion: policy.policyVersion, policyDigest: policy.policyDigest,
    };
    const result = await evaluate(request, new McpExactActionGateway({
      policyRegistry: new BusinessPolicyRegistry([policy]),
    }));
    assert.equal(result.outcome, "REJECT");
    assert.equal(result.gatePass, null);
  }
});

test("altered or malformed policy and unknown risk rule fail closed", async () => {
  const altered = clone(DEFAULT_BUSINESS_POLICY);
  altered.currency = "USD";
  const request = createDefaultMcpBusinessPolicyRequest();
  const alteredResult = await evaluate(request, new McpExactActionGateway({
    policyRegistry: new BusinessPolicyRegistry([altered]),
  }));
  assert.deepEqual(alteredResult.reasonCodes, ["POLICY_MALFORMED"]);

  const { policyDigest: _digest, ...unsigned } = clone(DEFAULT_BUSINESS_POLICY);
  const malformed = createBusinessPolicyContract({
    ...unsigned,
    riskTierRules: [{ ...unsigned.riskTierRules[0]!, condition: "UNKNOWN" as never }],
  });
  request.businessPolicyReference.policyDigest = malformed.policyDigest;
  const malformedResult = await evaluate(request, new McpExactActionGateway({
    policyRegistry: new BusinessPolicyRegistry([malformed]),
  }));
  assert.deepEqual(malformedResult.reasonCodes, ["POLICY_MALFORMED"]);
});

test("policy cannot broaden or mismatch the passport", async () => {
  const policy = policyWith({ permittedTools: ["different.tool"] });
  const request = createDefaultMcpBusinessPolicyRequest();
  request.businessPolicyReference.policyDigest = policy.policyDigest;
  const result = await evaluate(request, new McpExactActionGateway({ policyRegistry: new BusinessPolicyRegistry([policy]) }));
  assert.deepEqual(result.reasonCodes, ["POLICY_PASSPORT_MISMATCH"]);
  assert.equal(result.gatePass, null);
});

test("minor currency units are integral and exactly bound to the action", () => {
  const fractional = createDefaultMcpBusinessPolicyRequest();
  fractional.amountMinorUnits = 400000.5;
  assert.throws(() => validateMcpBusinessPolicyRequest(fractional), (error: unknown) =>
    error instanceof McpExactActionInputError && error.reasonCode === "AMOUNT_MINOR_UNITS_INVALID");
  const mismatch = createDefaultMcpBusinessPolicyRequest();
  mismatch.amountMinorUnits += 1;
  assert.throws(() => validateMcpBusinessPolicyRequest(mismatch), (error: unknown) =>
    error instanceof McpExactActionInputError && error.reasonCode === "AMOUNT_MINOR_UNITS_MISMATCH");
});

test("ROUTINE, ELEVATED, HIGH and PROHIBITED tiers are deterministic", async () => {
  const routine = await evaluate(createDefaultMcpBusinessPolicyRequest());
  const elevated = await evaluate(createDefaultMcpBusinessPolicyRequest("enforced", {}, { customerImpactClass: "indirect" }));
  const highRequest = createDefaultMcpBusinessPolicyRequest("enforced", { totalAmount: 6_000, nonce: "nonce_risk_high_001" });
  highRequest.amountMinorUnits = 600_000;
  const high = await evaluate(highRequest);
  const prohibited = await evaluate(createDefaultMcpBusinessPolicyRequest("enforced", { quantity: 120, nonce: "nonce_risk_prohibited_001" }));
  assert.deepEqual(
    [routine.riskAssessment?.tier, elevated.riskAssessment?.tier, high.riskAssessment?.tier, prohibited.riskAssessment?.tier],
    ["ROUTINE", "ELEVATED", "HIGH", "PROHIBITED"],
  );
  assert.deepEqual([routine.outcome, elevated.outcome, high.outcome, prohibited.outcome], ["ACCEPT", "REFER", "REFER", "REJECT"]);
  assert.ok(prohibited.reasonCodes.includes("PROHIBITED_ACTION_TIER"));
});

test("REFER and REJECT never issue GatePasses", async () => {
  const referRequest = createDefaultMcpBusinessPolicyRequest("enforced", { totalAmount: 6_000, nonce: "nonce_refer_001" });
  referRequest.amountMinorUnits = 600_000;
  const refer = await evaluate(referRequest);
  const reject = await evaluate(createDefaultMcpBusinessPolicyRequest("enforced", { supplierId: "SUP-NOT-PERMITTED", nonce: "nonce_reject_001" }));
  for (const result of [refer, reject]) {
    assert.equal(result.gatePassIssued, false);
    assert.equal(result.gatePass, null);
    assert.equal(result.authorising, false);
  }
  assert.equal(refer.policyDecisionReceipt?.decision, "escalated");
  assert.equal(reject.policyDecisionReceipt?.decision, "refused");
});

test("amount above the absolute policy maximum rejects without a GatePass", async () => {
  const request = createDefaultMcpBusinessPolicyRequest("enforced", {
    totalAmount: 11_000,
    nonce: "nonce_above_policy_maximum_001",
  });
  request.amountMinorUnits = 1_100_000;
  const result = await evaluate(request);
  assert.equal(result.outcome, "REJECT");
  assert.equal(result.riskAssessment?.tier, "PROHIBITED");
  assert.equal(result.gatePassIssued, false);
});

test("Shadow ACCEPT, REFER and REJECT are observational and structurally not GatePasses", async () => {
  const accept = await evaluate(createDefaultMcpBusinessPolicyRequest("shadow"));
  const referRequest = createDefaultMcpBusinessPolicyRequest("shadow", { totalAmount: 6_000, nonce: "nonce_shadow_refer_001" });
  referRequest.amountMinorUnits = 600_000;
  const refer = await evaluate(referRequest);
  const reject = await evaluate(createDefaultMcpBusinessPolicyRequest("shadow", { quantity: 120, nonce: "nonce_shadow_reject_001" }));
  assert.deepEqual([accept.wouldOutcome, refer.wouldOutcome, reject.wouldOutcome], ["ACCEPT", "REFER", "REJECT"]);
  for (const result of [accept, refer, reject]) {
    assert.equal(result.outcome, "SHADOW");
    assert.equal(result.gatePass, null);
    assert.equal(result.policyDecisionReceipt, null);
    assert.equal(result.enforcementStateMutated, false);
    assert.equal(result.shadowDecisionReceipt?.nonAuthorising, true);
    assert.equal(isStructurallyGatePass(result.shadowDecisionReceipt), false);
  }
});

test("shadow and enforced modes return equivalent proposed verdicts without consuming state", async () => {
  const gateway = new McpExactActionGateway();
  const shadowRequest = createDefaultMcpBusinessPolicyRequest("shadow", { nonce: "nonce_shadow_state_001" });
  const first = await evaluate(shadowRequest, gateway);
  const second = await evaluate(clone(shadowRequest), gateway);
  assert.deepEqual(first, second);
  const enforced = clone(shadowRequest);
  enforced.mode = "enforced";
  const enforcedResult = await evaluate(enforced, gateway);
  assert.equal(first.wouldOutcome, enforcedResult.outcome);
  assert.equal(enforcedResult.outcome, "ACCEPT");
  assert.equal(enforcedResult.gatePassIssued, true);
});

test("freshness clock accepts fresh evidence and refers refreshable stale or missing evidence", async () => {
  const fresh = await evaluate(createDefaultMcpBusinessPolicyRequest());
  assert.equal(fresh.evidenceDecay?.outcome, "ACCEPT");
  for (const reference of ["evidence-set.stale-refreshable.v1", "evidence-set.missing-refreshable.v1"]) {
    const request = createDefaultMcpBusinessPolicyRequest("enforced", { nonce: `nonce_${reference}` });
    request.evidenceSetReference = reference;
    const result = await evaluate(request);
    assert.equal(result.outcome, "REFER");
    assert.equal(result.gatePass, null);
  }
});

test("invalid authority, invalid standing and future evidence reject regardless of policy", async () => {
  for (const reference of [
    "evidence-set.invalid-authority.v1", "evidence-set.invalid-standing.v1", "evidence-set.future-dated.v1",
  ]) {
    const request = createDefaultMcpBusinessPolicyRequest("enforced", { nonce: `nonce_${reference}` });
    request.evidenceSetReference = reference;
    const result = await evaluate(request);
    assert.equal(result.outcome, "REJECT");
    assert.equal(result.gatePass, null);
  }
});

test("clock failure and rollback fail closed", async () => {
  for (const clock of [
    null,
    { clockId: "rolled_back", now: () => new Date("2026-09-02T08:58:00.000Z") },
    { clockId: "throws", now: (): Date => { throw new Error("clock failed"); } },
  ]) {
    const result = await evaluate(createDefaultMcpBusinessPolicyRequest(), new McpExactActionGateway({ clock }));
    assert.equal(result.outcome, "REJECT");
    assert.equal(result.gatePass, null);
  }
});

test("self authority or policy approval assertions and prohibited business mutations reject", async () => {
  for (const patch of [
    { requestedAuthorityExpansion: true },
    { agentClaimsPolicyApproval: true },
    { supplierAccountReferenceClass: "substituted_bank_account" },
    { destinationClass: "unapproved_destination" },
    { customerContactRequested: true },
  ]) {
    const result = await evaluate(createDefaultMcpBusinessPolicyRequest("enforced", {}, patch));
    assert.equal(result.outcome, "REJECT");
    assert.equal(result.riskAssessment?.tier, "PROHIBITED");
  }
});

test("unknown tool, operation, schema and evidence set fail closed", async () => {
  const mutations: Array<[keyof McpBusinessPolicyRequest["toolBinding"], string, string]> = [
    ["toolIdentity", "unknown.tool", "TOOL_IDENTITY_MISMATCH"],
    ["operation", "unknown_operation", "OPERATION_MISMATCH"],
    ["inputSchemaVersion", "999", "SCHEMA_VERSION_MISMATCH"],
  ];
  for (const [field, value, reason] of mutations) {
    const request = createDefaultMcpBusinessPolicyRequest();
    request.toolBinding[field] = value;
    assert.deepEqual((await evaluate(request)).reasonCodes, [reason]);
  }
  const unknownEvidence = createDefaultMcpBusinessPolicyRequest();
  unknownEvidence.evidenceSetReference = "evidence-set.unknown";
  assert.deepEqual((await evaluate(unknownEvidence)).reasonCodes, ["EVIDENCE_SET_UNKNOWN"]);
});

test("MCP protocol returns v2 structured results while exposing exactly one tool", async () => {
  const server = new McpStdioProtocolServer();
  await server.handleLine(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "test", version: "1" } } }));
  await server.handleLine(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized", params: {} }));
  const list = await server.handleLine(JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} }));
  assert.deepEqual(((list as { result: { tools: Array<{ name: string }> } }).result.tools.map((tool) => tool.name)), ["atg.evaluate_action"]);
  const call = await server.handleLine(JSON.stringify({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "atg.evaluate_action", arguments: createDefaultMcpBusinessPolicyRequest("shadow") } }));
  const result = (call as { result: { structuredContent: McpBusinessPolicyResult } }).result.structuredContent;
  assert.equal(result.outcome, "SHADOW");
  assert.equal(result.wouldOutcome, "ACCEPT");
});

test("v2 policy, request, result and shadow receipt validate against additive schemas", async () => {
  const request = createDefaultMcpBusinessPolicyRequest("shadow");
  const result = await evaluate(request);
  for (const [schema, value] of [
    ["schemas/business-policy-contract.schema.json", DEFAULT_BUSINESS_POLICY],
    ["schemas/mcp-exact-action-request-v2.schema.json", request],
    ["schemas/mcp-exact-action-result-v2.schema.json", result],
    ["schemas/shadow-decision-receipt.schema.json", result.shadowDecisionReceipt],
  ] as const) {
    const validation = validateJsonSchemaFile(schema, value);
    assert.equal(validation.valid, true, `${schema}: ${validation.errors.join("; ")}`);
  }
});

test("legacy P3-M158 passport remains registered alongside v2 passport", () => {
  const registry = new ActionCapabilityPassportRegistry([DEFAULT_BUSINESS_POLICY_ACTION_CAPABILITY_PASSPORT]);
  assert.equal(registry.list().length, 1);
  assert.equal(DEFAULT_BUSINESS_POLICY_ACTION_CAPABILITY_PASSPORT.executionAvailable, false);
});
