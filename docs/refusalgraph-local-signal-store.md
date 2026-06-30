# RefusalGraph Local Signal Store

The store collects allowlisted refusal signals in an immutable in-memory object. It supports refused, approval-required, high-caution, blocked, limited, failed-verification, fee-readiness-blocked, and unknown local signals.

Local queries combine optional normalized filters for intent, action, signal type, caution, approval, blocked state, and evidence. Results return matching local signals, highest caution, refusal reasons, and fixed false network/tracking flags. Summaries count signal types, caution, evidence, approval, and blocking.

The store does not write files, use a database, scrape or fetch, sync cloud/external storage, perform external lookup, expose an API, track or analyse users, connect networks, bill, pay, settle, deploy, publish, contact, call webhooks, connect third parties, or execute actions.

Raw source IDs are pseudonymized and output is allowlisted. Customer, company, account, wallet, credential, document, endpoint, URL, and message fields are omitted.

Any persistence, external lookup, network, commercial, or production use requires technical, security, privacy, legal, and commercial validation plus Gareth final approval. Current status: **local in-memory draft only**.
