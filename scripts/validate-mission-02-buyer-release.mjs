import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
const root=resolve('.');
const npm=process.env.npm_execpath ?? join(dirname(process.execPath),'node_modules/npm/bin/npm-cli.js');
const node20=process.env.ATG_NODE20_PATH ?? join(root,'.atg-evaluation/mission-02-node20/node.exe');
const check20=spawnSync(node20,['--version'],{encoding:'utf8',shell:false});
if(check20.error||check20.status!==0||!/^v20\./.test(check20.stdout)) throw new Error('Actual Node 20 required: set ATG_NODE20_PATH to a temporary Node 20 executable. Do not replace the installed runtime.');
const output=join(root,'reports/mission-02-buyer-release');mkdirSync(output,{recursive:true});
const archive='discovery-site/downloads/agent-trust-gate-plugin-0.1.0-local.4.tgz';
const sha=path=>createHash('sha256').update(readFileSync(join(root,path))).digest('hex');
const preserved={'discovery-site/downloads/agent-trust-gate-plugin-0.1.0-local.2.tgz':'3303ae690b2b00de22e9b0ed6c52078d06fd1571d77984ea10d0f8484c02ee2a','discovery-site/downloads/agent-trust-gate-plugin-0.1.0-local.3.tgz':'62086a6cf7740ff72dafa81b821097d593b262ec019481654fb84caca5b673f0','discovery-site/challenge-results.json':'9cce1c1db60ae4cf1f610ab6f8af46c52aa5f28b409d6c4e6f27efe80920fd74'};
for(const [path,hash] of Object.entries(preserved)) if(sha(path)!==hash) throw new Error('Preserved artifact changed: '+path);
const summary={baseCommit:'56cd3707c767f9e40d211617ad9b4b17867f9419',version:'0.1.0-local.4',node:process.version,node20:check20.stdout.trim(),node20Sha256:createHash('sha256').update(readFileSync(node20)).digest('hex'),platform:process.platform,archive,sha256:sha(archive),evidence:'discovery-site/multi-worker-results-local.4.json',evidenceSha256:sha('discovery-site/multi-worker-results-local.4.json'),preservedArtifacts:preserved,startedAt:new Date().toISOString(),checks:[]};
const env={...process.env,npm_execpath:npm};delete env.ATG_PACKAGED_EVIDENCE_PATH;
const steps=[
 ['typecheck',process.execPath,[npm,'run','typecheck']],
 ['full-regression',process.execPath,[npm,'run','test']],
 ['plugin-exact-node24',process.execPath,[npm,'run','test:plugin','--','--archive',archive]],
 ['plugin-exact-node20',node20,['scripts/test-standalone-plugin-package.mjs','--archive',archive]],
 ['reviewer',process.execPath,[npm,'run','reviewer']],
 ['challenge',process.execPath,[npm,'run','demo:challenge']],
 ['public-claims',process.execPath,[npm,'run','validate:public-claims']],
 ['discovery-site',process.execPath,[npm,'run','validate:discovery-site']],
 ['archive-checksums-links',process.execPath,[npm,'run','validate:plugin-release']]
];
for(const [name,executable,args] of steps) {
 const start=Date.now();const r=spawnSync(executable,args,{cwd:root,env,encoding:'utf8',shell:false,maxBuffer:100*1024*1024,timeout:300000});
 const log=(r.stdout??'')+'\n'+(r.stderr??'');const file=name+'.log';writeFileSync(join(output,file),log);
 const counts=[...log.matchAll(/(?:# |ℹ )?(tests|pass|fail) (\d+)/g)].map(m=>({kind:m[1],count:Number(m[2])}));
 summary.checks.push({name,executable,args,exitCode:r.status,error:r.error?.message??null,durationMs:Date.now()-start,log:'reports/mission-02-buyer-release/'+file,sha256:sha('reports/mission-02-buyer-release/'+file),counts});
 writeFileSync(join(output,'summary.json'),JSON.stringify(summary,null,2)+'\n');console.log(name+': exit '+r.status+'; '+JSON.stringify(counts));
 if(r.error||r.status!==0){console.error(log.slice(-10000));process.exitCode=1;break;}
}
summary.finishedAt=new Date().toISOString();writeFileSync(join(output,'summary.json'),JSON.stringify(summary,null,2)+'\n');
