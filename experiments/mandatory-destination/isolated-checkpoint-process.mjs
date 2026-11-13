// Disposable Linux checkpoint principal. Source-only, no external listener.
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {SyntheticConsumptionAnchor} from '../anti-rollback/consumption-anchor.mjs';
import {startSyntheticCheckpointService} from './checkpoint-tls-service.mjs';

const configPath=process.argv[2];
if(process.platform!=='linux'||!process.getuid || process.getuid()===0 || !configPath)
  throw Error('ISOLATED_CHECKPOINT_NONROOT_CONFIG_REQUIRED');
const c=JSON.parse(readFileSync(resolve(configPath),'utf8'));
if(c.checkpointUid!==process.getuid() || c.schema!=='atg.checkpoint-isolation.synthetic.v1')
  throw Error('CHECKPOINT_UID_OR_CONFIG_INVALID');
const anchor=new SyntheticConsumptionAnchor(c.path,c.domainId);
const service=await startSyntheticCheckpointService({
  anchor,caPath:c.caPath,certPath:c.serverCertPath,keyPath:c.serverKeyPath,
  writerFingerprint:c.writerFingerprint,
});
process.stdout.write(JSON.stringify({status:'READY',port:service.port})+'\n');
async function shutdown() {await service.close();anchor.close();process.exit(0);}
process.once('SIGTERM',shutdown);
process.once('SIGINT',shutdown);
