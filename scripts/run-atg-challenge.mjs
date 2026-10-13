import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AtgPurchaseOrderConnector, createSyntheticPluginRequest, STANDALONE_PLUGIN_VERSION } from '../dist/src/standalone-plugin.js';

const root = mkdtempSync(join(tmpdir(), 'atg-challenge-'));
const cases = [];
try {
  for (const id of ['changed-details', 'reused-approval', 'lost-acknowledgement']) {
    const connector = new AtgPurchaseOrderConnector({ stateDirectory: join(root, id) });
    try {
      const request = createSyntheticPluginRequest('enforced');
      const approval = await connector.approve(request);
      let first = null, reconciliation = null;
      if (id === 'changed-details') connector.updateBusinessState({ supplierBankReference: 'fixture-bank-B' });
      if (id === 'reused-approval') first = await connector.execute(approval.evaluationId, request);
      const execution = await connector.execute(approval.evaluationId, request,
        { fault: id === 'lost-acknowledgement' ? 'timeout_after_commit' : 'none' });
      if (id === 'lost-acknowledgement') reconciliation = connector.reconcile(approval.evaluationId);
      const recordCount = connector.getDestinationRecords().length;
      const passed = id === 'changed-details'
        ? execution.reason === 'BUSINESS_STATE_CHANGED_REAPPROVAL_REQUIRED' && recordCount === 0
        : id === 'reused-approval'
          ? first?.outcome === 'EXECUTED' && execution.outcome === 'REJECTED' && recordCount === 1
          : execution.outcome === 'UNKNOWN' && reconciliation?.outcome === 'EXECUTED'
            && reconciliation.evidence?.authorisedRequestMatchesRecordedOutcome === true && reconciliation.evidence?.signedBusinessStateVerified === true && recordCount === 1;
      cases.push({ id, passed, approval: { businessState: approval.businessState, approvedBusinessStateDigest: approval.approvedBusinessStateDigest,
        businessStateBinding: approval.businessStateBinding, gatePass: approval.decision.gatePass, decisionReceipt: approval.decision.policyDecisionReceipt }, decisionOutcome: approval.decision.outcome, first, execution, reconciliation, recordCount });
    } finally { connector.close(); }
  }
  const result = { version: 'atg.challenge.recorded.v1', pluginVersion: STANDALONE_PLUGIN_VERSION, capturedAt: new Date().toISOString(),
    boundary: { localOnly: true, syntheticOnly: true, browserRunsAgents: false, productionReady: false,
      independentExecutionCapture: false, customerAgentTested: false, certification: false },
    command: 'npm ci --ignore-scripts && npm run demo:challenge',
    passed: cases.every(c => c.passed), cases };
  if (!result.passed) throw new Error('ATG_CHALLENGE_FAILED');
  if (process.argv.includes('--write')) writeFileSync('discovery-site/challenge-results.json', JSON.stringify(result, null, 2) + '\n');
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
} finally { rmSync(root, { recursive: true, force: true }); }
