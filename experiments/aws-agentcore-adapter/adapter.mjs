// AWS AgentCore MCP REQUEST-interceptor contract subset, tested locally only.
import cedar from '@cedar-policy/cedar-wasm/nodejs';
import { canonicalDestinationEvidence as canonical } from '../../dist/src/destination-evidence.js';
import { verifyExactActionAtExecution } from '../../dist/src/exact-action-gatepass.js';

export const POLICY = `permit(
  principal == ATG::Agent::"synthetic-agent",
  action == ATG::Action::"record_synthetic_order",
  resource == ATG::Resource::"synthetic-order-001"
) when {context.amountMinorUnits >= 0 && context.amountMinorUnits <= 500000
  && context.currency == "GBP" && context.payeeReference == "fixture-bank-A"};`;

export function cedarDecision(args,principal,policy=POLICY,evaluate=cedar.isAuthorized) {
  return evaluate({principal:{type:'ATG::Agent',id:principal},
    action:{type:'ATG::Action',id:'record_synthetic_order'},
    resource:{type:'ATG::Resource',id:'synthetic-order-001'},
    context:{amountMinorUnits:args.amountMinorUnits,currency:args.currency,payeeReference:args.payeeReference},
    policies:{staticPolicies:policy},entities:[]});
}
const keys=(o,names)=>o && !Array.isArray(o) && typeof o==='object' && Object.keys(o).sort().join(',')===[...names].sort().join(',');

/** Grant, context, authenticated caller mapping and policy are host configuration.
 * Never derive them from forwarded Authorization headers or agent claims.
 * A real deployment must implement that authenticated host binding separately.
 */
export function createInterceptor({grant,context,principal,policy=POLICY,evaluate=cedar.isAuthorized}) {
  return event=>{
    let id=null;
    const deny=reason=>({interceptorOutputVersion:'1.0',mcp:{transformedGatewayResponse:{statusCode:200,
      body:{jsonrpc:'2.0',id,error:{code:-32001,message:reason}}}}});
    try {
      const text=canonical(event);if(Buffer.byteLength(text)>65536)throw Error('large');
      // Preserve the parsed request's key order for raw-wire agreement. The
      // canonical serializer above validates data safety but sorts object keys.
      const e=JSON.parse(JSON.stringify(event));
      if(!keys(e,['interceptorInputVersion','mcp']) || e.interceptorInputVersion!=='1.0'
        || !keys(e.mcp,['rawGatewayRequest','gatewayRequest']))return deny('ATG_UNSUPPORTED_INTERCEPTOR_INPUT');
      const r=e.mcp.gatewayRequest,b=r.body;
      if(typeof b?.id==='string' || (typeof b?.id==='number' && Number.isFinite(b.id)))id=b.id;
      if(!keys(r,['path','httpMethod','body']) || r.path!=='/mcp' || r.httpMethod!=='POST'
        || !keys(e.mcp.rawGatewayRequest,['body'])
        || e.mcp.rawGatewayRequest.body!==JSON.stringify(b)
        || !keys(b,['jsonrpc','id','method','params']) || b.jsonrpc!=='2.0' || id===null
        || b.method!=='tools/call' || !keys(b.params,['name','arguments']))return deny('ATG_UNSUPPORTED_TOOL_REQUEST');
      const g=JSON.parse(canonical(grant)),a=g.proposedAction,args=b.params.arguments;
      if(!keys(g,['issuance','proposedAction']) || principal!=='synthetic-agent'
        || context.constraints.subjectAgentIdentity!==a.subjectAgentIdentity
        || !args || !Number.isSafeInteger(args.amountMinorUnits))return deny('ATG_HOST_BINDING_REQUIRED');
      const decision=cedarDecision(args,principal,policy,evaluate);
      if(decision.type!=='success' || decision.response.decision!=='allow'
        || decision.response.diagnostics.errors.length)return deny('ATG_CEDAR_NOT_ALLOWED');
      if(b.params.name!=='atg.custody.synthetic-record' || b.params.name!==a.toolIdentity
        || canonical(args)!==canonical(a.canonicalArguments))return deny('ATG_EXACT_ACTION_MISMATCH');
      const check=verifyExactActionAtExecution(g.issuance.gatePass,a,context);
      if(!check.verified)return deny('ATG_AUTHORITY_NOT_VERIFIED');
      return {interceptorOutputVersion:'1.0',mcp:{transformedGatewayRequest:{body:b}}};
    } catch {return deny('ATG_INTERCEPTOR_UNAVAILABLE_OR_INVALID');}
  };
}

export function eventFor(grant) {
  const body={jsonrpc:'2.0',id:'synthetic-request-1',method:'tools/call',params:{
    name:grant.proposedAction.toolIdentity,arguments:structuredClone(grant.proposedAction.canonicalArguments)}};
  return {interceptorInputVersion:'1.0',mcp:{rawGatewayRequest:{body:JSON.stringify(body)},gatewayRequest:{path:'/mcp',httpMethod:'POST',body}}};
}
