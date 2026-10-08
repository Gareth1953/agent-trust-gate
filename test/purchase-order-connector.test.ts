import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { AtgPurchaseOrderConnector, createSyntheticPluginRequest } from "../src/standalone-plugin.js";
import { createCanonicalPayloadHash } from "../src/local-signed-proof.js";
function setup() { const root = mkdtempSync(join(tmpdir(), "atg-order-")); return { root, connector: new AtgPurchaseOrderConnector({ stateDirectory: root }) }; }

test("exact approved order records matching evidence once; returned approval mutation has no authority", async () => {
  const { root, connector: c } = setup();
  try {
    const request = createSyntheticPluginRequest("enforced"); const a = await c.approve(request);
    a.decision.gatePass!.signature.signature = "forged"; a.businessState.orderVersion = 999;
    const changed = structuredClone(request); changed.proposedAction.supplierId = "attacker";
    assert.equal((await c.execute(a.evaluationId, changed)).reason, "APPROVED_REQUEST_CHANGED");
    const r = await c.execute(a.evaluationId, request);
    assert.equal(r.outcome, "EXECUTED"); assert.equal(r.evidence?.authorisedRequestMatchesRecordedOutcome, true);
    assert.equal(r.evidence?.independentExecutionCapture, false);
    assert.equal((await c.execute(a.evaluationId, request)).outcome, "REJECTED");
    await assert.rejects(c.approve(createSyntheticPluginRequest("enforced")), /ORDER_ALREADY_RECORDED/);
    assert.equal(c.getDestinationRecords().length, 1);
  } finally { c.close(); rmSync(root, { recursive: true, force: true }); }
});
for (const change of [{ orderVersion: 2 }, { supplierBankReference: "fixture-bank-B" }]) {
  test(`changed ${Object.keys(change)[0]} requires fresh approval`, async () => {
    const { root, connector: c } = setup();
    try {
      const req = createSyntheticPluginRequest("enforced"); const a = await c.approve(req); c.updateBusinessState(change);
      assert.equal((await c.execute(a.evaluationId, req)).reason, "BUSINESS_STATE_CHANGED_REAPPROVAL_REQUIRED");
      assert.equal(c.getDestinationRecords().length, 0);
      const fresh = createSyntheticPluginRequest("enforced"); const b = await c.approve(fresh);
      assert.equal((await c.execute(b.evaluationId, fresh)).outcome, "EXECUTED");
    } finally { c.close(); rmSync(root, { recursive: true, force: true }); }
  });
}
test("lost acknowledgement stays unknown until destination lookup; restart does not duplicate order", async () => {
  const { root, connector: c } = setup(); let reopened: AtgPurchaseOrderConnector | undefined;
  try {
    const req = createSyntheticPluginRequest("enforced"); const a = await c.approve(req);
    assert.equal((await c.execute(a.evaluationId, req, { fault: "timeout_after_commit" })).outcome, "UNKNOWN");
    assert.equal(c.reconcile(a.evaluationId, { simulateLookupUnavailable: true }).outcome, "UNKNOWN");
    assert.equal((await c.execute(a.evaluationId, req)).outcome, "REJECTED"); c.close();
    reopened = new AtgPurchaseOrderConnector({ stateDirectory: root });
    const r = reopened.reconcile(a.evaluationId); assert.equal(r.outcome, "EXECUTED");
    assert.equal(r.evidence?.authorisedRequestMatchesRecordedOutcome, true);
    assert.equal(reopened.getDestinationRecords().length, 1);
    assert.equal((await reopened.execute(a.evaluationId, req)).reason, "APPROVAL_UNKNOWN");
  } finally { reopened?.close(); c.close(); rmSync(root, { recursive: true, force: true }); }
});
test("timeout before commit blocks fresh work until confirmed absent; fresh approval then succeeds", async () => {
  const { root, connector: c } = setup();
  try {
    const req = createSyntheticPluginRequest("enforced"); const a = await c.approve(req);
    assert.equal((await c.execute(a.evaluationId, req, { fault: "timeout_before_commit" })).outcome, "UNKNOWN");
    await assert.rejects(c.approve(createSyntheticPluginRequest("enforced")), /RECONCILIATION_REQUIRED/);
    assert.equal(c.reconcile(a.evaluationId).outcome, "NOT_EXECUTED");
    assert.equal((await c.execute(a.evaluationId, req)).reason, "ATTEMPT_ALREADY_RECORDED_NO_RETRY");
    const fresh = createSyntheticPluginRequest("enforced"); const b = await c.approve(fresh);
    assert.equal((await c.execute(b.evaluationId, fresh)).outcome, "EXECUTED");
  } finally { c.close(); rmSync(root, { recursive: true, force: true }); }
});
test("concurrent execution and state updates cannot enter a busy connector", async () => {
  const { root, connector: c } = setup();
  try {
    const req = createSyntheticPluginRequest("enforced"); const a = await c.approve(req);
    const first = c.execute(a.evaluationId, req);
    assert.throws(() => c.updateBusinessState({ orderVersion: 2 }), /CONNECTOR_BUSY/);
    await assert.rejects(c.execute(a.evaluationId, req), /CONNECTOR_BUSY/);
    assert.equal((await first).outcome, "EXECUTED"); assert.equal(c.getDestinationRecords().length, 1);
  } finally { c.close(); rmSync(root, { recursive: true, force: true }); }
});
test("shadow/referral/rejection cannot execute despite caller decision tampering", async () => {
  for (const [mode, amount] of [["shadow", 4000], ["enforced", 6000], ["enforced", 50000]] as const) {
    const { root, connector: c } = setup();
    try {
      const req = createSyntheticPluginRequest(mode); req.proposedAction.totalAmount = amount; req.amountMinorUnits = amount * 100;
      const a = await c.approve(req); a.decision.outcome = "ACCEPT"; a.decision.authorising = true;
      assert.equal((await c.execute(a.evaluationId, req)).reason, "EXECUTION_AUTHORITY_MISSING"); assert.equal(c.getDestinationRecords().length, 0);
    } finally { c.close(); rmSync(root, { recursive: true, force: true }); }
  }
});
test("exclusive destination lock and corrupt state fail closed", () => {
  const { root, connector: c } = setup();
  try {
    assert.throws(() => new AtgPurchaseOrderConnector({ stateDirectory: root }), /EEXIST/);
    c.close(); writeFileSync(join(root, "destination.json"), "{}");
    assert.throws(() => new AtgPurchaseOrderConnector({ stateDirectory: root }));
  } finally { c.close(); rmSync(root, { recursive: true, force: true }); }
});
test("destination payload substitution is caught against the approved request after restart", async () => {
  const { root, connector: c } = setup(); let reopened: AtgPurchaseOrderConnector | undefined;
  try {
    const req = createSyntheticPluginRequest("enforced"); const a = await c.approve(req);
    await c.execute(a.evaluationId, req, { fault: "timeout_after_commit" }); c.close();
    const path = join(root, "destination.json"); const wrapper = JSON.parse(readFileSync(path, "utf8"));
    wrapper.payload.records[0].proposedAction.supplierId = "changed-destination";
    wrapper.digest = createCanonicalPayloadHash(wrapper.payload); writeFileSync(path, JSON.stringify(wrapper));
    reopened = new AtgPurchaseOrderConnector({ stateDirectory: root });
    assert.equal(reopened.reconcile(a.evaluationId).reason, "DESTINATION_EVIDENCE_MISMATCH");
  } finally { reopened?.close(); c.close(); rmSync(root, { recursive: true, force: true }); }
});
test("caller findings, executor injection, unknown handles and malformed requests cannot grant execution", async () => {
  const { root, connector: c } = setup();
  try {
    await assert.rejects(c.approve({}));
    const req = createSyntheticPluginRequest("enforced"); const a = await c.approve(req);
    assert.equal((await c.execute("unknown", req)).outcome, "REJECTED");
    assert.equal((await c.execute(a.evaluationId, {})).reason, "REQUEST_INVALID");
    assert.equal((await c.execute(a.evaluationId, req, { executor: () => {} } as never)).reason, "EXECUTION_OPTIONS_INVALID");
    assert.equal(c.reconcile(a.evaluationId, { finding: "confirmed_executed" } as never).reason, "RECONCILIATION_OPTIONS_INVALID");
    assert.equal(c.getDestinationRecords().length, 0);
  } finally { c.close(); rmSync(root, { recursive: true, force: true }); }
});
