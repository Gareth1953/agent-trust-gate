import { generateKeyPairSync, randomBytes } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';
import { tokenHash, validateOperationalConfiguration } from './runtime.mjs';

/** Explicit operator command; never creates identities or mints human tokens. */
export function provisionDeployment(directory, publicTrustPath) {
  if (!isAbsolute(directory) || !isAbsolute(publicTrustPath)) throw new Error('Absolute paths required.');
  const trust = JSON.parse(readFileSync(publicTrustPath, 'utf8'));
  const agents = trust.agents.map(agent => ({ id: agent.id, recordPrefix: agent.recordPrefix, token: randomBytes(32).toString('base64url') }));
  const claim = randomBytes(32).toString('base64url');
  const keys = () => generateKeyPairSync('ed25519', { publicKeyEncoding: { format: 'pem', type: 'spki' }, privateKeyEncoding: { format: 'pem', type: 'pkcs8' } });
  const gateway = keys(), destination = keys();
  mkdirSync(directory, { mode: 0o700 });
  for (const name of ['gateway', 'destination', 'agent']) mkdirSync(join(directory, name), { mode: 0o700 });
  const write = (path, value) => writeFileSync(path, typeof value === 'string' ? value : JSON.stringify(value, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
  const common = { tenantId: trust.tenantId, policyVersion: trust.policyVersion, gatewayUrl: trust.gatewayUrl, destinationUrl: trust.destinationUrl, gatewayPublicKeyPem: gateway.publicKey, destinationPublicKeyPem: destination.publicKey, agents: agents.map(a => ({ id: a.id, recordPrefix: a.recordPrefix, tokenHash: tokenHash(a.token) })), emergencyStop: false };
  write(join(directory, 'gateway', 'signing.pem'), gateway.privateKey);
  write(join(directory, 'destination', 'signing.pem'), destination.privateKey);
  write(join(directory, 'destination', 'claim.secret'), claim);
  for (const agent of agents) {
    if (!/^[A-Za-z0-9][A-Za-z0-9_.-]{0,99}$/.test(agent.id)) throw new Error('Invalid agent ID.');
    write(join(directory, 'agent', agent.id + '.secret'), agent.token);
  }
  const gatewayPath = join(directory, 'gateway', 'config.json'), destinationPath = join(directory, 'destination', 'config.json');
  write(gatewayPath, { ...common, signingPrivateKeyFile: join(directory, 'gateway', 'signing.pem'), databasePath: join(directory, 'gateway', 'state.sqlite'), claimTokenHash: tokenHash(claim), approvalTtlSeconds: 120, identity: trust.identity, humans: trust.humans });
  write(destinationPath, { ...common, signingPrivateKeyFile: join(directory, 'destination', 'signing.pem'), databasePath: join(directory, 'destination', 'state.sqlite'), claimTokenFile: join(directory, 'destination', 'claim.secret') });
  validateOperationalConfiguration(gatewayPath, 'gateway'); validateOperationalConfiguration(destinationPath, 'destination');
  return { gatewayConfig: gatewayPath, destinationConfig: destinationPath, agentCredentialDirectory: join(directory, 'agent'), humanIdentityProviderConfigured: true, humanAuthenticationVerified: false };
}
