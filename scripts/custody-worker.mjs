// One trusted writer worker for cross-process concurrency and crash tests.
// Fixture path is host configuration, not part of the agent's request protocol.
import { readFileSync,readSync,writeSync } from 'node:fs';
import { join } from 'node:path';
import { CustodyWitness,dispatchWitnessCommand,CUSTODY_WITNESS_MAX_BYTES } from '../dist/src/custody-witness.js';
import { FIXTURE_NOW } from './custody-fixture.mjs';
const dir=process.argv[2],trust=JSON.parse(readFileSync(join(dir,'trust.json'),'utf8'));
const writer=new CustodyWitness({path:join(dir,'witness.sqlite'),trust,now:()=>new Date(FIXTURE_NOW)});
const args=process.argv.slice(3);if(args.length && args.join(' ')!=='--pause-after-commit')throw Error('HOST_TEST_OPTION_INVALID');
// Bounded byte framing BEFORE JSON parsing. No caller-supplied admin/clock/path.
let buffer=Buffer.alloc(0),failed=false;
process.stdin.on('data',chunk=>{
  if(failed)return;
  buffer=Buffer.concat([buffer,chunk]);
  if(buffer.length>CUSTODY_WITNESS_MAX_BYTES){failed=true;writer.close();process.stdout.write(JSON.stringify({outcome:'REJECTED',reason:'FRAME_TOO_LARGE'})+'\n');process.stdin.destroy();return;}
  let newline;
  while((newline=buffer.indexOf(10))!==-1) {
    const line=buffer.subarray(0,newline);buffer=buffer.subarray(newline+1);
    let response;try{response=dispatchWitnessCommand(writer,JSON.parse(line.toString('utf8')));}catch{response={outcome:'REJECTED',reason:'FRAME_INVALID'};}
    if(args.length && response.outcome==='EXECUTED'){writeSync(1,JSON.stringify({barrier:'after_commit'})+'\n');readSync(0,Buffer.alloc(1),0,1,null);}
    process.stdout.write(JSON.stringify(response)+'\n');
  }
});
process.stdin.on('end',()=>{writer.close();});
process.stdin.on('error',()=>{writer.close();});
