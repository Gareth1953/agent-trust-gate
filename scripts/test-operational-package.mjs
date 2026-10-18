import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';
const [archive, ...extra] = process.argv.slice(2);
if (!archive || extra.length) throw new Error('Supply the exact operational tgz archive to install and test.');
const directory = mkdtempSync(join(tmpdir(), 'atg-operational-installed-'));
try {
  writeFileSync(join(directory, 'package.json'), JSON.stringify({ name: 'atg-operational-install-check', version: '1.0.0', private: true, type: 'module' }));
  const install = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', resolve(archive)], { cwd: directory, encoding: 'utf8' });
  if (install.status !== 0) throw new Error('Clean installation failed: ' + install.stderr);
  const root = join(directory, 'node_modules/@agent-trust-gate/operational');
  const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  if (manifest.dependencies || manifest.scripts) throw new Error('Unexpected dependency or lifecycle script.');
  const sdk = spawnSync(process.execPath, ['--input-type=module', '-e', "import {AtgOperationalPlugin, AtgHumanApprovals} from '@agent-trust-gate/operational'; if(typeof AtgOperationalPlugin !== 'function' || typeof AtgHumanApprovals !== 'function') process.exit(1)"], { cwd: directory, encoding: 'utf8' });
  if (sdk.status !== 0) throw new Error('Installed SDK import failed: ' + sdk.stderr);
  const result = spawnSync(process.execPath, ['--test', 'test/operational-plugin.test.mjs'], { cwd: process.cwd(), env: { ...process.env, ATG_OPERATIONAL_TEST_PACKAGE: root }, encoding: 'utf8' });
  process.stdout.write(result.stdout); process.stderr.write(result.stderr); if (result.status !== 0) process.exitCode = 1;
  else console.log('Exact installed archive: SDK import and all separate-process integration tests passed.');
} finally { rmSync(directory, { recursive: true, force: true }); }
