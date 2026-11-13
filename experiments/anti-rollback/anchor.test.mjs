import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, copyFileSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { SyntheticConsumptionAnchor } from './consumption-anchor.mjs';
const domainId='synthetic-domain-1';
const digest='a'.repeat(64);
const data={domainId,actionId:'same-signed-gatepass-1',actionDigest:digest};
const fixture = t => {
  const root=mkdtempSync(join(tmpdir(),'atg-anchor-test-'));
  mkdirSync(join(root,'other-owner'),{mode:0o700});
  const path=join(root,'other-owner','anchor.sqlite');
  SyntheticConsumptionAnchor.create(path,domainId);
  t.after(()=>rmSync(root,{recursive:true,force:true}));
  return {root,path,open:()=>new SyntheticConsumptionAnchor(path,domainId)};
};
test('retained checkpoint permits only first exact-action reservation',t=>{
  const f=fixture(t),w=f.open();t.after(()=>w.close());
  const first=w.reserve(data);assert.equal(first.outcome,'RESERVED');assert.equal(first.effectPermittedByAnchor,true);
  const duplicate=w.reserve(data);assert.equal(duplicate.outcome,'REJECTED');assert.equal(duplicate.effectPermittedByAnchor,false);
  assert.equal(duplicate.reason,'ANCHOR_AUTHORITY_ALREADY_RESERVED');
  const altered=w.reserve({...data,actionDigest:'b'.repeat(64)});
  assert.equal(altered.reason,'ANCHOR_CONFLICTING_ACTION');
  assert.equal(w.lookup(data.actionId).outcome,'HELD');
});
test('ATG sha256-prefixed signed action digest is reserved without normalization',t=>{
  const f=fixture(t),w=f.open();t.after(()=>w.close());
  const prefixed={...data,actionId:'atg-gatepass-prefixed',actionDigest:'sha256:'+digest};
  assert.equal(w.reserve(prefixed).outcome,'RESERVED');
  assert.equal(w.reserve({...prefixed,actionDigest:digest}).reason,'ANCHOR_CONFLICTING_ACTION');
  assert.equal(w.lookup(prefixed.actionId).outcome,'HELD');
});
test('two restored destination copies cannot both pass one shared retained anchor',t=>{
  const f=fixture(t),w=f.open();t.after(()=>w.close());
  // Emulates separately restored local writer state. Both copied writers
  // propose the SAME signed action, but cannot restore the retained anchor.
  let copy1=0,copy2=0;
  const attempt=setter=>{const r=w.reserve(data);if(r.effectPermittedByAnchor)setter();return r;};
  assert.equal(attempt(()=>copy1++).outcome,'RESERVED');
  assert.equal(attempt(()=>copy2++).outcome,'REJECTED');
  assert.equal(copy1,1);assert.equal(copy2,0);
});
test('lost effect acknowledgement remains HELD and never authorises retry',t=>{
  const f=fixture(t),w=f.open();t.after(()=>w.close());
  assert.equal(w.reserve(data).outcome,'RESERVED');
  // Simulated crash before effect: reservation remains and retries are held.
  assert.equal(w.lookup(data.actionId).outcome,'HELD');
  assert.equal(w.reserve(data).effectPermittedByAnchor,false);
});
test('missing, unavailable and wrong-domain anchor must not allow effect',t=>{
  const f=fixture(t),w=f.open();
  assert.equal(w.reserve({...data,domainId:'another-domain'}).outcome,'REJECTED');
  assert.equal(w.reserve({domainId,actionId:'bad',actionDigest:'wrong'}).outcome,'REJECTED');
  w.close();
  assert.equal(w.reserve(data).outcome,'UNKNOWN');
  assert.equal(w.reserve(data).effectPermittedByAnchor,false);
  assert.equal(w.lookup(data.actionId).outcome,'UNKNOWN');
  assert.throws(()=>new SyntheticConsumptionAnchor(f.path,'wrong-domain'),/TRUST_MISMATCH/);
});
test('distinct Node processes atomically race one retained checkpoint',async t=>{
  const f=fixture(t);
  const worker=fileURLToPath(new URL('./anchor-worker.mjs',import.meta.url));
  const child=()=>new Promise((resolve,reject)=>{
    const p=spawn(process.execPath,[worker,f.path,domainId,data.actionId,digest],{stdio:['ignore','pipe','pipe']});
    let out='',err='';p.stdout.on('data',b=>out+=b);p.stderr.on('data',b=>err+=b);
    p.on('error',reject);p.on('close',code=>{
      if(code!==0)return reject(Error(err));try{resolve(JSON.parse(out));}catch(e){reject(e);}
    });
  });
  const result=await Promise.all([child(),child()]);
  assert.deepEqual(result.map(x=>x.outcome).sort(),['REJECTED','RESERVED']);
  const w=f.open();t.after(()=>w.close());assert.equal(w.lookup(data.actionId).outcome,'HELD');
});
test('same administrator restoring BOTH checkpoint copies still defeats global one-use',t=>{
  const f=fixture(t),clonePath=join(f.root,'cloned-anchor.sqlite');
  // Expected SUCCESSFUL attack means production NO-GO: the snapshot was taken
  // before any consumption and includes the independently needed checkpoint.
  copyFileSync(f.path,clonePath);
  const a=f.open(),b=new SyntheticConsumptionAnchor(clonePath,domainId);
  t.after(()=>{a.close();b.close();});
  assert.equal(a.reserve(data).outcome,'RESERVED');
  assert.equal(b.reserve(data).outcome,'RESERVED');
});
