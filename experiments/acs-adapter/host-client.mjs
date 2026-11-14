// Local synthetic transport experiment with the unmodified OWASP reference client.
import { createGuardianClient } from './vendor/acs-client-v0.1.4/guardian-client.ts';
import { canonicalDestinationEvidence as canonical } from '../../dist/src/destination-evidence.js';

export async function executeViaAcs(url, request, grant, witness, timeoutMs=500) {
  const refused = reason => ({outcome:'REJECTED',reason,automaticRetryPermitted:false});
  const unknown = () => ({outcome:'UNKNOWN',reason:'ACS_NO_USABLE_DECISION',automaticRetryPermitted:false});
  try {
    // This fixture transport may only reach an explicitly provisioned local endpoint.
    const endpoint = new URL(url);
    if(endpoint.protocol!=='http:' || endpoint.hostname!=='127.0.0.1' || endpoint.username || endpoint.password
      || endpoint.pathname!=='/' || endpoint.search || endpoint.hash || !endpoint.port) return refused('ACS_LOCAL_ENDPOINT_REQUIRED');
    const r=JSON.parse(canonical(request)),g=JSON.parse(canonical(grant));
    const reply=await createGuardianClient(url).post(r,{timeoutMs});
    const decision=reply.result;
    if(reply.error!==undefined || !decision || decision.type!=='final' || decision.acs_version!=='0.1.0'
      || decision.request_id!==r.params.request_id || decision.decision!=='allow') return refused('ACS_NOT_ALLOWED');
    const evidence=decision.policy_data?.atg;
    if(evidence?.gate_pass_id!==g.issuance.gatePass.gatePassId
      || evidence.action_digest!==g.issuance.gatePass.action.actionDigest
      || evidence.preflight_only!==true || evidence.executed!==false) return refused('ACS_AUTHORITY_BINDING_MISMATCH');
    // The reply is NOT execution authority. Destination rechecks signed authority,
    // freshness, current resource version and durable one-use state independently.
    return witness.execute(g);
  } catch {return unknown();}
}
