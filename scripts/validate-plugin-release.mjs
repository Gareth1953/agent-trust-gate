import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { resolve, join } from 'node:path';
import { STANDALONE_PLUGIN_VERSION } from '../dist/src/standalone-plugin.js';
const root = resolve('.');
const filename = 'agent-trust-gate-plugin-' + STANDALONE_PLUGIN_VERSION + '.tgz';
const directory = join(root, 'discovery-site/downloads');
const entries = readFileSync(join(directory, 'SHA256SUMS'), 'utf8').trim().split(/\r?\n/).map(line => {
  const match = /^([a-f0-9]{64})  ([A-Za-z0-9._-]+\.tgz)$/.exec(line);
  assert.ok(match, 'Malformed checksum entry: ' + line); return { digest: match[1], filename: match[2] };
});
assert.equal(new Set(entries.map(entry => entry.filename)).size, entries.length, 'Duplicate checksum entries');
for (const entry of entries) assert.equal(createHash('sha256').update(readFileSync(join(directory, entry.filename))).digest('hex'), entry.digest, 'Archive checksum mismatch: ' + entry.filename);
const expected = entries.find(entry => entry.filename === filename); assert.ok(expected, 'Current archive missing from checksum manifest');
const tar = gunzipSync(readFileSync(join(directory, filename)));
// Git may convert authored text to CRLF on Windows; compiled runtime bytes stay exact.
const authoredTextMatches = (member, path, message) => assert.equal(member.toString('utf8').replaceAll('\r\n','\n'), readFileSync(join(root,path),'utf8').replaceAll('\r\n','\n'), message);
let metadata;
let checkedRuntimeFiles = 0;
const members = new Set();
for (let offset = 0; offset + 512 <= tar.length;) {
  const header = tar.subarray(offset, offset + 512); if (header.every(byte => byte === 0)) break;
  const text = (start, end) => header.subarray(start, end).toString('utf8').split('\0')[0];
  const name = [text(345, 500), text(0, 100)].filter(Boolean).join('/');
  const size = parseInt(text(124, 136).trim(), 8);
  assert.ok(Number.isSafeInteger(size) && size >= 0 && offset + 512 + size <= tar.length, 'Invalid archive member size');
  assert.ok(!/(^|\/)(?:test|node_modules|state\.json|\.env)(?:\/|$)/.test(name), 'Unexpected package contents: ' + name);
  assert.ok(header[156] !== 49 && header[156] !== 50, 'Package must not contain links');
  assert.ok(!name.split('/').includes('..'), 'Archive path traversal');
  const member = tar.subarray(offset + 512, offset + 512 + size);
  assert.ok(!members.has(name), 'Duplicate archive member: ' + name); members.add(name);
  if (['package/scripts/shared-worker-demo.mjs','package/scripts/multi-worker-child.mjs'].includes(name)) authoredTextMatches(member, name.slice('package/'.length), 'Archive demonstration mismatch: ' + name);
  if (name === 'package/SHARED-WORKERS.md') authoredTextMatches(member, 'docs/shared-worker-evaluation.md', 'Archive shared guide mismatch');
  if (name.startsWith('package/dist/src/') && /\.(?:js|d\.ts)$/.test(name)) {
    assert.deepEqual(member, readFileSync(join(root, name.slice('package/'.length))), 'Archive compiled bytes differ from reviewed build: ' + name);
    checkedRuntimeFiles += 1;
  }
  if (name === 'package/README.md') authoredTextMatches(member, 'docs/standalone-plugin.md', 'Archive README mismatch');
  if (name === 'package/src/human-authority-demo.mjs') authoredTextMatches(member, 'src/human-authority-demo.mjs', 'Archive fixture module mismatch');
  if (name === 'package/package.json') metadata = JSON.parse(tar.subarray(offset + 512, offset + 512 + size).toString('utf8'));
  offset += 512 + Math.ceil(size / 512) * 512;
}
assert.equal(metadata?.version, STANDALONE_PLUGIN_VERSION, 'Archive/runtime version mismatch');
assert.equal(metadata?.name, '@agent-trust-gate/plugin'); assert.equal(metadata?.private, true);
assert.equal(metadata?.engines?.node, '>=20');
assert.equal(metadata?.exports?.['./shared-purchase-order']?.default, './dist/src/shared-purchase-order.js');
assert.equal(metadata?.bin?.['atg-multi-worker'], './scripts/shared-worker-demo.mjs');
for (const required of ['package/scripts/shared-worker-demo.mjs','package/scripts/multi-worker-child.mjs','package/SHARED-WORKERS.md','package/dist/src/shared-purchase-order.js']) assert.ok(members.has(required),'Required optional worker content missing: '+required);
for (const path of ['README.md', 'docs/standalone-plugin.md', 'docs/purchase-order-connector.md', 'discovery-site/index.html', 'discovery-site/plugin.html']) {
  assert.ok(readFileSync(join(root, path), 'utf8').includes(filename), 'Current archive link missing: ' + path);
}
const evidence = JSON.parse(readFileSync(join(root, 'discovery-site/challenge-results.json'), 'utf8'));
assert.equal(evidence.pluginVersion, '0.1.0-local.3', 'Retained Challenge recording version'); assert.equal(evidence.passed, true);
assert.deepEqual(evidence.cases.map(c => c.id), ['changed-details', 'reused-approval', 'lost-acknowledgement']);
const { InMemoryNonceStore, createVerifierContext, createFixedTrustedClock, verifyExactActionAtExecution } = await import('../dist/src/exact-action-gatepass.js');
const { createCanonicalPayloadHash } = await import('../dist/src/local-signed-proof.js');
for (const item of evidence.cases) {
  assert.equal(item.passed, true); const approval = item.approval; assert.ok(approval);
  assert.equal(createCanonicalPayloadHash(approval.businessState), approval.approvedBusinessStateDigest);
  assert.deepEqual(approval.gatePass.action.canonicalArguments.businessStateBinding, approval.businessStateBinding);
  const { actionEnvelopeVersion, canonicalizationVersion, digestAlgorithm, actionDigest, ...action } = approval.gatePass.action;
  const nonce = new InMemoryNonceStore(); nonce.registerUnused(approval.gatePass);
  const verification = verifyExactActionAtExecution(approval.gatePass, action, createVerifierContext({ gatePass: approval.gatePass, decisionReceipt: approval.decisionReceipt }, nonce,
    { trustedClock: createFixedTrustedClock('2026-09-02T09:01:00.000Z') }));
  assert.equal(verification.verified, true, 'Challenge approval signature must verify: ' + item.id);
  const outcomeEvidence = item.first?.evidence ?? item.reconciliation?.evidence;
  if (outcomeEvidence) {
    assert.equal(outcomeEvidence.signedBusinessStateVerified, true);
    assert.equal(outcomeEvidence.approvedBusinessStateDigest, approval.approvedBusinessStateDigest);
    assert.equal(createCanonicalPayloadHash(outcomeEvidence.destinationRecord.businessState), approval.approvedBusinessStateDigest);
  }
}
assert.equal(evidence.cases[0].recordCount, 0); assert.equal(evidence.cases[1].recordCount, 1); assert.equal(evidence.cases[2].recordCount, 1);


const workers = JSON.parse(readFileSync(join(root,'discovery-site/multi-worker-results-local.4.json'),'utf8'));
assert.equal(workers.pluginVersion, STANDALONE_PLUGIN_VERSION); assert.equal(workers.passed,true);
assert.equal(workers.boundary.storage,'SQLite shared v2'); assert.equal(workers.boundary.independentEvidence,false); assert.equal(workers.boundary.multiMachineSafety,false); assert.equal(workers.boundary.sameHostDestinationEvidence,true);
assert.deepEqual(workers.cases.map(c=>c.id),['approval-competition','shared-budget-600000','shared-budget-1000000','crash-after-reservation','crash-after-commit','delayed-worker','recovery-fence-crash']);
assert.ok(workers.cases.every(c=>c.passed)); assert.equal(workers.cases[0].final.writes,1);
assert.equal(workers.cases[1].reserved.reservedMinorUnits,400000);assert.equal(workers.cases[1].reserved.writes,0);
assert.equal(workers.cases[2].reserved.reservedMinorUnits,800000);assert.equal(workers.cases[2].reserved.writes,0);
assert.equal(workers.cases[3].beforeRecovery.heldMinorUnits,400000);assert.equal(workers.cases[3].final.heldMinorUnits,0);assert.equal(workers.cases[3].recovery.outcome,'NOT_EXECUTED');
assert.equal(workers.cases[4].final.writes,1);assert.equal(workers.cases[4].final.committedMinorUnits,400000);assert.equal(workers.cases[4].recovery.outcome,'EXECUTED');
assert.equal(workers.cases[5].delayed.reason,'STALE_AUTHORITY');assert.equal(workers.cases[6].stale.reason,'DESTINATION_FENCED');assert.equal(workers.cases[6].beforeRecovery.reservedMinorUnits,400000);
assert.ok(readFileSync(join(root,'discovery-site/plugin.html'),'utf8').includes('./multi-worker-results-local.4.json'));
console.log('Seven recorded packaged-worker cases, scope boundaries and evidence link verified.');

console.log(JSON.stringify({ version: STANDALONE_PLUGIN_VERSION, archive: 'discovery-site/downloads/' + filename, sha256: expected.digest, checksums: entries.length, checkedRuntimeFiles, challengeCases: 3, passed: true }, null, 2));
