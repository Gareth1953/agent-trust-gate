// Trusted, SYNTHETIC issuer/controller helper. Private keys never go to an agent service or public API.
import { generateKeyPairSync, sign, randomUUID, createHash } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { join } from 'node:path';
import { SyntheticDelegatedBudgetWriter, DELEGATED_BUDGET_SCHEMA,
  canonicalBudgetEvidence, budgetPublicKeyFingerprint } from '../dist/src/delegated-budget-witness.js';

const ROOT_DOMAIN='ATG_SYNTHETIC_ROOT_MANDATE_V1:';
const LINK_DOMAIN='ATG_SYNTHETIC_DELEGATION_V1:';
const ACTION_DOMAIN='ATG_SYNTHETIC_EXACT_ACTION_V1:';
const OUTCOME_DOMAIN='ATG_SYNTHETIC_OUTCOME_WITNESS_V1:';
const pair=()=>{const k=generateKeyPairSync('ed25519');return {
  publicKeyPem:k.publicKey.export({type:'spki',format:'pem'}).toString(),
  privateKeyPem:k.privateKey.export({type:'pkcs8',format:'pem'}).toString(),
};};
const hash=v=>createHash('sha256').update(canonicalBudgetEvidence(v)).digest('hex');
export const signFixture=(body,secret,domain)=>({
  body,signature:sign(null,Buffer.from(domain+canonicalBudgetEvidence(body)),secret).toString('base64url')
});
export function createDelegatedBudgetFixture(root,{accountCeilingMinor=500000,maxTotalMinor=500000}={}) {
  mkdirSync(root,{recursive:true,mode:0o700});
  const keys={root:pair(),'agent-A':pair(),'agent-B':pair(),'agent-C':pair(),outcome:pair()};
  const trust={schema:DELEGATED_BUDGET_SCHEMA,domainId:randomUUID(),rootPrincipalId:'organisation-A',
    rootPublicKeyPem:keys.root.publicKeyPem,outcomeWitnessId:'synthetic-outcome-observer-A',outcomeWitnessPublicKeyPem:keys.outcome.publicKeyPem,
    agentPublicKeys:{'agent-A':keys['agent-A'].publicKeyPem,'agent-B':keys['agent-B'].publicKeyPem,'agent-C':keys['agent-C'].publicKeyPem},
    tenantId:'tenant-A',accountId:'account-A',currency:'GBP',accountCeilingMinor};
  const path=join(root,'shared-budget.sqlite');SyntheticDelegatedBudgetWriter.create(path,trust);
  let now='2026-11-12T12:00:00.000Z';
  const open=()=>new SyntheticDelegatedBudgetWriter({path,trust,now:()=>new Date(now)});
  function request({leaf='agent-B',amountMinor=100000,mandateId=randomUUID(),
      mandateOverrides={},actionOverrides={},firstOverrides={},secondOverrides={}}={}) {
    const scope={tenantId:'tenant-A',accountId:'account-A',missionId:'purchase-office-supplies',toolId:'synthetic.place-order',
      destinationId:'protected-writer-A',payeeId:'supplier-A',currency:'GBP',maxPerActionMinor:400000,expiresAt:'2026-11-12T12:10:00.000Z'};
    const m={schema:'atg.root-mandate.synthetic.v1',mandateId,domainId:trust.domainId,rootPrincipalId:'organisation-A',
      ...scope,maxTotalMinor,notBefore:'2026-11-12T11:55:00.000Z',maxDelegationDepth:2,...mandateOverrides};
    const first={...scope,parentId:'organisation-A',childId:'agent-A',remainingHops:1,...firstOverrides};
    const links=[signFixture(first,keys.root.privateKeyPem,LINK_DOMAIN)];
    if(leaf==='agent-B'){
      const second={...scope,maxPerActionMinor:300000,parentId:'agent-A',childId:'agent-B',
        remainingHops:0,...secondOverrides};
      links.push(signFixture(second,keys['agent-A'].privateKeyPem,LINK_DOMAIN));
    }
    const action={actionId:randomUUID(),tenantId:scope.tenantId,accountId:scope.accountId,missionId:scope.missionId,
      toolId:scope.toolId,destinationId:scope.destinationId,payeeId:scope.payeeId,
      currency:scope.currency,resourceId:'synthetic-order-001',amountMinor,...actionOverrides};
    const req={mandate:signFixture(m,keys.root.privateKeyPem,ROOT_DOMAIN),delegations:links,action,
      leafSignature:''};
    const privateKey=keys[leaf]?.privateKeyPem ?? keys['agent-B'].privateKeyPem;
    req.leafSignature=sign(null,Buffer.from(ACTION_DOMAIN+canonicalBudgetEvidence({
      mandateId:m.mandateId,delegationDigest:hash(links),action
    })),privateKey).toString('base64url');
    const ctx={agentId:leaf,transportCredentialFingerprint:budgetPublicKeyFingerprint(trust.agentPublicKeys[leaf]??trust.agentPublicKeys['agent-B'])};
    return {req,ctx};
  }
  function witnessEvidence(actionId,outcome,{eventId=randomUUID(),actionDigest,observedAt=now,witnessId=trust.outcomeWitnessId}={}) {
    let committedDigest=actionDigest;
    if(!committedDigest) {
      const d=new DatabaseSync(path,{readOnly:true});
      try {committedDigest=d.prepare('SELECT action_digest FROM actions WHERE action_id=?').get(actionId)?.action_digest;}
      finally{d.close();}
    }
    if(!committedDigest)throw Error('SYNTHETIC_RECORD_NOT_FOUND');
    const body={schema:'atg.signed-outcome.synthetic.v1',witnessId,eventId,actionId,actionDigest:committedDigest,outcome,observedAt};
    return signFixture(body,keys.outcome.privateKeyPem,OUTCOME_DOMAIN);
  }
  return {root,path,keys,trust,open,request,setNow:v=>{now=v;},getNow:()=>now,witnessEvidence,
    resignMandate:m=>signFixture(m,keys.root.privateKeyPem,ROOT_DOMAIN),
    resignFirst:d=>signFixture(d,keys.root.privateKeyPem,LINK_DOMAIN),
    resignSecond:d=>signFixture(d,keys['agent-A'].privateKeyPem,LINK_DOMAIN),
    resignAction:(req,leaf='agent-B')=>sign(null,Buffer.from(ACTION_DOMAIN+canonicalBudgetEvidence({
      mandateId:req.mandate.body.mandateId,delegationDigest:hash(req.delegations),action:req.action
    })),keys[leaf].privateKeyPem).toString('base64url')};
}
