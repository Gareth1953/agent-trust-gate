// Portable synthetic client for an OpenShell workload. No keys/signing fallback.
import { request } from 'node:https';
import { checkServerIdentity } from 'node:tls';
import { X509Certificate } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function canonicalWire(value) {
  if(value===null||typeof value!=='object')return JSON.stringify(value);
  if(Array.isArray(value))return '['+value.map(canonicalWire).join(',')+']';
  return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonicalWire(value[k])).join(',')+'}';
}
export async function brokerRequest(c,body,{path='/v1/synthetic-record/commit',raw=false}={}) {
  const unknown={schema:'atg.openshell-broker.synthetic.v1',syntheticOnly:true,productionReady:false,outcome:'UNKNOWN',reason:'BROKER_UNAVAILABLE_OR_UNAUTHENTICATED',automaticRetryPermitted:false,receipt:null};
  return new Promise(ok=>{
    let req,done=false;const finish=r=>{if(done)return;done=true;clearTimeout(deadline);req?.destroy();ok(r);};
    const deadline=setTimeout(()=>finish(unknown),4000);
    try {
      const data=raw?body:canonicalWire(body);
      if(typeof data!=='string'||Buffer.byteLength(data)>65536)throw Error();
      if(!c||!Number.isInteger(c.port)||c.port<1||c.port>65535||!/^([A-F0-9]{2}:){31}[A-F0-9]{2}$/.test(c.serverFingerprint))throw Error();
      req=request({host:c.host,port:c.port,path,method:'POST',ca:readFileSync(c.caPath),
        ...(c.certPath?{cert:readFileSync(c.certPath),key:readFileSync(c.keyPath)}:{}),rejectUnauthorized:true,minVersion:'TLSv1.3',agent:false,
        headers:{'content-type':'application/json','content-length':Buffer.byteLength(data)},
        checkServerIdentity:(host,cert)=>checkServerIdentity(host,cert)||(new X509Certificate(cert.raw).fingerprint256!==c.serverFingerprint?Error('BROKER_PIN_MISMATCH'):undefined)},res=>{
          let b=Buffer.alloc(0);res.on('data',chunk=>{if(b.length+chunk.length>65536){finish(unknown);return;}b=Buffer.concat([b,chunk]);});
          res.on('end',()=>{try{const r=JSON.parse(b.toString('utf8'));
            if(r.schema!=='atg.openshell-broker.synthetic.v1'||r.syntheticOnly!==true||r.productionReady!==false||r.automaticRetryPermitted!==false
              ||!['EXECUTED','REJECTED','UNKNOWN','NOT_RECORDED'].includes(r.outcome)||typeof r.reason!=='string')throw Error();
            if(r.outcome==='EXECUTED') {
              const pass=body?.grant?.issuance?.gatePass,payload=body?.payload,proof=r.receipt;
              if(raw||res.statusCode!==200||!pass||!payload||!proof||Object.keys(proof).sort().join(',')!=='actionDigest,gatePassId,resourceVersion'
                ||proof.gatePassId!==pass.gatePassId||proof.actionDigest!==pass.action.actionDigest||proof.resourceVersion!==payload.expectedVersion+1
                ||r.domainId!==pass.action.operatingEnvironment.replace('custody-witness:',''))throw Error();
            }
            finish(r);
          }catch{finish(unknown);}});res.on('error',()=>finish(unknown));
        });
      req.on('error',()=>finish(unknown));req.end(data);
    }catch{finish(unknown);}
  });
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const [configFile,bodyFile]=process.argv.slice(2);
  if(!configFile||!bodyFile)throw Error('CLIENT_CONFIG_AND_BODY_REQUIRED');
  console.log(JSON.stringify(await brokerRequest(JSON.parse(readFileSync(configFile,'utf8')),JSON.parse(readFileSync(bodyFile,'utf8')))));
}
