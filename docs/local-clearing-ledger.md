# Local Clearing Ledger

The Local Clearing Ledger collects allowlisted Agent Clearing artefacts in an immutable in-memory object. It supports pipeline, decision, receipt, verification, fee-placeholder, RefusalGraph signal/query, demo-report, and unknown local records.

Records use deterministic IDs, pseudonymous references, normalized categories, fixed local safety flags, listing, lookup, and aggregate counts. Duplicate deterministic IDs are ignored.

The ledger is local-only and draft-only. It does not write files, use a database, sync cloud/external storage, expose an API, track or analyse users, connect a clearing or receipt network, bill, pay, settle, deploy, publish, send outreach, call webhooks, connect third parties, or execute actions.

Private fields and raw source identifiers are never copied. Output is built from an allowlist; customer, company, account, wallet, credential, document, endpoint, URL, and message data are omitted.

All persistence, database, network, external, commercial, and production use requires technical, security, privacy, legal, and commercial validation plus Gareth final approval. Current status: **local in-memory draft only**.
