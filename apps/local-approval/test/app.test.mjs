import assert from 'node:assert/strict';
import { test } from 'node:test';
import { request as httpRequest } from 'node:http';
import { mkdtempSync,readFileSync,rmSync,existsSync,writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { setupApprovalApp,openApprovalApp,stopApprovalApp } from '../server.mjs';
import { softwareAuthenticator } from './software-authenticator.mjs';

async function setup(t,authOptions={}){
  const base=mkdtempSync(join(tmpdir(),'atg-local-approval-test-')),root=join(base,'private');
  // Select a free test port, then pin the origin before enrollment. Tests run serially in this file.
  const {createServer}=await import('node:net');const probe=createServer();await new Promise(r=>probe.listen(0,'127.0.0.1',r));const port=probe.address().port;await new Promise(r=>probe.close(r));
  setupApprovalApp(root,{port});let app=openApprovalApp(root);await new Promise(r=>app.server.listen(port,'127.0.0.1',r));let cookie='',csrf;
  const origin=app.origin,url=`http://127.0.0.1:${port}`,auth=softwareAuthenticator(authOptions);
  async function request(path,body,headers={}){
    return new Promise((resolve,reject)=>{const r=httpRequest(url+path,{method:body===undefined?'GET':'POST',headers:{Host:`localhost:${port}`,...(cookie?{Cookie:cookie}:{}),...(body===undefined?{}:{Origin:origin,'Content-Type':'application/json','X-ATG-CSRF':csrf}),...headers}},res=>{
      const chunks=[];res.on('data',c=>chunks.push(c));res.on('end',()=>{if(res.headers['set-cookie'])cookie=res.headers['set-cookie'][0].split(';')[0];const data=JSON.parse(Buffer.concat(chunks));resolve({status:res.statusCode,data,headers:res.headers});});
    });r.on('error',reject);r.end(body===undefined?undefined:JSON.stringify(body));});
  }
  async function status(){const r=await request('/api/status');csrf=r.data.csrf;return r.data;}
  async function enroll(){await status();assert.equal((await request('/api/enroll/authorize',{code:readFileSync(join(root,'enrollment-code.txt'),'utf8').trim()})).status,200);await status();
    const opts=(await request('/api/enroll/options',{})).data;const response=await request('/api/enroll/verify',{credential:auth.registration(opts,origin)});assert.equal(response.status,200,JSON.stringify(response.data));await status();}
  async function login(){await status();const options=(await request('/api/login/options',{})).data;const r=await request('/api/login/verify',{credential:auth.authentication(options,origin)});assert.equal(r.status,200,JSON.stringify(r.data));await status();}
  const state=()=>{const d=new DatabaseSync(join(root,'witness.sqlite'),{readOnly:true});try{return {version:d.prepare('SELECT version FROM resource').get().version,audit:d.prepare('SELECT count(*) AS n FROM approval_audit').get().n};}finally{d.close();}};
  t.after(async()=>{await app.close();rmSync(base,{recursive:true,force:true});});
  return {root,auth,origin,request,status,enroll,login,state,async restart(){await app.close();app=openApprovalApp(root);await new Promise(r=>app.server.listen(port,'127.0.0.1',r));},db(fn){const d=new DatabaseSync(join(root,'approval.sqlite'));try{return fn(d);}finally{d.close();}}};
}

test('register, separate sign-in, exact approval, single commit, durable lookup: zero-counter backed-up SOFTWARE credential',async t=>{
  const x=await setup(t,{backup:true});await x.enroll();assert.equal(existsSync(join(x.root,'enrollment-code.txt')),false);assert.equal((await x.status()).authenticated,false);
  assert.equal((await x.request('/api/transaction/prepare',{})).status,400);await x.login();const p=(await x.request('/api/transaction/prepare',{})).data;
  assert.equal(p.prepared.summary.amountMinorUnits,400000);assert.equal(p.prepared.summary.expectedVersion,1);assert.deepEqual(x.state(),{version:1,audit:0});
  const body={id:p.id,credential:x.auth.authentication(p.prepared.publicKey,x.origin)};
  assert.equal((await x.request('/api/transaction/commit',body)).data.status,'EXECUTED');assert.equal((await x.request('/api/transaction/commit',body)).status,400);
  assert.deepEqual(x.state(),{version:2,audit:1});await x.restart();assert.equal((await x.status()).authenticated,false);await x.login();
  assert.equal((await x.request('/api/transaction/lookup',{id:p.id})).data.lookup.outcome,'EXECUTED');assert.deepEqual(x.state(),{version:2,audit:1});
});
test('origin, host, CSRF, body injection and unauthenticated routes refuse',async t=>{
  const x=await setup(t);await x.status();
  assert.equal((await x.request('/api/status',undefined,{Host:'evil.example'})).status,400);
  assert.equal((await x.request('/api/login/options',{}, {Origin:'http://evil.example'})).status,400);
  assert.equal((await x.request('/api/enroll/authorize',{code:'wrong'},{'X-ATG-CSRF':'wrong'})).data.error,'CSRF_REFUSED');
  await x.enroll();await x.login();assert.equal((await x.request('/api/transaction/prepare',{amount:1})).data.error,'REQUEST_FIELDS_REFUSED');assert.deepEqual(x.state(),{version:1,audit:0});
});
test('bootstrap code is bounded, expires, is single-use, and cannot replace enrollment',async t=>{
  const x=await setup(t);await x.status();for(let i=0;i<5;i++)assert.equal((await x.request('/api/enroll/authorize',{code:'wrong'})).status,400);
  assert.equal((await x.request('/api/enroll/authorize',{code:readFileSync(join(x.root,'enrollment-code.txt'),'utf8').trim()})).data.error,'ENROLLMENT_UNAVAILABLE');
  x.db(d=>d.prepare("UPDATE meta SET v='0' WHERE k='bootstrapFailures'").run());x.db(d=>d.prepare("UPDATE meta SET v='0' WHERE k='bootstrapExpires'").run());
  assert.equal((await x.request('/api/enroll/authorize',{code:'wrong'})).data.error,'ENROLLMENT_UNAVAILABLE');assert.throws(()=>setupApprovalApp(x.root));
});
for(const [name,changes] of [['wrong origin',{origin:'http://attacker.example'}],['missing UV',{flags:1}],['wrong RP',{rpId:'attacker.example'}],['backup flag substitution',{flags:29}],['wrong user',{userHandle:'d3Jvbmc'}],['wrong challenge',{challenge:'d3Jvbmc'}]])
test(`transaction refuses ${name}, before any synthetic effect`,async t=>{
  const x=await setup(t);await x.enroll();await x.login();const p=(await x.request('/api/transaction/prepare',{})).data;
  assert.equal((await x.request('/api/transaction/commit',{id:p.id,credential:x.auth.authentication(p.prepared.publicKey,x.origin,changes)})).status,400);assert.deepEqual(x.state(),{version:1,audit:0});
});
test('local passkey sign-in accepts signed Chromium extra client-data members',async t=>{
  const x=await setup(t);await x.enroll();await x.status();
  const options=(await x.request('/api/login/options',{})).data;
  const signed=x.auth.authentication(options,x.origin,{
    extraClientData:{new_keys_may_be_added_here:'WebAuthn clients may extend clientDataJSON'}
  });
  const response=await x.request('/api/login/verify',{credential:signed});
  assert.equal(response.status,200,JSON.stringify(response.data));
  assert.equal((await x.status()).authenticated,true);
  assert.deepEqual(x.state(),{version:1,audit:0});
});
test('login proof cannot approve an action',async t=>{
  const x=await setup(t);await x.enroll();await x.status();const options=(await x.request('/api/login/options',{})).data,proof=x.auth.authentication(options,x.origin);
  assert.equal((await x.request('/api/login/verify',{credential:proof})).status,200);await x.status();const p=(await x.request('/api/transaction/prepare',{})).data;
  assert.equal((await x.request('/api/transaction/commit',{id:p.id,credential:proof})).status,400);assert.deepEqual(x.state(),{version:1,audit:0});
});
test('concurrent duplicate submissions commit at most once',async t=>{
  const x=await setup(t);await x.enroll();await x.login();const p=(await x.request('/api/transaction/prepare',{})).data,body={id:p.id,credential:x.auth.authentication(p.prepared.publicKey,x.origin)};
  const results=await Promise.all([x.request('/api/transaction/commit',body),x.request('/api/transaction/commit',body)]);
  assert.deepEqual(results.map(r=>r.status).sort(),[200,400]);assert.deepEqual(x.state(),{version:2,audit:1});
});
test('revocation/cancel removes old authority; a different signed approval cannot substitute',async t=>{
  const x=await setup(t);await x.enroll();await x.login();const p=(await x.request('/api/transaction/prepare',{})).data;
  const proof=x.auth.authentication(p.prepared.publicKey,x.origin);assert.equal((await x.request('/api/transaction/cancel',{id:p.id})).status,200);
  const newer=(await x.request('/api/transaction/prepare',{})).data;
  assert.equal((await x.request('/api/transaction/commit',{id:p.id,credential:proof})).status,400);
  assert.equal((await x.request('/api/transaction/commit',{id:newer.id,credential:proof})).status,400);assert.deepEqual(x.state(),{version:1,audit:0});
});
test('restart holds interrupted submission; lookup does not execute and NOT_RECORDED does not permit retry',async t=>{
  const x=await setup(t);await x.enroll();await x.login();const p=(await x.request('/api/transaction/prepare',{})).data;
  x.db(d=>d.prepare("UPDATE intents SET status='SUBMITTING' WHERE id=?").run(p.id));await x.restart();await x.login();
  assert.equal((await x.status()).intent.status,'UNKNOWN');assert.equal((await x.request('/api/transaction/lookup',{id:p.id})).data.lookup.outcome,'NOT_RECORDED');
  assert.equal((await x.request('/api/transaction/prepare',{})).status,400);assert.equal((await x.request('/api/transaction/cancel',{id:p.id})).status,400);assert.deepEqual(x.state(),{version:1,audit:0});
});
test('stop retains history and blocks login/approval even while server is running',async t=>{
  const x=await setup(t);await x.enroll();await x.login();stopApprovalApp(x.root);assert.equal((await x.status()).status,'STOPPED');assert.equal((await x.request('/api/login/options',{})).status,400);assert.deepEqual(x.state(),{version:1,audit:0});
});
test('registration rejects missing verification and wrong origin; consumed challenge cannot be reused',async t=>{
  const x=await setup(t);await x.status();await x.request('/api/enroll/authorize',{code:readFileSync(join(x.root,'enrollment-code.txt'),'utf8').trim()});await x.status();
  const options=(await x.request('/api/enroll/options',{})).data;
  assert.equal((await x.request('/api/enroll/verify',{credential:x.auth.registration(options,x.origin,{flags:0x41})})).status,400);
  assert.equal((await x.request('/api/enroll/verify',{credential:x.auth.registration(options,x.origin)})).data.error,'CHALLENGE_USED_OR_EXPIRED');
  const next=(await x.request('/api/enroll/options',{})).data;assert.equal((await x.request('/api/enroll/verify',{credential:x.auth.registration(next,x.origin,{origin:'http://evil.example'})})).status,400);
});
test('single-process lock refuses a second opener without invalidating existing sessions',async t=>{
  const x=await setup(t);await x.enroll();await x.login();assert.throws(()=>openApprovalApp(x.root),/EEXIST/);assert.equal((await x.status()).authenticated,true);
});
test('lost app acknowledgement after actual effect is held and recovered by lookup, without another execution',async t=>{
  const x=await setup(t);await x.enroll();await x.login();const p=(await x.request('/api/transaction/prepare',{})).data;
  x.db(d=>d.exec("CREATE TRIGGER lost_ack BEFORE UPDATE ON intents WHEN NEW.status='EXECUTED' BEGIN SELECT RAISE(ABORT,'injected lost acknowledgement'); END;"));
  assert.equal((await x.request('/api/transaction/commit',{id:p.id,credential:x.auth.authentication(p.prepared.publicKey,x.origin)})).status,400);
  assert.deepEqual(x.state(),{version:2,audit:1});x.db(d=>d.exec('DROP TRIGGER lost_ack'));await x.restart();await x.login();
  assert.equal((await x.status()).intent.status,'UNKNOWN');assert.equal((await x.request('/api/transaction/lookup',{id:p.id})).data.lookup.outcome,'EXECUTED');assert.deepEqual(x.state(),{version:2,audit:1});
});
test('changed destination state is refused with no approval audit or extra effect',async t=>{
  const x=await setup(t);await x.enroll();await x.login();const p=(await x.request('/api/transaction/prepare',{})).data;
  const d=new DatabaseSync(join(x.root,'witness.sqlite'));d.prepare('UPDATE resource SET version=2').run();d.close();
  const result=await x.request('/api/transaction/commit',{id:p.id,credential:x.auth.authentication(p.prepared.publicKey,x.origin)});
  assert.equal(result.data.result.reason,'RESOURCE_VERSION_CHANGED');assert.deepEqual(x.state(),{version:2,audit:0});
});
test('positive counters advance across login and approval; positive-to-zero and stale login proof are refused',async t=>{
  const x=await setup(t,{counter:1});await x.enroll();let o=(await x.request('/api/login/options',{})).data;
  assert.equal((await x.request('/api/login/verify',{credential:x.auth.authentication(o,x.origin,{counter:2})})).status,200);await x.status();
  const p=(await x.request('/api/transaction/prepare',{})).data;
  for(const counter of [0,1,2])assert.equal((await x.request('/api/transaction/commit',{id:p.id,credential:x.auth.authentication(p.prepared.publicKey,x.origin,{counter})})).status,400);
  assert.equal((await x.request('/api/transaction/commit',{id:p.id,credential:x.auth.authentication(p.prepared.publicKey,x.origin,{counter:3})})).data.status,'EXECUTED');
  await x.request('/api/logout',{});await x.status();o=(await x.request('/api/login/options',{})).data;
  assert.equal((await x.request('/api/login/verify',{credential:x.auth.authentication(o,x.origin,{counter:3})})).status,400);assert.deepEqual(x.state(),{version:2,audit:1});
});
test('expiry, logout and replacement session cannot execute a prepared request',async t=>{
  const x=await setup(t);await x.enroll();await x.login();const p=(await x.request('/api/transaction/prepare',{})).data;
  x.db(d=>{const row=d.prepare('SELECT prepared_json FROM intents WHERE id=?').get(p.id),r=JSON.parse(row.prepared_json);r.expiresAt='2000-01-01T00:00:00.000Z';d.prepare('UPDATE intents SET prepared_json=? WHERE id=?').run(JSON.stringify(r),p.id);});
  assert.equal((await x.request('/api/transaction/commit',{id:p.id,credential:x.auth.authentication(p.prepared.publicKey,x.origin)})).data.error,'TRANSACTION_EXPIRED');
  await x.request('/api/logout',{});await x.login();assert.equal((await x.request('/api/transaction/commit',{id:p.id,credential:x.auth.authentication(p.prepared.publicKey,x.origin)})).data.error,'INTENT_USED_OR_SESSION_CHANGED');assert.deepEqual(x.state(),{version:1,audit:0});
});
test('forged credential, altered action fields, and spent bootstrap cannot authorize an action',async t=>{
  const x=await setup(t);const code=readFileSync(join(x.root,'enrollment-code.txt'),'utf8').trim();await x.enroll();
  assert.equal((await x.request('/api/enroll/authorize',{code})).status,400);await x.login();const p=(await x.request('/api/transaction/prepare',{})).data,c=x.auth.authentication(p.prepared.publicKey,x.origin);
  c.response.signature='AAAA';assert.equal((await x.request('/api/transaction/commit',{id:p.id,credential:c})).status,400);
  assert.equal((await x.request('/api/transaction/commit',{id:p.id,credential:c,grant:{}})).data.error,'REQUEST_FIELDS_REFUSED');assert.deepEqual(x.state(),{version:1,audit:0});
});
