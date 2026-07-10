import {
  createGateArtifacts,
  createReferenceIntegrationResult,
  createReferenceRequest,
  type ReferenceIntegrationResult,
} from "./shared.js";

export function runGovernanceReviewerFlowReference(): ReferenceIntegrationResult {
  const input = createReferenceRequest("governance_reviewer_flow", {
    requestedAction: "Prepare a local customer-impacting governance decision for review.",
    actionCategory: "customer_impacting_external_communication",
    approvalRequired: true,
    approvalStatus: "pending",
  });
  const { receipt } = createGateArtifacts(input);

  return createReferenceIntegrationResult({
    patternId: "governance_reviewer_flow",
    patternTitle: "Governance reviewer and audit receipt review flow",
    frameworkShape: "governance reviewer queue",
    trustGatePlacement: "Before a reviewer sees the proposed action as an auditable receipt.",
    sensitiveAction: "customer_impacting_governance_decision",
    result: "escalate",
    input,
    reasonCodes: ["governance_review_receipt_created", ...receipt.reason_codes],
    evidenceTrail: [
      "audit_receipt_created_locally",
      `receipt_type:${receipt.receipt_type}`,
      "governance_review_summary_recorded",
    ],
    reviewerSummary: {
      reviewQueue: "local_governance_review",
      reviewStatus: "queued_for_human_review",
      auditableReceipt: true,
    },
  });
}
