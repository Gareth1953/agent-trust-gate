import { createHash } from "node:crypto";

export const PROVE_YOURSELF_PROTOCOL_VERSION = "atg.prove-yourself-protocol.local.v1" as const;
export const PROVE_YOURSELF_CORE_LINE =
  "No mandate. No evidence. No verified intent. No signed gate pass. No settlement." as const;
export const PROVE_YOURSELF_PUBLIC_CONTACT = "gpmiddleton71@gmail.com" as const;
export const PROVE_YOURSELF_STRATEGIC_PRINCIPLE =
  "We do not chase millions of AI agents. We create the trust rule they must satisfy." as const;
export const PROVE_YOURSELF_POSITIONING = [
  "Do not trust the agent. Trust the gate pass.",
  "No proof. No permission.",
  "No mandate. No action.",
  "No signed gate pass. No settlement.",
] as const;

export type ProveYourselfDecision =
  | "allow"
  | "block"
  | "escalate"
  | "require_evidence"
  | "require_human_review"
  | "require_signed_proof";

export type ProveYourselfAgentType =
  | "agentic_browser"
  | "automation_agent"
  | "tool_calling_agent"
  | "agent_owner_claim"
  | "unknown";

export type ProofStatus = "present" | "missing" | "stale" | "replayed" | "tampered" | "malformed";
export type VerifiedIntentProofStatus = "verified" | "unverified" | "missing" | "conflicting";
export type HumanApprovalStatus = "approved" | "required_missing" | "not_required" | "rejected";
export type ProveYourselfRiskTier = "low" | "medium" | "high" | "critical";
export type SessionContextStatus = "consistent" | "missing" | "conflicting";

export type ProveYourselfScenarioId =
  | "valid_local_control"
  | "claimed_identity_only_blocked"
  | "missing_mandate_blocked"
  | "missing_evidence_requires_evidence"
  | "unverified_intent_escalated"
  | "replayed_proof_blocked"
  | "high_risk_human_review"
  | "settlement_sensitive_requires_signed_proof";

export interface ProveYourselfPackageInput {
  scenarioId: string;
  claimedAgentName: string;
  claimedAgentType: ProveYourselfAgentType;
  ownerReference: string | null;
  issuerReference: string | null;
  mandateReference: string | null;
  permittedActionScope: string | null;
  requestedAction: string;
  evidenceReference: string | null;
  verifiedIntentStatus: VerifiedIntentProofStatus;
  humanApprovalStatus: HumanApprovalStatus;
  riskTier: ProveYourselfRiskTier;
  freshnessStatus: ProofStatus;
  nonceStatus: ProofStatus;
  signedProofStatus: ProofStatus;
  sessionContextStatus: SessionContextStatus;
  settlementSensitive: boolean;
  localDemoOnly: boolean;
}

export interface ProveYourselfProtocolSafetyFlags {
  localDemoOnly: true;
  localOnly: true;
  liveSystemsContact: false;
  directBotMessaging: false;
  autonomousOutreach: false;
  outreachAutomation: false;
  liveAgentToAgentCommunication: false;
  externalAgentContact: false;
  liveApi: false;
  mcpServer: false;
  cloudNetworkCall: false;
  secretsOrCredentials: false;
  paymentAuthorisation: false;
  settlementAuthorisation: false;
  walletBankingLogic: false;
  productionSigning: false;
  productionCertification: false;
  actionExecution: false;
}

export interface ProveYourselfProtocolResult extends ProveYourselfProtocolSafetyFlags {
  protocolVersion: typeof PROVE_YOURSELF_PROTOCOL_VERSION;
  scenarioId: string;
  decision: ProveYourselfDecision;
  claimedAgentName: string;
  claimedAgentType: ProveYourselfAgentType;
  requestedAction: string;
  riskTier: ProveYourselfRiskTier;
  settlementSensitive: boolean;
  claimedIdentityAloneTrusted: false;
  noProofMeansNoPermission: true;
  reasons: string[];
  requiredNextProof: string[];
  gatePassMeaning: {
    mayProveLocally: string[];
    doesNotProve: string[];
  };
  publicContactEmail: typeof PROVE_YOURSELF_PUBLIC_CONTACT;
  note: "Local prove-yourself protocol model only; no live systems contact, direct bot messaging, live agent-to-agent communication, outreach automation, payment, settlement, production certification, network call, or action execution occurred.";
}

export interface ProveYourselfProtocolPack extends ProveYourselfProtocolSafetyFlags {
  packVersion: typeof PROVE_YOURSELF_PROTOCOL_VERSION;
  packId: string;
  coreLine: typeof PROVE_YOURSELF_CORE_LINE;
  strategicPrinciple: typeof PROVE_YOURSELF_STRATEGIC_PRINCIPLE;
  positioning: typeof PROVE_YOURSELF_POSITIONING;
  scenarioCount: number;
  decisions: Record<ProveYourselfDecision, number>;
  publicContactEmail: typeof PROVE_YOURSELF_PUBLIC_CONTACT;
  note: ProveYourselfProtocolResult["note"];
  scenarios: ProveYourselfProtocolResult[];
}

export type ProveYourselfProtocolPackSummary = Omit<ProveYourselfProtocolPack, "scenarios">;

export const PROVE_YOURSELF_EXAMPLE_FILES: Record<ProveYourselfScenarioId, string> = {
  valid_local_control: "examples/prove-yourself-valid-local-control.json",
  claimed_identity_only_blocked: "examples/prove-yourself-claimed-identity-only-blocked.json",
  missing_mandate_blocked: "examples/prove-yourself-missing-mandate-blocked.json",
  missing_evidence_requires_evidence: "examples/prove-yourself-missing-evidence-requires-evidence.json",
  unverified_intent_escalated: "examples/prove-yourself-unverified-intent-escalated.json",
  replayed_proof_blocked: "examples/prove-yourself-replayed-proof-blocked.json",
  high_risk_human_review: "examples/prove-yourself-high-risk-human-review.json",
  settlement_sensitive_requires_signed_proof: "examples/prove-yourself-settlement-sensitive-requires-signed-proof.json",
};

const NOTE: ProveYourselfProtocolResult["note"] =
  "Local prove-yourself protocol model only; no live systems contact, direct bot messaging, live agent-to-agent communication, outreach automation, payment, settlement, production certification, network call, or action execution occurred.";

export const PROVE_YOURSELF_SAFETY_FLAGS: ProveYourselfProtocolSafetyFlags = {
  localDemoOnly: true,
  localOnly: true,
  liveSystemsContact: false,
  directBotMessaging: false,
  autonomousOutreach: false,
  outreachAutomation: false,
  liveAgentToAgentCommunication: false,
  externalAgentContact: false,
  liveApi: false,
  mcpServer: false,
  cloudNetworkCall: false,
  secretsOrCredentials: false,
  paymentAuthorisation: false,
  settlementAuthorisation: false,
  walletBankingLogic: false,
  productionSigning: false,
  productionCertification: false,
  actionExecution: false,
};

export function evaluateProveYourselfPackage(
  input: ProveYourselfPackageInput,
): ProveYourselfProtocolResult {
  const reasons = collectReasons(input);
  const decision = decideProveYourselfOutcome(input, reasons);
  return {
    protocolVersion: PROVE_YOURSELF_PROTOCOL_VERSION,
    scenarioId: input.scenarioId,
    decision,
    claimedAgentName: safeText(input.claimedAgentName),
    claimedAgentType: input.claimedAgentType,
    requestedAction: safeText(input.requestedAction),
    riskTier: input.riskTier,
    settlementSensitive: input.settlementSensitive,
    claimedIdentityAloneTrusted: false,
    noProofMeansNoPermission: true,
    reasons: reasons.length > 0 ? reasons : ["local_proof_package_satisfied"],
    requiredNextProof: requiredNextProofForDecision(decision, input, reasons),
    gatePassMeaning: gatePassMeaningFor(input),
    publicContactEmail: PROVE_YOURSELF_PUBLIC_CONTACT,
    note: NOTE,
    ...PROVE_YOURSELF_SAFETY_FLAGS,
  };
}

export function createProveYourselfExampleInputs(): Record<ProveYourselfScenarioId, ProveYourselfPackageInput> {
  return {
    valid_local_control: {
      scenarioId: "valid_local_control",
      claimedAgentName: "LocalGatePassAgent",
      claimedAgentType: "tool_calling_agent",
      ownerReference: "owner_local_demo",
      issuerReference: "issuer_local_gate",
      mandateReference: "mandate_valid_local_control",
      permittedActionScope: "read_public_docs_only",
      requestedAction: "Read public repository documentation for a local technical review.",
      evidenceReference: "evidence_valid_local_control",
      verifiedIntentStatus: "verified",
      humanApprovalStatus: "not_required",
      riskTier: "low",
      freshnessStatus: "present",
      nonceStatus: "present",
      signedProofStatus: "present",
      sessionContextStatus: "consistent",
      settlementSensitive: false,
      localDemoOnly: true,
    },
    claimed_identity_only_blocked: {
      scenarioId: "claimed_identity_only_blocked",
      claimedAgentName: "TrustedAgentName",
      claimedAgentType: "automation_agent",
      ownerReference: null,
      issuerReference: null,
      mandateReference: null,
      permittedActionScope: null,
      requestedAction: "Use a sensitive tool because the agent claims a trusted name.",
      evidenceReference: null,
      verifiedIntentStatus: "missing",
      humanApprovalStatus: "required_missing",
      riskTier: "medium",
      freshnessStatus: "missing",
      nonceStatus: "missing",
      signedProofStatus: "missing",
      sessionContextStatus: "missing",
      settlementSensitive: false,
      localDemoOnly: true,
    },
    missing_mandate_blocked: {
      scenarioId: "missing_mandate_blocked",
      claimedAgentName: "WorkflowAgent",
      claimedAgentType: "tool_calling_agent",
      ownerReference: "owner_local_demo",
      issuerReference: "issuer_local_gate",
      mandateReference: null,
      permittedActionScope: "sensitive_tool_use",
      requestedAction: "Call a sensitive tool without an explicit mandate.",
      evidenceReference: "evidence_sensitive_tool_demo",
      verifiedIntentStatus: "verified",
      humanApprovalStatus: "approved",
      riskTier: "medium",
      freshnessStatus: "present",
      nonceStatus: "present",
      signedProofStatus: "present",
      sessionContextStatus: "consistent",
      settlementSensitive: false,
      localDemoOnly: true,
    },
    missing_evidence_requires_evidence: {
      scenarioId: "missing_evidence_requires_evidence",
      claimedAgentName: "EvidenceLightAgent",
      claimedAgentType: "automation_agent",
      ownerReference: "owner_local_demo",
      issuerReference: "issuer_local_gate",
      mandateReference: "mandate_evidence_required",
      permittedActionScope: "prepare_review_summary",
      requestedAction: "Prepare a review summary without citing evidence.",
      evidenceReference: null,
      verifiedIntentStatus: "verified",
      humanApprovalStatus: "not_required",
      riskTier: "low",
      freshnessStatus: "present",
      nonceStatus: "present",
      signedProofStatus: "present",
      sessionContextStatus: "consistent",
      settlementSensitive: false,
      localDemoOnly: true,
    },
    unverified_intent_escalated: {
      scenarioId: "unverified_intent_escalated",
      claimedAgentName: "AmbiguousIntentAgent",
      claimedAgentType: "agentic_browser",
      ownerReference: "owner_local_demo",
      issuerReference: "issuer_local_gate",
      mandateReference: "mandate_intent_required",
      permittedActionScope: "browse_public_docs",
      requestedAction: "Continue a session where user intent is not verified.",
      evidenceReference: "evidence_session_context",
      verifiedIntentStatus: "unverified",
      humanApprovalStatus: "not_required",
      riskTier: "medium",
      freshnessStatus: "present",
      nonceStatus: "present",
      signedProofStatus: "present",
      sessionContextStatus: "consistent",
      settlementSensitive: false,
      localDemoOnly: true,
    },
    replayed_proof_blocked: {
      scenarioId: "replayed_proof_blocked",
      claimedAgentName: "ReplayAttemptAgent",
      claimedAgentType: "automation_agent",
      ownerReference: "owner_local_demo",
      issuerReference: "issuer_local_gate",
      mandateReference: "mandate_replay_demo",
      permittedActionScope: "single_use_sensitive_tool",
      requestedAction: "Reuse a previous proof package for a new sensitive action.",
      evidenceReference: "evidence_replay_demo",
      verifiedIntentStatus: "verified",
      humanApprovalStatus: "approved",
      riskTier: "medium",
      freshnessStatus: "stale",
      nonceStatus: "replayed",
      signedProofStatus: "present",
      sessionContextStatus: "consistent",
      settlementSensitive: false,
      localDemoOnly: true,
    },
    high_risk_human_review: {
      scenarioId: "high_risk_human_review",
      claimedAgentName: "HighImpactAgent",
      claimedAgentType: "tool_calling_agent",
      ownerReference: "owner_local_demo",
      issuerReference: "issuer_local_gate",
      mandateReference: "mandate_high_risk_demo",
      permittedActionScope: "customer_impacting_change",
      requestedAction: "Prepare a customer-impacting workflow change.",
      evidenceReference: "evidence_high_risk_demo",
      verifiedIntentStatus: "verified",
      humanApprovalStatus: "required_missing",
      riskTier: "high",
      freshnessStatus: "present",
      nonceStatus: "present",
      signedProofStatus: "present",
      sessionContextStatus: "consistent",
      settlementSensitive: false,
      localDemoOnly: true,
    },
    settlement_sensitive_requires_signed_proof: {
      scenarioId: "settlement_sensitive_requires_signed_proof",
      claimedAgentName: "SettlementAdjacentAgent",
      claimedAgentType: "automation_agent",
      ownerReference: "owner_local_demo",
      issuerReference: "issuer_local_gate",
      mandateReference: "mandate_pre_settlement_demo",
      permittedActionScope: "pre_settlement_review_only",
      requestedAction: "Proceed toward a simulated settlement-sensitive workflow.",
      evidenceReference: "evidence_pre_settlement_demo",
      verifiedIntentStatus: "verified",
      humanApprovalStatus: "approved",
      riskTier: "medium",
      freshnessStatus: "present",
      nonceStatus: "present",
      signedProofStatus: "missing",
      sessionContextStatus: "consistent",
      settlementSensitive: true,
      localDemoOnly: true,
    },
  };
}

export function runProveYourselfProtocolExamples(): ProveYourselfProtocolPack {
  const scenarios = (Object.keys(PROVE_YOURSELF_EXAMPLE_FILES) as ProveYourselfScenarioId[])
    .map((scenarioId) => evaluateProveYourselfPackage(createProveYourselfExampleInputs()[scenarioId]));
  return {
    packVersion: PROVE_YOURSELF_PROTOCOL_VERSION,
    packId: createPackId(scenarios),
    coreLine: PROVE_YOURSELF_CORE_LINE,
    strategicPrinciple: PROVE_YOURSELF_STRATEGIC_PRINCIPLE,
    positioning: PROVE_YOURSELF_POSITIONING,
    scenarioCount: scenarios.length,
    decisions: countDecisions(scenarios),
    publicContactEmail: PROVE_YOURSELF_PUBLIC_CONTACT,
    note: NOTE,
    scenarios,
    ...PROVE_YOURSELF_SAFETY_FLAGS,
  };
}

export function runProveYourselfProtocolScenario(
  scenarioId: ProveYourselfScenarioId,
): ProveYourselfProtocolResult {
  return evaluateProveYourselfPackage(createProveYourselfExampleInputs()[scenarioId]);
}

export function summariseProveYourselfProtocolPack(
  pack: ProveYourselfProtocolPack,
): ProveYourselfProtocolPackSummary {
  const { scenarios: _scenarios, ...summary } = pack;
  return summary;
}

function collectReasons(input: ProveYourselfPackageInput): string[] {
  const reasons = ["claimed_identity_not_trust"];
  if (input.localDemoOnly !== true) reasons.push("local_demo_only_required");
  if (isBlank(input.ownerReference)) reasons.push("owner_reference_missing");
  if (isBlank(input.issuerReference)) reasons.push("issuer_reference_missing");
  if (isBlank(input.mandateReference)) reasons.push("mandate_missing");
  if (isBlank(input.permittedActionScope)) reasons.push("permitted_scope_missing");
  if (isBlank(input.evidenceReference)) reasons.push("evidence_missing");
  if (input.verifiedIntentStatus !== "verified") reasons.push(`verified_intent_${input.verifiedIntentStatus}`);
  if (input.humanApprovalStatus === "required_missing") reasons.push("human_approval_required_missing");
  if (input.humanApprovalStatus === "rejected") reasons.push("human_approval_rejected");
  if (input.freshnessStatus !== "present") reasons.push(`freshness_${input.freshnessStatus}`);
  if (input.nonceStatus !== "present") reasons.push(`nonce_${input.nonceStatus}`);
  if (input.signedProofStatus !== "present") reasons.push(`signed_proof_${input.signedProofStatus}`);
  if (input.sessionContextStatus !== "consistent") reasons.push(`session_context_${input.sessionContextStatus}`);
  if (input.riskTier === "high" || input.riskTier === "critical") reasons.push(`risk_${input.riskTier}_requires_human_review`);
  if (input.settlementSensitive) reasons.push("settlement_sensitive_requires_valid_signed_gate_pass");
  return unique(reasons);
}

function decideProveYourselfOutcome(
  input: ProveYourselfPackageInput,
  reasons: readonly string[],
): ProveYourselfDecision {
  if (input.localDemoOnly !== true) return "block";
  if (hasOnlyClaimedIdentity(input)) return "block";
  if (isBlank(input.mandateReference)) return input.riskTier === "low" ? "escalate" : "block";
  if (input.freshnessStatus === "replayed" || input.freshnessStatus === "stale") return "block";
  if (input.nonceStatus === "replayed" || input.nonceStatus === "stale") return "block";
  if (input.signedProofStatus === "tampered" || input.signedProofStatus === "malformed") return "block";
  if (input.humanApprovalStatus === "rejected") return "block";
  if (isBlank(input.evidenceReference)) return "require_evidence";
  if (input.verifiedIntentStatus === "conflicting" || input.verifiedIntentStatus === "missing") return "block";
  if (input.verifiedIntentStatus === "unverified") return "escalate";
  if (input.sessionContextStatus === "conflicting") return "block";
  if (input.riskTier === "high" || input.riskTier === "critical" || input.humanApprovalStatus === "required_missing") {
    return "require_human_review";
  }
  if (input.settlementSensitive && input.signedProofStatus !== "present") return "require_signed_proof";
  if (reasons.some((reason) => reason.startsWith("signed_proof_"))) return "require_signed_proof";
  return "allow";
}

function requiredNextProofForDecision(
  decision: ProveYourselfDecision,
  input: ProveYourselfPackageInput,
  reasons: readonly string[],
): string[] {
  switch (decision) {
    case "allow":
      return ["record_local_gate_pass_meaning", "continue_local_demo_only"];
    case "block":
      return reasons.includes("mandate_missing")
        ? ["present_valid_mandate", "present_scoped_proof_package"]
        : ["stop_request", "present_non_replayed_fresh_scoped_proof"];
    case "escalate":
      return ["clarify_verified_intent", "route_to_local_reviewer"];
    case "require_evidence":
      return ["present_evidence_reference", "bind_evidence_to_requested_action"];
    case "require_human_review":
      return ["obtain_human_review", "bind_approval_to_scope_and_nonce"];
    case "require_signed_proof":
      return input.settlementSensitive
        ? ["present_valid_signed_gate_pass", "prove_scope_freshness_and_nonce_before_settlement"]
        : ["present_signed_proof_reference"];
  }
}

function gatePassMeaningFor(input: ProveYourselfPackageInput): ProveYourselfProtocolResult["gatePassMeaning"] {
  const mayProveLocally = [
    "mandate_evidence_intent_and_scope_were_checked_locally",
    "freshness_and_nonce_were_checked_locally",
    "decision_was_recorded_as_local_demo_only",
  ];
  if (input.signedProofStatus === "present") mayProveLocally.push("signed_proof_reference_was_present_locally");
  if (input.settlementSensitive) mayProveLocally.push("settlement_sensitive_path_was_blocked_without_valid_signed_gate_pass");
  return {
    mayProveLocally,
    doesNotProve: [
      "universal_agent_identity",
      "production_authentication",
      "legal_compliance_or_security_certification",
      "payment_or_settlement_authority",
      "permission_to_execute_actions",
    ],
  };
}

function hasOnlyClaimedIdentity(input: ProveYourselfPackageInput): boolean {
  return isBlank(input.ownerReference)
    && isBlank(input.issuerReference)
    && isBlank(input.mandateReference)
    && isBlank(input.permittedActionScope)
    && isBlank(input.evidenceReference)
    && input.verifiedIntentStatus === "missing"
    && input.signedProofStatus === "missing";
}

function countDecisions(results: readonly ProveYourselfProtocolResult[]): Record<ProveYourselfDecision, number> {
  const counts: Record<ProveYourselfDecision, number> = {
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

function createPackId(results: readonly ProveYourselfProtocolResult[]): string {
  const seed = results
    .map((result) => `${result.scenarioId}:${result.decision}:${result.reasons.join(",")}`)
    .join("|");
  return `prove_yourself_${createHash("sha256")
    .update(`${PROVE_YOURSELF_PROTOCOL_VERSION}|${seed}`, "utf8")
    .digest("hex")
    .slice(0, 24)}`;
}

function safeText(value: string): string {
  return value.trim().slice(0, 240);
}

function isBlank(value: string | null): boolean {
  return value === null || value.trim() === "";
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}
