// Trusted test/controller helper ONLY. Never upload root, approver or witness keys.
import { generateKeyPairSync, sign, randomUUID } from 'node:crypto';
import { createCustodyFixture } from './custody-fixture.mjs';
import { createPasskeyApprovalFixture } from './passkey-approval-fixture.mjs';
import { DELEGATED_BUDGET_SCHEMA, canonicalBudgetEvidence, budgetPublicKeyFingerprint } from '../dist/src/delegated-budget-witness.js';
import { custodyPayloadDigest } from '../dist/src/custody-delegated-budget.js';

const pair=()=>{const k=generateKeyPairSync('ed25519');return {publicKeyPem:k.publicKey.export({type:'spki',format:'pem'}).toString(),privateKeyPem:k.privateKey.export({type:'pkcs8',format:'pem'}).toString()};};
export function createDelegatedCustodyFixture(root,{ceiling=500000,mandateCeiling=500000}={}) {
  const keys={root:pair(),'agent-A':pair(),'agent-B':pair(),outcome:pair()},pk=createPasskeyApprovalFixture();
  const trust={schema:DELEGATED_BUDGET_SCHEMA,domainId:randomUUID(),rootPrincipalId:pk.trust.principalId,
    rootPublicKeyPem:keys.root.publicKeyPem,outcomeWitnessId:'fixture-outcome-observer',outcomeWitnessPublicKeyPem:keys.outcome.publicKeyPem,
    agentPublicKeys:{'agent-A':keys['agent-A'].publicKeyPem,'agent-B':keys['agent-B'].publicKeyPem},
    tenantId:'synthetic-tenant-A',accountId:'synthetic-purchase-account',currency:'GBP',accountCeilingMinor:ceiling};
  const f=createCustodyFixture(root,pk.trust,trust),budget=f.trust.delegatedBudget;
  let now='2026-11-12T12:00:00.000Z'; f.setNow(now);
  const signed=(body,key,domain)=>({body,signature:sign(null,Buffer.from(domain+canonicalBudgetEvidence(body)),key).toString('base64url')});
  function request({leaf='agent-B',amount=300000,version=1,value='approved',mandateId=randomUUID(),scopeOverrides={},actionOverrides={},grantOverrides={}}={}){
    const grant=f.grant({subjectAgentIdentity:leaf,issuedAt:new Date(Date.parse(now)-1000).toISOString(),notBefore:new Date(Date.parse(now)-1000).toISOString(),expiresAt:new Date(Date.parse(now)+600000).toISOString(),...grantOverrides},
      {amountMinorUnits:amount,expectedVersion:version,value});
    const scope={tenantId:budget.tenantId,accountId:budget.accountId,missionId:'office-purchase',toolId:'atg.custody.synthetic-record',
      destinationId:'custody-witness:'+f.trust.domainId,payeeId:'fixture-bank-A',currency:'GBP',maxPerActionMinor:400000,
      expiresAt:grant.issuance.gatePass.action.expiresAt,...scopeOverrides};
    const mandate={...scope,schema:'atg.root-mandate.synthetic.v1',mandateId,domainId:budget.domainId,rootPrincipalId:budget.rootPrincipalId,
      maxTotalMinor:mandateCeiling,notBefore:grant.issuance.gatePass.action.notBefore,maxDelegationDepth:2};
    const first={...scope,parentId:budget.rootPrincipalId,childId:'agent-A',remainingHops:1};
    const delegations=[signed(first,keys.root.privateKeyPem,'ATG_SYNTHETIC_DELEGATION_V1:')];
    if(leaf==='agent-B')delegations.push(signed({...scope,parentId:'agent-A',childId:leaf,remainingHops:0},keys['agent-A'].privateKeyPem,'ATG_SYNTHETIC_DELEGATION_V1:'));
    const action={actionId:grant.issuance.gatePass.gatePassId,tenantId:scope.tenantId,accountId:scope.accountId,missionId:scope.missionId,
      toolId:scope.toolId,destinationId:scope.destinationId,payeeId:scope.payeeId,currency:scope.currency,amountMinor:amount,
      resourceId:grant.proposedAction.canonicalArguments.resourceId,payloadDigest:custodyPayloadDigest(grant.proposedAction.canonicalArguments),...actionOverrides};
    const req={mandate:signed(mandate,keys.root.privateKeyPem,'ATG_SYNTHETIC_ROOT_MANDATE_V1:'),delegations,action,leafSignature:''};
    req.leafSignature=sign(null,Buffer.from('ATG_SYNTHETIC_EXACT_ACTION_V1:'+canonicalBudgetEvidence({mandateId,delegationDigest:custodyPayloadDigest(delegations),action})),keys[leaf].privateKeyPem).toString('base64url');
    grant.delegatedRequest=req;
    return {grant,ctx:{agentId:leaf,transportCredentialFingerprint:budgetPublicKeyFingerprint(keys[leaf].publicKeyPem)}};
  }
  function approve(writer,r,counter=1){const prepared=writer.preparePurchaseApproval(r.grant,r.ctx);r.grant.humanApproval=pk.assertion(prepared,{counter});return prepared;}
  function outcomeEvidence(r,outcome='COMMITTED'){
    const req=r.grant.delegatedRequest;
    const body={schema:'atg.signed-outcome.synthetic.v1',witnessId:budget.outcomeWitnessId,eventId:randomUUID(),
      actionId:req.action.actionId,actionDigest:custodyPayloadDigest({mandateId:req.mandate.body.mandateId,delegationDigest:custodyPayloadDigest(req.delegations),action:req.action}),outcome,observedAt:now};
    return signed(body,keys.outcome.privateKeyPem,'ATG_SYNTHETIC_OUTCOME_WITNESS_V1:');
  }
  return {...f,keys,pk,budget,request,approve,outcomeEvidence,setNow:v=>{now=v;f.setNow(v);},getNow:()=>now};
}
