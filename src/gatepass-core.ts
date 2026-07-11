import { createHash } from "node:crypto";

export const GATEPASS_CORE_VERSION = "atg.gatepass-core.local.v1" as const;
export const GATEPASS_CORE_REFERENCE_TIME = "2026-07-11T00:00:00.000Z" as const;
export const GATEPASS_CORE_PUBLIC_CONTACT = "gpmiddleton71@gmail.com" as const;
export const GATEPASS_CORE_STRATEGIC_PRINCIPLE =
  "We do not chase millions of AI agents. We create the trust rule they must satisfy." as const;
export const GATEPASS_CORE_LINE =
  "No mandate. No evidence. No verified intent. No signed GatePass. No settlement." as const;
export const GATEPASS_CORE_POSITIONING = [
  "Do not trust the agent. Trust the GatePass.",
  "No proof. No permission.",
  "No mandate. No action.",
  "No signed GatePass. No settlement.",
] as const;

export type GatePassDecision =
  | "allow"
  | "block"
  | "escalate"
  | "require_evidence"
  | "require_human_review"
  | "require_signed_proof";

export type GatePassRiskTier = "low" | "medium" | "high" | "critical";
export type GatePassIntentStatus = "verified" | "unverified" | "missing" | "conflicting";
export type GatePassApprovalStatus = "approved" | "not_required" | "required_missing" | "rejected";
export type GatePassSignatureStatus = "present" | "missing" | "tampered" | "malformed";
export type GatePassFieldStatus = "present" | "missing" | "stale";
export type GatePassProfile =
  | "low_risk_action"
  | "sensitive_tool_call"
  | "high_risk_human_review"
  | "pre_settlement"
  | "identity_only_invalid";

export type GatePassCoreExampleId =
  | "gatepass_core_valid_local_low_risk"
  | "gatepass_core_sensitive_tool_valid"
  | "gatepass_core_high_risk_human_review"
  | "gatepass_core_pre_settlement_valid_local"
  | "gatepass_core_identity_only_invalid"
  | "gatepass_core_missing_mandate_invalid"
  | "gatepass_core_missing_evidence_invalid"
  | "gatepass_core_stale_expiry_invalid"
  | "gatepass_core_missing_signature_pre_settlement_invalid";

export interface GatePassMandate {
  id: string;
  allowedAction: string;
  issuerReference: string;
  status: GatePassFieldStatus;
}

export interface GatePassScope {
  permittedActions: string[];
  constraints: string[];
  settlementSensitive: boolean;
}

export interface GatePassEvidence {
  refs: string[];
  status: GatePassFieldStatus;
}

export interface GatePassIntent {
  status: GatePassIntentStatus;
  context: string;
}

export interface GatePassRisk {
  tier: GatePassRiskTier;
  sensitiveToolCall: boolean;
  highRiskAction: boolean;
}

export interface GatePassApproval {
  required: boolean;
  status: GatePassApprovalStatus;
  approverReference: string | null;
}

export interface GatePassSignature {
  status: GatePassSignatureStatus;
  proofReference: string | null;
  alg: "local-demo-placeholder";
  productionSigning: false;
}

export interface GatePassPreSettlementExtension {
  settlementSensitive: boolean;
  requiresSignedGatePass: boolean;
  blockerReference: string;
  noSignedGatePassNoSettlement: boolean;
}

export interface GatePassExtensions {
  preSettlement?: GatePassPreSettlementExtension;
  [key: string]: unknown;
}

export interface GatePassCore {
  version: typeof GATEPASS_CORE_VERSION;
  iss: string;
  sub: string;
  aud: string;
  jti: string;
  iat: string;
  exp: string;
  nonce: string;
  mandate: GatePassMandate;
  scope: GatePassScope;
  evidence: GatePassEvidence;
  intent: GatePassIntent;
  risk: GatePassRisk;
  approval: GatePassApproval;
  signature: GatePassSignature;
  extensions?: GatePassExtensions;
  localDemoOnly: boolean;
  localOnly: boolean;
  liveSystemsContact: boolean;
  directBotMessaging: boolean;
  autonomousOutreach: boolean;
  outreachAutomation: boolean;
  liveAgentToAgentCommunication: boolean;
  externalAgentContact: boolean;
  liveApi: boolean;
  mcpServer: boolean;
  cloudNetworkCall: boolean;
  secretsOrCredentials: boolean;
  paymentAuthorisation: boolean;
  settlementAuthorisation: boolean;
  walletBankingLogic: boolean;
  productionSigning: boolean;
  productionGradeCrypto: boolean;
  productionCertification: boolean;
  actionExecution: boolean;
}

export interface GatePassCoreSafetyFlags {
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
  productionGradeCrypto: false;
  productionCertification: false;
  actionExecution: false;
}

export interface GatePassCoreValidationResult extends GatePassCoreSafetyFlags {
  resultId: string;
  gatePassVersion: typeof GATEPASS_CORE_VERSION;
  gatePassId: string;
  profile: GatePassProfile;
  decision: GatePassDecision;
  validLocally: boolean;
  reasons: string[];
  missingFields: string[];
  requiredNextProof: string[];
  gatePassMeaning: {
    mayProveLocally: string[];
    doesNotProve: string[];
  };
  noProofMeansNoPermission: true;
  claimedIdentityAloneSufficient: false;
  publicContactEmail: typeof GATEPASS_CORE_PUBLIC_CONTACT;
  note: "Minimal GatePass core local model only; no production signing, production-grade crypto, live systems contact, direct bot messaging, live agent-to-agent communication, payment, settlement, network call, real tool execution, or action execution occurred.";
}

export interface GatePassCoreExplanation extends GatePassCoreSafetyFlags {
  gatePassId: string;
  profile: GatePassProfile;
  requiredFields: readonly string[];
  fieldGuide: Record<string, string>;
  localChecks: string[];
  noProofMeansNoPermission: true;
  publicContactEmail: typeof GATEPASS_CORE_PUBLIC_CONTACT;
}

export interface GatePassCoreDemoExample {
  gatePass: GatePassCore;
  result: GatePassCoreValidationResult;
  explanation: GatePassCoreExplanation;
}

export interface GatePassCoreDemoPack extends GatePassCoreSafetyFlags {
  packVersion: typeof GATEPASS_CORE_VERSION;
  packId: string;
  coreLine: typeof GATEPASS_CORE_LINE;
  strategicPrinciple: typeof GATEPASS_CORE_STRATEGIC_PRINCIPLE;
  positioning: typeof GATEPASS_CORE_POSITIONING;
  publicContactEmail: typeof GATEPASS_CORE_PUBLIC_CONTACT;
  referenceTime: typeof GATEPASS_CORE_REFERENCE_TIME;
  exampleCount: number;
  decisions: Record<GatePassDecision, number>;
  exampleFiles: typeof GATEPASS_CORE_EXAMPLE_FILES;
  note: GatePassCoreValidationResult["note"];
  examples: Record<GatePassCoreExampleId, GatePassCoreDemoExample>;
}

export type GatePassCoreDemoSummary = Omit<GatePassCoreDemoPack, "examples">;

export const GATEPASS_CORE_EXAMPLE_FILES: Record<GatePassCoreExampleId, string> = {
  gatepass_core_valid_local_low_risk: "examples/gatepass-core-valid-local-low-risk.json",
  gatepass_core_sensitive_tool_valid: "examples/gatepass-core-sensitive-tool-valid.json",
  gatepass_core_high_risk_human_review: "examples/gatepass-core-high-risk-human-review.json",
  gatepass_core_pre_settlement_valid_local: "examples/gatepass-core-pre-settlement-valid-local.json",
  gatepass_core_identity_only_invalid: "examples/gatepass-core-identity-only-invalid.json",
  gatepass_core_missing_mandate_invalid: "examples/gatepass-core-missing-mandate-invalid.json",
  gatepass_core_missing_evidence_invalid: "examples/gatepass-core-missing-evidence-invalid.json",
  gatepass_core_stale_expiry_invalid: "examples/gatepass-core-stale-expiry-invalid.json",
  gatepass_core_missing_signature_pre_settlement_invalid:
    "examples/gatepass-core-missing-signature-pre-settlement-invalid.json",
};

export const GATEPASS_CORE_SAFETY_FLAGS: GatePassCoreSafetyFlags = {
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
  productionGradeCrypto: false,
  productionCertification: false,
  actionExecution: false,
};

const REQUIRED_FIELDS = [
  "version",
  "iss",
  "sub",
  "aud",
  "jti",
  "iat",
  "exp",
  "nonce",
  "mandate",
  "scope",
  "evidence",
  "intent",
  "risk",
  "approval",
  "signature",
  "localDemoOnly",
] as const;

const NOTE: GatePassCoreValidationResult["note"] =
  "Minimal GatePass core local model only; no production signing, production-grade crypto, live systems contact, direct bot messaging, live agent-to-agent communication, payment, settlement, network call, real tool execution, or action execution occurred.";

export function validateGatePassCore(input: GatePassCore): GatePassCoreValidationResult {
  const profile = classifyGatePassProfile(input);
  const missingFields = collectMissingFields(input, profile);
  const reasons = collectReasons(input, profile, missingFields);
  const decision = decideGatePassCore(input, profile, missingFields, reasons);
  return {
    resultId: createResultId(input, profile, decision, reasons),
    gatePassVersion: GATEPASS_CORE_VERSION,
    gatePassId: input.jti,
    profile,
    decision,
    validLocally: decision === "allow",
    reasons,
    missingFields,
    requiredNextProof: requiredNextProofFor(decision, missingFields, profile),
    gatePassMeaning: createGatePassMeaning(input, profile, decision),
    noProofMeansNoPermission: true,
    claimedIdentityAloneSufficient: false,
    publicContactEmail: GATEPASS_CORE_PUBLIC_CONTACT,
    note: NOTE,
    ...GATEPASS_CORE_SAFETY_FLAGS,
  };
}

export function explainGatePassCore(input: GatePassCore): GatePassCoreExplanation {
  return {
    gatePassId: input.jti,
    profile: classifyGatePassProfile(input),
    requiredFields: REQUIRED_FIELDS,
    fieldGuide: {
      version: "Local GatePass core version. It names this compact local profile and is not a production standard claim.",
      iss: "Issuer, owner, or authority reference for the local GatePass.",
      sub: "Agent or workflow subject. Claimed subject identity is never enough by itself.",
      aud: "Intended local verifier or system that should inspect the GatePass.",
      jti: "Unique GatePass identifier used for traceability and replay checks.",
      iat: "Issued-at timestamp for freshness review.",
      exp: "Expiry timestamp; stale GatePass values fail locally.",
      nonce: "Replay protection value bound to this local proof attempt.",
      mandate: "Reference to what the agent or workflow is allowed to do.",
      scope: "Boundaries of the requested action and settlement sensitivity.",
      evidence: "Local evidence references supporting the decision.",
      intent: "Verified intent status and context.",
      risk: "Risk tier and whether the action is sensitive or high impact.",
      approval: "Human approval state when risk or policy requires it.",
      signature: "Local signed proof reference or placeholder status. This is not production signing.",
      extensions: "Future-safe object; preSettlement keeps settlement-sensitive checks out of the core fields.",
      localDemoOnly: "Must remain true for these examples; no live authority is granted.",
    },
    localChecks: [
      "claimed_identity_alone_is_not_trust",
      "mandate_required",
      "evidence_required_where_relevant",
      "verified_intent_required_for_sensitive_actions",
      "expiry_must_be_fresh",
      "nonce_must_be_present",
      "signed_gatepass_required_for_pre_settlement_profile",
      "all_live_authority_flags_must_remain_false",
    ],
    noProofMeansNoPermission: true,
    publicContactEmail: GATEPASS_CORE_PUBLIC_CONTACT,
    ...GATEPASS_CORE_SAFETY_FLAGS,
  };
}

export function classifyGatePassProfile(input: GatePassCore): GatePassProfile {
  if (isIdentityOnly(input)) return "identity_only_invalid";
  if (isPreSettlement(input)) return "pre_settlement";
  if (input.risk.tier === "high" || input.risk.tier === "critical" || input.risk.highRiskAction) {
    return "high_risk_human_review";
  }
  if (input.risk.sensitiveToolCall || input.risk.tier === "medium") return "sensitive_tool_call";
  return "low_risk_action";
}

export function createGatePassCoreExampleInputs(): Record<GatePassCoreExampleId, GatePassCore> {
  const lowRisk = createBaseGatePass({
    jti: "gatepass_core_valid_low_risk_001",
    scope: {
      permittedActions: ["read_public_docs"],
      constraints: ["local_review_only", "no_action_execution"],
      settlementSensitive: false,
    },
    mandate: {
      id: "mandate_gatepass_low_risk_local_review",
      allowedAction: "read_public_docs",
      issuerReference: "issuer_local_gatepass_demo",
      status: "present",
    },
    evidence: {
      refs: ["evidence_gatepass_low_risk_docs"],
      status: "present",
    },
    risk: {
      tier: "low",
      sensitiveToolCall: false,
      highRiskAction: false,
    },
    approval: {
      required: false,
      status: "not_required",
      approverReference: null,
    },
    signature: {
      status: "present",
      proofReference: "local_signed_gatepass_low_risk_demo",
      alg: "local-demo-placeholder",
      productionSigning: false,
    },
  });

  const sensitiveTool = createBaseGatePass({
    jti: "gatepass_core_sensitive_tool_valid_001",
    mandate: {
      id: "mandate_sensitive_tool_local_review",
      allowedAction: "publish_public_post",
      issuerReference: "issuer_local_gatepass_demo",
      status: "present",
    },
    scope: {
      permittedActions: ["publish_public_post"],
      constraints: ["local_demo_only", "human_reviewed_draft", "no_real_post"],
      settlementSensitive: false,
    },
    evidence: {
      refs: ["evidence_sensitive_tool_draft", "evidence_sensitive_tool_policy"],
      status: "present",
    },
    risk: {
      tier: "medium",
      sensitiveToolCall: true,
      highRiskAction: false,
    },
    approval: {
      required: true,
      status: "approved",
      approverReference: "local_human_review_001",
    },
    signature: {
      status: "present",
      proofReference: "local_signed_gatepass_sensitive_tool_demo",
      alg: "local-demo-placeholder",
      productionSigning: false,
    },
  });

  const highRiskHumanReview = createBaseGatePass({
    jti: "gatepass_core_high_risk_human_review_001",
    mandate: {
      id: "mandate_high_risk_access_review",
      allowedAction: "escalate_access_session_review",
      issuerReference: "issuer_local_gatepass_demo",
      status: "present",
    },
    scope: {
      permittedActions: ["escalate_access_session_review"],
      constraints: ["local_demo_only", "requires_human_review", "no_access_change"],
      settlementSensitive: false,
    },
    evidence: {
      refs: ["evidence_high_risk_access_review"],
      status: "present",
    },
    risk: {
      tier: "high",
      sensitiveToolCall: true,
      highRiskAction: true,
    },
    approval: {
      required: true,
      status: "required_missing",
      approverReference: null,
    },
    signature: {
      status: "present",
      proofReference: "local_signed_gatepass_high_risk_demo",
      alg: "local-demo-placeholder",
      productionSigning: false,
    },
  });

  const preSettlement = createBaseGatePass({
    jti: "gatepass_core_pre_settlement_valid_001",
    mandate: {
      id: "mandate_pre_settlement_local_review",
      allowedAction: "pre_settlement_review",
      issuerReference: "issuer_local_gatepass_demo",
      status: "present",
    },
    scope: {
      permittedActions: ["pre_settlement_review"],
      constraints: ["local_demo_only", "no_real_settlement", "signed_gatepass_required"],
      settlementSensitive: true,
    },
    evidence: {
      refs: ["evidence_pre_settlement_local_review"],
      status: "present",
    },
    risk: {
      tier: "critical",
      sensitiveToolCall: true,
      highRiskAction: true,
    },
    approval: {
      required: true,
      status: "approved",
      approverReference: "local_human_pre_settlement_review_001",
    },
    signature: {
      status: "present",
      proofReference: "local_signed_gatepass_pre_settlement_demo",
      alg: "local-demo-placeholder",
      productionSigning: false,
    },
    extensions: {
      preSettlement: {
        settlementSensitive: true,
        requiresSignedGatePass: true,
        blockerReference: "local_pre_settlement_blocker_demo",
        noSignedGatePassNoSettlement: true,
      },
    },
  });

  return {
    gatepass_core_valid_local_low_risk: lowRisk,
    gatepass_core_sensitive_tool_valid: sensitiveTool,
    gatepass_core_high_risk_human_review: highRiskHumanReview,
    gatepass_core_pre_settlement_valid_local: preSettlement,
    gatepass_core_identity_only_invalid: createBaseGatePass({
      jti: "gatepass_core_identity_only_invalid_001",
      iss: "claimed_trusted_owner",
      sub: "claimed_trusted_agent",
      mandate: {
        id: "",
        allowedAction: "",
        issuerReference: "",
        status: "missing",
      },
      scope: {
        permittedActions: [],
        constraints: [],
        settlementSensitive: false,
      },
      evidence: {
        refs: [],
        status: "missing",
      },
      intent: {
        status: "missing",
        context: "",
      },
      nonce: "",
      approval: {
        required: true,
        status: "required_missing",
        approverReference: null,
      },
      signature: {
        status: "missing",
        proofReference: null,
        alg: "local-demo-placeholder",
        productionSigning: false,
      },
    }),
    gatepass_core_missing_mandate_invalid: createBaseGatePass({
      jti: "gatepass_core_missing_mandate_invalid_001",
      mandate: {
        id: "",
        allowedAction: "",
        issuerReference: "",
        status: "missing",
      },
    }),
    gatepass_core_missing_evidence_invalid: createBaseGatePass({
      jti: "gatepass_core_missing_evidence_invalid_001",
      risk: {
        tier: "medium",
        sensitiveToolCall: true,
        highRiskAction: false,
      },
      evidence: {
        refs: [],
        status: "missing",
      },
      approval: {
        required: true,
        status: "approved",
        approverReference: "local_human_review_002",
      },
    }),
    gatepass_core_stale_expiry_invalid: createBaseGatePass({
      jti: "gatepass_core_stale_expiry_invalid_001",
      exp: "2024-01-01T00:00:00.000Z",
    }),
    gatepass_core_missing_signature_pre_settlement_invalid: {
      ...preSettlement,
      jti: "gatepass_core_missing_signature_pre_settlement_invalid_001",
      signature: {
        status: "missing",
        proofReference: null,
        alg: "local-demo-placeholder",
        productionSigning: false,
      },
    },
  };
}

export function runGatePassCoreScenario(
  exampleId: GatePassCoreExampleId,
): GatePassCoreValidationResult {
  return validateGatePassCore(createGatePassCoreExampleInputs()[exampleId]);
}

export function runGatePassCoreDemo(): GatePassCoreDemoPack {
  const inputs = createGatePassCoreExampleInputs();
  const examples = Object.fromEntries(
    (Object.keys(GATEPASS_CORE_EXAMPLE_FILES) as GatePassCoreExampleId[])
      .map((exampleId) => {
        const gatePass = inputs[exampleId];
        return [exampleId, {
          gatePass,
          result: validateGatePassCore(gatePass),
          explanation: explainGatePassCore(gatePass),
        }];
      }),
  ) as Record<GatePassCoreExampleId, GatePassCoreDemoExample>;
  const results = Object.values(examples).map((example) => example.result);
  return {
    packVersion: GATEPASS_CORE_VERSION,
    packId: createPackId(results),
    coreLine: GATEPASS_CORE_LINE,
    strategicPrinciple: GATEPASS_CORE_STRATEGIC_PRINCIPLE,
    positioning: GATEPASS_CORE_POSITIONING,
    publicContactEmail: GATEPASS_CORE_PUBLIC_CONTACT,
    referenceTime: GATEPASS_CORE_REFERENCE_TIME,
    exampleCount: results.length,
    decisions: countDecisions(results),
    exampleFiles: GATEPASS_CORE_EXAMPLE_FILES,
    note: NOTE,
    examples,
    ...GATEPASS_CORE_SAFETY_FLAGS,
  };
}

export function summariseGatePassCoreDemo(pack: GatePassCoreDemoPack): GatePassCoreDemoSummary {
  const { examples: _examples, ...summary } = pack;
  return summary;
}

export function getGatePassCoreExample(exampleId: GatePassCoreExampleId): GatePassCore {
  return createGatePassCoreExampleInputs()[exampleId];
}

function createBaseGatePass(overrides: Partial<GatePassCore>): GatePassCore {
  return {
    version: GATEPASS_CORE_VERSION,
    iss: "issuer_local_gatepass_demo",
    sub: "local_demo_agent_or_workflow",
    aud: "agent_trust_gate_local_verifier",
    jti: "gatepass_core_base_001",
    iat: "2026-07-11T09:00:00.000Z",
    exp: "2030-01-01T00:00:00.000Z",
    nonce: "nonce_gatepass_core_base_001",
    mandate: {
      id: "mandate_gatepass_core_base",
      allowedAction: "local_review",
      issuerReference: "issuer_local_gatepass_demo",
      status: "present",
    },
    scope: {
      permittedActions: ["local_review"],
      constraints: ["local_demo_only", "no_action_execution"],
      settlementSensitive: false,
    },
    evidence: {
      refs: ["evidence_gatepass_core_base"],
      status: "present",
    },
    intent: {
      status: "verified",
      context: "local demo intent verified for bounded review",
    },
    risk: {
      tier: "low",
      sensitiveToolCall: false,
      highRiskAction: false,
    },
    approval: {
      required: false,
      status: "not_required",
      approverReference: null,
    },
    signature: {
      status: "present",
      proofReference: "local_signed_gatepass_core_base",
      alg: "local-demo-placeholder",
      productionSigning: false,
    },
    ...GATEPASS_CORE_SAFETY_FLAGS,
    ...overrides,
  };
}

function collectMissingFields(input: GatePassCore, profile: GatePassProfile): string[] {
  const missing: string[] = [];
  if (input.version !== GATEPASS_CORE_VERSION) missing.push("version");
  if (isBlank(input.iss)) missing.push("iss");
  if (isBlank(input.sub)) missing.push("sub");
  if (isBlank(input.aud)) missing.push("aud");
  if (isBlank(input.jti)) missing.push("jti");
  if (isBlank(input.iat)) missing.push("iat");
  if (isBlank(input.exp)) missing.push("exp");
  if (isBlank(input.nonce)) missing.push("nonce");
  if (isBlank(input.mandate.id) || isBlank(input.mandate.allowedAction) || input.mandate.status !== "present") {
    missing.push("mandate");
  }
  if (input.scope.permittedActions.length === 0) missing.push("scope");
  if (input.evidence.refs.length === 0 || input.evidence.status !== "present") missing.push("evidence");
  if (input.intent.status === "missing" || isBlank(input.intent.context)) missing.push("intent");
  if (input.approval.required && input.approval.status !== "approved") missing.push("approval");
  if (input.signature.status !== "present" || isBlank(input.signature.proofReference)) missing.push("signature");
  if (profile === "pre_settlement") {
    if (input.extensions?.preSettlement?.requiresSignedGatePass !== true) missing.push("extensions.preSettlement.requiresSignedGatePass");
    if (input.extensions?.preSettlement?.noSignedGatePassNoSettlement !== true) {
      missing.push("extensions.preSettlement.noSignedGatePassNoSettlement");
    }
  }
  if (!input.localDemoOnly) missing.push("localDemoOnly");
  if (!hasSafeFlags(input)) missing.push("safeAuthorityFlags");
  return unique(missing);
}

function collectReasons(
  input: GatePassCore,
  profile: GatePassProfile,
  missingFields: readonly string[],
): string[] {
  const reasons = [
    "gatepass_core_local_only",
    "claimed_identity_not_trust",
    `profile_${profile}`,
    ...missingFields.map((field) => `missing_${field}`),
  ];
  if (isIdentityOnly(input)) reasons.push("claimed_identity_only_is_not_proof");
  if (isExpired(input.exp)) reasons.push("gatepass_expired_or_stale");
  if (input.intent.status === "unverified") reasons.push("verified_intent_unverified");
  if (input.intent.status === "conflicting") reasons.push("verified_intent_conflicting");
  if (input.signature.status === "tampered" || input.signature.status === "malformed") {
    reasons.push(`signature_${input.signature.status}`);
  }
  if (input.signature.status === "missing") reasons.push("signature_missing");
  if (isPreSettlement(input)) reasons.push("pre_settlement_signed_gatepass_required");
  if (input.approval.required && input.approval.status === "required_missing") reasons.push("human_approval_required_missing");
  if (input.approval.status === "rejected") reasons.push("human_approval_rejected");
  if (!hasSafeFlags(input)) reasons.push("live_or_authority_flag_not_disabled");
  return unique(reasons);
}

function decideGatePassCore(
  input: GatePassCore,
  profile: GatePassProfile,
  missingFields: readonly string[],
  reasons: readonly string[],
): GatePassDecision {
  if (!input.localDemoOnly || !hasSafeFlags(input)) return "block";
  if (profile === "identity_only_invalid") return "block";
  if (missingFields.includes("mandate")) return "block";
  if (missingFields.includes("nonce") || isExpired(input.exp)) return "block";
  if (input.signature.status === "tampered" || input.signature.status === "malformed") return "block";
  if (input.approval.status === "rejected") return "block";
  if (missingFields.includes("evidence")) return "require_evidence";
  if (input.intent.status === "missing" || input.intent.status === "conflicting") return "block";
  if (input.intent.status === "unverified" && (profile !== "low_risk_action" || input.risk.sensitiveToolCall)) {
    return "escalate";
  }
  if (profile === "pre_settlement" && missingFields.includes("signature")) return "require_signed_proof";
  if (input.signature.status !== "present" || isBlank(input.signature.proofReference)) return "require_signed_proof";
  if (profile === "high_risk_human_review" && missingFields.includes("approval")) return "require_human_review";
  if (input.approval.required && input.approval.status !== "approved") return "require_human_review";
  if (reasons.some((reason) => reason === "live_or_authority_flag_not_disabled")) return "block";
  return "allow";
}

function requiredNextProofFor(
  decision: GatePassDecision,
  missingFields: readonly string[],
  profile: GatePassProfile,
): string[] {
  const missing = missingFields.map((field) => `provide_${field}`);
  switch (decision) {
    case "allow":
      return ["record_local_gatepass_result", "continue_local_demo_only", "do_not_execute_actions"];
    case "block":
      return unique(["stop_request", "present_fresh_non_replayed_scoped_gatepass", ...missing]);
    case "escalate":
      return unique(["route_to_local_reviewer", "verify_intent_before_permission", ...missing]);
    case "require_evidence":
      return unique(["present_evidence_refs", "bind_evidence_to_mandate_scope_and_nonce", ...missing]);
    case "require_human_review":
      return unique(["obtain_human_review", "bind_approval_to_gatepass_scope_nonce_and_expiry", ...missing]);
    case "require_signed_proof":
      return profile === "pre_settlement"
        ? unique(["present_signed_gatepass", "prove_pre_settlement_scope_freshness_and_nonce", ...missing])
        : unique(["present_signature.proofReference", "present_signature.status_present", ...missing]);
  }
}

function createGatePassMeaning(
  input: GatePassCore,
  profile: GatePassProfile,
  decision: GatePassDecision,
): GatePassCoreValidationResult["gatePassMeaning"] {
  const mayProveLocally = [
    "gatepass_core_fields_were_checked_locally",
    "claimed_agent_identity_was_not_treated_as_sufficient_trust",
    "mandate_scope_evidence_intent_risk_approval_freshness_nonce_and_signature_status_were_reviewed",
    `local_profile_${profile}`,
    `local_decision_${decision}`,
  ];
  if (input.signature.status === "present") mayProveLocally.push("signed_gatepass_reference_was_present_locally");
  if (isPreSettlement(input)) {
    mayProveLocally.push("pre_settlement_profile_requires_signed_gatepass_before_any_settlement_sensitive_flow");
  }
  return {
    mayProveLocally,
    doesNotProve: [
      "production_identity_or_authentication",
      "production_grade_crypto",
      "legal_financial_compliance_procurement_settlement_or_security_certification",
      "payment_or_settlement_authority",
      "permission_to_execute_real_tools_or_actions",
      "live_systems_contact_or_agent_to_agent_communication",
      "universal_agent_standard_status",
    ],
  };
}

function countDecisions(results: readonly GatePassCoreValidationResult[]): Record<GatePassDecision, number> {
  const counts: Record<GatePassDecision, number> = {
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
  input: GatePassCore,
  profile: GatePassProfile,
  decision: GatePassDecision,
  reasons: readonly string[],
): string {
  return `gatepass_core_result_${createHash("sha256")
    .update(`${GATEPASS_CORE_VERSION}|${input.jti}|${profile}|${decision}|${reasons.join(",")}`, "utf8")
    .digest("hex")
    .slice(0, 24)}`;
}

function createPackId(results: readonly GatePassCoreValidationResult[]): string {
  const seed = results
    .map((result) => `${result.gatePassId}:${result.profile}:${result.decision}:${result.reasons.join(",")}`)
    .join("|");
  return `gatepass_core_${createHash("sha256")
    .update(`${GATEPASS_CORE_VERSION}|${seed}`, "utf8")
    .digest("hex")
    .slice(0, 24)}`;
}

function isIdentityOnly(input: GatePassCore): boolean {
  return !isBlank(input.iss)
    && !isBlank(input.sub)
    && isBlank(input.mandate.id)
    && input.scope.permittedActions.length === 0
    && input.evidence.refs.length === 0
    && input.intent.status === "missing"
    && isBlank(input.nonce)
    && input.signature.status === "missing";
}

function isPreSettlement(input: GatePassCore): boolean {
  return input.scope.settlementSensitive === true
    || input.extensions?.preSettlement?.settlementSensitive === true
    || input.extensions?.preSettlement?.requiresSignedGatePass === true;
}

function isExpired(expiry: string): boolean {
  const expiryTime = Date.parse(expiry);
  if (Number.isNaN(expiryTime)) return true;
  return expiryTime <= Date.parse(GATEPASS_CORE_REFERENCE_TIME);
}

function hasSafeFlags(input: GatePassCore): boolean {
  return input.localDemoOnly === true
    && input.localOnly === true
    && input.liveSystemsContact === false
    && input.directBotMessaging === false
    && input.autonomousOutreach === false
    && input.outreachAutomation === false
    && input.liveAgentToAgentCommunication === false
    && input.externalAgentContact === false
    && input.liveApi === false
    && input.mcpServer === false
    && input.cloudNetworkCall === false
    && input.secretsOrCredentials === false
    && input.paymentAuthorisation === false
    && input.settlementAuthorisation === false
    && input.walletBankingLogic === false
    && input.productionSigning === false
    && input.productionGradeCrypto === false
    && input.productionCertification === false
    && input.actionExecution === false;
}

function isBlank(value: string | null): boolean {
  return value === null || value.trim() === "";
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}
