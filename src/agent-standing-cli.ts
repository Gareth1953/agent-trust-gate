import {
  AGENT_STANDING_CORE_RULE,
  createAgentStandingScenarios,
  runAgentStandingScenario,
  summariseAgentStandingDemo,
  type AgentStandingDemoSummary,
  type AgentStandingScenarioResult,
} from "./agent-standing.js";

export interface AgentStandingCliIo {
  stdout: (value: string) => void;
  stderr: (value: string) => void;
}

export function runAgentStandingCli(
  args: readonly string[],
  io: AgentStandingCliIo = {
    stdout: (value) => console.log(value),
    stderr: (value) => console.error(value),
  },
): number {
  const scenarioId = valueAfter(args, "--scenario");
  const scenarios = createAgentStandingScenarios();
  const selected = scenarioId === undefined
    ? scenarios
    : scenarios.filter((scenario) => scenario.scenarioId === scenarioId);
  if (scenarioId !== undefined && selected.length === 0) {
    io.stderr(`Unknown scenario: ${scenarioId}`);
    io.stderr(`Available: ${scenarios.map((scenario) => scenario.scenarioId).join(", ")}`);
    return 2;
  }

  const allResults = scenarios.map(runAgentStandingScenario);
  const results = scenarioId === undefined
    ? allResults
    : allResults.filter((result) => result.scenarioId === scenarioId);
  const summary = summariseAgentStandingDemo(allResults);
  if (args.includes("--json")) {
    io.stdout(JSON.stringify({ summary, results }, null, 2));
    return summary.overallPassed ? 0 : 1;
  }

  const output: string[] = [
    "ATG AGENT STANDING RESULT",
    "P3-M154 — Verified Agent Standing",
    "Local deterministic fixture evidence only. No real identity verification or external action.",
    "",
  ];
  if (!args.includes("--summary-only")) {
    for (const result of results) output.push(...renderScenario(result), "");
  }
  output.push(...renderSummary(summary), "", AGENT_STANDING_CORE_RULE);
  io.stdout(output.join("\n"));
  return summary.overallPassed ? 0 : 1;
}

function renderScenario(result: AgentStandingScenarioResult): string[] {
  const delegation = result.proof?.delegation;
  const limit = delegation?.maximumAmountMinorUnits === null || delegation === undefined
    ? "not supplied"
    : `${delegation.maximumAmountMinorUnits} ${delegation.currency ?? "minor units"}`;
  return [
    `Scenario: ${result.scenarioId}`,
    `  Claimed agent: ${result.receipt.agentIdentifier}`,
    `  Account/platform identity: ${result.receipt.accountOrPlatformIdentity ?? "not supplied"}`,
    `  Key-control challenge: ${result.receipt.checks.keyControlChallengeValid ? "verified" : "not verified"}`,
    `  Principal: ${result.receipt.principalIdentifier ?? "not verified"}`,
    `  Organisation sponsor: ${result.receipt.organisationSponsorIdentifier ?? "not applicable"}`,
    `  Accountable human sponsor: ${result.receipt.accountableHumanSponsorReference ?? "not applicable"}`,
    `  Delegation: ${delegation?.delegationIdentifier ?? "not supplied"}`,
    `  Authority limit: ${limit}`,
    `  Request digest: ${result.receipt.exactRequestDigest}`,
    `  Standing outcome: ${result.receipt.outcome}`,
    `  Assurance: declared ${result.receipt.declaredAssuranceClassification}; verified ${result.receipt.verifiedAssuranceClassification}`,
    `  Reason codes: ${result.receipt.reasonCodes.join(", ")}`,
    `  GatePass evaluation may begin: ${result.receipt.gatePassEvaluationMayBegin ? "yes" : "no"}`,
    `  GatePass evaluation attempted: ${result.receipt.gatePassEvaluation.attempted ? "yes" : "no"}`,
    `  Expected outcome matched: ${result.matchedExpectation ? "yes" : "no"}`,
  ];
}

function renderSummary(summary: AgentStandingDemoSummary): string[] {
  const passed = (value: boolean) => value ? "passed" : "FAILED";
  return [
    `Expected verified cases: ${passed(summary.expectedVerifiedCasesPassed)}`,
    `Expected refusals: ${passed(summary.expectedRefusalsPassed)}`,
    `Expected unverifiable cases: ${passed(summary.expectedUnverifiableCasesPassed)}`,
    `Agent key-control challenge: ${passed(summary.agentKeyControlChallengePassed)}`,
    `Principal and delegation checks: ${passed(summary.principalAndDelegationChecksPassed)}`,
    `Scope, limit, expiry and revocation checks: ${passed(summary.scopeLimitExpiryAndRevocationChecksPassed)}`,
    `Exact-request binding: ${passed(summary.exactRequestBindingPassed)}`,
    `GatePass precondition: ${passed(summary.gatePassPreconditionPassed)}`,
    "External actions performed: none",
    `Overall: ${summary.overallPassed ? "AGENT STANDING DEMONSTRATION PASSED" : "AGENT STANDING DEMONSTRATION FAILED"}`,
  ];
}

function valueAfter(args: readonly string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

if (require.main === module) {
  process.exitCode = runAgentStandingCli(process.argv.slice(2));
}
