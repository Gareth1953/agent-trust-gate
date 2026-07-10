import { runAgentToAgentHandoffGateReference } from "./agent-to-agent-handoff-gate.js";
import { runGenericAgentLoopReference } from "./generic-agent-loop.js";
import { runGovernanceReviewerFlowReference } from "./governance-reviewer-flow.js";
import { runHumanInTheLoopEscalationReference } from "./human-in-the-loop-escalation.js";
import { runPreSettlementMoneyGateReference } from "./pre-settlement-money-gate.js";
import { runToolCallingGuardrailReference } from "./tool-calling-guardrail.js";
import { runTrustGateWrapperReference } from "./trust-gate-wrapper.js";
import {
  createReferenceIntegrationPack,
  summarisePack,
  type ReferenceIntegrationPack,
  type ReferenceIntegrationPackSummary,
  type ReferenceIntegrationPatternId,
  type ReferenceIntegrationResult,
} from "./shared.js";

export {
  runAgentToAgentHandoffGateReference,
  runGenericAgentLoopReference,
  runGovernanceReviewerFlowReference,
  runHumanInTheLoopEscalationReference,
  runPreSettlementMoneyGateReference,
  runToolCallingGuardrailReference,
  runTrustGateWrapperReference,
};
export {
  REFERENCE_INTEGRATION_EXAMPLE_FILES,
  REFERENCE_INTEGRATIONS_PUBLIC_CONTACT,
  REFERENCE_INTEGRATIONS_RULE,
  REFERENCE_INTEGRATIONS_VERSION,
  type ReferenceIntegrationPack,
  type ReferenceIntegrationPackSummary,
  type ReferenceIntegrationPatternId,
  type ReferenceIntegrationResult,
  type ReferenceIntegrationSafetyFlags,
  type ReferenceIntegrationVerdict,
} from "./shared.js";
export { createLocalTrustGateWrapper, type LocalTrustGateWrapper } from "./trust-gate-wrapper.js";

export function runReferenceIntegrationExamples(): ReferenceIntegrationPack {
  return createReferenceIntegrationPack(runReferenceIntegrationPatternResults());
}

export function summariseReferenceIntegrationExamples(
  pack: ReferenceIntegrationPack,
): ReferenceIntegrationPackSummary {
  return summarisePack(pack.patterns);
}

export function runReferenceIntegrationPattern(
  patternId: ReferenceIntegrationPatternId,
): ReferenceIntegrationResult {
  const pattern = runReferenceIntegrationPatternResults().find((item) => item.patternId === patternId);
  if (pattern === undefined) throw new Error(`Unknown reference integration pattern: ${patternId}`);
  return pattern;
}

export function runReferenceIntegrationPatternResults(): ReferenceIntegrationResult[] {
  return [
    runGenericAgentLoopReference(),
    runToolCallingGuardrailReference(),
    runHumanInTheLoopEscalationReference(),
    runPreSettlementMoneyGateReference(),
    runGovernanceReviewerFlowReference(),
    runAgentToAgentHandoffGateReference(),
    runTrustGateWrapperReference(),
  ];
}
