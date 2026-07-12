import {
  GATEPASS_CORE_PUBLIC_CONTACT,
  type GatePassDecision,
} from "./gatepass-core.js";
import {
  runGatePassAdversarialScorecard,
  summariseGatePassAdversarialScorecard,
  type GatePassAdversarialScorecard,
  type GatePassAdversarialScorecardSummary,
} from "./gatepass-adversarial-scorecard.js";
import {
  runGatePassRoundTripDemo,
  summariseGatePassRoundTripDemo,
  type GatePassRoundTripDemoPack,
  type GatePassRoundTripDemoSummary,
} from "./gatepass-round-trip.js";
import {
  runGatePassToolWrapperDemo,
  summariseGatePassToolWrapperDemo,
  type GatePassToolWrapperDemo,
  type GatePassToolWrapperDemoSummary,
} from "./gatepass-tool-wrapper.js";
import {
  runLocalAgentFrameworkIntegrationExample,
  summariseLocalAgentFrameworkIntegration,
  type LocalAgentFrameworkIntegrationDemo,
  type LocalAgentFrameworkIntegrationSummary,
} from "./local-agent-framework-integration.js";

export const GATEPASS_REVIEWER_KIT_VERSION = "atg.gatepass-reviewer-kit.local.v1" as const;
export const GATEPASS_REVIEWER_KIT_PUBLIC_CONTACT = GATEPASS_CORE_PUBLIC_CONTACT;
export const GATEPASS_REVIEWER_KIT_EXAMPLE_FILE =
  "examples/gatepass-reviewer-kit-report.json" as const;
export const GATEPASS_REVIEWER_KIT_ONE_COMMAND = "npm run demo:reviewer-kit" as const;
export const GATEPASS_REVIEWER_KIT_CORE_PHRASES = [
  "GatePass is a scoped, time-bound, action-specific proof primitive for agent actions.",
  "GatePass provides a common, machine-readable format for expressing authority, mandate, scope, freshness, and evidence.",
  "No signed GatePass. No settlement.",
  "Do not trust the agent. Trust the GatePass.",
  "No proof. No permission.",
  "No mandate. No action.",
] as const;

export interface GatePassReviewerKitSafetyFlags {
  localDemoOnly: true;
  mockToolExecutionOnly: true;
  realToolExecution: false;
  actionExecution: false;
  networkCalls: false;
  paymentAuthorisation: false;
  settlementAuthorisation: false;
  productionBenchmark: false;
  productionMiddleware: false;
  productionCertification: false;
  securityCertification: false;
  legalComplianceGuarantee: false;
  liveAgentToAgentCommunication: false;
  liveSystemsContact: false;
  directBotMessaging: false;
  autonomousMarketing: false;
  hiddenViralDistribution: false;
}

export interface GatePassReviewerLifecycleSummary {
  demo: "GatePass create / verify / reject round trip";
  source: "gatepass_round_trip";
  scenarioCount: number;
  decisions: Record<GatePassDecision, number>;
  allowExamples: string[];
  rejectExamples: string[];
  requiresEvidenceExamples: string[];
  requiresHumanReviewExamples: string[];
  requiresSignedGatePassExamples: string[];
}

export interface GatePassReviewerScorecardSummary {
  demo: "GatePass adversarial metrics and latency scorecard";
  source: "gatepass_adversarial_scorecard";
  totalScenarios: number;
  matchedExpectedOutcomes: number;
  mismatchedExpectedOutcomes: number;
  adversarialScenarios: number;
  adversarialCaught: number;
  validScenarios: number;
  validAllowed: number;
  timingMode: "local_illustrative";
  timingSummary: {
    totalDurationMs: number;
    averageDecisionMs: number;
    minDecisionMs: number;
    maxDecisionMs: number;
    note: string;
  };
}

export interface GatePassReviewerWrapperSummary {
  demo: "GatePass developer wrapper and local integration example";
  source: "gatepass_tool_wrapper";
  wrapperPattern: "wrapGatePassTool(mockTool, policy).call({ input, gatePass, proofPackage })";
  wrapperScenarioCount: number;
  localFrameworkStepCount: number;
  allowedLocalMockExamples: string[];
  blockedExamples: string[];
  requiresEvidenceExamples: string[];
  requiresHumanReviewExamples: string[];
  requiresSignedGatePassExamples: string[];
  mockToolExecutionOnly: true;
  realToolExecution: false;
}

export interface GatePassReviewerDecisionHighlights {
  allowsLocally: string[];
  blocks: string[];
  requiresEvidence: string[];
  requiresHumanReview: string[];
  requiresSignedGatePass: string[];
  safetyNotes: string[];
}

export interface GatePassReviewerKitReport extends GatePassReviewerKitSafetyFlags {
  project: "Agent Trust Gate";
  purpose: string;
  kitVersion: typeof GATEPASS_REVIEWER_KIT_VERSION;
  oneCommand: typeof GATEPASS_REVIEWER_KIT_ONE_COMMAND;
  corePhrases: typeof GATEPASS_REVIEWER_KIT_CORE_PHRASES;
  includedDemos: readonly [
    "GatePass round trip",
    "GatePass adversarial scorecard",
    "GatePass developer wrapper",
    "Local framework-style integration example",
  ];
  lifecycleSummary: GatePassReviewerLifecycleSummary;
  scorecardSummary: GatePassReviewerScorecardSummary;
  wrapperSummary: GatePassReviewerWrapperSummary;
  decisionHighlights: GatePassReviewerDecisionHighlights;
  timingHighlights: string[];
  reviewerNextSteps: string[];
  safetyBoundary: string;
  publicContact: typeof GATEPASS_REVIEWER_KIT_PUBLIC_CONTACT;
  components: {
    roundTrip: GatePassRoundTripDemoPack | GatePassRoundTripDemoSummary;
    scorecard: GatePassAdversarialScorecard | GatePassAdversarialScorecardSummary;
    wrapper: GatePassToolWrapperDemo | GatePassToolWrapperDemoSummary;
    localFrameworkIntegration: LocalAgentFrameworkIntegrationDemo | LocalAgentFrameworkIntegrationSummary;
  };
}

export type GatePassReviewerKitSummary = Omit<GatePassReviewerKitReport, "components">;

export const GATEPASS_REVIEWER_KIT_SAFETY_FLAGS: GatePassReviewerKitSafetyFlags = {
  localDemoOnly: true,
  mockToolExecutionOnly: true,
  realToolExecution: false,
  actionExecution: false,
  networkCalls: false,
  paymentAuthorisation: false,
  settlementAuthorisation: false,
  productionBenchmark: false,
  productionMiddleware: false,
  productionCertification: false,
  securityCertification: false,
  legalComplianceGuarantee: false,
  liveAgentToAgentCommunication: false,
  liveSystemsContact: false,
  directBotMessaging: false,
  autonomousMarketing: false,
  hiddenViralDistribution: false,
};

export function runGatePassReviewerKit(): GatePassReviewerKitReport {
  const roundTrip = runGatePassRoundTripDemo();
  const scorecard = runGatePassAdversarialScorecard();
  const wrapper = runGatePassToolWrapperDemo();
  const localFrameworkIntegration = runLocalAgentFrameworkIntegrationExample();
  return buildReviewerKitJsonReport({
    roundTrip,
    scorecard,
    wrapper,
    localFrameworkIntegration,
  });
}

export function buildReviewerKitJsonReport(components: {
  roundTrip: GatePassRoundTripDemoPack;
  scorecard: GatePassAdversarialScorecard;
  wrapper: GatePassToolWrapperDemo;
  localFrameworkIntegration: LocalAgentFrameworkIntegrationDemo;
}): GatePassReviewerKitReport {
  const lifecycleSummary = buildLifecycleSummary(components.roundTrip);
  const scorecardSummary = buildScorecardSummary(components.scorecard);
  const wrapperSummary = buildWrapperSummary(components.wrapper, components.localFrameworkIntegration);
  return {
    project: "Agent Trust Gate",
    purpose:
      "One-command local reviewer kit that runs GatePass round-trip, adversarial scorecard, developer wrapper, and local integration summaries without live execution.",
    kitVersion: GATEPASS_REVIEWER_KIT_VERSION,
    oneCommand: GATEPASS_REVIEWER_KIT_ONE_COMMAND,
    corePhrases: GATEPASS_REVIEWER_KIT_CORE_PHRASES,
    includedDemos: [
      "GatePass round trip",
      "GatePass adversarial scorecard",
      "GatePass developer wrapper",
      "Local framework-style integration example",
    ],
    lifecycleSummary,
    scorecardSummary,
    wrapperSummary,
    decisionHighlights: buildDecisionHighlights(lifecycleSummary, scorecardSummary, wrapperSummary),
    timingHighlights: [
      `scorecard_total_duration_ms=${scorecardSummary.timingSummary.totalDurationMs}`,
      `scorecard_average_decision_ms=${scorecardSummary.timingSummary.averageDecisionMs}`,
      "timing_is_local_illustrative_only",
      "not_a_production_benchmark",
    ],
    reviewerNextSteps: [
      "Inspect GatePass round-trip scenarios for create, verify, reject, and explanation behavior.",
      "Inspect scorecard expected-vs-actual outcomes and local illustrative timing.",
      "Inspect wrapGatePassTool to see local mock tool gating in a few lines.",
      "Ask next for deeper real-framework local adapter or package ergonomics while preserving no live execution.",
    ],
    safetyBoundary: getReviewerKitSafetyBoundary(),
    publicContact: GATEPASS_REVIEWER_KIT_PUBLIC_CONTACT,
    components,
    ...GATEPASS_REVIEWER_KIT_SAFETY_FLAGS,
  };
}

export function buildReviewerKitSummary(report: GatePassReviewerKitReport): GatePassReviewerKitSummary {
  const { components: _components, ...summary } = report;
  return summary;
}

export function getReviewerKitSafetyBoundary(): string {
  return "Local deterministic reviewer kit only. It runs local GatePass lifecycle, scorecard, wrapper, and framework-style summaries; mockToolExecutionOnly is true, while realToolExecution, actionExecution, networkCalls, productionMiddleware, productionBenchmark, productionCertification, securityCertification, paymentAuthorisation, and settlementAuthorisation remain false.";
}

function buildLifecycleSummary(roundTrip: GatePassRoundTripDemoPack): GatePassReviewerLifecycleSummary {
  const scenarios = Object.values(roundTrip.scenarios);
  return {
    demo: "GatePass create / verify / reject round trip",
    source: "gatepass_round_trip",
    scenarioCount: roundTrip.scenarioCount,
    decisions: roundTrip.decisions,
    allowExamples: scenarios.filter((scenario) => scenario.decision === "allow").map((scenario) => scenario.scenarioId),
    rejectExamples: scenarios.filter((scenario) => scenario.decision === "block").map((scenario) => scenario.scenarioId),
    requiresEvidenceExamples: scenarios
      .filter((scenario) => scenario.decision === "require_evidence")
      .map((scenario) => scenario.scenarioId),
    requiresHumanReviewExamples: scenarios
      .filter((scenario) => scenario.decision === "require_human_review")
      .map((scenario) => scenario.scenarioId),
    requiresSignedGatePassExamples: scenarios
      .filter((scenario) => scenario.decision === "require_signed_proof")
      .map((scenario) => scenario.scenarioId),
  };
}

function buildScorecardSummary(scorecard: GatePassAdversarialScorecard): GatePassReviewerScorecardSummary {
  return {
    demo: "GatePass adversarial metrics and latency scorecard",
    source: "gatepass_adversarial_scorecard",
    totalScenarios: scorecard.scenarioSummary.totalScenarios,
    matchedExpectedOutcomes: scorecard.scenarioSummary.matchedExpectedOutcomes,
    mismatchedExpectedOutcomes: scorecard.scenarioSummary.mismatchedExpectedOutcomes,
    adversarialScenarios: scorecard.scenarioSummary.adversarialScenarios,
    adversarialCaught: scorecard.scenarioSummary.adversarialCaught,
    validScenarios: scorecard.scenarioSummary.validScenarios,
    validAllowed: scorecard.scenarioSummary.validAllowed,
    timingMode: "local_illustrative",
    timingSummary: {
      totalDurationMs: scorecard.timingSummary.totalDurationMs,
      averageDecisionMs: scorecard.timingSummary.averageDecisionMs,
      minDecisionMs: scorecard.timingSummary.minDecisionMs,
      maxDecisionMs: scorecard.timingSummary.maxDecisionMs,
      note: scorecard.timingSummary.timingNote,
    },
  };
}

function buildWrapperSummary(
  wrapper: GatePassToolWrapperDemo,
  localFrameworkIntegration: LocalAgentFrameworkIntegrationDemo,
): GatePassReviewerWrapperSummary {
  return {
    demo: "GatePass developer wrapper and local integration example",
    source: "gatepass_tool_wrapper",
    wrapperPattern: "wrapGatePassTool(mockTool, policy).call({ input, gatePass, proofPackage })",
    wrapperScenarioCount: wrapper.scenarioCount,
    localFrameworkStepCount: localFrameworkIntegration.stepCount,
    allowedLocalMockExamples: wrapper.scenarios
      .filter((scenario) => scenario.outcome === "allow")
      .map((scenario) => scenario.scenarioId),
    blockedExamples: wrapper.scenarios
      .filter((scenario) => scenario.outcome === "block")
      .map((scenario) => scenario.scenarioId),
    requiresEvidenceExamples: wrapper.scenarios
      .filter((scenario) => scenario.outcome === "require_evidence")
      .map((scenario) => scenario.scenarioId),
    requiresHumanReviewExamples: wrapper.scenarios
      .filter((scenario) => scenario.outcome === "require_human_review")
      .map((scenario) => scenario.scenarioId),
    requiresSignedGatePassExamples: wrapper.scenarios
      .filter((scenario) => scenario.outcome === "require_signed_proof")
      .map((scenario) => scenario.scenarioId),
    mockToolExecutionOnly: true,
    realToolExecution: false,
  };
}

function buildDecisionHighlights(
  lifecycleSummary: GatePassReviewerLifecycleSummary,
  scorecardSummary: GatePassReviewerScorecardSummary,
  wrapperSummary: GatePassReviewerWrapperSummary,
): GatePassReviewerDecisionHighlights {
  return {
    allowsLocally: [
      ...lifecycleSummary.allowExamples,
      ...wrapperSummary.allowedLocalMockExamples,
      `${scorecardSummary.validAllowed}/${scorecardSummary.validScenarios}_valid_scorecard_scenarios_allowed_locally`,
    ],
    blocks: [
      ...lifecycleSummary.rejectExamples,
      ...wrapperSummary.blockedExamples,
      `${scorecardSummary.adversarialCaught}/${scorecardSummary.adversarialScenarios}_adversarial_scorecard_scenarios_caught`,
    ],
    requiresEvidence: [...lifecycleSummary.requiresEvidenceExamples, ...wrapperSummary.requiresEvidenceExamples],
    requiresHumanReview: [...lifecycleSummary.requiresHumanReviewExamples, ...wrapperSummary.requiresHumanReviewExamples],
    requiresSignedGatePass: [
      ...lifecycleSummary.requiresSignedGatePassExamples,
      ...wrapperSummary.requiresSignedGatePassExamples,
    ],
    safetyNotes: [
      "local_demo_only",
      "mock_tool_execution_only",
      "no_real_tool_execution",
      "no_action_execution",
      "no_network_calls",
      "not_production_middleware",
      "not_production_benchmark",
      "not_security_certification",
    ],
  };
}

export function buildReviewerKitOutputForJson(summaryOnly: boolean): GatePassReviewerKitReport | GatePassReviewerKitSummary {
  const report = runGatePassReviewerKit();
  if (!summaryOnly) return report;
  return buildReviewerKitSummary(report);
}

export function summariseGatePassReviewerKit(report: GatePassReviewerKitReport): GatePassReviewerKitSummary {
  return buildReviewerKitSummary(report);
}

export function summariseReviewerKitComponents(report: GatePassReviewerKitReport): {
  roundTrip: GatePassRoundTripDemoSummary;
  scorecard: GatePassAdversarialScorecardSummary;
  wrapper: GatePassToolWrapperDemoSummary;
  localFrameworkIntegration: LocalAgentFrameworkIntegrationSummary;
} {
  return {
    roundTrip: summariseGatePassRoundTripDemo(report.components.roundTrip as GatePassRoundTripDemoPack),
    scorecard: summariseGatePassAdversarialScorecard(report.components.scorecard as GatePassAdversarialScorecard),
    wrapper: summariseGatePassToolWrapperDemo(report.components.wrapper as GatePassToolWrapperDemo),
    localFrameworkIntegration: summariseLocalAgentFrameworkIntegration(
      report.components.localFrameworkIntegration as LocalAgentFrameworkIntegrationDemo,
    ),
  };
}
