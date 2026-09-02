import {
  InMemoryNonceStore,
  createBaseExactActionInput,
  createCanonicalActionEnvelope,
  createFixedTrustedClock,
  createVerifierContext,
  issueExactActionGatePass,
  verifyExactActionAtExecution,
  type CanonicalActionEnvelopeInput,
} from "./exact-action-gatepass.js";
import {
  LOCAL_SIGNED_PROOF_ALGORITHM,
  createCanonicalPayloadHash,
  createDeterministicLocalFixtureKeyPair,
  signCanonicalLocalFixturePayload,
  verifyCanonicalLocalFixturePayload,
  type DeterministicLocalFixtureKeyPair,
} from "./local-signed-proof.js";

export const AGENT_STANDING_PROOF_VERSION = "atg.agent-standing-proof.local.v1" as const;
export const AGENT_STANDING_DELEGATION_VERSION = "atg.agent-standing-delegation.local.v1" as const;
export const AGENT_STANDING_CHALLENGE_VERSION = "atg.agent-standing-key-challenge.local.v1" as const;
export const AGENT_STANDING_RECEIPT_VERSION = "atg.agent-standing-decision-receipt.local.v1" as const;
export const AGENT_STANDING_DEMO_VERSION = "atg.agent-standing-demo.local.v1" as const;
export const AGENT_STANDING_REFERENCE_TIME = "2026-08-02T09:00:00.000Z" as const;
export const AGENT_STANDING_CORE_RULE =
  "No verified agent identity. No verified principal. No valid delegation. No standing to request a GatePass." as const;
export const AGENT_STANDING_PUBLIC_CLAIM =
  "ATG locally demonstrates how a requester can prove control of a registered software-agent identity, present signed evidence of its accountable principal and delegated authority, and bind the exact request to that standing before GatePass evaluation begins." as const;

export type AgentStandingOutcome = "STANDING_VERIFIED" | "STANDING_REFUSED" | "STANDING_UNVERIFIABLE";
export type AgentStandingAssurance = "S0" | "S1" | "S2" | "S3" | "S4" | "S5";
export type AgentPrincipalType = "individual" | "organisation";
export type SoftwareAgentCategory = "tool_calling_agent" | "workflow_agent" | "sub_agent";
export type DelegationRevocationState = "active" | "revoked" | "unknown";
export type AgentStandingEvidenceType =
  | "agent_identity"
  | "account_or_platform_identity"
  | "agent_public_key"
  | "principal_identity"
  | "organisation_sponsor"
  | "accountable_human_sponsor"
  | "delegation"
  | "revocation_status";

export type AgentStandingReasonCode =
  | "STANDING_ALL_CHECKS_PASSED"
  | "STANDING_PROOF_MISSING"
  | "STANDING_AGENT_IDENTITY_EVIDENCE_MISSING"
  | "STANDING_AGENT_KEY_UNKNOWN"
  | "STANDING_KEY_CHALLENGE_MISSING"
  | "STANDING_KEY_CHALLENGE_INVALID"
  | "STANDING_PROOF_SIGNATURE_INVALID"
  | "STANDING_PRINCIPAL_EVIDENCE_MISSING"
  | "STANDING_ORGANISATION_SPONSOR_MISSING"
  | "STANDING_ACCOUNTABLE_HUMAN_SPONSOR_MISSING"
  | "STANDING_DELEGATION_MISSING"
  | "STANDING_DELEGATION_SIGNATURE_INVALID"
  | "STANDING_DELEGATION_AGENT_MISMATCH"
  | "STANDING_DELEGATION_PRINCIPAL_MISMATCH"
  | "STANDING_DELEGATION_ISSUER_MISMATCH"
  | "STANDING_DELEGATION_NOT_YET_ACTIVE"
  | "STANDING_DELEGATION_EXPIRED"
  | "STANDING_DELEGATION_REVOKED"
  | "STANDING_DELEGATION_REVOCATION_UNKNOWN"
  | "STANDING_PURPOSE_OUT_OF_SCOPE"
  | "STANDING_ACTION_OUT_OF_SCOPE"
  | "STANDING_AMOUNT_LIMIT_EXCEEDED"
  | "STANDING_RESOURCE_LIMIT_EXCEEDED"
  | "STANDING_COUNTERPARTY_NOT_PERMITTED"
  | "STANDING_DELEGATION_DEPTH_EXCEEDED"
  | "STANDING_REQUEST_DIGEST_MISMATCH"
  | "STANDING_SESSION_BINDING_MISMATCH"
  | "STANDING_RUN_BINDING_MISMATCH"
  | "STANDING_REQUIRED_EVIDENCE_MISSING"
  | "STANDING_ASSURANCE_CLAIM_MISMATCH"
  | "STANDING_RUNTIME_ATTESTATION_NOT_IMPLEMENTED";

export interface AgentStandingResourceLimit {
  resource: string;
  maximum: number;
}

export interface AgentStandingRequestedResource {
  resource: string;
  quantity: number;
}

export interface AgentStandingEvidenceReference {
  type: AgentStandingEvidenceType;
  reference: string;
  status: "present" | "missing";
  localFixtureOnly: true;
}

export interface AgentStandingSignatureMetadata {
  algorithm: typeof LOCAL_SIGNED_PROOF_ALGORITHM;
  keyId: string;
  signedAt: string;
  payloadHash: string;
  localFixtureOnly: true;
  deterministicPublicFixture: true;
  productionKeyCustody: false;
  signature: string;
}

export interface AgentKeyControlChallenge {
  version: typeof AGENT_STANDING_CHALLENGE_VERSION;
  nonce: string | null;
  agentIdentifier: string;
  agentPublicKeyReference: string;
  exactRequestDigest: string;
  sessionBinding: string | null;
  runBinding: string | null;
  signatureMetadata: AgentStandingSignatureMetadata | null;
}

export interface SignedAgentDelegation {
  version: typeof AGENT_STANDING_DELEGATION_VERSION;
  delegationIdentifier: string | null;
  delegationIssuer: string | null;
  issuerPublicKeyReference: string | null;
  agentIdentifier: string | null;
  principalIdentifier: string | null;
  permittedPurposes: string[];
  permittedActions: string[];
  maximumAmountMinorUnits: number | null;
  currency: string | null;
  resourceLimits: AgentStandingResourceLimit[];
  permittedCounterparties: string[] | null;
  issuedAt: string | null;
  expiresAt: string | null;
  revocationState: DelegationRevocationState;
  revocationReference: string | null;
  delegationDepth: number | null;
  maximumDelegationDepth: number | null;
  exactRequestDigest: string | null;
  sessionBinding: string | null;
  runBinding: string | null;
  signatureMetadata: AgentStandingSignatureMetadata | null;
}

export interface AgentStandingProof {
  version: typeof AGENT_STANDING_PROOF_VERSION;
  proofIdentifier: string;
  agentIdentifier: string;
  agentPublicKeyReference: string;
  declaredSoftwareAgentCategory: SoftwareAgentCategory;
  accountOrPlatformIdentity: string | null;
  principalIdentifier: string | null;
  principalType: AgentPrincipalType | null;
  organisationSponsorIdentifier: string | null;
  accountableHumanSponsorReference: string | null;
  delegation: SignedAgentDelegation;
  challenge: AgentKeyControlChallenge;
  exactRequestDigest: string;
  sessionBinding: string | null;
  runBinding: string | null;
  evidenceReferences: AgentStandingEvidenceReference[];
  assuranceClassification: AgentStandingAssurance;
  limitations: string[];
  signatureMetadata: AgentStandingSignatureMetadata;
}

export interface AgentStandingRequest {
  requestIdentifier: string;
  agentIdentifier: string;
  principalIdentifier: string | null;
  purpose: string;
  action: string;
  amountMinorUnits: number | null;
  currency: string | null;
  requestedResources: AgentStandingRequestedResource[];
  counterpartyIdentifier: string | null;
  sessionBinding: string | null;
  runBinding: string | null;
}

export interface AgentStandingClaim {
  agentIdentifier: string;
  accountOrPlatformIdentity: string | null;
  declaredAssuranceClassification: AgentStandingAssurance;
}

export interface AgentStandingEvaluationInput {
  claim: AgentStandingClaim;
  request: AgentStandingRequest;
  proof: AgentStandingProof | null;
  checkedAt?: string;
}

export interface AgentStandingChecks {
  identityEvidencePresent: boolean;
  keyControlChallengeValid: boolean;
  proofSignatureValid: boolean;
  principalEvidencePresent: boolean;
  delegationPresent: boolean;
  delegationSignatureValid: boolean;
  delegationActive: boolean;
  scopeAndLimitsValid: boolean;
  exactRequestBindingValid: boolean;
  sessionRunBindingValid: boolean;
  allRequiredEvidencePresent: boolean;
}

export interface AgentStandingGatePassEvaluation {
  attempted: boolean;
  verified: boolean;
  gatePassId: string | null;
  actionDigest: string;
  reasonCodes: string[];
  externalActionOccurred: false;
}

export interface AgentStandingDecisionReceipt {
  version: typeof AGENT_STANDING_RECEIPT_VERSION;
  receiptIdentifier: string;
  outcome: AgentStandingOutcome;
  reasonCodes: AgentStandingReasonCode[];
  checkedAt: string;
  agentIdentifier: string;
  accountOrPlatformIdentity: string | null;
  principalIdentifier: string | null;
  organisationSponsorIdentifier: string | null;
  accountableHumanSponsorReference: string | null;
  exactRequestDigest: string;
  presentedRequestDigest: string | null;
  declaredAssuranceClassification: AgentStandingAssurance;
  verifiedAssuranceClassification: Exclude<AgentStandingAssurance, "S5">;
  limitations: string[];
  checks: AgentStandingChecks;
  gatePassEvaluationMayBegin: boolean;
  gatePassEvaluation: AgentStandingGatePassEvaluation;
  localFixtureOnly: true;
  externalActionsPerformed: false;
  paymentAuthorisation: false;
  settlementAuthorisation: false;
  note: "Agent Standing is a fail-closed GatePass precondition. A fixture signature authenticates a fixture assertion but does not establish that every assertion is factually true.";
}

export type AgentStandingScenarioId =
  | "self_declared_only"
  | "invalid_key_challenge"
  | "key_proven_no_delegation"
  | "expired_delegation"
  | "revoked_delegation"
  | "scope_mismatch"
  | "authority_limit_breach"
  | "request_digest_changed"
  | "delegation_depth_exceeded"
  | "valid_individual_sponsored_agent"
  | "valid_organisation_sponsored_agent"
  | "valid_standing_then_gatepass";

export interface AgentStandingScenario {
  scenarioId: AgentStandingScenarioId;
  title: string;
  description: string;
  expectedOutcome: AgentStandingOutcome;
  input: AgentStandingEvaluationInput;
  evaluateGatePassAfterStanding: boolean;
}

export interface AgentStandingScenarioResult {
  scenarioId: AgentStandingScenarioId;
  title: string;
  description: string;
  expectedOutcome: AgentStandingOutcome;
  matchedExpectation: boolean;
  request: AgentStandingRequest;
  proof: AgentStandingProof | null;
  receipt: AgentStandingDecisionReceipt;
}

export interface AgentStandingDemoSummary {
  demoVersion: typeof AGENT_STANDING_DEMO_VERSION;
  totalScenarios: number;
  matchedScenarios: number;
  outcomes: Record<AgentStandingOutcome, number>;
  expectedVerifiedCasesPassed: boolean;
  expectedRefusalsPassed: boolean;
  expectedUnverifiableCasesPassed: boolean;
  agentKeyControlChallengePassed: boolean;
  principalAndDelegationChecksPassed: boolean;
  scopeLimitExpiryAndRevocationChecksPassed: boolean;
  exactRequestBindingPassed: boolean;
  gatePassPreconditionPassed: boolean;
  externalActionsPerformed: false;
  overallPassed: boolean;
}

export interface AgentStandingDemoReport {
  demoVersion: typeof AGENT_STANDING_DEMO_VERSION;
  coreRule: typeof AGENT_STANDING_CORE_RULE;
  publicClaim: typeof AGENT_STANDING_PUBLIC_CLAIM;
  referenceTime: typeof AGENT_STANDING_REFERENCE_TIME;
  summary: AgentStandingDemoSummary;
  results: AgentStandingScenarioResult[];
}

export interface NorthstarAgentStandingFixtureOptions {
  requestIdentifier?: string;
  amountMinorUnits?: number;
  currency?: string;
  quantity?: number;
  counterpartyIdentifier?: string;
  checkedAt?: string;
  issuedAt?: string;
  expiresAt?: string;
  disabled?: boolean;
}

const NOTE = "Agent Standing is a fail-closed GatePass precondition. A fixture signature authenticates a fixture assertion but does not establish that every assertion is factually true." as const;
const AGENT_INDIVIDUAL_KEY_REFERENCE = "fixture-key://agent-individual-001";
const AGENT_ORGANISATION_KEY_REFERENCE = "fixture-key://agent-organisation-001";
const PRINCIPAL_INDIVIDUAL_KEY_REFERENCE = "fixture-key://principal-individual-001";
const PRINCIPAL_ORGANISATION_KEY_REFERENCE = "fixture-key://principal-organisation-001";
const INDIVIDUAL_AGENT_ID = "synthetic_agent_individual_001";
const ORGANISATION_AGENT_ID = "synthetic_agent_organisation_001";
const INDIVIDUAL_PRINCIPAL_ID = "synthetic_principal_individual_001";
const ORGANISATION_PRINCIPAL_ID = "synthetic_organisation_sponsor_001";
const ACCOUNTABLE_HUMAN_REFERENCE = "fixture://accountable-human-sponsors/sponsor_001";
export const NORTHSTAR_PROCUREMENT_AGENT_ID = "agent:northstar-retail:procurement:04" as const;
export const NORTHSTAR_ORGANISATION_ID = "ORG-NORTHSTAR-RETAIL-SYNTHETIC" as const;
const FIXTURE_KEYS = new Map<string, DeterministicLocalFixtureKeyPair>([
  [AGENT_INDIVIDUAL_KEY_REFERENCE, createDeterministicLocalFixtureKeyPair("agent-standing-agent-individual-001")],
  [AGENT_ORGANISATION_KEY_REFERENCE, createDeterministicLocalFixtureKeyPair("agent-standing-agent-organisation-001")],
  [PRINCIPAL_INDIVIDUAL_KEY_REFERENCE, createDeterministicLocalFixtureKeyPair("agent-standing-principal-individual-001")],
  [PRINCIPAL_ORGANISATION_KEY_REFERENCE, createDeterministicLocalFixtureKeyPair("agent-standing-principal-organisation-001")],
]);
const AGENT_IDENTITY_FIXTURES = new Map<string, {
  publicKeyReference: string;
  accountOrPlatformIdentity: string;
}>([
  [INDIVIDUAL_AGENT_ID, {
    publicKeyReference: AGENT_INDIVIDUAL_KEY_REFERENCE,
    accountOrPlatformIdentity: "synthetic_platform_account_individual_001",
  }],
  [ORGANISATION_AGENT_ID, {
    publicKeyReference: AGENT_ORGANISATION_KEY_REFERENCE,
    accountOrPlatformIdentity: "synthetic_platform_account_organisation_001",
  }],
  [NORTHSTAR_PROCUREMENT_AGENT_ID, {
    publicKeyReference: AGENT_ORGANISATION_KEY_REFERENCE,
    accountOrPlatformIdentity: "synthetic_platform_account_organisation_001",
  }],
]);
const PRINCIPAL_IDENTITY_FIXTURES = new Map<string, {
  principalType: AgentPrincipalType;
  issuerPublicKeyReference: string;
  accountableHumanSponsorReference: string | null;
}>([
  [INDIVIDUAL_PRINCIPAL_ID, {
    principalType: "individual",
    issuerPublicKeyReference: PRINCIPAL_INDIVIDUAL_KEY_REFERENCE,
    accountableHumanSponsorReference: null,
  }],
  [ORGANISATION_PRINCIPAL_ID, {
    principalType: "organisation",
    issuerPublicKeyReference: PRINCIPAL_ORGANISATION_KEY_REFERENCE,
    accountableHumanSponsorReference: ACCOUNTABLE_HUMAN_REFERENCE,
  }],
  [NORTHSTAR_ORGANISATION_ID, {
    principalType: "organisation",
    issuerPublicKeyReference: PRINCIPAL_ORGANISATION_KEY_REFERENCE,
    accountableHumanSponsorReference: ACCOUNTABLE_HUMAN_REFERENCE,
  }],
]);
const PROOF_LIMITATIONS = [
  "Local deterministic fixture evidence only; no real company, individual, registry, credential, SSO, WebAuthn, or runtime attestation was checked.",
  "A valid fixture signature proves fixture-key control and signed-data integrity, not the factual truth of every signed assertion.",
  "Agent Standing is a precondition to GatePass evaluation, not a certification that an agent is intelligent, conscious, autonomous, honest, safe, or compliant.",
] as const;

export function createAgentStandingExactActionInput(request: AgentStandingRequest): CanonicalActionEnvelopeInput {
  const requestEvidence = {
    requestIdentifier: request.requestIdentifier,
    purpose: request.purpose,
    action: request.action,
    amountMinorUnits: request.amountMinorUnits,
    currency: request.currency,
    requestedResources: request.requestedResources,
    counterpartyIdentifier: request.counterpartyIdentifier,
    sessionBinding: request.sessionBinding,
    runBinding: request.runBinding,
  };
  return createBaseExactActionInput({
    subjectAgentIdentity: request.agentIdentifier,
    nativeSessionId: request.sessionBinding ?? "not_supplied",
    nativeRunId: request.runBinding ?? "not_supplied",
    operatorIdentity: request.principalIdentifier,
    mandateIdentity: request.principalIdentifier,
    mandateReference: `standing-request://${request.requestIdentifier}/principal`,
    mandateDigest: createCanonicalPayloadHash({ principalIdentifier: request.principalIdentifier }),
    policyReference: "policy://local/agent-standing-before-gatepass-v1",
    policyDigest: createCanonicalPayloadHash({
      standingProofVersion: AGENT_STANDING_PROOF_VERSION,
      coreRule: AGENT_STANDING_CORE_RULE,
    }),
    evidenceReference: `evidence://local/agent-standing/${request.requestIdentifier}`,
    evidenceDigest: createCanonicalPayloadHash(requestEvidence),
    humanApprovalReference: "approval://local/synthetic-agent-standing-fixture",
    humanApprovalDigest: createCanonicalPayloadHash({ localFixtureOnly: true, externalAction: false }),
    toolIdentity: "local.agent-standing-gated-gatepass-request",
    toolSchemaVersion: "1.0.0",
    operationName: request.action,
    canonicalArguments: requestEvidence,
    targetIdentity: request.counterpartyIdentifier ?? "not_supplied",
    amount: request.amountMinorUnits === null ? null : request.amountMinorUnits / 100,
    currency: request.currency,
    operatingEnvironment: "local_agent_standing_simulation",
    issuedAt: "2026-08-02T08:55:00.000Z",
    notBefore: "2026-08-02T08:55:00.000Z",
    expiresAt: "2026-08-02T09:10:00.000Z",
    nonce: `nonce_agent_standing_${request.requestIdentifier}`,
    idempotencyKey: `idempotency_agent_standing_${request.requestIdentifier}`,
  });
}

export function createAgentStandingRequestDigest(request: AgentStandingRequest): string {
  return createCanonicalActionEnvelope(createAgentStandingExactActionInput(request)).actionDigest;
}

export function createNorthstarAgentStandingFixture(
  options: NorthstarAgentStandingFixtureOptions = {},
): AgentStandingEvaluationInput {
  const requestIdentifier = options.requestIdentifier ?? "northstar_procurement_purchase_001";
  const request = createRequest(
    requestIdentifier,
    NORTHSTAR_PROCUREMENT_AGENT_ID,
    NORTHSTAR_ORGANISATION_ID,
    {
      purpose: "supplier_purchasing",
      action: "simulate_procurement_purchase",
      amountMinorUnits: options.amountMinorUnits ?? 2_375_000,
      currency: options.currency ?? "GBP",
      requestedResources: [{ resource: "product_x", quantity: options.quantity ?? 200 }],
      counterpartyIdentifier: options.counterpartyIdentifier ?? "SUP-HARBOUR-001",
      sessionBinding: `northstar_session_${requestIdentifier}`,
      runBinding: `northstar_run_${requestIdentifier}`,
    },
  );
  const proof = createSignedStandingProof(request, "organisation", {
    maximumAmountMinorUnits: 2_500_000,
    issuedAt: options.issuedAt ?? "2026-09-02T08:50:00.000Z",
    expiresAt: options.expiresAt ?? "2026-09-02T17:00:00.000Z",
    revocationState: options.disabled === true ? "revoked" : "active",
  });
  return {
    claim: {
      agentIdentifier: request.agentIdentifier,
      accountOrPlatformIdentity: proof.accountOrPlatformIdentity,
      declaredAssuranceClassification: proof.assuranceClassification,
    },
    request,
    proof,
    checkedAt: options.checkedAt ?? "2026-09-02T09:00:00.000Z",
  };
}

export function evaluateAgentStanding(
  input: AgentStandingEvaluationInput,
  evaluateGatePassAfterStanding = false,
): AgentStandingDecisionReceipt {
  const checkedAt = safeTimestamp(input.checkedAt ?? AGENT_STANDING_REFERENCE_TIME);
  const requestDigest = createAgentStandingRequestDigest(input.request);
  const proof = input.proof;
  if (proof === null) {
    return createDecisionReceipt({
      input,
      checkedAt,
      requestDigest,
      presentedRequestDigest: null,
      outcome: "STANDING_UNVERIFIABLE",
      reasons: [
        "STANDING_PROOF_MISSING",
        "STANDING_AGENT_IDENTITY_EVIDENCE_MISSING",
        "STANDING_KEY_CHALLENGE_MISSING",
        "STANDING_PRINCIPAL_EVIDENCE_MISSING",
        "STANDING_DELEGATION_MISSING",
        "STANDING_REQUIRED_EVIDENCE_MISSING",
      ],
      verifiedAssurance: input.claim.accountOrPlatformIdentity === null ? "S0" : "S1",
      checks: emptyChecks(),
      evaluateGatePassAfterStanding: false,
    });
  }

  const reasons: AgentStandingReasonCode[] = [];
  const agentKey = FIXTURE_KEYS.get(proof.agentPublicKeyReference);
  const agentFixture = AGENT_IDENTITY_FIXTURES.get(proof.agentIdentifier);
  const identityEvidencePresent = agentFixture !== undefined
    && proof.agentIdentifier === input.claim.agentIdentifier
    && proof.agentPublicKeyReference === agentFixture.publicKeyReference
    && proof.accountOrPlatformIdentity === agentFixture.accountOrPlatformIdentity
    && input.claim.accountOrPlatformIdentity === proof.accountOrPlatformIdentity
    && hasEvidence(proof, "agent_identity", `fixture://agent-registry/${proof.agentIdentifier}`)
    && hasEvidence(proof, "agent_public_key", proof.agentPublicKeyReference);
  if (!identityEvidencePresent) reasons.push("STANDING_AGENT_IDENTITY_EVIDENCE_MISSING");
  if (agentKey === undefined) reasons.push("STANDING_AGENT_KEY_UNKNOWN");

  const challengePresent = proof.challenge.nonce !== null && proof.challenge.signatureMetadata !== null;
  if (!challengePresent) reasons.push("STANDING_KEY_CHALLENGE_MISSING");
  const challengePayload = unsignedChallenge(proof.challenge);
  const keyControlChallengeValid = agentKey !== undefined
    && challengePresent
    && proof.challenge.agentIdentifier === proof.agentIdentifier
    && proof.challenge.agentPublicKeyReference === proof.agentPublicKeyReference
    && verifySignatureMetadata(challengePayload, proof.challenge.signatureMetadata, agentKey);
  if (challengePresent && !keyControlChallengeValid) reasons.push("STANDING_KEY_CHALLENGE_INVALID");

  const proofSignatureValid = agentKey !== undefined
    && verifySignatureMetadata(unsignedProof(proof), proof.signatureMetadata, agentKey);
  if (!proofSignatureValid) reasons.push("STANDING_PROOF_SIGNATURE_INVALID");

  const principalFixture = proof.principalIdentifier === null
    ? undefined
    : PRINCIPAL_IDENTITY_FIXTURES.get(proof.principalIdentifier);
  const principalEvidencePresent = principalFixture !== undefined
    && proof.principalType !== null
    && proof.principalType === principalFixture.principalType
    && proof.principalIdentifier === input.request.principalIdentifier
    && hasEvidence(proof, "principal_identity", `fixture://principal-registry/${proof.principalIdentifier}`);
  if (!principalEvidencePresent) reasons.push("STANDING_PRINCIPAL_EVIDENCE_MISSING");

  const organisationSponsorPresent = proof.principalType !== "organisation"
    || (principalFixture?.principalType === "organisation"
      && proof.organisationSponsorIdentifier !== null
      && proof.organisationSponsorIdentifier === proof.principalIdentifier
      && hasEvidence(
        proof,
        "organisation_sponsor",
        `fixture://organisation-sponsors/${proof.organisationSponsorIdentifier}`,
      ));
  if (!organisationSponsorPresent) reasons.push("STANDING_ORGANISATION_SPONSOR_MISSING");
  const accountableHumanSponsorPresent = proof.principalType !== "organisation"
    || (principalFixture?.accountableHumanSponsorReference !== null
      && proof.accountableHumanSponsorReference === principalFixture?.accountableHumanSponsorReference
      && proof.accountableHumanSponsorReference !== null
      && hasEvidence(proof, "accountable_human_sponsor", proof.accountableHumanSponsorReference));
  if (!accountableHumanSponsorPresent) reasons.push("STANDING_ACCOUNTABLE_HUMAN_SPONSOR_MISSING");

  const delegation = proof.delegation;
  const delegationPresent = hasDelegation(delegation)
    && hasEvidence(proof, "delegation", `fixture://delegations/${delegation.delegationIdentifier ?? "missing"}`);
  if (!delegationPresent) reasons.push("STANDING_DELEGATION_MISSING");
  const issuerKey = delegation.issuerPublicKeyReference === null
    ? undefined
    : FIXTURE_KEYS.get(delegation.issuerPublicKeyReference);
  const delegationSignatureValid = delegationPresent
    && issuerKey !== undefined
    && verifySignatureMetadata(unsignedDelegation(delegation), delegation.signatureMetadata, issuerKey);
  if (delegationPresent && !delegationSignatureValid) reasons.push("STANDING_DELEGATION_SIGNATURE_INVALID");

  if (delegationPresent && delegation.agentIdentifier !== proof.agentIdentifier) {
    reasons.push("STANDING_DELEGATION_AGENT_MISMATCH");
  }
  if (delegationPresent && delegation.principalIdentifier !== proof.principalIdentifier) {
    reasons.push("STANDING_DELEGATION_PRINCIPAL_MISMATCH");
  }
  const expectedIssuer = proof.principalType === "organisation"
    ? proof.organisationSponsorIdentifier
    : proof.principalIdentifier;
  if (delegationPresent && (delegation.delegationIssuer !== expectedIssuer
    || delegation.issuerPublicKeyReference !== principalFixture?.issuerPublicKeyReference)) {
    reasons.push("STANDING_DELEGATION_ISSUER_MISMATCH");
  }

  const checkedAtMs = Date.parse(checkedAt);
  const issuedAtMs = Date.parse(delegation.issuedAt ?? "");
  const expiresAtMs = Date.parse(delegation.expiresAt ?? "");
  if (delegationPresent && (Number.isNaN(issuedAtMs) || issuedAtMs > checkedAtMs)) {
    reasons.push("STANDING_DELEGATION_NOT_YET_ACTIVE");
  }
  if (delegationPresent && (Number.isNaN(expiresAtMs) || expiresAtMs <= checkedAtMs)) {
    reasons.push("STANDING_DELEGATION_EXPIRED");
  }
  if (delegationPresent && delegation.revocationState === "revoked") {
    reasons.push("STANDING_DELEGATION_REVOKED");
  }
  if (delegationPresent && delegation.revocationState === "unknown") {
    reasons.push("STANDING_DELEGATION_REVOCATION_UNKNOWN");
  }
  const revocationEvidencePresent = delegation.revocationReference !== null
    && hasEvidence(proof, "revocation_status", delegation.revocationReference);

  if (delegationPresent && !delegation.permittedPurposes.includes(input.request.purpose)) {
    reasons.push("STANDING_PURPOSE_OUT_OF_SCOPE");
  }
  if (delegationPresent && !delegation.permittedActions.includes(input.request.action)) {
    reasons.push("STANDING_ACTION_OUT_OF_SCOPE");
  }
  if (delegationPresent && !amountWithinLimit(input.request, delegation)) {
    reasons.push("STANDING_AMOUNT_LIMIT_EXCEEDED");
  }
  if (delegationPresent && !resourcesWithinLimits(input.request, delegation)) {
    reasons.push("STANDING_RESOURCE_LIMIT_EXCEEDED");
  }
  if (delegationPresent && !counterpartyPermitted(input.request, delegation)) {
    reasons.push("STANDING_COUNTERPARTY_NOT_PERMITTED");
  }
  if (delegationPresent && !delegationDepthValid(delegation)) {
    reasons.push("STANDING_DELEGATION_DEPTH_EXCEEDED");
  }

  const exactRequestBindingValid = proof.exactRequestDigest === requestDigest
    && proof.challenge.exactRequestDigest === requestDigest
    && delegation.exactRequestDigest === requestDigest;
  if (!exactRequestBindingValid) reasons.push("STANDING_REQUEST_DIGEST_MISMATCH");
  const sessionBindingValid = proof.sessionBinding === input.request.sessionBinding
    && proof.challenge.sessionBinding === input.request.sessionBinding
    && delegation.sessionBinding === input.request.sessionBinding;
  if (!sessionBindingValid) reasons.push("STANDING_SESSION_BINDING_MISMATCH");
  const runBindingValid = proof.runBinding === input.request.runBinding
    && proof.challenge.runBinding === input.request.runBinding
    && delegation.runBinding === input.request.runBinding;
  if (!runBindingValid) reasons.push("STANDING_RUN_BINDING_MISMATCH");

  const allRequiredEvidencePresent = requiredEvidencePresent(proof) && revocationEvidencePresent;
  if (!allRequiredEvidencePresent) reasons.push("STANDING_REQUIRED_EVIDENCE_MISSING");

  const verifiedAssurance = computeVerifiedAssurance({
    proof,
    identityEvidencePresent,
    keyControlChallengeValid,
    proofSignatureValid,
    principalEvidencePresent,
    delegationPresent,
    delegationSignatureValid,
    organisationSponsorPresent,
    accountableHumanSponsorPresent,
  });
  if (proof.assuranceClassification === "S5") {
    reasons.push("STANDING_RUNTIME_ATTESTATION_NOT_IMPLEMENTED");
  }
  if (proof.assuranceClassification !== verifiedAssurance) {
    reasons.push("STANDING_ASSURANCE_CLAIM_MISMATCH");
  }

  const scopeAndLimitsValid = !reasons.some((reason) => [
    "STANDING_PURPOSE_OUT_OF_SCOPE",
    "STANDING_ACTION_OUT_OF_SCOPE",
    "STANDING_AMOUNT_LIMIT_EXCEEDED",
    "STANDING_RESOURCE_LIMIT_EXCEEDED",
    "STANDING_COUNTERPARTY_NOT_PERMITTED",
    "STANDING_DELEGATION_DEPTH_EXCEEDED",
  ].includes(reason));
  const delegationActive = delegationPresent && !reasons.some((reason) => [
    "STANDING_DELEGATION_NOT_YET_ACTIVE",
    "STANDING_DELEGATION_EXPIRED",
    "STANDING_DELEGATION_REVOKED",
    "STANDING_DELEGATION_REVOCATION_UNKNOWN",
  ].includes(reason));
  const checks: AgentStandingChecks = {
    identityEvidencePresent,
    keyControlChallengeValid,
    proofSignatureValid,
    principalEvidencePresent: principalEvidencePresent && organisationSponsorPresent && accountableHumanSponsorPresent,
    delegationPresent,
    delegationSignatureValid,
    delegationActive,
    scopeAndLimitsValid,
    exactRequestBindingValid,
    sessionRunBindingValid: sessionBindingValid && runBindingValid,
    allRequiredEvidencePresent,
  };
  const outcome: AgentStandingOutcome = reasons.length === 0 ? "STANDING_VERIFIED" : "STANDING_REFUSED";
  return createDecisionReceipt({
    input,
    checkedAt,
    requestDigest,
    presentedRequestDigest: proof.exactRequestDigest,
    outcome,
    reasons: outcome === "STANDING_VERIFIED" ? ["STANDING_ALL_CHECKS_PASSED"] : unique(reasons),
    verifiedAssurance,
    checks,
    evaluateGatePassAfterStanding,
  });
}

export function createAgentStandingScenarios(): AgentStandingScenario[] {
  const selfDeclaredRequest = createRequest("self_declared_only", INDIVIDUAL_AGENT_ID, null, {
    action: "summarise_public_research",
    purpose: "research",
    amountMinorUnits: null,
    currency: null,
  });

  const invalidChallengeRequest = createRequest("invalid_key_challenge", INDIVIDUAL_AGENT_ID, INDIVIDUAL_PRINCIPAL_ID);
  const invalidChallengeProof = createSignedStandingProof(invalidChallengeRequest, "individual");
  invalidChallengeProof.challenge.signatureMetadata = invalidChallengeProof.challenge.signatureMetadata === null
    ? null
    : { ...invalidChallengeProof.challenge.signatureMetadata, signature: "AAAA" };

  const noDelegationRequest = createRequest("key_proven_no_delegation", INDIVIDUAL_AGENT_ID, INDIVIDUAL_PRINCIPAL_ID);
  const expiredRequest = createRequest("expired_delegation", INDIVIDUAL_AGENT_ID, INDIVIDUAL_PRINCIPAL_ID);
  const revokedRequest = createRequest("revoked_delegation", INDIVIDUAL_AGENT_ID, INDIVIDUAL_PRINCIPAL_ID);
  const scopeRequest = createRequest("scope_mismatch", INDIVIDUAL_AGENT_ID, INDIVIDUAL_PRINCIPAL_ID, {
    purpose: "supplier_payment",
    action: "simulate_supplier_payment_authorisation",
  });
  const limitRequest = createRequest("authority_limit_breach", INDIVIDUAL_AGENT_ID, INDIVIDUAL_PRINCIPAL_ID, {
    amountMinorUnits: 4_000,
  });
  const originalDigestRequest = createRequest("request_digest_changed", INDIVIDUAL_AGENT_ID, INDIVIDUAL_PRINCIPAL_ID, {
    amountMinorUnits: 2_500,
  });
  const changedDigestRequest = { ...originalDigestRequest, amountMinorUnits: 2_600 };
  const depthRequest = createRequest("delegation_depth_exceeded", INDIVIDUAL_AGENT_ID, INDIVIDUAL_PRINCIPAL_ID);
  const validIndividualRequest = createRequest(
    "valid_individual_sponsored_agent",
    INDIVIDUAL_AGENT_ID,
    INDIVIDUAL_PRINCIPAL_ID,
  );
  const validOrganisationRequest = createRequest(
    "valid_organisation_sponsored_agent",
    ORGANISATION_AGENT_ID,
    ORGANISATION_PRINCIPAL_ID,
    { amountMinorUnits: 1_500 },
  );
  const gatePassRequest = createRequest(
    "valid_standing_then_gatepass",
    INDIVIDUAL_AGENT_ID,
    INDIVIDUAL_PRINCIPAL_ID,
    { amountMinorUnits: 2_200 },
  );

  return [
    scenario(
      "self_declared_only",
      "Self-declared identity only",
      "A requester supplies a name and an S0 label but no key-control or principal evidence.",
      "STANDING_UNVERIFIABLE",
      selfDeclaredRequest,
      null,
    ),
    scenario(
      "invalid_key_challenge",
      "Invalid key-control challenge",
      "The declared agent challenge signature is changed after signing.",
      "STANDING_REFUSED",
      invalidChallengeRequest,
      invalidChallengeProof,
    ),
    scenario(
      "key_proven_no_delegation",
      "Key proven without delegation",
      "The requester proves fixture-key control but provides no principal delegation.",
      "STANDING_REFUSED",
      noDelegationRequest,
      createSignedStandingProof(noDelegationRequest, "individual", { omitDelegation: true, assurance: "S2" }),
    ),
    scenario(
      "expired_delegation",
      "Expired delegation",
      "The signed delegation expired before the verifier-owned reference time.",
      "STANDING_REFUSED",
      expiredRequest,
      createSignedStandingProof(expiredRequest, "individual", { expiresAt: "2026-08-02T08:59:59.000Z" }),
    ),
    scenario(
      "revoked_delegation",
      "Revoked delegation",
      "The fixed revocation record marks the signed delegation as revoked.",
      "STANDING_REFUSED",
      revokedRequest,
      createSignedStandingProof(revokedRequest, "individual", { revocationState: "revoked" }),
    ),
    scenario(
      "scope_mismatch",
      "Action outside delegated scope",
      "The delegation permits research while the requester asks for a payment-style action.",
      "STANDING_REFUSED",
      scopeRequest,
      createSignedStandingProof(scopeRequest, "individual", {
        permittedPurposes: ["research"],
        permittedActions: ["summarise_public_research"],
      }),
    ),
    scenario(
      "authority_limit_breach",
      "Authority limit breached",
      "The signed authority is limited to £25.00 while the request asks for £40.00.",
      "STANDING_REFUSED",
      limitRequest,
      createSignedStandingProof(limitRequest, "individual", { maximumAmountMinorUnits: 2_500 }),
    ),
    scenario(
      "request_digest_changed",
      "Exact request changed",
      "The amount changes after the challenge, delegation and standing proof were signed.",
      "STANDING_REFUSED",
      changedDigestRequest,
      createSignedStandingProof(originalDigestRequest, "individual"),
    ),
    scenario(
      "delegation_depth_exceeded",
      "Delegation depth exceeded",
      "A sub-agent presents delegation depth two where the signed maximum is one.",
      "STANDING_REFUSED",
      depthRequest,
      createSignedStandingProof(depthRequest, "individual", {
        category: "sub_agent",
        delegationDepth: 2,
        maximumDelegationDepth: 1,
      }),
    ),
    scenario(
      "valid_individual_sponsored_agent",
      "Valid individual-sponsored agent",
      "Fixture key control, individual principal, active delegation and exact request all verify at S3.",
      "STANDING_VERIFIED",
      validIndividualRequest,
      createSignedStandingProof(validIndividualRequest, "individual"),
    ),
    scenario(
      "valid_organisation_sponsored_agent",
      "Valid organisation-sponsored agent",
      "Fixture organisation sponsorship and an accountable human sponsor accompany a valid S4 delegation.",
      "STANDING_VERIFIED",
      validOrganisationRequest,
      createSignedStandingProof(validOrganisationRequest, "organisation"),
    ),
    scenario(
      "valid_standing_then_gatepass",
      "Verified standing before GatePass",
      "Only after standing verifies does the existing exact-action GatePass evaluator run locally.",
      "STANDING_VERIFIED",
      gatePassRequest,
      createSignedStandingProof(gatePassRequest, "individual"),
      true,
    ),
  ];
}

export function runAgentStandingScenario(scenario: AgentStandingScenario): AgentStandingScenarioResult {
  const receipt = evaluateAgentStanding(scenario.input, scenario.evaluateGatePassAfterStanding);
  return {
    scenarioId: scenario.scenarioId,
    title: scenario.title,
    description: scenario.description,
    expectedOutcome: scenario.expectedOutcome,
    matchedExpectation: receipt.outcome === scenario.expectedOutcome,
    request: structuredClone(scenario.input.request),
    proof: scenario.input.proof === null ? null : structuredClone(scenario.input.proof),
    receipt,
  };
}

export function runAgentStandingDemo(): AgentStandingDemoReport {
  const results = createAgentStandingScenarios().map(runAgentStandingScenario);
  return {
    demoVersion: AGENT_STANDING_DEMO_VERSION,
    coreRule: AGENT_STANDING_CORE_RULE,
    publicClaim: AGENT_STANDING_PUBLIC_CLAIM,
    referenceTime: AGENT_STANDING_REFERENCE_TIME,
    summary: summariseAgentStandingDemo(results),
    results,
  };
}

export function summariseAgentStandingDemo(results: readonly AgentStandingScenarioResult[]): AgentStandingDemoSummary {
  const outcomes: Record<AgentStandingOutcome, number> = {
    STANDING_VERIFIED: 0,
    STANDING_REFUSED: 0,
    STANDING_UNVERIFIABLE: 0,
  };
  for (const result of results) outcomes[result.receipt.outcome] += 1;
  const expected = (outcome: AgentStandingOutcome) => results
    .filter((result) => result.expectedOutcome === outcome)
    .every((result) => result.receipt.outcome === outcome);
  const byId = new Map(results.map((result) => [result.scenarioId, result]));
  const validResults = results.filter((result) => result.expectedOutcome === "STANDING_VERIFIED");
  const agentKeyControlChallengePassed = validResults.every((result) => result.receipt.checks.keyControlChallengeValid)
    && byId.get("invalid_key_challenge")?.receipt.reasonCodes.includes("STANDING_KEY_CHALLENGE_INVALID") === true;
  const principalAndDelegationChecksPassed = validResults.every((result) =>
    result.receipt.checks.principalEvidencePresent
    && result.receipt.checks.delegationSignatureValid
    && result.receipt.checks.delegationActive
  ) && byId.get("key_proven_no_delegation")?.receipt.reasonCodes.includes("STANDING_DELEGATION_MISSING") === true;
  const scopeLimitExpiryAndRevocationChecksPassed = [
    ["expired_delegation", "STANDING_DELEGATION_EXPIRED"],
    ["revoked_delegation", "STANDING_DELEGATION_REVOKED"],
    ["scope_mismatch", "STANDING_ACTION_OUT_OF_SCOPE"],
    ["authority_limit_breach", "STANDING_AMOUNT_LIMIT_EXCEEDED"],
    ["delegation_depth_exceeded", "STANDING_DELEGATION_DEPTH_EXCEEDED"],
  ].every(([scenarioId, reason]) => byId.get(scenarioId as AgentStandingScenarioId)?.receipt.reasonCodes.includes(
    reason as AgentStandingReasonCode,
  ) === true);
  const exactRequestBindingPassed = byId.get("request_digest_changed")?.receipt.reasonCodes.includes(
    "STANDING_REQUEST_DIGEST_MISMATCH",
  ) === true && validResults.every((result) => result.receipt.checks.exactRequestBindingValid);
  const gatePassScenario = byId.get("valid_standing_then_gatepass");
  const gatePassPreconditionPassed = results.every((result) =>
    result.receipt.gatePassEvaluationMayBegin === (result.receipt.outcome === "STANDING_VERIFIED")
    && (result.receipt.outcome === "STANDING_VERIFIED" || !result.receipt.gatePassEvaluation.attempted)
  ) && gatePassScenario?.receipt.gatePassEvaluation.attempted === true
    && gatePassScenario.receipt.gatePassEvaluation.verified === true;
  const matchedScenarios = results.filter((result) => result.matchedExpectation).length;
  const expectedVerifiedCasesPassed = expected("STANDING_VERIFIED");
  const expectedRefusalsPassed = expected("STANDING_REFUSED");
  const expectedUnverifiableCasesPassed = expected("STANDING_UNVERIFIABLE");
  const overallPassed = matchedScenarios === results.length
    && expectedVerifiedCasesPassed
    && expectedRefusalsPassed
    && expectedUnverifiableCasesPassed
    && agentKeyControlChallengePassed
    && principalAndDelegationChecksPassed
    && scopeLimitExpiryAndRevocationChecksPassed
    && exactRequestBindingPassed
    && gatePassPreconditionPassed;
  return {
    demoVersion: AGENT_STANDING_DEMO_VERSION,
    totalScenarios: results.length,
    matchedScenarios,
    outcomes,
    expectedVerifiedCasesPassed,
    expectedRefusalsPassed,
    expectedUnverifiableCasesPassed,
    agentKeyControlChallengePassed,
    principalAndDelegationChecksPassed,
    scopeLimitExpiryAndRevocationChecksPassed,
    exactRequestBindingPassed,
    gatePassPreconditionPassed,
    externalActionsPerformed: false,
    overallPassed,
  };
}

function createSignedStandingProof(
  request: AgentStandingRequest,
  sponsorType: AgentPrincipalType,
  options: {
    assurance?: AgentStandingAssurance;
    category?: SoftwareAgentCategory;
    omitDelegation?: boolean;
    permittedPurposes?: string[];
    permittedActions?: string[];
    maximumAmountMinorUnits?: number;
    issuedAt?: string;
    expiresAt?: string;
    revocationState?: DelegationRevocationState;
    delegationDepth?: number;
    maximumDelegationDepth?: number;
  } = {},
): AgentStandingProof {
  const agentKeyReference = sponsorType === "organisation"
    ? AGENT_ORGANISATION_KEY_REFERENCE
    : AGENT_INDIVIDUAL_KEY_REFERENCE;
  const agentKey = requiredFixtureKey(agentKeyReference);
  const issuerKeyReference = sponsorType === "organisation"
    ? PRINCIPAL_ORGANISATION_KEY_REFERENCE
    : PRINCIPAL_INDIVIDUAL_KEY_REFERENCE;
  const issuerKey = requiredFixtureKey(issuerKeyReference);
  const digest = createAgentStandingRequestDigest(request);
  const delegationIdentifier = `delegation_${request.requestIdentifier}`;
  const revocationReference = `fixture://revocations/${delegationIdentifier}`;
  const challengeUnsigned = {
    version: AGENT_STANDING_CHALLENGE_VERSION,
    nonce: `challenge_${request.requestIdentifier}_nonce_v1`,
    agentIdentifier: request.agentIdentifier,
    agentPublicKeyReference: agentKeyReference,
    exactRequestDigest: digest,
    sessionBinding: request.sessionBinding,
    runBinding: request.runBinding,
  };
  const challenge: AgentKeyControlChallenge = {
    ...challengeUnsigned,
    signatureMetadata: signMetadata(challengeUnsigned, agentKey, "2026-08-02T08:56:00.000Z"),
  };
  const delegationUnsigned = options.omitDelegation === true
    ? emptyDelegationUnsigned(request)
    : {
      version: AGENT_STANDING_DELEGATION_VERSION,
      delegationIdentifier,
      delegationIssuer: request.principalIdentifier,
      issuerPublicKeyReference: issuerKeyReference,
      agentIdentifier: request.agentIdentifier,
      principalIdentifier: request.principalIdentifier,
      permittedPurposes: options.permittedPurposes ?? [request.purpose],
      permittedActions: options.permittedActions ?? [request.action],
      maximumAmountMinorUnits: options.maximumAmountMinorUnits ?? 10_000,
      currency: request.currency,
      resourceLimits: request.requestedResources.map((item) => ({
        resource: item.resource,
        maximum: Math.max(item.quantity, 10),
      })),
      permittedCounterparties: request.counterpartyIdentifier === null ? null : [request.counterpartyIdentifier],
      issuedAt: options.issuedAt ?? "2026-08-02T08:50:00.000Z",
      expiresAt: options.expiresAt ?? "2026-08-02T10:00:00.000Z",
      revocationState: options.revocationState ?? "active",
      revocationReference,
      delegationDepth: options.delegationDepth ?? 0,
      maximumDelegationDepth: options.maximumDelegationDepth ?? 1,
      exactRequestDigest: digest,
      sessionBinding: request.sessionBinding,
      runBinding: request.runBinding,
    } satisfies Omit<SignedAgentDelegation, "signatureMetadata">;
  const delegation: SignedAgentDelegation = {
    ...delegationUnsigned,
    signatureMetadata: options.omitDelegation === true
      ? null
      : signMetadata(delegationUnsigned, issuerKey, options.issuedAt ?? "2026-08-02T08:50:00.000Z"),
  };
  const accountIdentity = sponsorType === "organisation"
    ? "synthetic_platform_account_organisation_001"
    : "synthetic_platform_account_individual_001";
  const proofUnsigned = {
    version: AGENT_STANDING_PROOF_VERSION,
    proofIdentifier: `standing_proof_${request.requestIdentifier}`,
    agentIdentifier: request.agentIdentifier,
    agentPublicKeyReference: agentKeyReference,
    declaredSoftwareAgentCategory: options.category ?? "tool_calling_agent",
    accountOrPlatformIdentity: accountIdentity,
    principalIdentifier: request.principalIdentifier,
    principalType: sponsorType,
    organisationSponsorIdentifier: sponsorType === "organisation" ? request.principalIdentifier : null,
    accountableHumanSponsorReference: sponsorType === "organisation" ? ACCOUNTABLE_HUMAN_REFERENCE : null,
    delegation,
    challenge,
    exactRequestDigest: digest,
    sessionBinding: request.sessionBinding,
    runBinding: request.runBinding,
    evidenceReferences: createEvidenceReferences({
      request,
      sponsorType,
      agentKeyReference,
      accountIdentity,
      delegationIdentifier,
      revocationReference,
      omitDelegation: options.omitDelegation === true,
    }),
    assuranceClassification: options.assurance ?? (sponsorType === "organisation" ? "S4" : "S3"),
    limitations: [...PROOF_LIMITATIONS],
  } satisfies Omit<AgentStandingProof, "signatureMetadata">;
  return {
    ...proofUnsigned,
    signatureMetadata: signMetadata(proofUnsigned, agentKey, "2026-08-02T08:57:00.000Z"),
  };
}

function emptyDelegationUnsigned(request: AgentStandingRequest): Omit<SignedAgentDelegation, "signatureMetadata"> {
  return {
    version: AGENT_STANDING_DELEGATION_VERSION,
    delegationIdentifier: null,
    delegationIssuer: null,
    issuerPublicKeyReference: null,
    agentIdentifier: request.agentIdentifier,
    principalIdentifier: request.principalIdentifier,
    permittedPurposes: [],
    permittedActions: [],
    maximumAmountMinorUnits: null,
    currency: null,
    resourceLimits: [],
    permittedCounterparties: null,
    issuedAt: null,
    expiresAt: null,
    revocationState: "unknown",
    revocationReference: null,
    delegationDepth: null,
    maximumDelegationDepth: null,
    exactRequestDigest: null,
    sessionBinding: request.sessionBinding,
    runBinding: request.runBinding,
  };
}

function createEvidenceReferences(input: {
  request: AgentStandingRequest;
  sponsorType: AgentPrincipalType;
  agentKeyReference: string;
  accountIdentity: string;
  delegationIdentifier: string;
  revocationReference: string;
  omitDelegation: boolean;
}): AgentStandingEvidenceReference[] {
  const evidence: AgentStandingEvidenceReference[] = [
    evidenceRef("agent_identity", `fixture://agent-registry/${input.request.agentIdentifier}`),
    evidenceRef("account_or_platform_identity", `fixture://platform-accounts/${input.accountIdentity}`),
    evidenceRef("agent_public_key", input.agentKeyReference),
    evidenceRef("principal_identity", `fixture://principal-registry/${input.request.principalIdentifier ?? "missing"}`),
  ];
  if (input.sponsorType === "organisation") {
    evidence.push(
      evidenceRef("organisation_sponsor", `fixture://organisation-sponsors/${input.request.principalIdentifier ?? "missing"}`),
      evidenceRef("accountable_human_sponsor", ACCOUNTABLE_HUMAN_REFERENCE),
    );
  }
  if (!input.omitDelegation) {
    evidence.push(
      evidenceRef("delegation", `fixture://delegations/${input.delegationIdentifier}`),
      evidenceRef("revocation_status", input.revocationReference),
    );
  }
  return evidence;
}

function evidenceRef(type: AgentStandingEvidenceType, reference: string): AgentStandingEvidenceReference {
  return { type, reference, status: "present", localFixtureOnly: true };
}

function scenario(
  scenarioId: AgentStandingScenarioId,
  title: string,
  description: string,
  expectedOutcome: AgentStandingOutcome,
  request: AgentStandingRequest,
  proof: AgentStandingProof | null,
  evaluateGatePassAfterStanding = false,
): AgentStandingScenario {
  return {
    scenarioId,
    title,
    description,
    expectedOutcome,
    input: {
      claim: {
        agentIdentifier: request.agentIdentifier,
        accountOrPlatformIdentity: proof?.accountOrPlatformIdentity ?? null,
        declaredAssuranceClassification: proof?.assuranceClassification ?? "S0",
      },
      request,
      proof,
      checkedAt: AGENT_STANDING_REFERENCE_TIME,
    },
    evaluateGatePassAfterStanding,
  };
}

function createRequest(
  requestIdentifier: string,
  agentIdentifier: string,
  principalIdentifier: string | null,
  overrides: Partial<AgentStandingRequest> = {},
): AgentStandingRequest {
  return {
    requestIdentifier,
    agentIdentifier,
    principalIdentifier,
    purpose: "supplier_payment",
    action: "simulate_supplier_payment_authorisation",
    amountMinorUnits: 2_000,
    currency: "GBP",
    requestedResources: [{ resource: "supplier_invoices", quantity: 1 }],
    counterpartyIdentifier: "synthetic_supplier_001",
    sessionBinding: `synthetic_session_${requestIdentifier}`,
    runBinding: `synthetic_run_${requestIdentifier}`,
    ...overrides,
  };
}

function createDecisionReceipt(input: {
  input: AgentStandingEvaluationInput;
  checkedAt: string;
  requestDigest: string;
  presentedRequestDigest: string | null;
  outcome: AgentStandingOutcome;
  reasons: AgentStandingReasonCode[];
  verifiedAssurance: Exclude<AgentStandingAssurance, "S5">;
  checks: AgentStandingChecks;
  evaluateGatePassAfterStanding: boolean;
}): AgentStandingDecisionReceipt {
  const mayBegin = input.outcome === "STANDING_VERIFIED";
  const gatePassEvaluation = mayBegin && input.evaluateGatePassAfterStanding
    ? evaluateExistingGatePass(input.input.request, input.requestDigest)
    : {
      attempted: false,
      verified: false,
      gatePassId: null,
      actionDigest: input.requestDigest,
      reasonCodes: mayBegin ? ["GATEPASS_EVALUATION_NOT_REQUESTED"] : ["STANDING_PRECONDITION_NOT_VERIFIED"],
      externalActionOccurred: false as const,
    };
  const proof = input.input.proof;
  const receiptSeed = {
    requestIdentifier: input.input.request.requestIdentifier,
    outcome: input.outcome,
    reasonCodes: input.reasons,
    checkedAt: input.checkedAt,
    requestDigest: input.requestDigest,
  };
  return {
    version: AGENT_STANDING_RECEIPT_VERSION,
    receiptIdentifier: `standing_receipt_${shortDigest(receiptSeed)}`,
    outcome: input.outcome,
    reasonCodes: input.reasons,
    checkedAt: input.checkedAt,
    agentIdentifier: input.input.claim.agentIdentifier,
    accountOrPlatformIdentity: proof?.accountOrPlatformIdentity ?? input.input.claim.accountOrPlatformIdentity,
    principalIdentifier: proof?.principalIdentifier ?? null,
    organisationSponsorIdentifier: proof?.organisationSponsorIdentifier ?? null,
    accountableHumanSponsorReference: proof?.accountableHumanSponsorReference ?? null,
    exactRequestDigest: input.requestDigest,
    presentedRequestDigest: input.presentedRequestDigest,
    declaredAssuranceClassification: proof?.assuranceClassification
      ?? input.input.claim.declaredAssuranceClassification,
    verifiedAssuranceClassification: input.verifiedAssurance,
    limitations: proof?.limitations ?? [...PROOF_LIMITATIONS],
    checks: input.checks,
    gatePassEvaluationMayBegin: mayBegin,
    gatePassEvaluation,
    localFixtureOnly: true,
    externalActionsPerformed: false,
    paymentAuthorisation: false,
    settlementAuthorisation: false,
    note: NOTE,
  };
}

function evaluateExistingGatePass(
  request: AgentStandingRequest,
  expectedRequestDigest: string,
): AgentStandingGatePassEvaluation {
  const exactAction = createAgentStandingExactActionInput(request);
  const issuance = issueExactActionGatePass(exactAction);
  const store = new InMemoryNonceStore();
  store.registerUnused(issuance.gatePass);
  const verification = verifyExactActionAtExecution(
    issuance.gatePass,
    exactAction,
    createVerifierContext(issuance, store, {
      trustedClock: createFixedTrustedClock(AGENT_STANDING_REFERENCE_TIME),
    }),
  );
  return {
    attempted: true,
    verified: verification.verified
      && issuance.gatePass.action.actionDigest === expectedRequestDigest,
    gatePassId: issuance.gatePass.gatePassId,
    actionDigest: issuance.gatePass.action.actionDigest,
    reasonCodes: verification.verified
      ? ["GATEPASS_EVALUATION_VERIFIED_AFTER_STANDING"]
      : verification.reasonCodes,
    externalActionOccurred: false,
  };
}

function signMetadata(
  payload: unknown,
  keyPair: DeterministicLocalFixtureKeyPair,
  signedAt: string,
): AgentStandingSignatureMetadata {
  return {
    algorithm: LOCAL_SIGNED_PROOF_ALGORITHM,
    keyId: keyPair.keyId,
    signedAt,
    payloadHash: createCanonicalPayloadHash(payload),
    localFixtureOnly: true,
    deterministicPublicFixture: true,
    productionKeyCustody: false,
    signature: signCanonicalLocalFixturePayload(payload, keyPair),
  };
}

function verifySignatureMetadata(
  payload: unknown,
  metadata: AgentStandingSignatureMetadata | null,
  keyPair: DeterministicLocalFixtureKeyPair,
): boolean {
  return metadata !== null
    && metadata.algorithm === LOCAL_SIGNED_PROOF_ALGORITHM
    && metadata.keyId === keyPair.keyId
    && metadata.payloadHash === createCanonicalPayloadHash(payload)
    && metadata.localFixtureOnly === true
    && metadata.deterministicPublicFixture === true
    && metadata.productionKeyCustody === false
    && verifyCanonicalLocalFixturePayload(payload, metadata.signature, keyPair.publicKeyPem);
}

function unsignedProof(proof: AgentStandingProof): Omit<AgentStandingProof, "signatureMetadata"> {
  const { signatureMetadata: _signatureMetadata, ...unsigned } = proof;
  return unsigned;
}

function unsignedDelegation(
  delegation: SignedAgentDelegation,
): Omit<SignedAgentDelegation, "signatureMetadata"> {
  const { signatureMetadata: _signatureMetadata, ...unsigned } = delegation;
  return unsigned;
}

function unsignedChallenge(
  challenge: AgentKeyControlChallenge,
): Omit<AgentKeyControlChallenge, "signatureMetadata"> {
  const { signatureMetadata: _signatureMetadata, ...unsigned } = challenge;
  return unsigned;
}

function hasDelegation(delegation: SignedAgentDelegation): boolean {
  return delegation.delegationIdentifier !== null
    && delegation.delegationIssuer !== null
    && delegation.issuerPublicKeyReference !== null
    && delegation.agentIdentifier !== null
    && delegation.principalIdentifier !== null
    && delegation.issuedAt !== null
    && delegation.expiresAt !== null
    && delegation.revocationReference !== null
    && delegation.delegationDepth !== null
    && delegation.maximumDelegationDepth !== null
    && delegation.exactRequestDigest !== null
    && delegation.signatureMetadata !== null;
}

function hasEvidence(
  proof: AgentStandingProof,
  type: AgentStandingEvidenceType,
  expectedReference: string,
): boolean {
  return proof.evidenceReferences.some((evidence) =>
    evidence.type === type
    && evidence.reference === expectedReference
    && evidence.status === "present"
    && evidence.localFixtureOnly === true
  );
}

function requiredEvidencePresent(proof: AgentStandingProof): boolean {
  if (!hasEvidence(proof, "agent_identity", `fixture://agent-registry/${proof.agentIdentifier}`)) return false;
  if (!hasEvidence(proof, "agent_public_key", proof.agentPublicKeyReference)) return false;
  if (proof.accountOrPlatformIdentity !== null
    && !hasEvidence(
      proof,
      "account_or_platform_identity",
      `fixture://platform-accounts/${proof.accountOrPlatformIdentity}`,
    )) return false;
  if (proof.principalIdentifier === null
    || !hasEvidence(proof, "principal_identity", `fixture://principal-registry/${proof.principalIdentifier}`)) {
    return false;
  }
  if (proof.delegation.delegationIdentifier === null
    || !hasEvidence(
      proof,
      "delegation",
      `fixture://delegations/${proof.delegation.delegationIdentifier}`,
    )) return false;
  if (proof.principalType === "organisation") {
    if (proof.organisationSponsorIdentifier === null
      || !hasEvidence(
        proof,
        "organisation_sponsor",
        `fixture://organisation-sponsors/${proof.organisationSponsorIdentifier}`,
      )) return false;
    if (proof.accountableHumanSponsorReference === null
      || !hasEvidence(proof, "accountable_human_sponsor", proof.accountableHumanSponsorReference)) return false;
  }
  return true;
}

function amountWithinLimit(request: AgentStandingRequest, delegation: SignedAgentDelegation): boolean {
  if (request.amountMinorUnits === null) return true;
  return Number.isInteger(request.amountMinorUnits)
    && request.amountMinorUnits >= 0
    && Number.isInteger(delegation.maximumAmountMinorUnits)
    && (delegation.maximumAmountMinorUnits ?? -1) >= request.amountMinorUnits
    && delegation.currency === request.currency;
}

function resourcesWithinLimits(request: AgentStandingRequest, delegation: SignedAgentDelegation): boolean {
  return request.requestedResources.every((requested) => {
    const limit = delegation.resourceLimits.find((candidate) => candidate.resource === requested.resource);
    return Number.isFinite(requested.quantity)
      && requested.quantity >= 0
      && limit !== undefined
      && requested.quantity <= limit.maximum;
  });
}

function counterpartyPermitted(request: AgentStandingRequest, delegation: SignedAgentDelegation): boolean {
  if (request.counterpartyIdentifier === null || delegation.permittedCounterparties === null) return true;
  return delegation.permittedCounterparties.includes(request.counterpartyIdentifier);
}

function delegationDepthValid(delegation: SignedAgentDelegation): boolean {
  return Number.isInteger(delegation.delegationDepth)
    && Number.isInteger(delegation.maximumDelegationDepth)
    && (delegation.delegationDepth ?? -1) >= 0
    && (delegation.maximumDelegationDepth ?? -1) >= 0
    && (delegation.delegationDepth ?? 0) <= (delegation.maximumDelegationDepth ?? -1);
}

function computeVerifiedAssurance(input: {
  proof: AgentStandingProof;
  identityEvidencePresent: boolean;
  keyControlChallengeValid: boolean;
  proofSignatureValid: boolean;
  principalEvidencePresent: boolean;
  delegationPresent: boolean;
  delegationSignatureValid: boolean;
  organisationSponsorPresent: boolean;
  accountableHumanSponsorPresent: boolean;
}): Exclude<AgentStandingAssurance, "S5"> {
  let assurance: Exclude<AgentStandingAssurance, "S5"> = "S0";
  if (input.proof.accountOrPlatformIdentity !== null
    && hasEvidence(
      input.proof,
      "account_or_platform_identity",
      `fixture://platform-accounts/${input.proof.accountOrPlatformIdentity}`,
    )) assurance = "S1";
  if (input.identityEvidencePresent && input.keyControlChallengeValid && input.proofSignatureValid) assurance = "S2";
  if (assurance === "S2"
    && input.principalEvidencePresent
    && input.delegationPresent
    && input.delegationSignatureValid) assurance = "S3";
  if (assurance === "S3"
    && input.proof.principalType === "organisation"
    && input.organisationSponsorPresent
    && input.accountableHumanSponsorPresent) assurance = "S4";
  return assurance;
}

function emptyChecks(): AgentStandingChecks {
  return {
    identityEvidencePresent: false,
    keyControlChallengeValid: false,
    proofSignatureValid: false,
    principalEvidencePresent: false,
    delegationPresent: false,
    delegationSignatureValid: false,
    delegationActive: false,
    scopeAndLimitsValid: false,
    exactRequestBindingValid: false,
    sessionRunBindingValid: false,
    allRequiredEvidencePresent: false,
  };
}

function requiredFixtureKey(reference: string): DeterministicLocalFixtureKeyPair {
  const key = FIXTURE_KEYS.get(reference);
  if (key === undefined) throw new Error(`Missing deterministic fixture key: ${reference}`);
  return key;
}

function safeTimestamp(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? AGENT_STANDING_REFERENCE_TIME : parsed.toISOString();
}

function shortDigest(value: unknown): string {
  return createCanonicalPayloadHash(value).slice("sha256:".length, "sha256:".length + 24);
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}
