import { mkdirSync, writeFileSync } from 'node:fs';
import { join, isAbsolute } from 'node:path';
import { SyntheticDestinationProcess } from '../dist/src/destination-process-client.js';
import { createLocalVerificationProfile } from '../dist/src/exact-action-gatepass.js';
import { DEFAULT_AGGREGATE_EXPOSURE_RULE } from '../dist/src/durable-action-lifecycle.js';
import { DESTINATION_CLOCK_ID } from '../dist/src/destination-evidence.js';
import { PURCHASE_ORDER_DESTINATION_IDENTITY } from '../dist/src/purchase-order-state-binding.js';

// Own guard remains authoritative even if Node's CJS cache holds partial
// exports after an earlier failed optional-authority import on Node 20.
if(Number(process.versions.node.split('.')[0])<24)throw Error('ATG_SHARED_WORKER_REQUIRES_NODE_24: fresh destination/authority setup requires Node 24+; public verification and legacy plugin remain Node 20 compatible.');
const {SeparateDestinationAuthority}=await import('../dist/src/separate-destination-authority.js');

export async function createMission03Fixture(root,maximumAggregateMinorUnits=1000000) {
  if(!isAbsolute(root)) throw Error('ABSOLUTE_NEW_RUN_REQUIRED');
  mkdirSync(root,{mode:0o700});
  const destinationDirectory=join(root,'destination-owned'), authorityDirectory=join(root,'atg-authority');
  const {client,publicKeyPem}=await SyntheticDestinationProcess.start(destinationDirectory,true);
  const issuer=createLocalVerificationProfile().keys[0];
  // Explicit synthetic host bootstrap. Only the public key crosses process IPC.
  // Production must provision authenticated public-key pins out of band.
  const trust={ destinationIdentity:PURCHASE_ORDER_DESTINATION_IDENTITY,destinationKeyId:'mission03-synthetic-destination',destinationPublicKeyPem:publicKeyPem,
    approvalIssuerIdentity:'atg:local:northstar-exact-action-policy-authority',approvalKeyId:issuer.keyId,approvalPublicKeyPem:issuer.publicKeyPem,clockId:DESTINATION_CLOCK_ID,maximumAgeMs:5000 };
  await client.configure(trust);
  writeFileSync(join(root,'host-trust.json'),JSON.stringify(trust,null,2)+'\n',{flag:'wx'});
  SeparateDestinationAuthority.initialise(authorityDirectory,trust,{...DEFAULT_AGGREGATE_EXPOSURE_RULE,maximumAggregateMinorUnits});
  const authority=new SeparateDestinationAuthority({stateDirectory:authorityDirectory,destination:client,trust});
  return {root,client,authority,trust,authorityDirectory,destinationDirectory};
}
