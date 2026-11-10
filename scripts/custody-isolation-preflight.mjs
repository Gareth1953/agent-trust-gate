#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const args=process.argv.slice(2);
if(args.length!==2 || args[0]!=='--output')throw Error('Use --output NEW_JSON_FILE');
let result;
try {
  execFileSync('bwrap',['--unshare-all','--ro-bind','/','/','--proc','/proc','--dev','/dev','--die-with-parent','--','/usr/bin/true'],{timeout:5000,stdio:['ignore','pipe','pipe']});
  result={status:'CAPABILITY_AVAILABLE',actualCustodyIsolation:'NOT_TESTED',productionReady:false,limits:'Capability probe only. Effective denied-access, protected mount layout, process and restore tests are still required.'};
} catch(error) {
  result={status:'BLOCKED',actualCustodyIsolation:'NOT_DEMONSTRATED',productionReady:false,reason:String(error.stderr??error.message).slice(0,300).trim(),fallbackUsed:false};
}
writeFileSync(args[1],JSON.stringify(result,null,2)+'\n',{flag:'wx',mode:0o600});console.log(JSON.stringify(result));
process.exitCode=result.status==='BLOCKED'?2:0;
