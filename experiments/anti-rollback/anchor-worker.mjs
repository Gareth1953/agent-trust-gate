// Disposable *synthetic-only* peer process, not a public or payment API.
import { SyntheticConsumptionAnchor } from './consumption-anchor.mjs';
const [path,domainId,actionId,actionDigest] = process.argv.slice(2);
const anchor=new SyntheticConsumptionAnchor(path,domainId);
try {process.stdout.write(JSON.stringify(anchor.reserve({domainId,actionId,actionDigest}))+'\n');}
finally { anchor.close(); }
