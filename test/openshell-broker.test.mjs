import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync,readFileSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { request } from 'node:https';
import { DatabaseSync } from 'node:sqlite';
import { createCustodyFixture } from '../scripts/custody-fixture.mjs';
import { custodyTlsFixture } from '../scripts/custody-tls-fixture.mjs';
import { startSyntheticBroker,loadBrokerConfig } from '../scripts/openshell-broker.mjs';
import { brokerRequest,canonicalWire } from '../scripts/openshell-broker-client.mjs';
import { handleBrokerRequest,BROKER_COMMIT_PATH,BROKER_LOOKUP_PATH } from '../dist/src/openshell-transaction-broker.js';

function setup(t) {
  const dir=mkdtempSync(join(tmpdir(),'atg-openshell-unit-')),f=createCustodyFixture(join(dir,'fixture')),writer=f.open(),grant=f.grant();
  t.after(()=>{writer.close();rmSync(dir,{recursive:true,force:true});});
  const body={grant,payload:structuredClone(grant.proposedAction.canonicalArguments)};
  const call=(value=body,path=BROKER_COMMIT_PATH,method='POST')=>handleBrokerRequest(writer,method,path,Buffer.from(typeof value==='string'?value:canonicalWire(value)));
  const version=()=>{const d=new DatabaseSync(f.path,{readOnly:true});try{return d.prepare('SELECT version FROM resource').get().version;}finally{d.close();}};
  return {dir,f,writer,grant,body,call,version};
}
for(const [field,value] of [['payeeReference','fixture-bank-B'],['amountMinorUnits',1],['currency','USD'],['tenantId','synthetic-tenant-B'],['resourceId','other-order'],['expectedVersion',2],['value','changed']]) {
  test('HTTP effect reconstruction refuses changed '+field,t=>{const x=setup(t);x.body.payload[field]=value;assert.equal(x.call().outcome,'REJECTED');assert.equal(x.version(),1);});
}
test('valid commit, replay refusal and historical lookup share the authoritative writer',t=>{
  const x=setup(t);assert.equal(x.call().outcome,'EXECUTED');assert.equal(x.version(),2);
  assert.equal(x.call().reason,'AUTHORITY_ALREADY_USED_OR_REVOKED');
  x.f.setNow('2026-11-10T09:00:00.000Z');assert.equal(x.call(x.body,BROKER_LOOKUP_PATH).outcome,'EXECUTED');assert.equal(x.version(),2);
});
test('lookup cannot attest a changed effect payload',t=>{const x=setup(t);x.call();x.body.payload.payeeReference='fixture-bank-B';assert.equal(x.call(x.body,BROKER_LOOKUP_PATH).outcome,'UNKNOWN');});
test('changed signed approval or tool identity cannot authorise a request',t=>{
  const x=setup(t);x.body.grant.issuance.gatePass.action.humanApprovalDigest='0'.repeat(64);assert.equal(x.call().outcome,'REJECTED');assert.equal(x.version(),1);
});
test('expiry, revocation and emergency stop refuse before the synthetic effect',t=>{
  const x=setup(t);x.f.setNow('2026-11-10T09:00:00.000Z');assert.equal(x.call().outcome,'REJECTED');
  x.f.setNow('2026-11-10T08:30:00.000Z');x.writer.revoke(x.grant);assert.equal(x.call().outcome,'REJECTED');
  x.writer.stop();assert.equal(x.call().reason,'WITNESS_STOPPED');assert.equal(x.version(),1);
});
test('strict wire contract rejects duplicates, invalid UTF-8, oversize and extra fields',t=>{
  const x=setup(t);for(const v of ['{"grant":{},"grant":{},"payload":{}}',' '+canonicalWire(x.body),canonicalWire({...x.body,path:'/tmp/attacker'}),'x'.repeat(65537)])assert.equal(x.call(v).reason,'BROKER_BODY_INVALID');
  assert.equal(handleBrokerRequest(x.writer,'POST',BROKER_COMMIT_PATH,new Uint8Array([255])).reason,'BROKER_BODY_INVALID');assert.equal(x.version(),1);
});
test('only the two exact POST routes are exposed; no reset, path, key or clock API',t=>{
  const x=setup(t);for(const p of ['/admin','/v1/synthetic-record/commit?reset=1','/v1/synthetic-record/commit/','https://evil.example/v1/synthetic-record/commit'])assert.equal(x.call(x.body,p).reason,'BROKER_ROUTE_REFUSED');
  assert.equal(x.call(x.body,BROKER_COMMIT_PATH,'GET').reason,'BROKER_ROUTE_REFUSED');assert.equal(x.version(),1);
});
test('writer outage stays UNKNOWN; there is no callback or local fallback',t=>{const x=setup(t);x.writer.close();assert.equal(x.call().outcome,'UNKNOWN');assert.equal(x.call().automaticRetryPermitted,false);});
test('normal startup refuses a same-owner/unprotected deployment',()=>{assert.throws(()=>loadBrokerConfig('/tmp/nonexistent-atg-config'),/BROKER_|ENOENT/);});

test('actual pinned mTLS HTTP route: changed request, concurrent duplicate, lookup and outage',async t=>{
  const x=setup(t),tls=custodyTlsFixture(x.dir);
  const broker=await startSyntheticBroker({writer:x.writer,ca:readFileSync(tls.caPath),cert:readFileSync(tls.server.certPath),key:readFileSync(tls.server.keyPath),clientFingerprint:tls.client.fingerprint});
  t.after(()=>broker.close());
  const c={host:'127.0.0.1',port:broker.port,caPath:tls.caPath,certPath:tls.client.certPath,keyPath:tls.client.keyPath,serverFingerprint:tls.server.fingerprint};
  for(const bad of [{...c,certPath:undefined,keyPath:undefined},{...c,certPath:tls.rogueClient.certPath,keyPath:tls.rogueClient.keyPath},{...c,serverFingerprint:tls.fakeServer.fingerprint}])assert.notEqual((await brokerRequest(bad,x.body)).outcome,'EXECUTED');
  const changed=structuredClone(x.body);changed.payload.payeeReference='fixture-bank-B';assert.equal((await brokerRequest(c,changed)).outcome,'REJECTED');assert.equal(x.version(),1);
  const results=await Promise.all([brokerRequest(c,x.body),brokerRequest(c,x.body)]);
  assert.deepEqual(results.map(r=>r.outcome).sort(),['EXECUTED','REJECTED']);assert.equal(x.version(),2);
  assert.equal((await brokerRequest(c,x.body,{path:BROKER_LOOKUP_PATH})).outcome,'EXECUTED');
  await broker.close();assert.equal((await brokerRequest(c,x.body)).outcome,'UNKNOWN');
});
test('HTTP server refuses content encoding, admin routes and oversized wire bodies',async t=>{
  const x=setup(t),tls=custodyTlsFixture(x.dir),broker=await startSyntheticBroker({writer:x.writer,ca:readFileSync(tls.caPath),cert:readFileSync(tls.server.certPath),key:readFileSync(tls.server.keyPath),clientFingerprint:tls.client.fingerprint});
  t.after(()=>broker.close());
  async function raw(body,headers={},path=BROKER_COMMIT_PATH){return new Promise((ok,bad)=>{const r=request({host:'127.0.0.1',port:broker.port,path,method:'POST',ca:readFileSync(tls.caPath),cert:readFileSync(tls.client.certPath),key:readFileSync(tls.client.keyPath),agent:false,headers:{'content-type':'application/json',...headers}},s=>{let b='';s.on('data',c=>b+=c);s.on('end',()=>ok({status:s.statusCode,body:JSON.parse(b)}));});r.on('error',bad);r.end(body);});}
  assert.equal((await raw(canonicalWire(x.body),{'content-encoding':'gzip'})).status,415);
  assert.equal((await raw(canonicalWire(x.body),{},'/admin')).body.reason,'BROKER_ROUTE_REFUSED');
  assert.equal((await raw('x'.repeat(65537))).status,413);assert.equal(x.version(),1);
});
