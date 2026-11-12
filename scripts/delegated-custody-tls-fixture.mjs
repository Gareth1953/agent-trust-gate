// Disposable fixture certificates only; existing trust and production credentials are never used.
import { execFileSync } from 'node:child_process';
import { writeFileSync,readFileSync } from 'node:fs';
import { join } from 'node:path';
import { X509Certificate, randomBytes } from 'node:crypto';
export function delegatedTlsClient(root,tls,key,stem='client') {
  const keyPath=join(root,stem+'.key'),csr=join(root,stem+'.csr'),certPath=join(root,stem+'.crt');
  writeFileSync(keyPath,key.privateKeyPem,{flag:'wx',mode:0o600});
  const run=a=>execFileSync('openssl',a,{stdio:'pipe',timeout:15000});
  run(['req','-new','-key',keyPath,'-out',csr,'-subj','/CN=synthetic-'+stem]);
  run(['x509','-req','-in',csr,'-CA',tls.caPath,'-CAkey',tls.caKey,'-set_serial','0x'+randomBytes(16).toString('hex'),'-out',certPath,'-days','1','-extfile',join(root,'agent.ext')]);
  return {keyPath,certPath,fingerprint:new X509Certificate(readFileSync(certPath)).fingerprint256};
}
