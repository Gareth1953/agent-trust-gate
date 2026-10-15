#!/usr/bin/env node
import assert from 'node:assert/strict';
import { mkdirSync,writeFileSync } from 'node:fs';
import { isAbsolute,join,dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fork } from 'node:child_process';
import { once } from 'node:events';
import { randomUUID } from 'node:crypto';
import { STANDALONE_PLUGIN_VERSION } from '../dist/src/standalone-plugin.js';

const args=process.argv.slice(2);
if(args.length===0 || (args.length===1 && args[0]==='--help')) {
  console.log('ATG separately signed destination evidence evaluation (Node 24+)\nUse: atg-destination-evidence --state ABSOLUTE_NEW_DIRECTORY\nExplicit fresh synthetic setup: separate destination process generates/owns its key; ATG gets public key only.\nRetains authority/destination state and public verification inputs. One machine, fixed clock; no external capture, host-administrator protection or live partner integration. No v1/v2 migration/reset or automatic execution retry.');
} else {
  try {
    if(Number(process.versions.node.split('.')[0])<24)throw Error('ATG_SHARED_WORKER_REQUIRES_NODE_24: destination/shared authority requires Node 24+; public verifier and legacy SDK/CLI/MCP support Node 20.');
    if(args.length!==2 || args[0]!=='--state' || !isAbsolute(args[1]))throw Error('Use --state ABSOLUTE_NEW_DIRECTORY; parent must exist and existing state is never reused.');
    await demonstrate(args[1]);
  } catch(error){console.error(String(error));process.exitCode=1;}
}
async function demonstrate(root) {
  const {createMission03Fixture}=await import('./mission-03-fixture.mjs');
  const {createSyntheticPluginRequest}=await import('../dist/src/standalone-plugin.js');
  const {verifyDestinationEvidence}=await import('../dist/src/destination-evidence.js');
  const {SyntheticDestinationProcess}=await import('../dist/src/destination-process-client.js');
  const {SeparateDestinationAuthority}=await import('../dist/src/separate-destination-authority.js');
  const {PURCHASING_DEMO_EXECUTION_TIME:AT}=await import('../dist/src/local-purchasing-lifecycle-demo.js');
  mkdirSync(root,{mode:0o700}); // Explicit fresh setup only; never overwrite/migrate.
  const cases=[];
  const exposure=f=>{
    const s=f.authority.snapshot(),sum=statuses=>s.exposureEntries.filter(e=>statuses.includes(e.status)).reduce((n,e)=>n+e.amountMinorUnits,0);
    return {heldMinorUnits:sum(['OUTSTANDING','RESERVED','UNKNOWN','COMMITTED']),unknownMinorUnits:sum(['UNKNOWN']),committedMinorUnits:sum(['COMMITTED']),statuses:s.lifecycles.map(l=>l.status)};
  };
  const approve=async f=>{
    const request=createSyntheticPluginRequest('enforced'),a=await f.authority.approve(request),claim=await f.authority.claim(a.approvalId,request);
    assert.ok(a.approvalId);assert.ok(claim);return {id:a.approvalId,request,claim};
  };
  const get=async(f,id,fenced=true,fault)=>{
    const q=f.authority.beginLookup(id,fenced),e=await f.client.request({op:fenced?'fence_lookup':'lookup',...q,...(fault?{testFault:fault}:{})});
    return {q,e};
  };
  const execute=async(f,a)=>{
    const q=f.authority.beginLookup(a.id,false),e=await f.client.request({op:'submit',...q,token:a.claim.token});return {q,e};
  };
  const proof=(f,{q,e})=>({trust:f.trust,approval:q.approval,lookup:q.lookup,evidence:e});
  async function run(id,fn) {
    const f=await createMission03Fixture(join(root,id));
    try {
      const value=await fn(f);
      const publicDir=join(f.root,'public');mkdirSync(publicDir);
      if(value.publicVerification)for(const [name,data] of Object.entries(value.publicVerification))writeFileSync(join(publicDir,name+'.json'),JSON.stringify(data,null,2)+'\n',{flag:'wx'});
      cases.push({id,...value,final:exposure(f),passed:true,retainedState:id});
    } finally {f.authority.close();await f.client.close();}
  }
  await run('signed-outcome',async f=>{
    const a=await approve(f),captured=await execute(f,a),verified=verifyDestinationEvidence(captured.e,captured.q.approval,f.trust,captured.q.lookup,AT);
    assert.equal(verified.verified,true);const outcome=f.authority.acceptEvidence(a.id,captured.e);assert.equal(outcome.outcome,'EXECUTED');
    assert.equal(exposure(f).committedMinorUnits,400000);return {verified,outcome,publicVerification:proof(f,captured)};
  });
  await run('tampering',async f=>{
    const a=await approve(f),captured=await execute(f,a),changed=structuredClone(captured.e);changed.payload.resultingRecordVersion++;
    const rejected=f.authority.acceptEvidence(a.id,changed);assert.equal(rejected.outcome,'UNKNOWN');assert.equal(exposure(f).unknownMinorUnits,400000);
    const outcome=f.authority.acceptEvidence(a.id,captured.e);assert.equal(outcome.outcome,'EXECUTED');return {rejected,outcome,publicVerification:proof(f,captured)};
  });
  await run('lookup-replay-and-stale',async f=>{
    const a=await approve(f),old=await get(f,a.id),fresh=await get(f,a.id),replayed=f.authority.acceptEvidence(a.id,old.e);
    assert.equal(replayed.outcome,'UNKNOWN');assert.equal(exposure(f).unknownMinorUnits,400000);
    const stale=verifyDestinationEvidence(fresh.e,fresh.q.approval,f.trust,fresh.q.lookup,new Date(Date.parse(AT)+6000).toISOString());assert.equal(stale.reason,'EVIDENCE_STALE');
    const outcome=f.authority.acceptEvidence(a.id,fresh.e);assert.equal(outcome.outcome,'NOT_EXECUTED');
    const reused=f.authority.acceptEvidence(a.id,fresh.e);assert.equal(reused.outcome,'UNKNOWN');return {replayed,stale,outcome,reused,publicVerification:proof(f,fresh)};
  });
  await run('incomplete-fence',async f=>{
    const a=await approve(f);await execute(f,a);
    const incomplete=await get(f,a.id,true,'missing-fence'),rejected=f.authority.acceptEvidence(a.id,incomplete.e);
    assert.equal(rejected.reason,'FENCE_REQUIRED');assert.equal(exposure(f).unknownMinorUnits,400000);
    const fresh=await get(f,a.id),outcome=f.authority.acceptEvidence(a.id,fresh.e);assert.equal(outcome.outcome,'EXECUTED');return {rejected,outcome,publicVerification:proof(f,fresh)};
  });
  await run('lost-acknowledgement',async f=>{
    const a=await approve(f),q=f.authority.beginLookup(a.id,false),reached=barrier(f.client.child);
    const send=f.client.request({op:'submit',...q,token:a.claim.token,barrier:'after_commit'}),lost=assert.rejects(send,/DESTINATION_UNAVAILABLE/);
    assert.equal((await reached).barrier,'after_commit');await kill(f.client.child);await lost;
    const beforeRecovery=exposure(f);assert.equal(beforeRecovery.unknownMinorUnits,400000);
    f.authority.close();f.client=(await SyntheticDestinationProcess.start(f.destinationDirectory,false,f.trust)).client;
    f.authority=new SeparateDestinationAuthority({stateDirectory:f.authorityDirectory,destination:f.client,trust:f.trust});
    const recovered=await get(f,a.id),outcome=f.authority.acceptEvidence(a.id,recovered.e);assert.equal(outcome.outcome,'EXECUTED');
    return {beforeRecovery,crashBoundary:'destination commit before acknowledgement; explicit barrier then SIGKILL',outcome,publicVerification:proof(f,recovered)};
  });
  await run('fenced-absence',async f=>{
    const a=await approve(f),unfenced=await get(f,a.id,false),rejected=f.authority.acceptEvidence(a.id,unfenced.e);
    assert.equal(rejected.reason,'UNFENCED_ABSENCE');assert.equal(exposure(f).unknownMinorUnits,400000);
    const fenced=await get(f,a.id),outcome=f.authority.acceptEvidence(a.id,fenced.e);assert.equal(outcome.outcome,'NOT_EXECUTED');assert.equal(exposure(f).heldMinorUnits,0);
    return {rejected,outcome,publicVerification:proof(f,fenced)};
  });
  await run('delayed-worker',async f=>{
    const a=await approve(f),old=f.authority.beginLookup(a.id,false),worker=await openWorker(f.root);
    try {
      const reached=barrier(worker.child),send=worker.call('submit',{claim:a.claim,barrier:'before_operation'});await reached;
      const fenced=await get(f,a.id),outcome=f.authority.acceptEvidence(a.id,fenced.e);assert.equal(outcome.outcome,'NOT_EXECUTED');
      worker.child.stdin.write('x');const delayed=await send;assert.equal(delayed.outcome,'REJECTED');
      await assert.rejects(f.client.request({op:'submit',...old,token:a.claim.token}),/DESTINATION_FENCED/);
      await assert.rejects(f.client.request({op:'register',approval:old.approval,token:a.claim.token}),/DESTINATION_FENCED/);
      return {outcome,delayed,destinationRejectedOldCapability:true,publicVerification:proof(f,fenced)};
    } finally {await kill(worker.child);}
  });
  await run('missing-evidence',async f=>{
    const a=await approve(f);f.authority.beginLookup(a.id);const missing=f.authority.acceptEvidence(a.id,null);
    assert.equal(missing.outcome,'UNKNOWN');assert.equal(exposure(f).unknownMinorUnits,400000);
    const recovered=await get(f,a.id),outcome=f.authority.acceptEvidence(a.id,recovered.e);assert.equal(outcome.outcome,'NOT_EXECUTED');return {missing,outcome,publicVerification:proof(f,recovered)};
  });
  const results={pluginVersion:STANDALONE_PLUGIN_VERSION,runtime:process.version,testClock:AT,
    boundary:{separatelySignedDestinationEvidence:true,separateProcesses:true,sameHost:true,oneMachine:true,syntheticOnly:true,independentExternalCapture:false,hostAdministratorProtection:false,livePartnerIntegration:false,liveTimeFreshness:false,productionReady:false,automaticRetry:false},cases,passed:cases.length===8&&cases.every(c=>c.passed)};
  writeFileSync(join(root,'results.json'),JSON.stringify(results,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({...results,stateRetainedAt:root}));
}
function barrier(child){return new Promise((resolve,reject)=>{let buffer='';const timer=setTimeout(()=>{child.stdout.off('data',onData);reject(Error('BARRIER_TIMEOUT'));},15000);function onData(data){buffer+=data;const i=buffer.indexOf('\n');if(i>=0){clearTimeout(timer);child.stdout.off('data',onData);resolve(JSON.parse(buffer.slice(0,i)));}}child.stdout.on('data',onData);});}
async function kill(child){if(child.exitCode===null&&child.signalCode===null){const exited=once(child,'exit');child.kill('SIGKILL');await exited;}}
async function openWorker(root){
  const child=fork(join(dirname(fileURLToPath(import.meta.url)),'mission-03-worker.mjs'),[root],{stdio:['pipe','pipe','pipe','ipc']});child.stderr.on('data',()=>{});
  try {await new Promise((resolve,reject)=>{const timer=setTimeout(()=>{cleanup();reject(Error('WORKER_TIMEOUT'));},15000);const msg=m=>{if(m.phase==='ready'){cleanup();resolve();}};const fail=()=>{cleanup();reject(Error('WORKER_FAILED'));};function cleanup(){clearTimeout(timer);child.off('message',msg);child.off('exit',fail);}child.on('message',msg);child.on('exit',fail);});}
  catch(e){await kill(child);throw e;}
  return {child,call(op,args){const callId=randomUUID();return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{cleanup();reject(Error('WORKER_TIMEOUT'));},20000);const msg=m=>{if(m.id===callId){cleanup();m.error?reject(Error(m.error)):resolve(m.value);}};const fail=()=>{cleanup();reject(Error('WORKER_FAILED'));};function cleanup(){clearTimeout(timer);child.off('message',msg);child.off('exit',fail);}child.on('message',msg);child.on('exit',fail);child.send({op,...args,callId});});}};
}
