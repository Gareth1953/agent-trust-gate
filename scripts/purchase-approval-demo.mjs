// Reproducible buyer walkthrough. SOFTWARE FIXTURES, not a live human ceremony.
import assert from 'node:assert/strict';
import { mkdtempSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createCustodyFixture } from './custody-fixture.mjs';
import { createPasskeyApprovalFixture } from './passkey-approval-fixture.mjs';
import { canonicalWire } from './openshell-broker-client.mjs';
import { handleBrokerRequest,BROKER_COMMIT_PATH,BROKER_LOOKUP_PATH } from '../dist/src/openshell-transaction-broker.js';
const root=mkdtempSync(join(tmpdir(),'atg-purchase-walkthrough-'));let writer;
try{
 const key=createPasskeyApprovalFixture(),f=createCustodyFixture(join(root,'fixture'),key.trust);writer=f.open();
 const grant=f.grant(),payload=structuredClone(grant.proposedAction.canonicalArguments),prepared=writer.preparePurchaseApproval(grant),results=[];
 const call=(g,p=payload,path=BROKER_COMMIT_PATH)=>handleBrokerRequest(writer,'POST',path,Buffer.from(canonicalWire({grant:g,payload:p})));
 const step=(name,r,expected)=>{assert.equal(r.outcome,expected);results.push({name,outcome:r.outcome,reason:r.reason});};
 step('1. Valid issuer authority without passkey approval',call(grant),'REJECTED');
 const noVerification={...grant,humanApproval:key.assertion(prepared,{flags:1})};
 step('2. Signature without user verification',call(noVerification),'REJECTED');
 const approved={...grant,humanApproval:key.assertion(prepared)};
 step('3. Changed payee after approval',call(approved,{...payload,payeeReference:'fixture-bank-B'}),'REJECTED');
 step('4. Changed amount after approval',call(approved,{...payload,amountMinorUnits:1}),'REJECTED');
 step('5. Exact approved synthetic purchase',call(approved),'EXECUTED');
 step('6. Reused authority and approval',call(approved),'REJECTED');
 step('7. Reconcile the recorded exact result',call(approved,payload,BROKER_LOOKUP_PATH),'EXECUTED');
 console.log(JSON.stringify({schema:'atg.purchase-approval.walkthrough.synthetic.v1',status:'PASS_SCOPED',syntheticOnly:true,productionReady:false,liveHumanCeremony:false,authenticator:'SOFTWARE_TEST_FIXTURE',actualOpenShellInThisCommand:false,summary:prepared.summary,results,
 limits:['No real payment or live human approval','Enrollment and trusted UI/session are external','No whole-host/admin rollback protection','Actual OpenShell path evidence is a separate CI run']},null,2));
}finally{writer?.close();rmSync(root,{recursive:true,force:true});}
