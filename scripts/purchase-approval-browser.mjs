// Host only within the trusted approver application, never the agent context.
// Enrollment/identity/session authentication is the host application's job.
// Call from an explicit user click after displaying the server-side summary.
const bytes=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
const wire=b=>btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
export function displayPurchaseApproval(element,request){
  if(request?.schema!=='atg.purchase-passkey-request.synthetic.v1')throw Error('APPROVAL_REQUEST_INVALID');
  const p=request.summary;
  const d=request.delegatedAuthority;
  const delegation=d?`\nRoot principal: ${d.rootPrincipalId}\nAccount: ${d.accountId}\nMandate: ${d.mandateId}\nMission: ${d.missionId}\nAgents: ${d.agentChain.join(' → ')}\nRoot / mandate ceilings (minor units): ${d.accountCeilingMinor} / ${d.mandateCeilingMinor}`:'';
  element.textContent=`TEST ONLY purchase approval\nPrincipal: ${request.principalId}\nTenant: ${p.tenantId}\nOrder: ${p.resourceId}, version ${p.expectedVersion}\nPayee: ${p.payeeReference}\nAmount (minor units): ${p.amountMinorUnits} ${p.currency}\nChange: ${p.value}\nAuthority: ${request.gatePassId}\nAction digest: ${request.actionDigest}\nExpires: ${request.expiresAt}${delegation}`;
}
export async function requestPurchaseApproval(prepared){
  if(prepared?.schema!=='atg.purchase-passkey-request.synthetic.v1'||Date.parse(prepared.expiresAt)<=Date.now())throw Error('APPROVAL_REQUEST_INVALID_OR_EXPIRED');
  const credential=await navigator.credentials.get({publicKey:{...prepared.publicKey,challenge:bytes(prepared.publicKey.challenge),allowCredentials:prepared.publicKey.allowCredentials.map(c=>({...c,id:bytes(c.id)})),userVerification:'required'}});
  if(!credential || credential.type!=='public-key')throw Error('PASSKEY_APPROVAL_CANCELLED');
  const r=credential.response;
  return {credentialId:wire(credential.rawId),clientDataJSON:wire(r.clientDataJSON),authenticatorData:wire(r.authenticatorData),signature:wire(r.signature),userHandle:r.userHandle?wire(r.userHandle):null};
}
