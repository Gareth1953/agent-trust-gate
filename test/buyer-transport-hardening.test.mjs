import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { createMission03Fixture } from '../scripts/mission-03-fixture.mjs';
import { DESTINATION_IPC_MAX_PENDING, snapshotDestinationCommand, snapshotDestinationReply } from '../dist/src/destination-ipc-protocol.js';

const parent=resolve('.atg-evaluation/buyer-transport'); mkdirSync(parent,{recursive:true});
async function fixture(t) {
  const f=await createMission03Fixture(join(parent,randomUUID()));
  t.after(async()=>{f.authority.close(); if(f.client.child.connected) f.client.child.kill();}); return f;
}

test('command boundary refuses absent, unknown, oversized and extra fields without invoking getters',()=>{
  for(const value of [null,[],{op:'payment'},{op:'state',callback:'arbitrary'},{op:'state',id:randomUUID()},
    {op:'configure',trust:{text:'x'.repeat(256*1024)}},{op:'register',approval:{},token:'-'.repeat(36)}]) assert.throws(()=>snapshotDestinationCommand(value));
  let reads=0;const value={};Object.defineProperty(value,'op',{enumerable:true,get(){reads++;return 'stop';}});
  assert.throws(()=>snapshotDestinationCommand(value));assert.equal(reads,0);
  const source={op:'configure',trust:{name:'original'}},copy=snapshotDestinationCommand(source);source.trust.name='changed';assert.equal(copy.trust.name,'original');
});

test('reply boundary requires one result or error and a valid correlation id',()=>{
  const id=randomUUID(); assert.deepEqual(snapshotDestinationReply({id,value:false}),{id,value:false});
  for(const value of [null,{id},{id,value:true,error:'also error'},{id:'invalid',value:true},{id,error:42},{id,value:true,extra:1}]) assert.throws(()=>snapshotDestinationReply(value));
});

test('invalid commands are refused before IPC and cannot stop the destination',async t=>{
  const f=await fixture(t),before=await f.client.request({op:'state'});
  await assert.rejects(f.client.request({op:'stop',ignored:true}),/DESTINATION_COMMAND_INVALID/);
  await assert.rejects(f.client.request({op:'configure',trust:{large:'x'.repeat(256*1024)}}),/TOO_LARGE/);
  assert.deepEqual(await f.client.request({op:'state'}),before);
});

test('malformed null wire message returns a refusal without crashing the child; client fails closed',async t=>{
  const f=await fixture(t),response=once(f.client.child,'message');
  f.client.child.send(null); const [reply]=await response;
  assert.equal(reply.id,null); assert.match(reply.error,/INVALID/);
  await assert.rejects(f.client.request({op:'state'}),/DESTINATION_UNAVAILABLE/);
  // Explicit raw read proves process liveness, not a safe authenticated boundary.
  const id=randomUUID(),raw=once(f.client.child,'message');f.client.child.send({op:'state',id});
  const [state]=await raw;assert.equal(state.id,id);assert.equal(state.value.orderVersion,1);assert.equal(f.client.child.exitCode,null);
});

test('bounded simultaneous requests refuse excess then recover capacity with correlated replies',async t=>{
  const f=await fixture(t),pending=[];
  for(let i=0;i<DESTINATION_IPC_MAX_PENDING;i++) pending.push(f.client.request({op:'state'}));
  await assert.rejects(f.client.request({op:'state'}),/DESTINATION_REQUEST_CAPACITY_REACHED/);
  const values=await Promise.all(pending);assert.equal(values.length,64);assert.ok(values.every(s=>s.orderVersion===1));
  assert.equal((await f.client.request({op:'state'})).orderVersion,1);
});
