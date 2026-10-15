import assert from 'node:assert/strict';
import { constants, copyFileSync, existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { runCheckedCommand } from './checked-command.mjs';
import { STANDALONE_PLUGIN_VERSION } from '../dist/src/standalone-plugin.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
assert.equal(process.argv.length, 2);
assert.equal(STANDALONE_PLUGIN_VERSION, '0.1.0-local.6');
const archiveName = 'agent-trust-gate-plugin-' + STANDALONE_PLUGIN_VERSION + '.tgz';
const destination = join(root, 'discovery-site/downloads', archiveName);
assert.equal(existsSync(destination), false, 'Never replace a versioned candidate or published archive');
const manifest = join(root, 'discovery-site/downloads/SHA256SUMS');
const priorManifest = readFileSync(manifest, 'utf8');
assert.equal(priorManifest.includes(archiveName), false, 'Candidate already recorded');
const sha = path => createHash('sha256').update(readFileSync(path)).digest('hex');
const preserved = {};
for (const line of priorManifest.trim().split(/\r?\n/)) {
  const match = /^([a-f0-9]{64})  (agent-trust-gate-plugin-0\.1\.0-local\.[1-5]\.tgz)$/.exec(line);
  assert.ok(match, 'Unexpected prior manifest entry');
  const file = join(root, 'discovery-site/downloads', match[2]);
  assert.equal(sha(file), match[1]); preserved[file] = match[1];
}
assert.equal(Object.keys(preserved).length, 5);
const scratch = mkdtempSync(join(tmpdir(), 'atg-local6-candidate-'));
const staged = join(scratch, 'package');
const npm = process.env.npm_execpath ?? join(dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
const run = (exe, args) => runCheckedCommand(exe, args, { cwd: root });
run(process.execPath, ['scripts/build-standalone-plugin.mjs', '--output', staged]);
const packed = JSON.parse(run(process.execPath, [npm, '--cache', join(scratch, 'npm-cache'), 'pack', staged, '--ignore-scripts', '--pack-destination', scratch, '--json']))[0];
assert.equal(packed.filename, archiveName);
assert.ok(packed.files.some(file => file.path === 'SECURITY.md'));
assert.ok(packed.files.some(file => file.path === 'RELEASE-NOTES.md'));
assert.ok(packed.files.every(file => !/(^|\/)(test|node_modules|\.atg-evaluation)(\/|$)|\.pem$|state\.json$/.test(file.path)));
copyFileSync(join(scratch, packed.filename), destination, constants.COPYFILE_EXCL);
const digest = sha(destination);
assert.equal(readFileSync(manifest, 'utf8'), priorManifest, 'Manifest changed during preparation');
writeFileSync(manifest, priorManifest + (priorManifest.endsWith('\n') ? '' : '\n') + digest + '  ' + archiveName + '\n');
for (const [path, hash] of Object.entries(preserved)) assert.equal(sha(path), hash);
const result = { version: STANDALONE_PLUGIN_VERSION, unpublished: true, archive: destination, filename: archiveName,
  size: readFileSync(destination).length, sha256: digest, staging: scratch, priorArchivesUnchanged: true,
  instruction: 'Sealed candidate bytes. Validation must install this archive, not repack it.' };
writeFileSync(join(root, 'reports/mission-04-buyer-release/archive.json'), JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(result, null, 2));
