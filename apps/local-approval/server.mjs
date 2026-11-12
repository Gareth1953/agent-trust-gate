// SOURCE-ONLY LOCAL SYNTHETIC EVALUATION. Not an Internet-facing identity service.
import { createServer } from 'node:http';
import { randomBytes, randomUUID, generateKeyPairSync, createHash, timingSafeEqual, createPublicKey } from 'node:crypto';
import { mkdirSync, writeFileSync, readFileSync, unlinkSync, lstatSync } from 'node:fs';
import { isAbsolute, join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { generateRegistrationOptions, verifyRegistrationResponse } from '@simplewebauthn/server';
import { convertCOSEtoPKCS } from '@simplewebauthn/server/helpers';
import { CustodyWitness } from '../../dist/src/custody-witness.js';
import { verifyPasskeyAssertion, validatePasskeyTrust } from '../../dist/src/passkey-transaction-approval.js';
import { createBaseExactActionInput, issueExactActionGatePass } from '../../dist/src/exact-action-gatepass.js';

const staticRoot=join(dirname(fileURLToPath(import.meta.url)),'public');
const token=()=>randomBytes(32).toString('base64url');
const hash=s=>createHash('sha256').update(s).digest('hex');
const minutes=10*60_000;
const fail=code=>{throw Error(code);};
const parse=s=>JSON.parse(s);
const fixedPayload=Object.freeze({tenantId:'synthetic-tenant-A',resourceId:'synthetic-order-001',expectedVersion:1,
  value:'approved',payeeReference:'fixture-bank-A',amountMinorUnits:400000,currency:'GBP'});

function privateDirectory(root){
  if(!isAbsolute(root))fail('ABSOLUTE_STATE_DIRECTORY_REQUIRED');
  const stat=lstatSync(root);
  if(!stat.isDirectory() || stat.isSymbolicLink())fail('STATE_DIRECTORY_INVALID');
  if(process.platform!=='win32' && ((stat.mode & 0o077)!==0 || stat.uid!==process.getuid()))fail('PRIVATE_STATE_DIRECTORY_REQUIRED');
}
function privateFile(path){
  const stat=lstatSync(path);
  if(!stat.isFile() || stat.isSymbolicLink() || stat.nlink!==1)fail('STATE_FILE_INVALID');
  if(process.platform!=='win32' && ((stat.mode & 0o077)!==0 || stat.uid!==process.getuid()))fail('PRIVATE_STATE_FILE_REQUIRED');
}
export function setupApprovalApp(root,{port=8796}={}){
  if(!isAbsolute(root) || !Number.isInteger(port) || port<1024 || port>65535)fail('NEW_ABSOLUTE_DIRECTORY_AND_VALID_PORT_REQUIRED');
  // Exclusive creation, never clear/reuse an old evaluation or its audit.
  mkdirSync(root,{mode:0o700});privateDirectory(root);
  const path=join(root,'approval.sqlite');writeFileSync(path,'',{flag:'wx',mode:0o600});
  const db=new DatabaseSync(path);
  try{
    db.exec(`PRAGMA journal_mode=DELETE; PRAGMA synchronous=FULL;
      CREATE TABLE meta(k TEXT PRIMARY KEY,v TEXT NOT NULL) STRICT;
      CREATE TABLE sessions(h TEXT PRIMARY KEY,csrf TEXT NOT NULL,kind TEXT NOT NULL,expires INTEGER NOT NULL) STRICT;
      CREATE TABLE challenges(h TEXT PRIMARY KEY,kind TEXT NOT NULL,challenge TEXT NOT NULL,expires INTEGER NOT NULL,used INTEGER NOT NULL) STRICT;
      CREATE TABLE intents(id TEXT PRIMARY KEY,h TEXT NOT NULL,grant_json TEXT NOT NULL,prepared_json TEXT NOT NULL,status TEXT NOT NULL,result_json TEXT) STRICT;`);
    const pair=generateKeyPairSync('ed25519'),bootstrap=token();
    const entries={schema:'atg.local-approval.synthetic.v1',port:String(port),status:'SETUP',principal:randomUUID(),userHandle:token(),
      domain:randomUUID(),issuerKeyId:randomUUID(),issuerPublic:pair.publicKey.export({type:'spki',format:'pem'}).toString(),
      issuerPrivate:pair.privateKey.export({type:'pkcs8',format:'pem'}).toString(),bootstrapHash:hash(bootstrap),
      bootstrapExpires:String(Date.now()+30*60_000),bootstrapFailures:'0',counter:'0'};
    const put=db.prepare('INSERT INTO meta VALUES(?,?)');for(const [k,v] of Object.entries(entries))put.run(k,v);
    writeFileSync(join(root,'enrollment-code.txt'),bootstrap+'\n',{flag:'wx',mode:0o600});
  }finally{db.close();}
  return {url:`http://localhost:${port}`,stateDirectory:root,codeFile:join(root,'enrollment-code.txt')};
}

export function openApprovalApp(root){
  privateDirectory(root);const path=join(root,'approval.sqlite');privateFile(path);
  const lock=join(root,'server.lock');writeFileSync(lock,String(process.pid),{flag:'wx',mode:0o600});
  const db=new DatabaseSync(path);db.exec('PRAGMA synchronous=FULL; PRAGMA busy_timeout=3000;');
  const get=k=>db.prepare('SELECT v FROM meta WHERE k=?').get(k)?.v;
  const put=(k,v)=>db.prepare('INSERT INTO meta VALUES(?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v').run(k,String(v));
  if(get('schema')!=='atg.local-approval.synthetic.v1'){db.close();fail('STATE_SCHEMA_INVALID');}
  const port=Number(get('port')),origin=`http://localhost:${port}`,host=`localhost:${port}`;
  if(!Number.isInteger(port) || port<1024 || port>65535){db.close();fail('STATE_PORT_INVALID');}
  // Every process start invalidates all sessions and in-flight login ceremonies.
  db.exec('DELETE FROM sessions; DELETE FROM challenges;');
  db.prepare("UPDATE intents SET status='UNKNOWN' WHERE status='SUBMITTING'").run();
  function tx(fn){db.exec('BEGIN IMMEDIATE');try{const r=fn();db.exec('COMMIT');return r;}catch(e){db.exec('ROLLBACK');throw e;}}
  function ready(){if(get('status')!=='READY')fail('APP_NOT_READY_OR_STOPPED');}
  function trust(){return parse(get('trust'));}
  function writer(){ready();privateFile(join(root,'witness.sqlite'));return new CustodyWitness({path:join(root,'witness.sqlite'),trust:trust()});}
  function withWriter(fn){const w=writer();try{return fn(w);}finally{w.close();}}
  function session(req){const raw=req.headers.cookie??'';const matches=raw.split(';').map(s=>s.trim()).filter(s=>s.startsWith('atg_local_session='));
    if(matches.length!==1)return null;const value=matches[0].slice(18);if(!/^[\w-]{43}$/.test(value))return null;
    const row=db.prepare('SELECT * FROM sessions WHERE h=? AND expires>?').get(hash(value),Date.now());return row??null;}
  function newSession(res,kind,old){
    if(old){db.prepare('DELETE FROM sessions WHERE h=?').run(old.h);db.prepare('DELETE FROM challenges WHERE h=?').run(old.h);}
    db.prepare('DELETE FROM sessions WHERE expires<=?').run(Date.now());
    if(Number(db.prepare('SELECT count(*) AS n FROM sessions').get().n)>=32)fail('SESSION_LIMIT');
    const value=token(),row={h:hash(value),csrf:token(),kind,expires:Date.now()+minutes};
    db.prepare('INSERT INTO sessions VALUES(?,?,?,?)').run(row.h,row.csrf,row.kind,row.expires);
    res.setHeader('Set-Cookie',`atg_local_session=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=600`);return row;
  }
  function requireSession(req,kind){const s=session(req);if(!s || (kind && s.kind!==kind))fail('SIGN_IN_REQUIRED');
    if(req.headers['x-atg-csrf']!==s.csrf)fail('CSRF_REFUSED');return s;}
  function freshSession(s,kind){const live=db.prepare('SELECT * FROM sessions WHERE h=? AND expires>?').get(s.h,Date.now());
    if(!live || live.kind!==kind)fail('SESSION_EXPIRED');return live;}
  function challenge(s,kind,value){db.prepare('INSERT INTO challenges VALUES(?,?,?,?,0) ON CONFLICT(h) DO UPDATE SET kind=excluded.kind,challenge=excluded.challenge,expires=excluded.expires,used=0').run(s.h,kind,value,Date.now()+120000);}
  function claim(s,kind){return tx(()=>{const c=db.prepare('SELECT * FROM challenges WHERE h=? AND kind=? AND used=0 AND expires>?').get(s.h,kind,Date.now());
    if(!c)fail('CHALLENGE_USED_OR_EXPIRED');db.prepare('UPDATE challenges SET used=1 WHERE h=?').run(s.h);return c;});}
  function currentCounter(){
    const w=new DatabaseSync(join(root,'witness.sqlite'),{readOnly:true});
    try{return Math.max(Number(get('counter')),Number(w.prepare('SELECT counter FROM approval_counter WHERE id=1').get().counter));}finally{w.close();}
  }
  function assertion(body){const c=body?.credential;if(!c || c.type!=='public-key' || c.id!==c.rawId || c.id!==trust().passkeyApproval.credentialId)fail('CREDENTIAL_REFUSED');
    const r=c.response;return {credentialId:c.id,clientDataJSON:r?.clientDataJSON,authenticatorData:r?.authenticatorData,signature:r?.signature,userHandle:r?.userHandle??null};}
  function exactBody(body,keys){if(!body || typeof body!=='object' || Array.isArray(body) || Object.keys(body).sort().join(',')!==keys.sort().join(','))fail('REQUEST_FIELDS_REFUSED');}
  function storedIntent(body){const row=db.prepare('SELECT * FROM intents WHERE id=?').get(body.id);if(!row)fail('INTENT_NOT_FOUND');return row;}
  function grant(){const now=Date.now();const t=trust();const action=createBaseExactActionInput({issuerIdentity:t.issuerIdentity,issuerKeyId:t.issuerKeyId,
      verificationProfile:`custody-profile:${t.domainId}`,operatingEnvironment:`custody-witness:${t.domainId}`,operatorIdentity:t.passkeyApproval.principalId,
      toolIdentity:'atg.custody.synthetic-record',toolSchemaVersion:'1.0.0',operationName:'record_synthetic_order',targetIdentity:fixedPayload.resourceId,
      amount:4000,currency:'GBP',canonicalArguments:{...fixedPayload},issuedAt:new Date(now).toISOString(),notBefore:new Date(now).toISOString(),
      expiresAt:new Date(now+120000).toISOString(),nonce:randomUUID(),idempotencyKey:randomUUID()});
    return {issuance:issueExactActionGatePass(action,{privateKeyPem:get('issuerPrivate')}),proposedAction:action};}
  function publicIntent(row){return {id:row.id,status:row.status,prepared:parse(row.prepared_json),result:row.result_json?parse(row.result_json):null};}
  async function api(req,res,body){
    const route=req.url;
    if(req.method==='GET' && route==='/api/status'){
      const s=session(req)??newSession(res,'ANON');const authenticated=s.kind==='AUTH' && get('status')==='READY';
      return {status:get('status'),csrf:s.csrf,authenticated,enrollmentAuthorized:s.kind==='ENROLL',origin,
        intent:authenticated?(()=>{const r=db.prepare('SELECT * FROM intents ORDER BY rowid DESC LIMIT 1').get();return r?publicIntent(r):null;})():null};
    }
    if(req.method!=='POST')fail('ROUTE_REFUSED');
    if(route==='/api/enroll/authorize'){
      exactBody(body,['code']);const s=requireSession(req,'ANON');
      tx(()=>{if(get('status')!=='SETUP' || Number(get('bootstrapExpires'))<=Date.now() || Number(get('bootstrapFailures'))>=5)fail('ENROLLMENT_UNAVAILABLE');
        const supplied=typeof body.code==='string' && /^[\w-]{43}$/.test(body.code)?hash(body.code):hash('invalid');
        const ok=timingSafeEqual(Buffer.from(supplied),Buffer.from(get('bootstrapHash')));
        put('bootstrapFailures',Number(get('bootstrapFailures'))+1);if(!ok)return;
        put('bootstrapFailures',0);});
      if(typeof body.code!=='string' || hash(body.code)!==get('bootstrapHash'))fail('ENROLLMENT_REFUSED');
      newSession(res,'ENROLL',s);return {authorized:true};
    }
    if(route==='/api/enroll/options'){
      exactBody(body,[]);const s=requireSession(req,'ENROLL');if(get('status')!=='SETUP' || Number(get('bootstrapExpires'))<=Date.now())fail('ENROLLMENT_UNAVAILABLE');
      const options=await generateRegistrationOptions({rpName:'ATG local synthetic approval',rpID:'localhost',userName:'Local evaluation approver',userDisplayName:'Local evaluation approver',
        userID:Buffer.from(get('userHandle'),'base64url'),supportedAlgorithmIDs:[-7],attestationType:'none',timeout:120000,
        authenticatorSelection:{residentKey:'preferred',userVerification:'required'}});
      freshSession(s,'ENROLL');if(get('status')!=='SETUP')fail('ENROLLMENT_UNAVAILABLE');challenge(s,'REGISTER',options.challenge);return options;
    }
    if(route==='/api/enroll/verify'){
      exactBody(body,['credential']);const s=requireSession(req,'ENROLL');if(get('status')!=='SETUP')fail('ENROLLMENT_UNAVAILABLE');const c=claim(s,'REGISTER');
      const verified=await verifyRegistrationResponse({response:body.credential,expectedChallenge:c.challenge,expectedOrigin:origin,expectedRPID:'localhost',requireUserPresence:true,requireUserVerification:true,supportedAlgorithmIDs:[-7]});
      if(!verified.verified)fail('REGISTRATION_REFUSED');
      const info=verified.registrationInfo,raw=Buffer.from(convertCOSEtoPKCS(info.credential.publicKey));if(raw.length!==65 || raw[0]!==4)fail('ES256_CREDENTIAL_REQUIRED');
      const pem=createPublicKey({format:'jwk',key:{kty:'EC',crv:'P-256',x:raw.subarray(1,33).toString('base64url'),y:raw.subarray(33).toString('base64url')}}).export({type:'spki',format:'pem'}).toString();
      const passkeyApproval={principalId:get('principal'),rpId:'localhost',origin,credentialId:info.credential.id,userHandle:get('userHandle'),publicKeyPem:pem,initialSignCount:info.credential.counter,
        credentialProfile:'registered-webauthn-v1',backupEligible:info.credentialDeviceType==='multiDevice'};validatePasskeyTrust(passkeyApproval);
      const t={domainId:get('domain'),issuerIdentity:'synthetic-local-approval-authority',issuerKeyId:get('issuerKeyId'),issuerPublicKeyPem:get('issuerPublic'),passkeyApproval};
      tx(()=>{freshSession(s,'ENROLL');if(get('status')!=='SETUP' || Number(get('bootstrapExpires'))<=Date.now())fail('ENROLLMENT_UNAVAILABLE');
        put('status','REGISTERING');put('bootstrapHash','spent');put('trust',JSON.stringify(t));put('counter',info.credential.counter);});
      // Cross-file setup is deliberately fail closed: an interrupted REGISTERING
      // instance cannot silently reset, enroll again, or execute.
      CustodyWitness.create(join(root,'witness.sqlite'),t);put('status','READY');
      try{unlinkSync(join(root,'enrollment-code.txt'));}catch{/* spent in authoritative app state regardless */}
      newSession(res,'ANON',s);return {registered:true,signInRequired:true};
    }
    if(route==='/api/login/options'){
      exactBody(body,[]);const s=requireSession(req,'ANON');ready();const challengeValue=token();challenge(s,'LOGIN',challengeValue);
      return {challenge:challengeValue,rpId:'localhost',timeout:120000,userVerification:'required',allowCredentials:[{type:'public-key',id:trust().passkeyApproval.credentialId}]};
    }
    if(route==='/api/login/verify'){
      exactBody(body,['credential']);const s=requireSession(req,'ANON');ready();const c=claim(s,'LOGIN');
      tx(()=>{freshSession(s,'ANON');ready();const counter=verifyPasskeyAssertion(trust().passkeyApproval,assertion(body),c.challenge,currentCounter());put('counter',counter);});
      newSession(res,'AUTH',s);return {signedIn:true};
    }
    if(route==='/api/logout'){
      exactBody(body,[]);const s=requireSession(req);newSession(res,'ANON',s);return {signedOut:true};
    }
    const s=requireSession(req,'AUTH');ready();
    if(route==='/api/transaction/prepare'){
      exactBody(body,[]);return tx(()=>{freshSession(s,'AUTH');
        if(db.prepare("SELECT id FROM intents WHERE status!='CANCELLED' LIMIT 1").get())fail('EXISTING_INTENT_REQUIRES_INSPECTION');
        if(Number(db.prepare('SELECT count(*) AS n FROM intents').get().n)>=10)fail('EVALUATION_INTENT_LIMIT');
        const g=grant(),prepared=withWriter(w=>w.preparePurchaseApproval(g)),id=randomUUID();
        db.prepare('INSERT INTO intents VALUES(?,?,?,?,?,NULL)').run(id,s.h,JSON.stringify(g),JSON.stringify(prepared),'PREPARED');
        return publicIntent(db.prepare('SELECT * FROM intents WHERE id=?').get(id));});
    }
    if(route==='/api/transaction/commit'){
      exactBody(body,['id','credential']);
      const row=tx(()=>{const r=storedIntent(body);if(r.status!=='PREPARED' || r.h!==s.h)fail('INTENT_USED_OR_SESSION_CHANGED');
        if(Date.parse(parse(r.prepared_json).expiresAt)<=Date.now())fail('TRANSACTION_EXPIRED');
        // Login and transaction ceremonies share a monotonic counter floor.
        const a=assertion(body),counter=verifyPasskeyAssertion(trust().passkeyApproval,a,parse(r.prepared_json).challenge,currentCounter());
        put('counter',counter);db.prepare("UPDATE intents SET status='SUBMITTING' WHERE id=?").run(r.id);return {...r,approval:a};});
      let result;
      try{result=withWriter(w=>w.execute({...parse(row.grant_json),humanApproval:row.approval}));}
      catch{result={outcome:'UNKNOWN',reason:'OUTCOME_REQUIRES_LOOKUP',automaticRetryPermitted:false,receipt:null};}
      // If this write fails after a commit, SUBMITTING persists. Restart maps it
      // to UNKNOWN; lookup is available without any automatic resubmission.
      db.prepare('UPDATE intents SET status=?,result_json=? WHERE id=?').run(result.outcome,JSON.stringify(result),row.id);
      return publicIntent(db.prepare('SELECT * FROM intents WHERE id=?').get(row.id));
    }
    if(route==='/api/transaction/lookup'){
      exactBody(body,['id']);const row=storedIntent(body);
      const result=withWriter(w=>w.lookup(parse(row.grant_json)));
      if(['EXECUTED','REJECTED'].includes(result.outcome))db.prepare('UPDATE intents SET status=?,result_json=? WHERE id=?').run(result.outcome,JSON.stringify(result),row.id);
      return {...publicIntent(db.prepare('SELECT * FROM intents WHERE id=?').get(row.id)),lookup:result};
    }
    if(route==='/api/transaction/cancel'){
      exactBody(body,['id']);return tx(()=>{const row=storedIntent(body);if(row.status!=='PREPARED')fail('CANNOT_CANCEL_UNCERTAIN_OR_COMPLETED_ACTION');
        withWriter(w=>w.revoke(parse(row.grant_json)));db.prepare("UPDATE intents SET status='CANCELLED' WHERE id=?").run(row.id);return {cancelled:true};});
    }
    fail('ROUTE_REFUSED');
  }
  const server=createServer(async(req,res)=>{
    for(const [k,v] of Object.entries({'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY',
      'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
      'Permissions-Policy':'publickey-credentials-create=(self), publickey-credentials-get=(self)'}))res.setHeader(k,v);
    const json=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data));};
    try{
      if(req.headers.host!==host || (req.headers.origin && req.headers.origin!==origin) || ['cross-site','same-site'].includes(req.headers['sec-fetch-site']))fail('HOST_OR_ORIGIN_REFUSED');
      if(req.method==='GET' && ['/', '/app.js','/style.css'].includes(req.url)){
        const file=req.url==='/'?'index.html':req.url.slice(1);const types={'index.html':'text/html','app.js':'text/javascript','style.css':'text/css'};
        res.writeHead(200,{'Content-Type':types[file]+'; charset=utf-8'});res.end(readFileSync(join(staticRoot,file)));return;
      }
      let body={};
      if(req.method==='POST'){
        if(req.headers.origin!==origin || req.headers['content-type']!=='application/json')fail('ORIGIN_AND_JSON_REQUIRED');
        let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>32768)fail('REQUEST_TOO_LARGE');chunks.push(chunk);}body=parse(Buffer.concat(chunks).toString('utf8'));
      }
      json(200,await api(req,res,body));
    }catch(error){
      // No raw authenticator data, private state, stacks or database errors.
      const code=/^[A-Z][A-Z0-9_]{2,95}$/.test(error?.message??'')?error.message:'REQUEST_REFUSED_OR_OUTCOME_UNCERTAIN';
      if(!res.headersSent)json(400,{error:code,automaticRetryPermitted:false});else res.end();
    }
  });
  server.requestTimeout=15_000;server.headersTimeout=10_000;server.keepAliveTimeout=3000;server.maxConnections=16;
  return {server,port,origin,close:()=>new Promise((resolve,reject)=>{server.close(e=>{db.close();unlinkSync(lock);e?reject(e):resolve();});server.closeIdleConnections();})};
}
export function stopApprovalApp(root){
  privateDirectory(root);privateFile(join(root,'approval.sqlite'));const db=new DatabaseSync(join(root,'approval.sqlite'));
  try{db.prepare("UPDATE meta SET v='STOPPED' WHERE k='status'").run();db.exec('DELETE FROM sessions; DELETE FROM challenges;');
    const saved=db.prepare("SELECT v FROM meta WHERE k='trust'").get();if(saved){const w=new CustodyWitness({path:join(root,'witness.sqlite'),trust:parse(saved.v)});try{w.stop();}finally{w.close();}}}finally{db.close();}
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
  try{
    const [command,root,port]=process.argv.slice(2);
    if(command==='setup'){const r=setupApprovalApp(root,{port:port?Number(port):8796});console.log(`Local synthetic evaluation created.\nOpen ${r.url} after starting the server.\nRead the one-time enrollment code locally from ${r.codeFile}\nThe code expires in 30 minutes. Do not share it.`);}
    else if(command==='serve'){
      // Prevent two application processes sharing one session/bootstrap state.
      const app=openApprovalApp(root);app.server.once('error',async()=>{console.error('SERVER_START_REFUSED. Check port and retained state.');process.exitCode=1;try{await app.close();}catch{}});
      app.server.listen(app.port,'127.0.0.1',()=>console.log(`ATG synthetic approval: ${app.origin}\nLoopback only. Production NO-GO. Keep this window open.`));
      let closing=false;for(const signal of ['SIGINT','SIGTERM'])process.on(signal,async()=>{if(closing)return;closing=true;await app.close();});
    }else if(command==='stop'){stopApprovalApp(root);console.log('Local evaluation stopped; retained history was not reset.');}
    else fail('USAGE_NODE_SERVER_SETUP_OR_SERVE_OR_STOP_ABSOLUTE_DIRECTORY');
  }catch{console.error('LOCAL_APPROVAL_START_REFUSED. See apps/local-approval/README.md; existing state is never reset automatically.');process.exitCode=1;}
}
