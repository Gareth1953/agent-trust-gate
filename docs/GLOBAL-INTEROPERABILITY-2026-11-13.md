# ATG global interoperability programme

Authorised by Gareth Price on 13 November 2026. Aim: improve demonstrable
security and buyer usefulness through appropriate interoperability and
external review. This is an ATG assessment, not a partner announcement.

## Completed engineering stage

An [experimental ACS tool-hook subset](../experiments/acs-adapter/README.md)
connects ACS requests through OWASP's unmodified reference client over actual
loopback HTTP to the existing ATG exact-action verifier.
The retained walkthrough demonstrates a changed-amount denial, a permitted
preflight, one separately enforced synthetic record change, hook replay denial
and destination replay refusal. It does not implement full ACS-Core or run
inside an external ACS Guardian or buyer workload.

The [AP2 checkout bridge](../experiments/ap2-adapter/README.md) additionally
uses Google's pinned AP2 Python SDK to verify a real cryptographic delegated
checkout presentation, independently verifies the merchant JWT, and maps its
bounded amount/hash/expiry into an ordinary ATG grant for the existing
synthetic writer. It does not execute a payment or operate a live merchant.

## Six assessed routes

| Route | Appropriate activity | Current status | Buyer-value proof required |
|---|---|---|---|
| OWASP ACS | Tool-hook interoperability, then an accepted upstream evaluation proposal | Pinned v0.1.4 schemas and unmodified upstream client exercised over real local HTTP; 12 additional transport checks passed | Run inside a compatible coding-agent host; cover all execution paths, production identity and measured overhead; assess ACS-Core separately |
| CoSAI | Secure-design review and contribution through its agent-security workstream | Public onboarding route verified; evidence packet prepared below; no membership or submission claimed | Review of an exact-action gateway pattern with successful and failed attack cases; no buyer introduction is promised |
| OpenID AAuth | Track agent identity, delegation, supervision and budget protocol drafts | Official working-group page and linked protocol draft reviewed; compatibility not implemented | Pin an adopted draft and map issuer/audience/caller/delegation/revocation semantics before a cross-implementation test |
| Google AP2 | Mandate-to-destination interoperability | Pinned actual SDK verifies a delegated checkout chain; merchant signature/hash and narrow constraints checked; one synthetic ATG commit and replay refusal demonstrated; 26 scoped checks passed | Real merchant/user enrollment, independent custody, retained cross-restart mapping, revocation and full AP2/payment conformance remain unimplemented |
| AWS AgentCore | Compare native controls against a proposed ATG destination adapter | Current official concepts reviewed; no AWS account, deployment or integration created | Native-only versus ATG-assisted tests of the same protected operation; evaluate Dogwood temporal controls as well as Cedar |
| Cloud Security Alliance | Evidence mapping and external governance review | Published ATF description reviewed; high-level mapping below; no certification or formal assessment | Full control-by-control mapping, deployment evidence and independent assessment; ATG cannot supply comprehensive governance by itself |

These routes are different: frameworks and standards can be implemented;
community organisations can review or accept contributions. Neither activity
automatically establishes a partnership, certification, endorsement or buyer.

## Material overlap and differentiation

AP2 already addresses delegated mandates, action authorisation and receipts.
Do not pitch signed mandates alone as an ATG-exclusive feature.

AWS currently documents Cedar authorisation and Dogwood temporal policy,
including prior approval, invocation counts and running thresholds in a
session. Do not claim AWS lacks approval or cumulative controls. A possible
ATG contribution is destination-bound consumption and linked outcome evidence
under explicitly tested restore and failure assumptions. Incremental benefit
over a competent native implementation remains unestablished.

OpenID AAuth's published page schedules initial working-group draft-adoption
decisions for 30 November 2026. As of this review, a draft is not a final
OpenID standard. Proposed supervision and budget work overlaps ATG's scope;
track it before designing an incompatible proprietary bridge.

## CoSAI technical evaluation packet

Proposed question: Can an exact-action authority gate complement workload
containment while preserving honest execution evidence under retries,
delegation, state changes and restored agent state?

Reproducible evidence entry points:

- [OpenShell integration](openshell/README.md) and
  [combined shared-budget validation](openshell/DELEGATED-BUDGET-VALIDATION.md).
- [ACS experiment](../experiments/acs-adapter/README.md), its local test command
  and unchanged upstream schemas.
- Existing custody tests, including successful common-owner direct-SQL and
  coherent-store-clone counterexamples (`test/custody-witness.test.mjs`).
- Retained anti-rollback research and explicit bypass counterexamples
  (`experiments/anti-rollback/` and `test/antirollback-custody.test.mjs`).

Review requested: trust-root ownership; independent administration; complete
destination enforcement; real principal enrollment; safe UNKNOWN handling;
whether exact-action checks provide useful additional assurance. Internal
tests are not independent assessment. No successful attack is relabelled
as a defence.

Official onboarding supports free technical participation through repositories
and mailing lists. A contribution should use the project's documented route
and maintainer scope, not an unsolicited product advertisement. This packet
has not been externally submitted.

## Initial CSA/ATF evidence mapping

This maps the five elements described in CSA's ATF article, not the complete
canonical specification or a compliance assessment.

| ATF element | Relevant ATG evidence | Material gap |
|---|---|---|
| Identity | Separate Entra reviewer demo; pinned caller identity in custody tests | Organisational authority, agent lifecycle enrollment and production identity operations |
| Behaviour | Exact-action binding, signed decisions and synthetic outcomes | General behavioural/anomaly monitoring and commercial correctness |
| Data governance | Strict structured input and explicit evidence boundaries | Comprehensive privacy, PII handling, information-flow and retention controls |
| Segmentation | Existing OpenShell workload/network test and separate custody identities | Every buyer access path, independent administration and production deployment verification |
| Incident response | Stop/revoke and UNKNOWN/no-automatic-retry tests | Buyer-owned response procedures, operational recovery drills and independent assurance |

## Buyer evaluation and implementation gates

Use one fictional supplier/order workflow first. Record permitted work, altered
payee/amount/resource, expired/revoked authority, duplicate calls, interrupted
responses, agent-state restore and direct bypass attempts. Retain all failures.
Compare native controls fairly; measure added latency, refusal rate, operating
cost and integration effort before asserting a commercial advantage.

Advance to a buyer-controlled pilot only when a named owner provides the
destination, identity/custody boundaries, acceptable budget and acceptance
criteria. No paid membership, cloud deployment or payment processing has been
activated. Public claims must name the exact tested scope. Formal contribution
agreements and their intellectual-property terms require the owner's review;
none has been accepted or signed by this work.

## Primary sources inspected, 13 November 2026

- [OWASP ACS project](https://owaspacs.org/) and the pinned schema/CONTRIBUTING
  files at commit `834f3f0d51e7bbbd9a68ff682bec89f97ddd72d8`.
- [CoSAI participation](https://www.coalitionforsecureai.org/get-involved/)
  and linked [onboarding](https://github.com/cosai-oasis/oasis-open-project/blob/main/ONBOARDING.md).
- [OpenID AAuth working group](https://openid.net/wg/aauth/) and its linked
  [protocol draft](https://datatracker.ietf.org/doc/draft-hardt-oauth-aauth-protocol/).
- [AP2 authorisation model](https://ap2-protocol.org/ap2/agent_authorization/).
- [AWS AgentCore policy concepts](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/policy-core-concepts.html).
- [CSA ATF article](https://cloudsecurityalliance.org/blog/2026/02/02/the-agentic-trust-framework-zero-trust-governance-for-ai-agents).

The previously surfaced CSA control-plane artifact URL returned 404 during
this run; it is not used as inspected evidence. Dynamic sources may change.
