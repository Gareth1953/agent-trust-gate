import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
const root=resolve('.');
const npm=process.env.npm_execpath ?? join(dirname(process.execPath),'node_modules/npm/bin/npm-cli.js');
if (!existsSync(npm)) throw new Error('Run through npm run validate:mission-02.');
const output=join(root,process.env.ATG_VALIDATION_REPORT_DIR ?? 'reports/mission-02'); mkdirSync(output,{recursive:true});
const summary={baseCommit:'c93d25aa810d3a813cfa5aefe2f85997089dc7f8',node:process.version,platform:process.platform,startedAt:new Date().toISOString(),checks:[]};
for (const name of ['typecheck','test:multi-worker','test','test:plugin','reviewer','demo:challenge','validate:public-claims','validate:discovery-site']) {
  const start=Date.now(); const r=spawnSync(process.execPath,[npm,'run',name],{cwd:root,encoding:'utf8',maxBuffer:100*1024*1024,timeout:300000,shell:false});
  const log=(r.stdout??'')+'\n'+(r.stderr??''); const filename=name.replaceAll(':','-')+'.log'; writeFileSync(join(output,filename),log);
  const counts=[...log.matchAll(/(?:# |ℹ )?(tests|pass|fail) (\d+)/g)].map(m=>({kind:m[1],count:Number(m[2])}));
  const check={command:'npm run '+name,exitCode:r.status,error:r.error?.message??null,durationMs:Date.now()-start,log:filename,sha256:createHash('sha256').update(log).digest('hex'),counts};
  summary.checks.push(check); writeFileSync(join(output,'summary.json'),JSON.stringify(summary,null,2)+'\n');
  console.log(name+': exit '+r.status+'; '+JSON.stringify(counts));
  if(r.error||r.status!==0){console.error(log.slice(-8000));process.exitCode=1;break;}
}
summary.finishedAt=new Date().toISOString(); writeFileSync(join(output,'summary.json'),JSON.stringify(summary,null,2)+'\n');
