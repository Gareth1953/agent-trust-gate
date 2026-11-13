/**
 * Synthetic-only checkpointed destination orchestrator for the actual
 * CustodyWitness writer. This opt-in route is NOT compulsory in legacy modes.
 * The actual writer has a trusted in-process reference here; production must
 * place it inside a protected service, with no alternate effect paths.
 */
const DIGEST=/^(?:sha256:)?[a-f0-9]{64}$/;
const ID=/^[A-Za-z0-9:._-]{1,160}$/;
const deny=(outcome,reason)=>({
  outcome,reason,syntheticOnly:true,productionReady:false,automaticRetryPermitted:false
});
export class AsyncCheckpointedSyntheticDestination {
  #writer;#reserve;#domain;
  constructor({writer,reserve,domainId}) {
    if(!writer || typeof writer.execute!=='function' ||
       typeof writer.preflightForAnchor!=='function' ||
       typeof reserve!=='function' || !ID.test(domainId))
      throw Error('CHECKPOINTED_DESTINATION_CONFIG_INVALID');
    this.#writer=writer;this.#reserve=reserve;this.#domain=domainId;
  }
  async execute(grant,ctx) {
    const pass=grant?.issuance?.gatePass;
    const actionId=pass?.gatePassId,actionDigest=pass?.action?.actionDigest;
    if(typeof actionId!=='string' || !ID.test(actionId) ||
       typeof actionDigest!=='string' || !DIGEST.test(actionDigest))
      return deny('REJECTED','SIGNED_ACTION_INVALID');
    let checked;
    try {checked=this.#writer.preflightForAnchor(grant,ctx);}
    catch {return deny('UNKNOWN','WRITER_PREFLIGHT_UNAVAILABLE');}
    if(checked?.verified!==true || checked.actionId!==actionId ||
       checked.actionDigest!==actionDigest)
      return deny('REJECTED','AUTHORITY_PREFLIGHT_REFUSED');
    let admission;
    try {admission=await this.#reserve({domainId:this.#domain,actionId,actionDigest});}
    catch {return deny('UNKNOWN','CHECKPOINT_UNAVAILABLE');}
    if(!admission || admission.outcome!=='RESERVED' ||
       admission.effectPermittedByAnchor!==true || admission.actionId!==actionId)
      return deny(admission?.outcome==='REJECTED'?'REJECTED':'UNKNOWN','CHECKPOINT_NOT_GRANTED');
    try {
      const result=this.#writer.execute(grant,ctx);
      if(result?.outcome!=='EXECUTED')return deny('UNKNOWN','DESTINATION_OUTCOME_UNCONFIRMED');
      return {outcome:'EXECUTED',reason:'CHECKPOINTED_SYNTHETIC_EFFECT',
        receipt:result.receipt,syntheticOnly:true,productionReady:false,
        automaticRetryPermitted:false};
    }catch{return deny('UNKNOWN','DESTINATION_OUTCOME_UNCONFIRMED');}
  }
}
