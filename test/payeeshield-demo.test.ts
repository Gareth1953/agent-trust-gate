import { test } from 'node:test';
import assert from 'node:assert/strict';
import { request as httpRequest } from 'node:http';
import { PayeeShieldDemo, PAYEESHIELD_DEFAULT_REQUEST as base, validatePayeeShieldRequest } from '../src/payeeshield-demo.js';
import { SUPPLIER_BANK_CHANGE_SCENARIO_IDS } from '../src/supplier-bank-change-model.js';
import { createPayeeShieldDemoServer } from '../src/payeeshield-demo-server.js';

test('valid fixture issues signed authority and commits once', async () => {
 const d = new PayeeShieldDemo(), a=d.approve(base); assert.equal(a.outcome,'GATEPASS_ISSUED'); assert.ok(a.gatePass); assert.ok(a.approvalId);
 const r=await d.execute(a.approvalId,base); assert.equal(r.outcome,'EXECUTED'); assert.equal(d.snapshot().state.accountEnding,'7319');
 assert.equal((await d.execute(a.approvalId,base)).outcome,'REJECTED'); assert.equal(d.snapshot().state.version,2);
});
for(const scenarioId of SUPPLIER_BANK_CHANGE_SCENARIO_IDS.filter(x=>x!=='valid_exact_change')) test('refuses fixture: '+scenarioId,()=>{
 const d=new PayeeShieldDemo(),r=d.approve({...base,scenarioId}); assert.equal(r.executionAvailable,false); assert.equal(r.approvalId,null); assert.equal(d.snapshot().record,null);
});
for(const [amount,outcome] of [[1,'GATEPASS_ISSUED'],[1000000,'GATEPASS_ISSUED'],[1000001,'REVIEW'],[4000000,'REVIEW'],[4000001,'BLOCK']] as const) test('amount boundary '+amount,()=>{
 const r=new PayeeShieldDemo().approve({...base,amountMinorUnits:amount}); assert.equal(r.outcome,outcome); assert.equal(r.executionAvailable,outcome==='GATEPASS_ISSUED');
});
test('strict request schema rejects real details, malformed and non-positive amounts',()=>{
 for(const v of [null,[],{}, {...base,accountNumber:'12345678'}, {...base,amountMinorUnits:0}, {...base,amountMinorUnits:-1}, {...base,amountMinorUnits:1.5}, {...base,amountMinorUnits:NaN}, {...base,amountMinorUnits:10000001}, {...base,scenarioId:'../../secret'}, {...base,supplierReference:'Real Company'}, {...base,proposedAccountEnding:'12345678'}]) assert.throws(()=>validatePayeeShieldRequest(v));
});
test('changed supplier or account cannot acquire fixture approval',()=>{
 for(const edits of [{supplierReference:'SUP-10483'}, {proposedAccountEnding:'7320'}]) assert.equal(new PayeeShieldDemo().approve({...base,...edits}).executionAvailable,false);
});
test('every changed request field refuses execution',async()=>{
 for(const edits of [{supplierReference:'SUP-10483'}, {proposedAccountEnding:'7320'}, {amountMinorUnits:900000}, {scenarioId:'changed_supplier'}]) { const d=new PayeeShieldDemo(),a=d.approve(base); assert.equal((await d.execute(a.approvalId!,{...base,...edits})).reason,'EXACT_REQUEST_CHANGED'); assert.equal(d.snapshot().record,null); }
});
test('state version edit refuses previously issued authority',async()=>{const d=new PayeeShieldDemo(),a=d.approve(base);d.simulateStateEdit();assert.equal((await d.execute(a.approvalId!,base)).reason,'BUSINESS_STATE_CHANGED');assert.equal(d.snapshot().record,null);});
test('revocation and expiry prevent writes',async()=>{for(const fault of ['revoke','expired']) {const d=new PayeeShieldDemo(),a=d.approve(base);if(fault==='revoke')d.revoke(a.approvalId!);assert.equal((await d.execute(a.approvalId!,base,fault==='expired'?'expired':'none')).outcome,'REJECTED');assert.equal(d.snapshot().record,null);}});
test('two simultaneous calls and two approvals commit only once',async()=>{const d=new PayeeShieldDemo(),a=d.approve(base),b=d.approve(base);const results=await Promise.all([d.execute(a.approvalId!,base),d.execute(a.approvalId!,base),d.execute(b.approvalId!,base)]);assert.equal(results.filter(r=>r.outcome==='EXECUTED').length,1);assert.equal(d.snapshot().state.version,2);});
test('returned mutable values cannot alter signed/private approval',async()=>{const d=new PayeeShieldDemo(),a=d.approve(base);(a.gatePass!.action.canonicalArguments as any).request.amountMinorUnits=1;const snap=d.snapshot();snap.state.version=99;assert.equal((await d.execute(a.approvalId!,base)).outcome,'EXECUTED');});
test('lost acknowledgement retains UNKNOWN, disallows retry and uses labelled local reconciliation',async()=>{const d=new PayeeShieldDemo(),a=d.approve(base);const r=await d.execute(a.approvalId!,base,'lost_ack');assert.equal(r.outcome,'UNKNOWN');assert.equal(r.automaticRetryPermitted,false);assert.equal((await d.execute(a.approvalId!,base)).outcome,'REJECTED');assert.equal(d.approve(base).executionAvailable,false);const reconciled=d.reconcile(a.approvalId!);assert.equal(reconciled.outcome,'EXECUTED');assert.equal(reconciled.independentDestinationEvidence,false);assert.equal(d.snapshot().state.version,2);});
test('unknown handles never authorise or reconcile',async()=>{const d=new PayeeShieldDemo();assert.equal((await d.execute('missing',base)).outcome,'REJECTED');assert.equal(d.reconcile('missing').outcome,'UNKNOWN');});
test('restart is explicitly new volatile demo, not recovery',()=>{const d=new PayeeShieldDemo();assert.equal(d.snapshot().durable,false);assert.equal(new PayeeShieldDemo().snapshot().record,null);});
test('HTTP loopback, CSRF, strict bodies and static allowlist',async()=>{
 const server=createPayeeShieldDemoServer();await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
 const address=server.address();assert.ok(address&&typeof address==='object');const url='http://127.0.0.1:'+address.port;
 try{
 const boot=await fetch(url+'/api/bootstrap');assert.equal(boot.status,200);const b=await boot.json() as {token:string};
 const post=(path:string,body:unknown,headers:Record<string,string>={})=>fetch(url+'/api/'+path,{method:'POST',headers:{'content-type':'application/json','x-atg-demo-token':b.token,...headers},body:JSON.stringify(body)});
 assert.equal((await post('approve',{request:base},{'x-atg-demo-token':'wrong'})).status,403);
 assert.equal((await post('approve',{request:base},{origin:'https://evil.invalid'})).status,403);
 assert.equal((await post('approve',{request:base},{'sec-fetch-site':'cross-site'})).status,403);
 assert.equal((await post('approve',{request:base},{'content-type':'text/plain'})).status,415);
 assert.equal((await post('approve',{request:base,extra:true})).status,400);
 assert.equal((await post('approve',{request:{...base,accountNumber:'123'}})).status,400);
 assert.equal((await post('approve',{request:'x'.repeat(9000)})).status,413);
 assert.equal((await fetch(url+'/src/index.ts')).status,404);
 const page=await fetch(url+'/');assert.equal(page.status,200);assert.match(page.headers.get('content-security-policy')! ,/frame-ancestors 'none'/);assert.equal(page.headers.get('cache-control'),'no-store');
 const evilHost=await new Promise<number>(resolve=>{const req=httpRequest(url+'/',{headers:{host:'evil.invalid'}},res=>{res.resume();resolve(res.statusCode!);});req.end();});assert.equal(evilHost,403);
 const approved=await (await post('approve',{request:base})).json() as {approvalId:string};assert.ok(approved.approvalId);
 const executed=await(await post('execute',{approvalId:approved.approvalId,request:base,fault:'none'})).json() as {outcome:string};assert.equal(executed.outcome,'EXECUTED');
 }finally{server.closeAllConnections();await new Promise<void>((resolve,reject)=>server.close(e=>e?reject(e):resolve()));}
});
