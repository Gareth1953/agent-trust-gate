const $=id=>document.getElementById(id);
let state,intent,busy=false;
const bytes=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
const wire=b=>btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
function serialize(c){
  const r=c.response,base={id:c.id,rawId:wire(c.rawId),type:c.type,clientExtensionResults:c.getClientExtensionResults()};
  if(r.attestationObject)return {...base,response:{clientDataJSON:wire(r.clientDataJSON),attestationObject:wire(r.attestationObject),transports:r.getTransports?.()??[]}};
  return {...base,response:{clientDataJSON:wire(r.clientDataJSON),authenticatorData:wire(r.authenticatorData),signature:wire(r.signature),userHandle:r.userHandle?wire(r.userHandle):null}};
}
async function call(path,body){const response=await fetch(path,{method:body===undefined?'GET':'POST',credentials:'same-origin',cache:'no-store',headers:body===undefined?{}:{'Content-Type':'application/json','X-ATG-CSRF':state.csrf},...(body===undefined?{}:{body:JSON.stringify(body)})});
  const data=await response.json();if(!response.ok)throw Error(data.error??'Request refused');return data;}
function message(text){$('message').textContent=text;}
function showIntent(){
  $('transaction').hidden=!intent;$('prepare').hidden=Boolean(intent && intent.status!=='CANCELLED');if(!intent)return;
  const p=intent.prepared.summary;
  $('summary').replaceChildren();for(const [label,value] of [['Amount',`${p.currency} ${(p.amountMinorUnits/100).toFixed(2)} — fictional`],['Payee',p.payeeReference],['Order',p.resourceId],['Expected version',p.expectedVersion],['Change',`pending → ${p.value}`],['Tenant',p.tenantId]]){
    const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=String(value);$('summary').append(dt,dd);
  }
  $('binding').textContent=`Local principal: ${intent.prepared.principalId}\nAuthority: ${intent.prepared.gatePassId}\nAction digest: ${intent.prepared.actionDigest}\nExpires: ${intent.prepared.expiresAt}\nDestination: same-host synthetic custody witness\nOperation: record_synthetic_order (no live ERP connector)`;
  const prepared=intent.status==='PREPARED';$('approve').hidden=!prepared;$('cancel').hidden=!prepared;
  $('outcome').textContent=intent.lookup||intent.result?JSON.stringify(intent.lookup??intent.result,null,2):`Status: ${intent.status}. Nothing has been approved by signing in or viewing this request.`;
}
async function refresh(){
  state=await call('/api/status');intent=state.intent;
  $('enroll').hidden=state.status!=='SETUP';$('code-form').hidden=state.enrollmentAuthorized;$('register').hidden=!state.enrollmentAuthorized;
  $('login').hidden=state.status!=='READY'||state.authenticated;$('workflow').hidden=!state.authenticated;
  showIntent();if(['REGISTERING','STOPPED'].includes(state.status))message('This evaluation is held or stopped. Do not reset retained state. See the local guide.');
}
async function run(fn){if(busy)return;busy=true;document.querySelectorAll('button').forEach(b=>b.disabled=true);
  try{await fn();}catch(error){
    const text=error.name==='NotAllowedError'?'Device approval was cancelled or unavailable. No automatic submission will occur.':error.message;
    const guidance=intent?'If a transaction was submitted, check its recorded outcome before doing anything else.':'Signing in does not submit a transaction. Do not create another passkey or reset saved state.';
    message(`${text}. ${guidance}`);
    try{await refresh();}catch{/* Keep the existing summary; never retry a commit. */}
  }finally{busy=false;document.querySelectorAll('button').forEach(b=>b.disabled=false);}
}
async function authenticate(options){const c=await navigator.credentials.get({publicKey:{...options,challenge:bytes(options.challenge),allowCredentials:options.allowCredentials.map(x=>({...x,id:bytes(x.id)}))}});if(!c)throw Error('No passkey response');return serialize(c);}
$('code-form').addEventListener('submit',event=>{event.preventDefault();run(async()=>{await call('/api/enroll/authorize',{code:$('code').value.trim()});$('code').value='';await refresh();message('Enrollment unlocked. Create your local passkey next.');});});
$('register').addEventListener('click',()=>run(async()=>{
  const options=await call('/api/enroll/options',{});const credential=await navigator.credentials.create({publicKey:{...options,challenge:bytes(options.challenge),user:{...options.user,id:bytes(options.user.id)},excludeCredentials:options.excludeCredentials?.map(x=>({...x,id:bytes(x.id)}))}});
  if(!credential)throw Error('Registration cancelled');await call('/api/enroll/verify',{credential:serialize(credential)});await refresh();message('Passkey registered for this local evaluation. Sign in next; no transaction has been approved.');
}));
$('signin').addEventListener('click',()=>run(async()=>{const options=await call('/api/login/options',{});const credential=await authenticate(options);await call('/api/login/verify',{credential});await refresh();message('Signed in. Show and review the fictional action before approving it.');}));
$('logout').addEventListener('click',()=>run(async()=>{await call('/api/logout',{});await refresh();message('Signed out. Existing outcome records are retained.');}));
$('prepare').addEventListener('click',()=>run(async()=>{intent=await call('/api/transaction/prepare',{});showIntent();message('Review the exact fictional values. Approval requires a separate passkey action.');}));
$('approve').addEventListener('click',()=>run(async()=>{
  if(Date.parse(intent.prepared.expiresAt)<=Date.now())throw Error('Approval request expired; cancel it before preparing another');
  const credential=await authenticate(intent.prepared.publicKey);
  intent=await call('/api/transaction/commit',{id:intent.id,credential});showIntent();
  message(intent.status==='EXECUTED'?'The fictional record change was committed. No real money or ERP action occurred.':'The action was refused or its outcome is uncertain. Inspect the record; do not resubmit.');
}));
$('cancel').addEventListener('click',()=>run(async()=>{await call('/api/transaction/cancel',{id:intent.id});await refresh();message('The unused authority was revoked. No record change was requested by cancellation.');}));
$('lookup').addEventListener('click',()=>run(async()=>{intent=await call('/api/transaction/lookup',{id:intent.id});showIntent();message('Recorded outcome checked. This did not execute or retry the action.');}));
if(!window.isSecureContext || !navigator.credentials || !window.PublicKeyCredential)message('This browser does not expose WebAuthn here. Open the exact localhost address in a supported browser.');
else run(async()=>{await refresh();if(['SETUP','READY'].includes(state.status))message(state.status==='SETUP'?'Ready for local enrollment. Use the private one-time code.':'Ready. Sign in with the registered passkey.');});
