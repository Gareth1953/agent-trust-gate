# Receipt Verification CLI

The CLI reads one local JSON file containing a `receipt` object, validates its local shape, and passes the allowlisted receipt to the existing Receipt Verification Readiness engine. It prints a local draft verification result to standard output.

Run safely with:

`npm run verify:receipt -- examples/receipt-verification-cli-input-valid.json --pretty`

The CLI does not write files, start a server, use a network, perform external or blockchain verification, expose a public verifier, track or analyse users, bill, pay, settle, deploy, publish, contact third parties, or execute actions.

Private customer, company, account, wallet, credential, document, endpoint, URL, and message fields are ignored and never copied to output or errors. Any live, external, public, commercial, or payment use requires technical, security, privacy, legal, and commercial validation plus Gareth final approval.
