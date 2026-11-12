// TEST ONLY: generated software keys. Never count these as a real human/device.
import { generateKeyPairSync, randomBytes, createHash, sign } from 'node:crypto';
import { isoCBOR } from '@simplewebauthn/server/helpers';
export function softwareAuthenticator({backup=false,counter=0}={}){
  const pair=generateKeyPairSync('ec',{namedCurve:'prime256v1'}),jwk=pair.publicKey.export({format:'jwk'}),id=randomBytes(32).toString('base64url');let userHandle;
  const h=s=>createHash('sha256').update(s).digest();
  const client=(type,challenge,origin)=>Buffer.from(JSON.stringify({type,challenge,origin,crossOrigin:false}));
  return {id,registration(options,origin,overrides={}){
    userHandle=options.user.id;
    const cose=isoCBOR.encode(new Map([[1,2],[3,-7],[-1,1],[-2,Buffer.from(jwk.x,'base64url')],[-3,Buffer.from(jwk.y,'base64url')]]));
    const data=Buffer.alloc(55);h('localhost').copy(data);data[32]=overrides.flags??(0x45|(backup?0x18:0));data.writeUInt32BE(counter,33);data.writeUInt16BE(32,53);
    const attestation=isoCBOR.encode(new Map([['fmt','none'],['attStmt',new Map()],['authData',Buffer.concat([data,Buffer.from(id,'base64url'),Buffer.from(cose)])]]));
    return {id,rawId:id,type:'public-key',clientExtensionResults:{},response:{clientDataJSON:client('webauthn.create',options.challenge,overrides.origin??origin).toString('base64url'),attestationObject:Buffer.from(attestation).toString('base64url'),transports:['internal']}};
  },authentication(options,origin,overrides={}){
    const data=Buffer.alloc(37);h(overrides.rpId??'localhost').copy(data);data[32]=overrides.flags??(5|(backup?0x18:0));data.writeUInt32BE(overrides.counter??counter,33);
    const c=Buffer.from(overrides.clientText??JSON.stringify({type:overrides.type??'webauthn.get',challenge:overrides.challenge??options.challenge,origin:overrides.origin??origin,crossOrigin:false,...(overrides.extraClientData??{})}));
    return {id,rawId:id,type:'public-key',clientExtensionResults:{},response:{clientDataJSON:c.toString('base64url'),authenticatorData:data.toString('base64url'),signature:sign('sha256',Buffer.concat([data,h(c)]),pair.privateKey).toString('base64url'),userHandle:overrides.userHandle??userHandle}};
  }};
}
