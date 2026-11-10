import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync,readFileSync,writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join,resolve } from 'node:path';
import { createServer } from 'node:tls';
import { createServer as plainServer } from 'node:net';
import { custodyTlsFixture } from '../scripts/custody-tls-fixture.mjs';
import { custodyRequest } from '../scripts/custody-service-client.mjs';
import { protectedPath,loadServiceConfig } from '../scripts/custody-service.mjs';

test('custody startup refuses the local common-owner configuration instead of downgrading',()=>{
  const dir=mkdtempSync(join(tmpdir(),'atg-service-guard-')),file=join(dir,'config.json');writeFileSync(file,'{}');
  assert.throws(()=>loadServiceConfig(file),/CUSTODY_/);
  if(process.getuid?.()!==0)assert.throws(()=>protectedPath(file,[0]),/CUSTODY_UNTRUSTED_PATH/);
  assert.throws(()=>protectedPath('relative.sqlite',[0]),/CUSTODY_ABSOLUTE_NORMAL_PATH_REQUIRED/);
});
test('bounded client refuses non-loopback, invalid pins and oversized messages without connecting',async()=>{
  assert.equal((await custodyRequest({host:'example.com',port:443,serverFingerprint:'invalid'},{})).outcome,'UNKNOWN');
  assert.equal((await custodyRequest({}, {large:'x'.repeat(65536)})).reason,'CLIENT_FRAME_INVALID');
});
test('client authenticates TLS hostname and exact certificate and never falls back to plaintext',async t=>{
  const dir=mkdtempSync(join(tmpdir(),'atg-service-tls-')),tls=custodyTlsFixture(dir);
  let received=0;
  const sockets=new Set(),server=createServer({key:readFileSync(tls.server.keyPath),cert:readFileSync(tls.server.certPath),
    ca:readFileSync(tls.caPath),requestCert:true,rejectUnauthorized:true,minVersion:'TLSv1.3'},s=>{
    s.on('error',()=>{});s.once('data',()=>{received++;s.end('{"outcome":"REJECTED","reason":"UNIT_TEST_ONLY"}\n');});
  });
  server.on('connection',s=>{sockets.add(s);s.on('error',()=>{});s.on('close',()=>sockets.delete(s));});
  server.on('tlsClientError',()=>{});
  await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
  t.after(async()=>{for(const s of sockets)s.destroy();await new Promise(ok=>server.close(ok));});
  const c={host:'127.0.0.1',port:server.address().port,caPath:tls.caPath,certPath:tls.client.certPath,keyPath:tls.client.keyPath,serverFingerprint:tls.server.fingerprint};
  assert.equal((await custodyRequest(c,{})).reason,'UNIT_TEST_ONLY');
  assert.equal((await custodyRequest({...c,serverFingerprint:tls.fakeServer.fingerprint},{})).outcome,'UNKNOWN');
  assert.equal((await custodyRequest({...c,certPath:undefined,keyPath:undefined},{})).outcome,'UNKNOWN');
  assert.equal(received,1);
  const plain=plainServer(s=>s.destroy());await new Promise(ok=>plain.listen(0,'127.0.0.1',ok));
  t.after(()=>new Promise(ok=>plain.close(ok)));
  assert.equal((await custodyRequest({...c,port:plain.address().port},{})).outcome,'UNKNOWN');
});
