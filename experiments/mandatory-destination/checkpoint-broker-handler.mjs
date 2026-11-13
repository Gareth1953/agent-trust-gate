// Optional checkpoint-enforced HTTP commit adapter for the synthetic broker.
// This is additive research; legacy broker route remains explicitly unchanged.
import {canonicalWire} from '../../scripts/openshell-broker-client.mjs';
import {AsyncCheckpointedSyntheticDestination} from './async-checkpointed-destination.mjs';
const LIMIT=64*1024;
const reject=(reason,unknown=false)=>({
  schema:'atg.openshell-broker.synthetic.v1',syntheticOnly:true,
  productionReady:false,outcome:unknown?'UNKNOWN':'REJECTED',
  reason,automaticRetryPermitted:false,receipt:null
});
export function createCheckpointBrokerHandler({writer,reserve,domainId}) {
  const guarded=new AsyncCheckpointedSyntheticDestination({writer,reserve,domainId});
  return async function checkpointBroker(method,path,bytes,caller) {
    if(method!=='POST' || path!=='/v1/synthetic-record/commit')
      return reject('CHECKPOINT_ROUTE_REFUSED');
    let grant;
    try {
      if(!bytes?.length || bytes.length>LIMIT)throw Error();
      const raw=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
      if(!Buffer.from(raw).equals(bytes))throw Error();
      const data=JSON.parse(raw);
      if(canonicalWire(data)!==raw || Object.keys(data).sort().join(',')!=='grant,payload' ||
         !data.grant || !data.payload || typeof data.payload!=='object' || Array.isArray(data.payload))
        throw Error();
      const original=data.grant;
      if(!['issuance,proposedAction','humanApproval,issuance,proposedAction',
        'delegatedRequest,humanApproval,issuance,proposedAction',
        'delegatedRequest,issuance,proposedAction'].includes(Object.keys(original).sort().join(',')))
        throw Error();
      const payload=data.payload;
      grant={issuance:original.issuance,
        proposedAction:{...original.proposedAction,
          canonicalArguments:payload,targetIdentity:payload.resourceId,
          amount:typeof payload.amountMinorUnits==='number'?payload.amountMinorUnits/100:null,
          currency:payload.currency}};
      if('humanApproval' in original)grant.humanApproval=original.humanApproval;
      if('delegatedRequest' in original)grant.delegatedRequest=original.delegatedRequest;
    }catch{return reject('CHECKPOINT_BROKER_BODY_INVALID');}
    let result;
    try{result=await guarded.execute(grant,caller);}
    catch{return reject('CHECKPOINT_BROKER_OUTCOME_UNKNOWN',true);}
    if(result?.outcome==='EXECUTED')return {
      schema:'atg.openshell-broker.synthetic.v1',syntheticOnly:true,productionReady:false,
      outcome:'EXECUTED',reason:'CHECKPOINTED_SYNTHETIC_EFFECT',
      automaticRetryPermitted:false,receipt:result.receipt,domainId
    };
    return reject(result?.reason||'CHECKPOINT_BROKER_REFUSED',result?.outcome==='UNKNOWN');
  };
}
