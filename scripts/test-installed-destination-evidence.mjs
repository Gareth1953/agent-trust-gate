import assert from 'node:assert/strict';
import { mkdtempSync,readFileSync,writeFileSync,mkdirSync,copyFileSync,existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve,join,dirname } from 'node:path';
import { pathToFileURL,fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { runCheckedCommand } from './checked-command.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2),options={};
for(let i=0;i<args.length;i+=2){assert.ok(['--archive','--public-case','--expected-version'].includes(args[i])&&!options[args[i]]);options[args[i]]=args[i+1];}
assert.ok(options['--archive'],'Use --archive EXACT_CANDIDATE_PATH [--public-case NODE24_PUBLIC_CASE_DIRECTORY]');
const expectedVersion=options['--expected-version']??'0.1.0-local.5';
assert.ok(['0.1.0-local.5','0.1.0-local.6','0.1.0-local.7'].includes(expectedVersion));
const archive=resolve(options['--archive']),npm=process.env.npm_execpath??join(dirname(process.execPath),'node_modules/npm/bin/npm-cli.js');
const scratch=mkdtempSync(join(tmpdir(),'atg-local5-installed-'));
const run=(exe,argv,cwd=scratch)=>runCheckedCommand(exe,argv,{cwd});
const hash=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const summary={archive,sha256:hash(archive),runtime:process.version,project:scratch,checks:[],passed:false};
try {
  writeFileSync(join(scratch,'package.json'),JSON.stringify({name:'atg-local5-destination-evidence-installed',private:true,type:'module'}));
  run(process.execPath,[npm,'--cache',join(scratch,'npm-cache'),'install','--offline','--ignore-scripts','--no-audit','--no-fund',archive]);
  const pkg=join(scratch,'node_modules/@agent-trust-gate/plugin'),metadata=JSON.parse(readFileSync(join(pkg,'package.json'),'utf8'));
  assert.equal(metadata.version,expectedVersion);assert.equal(metadata.private,true);assert.equal(metadata.engines.node,'>=20');
  for(const name of ['destination-evidence','destination-process-client','separate-destination-authority','destination-evidence-fixture','destination-evidence-schema'])assert.ok(metadata.exports['./'+name]);
  assert.equal(metadata.bin['atg-destination-evidence'],'./scripts/destination-evidence-demo.mjs');assert.equal(metadata.bin['atg-evidence-verify'],'./scripts/verify-destination-evidence.mjs');
  const demo=join(pkg,'scripts/destination-evidence-demo.mjs'),verifier=join(pkg,'scripts/verify-destination-evidence.mjs');
  assert.match(run(process.execPath,[demo,'--help']),/Node 24/);assert.match(run(process.execPath,[verifier,'--help']),/Node 20/);
  assert.equal(existsSync(join(scratch,'destination-state')),false);
  summary.checks.push({name:'installed metadata/exports/CLIs and no setup on help',passed:true});
  if(Number(process.versions.node.split('.')[0])>=24) {
    const state=join(scratch,'destination-state');
    const observations=JSON.parse(run(process.execPath,[demo,'--state',state]));
    assert.equal(observations.passed,true);assert.equal(observations.pluginVersion,expectedVersion);assert.equal(observations.cases.length,8);
    assert.ok(observations.cases.every(c=>c.passed));assert.equal(observations.boundary.independentExternalCapture,false);assert.equal(observations.boundary.hostAdministratorProtection,false);
    summary.publicVerificationDirectory=join(state,'signed-outcome/public');summary.observations=join(state,'results.json');
    summary.checks.push({name:'exact installed CLI eight signed destination scenarios',passed:true,cases:observations.cases.map(c=>c.id)});
    let tests=readFileSync(join(root,'test/destination-evidence.test.mjs'),'utf8');
    const exports={ 'scripts/mission-03-fixture.mjs':'destination-evidence-fixture','dist/src/destination-process-client.js':'destination-process-client',
      'dist/src/separate-destination-authority.js':'separate-destination-authority','dist/src/destination-evidence.js':'destination-evidence','dist/src/standalone-plugin.js':'' };
    tests=tests.replace(/from '\.\.\/([^']+)'/g,(_match,path)=>'from '+JSON.stringify(path in exports?'@agent-trust-gate/plugin'+(exports[path]?'/'+exports[path]:''):pathToFileURL(join(pkg,path)).href));
    for(const p of ['scripts/mission-03-worker.mjs','scripts/verify-destination-evidence.mjs','dist','src','scripts','package.json'])tests=tests.replaceAll("resolve('"+p+"')",JSON.stringify(join(pkg,p)));
    const testFile=join(scratch,'installed-destination-cases.test.mjs');writeFileSync(testFile,tests,{flag:'wx'});
    const log=run(process.execPath,['--test','--test-reporter=tap',testFile]);writeFileSync(join(scratch,'installed-35-cases.log'),log,{flag:'wx'});
    assert.match(log,/# tests 35/);assert.match(log,/# fail 0/);
    summary.checks.push({name:'35 reviewed cases against installed exports/runtime, including actual Node 20 restricted verification',passed:true,tests:35});
  } else {
    assert.match(process.version,/^v20\./);assert.ok(options['--public-case'],'Actual Node 20 check requires copied valid public inputs from exact Node 24 installed run');
    const publicDir=join(scratch,'public-inputs');mkdirSync(publicDir);
    for(const name of ['trust','approval','lookup','evidence'])copyFileSync(join(resolve(options['--public-case']),name+'.json'),join(publicDir,name+'.json'));
    const guard=join(publicDir,'restricted-installed-verifier.mjs');
    const privatePath=join(resolve(options['--public-case']),'../destination-owned/signing-private.pem'),authorityPath=join(resolve(options['--public-case']),'../atg-authority/authority.sqlite');
    assert.ok(existsSync(privatePath));assert.ok(existsSync(authorityPath)); // stat only, never read key bytes
    writeFileSync(guard,`import assert from 'node:assert/strict';import {readFileSync,writeFileSync} from 'node:fs';
      assert.equal(process.permission.has('fs.write'),false);assert.throws(()=>writeFileSync('probe.txt','denied'),{code:'ERR_ACCESS_DENIED'});
      for(const p of ${JSON.stringify([privatePath,authorityPath])})assert.throws(()=>readFileSync(p),{code:'ERR_ACCESS_DENIED'});
      await import(${JSON.stringify(pathToFileURL(verifier).href)});`);
    const result=JSON.parse(run(process.execPath,['--experimental-permission','--allow-fs-read='+publicDir,'--allow-fs-read='+pkg,guard,'--trust',join(publicDir,'trust.json'),'--approval',join(publicDir,'approval.json'),'--evidence',join(publicDir,'evidence.json'),'--lookup',join(publicDir,'lookup.json'),'--now','2026-09-02T09:01:00.000Z']));
    assert.equal(result.verified,true);assert.match(result.runtime,/^v20\./);assert.equal(result.outcome,'EXECUTED');
    writeFileSync(join(scratch,'optional-exports.mjs'),`import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {canonicalDestinationEvidence} from '@agent-trust-gate/plugin/destination-evidence';
      assert.equal(canonicalDestinationEvidence({b:2,a:1}),'\u007b"a":1,"b":2\u007d');
      assert.ok(createRequire(import.meta.url).resolve('@agent-trust-gate/plugin/destination-evidence-schema'));
      await assert.rejects(import('@agent-trust-gate/plugin/separate-destination-authority'),/ATG_SHARED_WORKER_REQUIRES_NODE_24/);
      await assert.rejects(import('@agent-trust-gate/plugin/destination-evidence-fixture'),/ATG_SHARED_WORKER_REQUIRES_NODE_24/);
      assert.throws(()=>createRequire(import.meta.url)('@agent-trust-gate/plugin/separate-destination-authority'),/ATG_SHARED_WORKER_REQUIRES_NODE_24/);
      await assert.rejects(import('@agent-trust-gate/plugin/separate-destination-authority'),/ATG_SHARED_WORKER_REQUIRES_NODE_24/);
      const {SyntheticDestinationProcess}=await import('@agent-trust-gate/plugin/destination-process-client');await assert.rejects(SyntheticDestinationProcess.start(${JSON.stringify(join(scratch,'unsupported-setup'))},true),/ATG_SHARED_WORKER_REQUIRES_NODE_24/);
      const legacy=await import('@agent-trust-gate/plugin');assert.equal(legacy.createSyntheticPluginRequest('enforced').mode,'enforced');`);
    run(process.execPath,['optional-exports.mjs']);
    assert.throws(()=>run(process.execPath,[demo,'--state',join(scratch,'unsupported-demo')]),/ATG_SHARED_WORKER_REQUIRES_NODE_24/);
    assert.equal(existsSync(join(scratch,'unsupported-setup')),false);assert.equal(existsSync(join(scratch,'unsupported-demo')),false);
    summary.checks.push({name:'actual Node 20 standalone installed verifier with no writable state/private-key access',passed:true,outcome:result.outcome});
    summary.checks.push({name:'optional Node 24 exports/setup/demo reject Node 20 without state/key creation; legacy import remains usable',passed:true});
  }
  assert.equal(hash(archive),summary.sha256);summary.passed=true;
} catch(error) {summary.error=String(error);process.exitCode=1;console.error(error);}
finally {writeFileSync(join(scratch,'summary.json'),JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify({...summary,summary:join(scratch,'summary.json')}));}
