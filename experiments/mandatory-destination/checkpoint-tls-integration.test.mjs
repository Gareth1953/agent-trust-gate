import assert from 'node:assert/strict';
import {test} from 'node:test';
import {mkdtempSync,mkdirSync,copyFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {createDelegatedCustodyFixture} from '../../scripts/delegated-custody-fixture.mjs';
import {custodyTlsFixture} from '../../scripts/custody-tls-fixture.mjs';
import {CustodyWitness} from '../../dist/src/custody-witness.js';
import {SyntheticConsumptionAnchor} from '../anti-rollback/consumption-anchor.mjs';
import {startSyntheticCheckpointService,reserveViaCheckpoint} from './checkpoint-tls-service.mjs';
import {AsyncCheckpointedSyntheticDestination} from './async-checkpointed-destination.mjs';

function version(path) {
  const db=new DatabaseSync(path,{readOnly:true});
  try{return Number(db.prepare('SELECT version FROM resource').get().version);}
  finally{db.close();}
}
async function fixture(t) {
  const root=mkdtempSync(join(tmpdir(),'atg-checkpoint-tls-'));
  const f=createDelegatedCustodyFixture(join(root,'writer'));
  const writer=f.open(),r=f.request();f.approve(writer,r);
  const clonePath=join(root,'restored.sqlite');
  copyFileSync(f.path,clonePath);
  const clone=new CustodyWitness({path:clonePath,trust:f.trust,now:()=>new Date(f.getNow())});
  const directory=join(root,'retained');mkdirSync(directory);
  const path=join(directory,'checkpoint.sqlite');
  SyntheticConsumptionAnchor.create(path,f.trust.domainId);
  const anchor=new SyntheticConsumptionAnchor(path,f.trust.domainId);
  const tlsPath=join(root,'tls');mkdirSync(tlsPath);
  const tls=custodyTlsFixture(tlsPath);
  const server=await startSyntheticCheckpointService({
    anchor,caPath:tls.caPath,certPath:tls.server.certPath,
    keyPath:tls.server.keyPath,writerFingerprint:tls.client.fingerprint
  });
  const config={host:'127.0.0.1',port:server.port,caPath:tls.caPath,
    certPath:tls.client.certPath,keyPath:tls.client.keyPath,
    serverFingerprint:tls.server.fingerprint};
  const reserve=proposal=>reserveViaCheckpoint(config,proposal);
  const wrap=w=>new AsyncCheckpointedSyntheticDestination({writer:w,reserve,domainId:f.trust.domainId});
  t.after(async()=>{await server.close();anchor.close();clone.close();writer.close();rmSync(root,{recursive:true,force:true});});
  return {root,f,writer,clone,clonePath,r,path,anchor,tls,config,server,reserve,wrap};
}
test('actual CustodyWitness and restored clone cannot both consume one authenticated remote checkpoint',async t=>{
  const x=await fixture(t);
  assert.equal((await x.wrap(x.writer).execute(x.r.grant,x.r.ctx)).outcome,'EXECUTED');
  assert.equal((await x.wrap(x.clone).execute(x.r.grant,x.r.ctx)).outcome,'REJECTED');
  assert.equal(version(x.f.path),2);
  assert.equal(version(x.clonePath),1);
});
test('invalid signed payee and delegated action do not poison remotely held authority',async t=>{
  const x=await fixture(t);
  const tampered=structuredClone(x.r.grant);
  tampered.proposedAction.canonicalArguments.payeeReference='fixture-bank-Z';
  assert.equal((await x.wrap(x.writer).execute(tampered,x.r.ctx)).outcome,'REJECTED');
  assert.equal(x.anchor.lookup(x.r.grant.issuance.gatePass.gatePassId).outcome,'NOT_RECORDED');
  const forged=structuredClone(x.r.grant);
  forged.delegatedRequest.action.amountMinor=1;
  assert.equal((await x.wrap(x.writer).execute(forged,x.r.ctx)).outcome,'REJECTED');
  assert.equal(x.anchor.lookup(x.r.grant.issuance.gatePass.gatePassId).outcome,'NOT_RECORDED');
  assert.equal((await x.wrap(x.writer).execute(x.r.grant,x.r.ctx)).outcome,'EXECUTED');
});
test('wrong client identity and wrong server pin never grant checkpoint permission',async t=>{
  const x=await fixture(t);
  const proposal={domainId:x.f.trust.domainId,actionId:x.r.grant.issuance.gatePass.gatePassId,
    actionDigest:x.r.grant.issuance.gatePass.action.actionDigest};
  assert.equal((await reserveViaCheckpoint({...x.config,certPath:x.tls.rogueClient.certPath,keyPath:x.tls.rogueClient.keyPath},proposal)).outcome,'UNKNOWN');
  assert.equal((await reserveViaCheckpoint({...x.config,serverFingerprint:x.tls.fakeServer.fingerprint},proposal)).outcome,'UNKNOWN');
  assert.equal(x.anchor.lookup(proposal.actionId).outcome,'NOT_RECORDED');
  assert.equal((await x.wrap(x.writer).execute(x.r.grant,x.r.ctx)).outcome,'EXECUTED');
});
test('checkpoint outage means UNKNOWN with no synthetic effect or fallback',async t=>{
  const x=await fixture(t);
  await x.server.close();
  const outcome=await x.wrap(x.writer).execute(x.r.grant,x.r.ctx);
  assert.equal(outcome.outcome,'UNKNOWN');
  assert.equal(outcome.automaticRetryPermitted,false);
  assert.equal(version(x.f.path),1);
});
test('red team: direct unmediated clone STILL executes; same-owner checkpoint clone remains vulnerable',async t=>{
  const x=await fixture(t);
  const proposal={domainId:x.f.trust.domainId,actionId:x.r.grant.issuance.gatePass.gatePassId,
    actionDigest:x.r.grant.issuance.gatePass.action.actionDigest};
  const copiedPath=join(x.root,'checkpoint-copy.sqlite');
  copyFileSync(x.path,copiedPath);
  assert.equal((await x.wrap(x.writer).execute(x.r.grant,x.r.ctx)).outcome,'EXECUTED');
  // This demonstrates existing alternate writer path as an actual successful attack.
  assert.equal(x.clone.execute(x.r.grant,x.r.ctx).outcome,'EXECUTED');
  const alternate=new SyntheticConsumptionAnchor(copiedPath,x.f.trust.domainId);
  try {assert.equal(alternate.reserve(proposal).outcome,'RESERVED');}
  finally{alternate.close();}
});
