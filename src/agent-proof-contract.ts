import { createHash } from "node:crypto";

import {
  PROVE_YOURSELF_CORE_LINE,
  PROVE_YOURSELF_POSITIONING,
  PROVE_YOURSELF_PUBLIC_CONTACT,
  PROVE_YOURSELF_STRATEGIC_PRINCIPLE,
  evaluateProveYourselfPackage,
  type HumanApprovalStatus,
  type ProofStatus,
  type ProveYourselfAgentType,
  type ProveYourselfDecision,
  type ProveYourselfRiskTier,
  type SessionContextStatus,
  type VerifiedIntentProofStatus,
} from "./prove-yourself-protocol.js";

export const AGENT_PROOF_CONTRACT_VERSION = "atg.agent-proof-contract.local.v1" as const;
export const AGENT_PROOF_CONTRACT_CORE_LINE = PROVE_YOURSELF_CORE_LINE;
export const AGENT_PROOF_CONTRACT_PUBLIC_CONTACT = PROVE_YOURSELF_PUBLIC_CONTACT;
export const AGENT_PROOF_CONTRACT_STRATEGIC_PRINCIPLE = PROVE_YOURSELF_STRATEGIC_PRINCIPLE;
export const AGENT_PROOF_CONTRACT_POSITIONING = PROVE_YOURSELF_POSITIONING;

export type AgentProofDecision = ProveYourselfDecision;

export type AgentProofRequiredItem =
  | "claimedAgentName"
  | "claimedAgentType"
  | "ownerReference"
  | "issuerReference"
  | "mandateReference"
  | "permittedActionScope"
  | "requestedAction"
  | "evidenceReference"
  | "verifiedIntentStatus"
  | "humanApprovalStatus"
  | "riskTier"
  | "freshnessStatus"
  | "nonce"
  | "nonceStatus"
  | "signedProofReference"
  | "signedProofStatus"
  | "sessionContextReference";

export type AgentProofRiskTolerance = "low" | "medium" | "high";

export type AgentProofArtifactId =
  | "agent_proof_package_valid_local_control"
  | "agent_proof_package_identity_only_invalid"
  | "agent_proof_verification_request_basic"
  | "agent_proof_verification_result_allowed_local"
  | "agent_proof_verification_result_requires_evidence"
  | "agent_proof_verification_result_requires_human_review"
  | "gate_pass_challenge_basic"
  | "gate_pass_challenge_settlement_sensitive";

export interface AgentProofPackage {
  packageId: string;
  contractVersion: typeof AGENT_PROOF_CONTRACT_VERSION;
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
  nonce: string | null;
  nonceStatus: ProofStatus;
  signedProofReference: string | null;
  signedProofStatus: ProofStatus;
  sessionContextReference: string | null;
  settlementSensitive: boolean;
  localDemoOnly: boolean;
}

export interface AgentProofVerificationRequest {
  requestId: string;
  contractVersion: typeof AGENT_PROOF_CONTRACT_VERSION;
  verifierReference: string;
  systemReference: string;
  requestedVerificationPurpose: string;
  requiredProofItems: AgentProofRequiredItem[];
  riskTolerance: AgentProofRiskTolerance;
  humanReviewRequired: boolean;
  settlementSensitive: boolean;
  localDemoOnly: boolean;
}

export interface GatePassChallenge {
  challengeId: string;
  contractVersion: typeof AGENT_PROOF_CONTRACT_VERSION;
  verifierReference: string;
  requestedAction: string;
  requiredMandate: boolean;
  requiredEvidence: boolean;
  requiredIntentVerification: boolean;
  requiredHumanApproval: boolean;
  requiredFreshness: boolean;
  requiredNonce: boolean;
  requiredSignedProof: boolean;
  expiry: string;
  localDemoOnly: boolean;
}

export interface AgentProofContractSafetyFlags {
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

export interface AgentProofVerificationResult extends AgentProofContractSafetyFlags {
  resultId: string;
  contractVersion: typeof AGENT_PROOF_CONTRACT_VERSION;
  packageId: string;
  requestId: string;
  challengeId?: string;
  decision: AgentProofDecision;
  reasons: string[];
  missingProofItems: AgentProofRequiredItem[];
  requiredNextProof: string[];
  gatePassMeaning: {
    mayProveLocally: string[];
    doesNotProve: string[];
  };
  claimedIdentityAloneSufficient: false;
  noProofMeansNoPermission: true;
  publicContactEmail: typeof AGENT_PROOF_CONTRACT_PUBLIC_CONTACT;
  note: "Local agent proof contract model only; no live systems contact, direct bot messaging, live agent-to-agent communication, outreach automation, payment, settlement, production certification, network call, or action execution occurred.";
}

export interface AgentProofContractExampleSet {
  proofPackages: {
    validLocalControl: AgentProofPackage;
    identityOnlyInvalid: AgentProofPackage;
    missingEvidence: AgentProofPackage;
    highRiskHumanReview: AgentProofPackage;
    replayedProof: AgentProofPackage;
    settlementSensitiveMissingSignedProof: AgentProofPackage;
  };
  verificationRequests: {
    basic: AgentProofVerificationRequest;
    humanReview: AgentProofVerificationRequest;
    settlementSensitive: AgentProofVerificationRequest;
  };
  gatePassChallenges: {
    basic: GatePassChallenge;
    settlementSensitive: GatePassChallenge;
  };
  verificationResults: {
    allowedLocal: AgentProofVerificationResult;
    identityOnlyBlocked: AgentProofVerificationResult;
    requiresEvidence: AgentProofVerificationResult;
    requiresHumanReview: AgentProofVerificationResult;
    replayedProofBlocked: AgentProofVerificationResult;
    settlementSensitiveRequiresSignedProof: AgentProofVerificationResult;
  };
}

export interface AgentProofContractPack extends AgentProofContractSafetyFlags {
  packVersion: typeof AGENT_PROOF_CONTRACT_VERSION;
  packId: string;
  coreLine: typeof AGENT_PROOF_CONTRACT_CORE_LINE;
  strategicPrinciple: typeof AGENT_PROOF_CONTRACT_STRATEGIC_PRINCIPLE;
  positioning: typeof AGENT_PROOF_CONTRACT_POSITIONING;
  publicContactEmail: typeof AGENT_PROOF_CONTRACT_PUBLIC_CONTACT;
  artifactCount: number;
  resultCount: number;
  decisions: Record<AgentProofDecision, number>;
  exampleFiles: typeof AGENT_PROOF_CONTRACT_EXAMPLE_FILES;
  note: AgentProofVerificationResult["note"];
  examples: AgentProofContractExampleSet;
}

export type AgentProofContractPackSummary = Omit<AgentProofContractPack, "examples">;

export type AgentProofContractArtifact =
  | AgentProofPackage
  | AgentProofVerificationRequest
  | AgentProofVerificationResult
  | GatePassChallenge;

export const AGENT_PROOF_CONTRACT_EXAMPLE_FILES: Record<AgentProofArtifactId, string> = {
  agent_proof_package_valid_local_control: "examples/agent-proof-package-valid-local-control.json",
  agent_proof_package_identity_only_invalid: "examples/agent-proof-package-identity-only-invalid.json",
  agent_proof_verification_request_basic: "examples/agent-proof-verification-request-basic.json",
  agent_proof_verification_result_allowed_local: "examples/agent-proof-verification-result-allowed-local.json",
  agent_proof_verification_result_requires_evidence:
    "examples/agent-proof-verification-result-requires-evidence.json",
  agent_proof_verification_result_requires_human_review:
    "examples/agent-proof-verification-result-requires-human-review.json",
  gate_pass_challenge_basic: "examples/gate-pass-challenge-basic.json",
  gate_pass_challenge_settlement_sensitive: "examples/gate-pass-challenge-settlement-sensitive.json",
};

export const AGENT_PROOF_CONTRACT_SAFETY_FLAGS: AgentProofContractSafetyFlags = {
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

const NOTE: AgentProofVerificationResult["note"] =
  "Local agent proof contract model only; no live systems contact, direct bot messaging, live agent-to-agent communication, outreach automation, payment, settlement, production certification, network call, or action execution occurred.";

const BASIC_REQUIRED_PROOF_ITEMS: AgentProofRequiredItem[] = [
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
  "signedProofReference",
  "signedProofStatus",
  "sessionContextReference",
];

export function evaluateAgentProofVerification(
  proofPackage: AgentProofPackage,
  request: AgentProofVerificationRequest,
  challenge?: GatePassChallenge,
): AgentProofVerificationResult {
  const missingProofItems = collectMissingProofItems(proofPackage, request, challenge);
  const sessionContextStatus: SessionContextStatus = isBlank(proofPackage.sessionContextReference)
    ? "missing"
    : "consistent";
  const proveYourselfResult = evaluateProveYourselfPackage({
    scenarioId: proofPackage.packageId,
    claimedAgentName: proofPackage.claimedAgentName,
    claimedAgentType: proofPackage.claimedAgentType,
    ownerReference: proofPackage.ownerReference,
    issuerReference: proofPackage.issuerReference,
    mandateReference: proofPackage.mandateReference,
    permittedActionScope: proofPackage.permittedActionScope,
    requestedAction: proofPackage.requestedAction,
    evidenceReference: proofPackage.evidenceReference,
    verifiedIntentStatus: proofPackage.verifiedIntentStatus,
    humanApprovalStatus: proofPackage.humanApprovalStatus,
    riskTier: proofPackage.riskTier,
    freshnessStatus: proofPackage.freshnessStatus,
    nonceStatus: proofPackage.nonceStatus,
    signedProofStatus: proofPackage.signedProofStatus,
    sessionContextStatus,
    settlementSensitive: proofPackage.settlementSensitive || request.settlementSensitive,
    localDemoOnly: proofPackage.localDemoOnly && request.localDemoOnly && (challenge?.localDemoOnly ?? true),
  });
  const reasons = collectVerificationReasons(proofPackage, request, challenge, missingProofItems, proveYourselfResult.reasons);
  const decision = decideAgentProofContractOutcome(proofPackage, request, challenge, missingProofItems, reasons, proveYourselfResult.decision);
  return {
    resultId: createResultId(proofPackage, request, challenge, decision, reasons),
    contractVersion: AGENT_PROOF_CONTRACT_VERSION,
    packageId: proofPackage.packageId,
    requestId: request.requestId,
    ...(challenge === undefined ? {} : { challengeId: challenge.challengeId }),
    decision,
    reasons,
    missingProofItems,
    requiredNextProof: requiredNextProofForDecision(decision, missingProofItems, proofPackage, request, challenge),
    gatePassMeaning: createGatePassMeaning(proofPackage, request, challenge, decision),
    claimedIdentityAloneSufficient: false,
    noProofMeansNoPermission: true,
    publicContactEmail: AGENT_PROOF_CONTRACT_PUBLIC_CONTACT,
    note: NOTE,
    ...AGENT_PROOF_CONTRACT_SAFETY_FLAGS,
  };
}

export function createAgentProofContractExamples(): AgentProofContractExampleSet {
  const proofPackages = {
    validLocalControl: createValidLocalControlPackage(),
    identityOnlyInvalid: createIdentityOnlyPackage(),
    missingEvidence: createMissingEvidencePackage(),
    highRiskHumanReview: createHighRiskHumanReviewPackage(),
    replayedProof: createReplayedProofPackage(),
    settlementSensitiveMissingSignedProof: createSettlementSensitiveMissingSignedProofPackage(),
  };
  const verificationRequests = {
    basic: createBasicVerificationRequest(),
    humanReview: createHumanReviewVerificationRequest(),
    settlementSensitive: createSettlementSensitiveVerificationRequest(),
  };
  const gatePassChallenges = {
    basic: createBasicGatePassChallenge(),
    settlementSensitive: createSettlementSensitiveGatePassChallenge(),
  };
  return {
    proofPackages,
    verificationRequests,
    gatePassChallenges,
    verificationResults: {
      allowedLocal: evaluateAgentProofVerification(
        proofPackages.validLocalControl,
        verificationRequests.basic,
        gatePassChallenges.basic,
      ),
      identityOnlyBlocked: evaluateAgentProofVerification(
        proofPackages.identityOnlyInvalid,
        verificationRequests.basic,
        gatePassChallenges.basic,
      ),
      requiresEvidence: evaluateAgentProofVerification(
        proofPackages.missingEvidence,
        verificationRequests.basic,
        gatePassChallenges.basic,
      ),
      requiresHumanReview: evaluateAgentProofVerification(
        proofPackages.highRiskHumanReview,
        verificationRequests.humanReview,
        gatePassChallenges.basic,
      ),
      replayedProofBlocked: evaluateAgentProofVerification(
        proofPackages.replayedProof,
        verificationRequests.basic,
        gatePassChallenges.basic,
      ),
      settlementSensitiveRequiresSignedProof: evaluateAgentProofVerification(
        proofPackages.settlementSensitiveMissingSignedProof,
        verificationRequests.settlementSensitive,
        gatePassChallenges.settlementSensitive,
      ),
    },
  };
}

export function runAgentProofContractExamples(): AgentProofContractPack {
  const examples = createAgentProofContractExamples();
  const results = Object.values(examples.verificationResults);
  return {
    packVersion: AGENT_PROOF_CONTRACT_VERSION,
    packId: createPackId(results),
    coreLine: AGENT_PROOF_CONTRACT_CORE_LINE,
    strategicPrinciple: AGENT_PROOF_CONTRACT_STRATEGIC_PRINCIPLE,
    positioning: AGENT_PROOF_CONTRACT_POSITIONING,
    publicContactEmail: AGENT_PROOF_CONTRACT_PUBLIC_CONTACT,
    artifactCount: Object.keys(AGENT_PROOF_CONTRACT_EXAMPLE_FILES).length,
    resultCount: results.length,
    decisions: countDecisions(results),
    exampleFiles: AGENT_PROOF_CONTRACT_EXAMPLE_FILES,
    note: NOTE,
    examples,
    ...AGENT_PROOF_CONTRACT_SAFETY_FLAGS,
  };
}

export function summariseAgentProofContractPack(
  pack: AgentProofContractPack,
): AgentProofContractPackSummary {
  const { examples: _examples, ...summary } = pack;
  return summary;
}

export function getAgentProofContractArtifact(artifactId: AgentProofArtifactId): AgentProofContractArtifact {
  const examples = createAgentProofContractExamples();
  switch (artifactId) {
    case "agent_proof_package_valid_local_control":
      return examples.proofPackages.validLocalControl;
    case "agent_proof_package_identity_only_invalid":
      return examples.proofPackages.identityOnlyInvalid;
    case "agent_proof_verification_request_basic":
      return examples.verificationRequests.basic;
    case "agent_proof_verification_result_allowed_local":
      return examples.verificationResults.allowedLocal;
    case "agent_proof_verification_result_requires_evidence":
      return examples.verificationResults.requiresEvidence;
    case "agent_proof_verification_result_requires_human_review":
      return examples.verificationResults.requiresHumanReview;
    case "gate_pass_challenge_basic":
      return examples.gatePassChallenges.basic;
    case "gate_pass_challenge_settlement_sensitive":
      return examples.gatePassChallenges.settlementSensitive;
  }
}

function createValidLocalControlPackage(): AgentProofPackage {
  return {
    packageId: "agent_proof_pkg_valid_local_control",
    contractVersion: AGENT_PROOF_CONTRACT_VERSION,
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
    nonce: "nonce_agent_proof_valid_001",
    nonceStatus: "present",
    signedProofReference: "signed_proof_valid_local_control",
    signedProofStatus: "present",
    sessionContextReference: "session_context_local_review",
    settlementSensitive: false,
    localDemoOnly: true,
  };
}

function createIdentityOnlyPackage(): AgentProofPackage {
  return {
    packageId: "agent_proof_pkg_identity_only_invalid",
    contractVersion: AGENT_PROOF_CONTRACT_VERSION,
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
    nonce: null,
    nonceStatus: "missing",
    signedProofReference: null,
    signedProofStatus: "missing",
    sessionContextReference: null,
    settlementSensitive: false,
    localDemoOnly: true,
  };
}

function createMissingEvidencePackage(): AgentProofPackage {
  return {
    ...createValidLocalControlPackage(),
    packageId: "agent_proof_pkg_missing_evidence",
    requestedAction: "Prepare a review summary without a bound evidence reference.",
    evidenceReference: null,
  };
}

function createHighRiskHumanReviewPackage(): AgentProofPackage {
  return {
    ...createValidLocalControlPackage(),
    packageId: "agent_proof_pkg_high_risk_human_review",
    permittedActionScope: "customer_impacting_change_review_only",
    requestedAction: "Prepare a customer-impacting workflow change.",
    evidenceReference: "evidence_high_risk_demo",
    humanApprovalStatus: "required_missing",
    riskTier: "high",
    nonce: "nonce_agent_proof_high_risk_001",
    signedProofReference: "signed_proof_high_risk_review",
  };
}

function createReplayedProofPackage(): AgentProofPackage {
  return {
    ...createValidLocalControlPackage(),
    packageId: "agent_proof_pkg_replayed_proof",
    requestedAction: "Reuse a previous proof package for a new sensitive action.",
    freshnessStatus: "stale",
    nonce: "nonce_agent_proof_replayed_001",
    nonceStatus: "replayed",
    signedProofReference: "signed_proof_replayed_attempt",
  };
}

function createSettlementSensitiveMissingSignedProofPackage(): AgentProofPackage {
  return {
    ...createValidLocalControlPackage(),
    packageId: "agent_proof_pkg_settlement_sensitive_missing_signed_proof",
    permittedActionScope: "pre_settlement_review_only",
    requestedAction: "Proceed toward a simulated settlement-sensitive workflow.",
    evidenceReference: "evidence_pre_settlement_demo",
    riskTier: "medium",
    nonce: "nonce_agent_proof_settlement_001",
    signedProofReference: null,
    signedProofStatus: "missing",
    settlementSensitive: true,
  };
}

function createBasicVerificationRequest(): AgentProofVerificationRequest {
  return {
    requestId: "agent_proof_verify_basic",
    contractVersion: AGENT_PROOF_CONTRACT_VERSION,
    verifierReference: "verifier_local_gate",
    systemReference: "system_local_review",
    requestedVerificationPurpose: "local_agent_proof_package_review",
    requiredProofItems: BASIC_REQUIRED_PROOF_ITEMS,
    riskTolerance: "medium",
    humanReviewRequired: false,
    settlementSensitive: false,
    localDemoOnly: true,
  };
}

function createHumanReviewVerificationRequest(): AgentProofVerificationRequest {
  return {
    ...createBasicVerificationRequest(),
    requestId: "agent_proof_verify_human_review",
    requestedVerificationPurpose: "local_high_risk_agent_proof_review",
    requiredProofItems: [...BASIC_REQUIRED_PROOF_ITEMS, "humanApprovalStatus", "riskTier"],
    riskTolerance: "low",
    humanReviewRequired: true,
  };
}

function createSettlementSensitiveVerificationRequest(): AgentProofVerificationRequest {
  return {
    ...createBasicVerificationRequest(),
    requestId: "agent_proof_verify_settlement_sensitive",
    requestedVerificationPurpose: "local_pre_settlement_agent_proof_review",
    settlementSensitive: true,
    humanReviewRequired: false,
  };
}

function createBasicGatePassChallenge(): GatePassChallenge {
  return {
    challengeId: "gate_pass_challenge_basic",
    contractVersion: AGENT_PROOF_CONTRACT_VERSION,
    verifierReference: "verifier_local_gate",
    requestedAction: "Present proof before local review access is allowed.",
    requiredMandate: true,
    requiredEvidence: true,
    requiredIntentVerification: true,
    requiredHumanApproval: false,
    requiredFreshness: true,
    requiredNonce: true,
    requiredSignedProof: true,
    expiry: "2030-01-01T00:00:00.000Z",
    localDemoOnly: true,
  };
}

function createSettlementSensitiveGatePassChallenge(): GatePassChallenge {
  return {
    ...createBasicGatePassChallenge(),
    challengeId: "gate_pass_challenge_settlement_sensitive",
    requestedAction: "Present signed proof before a simulated settlement-sensitive workflow proceeds.",
    requiredHumanApproval: true,
    requiredSignedProof: true,
    expiry: "2030-01-01T00:00:00.000Z",
  };
}

function collectMissingProofItems(
  proofPackage: AgentProofPackage,
  request: AgentProofVerificationRequest,
  challenge?: GatePassChallenge,
): AgentProofRequiredItem[] {
  const required = new Set<AgentProofRequiredItem>(request.requiredProofItems);
  if (challenge?.requiredMandate) required.add("mandateReference");
  if (challenge?.requiredEvidence) required.add("evidenceReference");
  if (challenge?.requiredIntentVerification) required.add("verifiedIntentStatus");
  if (challenge?.requiredHumanApproval) required.add("humanApprovalStatus");
  if (challenge?.requiredFreshness) required.add("freshnessStatus");
  if (challenge?.requiredNonce) {
    required.add("nonce");
    required.add("nonceStatus");
  }
  if (challenge?.requiredSignedProof) {
    required.add("signedProofReference");
    required.add("signedProofStatus");
  }
  return [...required].filter((item) => !hasRequiredProofItem(proofPackage, item));
}

function hasRequiredProofItem(proofPackage: AgentProofPackage, item: AgentProofRequiredItem): boolean {
  switch (item) {
    case "claimedAgentName":
      return !isBlank(proofPackage.claimedAgentName);
    case "claimedAgentType":
      return proofPackage.claimedAgentType !== "unknown";
    case "ownerReference":
      return !isBlank(proofPackage.ownerReference);
    case "issuerReference":
      return !isBlank(proofPackage.issuerReference);
    case "mandateReference":
      return !isBlank(proofPackage.mandateReference);
    case "permittedActionScope":
      return !isBlank(proofPackage.permittedActionScope);
    case "requestedAction":
      return !isBlank(proofPackage.requestedAction);
    case "evidenceReference":
      return !isBlank(proofPackage.evidenceReference);
    case "verifiedIntentStatus":
      return proofPackage.verifiedIntentStatus !== "missing";
    case "humanApprovalStatus":
      return proofPackage.humanApprovalStatus !== "required_missing";
    case "riskTier":
      return proofPackage.riskTier !== undefined;
    case "freshnessStatus":
      return proofPackage.freshnessStatus !== "missing";
    case "nonce":
      return !isBlank(proofPackage.nonce);
    case "nonceStatus":
      return proofPackage.nonceStatus !== "missing";
    case "signedProofReference":
      return !isBlank(proofPackage.signedProofReference);
    case "signedProofStatus":
      return proofPackage.signedProofStatus !== "missing";
    case "sessionContextReference":
      return !isBlank(proofPackage.sessionContextReference);
  }
}

function collectVerificationReasons(
  proofPackage: AgentProofPackage,
  request: AgentProofVerificationRequest,
  challenge: GatePassChallenge | undefined,
  missingProofItems: readonly AgentProofRequiredItem[],
  proveYourselfReasons: readonly string[],
): string[] {
  const reasons = [
    "proof_contract_local_only",
    "claimed_identity_not_trust",
    ...proveYourselfReasons,
    ...missingProofItems.map((item) => `missing_${item}`),
  ];
  if (!proofPackage.localDemoOnly || !request.localDemoOnly || challenge?.localDemoOnly === false) {
    reasons.push("local_demo_only_required");
  }
  if (request.humanReviewRequired) reasons.push("verification_request_requires_human_review");
  if (request.settlementSensitive || proofPackage.settlementSensitive) {
    reasons.push("verification_request_settlement_sensitive");
  }
  if (challenge?.requiredSignedProof) reasons.push("challenge_requires_signed_proof");
  if (challenge?.requiredHumanApproval) reasons.push("challenge_requires_human_approval");
  if (proofPackage.verifiedIntentStatus !== "verified") {
    reasons.push(`contract_verified_intent_${proofPackage.verifiedIntentStatus}`);
  }
  if (proofPackage.freshnessStatus !== "present") reasons.push(`contract_freshness_${proofPackage.freshnessStatus}`);
  if (proofPackage.nonceStatus !== "present") reasons.push(`contract_nonce_${proofPackage.nonceStatus}`);
  if (proofPackage.signedProofStatus !== "present") reasons.push(`contract_signed_proof_${proofPackage.signedProofStatus}`);
  return unique(reasons);
}

function decideAgentProofContractOutcome(
  proofPackage: AgentProofPackage,
  request: AgentProofVerificationRequest,
  challenge: GatePassChallenge | undefined,
  missingProofItems: readonly AgentProofRequiredItem[],
  reasons: readonly string[],
  proveYourselfDecision: ProveYourselfDecision,
): AgentProofDecision {
  if (!proofPackage.localDemoOnly || !request.localDemoOnly || challenge?.localDemoOnly === false) return "block";
  if (hasOnlyClaimedIdentity(proofPackage)) return "block";
  if (missingProofItems.includes("mandateReference")) return "block";
  if (proofPackage.freshnessStatus === "stale" || proofPackage.freshnessStatus === "replayed") return "block";
  if (proofPackage.nonceStatus === "stale" || proofPackage.nonceStatus === "replayed") return "block";
  if (proofPackage.signedProofStatus === "tampered" || proofPackage.signedProofStatus === "malformed") return "block";
  if (proofPackage.humanApprovalStatus === "rejected") return "block";
  if (missingProofItems.includes("evidenceReference")) return "require_evidence";
  if (proofPackage.verifiedIntentStatus === "missing" || proofPackage.verifiedIntentStatus === "conflicting") return "block";
  if (proofPackage.verifiedIntentStatus === "unverified") return "escalate";
  if (
    proofPackage.settlementSensitive
    || request.settlementSensitive
    || challenge?.requiredSignedProof === true
  ) {
    if (missingProofItems.includes("signedProofReference") || proofPackage.signedProofStatus !== "present") {
      return "require_signed_proof";
    }
  }
  if (
    proofPackage.riskTier === "high"
    || proofPackage.riskTier === "critical"
    || request.humanReviewRequired
    || challenge?.requiredHumanApproval === true
    || proofPackage.humanApprovalStatus === "required_missing"
  ) {
    return "require_human_review";
  }
  if (missingProofItems.length > 0) return "escalate";
  if (proveYourselfDecision !== "allow") return proveYourselfDecision;
  if (reasons.some((reason) => reason.startsWith("contract_nonce_"))) return "block";
  return "allow";
}

function requiredNextProofForDecision(
  decision: AgentProofDecision,
  missingProofItems: readonly AgentProofRequiredItem[],
  proofPackage: AgentProofPackage,
  request: AgentProofVerificationRequest,
  challenge?: GatePassChallenge,
): string[] {
  const missing = missingProofItems.map((item) => `present_${item}`);
  switch (decision) {
    case "allow":
      return ["record_local_verification_result", "continue_local_demo_only"];
    case "block":
      return missing.length > 0
        ? unique([...missing, "present_fresh_non_replayed_scoped_proof"])
        : ["stop_request", "present_fresh_non_replayed_scoped_proof"];
    case "escalate":
      return unique([...missing, "clarify_verified_intent", "route_to_local_reviewer"]);
    case "require_evidence":
      return unique(["present_evidenceReference", "bind_evidence_to_requested_action", ...missing]);
    case "require_human_review":
      return unique(["obtain_human_review", "bind_approval_to_scope_nonce_and_challenge", ...missing]);
    case "require_signed_proof":
      return proofPackage.settlementSensitive || request.settlementSensitive || challenge?.requiredSignedProof === true
        ? unique(["present_valid_signed_gate_pass", "prove_scope_freshness_and_nonce_before_settlement", ...missing])
        : unique(["present_signedProofReference", ...missing]);
  }
}

function createGatePassMeaning(
  proofPackage: AgentProofPackage,
  request: AgentProofVerificationRequest,
  challenge: GatePassChallenge | undefined,
  decision: AgentProofDecision,
): AgentProofVerificationResult["gatePassMeaning"] {
  const mayProveLocally = [
    "required_proof_items_were_checked_against_a_local_verification_request",
    "claimed_identity_was_not_treated_as_sufficient_proof",
    "mandate_evidence_intent_scope_freshness_nonce_and_signed_proof_status_were_checked_locally",
    `local_decision_${decision}`,
  ];
  if (proofPackage.signedProofStatus === "present") mayProveLocally.push("signed_proof_reference_was_present_locally");
  if (request.settlementSensitive || proofPackage.settlementSensitive) {
    mayProveLocally.push("settlement_sensitive_path_requires_valid_signed_gate_pass_before_any_settlement");
  } else if (challenge?.requiredSignedProof === true) {
    mayProveLocally.push("challenge_required_signed_proof_before_local_allow_decision");
  }
  return {
    mayProveLocally,
    doesNotProve: [
      "universal_agent_identity",
      "production_authentication",
      "legal_compliance_or_security_certification",
      "payment_or_settlement_authority",
      "permission_to_execute_actions",
      "live_systems_contact_or_agent_to_agent_communication",
    ],
  };
}

function hasOnlyClaimedIdentity(proofPackage: AgentProofPackage): boolean {
  return isBlank(proofPackage.ownerReference)
    && isBlank(proofPackage.issuerReference)
    && isBlank(proofPackage.mandateReference)
    && isBlank(proofPackage.permittedActionScope)
    && isBlank(proofPackage.evidenceReference)
    && proofPackage.verifiedIntentStatus === "missing"
    && isBlank(proofPackage.nonce)
    && proofPackage.nonceStatus === "missing"
    && isBlank(proofPackage.signedProofReference)
    && proofPackage.signedProofStatus === "missing";
}

function countDecisions(results: readonly AgentProofVerificationResult[]): Record<AgentProofDecision, number> {
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

function createResultId(
  proofPackage: AgentProofPackage,
  request: AgentProofVerificationRequest,
  challenge: GatePassChallenge | undefined,
  decision: AgentProofDecision,
  reasons: readonly string[],
): string {
  const challengePart = challenge === undefined ? "no_challenge" : challenge.challengeId;
  return `agent_proof_result_${createHash("sha256")
    .update(`${AGENT_PROOF_CONTRACT_VERSION}|${proofPackage.packageId}|${request.requestId}|${challengePart}|${decision}|${reasons.join(",")}`, "utf8")
    .digest("hex")
    .slice(0, 24)}`;
}

function createPackId(results: readonly AgentProofVerificationResult[]): string {
  const seed = results
    .map((result) => `${result.packageId}:${result.requestId}:${result.decision}:${result.reasons.join(",")}`)
    .join("|");
  return `agent_proof_contract_${createHash("sha256")
    .update(`${AGENT_PROOF_CONTRACT_VERSION}|${seed}`, "utf8")
    .digest("hex")
    .slice(0, 24)}`;
}

function isBlank(value: string | null): boolean {
  return value === null || value.trim() === "";
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}
