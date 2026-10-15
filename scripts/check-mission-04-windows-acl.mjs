import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { LocalDurableLifecycleStore, createOperatorAuthorityEvidence } from '../dist/src/durable-action-lifecycle.js';

// Observational Windows probe. Creates new synthetic state only; never changes
// ACLs or accepts a path to an existing evaluation store.
if (process.platform !== 'win32') throw Error('Run this probe on Windows NTFS.');
if (process.argv.length !== 2) throw Error('This observational probe takes no arguments.');
const parent = resolve('.atg-evaluation/mission04-windows-acl');
mkdirSync(parent, { recursive: true });
const root = mkdtempSync(join(parent, 'probe-'));
const statePath = join(root, 'private', 'state.json');
const acl = target => execFileSync('icacls.exe', [target], { encoding: 'utf8', windowsHide: true });
const temporaryFiles = [];
const store = new LocalDurableLifecycleStore({ statePath, faultInjector(stage) {
  if (stage === 'after_temp_fsync') {
    const temporaryPath = readdirSync(dirname(statePath)).find(name => name.startsWith('state.json.tmp-'));
    assert.ok(temporaryPath);
    temporaryFiles.push(acl(join(dirname(statePath), temporaryPath)));
  }
} });
const control = { reason: 'synthetic Windows ACL observation', recordedAt: '2026-09-02T09:01:00.000Z', authorityEvidence: createOperatorAuthorityEvidence() };
assert.equal(store.setEmergencyStop({ ...control, active: true }).changed, true);
const initialFile = acl(statePath);
assert.equal(store.setEmergencyStop({ ...control, active: false }).changed, true);
assert.equal(temporaryFiles.length, 2);
console.log(JSON.stringify({ platform: process.platform, node: process.version,
  identity: execFileSync('whoami.exe', ['/user'], { encoding: 'utf8', windowsHide: true }),
  retainedSyntheticState: root, parent: acl(root), directory: acl(dirname(statePath)),
  temporaryFiles, initialFile, replacedFile: acl(statePath),
  interpretation: 'POSIX modes do not restrict the Windows DACL. Inspect every inherited and explicit ACE; successful writes are not an isolation test. No ACL was changed.'
}, null, 2));
