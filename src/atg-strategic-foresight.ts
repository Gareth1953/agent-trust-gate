export const ATG_STRATEGIC_FORESIGHT_VERSION =
  "atg.strategic-foresight.local.v1" as const;

export const ATG_STRATEGIC_FORESIGHT_CONTACT = "gpmiddleton71@gmail.com" as const;

export const ATG_STRATEGIC_FORESIGHT_WORKFLOW = [
  "Watch",
  "Analyse",
  "Compare",
  "Recommend",
  "Gareth approves",
  "Dave creates build mission",
  "Codex implements locally",
] as const;

export const ATG_STRATEGIC_FORESIGHT_CORE_PHRASES = [
  "GatePass is a scoped, time-bound, action-specific proof primitive for agent actions.",
  "GatePass provides a common, machine-readable format for expressing authority, mandate, scope, freshness, and evidence.",
  "No signed GatePass. No settlement.",
  "Do not trust the agent. Trust the GatePass.",
  "No proof. No permission.",
  "No mandate. No action.",
] as const;

export interface ForesightSafetyFlags {
  localDemoOnly: true;
  advisoryOnly: true;
  manualInputOnly: true;
  liveMonitoring: false;
  autonomousLearning: false;
  autonomousProductChanges: false;
  autonomousRoadmapChanges: false;
  autonomousCodeChanges: false;
  autonomousOutreach: false;
  scraping: false;
  networkCalls: false;
  liveAgentContact: false;
  directBotMessaging: false;
  actionExecution: false;
  predictionGuarantee: false;
  humanApprovalRequired: true;
}

export interface ForesightCategory {
  id: string;
  name: string;
  whatToWatchManually: string;
  whyItMattersToATG: string;
  possibleUpgradeImplications: string[];
  affects: string[];
}

export interface ForesightSignal extends Pick<ForesightSafetyFlags, "localDemoOnly" | "manualInputOnly"> {
  id: string;
  categoryId: string;
  title: string;
  sourceType: "manual_sample";
  summary: string;
  observedSignal: string;
  affects: string[];
}

export interface ForesightScore {
  relevanceToGatePass: number;
  urgency: number;
  commercialImpact: number;
  technicalFeasibility: number;
  reviewerCredibilityImpact: number;
  safetyRisk: number;
  implementationComplexity: number;
  dependencyRisk: number;
  humanApprovalRequired: true;
}

export interface ForesightRecommendation extends Pick<
  ForesightSafetyFlags,
  | "localDemoOnly"
  | "advisoryOnly"
  | "manualInputOnly"
  | "autonomousProductChanges"
  | "autonomousRoadmapChanges"
  | "autonomousCodeChanges"
  | "humanApprovalRequired"
> {
  id: string;
  signalId: string;
  title: string;
  rationale: string;
  recommendedMissionType: string;
  recommendedNextStep: string;
  score: ForesightScore;
  status: "advisory_requires_gareth_approval";
  buildAutomatically: false;
}

export interface ForesightReport extends ForesightSafetyFlags {
  project: "Agent Trust Gate";
  purpose: string;
  layerName: "ATG Strategic Foresight Layer";
  version: typeof ATG_STRATEGIC_FORESIGHT_VERSION;
  corePhrases: typeof ATG_STRATEGIC_FORESIGHT_CORE_PHRASES;
  workflow: typeof ATG_STRATEGIC_FORESIGHT_WORKFLOW;
  signalCategories: ForesightCategory[];
  sampleSignals: ForesightSignal[];
  recommendedMissions: ForesightRecommendation[];
  safetyBoundary: string;
  publicContact: typeof ATG_STRATEGIC_FORESIGHT_CONTACT;
  gatePassHeadline: string;
  agentTrustLanguageRole: "supporting_material_only";
}

export const ATG_STRATEGIC_FORESIGHT_SAFETY_FLAGS: ForesightSafetyFlags = {
  localDemoOnly: true,
  advisoryOnly: true,
  manualInputOnly: true,
  liveMonitoring: false,
  autonomousLearning: false,
  autonomousProductChanges: false,
  autonomousRoadmapChanges: false,
  autonomousCodeChanges: false,
  autonomousOutreach: false,
  scraping: false,
  networkCalls: false,
  liveAgentContact: false,
  directBotMessaging: false,
  actionExecution: false,
  predictionGuarantee: false,
  humanApprovalRequired: true,
};

export function getForesightSignalCategories(): ForesightCategory[] {
  return [
    category("ai_agent_frameworks", "AI agent frameworks", "local agent execution patterns and approval hooks", "GatePass should fit where developers intercept agent actions", ["local adapters", "wrapper examples"], ["GatePass", "wrapper", "reviewer kit"]),
    category("tool_calling_patterns", "tool-calling patterns", "tool descriptions, call boundaries, approvals, and audit trails", "Sensitive tool calls need pre-action proof gates", ["policy examples", "tool-call receipts"], ["wrapper", "scorecard"]),
    category("developer_wrapper_patterns", "developer wrapper patterns", "minimal SDK ergonomics and copy-paste examples", "Reviewers value simple local proof gates", ["smaller wrapper API examples"], ["wrapper", "reviewer kit"]),
    category("mcp_style_protocols", "MCP-style protocols", "local protocol shapes, tool schemas, and permission models", "Future protocol readiness may need GatePass mapping", ["local contract mapping docs"], ["GatePass", "future protocol readiness"]),
    category("agent_to_agent_protocols", "agent-to-agent protocols", "identity, delegation, handoff, and authority claims", "Claimed identity alone is not trust", ["proof challenge and handoff checks"], ["GatePass", "VerificationContract"]),
    category("ai_payment_protocols", "AI payment protocols", "pre-payment authorisation and settlement concepts", "Money-adjacent actions need pre-settlement gates", ["pre-settlement proof requirements"], ["pre-settlement"]),
    category("machine_to_machine_payment_signals", "machine-to-machine payment signals", "automated payment preparation and delegation signals", "ATG must separate preparation from authorisation", ["no-settlement boundary examples"], ["pre-settlement", "scorecard"]),
    category("pre_settlement_trust_signals", "pre-settlement trust signals", "mandate, evidence, signed proof, freshness, and replay requirements", "No signed GatePass. No settlement.", ["settlement-sensitive scenarios"], ["GatePass", "pre-settlement"]),
    category("agent_security_governance_competitors", "agent security/governance competitors", "review language, proof claims, and governance workflows", "Competitor framing helps avoid overclaiming", ["claims boundary and reviewer artifacts"], ["scorecard", "reviewer kit"]),
    category("enterprise_agent_adoption", "enterprise agent adoption", "procurement, approval, audit, and access-control concerns", "Enterprise workflows need evidence before action", ["governance review examples"], ["reviewer kit", "wrapper"]),
    category("developer_integration_trends", "developer integration trends", "local package ergonomics and examples", "GatePass must be easy to inspect and run", ["package ergonomics and local adapters"], ["wrapper", "reviewer kit"]),
    category("agi_agent_risk_signals", "AGI and agent-risk signals", "high-autonomy risk and tool-use escalation", "ATG should stay scoped and cautious", ["human-review and escalation scenarios"], ["scorecard", "safety boundary"]),
    category("quantum_computing_signals", "quantum computing signals", "long-term cryptographic risk discussion", "GatePass should not claim production-grade crypto", ["watch-only post-quantum readiness notes"], ["future protocol readiness"]),
    category("post_quantum_security_signals", "post-quantum security signals", "migration discussions and signature expectations", "Future signed proof may need crypto-agility planning", ["local crypto-agility planning only"], ["GatePass", "future protocol readiness"]),
    category("standards_regulation_signals", "standards and regulation signals", "emerging proof, audit, agent, and payment requirements", "Standards may influence schema shape", ["schema mapping and terminology updates"], ["VerificationContract"]),
    category("reviewer_developer_feedback", "reviewer/developer feedback signals", "confusion, friction, requested demos, and missing examples", "External feedback improves usefulness", ["measurable local demo missions"], ["reviewer kit", "wrapper", "scorecard"]),
  ];
}

export function createForesightSampleSignals(): ForesightSignal[] {
  return [
    signal("manual_wrapper_demand", "developer_wrapper_patterns", "Developer wrapper demand increasing", "Reviewers and developers value a small wrapTool-style pattern before sensitive actions.", "agent framework wrapper demand increasing", ["wrapper", "reviewer kit"]),
    signal("manual_pre_settlement_trust", "pre_settlement_trust_signals", "Pre-settlement trust remains central", "Settlement-sensitive workflows should keep requiring mandate, evidence, freshness, nonce, and signed GatePass checks.", "pre-settlement trust gaining importance", ["GatePass", "pre-settlement", "scorecard"]),
    signal("manual_agent_protocol_movement", "agent_to_agent_protocols", "Agent-to-agent protocol discussion should be watched", "Delegation and claimed identity may need local proof challenge examples without live agent-to-agent communication.", "agent-to-agent protocol discussions increasing", ["GatePass", "VerificationContract"]),
    signal("manual_post_quantum_watch", "post_quantum_security_signals", "Post-quantum readiness should be watched but not claimed", "Future signed proof designs may need crypto-agility planning, while current code makes no production-grade crypto claim.", "post-quantum readiness should be watched but not claimed", ["GatePass", "future protocol readiness"]),
    signal("manual_reviewer_focus", "reviewer_developer_feedback", "Reviewer feedback favours measurable demos", "Keep GatePass measurable, reviewer-friendly, and copy-paste useful rather than expanding broad concepts.", "reviewer feedback wants one-command demos and fewer broad concepts", ["reviewer kit", "scorecard", "wrapper"]),
  ];
}

export function scoreForesightSignal(signalInput: ForesightSignal): ForesightScore {
  const affectsGatePass = signalInput.affects.some((item) => /gatepass/i.test(item));
  const affectsWrapper = signalInput.affects.some((item) => /wrapper/i.test(item));
  const affectsReviewer = signalInput.affects.some((item) => /reviewer|scorecard/i.test(item));
  const protocolOrQuantum = /protocol|quantum/i.test(signalInput.categoryId);
  const paymentOrSettlement = /payment|settlement/i.test(signalInput.categoryId);

  return {
    relevanceToGatePass: clampScore(affectsGatePass ? 5 : 4),
    urgency: clampScore(paymentOrSettlement || affectsReviewer ? 4 : 3),
    commercialImpact: clampScore(affectsWrapper || affectsReviewer ? 4 : 3),
    technicalFeasibility: clampScore(protocolOrQuantum ? 3 : 4),
    reviewerCredibilityImpact: clampScore(affectsReviewer || affectsWrapper ? 5 : 3),
    safetyRisk: clampScore(paymentOrSettlement || protocolOrQuantum ? 4 : 3),
    implementationComplexity: clampScore(protocolOrQuantum ? 4 : 3),
    dependencyRisk: clampScore(protocolOrQuantum ? 4 : 2),
    humanApprovalRequired: true,
  };
}

export function buildForesightRecommendation(signalInput: ForesightSignal): ForesightRecommendation {
  const score = scoreForesightSignal(signalInput);
  return {
    id: `future_mission_candidate_${signalInput.id}`,
    signalId: signalInput.id,
    title: recommendationTitle(signalInput),
    rationale:
      `Manual local signal "${signalInput.title}" may affect ${signalInput.affects.join(", ")}. ` +
      "Consider a future mission only if Gareth approves.",
    recommendedMissionType: "future_local_build_mission_candidate",
    recommendedNextStep:
      "Gareth reviews the advisory recommendation. If approved, Dave creates a bounded build mission and Codex implements locally.",
    score,
    status: "advisory_requires_gareth_approval",
    buildAutomatically: false,
    localDemoOnly: true,
    advisoryOnly: true,
    manualInputOnly: true,
    autonomousProductChanges: false,
    autonomousRoadmapChanges: false,
    autonomousCodeChanges: false,
    humanApprovalRequired: true,
  };
}

export function buildStrategicForesightReport(
  sampleSignals: ForesightSignal[] = createForesightSampleSignals(),
): ForesightReport {
  return {
    project: "Agent Trust Gate",
    purpose:
      "Local deterministic strategic foresight advisory report for manually supplied AI-agent market, protocol, risk, and readiness signals.",
    layerName: "ATG Strategic Foresight Layer",
    version: ATG_STRATEGIC_FORESIGHT_VERSION,
    corePhrases: ATG_STRATEGIC_FORESIGHT_CORE_PHRASES,
    workflow: ATG_STRATEGIC_FORESIGHT_WORKFLOW,
    signalCategories: getForesightSignalCategories(),
    sampleSignals,
    recommendedMissions: sampleSignals.map(buildForesightRecommendation),
    safetyBoundary: getForesightSafetyBoundary(),
    publicContact: ATG_STRATEGIC_FORESIGHT_CONTACT,
    gatePassHeadline: "GatePass remains the headline scoped, time-bound, action-specific proof primitive.",
    agentTrustLanguageRole: "supporting_material_only",
    ...ATG_STRATEGIC_FORESIGHT_SAFETY_FLAGS,
  };
}

export function getForesightSafetyBoundary(): string {
  return (
    "Local advisory layer only. No live monitoring, scraping, network calls, autonomous learning, " +
    "autonomous outreach, autonomous product changes, autonomous roadmap changes, autonomous code changes, " +
    "prediction guarantee, live agent contact, direct bot messaging, payment authorisation, settlement " +
    "authorisation, or action execution. Human approval is required before any build mission."
  );
}

export function summariseStrategicForesightReport(report: ForesightReport = buildStrategicForesightReport()) {
  return {
    project: report.project,
    layerName: report.layerName,
    version: report.version,
    recommendedFirstReviewerCommand: "npm run demo:reviewer-kit",
    foresightCommand: "npm run demo:foresight",
    workflow: report.workflow,
    signalCategoryCount: report.signalCategories.length,
    sampleSignalCount: report.sampleSignals.length,
    recommendedMissionCount: report.recommendedMissions.length,
    safetyBoundary: report.safetyBoundary,
    publicContact: report.publicContact,
    gatePassHeadline: report.gatePassHeadline,
    agentTrustLanguageRole: report.agentTrustLanguageRole,
    ...ATG_STRATEGIC_FORESIGHT_SAFETY_FLAGS,
  };
}

function category(
  id: string,
  name: string,
  whatToWatchManually: string,
  whyItMattersToATG: string,
  possibleUpgradeImplications: string[],
  affects: string[],
): ForesightCategory {
  return { id, name, whatToWatchManually, whyItMattersToATG, possibleUpgradeImplications, affects };
}

function signal(
  id: string,
  categoryId: string,
  title: string,
  summary: string,
  observedSignal: string,
  affects: string[],
): ForesightSignal {
  return {
    id,
    categoryId,
    title,
    sourceType: "manual_sample",
    summary,
    observedSignal,
    affects,
    localDemoOnly: true,
    manualInputOnly: true,
  };
}

function recommendationTitle(signalInput: ForesightSignal): string {
  if (signalInput.id === "manual_wrapper_demand") return "Consider a future local wrapper ergonomics mission";
  if (signalInput.id === "manual_pre_settlement_trust") {
    return "Consider a future pre-settlement GatePass hardening mission";
  }
  if (signalInput.id === "manual_post_quantum_watch") {
    return "Consider a future crypto-agility notes mission without production crypto claims";
  }
  if (signalInput.id === "manual_reviewer_focus") {
    return "Consider a future reviewer evidence and demo-friction reduction mission";
  }
  return "Consider a future local proof-readiness mission";
}

function clampScore(value: number): number {
  return Math.max(1, Math.min(5, value));
}

