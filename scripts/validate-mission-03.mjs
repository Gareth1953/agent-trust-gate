import { spawnSync } from 'node:child_process';
import { mkdirSync,readFileSync,writeFileSync,mkdtempSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname,join,resolve } from 'node:path';
const root=resolve('.');
const npm=process.env.npm_execpath??join(dirname(process.execPath),'node_modules/npm/bin/npm-cli.js');
const node20=process.env.ATG_NODE20_PATH;
if(Number(process.versions.node.split('.')[0])<24 || !node20)throw Error('Run on Node 24+ with ATG_NODE20_PATH pointing to the existing temporary Node 20 executable.');
const version20=spawnSync(node20,['--version'],{encoding:'utf8'});
if(version20.status!==0||!/^v20\./.test(version20.stdout))throw Error('Actual Node 20 required; never replace installed Node.');
const parent=join(root,'.atg-evaluation','mission03-validation');mkdirSync(parent,{recursive:true});
const output=mkdtempSync(join(parent,'run-'));
const sha=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const preserved={
 'discovery-site/downloads/agent-trust-gate-plugin-0.1.0-local.2.tgz':'3303ae690b2b00de22e9b0ed6c52078d06fd1571d77984ea10d0f8484c02ee2a',
 'discovery-site/downloads/agent-trust-gate-plugin-0.1.0-local.3.tgz':'62086a6cf7740ff72dafa81b821097d593b262ec019481654fb84caca5b673f0',
 'discovery-site/downloads/agent-trust-gate-plugin-0.1.0-local.4.tgz':'164a25d41fdda287c4da265f7511802af4f358e7a3f5460395d6bf9377a66800',
 'discovery-site/challenge-results.json':'9cce1c1db60ae4cf1f610ab6f8af46c52aa5f28b409d6c4e6f27efe80920fd74',
};
for(const [p,h] of Object.entries(preserved)) {
 const file=join(root,p);
 // Git checks out this retained JSON with CRLF on Windows. Verify reviewed LF bytes,
 // then preserve the exact initial checkout bytes through all checks.
 const reviewed=p.endsWith('.json')?createHash('sha256').update(readFileSync(file,'utf8').replaceAll('\r\n','\n')).digest('hex'):sha(file);
 if(reviewed!==h)throw Error('Preserved artifact changed: '+p);
 preserved[p]=sha(file);
}
// Use the reviewed exact-archive installer, retaining its newly created smoke state.
// No pack/build-standalone invocation and no approved archive is replaced.
let installer=readFileSync(join(root,'scripts/test-standalone-plugin-package.mjs'),'utf8');
for(const [before,after] of [
 ["from './checked-command.mjs'","from "+JSON.stringify('file:///'+join(root,'scripts/checked-command.mjs').replaceAll('\\','/'))],
 ["const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');",'const root = '+JSON.stringify(root)+';'],
]){if(!installer.includes(before))throw Error('Installer retention transform no longer matches reviewed source');installer=installer.replace(before,after);}
installer=installer.replace('rmSync(scratch, { recursive: true, force: true });',"console.log('Retained fresh installed package/state: '+scratch);");
const installedCheck=join(output,'installed-check.mjs');writeFileSync(installedCheck,installer,{flag:'wx'});
const archive=join(root,'discovery-site/downloads/agent-trust-gate-plugin-0.1.0-local.4.tgz');
const summary={baseCommit:'0dcd8dfcb0583c0d242517764390acde9b244920',packagingScope:'Historical Mission 03 source/prior-local.4 baseline checks; use validate:mission-03-buyer-release for current exact local.5 checks',node:process.version,node20:version20.stdout.trim(),node20Sha256:sha(node20),preservedArtifacts:preserved,startedAt:new Date().toISOString(),output,checks:[]};
const sourcePaths=['package.json','src/destination-evidence.ts','src/destination-process-client.ts','src/separate-destination-authority.ts',
 'scripts/destination-process.mjs','scripts/mission-03-fixture.mjs','scripts/mission-03-worker.mjs','scripts/mission-03-demo.mjs','scripts/verify-destination-evidence.mjs','scripts/validate-mission-03.mjs',
 'test/destination-evidence.test.mjs','schemas/destination-evidence.synthetic.v1.schema.json','docs/mission-03-destination-evidence.md','docs/mission-03-partner-adapter-contract.md'];
summary.sourceHashes=Object.fromEntries(sourcePaths.map(p=>[p,sha(join(root,p))]));
const env={...process.env,npm_execpath:npm};delete env.ATG_PACKAGED_EVIDENCE_PATH;
const npmStep=(name,script)=>[name,process.execPath,[npm,'run',script]];
const steps=[
 npmStep('typecheck','typecheck'),npmStep('focused','test:destination-evidence'),npmStep('full-regression','test'),
 ['installed-node24',process.execPath,[installedCheck,'--archive',archive]],['installed-node20',node20,[installedCheck,'--archive',archive]],
 npmStep('reviewer','reviewer'),npmStep('challenge','demo:challenge'),npmStep('public-claims','validate:public-claims'),
 npmStep('discovery','validate:discovery-site'),npmStep('release-preservation','validate:plugin-release'),
 ['demo',process.execPath,['scripts/mission-03-demo.mjs','--state',join(output,'demo-state')]],
 ['diff-check','git',['diff','--check']],
];
console.log('Validation logs/state retained at '+output);
for(const [name,executable,args] of steps) {
 const start=Date.now();const r=spawnSync(executable,args,{cwd:root,env,encoding:'utf8',shell:false,timeout:600000,maxBuffer:100*1024*1024});
 const log=(r.stdout??'')+'\n'+(r.stderr??'');const file=join(output,name+'.log');writeFileSync(file,log,{flag:'wx'});
 const counts=[...log.matchAll(/(?:# |ℹ )?(tests|pass|fail) (\d+)/g)].map(m=>({kind:m[1],count:Number(m[2])}));
 summary.checks.push({name,executable,args,exitCode:r.status,error:r.error?.message??null,durationMs:Date.now()-start,log:file,sha256:sha(file),counts});
 writeFileSync(join(output,'summary.json'),JSON.stringify(summary,null,2)+'\n');console.log(name+': exit '+r.status+'; '+JSON.stringify(counts));
 if(r.error||r.status!==0){console.error(log.slice(-12000));process.exitCode=1;break;}
}
summary.finishedAt=new Date().toISOString();summary.preservedHashesMatch=Object.entries(preserved).every(([p,h])=>sha(join(root,p))===h);
summary.sourcesUnchanged=Object.entries(summary.sourceHashes).every(([p,h])=>sha(join(root,p))===h);
if(!summary.preservedHashesMatch||!summary.sourcesUnchanged)process.exitCode=1;
summary.passed=summary.checks.length===steps.length&&summary.checks.every(c=>c.exitCode===0)&&summary.preservedHashesMatch&&summary.sourcesUnchanged;
writeFileSync(join(output,'summary.json'),JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify({passed:summary.passed,summary:join(output,'summary.json')}));
