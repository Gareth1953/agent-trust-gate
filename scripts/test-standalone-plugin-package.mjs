import assert from 'node:assert/strict';
import { CommandExecutionError, runCheckedCommand } from './checked-command.mjs';
import { mkdtempSync, writeFileSync, rmSync, readFileSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const scratch = mkdtempSync(join(tmpdir(), 'atg-plugin-installed-'));
function run(command, args, cwd = root, input) {
  return runCheckedCommand(command, args, { cwd, input });
}
try {
  // npm supplies its CLI path; call Node directly and keep its cache in scratch.
  const npm = process.env.npm_execpath;
  if (!npm) throw new Error('Run this check with npm run test:plugin.');
  const runNpm = (args, cwd = root) => run(process.execPath, [npm, '--cache', join(scratch, 'npm-cache'), ...args], cwd);
  const args = process.argv.slice(2);
  if (args.length !== 0 && (args.length !== 2 || args[0] !== '--archive')) throw new Error('Use --archive PATH or no arguments.');
  let archive;
  if (args.length === 2) archive = resolve(args[1]);
  else {
    run(process.execPath, ['scripts/build-standalone-plugin.mjs']);
    const packed = JSON.parse(runNpm(['pack', './plugin-build/package', '--pack-destination', './plugin-build', '--json', '--silent']))[0];
    assert.ok(packed.files.every(file => !/(^|\/)(test|node_modules|state\.json)(\/|$)/.test(file.path)));
    archive = join(root, 'plugin-build', packed.filename);
  }
  writeFileSync(join(scratch, 'package.json'), JSON.stringify({ name: 'atg-install-smoke', private: true, type: 'module' }));
  runNpm(['install', '--offline', '--ignore-scripts', '--no-audit', '--no-fund', archive], scratch);
  const cli = join(scratch, 'node_modules/@agent-trust-gate/plugin/dist/src/standalone-plugin-cli.js');
  const demo = JSON.parse(run(process.execPath, [cli, 'demo', '--state', join(scratch, 'cli-state.json')], scratch));
  assert.equal(demo.passed, true);
  const orderDemo = JSON.parse(run(process.execPath, [cli, 'order-demo', '--state', join(scratch, 'order-demo')], scratch));
  assert.equal(orderDemo.passed, true);
  assert.equal(orderDemo.capabilities.liveConnector, false);
  assert.equal(demo.capabilities.liveExecutionAvailable, false);
  writeFileSync(join(scratch, 'sdk.mjs'), `
    import assert from 'node:assert/strict';
    import { resolve } from 'node:path';
    import { AtgStandalonePlugin, createSyntheticPluginRequest } from '@agent-trust-gate/plugin';
    const plugin = new AtgStandalonePlugin({ statePath: resolve('sdk-state.json') });
    const request = createSyntheticPluginRequest('enforced');
    const result = await plugin.evaluate(request);
    assert.equal(result.decision.outcome, 'ACCEPT');
    const changed = structuredClone(request); changed.proposedAction.quantity += 1;
    assert.equal((await plugin.executeSynthetic(result.evaluationId, changed)).adapterReached, false);
    assert.equal((await plugin.executeSynthetic(result.evaluationId, request)).outcome, 'EXECUTED');
    assert.equal((await plugin.executeSynthetic(result.evaluationId, request)).adapterReached, false);
  `);
  run(process.execPath, ['sdk.mjs'], scratch);
  if (Number(process.versions.node.split('.')[0]) >= 24) {
  writeFileSync(join(scratch, 'shared-sdk.mjs'), `
    import assert from 'node:assert/strict';
    import { resolve } from 'node:path';
    import { SharedPurchaseOrder } from '@agent-trust-gate/plugin/shared-purchase-order';
    import { createSyntheticPluginRequest } from '@agent-trust-gate/plugin';
    const directory = resolve('shared-sdk-state');
    SharedPurchaseOrder.initialise(directory);
    const first = new SharedPurchaseOrder({ stateDirectory: directory });
    const second = new SharedPurchaseOrder({ stateDirectory: directory });
    const request = createSyntheticPluginRequest('enforced');
    const a = await first.approve(request);
    const claim = second.claim(a.approvalId, request);
    assert.ok(claim);
    assert.equal(first.claim(a.approvalId, request), null);
    assert.equal(second.submit(claim).outcome, 'EXECUTED');
    assert.equal(first.reconcile(a.approvalId).outcome, 'EXECUTED');
    assert.equal(second.submit(claim).outcome, 'REJECTED');
    assert.equal(first.getDestinationRecords().length, 1);
    first.close(); second.close();
  `);
  run(process.execPath, ['shared-sdk.mjs'], scratch);
  console.log('Optional shared SQLite SDK installed smoke passed (Node 24+).');
  const packagedDemo = JSON.parse(run(process.execPath, [join(scratch, 'node_modules/@agent-trust-gate/plugin/scripts/shared-worker-demo.mjs'), '--state', join(scratch, 'packaged-workers')], scratch));
  assert.equal(packagedDemo.passed, true);
  assert.equal(packagedDemo.cases.length, 7);
  assert.deepEqual(packagedDemo.cases.map(c => c.id), ['approval-competition','shared-budget-600000','shared-budget-1000000','crash-after-reservation','crash-after-commit','delayed-worker','recovery-fence-crash']);
  assert.equal(packagedDemo.cases[0].final.writes, 1);
  assert.equal(packagedDemo.cases[1].reserved.reservedMinorUnits, 400000);
  assert.equal(packagedDemo.cases[2].reserved.reservedMinorUnits, 800000);
  assert.equal(packagedDemo.cases[6].stale.reason, 'DESTINATION_FENCED');
  if (process.env.ATG_PACKAGED_EVIDENCE_PATH) writeFileSync(resolve(process.env.ATG_PACKAGED_EVIDENCE_PATH), JSON.stringify(packagedDemo, null, 2) + '\n', { flag: 'wx' });
  console.log('Exact archive packaged process demonstration: seven cases passed.');
  } else {
    writeFileSync(join(scratch, 'unsupported-shared-sdk.mjs'), `
      import assert from 'node:assert/strict';
      await assert.rejects(import('@agent-trust-gate/plugin/shared-purchase-order'), /ATG_SHARED_WORKER_REQUIRES_NODE_24/);
      const legacy = await import('@agent-trust-gate/plugin');
      assert.equal(legacy.createSyntheticPluginRequest('enforced').mode, 'enforced');
    `);
    run(process.execPath, ['unsupported-shared-sdk.mjs'], scratch);
    assert.throws(() => run(process.execPath, [join(scratch, 'node_modules/@agent-trust-gate/plugin/scripts/shared-worker-demo.mjs'), '--state', join(scratch, 'unsupported-shared-state')], scratch), /ATG_SHARED_WORKER_REQUIRES_NODE_24/);
    console.log('Optional shared SDK and demo reject unsupported runtime clearly; legacy import still works.');
  }
  copyFileSync(join(root, 'scripts/plugin-installed-state-binding-smoke.mjs'), join(scratch, 'state-binding-sdk.mjs'));
  const bindingSmoke = JSON.parse(run(process.execPath, ['state-binding-sdk.mjs'], scratch));
  assert.equal(bindingSmoke.passed, true);
  assert.equal(bindingSmoke.cases.length, 5);
  const request = JSON.parse(run(process.execPath, [cli, 'request'], scratch));
  const lines = [
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'installed-smoke', version: '1' } } },
    { jsonrpc: '2.0', method: 'notifications/initialized', params: {} },
    { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} },
    { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'atg.evaluate_action', arguments: request } },
  ].map(line => JSON.stringify(line)).join('\n') + '\n';
  const replies = run(process.execPath, [cli, 'mcp', '--state', join(scratch, 'mcp-state.json')], scratch, lines)
    .trim().split('\n').map(line => JSON.parse(line));
  assert.equal(replies.length, 3);
  assert.equal(replies[0].result.protocolVersion, '2025-06-18');
  assert.deepEqual(replies[1].result.tools.map(tool => tool.name), ['atg.evaluate_action']);
  assert.equal(replies[2].result.structuredContent.outcome, 'SHADOW');
  assert.equal(replies[2].result.structuredContent.gatePassIssued, false);
  assert.equal(readFileSync(join(scratch, 'node_modules/@agent-trust-gate/plugin/package.json'), 'utf8').includes('"private": true'), true);
  console.log(JSON.stringify({ archive, runtime: process.version, installedVersion: bindingSmoke.installedVersion, stateBindingCases: bindingSmoke.cases, passed: true }));
  console.log('Installed archive: SDK, signed state binding/tampering/commit race/recovery, CLI and MCP shadow evaluation passed outside repository.');
} catch (error) {
  process.exitCode = error instanceof CommandExecutionError ? error.exitCode : 1;
  console.error(error);
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
