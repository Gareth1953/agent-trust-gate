import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import {
  ENTERPRISE_REVIEWER_CATEGORIES,
  ENTERPRISE_REVIEWER_PACK_NO_EXTERNAL_ACTION,
  classifyEnterpriseReviewerResponse,
  createLocalInvitationControl,
  evaluateControlledEnterpriseReview,
  type EnterpriseReviewerResponse,
} from "../src/enterprise-reviewer-pack.js";

const root = process.cwd();

function qualifyingResponse(
  index: number,
  overrides: Partial<EnterpriseReviewerResponse> = {},
): EnterpriseReviewerResponse {
  const reviewerCategory = ENTERPRISE_REVIEWER_CATEGORIES[index];
  if (reviewerCategory === undefined) throw new Error(`No reviewer category at index ${index}`);
  return {
    reviewerId: `reviewer-${index + 1}`,
    reviewerCategory,
    source: "HUMAN",
    professionalRelevanceConfirmed: true,
    reviewCompleted: true,
    correctProductExplanation: true,
    correctDoesNotDoExplanation: true,
    correctMaturityBoundary: true,
    correctGatePassScope: true,
    correctAuthorityEvidenceVersusBankDetailCorrectness: true,
    correctLegalAuthorityBoundary: true,
    correctDecisionVersusExecution: true,
    buyerAndCommercialNextStepIdentified: true,
    existingControlsAssessed: true,
    plausibleControlGapBuyerProblemOrPaidRoute: true,
    materialClaimsConcern: false,
    ...overrides,
  };
}

test("a qualified completed human review is eligible and can pass", () => {
  assert.equal(classifyEnterpriseReviewerResponse(qualifyingResponse(0)), "PASS");
});

test("an AI-agent response is ineligible", () => {
  assert.equal(
    classifyEnterpriseReviewerResponse(qualifyingResponse(0, { source: "AI_AGENT" })),
    "INELIGIBLE",
  );
});

test("automated acknowledgements and administrative tickets are ineligible", () => {
  for (const source of ["AUTOMATED_ACKNOWLEDGEMENT", "ADMINISTRATIVE_SUPPORT_TICKET"] as const) {
    assert.equal(classifyEnterpriseReviewerResponse(qualifyingResponse(0, { source })), "INELIGIBLE");
  }
});

test("a duplicate reviewer is not counted twice", () => {
  const responses = ENTERPRISE_REVIEWER_CATEGORIES.map((_, index) => qualifyingResponse(index));
  responses[4] = qualifyingResponse(4, { reviewerId: "reviewer-1" });
  const summary = evaluateControlledEnterpriseReview(responses);
  assert.equal(summary.eligibleCount, 4);
  assert.equal(summary.ineligible, 1);
  assert.equal(summary.scoredResponses[4]?.duplicateReviewer, true);
  assert.equal(summary.overallPass, false);
});

test("four eligible passes out of five can satisfy the controlled-review rule", () => {
  const responses = ENTERPRISE_REVIEWER_CATEGORIES.map((_, index) => qualifyingResponse(index));
  responses[4] = qualifyingResponse(4, { correctGatePassScope: false });
  const summary = evaluateControlledEnterpriseReview(responses);
  assert.equal(summary.eligibleCount, 5);
  assert.equal(summary.passes, 4);
  assert.equal(summary.partials, 1);
  assert.equal(summary.overallPass, true);
  assert.equal(summary.decision, "PROCEED_TO_BOUNDED_PUBLICATION");
});

test("three passes out of five do not satisfy the four-of-five thresholds", () => {
  const responses = ENTERPRISE_REVIEWER_CATEGORIES.map((_, index) => qualifyingResponse(index));
  responses[3] = qualifyingResponse(3, { correctProductExplanation: false });
  responses[4] = qualifyingResponse(4, { correctProductExplanation: false });
  const summary = evaluateControlledEnterpriseReview(responses);
  assert.equal(summary.passes, 3);
  assert.equal(summary.productExplanationCount, 3);
  assert.equal(summary.overallPass, false);
  assert.equal(summary.decision, "REFINE_AND_RETEST");
});

test("a material claims concern blocks publication despite numerical comprehension", () => {
  const responses = ENTERPRISE_REVIEWER_CATEGORIES.map((_, index) => qualifyingResponse(index));
  responses[4] = qualifyingResponse(4, { materialClaimsConcern: true });
  const summary = evaluateControlledEnterpriseReview(responses);
  assert.equal(summary.materialClaimsConcern, true);
  assert.equal(summary.overallPass, false);
  assert.equal(summary.decision, "REFINE_AND_RETEST");
});

test("missing maturity-boundary comprehension blocks a reviewer pass", () => {
  assert.equal(
    classifyEnterpriseReviewerResponse(qualifyingResponse(0, { correctMaturityBoundary: false })),
    "FAIL",
  );
});

test("an unapproved invitation remains unsent", () => {
  assert.deepEqual(createLocalInvitationControl(false), {
    approved: false,
    sent: false,
    contactPerformed: false,
    externalActionOccurred: false,
  });
});

test("the implementation and empty templates perform no contact or external action", () => {
  const responseTemplate = JSON.parse(
    readFileSync(join(root, "examples", "reviewer-response-template.json"), "utf8"),
  ) as Record<string, unknown>;
  const summaryTemplate = JSON.parse(
    readFileSync(join(root, "examples", "reviewer-validation-summary-template.json"), "utf8"),
  ) as Record<string, unknown>;
  assert.equal(responseTemplate.contactPerformed, false);
  assert.equal(responseTemplate.externalActionOccurred, false);
  assert.equal(summaryTemplate.contactPerformed, false);
  assert.equal(summaryTemplate.externalActionOccurred, false);
  assert.equal(summaryTemplate.reviewsOccurred, false);
  assert.match(ENTERPRISE_REVIEWER_PACK_NO_EXTERNAL_ACTION, /no reviewer contact/i);
});
