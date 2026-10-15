import { spawnSync } from 'node:child_process';
import { mkdirSync,mkdtempSync,readFileSync,writeFileSync } from 'node:fs';
import { dirname,join,resolve } from 'node:path';
import { createHash } from 'node:crypto';
const root=resolve('.'),npm=process.env.npm_execpath??join(dirname(process.execPath),'node_modules/npm/bin/npm-cli.js');
const node20=process.env.ATG_NODE20_PATH;
if(Number(process.versions.node.split('.')[0])<24 || !node20)throw Error('Use Node 24+ with ATG_NODE20_PATH pointing to the preserved actual temporary Node 20 executable.');
const version20=spawnSync(node20,['--version'],{encoding:'utf8'});if(version20.status!==0||!/^v20\./.test(version20.stdout))throw Error('Actual Node 20 required; do not replace installed Node.');
const sha=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const archive='discovery-site/downloads/agent-trust-gate-plugin-0.1.0-local.5.tgz',expected='672484c3d3ac3e2efe69f2dee66fef465f10700c73c992274a6b1ea382bb2d7e';
if(sha(join(root,archive))!==expected)throw Error('Exact candidate archive changed; never rebuild/replace it.');
const oldArchives={
 'discovery-site/downloads/agent-trust-gate-plugin-0.1.0-local.2.tgz':'3303ae690b2b00de22e9b0ed6c52078d06fd1571d77984ea10d0f8484c02ee2a',
 'discovery-site/downloads/agent-trust-gate-plugin-0.1.0-local.3.tgz':'62086a6cf7740ff72dafa81b821097d593b262ec019481654fb84caca5b673f0',
 'discovery-site/downloads/agent-trust-gate-plugin-0.1.0-local.4.tgz':'164a25d41fdda287c4da265f7511802af4f358e7a3f5460395d6bf9377a66800',
};
for(const [p,h] of Object.entries(oldArchives))if(sha(join(root,p))!==h)throw Error('Old archive changed: '+p);
const challenge=readFileSync(join(root,'discovery-site/challenge-results.json'),'utf8').replaceAll('\r\n','\n');
if(createHash('sha256').update(challenge).digest('hex')!=='9cce1c1db60ae4cf1f610ab6f8af46c52aa5f28b409d6c4e6f27efe80920fd74')throw Error('Retained Challenge content changed');
const preserved={...oldArchives,[archive]:expected};
for(const p of ['discovery-site/challenge-results.json','discovery-site/challenge.html','discovery-site/multi-worker-results-local.4.json'])preserved[p]=sha(join(root,p));
const parent=join(root,'.atg-evaluation/mission03-buyer-release-validation');mkdirSync(parent,{recursive:true});const output=mkdtempSync(join(parent,'run-'));
const env={...process.env,npm_execpath:npm};delete env.ATG_PACKAGED_EVIDENCE_PATH;
const summary={publishedBase:'0dcd8dfcb0583c0d242517764390acde9b244920',reviewedMissionCommit:'327ab2fcae590de89e886abfc12fc181f56f8dac',pluginVersion:'0.1.0-local.5',archive,sha256:expected,node:process.version,node20:version20.stdout.trim(),node20Sha256:sha(node20),preservedArtifacts:preserved,startedAt:new Date().toISOString(),output,checks:[]};
const sources=['package.json','src/standalone-plugin.ts','scripts/build-standalone-plugin.mjs','scripts/mission-03-fixture.mjs','scripts/separate-destination-authority-entry.mjs','scripts/destination-evidence-demo.mjs','scripts/verify-destination-evidence.mjs','scripts/test-standalone-plugin-package.mjs','scripts/test-installed-destination-evidence.mjs','scripts/validate-plugin-release.mjs','scripts/validate-mission-03-buyer-release.mjs','docs/destination-evidence-evaluation.md','docs/standalone-plugin.md','discovery-site/plugin.html','discovery-site/destination-evidence-results-local.5.json','schemas/destination-evidence.synthetic.v1.schema.json'];
summary.sourceHashes=Object.fromEntries(sources.map(p=>[p,sha(join(root,p))]));
const npmStep=(name,script)=>[name,process.execPath,[npm,'run',script]];
let publicCase;
const steps=[npmStep('typecheck','typecheck'),npmStep('focused-mission03','test:destination-evidence'),npmStep('full-regression','test'),
 ['legacy-exact-node24',process.execPath,['scripts/test-standalone-plugin-package.mjs','--archive',archive]],
 ['legacy-exact-node20',node20,['scripts/test-standalone-plugin-package.mjs','--archive',archive]],
 ['mission03-exact-node24',process.execPath,['scripts/test-installed-destination-evidence.mjs','--archive',archive]],
 ['mission03-exact-node20',node20,()=>['scripts/test-installed-destination-evidence.mjs','--archive',archive,'--public-case',publicCase]],
 npmStep('reviewer','reviewer'),npmStep('challenge','demo:challenge'),npmStep('public-claims','validate:public-claims'),npmStep('discovery','validate:discovery-site'),npmStep('archive-checksums-links-evidence','validate:plugin-release'),['working-diff-check','git',['diff','--check']]];
console.log('Buyer-release validation logs/state retained at '+output);
for(const [name,executable,argv] of steps){
 const args=typeof argv==='function'?argv():argv,start=Date.now();const r=spawnSync(executable,args,{cwd:root,env,encoding:'utf8',shell:false,timeout:600000,maxBuffer:100*1024*1024});
 const log=(r.stdout??'')+'\n'+(r.stderr??''),file=join(output,name+'.log');writeFileSync(file,log,{flag:'wx'});
 const counts=[...log.matchAll(/(?:# |ℹ )?(tests|pass|fail) (\d+)/g)].map(m=>({kind:m[1],count:Number(m[2])}));
 summary.checks.push({name,executable,args,exitCode:r.status,error:r.error?.message??null,durationMs:Date.now()-start,log:file,sha256:sha(file),counts});
 if(name.startsWith('mission03-exact-')&&r.status===0){const parsed=JSON.parse(r.stdout.trim().split(/\r?\n/).filter(Boolean).at(-1));if(!parsed.passed||parsed.sha256!==expected)throw Error('Installed exact-archive summary did not pass');if(name==='mission03-exact-node24')publicCase=parsed.publicVerificationDirectory;summary.checks.at(-1).installedSummary=parsed;}
 writeFileSync(join(output,'summary.json'),JSON.stringify(summary,null,2)+'\n');console.log(name+': exit '+r.status+'; '+JSON.stringify(counts));
 if(r.error||r.status!==0){console.error(log.slice(-12000));process.exitCode=1;break;}
}
summary.finishedAt=new Date().toISOString();summary.preservedHashesMatch=Object.entries(preserved).every(([p,h])=>sha(join(root,p))===h);summary.sourcesUnchanged=Object.entries(summary.sourceHashes).every(([p,h])=>sha(join(root,p))===h);
summary.passed=summary.checks.length===steps.length&&summary.checks.every(c=>c.exitCode===0)&&summary.preservedHashesMatch&&summary.sourcesUnchanged;
if(!summary.passed)process.exitCode=1;writeFileSync(join(output,'summary.json'),JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify({passed:summary.passed,summary:join(output,'summary.json')}));
