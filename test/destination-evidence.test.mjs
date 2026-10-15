import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fork,execFileSync } from 'node:child_process';
import { once } from 'node:events';
import { mkdirSync,writeFileSync } from 'node:fs';
import { resolve,join } from 'node:path';
import { randomUUID,generateKeyPairSync } from 'node:crypto';
import { createMission03Fixture } from '../scripts/mission-03-fixture.mjs';
import { SyntheticDestinationProcess } from '../dist/src/destination-process-client.js';
import { SeparateDestinationAuthority } from '../dist/src/separate-destination-authority.js';
import { verifyDestinationEvidence, canonicalDestinationEvidence } from '../dist/src/destination-evidence.js';
import { pathToFileURL } from 'node:url';
import { createSyntheticPluginRequest } from '../dist/src/standalone-plugin.js';
import { PURCHASING_DEMO_EXECUTION_TIME as AT } from '../dist/src/local-purchasing-lifecycle-demo.js';
import { createOperatorAuthorityEvidence } from '../dist/src/durable-action-lifecycle.js';

const parent=resolve('.atg-evaluation/mission03-tests');mkdirSync(parent,{recursive:true});
async function fixture(t,limit=1000000) {
  const f=await createMission03Fixture(join(parent,randomUUID()),limit);
  t.after(async()=>{try{f.authority.close();}catch{} try{await f.client.close();}catch{} });
  t.diagnostic('Retained synthetic state: '+f.root);return f;
}
async function approved(f) {
  const request=createSyntheticPluginRequest('enforced'), a=await f.authority.approve(request);
  assert.ok(a.approvalId);const claim=await f.authority.claim(a.approvalId,request);assert.ok(claim);
  return {request,id:a.approvalId,claim};
}
function exposure(f) {return f.authority.snapshot().exposureEntries.filter(e=>e.status!=='RELEASED').reduce((s,e)=>s+e.amountMinorUnits,0);}
function status(f) {return f.authority.snapshot().lifecycles[0].status;}
async function lookup(f,id,fenced=true) {
  const q=f.authority.beginLookup(id,fenced);
  const e=await f.client.request({op:fenced?'fence_lookup':'lookup',...q});return {q,e};
}
function barrier(child) {
  return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{child.stdout.off('data',onData);reject(Error('BARRIER_TIMEOUT'));},15000);
    let buffer='';const onData=data=>{buffer+=data;const i=buffer.indexOf('\n');if(i>=0){clearTimeout(timer);child.stdout.off('data',onData);resolve(JSON.parse(buffer.slice(0,i)));}};
    child.stdout.on('data',onData);
  });
}
async function kill(child) {if(child.exitCode===null&&child.signalCode===null){const exited=once(child,'exit');child.kill('SIGKILL');await exited;}}
async function worker(t,f) {
  const child=fork(resolve('scripts/mission-03-worker.mjs'),[f.root],{stdio:['pipe','pipe','pipe','ipc']});
  child.stderr.on('data',()=>{});
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('WORKER_READY_TIMEOUT')),15000);child.once('message',m=>{clearTimeout(timer);assert.equal(m.phase,'ready');resolve();});child.once('error',reject);});
  t.after(()=>kill(child));
  return {child,call(op,args={}){const callId=randomUUID();return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{cleanup();reject(Error('WORKER_TIMEOUT'));},20000);
    const onMessage=m=>{if(m.id!==callId)return;cleanup();if(m.error)reject(Error(m.error));else resolve(m.value);};
    const onExit=()=>{cleanup();reject(Error('WORKER_EXITED'));};
    function cleanup(){clearTimeout(timer);child.off('message',onMessage);child.off('exit',onExit);}
    child.on('message',onMessage);child.on('exit',onExit);child.send({op,callId,...args});
  });}};
}

test('valid approved execution commits once and verifies using the separate signing role',async t=>{
  const f=await fixture(t),a=await approved(f);
  assert.equal((await f.authority.submit(a.claim)).outcome,'EXECUTED');
  assert.equal(status(f),'EXECUTED');assert.equal(exposure(f),400000);
  assert.equal((await f.authority.submit(a.claim)).outcome,'REJECTED');
});

test('destination killed after its commit before acknowledgement resolves from signed lookup after restart',async t=>{
  const f=await fixture(t),a=await approved(f),q=f.authority.beginLookup(a.id,false);
  const reached=barrier(f.client.child);
  const sent=f.client.request({op:'submit',...q,token:a.claim.token,barrier:'after_commit'});
  const failure=assert.rejects(sent,/DESTINATION_UNAVAILABLE/);
  assert.equal((await reached).barrier,'after_commit');await kill(f.client.child);await failure;
  assert.equal(status(f),'UNKNOWN');assert.equal(exposure(f),400000);
  f.authority.close();
  const restarted=await SyntheticDestinationProcess.start(f.destinationDirectory,false,f.trust);f.client=restarted.client;
  f.authority=new SeparateDestinationAuthority({stateDirectory:f.authorityDirectory,destination:f.client,trust:f.trust});
  assert.equal((await f.authority.reconcile(a.id)).outcome,'EXECUTED');
  assert.equal(status(f),'EXECUTED');assert.equal(exposure(f),400000);
});

test('altered receipt, receipt-supplied key, wrong trust key, wrong destination, and substituted action fail',async t=>{
  const f=await fixture(t),a=await approved(f),q=f.authority.beginLookup(a.id,false);
  await f.client.request({op:'submit',...q,token:a.claim.token});
  const {q:expected,e}=await lookup(f,a.id);
  const wrongKey=generateKeyPairSync('ed25519').publicKey.export({type:'spki',format:'pem'}).toString();
  const altered=structuredClone(e);altered.payload.resultingRecordVersion++;
  const keyInjection={...e,publicKeyPem:wrongKey};
  const substituted=structuredClone(expected.approval);substituted.request.proposedAction.quantity++;
  const alteredState=structuredClone(expected.approval);alteredState.binding.businessState.supplierBankVersion++;
  for(const [receipt,approval,trust] of [[altered,expected.approval,f.trust],[keyInjection,expected.approval,f.trust],[e,expected.approval,{...f.trust,destinationPublicKeyPem:wrongKey}],
    [e,expected.approval,{...f.trust,destinationIdentity:'wrong-destination'}],[e,substituted,f.trust],[e,alteredState,f.trust],[e,expected.approval,{...f.trust,approvalPublicKeyPem:wrongKey}]]) {
    assert.equal(verifyDestinationEvidence(receipt,approval,trust,expected.lookup,AT).verified,false);
  }
  assert.equal(f.authority.acceptEvidence(a.id,altered).outcome,'UNKNOWN');assert.equal(exposure(f),400000);assert.equal(status(f),'UNKNOWN');
});

test('lookup replay, expired freshness, future time, wrong challenge and reused accepted evidence fail',async t=>{
  const f=await fixture(t),a=await approved(f);
  const first=await lookup(f,a.id);const second=await lookup(f,a.id);
  assert.equal(f.authority.acceptEvidence(a.id,first.e).outcome,'UNKNOWN');assert.equal(exposure(f),400000);
  const future=new Date(Date.parse(AT)+6000).toISOString();
  assert.equal(verifyDestinationEvidence(second.e,second.q.approval,f.trust,second.q.lookup,future).reason,'EVIDENCE_STALE');
  assert.equal(verifyDestinationEvidence(second.e,second.q.approval,f.trust,second.q.lookup,new Date(Date.parse(AT)-1).toISOString()).verified,false);
  assert.equal(verifyDestinationEvidence(second.e,second.q.approval,f.trust,{...second.q.lookup,challenge:randomUUID()},AT).verified,false);
  assert.equal(f.authority.acceptEvidence(a.id,second.e).outcome,'NOT_EXECUTED');assert.equal(exposure(f),0);
  assert.equal(f.authority.acceptEvidence(a.id,second.e).outcome,'UNKNOWN');
});

test('missing/unavailable evidence retains UNKNOWN exposure and cannot retry or automatically reauthorise',async t=>{
  const f=await fixture(t,600000),a=await approved(f);f.authority.beginLookup(a.id);
  assert.equal(f.authority.acceptEvidence(a.id,null).outcome,'UNKNOWN');await kill(f.client.child);
  assert.equal((await f.authority.reconcile(a.id)).outcome,'UNKNOWN');assert.equal(exposure(f),400000);assert.equal(status(f),'UNKNOWN');
  assert.equal((await f.authority.submit(a.claim)).outcome,'REJECTED');
  assert.equal(await f.authority.claim(a.id,a.request),null);
});

test('genuinely signed but unfenced not-found and forged/incomplete absence cannot release a hold',async t=>{
  const f=await fixture(t),a=await approved(f);
  const unfenced=await lookup(f,a.id,false);
  assert.equal(unfenced.e.payload.outcome,'ABSENT');assert.equal(unfenced.e.payload.fence,null);
  assert.equal(f.authority.acceptEvidence(a.id,unfenced.e).reason,'UNFENCED_ABSENCE');assert.equal(exposure(f),400000);
  const forged=structuredClone(unfenced.e);forged.payload.fence={completed:true};
  assert.equal(f.authority.acceptEvidence(a.id,forged).outcome,'UNKNOWN');
  const fenced=await lookup(f,a.id);const incomplete=structuredClone(fenced.e);delete incomplete.payload.authoritativeLookup;
  assert.equal(f.authority.acceptEvidence(a.id,incomplete).outcome,'UNKNOWN');assert.equal(status(f),'UNKNOWN');assert.equal(exposure(f),400000);
  assert.equal(f.authority.acceptEvidence(a.id,fenced.e).outcome,'NOT_EXECUTED');assert.equal(status(f),'ABANDONED');assert.equal(exposure(f),0);
});

test('delayed destination submission and registration cannot write after permanent fenced absence',async t=>{
  const f=await fixture(t),a=await approved(f),old=f.authority.beginLookup(a.id,false);
  assert.equal((await f.authority.reconcile(a.id)).outcome,'NOT_EXECUTED');
  await assert.rejects(f.client.request({op:'submit',...old,token:a.claim.token}),/DESTINATION_FENCED/);
  await assert.rejects(f.client.request({op:'register',approval:old.approval,token:a.claim.token}),/DESTINATION_FENCED/);
  assert.equal(exposure(f),0);assert.equal((await f.client.request({op:'state'})).orderVersion,1);
});

test('kill after destination fence commit keeps held exposure until a new signed lookup, and fence survives restart',async t=>{
  const f=await fixture(t),a=await approved(f),q=f.authority.beginLookup(a.id,true);
  const reached=barrier(f.client.child),sent=f.client.request({op:'fence_lookup',...q,barrier:'after_commit'}),failure=assert.rejects(sent,/DESTINATION_UNAVAILABLE/);
  await reached;await kill(f.client.child);await failure;assert.equal(exposure(f),400000);assert.equal(status(f),'UNKNOWN');
  f.authority.close();const restarted=await SyntheticDestinationProcess.start(f.destinationDirectory,false,f.trust);f.client=restarted.client;
  f.authority=new SeparateDestinationAuthority({stateDirectory:f.authorityDirectory,destination:f.client,trust:f.trust});
  await assert.rejects(f.client.request({op:'register',approval:q.approval,token:a.claim.token}),/DESTINATION_FENCED/);
  assert.equal((await f.authority.reconcile(a.id)).outcome,'NOT_EXECUTED');assert.equal(exposure(f),0);
});

for(const limit of [600000,1000000]) test('separate authority/destination processes preserve atomic shared budget '+limit,async t=>{
  const f=await fixture(t,limit),w1=await worker(t,f),w2=await worker(t,f);
  const r1=createSyntheticPluginRequest('enforced'),r2=createSyntheticPluginRequest('enforced');
  const approvals=await Promise.all([w1.call('approve',{request:r1}),w2.call('approve',{request:r2})]);
  const allowed=limit===600000?1:2;assert.equal(approvals.filter(a=>a.approvalId).length,allowed);
  assert.equal(exposure(f),400000*allowed);
  if(allowed===1)assert.equal(approvals.find(a=>!a.approvalId).decision.outcome,'REFER');
});

test('separate workers compete for one approval; reservation is durable before any destination write',async t=>{
  const f=await fixture(t),w1=await worker(t,f),w2=await worker(t,f),request=createSyntheticPluginRequest('enforced');
  const a=await w1.call('approve',{request});
  const claims=await Promise.all([w1.call('claim',{id:a.approvalId,request}),w2.call('claim',{id:a.approvalId,request})]);
  assert.equal(claims.filter(Boolean).length,1);assert.equal(status(f),'RESERVED');assert.equal(exposure(f),400000);
  assert.equal((await (claims[0]?w1:w2).call('submit',{claim:claims.find(Boolean)})).outcome,'EXECUTED');
});

for(const control of ['stop','revoke']) test('completed '+control+' precedes delayed worker; destination-side fence/stop rejects direct bypass',async t=>{
  const f=await fixture(t),w=await worker(t,f),request=createSyntheticPluginRequest('enforced');
  const a=await w.call('approve',{request}),claim=await w.call('claim',{id:a.approvalId,request});
  const reached=barrier(w.child),sent=w.call('submit',{claim,barrier:'before_operation'});await reached;
  if(control==='stop') {assert.equal((await f.authority.emergencyStop()).reason,'AUTHORITY_AND_DESTINATION_STOPPED_RECONCILE_INFLIGHT');assert.equal((await f.authority.reconcile(a.approvalId)).outcome,'NOT_EXECUTED');}
  else assert.equal((await f.authority.revoke(a.approvalId)).outcome,'NOT_EXECUTED');
  w.child.stdin.write('x');assert.equal((await sent).outcome,'REJECTED');assert.equal(exposure(f),0);
});

test('public-key verifier works in a fresh separate process on actual Node 20 with only copied public inputs',async t=>{
  const f=await fixture(t),a=await approved(f),{q,e}=await lookup(f,a.id);
  const independent=join(f.root,'public-verifier-inputs');mkdirSync(independent);
  for(const [name,value] of Object.entries({trust:f.trust,approval:q.approval,lookup:q.lookup,evidence:e}))writeFileSync(join(independent,name+'.json'),JSON.stringify(value));
  const node20=process.env.ATG_NODE20_PATH;if(!node20)throw Error('Set ATG_NODE20_PATH to the existing actual temporary Node 20 executable');
  const verifier=resolve('scripts/verify-destination-evidence.mjs'),restricted=join(independent,'restricted-verifier.mjs');
  // This subprocess is denied all writes, child spawning, authority reads and
  // destination-private-key reads. Only public inputs and runtime code can be read.
  writeFileSync(restricted,`import assert from 'node:assert/strict';import {readFileSync,writeFileSync} from 'node:fs';
    assert.equal(process.permission.has('fs.write'),false);
    assert.throws(()=>writeFileSync('write-probe.txt','denied'),{code:'ERR_ACCESS_DENIED'});
    for(const path of ${JSON.stringify([join(f.authorityDirectory,'authority.sqlite'),join(f.destinationDirectory,'signing-private.pem')])}) assert.throws(()=>readFileSync(path),{code:'ERR_ACCESS_DENIED'});
    await import(${JSON.stringify(pathToFileURL(verifier).href)});`);
  const readable=[independent,resolve('dist'),resolve('src'),resolve('scripts'),resolve('package.json')];
  const stdout=execFileSync(node20,['--experimental-permission',...readable.map(path=>'--allow-fs-read='+path),restricted,'--trust',join(independent,'trust.json'),'--approval',join(independent,'approval.json'),'--evidence',join(independent,'evidence.json'),'--lookup',join(independent,'lookup.json'),'--now',AT],{cwd:independent,encoding:'utf8'});
  const verified=JSON.parse(stdout);assert.match(verified.runtime,/^v20\./);assert.equal(verified.verified,true);assert.equal(verified.destinationPrivateKeyRequired,false);assert.equal(verified.writableAuthorityRequired,false);
});

test('initialisation refuses existing authority/destination state; no v1/v2 migration or overwrite',async t=>{
  const f=await fixture(t);
  assert.throws(()=>SeparateDestinationAuthority.initialise(f.authorityDirectory,f.trust),/EEXIST/);
  await assert.rejects(SyntheticDestinationProcess.start(f.destinationDirectory,true),/DESTINATION_START_FAILED/);
});

for(const fault of ['incomplete-fence','non-authoritative','stale']) test('valid destination signature with '+fault+' evidence still retains UNKNOWN',async t=>{
  const f=await fixture(t),a=await approved(f),q=f.authority.beginLookup(a.id,true);
  const receipt=await f.client.request({op:'fence_lookup',...q,testFault:fault});
  assert.equal(f.authority.acceptEvidence(a.id,receipt).outcome,'UNKNOWN');assert.equal(status(f),'UNKNOWN');assert.equal(exposure(f),400000);
  assert.equal((await f.authority.reconcile(a.id)).outcome,'NOT_EXECUTED');
});

test('valid signature with a substituted destination transaction identifier fails record binding',async t=>{
  const f=await fixture(t),a=await approved(f),q=f.authority.beginLookup(a.id,false);
  await f.client.request({op:'submit',...q,token:a.claim.token});
  const fresh=f.authority.beginLookup(a.id,true);
  const receipt=await f.client.request({op:'fence_lookup',...fresh,testFault:'wrong-transaction'});
  assert.equal(f.authority.acceptEvidence(a.id,receipt).reason,'EXECUTION_RECORD_INVALID');assert.equal(exposure(f),400000);assert.equal(status(f),'UNKNOWN');
  assert.equal((await f.authority.reconcile(a.id)).outcome,'EXECUTED');
});

test('recovery in another destination process fences a send paused outside the destination transaction',async t=>{
  const f=await fixture(t),a=await approved(f),q=f.authority.beginLookup(a.id,false);
  const reached=barrier(f.client.child),sent=f.client.request({op:'submit',...q,token:a.claim.token,barrier:'before_operation'});
  const rejected=assert.rejects(sent,/DESTINATION_FENCED/);await reached;
  const recovery=await SyntheticDestinationProcess.start(f.destinationDirectory,false,f.trust);
  t.after(()=>recovery.client.close());
  const intent=f.authority.beginLookup(a.id,true),receipt=await recovery.client.request({op:'fence_lookup',...intent});
  assert.equal(f.authority.acceptEvidence(a.id,receipt).outcome,'NOT_EXECUTED');
  f.client.child.stdin.write('x');await rejected;assert.equal(exposure(f),0);
});

test('a destination commit ordered before stop is reported executed and cannot be reversed or released',async t=>{
  const f=await fixture(t),a=await approved(f),q=f.authority.beginLookup(a.id,false);
  const reached=barrier(f.client.child),sent=f.client.request({op:'submit',...q,token:a.claim.token,barrier:'after_commit'});await reached;
  const stopped=f.authority.emergencyStop();
  f.client.child.stdin.write('x');const receipt=await sent;await stopped;
  assert.equal(f.authority.acceptEvidence(a.id,receipt).outcome,'EXECUTED');assert.equal(status(f),'EXECUTED');assert.equal(exposure(f),400000);
  assert.equal((await f.authority.revoke(a.id)).reason,'GATEPASS_REVOCATION_AFTER_EXECUTION_REFUSED');
});

test('operator can explicitly complete an interrupted destination stop after restart; invalid operator evidence is refused',async t=>{
  const f=await fixture(t),a=await approved(f);
  const invalid={...createOperatorAuthorityEvidence(),evidenceDigest:'invalid'};
  assert.equal((await f.authority.emergencyStop(invalid)).reason,'STOP_REFUSED');
  assert.throws(()=>f.authority.beginLookup(a.id,true,invalid),/OPERATOR_AUTHORITY_INVALID/);
  await kill(f.client.child);
  assert.equal((await f.authority.emergencyStop()).outcome,'UNKNOWN');assert.equal(exposure(f),400000);
  f.authority.close();const restarted=await SyntheticDestinationProcess.start(f.destinationDirectory,false,f.trust);f.client=restarted.client;
  f.authority=new SeparateDestinationAuthority({stateDirectory:f.authorityDirectory,destination:f.client,trust:f.trust});
  assert.equal((await f.authority.emergencyStop()).reason,'AUTHORITY_AND_DESTINATION_STOPPED_RECONCILE_INFLIGHT');
  assert.equal((await f.authority.reconcile(a.id)).outcome,'NOT_EXECUTED');assert.equal(exposure(f),0);
});

for(const stopped of [false,true]) test('unclaimed issued approval cannot be registered after revocation, including stop='+stopped,async t=>{
  const f=await fixture(t),request=createSyntheticPluginRequest('enforced'),a=await f.authority.approve(request);
  const oldApproval=f.authority.approval(a.approvalId);
  assert.equal(status(f),'ISSUED');assert.equal(exposure(f),400000);
  if(stopped)await f.authority.emergencyStop();
  assert.equal((await f.authority.revoke(a.approvalId)).outcome,'NOT_EXECUTED');assert.equal(exposure(f),0);
  await assert.rejects(f.client.request({op:'register',approval:oldApproval,token:randomUUID()}),/DESTINATION_FENCED/);
  assert.equal(await f.authority.claim(a.approvalId,request),null);
});

test('failed destination lookup during revocation of an issued approval never releases its exposure',async t=>{
  const f=await fixture(t),request=createSyntheticPluginRequest('enforced'),a=await f.authority.approve(request);
  await kill(f.client.child);assert.equal((await f.authority.revoke(a.approvalId)).outcome,'UNKNOWN');assert.equal(exposure(f),400000);assert.equal(status(f),'UNKNOWN');
});

test('canonical evidence and approval validation reject unsigned nested prototype properties',async t=>{
  const f=await fixture(t),a=await approved(f),{q,e}=await lookup(f,a.id);
  const receipt=structuredClone(e),approval=structuredClone(q.approval);
  Object.defineProperty(receipt.payload.approvedBusinessState,'__proto__',{value:{unsignedMarker:true},enumerable:true});
  Object.defineProperty(approval.binding.businessState,'__proto__',{value:{unsignedMarker:true},enumerable:true});
  assert.equal(verifyDestinationEvidence(receipt,q.approval,f.trust,q.lookup,AT).verified,false);
  assert.equal(verifyDestinationEvidence(e,approval,f.trust,q.lookup,AT).verified,false);
  assert.equal(f.authority.acceptEvidence(a.id,receipt).outcome,'UNKNOWN');assert.equal(status(f),'UNKNOWN');assert.equal(exposure(f),400000);
});

test('strict canonical boundary rejects getters, hidden fields and non-JSON values before accessing them',async t=>{
  const f=await fixture(t),a=await approved(f),{q,e}=await lookup(f,a.id);
  let accessed=0;const receipt=structuredClone(e);
  Object.defineProperty(receipt,'schema',{enumerable:true,get(){accessed++;return e.schema;}});
  assert.equal(verifyDestinationEvidence(receipt,q.approval,f.trust,q.lookup,AT).verified,false);assert.equal(accessed,0);
  for(const invalid of [{value:undefined},{value:NaN},[,,],new Date(AT)])assert.throws(()=>canonicalDestinationEvidence(invalid));
  const hidden=structuredClone(e);Object.defineProperty(hidden.payload,'unsignedHidden',{value:true,enumerable:false});
  assert.equal(verifyDestinationEvidence(hidden,q.approval,f.trust,q.lookup,AT).verified,false);
  assert.equal(canonicalDestinationEvidence({b:2,a:1}),'\u007b"a":1,"b":2\u007d');
});

for(const fault of ['missing-fence','wrong-destination','wrong-action','wrong-state-version']) test('signed '+fault+' execution evidence retains UNKNOWN despite a valid signer',async t=>{
  const f=await fixture(t),a=await approved(f),q=f.authority.beginLookup(a.id,false);
  await f.client.request({op:'submit',...q,token:a.claim.token});
  const fresh=f.authority.beginLookup(a.id,true),receipt=await f.client.request({op:'fence_lookup',...fresh,testFault:fault});
  assert.equal(f.authority.acceptEvidence(a.id,receipt).outcome,'UNKNOWN');assert.equal(status(f),'UNKNOWN');assert.equal(exposure(f),400000);
  assert.equal((await f.authority.reconcile(a.id)).outcome,'EXECUTED');assert.equal(exposure(f),400000);
});

for(const op of ['submit','fence_lookup']) test('destination crash inside uncommitted '+op+' transaction preserves hold and rolls back before fenced recovery',async t=>{
  const f=await fixture(t),a=await approved(f),q=f.authority.beginLookup(a.id,op==='fence_lookup');
  const reached=barrier(f.client.child),sent=f.client.request({op,...q,token:a.claim.token,barrier:'before_commit'}),failure=assert.rejects(sent,/DESTINATION_UNAVAILABLE/);
  assert.equal((await reached).barrier,'before_commit');await kill(f.client.child);await failure;assert.equal(status(f),'UNKNOWN');assert.equal(exposure(f),400000);
  f.authority.close();const restarted=await SyntheticDestinationProcess.start(f.destinationDirectory,false,f.trust);f.client=restarted.client;
  f.authority=new SeparateDestinationAuthority({stateDirectory:f.authorityDirectory,destination:f.client,trust:f.trust});
  const stillAbsent=await lookup(f,a.id,false);assert.equal(stillAbsent.e.payload.outcome,'ABSENT');assert.equal(stillAbsent.e.payload.fence,null);
  assert.equal(f.authority.acceptEvidence(a.id,stillAbsent.e).outcome,'UNKNOWN');assert.equal(exposure(f),400000);
  assert.equal((await f.authority.reconcile(a.id)).outcome,'NOT_EXECUTED');assert.equal(exposure(f),0);
  await assert.rejects(f.client.request({op:'submit',...q,lookup:{...q.lookup,fenceId:null},token:a.claim.token}),/DESTINATION_FENCED/);
});

test('authority worker killed after durable registration before acknowledgement cannot reclaim or lose exposure',async t=>{
  const f=await fixture(t),w=await worker(t,f),request=createSyntheticPluginRequest('enforced');
  const a=await w.call('approve',{request});const reached=barrier(w.child),claim=w.call('claim',{id:a.approvalId,request,barrier:'after_operation'}),failed=assert.rejects(claim,/WORKER_EXITED/);
  await reached;await kill(w.child);await failed;assert.equal(status(f),'RESERVED');assert.equal(exposure(f),400000);
  assert.equal(await f.authority.claim(a.approvalId,request),null);
  assert.equal((await f.authority.reconcile(a.approvalId)).outcome,'NOT_EXECUTED');assert.equal(exposure(f),0);
});

test('host trust rejects reused signing-role keys and changed destination pins on restart',async t=>{
  const f=await fixture(t),a=await approved(f),{q,e}=await lookup(f,a.id);
  const reused={...f.trust,destinationPublicKeyPem:f.trust.approvalPublicKeyPem};
  assert.equal(verifyDestinationEvidence(e,q.approval,reused,q.lookup,AT).reason,'DISTINCT_SIGNING_ROLES_REQUIRED');
  await assert.rejects(SyntheticDestinationProcess.start(f.destinationDirectory,false,reused),/PINNED_DESTINATION_KEY_MISMATCH/);
  assert.equal(exposure(f),400000);
});
