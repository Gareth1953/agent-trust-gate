// Runs inside the real OpenShell workload. Receives only disposable client data.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { brokerRequest } from './openshell-broker-client.mjs';

const root=process.argv[2],mode=process.argv[3]??'matrix',c=JSON.parse(readFileSync(join(root,'client.json'),'utf8'));
for(const k of ['caPath','certPath','keyPath'])c[k]=join(root,c[k]);
const body=JSON.parse(readFileSync(join(root,'body.json'),'utf8'));
const cases=[];const record=(name,observed,expected)=>{assert.equal(observed,expected,name);cases.push({name,observed,expected});};
if(mode==='outage') {
  const r=await brokerRequest(c,body);record('broker outage is UNKNOWN',r.outcome,'UNKNOWN');assert.equal(r.automaticRetryPermitted,false);
}else if(mode==='network-denied') {
  const r=await brokerRequest({...c,port:c.port+1},body);record('unlisted port cannot execute',r.outcome,'UNKNOWN');
}else {
  if(body.grant.humanApproval){
    const missing=structuredClone(body);delete missing.grant.humanApproval;
    record('missing passkey approval refused',(await brokerRequest(c,missing)).outcome,'REJECTED');
    const forged=structuredClone(body);forged.grant.humanApproval.signature='AAAA';
    record('forged passkey assertion refused',(await brokerRequest(c,forged)).outcome,'REJECTED');
  }
  for(const [field,value] of [['payeeReference','fixture-bank-B'],['amountMinorUnits',1],['currency','USD'],['tenantId','other-tenant'],['resourceId','other-resource'],['expectedVersion',2],['value','changed']]){
    const changed=structuredClone(body);changed.payload[field]=value;
    record('changed '+field,(await brokerRequest(c,changed)).outcome,'REJECTED');
  }
  record('admin route refused',(await brokerRequest(c,body,{path:'/admin'})).outcome,'REJECTED');
  const expired=JSON.parse(readFileSync(join(root,'expired.json'),'utf8'));
  record('expired authority refused',(await brokerRequest(c,expired)).outcome,'REJECTED');
  const wrong=structuredClone(body);wrong.grant.issuance.gatePass.signature.signature='A'.repeat(86)+'==';
  record('forged signature refused',(await brokerRequest(c,wrong)).outcome,'REJECTED');
  record('missing client identity',(await brokerRequest({...c,certPath:undefined,keyPath:undefined},body)).outcome,'UNKNOWN');
  record('wrong endpoint pin',(await brokerRequest({...c,serverFingerprint:'00:'.repeat(31)+'00'},body)).outcome,'UNKNOWN');
  const raced=await Promise.all([brokerRequest(c,body),brokerRequest(c,body)]);
  assert.deepEqual(raced.map(r=>r.outcome).sort(),['EXECUTED','REJECTED']);cases.push({name:'concurrent one-use',observed:raced.map(r=>r.outcome)});
  record('replay refused',(await brokerRequest(c,body)).outcome,'REJECTED');
  record('lookup finds committed synthetic effect',(await brokerRequest(c,body,{path:'/v1/synthetic-record/lookup'})).outcome,'EXECUTED');
  if(body.grant.delegatedRequest){
    const a={...c,certPath:join(root,'agent-a.crt'),keyPath:join(root,'agent-a.key')};
    record('wrong leaf certificate cannot act for sub-agent',(await brokerRequest(a,body)).outcome,'REJECTED');
    const read=name=>JSON.parse(readFileSync(join(root,name+'.json'),'utf8'));
    const over=await brokerRequest(a,read('over-budget'));record('different agent and mandate cannot overspend root budget',over.reason,'SHARED_ROOT_OR_MANDATE_BUDGET_EXCEEDED');
    record('second agent spends remaining allowance',(await brokerRequest(a,read('within-budget'))).outcome,'EXECUTED');
    record('root budget exhausted across both agents',(await brokerRequest(c,read('exhausted'))).reason,'SHARED_ROOT_OR_MANDATE_BUDGET_EXCEEDED');
  }
}
console.log(JSON.stringify({schema:'atg.openshell-agent-evidence.v1',mode,status:'PASS_SCOPED',syntheticOnly:true,productionReady:false,cases}));
