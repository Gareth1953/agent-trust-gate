#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
import { isAbsolute,join } from 'node:path';
import { createMission03Fixture } from './mission-03-fixture.mjs';
import { createSyntheticPluginRequest } from '../dist/src/standalone-plugin.js';
import { verifyDestinationEvidence } from '../dist/src/destination-evidence.js';
import { PURCHASING_DEMO_EXECUTION_TIME as AT } from '../dist/src/local-purchasing-lifecycle-demo.js';
if(process.argv.length!==4 || process.argv[2]!=='--state') throw Error('Use --state NEW_ABSOLUTE_DIRECTORY (parent must exist)');
const root=process.argv[3];
if(!isAbsolute(root)) throw Error('ABSOLUTE_DIRECTORY_REQUIRED');
const f=await createMission03Fixture(root);
try {
  const request=createSyntheticPluginRequest('enforced');
  const a=await f.authority.approve(request), claim=await f.authority.claim(a.approvalId,request);
  // Deliberately bypass acknowledgement: destination commits, ATG retains reserved exposure.
  const pending=f.authority.beginLookup(a.approvalId,false);
  await f.client.request({op:'submit',...pending,token:claim.token});
  const recovery=f.authority.beginLookup(a.approvalId,true);
  const receipt=await f.client.request({op:'fence_lookup',...recovery});
  for(const [name,value] of Object.entries({approval:recovery.approval,lookup:recovery.lookup,evidence:receipt})) writeFileSync(join(root,name+'.json'),JSON.stringify(value,null,2)+'\n',{flag:'wx'});
  const verified=verifyDestinationEvidence(receipt,recovery.approval,f.trust,recovery.lookup,AT);
  const reconciled=f.authority.acceptEvidence(a.approvalId,receipt);
  const replay=f.authority.acceptEvidence(a.approvalId,receipt);
  const results={baseCommit:'0dcd8dfcb0583c0d242517764390acde9b244920',runtime:process.version,testClock:AT,verified,reconciled,replay,
    passed:verified.verified&&reconciled.outcome==='EXECUTED'&&replay.outcome==='UNKNOWN',
    boundary:'Separate processes and signing roles on one machine; synthetic keys/time, same-host records. No independent external capture, hardware isolation, partner attestation, or protection from the host administrator.',
    authority:f.authority.snapshot(),stateRetainedAt:root};
  writeFileSync(join(root,'results.json'),JSON.stringify(results,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({passed:results.passed,verified,reconciled,replay,stateRetainedAt:root}));
  if(!results.passed)process.exitCode=1;
} finally {f.authority.close();await f.client.close();}
