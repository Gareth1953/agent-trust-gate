#!/usr/bin/env node
import assert from 'node:assert/strict';
import { fork } from 'node:child_process';
import { once } from 'node:events';
import { mkdirSync, writeFileSync } from 'node:fs';
import { isAbsolute, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
if (args.length === 0 || (args.length === 1 && args[0] === '--help')) {
  console.log('ATG packaged multi-worker synthetic demonstration (Node 24+)\nUse: atg-multi-worker --state ABSOLUTE_NEW_DIRECTORY\nCreates fresh SQLite v2 evaluation state and results.json; preserves it for inspection.\nOne Windows machine, one synthetic order per scenario, fixture authority and fixed clock. No external execution or independent evidence.');
} else {
  try {
    if (Number(process.versions.node.split('.')[0]) < 24) throw new Error('ATG_SHARED_WORKER_REQUIRES_NODE_24: packaged multi-worker demonstration requires Node 24+; legacy atg-plugin remains Node 20 compatible.');
    if (args.length !== 2 || args[0] !== '--state' || !isAbsolute(args[1])) throw new Error('Use --state with an absolute NEW host-owned directory. Existing state is never reset or migrated.');
    await demonstrate(args[1]);
  } catch (error) { console.error(String(error)); process.exitCode = 1; }
}

async function demonstrate(root) {
  const { SharedPurchaseOrder } = await import('../dist/src/shared-purchase-order.js');
  const { createSyntheticPluginRequest, STANDALONE_PLUGIN_VERSION } = await import('../dist/src/standalone-plugin.js');
  const { DEFAULT_AGGREGATE_EXPOSURE_RULE } = await import('../dist/src/durable-action-lifecycle.js');
  mkdirSync(root, { mode: 0o700 }); // Exclusive; never reuse or remove an existing directory.
  const cases = [];
  const workers = new Set();
  const childPath = join(dirname(fileURLToPath(import.meta.url)), 'multi-worker-child.mjs');
  async function open(directory) {
    const child = fork(childPath, [directory], { stdio: ['pipe', 'pipe', 'pipe', 'ipc'] });
    workers.add(child);
    let pending, barrierPending, stderr = '', buffer = '';
    const queue = [], barriers = [];
    child.stderr.on('data', d => { stderr += d; });
    child.on('message', m => { if (pending) { const p = pending; pending = null; p.resolve(m); } else queue.push(m); });
    child.stdout.on('data', d => {
      buffer += d;
      let index;
      while ((index = buffer.indexOf('\n')) >= 0) {
        const m = JSON.parse(buffer.slice(0, index)); buffer = buffer.slice(index + 1);
        if (barrierPending) { barrierPending(m); barrierPending = null; } else barriers.push(m);
      }
    });
    child.on('exit', (code, signal) => { if (pending) { pending.reject(new Error('Worker exited ' + code + '/' + signal + ': ' + stderr)); pending = null; } workers.delete(child); });
    const next = () => queue.length ? Promise.resolve(queue.shift()) : new Promise((resolve, reject) => {
      const timer = setTimeout(() => { pending = null; reject(new Error('IPC barrier timeout: ' + stderr)); }, 15000);
      pending = { resolve: m => { clearTimeout(timer); resolve(m); }, reject: e => { clearTimeout(timer); reject(e); } };
    });
    const ready = await next(); assert.equal(ready.phase, 'ready', ready.error);
    return {
      async call(op, fields = {}) { const response = next(); child.send({ op, ...fields }); const m = await response; assert.equal(m.phase, op === 'close' ? 'closed' : op); if (m.error) throw new Error(m.error); return m.value; },
      barrier() { return barriers.length ? Promise.resolve(barriers.shift()) : new Promise((resolve, reject) => { const timer = setTimeout(() => reject(new Error('Fault barrier timeout')), 15000); barrierPending = m => { clearTimeout(timer); resolve(m); }; }); },
      async kill() { const exited = once(child, 'exit'); child.kill('SIGKILL'); await exited; },
      async close() { const exited = once(child, 'exit'); await this.call('close'); await exited; },
    };
  }
  async function setup(id, limit = 1000000) {
    const directory = join(root, id);
    SharedPurchaseOrder.initialise(directory, { ...DEFAULT_AGGREGATE_EXPOSURE_RULE, maximumAggregateMinorUnits: limit });
    return { directory, first: await open(directory), second: await open(directory) };
  }
  function amounts(snapshot) {
    const sum = status => snapshot.authority.exposureEntries.filter(e => status.includes(e.status)).reduce((n, e) => n + e.amountMinorUnits, 0);
    return { writes: snapshot.records.length, heldMinorUnits: sum(['OUTSTANDING','RESERVED','COMMITTED','UNKNOWN']), reservedMinorUnits: sum(['RESERVED']), committedMinorUnits: sum(['COMMITTED']), lifecycleStatuses: snapshot.authority.lifecycles.map(l => l.status) };
  }
  async function inspect(worker) { return amounts(await worker.call('snapshot')); }
  async function approval(worker) { const request = createSyntheticPluginRequest('enforced'); const approved = await worker.call('approve', { request }); assert.ok(approved.approvalId); return { request, id: approved.approvalId }; }
  try {
    {
      const { first, second } = await setup('approval-competition'); const a = await approval(first);
      const claims = await Promise.all([first.call('claim', a), second.call('claim', a)]); assert.equal(claims.filter(Boolean).length, 1);
      const reserved = await inspect(first); assert.equal(reserved.reservedMinorUnits, 400000);
      const winner = claims[0] ? first : second;
      assert.equal((await winner.call('submit')).outcome, 'EXECUTED'); assert.equal((await winner.call('ack')).outcome, 'EXECUTED');
      assert.equal((await winner.call('submit', { claim: claims.find(Boolean) })).outcome, 'REJECTED');
      const final = await inspect(second); assert.equal(final.writes, 1);
      cases.push({ id: 'approval-competition', passed: true, claimCount: 1, reserved, final });
      await first.close(); await second.close();
    }
    for (const limit of [600000, 1000000]) {
      const { first, second } = await setup('shared-budget-' + limit, limit);
      const requests = [createSyntheticPluginRequest('enforced'), createSyntheticPluginRequest('enforced')];
      const approvals = await Promise.all([first.call('approve', { request: requests[0] }), second.call('approve', { request: requests[1] })]);
      const accepted = limit === 600000 ? 1 : 2; assert.equal(approvals.filter(a => a.approvalId).length, accepted);
      const issued = await inspect(first); assert.equal(issued.writes, 0); assert.equal(issued.heldMinorUnits, accepted * 400000);
      const claims = await Promise.all([first.call('claim', { id: approvals[0].approvalId, request: requests[0] }), second.call('claim', { id: approvals[1].approvalId, request: requests[1] })]);
      assert.equal(claims.filter(Boolean).length, accepted);
      const reserved = await inspect(second); assert.equal(reserved.writes, 0); assert.equal(reserved.reservedMinorUnits, accepted * 400000);
      cases.push({ id: 'shared-budget-' + limit, passed: true, limitMinorUnits: limit, approvalOutcomes: approvals.map(a => a.decision.outcome), issued, reserved });
      await first.close(); await second.close();
    }
    for (const committed of [false, true]) {
      const { directory, first, second } = await setup(committed ? 'crash-after-commit' : 'crash-after-reservation');
      const a = await approval(first); const claim = await first.call('claim', a); assert.ok(claim);
      if (committed) assert.equal((await first.call('submit')).outcome, 'EXECUTED');
      await first.kill(); const restarted = await open(directory);
      const beforeRecovery = await inspect(restarted); assert.equal(beforeRecovery.reservedMinorUnits, 400000);
      assert.equal(await restarted.call('claim', a), null);
      const recovery = await restarted.call('reconcile', { id: a.id }); assert.equal(recovery.outcome, committed ? 'EXECUTED' : 'NOT_EXECUTED');
      assert.equal((await restarted.call('submit', { claim })).outcome, 'REJECTED');
      const final = await inspect(second); assert.equal(final.writes, committed ? 1 : 0); assert.equal(final.heldMinorUnits, committed ? 400000 : 0);
      cases.push({ id: committed ? 'crash-after-commit' : 'crash-after-reservation', passed: true, beforeRecovery, recovery, final });
      await restarted.close(); await second.close();
    }
    {
      const { first, second } = await setup('delayed-worker'); const a = await approval(first); await first.call('claim', a);
      const beforeRecovery = await inspect(second); const recovery = await second.call('reconcile', { id: a.id }); assert.equal(recovery.outcome, 'NOT_EXECUTED');
      const delayed = await first.call('submit'); assert.equal(delayed.reason, 'STALE_AUTHORITY');
      const final = await inspect(second); assert.equal(final.writes, 0); assert.equal(final.heldMinorUnits, 0);
      cases.push({ id: 'delayed-worker', passed: true, beforeRecovery, recovery, delayed, final });
      await first.close(); await second.close();
    }
    {
      const { directory, first, second } = await setup('recovery-fence-crash'); const a = await approval(first); const claim = await first.call('claim', a);
      const response = second.call('reconcile', { id: a.id, faultStage: 'destination_fenced' }); const rejected = assert.rejects(response, /Worker exited/);
      assert.equal((await second.barrier()).stage, 'destination_fenced'); await second.kill(); await rejected;
      const beforeRecovery = await inspect(first); assert.equal(beforeRecovery.reservedMinorUnits, 400000);
      const stale = await first.call('submit', { claim }); assert.equal(stale.reason, 'DESTINATION_FENCED');
      const restarted = await open(directory); const recovery = await restarted.call('reconcile', { id: a.id }); assert.equal(recovery.outcome, 'NOT_EXECUTED');
      const final = await inspect(first); assert.equal(final.writes, 0); assert.equal(final.heldMinorUnits, 0);
      cases.push({ id: 'recovery-fence-crash', passed: true, beforeRecovery, stale, recovery, final });
      await first.close(); await restarted.close();
    }
    const evidence = { version: 'atg.packaged-multi-worker-evidence.v1', pluginVersion: STANDALONE_PLUGIN_VERSION, capturedAt: new Date().toISOString(), platform: process.platform, node: process.version, command: 'atg-multi-worker --state ABSOLUTE_NEW_DIRECTORY', boundary: { localOnly: true, syntheticOnly: true, multipleProcessesOneMachine: true, storage: 'SQLite shared v2', fixedSyntheticClock: '2026-09-02T09:01:00.000Z', oneOrderPerScenario: true, sameHostDestinationEvidence: true, independentEvidence: false, multiMachineSafety: false, productionReady: false }, passed: cases.every(c => c.passed), cases };
    writeFileSync(join(root, 'results.json'), JSON.stringify(evidence, null, 2) + '\n', { flag: 'wx' });
    console.log(JSON.stringify(evidence, null, 2));
  } finally {
    for (const child of [...workers]) { const exited = once(child, 'exit'); child.kill('SIGKILL'); await exited; }
  }
}
