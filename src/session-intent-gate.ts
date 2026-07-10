import { createHash } from "node:crypto";

export const SESSION_INTENT_GATE_VERSION = "atg.session-intent-gate.local-concept.v1" as const;
export const SESSION_INTENT_GATE_RULE =
  "No mandate. No evidence. No verified intent. No signed gate pass. No settlement." as const;
export const SESSION_INTENT_PUBLIC_CONTACT = "gpmiddleton71@gmail.com" as const;

export type SessionIntentDecision =
  | "allow"
  | "throttle"
  | "block"
  | "escalate"
  | "require_evidence"
  | "require_human_review";

export type ClaimedAgentType =
  | "known_ai_agent"
  | "agentic_browser"
  | "crawler"
  | "automation_client"
  | "unknown";

export type VerifiedIntentStatus = "verified" | "unverified" | "missing" | "conflicting";
export type SessionPattern =
  | "beneficial_referral"
  | "research_preview"
  | "extractive_bulk"
  | "sensitive_workflow"
  | "spoofed_identity"
  | "unknown";
export type RequestVolumeTier = "low" | "medium" | "high" | "burst";
export type SessionRiskTier = "low" | "medium" | "high" | "critical";
export type FreshnessStatus = "fresh" | "stale" | "missing";

export type BehaviourSignal =
  | "declared_purpose_matches_session"
  | "referral_like_navigation"
  | "respects_local_rate_limit"
  | "bulk_fetch_pattern"
  | "extractive_collection_pattern"
  | "identity_claim_conflicts_with_behaviour"
  | "known_agent_name_without_verifier"
  | "sensitive_route_requested"
  | "no_referral_context"
  | "human_review_requested";

export type SessionIntentScenarioId =
  | "claimed_known_agent_allowed"
  | "spoofed_agent_blocked"
  | "extractive_pattern_throttled"
  | "missing_mandate_escalated"
  | "high_risk_human_review"
  | "valid_local_control";

export interface SessionIntentGateInput {
  scenarioId: string;
  claimedAgentName: string;
  claimedAgentType: ClaimedAgentType;
  claimedPurpose: string;
  mandateId: string | null;
  evidenceId: string | null;
  verifiedIntentStatus: VerifiedIntentStatus;
  sessionPattern: SessionPattern;
  requestVolumeTier: RequestVolumeTier;
  behaviourSignals: BehaviourSignal[];
  riskTier: SessionRiskTier;
  freshnessStatus: FreshnessStatus;
  localDemoOnly: boolean;
}

export interface SessionIntentGateSafetyFlags {
  localDemoOnly: true;
  localOnly: true;
  liveTrafficMonitoring: false;
  botDetectionProduct: false;
  realBotDetection: false;
  crawlerBlocking: false;
  browserFingerprinting: false;
  realUserTracking: false;
  scraping: false;
  analyticsTracking: false;
  telemetry: false;
  networkCallPerformed: false;
  cloudCallPerformed: false;
  externalAgentContacted: false;
  autonomousContact: false;
  paymentAuthorisation: false;
  settlementAuthorisation: false;
  productionSigning: false;
  actionExecution: false;
}

export interface SessionIntentGateResult extends SessionIntentGateSafetyFlags {
  modelVersion: typeof SESSION_INTENT_GATE_VERSION;
  scenarioId: string;
  decision: SessionIntentDecision;
  claimedAgentName: string;
  claimedAgentType: ClaimedAgentType;
  claimedPurpose: string;
  sessionPattern: SessionPattern;
  requestVolumeTier: RequestVolumeTier;
  riskTier: SessionRiskTier;
  freshnessStatus: FreshnessStatus;
  claimedIdentityAloneTrusted: false;
  trustBasis: string[];
  reasons: string[];
  requiredNextSteps: string[];
  publicContactEmail: typeof SESSION_INTENT_PUBLIC_CONTACT;
  note: "Local concept model only; no live traffic monitoring, real bot detection, crawler blocking, browser fingerprinting, tracking, payment, settlement, network call, external-agent contact, or action execution occurred.";
}

export interface SessionIntentGatePack extends SessionIntentGateSafetyFlags {
  packVersion: typeof SESSION_INTENT_GATE_VERSION;
  packId: string;
  rule: typeof SESSION_INTENT_GATE_RULE;
  principle: "Claimed agent identity is not trust. Behaviour, mandate, evidence, verified intent, and session context must decide access.";
  scenarioCount: number;
  decisions: Record<SessionIntentDecision, number>;
  publicContactEmail: typeof SESSION_INTENT_PUBLIC_CONTACT;
  note: SessionIntentGateResult["note"];
  scenarios: SessionIntentGateResult[];
}

export type SessionIntentGatePackSummary = Omit<SessionIntentGatePack, "scenarios">;

export const SESSION_INTENT_EXAMPLE_FILES: Record<SessionIntentScenarioId, string> = {
  claimed_known_agent_allowed: "examples/session-intent-claimed-known-agent-allowed.json",
  spoofed_agent_blocked: "examples/session-intent-spoofed-agent-blocked.json",
  extractive_pattern_throttled: "examples/session-intent-extractive-pattern-throttled.json",
  missing_mandate_escalated: "examples/session-intent-missing-mandate-escalated.json",
  high_risk_human_review: "examples/session-intent-high-risk-human-review.json",
  valid_local_control: "examples/session-intent-valid-local-control.json",
};

const NOTE: SessionIntentGateResult["note"] =
  "Local concept model only; no live traffic monitoring, real bot detection, crawler blocking, browser fingerprinting, tracking, payment, settlement, network call, external-agent contact, or action execution occurred.";

export const SESSION_INTENT_SAFETY_FLAGS: SessionIntentGateSafetyFlags = {
  localDemoOnly: true,
  localOnly: true,
  liveTrafficMonitoring: false,
  botDetectionProduct: false,
  realBotDetection: false,
  crawlerBlocking: false,
  browserFingerprinting: false,
  realUserTracking: false,
  scraping: false,
  analyticsTracking: false,
  telemetry: false,
  networkCallPerformed: false,
  cloudCallPerformed: false,
  externalAgentContacted: false,
  autonomousContact: false,
  paymentAuthorisation: false,
  settlementAuthorisation: false,
  productionSigning: false,
  actionExecution: false,
};

export function evaluateSessionIntentGate(input: SessionIntentGateInput): SessionIntentGateResult {
  const reasons = collectReasons(input);
  const decision = decideSessionOutcome(input, reasons);
  const trustBasis = collectTrustBasis(input);
  return {
    modelVersion: SESSION_INTENT_GATE_VERSION,
    scenarioId: input.scenarioId,
    decision,
    claimedAgentName: safeText(input.claimedAgentName),
    claimedAgentType: input.claimedAgentType,
    claimedPurpose: safeText(input.claimedPurpose),
    sessionPattern: input.sessionPattern,
    requestVolumeTier: input.requestVolumeTier,
    riskTier: input.riskTier,
    freshnessStatus: input.freshnessStatus,
    claimedIdentityAloneTrusted: false,
    trustBasis,
    reasons: reasons.length > 0 ? reasons : ["local_session_context_satisfied"],
    requiredNextSteps: nextStepsForDecision(decision, reasons),
    publicContactEmail: SESSION_INTENT_PUBLIC_CONTACT,
    note: NOTE,
    ...SESSION_INTENT_SAFETY_FLAGS,
  };
}

export function createSessionIntentGateExampleInputs(): Record<SessionIntentScenarioId, SessionIntentGateInput> {
  return {
    claimed_known_agent_allowed: {
      scenarioId: "claimed_known_agent_allowed",
      claimedAgentName: "KnownReferralAgent",
      claimedAgentType: "known_ai_agent",
      claimedPurpose: "Summarise public product documentation for a referred developer session.",
      mandateId: "mandate_session_referral_demo",
      evidenceId: "evidence_referral_context_demo",
      verifiedIntentStatus: "verified",
      sessionPattern: "beneficial_referral",
      requestVolumeTier: "low",
      behaviourSignals: [
        "declared_purpose_matches_session",
        "referral_like_navigation",
        "respects_local_rate_limit",
      ],
      riskTier: "low",
      freshnessStatus: "fresh",
      localDemoOnly: true,
    },
    spoofed_agent_blocked: {
      scenarioId: "spoofed_agent_blocked",
      claimedAgentName: "KnownReferralAgent",
      claimedAgentType: "known_ai_agent",
      claimedPurpose: "Bulk copy public pages while claiming trusted agent identity.",
      mandateId: "mandate_claimed_but_unverified",
      evidenceId: "evidence_conflicting_behaviour",
      verifiedIntentStatus: "conflicting",
      sessionPattern: "spoofed_identity",
      requestVolumeTier: "burst",
      behaviourSignals: [
        "identity_claim_conflicts_with_behaviour",
        "known_agent_name_without_verifier",
        "bulk_fetch_pattern",
      ],
      riskTier: "high",
      freshnessStatus: "fresh",
      localDemoOnly: true,
    },
    extractive_pattern_throttled: {
      scenarioId: "extractive_pattern_throttled",
      claimedAgentName: "ResearchPreviewAgent",
      claimedAgentType: "crawler",
      claimedPurpose: "Review public documentation at high volume.",
      mandateId: "mandate_research_preview_demo",
      evidenceId: "evidence_research_preview_demo",
      verifiedIntentStatus: "verified",
      sessionPattern: "extractive_bulk",
      requestVolumeTier: "high",
      behaviourSignals: [
        "declared_purpose_matches_session",
        "bulk_fetch_pattern",
        "extractive_collection_pattern",
      ],
      riskTier: "medium",
      freshnessStatus: "fresh",
      localDemoOnly: true,
    },
    missing_mandate_escalated: {
      scenarioId: "missing_mandate_escalated",
      claimedAgentName: "HelpfulBrowserAgent",
      claimedAgentType: "agentic_browser",
      claimedPurpose: "Open a user-specific session without an explicit mandate.",
      mandateId: null,
      evidenceId: "evidence_browser_session_demo",
      verifiedIntentStatus: "verified",
      sessionPattern: "sensitive_workflow",
      requestVolumeTier: "medium",
      behaviourSignals: [
        "declared_purpose_matches_session",
        "sensitive_route_requested",
      ],
      riskTier: "medium",
      freshnessStatus: "fresh",
      localDemoOnly: true,
    },
    high_risk_human_review: {
      scenarioId: "high_risk_human_review",
      claimedAgentName: "EnterpriseAutomationAgent",
      claimedAgentType: "automation_client",
      claimedPurpose: "Enter a sensitive account-change flow.",
      mandateId: "mandate_sensitive_workflow_demo",
      evidenceId: "evidence_sensitive_workflow_demo",
      verifiedIntentStatus: "verified",
      sessionPattern: "sensitive_workflow",
      requestVolumeTier: "medium",
      behaviourSignals: [
        "declared_purpose_matches_session",
        "sensitive_route_requested",
        "human_review_requested",
      ],
      riskTier: "high",
      freshnessStatus: "fresh",
      localDemoOnly: true,
    },
    valid_local_control: {
      scenarioId: "valid_local_control",
      claimedAgentName: "LocalControlAgent",
      claimedAgentType: "agentic_browser",
      claimedPurpose: "Read public onboarding docs after a referred local session.",
      mandateId: "mandate_valid_local_control",
      evidenceId: "evidence_valid_local_control",
      verifiedIntentStatus: "verified",
      sessionPattern: "beneficial_referral",
      requestVolumeTier: "low",
      behaviourSignals: [
        "declared_purpose_matches_session",
        "referral_like_navigation",
        "respects_local_rate_limit",
      ],
      riskTier: "low",
      freshnessStatus: "fresh",
      localDemoOnly: true,
    },
  };
}

export function runSessionIntentGateExamples(): SessionIntentGatePack {
  const scenarios = (Object.keys(SESSION_INTENT_EXAMPLE_FILES) as SessionIntentScenarioId[])
    .map((scenarioId) => evaluateSessionIntentGate(createSessionIntentGateExampleInputs()[scenarioId]));
  const decisions = countDecisions(scenarios);
  return {
    packVersion: SESSION_INTENT_GATE_VERSION,
    packId: createSessionIntentPackId(scenarios),
    rule: SESSION_INTENT_GATE_RULE,
    principle: "Claimed agent identity is not trust. Behaviour, mandate, evidence, verified intent, and session context must decide access.",
    scenarioCount: scenarios.length,
    decisions,
    publicContactEmail: SESSION_INTENT_PUBLIC_CONTACT,
    note: NOTE,
    scenarios,
    ...SESSION_INTENT_SAFETY_FLAGS,
  };
}

export function runSessionIntentGateScenario(scenarioId: SessionIntentScenarioId): SessionIntentGateResult {
  return evaluateSessionIntentGate(createSessionIntentGateExampleInputs()[scenarioId]);
}

export function summariseSessionIntentGatePack(pack: SessionIntentGatePack): SessionIntentGatePackSummary {
  const { scenarios: _scenarios, ...summary } = pack;
  return summary;
}

function collectReasons(input: SessionIntentGateInput): string[] {
  const reasons: string[] = ["claimed_identity_not_trust"];
  if (input.localDemoOnly !== true) reasons.push("local_demo_only_required");
  if (input.mandateId === null || input.mandateId.trim() === "") reasons.push("mandate_missing");
  if (input.evidenceId === null || input.evidenceId.trim() === "") reasons.push("evidence_missing");
  if (input.verifiedIntentStatus !== "verified") reasons.push(`verified_intent_${input.verifiedIntentStatus}`);
  if (input.freshnessStatus !== "fresh") reasons.push(`freshness_${input.freshnessStatus}`);
  if (isSpoofed(input)) reasons.push("spoofed_agent_identity_blocked");
  if (isExtractive(input)) reasons.push("extractive_session_pattern");
  if (input.requestVolumeTier === "burst") reasons.push("burst_request_volume");
  if (input.requestVolumeTier === "high") reasons.push("high_request_volume");
  if (input.riskTier === "high" || input.riskTier === "critical") reasons.push(`risk_${input.riskTier}_requires_human_review`);
  if (input.sessionPattern === "sensitive_workflow") reasons.push("sensitive_session_context");
  return unique(reasons);
}

function decideSessionOutcome(input: SessionIntentGateInput, reasons: readonly string[]): SessionIntentDecision {
  if (input.localDemoOnly !== true) return "block";
  if (reasons.includes("spoofed_agent_identity_blocked")) return "block";
  if (input.verifiedIntentStatus === "conflicting") return "block";
  if (input.freshnessStatus !== "fresh" || input.evidenceId === null || input.evidenceId.trim() === "") {
    return "require_evidence";
  }
  if (input.mandateId === null || input.mandateId.trim() === "") return "escalate";
  if (input.riskTier === "high" || input.riskTier === "critical") return "require_human_review";
  if (isExtractive(input)) return input.requestVolumeTier === "burst" ? "block" : "throttle";
  if (input.verifiedIntentStatus !== "verified") return "require_evidence";
  return "allow";
}

function collectTrustBasis(input: SessionIntentGateInput): string[] {
  const basis: string[] = [];
  if (input.mandateId !== null && input.mandateId.trim() !== "") basis.push("mandate_present");
  if (input.evidenceId !== null && input.evidenceId.trim() !== "") basis.push("evidence_present");
  if (input.verifiedIntentStatus === "verified") basis.push("verified_intent");
  if (input.freshnessStatus === "fresh") basis.push("fresh_session_context");
  if (input.behaviourSignals.includes("declared_purpose_matches_session")) basis.push("behaviour_matches_declared_purpose");
  if (input.behaviourSignals.includes("referral_like_navigation")) basis.push("referral_like_behaviour");
  return basis;
}

function nextStepsForDecision(decision: SessionIntentDecision, reasons: readonly string[]): string[] {
  switch (decision) {
    case "allow":
      return ["record_local_session_receipt", "continue_local_demo_only"];
    case "throttle":
      return ["reduce_local_request_rate", "request_stronger_session_evidence"];
    case "block":
      return reasons.includes("spoofed_agent_identity_blocked")
        ? ["deny_local_session", "require_verifiable_agent_context"]
        : ["deny_local_session"];
    case "escalate":
      return ["request_missing_mandate", "escalate_to_local_review"];
    case "require_evidence":
      return ["request_fresh_evidence", "request_verified_intent_context"];
    case "require_human_review":
      return ["pause_session", "route_to_human_review"];
  }
}

function isSpoofed(input: SessionIntentGateInput): boolean {
  return input.sessionPattern === "spoofed_identity"
    || input.behaviourSignals.includes("identity_claim_conflicts_with_behaviour")
    || input.behaviourSignals.includes("known_agent_name_without_verifier");
}

function isExtractive(input: SessionIntentGateInput): boolean {
  return input.sessionPattern === "extractive_bulk"
    || input.behaviourSignals.includes("bulk_fetch_pattern")
    || input.behaviourSignals.includes("extractive_collection_pattern");
}

function countDecisions(results: readonly SessionIntentGateResult[]): Record<SessionIntentDecision, number> {
  const counts: Record<SessionIntentDecision, number> = {
    allow: 0,
    throttle: 0,
    block: 0,
    escalate: 0,
    require_evidence: 0,
    require_human_review: 0,
  };
  for (const result of results) counts[result.decision] += 1;
  return counts;
}

function createSessionIntentPackId(results: readonly SessionIntentGateResult[]): string {
  const seed = results
    .map((result) => `${result.scenarioId}:${result.decision}:${result.reasons.join(",")}`)
    .join("|");
  return `session_intent_gate_${createHash("sha256")
    .update(`${SESSION_INTENT_GATE_VERSION}|${seed}`, "utf8")
    .digest("hex")
    .slice(0, 24)}`;
}

function safeText(value: string): string {
  return value.trim().slice(0, 240);
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}
