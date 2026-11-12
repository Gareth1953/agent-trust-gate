// SOFTWARE AUTHENTICATOR FIXTURE ONLY. Never use this as human approval or ship
// this private key into an agent workload. No real person or passkey was used.
import { generateKeyPairSync,randomBytes,createHash,sign } from 'node:crypto';
export function createPasskeyApprovalFixture(){
  const {publicKey,privateKey}=generateKeyPairSync('ec',{namedCurve:'prime256v1'});
  const trust={principalId:'synthetic-purchase-approver',rpId:'localhost',origin:'http://localhost:8787',credentialId:randomBytes(32).toString('base64url'),userHandle:randomBytes(16).toString('base64url'),publicKeyPem:publicKey.export({type:'spki',format:'pem'}).toString(),initialSignCount:0};
  return {trust,assertion(request,overrides={}){
    const data={type:'webauthn.get',challenge:request.challenge,origin:trust.origin,crossOrigin:false,...overrides.client};
    const client=Buffer.from(overrides.clientText??JSON.stringify(data));
    const auth=Buffer.alloc(37);createHash('sha256').update(overrides.rpId??trust.rpId).digest().copy(auth);
    auth[32]=overrides.flags??5;auth.writeUInt32BE(overrides.counter??1,33);
    return {credentialId:overrides.credentialId??trust.credentialId,clientDataJSON:client.toString('base64url'),authenticatorData:auth.toString('base64url'),signature:sign('sha256',Buffer.concat([auth,createHash('sha256').update(client).digest()]),privateKey).toString('base64url'),userHandle:overrides.userHandle??trust.userHandle};
  }};
}
