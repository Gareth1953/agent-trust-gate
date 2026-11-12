import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync,rmSync,readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { generateKeyPairSync } from 'node:crypto';
import { createCustodyFixture } from '../scripts/custody-fixture.mjs';
import { createPasskeyApprovalFixture } from '../scripts/passkey-approval-fixture.mjs';
import { canonicalWire,brokerRequest } from '../scripts/openshell-broker-client.mjs';
import { startSyntheticBroker } from '../scripts/openshell-broker.mjs';
import { custodyTlsFixture } from '../scripts/custody-tls-fixture.mjs';
import { CustodyWitness } from '../dist/src/custody-witness.js';
import { handleBrokerRequest,BROKER_COMMIT_PATH } from '../dist/src/openshell-transaction-broker.js';
import { verifyPasskeyAssertion,validatePasskeyTrust } from '../dist/src/passkey-transaction-approval.js';

function setup(t){
 const root=mkdtempSync(join(tmpdir(),'atg-passkey-test-')),key=createPasskeyApprovalFixture(),f=createCustodyFixture(join(root,'fixture'),key.trust),writer=f.open(),grant=f.grant(),prepared=writer.preparePurchaseApproval(grant);
 t.after(()=>{writer.close();rmSync(root,{recursive:true,force:true});});
 const approved=(g=grant,r=prepared,o={})=>({...g,humanApproval:key.assertion(r,o)});
 const state=()=>{const d=new DatabaseSync(f.path,{readOnly:true});try{return {version:d.prepare('SELECT version FROM resource').get().version,audit:d.prepare('SELECT count(*) AS n FROM approval_audit').get().n,counter:d.prepare('SELECT counter FROM approval_counter').get().counter,decisions:d.prepare('SELECT count(*) AS n FROM decisions').get().n};}finally{d.close();}};
 return {root,key,f,writer,grant,prepared,approved,state};
}
test('passkey-enabled destination requires approval even with a valid issuer signature',t=>{const x=setup(t);assert.equal(x.writer.execute(x.grant).outcome,'REJECTED');assert.deepEqual(x.state(),{version:1,audit:0,counter:0,decisions:0});});
test('verified assertion, counter, audit, one-use and effect commit together and survive restart',t=>{
 const x=setup(t),g=x.approved();assert.equal(x.writer.execute(g).outcome,'EXECUTED');assert.deepEqual(x.state(),{version:2,audit:1,counter:1,decisions:1});
 x.writer.close();const reopened=x.f.open();try{assert.equal(reopened.execute(g).outcome,'REJECTED');x.f.setNow('2026-11-10T09:00:00.000Z');assert.equal(reopened.lookup(g).outcome,'EXECUTED');assert.equal(reopened.lookup(x.grant).outcome,'EXECUTED');}finally{reopened.close();}
});
for(const [name,override] of [
 ['wrong origin',{client:{origin:'https://attacker.example'}}],['cross-origin frame',{client:{crossOrigin:true}}],['wrong ceremony type',{client:{type:'webauthn.create'}}],
 ['wrong RP ID',{rpId:'attacker.example'}],['missing user presence',{flags:4}],['missing user verification',{flags:1}],['backup eligible credential',{flags:13}],['extensions outside profile',{flags:133}],
 ['zero counter',{counter:0}],['wrong credential',{credentialId:'YXR0YWNrZXI'}],['wrong user handle',{userHandle:'YXR0YWNrZXI'}],['unknown client-data field',{client:{topOrigin:'http://localhost:8787'}}],
 ['self-chosen challenge',{client:{challenge:'YXR0YWNrZXI'}}]
])test('passkey refuses '+name+' before any state change',t=>{const x=setup(t);assert.equal(x.writer.execute(x.approved(x.grant,x.prepared,override)).outcome,'REJECTED');assert.deepEqual(x.state(),{version:1,audit:0,counter:0,decisions:0});});
test('duplicate and escaped client-data names fail closed',t=>{const x=setup(t);for(const text of ['{"type":"webauthn.get","challenge":"'+x.prepared.challenge+'","origin":"http://localhost:8787","origin":"http://localhost:8787"}','{"type":"webauthn.get","challen\\u0067e":"'+x.prepared.challenge+'","origin":"http://localhost:8787"}'])assert.equal(x.writer.execute(x.approved(x.grant,x.prepared,{clientText:text})).outcome,'REJECTED');assert.equal(x.state().version,1);});
test('signed Chromium client metadata and valid JSON reordering are accepted',t=>{
  const x=setup(t);
  // Chromium may add this forward-compatibility marker to clientDataJSON.
  // Real browsers also may reorder members or emit innocuous whitespace.
  const clientText=JSON.stringify({
    new_keys_may_be_added_here:"https://www.chromium.org/security-keys/",
    origin:x.key.trust.origin,
    extra:{nested:["comma,brace}",{note:"escaped \" quote"}]},
    challenge:x.prepared.challenge,
    crossOrigin:false,
    type:"webauthn.get",
  },null,2);
  assert.equal(x.writer.execute(x.approved(x.grant,x.prepared,{clientText})).outcome,'EXECUTED');
  assert.equal(x.state().version,2);
});
test('duplicate Unicode-escaped origin and challenge members fail closed even when signed',t=>{
  const x=setup(t);
  const root='{"type":"webauthn.get","challenge":"'+x.prepared.challenge+'","origin":"'+x.key.trust.origin+'","crossOrigin":false';
  for(const appended of [',"ori\\u0067in":"'+x.key.trust.origin+'"}',',"chall\\u0065nge":"'+x.prepared.challenge+'"}']){
    assert.equal(x.writer.execute(x.approved(x.grant,x.prepared,{clientText:root+appended})).outcome,'REJECTED');
  }
  assert.equal(x.state().version,1);
});
test('browser-added topOrigin remains forbidden in same-origin passkey mode',t=>{
  const x=setup(t);
  const a=x.approved(x.grant,x.prepared,{client:{topOrigin:x.key.trust.origin}});
  assert.equal(x.writer.execute(a).outcome,'REJECTED');
  assert.equal(x.state().version,1);
});
test('authenticator failure codes identify UV, presence, RP mismatch and unsupported bits without permitting execution',t=>{
  const x=setup(t);
  const matrix=[
    ['UV missing',{flags:1},'PASSKEY_USER_VERIFICATION_MISSING'],
    ['presence missing',{flags:4},'PASSKEY_USER_PRESENCE_MISSING'],
    ['wrong RP hash',{rpId:'wrong.example'},'PASSKEY_RP_ID_HASH_MISMATCH'],
    ['reserved flag',{flags:7},'PASSKEY_FLAGS_UNSUPPORTED'],
    ['backup bits not allowed in legacy profile',{flags:13},'PASSKEY_FLAGS_UNSUPPORTED'],
  ];
  for(const [label,override,reason] of matrix){
    const proof=x.key.assertion(x.prepared,override);
    assert.throws(()=>verifyPasskeyAssertion(x.key.trust,proof,x.prepared.challenge,0),new RegExp(reason),label);
    assert.equal(x.writer.execute(x.approved(x.grant,x.prepared,override)).outcome,'REJECTED',label);
    assert.equal(x.state().version,1,label);
  }
});
test('forged signature and caller-supplied public key cannot create approval',t=>{const x=setup(t),g=x.approved();g.humanApproval.signature='AAAA';assert.equal(x.writer.execute(g).outcome,'REJECTED');g.humanApproval=x.key.assertion(x.prepared);g.humanApproval.publicKeyPem=x.key.trust.publicKeyPem;assert.equal(x.writer.execute(g).outcome,'REJECTED');assert.equal(x.state().audit,0);});
test('an independently valid second key cannot approve the enrolled principal',t=>{const x=setup(t),rogue=createPasskeyApprovalFixture(),g={...x.grant,humanApproval:rogue.assertion(x.prepared,{credentialId:x.key.trust.credentialId,userHandle:x.key.trust.userHandle})};assert.equal(x.writer.execute(g).outcome,'REJECTED');assert.equal(x.state().version,1);});
test('challenge binds the complete signed grant, not just the effect payload',t=>{const x=setup(t),other=x.f.grant();assert.equal(x.writer.execute(x.approved(other)).outcome,'REJECTED');assert.equal(x.state().audit,0);});
test('principal substitution refused even with a freshly signed issuer grant',t=>{const x=setup(t),other=x.f.grant({operatorIdentity:'other-principal'});assert.throws(()=>x.writer.preparePurchaseApproval(other),/PRINCIPAL/);assert.equal(x.writer.execute(x.approved(other)).outcome,'REJECTED');});
test('expired challenge, stop and revoke refuse before approval/effect writes',t=>{
 const x=setup(t);x.f.setNow('2026-11-10T08:32:00.000Z');assert.equal(x.writer.execute(x.approved()).outcome,'REJECTED');
 x.f.setNow('2026-11-10T08:30:00.000Z');x.writer.revoke(x.grant);assert.equal(x.writer.execute(x.approved()).outcome,'REJECTED');x.writer.stop();assert.throws(()=>x.writer.preparePurchaseApproval(x.f.grant()),/UNAVAILABLE/);assert.equal(x.state().audit,0);
});
test('passkey counter persists across distinct authority and cannot move backwards',t=>{
 const x=setup(t);x.writer.execute(x.approved());const g=x.f.grant({}, {expectedVersion:2}),r=x.writer.preparePurchaseApproval(g);
 assert.equal(x.writer.execute(x.approved(g,r,{counter:1})).outcome,'REJECTED');assert.equal(x.writer.execute(x.approved(g,r,{counter:2})).outcome,'EXECUTED');assert.deepEqual(x.state(),{version:3,audit:2,counter:2,decisions:2});
});
test('SQLite effect failure rolls back challenge consumption, counter, decision and approval audit',t=>{
 const x=setup(t),d=new DatabaseSync(x.f.path);d.exec("CREATE TRIGGER fail_effect BEFORE UPDATE ON resource BEGIN SELECT RAISE(ABORT,'injected effect fault'); END;");d.close();
 assert.equal(x.writer.execute(x.approved()).outcome,'UNKNOWN');assert.deepEqual(x.state(),{version:1,audit:0,counter:0,decisions:0});
 const check=new DatabaseSync(x.f.path,{readOnly:true});assert.equal(check.prepare('SELECT used FROM approval_challenges WHERE challenge=?').get(x.prepared.challenge).used,0);check.close();
});
test('changing enrolled trust cannot reopen the old authoritative store',t=>{const x=setup(t);assert.throws(()=>new CustodyWitness({path:x.f.path,trust:{...x.f.trust,passkeyApproval:createPasskeyApprovalFixture().trust}}),/TRUST_OR_STATE_CHANGED/);});
test('strict profile rejects unsupported/private key, insecure origin and corrupted counter',t=>{const x=setup(t);assert.throws(()=>validatePasskeyTrust({...x.key.trust,origin:'http://remote.example',rpId:'remote.example'}));assert.throws(()=>validatePasskeyTrust({...x.key.trust,publicKeyPem:x.f.trust.issuerPublicKeyPem}));const pair=generateKeyPairSync('ec',{namedCurve:'prime256v1'});assert.throws(()=>validatePasskeyTrust({...x.key.trust,publicKeyPem:pair.privateKey.export({type:'pkcs8',format:'pem'}).toString()}));assert.throws(()=>verifyPasskeyAssertion(x.key.trust,x.key.assertion(x.prepared),x.prepared.challenge,-1),/COUNTER_STATE/);});
test('challenge queue is bounded and preparation is absent from agent routes',t=>{const x=setup(t);for(let i=1;i<64;i++)x.writer.preparePurchaseApproval(x.grant);assert.throws(()=>x.writer.preparePurchaseApproval(x.grant),/PENDING_LIMIT/);const body={grant:x.grant,payload:x.grant.proposedAction.canonicalArguments};assert.equal(handleBrokerRequest(x.writer,'POST','/v1/purchase/approve',Buffer.from(canonicalWire(body))).reason,'BROKER_ROUTE_REFUSED');});
test('real mTLS broker requires passkey proof and refuses actual payload substitution',async t=>{
 const x=setup(t),tls=custodyTlsFixture(x.root),server=await startSyntheticBroker({writer:x.writer,ca:readFileSync(tls.caPath),cert:readFileSync(tls.server.certPath),key:readFileSync(tls.server.keyPath),clientFingerprint:tls.client.fingerprint});t.after(()=>server.close());
 const c={host:'127.0.0.1',port:server.port,caPath:tls.caPath,certPath:tls.client.certPath,keyPath:tls.client.keyPath,serverFingerprint:tls.server.fingerprint},body={grant:x.approved(),payload:x.grant.proposedAction.canonicalArguments};
 const missing=structuredClone(body);delete missing.grant.humanApproval;assert.equal((await brokerRequest(c,missing)).outcome,'REJECTED');
 const changed=structuredClone(body);changed.payload.amountMinorUnits=1;assert.equal((await brokerRequest(c,changed)).outcome,'REJECTED');
 const results=await Promise.all([brokerRequest(c,body),brokerRequest(c,body)]);assert.deepEqual(results.map(r=>r.outcome).sort(),['EXECUTED','REJECTED']);assert.deepEqual(x.state(),{version:2,audit:1,counter:1,decisions:1});
});
