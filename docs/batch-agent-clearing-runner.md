# Batch Agent Clearing Runner

The batch runner processes multiple local draft requests through the existing RefusalGraph query, clearing decision, receipt, local verification, fee-placeholder, and report pipeline. It accumulates allowlisted records in one immutable in-memory Local Clearing Ledger and queries only the caller-supplied RefusalGraph Local Signal Store.

It is local-only and draft-only. It does not write files, schedule work, start servers, orchestrate agents, scrape, use databases or networks, perform external lookup, track or analyse users, bill, pay, settle, deploy, publish, contact third parties, or execute requested actions.

Raw customer, company, account, wallet, credential, document, endpoint, URL, and message data is never copied. Identifiers are deterministic pseudonymous references.

Any network, storage, commercial, orchestration, or production use requires technical, security, privacy, legal, and commercial validation plus Gareth final approval.
