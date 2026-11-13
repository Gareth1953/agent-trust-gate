// Disposable controller-owned synthetic fixture; never expose through a tool.
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { createCustodyFixture, FIXTURE_NOW } from '../../scripts/custody-fixture.mjs';
import { createLocalVerificationProfile, createVerifierContext, InMemoryNonceStore } from '../../dist/src/exact-action-gatepass.js';

export function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'atg-acs-'));
  const f = createCustodyFixture(join(root, 'fixture'));
  const grant = f.grant({ nativeSessionId: randomUUID() });
  const profile = createLocalVerificationProfile('active', {
    profileId: grant.proposedAction.verificationProfile, verifierIdentity: 'acs-synthetic-preflight',
    issuerIdentity: f.trust.issuerIdentity, keyId: f.trust.issuerKeyId,
    keyPair: { keyId: f.trust.issuerKeyId, publicKeyPem: f.trust.issuerPublicKeyPem },
  });
  profile.clockSkewSeconds = 0;
  const nonces = new InMemoryNonceStore(); nonces.registerUnused(grant.issuance.gatePass);
  const context = createVerifierContext(grant.issuance, nonces, {
    verifierIdentity: profile.verifierIdentity, verificationProfile: profile,
    trustedClock: { clockId: 'acs-fixture-clock', now: () => new Date(FIXTURE_NOW) },
  });
  const request = { jsonrpc: '2.0', id: 'transport-001', method: 'steps/toolCallRequest', params: {
    acs_version: '0.1.0', request_id: randomUUID(), timestamp: FIXTURE_NOW,
    metadata: { agent_id: grant.proposedAction.subjectAgentIdentity, session_id: grant.proposedAction.nativeSessionId },
    payload: { tool: { name: grant.proposedAction.toolIdentity, version: '1.0.0' },
      operation: grant.proposedAction.operationName,
      arguments: Object.fromEntries(Object.entries(grant.proposedAction.canonicalArguments).map(([k,v]) => [k,{value:v}])) },
  } };
  const witness = f.open();
  return { ...f, grant, context, request, witness, close() { witness.close(); rmSync(root, { recursive:true, force:true }); } };
}
