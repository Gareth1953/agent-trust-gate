import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, realpathSync, lstatSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LocalDurableLifecycleStore, createOperatorAuthorityEvidence } from '../dist/src/durable-action-lifecycle.js';

// Requires explicit authorisation to change ACLs on one NEW disposable root.
// Accepts no target path. No /T, existing-state access, or ancestor ACL writes.
if (process.platform !== 'win32' || process.argv.length !== 2) throw Error('Windows only; no arguments accepted.');
const run = (exe, args) => execFileSync(exe, args, { encoding: 'utf8', windowsHide: true });
const identity = run('whoami.exe', ['/user', '/fo', 'csv', '/nh']);
const userSid = identity.match(/S-1-5-21-(?:[0-9]+-){3}[0-9]+/u)?.[0];
assert.ok(userSid, 'Expected the current local/domain user SID');
const allowedSids = [userSid, 'S-1-5-18', 'S-1-5-32-544'];
const quote = text => "'" + text.replaceAll("'", "''") + "'";
function acl(target) {
  const command = `$ErrorActionPreference='Stop'; $a=Get-Acl -LiteralPath ${quote(target)}; [pscustomobject]@{Path=${quote(target)};OwnerSid=$a.GetOwner([System.Security.Principal.SecurityIdentifier]).Value;Protected=$a.AreAccessRulesProtected;Canonical=$a.AreAccessRulesCanonical;Sddl=$a.Sddl;Rules=@($a.GetAccessRules($true,$true,[System.Security.Principal.SecurityIdentifier]) | ForEach-Object { [pscustomobject]@{Sid=$_.IdentityReference.Value;Type=$_.AccessControlType.ToString();Rights=[int]$_.FileSystemRights;Inherited=$_.IsInherited;Inheritance=[int]$_.InheritanceFlags;Propagation=[int]$_.PropagationFlags} })} | ConvertTo-Json -Depth 5 -Compress`;
  return JSON.parse(run('pwsh.exe', ['-NoProfile', '-NonInteractive', '-Command', command]));
}
function verifyAcl(value, directory, protectedRoot = false) {
  assert.equal(value.OwnerSid, userSid);
  assert.equal(value.Protected, protectedRoot);
  assert.equal(value.Canonical, true);
  assert.equal(value.Rules.length, 3);
  assert.deepEqual(value.Rules.map(rule => rule.Sid).sort(), [...allowedSids].sort());
  for (const rule of value.Rules) {
    assert.equal(rule.Type, 'Allow');
    assert.equal(rule.Rights, 2032127, 'FullControl, including SYSTEM and Administrators');
    assert.equal(rule.Inherited, !protectedRoot);
    assert.equal(rule.Inheritance, directory ? 3 : 0, 'Directories propagate to files and subdirectories');
    assert.equal(rule.Propagation, 0);
  }
}
const tempParent = realpathSync(tmpdir());
const repository = resolve(fileURLToPath(new URL('..', import.meta.url)));
const parentBefore = acl(tempParent);
const root = realpathSync(mkdtempSync(join(tempParent, 'atg-m04-private-parent-')));
assert.equal(dirname(root).toLowerCase(), tempParent.toLowerCase());
assert.ok(root.toLowerCase().startsWith((tempParent + sep).toLowerCase()));
assert.equal(lstatSync(root).isSymbolicLink(), false);
assert.deepEqual(readdirSync(root), []);
const initialRoot = acl(root);
// Both commands target exactly the empty root created above. Grant all three
// intended principals before removing inherited entries; keep admin/SYSTEM.
const grantOutput = run('icacls.exe', [root, '/grant:r', ...allowedSids.map(sid => '*' + sid + ':(OI)(CI)(F)')]);
const protectOutput = run('icacls.exe', [root, '/inheritance:r']);
const protectedRoot = acl(root);
verifyAcl(protectedRoot, true, true);
const statePath = join(root, 'private', 'state.json');
const temporaryFiles = [];
const store = new LocalDurableLifecycleStore({ statePath, faultInjector(stage) {
  if (stage === 'after_temp_fsync') {
    const names = readdirSync(dirname(statePath)).filter(name => name.startsWith('state.json.tmp-'));
    assert.equal(names.length, 1);
    const observed = acl(join(dirname(statePath), names[0]));
    verifyAcl(observed, false);
    temporaryFiles.push(observed);
  }
} });
const control = { reason: 'authorised disposable private-parent ACL test', recordedAt: '2026-09-02T09:01:00.000Z', authorityEvidence: createOperatorAuthorityEvidence() };
assert.equal(store.setEmergencyStop({ ...control, active: true }).changed, true);
const initialFile = acl(statePath);
verifyAcl(initialFile, false);
assert.equal(store.setEmergencyStop({ ...control, active: false }).changed, true);
assert.equal(temporaryFiles.length, 2);
const replacedFile = acl(statePath);
const directory = acl(dirname(statePath));
verifyAcl(replacedFile, false);
verifyAcl(directory, true);
const parentAfter = acl(tempParent);
assert.equal(parentAfter.Sddl, parentBefore.Sddl, 'Existing TEMP parent security descriptor must not change');
console.log(JSON.stringify({ passed: true, node: process.version, identity, allowedSids,
  retainedDisposableDirectory: root, statePath, repository, parentBefore, parentAfter,
  initialRoot, grantOutput, protectOutput, protectedRoot, directory, temporaryFiles,
  initialFile, replacedFile,
  establishes: 'New child directory, both temporary files, initial state and replacement inherit only current user, SYSTEM and Administrators FullControl from the protected new root.',
  untested: ['Access attempts by other users', 'Group membership and effective-token access', 'Administrator/SYSTEM execution under their own tokens', 'Same-user isolation', 'Backup/restore, network shares and other filesystems', 'Existing evaluation state and Windows deployment readiness'],
  cleanup: 'Retained; no deletion and no ACL changes outside the newly created disposable directory.'
}, null, 2));
