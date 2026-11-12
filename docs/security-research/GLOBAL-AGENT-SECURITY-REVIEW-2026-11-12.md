# ATG global agent-security architecture review — 12 November 2026

**Chief-architect decision:** continue ATG as a *destination-enforced, exact-action authority and evidence layer*, complementary to runtimes and identity providers. **Production NO-GO.** This is research and a prioritized test plan, not certification or implemented production controls.

## Executive finding

The strongest distinctive buyer story is not generic AI safety: it is **the accountable human/organisation → agent → sub-agent → exact destination-effect chain**, with bounded authority, independent enforcement, a shared spending ceiling, reliable unknown-outcome reconciliation and verifiable receipts.

The immediate code hardening in this change set fixes a narrower but material failure: a broker writer exception after an effect may have occurred must be classified **UNKNOWN** (with no permission to retry), not incorrectly labelled **BROKER_BODY_INVALID / REJECTED**. Two new adversarial unit tests distinguish the unknown result from the independent authoritative effect record. The OpenShell CI workflow now runs those tests before the actual sandbox tests. **Do not call this production safety.**

## External evidence and competitive boundary

| Source | Relevant direction | Implication for ATG |
| --- | --- | --- |
| NIST *Design Tenets for Agent Identity Management Systems* (Oct/Nov 2026) | Unique agent identity; attenuating delegation; least standing privilege; risk-triggered human approvals; signed mandate constraints | Verify chain and principal at destination, not from agent's self-declared metadata |
| NIST *Agent Standards Initiative* (Feb 2026) | Secure interoperable agent interfaces and authority | Build standards-facing adapters, not another closed identity scheme |
| OWASP *Top 10 for Agentic Applications 2026* | Identity/privilege abuse, tool misuse, insecure inter-agent communication, cascading failure | Require adversarial no-bypass, cross-agent, replay, recovery and confused-deputy cases |
| OWASP *Agent Control Standard* (Sept 2026) | Portable runtime control hooks and tracing | Consider optional hooks and evidence exports, but do not treat a hook as a destination enforcement boundary |
| NVIDIA OpenShell technical documentation (Sept/Oct 2026) | Sandboxing, outbound controls, HTTP/GraphQL/MCP inspection, policy proof, audit | Do not claim OpenShell lacks HTTP authorization; ATG must demonstrate cryptographically bound business mandates and consumed exact authority as an additive, separately enforced control |
| Microsoft Entra Agent ID | Agent identities, accountable sponsor/lifecycle, enterprise conditional access | Connect verified principal and agent identities without granting purchasing authority merely from login |
| Google AP2 | Signed transaction mandates and agent-led payment authorization | Evaluate compatibility with buyer payment flows; do not invent AP2 compliance or payment readiness |
| IETF AI-agent auth draft and OpenID AAuth charter | OAuth/WIMSE, sender-constrained identity and cross-domain delegated authorization (emerging) | Follow evolving standards; no bespoke ATG identity token without a compatibility design |
| OpenTelemetry GenAI semantic conventions | Standardised agent/tool tracing (under development) | Optional privacy-minimised correlation export after reliable authoritative event binding |

Primary external URLs (accessed 12 November 2026):
- https://www.nist.gov/blogs/cybersecurity-insights/design-tenets-agent-identity-management-systems
- https://www.nist.gov/news-events/news/2026/02/announcing-ai-agent-standards-initiative-interoperable-and-secure
- https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/
- https://genai.owasp.org/resource/agent-control-standard-acs/
- https://developer.nvidia.com/blog/add-runtime-controls-to-ai-agents-with-nvidia-openshell/
- https://learn.microsoft.com/en-us/entra/id-governance/agent-id-governance-overview
- https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol
- https://datatracker.ietf.org/doc/html/draft-klrc-aiagent-auth-03
- https://openid.net/wg/aauth/charter/
- https://github.com/open-telemetry/semantic-conventions-genai/blob/main/docs/gen-ai/gen-ai-agent-spans.md

## Repository evidence checked

- Real OpenShell **0.1.8** workload in both optional broker modes: `docs/openshell/VALIDATION.md` and `docs/openshell/PURCHASE-APPROVAL-VALIDATION.md`.
- Passkey assertion mode: **software authenticator fixture**; no genuine enrolled human/device ceremony.
- Existing `docs/buyer-upgrades/TRUST-BOUNDARY.md` retains **successful same-owner direct-SQL and coherent-clone replay attacks** as limitations. The independent anti-rollback witness is **not** implemented.
- Existing `docs/buyer-upgrades/PAYMENT-EVALUATION.md` already states the needed protected payment route, delegation limits, cumulative principal allowance, revocation/UNKNOWN reconciliation and buyer acceptance criteria.
- `src/openshell-transaction-broker.ts` had an outer `catch` covering both parsing and writer calls: an unexpected writer throw was labelled malformed body. The focused fix separates this outcome class. This is a correctness hardening, not a repair of SQL/clone bypass.

## Priority decisions and engineering gates

### P0 — Complete mediation, independent custody and restore-resistant one-use

**Decision: approve architecture and negative-test requirements; no production implementation without a separately administered test environment.**

- Buyer identifies one actual destination operation; prove that no direct credentials, alternate queue, SQL/API access or administrative helper can cause that effect without the gate.
- A fresh unprivileged agent/sub-agent cannot read signing keys or edit/restore the writer and audit state.
- Retain a one-use checkpoint outside the restore authority of the writer/agent (buyer-owned ledger or separately administered service). Replaying a coherent cloned writer must fail closed when independently retained checkpoint survives.
- Simulate witness loss, partition, timeout and stale state: no effect, or UNKNOWN awaiting authoritative reconciliation. Never silently retry.
- Preserve existing attacks and failure receipts. No clean-green grading when bypass remains possible.
- Do not attempt to solve whole-host administrator compromise by adding a second SQLite table or signer in the same restore domain.

### P1 — Principal and sub-agent delegation without authority expansion

**Decision: approve specification and adversarial design; implementation should follow a selected, authenticated enterprise identity boundary.**

- Bind authenticated organisation/human principal, exact agent workload identity, mission and resource identity at the protected destination.
- Every delegation hop must be authenticated and non-expanding: no new payee, wider account/tenant, higher amount, later deadline, added tool or broader destination; optionally bound maximum hop count and root approval.
- Require root-principal revocation and status freshness; reject stale/unknown chains, forged identities, cross-tenant replay, reordered hops and privilege escalation.
- Distinguish platform identity proofs from *business approval*. Entra sign-in alone is not spend authorisation.
- Use existing OAuth/OIDC, SPIFFE/WIMSE and relevant mature standards where applicable; draft specifications remain subject to change.

### P1 — Shared root-principal exposure budget

**Decision: approve candidate design; not implemented in the current OpenShell broker.**

- Key policy/exposure by root principal and buyer-owned account, not by agent or newly minted GatePass.
- Reserve the full worst-case monetary exposure atomically, across multiple agents, sub-agents and processes, before any effect.
- Include defined fees and FX bounds; do not treat approximate prices as exact.
- Race N distinct valid approvals against one shared ceiling; show total committed + outstanding never exceeds it.
- Define UNKNOWN and partial-reconciliation accounting so an uncertain charge continues to reserve exposure until resolved.

### P1 — Real human approval and lifecycle

**Decision: require live test before any production claim.**

- Trusted registration, genuine passkey device, authenticated approver UI/session and consent to the **exact displayed** transaction.
- Test wrong signer/device/origin/account; changed order after approval; replay, cancellation, recovery and revocation; demonstrate actual browser ceremony rather than software test fixture only.
- Complete policy for authenticators with backup or zero counters and disclose what is rejected.
- Assess organisational approval authority separately from possession of a passkey.

### P2 — Buyer-verifiable evidence portability

**Decision: approve a later, non-authorising export after authoritative capture is tested.**

- Emit minimal correlation fields for root mandate, each delegation hop, action digest, policy version, approval and destination receipt; mark UNKNOWN or absence clearly.
- Bind evidence to an independently retained append-only or checkpointed store; test deletion, substitution and rollback.
- Consider OCSF/OpenTelemetry semantic conventions as *interoperability formats*, not proof of independence.
- Redact sensitive content and never include passkey material, credentials or unneeded personal data in telemetry.

## Rejected shortcuts

- **No blanket "fully secure" claim** based on an impressive regression count.
- **No assertion of NVIDIA partnership, OpenShell certification, Microsoft endorsement, AP2 compliance or OWASP/NIST certification.**
- **No public production buyer switch** on local tests or simulated passkeys.
- **No self-issued agent identity** accepted in place of authenticated external authority.
- **No automatic retry** after UNKNOWN, or automatic expansion of delegated scope.
- **No paid infrastructure or external procurement/payment rails** without explicit separately scoped deployment approval.

## Buyer positioning after P0/P1 evidence

> "ATG checks the exact business authority at the point of action, alongside an agent runtime and enterprise identity system. Our synthetic integration is reproducible today. We will not call it production protected until the buyer-specific destination, identity, rollback, budget and independent-review gates are satisfied."

**Status as of this review:** P0/P1 deployment gates remain open. The broker exception-classification repair is a narrow tested change candidate, not a completion of these gates.
