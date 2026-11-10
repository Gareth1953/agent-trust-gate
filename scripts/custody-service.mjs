// Linux evaluation service. Synthetic records only; not a payment executor.
// Provision with a trusted operator and distinct issuer/writer/agent UIDs.
import { readFileSync, lstatSync, readdirSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:tls';
import { X509Certificate } from 'node:crypto';

export function protectedPath(path, owners, { privateFile = false, directory = false } = {}) {
  if (!isAbsolute(path) || resolve(path) !== path) throw Error('CUSTODY_ABSOLUTE_NORMAL_PATH_REQUIRED');
  let current = path, first = true;
  while (true) {
    const stat = lstatSync(current);
    // A root-owned sticky ancestor (/tmp) cannot be used to replace an existing
    // root-owned child. Never accept it as the immediate custody directory.
    const stickyAncestor = !first && stat.uid === 0 && stat.isDirectory() && (stat.mode & 0o1777) === 0o1777;
    if (stat.isSymbolicLink() || !owners.includes(stat.uid) || ((stat.mode & 0o022) && !stickyAncestor)) throw Error('CUSTODY_UNTRUSTED_PATH');
    if (first && (directory ? !stat.isDirectory() : !stat.isFile())) throw Error('CUSTODY_WRONG_PATH_TYPE');
    if (first && privateFile && (stat.mode & 0o077)) throw Error('CUSTODY_PRIVATE_MODE_REQUIRED');
    if (current === dirname(current)) break;
    current = dirname(current); first = false;
  }
}

export function rootCodeTree(path) {
  protectedPath(path, [0], { directory: true });
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const child = join(path, entry.name);
    if (entry.isDirectory()) rootCodeTree(child);
    else protectedPath(child, [0]);
  }
}

export function loadServiceConfig(path) {
  if (process.platform !== 'linux' || !process.getuid || process.getuid() === 0) throw Error('CUSTODY_NONROOT_LINUX_SERVICE_REQUIRED');
  const status = readFileSync('/proc/self/status', 'utf8');
  if (!/^NoNewPrivs:\s+1$/m.test(status) || !['CapInh','CapPrm','CapEff','CapBnd','CapAmb'].every(k => new RegExp('^' + k + ':\\s+0+$', 'm').test(status))) throw Error('CUSTODY_PRIVILEGES_NOT_DROPPED');
  protectedPath(path, [0]);
  const c = JSON.parse(readFileSync(path, 'utf8'));
  const fields = 'agentUid,caPath,clientFingerprint,codeRoot,databasePath,host,issuerUid,port,schema,serverCertPath,serverKeyPath,serviceUid,trustPath';
  if (!c || Object.keys(c).sort().join(',') !== fields || c.schema !== 'atg.split-custody.synthetic.v1'
    || c.host !== '127.0.0.1' || !Number.isInteger(c.port) || c.port < 0 || c.port > 65535
    || ![c.agentUid,c.serviceUid,c.issuerUid].every(v => Number.isInteger(v) && v > 0)
    || new Set([c.agentUid,c.serviceUid,c.issuerUid]).size !== 3 || c.serviceUid !== process.getuid()
    || !/^(?:[A-F0-9]{2}:){31}[A-F0-9]{2}$/.test(c.clientFingerprint)) throw Error('CUSTODY_CONFIG_INVALID');
  protectedPath(fileURLToPath(import.meta.url), [0]);
  rootCodeTree(c.codeRoot);
  for (const p of [c.trustPath,c.caPath,c.serverCertPath]) protectedPath(p, [0]);
  protectedPath(c.serverKeyPath, [c.serviceUid,0], { privateFile: true });
  protectedPath(dirname(c.databasePath), [c.serviceUid,0], { directory: true, privateFile: true });
  protectedPath(c.databasePath, [c.serviceUid,0], { privateFile: true });
  if (lstatSync(c.databasePath).uid !== c.serviceUid || lstatSync(dirname(c.databasePath)).uid !== c.serviceUid) throw Error('CUSTODY_WRITER_OWNERSHIP_REQUIRED');
  return c;
}

export async function startCustodyService(configPath) {
  const c = loadServiceConfig(configPath);
  // No issuer signing key is loaded by this service. Import only protected code.
  const { CustodyWitness, dispatchWitnessCommand, CUSTODY_WITNESS_MAX_BYTES } = await import(join(c.codeRoot,'src/custody-witness.js'));
  const writer = new CustodyWitness({ path: c.databasePath, trust: JSON.parse(readFileSync(c.trustPath,'utf8')) });
  const sockets = new Set();
  const server = createServer({ key: readFileSync(c.serverKeyPath), cert: readFileSync(c.serverCertPath),
    ca: readFileSync(c.caPath), requestCert: true, rejectUnauthorized: true, minVersion: 'TLSv1.3',
    handshakeTimeout: 3000, sessionTimeout: 1 }, socket => {
    if (!socket.authorized || !socket.getPeerCertificate().raw || new X509Certificate(socket.getPeerCertificate().raw).fingerprint256 !== c.clientFingerprint) { socket.destroy(); return; }
    socket.disableRenegotiation();
    let buffer = Buffer.alloc(0), finished = false;
    socket.on('data', chunk => {
      if (finished) { socket.destroy(); return; }
      if (buffer.length + chunk.length > CUSTODY_WITNESS_MAX_BYTES) { finished = true; socket.end('{"outcome":"REJECTED","reason":"FRAME_TOO_LARGE"}\n'); return; }
      buffer = Buffer.concat([buffer,chunk]);
      const i = buffer.indexOf(10);
      if (i < 0) return;
      finished = true;
      // Exactly one frame per connection; no control/path/clock operations.
      if (i !== buffer.length-1) { socket.end('{"outcome":"REJECTED","reason":"FRAME_INVALID"}\n'); return; }
      let response;
      try { response = dispatchWitnessCommand(writer, JSON.parse(buffer.subarray(0,i).toString('utf8'))); }
      catch { response = { outcome:'REJECTED', reason:'FRAME_INVALID' }; }
      socket.end(JSON.stringify(response)+'\n');
    });
  });
  server.maxConnections = 32;
  server.on('connection', socket => { sockets.add(socket); socket.setTimeout(3000,()=>socket.destroy()); socket.on('error',()=>{}); socket.on('close',()=>sockets.delete(socket)); });
  server.on('tlsClientError',()=>{});
  try { await new Promise((ok,bad)=>{server.once('error',bad); server.listen(c.port,c.host,ok);}); }
  catch(error) { writer.close(); throw error; }
  return { port: server.address().port, close: () => new Promise(ok => { for(const s of sockets)s.destroy(); server.close(()=>{writer.close();ok();}); }) };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let service;
  try {
    if(process.argv.length!==3)throw Error('CUSTODY_CONFIG_PATH_REQUIRED');
    service=await startCustodyService(process.argv[2]);
    process.stdout.write(JSON.stringify({status:'READY',port:service.port,syntheticOnly:true})+'\n');
    const stop=async()=>{await service.close();process.exit(0);};
    process.once('SIGTERM',stop);process.once('SIGINT',stop);
  } catch(error) { console.error(String(error.message));process.exitCode=1; }
}
