import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, mkdirSync, copyFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createDelegatedCustodyFixture } from '../scripts/delegated-custody-fixture.mjs';
import { CustodyWitness } from '../dist/src/custody-witness.js';
import { SyntheticConsumptionAnchor } from '../experiments/anti-rollback/consumption-anchor.mjs';

function fixture(t){
  const root=mkdtempSync(join(tmpdir(),'atg-anchor-custody-'));
  const f=createDelegatedCustodyFixture(join(root,'new'));
  const w=f.open();
  const root2=join(root,'retained-authority');mkdirSync(root2,{mode:0o700});
  const anchorPath=join(root2,'consumption.sqlite');
  SyntheticConsumptionAnchor.create(anchorPath,f.trust.domainId);
  const anchor=new SyntheticConsumptionAnchor(anchorPath,f.trust.domainId);
  t.after(()=>{w.close();anchor.close();rmSync(root,{recursive:true,force:true});});
  return {root,f,w,anchor,anchorPath};
}
const proposal=(f,r)=>({
  domainId:f.trust.domainId,actionId:r.grant.issuance.gatePass.gatePassId,
  actionDigest:r.grant.issuance.gatePass.action.actionDigest
});
const version=path=>{
  const db=new DatabaseSync(path,{readOnly:true});
  try{return Number(db.prepare('SELECT version FROM resource').get().version);}
  finally{db.close();}
};
test('retained checkpoint blocks a cloned real custody writer if every effect uses it',t=>{
  const {root,f,w,anchor}=fixture(t);
  const r=f.request();f.approve(w,r);
  const clonePath=join(root,'restored-custody.sqlite');
  copyFileSync(f.path,clonePath); // before consumption, intentionally restorable
  const clone=new CustodyWitness({path:clonePath,trust:f.trust,now:()=>new Date(f.getNow())});
  t.after(()=>clone.close());
  const first=anchor.reserve(proposal(f,r));
  assert.equal(first.outcome,'RESERVED');
  assert.equal(first.effectPermittedByAnchor,true);
  assert.equal(w.execute(r.grant,r.ctx).outcome,'EXECUTED');
  const second=anchor.reserve(proposal(f,r));
  assert.equal(second.outcome,'REJECTED');
  assert.equal(second.effectPermittedByAnchor,false);
  assert.equal(version(f.path),2);
  assert.equal(version(clonePath),1,'second restored writer is not invoked');
  assert.equal(anchor.lookup(r.grant.issuance.gatePass.gatePassId).outcome,'HELD');
  // This test does NOT claim the existing broker is connected to the anchor.
});
test('explicit adversarial bypass: direct unmediated custody writer still executes after checkpoint refusal',t=>{
  const {root,f,w,anchor}=fixture(t);
  const r=f.request();f.approve(w,r);
  const clonePath=join(root,'attack-clone.sqlite');
  copyFileSync(f.path,clonePath);
  const clone=new CustodyWitness({path:clonePath,trust:f.trust,now:()=>new Date(f.getNow())});
  t.after(()=>clone.close());
  assert.equal(anchor.reserve(proposal(f,r)).outcome,'RESERVED');
  assert.equal(w.execute(r.grant,r.ctx).outcome,'EXECUTED');
  assert.equal(anchor.reserve(proposal(f,r)).outcome,'REJECTED');
  // A direct call bypasses the OPTIONAL prototype, so it must never be
  // advertised as complete mediation or a production fix.
  assert.equal(clone.execute(r.grant,r.ctx).outcome,'EXECUTED');
  assert.equal(version(clonePath),2);
});
test('checkpoint outage refuses effect and leaves actual synthetic writer unchanged',t=>{
  const {f,w,anchor}=fixture(t);
  const r=f.request();f.approve(w,r);
  anchor.close();
  const gate=anchor.reserve(proposal(f,r));
  assert.equal(gate.outcome,'UNKNOWN');
  assert.equal(gate.effectPermittedByAnchor,false);
  assert.equal(gate.automaticRetryPermitted,false);
  assert.equal(version(f.path),1);
});
