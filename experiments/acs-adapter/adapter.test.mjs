import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fixture } from './fixture.mjs';
import { evaluateAcsToolHook as evaluate } from './adapter.mjs';
import { InMemoryNonceStore } from '../../dist/src/exact-action-gatepass.js';

function setup(t) { const f=fixture(); t.after(()=>f.close()); return f; }
test('ACS correlation survives distinct transport and request IDs; allow is not execution',t=>{
  const f=setup(t),r=evaluate(f.request,f.grant,f.context);
  assert.equal(r.result.decision,'allow'); assert.equal(r.id,'transport-001');
  assert.equal(r.result.request_id,f.request.params.request_id);
  assert.equal(r.result.policy_data.atg.executed,false);
  assert.equal(f.witness.lookup(f.grant).outcome,'NOT_RECORDED');
  assert.equal(f.witness.execute(f.grant).outcome,'EXECUTED');
  assert.equal(f.witness.execute(f.grant).outcome,'REJECTED');
});
for (const field of ['amountMinorUnits','payeeReference','expectedVersion','currency','value']) {
  test('ACS post-approval substitution denied: '+field,t=>{
    const f=setup(t); f.request.params.payload.arguments[field].value='changed';
    assert.equal(evaluate(f.request,f.grant,f.context).result.decision,'deny');
    assert.equal(f.witness.lookup(f.grant).outcome,'NOT_RECORDED');
  });
}
for (const field of ['agent_id','session_id']) test('claimed '+field+' must match approved binding',t=>{
  const f=setup(t); f.request.params.metadata[field]='00000000-0000-0000-0000-000000000000';
  assert.equal(evaluate(f.request,f.grant,f.context).result.decision,'deny');
});
test('forged grant signed material cannot obtain admission',t=>{
  const f=setup(t); f.grant.issuance.gatePass.signature.signature='invalid';
  assert.equal(evaluate(f.request,f.grant,f.context).result.decision,'deny');
});
test('hook replay denied by retained preflight nonce store',t=>{
  const f=setup(t); assert.equal(evaluate(f.request,f.grant,f.context).result.decision,'allow');
  f.request.id='another-transport-id';
  assert.equal(evaluate(f.request,f.grant,f.context).result.decision,'deny');
});
test('host restart can reset preflight; retained destination still rejects second execution',t=>{
  const f=setup(t); assert.equal(evaluate(f.request,f.grant,f.context).result.decision,'allow');
  assert.equal(f.witness.execute(f.grant).outcome,'EXECUTED');
  f.context.nonceStore=new InMemoryNonceStore();
  f.context.nonceStore.registerUnused(f.grant.issuance.gatePass);
  assert.equal(evaluate(f.request,f.grant,f.context).result.decision,'allow');
  // A reset hook can readmit the call, but the retained destination refuses it.
  assert.equal(f.witness.execute(f.grant).outcome,'REJECTED');
});
for (const failure of ['unavailable','expired','throwing-clock']) test('fail closed: '+failure,t=>{
  const f=setup(t);
  if(failure==='unavailable')f.context.available=false;
  if(failure==='expired')f.context.trustedClock.now=()=>new Date('2026-11-11T00:00:00.000Z');
  if(failure==='throwing-clock')f.context.trustedClock.now=()=>{throw Error('offline');};
  assert.equal(evaluate(f.request,f.grant,f.context).result.decision,'deny');
  assert.equal(f.witness.lookup(f.grant).outcome,'NOT_RECORDED');
});
for(const mutation of [r=>r.method='steps/agentResponse',r=>r.params.acs_version='0.2.0',
  r=>r.params.payload.raw_command='curl bypass',r=>r.params.metadata.user_context={roles:['admin']},
  r=>r.params.payload.arguments.value.provenance={trusted:true},r=>r.params.timestamp='yesterday',
  r=>r.params.payload.tool.name='other',r=>r.params.payload.operation='other']) {
  test('unsupported input cannot widen authority',t=>{const f=setup(t);mutation(f.request);
    assert.equal(evaluate(f.request,f.grant,f.context).result.decision,'deny');});
}
test('malformed/getter/cyclic/oversized inputs return JSON-RPC errors without touching getters',t=>{
  const f=setup(t);let reads=0;const getter={};Object.defineProperty(getter,'params',{enumerable:true,get(){reads++;return {};}});
  const cycle={};cycle.self=cycle;
  for(const input of [null,[],{},getter,cycle,{huge:'x'.repeat(65537)}]){
    const r=evaluate(input,f.grant,f.context);assert.equal(r.error.code,-32600);assert.equal(r.id,null);
  }assert.equal(reads,0);
});
test('passkey/delegated grant shapes are refused instead of implying additional verification',t=>{
  const f=setup(t);f.grant.humanApproval={};
  assert.equal(evaluate(f.request,f.grant,f.context).result.decision,'deny');
});
test('changed details after allow remain blocked at the actual synthetic destination',t=>{
  const f=setup(t);assert.equal(evaluate(f.request,f.grant,f.context).result.decision,'allow');
  f.grant.proposedAction.canonicalArguments.amountMinorUnits=1;
  assert.equal(f.witness.execute(f.grant).outcome,'REJECTED');
});
