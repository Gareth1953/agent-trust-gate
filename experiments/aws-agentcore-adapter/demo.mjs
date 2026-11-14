import cedar from '@cedar-policy/cedar-wasm/nodejs';
import {fixture} from '../acs-adapter/fixture.mjs';
import {createInterceptor,eventFor,cedarDecision} from './adapter.mjs';
const f=fixture();
try {
  const interceptor=createInterceptor({grant:f.grant,context:f.context,principal:'synthetic-agent'});
  const event=eventFor(f.grant),changed=structuredClone(event);
  changed.mcp.gatewayRequest.body.params.arguments.amountMinorUnits=1;
  changed.mcp.rawGatewayRequest.body=JSON.stringify(changed.mcp.gatewayRequest.body);
  const nativeChanged=cedarDecision(changed.mcp.gatewayRequest.body.params.arguments,'synthetic-agent');
  const changedResult=interceptor(changed),permitted=interceptor(event),before=f.witness.lookup(f.grant).outcome;
  const result=f.witness.execute(f.grant),replay=interceptor(event);
  console.log(JSON.stringify({schema:'atg.agentcore-contract.synthetic.v1',cedarVersion:cedar.getCedarVersion(),
    nativeChangedAmount:nativeChanged.response.decision,changedResult,permitted,beforeSyntheticCommit:before,
    committed:result.outcome,replay,liveAwsDeployment:false,productionReady:false},null,2));
}finally{f.close();}
