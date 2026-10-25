/** Microsoft commercial-cloud identity integration. Never mints a human token. */
import { createPublicKey, randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { isAbsolute } from 'node:path';
import { PublicClientApplication } from '@azure/msal-node';
import { AtgHumanApprovals } from './sdk.mjs';
import { transportUrl, validateEntraProfile } from './runtime.mjs';

export function entraProfile(input) {
  return validateEntraProfile({ ...input, provider: 'microsoft-entra', issuer: `https://login.microsoftonline.com/${input.tenantId}/v2.0` });
}
async function microsoftJson(url) {
  if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0') throw new Error('TLS_VERIFICATION_REQUIRED');
  const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error('ENTRA_METADATA_UNAVAILABLE');
  const reader = response.body.getReader(), chunks = []; let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.length; if (size > 512 * 1024) throw new Error('ENTRA_METADATA_TOO_LARGE');
      chunks.push(value);
    }
  } finally { await reader.cancel(); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
/** Called explicitly by the operator; JWT header URLs are never fetched. */
export async function discoverEntraTrust(input) {
  const profile = entraProfile(input);
  const base = `https://login.microsoftonline.com/${profile.tenantId}`;
  const metadata = await microsoftJson(`${base}/v2.0/.well-known/openid-configuration`);
  if (metadata.issuer !== profile.issuer || metadata.jwks_uri !== `${base}/discovery/v2.0/keys`) throw new Error('ENTRA_METADATA_TRUST_MISMATCH');
  const document = await microsoftJson(metadata.jwks_uri);
  if (!Array.isArray(document.keys) || document.keys.length < 1 || document.keys.length > 100) throw new Error('ENTRA_KEYS_INVALID');
  const jwks = document.keys.map(key => {
    const issuer = key.issuer?.replace('{tenantid}', profile.tenantId);
    if (issuer !== profile.issuer || key.kty !== 'RSA' || key.use !== 'sig' || (key.alg && key.alg !== 'RS256') || typeof key.kid !== 'string' || key.d || key.p || key.q) throw new Error('ENTRA_KEY_TRUST_MISMATCH');
    const publicKey = createPublicKey({ key, format: 'jwk' });
    if (publicKey.asymmetricKeyDetails.modulusLength < 2048) throw new Error('ENTRA_KEY_TOO_SMALL');
    return { kty: 'RSA', use: 'sig', alg: 'RS256', kid: key.kid, n: key.n, e: key.e };
  });
  if (new Set(jwks.map(k => k.kid)).size !== jwks.length) throw new Error('ENTRA_DUPLICATE_KEY');
  return { ...profile, jwks };
}
export async function writeEntraTrust(inputPath, outputPath) {
  if (!isAbsolute(inputPath) || !isAbsolute(outputPath)) throw new Error('ABSOLUTE_PATH_REQUIRED');
  const identity = await discoverEntraTrust(JSON.parse(readFileSync(inputPath, 'utf8')));
  writeFileSync(outputPath, JSON.stringify(identity, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
  return { identityTrustFile: outputPath, humanAuthenticationVerified: false };
}
export function interactiveRequest(identity, openBrowser) {
  validateEntraProfile(identity);
  return {
    scopes: [`api://${identity.audience}/atg.approve`],
    prompt: 'login', nonce: randomBytes(32).toString('base64url'),
    claims: JSON.stringify({ access_token: { acrs: { essential: true, value: identity.requiredAuthenticationContext } } }),
    extraQueryParameters: { max_age: String(identity.maximumAuthenticationAgeSeconds) },
    openBrowser,
    successTemplate: 'ATG sign-in completed. Return to your terminal to review the action.',
    errorTemplate: 'ATG sign-in failed. Close this window and check your tenant settings.',
  };
}
/** Tokens and the MSAL cache stay in this process; no token is printed or saved. */
export async function signInEntra(identity, openBrowser) {
  validateEntraProfile(identity);
  if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0') throw new Error('TLS_VERIFICATION_REQUIRED');
  const client = new PublicClientApplication({
    auth: { clientId: identity.clientId, authority: `https://login.microsoftonline.com/${identity.tenantId}`, clientCapabilities: ['cp1'] },
    system: { loggerOptions: { piiLoggingEnabled: false, loggerCallback() {} } },
  });
  try {
    const result = await client.acquireTokenInteractive(interactiveRequest(identity, openBrowser));
    if (!result?.accessToken) throw new Error('ENTRA_ACCESS_TOKEN_MISSING');
    return result.accessToken;
  } finally { await client.clearCache(); }
}
export async function runEntraApproval({ configPath, command, requestId, reviewedDigest, openBrowser, review }) {
  if (!isAbsolute(configPath) || !['inspect', 'review', 'revoke'].includes(command) || !/^[A-Za-z0-9-]{1,100}$/.test(requestId || '')) throw new Error('ENTRA_COMMAND_INVALID');
  if (command === 'revoke' && !/^[a-f0-9]{64}$/.test(reviewedDigest || '')) throw new Error('REVIEWED_DIGEST_REQUIRED');
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  const gatewayUrl = transportUrl(config.gatewayUrl); validateEntraProfile(config.identity);
  const accessToken = await signInEntra(config.identity, openBrowser);
  const human = new AtgHumanApprovals({ gatewayUrl, accessToken });
  if (command === 'revoke') return human.revoke(requestId, reviewedDigest);
  const proposal = await human.inspect(requestId);
  if (command === 'inspect') return proposal;
  // The injected reviewer receives the authoritative gateway proposal, never agent text.
  if (!await review(proposal)) return { requestId, status: 'CANCELLED' };
  return human.approve(requestId, proposal.digest);
}
