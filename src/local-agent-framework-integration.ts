import {
  GATEPASS_TOOL_WRAPPER_CORE_PHRASES,
  GATEPASS_TOOL_WRAPPER_PUBLIC_CONTACT,
  GATEPASS_TOOL_WRAPPER_SAFETY_FLAGS,
  GATEPASS_TOOL_WRAPPER_VERSION,
  createGatePassToolPolicy,
  wrapGatePassTool,
  type GatePassMockTool,
  type GatePassToolPolicy,
  type GatePassToolWrapperSafetyFlags,
  type GatePassWrappedToolInput,
  type GatePassWrappedToolResult,
} from "./gatepass-tool-wrapper.js";
import type { GatePassDecision } from "./gatepass-core.js";
import type { GatePassRoundTripScenarioId } from "./gatepass-round-trip.js";

export const LOCAL_AGENT_FRAMEWORK_INTEGRATION_VERSION =
  "atg.local-agent-framework-integration.local.v1" as const;

export type LocalAgentFrameworkIntegrationStepId =
  | "langgraph_style_allowed_low_risk"
  | "langgraph_style_identity_only_blocked"
  | "langgraph_style_requires_evidence"
  | "langgraph_style_requires_human_review"
  | "langgraph_style_requires_signed_gatepass";

export interface LocalAgentFrameworkStepRequest {
  stepId: LocalAgentFrameworkIntegrationStepId;
  stepName: string;
  requestedAction: string;
  gatePassScenarioId: GatePassRoundTripScenarioId;
  expectedOutcome: GatePassDecision;
  policy: GatePassToolPolicy;
}

export interface LocalAgentFrameworkStepResult extends GatePassToolWrapperSafetyFlags {
  integrationVersion: typeof LOCAL_AGENT_FRAMEWORK_INTEGRATION_VERSION;
  frameworkPattern: "LangGraph-style local integration pattern";
  noLangGraphDependency: true;
  noExternalNetworkCall: true;
  noLiveAgentFrameworkExecution: true;
  stepId: LocalAgentFrameworkIntegrationStepId;
  stepName: string;
  expectedOutcome: GatePassDecision;
  matchedExpectedOutcome: boolean;
  wrapperResult: GatePassWrappedToolResult<Record<string, unknown>>;
}

export interface LocalAgentFrameworkIntegrationDemo extends GatePassToolWrapperSafetyFlags {
  project: "Agent Trust Gate";
  integrationVersion: typeof LOCAL_AGENT_FRAMEWORK_INTEGRATION_VERSION;
  wrapperVersion: typeof GATEPASS_TOOL_WRAPPER_VERSION;
  purpose: string;
  frameworkPattern: "LangGraph-style local integration pattern";
  noLangGraphDependency: true;
  noExternalNetworkCall: true;
  noLiveAgentFrameworkExecution: true;
  corePhrases: typeof GATEPASS_TOOL_WRAPPER_CORE_PHRASES;
  stepCount: number;
  steps: LocalAgentFrameworkStepResult[];
  safetyBoundary: string;
  publicContact: typeof GATEPASS_TOOL_WRAPPER_PUBLIC_CONTACT;
}

export type LocalAgentFrameworkIntegrationSummary = Omit<LocalAgentFrameworkIntegrationDemo, "steps">;

export function runLocalAgentFrameworkIntegrationExample(): LocalAgentFrameworkIntegrationDemo {
  const mockTool = createFrameworkMockTool();
  const steps = createLocalAgentFrameworkStepRequests().map((request) =>
    evaluateLocalAgentFrameworkStep(mockTool, request),
  );
  return {
    project: "Agent Trust Gate",
    integrationVersion: LOCAL_AGENT_FRAMEWORK_INTEGRATION_VERSION,
    wrapperVersion: GATEPASS_TOOL_WRAPPER_VERSION,
    purpose:
      "Framework-inspired local adapter showing a LangGraph-style step routing proposed tool calls through wrapGatePassTool before local mock execution.",
    frameworkPattern: "LangGraph-style local integration pattern",
    noLangGraphDependency: true,
    noExternalNetworkCall: true,
    noLiveAgentFrameworkExecution: true,
    corePhrases: GATEPASS_TOOL_WRAPPER_CORE_PHRASES,
    stepCount: steps.length,
    steps,
    safetyBoundary:
      "Local framework-inspired adapter only. It imports no LangGraph package, makes no network call, executes no live agent framework, and only allows deterministic local mock tool output after GatePass checks.",
    publicContact: GATEPASS_TOOL_WRAPPER_PUBLIC_CONTACT,
    ...GATEPASS_TOOL_WRAPPER_SAFETY_FLAGS,
  };
}

export function summariseLocalAgentFrameworkIntegration(
  demo: LocalAgentFrameworkIntegrationDemo,
): LocalAgentFrameworkIntegrationSummary {
  const { steps: _steps, ...summary } = demo;
  return summary;
}

export function createLocalAgentFrameworkStepRequests(): LocalAgentFrameworkStepRequest[] {
  return [
    {
      stepId: "langgraph_style_allowed_low_risk",
      stepName: "local_agent_step_read_public_docs",
      requestedAction: "read_public_docs",
      gatePassScenarioId: "valid_allow_local",
      expectedOutcome: "allow",
      policy: createGatePassToolPolicy({
        policyName: "framework_low_risk_policy",
        allowedAction: "read_public_docs",
        allowedScope: "read_public_docs",
        riskProfile: "low",
      }),
    },
    {
      stepId: "langgraph_style_identity_only_blocked",
      stepName: "local_agent_step_identity_only",
      requestedAction: "read_public_docs",
      gatePassScenarioId: "identity_only_rejected",
      expectedOutcome: "block",
      policy: createGatePassToolPolicy({
        policyName: "framework_identity_check_policy",
        allowedAction: "read_public_docs",
        allowedScope: "read_public_docs",
        riskProfile: "low",
      }),
    },
    {
      stepId: "langgraph_style_requires_evidence",
      stepName: "local_agent_step_publish_draft",
      requestedAction: "publish_public_post",
      gatePassScenarioId: "missing_evidence_requires_evidence",
      expectedOutcome: "require_evidence",
      policy: createGatePassToolPolicy({
        policyName: "framework_evidence_required_policy",
        allowedAction: "publish_public_post",
        allowedScope: "publish_public_post",
        riskProfile: "medium",
        requireHumanApproval: true,
      }),
    },
    {
      stepId: "langgraph_style_requires_human_review",
      stepName: "local_agent_step_access_escalation",
      requestedAction: "escalate_access_session_review",
      gatePassScenarioId: "high_risk_human_review",
      expectedOutcome: "require_human_review",
      policy: createGatePassToolPolicy({
        policyName: "framework_human_review_policy",
        allowedAction: "escalate_access_session_review",
        allowedScope: "escalate_access_session_review",
        riskProfile: "high",
        requireHumanApproval: true,
      }),
    },
    {
      stepId: "langgraph_style_requires_signed_gatepass",
      stepName: "local_agent_step_pre_settlement",
      requestedAction: "pre_settlement_review",
      gatePassScenarioId: "pre_settlement_requires_signed_proof",
      expectedOutcome: "require_signed_proof",
      policy: createGatePassToolPolicy({
        policyName: "framework_pre_settlement_policy",
        allowedAction: "pre_settlement_review",
        allowedScope: "pre_settlement_review",
        riskProfile: "critical",
        requireHumanApproval: true,
        requireSignedGatePass: true,
        settlementSensitive: true,
      }),
    },
  ];
}

export function evaluateLocalAgentFrameworkStep(
  tool: GatePassMockTool<Record<string, unknown>, Record<string, unknown>>,
  request: LocalAgentFrameworkStepRequest,
): LocalAgentFrameworkStepResult {
  const wrappedTool = wrapGatePassTool(tool, request.policy);
  const input: GatePassWrappedToolInput<Record<string, unknown>> = {
    input: {
      stepId: request.stepId,
      stepName: request.stepName,
      payload: "local framework-inspired payload only",
    },
    requestedAction: request.requestedAction,
    gatePassScenarioId: request.gatePassScenarioId,
    proofPackage: {
      proofPackageId: `framework_proof_${request.stepId}`,
      evidenceComplete: request.stepId !== "langgraph_style_requires_evidence",
      mandateReferencePresent: request.stepId !== "langgraph_style_identity_only_blocked",
      localDemoOnly: true,
    },
    localDemoOnly: true,
  };
  const wrapperResult = wrappedTool.call(input);
  return {
    integrationVersion: LOCAL_AGENT_FRAMEWORK_INTEGRATION_VERSION,
    frameworkPattern: "LangGraph-style local integration pattern",
    noLangGraphDependency: true,
    noExternalNetworkCall: true,
    noLiveAgentFrameworkExecution: true,
    stepId: request.stepId,
    stepName: request.stepName,
    expectedOutcome: request.expectedOutcome,
    matchedExpectedOutcome: wrapperResult.outcome === request.expectedOutcome,
    wrapperResult,
    ...GATEPASS_TOOL_WRAPPER_SAFETY_FLAGS,
  };
}

function createFrameworkMockTool(): GatePassMockTool<Record<string, unknown>, Record<string, unknown>> {
  return {
    toolName: "local_framework_mock_tool",
    description: "Framework-inspired local mock tool only; no live framework or external tool executes.",
    callLocalMock: (input) => ({
      frameworkPattern: "LangGraph-style local integration pattern",
      localMockTool: "local_framework_mock_tool",
      receivedInput: input,
      localMockExecution: true,
      realToolExecution: false,
      actionExecution: false,
      networkCalls: false,
    }),
  };
}
