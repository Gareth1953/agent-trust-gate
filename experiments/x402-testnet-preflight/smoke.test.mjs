import assert from 'node:assert/strict';
import { once } from 'node:events';
import test from 'node:test';
import { createApp } from './server.mjs';

const network = 'eip155:84532';
const payTo = '0x000000000000000000000000000000000000dEaD'; // Test fixture only; never use for a real payment.

test('unpaid and invalid payment cannot reach synthetic evaluation', async () => {
  let verifies = 0;
  let settlements = 0;
  const facilitator = {
    async getSupported() { return { kinds: [{ x402Version: 2, scheme: 'exact', network }], extensions: [], signers: {} }; },
    async verify() { verifies++; return { isValid: false, invalidReason: 'fixture_rejection' }; },
    async settle() { settlements++; throw new Error('Settlement must not occur in this test'); },
  };
  const listener = createApp({ payTo, facilitator }).listen(0, '127.0.0.1');
  await once(listener, 'listening');
  const base = `http://127.0.0.1:${listener.address().port}`;
  try {
    assert.equal((await fetch(`${base}/health`)).status, 200);
    const invalidInput = await fetch(`${base}/preflight`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ scenarioId: 'unknown' }),
    });
    assert.equal(invalidInput.status, 400);
    const payload = JSON.stringify({ scenarioId: 'allowed' });
    const unpaid = await fetch(`${base}/preflight`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: payload,
    });
    assert.equal(unpaid.status, 402);
    const challenge = JSON.parse(Buffer.from(unpaid.headers.get('payment-required'), 'base64').toString());
    assert.equal(challenge.x402Version, 2);
    assert.equal(challenge.accepts[0].network, network);
    assert.equal(challenge.accepts[0].amount, '10000');
    const invalidPayment = await fetch(`${base}/preflight`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'payment-signature': Buffer.from(JSON.stringify({
          x402Version: 2, resource: challenge.resource, accepted: challenge.accepts[0],
          payload: { signature: 'invalid-test-fixture' },
        })).toString('base64'),
      },
      body: payload,
    });
    assert.equal(invalidPayment.status, 402);
    assert.equal(verifies, 1);
    assert.equal(settlements, 0);
  } finally {
    listener.close();
    await once(listener, 'close');
  }
});

test('missing or malformed receiving address fails before server starts', () => {
  assert.throws(() => createApp({}), /X402_PAY_TO/);
  assert.throws(() => createApp({ payTo: '0x123' }), /X402_PAY_TO/);
});
