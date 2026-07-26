import {
  runExactActionGatePassDemo,
  type ExactActionDemoPack,
  type ExactActionDemoScenario,
} from "./exact-action-gatepass.js";
import {
  runGatePassToolWrapperDemo,
  type GatePassToolWrapperDemo,
  type GatePassToolWrapperScenarioResult,
} from "./gatepass-tool-wrapper.js";

export const REVIEWER_CONVERSION_VERSION = "atg.reviewer-conversion.local.v1" as const;
export const REVIEWER_CONVERSION_COMMAND = "npm run reviewer" as const;

export type ReviewerExpectedOutcome = "allow" | "refuse";
export type ReviewerObservedOutcome = "allow" | "refuse";

export type ReviewerConversionScenarioId =
  | "valid_exact_action_accepted"
  | "materially_changed_action_refused"
  | "consumed_gatepass_replay_refused"
  | "expired_gatepass_refused"
  | "missing_mandate_refused"
  | "missing_evidence_refused"
  | "missing_approval_refused"
  | "settlement_without_current_authority_refused";

export interface ReviewerScenarioObservation {
  scenarioId: ReviewerConversionScenarioId;
  description: string;
  expected: ReviewerExpectedOutcome;
  observed: ReviewerObservedOutcome;
  matched: boolean;
  evidence: string;
}

export interface ReviewerConversionScorecard {
  expectedAllowsPassed: boolean;
  expectedRefusalsPassed: boolean;
  replayProtectionPassed: boolean;
  exactActionBindingPassed: boolean;
  executionReceiptSeparationPassed: boolean;
  requiredAuthorityChecksPassed: boolean;
  consequentialActionBlockingPassed: boolean;
  externalActionsPerformed: "none" | "unexpected";
  overallPassed: boolean;
}

export interface ReviewerConversionReport {
  reviewerVersion: typeof REVIEWER_CONVERSION_VERSION;
  command: typeof REVIEWER_CONVERSION_COMMAND;
  referenceTime: string;
  scenarios: ReviewerScenarioObservation[];
  scorecard: ReviewerConversionScorecard;
  localOnly: boolean;
  deterministicFixtures: true;
  verifierControlledClock: true;
  simulatedExecutionOnly: boolean;
  externalActionOccurred: boolean;
  networkCalls: boolean;
  realPayments: boolean;
  realSettlement: boolean;
  uncontrolledGeneratedFiles: false;
}

export interface ReviewerConversionDependencies {
  runExactActionDemo: () => Promise<ExactActionDemoPack>;
  runWrapperDemo: () => GatePassToolWrapperDemo;
}

export interface ReviewerConversionCliIo {
  stdout: (value: string) => void;
  stderr: (value: string) => void;
}

const defaultDependencies: ReviewerConversionDependencies = {
  runExactActionDemo: runExactActionGatePassDemo,
  runWrapperDemo: runGatePassToolWrapperDemo,
};

const defaultIo: ReviewerConversionCliIo = {
  stdout: (value) => console.log(value),
  stderr: (value) => console.error(value),
};

export async function runReviewerConversionDemo(
  dependencies: ReviewerConversionDependencies = defaultDependencies,
): Promise<ReviewerConversionReport> {
  const exactAction = await dependencies.runExactActionDemo();
  const wrapper = dependencies.runWrapperDemo();

  const scenarios = [
    observeExactAction(
      "valid_exact_action_accepted",
      "A valid exact-action GatePass is accepted immediately before a local simulated side effect.",
      "allow",
      exactAction.scenarios.exact_action_executed,
    ),
    observeExactAction(
      "materially_changed_action_refused",
      "A changed amount is refused because the proposed action no longer matches the GatePass.",
      "refuse",
      exactAction.scenarios.changed_amount_refused,
    ),
    observeExactAction(
      "consumed_gatepass_replay_refused",
      "A replay of the consumed one-use GatePass is refused.",
      "refuse",
      exactAction.scenarios.replay_refused,
    ),
    observeExactAction(
      "expired_gatepass_refused",
      "An expired GatePass is refused using verifier-controlled time.",
      "refuse",
      exactAction.scenarios.expired_refused,
    ),
    observeWrapper(
      "missing_mandate_refused",
      "An action without its required mandate is refused at the local wrapper boundary.",
      wrapperScenario(wrapper, "missing_mandate_blocks"),
    ),
    observeWrapper(
      "missing_evidence_refused",
      "An action without required evidence cannot proceed.",
      wrapperScenario(wrapper, "missing_evidence_requires_evidence"),
    ),
    observeWrapper(
      "missing_approval_refused",
      "A high-impact action without required approval cannot proceed.",
      wrapperScenario(wrapper, "high_risk_requires_human_review"),
    ),
    observeWrapper(
      "settlement_without_current_authority_refused",
      "A settlement-sensitive action without a valid signed GatePass cannot proceed.",
      wrapperScenario(wrapper, "settlement_sensitive_requires_signed_gatepass"),
    ),
  ];

  const executionReceiptSeparationPassed = hasSeparateExecutionReceipt(
    exactAction.scenarios.exact_action_executed,
  );
  const replayProtectionPassed = scenarioPassed(scenarios, "consumed_gatepass_replay_refused")
    && exactAction.scenarios.replay_refused.executionReceipt?.verification.reasonCodes
      .includes("GATEPASS_ALREADY_CONSUMED") === true;
  const exactActionBindingPassed = scenarioPassed(scenarios, "materially_changed_action_refused")
    && exactAction.scenarios.changed_amount_refused.executionReceipt?.verification.reasonCodes
      .includes("GATEPASS_ACTION_DIGEST_MISMATCH") === true;
  const requiredAuthorityChecksPassed = [
    "missing_mandate_refused",
    "missing_evidence_refused",
    "missing_approval_refused",
  ].every((scenarioId) => scenarioPassed(scenarios, scenarioId as ReviewerConversionScenarioId));
  const consequentialActionBlockingPassed = scenarioPassed(
    scenarios,
    "settlement_without_current_authority_refused",
  );
  const noExternalActions = demonstratesNoExternalActions(exactAction, wrapper);
  const networkCalls = exactAction.externalApis !== false
    || wrapper.networkCalls !== false
    || wrapper.scenarios.some((scenario) => scenario.networkCalls !== false);
  const realPayments = exactAction.realPayments !== false
    || wrapper.paymentAuthorisation !== false
    || wrapper.scenarios.some((scenario) => scenario.paymentAuthorisation !== false);
  const realSettlement = exactAction.realSettlement !== false
    || wrapper.settlementAuthorisation !== false
    || wrapper.scenarios.some((scenario) => scenario.settlementAuthorisation !== false);
  const expectedAllowsPassed = scenarios
    .filter((scenario) => scenario.expected === "allow")
    .every((scenario) => scenario.matched);
  const expectedRefusalsPassed = scenarios
    .filter((scenario) => scenario.expected === "refuse")
    .every((scenario) => scenario.matched);
  const overallPassed = expectedAllowsPassed
    && expectedRefusalsPassed
    && replayProtectionPassed
    && exactActionBindingPassed
    && executionReceiptSeparationPassed
    && requiredAuthorityChecksPassed
    && consequentialActionBlockingPassed
    && noExternalActions;

  return {
    reviewerVersion: REVIEWER_CONVERSION_VERSION,
    command: REVIEWER_CONVERSION_COMMAND,
    referenceTime: exactAction.referenceTime,
    scenarios,
    scorecard: {
      expectedAllowsPassed,
      expectedRefusalsPassed,
      replayProtectionPassed,
      exactActionBindingPassed,
      executionReceiptSeparationPassed,
      requiredAuthorityChecksPassed,
      consequentialActionBlockingPassed,
      externalActionsPerformed: noExternalActions ? "none" : "unexpected",
      overallPassed,
    },
    localOnly: exactAction.localOnly && wrapper.localDemoOnly,
    deterministicFixtures: true,
    verifierControlledClock: true,
    simulatedExecutionOnly: exactAction.simulatedActionsOnly && wrapper.mockToolExecutionOnly,
    externalActionOccurred: !noExternalActions,
    networkCalls,
    realPayments,
    realSettlement,
    uncontrolledGeneratedFiles: false,
  };
}

export async function runReviewerConversionCli(
  args: readonly string[],
  io: ReviewerConversionCliIo = defaultIo,
  dependencies: ReviewerConversionDependencies = defaultDependencies,
): Promise<number> {
  if (args.length > 0) {
    io.stderr("The reviewer command does not accept options or positional arguments.");
    return 1;
  }
  try {
    const report = await runReviewerConversionDemo(dependencies);
    io.stdout(renderReviewerConversionReport(report));
    return report.scorecard.overallPassed ? 0 : 1;
  } catch {
    io.stderr([
      "ATG REVIEWER RESULT",
      "Overall: REVIEWER DEMONSTRATION FAILED",
      "No external action was requested by this local reviewer command.",
    ].join("\n"));
    return 1;
  }
}

export function renderReviewerConversionReport(report: ReviewerConversionReport): string {
  const lines = [
    "Agent Trust Gate local reviewer demonstration",
    `Reference time: ${report.referenceTime}`,
    "Fixed synthetic fixtures; verifier-controlled clock; no network or external execution.",
    "",
    ...report.scenarios.map((scenario) =>
      `[${scenario.matched ? "PASS" : "FAIL"}] ${scenario.description} Expected=${scenario.expected}; observed=${scenario.observed}.`
    ),
    "",
    "ATG REVIEWER RESULT",
    `Expected allows: ${passed(report.scorecard.expectedAllowsPassed)}`,
    `Expected refusals: ${passed(report.scorecard.expectedRefusalsPassed)}`,
    `Replay protection: ${passed(report.scorecard.replayProtectionPassed)}`,
    `Exact-action binding: ${passed(report.scorecard.exactActionBindingPassed)}`,
    `Execution receipt separation: ${passed(report.scorecard.executionReceiptSeparationPassed)}`,
    `Required authority checks: ${passed(report.scorecard.requiredAuthorityChecksPassed)}`,
    `Consequential action blocking: ${passed(report.scorecard.consequentialActionBlockingPassed)}`,
    `External actions performed: ${report.scorecard.externalActionsPerformed}`,
    `Overall: REVIEWER DEMONSTRATION ${report.scorecard.overallPassed ? "PASSED" : "FAILED"}`,
  ];
  return lines.join("\n");
}

function observeExactAction(
  scenarioId: ReviewerConversionScenarioId,
  description: string,
  expected: ReviewerExpectedOutcome,
  scenario: ExactActionDemoScenario,
): ReviewerScenarioObservation {
  const observed = scenario.lifecycleState === "executed"
    && scenario.executionReceipt?.resultStatus === "executed"
    && scenario.executionReceipt.verification.verified
    ? "allow"
    : "refuse";
  return {
    scenarioId,
    description,
    expected,
    observed,
    matched: observed === expected,
    evidence: scenario.executionReceipt?.resultStatus ?? scenario.lifecycleState,
  };
}

function observeWrapper(
  scenarioId: ReviewerConversionScenarioId,
  description: string,
  scenario: GatePassToolWrapperScenarioResult,
): ReviewerScenarioObservation {
  const observed = scenario.allowed
    && scenario.outcome === "allow"
    && scenario.localMockExecuted
    ? "allow"
    : "refuse";
  return {
    scenarioId,
    description,
    expected: "refuse",
    observed,
    matched: observed === "refuse" && scenario.matchedExpectedOutcome,
    evidence: scenario.outcome,
  };
}

function wrapperScenario(
  wrapper: GatePassToolWrapperDemo,
  scenarioId: GatePassToolWrapperScenarioResult["scenarioId"],
): GatePassToolWrapperScenarioResult {
  const scenario = wrapper.scenarios.find((candidate) => candidate.scenarioId === scenarioId);
  if (scenario === undefined) throw new Error(`Required local wrapper scenario is missing: ${scenarioId}`);
  return scenario;
}

function hasSeparateExecutionReceipt(scenario: ExactActionDemoScenario): boolean {
  const receipt = scenario.executionReceipt;
  return receipt !== null
    && scenario.decisionReceipt.executionState === "not_executed"
    && receipt.decisionReceiptReference === scenario.decisionReceipt.receiptId
    && receipt.receiptId !== scenario.decisionReceipt.receiptId
    && receipt.simulatedOnly
    && receipt.externalActionOccurred === false;
}

function demonstratesNoExternalActions(
  exactAction: ExactActionDemoPack,
  wrapper: GatePassToolWrapperDemo,
): boolean {
  return exactAction.localOnly
    && exactAction.simulatedActionsOnly
    && exactAction.realPayments === false
    && exactAction.realSettlement === false
    && exactAction.externalApis === false
    && exactAction.productionEnforcement === false
    && Object.values(exactAction.scenarios).every((scenario) =>
      scenario.executionReceipt === null
      || (scenario.executionReceipt.simulatedOnly
        && scenario.executionReceipt.externalActionOccurred === false)
    )
    && wrapper.localDemoOnly
    && wrapper.mockToolExecutionOnly
    && wrapper.realToolExecution === false
    && wrapper.actionExecution === false
    && wrapper.networkCalls === false
    && wrapper.paymentAuthorisation === false
    && wrapper.settlementAuthorisation === false
    && wrapper.scenarios.every((scenario) =>
      scenario.realToolExecution === false
      && scenario.actionExecution === false
      && scenario.networkCalls === false
      && scenario.paymentAuthorisation === false
      && scenario.settlementAuthorisation === false
    );
}

function scenarioPassed(
  scenarios: readonly ReviewerScenarioObservation[],
  scenarioId: ReviewerConversionScenarioId,
): boolean {
  return scenarios.find((scenario) => scenario.scenarioId === scenarioId)?.matched === true;
}

function passed(value: boolean): "passed" | "FAILED" {
  return value ? "passed" : "FAILED";
}

if (require.main === module) {
  void runReviewerConversionCli(process.argv.slice(2)).then((code) => {
    process.exitCode = code;
  });
}
