// Reproducible buyer-only synthetic demonstration. No external agents or payments.
import { mkdtempSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createDelegatedBudgetFixture } from './delegated-budget-fixture.mjs';

const root=mkdtempSync(join(tmpdir(),'atg-delegated-budget-demo-'));
let writer;
function check(label,r,expected) {
  if (r.outcome!==expected) throw Error(label+' unexpected '+r.outcome+' / '+r.reason);
  process.stdout.write(label+' => '+r.outcome+' ('+r.reason+')\n');
}
try{
  const f=createDelegatedBudgetFixture(root);
  writer=f.open();
  process.stdout.write('ATG delegated authority & shared allowance — SYNTHETIC, NOT PRODUCTION\n');
  process.stdout.write('One signed organisation mandate permits two agent paths to share £5,000.\n');
  const b=f.request({leaf:'agent-B',amountMinor:300000});
  const a=f.request({leaf:'agent-A',amountMinor:200000});
  check('01 Wrong authenticated agent identity',writer.execute(b.req,a.ctx),'REJECTED');
  check('02 Sub-agent B makes a £3,000 synthetic purchase',writer.execute(b.req,b.ctx),'COMMITTED');
  check('03 Agent A makes a £2,000 synthetic purchase',writer.execute(a.req,a.ctx),'COMMITTED');
  const tooMuch=f.request({leaf:'agent-B',amountMinor:100});
  check('04 Combined spending beyond £5,000',writer.execute(tooMuch.req,tooMuch.ctx),'REJECTED');
  check('05 Reusing already consumed authority',writer.execute(b.req,b.ctx),'REJECTED');
  check('06 Historical evidence of the first purchase',writer.lookup(b.req.action.actionId),'COMMITTED');
  const expanded=f.request({secondOverrides:{payeeId:'unapproved-supplier'}});
  check('07 Signed attempted sub-agent privilege expansion',writer.execute(expanded.req,expanded.ctx),'REJECTED');
  process.stdout.write('PASS: no external orders, payments, identities, or live tools executed.\n');
  process.stdout.write('Important hold: writer-admin and full-state restore remain capable of bypass without independent custody.\n');
}finally{writer?.close();rmSync(root,{recursive:true,force:true});}
