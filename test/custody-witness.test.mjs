import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { randomUUID } from 'node:crypto';
import { mkdirSync,cpSync,writeFileSync,readFileSync,renameSync } from 'node:fs';
import { resolve,join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createCustodyFixture,FIXTURE_NOW } from '../scripts/custody-fixture.mjs';
import { CustodyWitness,dispatchWitnessCommand } from '../dist/src/custody-witness.js';
import { issueExactActionGatePass } from '../dist/src/exact-action-gatepass.js';

const parent=resolve('.atg-evaluation/custody-tests');mkdirSync(parent,{recursive:true});
function fixture(t){const f=createCustodyFixture(join(parent,randomUUID()));const w=f.open();t.after(()=>w.close());return {...f,w};}
function row(f){const db=new DatabaseSync(f.path,{readOnly:true});try{return db.prepare('SELECT * FROM resource').get();}finally{db.close();}}
function child(t,f,args=[]){const p=spawn(process.execPath,[resolve('scripts/custody-worker.mjs'),f.custody,...args],{stdio:['pipe','pipe','pipe']});
  let stderr='';p.stderr.on('data',b=>{stderr+=b;});t.after(()=>{if(p.exitCode===null)p.kill('SIGKILL');});
  return {p,get stderr(){return stderr;},call(message,raw=false){return new Promise((resolve,reject)=>{
    let buffer='';const timer=setTimeout(()=>{cleanup();reject(Error('TEST_REPLY_TIMEOUT '+stderr));},5000);
    const data=b=>{buffer+=b;const i=buffer.indexOf('\n');if(i>=0){cleanup();resolve(JSON.parse(buffer.slice(0,i)));}};
    const exit=()=>{cleanup();reject(Error('TEST_CHILD_EXIT '+stderr));};
    function cleanup(){clearTimeout(timer);p.stdout.off('data',data);p.off('exit',exit);}
    p.stdout.on('data',data);p.once('exit',exit);p.stdin.write((raw?message:JSON.stringify(message))+'\n');
  })}};}

test('fresh public-only trust verifies core GatePass; synthetic record and one-use state commit together',t=>{
  const f=fixture(t),g=f.grant();assert.equal(Object.keys(f.trust).some(k=>/private/i.test(k)),false);
  assert.equal(f.w.execute(g).outcome,'EXECUTED');assert.equal(row(f).version,2);
  assert.equal(f.w.execute(structuredClone(g)).reason,'AUTHORITY_ALREADY_USED_OR_REVOKED');
  assert.equal(f.w.lookup(g).outcome,'EXECUTED');assert.equal(row(f).version,2);
});
for(const field of ['value','payeeReference','amountMinorUnits','currency','expectedVersion'])test('post-approval '+field+' substitution never changes the synthetic record',t=>{
  const f=fixture(t),g=f.grant();g.proposedAction.canonicalArguments[field]=field==='amountMinorUnits'?1:field==='expectedVersion'?2:field==='currency'?'USD':field==='payeeReference'?'fixture-bank-B':'changed';
  assert.equal(f.w.execute(g).outcome,'REJECTED');assert.equal(row(f).version,1);
});
test('public repository fixture key cannot sign for the freshly pinned authority',t=>{
  const f=fixture(t),g=f.grant();g.issuance=issueExactActionGatePass(g.proposedAction);
  assert.equal(f.w.execute(g).outcome,'REJECTED');assert.equal(row(f).version,1);
});
test('different witness domain refuses the signed grant even when the same key is pinned',t=>{
  const f=fixture(t),path=join(f.custody,'different-domain.sqlite'),trust={...f.trust,domainId:randomUUID()};
  CustodyWitness.create(path,trust);const w=new CustodyWitness({path,trust,now:()=>new Date(FIXTURE_NOW)});t.after(()=>w.close());
  assert.equal(w.execute(f.grant()).outcome,'REJECTED');
});
test('expiry and future authority refuse execution; expiry does not hide an existing outcome',t=>{
  const f=fixture(t),g=f.grant();assert.equal(f.w.execute(g).outcome,'EXECUTED');
  f.setNow('2026-11-10T08:36:00.000Z');assert.equal(f.w.execute(g).outcome,'REJECTED');assert.equal(f.w.lookup(g).outcome,'EXECUTED');
  f.setNow('2026-11-10T08:29:00.000Z');assert.equal(f.w.execute(f.grant()).outcome,'REJECTED');
});
test('idempotency and nonce collisions across freshly signed grants cannot create another effect',t=>{
  const f=fixture(t),g=f.grant();assert.equal(f.w.execute(g).outcome,'EXECUTED');
  for(const override of [{nonce:g.proposedAction.nonce},{idempotencyKey:g.proposedAction.idempotencyKey}]) {
    assert.equal(f.w.execute(f.grant(override,{expectedVersion:2,value:'second'})).reason,'AUTHORITY_ALREADY_USED_OR_REVOKED');
  }assert.equal(row(f).version,2);
});
test('authority that expires during lock acquisition cannot commit consumption or a record',t=>{
  const f=fixture(t),g=f.grant();let calls=0;
  const w=new CustodyWitness({path:f.path,trust:f.trust,now:()=>new Date(calls++===0?FIXTURE_NOW:'2026-11-10T08:36:00.000Z')});
  t.after(()=>w.close());assert.equal(w.execute(g).reason,'AUTHORITY_INVALID_AFTER_LOCK');
  assert.equal(row(f).version,1);assert.equal(f.w.lookup(g).outcome,'NOT_RECORDED');
});
test('changed destination version requires a fresh valid approval',t=>{
  const f=fixture(t),a=f.grant(),b=f.grant();assert.equal(f.w.execute(a).outcome,'EXECUTED');
  assert.equal(f.w.execute(b).reason,'RESOURCE_VERSION_CHANGED');assert.equal(f.w.execute(f.grant({}, {expectedVersion:2,value:'second'})).outcome,'EXECUTED');
});
test('trusted-controller revocation and emergency stop persist across writer restart',t=>{
  const f=fixture(t),g=f.grant();assert.equal(f.w.revoke(g).reason,'AUTHORITY_REVOKED');f.w.close();
  const w=f.open();t.after(()=>w.close());assert.equal(w.execute(g).reason,'AUTHORITY_ALREADY_USED_OR_REVOKED');
  w.stop();w.close();const stopped=f.open();t.after(()=>stopped.close());assert.equal(stopped.execute(f.grant()).reason,'WITNESS_STOPPED');
});
test('revocation does not reverse a committed synthetic effect',t=>{
  const f=fixture(t),g=f.grant();assert.equal(f.w.execute(g).outcome,'EXECUTED');
  assert.equal(f.w.revoke(g).reason,'ALREADY_RECORDED_REVOCATION_NOT_REVERSAL');assert.equal(f.w.lookup(g).outcome,'EXECUTED');
});
test('agent command protocol exposes no setup, key selection, administration or caller clock',t=>{
  const f=fixture(t),g=f.grant();
  for(const m of [null,[],{op:'stop',grant:g},{op:'revoke',grant:g},{op:'create',grant:g},{op:'execute',grant:g,path:f.path},
    {op:'execute',grant:g,now:FIXTURE_NOW},{op:'execute',grant:g,trust:f.trust}]) assert.equal(dispatchWitnessCommand(f.w,m).reason,'WITNESS_COMMAND_INVALID');
  assert.equal(dispatchWitnessCommand(f.w,{op:'execute',grant:g}).outcome,'EXECUTED');
});
test('malformed, cyclic, oversized and getter-bearing input cannot execute or invoke getters',t=>{
  const f=fixture(t);let reads=0;const getter={};Object.defineProperty(getter,'issuance',{enumerable:true,get(){reads++;return null;}});
  const cycle={};cycle.self=cycle;
  for(const x of [null,[],{},getter,cycle,{large:'x'.repeat(65537)}]) assert.equal(f.w.execute(x).outcome,'REJECTED');
  assert.equal(reads,0);assert.equal(row(f).version,1);
});
test('explicit setup refuses existing state and ordinary opening refuses missing state or trust changes',t=>{
  const f=fixture(t);assert.throws(()=>CustodyWitness.create(f.path,f.trust),/EEXIST/);
  assert.throws(()=>new CustodyWitness({path:join(f.custody,'missing.sqlite'),trust:f.trust}),/ENOENT/);
  assert.throws(()=>new CustodyWitness({path:f.path,trust:{...f.trust,issuerKeyId:randomUUID()}}),/TRUST_OR_STATE_CHANGED/);
});
test('closed or corrupt witness returns UNKNOWN without an effect or automatic retry',t=>{
  const f=fixture(t),g=f.grant();f.w.close();const r=f.w.execute(g);assert.equal(r.outcome,'UNKNOWN');assert.equal(r.automaticRetryPermitted,false);
  const path=join(f.custody,'broken.sqlite');writeFileSync(path,'not a database');assert.throws(()=>new CustodyWitness({path,trust:f.trust}));
});
test('a failed synthetic write rolls back consumption and record together; outcome stays UNKNOWN until lookup',t=>{
  const f=fixture(t),g=f.grant(),db=new DatabaseSync(f.path);
  db.exec("CREATE TRIGGER fail_update BEFORE UPDATE ON resource BEGIN SELECT RAISE(ABORT,'fixture failure'); END");db.close();
  assert.equal(f.w.execute(g).outcome,'UNKNOWN');assert.equal(row(f).version,1);assert.equal(f.w.lookup(g).outcome,'NOT_RECORDED');
  const inspect=new DatabaseSync(f.path,{readOnly:true});assert.equal(inspect.prepare('SELECT count(*) AS n FROM decisions').get().n,0);inspect.close();
});
test('retained SECURITY FAIL: common-owner direct SQL can change protected business state without any grant',t=>{
  const f=fixture(t),db=new DatabaseSync(f.path);db.prepare('UPDATE resource SET version=777,value=?').run('attacker changed');db.close();
  assert.equal(row(f).version,777);assert.equal(row(f).value,'attacker changed');
  assert.equal(f.w.execute(f.grant()).reason,'RESOURCE_VERSION_CHANGED');
  t.diagnostic('Successful common-owner direct SQL attack: SECURITY FAIL. A stale-version refusal does not undo the unauthorised database effect.');
});
test('restoring or rewriting agent cache cannot reset the separately retained witness record',t=>{
  const f=fixture(t),g=f.grant(),cache=join(f.agent,'grant.json');writeFileSync(cache,JSON.stringify(g));
  const clone=join(f.root,'agent-copy');cpSync(f.agent,clone,{recursive:true});
  assert.equal(f.w.execute(JSON.parse(readFileSync(cache))).outcome,'EXECUTED');
  writeFileSync(join(clone,'fake-consumption.json'),JSON.stringify({used:false,checksum:'recomputed'}));
  assert.equal(f.w.execute(JSON.parse(readFileSync(join(clone,'grant.json')))).reason,'AUTHORITY_ALREADY_USED_OR_REVOKED');
});
test('two actual writer processes sharing one authoritative store commit one effect',async t=>{
  const f=fixture(t),g=f.grant(),a=child(t,f),b=child(t,f);
  const results=await Promise.all([a.call({op:'execute',grant:g}),b.call({op:'execute',grant:g})]);
  assert.equal(results.filter(r=>r.outcome==='EXECUTED').length,1);assert.equal(results.filter(r=>r.outcome==='REJECTED').length,1);assert.equal(row(f).version,2);
});
test('writer killed after commit before acknowledgement reconciles without another effect',async t=>{
  const f=fixture(t),g=f.grant(),a=child(t,f,['--pause-after-commit']);
  const barrier=await a.call({op:'execute',grant:g});assert.equal(barrier.barrier,'after_commit');
  const exited=once(a.p,'exit');a.p.kill('SIGKILL');await exited;
  assert.equal(f.w.lookup(g).outcome,'EXECUTED');assert.equal(f.w.execute(g).reason,'AUTHORITY_ALREADY_USED_OR_REVOKED');assert.equal(row(f).version,2);
});
test('wire parser refuses malformed JSON and oversized frames without an effect',async t=>{
  const f=fixture(t),a=child(t,f);
  assert.equal((await a.call({op:'stop',grant:f.grant()})).reason,'WITNESS_COMMAND_INVALID');
  assert.equal((await a.call('not-json',true)).reason,'FRAME_INVALID');
  assert.equal((await a.call({op:'execute',grant:{large:'x'.repeat(70000)}})).reason,'FRAME_TOO_LARGE');assert.equal(row(f).version,1);
});
test('retained SECURITY FAIL: restoring the witness too permits duplicate execution in a common-owner clone',t=>{
  const f=fixture(t),g=f.grant();f.w.close();const copied=join(f.root,'copied-controller');cpSync(f.custody,copied,{recursive:true});
  const original=f.open(),clone=new CustodyWitness({path:join(copied,'witness.sqlite'),trust:f.trust,now:()=>new Date(FIXTURE_NOW)});
  t.after(()=>original.close());t.after(()=>clone.close());
  assert.equal(original.execute(g).outcome,'EXECUTED');assert.equal(clone.execute(g).outcome,'EXECUTED');
  t.diagnostic('Successful common-owner witness clone attack: SECURITY FAIL, not a defeated attack or production clearance.');
});
