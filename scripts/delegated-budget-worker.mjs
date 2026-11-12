// Disposable synthetic test child: two independent Node processes, one SQLite budget.
import { readFileSync } from 'node:fs';
import { SyntheticDelegatedBudgetWriter } from '../dist/src/delegated-budget-witness.js';
const [path, trustPath, requestPath] = process.argv.slice(2);
if (!path || !trustPath || !requestPath) throw Error('CHILD_ARGS_MISSING');
const trust=JSON.parse(readFileSync(trustPath,'utf8'));
const {req,ctx}=JSON.parse(readFileSync(requestPath,'utf8'));
const writer=new SyntheticDelegatedBudgetWriter({path,trust,now:()=>new Date('2026-11-12T12:00:00.000Z')});
try { process.stdout.write(JSON.stringify(writer.execute(req,ctx))+'\n'); }
finally { writer.close(); }
