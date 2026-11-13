import assert from 'node:assert/strict';
import {test} from 'node:test';
import {mkdtempSync,mkdirSync,copyFileSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createCustodyFixture} from '../../scripts/custody-fixture.mjs';
import {custodyTlsFixture} from '../../scripts/custody-tls-fixture.mjs';
import {CustodyWitness} from '../../dist/src/custody-witness.js';
import {startSyntheticBroker} from '../../scripts/openshell-broker.mjs';
import {brokerRequest} from '../../scripts/openshell-broker-client.mjs';
import {SyntheticConsumptionAnchor} from '../anti-rollback/consumption-anchor.mjs';
import {startSyntheticCheckpointService,reserveViaCheckpoint} from './checkpoint-tls-service.mjs';
import {createCheckpointBrokerHandler} from './checkpoint-broker-handler.mjs';
async function fixture(t) {
 const root=mkdtempSync(join(tmpdir(),'atg-openshell-checkpoint-'));
 const f=createCustodyFixture(join(root,'writer'));
 const writer=f.open(),grant=f.grant();const r={grant,ctx:undefined};
 const clonePath=join(root,'clone.sqlite');copyFileSync(f.path,clonePath);
 const clone=new CustodyWitness({path:clonePath,trust:f.trust,now:()=>new Date(f.getNow())});
 const anchorPath=join(root,'anchor.sqlite');SyntheticConsumptionAnchor.create(anchorPath,f.trust.domainId);
 const anchor=new SyntheticConsumptionAnchor(anchorPath,f.trust.domainId);
 const tlsDir=join(root,'tls');mkdirSync(tlsDir);const tls=custodyTlsFixture(tlsDir);
 const checkpoint=await startSyntheticCheckpointService({
   anchor,caPath:tls.caPath,certPath:tls.server.certPath,keyPath:tls.server.keyPath,
   writerFingerprint:tls.client.fingerprint
 });
 const checkpointClient={host:'127.0.0.1',port:checkpoint.port,caPath:tls.caPath,
   certPath:tls.client.certPath,keyPath:tls.client.keyPath,
   serverFingerprint:tls.server.fingerprint};
 const handler=createCheckpointBrokerHandler({
   writer,reserve:p=>reserveViaCheckpoint(checkpointClient,p),domainId:f.trust.domainId
 });
 const broker=await startSyntheticBroker({writer,checkpointHandler:handler,ca:readFileSync(tls.caPath),
   cert:readFileSync(tls.server.certPath),key:readFileSync(tls.server.keyPath),
   clientFingerprint:tls.client.fingerprint});
 const client={host:'127.0.0.1',port:broker.port,caPath:tls.caPath,
  certPath:tls.client.certPath,keyPath:tls.client.keyPath,
  serverFingerprint:tls.server.fingerprint};
 const body={grant:r.grant,payload:structuredClone(r.grant.proposedAction.canonicalArguments)};
 t.after(async()=>{await broker.close();await checkpoint.close();anchor.close();
  clone.close();writer.close();rmSync(root,{recursive:true,force:true});});
 return {f,writer,clone,r,anchor,checkpoint,client,body};
}
test('authenticated OpenShell-shaped HTTP endpoint requires checkpoint for first effect and replay refusal',async t=>{
 const x=await fixture(t);
 assert.equal((await brokerRequest(x.client,x.body)).outcome,'EXECUTED');
 const second=await brokerRequest(x.client,x.body);
 assert.equal(second.outcome,'REJECTED');
 assert.equal(x.anchor.lookup(x.r.grant.issuance.gatePass.gatePassId).outcome,'HELD');
});
test('changed HTTP payee is rejected before checkpoint reserve; legitimate payload remains valid',async t=>{
 const x=await fixture(t);
 const changed=structuredClone(x.body);changed.payload.payeeReference='fixture-bank-Z';
 assert.equal((await brokerRequest(x.client,changed)).outcome,'REJECTED');
 assert.equal(x.anchor.lookup(x.r.grant.issuance.gatePass.gatePassId).outcome,'NOT_RECORDED');
 assert.equal((await brokerRequest(x.client,x.body)).outcome,'EXECUTED');
});
test('checkpoint failure refuses real broker commit; no legacy fallback',async t=>{
 const x=await fixture(t);
 await x.checkpoint.close();
 const r=await brokerRequest(x.client,x.body);
 assert.equal(r.outcome,'UNKNOWN');
 assert.equal(r.automaticRetryPermitted,false);
 assert.equal(x.writer.lookup(x.r.grant,x.r.ctx).outcome,'NOT_RECORDED');
});
test('broker rejects alternate routes, invalid client identity and direct reset route',async t=>{
 const x=await fixture(t);
 assert.equal((await brokerRequest(x.client,x.body,{path:'/v1/synthetic-record/commit?reset=true'})).outcome,'REJECTED');
 assert.equal((await brokerRequest({...x.client,certPath:undefined,keyPath:undefined},x.body)).outcome,'UNKNOWN');
 assert.equal(x.anchor.lookup(x.r.grant.issuance.gatePass.gatePassId).outcome,'NOT_RECORDED');
});
test('legacy direct writer does not consult an unused checkpoint',async t=>{
 const x=await fixture(t);
 // Proves the architectural bypass, without pretending that a cloned
 // version/mode in this standard fixture necessarily executes.
 const direct=x.writer.execute(x.r.grant);
 assert.equal(direct.outcome,'EXECUTED');
 assert.equal(x.anchor.lookup(x.r.grant.issuance.gatePass.gatePassId).outcome,'NOT_RECORDED');
 // This is a SUCCESSFUL unmediated write; not a protection success.
});
