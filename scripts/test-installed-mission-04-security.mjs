import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { runCheckedCommand } from './checked-command.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
assert.equal(process.argv.length, 4, 'Use --archive EXACT_PATH');
assert.equal(process.argv[2], '--archive');
const archive = resolve(process.argv[3]);
const scratch = mkdtempSync(join(tmpdir(), 'atg-local6-installed-security-'));
const npm = process.env.npm_execpath ?? join(dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
const sha = path => createHash('sha256').update(readFileSync(path)).digest('hex');
const summary = { runtime: process.version, archive, sha256: sha(archive), scratch, passed: false };
const run = (exe, args) => runCheckedCommand(exe, args, { cwd: scratch });
try {
  writeFileSync(join(scratch, 'package.json'), JSON.stringify({ name: 'atg-local6-security-check', private: true, type: 'module' }));
  run(process.execPath, [npm, '--cache', join(scratch, 'npm-cache'), 'install', '--offline', '--ignore-scripts', '--no-audit', '--no-fund', archive]);
  const installed = join(scratch, 'node_modules/@agent-trust-gate/plugin');
  assert.equal(JSON.parse(readFileSync(join(installed, 'package.json'), 'utf8')).version, '0.1.0-local.6');
  assert.match(readFileSync(join(installed, 'SECURITY.md'), 'utf8'), /POSIX modes do not configure a private NTFS DACL/);
  assert.match(readFileSync(join(installed, 'RELEASE-NOTES.md'), 'utf8'), /unpublished Mission 04 candidate/);
  // Tests import only the exact installed runtime; the repository supplies the
  // test harness and public fixture, never the runtime under test.
  mkdirSync(join(scratch, 'examples'));
  copyFileSync(join(root, 'examples/local-signed-trust-receipt-valid.json'), join(scratch, 'examples/local-signed-trust-receipt-valid.json'));
  let tests = readFileSync(join(root, 'dist/test/mission-04-security.test.js'), 'utf8');
  // tsc emits CommonJS. Resolve every ../src dependency into the installed package.
  tests = tests.replaceAll('require("../src/', 'require(' + JSON.stringify(join(installed, 'dist/src') + '/').slice(0, -1));
  const testPath = join(scratch, 'mission-04-installed.test.cjs');
  writeFileSync(testPath, tests, { flag: 'wx' });
  const log = run(process.execPath, ['--test', '--test-reporter=tap', testPath]);
  writeFileSync(join(scratch, 'security.log'), log, { flag: 'wx' });
  assert.match(log, /# tests 8/); assert.match(log, /# fail 0/);
  summary.securityTests = 8;
  summary.securityPassed = process.platform === 'win32' ? 7 : 8;
  summary.posixSkipped = process.platform === 'win32' ? 1 : 0;
  if (process.platform === 'win32') {
    let probe = readFileSync(join(root, 'scripts/check-mission-04-windows-acl.mjs'), 'utf8');
    probe = probe.replace("'../dist/src/durable-action-lifecycle.js'", JSON.stringify(pathToFileURL(join(installed, 'dist/src/durable-action-lifecycle.js')).href));
    writeFileSync(join(scratch, 'acl-probe.mjs'), probe, { flag: 'wx' });
    const observation = JSON.parse(run(process.execPath, ['acl-probe.mjs']));
    writeFileSync(join(scratch, 'ntfs-acl.json'), JSON.stringify(observation, null, 2) + '\n', { flag: 'wx' });
    summary.ntfs = { observationalProbePassed: true, aclEnforcementClaimed: false, evidence: join(scratch, 'ntfs-acl.json') };
  }
  assert.equal(sha(archive), summary.sha256);
  summary.passed = true;
} catch (error) { summary.error = String(error); process.exitCode = 1; console.error(error); }
finally { writeFileSync(join(scratch, 'summary.json'), JSON.stringify(summary, null, 2) + '\n'); console.log(JSON.stringify(summary)); }
