// Disposable Linux host only. Root provisions temporary fixture identities,
// but does NOT give them root, capabilities or access to each other's secrets.
// Root/whole-host rollback deliberately remains OUTSIDE the protection claim.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {cpSync,mkdtempSync,mkdirSync,readFileSync,writeFileSync,chmodSync,chownSync,lstatSync,readdirSync,rmSync} from 'node:fs';
import {join,resolve,isAbsolute} from 'node:path';
import {createDelegatedCustodyFixture} from '../../scripts/delegated-custody-fixture.mjs';
import {custodyTlsFixture} from '../../scripts/custody-tls-fixture.mjs';

const argv=process.argv.slice(2);
if(argv.length!==3 || argv[0]!=='--output' || !isAbsolute(argv[1]) ||
   argv[2]!=='--disposable-host') throw Error('USE_NEW_ABSOLUTE_REPORT_AND_DISPOSABLE_HOST');
const report={schema:'atg.checkpoint-protected.synthetic-evidence.v1',
  productionReady:false,independentAdministration:false,status:'INCOMPLETE',
  cases:[],limits:['Common root operator can restore writer and checkpoint together.',
    'Fixture credentials and clock only; no real payment or human authoriser.',
    'Only the opt-in trusted writer is mediated; legacy direct writer routes remain possible.']};
const save=()=>{writeFileSync(argv[1],JSON.stringify(report,null,2)+'\n',{flag:'wx',mode:0o600});
  console.log(JSON.stringify({status:report.status,cases:report.cases.length,productionReady:false}));};
if(process.platform!=='linux'||process.getuid?.()!==0){report.status='BLOCKED';
  report.reason='REQUIRES_DISPOSABLE_ROOT_LINUX';save();process.exit(2);}
const agentUid=62011,writerUid=62012,checkpointUid=62014;
const root=mkdtempSync('/tmp/atg-separated-checkpoint-');
chmodSync(root,0o755);
const children=[];
function ownedFile(path,owner,mode=0o600){chownSync(path,owner,owner);chmodSync(path,mode);}
function protectCode(path) {
  const stat=lstatSync(path);
  assert.equal(stat.isSymbolicLink(),false);
  chownSync(path,0,0);
  if(stat.isDirectory()) {
    for(const item of readdirSync(path))protectCode(join(path,item));
    chmodSync(path,0o555);
  } else chmodSync(path,stat.mode&0o111?0o555:0o444);
}
function role(uid,script,config) {
  const p=spawn('setpriv',['--reuid='+uid,'--regid='+uid,'--clear-groups',
    '--bounding-set=-all','--inh-caps=-all','--ambient-caps=-all',
    '--no-new-privs',node,'--no-addons',script,config],
    {cwd:code,env:{PATH:'/usr/bin:/bin',HOME:'/nonexistent',LANG:'C.UTF-8'},
      stdio:['ignore','pipe','pipe']});
  children.push(p);
  let stderr='';
  p.stderr.on('data',b=>stderr=(stderr+b).slice(-3000));
  p.errorText=()=>stderr;
  return p;
}
async function one(p) {
  let output='';
  for await(const b of p.stdout)output+=b;
  if(p.exitCode===null)await once(p,'exit');
  assert.equal(p.exitCode,0,p.errorText());
  return JSON.parse(output.trim());
}
async function startup(p) {
  return await new Promise((ok,bad)=>{
    let data='';
    const timer=setTimeout(()=>{cleanup();bad(Error('CHECKPOINT_START_TIMEOUT '+p.errorText()));},5000);
    const receive=b=>{data+=b;if(data.includes('\n')){cleanup();
      try{ok(JSON.parse(data.split('\n')[0]));}catch(e){bad(e);}}};
    const end=()=>{cleanup();bad(Error('CHECKPOINT_START_FAILURE '+p.errorText()));};
    function cleanup(){clearTimeout(timer);p.stdout.off('data',receive);p.off('exit',end);}
    p.stdout.on('data',receive);p.once('exit',end);
  });
}
function record(name,check) {assert.ok(check,name);report.cases.push({name,result:'PASS'});}
const code=join(root,'code'),node=join(code,'node');
try {
  mkdirSync(code);
  cpSync(resolve('dist'),join(code,'dist'),{recursive:true});
  for(const directory of ['mandatory-destination','anti-rollback'])
    mkdirSync(join(code,'experiments',directory),{recursive:true});
  for(const file of ['checkpoint-tls-service.mjs','async-checkpointed-destination.mjs',
    'isolated-checkpoint-process.mjs','isolated-writer-process.mjs'])
    cpSync(resolve('experiments/mandatory-destination',file),join(code,'experiments/mandatory-destination',file));
  cpSync(resolve('experiments/anti-rollback/consumption-anchor.mjs'),
    join(code,'experiments/anti-rollback/consumption-anchor.mjs'));
  cpSync(process.execPath,node);chmodSync(node,0o555);protectCode(code);

  const f=createDelegatedCustodyFixture(join(root,'buyer'));
  chmodSync(f.root,0o755);
  const writer=f.open(),r=f.request();f.approve(writer,r);writer.close();
  const restored=join(f.custody,'restored.sqlite');
  cpSync(f.path,restored);
  ownedFile(f.custody,writerUid,0o700);ownedFile(f.path,writerUid);ownedFile(restored,writerUid);

  const checkpointDir=join(root,'checkpoint');
  mkdirSync(checkpointDir,{mode:0o700});
  const anchorPath=join(checkpointDir,'anchor.sqlite');
  const {SyntheticConsumptionAnchor}=await import('../anti-rollback/consumption-anchor.mjs');
  SyntheticConsumptionAnchor.create(anchorPath,f.trust.domainId);
  ownedFile(checkpointDir,checkpointUid,0o700);ownedFile(anchorPath,checkpointUid);

  const tlsDir=join(root,'tls');
  mkdirSync(tlsDir,{mode:0o700});
  const tls=custodyTlsFixture(tlsDir);
  const publicDir=join(root,'public');mkdirSync(publicDir,{mode:0o755});
  const ca=join(publicDir,'ca.crt');
  const certificate=join(publicDir,'server.crt');
  cpSync(tls.caPath,ca);cpSync(tls.server.certPath,certificate);
  ownedFile(ca,0,0o444);ownedFile(certificate,0,0o444);
  const serverKey=join(checkpointDir,'server.key');
  cpSync(tls.server.keyPath,serverKey);ownedFile(serverKey,checkpointUid);
  const writerKey=join(f.custody,'writer.key'),writerCert=join(publicDir,'writer.crt');
  cpSync(tls.client.keyPath,writerKey);ownedFile(writerKey,writerUid);
  cpSync(tls.client.certPath,writerCert);ownedFile(writerCert,0,0o444);
  const serviceConfig=join(publicDir,'checkpoint.json');
  writeFileSync(serviceConfig,JSON.stringify({
    schema:'atg.checkpoint-isolation.synthetic.v1',checkpointUid,
    path:anchorPath,domainId:f.trust.domainId,caPath:ca,serverCertPath:certificate,
    serverKeyPath:serverKey,writerFingerprint:tls.client.fingerprint,
  }));ownedFile(serviceConfig,0,0o444);
  const service=role(checkpointUid,join(code,'experiments/mandatory-destination/isolated-checkpoint-process.mjs'),serviceConfig);
  const ready=await startup(service);
  assert.equal(ready.status,'READY');record('Checkpoint runs as distinct unprivileged identity',service.pid>0);
  const writerScript=join(code,'experiments/mandatory-destination/isolated-writer-process.mjs');
  const configPath=join(publicDir,'writer.json');
  function saveWriter(path=f.path) {
    writeFileSync(configPath,JSON.stringify({
      schema:'atg.writer-isolation.synthetic.v1',writerUid,
      path,trust:f.trust,syntheticNow:f.getNow(),grant:r.grant,ctx:r.ctx,
      checkpointClient:{host:'127.0.0.1',port:ready.port,caPath:ca,
        certPath:writerCert,keyPath:writerKey,serverFingerprint:tls.server.fingerprint}
    }));ownedFile(configPath,0,0o444);
  }
  saveWriter();
  const first=await one(role(writerUid,writerScript,configPath));
  assert.equal(first.outcome,'EXECUTED');record('Authenticated writer commits first fictional effect',true);
  saveWriter(restored);
  const second=await one(role(writerUid,writerScript,configPath));
  assert.equal(second.outcome,'REJECTED');record('Restored writer denied by retained checkpoint',true);
  const agentProbe=join(code,'probe.mjs');
  writeFileSync(agentProbe,`import {readFileSync,writeFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
const [op,path]=process.argv.slice(2);
try {if(op==='read')readFileSync(path);else if(op==='write')writeFileSync(path,'attack');
else if(op==='sql'){const db=new DatabaseSync(path);db.exec('DELETE FROM decisions;');db.close();}
console.log(JSON.stringify({denied:false}));}
catch(e){console.log(JSON.stringify({denied:true,code:e.code||'SQL_DENIED'}));}`);
  // Unlike secured code tree, the disposable probe is public read-only.
  ownedFile(agentProbe,0,0o444);
  async function probe(op,path){
    const p=spawn('setpriv',['--reuid='+agentUid,'--regid='+agentUid,'--clear-groups',
      '--bounding-set=-all','--inh-caps=-all','--ambient-caps=-all','--no-new-privs',
      node,'--no-addons',agentProbe,op,path],{cwd:code,stdio:['ignore','pipe','pipe']});
    children.push(p);let stderr='';p.stderr.on('data',b=>stderr=(stderr+b).slice(-3000));p.errorText=()=>stderr;return await one(p);
  }
  for(const [label,op,path] of [
    ['Agent cannot read checkpoint store','read',anchorPath],
    ['Agent cannot rewrite checkpoint history','write',anchorPath],
    ['Agent cannot read checkpoint TLS secret','read',serverKey],
    ['Agent cannot read writer TLS secret','read',writerKey],
    ['Agent cannot modify protected writer SQL','sql',f.path],
    ['Agent cannot replace writer database','write',f.path]
  ]){const result=await probe(op,path);record(label,result.denied===true);}
  const agentWriter=role(agentUid,writerScript,configPath);
  let textOutput='';for await(const b of agentWriter.stdout)textOutput+=b;
  if(agentWriter.exitCode===null)await once(agentWriter,'exit');
  record('Agent cannot impersonate trusted writer UID',agentWriter.exitCode!==0);
  report.status='PASS_SCOPED';
} catch(error) {report.status='FAIL';report.failure=String(error.stack||error).slice(0,4000);process.exitCode=1;}
finally {
  for(const p of children)if(p.exitCode===null)p.kill('SIGKILL');
  // Fixtures hold test-only signing and TLS private keys: never upload directory.
  save();
  rmSync(root,{recursive:true,force:true});
}
