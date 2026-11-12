import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawn } from 'node:child_process';
import { cpSync,mkdtempSync,rmSync,writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join,resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createDelegatedBudgetFixture, signFixture } from '../scripts/delegated-budget-fixture.mjs';
import { SyntheticDelegatedBudgetWriter, budgetPublicKeyFingerprint } from '../dist/src/delegated-budget-witness.js';

function setup(t, options={}) {
  const root=mkdtempSync(join(tmpdir(),'atg-shared-budget-v1-'));
  const f=createDelegatedBudgetFixture(root,options);
  const w=f.open();
  t.after(()=>{w.close();rmSync(root,{recursive:true,force:true});});
  const read=()=>{
    const d=new DatabaseSync(f.path,{readOnly:true});
    try {
      return {account:d.prepare('SELECT * FROM account').get(),
        mandates:d.prepare('SELECT * FROM mandates ORDER BY id').all(),
        actions:d.prepare('SELECT * FROM actions ORDER BY action_id').all(),
        revocations:d.prepare('SELECT * FROM revocations').all()};
    } finally{d.close();}
  };
  return {...f,w,read};
}
const deny=(x,req,ctx)=>{const a=x.w.execute(req,ctx);assert.equal(a.outcome,'REJECTED',a.reason);assert.equal(a.automaticRetryPermitted,false);return a;};

test('two signed agents share one root account ceiling: £3,000 + £2,000, then overspend refused',t=>{
  const x=setup(t);
  const b=x.request({leaf:'agent-B',amountMinor:300000});
  const a=x.request({leaf:'agent-A',amountMinor:200000});
  assert.equal(x.w.execute(b.req,b.ctx).outcome,'COMMITTED');
  assert.equal(x.w.execute(a.req,a.ctx).outcome,'COMMITTED');
  const outside=x.request({leaf:'agent-B',amountMinor:1});
  assert.equal(deny(x,outside.req,outside.ctx).reason,'ROOT_OR_MANDATE_BUDGET_EXCEEDED');
  const state=x.read();
  assert.equal(state.account.ceiling,500000);assert.equal(state.account.committed,500000);assert.equal(state.account.held,0);
  assert.equal(state.actions.length,2);assert.equal(x.w.lookup(b.req.action.actionId).outcome,'COMMITTED');
  assert.equal(x.w.lookup(a.req.action.actionId).outcome,'COMMITTED');
});

test('distinct valid root mandates cannot reset the root account allowance',t=>{
  const x=setup(t);
  const first=x.request({amountMinor:300000,mandateId:'mandate-one'});
  const second=x.request({leaf:'agent-A',amountMinor:200000,mandateId:'mandate-two'});
  const third=x.request({leaf:'agent-A',amountMinor:1,mandateId:'mandate-three'});
  assert.equal(x.w.execute(first.req,first.ctx).outcome,'COMMITTED');
  assert.equal(x.w.execute(second.req,second.ctx).outcome,'COMMITTED');
  assert.equal(deny(x,third.req,third.ctx).reason,'ROOT_OR_MANDATE_BUDGET_EXCEEDED');
  assert.equal(x.read().account.committed,500000);
});

test('mandate-specific sub-limit is enforced even when root account has spare capacity',t=>{
  const x=setup(t,{maxTotalMinor:250000});
  const id='mandate-small';
  const a=x.request({leaf:'agent-A',amountMinor:200000,mandateId:id});
  const b=x.request({leaf:'agent-B',amountMinor:60000,mandateId:id});
  assert.equal(x.w.execute(a.req,a.ctx).outcome,'COMMITTED');
  assert.equal(deny(x,b.req,b.ctx).reason,'ROOT_OR_MANDATE_BUDGET_EXCEEDED');
  assert.equal(x.read().account.committed,200000);
});

test('changing signed parent or child scopes is refused before a budget effect',t=>{
  const changes=[
    ['wider child allowance', d=>{d.maxPerActionMinor=400001;}],
    ['later child expiry', d=>{d.expiresAt='2026-11-12T12:15:00.000Z';}],
    ['different payee',d=>{d.payeeId='attacker-payee';}],
    ['different tenant',d=>{d.tenantId='tenant-B';}],
    ['different account',d=>{d.accountId='account-B';}],
    ['different destination',d=>{d.destinationId='attacker-destination';}],
    ['different tool',d=>{d.toolId='system.shell';}],
    ['different mission',d=>{d.missionId='other-mission';}],
    ['different currency',d=>{d.currency='USD';}],
    ['extra delegation depth',d=>{d.remainingHops=2;}],
    ['switched parent',d=>{d.parentId='organisation-A';}],
  ];
  for(const [label,modify] of changes) {
    const x=setup(t),r=x.request();
    const second=structuredClone(r.req.delegations[1].body);
    modify(second);r.req.delegations[1]=x.resignSecond(second);
    r.req.leafSignature=x.resignAction(r.req);
    deny(x,r.req,r.ctx);
    assert.equal(x.read().actions.length,0,label);
  }
});

test('wrong root, changed domain, forged root, changed action, reordering and unregistered signer all refuse',t=>{
  const x=setup(t);
  const cases=[];
  let r=x.request();r.req.mandate.body.accountId='account-B';cases.push(r);
  r=x.request();r.req.mandate=x.resignMandate({...r.req.mandate.body,domainId:'other-domain'});r.req.leafSignature=x.resignAction(r.req);cases.push(r);
  r=x.request();r.req.mandate.signature='A'.repeat(86);cases.push(r);
  r=x.request();r.req.action.amountMinor+=1;cases.push(r);
  r=x.request();r.req.delegations.reverse();cases.push(r);
  r=x.request();r.req.delegations[1].body.childId='agent-C';cases.push(r);
  r=x.request();r.req.delegations[1].signature=r.req.delegations[0].signature;cases.push(r);
  r=x.request();r.req.action.destinationId='external-payment-rail';r.req.leafSignature=x.resignAction(r.req);cases.push(r);
  r=x.request();r.req.action.payeeId='supplier-B';r.req.leafSignature=x.resignAction(r.req);cases.push(r);
  r=x.request();r.req.action.tenantId='tenant-B';r.req.leafSignature=x.resignAction(r.req);cases.push(r);
  for(const c of cases) deny(x,c.req,c.ctx);
  assert.equal(x.read().account.committed,0);assert.equal(x.read().actions.length,0);
});

test('leaf signing and authenticated transport identity must agree with pinned registered key',t=>{
  const x=setup(t),r=x.request();
  deny(x,r.req,{...r.ctx,agentId:'agent-A'});
  deny(x,r.req,{...r.ctx,transportCredentialFingerprint:'0'.repeat(64)});
  deny(x,r.req,{agentId:'agent-C',transportCredentialFingerprint:budgetPublicKeyFingerprint(x.keys['agent-C'].publicKeyPem)});
  assert.equal(x.w.execute(r.req,r.ctx).outcome,'COMMITTED');
  const repeated=x.w.execute(r.req,r.ctx);
  assert.equal(repeated.reason,'ACTION_ALREADY_RECORDED');assert.equal(repeated.automaticRetryPermitted,false);
  assert.equal(x.read().actions.length,1);
});

test('root cannot mint an oversized or zero account limit; integer overflow and malicious shapes fail closed',t=>{
  const x=setup(t),r=x.request();
  r.req.mandate=x.resignMandate({...r.req.mandate.body,maxTotalMinor:500001});
  r.req.leafSignature=x.resignAction(r.req);
  deny(x,r.req,r.ctx);
  const invalid=x.request({actionOverrides:{amountMinor:Number.MAX_SAFE_INTEGER}});
  deny(x,invalid.req,invalid.ctx);
  const forged=x.request();
  forged.req.delegations[0].body.extraAdmin=true;
  deny(x,forged.req,forged.ctx);
  assert.equal(x.read().actions.length,0);
  const z=setup(t,{accountCeilingMinor:0,maxTotalMinor:0}),zero=z.request({amountMinor:1});
  deny(z,zero.req,zero.ctx);assert.equal(z.read().actions.length,0);
});

test('revocation, expiry, stop and clock rollback refuse without adding a synthetic effect',t=>{
  const x=setup(t);
  const old=x.request({mandateId:'revoked-mandate'});
  x.w.revoke('revoked-mandate');
  assert.equal(deny(x,old.req,old.ctx).reason,'MANDATE_REVOKED');
  x.setNow('2026-11-12T12:11:00.000Z');
  const expired=x.request();
  deny(x,expired.req,expired.ctx);
  x.setNow('2026-11-12T12:00:00.000Z');
  assert.equal(x.w.execute(x.request().req,x.request().ctx).outcome,'UNKNOWN');
  assert.equal(x.read().actions.length,0);
  const y=setup(t);y.w.stop();const r=y.request();
  assert.equal(deny(y,r.req,r.ctx).reason,'WRITER_STOPPED');
});

test('a changed signed mandate with a reused mandate ID cannot rewrite recorded spending policy',t=>{
  const x=setup(t),id='mandate-immutable';
  const one=x.request({leaf:'agent-B',amountMinor:100000,mandateId:id});
  assert.equal(x.w.execute(one.req,one.ctx).outcome,'COMMITTED');
  const two=x.request({leaf:'agent-A',amountMinor:100000,mandateId:id});
  const changed={...two.req.mandate.body,maxTotalMinor:450000};
  two.req.mandate=x.resignMandate(changed);two.req.leafSignature=x.resignAction(two.req,'agent-A');
  assert.equal(deny(x,two.req,two.ctx).reason,'MANDATE_REISSUE_CHANGED');
  assert.equal(x.read().account.committed,100000);
});

test('UNKNOWN holds count against the shared ceiling until protected reconciliation',t=>{
  const x=setup(t),h=x.request({leaf:'agent-B',amountMinor:300000}),a=x.request({leaf:'agent-A',amountMinor:200000});
  const held=x.w.holdUnknown(h.req,h.ctx);assert.equal(held.outcome,'UNKNOWN');assert.equal(held.automaticRetryPermitted,false);
  assert.equal(x.w.lookup(h.req.action.actionId).outcome,'UNKNOWN');
  assert.equal(x.w.execute(a.req,a.ctx).outcome,'COMMITTED');
  const excess=x.request({amountMinor:1});deny(x,excess.req,excess.ctx);
  assert.deepEqual([x.read().account.committed,x.read().account.held],[200000,300000]);
  assert.equal(x.w.reconcileUnknown(h.req.action.actionId,x.witnessEvidence(h.req.action.actionId,'NO_EFFECT')).outcome,'RELEASED');
  assert.equal(x.w.lookup(h.req.action.actionId).outcome,'RELEASED');
  assert.equal(x.w.execute(h.req,h.ctx).reason,'ACTION_ALREADY_RECORDED');
  const another=x.request({amountMinor:250000});
  assert.equal(x.w.execute(another.req,another.ctx).outcome,'COMMITTED');
  assert.deepEqual([x.read().account.committed,x.read().account.held],[450000,0]);
});

test('trusted synthetic reconciliation can classify an UNKNOWN as committed, once only',t=>{
  const x=setup(t),h=x.request({amountMinor:300000});
  assert.equal(x.w.holdUnknown(h.req,h.ctx).outcome,'UNKNOWN');
  const r=x.w.reconcileUnknown(h.req.action.actionId,x.witnessEvidence(h.req.action.actionId,'COMMITTED'));
  assert.equal(r.outcome,'COMMITTED');assert.equal(r.receipt.amountMinor,300000);
  assert.equal(x.w.reconcileUnknown(h.req.action.actionId,x.witnessEvidence(h.req.action.actionId,'NO_EFFECT')).outcome,'REJECTED');
  assert.equal(x.read().account.committed,300000);assert.equal(x.read().account.held,0);
});

test('untrusted agent cannot release UNKNOWN by claiming no external effect',t=>{
  const x=setup(t),h=x.request({amountMinor:300000});
  assert.equal(x.w.holdUnknown(h.req,h.ctx).outcome,'UNKNOWN');
  const id=h.req.action.actionId,good=x.witnessEvidence(id,'NO_EFFECT');
  assert.equal(x.w.reconcileUnknown(id,'NO_EFFECT').outcome,'REJECTED');
  assert.equal(x.w.reconcileUnknown(id,{...good,signature:'A'.repeat(86)}).reason,'WITNESS_SIGNATURE_INVALID');
  const wrongDigest=signFixture({...good.body,actionDigest:'0'.repeat(64)},x.keys.outcome.privateKeyPem,'ATG_SYNTHETIC_OUTCOME_WITNESS_V1:');
  assert.equal(x.w.reconcileUnknown(id,wrongDigest).reason,'WITNESS_ACTION_BINDING_INVALID');
  const wrongSigner=signFixture(good.body,x.keys['agent-B'].privateKeyPem,'ATG_SYNTHETIC_OUTCOME_WITNESS_V1:');
  assert.equal(x.w.reconcileUnknown(id,wrongSigner).reason,'WITNESS_SIGNATURE_INVALID');
  const badId=signFixture({...good.body,actionId:'other-action'},x.keys.outcome.privateKeyPem,'ATG_SYNTHETIC_OUTCOME_WITNESS_V1:');
  assert.equal(x.w.reconcileUnknown(id,badId).reason,'WITNESS_ACTION_BINDING_INVALID');
  assert.deepEqual([x.read().account.committed,x.read().account.held],[0,300000]);
  assert.equal(x.w.reconcileUnknown(id,good).outcome,'RELEASED');
  assert.deepEqual([x.read().account.committed,x.read().account.held],[0,0]);
});

test('root or agent signing key cannot be used as the separate outcome witness',t=>{
  const x=setup(t),p=join(x.root,'wrong-outcome-key.sqlite');
  assert.throws(()=>SyntheticDelegatedBudgetWriter.create(p,{
    ...x.trust,outcomeWitnessPublicKeyPem:x.keys['agent-B'].publicKeyPem
  }),/OUTCOME_WITNESS_AGENT_KEY_FORBIDDEN/);
});

test('reopening the same pinned store retains consumption, budget, and revocation',t=>{
  const x=setup(t),r=x.request({amountMinor:200000});
  assert.equal(x.w.execute(r.req,r.ctx).outcome,'COMMITTED');
  const another=x.open();
  try {
    assert.equal(another.lookup(r.req.action.actionId).outcome,'COMMITTED');
    assert.equal(another.execute(r.req,r.ctx).reason,'ACTION_ALREADY_RECORDED');
    const restricted=x.request({leaf:'agent-A',amountMinor:300001});
    assert.equal(another.execute(restricted.req,restricted.ctx).reason,'ROOT_OR_MANDATE_BUDGET_EXCEEDED');
    another.revoke('future-mandate');
  } finally {another.close();}
  assert.equal(x.read().revocations.length,1);
  assert.equal(x.read().account.committed,200000);
});

test('two real Node processes racing distinct valid mandates enforce a single shared account cap',async t=>{
  const x=setup(t);const a=x.request({amountMinor:300000,mandateId:'race-mandate-a'});
  const b=x.request({leaf:'agent-A',amountMinor:300000,mandateId:'race-mandate-b'});
  const trustPath=join(x.root,'trust.json');writeFileSync(trustPath,JSON.stringify(x.trust),{mode:0o600});
  function child(r,i) {
    const p=join(x.root,'request-'+i+'.json');writeFileSync(p,JSON.stringify(r),{mode:0o600});
    return new Promise((done,reject)=>{
      const c=spawn(process.execPath,[resolve('scripts/delegated-budget-worker.mjs'),x.path,trustPath,p],{stdio:['ignore','pipe','pipe']});
      let out='',err='';c.stdout.on('data',b=>out+=b);c.stderr.on('data',b=>err+=b);
      c.on('error',reject);c.on('close',code=>{if(code!==0)return reject(Error('child '+i+' failed '+err));try{done(JSON.parse(out.trim()));}catch(e){reject(e);}});
    });
  }
  const results=await Promise.all([child(a,1),child(b,2)]);
  assert.deepEqual(results.map(r=>r.outcome).sort(),['COMMITTED','REJECTED']);
  assert.equal(x.read().account.committed,300000);assert.equal(x.read().actions.length,1);
});

test('known NO-GO boundary: coherent clone of all writer state can still duplicate effects',t=>{
  const x=setup(t),r=x.request({amountMinor:150000});
  const clonedPath=join(x.root,'restored-writer.sqlite');cpSync(x.path,clonedPath);
  const clone=new SyntheticDelegatedBudgetWriter({path:clonedPath,trust:x.trust,now:()=>new Date(x.getNow())});
  try {
    assert.equal(x.w.execute(r.req,r.ctx).outcome,'COMMITTED');
    assert.equal(clone.execute(r.req,r.ctx).outcome,'COMMITTED');
    // This expected successful attack is the explicit reason for production NO-GO:
    // no independent checkpoint exists outside both restorable writer states.
    assert.equal(x.read().actions.length,1);
  } finally{clone.close();}
});
