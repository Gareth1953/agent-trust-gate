import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from '../acs-adapter/fixture.mjs';
import {createInterceptor,eventFor,cedarDecision,POLICY} from './adapter.mjs';

function setup(t,options={}){const f=fixture();t.after(()=>f.close());return {...f,event:eventFor(f.grant),
  intercept:createInterceptor({grant:f.grant,context:f.context,principal:'synthetic-agent',...options})};}
const denied=r=>Boolean(r.mcp.transformedGatewayResponse?.body.error);
function rewrite(f,change){change(f.event.mcp.gatewayRequest.body);f.event.mcp.rawGatewayRequest.body=JSON.stringify(f.event.mcp.gatewayRequest.body);}
test('real Cedar permit plus ATG preflight leaves record unchanged until protected destination',t=>{
  const f=setup(t),r=f.intercept(f.event);
  assert.equal(denied(r),false);assert.deepEqual(r.mcp.transformedGatewayRequest.body,f.event.mcp.gatewayRequest.body);
  assert.equal(f.witness.lookup(f.grant).outcome,'NOT_RECORDED');
  assert.equal(f.witness.execute(f.grant).outcome,'EXECUTED');
  assert.equal(denied(f.intercept(f.event)),true);assert.equal(f.witness.execute(f.grant).outcome,'REJECTED');
});
test('Cedar alone permits a bounded changed amount; ATG additionally refuses the changed signed action',t=>{
  const f=setup(t);rewrite(f,b=>b.params.arguments.amountMinorUnits=1);
  assert.equal(cedarDecision(f.event.mcp.gatewayRequest.body.params.arguments,'synthetic-agent').response.decision,'allow');
  assert.equal(denied(f.intercept(f.event)),true);
  assert.equal(f.witness.lookup(f.grant).outcome,'NOT_RECORDED');
});
for(const [field,value] of [['amountMinorUnits',500001],['currency','USD'],['payeeReference','fixture-bank-B']])test('Cedar denies policy breach: '+field,t=>{
  const f=setup(t);rewrite(f,b=>b.params.arguments[field]=value);
  assert.equal(cedarDecision(f.event.mcp.gatewayRequest.body.params.arguments,'synthetic-agent').response.decision,'deny');
  assert.equal(denied(f.intercept(f.event)),true);
});
test('native Cedar forbid wins over permit',t=>{
  const f=setup(t,{policy:POLICY+'\nforbid(principal,action,resource);'});
  assert.equal(denied(f.intercept(f.event)),true);
});
for(const policy of ['', 'invalid policy'])test('missing/invalid native policy cannot permit',t=>{
  const f=setup(t,{policy});assert.equal(denied(f.intercept(f.event)),true);
});
for(const kind of ['version','method','tool','raw','http','identity','state'])test('unsupported or changed '+kind+' is refused',t=>{
  const f=setup(t);
  if(kind==='version')f.event.interceptorInputVersion='2.0';
  if(kind==='method')rewrite(f,b=>b.method='tools/list');
  if(kind==='tool')rewrite(f,b=>b.params.name='other');
  if(kind==='raw')f.event.mcp.rawGatewayRequest.body='other';
  if(kind==='http')f.event.http={};
  if(kind==='identity')f.context.constraints.subjectAgentIdentity='other';
  if(kind==='state')rewrite(f,b=>b.params.arguments.expectedVersion=2);
  assert.equal(denied(f.intercept(f.event)),true);
});
test('unavailable policy engine refuses without destination effects',t=>{
  const f=setup(t,{evaluate(){throw Error('unavailable');}});
  assert.equal(denied(f.intercept(f.event)),true);assert.equal(f.witness.lookup(f.grant).outcome,'NOT_RECORDED');
});
test('expired authority refused even though native policy permits',t=>{
  const f=setup(t);f.context.trustedClock.now=()=>new Date('2026-11-11T00:00:00Z');
  assert.equal(denied(f.intercept(f.event)),true);
});
test('response and HTTP target formats are unsupported, not silently admitted',t=>{
  const f=setup(t);f.event.mcp.gatewayResponse={statusCode:200};
  assert.equal(denied(f.intercept(f.event)),true);
});
test('a forged signed grant is refused',t=>{
  const f=setup(t);f.grant.issuance.gatePass.signature.signature='forged';
  assert.equal(denied(f.intercept(f.event)),true);
});
test('getter-bearing, cyclic and oversized input cannot execute or invoke getters',t=>{
  const f=setup(t);let reads=0;const getter={};Object.defineProperty(getter,'mcp',{enumerable:true,get(){reads++;return {};}});
  const cycle={};cycle.self=cycle;
  for(const input of [null,[],getter,cycle,{large:'x'.repeat(65537)}])assert.equal(denied(f.intercept(input)),true);
  assert.equal(reads,0);
});
