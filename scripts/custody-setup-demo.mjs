#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createCustodyFixture } from './custody-fixture.mjs';
const args=process.argv.slice(2);if(args.length!==2 || args[0]!=='--state')throw Error('Use --state NEW_ABSOLUTE_ROOT');
const f=createCustodyFixture(args[1]);writeFileSync(join(f.agent,'grant.json'),JSON.stringify(f.grant()),{flag:'wx',mode:0o600});
console.log(JSON.stringify({syntheticOnly:true,root:f.root,privateStateIncludedInPublicOutput:false}));
