// Trusted Python verifier -> private stdin -> synthetic ATG destination.
// DO NOT expose this fixture issuer/pipe as an agent endpoint.
import { createInterface } from 'node:readline';
import { mkdtempSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { createCustodyFixture } from '../../scripts/custody-fixture.mjs';
import { CustodyWitness } from '../../dist/src/custody-witness.js';
const root=mkdtempSync(join(tmpdir(),'atg-ap2-'));
const f=createCustodyFixture(join(root,'fixture'));
const witness=new CustodyWitness({path:f.path,trust:f.trust,now:()=>new Date()});
try {
  for await(const line of createInterface({input:process.stdin,crlfDelay:Infinity})) {
    let result;
    try {
      if(Buffer.byteLength(line)>4096)throw Error('large');
      const p=JSON.parse(line);
      if(!p || Object.keys(p).sort().join(',')!=='amount_minor,checkout_hash,checkout_id,currency,expires_at,merchant_id'
        || p.merchant_id!=='synthetic-merchant-A' || p.currency!=='GBP'
        || !Number.isSafeInteger(p.amount_minor) || p.amount_minor<=0 || p.amount_minor>500000
        || typeof p.checkout_id!=='string' || !/^[A-Za-z0-9_-]{1,80}$/.test(p.checkout_id)
        || typeof p.checkout_hash!=='string' || !/^[a-f0-9]{64}$/.test(p.checkout_hash)
        || !Number.isSafeInteger(p.expires_at) || p.expires_at*1000<=Date.now())throw Error('invalid');
      const now=new Date().toISOString(),expiry=new Date(Math.min(p.expires_at*1000,Date.now()+300000)).toISOString();
      const idempotencyKey=createHash('sha256').update(JSON.stringify(['ap2-checkout','synthetic-tenant-A',p.merchant_id,p.checkout_id])).digest('hex');
      const grant=f.grant({issuedAt:now,notBefore:now,expiresAt:expiry,idempotencyKey},
        {amountMinorUnits:p.amount_minor,value:p.checkout_hash});
      result=witness.execute(grant);
    } catch {result={outcome:'REJECTED',reason:'AP2_HOST_MAPPING_INVALID',automaticRetryPermitted:false};}
    process.stdout.write(JSON.stringify(result)+'\n');
  }
} finally {witness.close();rmSync(root,{recursive:true,force:true});}
