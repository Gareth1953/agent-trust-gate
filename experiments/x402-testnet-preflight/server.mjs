import express from 'express';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { HTTPFacilitatorClient, x402ResourceServer } from '@x402/core/server';
import { ExactEvmScheme } from '@x402/evm/exact/server';
import { paymentMiddleware } from '@x402/express';
import { ExactActionTrustGatewayPrototype } from '../../dist/src/exact-action-trust-gateway-prototype.js';

const network = 'eip155:84532'; // Base Sepolia testnet only.
const scenarios = new Set(['allowed', 'overspend']);

export function createApp({ payTo, facilitator = new HTTPFacilitatorClient() }) {
  if (!/^0x[0-9a-fA-F]{40}$/.test(payTo ?? '')) {
    throw new Error('Set X402_PAY_TO to an EVM testnet receiving address you control.');
  }
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '4kb' }));
  app.get('/health', (_req, res) => res.json({ ok: true, synthetic: true, network }));

  // Reject malformed requests before a buyer signs or settles a payment.
  app.post('/preflight', (req, res, next) => {
    if (!scenarios.has(req.body?.scenarioId)) {
      res.status(400).json({ error: 'Use synthetic scenarioId allowed or overspend.' });
      return;
    }
    next();
  });

  const resource = new x402ResourceServer(facilitator).register(network, new ExactEvmScheme());
  app.use(paymentMiddleware({
    'POST /preflight': {
      accepts: { scheme: 'exact', network, payTo, price: '$0.01' },
      description: 'ATG synthetic exact-action preflight; no real action or transaction',
      mimeType: 'application/json',
    },
  }, resource));
  app.post('/preflight', async (req, res, next) => {
    try {
      const gate = new ExactActionTrustGatewayPrototype();
      const result = await gate.evaluateExactAction(req.body.scenarioId);
      res.json({ decision: result.decision, receipt: result.trustReceipt, synthetic: true });
    } catch (error) {
      next(error);
    }
  });
  return app;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const app = createApp({ payTo: process.env.X402_PAY_TO });
  const host = '127.0.0.1';
  const port = Number(process.env.ATG_TEST_PORT ?? '8402');
  app.listen(port, host, () => console.log(`Synthetic ATG x402 testnet preflight: http://${host}:${port}`));
}
