import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { fixture } from './fixture.mjs';
import { evaluateAcsToolHook } from './adapter.mjs';
import { executeViaAcs } from './host-client.mjs';

async function setup(t,change=x=>x) {
  const f=fixture();t.after(()=>f.close());
  const server=createServer(async(req,res)=>{
    let text='';for await(const chunk of req){text+=chunk;if(text.length>65536){res.writeHead(413).end();return;}}
    const body=JSON.parse(text),response=change(evaluateAcsToolHook(body,f.grant,f.context));
    if(response===null)return; // Deliberate timeout fixture.
    res.setHeader('content-type','application/json');res.end(typeof response==='string'?response:JSON.stringify(response));
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>{server.closeAllConnections();server.close();});
  return {...f,url:`http://127.0.0.1:${server.address().port}/`,server};
}
test('actual upstream client exchanges HTTP envelopes; synthetic destination commits once',async t=>{
  const f=await setup(t);
  assert.equal((await executeViaAcs(f.url,f.request,f.grant,f.witness)).outcome,'EXECUTED');
  assert.equal((await executeViaAcs(f.url,f.request,f.grant,f.witness)).outcome,'REJECTED');
  assert.equal(f.witness.lookup(f.grant).receipt.resourceVersion,2);
});
test('changed amount over real HTTP is refused before destination execution',async t=>{
  const f=await setup(t);f.request.params.payload.arguments.amountMinorUnits.value=1;
  assert.equal((await executeViaAcs(f.url,f.request,f.grant,f.witness)).outcome,'REJECTED');
  assert.equal(f.witness.lookup(f.grant).outcome,'NOT_RECORDED');
});
for(const [name,change] of [
  ['wrong transport id',r=>({...r,id:'wrong'})],
  ['wrong ACS correlation',r=>({...r,result:{...r.result,request_id:'wrong'}})],
  ['missing ACS correlation',r=>{delete r.result.request_id;return r;}],
  ['unknown version',r=>({...r,result:{...r.result,acs_version:'0.2.0'}})],
  ['wrong action digest',r=>{r.result.policy_data.atg.action_digest='wrong';return r;}],
  ['error plus result',r=>({...r,error:{code:-32000,message:'refused'}})],
  ['parse failure',()=>'{broken'],['timeout',()=>null],
]) test('upstream-client host fails closed: '+name,async t=>{
  const f=await setup(t,change),r=await executeViaAcs(f.url,f.request,f.grant,f.witness,100);
  assert.notEqual(r.outcome,'EXECUTED');assert.equal(r.automaticRetryPermitted,false);
  assert.equal(f.witness.lookup(f.grant).outcome,'NOT_RECORDED');
});
test('outage has no automatic retry or fallback',async t=>{
  const f=await setup(t);await new Promise(resolve=>f.server.close(resolve));
  const r=await executeViaAcs(f.url,f.request,f.grant,f.witness,100);
  assert.equal(r.outcome,'UNKNOWN');assert.equal(r.automaticRetryPermitted,false);
});
test('external endpoint is refused without opening a connection',async t=>{
  const f=fixture();t.after(()=>f.close());
  assert.equal((await executeViaAcs('https://example.com/',f.request,f.grant,f.witness)).reason,'ACS_LOCAL_ENDPOINT_REQUIRED');
});
