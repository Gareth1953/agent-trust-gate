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

export const ENFORCEABLE_TOOL_GATE_VERSION = "atg.enforceable-tool-gate.local.v1" as const;
export const ENFORCEABLE_TOOL_GATE_CORE_LINE = AGENT_PROOF_CONTRACT_CORE_LINE;
export const ENFORCEABLE_TOOL_GATE_PUBLIC_CONTACT = AGENT_PROOF_CONTRACT_PUBLIC_CONTACT;
export const ENFORCEABLE_TOOL_GATE_STRATEGIC_PRINCIPLE = AGENT_PROOF_CONTRACT_STRATEGIC_PRINCIPLE;
export const ENFORCEABLE_TOOL_GATE_POSITIONING = AGENT_PROOF_CONTRACT_POSITIONING;

export type MockSensitiveToolName =
  | "send_customer_message"
  | "write_file"
  | "export_data"
  | "prepare_payment"
  | "approve_procurement"
  | "publish_public_post"
  | "escalate_access_session"
  | "create_settlement_instruction";

export type EnforceableToolGateScenarioId =
  | "public_post_allowed_local"
  | "customer_message_escalated"
  | "data_export_blocked"
  | "prepare_payment_requires_signed_proof"
  | "procurement_stale_proof_blocked"
  | "high_risk_human_review"
  | "settlement_instruction_blocked"
  | "valid_local_control"
  | "missing_proof_requires_evidence";

export type EnforceableToolRiskTier = "low" | "medium" | "high" | "critical";

export interface MockSensitiveToolCall {
  toolName: MockSensitiveToolName;
  proposedAction: string;
  requestedBy: string;
  localDemoOnly: boolean;
}

export interface MockToolGatePolicy {
  policyId: string;
  toolName: MockSensitiveToolName;
  riskTier: EnforceableToolRiskTier;
  requiredProofItems: AgentProofRequiredItem[];
  requiredApproval: boolean;
  signedProofRequired: boolean;
  settlementSensitive: boolean;
  allowedScope: string;
  localDemoOnly: boolean;
}

export interface EnforceableToolGateInput {
  scenarioId: string;
  toolCall: MockSensitiveToolCall;
  proofPackage: AgentProofPackage | null;
  policy: MockToolGatePolicy;
  verificationRequest: AgentProofVerificationRequest;
  gatePassChallenge: GatePassChallenge;
  localDemoOnly: boolean;
}

export interface EnforceableToolGateReceiptSummary {
  receiptId: string;
  checkedProofPackage: boolean;
  checkedMandate: boolean;
  checkedEvidence: boolean;
  checkedVerifiedIntent: boolean;
  checkedFreshness: boolean;
  checkedNonce: boolean;
  checkedSignedProof: boolean;
  checkedHumanApproval: boolean;
  proofContractDecision: AgentProofDecision | "not_evaluated_missing_proof";
  gateOutcome: AgentProofDecision;
  localDemoOnly: true;
  realToolExecuted: false;
}

export interface EnforceableToolGateResult extends AgentProofContractSafetyFlags {
  gateVersion: typeof ENFORCEABLE_TOOL_GATE_VERSION;
  scenarioId: string;
  toolName: MockSensitiveToolName;
  proposedAction: string;
  requestedBy: string;
  policyId: string;
  riskTier: EnforceableToolRiskTier;
  settlementSensitive: boolean;
  decision: AgentProofDecision;
  proofContractDecision: AgentProofDecision | "not_evaluated_missing_proof";
  proofContractResult: AgentProofVerificationResult | null;
  reasons: string[];
  missingProofItems: string[];
  requiredNextProof: string[];
  receiptSummary: EnforceableToolGateReceiptSummary;
  wouldAllowLocally: boolean;
  wouldExecute: false;
  realToolExecuted: false;
  mockToolInvoked: false;
  noProofMeansNoPermission: true;
  publicContactEmail: typeof ENFORCEABLE_TOOL_GATE_PUBLIC_CONTACT;
  note: "Enforceable local tool-calling gate demo only; the mock gate intercepted the proposed tool call and no real tool, payment, settlement, network call, direct bot message, live systems contact, or action execution occurred.";
}

export interface EnforceableToolGateDemoPack extends AgentProofContractSafetyFlags {
  packVersion: typeof ENFORCEABLE_TOOL_GATE_VERSION;
  packId: string;
  coreLine: typeof ENFORCEABLE_TOOL_GATE_CORE_LINE;
  strategicPrinciple: typeof ENFORCEABLE_TOOL_GATE_STRATEGIC_PRINCIPLE;
  positioning: typeof ENFORCEABLE_TOOL_GATE_POSITIONING;
  publicContactEmail: typeof ENFORCEABLE_TOOL_GATE_PUBLIC_CONTACT;
  scenarioCount: number;
  decisions: Record<AgentProofDecision, number>;
  exampleFiles: typeof ENFORCEABLE_TOOL_GATE_EXAMPLE_FILES;
  note: EnforceableToolGateResult["note"];
  scenarios: EnforceableToolGateResult[];
}

export type EnforceableToolGateDemoSummary = Omit<EnforceableToolGateDemoPack, "scenarios">;

export const ENFORCEABLE_TOOL_GATE_EXAMPLE_FILES: Record<EnforceableToolGateScenarioId, string> = {
  public_post_allowed_local: "examples/enforceable-tool-gate-public-post-allowed-local.json",
  customer_message_escalated: "examples/enforceable-tool-gate-customer-message-escalated.json",
  data_export_blocked: "examples/enforceable-tool-gate-data-export-blocked.json",
  prepare_payment_requires_signed_proof:
    "examples/enforceable-tool-gate-prepare-payment-requires-signed-proof.json",
  procurement_stale_proof_blocked: "examples/enforceable-tool-gate-procurement-stale-proof-blocked.json",
  high_risk_human_review: "examples/enforceable-tool-gate-high-risk-human-review.json",
  settlement_instruction_blocked: "examples/enforceable-tool-gate-settlement-instruction-blocked.json",
  valid_local_control: "examples/enforceable-tool-gate-valid-local-control.json",
  missing_proof_requires_evidence: "examples/enforceable-tool-gate-missing-proof-requires-evidence.json",
};

const NOTE: EnforceableToolGateResult["note"] =
  "Enforceable local tool-calling gate demo only; the mock gate intercepted the proposed tool call and no real tool, payment, settlement, network call, direct bot message, live systems contact, or action execution occurred.";

export function evaluateEnforceableToolCall(input: EnforceableToolGateInput): EnforceableToolGateResult {
  return gateMockToolCall(input.toolCall, input.proofPackage, input.policy, input);
}

export function gateMockToolCall(
  toolCall: MockSensitiveToolCall,
  proofPackage: AgentProofPackage | null,
  policy: MockToolGatePolicy,
  input: Omit<EnforceableToolGateInput, "toolCall" | "proofPackage" | "policy">,
): EnforceableToolGateResult {
  const proofContractResult = proofPackage === null
    ? null
    : evaluateAgentProofVerification(proofPackage, input.verificationRequest, input.gatePassChallenge);
  const missingProofItems = missingProofItemsFor(proofPackage, proofContractResult, policy);
  const decision = decideToolGateOutcome(toolCall, proofPackage, policy, input, proofContractResult, missingProofItems);
  const reasons = collectToolGateReasons(toolCall, proofPackage, policy, input, proofContractResult, missingProofItems);
  return {
    gateVersion: ENFORCEABLE_TOOL_GATE_VERSION,
    scenarioId: input.scenarioId,
    toolName: toolCall.toolName,
    proposedAction: toolCall.proposedAction,
    requestedBy: toolCall.requestedBy,
    policyId: policy.policyId,
    riskTier: policy.riskTier,
    settlementSensitive: policy.settlementSensitive,
    decision,
    proofContractDecision: proofContractResult === null ? "not_evaluated_missing_proof" : proofContractResult.decision,
    proofContractResult,
    reasons,
    missingProofItems,
    requiredNextProof: requiredNextProofFor(decision, policy, missingProofItems),
    receiptSummary: createReceiptSummary(input.scenarioId, toolCall, policy, decision, proofContractResult, missingProofItems),
    wouldAllowLocally: decision === "allow",
    wouldExecute: false,
    realToolExecuted: false,
    mockToolInvoked: false,
    noProofMeansNoPermission: true,
    publicContactEmail: ENFORCEABLE_TOOL_GATE_PUBLIC_CONTACT,
    note: NOTE,
    ...AGENT_PROOF_CONTRACT_SAFETY_FLAGS,
  };
}

export function createEnforceableToolGateScenarioInputs(): Record<
  EnforceableToolGateScenarioId,
  EnforceableToolGateInput
> {
  const contractExamples = createAgentProofContractExamples();
  const baseProof = contractExamples.proofPackages.validLocalControl;
  return {
    public_post_allowed_local: createInput(
      "public_post_allowed_local",
      createToolCall("publish_public_post", "Publish a local demo announcement draft after proof review."),
      createProof(baseProof, {
        packageId: "tool_gate_proof_public_post_allowed",
        permittedActionScope: "publish_public_post_local_demo",
        requestedAction: "Publish a local demo announcement draft after proof review.",
        evidenceReference: "evidence_public_post_local_demo",
        humanApprovalStatus: "approved",
        riskTier: "medium",
        nonce: "nonce_tool_gate_public_post_001",
        signedProofReference: "signed_proof_public_post_local_demo",
      }),
      createPolicy("publish_public_post", "medium", true, true, false, "publish_public_post_local_demo"),
      contractExamples,
    ),
    customer_message_escalated: createInput(
      "customer_message_escalated",
      createToolCall("send_customer_message", "Send a customer-facing message without approval."),
      createProof(baseProof, {
        packageId: "tool_gate_proof_customer_message_no_approval",
        permittedActionScope: "send_customer_message_review_only",
        requestedAction: "Send a customer-facing message without approval.",
        evidenceReference: "evidence_customer_message_draft",
        humanApprovalStatus: "required_missing",
        riskTier: "medium",
        nonce: "nonce_tool_gate_customer_message_001",
        signedProofReference: "signed_proof_customer_message_review",
      }),
      createPolicy("send_customer_message", "medium", true, true, false, "send_customer_message_review_only"),
      contractExamples,
    ),
    data_export_blocked: createInput(
      "data_export_blocked",
      createToolCall("export_data", "Export local review data without a mandate."),
      createProof(baseProof, {
        packageId: "tool_gate_proof_data_export_missing_mandate",
        mandateReference: null,
        permittedActionScope: "export_data_review_only",
        requestedAction: "Export local review data without a mandate.",
        evidenceReference: "evidence_data_export_request",
        humanApprovalStatus: "approved",
        riskTier: "high",
        nonce: "nonce_tool_gate_data_export_001",
        signedProofReference: "signed_proof_data_export_review",
      }),
      createPolicy("export_data", "high", true, true, false, "export_data_review_only"),
      contractExamples,
    ),
    prepare_payment_requires_signed_proof: createInput(
      "prepare_payment_requires_signed_proof",
      createToolCall("prepare_payment", "Prepare a simulated payment-like instruction without signed proof."),
      createProof(baseProof, {
        packageId: "tool_gate_proof_prepare_payment_missing_signed_proof",
        permittedActionScope: "prepare_payment_review_only",
        requestedAction: "Prepare a simulated payment-like instruction without signed proof.",
        evidenceReference: "evidence_prepare_payment_review",
        humanApprovalStatus: "approved",
        riskTier: "high",
        nonce: "nonce_tool_gate_prepare_payment_001",
        signedProofReference: null,
        signedProofStatus: "missing",
        settlementSensitive: true,
      }),
      createPolicy("prepare_payment", "high", true, true, true, "prepare_payment_review_only"),
      contractExamples,
    ),
    procurement_stale_proof_blocked: createInput(
      "procurement_stale_proof_blocked",
      createToolCall("approve_procurement", "Approve a local procurement step with stale proof."),
      createProof(baseProof, {
        packageId: "tool_gate_proof_procurement_stale",
        permittedActionScope: "approve_procurement_review_only",
        requestedAction: "Approve a local procurement step with stale proof.",
        evidenceReference: "evidence_procurement_stale",
        humanApprovalStatus: "approved",
        riskTier: "high",
        freshnessStatus: "stale",
        nonce: "nonce_tool_gate_procurement_001",
        nonceStatus: "replayed",
        signedProofReference: "signed_proof_procurement_stale",
      }),
      createPolicy("approve_procurement", "high", true, true, false, "approve_procurement_review_only"),
      contractExamples,
    ),
    high_risk_human_review: createInput(
      "high_risk_human_review",
      createToolCall("escalate_access_session", "Escalate a local session access level for a high-risk workflow."),
      createProof(baseProof, {
        packageId: "tool_gate_proof_high_risk_access_review",
        permittedActionScope: "escalate_access_session_review_only",
        requestedAction: "Escalate a local session access level for a high-risk workflow.",
        evidenceReference: "evidence_high_risk_access",
        humanApprovalStatus: "required_missing",
        riskTier: "high",
        nonce: "nonce_tool_gate_access_001",
        signedProofReference: "signed_proof_access_review",
      }),
      createPolicy("escalate_access_session", "high", true, true, false, "escalate_access_session_review_only"),
      contractExamples,
    ),
    settlement_instruction_blocked: createInput(
      "settlement_instruction_blocked",
      createToolCall("create_settlement_instruction", "Create a simulated settlement instruction without a signed gate pass."),
      createProof(baseProof, {
        packageId: "tool_gate_proof_settlement_missing_gate_pass",
        permittedActionScope: "create_settlement_instruction_review_only",
        requestedAction: "Create a simulated settlement instruction without a signed gate pass.",
        evidenceReference: "evidence_settlement_instruction_review",
        humanApprovalStatus: "approved",
        riskTier: "critical",
        nonce: "nonce_tool_gate_settlement_001",
        signedProofReference: null,
        signedProofStatus: "missing",
        settlementSensitive: true,
      }),
      createPolicy("create_settlement_instruction", "critical", true, true, true, "create_settlement_instruction_review_only"),
      contractExamples,
    ),
    valid_local_control: createInput(
      "valid_local_control",
      createToolCall("write_file", "Prepare a deterministic local demo output summary."),
      createProof(baseProof, {
        packageId: "tool_gate_proof_valid_local_control",
        permittedActionScope: "write_file_demo_summary_only",
        requestedAction: "Prepare a deterministic local demo output summary.",
        evidenceReference: "evidence_valid_tool_gate_control",
        humanApprovalStatus: "not_required",
        riskTier: "low",
        nonce: "nonce_tool_gate_valid_control_001",
        signedProofReference: "signed_proof_valid_tool_gate_control",
      }),
      createPolicy("write_file", "low", false, true, false, "write_file_demo_summary_only"),
      contractExamples,
    ),
    missing_proof_requires_evidence: createInput(
      "missing_proof_requires_evidence",
      createToolCall("write_file", "Prepare a deterministic local demo output summary with no proof package."),
      null,
      createPolicy("write_file", "low", false, true, false, "write_file_demo_summary_only"),
      contractExamples,
    ),
  };
}

export function runEnforceableToolGateScenario(
  scenarioId: EnforceableToolGateScenarioId,
): EnforceableToolGateResult {
  return evaluateEnforceableToolCall(createEnforceableToolGateScenarioInputs()[scenarioId]);
}

export function runEnforceableToolGateDemo(): EnforceableToolGateDemoPack {
  const scenarios = (Object.keys(ENFORCEABLE_TOOL_GATE_EXAMPLE_FILES) as EnforceableToolGateScenarioId[])
    .map((scenarioId) => runEnforceableToolGateScenario(scenarioId));
  return {
    packVersion: ENFORCEABLE_TOOL_GATE_VERSION,
    packId: createPackId(scenarios),
    coreLine: ENFORCEABLE_TOOL_GATE_CORE_LINE,
    strategicPrinciple: ENFORCEABLE_TOOL_GATE_STRATEGIC_PRINCIPLE,
    positioning: ENFORCEABLE_TOOL_GATE_POSITIONING,
    publicContactEmail: ENFORCEABLE_TOOL_GATE_PUBLIC_CONTACT,
    scenarioCount: scenarios.length,
    decisions: countDecisions(scenarios),
    exampleFiles: ENFORCEABLE_TOOL_GATE_EXAMPLE_FILES,
    note: NOTE,
    scenarios,
    ...AGENT_PROOF_CONTRACT_SAFETY_FLAGS,
  };
}

export function summariseEnforceableToolGateDemo(
  pack: EnforceableToolGateDemoPack,
): EnforceableToolGateDemoSummary {
  const { scenarios: _scenarios, ...summary } = pack;
  return summary;
}

function createToolCall(toolName: MockSensitiveToolName, proposedAction: string): MockSensitiveToolCall {
  return {
    toolName,
    proposedAction,
    requestedBy: "mock_local_agent",
    localDemoOnly: true,
  };
}

function createProof(
  base: AgentProofPackage,
  overrides: Partial<AgentProofPackage> & { packageId: string },
): AgentProofPackage {
  return {
    ...base,
    ...overrides,
    contractVersion: AGENT_PROOF_CONTRACT_VERSION,
    localDemoOnly: true,
  };
}

function createPolicy(
  toolName: MockSensitiveToolName,
  riskTier: EnforceableToolRiskTier,
  requiredApproval: boolean,
  signedProofRequired: boolean,
  settlementSensitive: boolean,
  allowedScope: string,
): MockToolGatePolicy {
  return {
    policyId: `tool_gate_policy_${toolName}`,
    toolName,
    riskTier,
    requiredProofItems: [
      "claimedAgentName",
      "claimedAgentType",
      "ownerReference",
      "issuerReference",
      "mandateReference",
      "permittedActionScope",
      "requestedAction",
      "evidenceReference",
      "verifiedIntentStatus",
      "freshnessStatus",
      "nonce",
      "nonceStatus",
      "sessionContextReference",
      ...(signedProofRequired ? (["signedProofReference", "signedProofStatus"] as AgentProofRequiredItem[]) : []),
      ...(requiredApproval ? (["humanApprovalStatus"] as AgentProofRequiredItem[]) : []),
    ],
    requiredApproval,
    signedProofRequired,
    settlementSensitive,
    allowedScope,
    localDemoOnly: true,
  };
}

function createInput(
  scenarioId: EnforceableToolGateScenarioId,
  toolCall: MockSensitiveToolCall,
  proofPackage: AgentProofPackage | null,
  policy: MockToolGatePolicy,
  contractExamples: ReturnType<typeof createAgentProofContractExamples>,
): EnforceableToolGateInput {
  return {
    scenarioId,
    toolCall,
    proofPackage,
    policy,
    verificationRequest: {
      ...contractExamples.verificationRequests.basic,
      requestId: `tool_gate_verify_${scenarioId}`,
      requestedVerificationPurpose: `local_tool_gate_${toolCall.toolName}`,
      requiredProofItems: policy.requiredProofItems,
      riskTolerance: policy.riskTier === "low" ? "medium" : "low",
      humanReviewRequired: policy.requiredApproval && policy.riskTier !== "medium",
      settlementSensitive: policy.settlementSensitive,
    },
    gatePassChallenge: {
      ...contractExamples.gatePassChallenges.basic,
      challengeId: `tool_gate_challenge_${scenarioId}`,
      requestedAction: toolCall.proposedAction,
      requiredHumanApproval: policy.requiredApproval && policy.riskTier !== "medium",
      requiredSignedProof: policy.signedProofRequired,
    },
    localDemoOnly: true,
  };
}

function decideToolGateOutcome(
  toolCall: MockSensitiveToolCall,
  proofPackage: AgentProofPackage | null,
  policy: MockToolGatePolicy,
  input: Omit<EnforceableToolGateInput, "toolCall" | "proofPackage" | "policy">,
  proofContractResult: AgentProofVerificationResult | null,
  missingProofItems: readonly string[],
): AgentProofDecision {
  if (!toolCall.localDemoOnly || !policy.localDemoOnly || !input.localDemoOnly) return "block";
  if (proofPackage === null) return "require_evidence";
  if (proofContractResult === null) return "require_evidence";
  if (missingProofItems.includes("mandateReference")) return "block";
  if (proofPackage.freshnessStatus === "stale" || proofPackage.nonceStatus === "replayed") return "block";
  if (
    toolCall.toolName === "create_settlement_instruction"
    && policy.settlementSensitive
    && proofPackage.signedProofStatus !== "present"
  ) {
    return "block";
  }
  if (policy.signedProofRequired && proofPackage.signedProofStatus !== "present") return "require_signed_proof";
  if (missingProofItems.includes("evidenceReference")) return "require_evidence";
  if (proofPackage.verifiedIntentStatus === "unverified") return "escalate";
  if (policy.requiredApproval && proofPackage.humanApprovalStatus === "required_missing" && policy.riskTier === "medium") {
    return "escalate";
  }
  if (policy.requiredApproval && proofPackage.humanApprovalStatus === "required_missing") return "require_human_review";
  if (policy.riskTier === "high" || policy.riskTier === "critical") {
    if (proofPackage.humanApprovalStatus !== "approved") return "require_human_review";
  }
  if (proofContractResult.decision !== "allow") return proofContractResult.decision;
  return "allow";
}

function missingProofItemsFor(
  proofPackage: AgentProofPackage | null,
  proofContractResult: AgentProofVerificationResult | null,
  policy: MockToolGatePolicy,
): string[] {
  if (proofPackage === null) {
    return unique(["agentProofPackage", ...policy.requiredProofItems]);
  }
  return proofContractResult?.missingProofItems ?? [];
}

function collectToolGateReasons(
  toolCall: MockSensitiveToolCall,
  proofPackage: AgentProofPackage | null,
  policy: MockToolGatePolicy,
  input: Omit<EnforceableToolGateInput, "toolCall" | "proofPackage" | "policy">,
  proofContractResult: AgentProofVerificationResult | null,
  missingProofItems: readonly string[],
): string[] {
  const reasons = [
    "mock_tool_call_intercepted",
    "enforceable_tool_gate_local_only",
    "no_real_tool_execution",
    "proof_evaluated_before_tool_allow",
  ];
  if (!toolCall.localDemoOnly || !policy.localDemoOnly || !input.localDemoOnly) reasons.push("local_demo_only_required");
  if (proofPackage === null) reasons.push("proof_package_missing");
  else reasons.push(...(proofContractResult?.reasons ?? []).map((reason) => `proof_contract_${reason}`));
  if (missingProofItems.length > 0) reasons.push("missing_required_proof_items");
  if (missingProofItems.includes("mandateReference")) reasons.push("mandate_missing_blocks_tool_call");
  if (missingProofItems.includes("evidenceReference")) reasons.push("evidence_missing_requires_evidence");
  if (proofPackage?.verifiedIntentStatus === "unverified") reasons.push("verified_intent_unverified_escalates_tool_call");
  if (proofPackage?.freshnessStatus === "stale") reasons.push("stale_freshness_blocks_tool_call");
  if (proofPackage?.nonceStatus === "replayed") reasons.push("replayed_nonce_blocks_tool_call");
  if (policy.requiredApproval && proofPackage?.humanApprovalStatus === "required_missing") {
    reasons.push("required_human_approval_missing");
  }
  if (policy.signedProofRequired && proofPackage?.signedProofStatus !== "present") {
    reasons.push("signed_proof_required_before_tool_call");
  }
  if (policy.settlementSensitive && proofPackage?.signedProofStatus !== "present") {
    reasons.push("settlement_instruction_without_signed_gate_pass_blocks");
  }
  return unique(reasons);
}

function requiredNextProofFor(
  decision: AgentProofDecision,
  policy: MockToolGatePolicy,
  missingProofItems: readonly string[],
): string[] {
  const missing = missingProofItems.map((item) => `provide_${item}`);
  switch (decision) {
    case "allow":
      return ["emit_local_receipt", "do_not_execute_real_tool"];
    case "block":
      return unique(["stop_mock_tool_call", "present_fresh_non_replayed_scoped_proof", ...missing]);
    case "escalate":
      return unique(["route_to_local_reviewer", "clarify_verified_intent_or_approval", ...missing]);
    case "require_evidence":
      return unique(["provide_agent_proof_package", "provide_evidenceReference", ...missing]);
    case "require_human_review":
      return unique(["obtain_human_review", "bind_approval_to_scope_nonce_and_tool_policy", ...missing]);
    case "require_signed_proof":
      return policy.settlementSensitive
        ? unique(["provide_signed_gate_pass", "prove_scope_freshness_and_nonce_before_settlement_sensitive_tool", ...missing])
        : unique(["provide_signedProofReference", "provide_signedProofStatus", ...missing]);
  }
}

function createReceiptSummary(
  scenarioId: string,
  toolCall: MockSensitiveToolCall,
  policy: MockToolGatePolicy,
  decision: AgentProofDecision,
  proofContractResult: AgentProofVerificationResult | null,
  missingProofItems: readonly string[],
): EnforceableToolGateReceiptSummary {
  return {
    receiptId: createReceiptId(scenarioId, toolCall, policy, decision, missingProofItems),
    checkedProofPackage: proofContractResult !== null,
    checkedMandate: proofContractResult !== null || missingProofItems.includes("mandateReference"),
    checkedEvidence: proofContractResult !== null || missingProofItems.includes("evidenceReference"),
    checkedVerifiedIntent: proofContractResult !== null || missingProofItems.includes("verifiedIntentStatus"),
    checkedFreshness: proofContractResult !== null || missingProofItems.includes("freshnessStatus"),
    checkedNonce: proofContractResult !== null || missingProofItems.includes("nonce") || missingProofItems.includes("nonceStatus"),
    checkedSignedProof: policy.signedProofRequired || proofContractResult !== null,
    checkedHumanApproval: policy.requiredApproval || proofContractResult !== null,
    proofContractDecision: proofContractResult === null ? "not_evaluated_missing_proof" : proofContractResult.decision,
    gateOutcome: decision,
    localDemoOnly: true,
    realToolExecuted: false,
  };
}

function countDecisions(results: readonly EnforceableToolGateResult[]): Record<AgentProofDecision, number> {
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

function createReceiptId(
  scenarioId: string,
  toolCall: MockSensitiveToolCall,
  policy: MockToolGatePolicy,
  decision: AgentProofDecision,
  missingProofItems: readonly string[],
): string {
  return `tool_gate_receipt_${createHash("sha256")
    .update(`${ENFORCEABLE_TOOL_GATE_VERSION}|${scenarioId}|${toolCall.toolName}|${policy.policyId}|${decision}|${missingProofItems.join(",")}`, "utf8")
    .digest("hex")
    .slice(0, 24)}`;
}

function createPackId(results: readonly EnforceableToolGateResult[]): string {
  const seed = results
    .map((result) => `${result.scenarioId}:${result.toolName}:${result.decision}:${result.reasons.join(",")}`)
    .join("|");
  return `enforceable_tool_gate_${createHash("sha256")
    .update(`${ENFORCEABLE_TOOL_GATE_VERSION}|${AGENT_PROOF_CONTRACT_VERSION}|${seed}`, "utf8")
    .digest("hex")
    .slice(0, 24)}`;
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}
