import {spawnSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
const npm='C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js';
const checks=[
['focused-node24',process.execPath,['--test','dist/test/mission-04-security.test.js']],
['focused-node20',process.env.ATG_NODE20_PATH,['--test','dist/test/mission-04-security.test.js']],
['typecheck',process.execPath,['node_modules/typescript/bin/tsc','-p','tsconfig.json','--noEmit']],
['public-claims',process.execPath,['dist/src/public-claims-evidence-validator.js']],
['discovery-site',process.execPath,['dist/src/discovery-site-validator.js']],
['reviewer',process.execPath,['dist/src/reviewer-conversion-cli.js']],
['plugin',process.execPath,[npm,'run','test:plugin']],
['immutable-local5-comparison',process.execPath,['scripts/validate-plugin-release.mjs']],
['npm-audit',process.execPath,[npm,'audit','--json']],
['ntfs-acl-elevated',process.execPath,['scripts/check-mission-04-windows-acl.mjs']]
];
const results=[];
for(const [name,exe,args] of checks){const result=spawnSync(exe,args,{encoding:'utf8',windowsHide:true,maxBuffer:16*1024*1024});writeFileSync('reports/mission-04-windows/'+name+'.log',(result.stdout??'')+(result.stderr??'')+(result.error??''));results.push({name,exitCode:result.status,error:result.error?.message});console.log(name+': '+result.status);writeFileSync('reports/mission-04-windows/check-results.json',JSON.stringify(results,null,2)+'\n');}
