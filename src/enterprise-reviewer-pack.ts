export const ENTERPRISE_REVIEWER_CATEGORIES = [
  "CISO_AI_SECURITY_CYBERSECURITY",
  "FINANCE_CONTROLS_AP_PROCUREMENT_TRANSFORMATION",
  "IAM_IGA_PAM_ENTERPRISE_ARCHITECTURE",
  "AI_GOVERNANCE_OPERATIONAL_RISK_RESPONSIBLE_AI",
  "ENTERPRISE_DEVELOPER_SYSTEMS_INTEGRATOR_AGENT_PLATFORM",
] as const;

export type EnterpriseReviewerCategory = (typeof ENTERPRISE_REVIEWER_CATEGORIES)[number];
export type ReviewerResponseSource =
  | "HUMAN"
  | "AI_AGENT"
  | "AUTOMATED_ACKNOWLEDGEMENT"
  | "ADMINISTRATIVE_SUPPORT_TICKET";
export type ReviewerResult = "PASS" | "PARTIAL" | "FAIL" | "INELIGIBLE";
export type ControlledReviewDecision =
  | "PROCEED_TO_BOUNDED_PUBLICATION"
  | "REFINE_AND_RETEST"
  | "PAUSE"
  | "SHELVE";

export interface EnterpriseReviewerResponse {
  reviewerId: string;
  reviewerCategory: EnterpriseReviewerCategory;
  source: ReviewerResponseSource;
  professionalRelevanceConfirmed: boolean;
  reviewCompleted: boolean;
  correctProductExplanation: boolean;
  correctDoesNotDoExplanation: boolean;
  correctMaturityBoundary: boolean;
  correctGatePassScope: boolean;
  correctAuthorityEvidenceVersusBankDetailCorrectness: boolean;
  correctLegalAuthorityBoundary: boolean;
  correctDecisionVersusExecution: boolean;
  buyerAndCommercialNextStepIdentified: boolean;
  existingControlsAssessed: boolean;
  plausibleControlGapBuyerProblemOrPaidRoute: boolean;
  materialClaimsConcern: boolean;
}

export interface ScoredReviewerResponse {
  reviewerId: string;
  reviewerCategory: EnterpriseReviewerCategory;
  eligible: boolean;
  duplicateReviewer: boolean;
  duplicateCategory: boolean;
  result: ReviewerResult;
}

export interface ControlledReviewSummary {
  scoredResponses: ScoredReviewerResponse[];
  eligibleCount: number;
  passes: number;
  partials: number;
  failures: number;
  ineligible: number;
  productExplanationCount: number;
  boundaryExplanationCount: number;
  buyerAndNextStepCount: number;
  plausibleCommercialSignalCount: number;
  materialClaimsConcern: boolean;
  fivePerspectivesComplete: boolean;
  overallPass: boolean;
  decision: ControlledReviewDecision;
  contactPerformed: false;
  externalActionOccurred: false;
}

export interface LocalInvitationControl {
  approved: boolean;
  sent: false;
  contactPerformed: false;
  externalActionOccurred: false;
}

export const CONTROLLED_REVIEW_REQUIRED_ELIGIBLE_COUNT = 5;
export const CONTROLLED_REVIEW_COMPREHENSION_THRESHOLD = 4;
export const CONTROLLED_REVIEW_COMMERCIAL_SIGNAL_THRESHOLD = 3;
export const ENTERPRISE_REVIEWER_PACK_NO_EXTERNAL_ACTION =
  "Local reviewer-validation preparation only; no reviewer contact, message, form, network request or external action occurs.";

function baseEligibility(response: EnterpriseReviewerResponse): boolean {
  return response.source === "HUMAN"
    && response.professionalRelevanceConfirmed
    && response.reviewCompleted
    && response.reviewerId.trim().length > 0;
}

function boundariesCorrect(response: EnterpriseReviewerResponse): boolean {
  return response.correctDoesNotDoExplanation
    && response.correctMaturityBoundary
    && response.correctAuthorityEvidenceVersusBankDetailCorrectness
    && response.correctLegalAuthorityBoundary;
}

export function classifyEnterpriseReviewerResponse(
  response: EnterpriseReviewerResponse,
  duplicateReviewer = false,
  duplicateCategory = false,
): ReviewerResult {
  if (!baseEligibility(response) || duplicateReviewer || duplicateCategory) return "INELIGIBLE";

  if (
    response.materialClaimsConcern
    || !response.correctProductExplanation
    || !boundariesCorrect(response)
  ) {
    return "FAIL";
  }

  if (
    response.correctGatePassScope
    && response.correctDecisionVersusExecution
    && response.buyerAndCommercialNextStepIdentified
    && response.existingControlsAssessed
  ) {
    return "PASS";
  }

  return "PARTIAL";
}

export function evaluateControlledEnterpriseReview(
  responses: readonly EnterpriseReviewerResponse[],
): ControlledReviewSummary {
  const seenReviewers = new Set<string>();
  const seenCategories = new Set<EnterpriseReviewerCategory>();

  const scoredResponses = responses.map((response): ScoredReviewerResponse => {
    const normalisedReviewerId = response.reviewerId.trim().toLocaleLowerCase("en-GB");
    const duplicateReviewer = normalisedReviewerId.length > 0 && seenReviewers.has(normalisedReviewerId);
    const duplicateCategory = seenCategories.has(response.reviewerCategory);
    const result = classifyEnterpriseReviewerResponse(
      response,
      duplicateReviewer,
      duplicateCategory,
    );
    const eligible = result !== "INELIGIBLE";

    if (normalisedReviewerId.length > 0) seenReviewers.add(normalisedReviewerId);
    if (!duplicateReviewer && !duplicateCategory && baseEligibility(response)) {
      seenCategories.add(response.reviewerCategory);
    }

    return {
      reviewerId: response.reviewerId,
      reviewerCategory: response.reviewerCategory,
      eligible,
      duplicateReviewer,
      duplicateCategory,
      result,
    };
  });

  const eligibleResponses = responses.filter((response, index) => scoredResponses[index]?.eligible);
  const count = (predicate: (response: EnterpriseReviewerResponse) => boolean): number =>
    eligibleResponses.filter(predicate).length;
  const eligibleCount = eligibleResponses.length;
  const passes = scoredResponses.filter(({ result }) => result === "PASS").length;
  const partials = scoredResponses.filter(({ result }) => result === "PARTIAL").length;
  const failures = scoredResponses.filter(({ result }) => result === "FAIL").length;
  const ineligible = scoredResponses.filter(({ result }) => result === "INELIGIBLE").length;
  const productExplanationCount = count(({ correctProductExplanation }) => correctProductExplanation);
  const boundaryExplanationCount = count(boundariesCorrect);
  const buyerAndNextStepCount = count(
    ({ buyerAndCommercialNextStepIdentified }) => buyerAndCommercialNextStepIdentified,
  );
  const plausibleCommercialSignalCount = count(
    ({ plausibleControlGapBuyerProblemOrPaidRoute }) => plausibleControlGapBuyerProblemOrPaidRoute,
  );
  const materialClaimsConcern = responses.some(({ materialClaimsConcern: concern }) => concern);
  const fivePerspectivesComplete = eligibleCount === CONTROLLED_REVIEW_REQUIRED_ELIGIBLE_COUNT
    && seenCategories.size === ENTERPRISE_REVIEWER_CATEGORIES.length;
  const overallPass = fivePerspectivesComplete
    && productExplanationCount >= CONTROLLED_REVIEW_COMPREHENSION_THRESHOLD
    && boundaryExplanationCount >= CONTROLLED_REVIEW_COMPREHENSION_THRESHOLD
    && buyerAndNextStepCount >= CONTROLLED_REVIEW_COMPREHENSION_THRESHOLD
    && plausibleCommercialSignalCount >= CONTROLLED_REVIEW_COMMERCIAL_SIGNAL_THRESHOLD
    && !materialClaimsConcern;

  const decision: ControlledReviewDecision = overallPass
    ? "PROCEED_TO_BOUNDED_PUBLICATION"
    : materialClaimsConcern || fivePerspectivesComplete
      ? "REFINE_AND_RETEST"
      : "PAUSE";

  return {
    scoredResponses,
    eligibleCount,
    passes,
    partials,
    failures,
    ineligible,
    productExplanationCount,
    boundaryExplanationCount,
    buyerAndNextStepCount,
    plausibleCommercialSignalCount,
    materialClaimsConcern,
    fivePerspectivesComplete,
    overallPass,
    decision,
    contactPerformed: false,
    externalActionOccurred: false,
  };
}

export function createLocalInvitationControl(approved: boolean): LocalInvitationControl {
  return {
    approved,
    sent: false,
    contactPerformed: false,
    externalActionOccurred: false,
  };
}
