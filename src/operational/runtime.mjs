/** Operational single-tenant, non-payment record gateway. No fixture authority. */
import { createHash, createPrivateKey, createPublicKey, randomUUID, sign, verify, timingSafeEqual } from 'node:crypto';
import { readFileSync, lstatSync, realpathSync, chmodSync } from 'node:fs';
import { dirname, resolve, isAbsolute } from 'node:path';
import { createServer as httpServer } from 'node:http';
import { createServer as httpsServer } from 'node:https';
import { DatabaseSync } from 'node:sqlite';
import { toCanonicalValue } from '../../dist/src/canonical-json.js';

const LIMIT = 64 * 1024;
export class OperationalError extends Error {
  constructor(code, status = 400) { super(code); this.code = code; this.status = status; }
}
function need(ok, code, status = 400) { if (!ok) throw new OperationalError(code, status); }
export const canonical = value => JSON.stringify(toCanonicalValue(value));
export const digest = value => createHash('sha256').update(canonical(value)).digest('hex');
export const tokenHash = value => createHash('sha256').update(value).digest('hex');
function equal(a, b) { return typeof a === 'string' && typeof b === 'string' && a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b)); }
function object(value, keys) {
  need(value && typeof value === 'object' && !Array.isArray(value), 'OBJECT_REQUIRED');
  if (keys) need(Object.keys(value).every(key => keys.includes(key)) && keys.every(key => Object.hasOwn(value, key)), 'FIELDS_INVALID');
  return value;
}
function identifier(value) { need(typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9_.-]{0,99}$/.test(value), 'IDENTIFIER_INVALID'); return value; }
const guid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(value);
/** Explicit commercial-cloud, single-tenant Entra v2 profile; no tenant inference. */
export function validateEntraProfile(identity) {
  object(identity);
  need(identity.provider === 'microsoft-entra' && guid(identity.tenantId) && identity.tenantId !== '9188040d-6c67-4c5b-b112-36a304b66dad', 'ENTRA_TENANT_INVALID');
  need(guid(identity.audience) && guid(identity.clientId) && identity.audience !== identity.clientId, 'ENTRA_APPLICATIONS_INVALID');
  need(identity.issuer === `https://login.microsoftonline.com/${identity.tenantId}/v2.0`, 'ENTRA_ISSUER_INVALID');
  need(/^c(?:[1-9]|[1-9][0-9])$/.test(identity.requiredAuthenticationContext), 'ENTRA_AUTHENTICATION_CONTEXT_REQUIRED');
  need(Number.isSafeInteger(identity.maximumAuthenticationAgeSeconds) && identity.maximumAuthenticationAgeSeconds > 0 && identity.maximumAuthenticationAgeSeconds <= 900, 'AUTHENTICATION_AGE_INVALID');
  return identity;
}
function jsonValue(value, depth = 0) {
  need(depth < 24, 'JSON_TOO_DEEP');
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return;
  if (typeof value === 'number') { need(Number.isFinite(value) && (!Number.isInteger(value) || Number.isSafeInteger(value)), 'JSON_NUMBER_INVALID'); return; }
  if (Array.isArray(value)) { for (const item of value) jsonValue(item, depth + 1); return; }
  object(value); need(Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null, 'JSON_PROTOTYPE_INVALID');
  for (const key of Reflect.ownKeys(value)) {
    const property = Object.getOwnPropertyDescriptor(value, key);
    need(typeof key === 'string' && property.enumerable && Object.hasOwn(property, 'value'), 'JSON_PROPERTY_INVALID');
    jsonValue(property.value, depth + 1);
  }
}
export function validateAction(value) {
  object(value, ['recordId', 'expectedVersion', 'document']); identifier(value.recordId);
  need(Number.isSafeInteger(value.expectedVersion) && value.expectedVersion >= 1 && value.expectedVersion < Number.MAX_SAFE_INTEGER, 'VERSION_INVALID');
  object(value.document); jsonValue(value.document);
  need(Buffer.byteLength(canonical(value)) <= 32 * 1024, 'ACTION_TOO_LARGE');
  return structuredClone(value);
}
export function signEnvelope(payload, privateKey) {
  return { payload, signature: sign(null, Buffer.from(canonical(payload)), privateKey).toString('base64url') };
}
export function verifyEnvelope(envelope, publicKey, kind, tenant) {
  object(envelope, ['payload', 'signature']); jsonValue(envelope.payload);
  need(envelope.payload.kind === kind && envelope.payload.tenantId === tenant, 'EVIDENCE_DOMAIN_INVALID', 403);
  need(typeof envelope.signature === 'string' && /^[A-Za-z0-9_-]{86}$/.test(envelope.signature), 'SIGNATURE_INVALID', 403);
  need(verify(null, Buffer.from(canonical(envelope.payload)), publicKey, Buffer.from(envelope.signature, 'base64url')), 'SIGNATURE_INVALID', 403);
  return envelope.payload;
}
export function transportUrl(value) {
  const url = new URL(value);
  need(!url.username && !url.password && !url.search && !url.hash && url.pathname === '/', 'SERVICE_URL_INVALID');
  need(url.protocol === 'https:' || (url.protocol === 'http:' && ['127.0.0.1', '[::1]'].includes(url.hostname)), 'TLS_REQUIRED');
  return url.origin;
}
function privateFile(path, directory = false) {
  need(isAbsolute(path), 'ABSOLUTE_PATH_REQUIRED'); const stat = lstatSync(path);
  need(!stat.isSymbolicLink() && (directory ? stat.isDirectory() : stat.isFile()), 'PRIVATE_PATH_INVALID');
  need(realpathSync(path) === resolve(path), 'SYMLINK_PATH_FORBIDDEN');
  if (process.platform !== 'win32') need((stat.mode & 0o077) === 0 && stat.uid === process.geteuid(), 'PRIVATE_PERMISSIONS_REQUIRED');
}
function configAt(path, mode) {
  privateFile(path); const config = JSON.parse(readFileSync(path, 'utf8')); object(config);
  identifier(config.tenantId); identifier(config.policyVersion);
  transportUrl(config.gatewayUrl); transportUrl(config.destinationUrl);
  need(Array.isArray(config.agents) && config.agents.length > 0, 'AGENTS_REQUIRED');
  for (const agent of config.agents) { identifier(agent.id); need(/^[a-f0-9]{64}$/.test(agent.tokenHash) && typeof agent.recordPrefix === 'string' && agent.recordPrefix.length > 0, 'AGENT_CREDENTIAL_OR_SCOPE_INVALID'); }
  need(new Set(config.agents.map(a => a.id)).size === config.agents.length && new Set(config.agents.map(a => a.tokenHash)).size === config.agents.length, 'DUPLICATE_AGENT');
  need(typeof config.emergencyStop === 'boolean', 'STOP_STATE_REQUIRED');
  for (const field of ['gatewayPublicKeyPem', 'destinationPublicKeyPem']) need(createPublicKey(config[field]).asymmetricKeyType === 'ed25519', 'ED25519_REQUIRED');
  if (mode === 'gateway') {
    const identity = config.identity; object(identity);
    need(new URL(identity.issuer).protocol === 'https:' && typeof identity.audience === 'string' && identity.audience.length > 0, 'IDENTITY_TRUST_INVALID');
    need(identity.provider === undefined || ['generic-jwt', 'microsoft-entra'].includes(identity.provider), 'IDENTITY_PROVIDER_INVALID');
    if (identity.provider === 'microsoft-entra') validateEntraProfile(identity);
    need(Array.isArray(identity.jwks) && identity.jwks.length > 0 && (identity.provider === 'microsoft-entra' || (Array.isArray(identity.requiredAmr) && identity.requiredAmr.length > 0)), 'IDENTITY_KEYS_AND_AMR_REQUIRED');
    need(new Set(identity.jwks.map(k => k.kid)).size === identity.jwks.length, 'DUPLICATE_IDENTITY_KEY');
    for (const key of identity.jwks) {
      need(typeof key.kid === 'string' && key.kty === 'RSA' && !key.d && !key.p && !key.q && (!key.alg || key.alg === 'RS256') && (!key.use || key.use === 'sig'), 'IDENTITY_PUBLIC_KEY_INVALID');
      const publicKey = createPublicKey({ key, format: 'jwk' }); need(publicKey.asymmetricKeyType === 'rsa' && publicKey.asymmetricKeyDetails.modulusLength >= 2048, 'IDENTITY_PUBLIC_KEY_INVALID');
    }
    need(Number.isSafeInteger(identity.maximumAuthenticationAgeSeconds) && identity.maximumAuthenticationAgeSeconds > 0 && identity.maximumAuthenticationAgeSeconds <= 900, 'AUTHENTICATION_AGE_INVALID');
    need(Array.isArray(config.humans) && config.humans.length > 0, 'HUMAN_AUTHORITY_REQUIRED');
    need(new Set(config.humans.map(h => h.subject)).size === config.humans.length, 'DUPLICATE_HUMAN');
    for (const human of config.humans) need(typeof human.subject === 'string' && human.subject.length > 0 && typeof human.active === 'boolean' && typeof human.recordPrefix === 'string' && human.recordPrefix.length > 0, 'HUMAN_AUTHORITY_INVALID');
    if (identity.provider === 'microsoft-entra') need(config.humans.every(h => guid(h.subject)), 'ENTRA_OBJECT_ID_REQUIRED');
    need(Number.isSafeInteger(config.approvalTtlSeconds) && config.approvalTtlSeconds > 0 && config.approvalTtlSeconds <= 300, 'APPROVAL_TTL_INVALID');
    need(/^[a-f0-9]{64}$/.test(config.claimTokenHash), 'CLAIM_TOKEN_HASH_INVALID');
  }
  return config;
}
function bearer(req) {
  const value = req.headers.authorization;
  need(typeof value === 'string' && /^Bearer [A-Za-z0-9_.~-]{32,16384}$/.test(value), 'AUTHENTICATION_REQUIRED', 401);
  return value.slice(7);
}
function agentIdentity(req, config) {
  const hash = tokenHash(bearer(req)); const agent = config.agents.find(a => equal(a.tokenHash, hash));
  need(agent, 'AGENT_UNAUTHORISED', 403); return agent.id;
}
function agentScope(config, id, recordId) { need(config.agents.some(a => a.id === id && recordId.startsWith(a.recordPrefix)), 'AGENT_RESOURCE_FORBIDDEN', 403); }
/** Verifies audience-specific JWT access tokens against operator-pinned issuer keys. */
export function humanIdentity(token, config) {
  const parts = token.split('.'); need(parts.length === 3 && parts.every(p => /^[A-Za-z0-9_-]+$/.test(p)), 'JWT_INVALID', 401);
  let header, claims;
  try { header = JSON.parse(Buffer.from(parts[0], 'base64url')); claims = JSON.parse(Buffer.from(parts[1], 'base64url')); } catch { throw new OperationalError('JWT_INVALID', 401); }
  object(header); object(claims);
  need(header.alg === 'RS256' && ['at+jwt', 'JWT'].includes(header.typ) && typeof header.kid === 'string' && !header.crit && !header.jku && !header.jwk && !header.x5u, 'JWT_HEADER_INVALID', 401);
  const trust = config.identity; const matches = trust.jwks.filter(k => k.kid === header.kid);
  need(matches.length === 1, 'JWT_KEY_UNKNOWN', 401);
  const key = createPublicKey({ key: matches[0], format: 'jwk' });
  need(key.asymmetricKeyType === 'rsa' && key.asymmetricKeyDetails.modulusLength >= 2048, 'JWT_KEY_INVALID', 401);
  need(verify('RSA-SHA256', Buffer.from(parts[0] + '.' + parts[1]), key, Buffer.from(parts[2], 'base64url')), 'JWT_SIGNATURE_INVALID', 401);
  const now = Math.floor(Date.now() / 1000);
  need(claims.iss === trust.issuer && (claims.aud === trust.audience || (trust.provider !== 'microsoft-entra' && Array.isArray(claims.aud) && claims.aud.includes(trust.audience))), 'JWT_ISSUER_OR_AUDIENCE_INVALID', 401);
  need(Number.isSafeInteger(claims.exp) && claims.exp > now && Number.isSafeInteger(claims.iat) && claims.iat <= now && claims.exp > claims.iat && (claims.nbf === undefined || (Number.isSafeInteger(claims.nbf) && claims.nbf <= now)), 'JWT_TIME_INVALID', 401);
  need(Number.isSafeInteger(claims.auth_time) && claims.auth_time <= now && now - claims.auth_time <= trust.maximumAuthenticationAgeSeconds, 'RECENT_HUMAN_AUTHENTICATION_REQUIRED', 401);
  let subject;
  if (trust.provider === 'microsoft-entra') {
    validateEntraProfile(trust);
    need(claims.ver === '2.0' && claims.tid === trust.tenantId && claims.azp === trust.clientId && guid(claims.oid) && claims.idtyp !== 'app', 'ENTRA_DELEGATED_USER_REQUIRED', 401);
    need(typeof claims.scp === 'string' && claims.scp.split(' ').includes('atg.approve'), 'APPROVAL_SCOPE_REQUIRED', 403);
    need(Array.isArray(claims.acrs) && claims.acrs.includes(trust.requiredAuthenticationContext), 'ENTRA_AUTHENTICATION_CONTEXT_REQUIRED', 401);
    // acrs means the tenant's configured context was satisfied, not inherently MFA.
    // Its Conditional Access policy must require the intended authentication strength.
    subject = claims.oid;
  } else {
    need(Array.isArray(claims.amr) && trust.requiredAmr.every(method => claims.amr.includes(method)), 'AUTHENTICATION_METHOD_REQUIRED', 401);
    need(typeof claims.scope === 'string' && claims.scope.split(' ').includes('atg:approve'), 'APPROVAL_SCOPE_REQUIRED', 403);
    need(claims.token_use === 'access' && typeof claims.sub === 'string', 'ACCESS_TOKEN_REQUIRED', 401);
    subject = claims.sub;
  }
  const human = config.humans.find(h => h.subject === subject && h.active);
  need(human, 'HUMAN_AUTHORITY_INACTIVE', 403);
  return { issuer: claims.iss, subject, authTime: claims.auth_time, recordPrefix: human.recordPrefix };
}
export async function callJson(base, path, token, method = 'GET', value) {
  const response = await fetch(transportUrl(base) + path, { method, redirect: 'error', signal: AbortSignal.timeout(5000), headers: { authorization: `Bearer ${token}`, ...(value === undefined ? {} : { 'content-type': 'application/json' }) }, ...(value === undefined ? {} : { body: JSON.stringify(value) }) });
  const reader = response.body.getReader(); const buffers = []; let size = 0;
  try { for (;;) { const { done, value: bytes } = await reader.read(); if (done) break; size += bytes.length; need(size <= LIMIT * 2, 'RESPONSE_TOO_LARGE'); buffers.push(Buffer.from(bytes)); } } finally { await reader.cancel(); }
  const result = JSON.parse(Buffer.concat(buffers).toString('utf8'));
  need(response.ok, result.error || 'REMOTE_ERROR', response.status); return result;
}
function database(path) {
  need(isAbsolute(path), 'ABSOLUTE_DATABASE_REQUIRED'); privateFile(dirname(path), true);
  try { privateFile(path); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const db = new DatabaseSync(path); chmodSync(path, 0o600);
  db.exec('PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA busy_timeout=5000;');
  db.exec(`CREATE TABLE IF NOT EXISTS requests (id TEXT PRIMARY KEY, agent TEXT NOT NULL, proposal TEXT NOT NULL, status TEXT NOT NULL, grant_json TEXT, receipt TEXT);
    CREATE TABLE IF NOT EXISTS records (id TEXT PRIMARY KEY, version INTEGER NOT NULL, document TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS outcomes (id TEXT PRIMARY KEY, digest TEXT NOT NULL, evidence TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS metadata (name TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS events (sequence INTEGER PRIMARY KEY AUTOINCREMENT, request_id TEXT NOT NULL, transition TEXT NOT NULL, actor TEXT NOT NULL, recorded_at INTEGER NOT NULL);`);
  return db;
}
function transaction(db, fn) { db.exec('BEGIN IMMEDIATE'); try { const result = fn(); db.exec('COMMIT'); return result; } catch (error) { db.exec('ROLLBACK'); throw error; } }
function event(db, requestId, transition, actor) { db.prepare('INSERT INTO events (request_id,transition,actor,recorded_at) VALUES (?,?,?,?)').run(requestId, transition, actor, Date.now()); }
/** Offline administrator provisioning only. No HTTP route exposes this capability. */
export function provisionOperationalRecord(configPath, recordId, document) {
  const config = configAt(configPath, 'destination');
  validateAction({ recordId, expectedVersion: 1, document });
  const db = database(config.databasePath);
  try { db.prepare('INSERT INTO records VALUES (?,?,?)').run(recordId, 1, canonical(document)); }
  finally { db.close(); }
  return { recordId, version: 1 };
}
export function validateOperationalConfiguration(path, mode) { configAt(path, mode); }
function ownRequest(db, id, agent) { const row = db.prepare('SELECT * FROM requests WHERE id=? AND agent=?').get(id, agent); need(row, 'REQUEST_NOT_FOUND', 404); return row; }
function identityPolicy(identity) {
  const { jwks, ...policy } = identity;
  return digest(policy);
}
function activeAuthority(config, grant) {
  need(!config.emergencyStop && config.policyVersion === grant.policyVersion, 'POLICY_CHANGED_OR_STOPPED', 403);
  need(grant.approver.issuer === config.identity.issuer, 'APPROVAL_ISSUER_CHANGED', 403);
  need(grant.identityPolicyDigest === identityPolicy(config.identity), 'APPROVAL_IDENTITY_POLICY_CHANGED', 403);
  need(config.agents.some(a => a.id === grant.agentId), 'AGENT_REVOKED', 403);
  agentScope(config, grant.agentId, grant.action.recordId);
  need(config.humans.some(h => h.subject === grant.approver.subject && h.active && grant.action.recordId.startsWith(h.recordPrefix)), 'HUMAN_AUTHORITY_REVOKED', 403);
  need(grant.expiresAt > Date.now(), 'APPROVAL_EXPIRED', 403);
}
async function bodyJson(req) {
  need((req.headers['content-type'] || '').split(';')[0] === 'application/json', 'JSON_CONTENT_TYPE_REQUIRED', 415);
  const buffers = []; let size = 0;
  for await (const bytes of req) { size += bytes.length; need(size <= LIMIT, 'BODY_TOO_LARGE', 413); buffers.push(bytes); }
  try { return JSON.parse(Buffer.concat(buffers).toString('utf8')); } catch { throw new OperationalError('JSON_INVALID'); }
}

export function openOperationalService({ mode, configPath, host = '127.0.0.1', port = 0, tls }) {
  need(['gateway', 'destination'].includes(mode), 'SERVICE_MODE_INVALID');
  need(tls || ['127.0.0.1', '::1'].includes(host), 'PUBLIC_HTTP_FORBIDDEN');
  const config = configAt(configPath, mode); privateFile(config.signingPrivateKeyFile);
  const signingKey = createPrivateKey(readFileSync(config.signingPrivateKeyFile)); need(signingKey.asymmetricKeyType === 'ed25519', 'ED25519_REQUIRED');
  const expectedKey = mode === 'gateway' ? config.gatewayPublicKeyPem : config.destinationPublicKeyPem;
  need(createPublicKey(signingKey).export({ type: 'spki', format: 'pem' }) === createPublicKey(expectedKey).export({ type: 'spki', format: 'pem' }), 'SIGNING_KEY_MISMATCH');
  const gatewayKey = createPublicKey(config.gatewayPublicKeyPem), destinationKey = createPublicKey(config.destinationPublicKeyPem);
  need(config.gatewayPublicKeyPem !== config.destinationPublicKeyPem, 'SEPARATE_SIGNERS_REQUIRED');
  let claimToken;
  if (mode === 'destination') { privateFile(config.claimTokenFile); claimToken = readFileSync(config.claimTokenFile, 'utf8').trim(); need(claimToken.length >= 43, 'CLAIM_SECRET_TOO_SHORT'); }
  const db = database(config.databasePath);
  const identity = canonical({ tenantId: config.tenantId, mode, gatewayUrl: config.gatewayUrl, destinationUrl: config.destinationUrl, gatewayKey: config.gatewayPublicKeyPem, destinationKey: config.destinationPublicKeyPem });
  const existing = db.prepare('SELECT value FROM metadata WHERE name=?').get('deployment');
  need(!existing || existing.value === identity, 'DATABASE_DEPLOYMENT_MISMATCH');
  db.prepare('INSERT OR IGNORE INTO metadata VALUES (?,?)').run('deployment', identity);
  const signed = payload => signEnvelope({ ...payload, tenantId: config.tenantId }, signingKey);
  async function dispatch(req) {
    const current = configAt(configPath, mode);
    need(current.tenantId === config.tenantId && current.databasePath === config.databasePath && current.gatewayPublicKeyPem === config.gatewayPublicKeyPem && current.destinationPublicKeyPem === config.destinationPublicKeyPem && current.gatewayUrl === config.gatewayUrl && current.destinationUrl === config.destinationUrl, 'RESTART_REQUIRED_FOR_TRUST_CHANGE', 503);
    const url = new URL(req.url, 'http://atg.invalid'); need(!url.search, 'QUERY_FORBIDDEN'); const path = url.pathname;
    if (mode === 'destination') {
      const agent = agentIdentity(req, current);
      if (req.method === 'GET' && path.startsWith('/records/')) {
        const id = identifier(path.slice(9)); const row = db.prepare('SELECT * FROM records WHERE id=?').get(id); need(row, 'RECORD_NOT_FOUND', 404);
        agentScope(current, agent, id);
        return signed({ kind: 'atg.record-state.v1', recordId: id, version: row.version, document: JSON.parse(row.document), readAt: Date.now() });
      }
      if (req.method === 'GET' && path.startsWith('/outcomes/')) {
        const id = identifier(path.slice(10)); const row = db.prepare('SELECT evidence FROM outcomes WHERE id=?').get(id);
        if (row) { const proof = JSON.parse(row.evidence); need(proof.payload.agentId === agent, 'OUTCOME_FORBIDDEN', 403); return proof; }
        return signed({ kind: 'atg.record-absence.v1', requestId: id, observedAt: Date.now(), authoritativeForRelease: false });
      }
      if (req.method === 'POST' && path === '/commit') {
        need(!current.emergencyStop, 'DESTINATION_STOPPED', 403);
        const envelope = await bodyJson(req); const grant = verifyEnvelope(envelope, gatewayKey, 'atg.record-grant.v1', config.tenantId);
        validateAction(grant.action); need(grant.destination === config.destinationUrl && grant.agentId === agent && grant.digest === digest(grant.action) && grant.expiresAt > Date.now(), 'GRANT_INVALID_OR_EXPIRED', 403);
        agentScope(current, agent, grant.action.recordId);
        const prior = db.prepare('SELECT id FROM outcomes WHERE id=?').get(grant.requestId); need(!prior, 'GRANT_ALREADY_CONSUMED', 409);
        const response = await callJson(config.gatewayUrl, '/claim', claimToken, 'POST', envelope);
        const permit = verifyEnvelope(response, gatewayKey, 'atg.commit-permit.v1', config.tenantId);
        need(permit.destination === config.destinationUrl && permit.requestId === grant.requestId && permit.digest === grant.digest && permit.expiresAt > Date.now(), 'COMMIT_PERMIT_INVALID', 403);
        return transaction(db, () => {
          need(!db.prepare('SELECT id FROM outcomes WHERE id=?').get(grant.requestId), 'GRANT_ALREADY_CONSUMED', 409);
          need(permit.expiresAt > Date.now() && grant.expiresAt > Date.now(), 'COMMIT_PERMIT_EXPIRED', 403);
          const row = db.prepare('SELECT * FROM records WHERE id=?').get(grant.action.recordId);
          let outcome = 'REJECTED'; let version = row?.version ?? null;
          if (row && row.version === grant.action.expectedVersion && digest(JSON.parse(row.document)) === grant.beforeHash) {
            const changed = db.prepare('UPDATE records SET version=version+1,document=? WHERE id=? AND version=?').run(canonical(grant.action.document), grant.action.recordId, grant.action.expectedVersion);
            need(changed.changes === 1, 'RECORD_CHANGED', 409); outcome = 'EXECUTED'; version += 1;
          }
          const evidence = signed({ kind: 'atg.record-outcome.v1', requestId: grant.requestId, agentId: agent, digest: grant.digest, grantHash: digest(envelope), recordId: grant.action.recordId, outcome, version, documentHash: outcome === 'EXECUTED' ? digest(grant.action.document) : (row ? digest(JSON.parse(row.document)) : null), recordedAt: Date.now() });
          db.prepare('INSERT INTO outcomes VALUES (?,?,?)').run(grant.requestId, grant.digest, canonical(evidence)); return evidence;
        });
      }
      throw new OperationalError('NOT_FOUND', 404);
    }
    if (req.method === 'POST' && path === '/claim') {
      need(equal(tokenHash(bearer(req)), current.claimTokenHash), 'DESTINATION_AUTHENTICATION_REQUIRED', 403);
      const envelope = await bodyJson(req); const grant = verifyEnvelope(envelope, gatewayKey, 'atg.record-grant.v1', config.tenantId);
      return transaction(db, () => {
        const row = db.prepare('SELECT * FROM requests WHERE id=?').get(grant.requestId);
        need(row && row.status === 'DISPATCHED' && row.grant_json === canonical(envelope), 'CLAIM_REFUSED', 409);
        activeAuthority(current, grant);
        db.prepare('UPDATE requests SET status=? WHERE id=?').run('CLAIMED', grant.requestId);
        event(db, grant.requestId, 'CLAIMED', 'destination');
        return signed({ kind: 'atg.commit-permit.v1', destination: config.destinationUrl, requestId: grant.requestId, digest: grant.digest, expiresAt: Math.min(grant.expiresAt, Date.now() + 2000) });
      });
    }
    const route = /^\/requests\/([A-Za-z0-9_.-]+)(?:\/(approve|revoke|execute|reconcile))?$/.exec(path);
    if (req.method === 'GET' && path.startsWith('/approvals/')) {
      const human = humanIdentity(bearer(req), current); const id = identifier(path.slice(11));
      const row = db.prepare('SELECT * FROM requests WHERE id=?').get(id); need(row, 'REQUEST_NOT_FOUND', 404);
      const proposal = JSON.parse(row.proposal); need(proposal.action.recordId.startsWith(human.recordPrefix), 'APPROVAL_FORBIDDEN', 403);
      return { ...proposal, status: row.status, agentId: row.agent, events: db.prepare('SELECT sequence,transition,actor,recorded_at FROM events WHERE request_id=? ORDER BY sequence').all(id) };
    }
    if (route && req.method === 'POST' && ['approve', 'revoke'].includes(route[2])) {
      const human = humanIdentity(bearer(req), current); const input = await bodyJson(req); object(input, ['digest']);
      return transaction(db, () => {
        const row = db.prepare('SELECT * FROM requests WHERE id=?').get(route[1]); need(row, 'REQUEST_NOT_FOUND', 404);
        const proposal = JSON.parse(row.proposal);
        need(input.digest === proposal.digest && proposal.action.recordId.startsWith(human.recordPrefix), 'APPROVAL_ACTION_MISMATCH', 403);
        if (route[2] === 'revoke') {
          need(['PENDING', 'APPROVED'].includes(row.status), 'ACTION_ALREADY_IN_FLIGHT_OR_FINAL', 409);
          db.prepare('UPDATE requests SET status=? WHERE id=?').run('REVOKED', row.id); event(db, row.id, 'REVOKED', human.issuer + '|' + human.subject); return { status: 'REVOKED', requestId: row.id };
        }
        need(!current.emergencyStop && row.status === 'PENDING' && proposal.createdAt + 600000 > Date.now(), 'REQUEST_NOT_APPROVABLE', 409);
        need(current.agents.some(a => a.id === row.agent), 'AGENT_REVOKED', 403);
        const grant = signed({ kind: 'atg.record-grant.v1', destination: config.destinationUrl, requestId: row.id, agentId: row.agent, action: proposal.action, beforeHash: proposal.beforeHash, digest: proposal.digest, approver: { issuer: human.issuer, subject: human.subject, authTime: human.authTime }, identityPolicyDigest: identityPolicy(current.identity), policyVersion: current.policyVersion, issuedAt: Date.now(), expiresAt: Date.now() + current.approvalTtlSeconds * 1000 });
        db.prepare('UPDATE requests SET status=?,grant_json=? WHERE id=?').run('APPROVED', canonical(grant), row.id);
        event(db, row.id, 'APPROVED', human.issuer + '|' + human.subject);
        return { requestId: row.id, status: 'APPROVED', digest: proposal.digest };
      });
    }
    const agent = agentIdentity(req, current);
    if (req.method === 'POST' && path === '/requests') {
      need(!current.emergencyStop, 'GATEWAY_STOPPED', 403); const action = validateAction(await bodyJson(req));
      agentScope(current, agent, action.recordId);
      const proof = await callJson(config.destinationUrl, '/records/' + action.recordId, bearer(req));
      const state = verifyEnvelope(proof, destinationKey, 'atg.record-state.v1', config.tenantId);
      need(state.recordId === action.recordId && state.version === action.expectedVersion && Number.isSafeInteger(state.readAt) && state.readAt <= Date.now() + 1000 && Date.now() - state.readAt < 5000, 'DESTINATION_STATE_STALE', 409);
      const id = randomUUID(); const proposal = { requestId: id, action, digest: digest(action), before: state.document, beforeHash: digest(state.document), createdAt: Date.now() };
      transaction(db, () => {
        const count = db.prepare("SELECT COUNT(*) AS n FROM requests WHERE agent=? AND status NOT IN ('EXECUTED','REJECTED','REVOKED')").get(agent).n;
        need(count < 1000, 'OPEN_REQUEST_LIMIT', 429);
        db.prepare('INSERT INTO requests (id,agent,proposal,status) VALUES (?,?,?,?)').run(id, agent, canonical(proposal), 'PENDING');
        event(db, id, 'PENDING', agent);
      }); return { ...proposal, status: 'PENDING' };
    }
    if (route && req.method === 'GET' && !route[2]) { const row = ownRequest(db, route[1], agent); return { ...JSON.parse(row.proposal), status: row.status, receipt: row.receipt ? JSON.parse(row.receipt) : null }; }
    if (route && req.method === 'POST' && ['execute', 'reconcile'].includes(route[2])) {
      const row = ownRequest(db, route[1], agent); need(row.grant_json, 'APPROVAL_REQUIRED', 409); const envelope = JSON.parse(row.grant_json);
      const grant = verifyEnvelope(envelope, gatewayKey, 'atg.record-grant.v1', config.tenantId);
      if (route[2] === 'execute') transaction(db, () => {
        activeAuthority(current, grant);
        const changed = db.prepare('UPDATE requests SET status=? WHERE id=? AND status=?').run('DISPATCHED', row.id, 'APPROVED');
        need(changed.changes === 1, 'EXECUTION_ALREADY_ATTEMPTED', 409);
        event(db, row.id, 'DISPATCHED', agent);
      });
      else need(['DISPATCHED', 'CLAIMED', 'UNKNOWN', 'EXECUTED', 'REJECTED'].includes(row.status), 'NOT_RECONCILABLE', 409);
      try {
        const proof = route[2] === 'execute' ? await callJson(config.destinationUrl, '/commit', bearer(req), 'POST', envelope) : await callJson(config.destinationUrl, '/outcomes/' + row.id, bearer(req));
        if (proof.payload?.kind === 'atg.record-absence.v1') { verifyEnvelope(proof, destinationKey, 'atg.record-absence.v1', config.tenantId); throw new OperationalError('NO_AUTHORITATIVE_OUTCOME'); }
        const outcome = verifyEnvelope(proof, destinationKey, 'atg.record-outcome.v1', config.tenantId);
        need(outcome.requestId === row.id && outcome.digest === grant.digest && outcome.grantHash === digest(envelope) && outcome.agentId === agent && outcome.recordId === grant.action.recordId && ['EXECUTED', 'REJECTED'].includes(outcome.outcome), 'OUTCOME_MISMATCH');
        if (outcome.outcome === 'EXECUTED') need(outcome.version === grant.action.expectedVersion + 1 && outcome.documentHash === digest(grant.action.document), 'OUTCOME_STATE_MISMATCH');
        transaction(db, () => { db.prepare('UPDATE requests SET status=?,receipt=? WHERE id=?').run(outcome.outcome, canonical(proof), row.id); event(db, row.id, outcome.outcome, 'destination-evidence'); });
        return { requestId: row.id, status: outcome.outcome, receipt: proof };
      } catch {
        transaction(db, () => { const changed = db.prepare("UPDATE requests SET status='UNKNOWN' WHERE id=? AND status NOT IN ('EXECUTED','REJECTED','UNKNOWN')").run(row.id); if (changed.changes) event(db, row.id, 'UNKNOWN', 'gateway'); });
        const latest = ownRequest(db, row.id, agent);
        return { requestId: row.id, status: latest.status, receipt: latest.receipt ? JSON.parse(latest.receipt) : null, requiresReconciliation: !['EXECUTED', 'REJECTED'].includes(latest.status) };
      }
    }
    throw new OperationalError('NOT_FOUND', 404);
  }
  const handler = async (req, res) => {
    res.setHeader('content-type', 'application/json'); res.setHeader('cache-control', 'no-store'); res.setHeader('x-content-type-options', 'nosniff');
    try { need(req.url && req.url.length < 2048, 'URL_INVALID'); const result = await dispatch(req); res.end(JSON.stringify(result)); }
    catch (error) { res.statusCode = error instanceof OperationalError ? error.status : 503; res.end(JSON.stringify({ error: error instanceof OperationalError ? error.code : 'SERVICE_UNAVAILABLE' })); }
  };
  const server = tls ? httpsServer(tls, handler) : httpServer(handler);
  server.requestTimeout = 10000; server.headersTimeout = 10000; server.maxHeadersCount = 40;
  return { server, db, listen: () => new Promise((yes, no) => { server.once('error', no); server.listen(port, host, () => { server.off('error', no); yes(server.address()); }); }), close: () => new Promise((yes, no) => server.close(error => { db.close(); error ? no(error) : yes(); })) };
}
