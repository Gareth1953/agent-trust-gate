// Local synthetic buyer walkthrough. Real loopback mTLS; software authenticator.
import assert from 'node:assert/strict';
import { mkdtempSync,rmSync,mkdirSync,readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createDelegatedCustodyFixture } from './delegated-custody-fixture.mjs';
import { custodyTlsFixture } from './custody-tls-fixture.mjs';
import { delegatedTlsClient } from './delegated-custody-tls-fixture.mjs';
import { startSyntheticBroker } from './openshell-broker.mjs';
import { brokerRequest } from './openshell-broker-client.mjs';
const root=mkdtempSync(join(tmpdir(),'atg-combined-demo-'));let writer,broker;
const report={schema:'atg.delegated-custody-demo.synthetic.v1',syntheticOnly:true,productionReady:false,
  actualOpenShell:false,liveHumanCeremony:false,authenticator:'SOFTWARE_TEST_FIXTURE',network:'REAL_LOOPBACK_MTLS',cases:[]};
try{
  const f=createDelegatedCustodyFixture(join(root,'fixture'));writer=f.open();
  const tlsRoot=join(root,'tls');mkdirSync(tlsRoot);const tls=custodyTlsFixture(tlsRoot);
  const a=delegatedTlsClient(tlsRoot,tls,f.keys['agent-A'],'agent-a'),b=delegatedTlsClient(tlsRoot,tls,f.keys['agent-B'],'agent-b');
  broker=await startSyntheticBroker({writer,ca:readFileSync(tls.caPath),cert:readFileSync(tls.server.certPath),key:readFileSync(tls.server.keyPath),clientFingerprint:b.fingerprint,
    delegatedClients:{[a.fingerprint]:'agent-A',[b.fingerprint]:'agent-B'}});
  const c=leaf=>({host:'127.0.0.1',port:broker.port,caPath:tls.caPath,certPath:leaf.certPath,keyPath:leaf.keyPath,serverFingerprint:tls.server.fingerprint});
  const body=r=>({grant:r.grant,payload:r.grant.proposedAction.canonicalArguments});
  const check=async(name,r,expected,leaf=b,path='/v1/synthetic-record/commit')=>{
    const out=await brokerRequest(c(leaf),body(r),{path});assert.equal(out.outcome,expected,name);
    report.cases.push({name,outcome:out.outcome,reason:out.reason,automaticRetryPermitted:out.automaticRetryPermitted});return out;
  };
  const first=f.request();await check('issuer and delegated signatures alone do not replace passkey approval',first,'REJECTED');
  f.approve(writer,first,1);
  await check('wrong authenticated leaf cannot impersonate the sub-agent',first,'REJECTED',a);
  const altered=structuredClone(first);altered.grant.delegatedRequest.action.amountMinor=1;
  await check('changed delegated exact action refused',altered,'REJECTED');
  await check('approved sub-agent commits GBP3000 once',first,'EXECUTED');
  await check('replay refused',first,'REJECTED');
  const over=f.request({leaf:'agent-A',amount:250000,version:2});f.approve(writer,over,2);
  const refused=await check('new mandate and different agent cannot exceed GBP5000 root allowance',over,'REJECTED',a);
  assert.equal(refused.reason,'SHARED_ROOT_OR_MANDATE_BUDGET_EXCEEDED');
  const second=f.request({leaf:'agent-A',amount:200000,version:2});f.approve(writer,second,3);
  await check('parent agent uses the remaining GBP2000',second,'EXECUTED',a);
  await check('historical lookup recovers result without another effect',first,'EXECUTED',b,'/v1/synthetic-record/lookup');
  const evidence=writer.recordDelegatedOutcomeEvidence(first.grant.issuance.gatePass.gatePassId,f.outcomeEvidence(first));assert.equal(evidence.outcome,'EXECUTED');
  report.separateSignedOutcome={outcome:evidence.outcome,independentExternalObservation:false};
  const db=new DatabaseSync(f.path,{readOnly:true});try{
    report.account={ceilingMinor:500000,committedMinor:db.prepare('SELECT committed FROM delegated_account').get().committed,currency:'GBP'};
    report.destinationVersion=db.prepare('SELECT version FROM resource').get().version;
    report.approvalAuditCount=db.prepare('SELECT count(*) AS n FROM approval_audit').get().n;
  }finally{db.close();}
  assert.equal(report.account.committedMinor,500000);assert.equal(report.destinationVersion,3);assert.equal(report.approvalAuditCount,2);
  report.status='PASS_SCOPED';console.log(JSON.stringify(report,null,2));
}finally{await broker?.close();writer?.close();rmSync(root,{recursive:true,force:true});}
