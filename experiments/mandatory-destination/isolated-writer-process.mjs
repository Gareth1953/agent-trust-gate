// Disposable Linux trusted writer principal; no agent-accessible API.
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {CustodyWitness} from '../../dist/src/custody-witness.js';
import {reserveViaCheckpoint} from './checkpoint-tls-service.mjs';
import {AsyncCheckpointedSyntheticDestination} from './async-checkpointed-destination.mjs';

const configPath=process.argv[2];
if(process.platform!=='linux'||!process.getuid || process.getuid()===0 || !configPath)
  throw Error('ISOLATED_WRITER_NONROOT_CONFIG_REQUIRED');
const c=JSON.parse(readFileSync(resolve(configPath),'utf8'));
if(c.writerUid!==process.getuid() || c.schema!=='atg.writer-isolation.synthetic.v1')
  throw Error('WRITER_UID_OR_CONFIG_INVALID');
const writer=new CustodyWitness({path:c.path,trust:c.trust,now:()=>new Date(c.syntheticNow)});
try {
  const destination=new AsyncCheckpointedSyntheticDestination({
    writer,domainId:c.trust.domainId,reserve:proposal=>reserveViaCheckpoint(c.checkpointClient,proposal)
  });
  const result=await destination.execute(c.grant,c.ctx);
  process.stdout.write(JSON.stringify(result)+'\n');
}finally{writer.close();}
