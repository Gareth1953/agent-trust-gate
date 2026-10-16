// Windows review harness: installed Edge, disposable profile, loopback fictional state only.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import demoModule from '../dist/src/payeeshield-demo-server.js';

assert.equal(process.platform, 'win32');
const output = resolve(process.env.ATG_BROWSER_OUTPUT || 'reports/mission-05/windows/browser');
await mkdir(output, { recursive: true });
const profile = await mkdtemp(join(tmpdir(), 'atg-mission05-edge-'));
const evidence = { profile, node: process.version, results: [], errors: [], externalRequests: [] };
let socket, child, sequence = 0;
const pending = new Map();
function call(method, params = {}, sessionId) {
  return new Promise((accept, reject) => {
    const id = ++sequence;
    const timer = setTimeout(() => { pending.delete(id); reject(Error('CDP timeout: ' + method)); }, 15000);
    pending.set(id, { accept, reject, timer });
    socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
}
try {
  child = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', [
    '--headless=new', '--remote-debugging-address=127.0.0.1', '--remote-debugging-port=0',
    '--user-data-dir=' + profile, '--no-first-run', '--no-default-browser-check',
    '--disable-background-networking', 'about:blank',
  ], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  let launchError;
  child.on('error', e => { launchError = e; });
  let portFile;
  for (let i = 0; i < 80; i++) {
    if (launchError) throw launchError;
    try { portFile = await readFile(join(profile, 'DevToolsActivePort'), 'utf8'); break; } catch { await delay(250); }
  }
  assert.ok(portFile, 'Edge must start');
  const [port, wsPath] = portFile.trim().split(/\r?\n/);
  socket = new WebSocket('ws://127.0.0.1:' + port + wsPath);
  await new Promise((ok, fail) => { socket.addEventListener('open', ok, { once: true }); socket.addEventListener('error', fail, { once: true }); });
  socket.addEventListener('message', event => {
    const m = JSON.parse(event.data);
    if (m.id && pending.has(m.id)) {
      const p = pending.get(m.id); pending.delete(m.id); clearTimeout(p.timer);
      if (m.error) p.reject(Error(JSON.stringify(m.error))); else p.accept(m.result);
    }
    if (m.method === 'Runtime.exceptionThrown') evidence.errors.push(m.params.exceptionDetails);
    if (m.method === 'Network.requestWillBeSent' && !m.params.request.url.startsWith('http://127.0.0.1:')) evidence.externalRequests.push(m.params.request.url);
  });
  evidence.browser = await call('Browser.getVersion');
  for (const width of [1440, 390, 320]) {
    // Each viewport gets a new synthetic process-local destination; no existing held state is touched.
    const server = demoModule.createPayeeShieldDemoServer();
    await new Promise(ok => server.listen(0, '127.0.0.1', ok));
    const { targetId } = await call('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await call('Target.attachToTarget', { targetId, flatten: true });
    const cdp = (method, params) => call(method, params, sessionId);
    const evaluate = async expression => {
      const r = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (r.exceptionDetails) throw Error(JSON.stringify(r.exceptionDetails));
      return r.result.value;
    };
    const wait = async expression => {
      for (let i = 0; i < 100; i++) { if (await evaluate(expression)) return; await delay(30); }
      throw Error('Timed out: ' + expression);
    };
    const click = async id => {
      assert.equal(await evaluate(`document.getElementById('${id}').disabled`), false, id + ' enabled');
      await evaluate(`document.getElementById('${id}').click()`);
      await wait('!busy');
    };
    const set = (id, value) => evaluate(`{const e=document.getElementById(${JSON.stringify(id)});e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('input',{bubbles:true}));}`);
    const status = () => evaluate("document.getElementById('status').textContent");
    const shown = () => evaluate("JSON.parse(document.getElementById('evidence').textContent)");
    const capture = async name => {
      const metrics = await cdp('Page.getLayoutMetrics');
      const png = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width, height: Math.ceil(metrics.cssContentSize.height), scale: 1 } });
      await writeFile(join(output, `${width}-${name}.png`), Buffer.from(png.data, 'base64'));
    };
    try {
      await cdp('Page.enable'); await cdp('Runtime.enable'); await cdp('Network.enable');
      await cdp('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width !== 1440 });
      await cdp('Page.navigate', { url: 'http://127.0.0.1:' + server.address().port });
      await wait("document.getElementById('evaluate') && !document.getElementById('evaluate').disabled");
      assert.equal(await evaluate("document.querySelectorAll('#scenario option').length"), 16);
      const copy = await evaluate('document.body.innerText');
      for (const text of ['No bank verification', 'No durable restart recovery', 'fixed test clock', 'neither encrypted nor independently authenticated']) assert.ok(copy.includes(text), text);
      const checks = [];
      for (const [amount, outcome] of [['45000', 'BLOCK'], ['20000', 'REVIEW']]) {
        await set('amount', amount); await click('evaluate'); assert.ok((await status()).startsWith(outcome));
        const a = await shown(); assert.equal(a.approvalId, null); assert.equal(a.executionAvailable, false);
        assert.equal(await evaluate("document.getElementById('execute').disabled"), true); checks.push(outcome);
      }
      await set('amount', '8500'); await click('evaluate');
      assert.equal((await shown()).outcome, 'GATEPASS_ISSUED');
      assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth || document.body.scrollWidth > innerWidth'), false);
      await capture('approved');
      const changed = await evaluate("call('execute',{approvalId:handle,request:{...approvedRequest,amountMinorUnits:850001},fault:'none'})");
      assert.equal(changed.reason, 'EXACT_REQUEST_CHANGED'); assert.equal(changed.snapshot.record, null);
      checks.push('server refuses changed request');
      for (const [id, value, original] of [['amount','8501','8500'], ['supplier','SUP-10483','SUP-10482'], ['ending','7320','7319'], ['scenario','changed_supplier','valid_exact_change']]) {
        await set(id, value); assert.equal(await evaluate("document.getElementById('execute').disabled"), true);
        assert.match(await status(), /stale/); await set(id, original); await click('evaluate');
      }
      checks.push('all input changes discard authority');
      await click('editState'); await click('execute'); assert.equal((await shown()).reason, 'BUSINESS_STATE_CHANGED'); checks.push('stale state');
      await click('evaluate'); await click('revoke'); assert.equal((await shown()).revoked, true);
      assert.equal(await evaluate("document.getElementById('execute').disabled"), true); checks.push('revocation');
      assert.equal((await evaluate("call('execute',{approvalId:handle,request:approvedRequest,fault:'none'})")).reason, 'AUTHORITY_USED_OR_REVOKED_NO_RETRY');
      await click('evaluate'); await set('fault','expired'); await click('execute'); assert.equal((await shown()).outcome, 'REJECTED');
      assert.equal((await shown()).snapshot.record, null); checks.push('expiry');
      await click('evaluate'); await set('fault','lost_ack'); await click('execute'); assert.equal((await shown()).outcome, 'UNKNOWN');
      const unknown = await shown();
      const uncertainAttempt = await evaluate('({approvalId:handle,request:approvedRequest,fault:"none"})');
      assert.equal(unknown.automaticRetryPermitted, false);
      assert.equal(await evaluate("document.getElementById('execute').disabled"), true);
      await set('amount', 'invalid'); await click('evaluate');
      // A validation error must not strand the separate UNKNOWN reconciliation handle.
      assert.equal(await evaluate("document.getElementById('reconcile').disabled"), false, 'UNKNOWN reconciliation survives invalid evaluation');
      await click('reconcile'); assert.equal((await shown()).outcome, 'EXECUTED');
      assert.equal((await shown()).independentDestinationEvidence, false);
      assert.equal((await shown()).snapshot.state.version, 3);
      checks.push('lost acknowledgement and reconciliation after validation error');
      // Check replay and server binding independently of disabled UI buttons.
      const replay = await evaluate(`call('execute',${JSON.stringify(uncertainAttempt)})`);
      assert.equal(replay.outcome, 'REJECTED'); assert.equal(replay.snapshot.state.version, 3); checks.push('replay refused');
      assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth || document.body.scrollWidth > innerWidth'), false);
      await capture('reconciled');
      const normal = demoModule.createPayeeShieldDemoServer();
      await new Promise(ok => normal.listen(0, '127.0.0.1', ok));
      try {
        await cdp('Page.navigate', { url: 'http://127.0.0.1:' + normal.address().port });
        await wait("document.getElementById('evaluate') && !document.getElementById('evaluate').disabled && document.getElementById('old').value === '1846'");
        await click('evaluate'); await click('execute');
        const result = await shown(); assert.equal(result.outcome, 'EXECUTED');
        assert.equal(result.snapshot.state.accountEnding, '7319'); assert.equal(result.snapshot.state.version, 2);
        assert.equal((await evaluate("call('execute',{approvalId:handle,request:approvedRequest,fault:'none'})")).outcome, 'REJECTED');
        assert.equal(await evaluate("document.getElementById('execute').disabled"), true);
        await capture('executed'); checks.push('normal approval executes once');
      } finally { normal.closeAllConnections(); await new Promise(ok => normal.close(ok)); }
      evidence.results.push({ width, pass: true, checks, overflow: false });
    } finally {
      server.closeAllConnections(); await new Promise(ok => server.close(ok));
      await call('Target.closeTarget', { targetId }).catch(e => { evidence.errors.push(String(e)); });
    }
  }
  assert.deepEqual(evidence.errors, []); assert.deepEqual(evidence.externalRequests, []);
} catch (error) { evidence.failure = String(error.stack); throw error; }
finally {
  await writeFile(join(output, 'results.json'), JSON.stringify(evidence, null, 2) + '\n');
  if (socket?.readyState === WebSocket.OPEN) { await call('Browser.close').catch(() => {}); socket.close(); }
  if (child?.exitCode === null) child.kill();
  console.log(JSON.stringify(evidence));
}
