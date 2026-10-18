import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, randomBytes, sign, createPublicKey } from 'node:crypto';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { DatabaseSync } from 'node:sqlite';
import { pathToFileURL } from 'node:url';
const moduleRoot = process.env.ATG_OPERATIONAL_TEST_PACKAGE ? resolve(process.env.ATG_OPERATIONAL_TEST_PACKAGE, 'src/operational') : resolve('src/operational');
const { tokenHash, callJson, digest, humanIdentity, transportUrl, validateAction } = await import(pathToFileURL(join(moduleRoot, 'runtime.mjs')).href);
const { AtgOperationalPlugin, AtgHumanApprovals } = await import(pathToFileURL(join(moduleRoot, 'sdk.mjs')).href);

const cli = join(moduleRoot, 'cli.mjs');
const secret = () => randomBytes(32).toString('base64url');
const keyPair = () => generateKeyPairSync('ed25519', { publicKeyEncoding: { type: 'spki', format: 'pem' }, privateKeyEncoding: { type: 'pkcs8', format: 'pem' } });
const oidc = generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = { ...oidc.publicKey.export({ format: 'jwk' }), kid: 'test-only-ephemeral-idp-key', alg: 'RS256', use: 'sig' };
function jwt(overrides = {}, wrongSigner = false) {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'at+jwt', kid: jwk.kid })).toString('base64url');
  const claims = Buffer.from(JSON.stringify({ iss: 'https://test-only-issuer.invalid', aud: 'atg-test-approval-api', sub: 'human-1', exp: now + 300, iat: now, auth_time: now, amr: ['mfa'], scope: 'atg:approve', token_use: 'access', ...overrides })).toString('base64url');
  return header + '.' + claims + '.' + sign('RSA-SHA256', Buffer.from(header + '.' + claims), wrongSigner ? generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey : oidc.privateKey).toString('base64url');
}
async function freePort() { const server = createServer(); server.listen(0, '127.0.0.1'); await once(server, 'listening'); const port = server.address().port; await new Promise(yes => server.close(yes)); return port; }
function write(path, value) { writeFileSync(path, typeof value === 'string' ? value : JSON.stringify(value), { mode: 0o600 }); }
async function start(mode, path, port) {
  const child = spawn(process.execPath, [cli, 'serve', mode, path, String(port)], { stdio: ['ignore', 'pipe', 'pipe'] });
  let errors = ''; child.stderr.on('data', bytes => { errors += bytes; });
  await Promise.race([once(child.stdout, 'data'), once(child, 'exit').then(() => { throw new Error('Service failed: ' + errors); }), new Promise((_, no) => { const timer = setTimeout(() => no(new Error('Service start timeout')), 10000); timer.unref(); })]);
  return child;
}
async function stop(child) { if (!child || child.exitCode !== null) return; const exited = once(child, 'exit'); child.kill('SIGTERM'); await exited; }
async function setup(t, entra = false) {
  const root = mkdtempSync(join(tmpdir(), 'atg-operational-test-'));
  const gatewayPort = await freePort(), destinationPort = await freePort(), proxyPort = await freePort();
  const gatewayUrl = `http://127.0.0.1:${gatewayPort}`, destinationUrl = `http://127.0.0.1:${proxyPort}`, directUrl = `http://127.0.0.1:${destinationPort}`;
  const gatewayKeys = keyPair(), destinationKeys = keyPair(), token = secret(), claim = secret();
  const key1 = join(root, 'gateway.pem'), key2 = join(root, 'destination.pem'), claimFile = join(root, 'claim.secret');
  write(key1, gatewayKeys.privateKey); write(key2, destinationKeys.privateKey); write(claimFile, claim);
  const common = { tenantId: 'test-tenant', policyVersion: 'policy-1', gatewayUrl, destinationUrl, gatewayPublicKeyPem: gatewayKeys.publicKey, destinationPublicKeyPem: destinationKeys.publicKey, agents: [{ id: 'agent-1', recordPrefix: 'order-', tokenHash: tokenHash(token) }], emergencyStop: false };
  const gateway = { ...common, signingPrivateKeyFile: key1, databasePath: join(root, 'gateway.sqlite'), claimTokenHash: tokenHash(claim), approvalTtlSeconds: 120, identity: { issuer: 'https://test-only-issuer.invalid', audience: 'atg-test-approval-api', jwks: [jwk], requiredAmr: ['mfa'], maximumAuthenticationAgeSeconds: 300 }, humans: [{ subject: 'human-1', active: true, recordPrefix: 'order-' }] };
  if (entra) { gateway.identity = entraTrust(); gateway.humans = [{ subject: entraHuman, active: true, recordPrefix: 'order-' }]; }
  const destination = { ...common, signingPrivateKeyFile: key2, databasePath: join(root, 'destination.sqlite'), claimTokenFile: claimFile };
  const gatewayPath = join(root, 'gateway.json'), destinationPath = join(root, 'destination.json'); write(gatewayPath, gateway); write(destinationPath, destination);
  let fault = '';
  const proxy = createServer(async (req, res) => {
    const buffers = []; for await (const bytes of req) buffers.push(bytes);
    if (req.url === '/commit' && fault === 'before-commit') { fault = ''; res.destroy(); return; }
    try {
      const response = await fetch(directUrl + req.url, { method: req.method, headers: { authorization: req.headers.authorization, ...(req.method === 'POST' ? { 'content-type': 'application/json' } : {}) }, ...(req.method === 'POST' ? { body: Buffer.concat(buffers) } : {}) });
      let bytes = await response.text();
      if (req.url === '/commit' && fault === 'after-commit') { fault = ''; res.destroy(); return; }
      if (req.url === '/commit' && fault === 'tamper') { fault = ''; const proof = JSON.parse(bytes); proof.payload.version += 1; bytes = JSON.stringify(proof); }
      res.writeHead(response.status, { 'content-type': 'application/json' }); res.end(bytes);
    } catch { res.writeHead(503); res.end(JSON.stringify({ error: 'TEST_PROXY_UNAVAILABLE' })); }
  });
  proxy.listen(proxyPort, '127.0.0.1'); await once(proxy, 'listening');
  let destinationChild = await start('destination', destinationPath, destinationPort), gatewayChild = await start('gateway', gatewayPath, gatewayPort);
  const seed = (id, document = { status: 'open' }, version = 1) => { const db = new DatabaseSync(destination.databasePath); db.prepare('INSERT OR REPLACE INTO records VALUES (?,?,?)').run(id, version, JSON.stringify(document)); db.close(); };
  seed('order-1');
  const agent = new AtgOperationalPlugin({ gatewayUrl, agentToken: token });
  const human = new AtgHumanApprovals({ gatewayUrl, accessToken: entra ? entraJwt() : jwt() });
  const propose = async (id = 'order-1', document = { status: 'approved' }, version = 1) => agent.propose({ recordId: id, expectedVersion: version, document });
  const approved = async () => { const proposal = await propose(); const viewed = await human.inspect(proposal.requestId); assert.equal(viewed.digest, digest(viewed.action)); await human.approve(proposal.requestId, viewed.digest); return proposal; };
  t.after(async () => { await stop(gatewayChild); await stop(destinationChild); await new Promise(yes => proxy.close(yes)); rmSync(root, { recursive: true, force: true }); });
  return { root, gateway, gatewayPath, destination, destinationPath, token, claim, agent, human, gatewayUrl, destinationUrl, directUrl, propose, approved, seed,
    setFault(value) { fault = value; }, updateGateway(fn) { fn(gateway); write(gatewayPath, gateway); }, updateDestination(fn) { fn(destination); write(destinationPath, destination); },
    async restart() { await stop(gatewayChild); await stop(destinationChild); destinationChild = await start('destination', destinationPath, destinationPort); gatewayChild = await start('gateway', gatewayPath, gatewayPort); },
    record: () => callJson(destinationUrl, '/records/order-1', token),
  };
}

test('real child services commit one authorised record and preserve signed evidence across restart', async t => {
  const h = await setup(t); const p = await h.approved(); const result = await h.agent.execute(p.requestId);
  assert.equal(result.status, 'EXECUTED'); assert.equal(result.receipt.payload.version, 2); assert.equal((await h.record()).payload.document.status, 'approved');
  await h.restart(); const recovered = await h.agent.reconcile(p.requestId); assert.deepEqual(recovered.receipt, result.receipt);
  await assert.rejects(h.agent.execute(p.requestId), /EXECUTION_ALREADY_ATTEMPTED/); assert.equal((await h.record()).payload.version, 2);
});
test('approval is required and human must inspect the exact digest', async t => {
  const h = await setup(t); const p = await h.propose();
  await assert.rejects(h.agent.execute(p.requestId), /APPROVAL_REQUIRED/);
  await assert.rejects(h.human.approve(p.requestId, '0'.repeat(64)), /APPROVAL_ACTION_MISMATCH/);
  assert.equal((await h.record()).payload.version, 1);
});
test('changed destination state refuses the stale write atomically', async t => {
  const h = await setup(t); const p = await h.approved(); h.seed('order-1', { status: 'changed-externally' }, 2);
  const result = await h.agent.execute(p.requestId); assert.equal(result.status, 'REJECTED'); assert.equal((await h.record()).payload.document.status, 'changed-externally');
});
test('concurrent attempts create one physical update', async t => {
  const h = await setup(t); const p = await h.approved();
  const results = await Promise.allSettled([h.agent.execute(p.requestId), h.agent.execute(p.requestId)]);
  assert.equal(results.filter(r => r.status === 'fulfilled' && r.value.status === 'EXECUTED').length, 1);
  assert.equal((await h.record()).payload.version, 2);
});
test('a lost acknowledgement reconciles to the actual persisted destination result', async t => {
  const h = await setup(t); const p = await h.approved(); h.setFault('after-commit');
  assert.equal((await h.agent.execute(p.requestId)).status, 'UNKNOWN'); assert.equal((await h.record()).payload.version, 2);
  await h.restart(); assert.equal((await h.agent.reconcile(p.requestId)).status, 'EXECUTED'); assert.equal((await h.record()).payload.version, 2);
});
test('missing outcome remains UNKNOWN and cannot be blindly retried', async t => {
  const h = await setup(t); const p = await h.approved(); h.setFault('before-commit');
  assert.equal((await h.agent.execute(p.requestId)).status, 'UNKNOWN'); assert.equal((await h.agent.reconcile(p.requestId)).status, 'UNKNOWN');
  await assert.rejects(h.agent.execute(p.requestId), /EXECUTION_ALREADY_ATTEMPTED/); assert.equal((await h.record()).payload.version, 1);
});
test('tampered destination evidence cannot establish success', async t => {
  const h = await setup(t); const p = await h.approved(); h.setFault('tamper');
  assert.equal((await h.agent.execute(p.requestId)).status, 'UNKNOWN'); assert.equal((await h.agent.reconcile(p.requestId)).status, 'EXECUTED');
});
test('revocation, emergency stop and changed authority block new dispatch', async t => {
  const h = await setup(t); const p = await h.approved(); await h.human.revoke(p.requestId, p.digest);
  await assert.rejects(h.agent.execute(p.requestId), /EXECUTION_ALREADY_ATTEMPTED/);
  const p2 = await h.approved(); h.updateGateway(c => { c.emergencyStop = true; }); await assert.rejects(h.agent.execute(p2.requestId), /POLICY_CHANGED_OR_STOPPED/);
  h.updateGateway(c => { c.emergencyStop = false; c.humans[0].active = false; }); await assert.rejects(h.agent.execute(p2.requestId), /HUMAN_AUTHORITY_REVOKED/);
  assert.equal((await h.record()).payload.version, 1);
});
test('expired real-time approval is refused without fixed fixture time', async t => {
  const h = await setup(t); h.updateGateway(c => { c.approvalTtlSeconds = 1; }); const p = await h.approved();
  await new Promise(yes => setTimeout(yes, 1100)); await assert.rejects(h.agent.execute(p.requestId), /APPROVAL_EXPIRED/);
});
test('agent credentials cannot approve, introspect claims, or bypass the destination', async t => {
  const h = await setup(t); const p = await h.propose();
  await assert.rejects(callJson(h.gatewayUrl, '/requests/' + p.requestId + '/approve', h.token, 'POST', { digest: p.digest }), /JWT_INVALID/);
  await assert.rejects(callJson(h.gatewayUrl, '/claim', h.token, 'POST', {}), /DESTINATION_AUTHENTICATION_REQUIRED/);
  await assert.rejects(callJson(h.directUrl, '/commit', h.token, 'POST', { payload: {}, signature: 'x' }), /EVIDENCE_DOMAIN_INVALID/);
});
test('issuer, audience, signature, time, MFA, purpose and authority are independently required', () => {
  const config = { identity: { issuer: 'https://test-only-issuer.invalid', audience: 'atg-test-approval-api', jwks: [jwk], requiredAmr: ['mfa'], maximumAuthenticationAgeSeconds: 300 }, humans: [{ subject: 'human-1', active: true, recordPrefix: 'order-' }] };
  assert.equal(humanIdentity(jwt(), config).subject, 'human-1');
  const now = Math.floor(Date.now() / 1000);
  for (const changes of [{ iss: 'https://attacker.invalid' }, { aud: 'other-api' }, { exp: now - 1 }, { iat: now + 100 }, { nbf: now + 100 }, { auth_time: now - 400 }, { amr: ['pwd'] }, { scope: 'read' }, { token_use: 'id' }, { sub: 'agent-1' }]) assert.throws(() => humanIdentity(jwt(changes), config));
  assert.throws(() => humanIdentity(jwt({}, true), config));
  assert.throws(() => humanIdentity('eyJhbGciOiJub25lIn0.e30.', config));
});
test('untrusted network and non-JSON SDK values fail closed', () => {
  assert.throws(() => transportUrl('http://example.com')); assert.throws(() => transportUrl('https://user:password@example.com'));
  assert.throws(() => validateAction({ recordId: '../escape', expectedVersion: 1, document: {} }));
  assert.throws(() => validateAction({ recordId: 'order-1', expectedVersion: 1, document: { value: NaN } }));
  assert.throws(() => validateAction({ recordId: 'order-1', expectedVersion: 1, document: { get value() { throw new Error('Must not invoke accessor'); } } }));
});
test('a changed approval policy version invalidates outstanding authority', async t => {
  const h = await setup(t); const p = await h.approved(); h.updateGateway(c => { c.policyVersion = 'policy-2'; });
  await assert.rejects(h.agent.execute(p.requestId), /POLICY_CHANGED_OR_STOPPED/); assert.equal((await h.record()).payload.version, 1);
});
test('agent scope and human authority independently restrict the target record', async t => {
  const h = await setup(t); h.seed('other-record');
  await assert.rejects(h.propose('other-record'), /AGENT_RESOURCE_FORBIDDEN/);
  h.seed('order-private'); const p = await h.propose('order-private');
  h.updateGateway(c => { c.humans[0].recordPrefix = 'order-1'; });
  await assert.rejects(h.human.inspect(p.requestId), /APPROVAL_FORBIDDEN/);
  await assert.rejects(h.human.approve(p.requestId, p.digest), /APPROVAL_ACTION_MISMATCH/);
});
test('two independent approvals for the same version cannot both mutate the record', async t => {
  const h = await setup(t); const p1 = await h.approved(), p2 = await h.approved();
  const outcomes = await Promise.all([h.agent.execute(p1.requestId), h.agent.execute(p2.requestId)]);
  assert.deepEqual(outcomes.map(o => o.status).sort(), ['EXECUTED', 'REJECTED']); assert.equal((await h.record()).payload.version, 2);
});
test('an approval cannot be replaced or revoked after an effect is admitted', async t => {
  const h = await setup(t); const p = await h.approved();
  await assert.rejects(h.human.approve(p.requestId, p.digest), /REQUEST_NOT_APPROVABLE/);
  await h.agent.execute(p.requestId);
  await assert.rejects(h.human.revoke(p.requestId, p.digest), /ACTION_ALREADY_IN_FLIGHT_OR_FINAL/);
});
test('explicit provisioning generates private role keys and credentials without minting a human identity', async t => {
  const root = mkdtempSync(join(tmpdir(), 'atg-provision-test-')); t.after(() => rmSync(root, { recursive: true, force: true }));
  const policy = { tenantId: 'test-tenant', policyVersion: 'v1', gatewayUrl: 'http://127.0.0.1:19001', destinationUrl: 'http://127.0.0.1:19002', agents: [{ id: 'agent-1', recordPrefix: 'order-' }], identity: { issuer: 'https://test-only-issuer.invalid', audience: 'atg-test-approval-api', jwks: [jwk], requiredAmr: ['mfa'], maximumAuthenticationAgeSeconds: 300 }, humans: [{ subject: 'human-1', active: true, recordPrefix: 'order-' }] };
  const trust = join(root, 'trust.json'); write(trust, policy);
  const { provisionDeployment } = await import(pathToFileURL(join(moduleRoot, 'setup.mjs')).href);
  const result = provisionDeployment(join(root, 'deployment'), trust);
  assert.equal(result.humanAuthenticationVerified, false);
  assert.throws(() => provisionDeployment(join(root, 'deployment'), trust));
  const gateway = JSON.parse(readFileSync(result.gatewayConfig)), destination = JSON.parse(readFileSync(result.destinationConfig));
  assert.notEqual(gateway.gatewayPublicKeyPem, gateway.destinationPublicKeyPem);
  assert.equal(gateway.identity.issuer, policy.identity.issuer); assert.equal(destination.claimTokenHash, undefined);
  assert.equal(JSON.stringify(result).includes(readFileSync(join(root, 'deployment/agent/agent-1.secret'), 'utf8')), false);
});
test('a durable audit records the authenticated approver and lifecycle without storing their token', async t => {
  const h = await setup(t); const p = await h.approved(); await h.agent.execute(p.requestId);
  const viewed = await h.human.inspect(p.requestId);
  assert.deepEqual(viewed.events.map(e => e.transition), ['PENDING', 'APPROVED', 'DISPATCHED', 'CLAIMED', 'EXECUTED']);
  assert.match(viewed.events[1].actor, /human-1/); assert.equal(JSON.stringify(viewed.events).includes('atg:approve'), false);
});
test('the approver can inspect both before and after documents near the supported size limit', async t => {
  const h = await setup(t); h.seed('order-1', { value: 'a'.repeat(32650) });
  const p = await h.propose('order-1', { value: 'b'.repeat(32650) });
  const viewed = await h.human.inspect(p.requestId);
  assert.equal(viewed.before.value.length, 32650); assert.equal(viewed.action.document.value.length, 32650);
  await h.human.approve(p.requestId, viewed.digest); assert.equal((await h.agent.execute(p.requestId)).status, 'EXECUTED');
});


const entraTenant = '11111111-1111-4111-8111-111111111111';
const entraApi = '22222222-2222-4222-8222-222222222222';
const entraClient = '33333333-3333-4333-8333-333333333333';
const entraHuman = '44444444-4444-4444-8444-444444444444';
function entraTrust() { return { provider: 'microsoft-entra', tenantId: entraTenant, issuer: `https://login.microsoftonline.com/${entraTenant}/v2.0`, audience: entraApi, clientId: entraClient, requiredAuthenticationContext: 'c1', maximumAuthenticationAgeSeconds: 300, jwks: [jwk] }; }
function entraJwt(overrides = {}, wrongSigner = false) {
  return jwt({ iss: entraTrust().issuer, aud: entraApi, ver: '2.0', tid: entraTenant, azp: entraClient, oid: entraHuman, sub: 'different-pairwise-subject', scp: 'atg.approve', acrs: ['c1'], scope: undefined, token_use: undefined, amr: undefined, ...overrides }, wrongSigner);
}
test('Entra delegated access token approves a real write using tenant object ID and persists identity evidence', async t => {
  const h = await setup(t, true); const p = await h.approved(); const result = await h.agent.execute(p.requestId);
  assert.equal(result.status, 'EXECUTED'); assert.equal((await h.record()).payload.version, 2);
  const db = new DatabaseSync(h.gateway.databasePath);
  const grant = JSON.parse(db.prepare('SELECT grant_json FROM requests WHERE id=?').get(p.requestId).grant_json);
  db.close(); assert.equal(grant.payload.approver.subject, entraHuman); assert.equal(grant.payload.approver.issuer, entraTrust().issuer);
  await h.restart(); assert.equal((await h.agent.reconcile(p.requestId)).status, 'EXECUTED');
});
test('Entra rejects wrong tenant, API, client, token class, context, age, scope, identity and signature', () => {
  const config = { identity: entraTrust(), humans: [{ subject: entraHuman, active: true, recordPrefix: 'order-' }] };
  assert.equal(humanIdentity(entraJwt(), config).subject, entraHuman);
  const invalid = [
    { tid: entraApi }, { iss: 'https://login.microsoftonline.com/common/v2.0' }, { aud: entraClient }, { aud: [entraApi] },
    { azp: entraApi }, { azp: undefined }, { ver: '1.0' }, { oid: undefined }, { oid: 'email@example.com' },
    { oid: entraClient }, { idtyp: 'app' }, { scp: undefined, roles: ['atg.approve'] }, { scp: 'User.Read' },
    { scp: undefined, scope: 'atg:approve', token_use: 'access' }, { acrs: undefined }, { acrs: ['c2'] },
    { auth_time: undefined }, { auth_time: Math.floor(Date.now()/1000)-901 }, { exp: 1 }, { nbf: Math.floor(Date.now()/1000)+300 },
  ];
  for (const claims of invalid) assert.throws(() => humanIdentity(entraJwt(claims), config), undefined, JSON.stringify(claims));
  assert.throws(() => humanIdentity(entraJwt({}, true), config), /JWT_SIGNATURE_INVALID/);
  assert.throws(() => humanIdentity(entraJwt(), { ...config, humans: [{ ...config.humans[0], active: false }] }), /HUMAN_AUTHORITY_INACTIVE/);
});
test('changing Entra client or authentication policy invalidates unused approval before destination admission', async t => {
  const h = await setup(t, true); const p = await h.approved();
  h.updateGateway(c => { c.identity.requiredAuthenticationContext = 'c2'; });
  await assert.rejects(h.agent.execute(p.requestId), /APPROVAL_IDENTITY_POLICY_CHANGED/);
  assert.equal((await h.record()).payload.version, 1);
});

const { entraProfile, interactiveRequest, discoverEntraTrust } = await import(pathToFileURL(join(moduleRoot, 'entra.mjs')).href);
test('Entra sign-in requests the specific API scope, context and fresh login with a unique nonce', () => {
  const profile = entraProfile( { ...entraTrust(), issuer: 'https://untrusted.invalid' });
  assert.equal(profile.issuer, entraTrust().issuer);
  const browser = async () => {};
  const a = interactiveRequest(profile, browser), b = interactiveRequest(profile, browser);
  assert.deepEqual(a.scopes, [`api://${entraApi}/atg.approve`]); assert.equal(a.prompt, 'login');
  assert.equal(a.openBrowser, browser); assert.notEqual(a.nonce, b.nonce); assert.equal(a.extraQueryParameters.max_age, '300');
  assert.deepEqual(JSON.parse(a.claims), { access_token: { acrs: { essential: true, value: 'c1' } } });
  for (const patch of [{ tenantId: 'common' }, { tenantId: '9188040d-6c67-4c5b-b112-36a304b66dad' }, { clientId: entraApi }, { requiredAuthenticationContext: '' }, { requiredAuthenticationContext: 'c100' }, { maximumAuthenticationAgeSeconds: 901 }]) assert.throws(() => entraProfile({ ...profile, ...patch }));
});
test('Entra metadata discovery uses only tenant-pinned HTTPS endpoints and imports public signing material', async t => {
  const base = `https://login.microsoftonline.com/${entraTenant}`, requested = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    requested.push(url); assert.equal(options.redirect, 'error');
    return Response.json(url.includes('openid-configuration') ? { issuer: entraTrust().issuer, jwks_uri: `${base}/discovery/v2.0/keys` } : { keys: [{ ...jwk, issuer: 'https://login.microsoftonline.com/{tenantid}/v2.0' }] });
  });
  const identity = await discoverEntraTrust(entraTrust());
  assert.deepEqual(requested, [`${base}/v2.0/.well-known/openid-configuration`, `${base}/discovery/v2.0/keys`]);
  assert.deepEqual(identity.jwks, [jwk]); assert.equal(identity.provider, 'microsoft-entra');
});
test('Entra discovery refuses substituted metadata URLs, wrong key issuer and duplicate keys', async t => {
  const base = `https://login.microsoftonline.com/${entraTenant}`;
  let metadata = { issuer: entraTrust().issuer, jwks_uri: `${base}/discovery/v2.0/keys` };
  let keys = [{ ...jwk, issuer: entraTrust().issuer }]; let requests = 0;
  t.mock.method(globalThis, 'fetch', async url => { requests++; return Response.json(url.includes('openid-configuration') ? metadata : { keys }); });
  metadata = { ...metadata, jwks_uri: 'https://attacker.invalid/keys' };
  await assert.rejects(discoverEntraTrust(entraTrust()), /ENTRA_METADATA_TRUST_MISMATCH/); assert.equal(requests, 1);
  metadata = { issuer: 'https://attacker.invalid', jwks_uri: `${base}/discovery/v2.0/keys` };
  await assert.rejects(discoverEntraTrust(entraTrust()), /ENTRA_METADATA_TRUST_MISMATCH/);
  metadata = { issuer: entraTrust().issuer, jwks_uri: `${base}/discovery/v2.0/keys` };
  keys = [{ ...jwk, issuer: 'https://attacker.invalid' }];
  await assert.rejects(discoverEntraTrust(entraTrust()), /ENTRA_KEY_TRUST_MISMATCH/);
  keys = [{ ...jwk, issuer: entraTrust().issuer }, { ...jwk, issuer: entraTrust().issuer }];
  await assert.rejects(discoverEntraTrust(entraTrust()), /ENTRA_DUPLICATE_KEY/);
  const oldTls = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  try {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    await assert.rejects(discoverEntraTrust(entraTrust()), /TLS_VERIFICATION_REQUIRED/);
  } finally {
    if (oldTls === undefined) delete process.env.NODE_TLS_REJECT_UNAUTHORIZED; else process.env.NODE_TLS_REJECT_UNAUTHORIZED = oldTls;
  }
});
test('Entra interactive approval CLI refuses unattended input without attempting login', async () => {
  const child = spawn(process.execPath, [cli, 'entra', 'review', '/nonexistent-config.json', 'request-id'], { stdio: ['pipe', 'pipe', 'pipe'] });
  let output = ''; child.stdout.on('data', b => { output += b; }); child.stderr.on('data', b => { output += b; });
  const [code] = await once(child, 'exit'); assert.equal(code, 1); assert.ok(!output.includes('accessToken')); assert.ok(!output.includes('login.microsoftonline.com'));
});
