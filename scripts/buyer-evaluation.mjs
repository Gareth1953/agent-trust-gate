#!/usr/bin/env node
// Explicit offline synthetic evaluation. No network, credentials or payment APIs.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, cpSync, readFileSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';
import { once } from 'node:events';
import { randomUUID, createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { createMission03Fixture } from './mission-03-fixture.mjs';
import { SyntheticDestinationProcess } from '../dist/src/destination-process-client.js';
import { SeparateDestinationAuthority } from '../dist/src/separate-destination-authority.js';
import { createSyntheticPluginRequest, AtgStandalonePlugin } from '../dist/src/standalone-plugin.js';
import { createCanonicalPayloadHash as digest } from '../dist/src/local-signed-proof.js';

const args=process.argv.slice(2);
if(args.length===0 || args[0]==='--help') {
  console.log('ATG buyer evaluation — local synthetic, Node 24+\nUse: node scripts/buyer-evaluation.mjs --state NEW_ABSOLUTE_DIRECTORY\nRetains synthetic private state locally. Share only results.json and report.md after review.\nExpected counterexamples are reported as security FAIL, never as production passes. No live execution, reset, automatic retry or external service.');
} else {
  if(args.length!==2 || args[0]!=='--state' || !isAbsolute(args[1])) throw Error('NEW_ABSOLUTE_STATE_REQUIRED');
  await runBuyerEvaluation(args[1]);
}

export async function runBuyerEvaluation(root) {
  mkdirSync(root,{mode:0o700}); // Existing roots are refused, including retained failures.
  const started=Date.now(), controls=[], counterexamples=[];
  const close=async f=>{
    f.authority.close(); const exited=once(f.client.child,'exit');
    await f.client.close(); await exited;
  };
  const start=async directory=>{
    const trust=JSON.parse(readFileSync(join(directory,'host-trust.json'),'utf8'));
    const {client}=await SyntheticDestinationProcess.start(join(directory,'destination-owned'),false,trust);
    return {root:directory,trust,client,authorityDirectory:join(directory,'atg-authority'),destinationDirectory:join(directory,'destination-owned'),
      authority:new SeparateDestinationAuthority({stateDirectory:join(directory,'atg-authority'),destination:client,trust})};
  };
  const prepare=async f=>{
    const request=createSyntheticPluginRequest('enforced'),approval=await f.authority.approve(request);
    assert.ok(approval.approvalId);const claim=await f.authority.claim(approval.approvalId,request);assert.ok(claim);
    return {request,id:approval.approvalId,claim};
  };
  async function scenario(id,fn) {
    const f=await createMission03Fixture(join(root,id));
    try { const observed=await fn(f); controls.push({id,securityResult:'PASS_WITHIN_SYNTHETIC_BOUNDARY',observed}); }
    finally { await close(f); }
  }
  try {
    await scenario('exact-action-and-reuse',async f=>{
      const a=await prepare(f),first=await f.authority.submit(a.claim),again=await f.authority.submit(a.claim);
      assert.equal(first.outcome,'EXECUTED');assert.equal(again.outcome,'REJECTED');
      return {first:first.outcome,reuse:again.outcome,orderVersion:(await f.client.request({op:'state'})).orderVersion};
    });
    await scenario('changed-request',async f=>{
      const request=createSyntheticPluginRequest('enforced'),a=await f.authority.approve(request);assert.ok(a.approvalId);
      const changed=structuredClone(request);changed.proposedAction.supplierId='unapproved-supplier';
      assert.equal(await f.authority.claim(a.approvalId,changed),null);
      assert.equal((await f.client.request({op:'state'})).orderVersion,1);
      return {changedSupplier:'REFUSED',destinationOrderVersion:1};
    });
    await scenario('direct-unapproved-command',async f=>{
      await assert.rejects(f.client.request({op:'register',approval:{},token:randomUUID()}),/APPROVAL_INVALID/);
      assert.equal((await f.client.request({op:'state'})).orderVersion,1);return {registration:'REFUSED',destinationOrderVersion:1};
    });
    for(const control of ['revoke','emergencyStop']) await scenario(control,async f=>{
      const a=await prepare(f),stopped=await f.authority[control](...(control==='revoke'?[a.id]:[]));
      assert.notEqual(stopped.outcome,'UNKNOWN');const attempted=await f.authority.submit(a.claim);assert.equal(attempted.outcome,'REJECTED');
      assert.equal((await f.client.request({op:'state'})).orderVersion,1);return {afterControl:attempted.outcome,destinationOrderVersion:1};
    });
    const expiryRoot=join(root,'expired-authority');mkdirSync(expiryRoot,{mode:0o700});
    const plugin=new AtgStandalonePlugin({statePath:join(expiryRoot,'state.json')});
    const request=createSyntheticPluginRequest('enforced'),a=await plugin.evaluate(request);assert.ok(a.decision.gatePass);
    const expired=await plugin.executeSynthetic(a.evaluationId,request,{executedAt:new Date(Date.parse(a.decision.gatePass.action.expiresAt)+60000).toISOString()});
    assert.equal(expired.outcome,'REJECTED');assert.equal(expired.adapterReached,false);
    controls.push({id:'expired-authority',securityResult:'PASS_WITHIN_SYNTHETIC_BOUNDARY',observed:{outcome:expired.outcome,adapterReached:false}});

    // Actual same-user SQL rewrite with recomputed unkeyed checksum. No GatePass.
    const editRoot=join(root,'same-user-database-edit');let edit=await createMission03Fixture(editRoot);await close(edit);
    const db=new DatabaseSync(join(editRoot,'destination-owned','destination.sqlite'));
    const row=db.prepare('SELECT payload FROM snapshot WHERE id=1').get(),state=JSON.parse(row.payload);
    state.state.orderVersion=777;db.prepare('UPDATE snapshot SET payload=?,digest=? WHERE id=1').run(JSON.stringify(state),digest(state));db.close();
    edit=await start(editRoot);
    try { assert.equal((await edit.client.request({op:'state'})).orderVersion,777);
      counterexamples.push({id:'same-user-database-edit',securityResult:'FAIL',attackSucceeded:true,observed:'Destination accepted locally rewritten state with recomputed checksum; no approval used.'});
    } finally {await close(edit);}

    // Clone BOTH roles and trust before consumption, then submit the SAME authority twice.
    const originalRoot=join(root,'coherent-clone-original');let original=await createMission03Fixture(originalRoot);
    const approved=await prepare(original);await close(original);
    const cloneRoot=join(root,'coherent-clone-copy');cpSync(originalRoot,cloneRoot,{recursive:true,errorOnExist:true,force:false});
    original=await start(originalRoot);let first;
    try {first=await original.authority.submit(approved.claim);assert.equal(first.outcome,'EXECUTED');} finally {await close(original);}
    const cloned=await start(cloneRoot);
    try {const second=await cloned.authority.submit(approved.claim);assert.equal(second.outcome,'EXECUTED');
      counterexamples.push({id:'coherent-all-role-clone-replay',securityResult:'FAIL',attackSucceeded:true,observed:{original:first.outcome,clone:second.outcome,sameApprovalDigest:digest(approved.claim.approvalId)}});
    } finally {await close(cloned);}

    const files=['src/destination-ipc-protocol.ts','src/destination-process-client.ts','scripts/destination-process.mjs','scripts/buyer-evaluation.mjs'];
    const result={schema:'atg.buyer-evaluation.v1',completedAt:new Date().toISOString(),runtime:process.version,platform:process.platform,
      elapsedMs:Date.now()-started,execution:'LOCAL_SYNTHETIC_ONLY',readiness:'PRODUCTION_NO_GO',independentReview:'NOT_PERFORMED',
      controls,counterexamples,blocked:['Independent OS-principal/key/state custody','Externally administered anti-rollback witness','Real partner sandbox integration','Windows Stage 2B/2C evidence','Independent security assessment','Measured buyer usefulness'],
      sourceHashes:Object.fromEntries(files.map(file=>[file,createHash('sha256').update(readFileSync(resolve(file))).digest('hex')])),
      limits:'Exit 0 means the harness reproduced its expected observations, including security FAIL counterexamples. It is not approval or security certification. Private synthetic keys/state stay in this run directory; do not share them.'};
    writeFileSync(join(root,'results.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx',mode:0o600});
    writeFileSync(join(root,'report.md'),`# ATG buyer evaluation\n\n**Production NO-GO.** Local synthetic execution only. No independent review or real partner integration.\n\n${controls.map(c=>`- ${c.id}: ${c.securityResult}`).join('\n')}\n\n${counterexamples.map(c=>`- ${c.id}: SECURITY FAIL — attack succeeded`).join('\n')}\n\nBoth same-user state editing and coherent cloning remain successful attacks. Signatures and local checksums do not establish independent custody.\n\nElapsed ${result.elapsedMs} ms on ${result.runtime}, ${result.platform}; this is a functional run, not a latency benchmark.\n`,{flag:'wx',mode:0o600});
    console.log(JSON.stringify({readiness:result.readiness,controls:controls.length,successfulAttacks:counterexamples.length,report:join(root,'report.md')}));
    return result;
  } catch(error) {
    writeFileSync(join(root,'incomplete.json'),JSON.stringify({completed:false,readiness:'PRODUCTION_NO_GO',controls,counterexamples,error:error instanceof Error?error.message:'Unknown failure'},null,2)+'\n',{flag:'wx',mode:0o600});
    throw error;
  }
}
