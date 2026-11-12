import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync,rmSync,cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createDelegatedCustodyFixture } from '../scripts/delegated-custody-fixture.mjs';
import { CustodyWitness } from '../dist/src/custody-witness.js';
import { handleBrokerRequest } from '../dist/src/openshell-transaction-broker.js';
import { canonicalWire } from '../scripts/openshell-broker-client.mjs';
import { brokerRequest } from '../scripts/openshell-broker-client.mjs';
import { startSyntheticBroker } from '../scripts/openshell-broker.mjs';
import { custodyTlsFixture } from '../scripts/custody-tls-fixture.mjs';
import { delegatedTlsClient } from '../scripts/delegated-custody-tls-fixture.mjs';
import { readFileSync,mkdirSync } from 'node:fs';
const setup=(t,opts)=>{const root=mkdtempSync(join(tmpdir(),'atg-combined-'));const f=createDelegatedCustodyFixture(join(root,'new'),opts),w=f.open();t.after(()=>{w.close();rmSync(root,{recursive:true,force:true});});
  const read=()=>{const d=new DatabaseSync(f.path,{readOnly:true});try{return {account:d.prepare('SELECT * FROM delegated_account').get(),resource:d.prepare('SELECT * FROM resource').get(),actions:d.prepare('SELECT * FROM delegated_actions').all(),approval:d.prepare('SELECT * FROM approval_audit').all(),decisions:d.prepare('SELECT * FROM decisions').all()};}finally{d.close();}};return {...f,w,read};};
const wire=r=>Buffer.from(canonicalWire({grant:r.grant,payload:r.grant.proposedAction.canonicalArguments}));
const call=(f,r,path='/v1/synthetic-record/commit',ctx=r.ctx)=>handleBrokerRequest(f.w,'POST',path,wire(r),ctx);

test('one HTTP route atomically binds passkey, signed sub-agent chain, shared budget and versioned effect',t=>{
  const f=setup(t),r=f.request();const prepared=f.approve(f.w,r);
  assert.deepEqual(prepared.delegatedAuthority.agentChain,['agent-A','agent-B']);
  assert.equal(call(f,r).outcome,'EXECUTED');assert.equal(call(f,r).outcome,'REJECTED');
  const s=f.read();assert.equal(s.resource.version,2);assert.equal(s.account.committed,300000);
  assert.equal(s.actions.length,1);assert.equal(s.approval.length,1);assert.equal(s.decisions.length,1);
  assert.equal(call(f,r,'/v1/synthetic-record/lookup').outcome,'EXECUTED');
  assert.equal(f.read().account.committed,300000);
});
test('two agents with distinct valid mandates share a root account ceiling across versioned writes',t=>{
  const f=setup(t),one=f.request({leaf:'agent-A',amount:300000});f.approve(f.w,one,1);
  assert.equal(call(f,one).outcome,'EXECUTED');
  const two=f.request({leaf:'agent-B',amount:200000,version:2});f.approve(f.w,two,2);
  assert.equal(call(f,two).outcome,'EXECUTED');
  const extra=f.request({amount:1,version:3});f.approve(f.w,extra,3);
  assert.equal(call(f,extra).reason,'SHARED_ROOT_OR_MANDATE_BUDGET_EXCEEDED');
  const s=f.read();assert.equal(s.account.committed,500000);assert.equal(s.resource.version,3);assert.equal(s.approval.length,2);
});
test('budget refusal does not consume an approval or advance destination state',t=>{
  const f=setup(t,{ceiling:250000,mandateCeiling:250000}),r=f.request({amount:300000});f.approve(f.w,r);
  assert.equal(call(f,r).outcome,'REJECTED');const s=f.read();assert.equal(s.approval.length,0);assert.equal(s.actions.length,0);assert.equal(s.resource.version,1);
});
test('transport identity cannot come from the request or a self-declared caller field',t=>{
  const f=setup(t),r=f.request();f.approve(f.w,r);
  assert.equal(handleBrokerRequest(f.w,'POST','/v1/synthetic-record/commit',wire(r)).outcome,'REJECTED');
  assert.equal(call(f,r,undefined,{agentId:'agent-A',transportCredentialFingerprint:r.ctx.transportCredentialFingerprint}).outcome,'REJECTED');
  assert.equal(call(f,r,undefined,{...r.ctx,transportCredentialFingerprint:'0'.repeat(64)}).outcome,'REJECTED');
  const b={grant:r.grant,payload:r.grant.proposedAction.canonicalArguments,caller:r.ctx};
  assert.equal(handleBrokerRequest(f.w,'POST','/v1/synthetic-record/commit',Buffer.from(canonicalWire(b)),r.ctx).outcome,'REJECTED');
  assert.equal(f.read().resource.version,1);
});
test('actual body changes, wrong destination, scope, chain and missing passkey cannot execute',t=>{
  const f=setup(t),r=f.request();f.approve(f.w,r);
  for(const [k,v] of [['expectedVersion',2],['amountMinorUnits',1],['value','altered'],['payeeReference','fixture-bank-B']]){
    const body={grant:r.grant,payload:{...r.grant.proposedAction.canonicalArguments,[k]:v}};
    assert.equal(handleBrokerRequest(f.w,'POST','/v1/synthetic-record/commit',Buffer.from(canonicalWire(body)),r.ctx).outcome,'REJECTED');
  }
  for(const mutate of [g=>delete g.humanApproval,g=>g.delegatedRequest.delegations.reverse(),g=>g.delegatedRequest.action.payloadDigest='0'.repeat(64),g=>g.delegatedRequest.mandate.body.maxTotalMinor=999999]){
    const c=structuredClone(r);mutate(c.grant);assert.equal(call(f,c).outcome,'REJECTED');
  }
  assert.equal(f.read().account.committed,0);
});
test('mandate revocation, emergency stop, stale destination version and invalid signed scope all fail closed',t=>{
  const f=setup(t),r=f.request();f.approve(f.w,r);f.w.revokeDelegatedMandate(r.grant.delegatedRequest.mandate.body.mandateId);
  assert.equal(call(f,r).reason,'DELEGATED_MANDATE_REVOKED');
  const wrong=f.request({scopeOverrides:{destinationId:'other-destination'}});
  assert.throws(()=>f.approve(f.w,wrong));
  f.w.stop();assert.equal(call(f,r).reason,'WITNESS_STOPPED');assert.equal(f.read().account.committed,0);
});
test('effect failure rolls back budget, challenge, counter and one-use together',t=>{
  const f=setup(t),r=f.request();f.approve(f.w,r);const d=new DatabaseSync(f.path);
  d.exec("CREATE TRIGGER injected_failure BEFORE UPDATE ON resource BEGIN SELECT RAISE(ABORT,'synthetic fault'); END");d.close();
  assert.equal(call(f,r).outcome,'UNKNOWN');const s=f.read();assert.equal(s.account.committed,0);assert.equal(s.approval.length,0);assert.equal(s.actions.length,0);assert.equal(s.resource.version,1);
});
test('lost acknowledgement holds committed exposure and explicit historical lookup never spends again',t=>{
  const f=setup(t),r=f.request();f.approve(f.w,r);const execute=f.w.execute.bind(f.w);
  f.w.execute=(...args)=>{execute(...args);throw Error('synthetic post-commit disconnect');};
  assert.equal(call(f,r).outcome,'UNKNOWN');assert.equal(f.read().account.committed,300000);assert.equal(f.read().resource.version,2);
  f.w.execute=execute;assert.equal(call(f,r).outcome,'REJECTED');
  f.setNow('2026-11-12T13:00:00.000Z');assert.equal(call(f,r,'/v1/synthetic-record/lookup').outcome,'EXECUTED');
  assert.equal(f.read().account.committed,300000);assert.equal(f.read().actions.length,1);
});
test('configured budget cannot be removed on reopen; administrator clone remains an explicit successful attack',t=>{
  const f=setup(t),r=f.request();f.approve(f.w,r);const altered={...f.trust};delete altered.delegatedBudget;
  assert.throws(()=>new CustodyWitness({path:f.path,trust:altered}),/TRUST_OR_STATE_CHANGED/);
  const path=join(f.root,'admin-clone.sqlite');cpSync(f.path,path);const clone=new CustodyWitness({path,trust:f.trust,now:()=>new Date(f.getNow())});
  try{assert.equal(call(f,r).outcome,'EXECUTED');assert.equal(clone.execute(r.grant,r.ctx).outcome,'EXECUTED');}finally{clone.close();}
});

test('real pinned mTLS derives each leaf identity from its certificate and shares one atomic account',async t=>{
  const f=setup(t),root=join(f.root,'tls');mkdirSync(root);
  const tls=custodyTlsFixture(root),a=delegatedTlsClient(root,tls,f.keys['agent-A'],'leaf-a'),b=delegatedTlsClient(root,tls,f.keys['agent-B'],'leaf-b');
  const broker=await startSyntheticBroker({writer:f.w,ca:readFileSync(tls.caPath),cert:readFileSync(tls.server.certPath),key:readFileSync(tls.server.keyPath),clientFingerprint:b.fingerprint,
    delegatedClients:{[a.fingerprint]:'agent-A',[b.fingerprint]:'agent-B'}});t.after(()=>broker.close());
  const config=c=>({host:'127.0.0.1',port:broker.port,caPath:tls.caPath,certPath:c.certPath,keyPath:c.keyPath,serverFingerprint:tls.server.fingerprint});
  const body=r=>({grant:r.grant,payload:r.grant.proposedAction.canonicalArguments});
  const first=f.request();f.approve(f.w,first,1);
  assert.equal((await brokerRequest(config(a),body(first))).outcome,'REJECTED','A certificate cannot impersonate B');
  assert.equal((await brokerRequest(config(tls.client),body(first))).outcome,'REJECTED','CA trust alone cannot replace pinned leaf registry');
  const raced=await Promise.all([brokerRequest(config(b),body(first)),brokerRequest(config(b),body(first))]);
  assert.deepEqual(raced.map(x=>x.outcome).sort(),['EXECUTED','REJECTED']);
  const over=f.request({leaf:'agent-A',amount:250000,version:2});f.approve(f.w,over,2);
  assert.equal((await brokerRequest(config(a),body(over))).reason,'SHARED_ROOT_OR_MANDATE_BUDGET_EXCEEDED');
  const second=f.request({leaf:'agent-A',amount:200000,version:2});f.approve(f.w,second,3);
  assert.equal((await brokerRequest(config(a),body(second))).outcome,'EXECUTED');
  assert.equal(f.read().account.committed,500000);assert.equal(f.read().resource.version,3);
});

test('separate signed outcome must match the authoritative effect; absence cannot refund a committed budget',t=>{
  const f=setup(t),r=f.request();f.approve(f.w,r);const gateId=r.grant.issuance.gatePass.gatePassId;
  const good=f.outcomeEvidence(r);
  assert.equal(f.w.recordDelegatedOutcomeEvidence(gateId,good).outcome,'REJECTED','No record yet');
  assert.equal(call(f,r).outcome,'EXECUTED');
  assert.equal(f.w.recordDelegatedOutcomeEvidence(gateId,f.outcomeEvidence(r,'NO_EFFECT')).outcome,'REJECTED');
  assert.equal(f.w.recordDelegatedOutcomeEvidence(gateId,{...good,signature:'A'.repeat(86)}).outcome,'UNKNOWN');
  assert.equal(f.read().account.committed,300000);
  assert.equal(f.w.recordDelegatedOutcomeEvidence(gateId,good).outcome,'EXECUTED');
  assert.equal(f.w.recordDelegatedOutcomeEvidence(gateId,good).outcome,'UNKNOWN','Replay does not create a second audit');
  const db=new DatabaseSync(f.path,{readOnly:true});try{assert.equal(db.prepare('SELECT count(*) AS n FROM delegated_outcome_audit').get().n,1);}finally{db.close();}
});

test('shared mandate cap, restart and rollback clock cannot reset cumulative exposure',t=>{
  const f=setup(t,{mandateCeiling:350000}),r=f.request({mandateId:'one-mandate'});f.approve(f.w,r,1);
  assert.equal(call(f,r).outcome,'EXECUTED');
  const over=f.request({leaf:'agent-A',amount:60000,version:2,mandateId:'one-mandate'});f.approve(f.w,over,2);
  assert.equal(call(f,over).reason,'SHARED_ROOT_OR_MANDATE_BUDGET_EXCEEDED');
  const reopened=f.open();try{assert.equal(reopened.execute(r.grant,r.ctx).outcome,'REJECTED');}finally{reopened.close();}
  f.setNow('2026-11-12T11:59:59.000Z');const back=f.request({amount:1,version:2});f.approve(f.w,back,3);
  assert.equal(call(f,back).outcome,'UNKNOWN');assert.equal(f.read().account.committed,300000);assert.equal(f.read().resource.version,2);
});

test('historical completion cannot be relabelled with a different valid delegation mandate',t=>{
  const f=setup(t),r=f.request();f.approve(f.w,r);assert.equal(call(f,r).outcome,'EXECUTED');
  const other=f.request({actionOverrides:{actionId:r.grant.issuance.gatePass.gatePassId}});
  const rewritten=structuredClone(r);delete rewritten.grant.humanApproval;
  rewritten.grant.delegatedRequest=other.grant.delegatedRequest;
  assert.equal(call(f,rewritten,'/v1/synthetic-record/lookup').outcome,'UNKNOWN');
  assert.equal(call(f,r,'/v1/synthetic-record/lookup').outcome,'EXECUTED');
  assert.equal(f.read().account.committed,300000);
});
