// Synthetic host/controller setup only. Never expose this helper as an agent tool.
import { generateKeyPairSync,randomUUID } from 'node:crypto';
import { mkdirSync,writeFileSync } from 'node:fs';
import { join,isAbsolute } from 'node:path';
import { CustodyWitness } from '../dist/src/custody-witness.js';
import { createBaseExactActionInput,issueExactActionGatePass } from '../dist/src/exact-action-gatepass.js';

export const FIXTURE_NOW='2026-11-10T08:30:00.000Z';
export function createCustodyFixture(root,passkeyApproval) {
  if(!isAbsolute(root))throw Error('ABSOLUTE_NEW_CUSTODY_ROOT_REQUIRED');
  mkdirSync(root,{mode:0o700});const custody=join(root,'controller-owned'),agent=join(root,'agent-cache');mkdirSync(custody,{mode:0o700});mkdirSync(agent,{mode:0o700});
  const keys=generateKeyPairSync('ed25519'),privateKeyPem=keys.privateKey.export({type:'pkcs8',format:'pem'}).toString();
  const trust={domainId:randomUUID(),issuerIdentity:'synthetic-custody-authority',issuerKeyId:randomUUID(),issuerPublicKeyPem:keys.publicKey.export({type:'spki',format:'pem'}).toString()};
  if(passkeyApproval)trust.passkeyApproval=passkeyApproval;
  writeFileSync(join(custody,'issuer-private.pem'),privateKeyPem,{flag:'wx',mode:0o600});
  writeFileSync(join(custody,'trust.json'),JSON.stringify(trust),{flag:'wx',mode:0o600});
  const path=join(custody,'witness.sqlite');CustodyWitness.create(path,trust);
  let now=FIXTURE_NOW;
  const open=()=>new CustodyWitness({path,trust,now:()=>new Date(now)});
  const grant=(overrides={},payloadOverrides={})=>{
    const p={tenantId:'synthetic-tenant-A',resourceId:'synthetic-order-001',expectedVersion:1,value:'approved',payeeReference:'fixture-bank-A',amountMinorUnits:400000,currency:'GBP',...payloadOverrides};
    const action=createBaseExactActionInput({issuerIdentity:trust.issuerIdentity,issuerKeyId:trust.issuerKeyId,
      verificationProfile:`custody-profile:${trust.domainId}`,operatingEnvironment:`custody-witness:${trust.domainId}`,
      toolIdentity:'atg.custody.synthetic-record',toolSchemaVersion:'1.0.0',operationName:'record_synthetic_order',targetIdentity:p.resourceId,
      amount:p.amountMinorUnits/100,currency:p.currency,canonicalArguments:p,...(passkeyApproval?{operatorIdentity:passkeyApproval.principalId}:{}),issuedAt:FIXTURE_NOW,notBefore:FIXTURE_NOW,
      expiresAt:'2026-11-10T08:35:00.000Z',nonce:randomUUID(),idempotencyKey:randomUUID(),...overrides});
    return {issuance:issueExactActionGatePass(action,{privateKeyPem}),proposedAction:action};
  };
  return {root,custody,agent,path,trust,open,grant,setNow:value=>{now=value;}};
}
