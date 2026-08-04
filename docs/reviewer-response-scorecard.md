# Enterprise Reviewer Response Scorecard

**Status:** EMPTY LOCAL SCORING METHOD — NO REVIEW RESULT EXISTS.

## Eligibility gate

A response reaches scoring only if it is from one distinct human, has relevant professional experience or responsibility, occupies one required category and completes the controlled materials and questionnaire. AI-agent output, an automated acknowledgement, a generic acknowledgement, an administrative ticket, a duplicate person or an incomplete review is `INELIGIBLE`.

## Response scoring record

Use `1 = correct/substantive`, `0 = incorrect, absent or unclear`. Capture the reviewer’s own answer before scoring.

| Criterion | Score | Scoring evidence |
| --- | ---: | --- |
| Correct product explanation | 0 / 1 | ATG evaluates configured authority and evidence for one exact proposed action and returns a GatePass or refusal. |
| Correct maturity boundary | 0 / 1 | Local, synthetic, deterministic, non-production and unconnected; no real data or external action. |
| Correct GatePass scope | 0 / 1 | Only the exact supplier-master-data change; not payment, settlement, broader access or reuse. |
| Correct authority/bank-detail distinction | 0 / 1 | Configured organisational-authority evidence and completed-step evidence do not establish legal authority or bank-detail correctness. |
| Correct decision/execution distinction | 0 / 1 | A GatePass is decision evidence; execution requires separate evidence. |
| Buyer identification | 0 / 1 | Identifies a plausible cross-functional owner or coalition. |
| Commercial-next-step identification | 0 / 1 | “Request a scoped workflow-governance assessment.” |
| Existing-control overlap | 0 / 1 | Identifies controls that may already be sufficient or complementary. |
| Residual-gap assessment | 0 / 1 | Identifies a plausible gap or explains why none remains. |
| Pricing reaction | Qualitative | Is **£5,000–£10,000 plus VAT where applicable** credible / too high / too low / impossible to judge, with reason? Pricing is **ESTIMATED AND NOT YET MARKET-VALIDATED.** |
| Likelihood of paid assessment | Qualitative | Consider / maybe / no, with prerequisites. This is not a commitment. |
| Major objection | Text | Strongest technical, business, claims or overlap objection. |
| Recommended change | Text | Most important change before another review. |

## Per-reviewer classification

- `PASS`: eligible and complete; correctly explains the product, maturity boundary, GatePass scope, authority/bank-detail boundary and decision/execution separation; identifies the buyer and next step; and raises no material misleading-claim concern.
- `PARTIAL`: eligible and complete with substantive feedback, but one or more non-critical comprehension or value criteria are incomplete. Missing maturity-boundary comprehension cannot be a pass.
- `FAIL`: eligible and complete but materially misunderstands what ATG does or does not do, or identifies a material misleading claim. A fail remains useful evidence.
- `INELIGIBLE`: does not pass the eligibility gate and is excluded from the five-person thresholds.

Praise never changes a classification. An “existing controls are sufficient” conclusion can be a `PASS` when comprehension is correct.

## Overall controlled-review rule

The overall result passes only when:

1. exactly five distinct eligible humans complete the review, one in each required perspective;
2. at least four of five correctly explain what ATG does;
3. at least four of five correctly explain what ATG does not do, including the maturity and authority/bank-detail boundaries;
4. at least four of five identify a likely buyer and **“Request a scoped workflow-governance assessment.”** as the next step;
5. no response reveals a material misleading claim; and
6. at least three identify a plausible residual control gap, buyer problem or paid-assessment route.

Four qualifying results with one partial may therefore pass if every threshold is met. Three qualifying passes out of five cannot pass. A duplicate or ineligible result does not fill a slot. A material claims concern forces `REFINE_AND_RETEST` or a more conservative decision even when numerical thresholds pass.

Allowed overall decisions are `PROCEED_TO_BOUNDED_PUBLICATION`, `REFINE_AND_RETEST`, `PAUSE` and `SHELVE`. Only Gareth can make the decision; a computed threshold does not publish, contact or commit anyone.
