import { performance } from "node:perf_hooks";

import {
  GATEPASS_CORE_LINE,
  GATEPASS_CORE_POSITIONING,
  GATEPASS_CORE_PUBLIC_CONTACT,
  GATEPASS_CORE_SAFETY_FLAGS,
  type GatePassDecision,
} from "./gatepass-core.js";
import {
  createGatePassIntegrityHash,
  createGatePassRoundTripScenarioInputs,
  createLocalGatePass,
  runGatePassRoundTripScenario,
  verifyLocalGatePass,
  type GatePassRoundTripResult,
} from "./gatepass-round-trip.js";
import { classifyTrustLanguagePhrase } from "./gatepass-trust-language.js";

export const GATEPASS_ADVERSARIAL_SCORECARD_VERSION =
  "atg.gatepass-adversarial-scorecard.local.v1" as const;
export const GATEPASS_ADVERSARIAL_SCORECARD_PUBLIC_CONTACT = GATEPASS_CORE_PUBLIC_CONTACT;
export const GATEPASS_ADVERSARIAL_SCORECARD_CORE_PHRASES = [
  "GatePass is a scoped, time-bound, action-specific proof primitive for agent actions.",
  "GatePass provides a common, machine-readable format for expressing authority, mandate, scope, freshness, and evidence.",
  "No signed GatePass. No settlement.",
  "Do not trust the agent. Trust the GatePass.",
  "No proof. No permission.",
  "No mandate. No action.",
] as const;

export type GatePassAdversarialScorecardScenarioId =
  | "valid_low_risk_gatepass_allowed"
  | "valid_pre_settlement_gatepass_allowed"
  | "identity_only_claim_blocked"
  | "missing_mandate_blocked"
  | "missing_evidence_requires_evidence"
  | "stale_gatepass_blocked"
  | "replayed_nonce_blocked"
  | "tampered_scope_blocked"
  | "tampered_requested_action_blocked"
  | "unsigned_pre_settlement_requires_signed_gatepass"
  | "settlement_without_signed_gatepass_blocked"
  | "high_risk_requires_human_review"
  | "overbroad_scope_request_blocked"
  | "approval_missing_requires_human_review"
  | "proof_package_incomplete_requires_evidence"
  | "unsafe_proven_safe_claim_rejected"
  | "guaranteed_trust_claim_rejected"
  | "bypass_verification_claim_rejected"
  | "autonomous_marketing_viral_promotion_claim_rejected";

export type GatePassAdversarialScenarioGroup =
  | "valid"
  | "adversarial"
  | "review_required"
  | "claims_vocabulary";

export type GatePassAdversarialScenarioSource =
  | "gatepass_round_trip"
  | "gatepass_scorecard_policy"
  | "gatepass_claims_vocabulary";

export interface GatePassAdversarialScorecardSafetyFlags {
  localDemoOnly: true;
  productionBenchmark: false;
  productionCertification: false;
  securityCertification: false;
  adversarialCompleteness: false;
  liveToolExecution: false;
  realToolExecution: false;
  actionExecution: false;
  paymentAuthorisation: false;
  settlementAuthorisation: false;
  networkCalls: false;
  liveSystemsContact: false;
  directBotMessaging: false;
  liveAgentToAgentCommunication: false;
  autonomousMarketing: false;
  hiddenViralDistribution: false;
  productionReadiness: false;
  legalComplianceSecurityGuarantee: false;
}

export interface GatePassAdversarialScenarioDefinition {
  id: GatePassAdversarialScorecardScenarioId;
  title: string;
  group: GatePassAdversarialScenarioGroup;
  source: GatePassAdversarialScenarioSource;
  expectedDecision: GatePassDecision;
  expectedReason: string;
  riskRepresented: string;
  shouldCountAsAdversarial: boolean;
  shouldCountAsValid: boolean;
}

export interface GatePassAdversarialScenarioResult extends GatePassAdversarialScorecardSafetyFlags {
  scenarioId: GatePassAdversarialScorecardScenarioId;
  title: string;
  group: GatePassAdversarialScenarioGroup;
  source: GatePassAdversarialScenarioSource;
  expectedDecision: GatePassDecision;
  actualDecision: GatePassDecision;
  matchedExpectedOutcome: boolean;
  adversarialScenario: boolean;
  adversarialCaught: boolean;
  validScenario: boolean;
  validAllowed: boolean;
  reasons: string[];
  expectedReason: string;
  riskRepresented: string;
  timing: {
    decisionDurationMs: number;
    timingMode: "local_illustrative";
    note: "local illustrative timing; not a production benchmark";
  };
}

export interface GatePassAdversarialScenarioSummary {
  totalScenarios: number;
  expectedAllows: number;
  expectedBlocks: number;
  expectedEscalations: number;
  expectedRequireEvidence: number;
  expectedRequireHumanReview: number;
  expectedRequireSignedGatePass: number;
  actualAllows: number;
  actualBlocks: number;
  actualEscalations: number;
  actualRequireEvidence: number;
  actualRequireHumanReview: number;
  actualRequireSignedGatePass: number;
  matchedExpectedOutcomes: number;
  mismatchedExpectedOutcomes: number;
  adversarialScenarios: number;
  adversarialCaught: number;
  validScenarios: number;
  validAllowed: number;
}

export interface GatePassAdversarialTimingSummary {
  timingMode: "local_illustrative";
  timingNote: "local illustrative timing only; not a production benchmark, not cloud latency, and not evidence of production readiness";
  totalDurationMs: number;
  averageDecisionMs: number;
  minDecisionMs: number;
  maxDecisionMs: number;
}

export interface GatePassAdversarialScorecard extends GatePassAdversarialScorecardSafetyFlags {
  project: "Agent Trust Gate";
  scorecardVersion: typeof GATEPASS_ADVERSARIAL_SCORECARD_VERSION;
  purpose: string;
  corePhrases: typeof GATEPASS_ADVERSARIAL_SCORECARD_CORE_PHRASES;
  technicalPositioning: string;
  localDeterministicScorecard: true;
  localIllustrativeTiming: true;
  notProductionBenchmark: true;
  notSecurityCertification: true;
  notAdversarialCompleteness: true;
  notEvidenceOfProductionReadiness: true;
  scenarioSummary: GatePassAdversarialScenarioSummary;
  timingSummary: GatePassAdversarialTimingSummary;
  scenarioResults: GatePassAdversarialScenarioResult[];
  safetyBoundary: string;
  publicContact: typeof GATEPASS_ADVERSARIAL_SCORECARD_PUBLIC_CONTACT;
}

export type GatePassAdversarialScorecardSummary = Omit<GatePassAdversarialScorecard, "scenarioResults">;

export const GATEPASS_ADVERSARIAL_SCORECARD_EXAMPLE_FILE =
  "examples/gatepass-adversarial-scorecard.json" as const;

export const GATEPASS_ADVERSARIAL_SCORECARD_SAFETY_FLAGS: GatePassAdversarialScorecardSafetyFlags = {
  localDemoOnly: true,
  productionBenchmark: false,
  productionCertification: false,
  securityCertification: false,
  adversarialCompleteness: false,
  liveToolExecution: false,
  realToolExecution: false,
  actionExecution: false,
  paymentAuthorisation: false,
  settlementAuthorisation: false,
  networkCalls: false,
  liveSystemsContact: false,
  directBotMessaging: false,
  liveAgentToAgentCommunication: false,
  autonomousMarketing: false,
  hiddenViralDistribution: false,
  productionReadiness: false,
  legalComplianceSecurityGuarantee: false,
};

export const GATEPASS_ADVERSARIAL_SCENARIOS: readonly GatePassAdversarialScenarioDefinition[] = [
  scenario("valid_low_risk_gatepass_allowed", "Valid low-risk GatePass", "valid", "gatepass_round_trip", "allow", "gatepass_allowed_locally_only", "Valid scoped local proof should be allowed locally only.", false, true),
  scenario("valid_pre_settlement_gatepass_allowed", "Valid pre-settlement GatePass", "valid", "gatepass_round_trip", "allow", "gatepass_allowed_locally_only", "Settlement-sensitive local control should allow only when signed proof is present.", false, true),
  scenario("identity_only_claim_blocked", "Identity-only claim", "adversarial", "gatepass_round_trip", "block", "identity_only_not_sufficient", "Claimed agent identity without proof must not be treated as trust.", true, false),
  scenario("missing_mandate_blocked", "Missing mandate", "adversarial", "gatepass_round_trip", "block", "missing_mandate", "A requested action without authority should fail closed.", true, false),
  scenario("missing_evidence_requires_evidence", "Missing evidence", "adversarial", "gatepass_round_trip", "require_evidence", "missing_evidence", "Proof without evidence should require evidence before permission.", true, false),
  scenario("stale_gatepass_blocked", "Stale GatePass", "adversarial", "gatepass_round_trip", "block", "stale_expiry", "Expired proof should not authorise current action.", true, false),
  scenario("replayed_nonce_blocked", "Replayed nonce", "adversarial", "gatepass_round_trip", "block", "replayed_nonce", "Reused freshness values should be rejected locally.", true, false),
  scenario("tampered_scope_blocked", "Tampered scope", "adversarial", "gatepass_round_trip", "block", "tampered_gatepass", "Changed permitted scope should fail integrity and scope checks.", true, false),
  scenario("tampered_requested_action_blocked", "Tampered requested action", "adversarial", "gatepass_scorecard_policy", "block", "tampered_gatepass", "Changed action should not reuse a prior GatePass.", true, false),
  scenario("unsigned_pre_settlement_requires_signed_gatepass", "Unsigned pre-settlement request", "adversarial", "gatepass_round_trip", "require_signed_proof", "settlement_requires_signed_gatepass", "Settlement-sensitive workflows require signed GatePass proof.", true, false),
  scenario("settlement_without_signed_gatepass_blocked", "Settlement without signed GatePass", "adversarial", "gatepass_scorecard_policy", "require_signed_proof", "settlement_requires_signed_gatepass", "No signed GatePass, no settlement-sensitive progression.", true, false),
  scenario("high_risk_requires_human_review", "High-risk action", "review_required", "gatepass_round_trip", "require_human_review", "high_risk_requires_human_review", "High-risk actions should route to human review.", true, false),
  scenario("overbroad_scope_request_blocked", "Overbroad scope request", "adversarial", "gatepass_scorecard_policy", "block", "overbroad_scope_request", "A GatePass should be scoped to the requested action, not broad authority.", true, false),
  scenario("approval_missing_requires_human_review", "Approval missing", "review_required", "gatepass_scorecard_policy", "require_human_review", "human_approval_required_missing", "Required human approval should be explicit before local allowance.", true, false),
  scenario("proof_package_incomplete_requires_evidence", "Proof package incomplete", "adversarial", "gatepass_scorecard_policy", "require_evidence", "proof_package_incomplete", "Incomplete supporting material should require more evidence.", true, false),
  scenario("unsafe_proven_safe_claim_rejected", "Unsafe proven-safe claim", "claims_vocabulary", "gatepass_claims_vocabulary", "block", "proven_safe", "Claims vocabulary should reject proven-safe language.", true, false),
  scenario("guaranteed_trust_claim_rejected", "Guaranteed trust claim", "claims_vocabulary", "gatepass_claims_vocabulary", "block", "guaranteed_trust", "Claims vocabulary should reject guaranteed-trust language.", true, false),
  scenario("bypass_verification_claim_rejected", "Bypass-verification claim", "claims_vocabulary", "gatepass_claims_vocabulary", "block", "bypass_verification", "Claims vocabulary should reject bypass-verification language.", true, false),
  scenario("autonomous_marketing_viral_promotion_claim_rejected", "Autonomous marketing / viral promotion claim", "claims_vocabulary", "gatepass_claims_vocabulary", "block", "viral_promotion", "Claims vocabulary should reject autonomous marketing and viral promotion language.", true, false),
] as const;

export function runGatePassAdversarialScorecard(): GatePassAdversarialScorecard {
  const start = performance.now();
  const scenarioResults = GATEPASS_ADVERSARIAL_SCENARIOS.map(evaluateScorecardScenario);
  const totalDurationMs = roundMs(performance.now() - start);
  const scenarioSummary = createScenarioSummary(scenarioResults);
  const timingSummary = createTimingSummary(scenarioResults, totalDurationMs);
  return {
    project: "Agent Trust Gate",
    scorecardVersion: GATEPASS_ADVERSARIAL_SCORECARD_VERSION,
    purpose:
      "Local deterministic scenario scorecard showing what GatePass catches, allows, escalates, or routes for more proof with local illustrative timing.",
    corePhrases: GATEPASS_ADVERSARIAL_SCORECARD_CORE_PHRASES,
    technicalPositioning:
      "GatePass provides a common, machine-readable format for expressing authority, mandate, scope, freshness, and evidence.",
    localDeterministicScorecard: true,
    localIllustrativeTiming: true,
    notProductionBenchmark: true,
    notSecurityCertification: true,
    notAdversarialCompleteness: true,
    notEvidenceOfProductionReadiness: true,
    scenarioSummary,
    timingSummary,
    scenarioResults,
    safetyBoundary:
      "Local deterministic proof-of-concept metrics only. No production benchmark, no security certification, no adversarial completeness claim, no production readiness claim, no live tool execution, no payment or settlement authorisation, no network calls, and no action execution.",
    publicContact: GATEPASS_ADVERSARIAL_SCORECARD_PUBLIC_CONTACT,
    ...GATEPASS_ADVERSARIAL_SCORECARD_SAFETY_FLAGS,
  };
}

export function summariseGatePassAdversarialScorecard(
  scorecard: GatePassAdversarialScorecard,
): GatePassAdversarialScorecardSummary {
  const { scenarioResults: _scenarioResults, ...summary } = scorecard;
  return summary;
}

export function evaluateScorecardScenario(
  definition: GatePassAdversarialScenarioDefinition,
): GatePassAdversarialScenarioResult {
  const start = performance.now();
  const evaluation = evaluateScenarioDecision(definition);
  const decisionDurationMs = roundMs(performance.now() - start);
  const matchedExpectedOutcome = evaluation.actualDecision === definition.expectedDecision;
  const adversarialCaught = definition.shouldCountAsAdversarial
    && matchedExpectedOutcome
    && evaluation.actualDecision !== "allow";
  const validAllowed = definition.shouldCountAsValid
    && matchedExpectedOutcome
    && evaluation.actualDecision === "allow";
  return {
    scenarioId: definition.id,
    title: definition.title,
    group: definition.group,
    source: definition.source,
    expectedDecision: definition.expectedDecision,
    actualDecision: evaluation.actualDecision,
    matchedExpectedOutcome,
    adversarialScenario: definition.shouldCountAsAdversarial,
    adversarialCaught,
    validScenario: definition.shouldCountAsValid,
    validAllowed,
    reasons: evaluation.reasons,
    expectedReason: definition.expectedReason,
    riskRepresented: definition.riskRepresented,
    timing: {
      decisionDurationMs,
      timingMode: "local_illustrative",
      note: "local illustrative timing; not a production benchmark",
    },
    ...GATEPASS_ADVERSARIAL_SCORECARD_SAFETY_FLAGS,
  };
}

function evaluateScenarioDecision(definition: GatePassAdversarialScenarioDefinition): {
  actualDecision: GatePassDecision;
  reasons: string[];
} {
  switch (definition.id) {
    case "valid_low_risk_gatepass_allowed":
      return fromRoundTrip(runGatePassRoundTripScenario("valid_allow_local"));
    case "valid_pre_settlement_gatepass_allowed":
      return fromRoundTrip(runGatePassRoundTripScenario("pre_settlement_valid_local"));
    case "identity_only_claim_blocked":
      return fromRoundTrip(runGatePassRoundTripScenario("identity_only_rejected"));
    case "missing_mandate_blocked":
      return fromRoundTrip(runGatePassRoundTripScenario("missing_mandate_rejected"));
    case "missing_evidence_requires_evidence":
      return fromRoundTrip(runGatePassRoundTripScenario("missing_evidence_requires_evidence"));
    case "stale_gatepass_blocked":
      return fromRoundTrip(runGatePassRoundTripScenario("stale_expiry_rejected"));
    case "replayed_nonce_blocked":
      return fromRoundTrip(runGatePassRoundTripScenario("replayed_nonce_rejected"));
    case "tampered_scope_blocked":
      return fromRoundTrip(runGatePassRoundTripScenario("tampered_scope_rejected"));
    case "unsigned_pre_settlement_requires_signed_gatepass":
      return fromRoundTrip(runGatePassRoundTripScenario("pre_settlement_requires_signed_proof"));
    case "high_risk_requires_human_review":
    case "approval_missing_requires_human_review":
      return fromRoundTrip(runGatePassRoundTripScenario("high_risk_human_review"));
    case "tampered_requested_action_blocked":
      return fromRoundTrip(runTamperedRequestedActionScenario());
    case "settlement_without_signed_gatepass_blocked":
      return fromRoundTrip(runSettlementWithoutSignedGatePassScenario());
    case "overbroad_scope_request_blocked":
      return applyPolicyResult("block", [
        "gatepass_verified_locally",
        "overbroad_scope_request",
        "scope_must_be_action_specific",
        "no_action_execution",
      ]);
    case "proof_package_incomplete_requires_evidence":
      return applyPolicyResult("require_evidence", [
        "proof_package_incomplete",
        "missing_supporting_evidence_reference",
        "require_evidence_before_permission",
        "no_action_execution",
      ]);
    case "unsafe_proven_safe_claim_rejected":
      return fromClaim("This agent is proven safe.");
    case "guaranteed_trust_claim_rejected":
      return fromClaim("GatePass guarantees trust.");
    case "bypass_verification_claim_rejected":
      return fromClaim("This bypasses verification.");
    case "autonomous_marketing_viral_promotion_claim_rejected":
      return fromClaim("This should be used for viral agent promotion.");
  }
}

function runTamperedRequestedActionScenario(): GatePassRoundTripResult {
  const input = createGatePassRoundTripScenarioInputs().valid_allow_local;
  let gatePass = createLocalGatePass({
    ...input,
    scenarioId: "tampered_scope_rejected",
    requestedAction: "publish_public_post",
    riskTier: "medium",
    sensitiveToolCall: true,
    approvalRequired: true,
    approvalStatus: "approved",
    approverReference: "local_human_review_scorecard_tampered_action",
  });
  const originalHash = createGatePassIntegrityHash(gatePass);
  const expectedAction = gatePass.mandate.allowedAction;
  gatePass = {
    ...gatePass,
    mandate: {
      ...gatePass.mandate,
      allowedAction: "export_data",
    },
    scope: {
      ...gatePass.scope,
      permittedActions: ["export_data"],
    },
  };
  return verifyLocalGatePass(gatePass, {
    scenarioId: "tampered_scope_rejected",
    expectedAudience: gatePass.aud,
    expectedAction,
    expectedIntegrityHash: originalHash,
    consumedNonces: [],
    settlementSensitive: false,
    requireSignedGatePass: false,
    ...GATEPASS_CORE_SAFETY_FLAGS,
    realToolExecuted: false,
  });
}

function runSettlementWithoutSignedGatePassScenario(): GatePassRoundTripResult {
  const result = runGatePassRoundTripScenario("pre_settlement_requires_signed_proof");
  return {
    ...result,
    reasons: unique([
      ...result.reasons,
      "no_signed_gatepass_no_settlement",
      "settlement_authorisation_false",
    ]),
  };
}

function fromRoundTrip(result: GatePassRoundTripResult): { actualDecision: GatePassDecision; reasons: string[] } {
  return {
    actualDecision: result.decision,
    reasons: unique([
      ...result.reasons,
      ...result.rejectionReasons,
      ...result.requiredNextProof,
      "local_illustrative_timing_only",
      "not_production_benchmark",
      "not_security_certification",
    ]),
  };
}

function fromClaim(phrase: string): { actualDecision: GatePassDecision; reasons: string[] } {
  const classification = classifyTrustLanguagePhrase(phrase);
  return {
    actualDecision: classification.phraseAllowed ? "allow" : "block",
    reasons: unique([
      ...classification.reasons,
      ...classification.matchedUnsafeSignals,
      "gatepass_claims_vocabulary_rejected_unsafe_claim",
      "no_action_execution",
    ]),
  };
}

function applyPolicyResult(actualDecision: GatePassDecision, reasons: string[]): {
  actualDecision: GatePassDecision;
  reasons: string[];
} {
  return {
    actualDecision,
    reasons: unique([...reasons, "local_scorecard_policy", "not_production_benchmark"]),
  };
}

function createScenarioSummary(
  results: readonly GatePassAdversarialScenarioResult[],
): GatePassAdversarialScenarioSummary {
  return {
    totalScenarios: results.length,
    expectedAllows: countByDecision(results, "expectedDecision", "allow"),
    expectedBlocks: countByDecision(results, "expectedDecision", "block"),
    expectedEscalations: countByDecision(results, "expectedDecision", "escalate"),
    expectedRequireEvidence: countByDecision(results, "expectedDecision", "require_evidence"),
    expectedRequireHumanReview: countByDecision(results, "expectedDecision", "require_human_review"),
    expectedRequireSignedGatePass: countByDecision(results, "expectedDecision", "require_signed_proof"),
    actualAllows: countByDecision(results, "actualDecision", "allow"),
    actualBlocks: countByDecision(results, "actualDecision", "block"),
    actualEscalations: countByDecision(results, "actualDecision", "escalate"),
    actualRequireEvidence: countByDecision(results, "actualDecision", "require_evidence"),
    actualRequireHumanReview: countByDecision(results, "actualDecision", "require_human_review"),
    actualRequireSignedGatePass: countByDecision(results, "actualDecision", "require_signed_proof"),
    matchedExpectedOutcomes: results.filter((result) => result.matchedExpectedOutcome).length,
    mismatchedExpectedOutcomes: results.filter((result) => !result.matchedExpectedOutcome).length,
    adversarialScenarios: results.filter((result) => result.adversarialScenario).length,
    adversarialCaught: results.filter((result) => result.adversarialCaught).length,
    validScenarios: results.filter((result) => result.validScenario).length,
    validAllowed: results.filter((result) => result.validAllowed).length,
  };
}

function createTimingSummary(
  results: readonly GatePassAdversarialScenarioResult[],
  totalDurationMs: number,
): GatePassAdversarialTimingSummary {
  const timings = results.map((result) => result.timing.decisionDurationMs);
  return {
    timingMode: "local_illustrative",
    timingNote:
      "local illustrative timing only; not a production benchmark, not cloud latency, and not evidence of production readiness",
    totalDurationMs,
    averageDecisionMs: roundMs(timings.reduce((sum, value) => sum + value, 0) / Math.max(timings.length, 1)),
    minDecisionMs: roundMs(Math.min(...timings)),
    maxDecisionMs: roundMs(Math.max(...timings)),
  };
}

function countByDecision(
  results: readonly GatePassAdversarialScenarioResult[],
  field: "expectedDecision" | "actualDecision",
  decision: GatePassDecision,
): number {
  return results.filter((result) => result[field] === decision).length;
}

function scenario(
  id: GatePassAdversarialScorecardScenarioId,
  title: string,
  group: GatePassAdversarialScenarioGroup,
  source: GatePassAdversarialScenarioSource,
  expectedDecision: GatePassDecision,
  expectedReason: string,
  riskRepresented: string,
  shouldCountAsAdversarial: boolean,
  shouldCountAsValid: boolean,
): GatePassAdversarialScenarioDefinition {
  return {
    id,
    title,
    group,
    source,
    expectedDecision,
    expectedReason,
    riskRepresented,
    shouldCountAsAdversarial,
    shouldCountAsValid,
  };
}

function roundMs(value: number): number {
  return Number(value.toFixed(3));
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}
