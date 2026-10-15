import { SyntheticDestinationProcess } from '../dist/src/destination-process-client.js';
import { SeparateDestinationAuthority } from '../dist/src/separate-destination-authority.js';
import { readFileSync, readSync, writeSync } from 'node:fs';
import { join } from 'node:path';
const root=process.argv[2], trust=JSON.parse(readFileSync(join(root,'host-trust.json'),'utf8'));
const {client}=await SyntheticDestinationProcess.start(join(root,'destination-owned'),false,trust);
const authority=new SeparateDestinationAuthority({stateDirectory:join(root,'atg-authority'),destination:client,trust});
process.send({phase:'ready',pid:process.pid});
process.on('message', async m=>{
  try {
    let value;
    if(m.barrier==='before_operation') { writeSync(1,JSON.stringify({barrier:m.barrier})+'\n');readSync(0,Buffer.alloc(1),0,1,null); }
    switch(m.op) {
      case 'approve':value=await authority.approve(m.request);break;
      case 'claim':value=await authority.claim(m.id,m.request);break;
      case 'submit':value=await authority.submit(m.claim);break;
      case 'reconcile':value=await authority.reconcile(m.id);break;
      case 'stop':value=await authority.emergencyStop();break;
      case 'revoke':value=await authority.revoke(m.id);break;
      case 'snapshot':value=authority.snapshot();break;
      case 'close':authority.close();await client.close();process.send({id:m.callId,value:true});process.disconnect();return;
      default:throw Error('UNKNOWN_OPERATION');
    }
    if(m.barrier==='after_operation') { writeSync(1,JSON.stringify({barrier:m.barrier})+'\n');readSync(0,Buffer.alloc(1),0,1,null); }
    process.send({id:m.callId,value});
  } catch(e) { process.send({id:m.callId,error:e.message}); }
});
process.on('disconnect',()=>{ client.child.kill();try{authority.close();}catch{} });
