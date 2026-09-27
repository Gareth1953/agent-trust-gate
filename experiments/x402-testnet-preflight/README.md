# ATG x402 testnet preflight experiment

This isolated experiment charges **$0.01 of testnet USDC on Base Sepolia** for one synthetic exact-action evaluation. It calls ATG's existing exact-action evaluator. It never runs an external action or uses real procurement data. The main ATG server, site, and payment settings are untouched.

It is a technical experiment, not evidence of a buyer or revenue. The receiving address must belong to Gareth; the fixture address in the automated test is deliberately unusable as a payout destination. Do not enter wallet private keys into the repo or chat.

## Local automated test

From the repository root in PowerShell:

```powershell
npm ci
npm run build
Set-Location .\experiments\x402-testnet-preflight
npm ci
npm test
```

The automated test uses a rejecting in-memory facilitator. It checks free health, invalid input, an unpaid x402 v2 challenge, rejection of an invalid payment, and zero settlements. It does **not** prove a real payment or successful settlement.

## Funded testnet handoff

On Gareth's laptop, set a public EVM receiving address that Gareth controls on Base Sepolia. Use a test wallet and testnet funds only. The x402.org facilitator is for testnet development. Keep the server on loopback while validating the flow.

```powershell
$env:X402_PAY_TO = '0xYOUR_OWN_40_HEX_CHARACTER_ADDRESS'
npm start
```

In a second PowerShell window, an unpaid call should return 402 and a `PAYMENT-REQUIRED` header:

```powershell
curl.exe -i -X POST http://127.0.0.1:8402/preflight -H 'content-type: application/json' -d '{"scenarioId":"allowed"}'
```

Then use an independently funded x402 buyer client to pay the testnet amount and call the same POST route. Record the returned status, payment response/transaction identifier, receiving wallet balance, and ATG decision receipt. A successful payment has not been demonstrated by the automated test. Coinbase's buyer quickstart or Pay for Service skill can build this client; the buyer wallet must hold the correct Base Sepolia test USDC. Do not use mainnet funds here.

## Buyer proof gate

After the funded test succeeds, a separately reviewed public sandbox would be needed for independent agent operators. Count distinct external payer wallets, paid calls, repeat calls from the same independent operator, settlement receipts, net fees, and operator feedback. Test wallets controlled by Gareth do not count as buyers. A useful first gate is three independent operators, at least one repeat paid call, and evidence that the preflight result changed or informed a real integration decision. No profit claim until net revenue is actually received.

This branch does not deploy or publish a paid endpoint. Do not switch to mainnet or solicit live payment before reviewing the receiving address, facilitator, abuse controls, terms, and hosting boundary.
