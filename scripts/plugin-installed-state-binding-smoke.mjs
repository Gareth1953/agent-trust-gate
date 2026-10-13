import assert from 'node:assert/strict';
import { resolve, join } from 'node:path';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { AtgPurchaseOrderConnector, createSyntheticPluginRequest, STANDALONE_PLUGIN_VERSION } from '@agent-trust-gate/plugin';
const require = createRequire(import.meta.url);
const exact = require(resolve('node_modules/@agent-trust-gate/plugin/dist/src/exact-action-gatepass.js'));
const { createCanonicalPayloadHash } = require(resolve('node_modules/@agent-trust-gate/plugin/dist/src/local-signed-proof.js'));
const metadata = JSON.parse(readFileSync(resolve('node_modules/@agent-trust-gate/plugin/package.json'), 'utf8'));
assert.equal(metadata.version, STANDALONE_PLUGIN_VERSION);
const verify = (pass, receipt) => {
  const { actionEnvelopeVersion, canonicalizationVersion, digestAlgorithm, actionDigest, ...action } = pass.action;
  const nonce = new exact.InMemoryNonceStore(); nonce.registerUnused(pass);
  return exact.verifyExactActionAtExecution(pass, action, exact.createVerifierContext({ gatePass: pass, decisionReceipt: receipt }, nonce,
    { trustedClock: exact.createFixedTrustedClock('2026-09-02T09:01:00.000Z') }));
};
const cases = [];
for (const name of ['exact', 'changed-state', 'commit-race', 'lost-ack', 'invalid-recovery']) {
  const directory = resolve('installed-binding-' + name);
  let connector = new AtgPurchaseOrderConnector({ stateDirectory: directory });
  try {
    const request = createSyntheticPluginRequest('enforced'); const approval = await connector.approve(request);
    const signed = approval.decision.gatePass.action.canonicalArguments.businessStateBinding;
    assert.equal(signed.businessStateDigest, approval.approvedBusinessStateDigest);
    assert.equal(signed.businessStateDigest, createCanonicalPayloadHash(approval.businessState));
    assert.equal(verify(approval.decision.gatePass, approval.decision.policyDecisionReceipt).verified, true);
    const altered = structuredClone(approval.decision.gatePass);
    altered.action.canonicalArguments.businessStateBinding.businessStateDigest = 'sha256:' + '0'.repeat(64);
    altered.action.actionDigest = exact.recomputeCanonicalActionDigest(altered.action);
    assert.equal(verify(altered, approval.decision.policyDecisionReceipt).signatureValid, false);
    if (name === 'changed-state') {
      connector.updateBusinessState({ supplierBankReference: 'fixture-bank-B' });
      assert.equal((await connector.execute(approval.evaluationId, request)).reason, 'BUSINESS_STATE_CHANGED_REAPPROVAL_REQUIRED');
      assert.equal(connector.getDestinationRecords().length, 0);
      const fresh = createSyntheticPluginRequest('enforced'); const newer = await connector.approve(fresh);
      assert.notEqual(newer.approvedBusinessStateDigest, approval.approvedBusinessStateDigest);
      assert.equal((await connector.execute(newer.evaluationId, fresh)).outcome, 'EXECUTED');
    } else if (name === 'commit-race') {
      assert.equal((await connector.execute(approval.evaluationId, request, { fault: 'business_state_change_before_commit' })).outcome, 'UNKNOWN');
      assert.equal(connector.getDestinationRecords().length, 0);
      assert.equal(JSON.parse(readFileSync(join(directory, 'authority.json'), 'utf8')).exposureEntries[0].status, 'UNKNOWN');
      assert.equal(connector.reconcile(approval.evaluationId).outcome, 'NOT_EXECUTED');
      const fresh = createSyntheticPluginRequest('enforced'); const newer = await connector.approve(fresh);
      assert.equal((await connector.execute(newer.evaluationId, fresh)).outcome, 'EXECUTED');
    } else if (name === 'lost-ack') {
      assert.equal((await connector.execute(approval.evaluationId, request, { fault: 'timeout_after_commit' })).outcome, 'UNKNOWN');
      assert.equal(JSON.parse(readFileSync(join(directory, 'authority.json'), 'utf8')).exposureEntries[0].status, 'UNKNOWN');
      assert.equal((await connector.execute(approval.evaluationId, request)).outcome, 'REJECTED');
      connector.close(); connector = new AtgPurchaseOrderConnector({ stateDirectory: directory });
      const recovered = connector.reconcile(approval.evaluationId);
      assert.equal(recovered.outcome, 'EXECUTED'); assert.equal(recovered.evidence.signedBusinessStateVerified, true);
      assert.equal(connector.getDestinationRecords().length, 1);
    } else if (name === 'invalid-recovery') {
      assert.equal((await connector.execute(approval.evaluationId, request, { fault: 'timeout_before_commit' })).outcome, 'UNKNOWN');
      const path = join(directory, 'journal.json'); const wrapper = JSON.parse(readFileSync(path, 'utf8'));
      wrapper.payload.attempts[0].businessStateBinding.businessStateDigest = 'sha256:' + '0'.repeat(64);
      wrapper.digest = createCanonicalPayloadHash(wrapper.payload); writeFileSync(path, JSON.stringify(wrapper));
      assert.equal(connector.reconcile(approval.evaluationId).outcome, 'UNKNOWN');
      assert.equal(JSON.parse(readFileSync(join(directory, 'authority.json'), 'utf8')).exposureEntries[0].status, 'UNKNOWN');
      assert.equal(connector.getDestinationRecords().length, 0);
    } else {
      const result = await connector.execute(approval.evaluationId, request);
      assert.equal(result.outcome, 'EXECUTED'); assert.equal(result.evidence.signedBusinessStateVerified, true);
      assert.equal(result.evidence.approvedBusinessStateDigest, approval.approvedBusinessStateDigest);
      assert.equal((await connector.execute(approval.evaluationId, request)).outcome, 'REJECTED');
      assert.equal(connector.getDestinationRecords().length, 1);
    }
    cases.push({ name, passed: true });
  } finally { connector.close(); }
}
console.log(JSON.stringify({ installedVersion: metadata.version, passed: true, cases, syntheticOnly: true }));
