// Optional, bounded synthetic HTTPS destination. No external executor or signer.
import { createServer } from 'node:https';
import { readFileSync, lstatSync } from 'node:fs';
import { X509Certificate } from 'node:crypto';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { protectedPath, rootCodeTree } from './custody-service.mjs';
import { BROKER_MAX_BYTES, brokerRefusal, handleBrokerRequest } from '../dist/src/openshell-transaction-broker.js';
import { CustodyWitness } from '../dist/src/custody-witness.js';

export async function startSyntheticBroker({ writer, host='127.0.0.1', port=0, ca, cert, key, clientFingerprint }) {
  if (!/^(?:[A-F0-9]{2}:){31}[A-F0-9]{2}$/.test(clientFingerprint)) throw Error('BROKER_CLIENT_PIN_REQUIRED');
  // Private-interface binding is only for disposable host/container integration.
  if (!/^(127\.0\.0\.1|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(1[6-9]|2\d|3[01])(?:\.\d{1,3}){2})$/.test(host)) throw Error('BROKER_PRIVATE_BIND_REQUIRED');
  const sockets=new Set();
  const server=createServer({ca,cert,key,requestCert:true,rejectUnauthorized:true,minVersion:'TLSv1.3',handshakeTimeout:3000}, (req,res)=>{
    const send=(status,body)=>{if(res.destroyed)return;res.writeHead(status,{'content-type':'application/json','cache-control':'no-store','connection':'close'});res.end(JSON.stringify(body));};
    if (!req.socket.authorized || new X509Certificate(req.socket.getPeerCertificate().raw).fingerprint256!==clientFingerprint) {
      send(403,brokerRefusal('BROKER_CLIENT_REFUSED'));return;
    }
    if(req.headers['content-type']!=='application/json' || req.headers['content-encoding']!==undefined) {send(415,brokerRefusal('BROKER_CONTENT_TYPE_REFUSED'));req.resume();return;}
    if(req.rawHeaders.filter((_,i)=>i%2===0).filter(x=>x.toLowerCase()==='content-type').length!==1) {send(400,brokerRefusal('BROKER_HEADERS_INVALID'));req.resume();return;}
    let data=Buffer.alloc(0),done=false;
    req.on('data',chunk=>{
      if(done)return;
      if(data.length+chunk.length>BROKER_MAX_BYTES){done=true;send(413,brokerRefusal('BROKER_BODY_TOO_LARGE'));req.resume();return;}
      data=Buffer.concat([data,chunk]);
    });
    req.on('end',()=>{if(done)return;done=true;const r=handleBrokerRequest(writer,req.method??'',req.url??'',data);send(r.outcome==='EXECUTED'?200:r.outcome==='UNKNOWN'?503:403,r);});
    req.on('error',()=>{done=true;});
  });
  server.maxConnections=32;server.requestTimeout=3000;server.headersTimeout=3000;server.keepAliveTimeout=1;
  server.on('connection',s=>{sockets.add(s);s.setTimeout(3000,()=>s.destroy());s.on('error',()=>{});s.on('close',()=>sockets.delete(s));});
  server.on('tlsClientError',()=>{});
  server.on('checkContinue',(_req,res)=>{res.writeHead(417,{'connection':'close'});res.end();});
  await new Promise((ok,bad)=>{server.once('error',bad);server.listen(port,host,ok);});
  return {port:server.address().port,close:()=>new Promise(ok=>{for(const s of sockets)s.destroy();server.close(ok);})};
}

export function loadBrokerConfig(path) {
  if(process.platform!=='linux'||!process.getuid||process.getuid()===0)throw Error('BROKER_NONROOT_LINUX_REQUIRED');
  const status=readFileSync('/proc/self/status','utf8');
  if(!/^NoNewPrivs:\s+1$/m.test(status)||!['CapInh','CapPrm','CapEff','CapBnd','CapAmb'].every(k=>new RegExp('^'+k+':\\s+0+$','m').test(status)))throw Error('BROKER_PRIVILEGES_NOT_DROPPED');
  protectedPath(path,[0]);const c=JSON.parse(readFileSync(path,'utf8'));
  if(!c || Object.keys(c).sort().join(',')!=='caPath,clientFingerprint,codeRoot,databasePath,host,port,schema,serverCertPath,serverKeyPath,serviceUid,trustPath'
    || c.schema!=='atg.openshell-broker.config.synthetic.v1'||c.serviceUid!==process.getuid()||!Number.isInteger(c.port)||c.port<1||c.port>65535)throw Error('BROKER_CONFIG_INVALID');
  for(const p of [process.execPath,fileURLToPath(import.meta.url),c.caPath,c.serverCertPath,c.trustPath])protectedPath(p,[0]);
  rootCodeTree(dirname(fileURLToPath(import.meta.url)));
  rootCodeTree(c.codeRoot);
  for(const p of [c.serverKeyPath,c.databasePath])protectedPath(p,[c.serviceUid,0],{privateFile:true});
  protectedPath(dirname(c.databasePath),[c.serviceUid,0],{privateFile:true,directory:true});
  if(lstatSync(c.databasePath).uid!==c.serviceUid || lstatSync(dirname(c.databasePath)).uid!==c.serviceUid)throw Error('BROKER_WRITER_OWNERSHIP_REQUIRED');
  return c;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {
    if(process.argv.length!==3)throw Error('BROKER_CONFIG_PATH_REQUIRED');const c=loadBrokerConfig(process.argv[2]);
    const writer=new CustodyWitness({path:c.databasePath,trust:JSON.parse(readFileSync(c.trustPath,'utf8'))});
    const broker=await startSyntheticBroker({writer,host:c.host,port:c.port,ca:readFileSync(c.caPath),cert:readFileSync(c.serverCertPath),key:readFileSync(c.serverKeyPath),clientFingerprint:c.clientFingerprint});
    console.log(JSON.stringify({status:'READY',port:broker.port,syntheticOnly:true}));
    const stop=async()=>{await broker.close();writer.close();process.exit(0);};process.once('SIGTERM',stop);process.once('SIGINT',stop);
  }catch(error){console.error(String(error.message));process.exitCode=1;}
}
