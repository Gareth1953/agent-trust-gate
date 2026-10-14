import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fork } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { once } from 'node:events';
import { DatabaseSync } from 'node:sqlite';
import { SharedPurchaseOrder } from '../dist/src/shared-purchase-order.js';
import { DEFAULT_AGGREGATE_EXPOSURE_RULE } from '../dist/src/durable-action-lifecycle.js';
import { createSyntheticPluginRequest } from '../dist/src/standalone-plugin.js';
import { createCanonicalPayloadHash as hash } from '../dist/src/local-signed-proof.js';

const children = new Map();
function setup(t, limit = 1000000) {
  const root = mkdtempSync(join(tmpdir(), 'atg-workers-')); const dir = join(root, 'shared');
  SharedPurchaseOrder.initialise(dir, { ...DEFAULT_AGGREGATE_EXPOSURE_RULE, maximumAggregateMinorUnits: limit });
  t.after(async () => { for (const child of children.get(dir) ?? []) { if (child.exitCode === null && child.signalCode === null) { const exited=once(child,'exit'); child.kill('SIGKILL'); await exited; } } rmSync(root, { recursive: true, force: true }); }); return dir;
}
function worker(t, dir) {
  const child = fork(resolve('scripts/multi-worker-child.mjs'), [dir], { stdio: ['pipe','pipe','pipe','ipc'] });
  if (!children.has(dir)) children.set(dir, []); children.get(dir).push(child);
  let pending, messages = [], stderr = '';
  child.stderr.on('data', d => stderr += d);
  child.on('message', m => { if (pending) { const p = pending; pending = null; p.resolve(m); } else messages.push(m); });
  child.on('exit', (code, signal) => { if (pending) { pending.reject(new Error('Worker exited: ' + code + '/' + signal + ' ' + stderr)); pending = null; } });
  const next = () => messages.length ? Promise.resolve(messages.shift()) : new Promise((resolve, reject) => {
    const timer = setTimeout(() => { pending = null; reject(new Error('IPC barrier timeout: ' + stderr)); }, 15000);
    pending = { resolve: x => { clearTimeout(timer); resolve(x); }, reject: e => { clearTimeout(timer); reject(e); } };
  });
  let barrierResolve, barrierBuffer=''; const barrierQueue=[];
  child.stdout.on('data', data => { barrierBuffer += data; let i; while ((i=barrierBuffer.indexOf('\n'))>=0) { const value=JSON.parse(barrierBuffer.slice(0,i)); barrierBuffer=barrierBuffer.slice(i+1); if (barrierResolve) { barrierResolve(value); barrierResolve=null; } else barrierQueue.push(value); } });
  const barrier = () => barrierQueue.length ? Promise.resolve(barrierQueue.shift()) : new Promise((resolve,reject) => { const timer=setTimeout(()=>reject(new Error('Fault barrier timeout')),15000); barrierResolve=value=>{ clearTimeout(timer); resolve(value); }; });
  const ready = next();
  t.after(async () => { if (child.exitCode === null && child.signalCode === null) { const exited = once(child,'exit'); child.kill('SIGKILL'); await exited; } });
  return { child, ready, barrier, async call(op, args = {}) { const reply = next(); child.send({op,...args}); const m = await reply; assert.equal(m.phase, op); if (m.error) throw new Error(m.error); return m.value; }, async kill() { const exited = once(child,'exit'); child.kill('SIGKILL'); await exited; } };
}
async function open(t, dir) { const w = worker(t,dir); assert.equal((await w.ready).phase,'ready'); return w; }
function counts(s) { return { writes: s.records.length, exposure: s.authority.exposureEntries.filter(e => e.status !== 'RELEASED').reduce((n,e)=>n+e.amountMinorUnits,0), statuses: s.authority.lifecycles.map(l=>l.status) }; }
function evidence(t, label, snapshot) { t.diagnostic(label + ': ' + JSON.stringify(counts(snapshot))); }

test('separate workers consume one approval at most once and destination refuses replay', async t => {
  const dir = setup(t); const w1 = await open(t,dir); const w2 = await open(t,dir);
  const request = createSyntheticPluginRequest('enforced'); const a = await w1.call('approve',{request}); assert.ok(a.approvalId);
  const claims = await Promise.all([w1.call('claim',{id:a.approvalId,request}),w2.call('claim',{id:a.approvalId,request})]);
  assert.equal(claims.filter(Boolean).length,1); const winner = claims[0] ? w1 : w2; const claim = claims.find(Boolean);
  assert.equal((await winner.call('submit')).outcome,'EXECUTED');
  assert.equal((await winner.call('submit')).reason,'DESTINATION_ALREADY_RECORDED');
  assert.equal((await winner.call('ack')).outcome,'EXECUTED');
  assert.equal((await w2.call('submit',{claim})).outcome,'REJECTED');
  const s = await w1.call('snapshot'); assert.deepEqual(counts(s),{writes:1,exposure:400000,statuses:['EXECUTED']}); evidence(t,'same-approval',s);
});

test('concurrent approvals reserve shared budget atomically; executions cannot overspend', async t => {
  const dir=setup(t,600000); const w1=await open(t,dir); const w2=await open(t,dir);
  const r1=createSyntheticPluginRequest('enforced'), r2=createSyntheticPluginRequest('enforced');
  const approvals=await Promise.all([w1.call('approve',{request:r1}),w2.call('approve',{request:r2})]);
  assert.equal(approvals.filter(a=>a.approvalId).length,1);
  assert.equal(approvals.filter(a=>a.decision.outcome==='REFER').length,1);
  const claims=await Promise.all([w1.call('claim',{id:approvals[0].approvalId,request:r1}),w2.call('claim',{id:approvals[1].approvalId,request:r2})]);
  assert.equal(claims.filter(Boolean).length,1); const winner=claims[0]?w1:w2;
  assert.equal((await winner.call('submit')).outcome,'EXECUTED'); await winner.call('ack');
  const s=await w1.call('snapshot'); assert.equal(counts(s).exposure,400000); assert.equal(s.records.length,1); evidence(t,'budget-600000',s);
});

for (const committed of [false,true]) test('kill worker ' + (committed?'after destination commit before ack':'after reservation before submission') + '; restart and reconcile', async t => {
  const dir=setup(t); const dying=await open(t,dir); const request=createSyntheticPluginRequest('enforced');
  const a=await dying.call('approve',{request}); const claim=await dying.call('claim',{id:a.approvalId,request}); assert.ok(claim);
  if (committed) assert.equal((await dying.call('submit')).outcome,'EXECUTED');
  await dying.kill(); const restarted=await open(t,dir);
  let s=await restarted.call('snapshot'); assert.equal(counts(s).exposure,400000); assert.equal(s.authority.lifecycles[0].status,'RESERVED'); assert.equal(s.records.length,committed?1:0);
  assert.equal(await restarted.call('claim',{id:a.approvalId,request}),null);
  assert.equal((await restarted.call('reconcile',{id:a.approvalId,invalidEvidence:true})).outcome,'UNKNOWN');
  assert.equal(counts(await restarted.call('snapshot')).exposure,400000);
  assert.equal((await restarted.call('reconcile',{id:a.approvalId})).outcome,committed?'EXECUTED':'NOT_EXECUTED');
  assert.equal((await restarted.call('submit',{claim})).outcome,'REJECTED');
  s=await restarted.call('snapshot'); assert.equal(counts(s).exposure,committed?400000:0); assert.equal(s.records.length,committed?1:0); evidence(t,'crash-' + committed,s);
});

test('delayed worker resumes after recovery and cannot use stale destination authority', async t => {
  const dir=setup(t); const delayed=await open(t,dir), recovery=await open(t,dir);
  const request=createSyntheticPluginRequest('enforced'); const a=await delayed.call('approve',{request}); assert.ok(await delayed.call('claim',{id:a.approvalId,request}));
  assert.equal((await recovery.call('reconcile',{id:a.approvalId})).outcome,'NOT_EXECUTED');
  assert.equal((await delayed.call('submit')).reason,'STALE_AUTHORITY');
  const fresh=createSyntheticPluginRequest('enforced'); const b=await recovery.call('approve',{request:fresh}); assert.ok(await recovery.call('claim',{id:b.approvalId,request:fresh})); await recovery.call('submit'); await recovery.call('ack');
  assert.equal((await delayed.call('submit')).outcome,'REJECTED'); const s=await recovery.call('snapshot'); assert.equal(s.records.length,1); assert.equal(counts(s).exposure,400000); evidence(t,'delayed-worker',s);
});

test('changed request and state, invalid evidence, shadow, REFER and REJECT never authorise', async t => {
  const dir=setup(t); const w1=await open(t,dir), w2=await open(t,dir);
  for (const mode of ['shadow','refer','reject']) {
    const request=createSyntheticPluginRequest(mode==='shadow'?'shadow':'enforced');
    if (mode==='refer') request.businessContext.customerImpactClass='customer_facing';
    if (mode==='reject') request.evidenceReferences.humanApproval='invalid';
    const a=await w1.call('approve',{request}); assert.equal(a.approvalId,null,mode);
  }
  const request=createSyntheticPluginRequest('enforced'); const a=await w1.call('approve',{request});
  const altered=structuredClone(request); altered.proposedAction.nonce += '_changed'; assert.equal(await w2.call('claim',{id:a.approvalId,request:altered}),null);
  const claim=await w1.call('claim',{id:a.approvalId,request}); assert.ok(claim); await w2.call('state');
  assert.equal((await w1.call('submit')).reason,'DESTINATION_STATE_OR_SIGNATURE_CHANGED');
  assert.equal(counts(await w2.call('snapshot')).exposure,400000);
  assert.equal((await w2.call('reconcile',{id:a.approvalId})).outcome,'NOT_EXECUTED'); assert.equal((await w1.call('submit')).outcome,'REJECTED');
  const s=await w2.call('snapshot'); assert.equal(s.records.length,0); assert.equal(counts(s).exposure,0); evidence(t,'state-and-nonauthorising',s);
});

for (const control of ['revoke','stop']) test(control + ' orders before commit, preserves ambiguous exposure, and cannot reverse a committed write', async t => {
  const dir=setup(t); const w1=await open(t,dir), w2=await open(t,dir); const request=createSyntheticPluginRequest('enforced');
  const a=await w1.call('approve',{request}); assert.ok(await w1.call('claim',{id:a.approvalId,request}));
  await w2.call(control, control==='stop'?{active:true}:{id:a.approvalId}); assert.equal((await w1.call('submit')).outcome,'REJECTED');
  assert.equal(counts(await w2.call('snapshot')).exposure,400000); await w2.call('reconcile',{id:a.approvalId});
  if (control==='stop') await w2.call('stop',{active:false});
  const fresh=createSyntheticPluginRequest('enforced'); const b=await w1.call('approve',{request:fresh}); await w1.call('claim',{id:b.approvalId,request:fresh}); await w1.call('submit');
  await w2.call(control,control==='stop'?{active:true}:{id:b.approvalId});
  assert.equal((await w2.call('reconcile',{id:b.approvalId})).outcome,'EXECUTED');
  const s=await w2.call('snapshot'); assert.equal(s.records.length,1); assert.equal(counts(s).exposure,400000); evidence(t,control,s);
});

test('unavailable locked authority fails closed without destination submission', async t => {
  const dir=setup(t); const w=await open(t,dir); const request=createSyntheticPluginRequest('enforced'); const a=await w.call('approve',{request}); await w.call('claim',{id:a.approvalId,request});
  const db=new DatabaseSync(join(dir,'authority.sqlite')); db.exec('BEGIN IMMEDIATE');
  try { assert.equal((await w.call('submit')).outcome,'UNKNOWN'); } finally { db.exec('ROLLBACK'); db.close(); }
  const s=await w.call('snapshot'); assert.equal(s.records.length,0); assert.equal(counts(s).exposure,400000); evidence(t,'storage-unavailable',s);
});
for (const kind of ['physical','snapshot','signature','missing-destination']) test('corrupt/unavailable storage refuses restart: ' + kind, async t => {
  const dir=setup(t); const w=await open(t,dir); const request=createSyntheticPluginRequest('enforced'); const a=await w.call('approve',{request}); await w.call('claim',{id:a.approvalId,request}); await w.kill();
  if (kind==='physical') writeFileSync(join(dir,'authority.sqlite'),'corrupt database');
  else if (kind==='missing-destination') rmSync(join(dir,'destination.sqlite'));
  else { const db=new DatabaseSync(join(dir,'authority.sqlite')); const row=db.prepare('SELECT payload,digest FROM snapshot').get(); const payload=JSON.parse(row.payload);
    if (kind==='signature') payload.approvals[0].decision.gatePass.signature.signature='invalid';
    else payload.core.storeRevision++;
    db.prepare('UPDATE snapshot SET payload=?,digest=?').run(JSON.stringify(payload),kind==='signature'?hash(payload):row.digest); db.close(); }
  const bad=worker(t,dir); assert.equal((await bad.ready).phase,'open-failed');
});

for (const stage of ['authority_before_commit','destination_committed','destination_fenced']) test('kill inside transaction boundary: ' + stage, async t => {
  const dir=setup(t); const w=await open(t,dir); const request=createSyntheticPluginRequest('enforced');
  const a=await w.call('approve',{request}); const claim=await w.call('claim',{id:a.approvalId,request});
  const operation = stage==='destination_fenced'?'reconcile':stage==='destination_committed'?'submit':'stop';
  const response=w.call(operation,{id:a.approvalId,active:true,faultStage:stage});
  const rejected=assert.rejects(response,/Worker exited/);
  assert.equal((await w.barrier()).stage,stage); await w.kill(); await rejected;
  const restarted=await open(t,dir); let s=await restarted.call('snapshot');
  assert.equal(s.authority.emergencyStop.active,false); assert.equal(counts(s).exposure,400000); assert.equal(s.authority.lifecycles[0].status,'RESERVED');
  assert.equal(s.records.length,stage==='destination_committed'?1:0);
  if (stage==='destination_fenced') assert.equal((await restarted.call('submit',{claim})).reason,'DESTINATION_FENCED');
  assert.equal((await restarted.call('reconcile',{id:a.approvalId})).outcome,stage==='destination_committed'?'EXECUTED':'NOT_EXECUTED');
  s=await restarted.call('snapshot'); assert.equal(counts(s).exposure,stage==='destination_committed'?400000:0); evidence(t,stage,s);
});

test('unavailable destination during reconciliation retains reservation', async t => {
  const dir=setup(t); const w=await open(t,dir); const request=createSyntheticPluginRequest('enforced'); const a=await w.call('approve',{request}); await w.call('claim',{id:a.approvalId,request});
  const db=new DatabaseSync(join(dir,'destination.sqlite')); db.exec('BEGIN IMMEDIATE');
  try { assert.equal((await w.call('reconcile',{id:a.approvalId})).outcome,'UNKNOWN'); } finally { db.exec('ROLLBACK'); db.close(); }
  const s=await w.call('snapshot'); assert.equal(counts(s).exposure,400000); assert.equal(s.records.length,0); evidence(t,'lookup-unavailable',s);
});

test('database pairing and policy mismatch fail closed', async t => {
  const dir=setup(t); const other=setup(t); const w=await open(t,dir); await w.kill();
  assert.throws(()=>new SharedPurchaseOrder({stateDirectory:dir,rule:{...DEFAULT_AGGREGATE_EXPOSURE_RULE,maximumAggregateMinorUnits:10}}),/SHARED_POLICY_MISMATCH/);
  const { copyFileSync } = await import('node:fs'); copyFileSync(join(other,'destination.sqlite'),join(dir,'destination.sqlite'));
  const bad=worker(t,dir); assert.equal((await bad.ready).phase,'open-failed');
});

function editSnapshot(dir, filename, edit) {
  const db=new DatabaseSync(join(dir,filename));
  try { const row=db.prepare('SELECT payload FROM snapshot WHERE id=1').get(); const payload=JSON.parse(row.payload); edit(payload); db.prepare('UPDATE snapshot SET payload=?,digest=? WHERE id=1').run(JSON.stringify(payload),hash(payload)); }
  finally { db.close(); }
}
for (const field of ['gatePassId','nonce','both-identifiers','actionDigest','proposedAction','binding']) test('recovery refuses rehashed inconsistent destination evidence: '+field, async t => {
  const dir=setup(t); const w=await open(t,dir); const request=createSyntheticPluginRequest('enforced'); const a=await w.call('approve',{request}); await w.call('claim',{id:a.approvalId,request}); await w.call('submit');
  editSnapshot(dir,'destination.sqlite',d=>{
    const r=d.records[0];
    if(field==='both-identifiers'){r.gatePassId='substituted';r.nonce='substituted';}
    else if(field==='binding')r.binding.businessState.orderVersion++;
    else if(field==='proposedAction')r.proposedAction={...request.proposedAction,quantity:101};
    else r[field]='substituted';
  });
  assert.equal((await w.call('reconcile',{id:a.approvalId})).outcome,'UNKNOWN');
  const s=await w.call('snapshot'); assert.equal(s.records.length,1);assert.equal(counts(s).exposure,400000);assert.equal(s.authority.lifecycles[0].status,'RESERVED');evidence(t,'invalid-'+field,s);
});

for(const limit of [600000,1000000]) test('distinct approval budget inspected before any destination write: '+limit,async t=>{
  const dir=setup(t,limit),w1=await open(t,dir),w2=await open(t,dir);const requests=[createSyntheticPluginRequest('enforced'),createSyntheticPluginRequest('enforced')];
  const approvals=await Promise.all([w1.call('approve',{request:requests[0]}),w2.call('approve',{request:requests[1]})]);
  const expected=limit===600000?1:2;assert.equal(approvals.filter(a=>a.approvalId).length,expected);
  let s=await w1.call('snapshot');assert.equal(s.records.length,0);assert.equal(s.authority.exposureEntries.length,expected);assert.equal(counts(s).exposure,expected*400000);assert.equal(s.authority.exposureEntries.filter(e=>e.status==='OUTSTANDING').length,expected);evidence(t,'issued-budget-'+limit,s);
  const claims=await Promise.all([w1.call('claim',{id:approvals[0].approvalId,request:requests[0]}),w2.call('claim',{id:approvals[1].approvalId,request:requests[1]})]);assert.equal(claims.filter(Boolean).length,expected);
  s=await w2.call('snapshot');const fenceDb=new DatabaseSync(join(dir,'destination.sqlite'));const persistedDestination=JSON.parse(fenceDb.prepare('SELECT payload FROM snapshot').get().payload);fenceDb.close();assert.equal(persistedDestination.fences.length,expected);assert.equal(new Set(persistedDestination.fences.map(f=>f.token)).size,expected);assert.equal(s.records.length,0);assert.equal(s.authority.exposureEntries.filter(e=>e.status==='RESERVED').length,expected);assert.equal(counts(s).exposure,expected*400000);assert.equal(new Set(s.authority.exposureEntries.map(e=>e.gatePassId)).size,expected);evidence(t,'reserved-budget-'+limit,s);
  if(expected===2){const submissions=await Promise.all([w1.call('submit'),w2.call('submit')]);assert.equal(submissions.filter(r=>r.outcome==='EXECUTED').length,1);assert.equal(submissions.filter(r=>r.reason==='DESTINATION_ALREADY_RECORDED').length,1);s=await w1.call('snapshot');assert.equal(counts(s).exposure,800000);assert.equal(s.records.length,1);evidence(t,'one-order-with-two-reservations',s);}
});

for(const stage of ['issuance_committed','fence_registered']) test('crash-created orphan remains held and cannot be reused: '+stage,async t=>{
  const dir=setup(t,400000),dying=await open(t,dir);const request=createSyntheticPluginRequest('enforced');let approval;
  if(stage==='fence_registered')approval=await dying.call('approve',{request});
  const response=dying.call(stage==='issuance_committed'?'approve':'claim',{request,id:approval?.approvalId,faultStage:stage});const rejected=assert.rejects(response,/Worker exited/);
  assert.equal((await dying.barrier()).stage,stage);await dying.kill();await rejected;
  const restarted=await open(t,dir);let s=await restarted.call('snapshot');assert.equal(s.records.length,0);assert.equal(counts(s).exposure,400000);assert.equal(s.authority.lifecycles[0].status,'ISSUED');
  const db=new DatabaseSync(join(dir,'authority.sqlite'));const a=JSON.parse(db.prepare('SELECT payload FROM snapshot').get().payload);db.close();
  if(stage==='issuance_committed'){assert.equal(a.approvals.length,0);assert.equal(await restarted.call('claim',{id:s.authority.lifecycles[0].gatePassId,request}),null);assert.equal((await restarted.call('reconcile',{id:s.authority.lifecycles[0].gatePassId})).outcome,'UNKNOWN');}
  else{
    assert.equal(a.approvals[0].token,null);await assert.rejects(restarted.call('claim',{id:approval.approvalId,request}),/DESTINATION_FENCE_EXISTS/);
    const ddb=new DatabaseSync(join(dir,'destination.sqlite'));const d=JSON.parse(ddb.prepare('SELECT payload FROM snapshot').get().payload);ddb.close();assert.equal(d.fences.length,1);
    assert.equal((await restarted.call('submit',{claim:{approvalId:approval.approvalId,token:d.fences[0].token}})).reason,'STALE_AUTHORITY');
    assert.equal((await restarted.call('reconcile',{id:approval.approvalId})).outcome,'REJECTED');
    assert.equal((await restarted.call('revoke',{id:approval.approvalId})).reasonCode,'GATEPASS_REVOCATION_REQUIRES_RECONCILIATION');
  }
  const replay=await restarted.call('approve',{request});assert.equal(replay.approvalId,null);assert.ok(['REJECT','REFER'].includes(replay.decision.outcome));assert.equal(replay.decision.gatePass,null);
  const fresh=await restarted.call('approve',{request:createSyntheticPluginRequest('enforced')});assert.equal(fresh.decision.outcome,'REFER');assert.equal(fresh.approvalId,null);
  s=await restarted.call('snapshot');assert.equal(s.records.length,0);assert.equal(counts(s).exposure,400000);evidence(t,'orphan-'+stage,s);
});
for(const control of ['stop','revoke']) test('concurrent '+control+' waits for independently committed destination while authority lock is held',async t=>{
  const dir=setup(t),w1=await open(t,dir),w2=await open(t,dir);const request=createSyntheticPluginRequest('enforced');const a=await w1.call('approve',{request});await w1.call('claim',{id:a.approvalId,request});
  const submission=w1.call('submit',{faultStage:'destination_committed'});assert.equal((await w1.barrier()).stage,'destination_committed');
  const controlled=w2.call(control,control==='stop'?{active:true}:{id:a.approvalId});w1.child.stdin.write('r');
  assert.equal((await submission).outcome,'EXECUTED');await controlled;assert.equal((await w2.call('reconcile',{id:a.approvalId})).outcome,'EXECUTED');
  const s=await w2.call('snapshot');assert.equal(s.records.length,1);assert.equal(counts(s).exposure,400000);evidence(t,'concurrent-'+control,s);
});
