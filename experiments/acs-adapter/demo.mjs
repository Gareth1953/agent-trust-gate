import { fixture } from './fixture.mjs';
import { evaluateAcsToolHook as evaluate } from './adapter.mjs';

const f=fixture();
try {
  const request=structuredClone(f.request);
  const changed=structuredClone(request);changed.params.payload.arguments.amountMinorUnits.value=1;
  const denied=evaluate(changed,f.grant,f.context);
  const admitted=evaluate(request,f.grant,f.context);
  const before=f.witness.lookup(f.grant);
  const committed=f.witness.execute(f.grant);
  const replay=evaluate(request,f.grant,f.context);
  const destinationReplay=f.witness.execute(f.grant);
  console.log(JSON.stringify({schema:'atg.acs.synthetic-walkthrough.v1',syntheticOnly:true,
    upstream:{release:'v0.1.4',commit:'834f3f0d51e7bbbd9a68ff682bec89f97ddd72d8',specification:'0.1.0'},
    requests:[request,changed],responses:[denied,admitted,replay],
    beforeAdmissionExecution:before.outcome,committed:committed.outcome,destinationReplay:destinationReplay.outcome,
    productionReady:false,acsCoreConformance:false,independentReview:false},null,2));
} finally {f.close();}
