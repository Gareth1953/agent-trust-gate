import assert from 'node:assert/strict';
import {test} from 'node:test';
import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {SyntheticConsumptionAnchor} from '../anti-rollback/consumption-anchor.mjs';
import {SyntheticAnchoredDestination} from './anchored-destination.mjs';

const domainId = 'synthetic-destination-1';
const actionId = 'signed-action-1';
const actionDigest = 'sha256:' + 'a'.repeat(64);
const grant = Object.freeze({issuance:{gatePass:{gatePassId:actionId,action:{actionDigest}}}});
function setup(t) {
  const dir=mkdtempSync(join(tmpdir(),'atg-mandatory-controller-'));
  const path=join(dir,'retained.sqlite');
  SyntheticConsumptionAnchor.create(path,domainId);
  const anchor=new SyntheticConsumptionAnchor(path,domainId);
  let effects=0;
  const writer={preflightForAnchor:g=>({verified:true,actionId:g.issuance.gatePass.gatePassId,actionDigest:g.issuance.gatePass.action.actionDigest}),execute:()=>{effects++;return {outcome:'EXECUTED'};}};
  t.after(()=>{anchor.close();rmSync(dir,{recursive:true,force:true});});
  return {anchor,writer,get effects(){return effects;},
    destination:()=>new SyntheticAnchoredDestination({anchor,writer,domainId})};
}
test('the scoped destination mediates both cloned callers through one retained checkpoint',t=>{
  const f=setup(t),a=f.destination(),b=f.destination();
  assert.equal(a.execute(grant,{}).outcome,'EXECUTED');
  assert.equal(b.execute(grant,{}).outcome,'REJECTED');
  assert.equal(f.effects,1);
  assert.equal(f.anchor.lookup(actionId).outcome,'HELD');
});
test('missing, malformed or changed GatePass cannot create an effect',t=>{
  const f=setup(t),d=f.destination();
  assert.equal(d.execute(null,{}).outcome,'REJECTED');
  assert.equal(d.execute({issuance:{gatePass:{gatePassId:'x',action:{actionDigest:'oops'}}}},{}).outcome,'REJECTED');
  assert.equal(f.effects,0);
  assert.equal(d.execute(grant,{}).outcome,'EXECUTED');
  const changed={issuance:{gatePass:{gatePassId:actionId,action:{actionDigest:'sha256:'+'b'.repeat(64)}}}};
  assert.equal(d.execute(changed,{}).outcome,'REJECTED');
  assert.equal(f.effects,1);
});
test('closed checkpoint and checkpoint errors fail closed without fallback',t=>{
  const f=setup(t),d=f.destination();
  f.anchor.close();
  const result=d.execute(grant,{});
  assert.equal(result.outcome,'UNKNOWN');
  assert.equal(result.automaticRetryPermitted,false);
  assert.equal(f.effects,0);
  const throwing=new SyntheticAnchoredDestination({
    anchor:{reserve(){throw Error('unreachable');}},writer:f.writer,domainId
  });
  assert.equal(throwing.execute(grant,{}).outcome,'UNKNOWN');
  assert.equal(f.effects,0);
});
test('untrusted checkpoint response alone cannot claim effect permission',()=>{
  let effects=0;
  const d=new SyntheticAnchoredDestination({
    anchor:{reserve(){return {outcome:'RESERVED',effectPermittedByAnchor:false,actionId};}},
    writer:{preflightForAnchor:()=>({verified:true,actionId,actionDigest}),execute(){effects++;return {outcome:'EXECUTED'};}},domainId
  });
  assert.equal(d.execute(grant,{}).outcome,'UNKNOWN');
  assert.equal(effects,0);
});
test('uncertain writer outcome holds permission, and retry remains blocked',t=>{
  const f=setup(t);
  const failing=new SyntheticAnchoredDestination({
    anchor:f.anchor,domainId,writer:{preflightForAnchor:()=>({verified:true,actionId,actionDigest}),execute(){throw Error('lost acknowledgement');}}
  });
  const result=failing.execute(grant,{});
  assert.equal(result.outcome,'UNKNOWN');
  assert.equal(result.automaticRetryPermitted,false);
  assert.equal(f.anchor.lookup(actionId).outcome,'HELD');
  assert.equal(f.destination().execute(grant,{}).outcome,'REJECTED');
  assert.equal(f.effects,0);
});
test('expected RED TEAM success: direct access to underlying writer STILL BYPASSES checkpoint',t=>{
  const f=setup(t);
  assert.equal(f.destination().execute(grant,{}).outcome,'EXECUTED');
  // Known successful attack retained: this wrapper does not secure the writer.
  assert.equal(f.writer.execute(grant,{}).outcome,'EXECUTED');
  assert.equal(f.effects,2);
});

test('missing or refusing writer preflight does not consume one-use authority',t=>{
  const f=setup(t);
  assert.throws(()=>new SyntheticAnchoredDestination({
    anchor:f.anchor,writer:{execute:()=>({outcome:'EXECUTED'})},domainId
  }),/CONFIGURATION_INVALID/);
  const denying=new SyntheticAnchoredDestination({
    anchor:f.anchor,writer:{preflightForAnchor:()=>({verified:false}),execute(){throw Error('must not execute');}},domainId
  });
  assert.equal(denying.execute(grant,{}).outcome,'REJECTED');
  assert.equal(f.anchor.lookup(actionId).outcome,'NOT_RECORDED');
  assert.equal(f.destination().execute(grant,{}).outcome,'EXECUTED');
});
