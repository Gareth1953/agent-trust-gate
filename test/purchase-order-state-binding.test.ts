import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test, type TestContext } from "node:test";
import { AtgPurchaseOrderConnector, createSyntheticPluginRequest } from "../src/standalone-plugin.js";
import { McpExactActionGateway, type McpBusinessPolicyResult } from "../src/mcp-exact-action-gateway.js";
import { ExactActionTrustGatewayPrototype } from "../src/exact-action-trust-gateway-prototype.js";
import { createPurchaseOrderStateBinding, PURCHASE_ORDER_STATE_BINDING_VERSION } from "../src/purchase-order-state-binding.js";
import { createCanonicalPayloadHash } from "../src/local-signed-proof.js";
import { issueExactActionGatePass, recomputeCanonicalActionDigest, verifyExactActionAtExecution, InMemoryNonceStore, createVerifierContext, createFixedTrustedClock, type ExactActionGatePass } from "../src/exact-action-gatepass.js";
function setup(t: TestContext) {
  const root = mkdtempSync(join(tmpdir(), "atg-order-binding-"));
  const c = new AtgPurchaseOrderConnector({ stateDirectory: root });
  t.after(() => { c.close(); rmSync(root, { recursive: true, force: true }); });
  return { root, c };
}
function actionInput(pass: ExactActionGatePass) {
  const { actionEnvelopeVersion: _v, canonicalizationVersion: _c, digestAlgorithm: _d, actionDigest: _h, ...action } = pass.action;
  return action;
}
function editPayload(root: string, name: string, edit: (payload: any) => void) {
  const path = join(root, name); const wrapper = JSON.parse(readFileSync(path, "utf8"));
  edit(wrapper.payload); wrapper.digest = createCanonicalPayloadHash(wrapper.payload); writeFileSync(path, JSON.stringify(wrapper));
}
function verify(pass: ExactActionGatePass, receipt: NonNullable<McpBusinessPolicyResult["policyDecisionReceipt"]>) {
  const nonce = new InMemoryNonceStore(); nonce.registerUnused(pass);
  return verifyExactActionAtExecution(pass, actionInput(pass), createVerifierContext({ gatePass: pass, decisionReceipt: receipt }, nonce,
    { trustedClock: createFixedTrustedClock("2026-09-02T09:01:00.000Z") }));
}
test("exact approved state digest is signed, committed once and verified during reconciliation", async t => {
  const { c } = setup(t); const req = createSyntheticPluginRequest("enforced"); const a = await c.approve(req);
  assert.equal(a.approvedBusinessStateDigest, createCanonicalPayloadHash(a.businessState));
  const binding = (a.decision.gatePass!.action.canonicalArguments as any).businessStateBinding;
  assert.equal(binding.bindingVersion, PURCHASE_ORDER_STATE_BINDING_VERSION);
  assert.deepEqual(binding, createPurchaseOrderStateBinding(a.businessState, req));
  const r = await c.execute(a.evaluationId, req);
  assert.equal(r.outcome, "EXECUTED"); assert.equal(c.getDestinationRecords().length, 1);
  assert.equal(r.evidence?.approvedBusinessStateDigest, a.approvedBusinessStateDigest);
  assert.equal(r.evidence?.signedBusinessStateVerified, true);
  assert.equal(c.reconcile(a.evaluationId).evidence?.signedBusinessStateVerified, true);
  assert.equal((await c.execute(a.evaluationId, req)).outcome, "REJECTED");
});
test("state changed during assessment is never silently refreshed at signing", async t => {
  const { root, c } = setup(t); const original = ExactActionTrustGatewayPrototype.prototype.assessExactAction;
  t.mock.method(ExactActionTrustGatewayPrototype.prototype, "assessExactAction", async function (this: ExactActionTrustGatewayPrototype, ...args: Parameters<typeof original>) {
    const result = await original.apply(this, args);
    editPayload(root, "destination.json", p => { p.businessState.orderVersion = 2; p.businessState.revision = 2; });
    return result;
  });
  const req = createSyntheticPluginRequest("enforced"); const a = await c.approve(req);
  assert.equal(a.businessState.orderVersion, 1); assert.equal(c.getBusinessState().orderVersion, 2);
  const binding = (a.decision.gatePass!.action.canonicalArguments as any).businessStateBinding;
  assert.equal(binding.businessState.orderVersion, 1); assert.equal(binding.businessStateDigest, a.approvedBusinessStateDigest);
  assert.equal(verify(a.decision.gatePass!, a.decision.policyDecisionReceipt!).verified, true);
  assert.equal((await c.execute(a.evaluationId, req)).reason, "BUSINESS_STATE_CHANGED_REAPPROVAL_REQUIRED");
  assert.equal(c.getDestinationRecords().length, 0);
});
test("gateway snapshots host approval binding before assessment await", async t => {
  const { c, root } = setup(t); const req = createSyntheticPluginRequest("enforced");
  const binding = createPurchaseOrderStateBinding(c.getBusinessState(), req);
  const original = ExactActionTrustGatewayPrototype.prototype.assessExactAction;
  t.mock.method(ExactActionTrustGatewayPrototype.prototype, "assessExactAction", async function (this: ExactActionTrustGatewayPrototype, ...args: Parameters<typeof original>) {
    binding.businessState.orderVersion = 99; binding.businessStateDigest = createCanonicalPayloadHash(binding.businessState);
    return original.apply(this, args);
  });
  const result = await new McpExactActionGateway({ durableStatePath: join(root, "separate-authority.json") }).evaluateAction(req,
    { approvedPurchaseOrderStateBinding: binding }) as McpBusinessPolicyResult;
  assert.equal((result.gatePass!.action.canonicalArguments as any).businessStateBinding.businessState.orderVersion, 1);
});
test("changed state between preliminary verification and commit writes nothing and retains UNKNOWN until lookup", async t => {
  const { c, root } = setup(t); const req = createSyntheticPluginRequest("enforced"); const a = await c.approve(req);
  assert.equal((await c.execute(a.evaluationId, req, { fault: "business_state_change_before_commit" })).outcome, "UNKNOWN");
  assert.equal(c.getDestinationRecords().length, 0); assert.equal(c.getBusinessState().orderVersion, 2);
  const authority = JSON.parse(readFileSync(join(root, "authority.json"), "utf8"));
  assert.equal(authority.exposureEntries[0].status, "UNKNOWN");
  await assert.rejects(c.approve(createSyntheticPluginRequest("enforced")), /RECONCILIATION_REQUIRED/);
  assert.equal(c.reconcile(a.evaluationId, { simulateLookupUnavailable: true }).outcome, "UNKNOWN");
  assert.equal(c.reconcile(a.evaluationId).outcome, "NOT_EXECUTED");
  const fresh = createSyntheticPluginRequest("enforced"); const b = await c.approve(fresh);
  assert.equal(b.businessState.orderVersion, 2); assert.notEqual(b.approvedBusinessStateDigest, a.approvedBusinessStateDigest);
  assert.equal((await c.execute(b.evaluationId, fresh)).outcome, "EXECUTED");
});
for (const field of ["businessStateDigest", "supplierId", "amountMinorUnits", "currency", "destination", "bindingVersion"]) {
  test("altering signed binding fails cryptographic verification: " + field, async t => {
    const { c } = setup(t); const req = createSyntheticPluginRequest("enforced"); const a = await c.approve(req);
    const pass = structuredClone(a.decision.gatePass!); const binding = (pass.action.canonicalArguments as any).businessStateBinding;
    binding[field] = field === "amountMinorUnits" ? 1 : "substituted";
    pass.action.actionDigest = recomputeCanonicalActionDigest(pass.action);
    const check = verify(pass, a.decision.policyDecisionReceipt!);
    assert.equal(check.verified, false); assert.equal(check.signatureValid, false);
    assert.equal(c.getDestinationRecords().length, 0);
  });
}
test("a substituted snapshot fails signature verification", async t => {
  const { c } = setup(t); const req = createSyntheticPluginRequest("enforced"); const a = await c.approve(req);
  c.updateBusinessState({ supplierBankReference: "fixture-bank-B" });
  const pass = structuredClone(a.decision.gatePass!);
  (pass.action.canonicalArguments as any).businessStateBinding = createPurchaseOrderStateBinding(c.getBusinessState(), req);
  pass.action.actionDigest = recomputeCanonicalActionDigest(pass.action);
  assert.equal(verify(pass, a.decision.policyDecisionReceipt!).signatureValid, false);
  assert.equal((await c.execute(a.evaluationId, req)).outcome, "REJECTED");
});
for (const mode of ["tampered", "legacy_unbound", "newer_signed_state"] as const) {
  test("connector refuses authority " + mode + " before reservation", async t => {
    const { c, root } = setup(t); const original = McpExactActionGateway.prototype.evaluateAction;
    let validCoreSignature = false;
    t.mock.method(McpExactActionGateway.prototype, "evaluateAction", async function (this: McpExactActionGateway, ...args: Parameters<typeof original>) {
      const result = await original.apply(this, args) as McpBusinessPolicyResult;
      const action = actionInput(result.gatePass!); const canonical = action.canonicalArguments as any;
      if (mode === "tampered") canonical.businessStateBinding.businessStateDigest = "sha256:" + "0".repeat(64);
      else {
        if (mode === "legacy_unbound") delete canonical.businessStateBinding;
        else { canonical.businessStateBinding.businessState.orderVersion += 1; canonical.businessStateBinding.businessStateDigest = createCanonicalPayloadHash(canonical.businessStateBinding.businessState); }
        const issuance = issueExactActionGatePass(action); result.gatePass = issuance.gatePass; result.policyDecisionReceipt = issuance.decisionReceipt;
        validCoreSignature = verify(result.gatePass, result.policyDecisionReceipt).verified;
      }
      return result;
    });
    const req = createSyntheticPluginRequest("enforced"); const a = await c.approve(req);
    if (mode !== "tampered") assert.equal(validCoreSignature, true);
    assert.equal((await c.execute(a.evaluationId, req)).reason, "SIGNED_BUSINESS_STATE_BINDING_INVALID");
    assert.equal(c.getDestinationRecords().length, 0);
    assert.equal(JSON.parse(readFileSync(join(root, "authority.json"), "utf8")).lifecycles[0].status, "ISSUED");
  });
}
test("rehashing a substituted journal binding cannot resolve a lost acknowledgement", async t => {
  const { c, root } = setup(t); const req = createSyntheticPluginRequest("enforced"); const a = await c.approve(req);
  assert.equal((await c.execute(a.evaluationId, req, { fault: "timeout_after_commit" })).outcome, "UNKNOWN");
  editPayload(root, "journal.json", p => { p.attempts[0].businessStateBinding.businessState.orderVersion = 99; p.attempts[0].businessStateBinding.businessStateDigest = createCanonicalPayloadHash(p.attempts[0].businessStateBinding.businessState); });
  assert.equal(c.reconcile(a.evaluationId).outcome, "UNKNOWN"); assert.equal(c.getDestinationRecords().length, 1);
});
test("invalid host approval digest fails before signing", async t => {
  const { c, root } = setup(t); const req = createSyntheticPluginRequest("enforced"); const binding = createPurchaseOrderStateBinding(c.getBusinessState(), req);
  binding.businessStateDigest = "sha256:" + "0".repeat(64);
  await assert.rejects(new McpExactActionGateway({ durableStatePath: join(root, "separate.json") }).evaluateAction(req,
    { approvedPurchaseOrderStateBinding: binding }), /Host-approved state binding/);
});
