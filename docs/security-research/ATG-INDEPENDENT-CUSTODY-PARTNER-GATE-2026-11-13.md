# ATG independently administered checkpoint — partner acceptance gate
**13 November 2026. Technical design only; NOT an independent deployment. Production NO-GO.**

## The security property to prove
A hostile or compromised *transaction-system administrator* may restore every writer-side database, key, backup, container, VM and deployment, but cannot reset, rewrite, restore or roll back the checkpoint. Reusing an already admitted exact action must fail. The checkpoint authority itself is independently operated and is excluded from the buyer-side administrator's restore powers.

## Proposed limited deployment agreement
- **Buyer effect owner:** owns actual ERP/payment destination and guarantees all consequential writes pass a single controlled effect/commit API. Produces route and permission inventory.
- **Independent checkpoint custodian:** separately administers cryptographic service identities, append-only or monotonic state, backups, recovery logs and incident controls. Keeps a writer administrator unable to reset checkpoint history. No self-service release/reset on agent channel.
- **ATG controller:** authenticates a real organisation's signers, verifies exact mandates and non-expanding delegation at the protected destination, enforces shared root-account spending ceiling and rejects expired/revoked authority.
- **Independent outcome observer:** confirms what actually occurred on the buyer destination, supports UNKNOWN reconciliation and cannot infer success from a reservation.
- **External reviewer:** attacks the actual deployed access boundaries, signs a reproducible findings register. No accreditation or certification implied.

## Hard operational acceptance checks
1. From the agent principal, attempt direct SQL, writer invocation, alternate HTTP/IPC endpoints, credential theft, network-policy bypass and reset. Every consequential route must deny access.
2. From destination administrator privileges, restore the entire destination and all accessible backups (including cloned credentials) after an accepted effect. The separate checkpoint must still refuse the exact-action replay.
3. Prove checkpoint owner and buyer root administrators are different people/organisations with distinct recovery rights. If common superuser exists over both, label the test FAILED.
4. Verify checkpoint retention and monotonically ordered transitions across restart, backup recovery and disaster simulation. Test clone-before-first-use and clock rollback, not just repeat from one database.
5. Verify signed action ID/digest, root/account budget, authentic signer, workload identity, trusted device approval, mandate expiry and destination ID at commit. Reject malformed/forged requests before consuming checkpoint permission.
6. Crash after reservation but before effect; lose an acknowledgement after effect; checkpoint unavailable; DNS/network partition. Keep transaction UNKNOWN/HELD and do not retry, release budget or claim a payment without trusted observation.
7. Independent security assessor repeats the attack matrix, records source/deployment hashes, all failures and critical/high findings, and signs only scoped conclusions.

## Responsibility / cost
No cloud account, checkpoint provider or cost has been authorised. Buyer and custodian must first provide operating model, jurisdiction, audit retention, recovery ownership, estimated costs, and signed service-level boundaries. Selecting a database on the same administrator-controlled computer does **not** satisfy this gate.

**Decision:** implementation design and synthetic test evidence may proceed; deployment and real-world claims require separately approved infrastructure, named responsible operators, actual evidence and external review.
