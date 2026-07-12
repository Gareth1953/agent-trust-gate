export const GATEPASS_TRUST_LANGUAGE_VERSION =
  "atg.gatepass-trust-language.local.v1" as const;
export const GATEPASS_TRUST_LANGUAGE_PUBLIC_CONTACT = "gpmiddleton71@gmail.com" as const;
export const GATEPASS_TRUST_LANGUAGE_STRATEGIC_PRINCIPLE =
  "We do not chase millions of AI agents. We create the trust rule they must satisfy." as const;
export const GATEPASS_TRUST_LANGUAGE_SAFE_PHRASE =
  "This agent has presented proof for this specific action, under this specific scope, at this specific time." as const;
export const GATEPASS_TRUST_LANGUAGE_REJECTED_PHRASE =
  "This agent is proven safe." as const;
export const GATEPASS_TRUST_LANGUAGE_CORE_PHRASES = [
  "GatePass Trust Language gives agents a shared proof vocabulary before action.",
  GATEPASS_TRUST_LANGUAGE_SAFE_PHRASE,
  "Agents that can prove authority should be easier to trust than agents that only claim authority.",
  "GatePass gives agents a language of proof.",
  "Do not trust the agent. Trust the GatePass.",
  "No proof. No permission.",
  "No mandate. No action.",
  "No signed GatePass. No settlement.",
] as const;

export type GatePassTrustLanguagePhraseDecision = "allowed" | "rejected";

export type GatePassTrustLanguageTermGroup =
  | "identityTerms"
  | "mandateTerms"
  | "scopeTerms"
  | "evidenceTerms"
  | "intentTerms"
  | "approvalTerms"
  | "freshnessTerms"
  | "nonceReplayTerms"
  | "signatureGatePassTerms"
  | "riskTerms"
  | "decisionTerms"
  | "escalationTerms"
  | "preSettlementTerms"
  | "unsafeClaimTerms";

export interface GatePassTrustLanguageSafetyFlags {
  localDemoOnly: true;
  provenSafeClaim: false;
  guaranteedTrust: false;
  autonomousMarketing: false;
  outreachAutomation: false;
  directBotMessaging: false;
  unsolicitedAgentContact: false;
  hiddenViralDistribution: false;
  scrapingOrContactHarvesting: false;
  paidAds: false;
  trackingAnalytics: false;
  liveSystemsContact: false;
  liveAgentToAgentCommunication: false;
  liveApi: false;
  mcpServer: false;
  cloudNetworkCall: false;
  productionReadiness: false;
  productionGradeCrypto: false;
  productionCertification: false;
  legalComplianceSecurityGuarantee: false;
  paymentAuthorisation: false;
  settlementAuthorisation: false;
  realToolExecution: false;
  actionExecution: false;
}

export interface GatePassTrustControlledVocabulary {
  identityTerms: string[];
  mandateTerms: string[];
  scopeTerms: string[];
  evidenceTerms: string[];
  intentTerms: string[];
  approvalTerms: string[];
  freshnessTerms: string[];
  nonceReplayTerms: string[];
  signatureGatePassTerms: string[];
  riskTerms: string[];
  decisionTerms: string[];
  escalationTerms: string[];
  preSettlementTerms: string[];
  unsafeClaimTerms: string[];
}

export interface GatePassTrustVocabularyPack extends GatePassTrustLanguageSafetyFlags {
  project: "Agent Trust Gate";
  purpose: string;
  vocabularyVersion: typeof GATEPASS_TRUST_LANGUAGE_VERSION;
  strategicPrinciple: typeof GATEPASS_TRUST_LANGUAGE_STRATEGIC_PRINCIPLE;
  safeCoreStatements: typeof GATEPASS_TRUST_LANGUAGE_CORE_PHRASES;
  controlledTerms: GatePassTrustControlledVocabulary;
  decisionTerms: string[];
  safePhrases: string[];
  unsafePhrases: string[];
  safePhrase: typeof GATEPASS_TRUST_LANGUAGE_SAFE_PHRASE;
  rejectedPhrase: typeof GATEPASS_TRUST_LANGUAGE_REJECTED_PHRASE;
  publicContactEmail: typeof GATEPASS_TRUST_LANGUAGE_PUBLIC_CONTACT;
  boundary: string;
}

export type GatePassTrustVocabularySummary = Omit<
  GatePassTrustVocabularyPack,
  "controlledTerms" | "safePhrases" | "unsafePhrases"
>;

export interface GatePassTrustPhraseClassification extends GatePassTrustLanguageSafetyFlags {
  phrase: string;
  decision: GatePassTrustLanguagePhraseDecision;
  phraseAllowed: boolean;
  matchedSafeSignals: string[];
  matchedUnsafeSignals: string[];
  reasons: string[];
  safeAlternative: typeof GATEPASS_TRUST_LANGUAGE_SAFE_PHRASE;
  publicContactEmail: typeof GATEPASS_TRUST_LANGUAGE_PUBLIC_CONTACT;
}

export interface BuildAgentTrustStatementInput {
  agentSubject: string;
  requestedAction: string;
  scope: string;
  proofStatus: "proof_present" | "proof_missing";
  mandateReference: string;
  evidenceReference: string;
  intentStatus: "verified_intent" | "unverified_intent";
  approvalStatus: "approval_present" | "approval_missing" | "approval_not_required";
  gatePassStatus: "fresh_signed_gatepass" | "fresh_unsigned_gatepass" | "stale_gatepass" | "missing_gatepass";
  issuedAt: string;
  expiresAt: string;
  localDemoOnly?: true;
}

export interface BuiltAgentTrustStatement extends GatePassTrustLanguageSafetyFlags {
  vocabularyVersion: typeof GATEPASS_TRUST_LANGUAGE_VERSION;
  statement: string;
  proofLanguage: typeof GATEPASS_TRUST_LANGUAGE_SAFE_PHRASE;
  subject: string;
  requestedAction: string;
  scope: string;
  issuedAt: string;
  expiresAt: string;
  termsUsed: string[];
  publicContactEmail: typeof GATEPASS_TRUST_LANGUAGE_PUBLIC_CONTACT;
}

export const GATEPASS_TRUST_LANGUAGE_SAFETY_FLAGS: GatePassTrustLanguageSafetyFlags = {
  localDemoOnly: true,
  provenSafeClaim: false,
  guaranteedTrust: false,
  autonomousMarketing: false,
  outreachAutomation: false,
  directBotMessaging: false,
  unsolicitedAgentContact: false,
  hiddenViralDistribution: false,
  scrapingOrContactHarvesting: false,
  paidAds: false,
  trackingAnalytics: false,
  liveSystemsContact: false,
  liveAgentToAgentCommunication: false,
  liveApi: false,
  mcpServer: false,
  cloudNetworkCall: false,
  productionReadiness: false,
  productionGradeCrypto: false,
  productionCertification: false,
  legalComplianceSecurityGuarantee: false,
  paymentAuthorisation: false,
  settlementAuthorisation: false,
  realToolExecution: false,
  actionExecution: false,
};

export const GATEPASS_TRUST_LANGUAGE_CONTROLLED_TERMS: GatePassTrustControlledVocabulary = {
  identityTerms: ["claimed_identity", "verified_authority"],
  mandateTerms: ["mandate_reference", "mandate_present", "mandate_missing"],
  scopeTerms: ["permitted_scope", "requested_action", "scope_match", "scope_mismatch"],
  evidenceTerms: ["evidence_reference", "evidence_present", "evidence_missing"],
  intentTerms: ["verified_intent", "unverified_intent"],
  approvalTerms: ["human_approval_required", "approval_present", "approval_missing", "approval_not_required"],
  freshnessTerms: ["fresh_gatepass", "stale_gatepass"],
  nonceReplayTerms: ["nonce_present", "nonce_missing", "replay_detected"],
  signatureGatePassTerms: ["signed_gatepass_present", "signed_gatepass_missing", "unsigned_gatepass"],
  riskTerms: ["low_risk", "sensitive_action", "high_risk", "settlement_sensitive"],
  decisionTerms: ["proof_sufficient", "proof_insufficient", "allow_locally", "block"],
  escalationTerms: ["escalate", "require_evidence", "require_human_review", "require_signed_gatepass"],
  preSettlementTerms: ["settlement_sensitive", "no_signed_gatepass_no_settlement"],
  unsafeClaimTerms: ["proven_safe_claim_rejected", "guaranteed_trust_claim_rejected"],
};

const SAFE_PHRASES = [
  "I am requesting permission to act.",
  "My mandate reference is local-mandate-001.",
  "My evidence reference is local-evidence-001.",
  "My requested action is within this scope.",
  "My intent status is verified.",
  "My approval status is present.",
  "My GatePass is fresh and signed.",
  "This action should be allowed locally.",
  "This action should be blocked until proof is supplied.",
  "This action requires human review.",
  GATEPASS_TRUST_LANGUAGE_SAFE_PHRASE,
  "No proof means no permission.",
  "No signed GatePass means no settlement in settlement-sensitive workflows.",
] as const;

const UNSAFE_PHRASES = [
  GATEPASS_TRUST_LANGUAGE_REJECTED_PHRASE,
  "Trust me because I am an AI agent.",
  "This GatePass guarantees safety.",
  "This bypasses verification.",
  "This guarantees settlement.",
  "This is certified compliant.",
  "This makes all systems accept the agent.",
  "This creates automatic acceptance.",
  "This should be used for viral agent promotion.",
] as const;

const SAFE_PATTERNS: Record<string, RegExp[]> = {
  scoped_proof: [/\bspecific action\b/i, /\bspecific scope\b/i, /\bspecific time\b/i],
  permission_request: [/\brequesting permission to act\b/i],
  mandate_reference: [/\bmandate reference\b/i],
  evidence_reference: [/\bevidence reference\b/i],
  verified_intent: [/\bintent status is verified\b/i, /\bverified intent\b/i],
  approval_status: [/\bapproval status\b/i, /\bapproval present\b/i],
  gatepass_status: [/\bgatepass is (?:fresh|stale|missing|signed|unsigned)\b/i, /\bfresh GatePass\b/i],
  local_decision: [/\ballowed locally\b/i, /\bblocked\b/i, /\bescalated\b/i, /\brequires? human review\b/i],
  proof_permission: [/\bno proof means no permission\b/i, /\bno signed gatepass means no settlement\b/i],
};

const UNSAFE_PATTERNS: Record<string, RegExp[]> = {
  proven_safe: [/\bproven safe\b/i],
  guaranteed_trust: [/\bguaranteed trust\b/i, /\bguarantees trust\b/i, /\bguarantee trust\b/i],
  guaranteed_safety: [/\bguarantees safety\b/i, /\bguaranteed safety\b/i],
  certified_compliant: [/\bcertified compliant\b/i, /\bcertified security\b/i, /\bcertified safe\b/i],
  bypass_verification: [/\bbypass(?:es)? verification\b/i, /\bbypass trust gate\b/i],
  automatic_acceptance: [/\bautomatic acceptance\b/i, /\ball systems accept\b/i],
  viral_promotion: [/\bviral agent promotion\b/i, /\bhidden viral\b/i, /\bautonomous marketing\b/i],
  identity_only_trust: [/\btrust me because I am an AI agent\b/i, /\btrust me because I am an agent\b/i],
  guaranteed_settlement: [/\bguarantees settlement\b/i, /\bguaranteed settlement\b/i],
};

export function getGatePassTrustVocabulary(): GatePassTrustVocabularyPack {
  return {
    project: "Agent Trust Gate",
    purpose:
      "Define a local, agent-readable and human-readable proof vocabulary for expressing mandate, evidence, intent, approval, freshness, scope, GatePass status, and review outcomes before action.",
    vocabularyVersion: GATEPASS_TRUST_LANGUAGE_VERSION,
    strategicPrinciple: GATEPASS_TRUST_LANGUAGE_STRATEGIC_PRINCIPLE,
    safeCoreStatements: GATEPASS_TRUST_LANGUAGE_CORE_PHRASES,
    controlledTerms: GATEPASS_TRUST_LANGUAGE_CONTROLLED_TERMS,
    decisionTerms: [
      ...GATEPASS_TRUST_LANGUAGE_CONTROLLED_TERMS.decisionTerms,
      ...GATEPASS_TRUST_LANGUAGE_CONTROLLED_TERMS.escalationTerms,
    ],
    safePhrases: [...SAFE_PHRASES],
    unsafePhrases: [...UNSAFE_PHRASES],
    safePhrase: GATEPASS_TRUST_LANGUAGE_SAFE_PHRASE,
    rejectedPhrase: GATEPASS_TRUST_LANGUAGE_REJECTED_PHRASE,
    publicContactEmail: GATEPASS_TRUST_LANGUAGE_PUBLIC_CONTACT,
    boundary:
      "GatePass Trust Language is a proof vocabulary, not a safety guarantee. It does not create live systems contact, direct bot messaging, live agent-to-agent communication, hidden viral distribution, guaranteed trust, production certification, payment, settlement, real tool execution, or action execution.",
    ...GATEPASS_TRUST_LANGUAGE_SAFETY_FLAGS,
  };
}

export function summariseGatePassTrustVocabulary(
  pack: GatePassTrustVocabularyPack,
): GatePassTrustVocabularySummary {
  const {
    controlledTerms: _controlledTerms,
    safePhrases: _safePhrases,
    unsafePhrases: _unsafePhrases,
    ...summary
  } = pack;
  return summary;
}

export function classifyTrustLanguagePhrase(phrase: string): GatePassTrustPhraseClassification {
  const matchedUnsafeSignals = matchSignals(phrase, UNSAFE_PATTERNS);
  const matchedSafeSignals = matchSignals(phrase, SAFE_PATTERNS);
  const phraseAllowed = matchedUnsafeSignals.length === 0 && matchedSafeSignals.length > 0;
  return {
    phrase,
    decision: phraseAllowed ? "allowed" : "rejected",
    phraseAllowed,
    matchedSafeSignals,
    matchedUnsafeSignals,
    reasons: phraseAllowed
      ? [
        "phrase_uses_scoped_proof_language",
        "phrase_is_action_specific_or_review_oriented",
        "phrase_does_not_claim_guaranteed_safety",
      ]
      : [
        matchedUnsafeSignals.length > 0 ? "phrase_contains_rejected_trust_claim" : "phrase_lacks_scoped_proof_language",
        "do_not_claim_proven_safe_or_guaranteed_trust",
        "do_not_bypass_verification_or_promote_autonomously",
      ],
    safeAlternative: GATEPASS_TRUST_LANGUAGE_SAFE_PHRASE,
    publicContactEmail: GATEPASS_TRUST_LANGUAGE_PUBLIC_CONTACT,
    ...GATEPASS_TRUST_LANGUAGE_SAFETY_FLAGS,
  };
}

export function buildAgentTrustStatement(input: BuildAgentTrustStatementInput): BuiltAgentTrustStatement {
  const statement =
    `${input.agentSubject} has presented proof for requested_action '${input.requestedAction}', ` +
    `under permitted_scope '${input.scope}', issued at ${input.issuedAt} and expiring at ${input.expiresAt}. ` +
    `mandate_reference=${input.mandateReference}; evidence_reference=${input.evidenceReference}; ` +
    `intent=${input.intentStatus}; approval=${input.approvalStatus}; gatepass_status=${input.gatePassStatus}. ` +
    "This statement is scoped, action-specific, time-bounded, and local-only.";
  return {
    vocabularyVersion: GATEPASS_TRUST_LANGUAGE_VERSION,
    statement,
    proofLanguage: GATEPASS_TRUST_LANGUAGE_SAFE_PHRASE,
    subject: input.agentSubject,
    requestedAction: input.requestedAction,
    scope: input.scope,
    issuedAt: input.issuedAt,
    expiresAt: input.expiresAt,
    termsUsed: [
      "requested_action",
      "permitted_scope",
      "mandate_reference",
      "evidence_reference",
      input.intentStatus,
      input.approvalStatus,
      input.gatePassStatus,
    ],
    publicContactEmail: GATEPASS_TRUST_LANGUAGE_PUBLIC_CONTACT,
    ...GATEPASS_TRUST_LANGUAGE_SAFETY_FLAGS,
  };
}

export function explainTrustLanguageBoundary(): string {
  return "GatePass Trust Language helps express scoped proof before action. It is not a proven-safe language, not guaranteed trust, not certification, not production readiness, not autonomous outreach, not direct bot messaging, not live agent-to-agent communication, and not action execution.";
}

function matchSignals(phrase: string, patterns: Record<string, RegExp[]>): string[] {
  return Object.entries(patterns)
    .filter(([, expressions]) => expressions.some((expression) => expression.test(phrase)))
    .map(([signal]) => signal);
}
