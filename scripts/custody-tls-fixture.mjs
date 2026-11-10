// Disposable TLS identities for tests only. Never an operational CA/signer.
import { execFileSync } from 'node:child_process';
import { writeFileSync, readFileSync, chmodSync } from 'node:fs';
import { join } from 'node:path';
import { X509Certificate, randomBytes } from 'node:crypto';
export function custodyTlsFixture(dir) {
  const run=args=>execFileSync('openssl',args,{stdio:'pipe',timeout:10000});
  const caKey=join(dir,'ca.key'),caPath=join(dir,'ca.crt');
  run(['req','-x509','-newkey','ec','-pkeyopt','ec_paramgen_curve:P-256','-nodes','-keyout',caKey,'-out',caPath,'-days','1','-subj','/CN=ATG Disposable Evaluation CA','-addext','basicConstraints=critical,CA:TRUE','-addext','keyUsage=critical,keyCertSign,cRLSign']);
  chmodSync(caKey,0o600);
  function leaf(name,server) {
    const keyPath=join(dir,name+'.key'),certPath=join(dir,name+'.crt'),csr=join(dir,name+'.csr'),ext=join(dir,name+'.ext');
    run(['req','-new','-newkey','ec','-pkeyopt','ec_paramgen_curve:P-256','-nodes','-keyout',keyPath,'-out',csr,'-subj','/CN=ATG-'+name]);
    writeFileSync(ext,'basicConstraints=critical,CA:FALSE\nkeyUsage=critical,digitalSignature\nextendedKeyUsage='+(server?'serverAuth\nsubjectAltName=IP:127.0.0.1':'clientAuth')+'\n');
    run(['x509','-req','-in',csr,'-CA',caPath,'-CAkey',caKey,'-set_serial','0x'+randomBytes(16).toString('hex'),'-out',certPath,'-days','1','-extfile',ext]);
    chmodSync(keyPath,0o600);
    return {keyPath,certPath,fingerprint:new X509Certificate(readFileSync(certPath)).fingerprint256};
  }
  return {caPath,caKey,server:leaf('server',true),client:leaf('agent',false),rogueClient:leaf('unapproved-agent',false),fakeServer:leaf('fake-server',true)};
}
