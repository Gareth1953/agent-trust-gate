// Run only on a disposable Linux evaluation/CI host. Does not create accounts,
// edit host services/ACLs, buy resources, or contact an external endpoint.
import assert from 'node:assert/strict';
import { spawn,execFileSync } from 'node:child_process';
import { once } from 'node:events';
import { mkdirSync,mkdtempSync,readFileSync,writeFileSync,cpSync,renameSync,chmodSync,chownSync,readdirSync,lstatSync,rmSync } from 'node:fs';
import { join,resolve,dirname,isAbsolute } from 'node:path';
import { createHash } from 'node:crypto';
import { createServer } from 'node:tls';
import { DatabaseSync } from 'node:sqlite';
import { createCustodyFixture } from './custody-fixture.mjs';
import { custodyTlsFixture } from './custody-tls-fixture.mjs';
import { custodyRequest } from './custody-service-client.mjs';
import { CustodyWitness } from '../dist/src/custody-witness.js';
import { issueExactActionGatePass } from '../dist/src/exact-action-gatepass.js';

const args=process.argv.slice(2),output=args[1];
if(args.length!==3||args[0]!=='--output'||args[2]!=='--disposable-host'||!isAbsolute(output))throw Error('Use --output /ABSOLUTE/NEW/report.json --disposable-host');
const report={schema:'atg.split-custody.evidence.v1',startedAt:new Date().toISOString(),status:'INCOMPLETE',
  productionReady:false,independentAssessment:false,scope:'Synthetic Linux distinct-principal evaluation; root/custody administrator remains trusted.',
  cases:[],sourceHashes:{},limitations:['No HSM or hostile administrator/whole-host restore protection.','No payment provider or production authority.','One-use is scoped to the retained authoritative service store; no independent global anchor.']};
for(const file of ['src/custody-witness.ts','scripts/custody-service.mjs','scripts/custody-service-client.mjs','scripts/custody-agent-probe.mjs','scripts/test-custody-isolation.mjs'])report.sourceHashes[file]=createHash('sha256').update(readFileSync(resolve(file))).digest('hex');
try{report.sourceCommit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();}catch{report.sourceCommit='unavailable';}
const persist=()=>{report.finishedAt=new Date().toISOString();writeFileSync(output,JSON.stringify(report,null,2)+'\n',{flag:'wx',mode:0o600});console.log(JSON.stringify({status:report.status,cases:report.cases.length,productionReady:false,output}));};
if(process.platform!=='linux'||process.getuid?.()!==0){report.status='BLOCKED';report.blocker='Actual distinct UIDs/capability dropping unavailable here; no same-owner fallback.';persist();process.exit(2);}

const agentUid=62011,serviceUid=62012,issuerUid=62013,children=[];
const root=mkdtempSync('/tmp/atg-split-custody-');chmodSync(root,0o755);
report.fixtureRoot=root;
const code=join(root,'code'),dist=join(code,'dist'),scripts=join(code,'scripts'),pub=join(root,'public'),issuer=join(root,'issuer'),secret=join(root,'server-secret');
for(const p of [code,scripts,pub,issuer,secret])mkdirSync(p,{mode:0o755});
cpSync(resolve('dist'),dist,{recursive:true,errorOnExist:true,force:false});
for(const f of ['custody-service.mjs','custody-service-client.mjs','custody-agent-probe.mjs'])cpSync(resolve('scripts',f),join(scripts,f),{force:false});
const node=join(code,'node');cpSync(process.execPath,node,{force:false});chmodSync(node,0o555);
function protectTree(path){const stat=lstatSync(path);assert.equal(stat.isSymbolicLink(),false);chownSync(path,0,0);if(stat.isDirectory()){for(const f of readdirSync(path))protectTree(join(path,f));chmodSync(path,0o555);}else chmodSync(path,stat.mode&0o111?0o555:0o444);}
protectTree(code);
function role(uid,script,extra=[],input){
  const p=spawn('setpriv',['--reuid='+uid,'--regid='+uid,'--clear-groups','--bounding-set=-all','--inh-caps=-all','--ambient-caps=-all','--no-new-privs',node,'--no-addons',script,...extra],
    {cwd:code,env:{PATH:'/usr/bin:/bin',HOME:'/nonexistent',LANG:'C.UTF-8'},stdio:['pipe','pipe','pipe']});
  children.push(p);let stderr='';p.stderr.on('data',b=>{stderr=(stderr+b).slice(-4000);});
  p.diagnostic=()=>stderr;
  if(input!==undefined)p.stdin.end(JSON.stringify(input));
  return p;
}
async function result(p){let out='';for await(const b of p.stdout){out+=b;if(out.length>128000)throw Error('CHILD_OUTPUT_LIMIT');}if(p.exitCode===null)await once(p,'exit');assert.equal(p.exitCode,0,p.diagnostic());return JSON.parse(out);}
async function start(config){const p=role(serviceUid,join(scripts,'custody-service.mjs'),[config]);
  const ready=await new Promise((ok,bad)=>{let b='';const timer=setTimeout(()=>{cleanup();bad(Error('SERVICE_READY_TIMEOUT '+p.diagnostic()));},6000);
    const data=chunk=>{b+=chunk;if(b.includes('\n')){cleanup();try{ok(JSON.parse(b.split('\n')[0]));}catch(error){bad(error);}}};
    const exit=()=>{cleanup();bad(Error('SERVICE_START_FAILED '+p.diagnostic()));};
    function cleanup(){clearTimeout(timer);p.stdout.off('data',data);p.off('exit',exit);}p.stdout.on('data',data);p.once('exit',exit);});
  assert.equal(ready.status,'READY');return {p,port:ready.port};}
async function stop(p){if(p.exitCode===null){const done=once(p,'exit');p.kill('SIGTERM');await done;}}
async function check(name,fn){const observation=await fn();report.cases.push({name,status:'PASS',observation:observation??null});console.log('PASS '+name);}

let fake;
try {
  const f=createCustodyFixture(join(root,'fixture'));chmodSync(f.root,0o755);
  const key=join(issuer,'issuer-private.pem');renameSync(join(f.custody,'issuer-private.pem'),key);chownSync(issuer,issuerUid,issuerUid);chmodSync(issuer,0o700);chownSync(key,issuerUid,issuerUid);chmodSync(key,0o600);
  const trust=join(pub,'trust.json');renameSync(join(f.custody,'trust.json'),trust);chmodSync(trust,0o444);
  chownSync(f.custody,serviceUid,serviceUid);chmodSync(f.custody,0o700);chownSync(f.path,serviceUid,serviceUid);chmodSync(f.path,0o600);
  chownSync(f.agent,agentUid,agentUid);chmodSync(f.agent,0o700);
  const tlsDir=join(root,'tls');mkdirSync(tlsDir,{mode:0o700});const tls=custodyTlsFixture(tlsDir);
  const ca=join(pub,'ca.crt'),cert=join(pub,'server.crt'),serverKey=join(secret,'server.key');
  cpSync(tls.caPath,ca);cpSync(tls.server.certPath,cert);cpSync(tls.server.keyPath,serverKey);
  chownSync(secret,serviceUid,serviceUid);chmodSync(secret,0o700);chownSync(serverKey,serviceUid,serviceUid);chmodSync(serverKey,0o600);
  for(const p of [ca,cert])chmodSync(p,0o444);
  const config=join(pub,'service.json');
  let c={schema:'atg.split-custody.synthetic.v1',agentUid,serviceUid,issuerUid,codeRoot:dist,databasePath:f.path,
    host:'127.0.0.1',port:0,caPath:ca,trustPath:trust,serverCertPath:cert,serverKeyPath:serverKey,clientFingerprint:tls.client.fingerprint};
  const saveConfig=()=>{writeFileSync(config,JSON.stringify(c));chmodSync(config,0o444);};saveConfig();
  let service=await start(config);c.port=service.port;saveConfig();
  const now=Date.now(),g=f.grant({issuedAt:new Date(now-1000).toISOString(),notBefore:new Date(now-1000).toISOString(),expiresAt:new Date(now+300000).toISOString()});
  const grantPath=join(f.agent,'grant.json');writeFileSync(grantPath,JSON.stringify(g));
  const agentKey=join(f.agent,'agent.key'),agentCert=join(f.agent,'agent.crt');cpSync(tls.client.keyPath,agentKey);cpSync(tls.client.certPath,agentCert);
  const clientConfig=join(f.agent,'client.json'),client={host:'127.0.0.1',port:service.port,caPath:ca,certPath:agentCert,keyPath:agentKey,serverFingerprint:tls.server.fingerprint};
  writeFileSync(clientConfig,JSON.stringify(client));for(const p of [grantPath,agentKey,agentCert,clientConfig]){chownSync(p,agentUid,agentUid);chmodSync(p,0o600);}
  const snapshot=join(f.root,'agent-snapshot');cpSync(f.agent,snapshot,{recursive:true});chownSync(snapshot,agentUid,agentUid);for(const p of readdirSync(snapshot))chownSync(join(snapshot,p),agentUid,agentUid);
  const call=(message,dir=f.agent)=>result(role(agentUid,join(scripts,'custody-service-client.mjs'),[join(dir,'client.json')],message));
  const probe=input=>result(role(agentUid,join(scripts,'custody-agent-probe.mjs'),[],input));
  const dbRow=()=>{const db=new DatabaseSync(f.path,{readOnly:true});try{return db.prepare('SELECT * FROM resource').get();}finally{db.close();}};
  await check('Actual service identity has distinct UID, no capabilities and no_new_privs',()=>{
    const s=readFileSync('/proc/'+service.p.pid+'/status','utf8');assert.match(s,new RegExp('^Uid:\\s+'+serviceUid+'\\s+'+serviceUid,'m'));
    for(const field of ['CapInh','CapPrm','CapEff','CapBnd','CapAmb'])assert.match(s,new RegExp('^'+field+':\\s+0+$','m'));assert.match(s,/^NoNewPrivs:\s+1$/m);return {agentUid,serviceUid,issuerUid};});
  for(const [name,input] of [
    ['Agent cannot read issuer signing key',{op:'read',path:key}],
    ['Agent cannot read writer TLS private key',{op:'read',path:serverKey}],
    ['Agent cannot directly rewrite authoritative SQL',{op:'sql',path:f.path}],
    ['Agent cannot overwrite authoritative database',{op:'write',path:f.path}],
    ['Agent cannot chmod authoritative database',{op:'chmod',path:f.path}],
    ['Agent cannot copy complete writer state',{op:'copy',path:f.custody,destination:join(f.agent,'stolen-writer')}],
    ['Agent cannot replace writer state directory',{op:'rename',path:f.custody,destination:join(f.agent,'moved-writer')}],
    ['Agent cannot replace pinned trust or service configuration',{op:'write',path:config}],
    ['Agent cannot rewrite pinned issuer public key',{op:'write',path:trust}],
    ['Agent cannot rewrite protected executable code',{op:'write',path:join(dist,'src/custody-witness.js')}],
    ['Agent cannot read writer memory',{op:'memory',pid:service.p.pid}],
    ['Agent cannot signal writer',{op:'signal',pid:service.p.pid}],
  ])await check(name,async()=>{
    if(input.path)assert.ok(lstatSync(input.path));
    const r=await probe(input);assert.equal(r.denied,true,JSON.stringify(r));
    if(input.op==='sql')assert.match(r.message,/unable to open database|permission denied/i);
    else if(input.op==='copy')assert.equal(r.code,'COPY_DENIED');
    else assert.ok(['EACCES','EPERM'].includes(r.code),JSON.stringify(r));
    return {denied:r.denied,code:r.code};
  });
  await check('Writer cannot read issuer signing key',async()=>{const r=await result(role(serviceUid,join(scripts,'custody-agent-probe.mjs'),[],{op:'read',path:key}));assert.equal(r.denied,true);return {denied:true,code:r.code};});
  await check('Same-owner service startup refuses rather than downgrades',async()=>{const p=role(agentUid,join(scripts,'custody-service.mjs'),[config]);p.stdout.resume();if(p.exitCode===null)await once(p,'exit');assert.notEqual(p.exitCode,0);assert.match(p.diagnostic(),/CUSTODY_CONFIG_INVALID/);});
  await check('Missing client certificate cannot reach writer',async()=>{const r=await custodyRequest({...client,certPath:undefined,keyPath:undefined},{op:'execute',grant:g});assert.equal(r.outcome,'UNKNOWN');assert.equal(dbRow().version,1);});
  await check('Different client certificate signed by trusted CA is still refused',async()=>{const r=await custodyRequest({...client,certPath:tls.rogueClient.certPath,keyPath:tls.rogueClient.keyPath},{op:'execute',grant:g});assert.equal(r.outcome,'UNKNOWN');assert.equal(dbRow().version,1);});
  await check('Wrong pinned server identity refuses before any grant is sent',async()=>{assert.equal((await custodyRequest({...client,serverFingerprint:tls.fakeServer.fingerprint},{op:'execute',grant:g})).outcome,'UNKNOWN');assert.equal(dbRow().version,1);});
  await check('CA-valid fake endpoint fails exact server pin',async()=>{
    let received=0;fake=createServer({key:readFileSync(tls.fakeServer.keyPath),cert:readFileSync(tls.fakeServer.certPath)},s=>{s.on('data',()=>received++);s.on('error',()=>{});s.end();});fake.on('tlsClientError',()=>{});
    await new Promise(ok=>fake.listen(0,'127.0.0.1',ok));assert.equal((await custodyRequest({...client,port:fake.address().port},{op:'execute',grant:g})).outcome,'UNKNOWN');assert.equal(received,0);await new Promise(ok=>fake.close(ok));fake=null;});
  await check('Agent channel cannot stop, revoke or choose a database',async()=>{for(const m of [{op:'stop',grant:g},{op:'revoke',grant:g},{op:'execute',grant:g,path:f.path}])assert.equal((await call(m)).reason,'WITNESS_COMMAND_INVALID');assert.equal(dbRow().version,1);});
  await check('Public fixture signer cannot impersonate the protected issuer',async()=>{const forged={...g,issuance:issueExactActionGatePass(g.proposedAction)};assert.equal((await call({op:'execute',grant:forged})).outcome,'REJECTED');assert.equal(dbRow().version,1);});
  await check('Changed payee fails exact-action binding',async()=>{const changed=structuredClone(g);changed.proposedAction.canonicalArguments.payeeReference='fixture-bank-B';assert.equal((await call({op:'execute',grant:changed})).outcome,'REJECTED');assert.equal(dbRow().version,1);});
  await check('Two real agent processes race: exactly one synthetic effect',async()=>{
    const r=await Promise.all([call({op:'execute',grant:g}),call({op:'execute',grant:g},snapshot)]);assert.equal(r.filter(x=>x.outcome==='EXECUTED').length,1);assert.equal(r.filter(x=>x.outcome==='REJECTED').length,1);assert.equal(dbRow().version,2);return r.map(x=>x.outcome);});
  await check('Restore all agent-held credentials/cache: same authority remains used',async()=>{
    rmSync(f.agent,{recursive:true});cpSync(snapshot,f.agent,{recursive:true});chownSync(f.agent,agentUid,agentUid);for(const p of readdirSync(f.agent))chownSync(join(f.agent,p),agentUid,agentUid);
    assert.equal((await call({op:'execute',grant:JSON.parse(readFileSync(grantPath,'utf8'))})).reason,'AUTHORITY_ALREADY_USED_OR_REVOKED');assert.equal(dbRow().version,2);});
  await check('Authoritative service restart retains one-use and reconciles result',async()=>{
    await stop(service.p);service=await start(config);assert.equal((await call({op:'lookup',grant:g})).outcome,'EXECUTED');assert.equal((await call({op:'execute',grant:g})).reason,'AUTHORITY_ALREADY_USED_OR_REVOKED');assert.equal(dbRow().version,2);});
  await check('Custody outage returns UNKNOWN, no automatic retry or local fallback',async()=>{
    await stop(service.p);const r=await call({op:'execute',grant:g});assert.equal(r.outcome,'UNKNOWN');assert.equal(r.automaticRetryPermitted,false);assert.equal(dbRow().version,2);});
  await check('Missing authoritative database refuses startup without recreation',async()=>{
    const held=f.path+'.retained';renameSync(f.path,held);const p=role(serviceUid,join(scripts,'custody-service.mjs'),[config]);p.stdout.resume();if(p.exitCode===null)await once(p,'exit');assert.notEqual(p.exitCode,0);assert.throws(()=>lstatSync(f.path),/ENOENT/);renameSync(held,f.path);});
  await check('Trusted controller stop persists and agent channel cannot clear it',async()=>{
    const writer=new CustodyWitness({path:f.path,trust:f.trust});writer.stop();writer.close();service=await start(config);
    assert.equal((await call({op:'execute',grant:g})).reason,'WITNESS_STOPPED');assert.equal((await call({op:'resume',grant:g})).reason,'WITNESS_COMMAND_INVALID');assert.equal(dbRow().version,2);});
  report.status='PASS_SCOPED';report.authoritativeResourceVersion=dbRow().version;
}catch(error){report.status='FAIL';report.failure=String(error.stack??error).slice(0,6000);process.exitCode=1;}
finally {
  for(const p of children)if(p.exitCode===null){p.kill('SIGKILL');}
  if(fake)fake.close();
  persist();
}
