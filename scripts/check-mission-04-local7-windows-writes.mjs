import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

assert.equal(process.platform, 'win32', 'Native Windows control; never simulate a pass on another OS');
assert.equal(process.argv.length, 4, 'Use --runtime-root ABSOLUTE_DIST_SRC');
assert.equal(process.argv[2], '--runtime-root');
const runtimeRoot = resolve(process.argv[3]);
const { LocalDurableLifecycleStore } = await import(pathToFileURL(join(runtimeRoot, 'durable-action-lifecycle.js')));
const { McpExactActionGateway, createDefaultMcpBusinessPolicyRequest } = await import(pathToFileURL(join(runtimeRoot, 'mcp-exact-action-gateway.js')));
const scratch = mkdtempSync(join(tmpdir(), 'atg-local7-native-writes-'));
const powershell = 'C:/Program Files/PowerShell/7/pwsh.exe';
assert.ok(existsSync(powershell), 'Use the existing PowerShell 7; do not install a replacement');
const holder = join(scratch, 'owned-reader.ps1');
writeFileSync(holder, `param([string]$State,[int]$Share,[string]$Ready,[string]$Release,[string]$Observation)
$ErrorActionPreference='Stop'
$before=(Get-Acl -LiteralPath $State).Sddl
$stream=[IO.FileStream]::new($State,[IO.FileMode]::Open,[IO.FileAccess]::Read,([IO.FileShare]$Share))
try {
  [IO.File]::WriteAllText($Ready,'ready')
  $deadline=[DateTime]::UtcNow.AddSeconds(20)
  while(-not [IO.File]::Exists($Release)) {
    if([DateTime]::UtcNow -gt $deadline){throw 'Owned-reader timeout'}
    Start-Sleep -Milliseconds 10
  }
} finally {
  $stream.Dispose()
  @{aclBefore=$before;aclAfter=(Get-Acl -LiteralPath $State).Sddl;attributes=[string](Get-Item -LiteralPath $State).Attributes;share=$Share;pid=$PID} | ConvertTo-Json | Set-Content -LiteralPath $Observation
}
`, { flag: 'wx' });
const summary = { runtime: process.version, runtimeRoot, scratch, aclsChanged: false, historicalIncidentAttributed: false, cases: [], passed: false };
let currentChild;
try {
  for (const kind of ['normal', 'reader-no-delete-share', 'reader-with-delete-share', 'temporary-collision']) {
    const directory = mkdtempSync(join(scratch, 'case-'));
    const state = join(directory, 'state.json');
    const store = new LocalDurableLifecycleStore({ statePath: state });
    const request = createDefaultMcpBusinessPolicyRequest('enforced', { nonce: 'nonce_local7_' + kind.replaceAll('-', '_'), totalAmount: 1000 });
    request.amountMinorUnits = 100000;
    const issued = await new McpExactActionGateway({ durableStore: store }).evaluateAction(request);
    assert.equal(issued.outcome, 'ACCEPT');
    const gatePass = issued.gatePass;
    assert.equal(store.reserve(gatePass, 1, '2026-09-02T09:01:00.000Z').changed, true);
    const before = readFileSync(state);
    const revision = store.snapshot().storeRevision;
    const temporary = state + '.tmp-' + process.pid + '-' + (revision + 1);
    const ready = join(directory, 'ready'), release = join(directory, 'release'), observation = join(directory, 'reader.json');
    let exited;
    if (kind.startsWith('reader-')) {
      const share = kind === 'reader-no-delete-share' ? 3 : 7;
      currentChild = spawn(powershell, ['-NoProfile', '-NonInteractive', '-File', holder, '-State', state, '-Share', String(share), '-Ready', ready, '-Release', release, '-Observation', observation], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
      let stderr = '';
      currentChild.stderr.on('data', bytes => { stderr += bytes; });
      exited = new Promise((accept, reject) => { currentChild.once('error', reject); currentChild.once('exit', code => accept({ code, stderr })); });
      for (let attempt = 0; !existsSync(ready); attempt++) {
        assert.ok(attempt < 1500 && currentChild.exitCode === null, 'Owned reader not ready: ' + stderr);
        await delay(10);
      }
    }
    if (kind === 'temporary-collision') writeFileSync(temporary, 'owned collision evidence', { flag: 'wx', mode: 0o600 });
    let failure;
    try { store.markPossibleExternalEffect(gatePass.gatePassId, '2026-09-02T09:02:30.000Z'); }
    catch (error) { failure = error; }
    finally { if (exited) writeFileSync(release, 'release'); }
    const result = { kind, directory, revisionBefore: revision, revisionAfter: JSON.parse(readFileSync(state, 'utf8')).storeRevision, committedBytesUnchanged: before.equals(readFileSync(state)), temporaryRemains: existsSync(temporary), health: store.health() };
    if (exited) {
      const exit = await exited;
      assert.equal(exit.code, 0, exit.stderr);
      currentChild = undefined;
      result.reader = JSON.parse(readFileSync(observation, 'utf8'));
      assert.equal(result.reader.aclBefore, result.reader.aclAfter);
      assert.equal(result.reader.attributes.includes('ReadOnly'), false);
    }
    if (kind === 'normal') {
      assert.equal(failure, undefined);
      assert.equal(result.revisionAfter, revision + 1);
      assert.equal(result.temporaryRemains, false);
    } else {
      assert.equal(failure?.reasonCode, 'DURABLE_WRITE_FAILED');
      assert.equal(failure.cause?.code, kind === 'temporary-collision' ? 'EEXIST' : 'EPERM');
      assert.equal(failure.cause?.syscall, kind === 'temporary-collision' ? 'open' : 'rename');
      result.failure = { reasonCode: failure.reasonCode, code: failure.cause.code, errno: failure.cause.errno, syscall: failure.cause.syscall };
      assert.equal(result.committedBytesUnchanged, true);
      assert.equal(result.revisionAfter, revision);
      assert.equal(result.health.available, false);
      assert.throws(() => store.snapshot(), error => error === failure);
      const restarted = new LocalDurableLifecycleStore({ statePath: state });
      result.restartedStatus = restarted.getLifecycleByGatePassId(gatePass.gatePassId).status;
      assert.equal(result.restartedStatus, 'RESERVED');
      assert.equal(restarted.snapshot().exposureEntries[0].status, 'RESERVED');
      if (kind === 'temporary-collision') assert.equal(readFileSync(temporary, 'utf8'), 'owned collision evidence');
      else assert.equal(result.temporaryRemains, false);
    }
    result.passed = true;
    summary.cases.push(result);
  }
  summary.passed = true;
} catch (error) { summary.error = error.stack ?? String(error); process.exitCode = 1; console.error(error); }
finally {
  if (currentChild && currentChild.exitCode === null) currentChild.kill();
  writeFileSync(join(scratch, 'summary.json'), JSON.stringify(summary, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ ...summary, summary: join(scratch, 'summary.json') }));
}
