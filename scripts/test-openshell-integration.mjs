// DISPOSABLE Linux CI host only. Root is a trusted provisioner, not the attacker.
// Never upload this script's fixture directory: it contains disposable keys.
import assert from 'node:assert/strict';
import { spawn,execFileSync } from 'node:child_process';
import { once } from 'node:events';
import { mkdtempSync,mkdirSync,readFileSync,writeFileSync,cpSync,chmodSync,chownSync,readdirSync,lstatSync } from 'node:fs';
import { join,resolve,isAbsolute } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash,X509Certificate,randomBytes } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { connect } from 'node:tls';
import { createServer } from 'node:https';
import { createCustodyFixture } from './custody-fixture.mjs';
import { custodyTlsFixture } from './custody-tls-fixture.mjs';
import { brokerRequest } from './openshell-broker-client.mjs';

const args=process.argv.slice(2);
if(args.length!==5||args[0]!=='--output'||args[2]!=='--openshell-bin'||args[4]!=='--disposable-host'||!isAbsolute(args[1])||!isAbsolute(args[3]))throw Error('Use --output /ABSOLUTE/NEW/report.json --openshell-bin /ABSOLUTE/BIN/DIR --disposable-host');
const output=args[1],bin=args[3],receipt={schema:'atg.openshell-integration.evidence.v1',startedAt:new Date().toISOString(),status:'INCOMPLETE',
  syntheticOnly:true,productionReady:false,independentAssessment:false,targetOpenshellVersion:'0.1.8',cases:[],limitations:[
    'Root/writer and Docker administrators remain trusted; whole-host rollback is unprotected.',
    'No live principal, payment, model, independent assessment or comparative performance claim.',
    'OpenShell mediates network/binary access; mTLS is end-to-end, so the broker owns HTTP/body enforcement.']};
const persist=()=>{receipt.finishedAt=new Date().toISOString();writeFileSync(output,JSON.stringify(receipt,null,2)+'\n',{flag:'wx',mode:0o600});console.log(JSON.stringify(receipt));};
const run=(cmd,a,opts={})=>execFileSync(cmd,a,{encoding:'utf8',timeout:120000,maxBuffer:4*1024*1024,...opts});
if(process.platform!=='linux'||process.getuid?.()!==0){receipt.status='BLOCKED';receipt.blocker='Distinct-UID disposable root provisioner unavailable';persist();process.exit(2);}
try{run('docker',['version']);}catch{receipt.status='BLOCKED';receipt.blocker='Docker runtime unavailable';persist();process.exit(2);}
const root=mkdtempSync(join(tmpdir(),'atg-openshell-ci-'));chmodSync(root,0o755);
const children=[];let sandboxCreated=false,decoy;const name='atg-broker-evaluation',cli=join(bin,'openshell'),gateway=join(bin,'openshell-gateway');
const env={PATH:process.env.PATH,LANG:'C.UTF-8',XDG_CONFIG_HOME:join(root,'xdg-config'),XDG_STATE_HOME:join(root,'xdg-state'),XDG_DATA_HOME:join(root,'xdg-data'),XDG_CACHE_HOME:join(root,'xdg-cache')};
const openshell=a=>run(cli,a,{env,timeout:180000});
const cases=async(name,fn)=>{const observation=await fn();receipt.cases.push({name,status:'PASS',observation:observation??null});};
function protect(path){const s=lstatSync(path);assert.equal(s.isSymbolicLink(),false);chownSync(path,0,0);if(s.isDirectory()){for(const f of readdirSync(path))protect(join(path,f));chmodSync(path,0o555);}else chmodSync(path,s.mode&0o111?0o555:0o444);}
async function ready(p,pattern){await new Promise((ok,bad)=>{let text='';const timer=setTimeout(()=>bad(Error('PROCESS_READY_TIMEOUT')),15000);p.stdout.on('data',b=>{text+=b;if(pattern.test(text)){clearTimeout(timer);ok();}});p.once('exit',()=>{clearTimeout(timer);bad(Error('PROCESS_EXIT_BEFORE_READY'));});});}
try {
  receipt.sourceCommit=run('git',['rev-parse','HEAD']).trim();receipt.sourceHashes={};
  for(const p of ['src/openshell-transaction-broker.ts','scripts/openshell-broker.mjs','scripts/openshell-broker-client.mjs','scripts/openshell-agent-probe.mjs','scripts/test-openshell-integration.mjs'])receipt.sourceHashes[p]=createHash('sha256').update(readFileSync(p)).digest('hex');
  receipt.actualOpenshellVersion=openshell(['--version']).trim();assert.equal(receipt.actualOpenshellVersion,'openshell 0.1.8');
  const host=run('docker',['network','inspect','bridge','--format','{{(index .IPAM.Config 0).Gateway}}']).trim();
  assert.match(host,/^(172\.(1[6-9]|2\d|3[01])|10\.|192\.168\.)/);
  const code=join(root,'protected-code'),scripts=join(code,'scripts');mkdirSync(code);mkdirSync(scripts);
  cpSync(resolve('dist'),join(code,'dist'),{recursive:true});
  for(const f of ['openshell-broker.mjs','custody-service.mjs'])cpSync(resolve('scripts',f),join(scripts,f));
  const node=join(code,'node');cpSync(process.execPath,node);chmodSync(node,0o555);protect(code);
  const f=createCustodyFixture(join(root,'fixture')),serviceUid=62012;chmodSync(f.root,0o755);
  const pub=join(root,'public'),secret=join(root,'secret'),bundle=join(root,'client-bundle');for(const p of [pub,secret,bundle])mkdirSync(p,{mode:0o700});chmodSync(pub,0o755);
  const tls=custodyTlsFixture(root);
  // Additional SAN for the exact private Docker bridge interface, no public listener.
  const bridgeExt=join(root,'bridge.ext');writeFileSync(bridgeExt,'basicConstraints=critical,CA:FALSE\nkeyUsage=critical,digitalSignature\nextendedKeyUsage=serverAuth\nsubjectAltName=IP:'+host+'\n');
  run('openssl',['x509','-req','-in',join(root,'server.csr'),'-CA',tls.caPath,'-CAkey',tls.caKey,'-set_serial','0x'+randomBytes(16).toString('hex'),'-out',tls.server.certPath,'-days','1','-extfile',bridgeExt]);
  const serverFingerprint=new X509Certificate(readFileSync(tls.server.certPath)).fingerprint256;
  const trustPath=join(pub,'trust.json');cpSync(join(f.custody,'trust.json'),trustPath);chmodSync(trustPath,0o444);
  const issuerDir=join(root,'issuer');mkdirSync(issuerDir,{mode:0o700});cpSync(join(f.custody,'issuer-private.pem'),join(issuerDir,'issuer.pem'));
  // Remove issuer material from the writer domain before starting it.
  const {unlinkSync}=await import('node:fs');unlinkSync(join(f.custody,'issuer-private.pem'));unlinkSync(join(f.custody,'trust.json'));
  chownSync(f.custody,serviceUid,serviceUid);chownSync(f.path,serviceUid,serviceUid);chmodSync(f.custody,0o700);chmodSync(f.path,0o600);
  const caPath=join(pub,'ca.crt'),serverCertPath=join(pub,'server.crt'),serverKeyPath=join(secret,'server.key');
  cpSync(tls.caPath,caPath);cpSync(tls.server.certPath,serverCertPath);cpSync(tls.server.keyPath,serverKeyPath);chownSync(secret,serviceUid,serviceUid);chownSync(serverKeyPath,serviceUid,serviceUid);chmodSync(serverKeyPath,0o600);
  const port=49443,config=join(pub,'broker.json');
  writeFileSync(config,JSON.stringify({schema:'atg.openshell-broker.config.synthetic.v1',serviceUid,codeRoot:join(code,'dist'),databasePath:f.path,trustPath,
    host,port,caPath,serverCertPath,serverKeyPath,clientFingerprint:tls.client.fingerprint}));chmodSync(config,0o444);
  const broker=spawn('setpriv',['--reuid='+serviceUid,'--regid='+serviceUid,'--clear-groups','--bounding-set=-all','--inh-caps=-all','--ambient-caps=-all','--no-new-privs',node,'--no-addons',join(scripts,'openshell-broker.mjs'),config],{stdio:['ignore','pipe','pipe'],env:{PATH:'/usr/bin:/bin',LANG:'C.UTF-8'}});children.push(broker);
  let brokerErrors='';broker.stderr.on('data',b=>brokerErrors+=b);await ready(broker,/"status":"READY"/).catch(e=>{throw Error(e.message+' '+brokerErrors);});
  const now=Date.now(),grant=f.grant({issuedAt:new Date(now-1000).toISOString(),notBefore:new Date(now-1000).toISOString(),expiresAt:new Date(now+600000).toISOString()});
  const expired=f.grant({issuedAt:new Date(now-600000).toISOString(),notBefore:new Date(now-600000).toISOString(),expiresAt:new Date(now-1000).toISOString()});
  const body={grant,payload:grant.proposedAction.canonicalArguments};
  for(const [from,to] of [[tls.caPath,'ca.crt'],[tls.client.certPath,'agent.crt'],[tls.client.keyPath,'agent.key'],[resolve('scripts/openshell-broker-client.mjs'),'openshell-broker-client.mjs'],[resolve('scripts/openshell-agent-probe.mjs'),'openshell-agent-probe.mjs']])cpSync(from,join(bundle,to));
  writeFileSync(join(bundle,'client.json'),JSON.stringify({host,port,caPath:'ca.crt',certPath:'agent.crt',keyPath:'agent.key',serverFingerprint}));
  writeFileSync(join(bundle,'body.json'),JSON.stringify(body));writeFileSync(join(bundle,'expired.json'),JSON.stringify({grant:expired,payload:expired.proposedAction.canonicalArguments}));
  // Native gateway uses its own disposable TLS identity. No auth/TLS bypass.
  const gw=join(root,'gateway');mkdirSync(gw,{mode:0o700});const gt=custodyTlsFixture(gw);
  run('openssl',['req','-new','-key',gt.client.keyPath,'-out',join(gw,'operator.csr'),'-subj','/CN=atg-ci/OU=operator']);
  run('openssl',['x509','-req','-in',join(gw,'operator.csr'),'-CA',gt.caPath,'-CAkey',gt.caKey,'-set_serial','0x'+randomBytes(16).toString('hex'),'-out',gt.client.certPath,'-days','1','-extfile',join(gw,'agent.ext')]);
  const mtls=join(env.XDG_CONFIG_HOME,'openshell/gateways/atg-ci/mtls');mkdirSync(mtls,{recursive:true,mode:0o700});
  for(const [from,to] of [[gt.caPath,'ca.crt'],[gt.client.certPath,'tls.crt'],[gt.client.keyPath,'tls.key']])cpSync(from,join(mtls,to));
  const gatewayConfig=join(gw,'gateway.toml');writeFileSync(gatewayConfig,'[openshell]\nversion = 2\n[openshell.gateway]\ncompute_driver = "docker"\nguest_tls_ca = '+JSON.stringify(gt.caPath)+'\n[openshell.drivers.docker]\nsupervisor_network_mode = "host"\nimage_pull_policy = "if_not_present"\n');
  const log=join(root,'gateway.log'),{openSync,closeSync}=await import('node:fs'),fd=openSync(log,'wx',0o600);
  const gp=spawn(gateway,['--config',gatewayConfig,'--name','atg-ci','--tls-cert',gt.server.certPath,'--tls-key',gt.server.keyPath,'--tls-client-ca',gt.caPath,'--enable-mtls-auth','true','--enable-operator-auth','true'],{env,stdio:['ignore',fd,fd]});closeSync(fd);children.push(gp);
  // Bounded readiness polling only opens an authenticated TLS connection.
  const tlsReady=()=>new Promise(ok=>{const s=connect({host:'127.0.0.1',port:17670,ca:readFileSync(gt.caPath),cert:readFileSync(gt.client.certPath),key:readFileSync(gt.client.keyPath),rejectUnauthorized:true},()=>{s.destroy();ok(true);});s.setTimeout(500,()=>{s.destroy();ok(false);});s.on('error',()=>ok(false));});
  let connected=false;for(let i=0;i<30;i++){if(await tlsReady()){connected=true;break;}await new Promise(ok=>setTimeout(ok,1000));if(gp.exitCode!==null)break;}
  if(!connected)throw Error('GATEWAY_START_FAILED '+readFileSync(log,'utf8').slice(-8000));
  openshell(['gateway','add','https://127.0.0.1:17670','--local','--name','atg-ci']);
  receipt.gatewayStatus=openshell(['status']);
  const image='atg-openshell-agent:synthetic';
  const imageContext=join(root,'image-context');mkdirSync(imageContext);const dockerfile=join(imageContext,'Dockerfile');writeFileSync(dockerfile,'FROM node:24-bookworm-slim\nRUN mkdir -p /sandbox && chmod 777 /sandbox\nWORKDIR /sandbox\nCMD ["sleep","infinity"]\n');
  run('docker',['build','-t',image,'-f',dockerfile,imageContext],{timeout:180000,stdio:['ignore','pipe','pipe']});
  receipt.agentImage=JSON.parse(run('docker',['image','inspect',image,'--format','{{json .Id}}']));
  const policy=join(root,'policy.yaml');writeFileSync(policy,`version: 1\nfilesystem_policy:\n  include_workdir: true\n  read_only: [/usr, /lib, /lib64, /etc, /bin]\n  read_write: [/sandbox, /tmp]\nlandlock:\n  compatibility: hard_requirement\nnetwork_policies:\n  atg_only:\n    endpoints:\n      - host: "${host}"\n        port: ${port}\n        protocol: tcp\n        tls: skip\n    binaries:\n      - path: /usr/local/bin/node\n`);
  await cases('real OpenShell workload created with no provider or arbitrary mounts',()=>{const r=openshell(['sandbox','create','--name',name,'--from',image,'--policy',policy,'--no-auto-providers','--detach','--','sleep','infinity']);sandboxCreated=true;return r;});
  openshell(['sandbox','upload',name,bundle,'/sandbox/client','--no-git-ignore']);
  const probe=mode=>new Promise((ok,bad)=>{
    const p=spawn(cli,['sandbox','exec',name,'--no-login-shell','--timeout','60','--','/usr/local/bin/node','/sandbox/client/openshell-agent-probe.mjs','/sandbox/client',mode],{env,stdio:['ignore','pipe','pipe']});children.push(p);
    let out='',err='';const timer=setTimeout(()=>{p.kill('SIGTERM');bad(Error('PROBE_DEADLINE'));},90000);
    p.stdout.on('data',b=>out+=b);p.stderr.on('data',b=>err+=b);
    p.once('error',e=>{clearTimeout(timer);bad(e);});p.once('exit',code=>{clearTimeout(timer);if(code!==0){bad(Error('PROBE_FAILED '+err+' '+out));return;}try{ok(JSON.parse(out.trim().split('\n').at(-1)));}catch(e){bad(e);}});
  });
  await cases('actual workload exact-action and replay matrix',()=>probe('matrix'));
  let decoyRequests=0;
  decoy=createServer({ca:readFileSync(caPath),cert:readFileSync(serverCertPath),key:readFileSync(serverKeyPath),requestCert:true,rejectUnauthorized:true},(req,res)=>{decoyRequests++;req.resume();res.end(JSON.stringify({schema:'atg.openshell-broker.synthetic.v1',syntheticOnly:true,productionReady:false,outcome:'REJECTED',reason:'DECOY_REACHABLE',automaticRetryPermitted:false,receipt:null}));});
  decoy.on('tlsClientError',()=>{});await new Promise((ok,bad)=>{decoy.once('error',bad);decoy.listen(port+1,host,ok);});
  const directConfig={host,port:port+1,caPath:tls.caPath,certPath:tls.client.certPath,keyPath:tls.client.keyPath,serverFingerprint};
  assert.equal((await brokerRequest(directConfig,body)).reason,'DECOY_REACHABLE');assert.equal(decoyRequests,1);
  await cases('unlisted live decoy port refused by the runtime',async()=>{const r=await probe('network-denied');assert.equal(decoyRequests,1,'Sandbox must not reach the listening decoy');return r;});
  const db=new DatabaseSync(f.path,{readOnly:true});const version=db.prepare('SELECT version FROM resource').get().version;db.close();assert.equal(version,2);receipt.authoritativeResourceVersion=version;
  await cases('broker outage fails closed without fallback',async()=>{const stopped=once(broker,'exit');broker.kill('SIGTERM');await stopped;return probe('outage');});
  receipt.sandbox=openshell(['sandbox','get',name,'-o','json']);
  receipt.status='PASS_SCOPED';
}catch(error){receipt.status='FAIL';receipt.failure=String(error.stack??error).slice(0,12000);process.exitCode=1;}
finally {
  if(sandboxCreated){try{openshell(['sandbox','delete',name]);}catch{receipt.cleanup='Sandbox deletion not confirmed; inspect this disposable runner.';}}
  for(const p of children)if(p.exitCode===null)p.kill('SIGTERM');
  decoy?.closeAllConnections();decoy?.close();
  persist();
}
