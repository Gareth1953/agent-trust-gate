// Run against an unchanged checkout to retain the before/after failure proof.
import { fork } from 'node:child_process';
import { once } from 'node:events';
import { resolve,join } from 'node:path';
import { mkdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
const checkout=resolve(process.argv[2]);
const parent=resolve(process.argv[3]);mkdirSync(parent,{recursive:true});
const child=fork(join(checkout,'scripts/destination-process.mjs'),[join(parent,randomUUID()),'--initialise'],{stdio:['ignore','ignore','pipe','ipc']});
let error='';child.stderr.on('data',b=>{error+=b.toString();});
const timer=setTimeout(()=>child.kill(),10000);
await once(child,'message');
const end=once(child,'exit');child.send(null);
const [exitCode,signal]=await end;clearTimeout(timer);
console.log(JSON.stringify({probe:'null-frame',exitCode,signal,nullDereference:error.includes("Cannot read properties of null"),boundary:'synthetic disposable child only'}));
