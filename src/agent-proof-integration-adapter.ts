import { createHash } from "node:crypto";

import {
  AGENT_PROOF_CONTRACT_CORE_LINE,
  AGENT_PROOF_CONTRACT_POSITIONING,
  AGENT_PROOF_CONTRACT_PUBLIC_CONTACT,
  AGENT_PROOF_CONTRACT_SAFETY_FLAGS,
  AGENT_PROOF_CONTRACT_STRATEGIC_PRINCIPLE,
  AGENT_PROOF_CONTRACT_VERSION,
  createAgentProofContractExamples,
  evaluateAgentProofVerification,
  type AgentProofContractSafetyFlags,
  type AgentProofDecision,
  type AgentProofPackage,
  type AgentProofRequiredItem,
  type AgentProofVerificationRequest,
  type AgentProofVerificationResult,
  type GatePassChallenge,
} from "./agent-proof-contract.js";

export const AGENT_PROOF_INTEGRATION_ADAPTER_VERSION =
  "atg.agent-proof-integration-adapter.local.v1" as const;
export const AGENT_PROOF_INTEGRATION_CORE_LINE = AGENT_PROOF_CONTRACT_CORE_LINE;
export const AGENT_PROOF_INTEGRATION_PUBLIC_CONTACT = AGENT_PROOF_CONTRACT_PUBLIC_CONTACT;
export const AGENT_PROOF_INTEGRATION_STRATEGIC_PRINCIPLE =
  AGENT_PROOF_CONTRACT_STRATEGIC_PRINCIPLE;
export const AGENT_PROOF_INTEGRATION_POSITIONING = AGENT_PROOF_CONTRACT_POSITIONING;

export type AgentProofIntegrationAdapterType =
  | "local_agent_workflow"
  | "local_tool_call_proof_gate"
  | "local_pre_settlement_proof_gate"
  | "local_governance_review"
  | "local_session_access_review";

export type AgentProofIntegrationToolCallType =
  | "public_post"
  | "customer_facing_message"
  | "file_write"
  | "data_export"
  | "purchase_payment_preparation"
  | "procurement_step"
  | "access_session_escalation"
  | "settlement_sensitive_step";

export type AgentProofIntegrationScenarioId =
  | "valid_local_workflow"
  | "sensitive_tool_call_escalated"
  | "missing_proof_requires_evidence"
  | "pre_settlement_requires_signed_proof"
  | "high_risk_human_review"
  | "replayed_proof_blocked";

export interface LocalAgentProofIntegrationInput {
  scenarioId: string;
  adapterType: AgentProofIntegrationAdapterType;
  workflowName: string;
  proposedAction: string;
  proofPackage: AgentProofPackage | null;
  verificationRequest: AgentProofVerificationRequest;
  gatePassChallenge: GatePassChallenge;
  toolCallType?: AgentProofIntegrationToolCallType;
  localDemoOnly: boolean;
}

export interface LocalAgentProofIntegrationResult extends AgentProofContractSafetyFlags {
  adapterVersion: typeof AGENT_PROOF_INTEGRATION_ADAPTER_VERSION;
  scenarioId: string;
  adapterType: AgentProofIntegrationAdapterType;
  workflowName: string;
  proposedAction: string;
  toolCallType?: AgentProofIntegrationToolCallType;
  decision: AgentProofDecision;
  proofContractDecision: AgentProofDecision | "not_evaluated_missing_proof";
  proofContractResult: AgentProofVerificationResult | null;
  integrationCheckpoints: string[];
  missingProofItems: string[];
  reasons: string[];
  requiredDeveloperInputs: string[];
  executedAction: false;
  calledTool: false;
  simulatedSettlementOnly: true;
  noProofMeansNoPermission: true;
  publicContactEmail: typeof AGENT_PROOF_INTEGRATION_PUBLIC_CONTACT;
  note: "Local agent proof integration adapter only; no live systems contact, direct bot messaging, live agent-to-agent communication, payment, settlement, production certification, network call, tool call, or action execution occurred.";
}

export interface AgentProofIntegrationAdapterPack extends AgentProofContractSafetyFlags {
  packVersion: typeof AGENT_PROOF_INTEGRATION_ADAPTER_VERSION;
  packId: string;
  coreLine: typeof AGENT_PROOF_INTEGRATION_CORE_LINE;
  strategicPrinciple: typeof AGENT_PROOF_INTEGRATION_STRATEGIC_PRINCIPLE;
  positioning: typeof AGENT_PROOF_INTEGRATION_POSITIONING;
  publicContactEmail: typeof AGENT_PROOF_INTEGRATION_PUBLIC_CONTACT;
  scenarioCount: number;
  decisions: Record<AgentProofDecision, number>;
  exampleFiles: typeof AGENT_PROOF_INTEGRATION_EXAMPLE_FILES;
  note: LocalAgentProofIntegrationResult["note"];
  scenarios: LocalAgentProofIntegrationResult[];
}

export type AgentProofIntegrationAdapterPackSummary = Omit<AgentProofIntegrationAdapterPack, "scenarios">;

export const AGENT_PROOF_INTEGRATION_EXAMPLE_FILES: Record<AgentProofIntegrationScenarioId, string> = {
  valid_local_workflow: "examples/agent-proof-integration-valid-local-workflow.json",
  sensitive_tool_call_escalated: "examples/agent-proof-integration-sensitive-tool-call-escalated.json",
  missing_proof_requires_evidence: "examples/agent-proof-integration-missing-proof-requires-evidence.json",
  pre_settlement_requires_signed_proof:
    "examples/agent-proof-integration-pre-settlement-requires-signed-proof.json",
  high_risk_human_review: "examples/agent-proof-integration-high-risk-human-review.json",
  replayed_proof_blocked: "examples/agent-proof-integration-replayed-proof-blocked.json",
};

const NOTE: LocalAgentProofIntegrationResult["note"] =
  "Local agent proof integration adapter only; no live systems contact, direct bot messaging, live agent-to-agent communication, payment, settlement, production certification, network call, tool call, or action execution occurred.";

export function evaluateLocalAgentWorkflowIntegration(
  input: LocalAgentProofIntegrationInput,
): LocalAgentProofIntegrationResult {
  return evaluateIntegrationInput({
    ...input,
    adapterType: "local_agent_workflow",
  });
}

export function evaluateLocalToolCallProofGate(
  input: LocalAgentProofIntegrationInput,
): LocalAgentProofIntegrationResult {
  return evaluateIntegrationInput({
    ...input,
    adapterType: "local_tool_call_proof_gate",
  });
}

export function evaluateLocalPreSettlementProofGate(
  input: LocalAgentProofIntegrationInput,
): LocalAgentProofIntegrationResult {
  return evaluateIntegrationInput({
    ...input,
    adapterType: "local_pre_settlement_proof_gate",
  });
}

export function createAgentProofIntegrationScenarioInputs(): Record<
  AgentProofIntegrationScenarioId,
  LocalAgentProofIntegrationInput
> {
  const contractExamples = createAgentProofContractExamples();
  return {
    valid_local_workflow: {
      scenarioId: "valid_local_workflow",
      adapterType: "local_agent_workflow",
      workflowName: "local_agent_review_workflow",
      proposedAction: "Prepare a local public repository review summary.",
      proofPackage: contractExamples.proofPackages.validLocalControl,
      verificationRequest: contractExamples.verificationRequests.basic,
      gatePassChallenge: contractExamples.gatePassChallenges.basic,
      localDemoOnly: true,
    },
    sensitive_tool_call_escalated: {
      scenarioId: "sensitive_tool_call_escalated",
      adapterType: "local_tool_call_proof_gate",
      workflowName: "local_sensitive_tool_call_gate",
      proposedAction: "Prepare a customer-facing message without verified intent.",
      proofPackage: {
        ...contractExamples.proofPackages.validLocalControl,
        packageId: "agent_proof_pkg_tool_call_unverified_intent",
        requestedAction: "Prepare a customer-facing message without verified intent.",
        permittedActionScope: "customer_facing_message_review_only",
        verifiedIntentStatus: "unverified",
        riskTier: "medium",
        nonce: "nonce_agent_proof_tool_call_001",
        signedProofReference: "signed_proof_tool_call_review",
      },
      verificationRequest: contractExamples.verificationRequests.basic,
      gatePassChallenge: contractExamples.gatePassChallenges.basic,
      toolCallType: "customer_facing_message",
      localDemoOnly: true,
    },
    missing_proof_requires_evidence: {
      scenarioId: "missing_proof_requires_evidence",
      adapterType: "local_agent_workflow",
      workflowName: "local_missing_proof_workflow",
      proposedAction: "Use a local workflow without presenting a proof package.",
      proofPackage: null,
      verificationRequest: contractExamples.verificationRequests.basic,
      gatePassChallenge: contractExamples.gatePassChallenges.basic,
      localDemoOnly: true,
    },
    pre_settlement_requires_signed_proof: {
      scenarioId: "pre_settlement_requires_signed_proof",
      adapterType: "local_pre_settlement_proof_gate",
      workflowName: "local_pre_settlement_review",
      proposedAction: "Proceed toward a simulated settlement-sensitive workflow.",
      proofPackage: contractExamples.proofPackages.settlementSensitiveMissingSignedProof,
      verificationRequest: contractExamples.verificationRequests.settlementSensitive,
      gatePassChallenge: contractExamples.gatePassChallenges.settlementSensitive,
      toolCallType: "settlement_sensitive_step",
      localDemoOnly: true,
    },
    high_risk_human_review: {
      scenarioId: "high_risk_human_review",
      adapterType: "local_governance_review",
      workflowName: "local_high_risk_governance_review",
      proposedAction: "Prepare a customer-impacting workflow change.",
      proofPackage: contractExamples.proofPackages.highRiskHumanReview,
      verificationRequest: contractExamples.verificationRequests.humanReview,
      gatePassChallenge: contractExamples.gatePassChallenges.basic,
      toolCallType: "data_export",
      localDemoOnly: true,
    },
    replayed_proof_blocked: {
      scenarioId: "replayed_proof_blocked",
      adapterType: "local_tool_call_proof_gate",
      workflowName: "local_replay_resistant_tool_gate",
      proposedAction: "Reuse a previous proof package for a new sensitive tool call.",
      proofPackage: contractExamples.proofPackages.replayedProof,
      verificationRequest: contractExamples.verificationRequests.basic,
      gatePassChallenge: contractExamples.gatePassChallenges.basic,
      toolCallType: "file_write",
      localDemoOnly: true,
    },
  };
}

export function runAgentProofIntegrationAdapterScenario(
  scenarioId: AgentProofIntegrationScenarioId,
): LocalAgentProofIntegrationResult {
  const input = createAgentProofIntegrationScenarioInputs()[scenarioId];
  switch (input.adapterType) {
    case "local_agent_workflow":
      return evaluateLocalAgentWorkflowIntegration(input);
    case "local_tool_call_proof_gate":
      return evaluateLocalToolCallProofGate(input);
    case "local_pre_settlement_proof_gate":
      return evaluateLocalPreSettlementProofGate(input);
    case "local_governance_review":
    case "local_session_access_review":
      return evaluateIntegrationInput(input);
  }
}

export function runAgentProofIntegrationAdapterExamples(): AgentProofIntegrationAdapterPack {
  const scenarios = (Object.keys(AGENT_PROOF_INTEGRATION_EXAMPLE_FILES) as AgentProofIntegrationScenarioId[])
    .map((scenarioId) => runAgentProofIntegrationAdapterScenario(scenarioId));
  return {
    packVersion: AGENT_PROOF_INTEGRATION_ADAPTER_VERSION,
    packId: createPackId(scenarios),
    coreLine: AGENT_PROOF_INTEGRATION_CORE_LINE,
    strategicPrinciple: AGENT_PROOF_INTEGRATION_STRATEGIC_PRINCIPLE,
    positioning: AGENT_PROOF_INTEGRATION_POSITIONING,
    publicContactEmail: AGENT_PROOF_INTEGRATION_PUBLIC_CONTACT,
    scenarioCount: scenarios.length,
    decisions: countDecisions(scenarios),
    exampleFiles: AGENT_PROOF_INTEGRATION_EXAMPLE_FILES,
    note: NOTE,
    scenarios,
    ...AGENT_PROOF_CONTRACT_SAFETY_FLAGS,
  };
}

export function summariseAgentProofIntegrationAdapterPack(
  pack: AgentProofIntegrationAdapterPack,
): AgentProofIntegrationAdapterPackSummary {
  const { scenarios: _scenarios, ...summary } = pack;
  return summary;
}

function evaluateIntegrationInput(
  input: LocalAgentProofIntegrationInput,
): LocalAgentProofIntegrationResult {
  const proofContractResult = input.proofPackage === null
    ? null
    : evaluateAgentProofVerification(input.proofPackage, input.verificationRequest, input.gatePassChallenge);
  const decision = decisionForIntegration(input, proofContractResult);
  const missingProofItems = missingProofItemsFor(input, proofContractResult);
  const reasons = collectIntegrationReasons(input, proofContractResult, missingProofItems);
  return {
    adapterVersion: AGENT_PROOF_INTEGRATION_ADAPTER_VERSION,
    scenarioId: input.scenarioId,
    adapterType: input.adapterType,
    workflowName: input.workflowName,
    proposedAction: input.proposedAction,
    ...(input.toolCallType === undefined ? {} : { toolCallType: input.toolCallType }),
    decision,
    proofContractDecision: proofContractResult === null ? "not_evaluated_missing_proof" : proofContractResult.decision,
    proofContractResult,
    integrationCheckpoints: integrationCheckpointsFor(input),
    missingProofItems,
    reasons,
    requiredDeveloperInputs: requiredDeveloperInputsFor(decision, input, missingProofItems),
    executedAction: false,
    calledTool: false,
    simulatedSettlementOnly: true,
    noProofMeansNoPermission: true,
    publicContactEmail: AGENT_PROOF_INTEGRATION_PUBLIC_CONTACT,
    note: NOTE,
    ...AGENT_PROOF_CONTRACT_SAFETY_FLAGS,
  };
}

function decisionForIntegration(
  input: LocalAgentProofIntegrationInput,
  proofContractResult: AgentProofVerificationResult | null,
): AgentProofDecision {
  if (!input.localDemoOnly) return "block";
  if (proofContractResult === null) return "require_evidence";
  return proofContractResult.decision;
}

function missingProofItemsFor(
  input: LocalAgentProofIntegrationInput,
  proofContractResult: AgentProofVerificationResult | null,
): string[] {
  if (proofContractResult !== null) return proofContractResult.missingProofItems;
  return [
    "agentProofPackage",
    "mandateReference",
    "evidenceReference",
    "verifiedIntentStatus",
    "freshnessStatus",
    "nonce",
    "signedProofReference",
  ];
}

function collectIntegrationReasons(
  input: LocalAgentProofIntegrationInput,
  proofContractResult: AgentProofVerificationResult | null,
  missingProofItems: readonly string[],
): string[] {
  const reasons = [
    "integration_adapter_local_only",
    "no_action_execution",
    "proof_contract_checked_before_sensitive_action",
  ];
  if (!input.localDemoOnly) reasons.push("local_demo_only_required");
  if (proofContractResult === null) reasons.push("proof_package_missing");
  else reasons.push(...proofContractResult.reasons.map((reason) => `proof_contract_${reason}`));
  if (input.adapterType === "local_tool_call_proof_gate") reasons.push("tool_call_blocked_until_proof_passes");
  if (input.adapterType === "local_pre_settlement_proof_gate") {
    reasons.push("pre_settlement_gate_requires_signed_gate_pass");
  }
  if (input.toolCallType === "customer_facing_message") reasons.push("customer_facing_tool_call_requires_verified_intent");
  if (input.toolCallType === "settlement_sensitive_step") reasons.push("settlement_sensitive_tool_call_requires_signed_proof");
  if (missingProofItems.length > 0) reasons.push("missing_required_proof_items");
  return unique(reasons);
}

function integrationCheckpointsFor(input: LocalAgentProofIntegrationInput): string[] {
  const checkpoints = [
    "agent_proposes_action",
    "system_creates_gate_pass_challenge",
    "agent_or_owner_presents_proof_package",
    "verifier_creates_local_verification_request",
    "proof_contract_evaluates_locally",
    "result_is_recorded_without_action_execution",
  ];
  if (input.adapterType === "local_tool_call_proof_gate") checkpoints.push("sensitive_tool_call_is_not_invoked");
  if (input.adapterType === "local_pre_settlement_proof_gate") {
    checkpoints.push("settlement_sensitive_step_is_not_executed");
  }
  if (input.adapterType === "local_governance_review") checkpoints.push("governance_review_receives_local_result");
  if (input.adapterType === "local_session_access_review") checkpoints.push("session_access_decision_stays_local");
  return checkpoints;
}

function requiredDeveloperInputsFor(
  decision: AgentProofDecision,
  input: LocalAgentProofIntegrationInput,
  missingProofItems: readonly string[],
): string[] {
  const base = [
    "define_local_action_scope",
    "provide_local_gate_pass_challenge",
    "provide_local_verification_request",
    "provide_local_audit_or_logging_route",
  ];
  if (missingProofItems.length > 0) base.push(...missingProofItems.map((item) => `provide_${item}`));
  if (decision === "require_evidence") base.push("provide_evidence_reference");
  if (decision === "require_human_review") base.push("provide_human_approval_route");
  if (decision === "require_signed_proof" || input.adapterType === "local_pre_settlement_proof_gate") {
    base.push("provide_signed_gate_pass_route");
  }
  if (decision === "block") base.push("stop_local_workflow_until_fresh_non_replayed_proof_exists");
  if (decision === "escalate") base.push("provide_verified_intent_or_escalation_route");
  return unique(base);
}

function countDecisions(results: readonly LocalAgentProofIntegrationResult[]): Record<AgentProofDecision, number> {
  const counts: Record<AgentProofDecision, number> = {
    allow: 0,
    block: 0,
    escalate: 0,
    require_evidence: 0,
    require_human_review: 0,
    require_signed_proof: 0,
  };
  for (const result of results) counts[result.decision] += 1;
  return counts;
}

function createPackId(results: readonly LocalAgentProofIntegrationResult[]): string {
  const seed = results
    .map((result) => `${result.scenarioId}:${result.decision}:${result.reasons.join(",")}`)
    .join("|");
  return `agent_proof_integration_${createHash("sha256")
    .update(`${AGENT_PROOF_INTEGRATION_ADAPTER_VERSION}|${AGENT_PROOF_CONTRACT_VERSION}|${seed}`, "utf8")
    .digest("hex")
    .slice(0, 24)}`;
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}
