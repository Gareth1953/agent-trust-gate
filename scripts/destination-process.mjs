// Synthetic destination service. Its private key is generated/read only here.
import { DatabaseSync } from 'node:sqlite';
import { generateKeyPairSync, randomUUID, sign } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, lstatSync, writeSync, readSync } from 'node:fs';
import { join, isAbsolute } from 'node:path';
import { createCanonicalPayloadHash as hash } from '../dist/src/local-signed-proof.js';
import { canonicalDestinationEvidence as canonical, verifyDestinationApproval, validateDestinationTrust, validateDestinationLookup, destinationRecordDigest, DESTINATION_EVIDENCE_SCHEMA, DESTINATION_CLOCK_ID } from '../dist/src/destination-evidence.js';
import { purchaseOrderStateBindingMatches } from '../dist/src/purchase-order-state-binding.js';
import { PURCHASING_DEMO_EXECUTION_TIME as AT } from '../dist/src/local-purchasing-lifecycle-demo.js';

const directory = process.argv[2];
if (!isAbsolute(directory)) throw Error('ABSOLUTE_DESTINATION_DIRECTORY_REQUIRED');
if (process.argv[3] === '--initialise') {
  mkdirSync(directory, { mode: 0o700 }); // never reset/migrate existing state
  const key = generateKeyPairSync('ed25519');
  writeFileSync(join(directory, 'signing-private.pem'), key.privateKey.export({ type: 'pkcs8', format: 'pem' }), { flag: 'wx', mode: 0o600 });
  writeFileSync(join(directory, 'signing-public.pem'), key.publicKey.export({ type: 'spki', format: 'pem' }), { flag: 'wx' });
  const initial = new DatabaseSync(join(directory, 'destination.sqlite'));
  initial.exec('PRAGMA journal_mode=DELETE; PRAGMA synchronous=EXTRA; CREATE TABLE snapshot (id INTEGER PRIMARY KEY CHECK(id=1), payload TEXT NOT NULL, digest TEXT NOT NULL) STRICT');
  const value = { version: 'atg.separate-destination.synthetic.v1', sequence: 0, stopped: false,
    state: { orderId: 'PO-SYNTHETIC-001', orderVersion: 1, supplierBankVersion: 1, supplierBankReference: 'fixture-bank-A', revision: 1 }, registrations: [], records: [], fences: [] };
  initial.prepare('INSERT INTO snapshot VALUES(1,?,?)').run(JSON.stringify(value), hash(value)); initial.close();
  writeFileSync(join(directory, 'ready'), value.version, { flag: 'wx' });
}
if (lstatSync(directory).isSymbolicLink()) throw Error('DESTINATION_DIRECTORY_SYMLINK');
for (const name of ['ready', 'destination.sqlite', 'signing-private.pem', 'signing-public.pem']) if (lstatSync(join(directory, name)).isSymbolicLink()) throw Error('DESTINATION_SYMLINK');
if (readFileSync(join(directory, 'ready'), 'utf8') !== 'atg.separate-destination.synthetic.v1') throw Error('DESTINATION_VERSION_UNSUPPORTED');
const privateKey = readFileSync(join(directory, 'signing-private.pem'), 'utf8');
const publicKey = readFileSync(join(directory, 'signing-public.pem'), 'utf8');
const db = new DatabaseSync(join(directory, 'destination.sqlite'));
db.exec('PRAGMA busy_timeout=5000; PRAGMA journal_mode=DELETE; PRAGMA synchronous=EXTRA');
let trust;
function load() {
  if (db.prepare('PRAGMA quick_check').get().quick_check !== 'ok') throw Error('DESTINATION_CORRUPT');
  const row = db.prepare('SELECT payload,digest FROM snapshot WHERE id=1').get();
  const d = JSON.parse(row.payload);
  if (d.version !== 'atg.separate-destination.synthetic.v1' || hash(d) !== row.digest) throw Error('DESTINATION_CORRUPT');
  return d;
}
function tx(fn, requestedBarrier) {
  db.exec('BEGIN IMMEDIATE');
  try { const d = load(); const value = fn(d); db.prepare('UPDATE snapshot SET payload=?,digest=? WHERE id=1').run(JSON.stringify(d), hash(d)); barrier('before_commit',requestedBarrier); db.exec('COMMIT'); return value; }
  catch (e) { db.exec('ROLLBACK'); throw e; }
}
function related(d, a) {
  // Check every record and every collision before inferring absence.
  for (const r of d.records) if (!verifyDestinationApproval(r.approval, trust)
    || r.digest !== destinationRecordDigest(r.approval, r.transactionId, r.version)) throw Error('DESTINATION_RECORD_INVALID');
  const records = d.records.filter(r => r.approval.approvalId === a.approvalId || r.approval.gatePass.action.nonce === a.gatePass.action.nonce || r.approval.gatePass.action.actionDigest === a.gatePass.action.actionDigest);
  if (records.length > 1 || records.some(r => hash(r.approval) !== hash(a))) throw Error('DESTINATION_RECORD_BINDING_CONFLICT');
  return records[0] ?? null;
}
function fence(d, a, fenceId) {
  let f = d.fences.find(f => f.gatePassId === a.gatePass.gatePassId || f.idempotencyId === a.gatePass.action.nonce);
  if (!f) { d.sequence++; f = { fenceId, gatePassId: a.gatePass.gatePassId, idempotencyId: a.gatePass.action.nonce, completed: true, sequence: d.sequence }; d.fences.push(f); }
  // A new lookup challenge may attest an existing permanent tombstone.
  return { ...f, fenceId };
}
function envelope(a, q, record, d, f, testFault) {
  const unsigned = { schema: DESTINATION_EVIDENCE_SCHEMA, algorithm: 'Ed25519', keyId: trust.destinationKeyId,
    payload: { schema: DESTINATION_EVIDENCE_SCHEMA, destinationIdentity: trust.destinationIdentity,
      approvalId: a.approvalId, gatePassId: a.gatePass.gatePassId, actionDigest: a.gatePass.action.actionDigest,
      approvedRequestDigest: hash(a.request), approvedBusinessStateDigest: a.binding.businessStateDigest, approvedBusinessState: a.binding.businessState,
      idempotencyId: a.gatePass.action.nonce, transactionId: record?.transactionId ?? null, outcome: record ? 'EXECUTED' : 'ABSENT',
      resultingRecordVersion: record?.version ?? null, recordDigest: record?.digest ?? null, lookup: q, observedAt: AT,
      clockId: DESTINATION_CLOCK_ID, authoritativeLookup: true, destinationSequence: d.sequence, fence: f, syntheticOnly: true, sameHost: true } };
  // Fixed synthetic evidence faults exercise semantic rejection after a valid signature.
  // Never expose a generic signing oracle or accept a caller-selected payload/key.
  if (testFault === 'incomplete-fence' && unsigned.payload.fence) delete unsigned.payload.fence.completed;
  else if (testFault === 'non-authoritative') unsigned.payload.authoritativeLookup=false;
  else if (testFault === 'stale') unsigned.payload.observedAt=new Date(Date.parse(AT)-10000).toISOString();
  else if (testFault === 'wrong-transaction' && record) unsigned.payload.transactionId=randomUUID();
  else if (testFault === 'missing-fence') unsigned.payload.fence=null;
  else if (testFault === 'wrong-destination') unsigned.payload.destinationIdentity='destination.synthetic.wrong';
  else if (testFault === 'wrong-action') unsigned.payload.actionDigest='sha256:'+ '0'.repeat(64);
  else if (testFault === 'wrong-state-version') unsigned.payload.approvedBusinessState={...a.binding.businessState,orderVersion:a.binding.businessState.orderVersion+1};
  else if (testFault !== undefined) throw Error('EVIDENCE_TEST_FAULT_INVALID');
  return { ...unsigned, signature: sign(null, Buffer.from(canonical(unsigned)), privateKey).toString('base64') };
}
function barrier(stage, requested) {
  if (stage === requested) { writeSync(1, JSON.stringify({ barrier: stage })+'\n'); readSync(0, Buffer.alloc(1), 0, 1, null); }
}
process.send({ phase: 'ready', publicKeyPem: publicKey, pid: process.pid });
process.on('message', m => {
  try {
    if (m.op === 'configure') {
      validateDestinationTrust(m.trust);
      if (m.trust.destinationPublicKeyPem !== publicKey || (trust && hash(trust) !== hash(m.trust))) throw Error('DESTINATION_TRUST_CHANGED');
      const path = join(directory, 'trust.json');
      // Trust is host configuration, never a key extracted from a receipt.
      try { if (hash(JSON.parse(readFileSync(path, 'utf8'))) !== hash(m.trust)) throw Error('DESTINATION_TRUST_CHANGED'); }
      catch (e) { if (e.code !== 'ENOENT') throw e; writeFileSync(path, JSON.stringify(m.trust), { flag: 'wx' }); }
      trust = structuredClone(m.trust); process.send({ id: m.id, value: true }); return;
    }
    if (!trust) throw Error('HOST_TRUST_NOT_CONFIGURED');
    if (m.op === 'close') { db.close(); process.send({ id: m.id, value: true }); process.disconnect(); return; }
    if (m.op === 'state') { process.send({ id: m.id, value: load().state }); return; }
    if (m.op === 'stop') { const v=tx(d => { d.stopped = true; d.sequence++; return true; }); process.send({ id:m.id, value:v }); return; }
    const a=m.approval;
    if (!verifyDestinationApproval(a, trust)) throw Error('APPROVAL_INVALID');
    if (m.op === 'register') {
      const value = tx(d => {
        if (d.stopped || d.fences.some(f => f.gatePassId === a.gatePass.gatePassId || f.idempotencyId === a.gatePass.action.nonce)) throw Error('DESTINATION_FENCED');
        if (typeof m.token !== 'string' || !/^[a-f0-9-]{36}$/.test(m.token)) throw Error('CLAIM_INVALID');
        if (d.registrations.some(r => r.approval.approvalId === a.approvalId || r.approval.gatePass.action.nonce === a.gatePass.action.nonce)) throw Error('REGISTRATION_EXISTS_NO_RETRY');
        d.sequence++; d.registrations.push({ approval:a, token:m.token }); return true;
      }); process.send({ id:m.id, value }); return;
    }
    if (!['submit','lookup','fence_lookup'].includes(m.op)) throw Error('OPERATION_INVALID');
    validateDestinationLookup(m.lookup);
    if (m.lookup.requestedAt !== AT || (m.op === 'fence_lookup' ? m.lookup.fenceId === null : m.lookup.fenceId !== null)) throw Error('TEST_CLOCK_OR_LOOKUP_INVALID');
    barrier('before_operation', m.barrier);
    const evidence = tx(d => {
      if (m.op === 'submit') {
        if (d.stopped || d.fences.some(f => f.gatePassId === a.gatePass.gatePassId || f.idempotencyId === a.gatePass.action.nonce)) throw Error('DESTINATION_FENCED');
        const registered = d.registrations.find(r => r.approval.approvalId === a.approvalId);
        if (!registered || registered.token !== m.token || hash(registered.approval) !== hash(a)) throw Error('CLAIM_INVALID');
        if (related(d,a) || d.records.length) throw Error('ALREADY_RECORDED_NO_RETRY');
        if (!purchaseOrderStateBindingMatches(a.binding,d.state,a.request)) throw Error('DESTINATION_STATE_CHANGED');
        const transactionId=randomUUID(), version=d.state.orderVersion+1;
        d.records.push({ approval:a, transactionId, version, digest:destinationRecordDigest(a,transactionId,version) });
        d.state.orderVersion=version; d.state.revision++; d.sequence++;
      }
      const f=m.op==='fence_lookup'?fence(d,a,m.lookup.fenceId):null;
      return envelope(a,m.lookup,related(d,a),d,f,m.testFault);
    },m.barrier);
    // The signed evidence is sent only after the independent destination transaction commits.
    barrier('after_commit', m.barrier);
    process.send({ id:m.id, value:evidence });
  } catch(e) { process.send({ id:m.id, error:e.message }); }
});
process.on('disconnect', () => { try { db.close(); } catch {} });
