import assert from 'node:assert/strict';
import { CommandExecutionError, runCheckedCommand } from './checked-command.mjs';
import { mkdtempSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
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
  run(process.execPath, ['scripts/build-standalone-plugin.mjs']);
  const packed = JSON.parse(runNpm(['pack', './plugin-build/package', '--pack-destination', './plugin-build', '--json', '--silent']))[0];
  assert.ok(packed.files.every(file => !/(^|\/)(test|node_modules|state\.json)(\/|$)/.test(file.path)));
  const archive = join(root, 'plugin-build', packed.filename);
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
  console.log('Installed archive: SDK gated execution/reuse, changed request, CLI purchase-order reconciliation and MCP shadow evaluation passed outside repository.');
} catch (error) {
  process.exitCode = error instanceof CommandExecutionError ? error.exitCode : 1;
  console.error(error);
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
