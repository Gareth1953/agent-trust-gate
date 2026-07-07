# Receipt and Audit Trail

Agent Trust Gate™ produces a local audit artifact for every Local Gate Pass Demo decision.

The artifact records:

- Request identity, agent identity, requested action, and action category.
- Mandate, evidence, verified intent, limits, and approval results.
- Which checks passed or failed and why.
- Risk tier, verdict, and reason codes.
- Receipt type and `settlement_allowed` value.
- Deterministic receipt ID and `checked_at` timestamp.
- Clearly labelled local placeholder signature metadata.

An allow receipt can mark settlement as locally eligible for proof-of-flow purposes, but `settlement_executed` remains false. Review and refusal receipts keep settlement blocked.

**No mandate. No evidence. No verified intent. No signed gate pass. No settlement.**

This audit trail is local-only. It does not execute settlement, contact external agents, move money, execute actions, or prove legal compliance.
