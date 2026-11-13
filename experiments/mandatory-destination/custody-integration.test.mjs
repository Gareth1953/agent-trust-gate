import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, mkdirSync, copyFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createDelegatedCustodyFixture } from '../../scripts/delegated-custody-fixture.mjs';
import { CustodyWitness } from '../../dist/src/custody-witness.js';
import { SyntheticConsumptionAnchor } from '../anti-rollback/consumption-anchor.mjs';
import { SyntheticAnchoredDestination } from './anchored-destination.mjs';

function version(path) {
  const db=new DatabaseSync(path,{readOnly:true});
  try {return Number(db.prepare('SELECT version FROM resource').get().version);}
  finally {db.close();}
}
function setup(t) {
  const root=mkdtempSync(join(tmpdir(),'atg-anchored-real-writer-'));
  const f=createDelegatedCustodyFixture(join(root,'destination'));
  const writer=f.open();
  const r=f.request();f.approve(writer,r);
  const clonePath=join(root,'restored-writer.sqlite');
  copyFileSync(f.path,clonePath);
  const clone=new CustodyWitness({path:clonePath,trust:f.trust,now:()=>new Date(f.getNow())});
  const separate=join(root,'retained');mkdirSync(separate,{mode:0o700});
  const anchorPath=join(separate,'anchor.sqlite');
  SyntheticConsumptionAnchor.create(anchorPath,f.trust.domainId);
  const anchor=new SyntheticConsumptionAnchor(anchorPath,f.trust.domainId);
  t.after(()=>{clone.close();writer.close();anchor.close();rmSync(root,{recursive:true,force:true});});
  const wrap=x=>new SyntheticAnchoredDestination({anchor,writer:x,domainId:f.trust.domainId});
  return {f,r,writer,clone,clonePath,anchor,wrap};
}
test('actual CustodyWitness clone is blocked through shared checkpointed entry point',t=>{
  const x=setup(t);
  assert.equal(x.wrap(x.writer).execute(x.r.grant,x.r.ctx).outcome,'EXECUTED');
  assert.equal(x.wrap(x.clone).execute(x.r.grant,x.r.ctx).outcome,'REJECTED');
  assert.equal(version(x.f.path),2);
  assert.equal(version(x.clonePath),1);
  assert.equal(x.anchor.lookup(x.r.grant.issuance.gatePass.gatePassId).outcome,'HELD');
});
test('checkpoint loss holds actual CustodyWitness unchanged',t=>{
  const x=setup(t);
  x.anchor.close();
  assert.equal(x.wrap(x.writer).execute(x.r.grant,x.r.ctx).outcome,'UNKNOWN');
  assert.equal(version(x.f.path),1);
});
test('retained successful bypass: original CustodyWitness is still directly callable',t=>{
  const x=setup(t);
  assert.equal(x.wrap(x.writer).execute(x.r.grant,x.r.ctx).outcome,'EXECUTED');
  // This is a recorded SECURITY FAILURE, not successful destination isolation.
  assert.equal(x.clone.execute(x.r.grant,x.r.ctx).outcome,'EXECUTED');
  assert.equal(version(x.clonePath),2);
});
