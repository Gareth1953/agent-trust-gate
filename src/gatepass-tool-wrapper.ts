import {
  GATEPASS_CORE_PUBLIC_CONTACT,
  validateGatePassCore,
  type GatePassCore,
  type GatePassDecision,
} from "./gatepass-core.js";
import {
  runGatePassRoundTripScenario,
  type GatePassRoundTripResult,
  type GatePassRoundTripScenarioId,
} from "./gatepass-round-trip.js";
import { classifyTrustLanguagePhrase } from "./gatepass-trust-language.js";

export const GATEPASS_TOOL_WRAPPER_VERSION = "atg.gatepass-tool-wrapper.local.v1" as const;
export const GATEPASS_TOOL_WRAPPER_PUBLIC_CONTACT = GATEPASS_CORE_PUBLIC_CONTACT;
export const GATEPASS_TOOL_WRAPPER_EXAMPLE_FILE = "examples/gatepass-developer-wrapper-demo.json" as const;
export const GATEPASS_TOOL_WRAPPER_CORE_PHRASES = [
  "GatePass is a scoped, time-bound, action-specific proof primitive for agent actions.",
  "GatePass provides a common, machine-readable format for expressing authority, mandate, scope, freshness, and evidence.",
  "No signed GatePass. No settlement.",
  "Do not trust the agent. Trust the GatePass.",
  "No proof. No permission.",
  "No mandate. No action.",
] as const;

export type GatePassToolWrapperScenarioId =
  | "valid_low_risk_local_mock_allowed"
  | "identity_only_blocks"
  | "missing_mandate_blocks"
  | "missing_evidence_requires_evidence"
  | "stale_gatepass_blocks"
  | "replayed_nonce_blocks"
  | "tampered_scope_blocks"
  | "tampered_action_blocks"
  | "high_risk_requires_human_review"
  | "settlement_sensitive_requires_signed_gatepass"
  | "unsafe_proven_safe_claim_blocks"
  | "guaranteed_trust_claim_blocks";

export type GatePassToolRiskProfile = "low" | "medium" | "high" | "critical";

export interface GatePassToolWrapperSafetyFlags {
  localDemoOnly: true;
  mockToolExecutionOnly: true;
  realToolExecution: false;
  actionExecution: false;
  networkCalls: false;
  liveAgentFrameworkDependency: false;
  productionMiddleware: false;
  productionCertification: false;
  securityCertification: false;
  legalComplianceGuarantee: false;
  paymentAuthorisation: false;
  settlementAuthorisation: false;
  liveSystemsContact: false;
  directBotMessaging: false;
  liveAgentToAgentCommunication: false;
}

export interface GatePassToolPolicy {
  policyName: string;
  allowedAction: string;
  allowedScope: string;
  riskProfile: GatePassToolRiskProfile;
  requireMandate: boolean;
  requireEvidence: boolean;
  requireFreshGatePass: boolean;
  requireNonce: boolean;
  requireHumanApproval: boolean;
  requireSignedGatePass: boolean;
  settlementSensitive: boolean;
  localDemoOnly: true;
}

export interface GatePassWrapperProofPackage {
  proofPackageId: string;
  evidenceComplete: boolean;
  mandateReferencePresent: boolean;
  claimText?: string;
  localDemoOnly: true;
}

export interface GatePassMockTool<TInput = unknown, TOutput = unknown> {
  toolName: string;
  description: string;
  callLocalMock: (input: TInput) => TOutput;
}

export interface GatePassWrappedToolInput<TInput = unknown> {
  input: TInput;
  requestedAction: string;
  gatePass?: GatePassCore | GatePassRoundTripResult;
  gatePassScenarioId?: GatePassRoundTripScenarioId;
  proofPackage?: GatePassWrapperProofPackage | null;
  localDemoOnly: true;
}

export interface GatePassLocalWrapperReceipt extends GatePassToolWrapperSafetyFlags {
  receiptId: string;
  wrapperVersion: typeof GATEPASS_TOOL_WRAPPER_VERSION;
  toolName: string;
  policyName: string;
  requestedAction: string;
  checkedGatePass: boolean;
  checkedMandate: boolean;
  checkedEvidence: boolean;
  checkedIntent: boolean;
  checkedFreshness: boolean;
  checkedNonce: boolean;
  checkedScope: boolean;
  checkedSignature: boolean;
  checkedHumanApproval: boolean;
  outcome: GatePassDecision;
}

export interface GatePassWrappedToolResult<TOutput = unknown> extends GatePassToolWrapperSafetyFlags {
  wrapperVersion: typeof GATEPASS_TOOL_WRAPPER_VERSION;
  allowed: boolean;
  outcome: GatePassDecision;
  reason: string;
  reasons: string[];
  toolName: string;
  policyName: string;
  requestedAction: string;
  gatePassId: string | null;
  localMockExecuted: boolean;
  localMockResult?: TOutput;
  requiredNextProof: string[];
  receipt: GatePassLocalWrapperReceipt;
  publicContact: typeof GATEPASS_TOOL_WRAPPER_PUBLIC_CONTACT;
  note: "GatePass developer wrapper local demo only; only local mock tool handlers may run, and no real external tool, network call, payment, settlement, production middleware, or action execution occurred.";
}

export interface GatePassWrappedTool<TInput = unknown, TOutput = unknown> {
  tool: GatePassMockTool<TInput, TOutput>;
  policy: GatePassToolPolicy;
  call: (input: GatePassWrappedToolInput<TInput>) => GatePassWrappedToolResult<TOutput>;
}

export interface GatePassToolWrapperScenarioResult extends GatePassWrappedToolResult<Record<string, unknown>> {
  scenarioId: GatePassToolWrapperScenarioId;
  expectedOutcome: GatePassDecision;
  matchedExpectedOutcome: boolean;
}

export interface GatePassToolWrapperDemo extends GatePassToolWrapperSafetyFlags {
  project: "Agent Trust Gate";
  wrapperVersion: typeof GATEPASS_TOOL_WRAPPER_VERSION;
  purpose: string;
  wrapperPattern: "wrapGatePassTool(mockTool, policy).call({ input, gatePass, proofPackage })";
  corePhrases: typeof GATEPASS_TOOL_WRAPPER_CORE_PHRASES;
  scenarioCount: number;
  scenarios: GatePassToolWrapperScenarioResult[];
  safetyBoundary: string;
  publicContact: typeof GATEPASS_TOOL_WRAPPER_PUBLIC_CONTACT;
}

export type GatePassToolWrapperDemoSummary = Omit<GatePassToolWrapperDemo, "scenarios">;

export const GATEPASS_TOOL_WRAPPER_SAFETY_FLAGS: GatePassToolWrapperSafetyFlags = {
  localDemoOnly: true,
  mockToolExecutionOnly: true,
  realToolExecution: false,
  actionExecution: false,
  networkCalls: false,
  liveAgentFrameworkDependency: false,
  productionMiddleware: false,
  productionCertification: false,
  securityCertification: false,
  legalComplianceGuarantee: false,
  paymentAuthorisation: false,
  settlementAuthorisation: false,
  liveSystemsContact: false,
  directBotMessaging: false,
  liveAgentToAgentCommunication: false,
};

const NOTE: GatePassWrappedToolResult["note"] =
  "GatePass developer wrapper local demo only; only local mock tool handlers may run, and no real external tool, network call, payment, settlement, production middleware, or action execution occurred.";

export function createGatePassToolPolicy(
  overrides: Partial<Omit<GatePassToolPolicy, "localDemoOnly">> = {},
): GatePassToolPolicy {
  return {
    policyName: "local_low_risk_gatepass_policy",
    allowedAction: "read_public_docs",
    allowedScope: "read_public_docs",
    riskProfile: "low",
    requireMandate: true,
    requireEvidence: true,
    requireFreshGatePass: true,
    requireNonce: true,
    requireHumanApproval: false,
    requireSignedGatePass: false,
    settlementSensitive: false,
    localDemoOnly: true,
    ...overrides,
  };
}

export function wrapGatePassTool<TInput, TOutput>(
  tool: GatePassMockTool<TInput, TOutput>,
  policy: GatePassToolPolicy,
): GatePassWrappedTool<TInput, TOutput> {
  return {
    tool,
    policy,
    call: (input) => evaluateGatePassToolCall(tool, policy, input),
  };
}

export function evaluateGatePassToolCall<TInput, TOutput>(
  tool: GatePassMockTool<TInput, TOutput>,
  policy: GatePassToolPolicy,
  input: GatePassWrappedToolInput<TInput>,
): GatePassWrappedToolResult<TOutput> {
  const gatePassDecision = evaluateGatePassInput(input, policy);
  const claimDecision = evaluateClaimText(input.proofPackage?.claimText);
  const proofReasons = evaluateProofPackage(input.proofPackage, policy);
  const scopeReasons = evaluatePolicyScope(input, policy, gatePassDecision.gatePass);
  const outcome = decideWrapperOutcome(gatePassDecision.outcome, claimDecision.outcome, proofReasons, scopeReasons, policy);
  const reasons = unique([
    "wrap_gatepass_tool_called",
    "gatepass_checked_before_tool",
    outcome === "allow" ? "valid_gatepass_allows_local_mock_tool_only" : "gatepass_blocked_or_requires_more_proof",
    ...gatePassDecision.reasons,
    ...claimDecision.reasons,
    ...proofReasons,
    ...scopeReasons,
    "real_tool_execution_false",
    "action_execution_false",
    "network_calls_false",
  ]);
  const requiredNextProof = requiredNextProofFor(outcome, reasons, policy);
  const localMockResult = outcome === "allow" ? tool.callLocalMock(input.input) : undefined;
  const base = {
    wrapperVersion: GATEPASS_TOOL_WRAPPER_VERSION,
    allowed: outcome === "allow",
    outcome,
    reason: reasons[0] ?? "gatepass_wrapper_decision",
    reasons,
    toolName: tool.toolName,
    policyName: policy.policyName,
    requestedAction: input.requestedAction,
    gatePassId: gatePassDecision.gatePassId,
    localMockExecuted: outcome === "allow",
    requiredNextProof,
    publicContact: GATEPASS_TOOL_WRAPPER_PUBLIC_CONTACT,
    note: NOTE,
    ...GATEPASS_TOOL_WRAPPER_SAFETY_FLAGS,
  } satisfies Omit<GatePassWrappedToolResult<TOutput>, "receipt" | "localMockResult">;
  const result = {
    ...base,
    ...(localMockResult === undefined ? {} : { localMockResult }),
    receipt: buildLocalWrapperReceipt(base),
  };
  return result;
}

export function buildLocalWrapperReceipt(
  result: Omit<GatePassWrappedToolResult, "receipt" | "localMockResult">,
): GatePassLocalWrapperReceipt {
  return {
    receiptId: `gatepass_wrapper_receipt_${hashSeed([
      result.wrapperVersion,
      result.toolName,
      result.policyName,
      result.requestedAction,
      result.outcome,
      result.reasons.join(","),
    ])}`,
    wrapperVersion: GATEPASS_TOOL_WRAPPER_VERSION,
    toolName: result.toolName,
    policyName: result.policyName,
    requestedAction: result.requestedAction,
    checkedGatePass: true,
    checkedMandate: true,
    checkedEvidence: true,
    checkedIntent: true,
    checkedFreshness: true,
    checkedNonce: true,
    checkedScope: true,
    checkedSignature: true,
    checkedHumanApproval: true,
    outcome: result.outcome,
    ...GATEPASS_TOOL_WRAPPER_SAFETY_FLAGS,
  };
}

export function runGatePassToolWrapperDemo(): GatePassToolWrapperDemo {
  const scenarios = createGatePassToolWrapperScenarios().map((scenario) => {
    const wrapped = wrapGatePassTool(scenario.tool, scenario.policy);
    const result = wrapped.call(scenario.input);
    return {
      scenarioId: scenario.scenarioId,
      expectedOutcome: scenario.expectedOutcome,
      matchedExpectedOutcome: result.outcome === scenario.expectedOutcome,
      ...result,
    };
  });
  return {
    project: "Agent Trust Gate",
    wrapperVersion: GATEPASS_TOOL_WRAPPER_VERSION,
    purpose:
      "Local deterministic developer wrapper showing how wrapGatePassTool gates sensitive local mock tool calls before any action.",
    wrapperPattern: "wrapGatePassTool(mockTool, policy).call({ input, gatePass, proofPackage })",
    corePhrases: GATEPASS_TOOL_WRAPPER_CORE_PHRASES,
    scenarioCount: scenarios.length,
    scenarios,
    safetyBoundary:
      "Local proof-of-concept wrapper only. It may call deterministic local mock handlers after valid proof, but realToolExecution, actionExecution, networkCalls, productionMiddleware, paymentAuthorisation, and settlementAuthorisation remain false.",
    publicContact: GATEPASS_TOOL_WRAPPER_PUBLIC_CONTACT,
    ...GATEPASS_TOOL_WRAPPER_SAFETY_FLAGS,
  };
}

export function summariseGatePassToolWrapperDemo(
  demo: GatePassToolWrapperDemo,
): GatePassToolWrapperDemoSummary {
  const { scenarios: _scenarios, ...summary } = demo;
  return summary;
}

interface WrapperScenarioDefinition {
  scenarioId: GatePassToolWrapperScenarioId;
  expectedOutcome: GatePassDecision;
  tool: GatePassMockTool<Record<string, unknown>, Record<string, unknown>>;
  policy: GatePassToolPolicy;
  input: GatePassWrappedToolInput<Record<string, unknown>>;
}

function createGatePassToolWrapperScenarios(): WrapperScenarioDefinition[] {
  const mockTool = createLocalMockTool("local_publish_draft");
  return [
    scenario("valid_low_risk_local_mock_allowed", "allow", mockTool, createGatePassToolPolicy(), "valid_allow_local"),
    scenario("identity_only_blocks", "block", mockTool, createGatePassToolPolicy(), "identity_only_rejected"),
    scenario("missing_mandate_blocks", "block", mockTool, createGatePassToolPolicy({
      policyName: "local_data_export_policy",
      allowedAction: "export_data",
      allowedScope: "export_data",
      riskProfile: "high",
      requireHumanApproval: true,
    }), "missing_mandate_rejected"),
    scenario("missing_evidence_requires_evidence", "require_evidence", mockTool, createGatePassToolPolicy({
      policyName: "local_public_post_policy",
      allowedAction: "publish_public_post",
      allowedScope: "publish_public_post",
      riskProfile: "medium",
      requireHumanApproval: true,
    }), "missing_evidence_requires_evidence"),
    scenario("stale_gatepass_blocks", "block", mockTool, createGatePassToolPolicy(), "stale_expiry_rejected"),
    scenario("replayed_nonce_blocks", "block", mockTool, createGatePassToolPolicy(), "replayed_nonce_rejected"),
    scenario("tampered_scope_blocks", "block", mockTool, createGatePassToolPolicy({
      policyName: "local_sensitive_tool_policy",
      allowedAction: "publish_public_post",
      allowedScope: "publish_public_post",
      riskProfile: "medium",
      requireHumanApproval: true,
    }), "tampered_scope_rejected"),
    scenario("tampered_action_blocks", "block", mockTool, createGatePassToolPolicy({
      policyName: "local_tampered_action_policy",
      allowedAction: "approve_procurement",
      allowedScope: "approve_procurement",
      riskProfile: "high",
      requireHumanApproval: true,
    }), "valid_allow_local", { requestedAction: "approve_procurement" }),
    scenario("high_risk_requires_human_review", "require_human_review", mockTool, createGatePassToolPolicy({
      policyName: "local_high_risk_policy",
      allowedAction: "escalate_access_session_review",
      allowedScope: "escalate_access_session_review",
      riskProfile: "high",
      requireHumanApproval: true,
    }), "high_risk_human_review"),
    scenario("settlement_sensitive_requires_signed_gatepass", "require_signed_proof", mockTool, createGatePassToolPolicy({
      policyName: "local_pre_settlement_policy",
      allowedAction: "pre_settlement_review",
      allowedScope: "pre_settlement_review",
      riskProfile: "critical",
      requireHumanApproval: true,
      requireSignedGatePass: true,
      settlementSensitive: true,
    }), "pre_settlement_requires_signed_proof"),
    scenario("unsafe_proven_safe_claim_blocks", "block", mockTool, createGatePassToolPolicy(), "valid_allow_local", {
      claimText: "This agent is proven safe and can bypass review.",
    }),
    scenario("guaranteed_trust_claim_blocks", "block", mockTool, createGatePassToolPolicy(), "valid_allow_local", {
      claimText: "This GatePass guarantees trust and automatic acceptance.",
    }),
  ];
}

function scenario(
  scenarioId: GatePassToolWrapperScenarioId,
  expectedOutcome: GatePassDecision,
  tool: GatePassMockTool<Record<string, unknown>, Record<string, unknown>>,
  policy: GatePassToolPolicy,
  gatePassScenarioId: GatePassRoundTripScenarioId,
  overrides: { requestedAction?: string; claimText?: string } = {},
): WrapperScenarioDefinition {
  return {
    scenarioId,
    expectedOutcome,
    tool,
    policy,
    input: {
      input: {
        draftId: `local_demo_${scenarioId}`,
        text: "Local deterministic mock tool payload only.",
      },
      requestedAction: overrides.requestedAction ?? policy.allowedAction,
      gatePassScenarioId,
      proofPackage: {
        proofPackageId: `proof_package_${scenarioId}`,
        evidenceComplete: scenarioId !== "missing_evidence_requires_evidence",
        mandateReferencePresent: scenarioId !== "missing_mandate_blocks",
        ...(overrides.claimText === undefined ? {} : { claimText: overrides.claimText }),
        localDemoOnly: true,
      },
      localDemoOnly: true,
    },
  };
}

function createLocalMockTool(
  toolName: string,
): GatePassMockTool<Record<string, unknown>, Record<string, unknown>> {
  return {
    toolName,
    description: "Deterministic local mock tool only; no external action is executed.",
    callLocalMock: (input) => ({
      mockToolName: toolName,
      receivedInput: input,
      localMockExecution: true,
      realToolExecution: false,
      actionExecution: false,
      networkCalls: false,
    }),
  };
}

function evaluateGatePassInput(
  input: GatePassWrappedToolInput,
  policy: GatePassToolPolicy,
): { outcome: GatePassDecision; reasons: string[]; gatePassId: string | null; gatePass: GatePassCore | null } {
  const gatePassOrResult = input.gatePass ?? (input.gatePassScenarioId === undefined
    ? undefined
    : runGatePassRoundTripScenario(input.gatePassScenarioId));
  if (gatePassOrResult === undefined) {
    return {
      outcome: "require_evidence",
      reasons: ["missing_gatepass", "no_proof_means_no_permission"],
      gatePassId: null,
      gatePass: null,
    };
  }
  if (isRoundTripResult(gatePassOrResult)) {
    return {
      outcome: gatePassOrResult.decision,
      reasons: gatePassOrResult.reasons,
      gatePassId: gatePassOrResult.gatePassId,
      gatePass: gatePassOrResult.gatePass,
    };
  }
  const validation = validateGatePassCore(gatePassOrResult);
  const reasons = [
    ...validation.reasons,
    ...policyRequireReasons(policy, gatePassOrResult),
  ];
  return {
    outcome: policyDecision(validation.decision, reasons),
    reasons,
    gatePassId: gatePassOrResult.jti,
    gatePass: gatePassOrResult,
  };
}

function evaluateClaimText(claimText: string | undefined): { outcome: GatePassDecision; reasons: string[] } {
  if (claimText === undefined || claimText.trim().length === 0) return { outcome: "allow", reasons: [] };
  const classification = classifyTrustLanguagePhrase(claimText);
  if (classification.decision === "rejected") {
    return {
      outcome: "block",
      reasons: [
        "unsafe_claim_rejected",
        ...classification.reasons,
      ],
    };
  }
  return { outcome: "allow", reasons: ["claim_text_checked"] };
}

function evaluateProofPackage(
  proofPackage: GatePassWrapperProofPackage | null | undefined,
  policy: GatePassToolPolicy,
): string[] {
  if (proofPackage === null || proofPackage === undefined) return ["missing_proof_package"];
  const reasons: string[] = ["proof_package_checked"];
  if (policy.requireEvidence && !proofPackage.evidenceComplete) reasons.push("proof_package_missing_evidence");
  if (policy.requireMandate && !proofPackage.mandateReferencePresent) reasons.push("proof_package_missing_mandate");
  return reasons;
}

function evaluatePolicyScope(
  input: GatePassWrappedToolInput,
  policy: GatePassToolPolicy,
  gatePass: GatePassCore | null,
): string[] {
  const reasons: string[] = [];
  if (input.requestedAction !== policy.allowedAction) reasons.push("requested_action_outside_policy");
  if (gatePass !== null && !gatePass.scope.permittedActions.includes(input.requestedAction)) {
    reasons.push("gatepass_scope_mismatch");
  }
  if (policy.settlementSensitive && policy.requireSignedGatePass && gatePass?.signature.status !== "present") {
    reasons.push("settlement_sensitive_requires_signed_gatepass");
  }
  return reasons;
}

function decideWrapperOutcome(
  gatePassOutcome: GatePassDecision,
  claimOutcome: GatePassDecision,
  proofReasons: readonly string[],
  scopeReasons: readonly string[],
  policy: GatePassToolPolicy,
): GatePassDecision {
  if (claimOutcome === "block") return "block";
  if (proofReasons.includes("proof_package_missing_mandate")) return "block";
  if (scopeReasons.includes("requested_action_outside_policy") || scopeReasons.includes("gatepass_scope_mismatch")) {
    return "block";
  }
  if (gatePassOutcome === "block") return "block";
  if (
    gatePassOutcome === "require_signed_proof"
    || scopeReasons.includes("settlement_sensitive_requires_signed_gatepass")
    || (policy.settlementSensitive && policy.requireSignedGatePass && gatePassOutcome !== "allow")
  ) {
    return "require_signed_proof";
  }
  if (proofReasons.includes("proof_package_missing_evidence") || gatePassOutcome === "require_evidence") {
    return "require_evidence";
  }
  if (gatePassOutcome === "require_human_review") return "require_human_review";
  if (gatePassOutcome === "escalate") return "escalate";
  return gatePassOutcome;
}

function policyRequireReasons(policy: GatePassToolPolicy, gatePass: GatePassCore): string[] {
  const reasons: string[] = [];
  if (policy.requireMandate && gatePass.mandate.status === "missing") reasons.push("missing_mandate");
  if (policy.requireEvidence && gatePass.evidence.status === "missing") reasons.push("missing_evidence");
  if (policy.requireNonce && gatePass.nonce.trim().length === 0) reasons.push("missing_nonce");
  if (policy.requireHumanApproval && gatePass.approval.status !== "approved") {
    reasons.push("high_risk_requires_human_review");
  }
  if (policy.requireSignedGatePass && gatePass.signature.status !== "present") reasons.push("missing_signature");
  return reasons;
}

function policyDecision(validationDecision: GatePassDecision, reasons: readonly string[]): GatePassDecision {
  if (reasons.some((reason) => ["missing_mandate", "missing_nonce"].includes(reason))) return "block";
  if (reasons.includes("missing_signature")) return "require_signed_proof";
  if (reasons.includes("missing_evidence")) return "require_evidence";
  if (reasons.includes("high_risk_requires_human_review")) return "require_human_review";
  return validationDecision;
}

function requiredNextProofFor(
  outcome: GatePassDecision,
  reasons: readonly string[],
  policy: GatePassToolPolicy,
): string[] {
  if (outcome === "allow") return ["record_local_wrapper_receipt", "local_mock_tool_only", "do_not_execute_real_action"];
  const next: string[] = [];
  if (outcome === "require_evidence" || reasons.includes("proof_package_missing_evidence")) {
    next.push("provide_evidence_reference", "bind_evidence_to_gatepass_scope");
  }
  if (outcome === "require_human_review") next.push("obtain_human_review", "bind_approval_to_gatepass");
  if (outcome === "require_signed_proof" || policy.requireSignedGatePass) {
    next.push("provide_signed_gatepass", "bind_signature_to_nonce_scope_and_expiry");
  }
  if (outcome === "block") next.push("stop_tool_call", "present_scoped_fresh_gatepass");
  return unique(next);
}

function isRoundTripResult(value: GatePassCore | GatePassRoundTripResult): value is GatePassRoundTripResult {
  return "roundTripVersion" in value && "gatePass" in value && "decision" in value;
}

function hashSeed(values: readonly string[]): string {
  let hash = 0;
  const seed = values.join("|");
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return hash.toString(16).padStart(8, "0").slice(0, 12);
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}
