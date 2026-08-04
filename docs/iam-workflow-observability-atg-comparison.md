# IAM, Workflow, Observability and ATG Comparison

## Purpose

Existing enterprise controls can be strong and may already be sufficient for a given workflow. This comparison does not presume a gap. It shows where a local ATG evaluation may be complementary if an organisation needs one evidence chain binding a specific agent, accountable principal, delegation, exact action, authorised human decision, freshness and replay state, decision receipt and separate execution receipt.

| Control family | Primary question | Typical strengths | Boundary relevant to this assessment | Possible relationship to ATG |
| --- | --- | --- | --- | --- |
| Authentication | Who or what authenticated? | Account access, credential ceremony, session establishment | Authentication alone does not express the complete business mandate for one supplier-change payload | Identity evidence may be an input; ATG separately evaluates delegated and exact-action authority |
| IAM / IGA | Which identities, roles and entitlements exist and are current? | Joiner/mover/leaver controls, roles, group membership, access reviews | A role may not bind a human decision to one canonical supplier, account ending, reason and freshness state | IAM/IGA evidence may support configured evidence of current organisational authority for this exact action and revocation checks; ATG does not independently establish legal authority. |
| PAM | How is privileged access granted and controlled? | Time-limited elevation, credential brokering, session control and recording | Privileged access can permit system use without necessarily proving the business approval for one exact data mutation | PAM can control the operator or service path; ATG may bind the proposed mutation and decision evidence |
| ERP workflow approval | Did configured workflow participants approve the change? | Native business rules, queues, approvals and change history | Capabilities vary; an organisation must test whether agent principal, delegation, independent verification, exact digest and replay are already captured | Existing ERP approval may be sufficient or may supply evidence into a complementary exact-action evaluation |
| Observability / logging | What did systems report before, during and after activity? | Events, traces, alerts, operational history and investigations | Logs are commonly evidence after or during events; they do not always constitute pre-action authority | Observability can consume decision and execution receipts and correlate them with system events |
| Payment verification | Is a payment instruction or destination verified under the organisation’s controls? | Payee controls, transaction checks, banking controls and payment approval | This mission concerns master-data change before payment and performs no bank-detail validation or payment verification | Payment controls remain separate; an ATG GatePass for master data gives no payment authority |
| ATG exact-action role | Does this proposed action have the configured identity, mandate, approvals, limits and evidence right now? | Canonical binding, deterministic refusal reasons, freshness, one-use decision evidence and receipt separation | Current implementation is local, synthetic and not integrated with enterprise sources or systems | May complement existing controls where the complete cross-system evidence chain is not otherwise available |

## The candidate ATG binding

Where useful, ATG is designed to bind:

```text
one agent
  + one accountable principal
  + one scoped delegation
  + one exact action
  + one authorised human decision (and co-approval where required)
  + one freshness and replay state
  -> one GatePass decision receipt
  -> one separate execution receipt
```

Those stages remain distinct:

- **Identity verification** concerns who or what the fixture represents.
- **Authority verification** concerns current delegation, role, scope and limits.
- **Business-policy evaluation** applies the configured workflow requirements.
- **GatePass decision** permits one exact proposal or refuses it.
- **Execution evidence** separately reports whether an execution claim has evidence.

Cryptographic fixture checks support integrity, binding and signer-related evidence within the local model. They do not prove underlying assertions true, establish legality, validate bank information, show absence of fraud, certify compliance or prove general agent safety.

## Assessment decision test

The workflow-governance assessment should first document what authentication, IAM/IGA, PAM, ERP workflow, observability and payment controls already provide. It should recommend an ATG-style exact-action layer only when a material evidence or control need remains. A valid assessment outcome may be that ordinary existing controls are sufficient.
