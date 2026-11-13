/**
 * Optional loopback mTLS checkpoint research service.
 * Two independent service processes/UIDs can be used by a test harness,
 * but a common root administrator remains trusted. NOT production custody.
 */
import {createServer, connect, checkServerIdentity} from 'node:tls';
import {X509Certificate} from 'node:crypto';
import {readFileSync} from 'node:fs';

const MAX=4096, PIN=/^(?:[A-F0-9]{2}:){31}[A-F0-9]{2}$/;
const unavailable=()=>({outcome:'UNKNOWN',reason:'CHECKPOINT_UNAVAILABLE_OR_UNAUTHENTICATED',
  effectPermittedByAnchor:false,automaticRetryPermitted:false});

export async function startSyntheticCheckpointService({anchor,caPath,certPath,keyPath,writerFingerprint}) {
  if (!anchor || typeof anchor.reserve!=='function' || !PIN.test(writerFingerprint))
    throw Error('CHECKPOINT_SERVICE_CONFIGURATION_INVALID');
  const server=createServer({
    ca:readFileSync(caPath),cert:readFileSync(certPath),key:readFileSync(keyPath),
    requestCert:true,rejectUnauthorized:true,minVersion:'TLSv1.3',handshakeTimeout:3000,
  },socket=>{
    const cert=socket.getPeerCertificate();
    if (!socket.authorized || !cert?.raw ||
        new X509Certificate(cert.raw).fingerprint256!==writerFingerprint){socket.destroy();return;}
    let data=Buffer.alloc(0),received=false;
    socket.setTimeout(3000,()=>socket.destroy());
    socket.on('error',()=>{});
    socket.on('data',chunk=>{
      if(received || data.length+chunk.length>MAX){socket.destroy();return;}
      data=Buffer.concat([data,chunk]);
      const nl=data.indexOf(10);
      if(nl<0)return;
      received=true;
      if(nl!==data.length-1){socket.destroy();return;}
      let response;
      try {
        const frame=JSON.parse(data.subarray(0,nl).toString('utf8'));
        if(!frame || Object.keys(frame).sort().join(',')!=='proposal,type' || frame.type!=='reserve')
          throw Error();
        response=anchor.reserve(frame.proposal);
      } catch {response=unavailable();}
      socket.end(JSON.stringify(response)+'\n');
    });
  });
  const sockets=new Set();
  server.on('connection',s=>{sockets.add(s);s.on('close',()=>sockets.delete(s));s.on('error',()=>{});});
  server.on('tlsClientError',()=>{});
  server.maxConnections=16;
  await new Promise((ok,bad)=>{server.once('error',bad);server.listen(0,'127.0.0.1',ok);});
  let shutdown;
  return {port:server.address().port,close:()=>{
    if(shutdown)return shutdown;
    shutdown=new Promise(ok=>{for(const s of sockets)s.destroy();server.close(ok);});
    return shutdown;
  }};

}

export async function reserveViaCheckpoint(config,proposal) {
  if (!config || config.host!=='127.0.0.1' || !Number.isInteger(config.port) ||
      config.port<1 || config.port>65535 || !PIN.test(config.serverFingerprint))return unavailable();
  const message=JSON.stringify({type:'reserve',proposal})+'\n';
  if(Buffer.byteLength(message)>MAX)return unavailable();
  return await new Promise(ok=>{
    let done=false,socket,buffer=Buffer.alloc(0);
    const finish=r=>{if(done)return;done=true;clearTimeout(timer);socket?.destroy();ok(r);};
    const timer=setTimeout(()=>finish(unavailable()),4000);
    try {
      socket=connect({host:config.host,port:config.port,ca:readFileSync(config.caPath),
        cert:readFileSync(config.certPath),key:readFileSync(config.keyPath),
        minVersion:'TLSv1.3',rejectUnauthorized:true,
        checkServerIdentity:(host,cert)=>{
          const error=checkServerIdentity(host,cert);if(error)return error;
          if(new X509Certificate(cert.raw).fingerprint256!==config.serverFingerprint)
            return Error('CHECKPOINT_SERVER_PIN_MISMATCH');
        }},()=>{if(!socket.authorized)return finish(unavailable());socket.write(message);});
      socket.on('data',chunk=>{if(buffer.length+chunk.length>MAX)return finish(unavailable());buffer=Buffer.concat([buffer,chunk]);});
      socket.on('end',()=>{
        try {
          if(buffer.length===0 || buffer.at(-1)!==10 || buffer.subarray(0,-1).includes(10))throw Error();
          const result=JSON.parse(buffer.subarray(0,-1).toString('utf8'));
          if(result?.schema!=='atg.consumption-anchor.synthetic.v1' || result.syntheticOnly!==true ||
             !['RESERVED','REJECTED','UNKNOWN'].includes(result.outcome) ||
             result.effectPermittedByAnchor!==(result.outcome==='RESERVED') ||
             result.automaticRetryPermitted!==false)throw Error();
          finish(result);
        }catch{finish(unavailable());}
      });
      socket.on('error',()=>finish(unavailable()));
      socket.on('close',()=>{if(!done)finish(unavailable());});
    }catch{finish(unavailable());}
  });
}
