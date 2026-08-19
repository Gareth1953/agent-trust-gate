# Controlled Reviewer Materials Index

**Status:** Review-branch index only. No asset is approved for deployment, direct sharing or reviewer outreach, and no review has occurred.

## Exact controlled-review set

| Order | Material | Local file | Purpose | Current sharing state |
| ---: | --- | --- | --- | --- |
| 1 | Executive decision brief | [Executive Decision Brief](executive-decision-brief.md) | Problem, proposition, examples, boundaries and next step | Review branch only |
| 2 | Local supplier-change demonstrator | [Static demonstrator](../site/supplier-bank-change-demo.html) | Reviewer-friendly deterministic control chain | Review branch only |
| 3 | Selected valid scenario | [Valid exact change](../examples/supplier-bank-change-approved.json) | Exact-action GatePass fixture | Review branch only |
| 4 | Changed-account refusal | [Changed account details](../examples/supplier-bank-change-account-mismatch.json) | Digest-bound account mismatch | Review branch only |
| 5 | Missing-verification refusal | [Missing verification](../examples/supplier-bank-change-missing-verification.json) | Missing configured completion evidence | Review branch only |
| 6 | Commercial-authority refusal | [Commercial authority refused](../examples/supplier-bank-change-commercial-authority-refused.json) | Master-data authority does not authorise payment | Review branch only |
| 7 | Assessment offer | [Workflow Governance Assessment Offer](workflow-governance-assessment-offer.md) | Estimated scope, exclusions and call to action | Review branch only |
| 8 | Reviewer questionnaire | [Reviewer Questionnaire](reviewer-questionnaire.md) | Unprompted comprehension, buyer, value and claims questions | Review branch only |
| 9 | Claims and limitations statement | This document, below | Fixed interpretation boundary | Review branch only |

Every file remains review-branch material. A later mission may deploy or directly share only the exact files Gareth names, with the exact reviewer and route he approves. Approval to share one file does not approve another file, an invitation, live-site publication or merge to `main`.

## Claims and limitations statement

ATG is local-first, synthetic, deterministic and non-production. It is not connected to a real directory, ERP, supplier-verification service, bank or payment system. It processes no real supplier, customer or employee data and performs no external action.

The review materials distinguish identity verification; configured authority evidence; business-policy evaluation; independent-verification-step evidence; GatePass decision; and separate execution evidence.

**Configured evidence shows that the organisation’s independent-verification step was completed; ATG does not determine whether the bank details are correct.**

ATG evaluates **configured evidence of current organisational authority for this exact action.** **ATG does not independently establish legal authority.** A GatePass authorises only the exact proposed supplier-master-data change. It does not authorise payment, invoice approval, contract acceptance, supplier creation, broader ERP access, another or future change, repeated use or settlement.

Cryptographic fixture evidence can support integrity, binding and signer-related evidence inside the configured local model. It does not prove honesty, truth, legality, fraud absence, bank-detail correctness, competence, compliance, payment validity or general agent safety. A GatePass is decision evidence, not proof that execution occurred; a separate execution receipt would be required.

The assessment price is **£5,000–£10,000 plus VAT where applicable** and is **ESTIMATED AND NOT YET MARKET-VALIDATED.** The primary call to action is: **“Request a scoped workflow-governance assessment.”** No customer, paid assessment, reviewer endorsement or commercial validation exists as a result of this pack.
