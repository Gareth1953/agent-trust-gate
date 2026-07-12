export const PUBLIC_REVIEWER_POSITIONING_VERSION =
  "atg.public-reviewer-positioning.local.v1" as const;

export const PUBLIC_REVIEWER_POSITIONING_CONTACT = "gpmiddleton71@gmail.com" as const;
export const PUBLIC_REVIEWER_POSITIONING_FIRST_COMMAND =
  "npm run demo:reviewer-kit" as const;

export const PUBLIC_REVIEWER_POSITIONING_CORE_PHRASES = [
  "GatePass is a scoped, time-bound, action-specific proof primitive for agent actions.",
  "GatePass provides a common, machine-readable format for expressing authority, mandate, scope, freshness, and evidence.",
  "No signed GatePass. No settlement.",
  "Do not trust the agent. Trust the GatePass.",
  "No proof. No permission.",
  "No mandate. No action.",
] as const;

export interface PublicReviewerPositioningSafetyFlags {
  localDemoOnly: true;
  realToolExecution: false;
  actionExecution: false;
  networkCalls: false;
  productionMiddleware: false;
  productionBenchmark: false;
  productionCertification: false;
  securityCertification: false;
  legalComplianceGuarantee: false;
  paymentAuthorisation: false;
  settlementAuthorisation: false;
}

export interface PublicReviewerPositioningSummary extends PublicReviewerPositioningSafetyFlags {
  project: "Agent Trust Gate";
  purpose: string;
  version: typeof PUBLIC_REVIEWER_POSITIONING_VERSION;
  latestReviewerPath: string[];
  recommendedFirstCommand: typeof PUBLIC_REVIEWER_POSITIONING_FIRST_COMMAND;
  secondaryCommands: string[];
  corePositioning: typeof PUBLIC_REVIEWER_POSITIONING_CORE_PHRASES;
  allowedClaims: string[];
  disallowedClaims: string[];
  safetyBoundary: string;
  publicContact: typeof PUBLIC_REVIEWER_POSITIONING_CONTACT;
  agentTrustLanguageRole: "supporting_material_only";
}

export const PUBLIC_REVIEWER_POSITIONING_SAFETY_FLAGS: PublicReviewerPositioningSafetyFlags = {
  localDemoOnly: true,
  realToolExecution: false,
  actionExecution: false,
  networkCalls: false,
  productionMiddleware: false,
  productionBenchmark: false,
  productionCertification: false,
  securityCertification: false,
  legalComplianceGuarantee: false,
  paymentAuthorisation: false,
  settlementAuthorisation: false,
};

export function getPublicReviewerPositioningSummary(): PublicReviewerPositioningSummary {
  return {
    project: "Agent Trust Gate",
    purpose:
      "Public reviewer-first positioning summary for the local-only GatePass proof-of-concept.",
    version: PUBLIC_REVIEWER_POSITIONING_VERSION,
    latestReviewerPath: [
      "Run npm run demo:reviewer-kit.",
      "Inspect the GatePass lifecycle.",
      "Inspect the adversarial scorecard.",
      "Inspect the developer wrapper.",
      "Read the safety boundary.",
      "Use the public contact email only for human-reviewed follow-up.",
    ],
    recommendedFirstCommand: PUBLIC_REVIEWER_POSITIONING_FIRST_COMMAND,
    secondaryCommands: [
      "npm run demo:reviewer-kit -- --summary-only",
      "npm run demo:reviewer-kit -- --json",
      "npm run demo:gatepass-round-trip",
      "npm run demo:gatepass-scorecard",
      "npm run demo:gatepass-wrapper",
    ],
    corePositioning: PUBLIC_REVIEWER_POSITIONING_CORE_PHRASES,
    allowedClaims: [
      "local-first proof-of-concept",
      "scoped proof primitive",
      "local deterministic demos",
      "local mock tool gating",
      "local illustrative timing",
      "developer wrapper example",
      "reviewer kit",
      "GatePass proof vocabulary and GatePass claims vocabulary as supporting material",
    ],
    disallowedClaims: [
      "production ready",
      "production middleware",
      "certified secure",
      "legal/compliance/security guarantee",
      "proven safe",
      "guaranteed trust",
      "real payment readiness",
      "real settlement readiness",
      "real-world benchmark",
      "complete adversarial coverage",
      "automatic paid-pilot acceptance",
      "automatic access after payment",
    ],
    safetyBoundary:
      "Local deterministic positioning summary only. The reviewer kit is the recommended first run. Agent Trust Language remains supporting material. No real tool execution, action execution, network calls, payment authorisation, settlement authorisation, production middleware, production benchmark, production certification, security certification, or legal/compliance/security guarantee is introduced.",
    publicContact: PUBLIC_REVIEWER_POSITIONING_CONTACT,
    agentTrustLanguageRole: "supporting_material_only",
    ...PUBLIC_REVIEWER_POSITIONING_SAFETY_FLAGS,
  };
}

export function summarisePublicReviewerPositioning(
  summary: PublicReviewerPositioningSummary = getPublicReviewerPositioningSummary(),
): Omit<PublicReviewerPositioningSummary, "allowedClaims" | "disallowedClaims"> {
  const {
    allowedClaims: _allowedClaims,
    disallowedClaims: _disallowedClaims,
    ...compact
  } = summary;
  return compact;
}
