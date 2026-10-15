#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { verifyDestinationEvidence } from '../dist/src/destination-evidence.js';
const args=process.argv.slice(2), options={};
try {
  if(args.length===0 || (args.length===1 && args[0]==='--help')) { console.log('ATG public destination evidence verifier (Node 20+)\nUse --trust FILE --approval FILE --evidence FILE --lookup FILE --now ISO_TIMESTAMP\nHost-configured public keys and expected lookup are required. Reads public inputs only; no writable ATG state or destination private key. Fixed synthetic clock; no live freshness claim.'); }
  else {
  if(args.length!==10) throw Error('Use --trust FILE --approval FILE --evidence FILE --lookup FILE --now ISO_TIMESTAMP');
  for(let i=0;i<args.length;i+=2) {
    if(!['--trust','--approval','--evidence','--lookup','--now'].includes(args[i]) || options[args[i]]) throw Error('INVALID_ARGUMENTS');
    options[args[i]]=args[i+1];
  }
  const json=flag=>JSON.parse(readFileSync(options[flag],'utf8'));
  const result=verifyDestinationEvidence(json('--evidence'),json('--approval'),json('--trust'),json('--lookup'),options['--now']);
  console.log(JSON.stringify({ ...result, runtime:process.version, writableAuthorityRequired:false, destinationPrivateKeyRequired:false }));
  if(!result.verified) process.exitCode=1;
  }
} catch(error) { console.error(error.message); process.exitCode=1; }
