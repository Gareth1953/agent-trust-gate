# Microsoft identity and exact-action purchasing controls

**Controlled demonstration evidence reviewed 20 October 2026. Non-production scope.**

AI agents can prepare a transaction while its amount, supplier or underlying order changes. Knowing who signed in does not establish authority to execute that exact purchase. A lost acknowledgement also creates a duplicate-execution risk.

ATG has completed one controlled, non-production workflow combining genuine Microsoft Entra reviewer authentication with a separately approved £4,000 synthetic purchase. Identity admission granted zero purchasing authority. Separate manual approval and execution confirmations preceded exact-action and business-state checks, one-use GatePass enforcement, and linked decision and execution evidence.

The retained local evidence was rechecked on 20 October 2026: exactly one order, one executed attempt, a consumed nonce and committed exposure, with no duplicate, pending or UNKNOWN outcome. The GatePass signature and request, reviewer, business-state and receipt linkages verified. No new authentication or execution was performed during release preparation.

## What this establishes

- The controlled repository companion used genuine Microsoft browser authentication and the configured exact reviewer allowlist.
- Identity alone granted no authority, approval, GatePass or execution permission.
- A separate human terminal confirmation approved the exact synthetic action; another confirmation requested execution.
- The synthetic purchase was GBP 4000 / 400000 minor units. Signed authority bound the request and relevant order/supplier-bank state; its one-use state ended EXECUTED.
- Decision and execution receipts remain separate: the decision receipt says allowed / not_executed; the linked execution receipt says executed.

## Keep the components separate

| Component | Established scope | Excluded inference |
| --- | --- | --- |
| Controlled Entra reviewer companion | One genuine reviewer admission followed by separately confirmed synthetic purchase execution | No production SSO/MFA qualification, real financial permission or customer deployment |
| Earlier curated offline source demo | Mock Entra attribution with reproducible changed-detail, changed-state, replay and UNKNOWN/reconciliation scenarios | It does not sign in or become a live Microsoft demo because a separate companion succeeded |
| Published local.7 plugin | Existing local synthetic SDK/CLI/MCP capabilities and original published fixes | No newly packaged Microsoft login or live reviewer workflow |
| Separate operational record-service candidate | Its existing versioned record-update implementation and qualification records | This purchase run does not qualify operational rc.2 sign-in, TLS, processes or deployment |

Public local.7, prior source/buyer packs and operational releases are preserved byte-for-byte. No package rebuild, version change or runtime source release is proposed here.

## Proposed £1,500 evaluation

Start with one synthetic purchasing workflow and up to five agreed acceptance questions. Proposed deliverables are a scoping brief, a guided session up to 90 minutes, a sanitised evidence review, written findings with integration gaps and a GO / conditional GO / NO-GO recommendation, plus a handover up to 30 minutes and one factual-correction pass.

The default buyer session remains offline, uses mock identity and synthetic data, and needs no buyer credentials or production access. This sanitised summary of the prior genuine sign-in can be discussed separately. A new live sign-in, buyer-tenant setup, new coding or customer integration requires a separately agreed scope and approval. Proposed fee £1,500, subject to scope, availability and written agreement; tax, payment terms, dates and acceptance arrangements remain to be agreed. No favourable result, savings or production readiness is guaranteed.

**Next step: nominate one workflow, one workflow owner and one technical reviewer, and agree up to five acceptance questions.**

## Limits that remain visible

This is local retained evidence, not independent attestation, Microsoft endorsement or certification. Microsoft authenticated identity; it did not approve spending or sign ATG receipts. Approval still relies on public synthetic fixture authority. Action receipts use a fixed synthetic clock; their September fixture date is not wall-clock proof of October execution time. The ephemeral pseudonymous reviewer link supports same-run correlation, not later independent proof of a real reviewer identifier.

No real purchasing/payment API, production signing-key custody, production approval service, hostile-code OS sandbox, production SLA or regulatory assurance is supplied. Records are unencrypted; host ACLs require verification, and same-user/admin compromise remains outside the demonstrated boundary. Prior Windows EPERM failures remain unattributed. Earlier failures and test exclusions are disclosed in [the validation note](../discovery-site/microsoft-validation-notes.html). See the [presentation](../discovery-site/microsoft-evaluation.html) and [sanitised facts](../discovery-site/microsoft-validation-summary.json).
