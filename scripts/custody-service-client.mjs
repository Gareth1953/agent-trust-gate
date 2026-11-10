// Single bounded attempt, no local fallback or automatic retry.
import { connect, checkServerIdentity } from 'node:tls';
import { readFileSync } from 'node:fs';
import { X509Certificate } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const MAX_BYTES=64*1024;
export async function custodyRequest(config,message,{raw=false}={}) {
  const unavailable={outcome:'UNKNOWN',reason:'CUSTODY_UNAVAILABLE_OR_UNAUTHENTICATED',automaticRetryPermitted:false,receipt:null};
  let text;
  try {text=raw?message:JSON.stringify(message);if(typeof text!=='string'||Buffer.byteLength(text)+1>MAX_BYTES)throw Error();}
  catch{return {...unavailable,outcome:'REJECTED',reason:'CLIENT_FRAME_INVALID'};}
  if(!config || config.host!=='127.0.0.1' || !Number.isInteger(config.port) || config.port<1 || config.port>65535
    || !/^(?:[A-F0-9]{2}:){31}[A-F0-9]{2}$/.test(config.serverFingerprint))return unavailable;
  return new Promise(ok=>{
    let socket,done=false,buffer=Buffer.alloc(0);
    const finish=result=>{if(done)return;done=true;clearTimeout(deadline);socket?.destroy();ok(result);};
    const deadline=setTimeout(()=>finish(unavailable),4000);
    try {
      socket=connect({host:config.host,port:config.port,ca:readFileSync(config.caPath),
        ...(config.certPath?{cert:readFileSync(config.certPath),key:readFileSync(config.keyPath)}:{}),
        rejectUnauthorized:true,minVersion:'TLSv1.3',checkServerIdentity:(host,cert)=>{
          const error=checkServerIdentity(host,cert);if(error)return error;
          if(new X509Certificate(cert.raw).fingerprint256!==config.serverFingerprint)return Error('CUSTODY_SERVER_PIN_MISMATCH');
        }},()=>{if(!socket.authorized){finish(unavailable);return;}socket.write(text+'\n');});
      socket.on('data',chunk=>{if(buffer.length+chunk.length>MAX_BYTES){finish(unavailable);return;}buffer=Buffer.concat([buffer,chunk]);});
      socket.on('end',()=>{try{
        if(!buffer.length || buffer.at(-1)!==10 || buffer.subarray(0,-1).includes(10))throw Error();
        const result=JSON.parse(buffer.toString('utf8'));
        if(!result || !['EXECUTED','REJECTED','UNKNOWN','NOT_RECORDED'].includes(result.outcome) || typeof result.reason!=='string')throw Error();
        // Transport/parser refusals also never grant retry permission.
        finish({...result,automaticRetryPermitted:false});
      }catch{finish(unavailable);}});
      socket.on('error',()=>finish(unavailable));socket.on('close',()=>{if(!done)finish(unavailable);});
    }catch{finish(unavailable);}
  });
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  let buffer=Buffer.alloc(0);
  try {
    if(process.argv.length!==3)throw Error('CLIENT_CONFIG_REQUIRED');
    for await(const chunk of process.stdin){if(buffer.length+chunk.length>MAX_BYTES)throw Error('CLIENT_FRAME_INVALID');buffer=Buffer.concat([buffer,chunk]);}
    const message=JSON.parse(buffer.toString('utf8'));
    console.log(JSON.stringify(await custodyRequest(JSON.parse(readFileSync(process.argv[2],'utf8')),message)));
  }catch{console.log(JSON.stringify({outcome:'UNKNOWN',reason:'CLIENT_INPUT_OR_CONFIG_INVALID',automaticRetryPermitted:false,receipt:null}));process.exitCode=1;}
}
