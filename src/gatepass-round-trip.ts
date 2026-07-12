import { createHash } from "node:crypto";

import {
  GATEPASS_CORE_LINE,
  GATEPASS_CORE_POSITIONING,
  GATEPASS_CORE_PUBLIC_CONTACT,
  GATEPASS_CORE_REFERENCE_TIME,
  GATEPASS_CORE_SAFETY_FLAGS,
  GATEPASS_CORE_STRATEGIC_PRINCIPLE,
  GATEPASS_CORE_VERSION,
  validateGatePassCore,
  type GatePassApprovalStatus,
  type GatePassCore,
  type GatePassCoreSafetyFlags,
  type GatePassCoreValidationResult,
  type GatePassDecision,
  type GatePassIntentStatus,
  type GatePassRiskTier,
  type GatePassSignatureStatus,
} from "./gatepass-core.js";

export const GATEPASS_ROUND_TRIP_VERSION = "atg.gatepass-round-trip.local.v1" as const;
export const GATEPASS_ROUND_TRIP_PUBLIC_CONTACT = GATEPASS_CORE_PUBLIC_CONTACT;
export const GATEPASS_ROUND_TRIP_CORE_LINE = GATEPASS_CORE_LINE;
export const GATEPASS_ROUND_TRIP_POSITIONING = GATEPASS_CORE_POSITIONING;
export const GATEPASS_ROUND_TRIP_STRATEGIC_PRINCIPLE = GATEPASS_CORE_STRATEGIC_PRINCIPLE;

export type GatePassRoundTripScenarioId =
  | "valid_allow_local"
  | "identity_only_rejected"
  | "missing_mandate_rejected"
  | "missing_evidence_requires_evidence"
  | "stale_expiry_rejected"
  | "replayed_nonce_rejected"
  | "tampered_scope_rejected"
  | "high_risk_human_review"
  | "pre_settlement_requires_signed_proof"
  | "pre_settlement_valid_local";

export type GatePassRoundTripRejectionReason =
  | "identity_only_not_sufficient"
  | "missing_mandate"
  | "missing_evidence"
  | "unverified_intent"
  | "stale_expiry"
  | "missing_nonce"
  | "replayed_nonce"
  | "missing_signature"
  | "tampered_gatepass"
  | "scope_mismatch"
  | "high_risk_requires_human_review"
  | "settlement_requires_signed_gatepass";

export interface GatePassRoundTripSafetyFlags extends GatePassCoreSafetyFlags {
  realToolExecuted: false;
}

export interface GatePassCreateInput {
  scenarioId: GatePassRoundTripScenarioId;
  issuerReference: string;
  subjectReference: string;
  audienceReference: string;
  requestedAction: string;
  mandateReference: string | null;
  evidenceReferences: string[];
  intentStatus: GatePassIntentStatus;
  riskTier: GatePassRiskTier;
  sensitiveToolCall: boolean;
  highRiskAction: boolean;
  approvalRequired: boolean;
  approvalStatus: GatePassApprovalStatus;
  approverReference: string | null;
  exp: string;
  nonce: string;
  signatureStatus: GatePassSignatureStatus;
  signedProofReference: string | null;
  settlementSensitive: boolean;
  localDemoOnly: true;
}

export interface GatePassVerificationContext extends GatePassRoundTripSafetyFlags {
  scenarioId: GatePassRoundTripScenarioId;
  expectedAudience: string;
  expectedAction: string;
  expectedIntegrityHash: string;
  consumedNonces: string[];
  settlementSensitive: boolean;
  requireSignedGatePass: boolean;
}

export interface GatePassRoundTripReceiptSummary {
  receiptId: string;
  lifecycle: readonly ["create", "verify", "decide", "explain"];
  createdLocally: true;
  verifiedLocally: true;
  rejectedLocally: boolean;
  wouldAllowLocally: boolean;
  realToolExecuted: false;
  actionExecution: false;
}

export interface GatePassRoundTripResult extends GatePassRoundTripSafetyFlags {
  roundTripVersion: typeof GATEPASS_ROUND_TRIP_VERSION;
  scenarioId: GatePassRoundTripScenarioId;
  gatePassId: string;
  gatePass: GatePassCore;
  verificationContext: GatePassVerificationContext;
  coreValidation: GatePassCoreValidationResult;
  decision: GatePassDecision;
  validLocallyOnly: boolean;
  reasons: string[];
  rejectionReasons: GatePassRoundTripRejectionReason[];
  requiredNextProof: string[];
  explanation: string[];
  receiptSummary: GatePassRoundTripReceiptSummary;
  noProofMeansNoPermission: true;
  claimedIdentityAloneSufficient: false;
  publicContactEmail: typeof GATEPASS_ROUND_TRIP_PUBLIC_CONTACT;
  note: "GatePass create-verify-reject round trip local model only; no production signing, production-grade crypto, live systems contact, direct bot messaging, live agent-to-agent communication, payment, settlement, network call, real tool execution, or action execution occurred.";
}

export interface GatePassRoundTripDemoPack extends GatePassRoundTripSafetyFlags {
  packVersion: typeof GATEPASS_ROUND_TRIP_VERSION;
  packId: string;
  coreLine: typeof GATEPASS_ROUND_TRIP_CORE_LINE;
  strategicPrinciple: typeof GATEPASS_ROUND_TRIP_STRATEGIC_PRINCIPLE;
  positioning: typeof GATEPASS_ROUND_TRIP_POSITIONING;
  publicContactEmail: typeof GATEPASS_ROUND_TRIP_PUBLIC_CONTACT;
  referenceTime: typeof GATEPASS_CORE_REFERENCE_TIME;
  scenarioCount: number;
  decisions: Record<GatePassDecision, number>;
  exampleFiles: typeof GATEPASS_ROUND_TRIP_EXAMPLE_FILES;
  note: GatePassRoundTripResult["note"];
  scenarios: Record<GatePassRoundTripScenarioId, GatePassRoundTripResult>;
}

export type GatePassRoundTripDemoSummary = Omit<GatePassRoundTripDemoPack, "scenarios">;

export const GATEPASS_ROUND_TRIP_EXAMPLE_FILES: Record<GatePassRoundTripScenarioId, string> = {
  valid_allow_local: "examples/gatepass-round-trip-valid-allow-local.json",
  identity_only_rejected: "examples/gatepass-round-trip-identity-only-rejected.json",
  missing_mandate_rejected: "examples/gatepass-round-trip-missing-mandate-rejected.json",
  missing_evidence_requires_evidence: "examples/gatepass-round-trip-missing-evidence-requires-evidence.json",
  stale_expiry_rejected: "examples/gatepass-round-trip-stale-expiry-rejected.json",
  replayed_nonce_rejected: "examples/gatepass-round-trip-replayed-nonce-rejected.json",
  tampered_scope_rejected: "examples/gatepass-round-trip-tampered-scope-rejected.json",
  high_risk_human_review: "examples/gatepass-round-trip-high-risk-human-review.json",
  pre_settlement_requires_signed_proof:
    "examples/gatepass-round-trip-pre-settlement-requires-signed-proof.json",
  pre_settlement_valid_local: "examples/gatepass-round-trip-pre-settlement-valid-local.json",
};

export const GATEPASS_ROUND_TRIP_SAFETY_FLAGS: GatePassRoundTripSafetyFlags = {
  ...GATEPASS_CORE_SAFETY_FLAGS,
  realToolExecuted: false,
};

const NOTE: GatePassRoundTripResult["note"] =
  "GatePass create-verify-reject round trip local model only; no production signing, production-grade crypto, live systems contact, direct bot messaging, live agent-to-agent communication, payment, settlement, network call, real tool execution, or action execution occurred.";

export const GATEPASS_REJECTION_REASON_GUIDE: Record<GatePassRoundTripRejectionReason, {
  meaning: string;
  expectedDecision: GatePassDecision;
  requiredNextProof: string[];
}> = {
  identity_only_not_sufficient: {
    meaning: "The GatePass only claims an agent identity and does not bind mandate, evidence, intent, nonce, or signature.",
    expectedDecision: "block",
    requiredNextProof: ["present_scoped_gatepass", "bind_mandate_evidence_intent_nonce_and_signature"],
  },
  missing_mandate: {
    meaning: "The GatePass does not show what authority permits the requested action.",
    expectedDecision: "block",
    requiredNextProof: ["provide_mandate", "bind_mandate_to_requested_action"],
  },
  missing_evidence: {
    meaning: "The GatePass does not reference evidence for the decision.",
    expectedDecision: "require_evidence",
    requiredNextProof: ["provide_evidence_refs", "bind_evidence_to_scope_and_nonce"],
  },
  unverified_intent: {
    meaning: "Intent is missing, unverified, or conflicting for the requested action.",
    expectedDecision: "escalate",
    requiredNextProof: ["verify_intent", "route_to_local_reviewer_if_needed"],
  },
  stale_expiry: {
    meaning: "The GatePass expiry is stale against the local reference time.",
    expectedDecision: "block",
    requiredNextProof: ["present_fresh_gatepass", "refresh_approval_and_nonce"],
  },
  missing_nonce: {
    meaning: "The GatePass does not carry a nonce for replay protection.",
    expectedDecision: "block",
    requiredNextProof: ["provide_nonce", "bind_nonce_to_gatepass_and_scope"],
  },
  replayed_nonce: {
    meaning: "The nonce has already been consumed in the local verification context.",
    expectedDecision: "block",
    requiredNextProof: ["issue_new_gatepass", "use_fresh_nonce"],
  },
  missing_signature: {
    meaning: "The GatePass lacks a local signed proof reference.",
    expectedDecision: "require_signed_proof",
    requiredNextProof: ["present_signed_gatepass", "bind_signature_to_scope_expiry_and_nonce"],
  },
  tampered_gatepass: {
    meaning: "The GatePass no longer matches the expected local integrity hash.",
    expectedDecision: "block",
    requiredNextProof: ["present_untampered_gatepass", "recreate_gatepass_from_authorised_inputs"],
  },
  scope_mismatch: {
    meaning: "The GatePass scope or mandate does not match the action being verified.",
    expectedDecision: "block",
    requiredNextProof: ["present_gatepass_with_matching_scope", "narrow_requested_action"],
  },
  high_risk_requires_human_review: {
    meaning: "The action is high risk and requires human approval before any local allowance.",
    expectedDecision: "require_human_review",
    requiredNextProof: ["obtain_human_review", "bind_approval_to_gatepass_scope_nonce_and_expiry"],
  },
  settlement_requires_signed_gatepass: {
    meaning: "The requested workflow is settlement-sensitive and requires a signed GatePass before proceeding locally.",
    expectedDecision: "require_signed_proof",
    requiredNextProof: ["present_signed_gatepass", "prove_pre_settlement_scope_freshness_and_nonce"],
  },
};

export function createGatePassRoundTripScenarioInputs(): Record<GatePassRoundTripScenarioId, GatePassCreateInput> {
  const base = createBaseInput("valid_allow_local", "read_public_docs");
  return {
    valid_allow_local: base,
    identity_only_rejected: {
      ...createBaseInput("identity_only_rejected", ""),
      issuerReference: "claimed_trusted_owner",
      subjectReference: "claimed_trusted_agent",
      mandateReference: null,
      evidenceReferences: [],
      intentStatus: "missing",
      approvalRequired: true,
      approvalStatus: "required_missing",
      approverReference: null,
      nonce: "",
      signatureStatus: "missing",
      signedProofReference: null,
    },
    missing_mandate_rejected: {
      ...createBaseInput("missing_mandate_rejected", "export_data"),
      mandateReference: null,
      riskTier: "medium",
      sensitiveToolCall: true,
      approvalRequired: true,
      approvalStatus: "approved",
      approverReference: "local_human_review_round_trip_001",
    },
    missing_evidence_requires_evidence: {
      ...createBaseInput("missing_evidence_requires_evidence", "publish_public_post"),
      evidenceReferences: [],
      riskTier: "medium",
      sensitiveToolCall: true,
      approvalRequired: true,
      approvalStatus: "approved",
      approverReference: "local_human_review_round_trip_002",
    },
    stale_expiry_rejected: {
      ...createBaseInput("stale_expiry_rejected", "read_public_docs"),
      exp: "2024-01-01T00:00:00.000Z",
    },
    replayed_nonce_rejected: {
      ...createBaseInput("replayed_nonce_rejected", "read_public_docs"),
      nonce: "nonce_gatepass_round_trip_replayed_001",
    },
    tampered_scope_rejected: {
      ...createBaseInput("tampered_scope_rejected", "publish_public_post"),
      riskTier: "medium",
      sensitiveToolCall: true,
      approvalRequired: true,
      approvalStatus: "approved",
      approverReference: "local_human_review_round_trip_003",
    },
    high_risk_human_review: {
      ...createBaseInput("high_risk_human_review", "escalate_access_session_review"),
      riskTier: "high",
      sensitiveToolCall: true,
      highRiskAction: true,
      approvalRequired: true,
      approvalStatus: "required_missing",
      approverReference: null,
    },
    pre_settlement_requires_signed_proof: {
      ...createBaseInput("pre_settlement_requires_signed_proof", "pre_settlement_review"),
      riskTier: "critical",
      sensitiveToolCall: true,
      highRiskAction: true,
      approvalRequired: true,
      approvalStatus: "approved",
      approverReference: "local_human_pre_settlement_review_round_trip_001",
      settlementSensitive: true,
      signatureStatus: "missing",
      signedProofReference: null,
    },
    pre_settlement_valid_local: {
      ...createBaseInput("pre_settlement_valid_local", "pre_settlement_review"),
      riskTier: "critical",
      sensitiveToolCall: true,
      highRiskAction: true,
      approvalRequired: true,
      approvalStatus: "approved",
      approverReference: "local_human_pre_settlement_review_round_trip_002",
      settlementSensitive: true,
      signedProofReference: "local_signed_gatepass_round_trip_pre_settlement",
    },
  };
}

export function createLocalGatePass(input: GatePassCreateInput): GatePassCore {
  const hasAction = input.requestedAction.trim().length > 0;
  const hasMandate = input.mandateReference !== null && input.mandateReference.trim().length > 0;
  const hasEvidence = input.evidenceReferences.length > 0;
  const gatePass: GatePassCore = {
    version: GATEPASS_CORE_VERSION,
    iss: input.issuerReference,
    sub: input.subjectReference,
    aud: input.audienceReference,
    jti: `gatepass_round_trip_${input.scenarioId}_001`,
    iat: "2026-07-11T09:30:00.000Z",
    exp: input.exp,
    nonce: input.nonce,
    mandate: {
      id: input.mandateReference ?? "",
      allowedAction: hasMandate ? input.requestedAction : "",
      issuerReference: hasMandate ? input.issuerReference : "",
      status: hasMandate ? "present" : "missing",
    },
    scope: {
      permittedActions: hasAction ? [input.requestedAction] : [],
      constraints: input.settlementSensitive
        ? ["local_demo_only", "no_real_settlement", "signed_gatepass_required"]
        : ["local_demo_only", "no_action_execution"],
      settlementSensitive: input.settlementSensitive,
    },
    evidence: {
      refs: input.evidenceReferences,
      status: hasEvidence ? "present" : "missing",
    },
    intent: {
      status: input.intentStatus,
      context: input.intentStatus === "missing" ? "" : `local intent context for ${input.requestedAction}`,
    },
    risk: {
      tier: input.riskTier,
      sensitiveToolCall: input.sensitiveToolCall,
      highRiskAction: input.highRiskAction,
    },
    approval: {
      required: input.approvalRequired,
      status: input.approvalStatus,
      approverReference: input.approverReference,
    },
    signature: {
      status: input.signatureStatus,
      proofReference: input.signedProofReference,
      alg: "local-demo-placeholder",
      productionSigning: false,
    },
    ...GATEPASS_CORE_SAFETY_FLAGS,
  };
  if (input.settlementSensitive) {
    gatePass.extensions = {
      preSettlement: {
        settlementSensitive: true,
        requiresSignedGatePass: true,
        blockerReference: "local_round_trip_pre_settlement_blocker",
        noSignedGatePassNoSettlement: true,
      },
    };
  }
  return gatePass;
}

export function verifyLocalGatePass(
  gatePass: GatePassCore,
  verificationContext: GatePassVerificationContext,
): GatePassRoundTripResult {
  const coreValidation = validateGatePassCore(gatePass);
  const contextReasons = collectContextRejectionReasons(gatePass, verificationContext, coreValidation);
  const decision = decideRoundTrip(coreValidation, contextReasons);
  const rejectionReasons = collectRejectionReasons(coreValidation, contextReasons, verificationContext);
  const reasons = unique([
    "gatepass_created_locally",
    "gatepass_verified_locally",
    decision === "allow" ? "gatepass_allowed_locally_only" : "gatepass_rejected_or_requires_more_proof_locally",
    "no_real_tool_execution",
    "no_action_execution",
    ...coreValidation.reasons,
    ...contextReasons.map((reason) => `round_trip_${reason}`),
  ]);
  const requiredNextProof = collectRequiredNextProof(coreValidation, rejectionReasons, decision);
  const resultWithoutReceipt = {
    roundTripVersion: GATEPASS_ROUND_TRIP_VERSION,
    scenarioId: verificationContext.scenarioId,
    gatePassId: gatePass.jti,
    gatePass,
    verificationContext,
    coreValidation,
    decision,
    validLocallyOnly: decision === "allow",
    reasons,
    rejectionReasons,
    requiredNextProof,
    explanation: explainDecision(decision, rejectionReasons, gatePass, verificationContext),
    noProofMeansNoPermission: true,
    claimedIdentityAloneSufficient: false,
    publicContactEmail: GATEPASS_ROUND_TRIP_PUBLIC_CONTACT,
    note: NOTE,
    ...GATEPASS_ROUND_TRIP_SAFETY_FLAGS,
  } satisfies Omit<GatePassRoundTripResult, "receiptSummary">;
  return {
    ...resultWithoutReceipt,
    receiptSummary: createReceiptSummary(resultWithoutReceipt),
  };
}

export function rejectGatePass(
  gatePass: GatePassCore,
  reason: GatePassRoundTripRejectionReason,
): GatePassRoundTripResult {
  const context = createVerificationContext(gatePass, "identity_only_rejected", {
    expectedAction: gatePass.mandate.allowedAction || gatePass.scope.permittedActions[0] || "unknown_action",
  });
  const result = verifyLocalGatePass(gatePass, context);
  const rejectionReasons = unique([reason, ...result.rejectionReasons]);
  const decision = decideRoundTrip(result.coreValidation, rejectionReasons);
  const manualResult = {
    ...result,
    decision,
    validLocallyOnly: false,
    rejectionReasons,
    reasons: unique([...result.reasons, `manual_reject_${reason}`]),
    requiredNextProof: collectRequiredNextProof(result.coreValidation, rejectionReasons, decision),
    explanation: explainDecision(decision, rejectionReasons, gatePass, context),
  };
  return {
    ...manualResult,
    receiptSummary: createReceiptSummary(manualResult),
  };
}

export function explainGatePassDecision(result: GatePassRoundTripResult): string[] {
  return result.explanation;
}

export function createGatePassIntegrityHash(gatePass: GatePassCore): string {
  return createHash("sha256")
    .update(JSON.stringify({
      version: gatePass.version,
      iss: gatePass.iss,
      sub: gatePass.sub,
      aud: gatePass.aud,
      jti: gatePass.jti,
      iat: gatePass.iat,
      exp: gatePass.exp,
      nonce: gatePass.nonce,
      mandate: gatePass.mandate,
      scope: gatePass.scope,
      evidence: gatePass.evidence,
      intent: gatePass.intent,
      risk: gatePass.risk,
      approval: gatePass.approval,
      signature: gatePass.signature,
      extensions: gatePass.extensions ?? null,
    }), "utf8")
    .digest("hex");
}

export function runGatePassRoundTripScenario(
  scenarioId: GatePassRoundTripScenarioId,
): GatePassRoundTripResult {
  const inputs = createGatePassRoundTripScenarioInputs();
  const input = inputs[scenarioId];
  let gatePass = createLocalGatePass(input);
  let expectedIntegrityHash = createGatePassIntegrityHash(gatePass);
  if (scenarioId === "replayed_nonce_rejected") {
    return verifyLocalGatePass(gatePass, createVerificationContext(gatePass, scenarioId, {
      consumedNonces: [gatePass.nonce],
      expectedIntegrityHash,
    }));
  }
  if (scenarioId === "tampered_scope_rejected") {
    const originalExpectedAction = gatePass.mandate.allowedAction;
    gatePass = {
      ...gatePass,
      scope: {
        ...gatePass.scope,
        permittedActions: ["export_data"],
        constraints: [...gatePass.scope.constraints, "tampered_scope_demo"],
      },
    };
    return verifyLocalGatePass(gatePass, createVerificationContext(gatePass, scenarioId, {
      expectedAction: originalExpectedAction,
      expectedIntegrityHash,
    }));
  }
  return verifyLocalGatePass(gatePass, createVerificationContext(gatePass, scenarioId, { expectedIntegrityHash }));
}

export function runGatePassRoundTripDemo(): GatePassRoundTripDemoPack {
  const scenarios = Object.fromEntries(
    (Object.keys(GATEPASS_ROUND_TRIP_EXAMPLE_FILES) as GatePassRoundTripScenarioId[])
      .map((scenarioId) => [scenarioId, runGatePassRoundTripScenario(scenarioId)]),
  ) as Record<GatePassRoundTripScenarioId, GatePassRoundTripResult>;
  const results = Object.values(scenarios);
  return {
    packVersion: GATEPASS_ROUND_TRIP_VERSION,
    packId: createPackId(results),
    coreLine: GATEPASS_ROUND_TRIP_CORE_LINE,
    strategicPrinciple: GATEPASS_ROUND_TRIP_STRATEGIC_PRINCIPLE,
    positioning: GATEPASS_ROUND_TRIP_POSITIONING,
    publicContactEmail: GATEPASS_ROUND_TRIP_PUBLIC_CONTACT,
    referenceTime: GATEPASS_CORE_REFERENCE_TIME,
    scenarioCount: results.length,
    decisions: countDecisions(results),
    exampleFiles: GATEPASS_ROUND_TRIP_EXAMPLE_FILES,
    note: NOTE,
    scenarios,
    ...GATEPASS_ROUND_TRIP_SAFETY_FLAGS,
  };
}

export function summariseGatePassRoundTripDemo(pack: GatePassRoundTripDemoPack): GatePassRoundTripDemoSummary {
  const { scenarios: _scenarios, ...summary } = pack;
  return summary;
}

function createBaseInput(scenarioId: GatePassRoundTripScenarioId, requestedAction: string): GatePassCreateInput {
  return {
    scenarioId,
    issuerReference: "issuer_local_gatepass_round_trip",
    subjectReference: "local_demo_agent_or_workflow",
    audienceReference: "agent_trust_gate_local_verifier",
    requestedAction,
    mandateReference: `mandate_${scenarioId}`,
    evidenceReferences: [`evidence_${scenarioId}`],
    intentStatus: "verified",
    riskTier: "low",
    sensitiveToolCall: false,
    highRiskAction: false,
    approvalRequired: false,
    approvalStatus: "not_required",
    approverReference: null,
    exp: "2030-01-01T00:00:00.000Z",
    nonce: `nonce_gatepass_round_trip_${scenarioId}_001`,
    signatureStatus: "present",
    signedProofReference: `local_signed_gatepass_round_trip_${scenarioId}`,
    settlementSensitive: false,
    localDemoOnly: true,
  };
}

function createVerificationContext(
  gatePass: GatePassCore,
  scenarioId: GatePassRoundTripScenarioId,
  overrides: Partial<GatePassVerificationContext> = {},
): GatePassVerificationContext {
  return {
    scenarioId,
    expectedAudience: gatePass.aud,
    expectedAction: gatePass.mandate.allowedAction || gatePass.scope.permittedActions[0] || "unknown_action",
    expectedIntegrityHash: createGatePassIntegrityHash(gatePass),
    consumedNonces: [],
    settlementSensitive: gatePass.scope.settlementSensitive,
    requireSignedGatePass: gatePass.scope.settlementSensitive,
    ...GATEPASS_ROUND_TRIP_SAFETY_FLAGS,
    ...overrides,
  };
}

function collectContextRejectionReasons(
  gatePass: GatePassCore,
  context: GatePassVerificationContext,
  coreValidation: GatePassCoreValidationResult,
): GatePassRoundTripRejectionReason[] {
  const reasons: GatePassRoundTripRejectionReason[] = [];
  if (context.expectedAudience !== gatePass.aud) reasons.push("scope_mismatch");
  if (!gatePass.scope.permittedActions.includes(context.expectedAction)) reasons.push("scope_mismatch");
  if (gatePass.mandate.allowedAction !== "" && gatePass.mandate.allowedAction !== context.expectedAction) {
    reasons.push("scope_mismatch");
  }
  if (context.expectedIntegrityHash !== createGatePassIntegrityHash(gatePass)) reasons.push("tampered_gatepass");
  if (gatePass.nonce !== "" && context.consumedNonces.includes(gatePass.nonce)) reasons.push("replayed_nonce");
  if (context.settlementSensitive && context.requireSignedGatePass && gatePass.signature.status !== "present") {
    reasons.push("settlement_requires_signed_gatepass");
  }
  if (coreValidation.decision === "require_human_review") reasons.push("high_risk_requires_human_review");
  return unique(reasons);
}

function collectRejectionReasons(
  coreValidation: GatePassCoreValidationResult,
  contextReasons: readonly GatePassRoundTripRejectionReason[],
  context: GatePassVerificationContext,
): GatePassRoundTripRejectionReason[] {
  const reasons: GatePassRoundTripRejectionReason[] = [...contextReasons];
  if (coreValidation.profile === "identity_only_invalid") reasons.push("identity_only_not_sufficient");
  if (coreValidation.missingFields.includes("mandate")) reasons.push("missing_mandate");
  if (coreValidation.missingFields.includes("evidence")) reasons.push("missing_evidence");
  if (coreValidation.missingFields.includes("nonce")) reasons.push("missing_nonce");
  if (coreValidation.missingFields.includes("signature")) reasons.push("missing_signature");
  if (coreValidation.reasons.includes("gatepass_expired_or_stale")) reasons.push("stale_expiry");
  if (
    coreValidation.reasons.includes("verified_intent_unverified")
    || coreValidation.reasons.includes("verified_intent_conflicting")
    || coreValidation.missingFields.includes("intent")
  ) {
    reasons.push("unverified_intent");
  }
  if (coreValidation.decision === "require_human_review") reasons.push("high_risk_requires_human_review");
  if (context.settlementSensitive && context.requireSignedGatePass && coreValidation.decision === "require_signed_proof") {
    reasons.push("settlement_requires_signed_gatepass");
  }
  return unique(reasons);
}

function decideRoundTrip(
  coreValidation: GatePassCoreValidationResult,
  rejectionReasons: readonly GatePassRoundTripRejectionReason[],
): GatePassDecision {
  if (rejectionReasons.some((reason) => [
    "identity_only_not_sufficient",
    "missing_mandate",
    "stale_expiry",
    "missing_nonce",
    "replayed_nonce",
    "tampered_gatepass",
    "scope_mismatch",
  ].includes(reason))) {
    return "block";
  }
  if (rejectionReasons.includes("settlement_requires_signed_gatepass") || rejectionReasons.includes("missing_signature")) {
    return "require_signed_proof";
  }
  if (rejectionReasons.includes("missing_evidence")) return "require_evidence";
  if (rejectionReasons.includes("high_risk_requires_human_review")) return "require_human_review";
  if (rejectionReasons.includes("unverified_intent")) return "escalate";
  return coreValidation.decision;
}

function collectRequiredNextProof(
  coreValidation: GatePassCoreValidationResult,
  rejectionReasons: readonly GatePassRoundTripRejectionReason[],
  decision: GatePassDecision,
): string[] {
  if (decision === "allow") {
    return ["record_local_round_trip_receipt", "continue_local_demo_only", "do_not_execute_actions"];
  }
  return unique([
    ...coreValidation.requiredNextProof,
    ...rejectionReasons.flatMap((reason) => GATEPASS_REJECTION_REASON_GUIDE[reason].requiredNextProof),
  ]);
}

function explainDecision(
  decision: GatePassDecision,
  rejectionReasons: readonly GatePassRoundTripRejectionReason[],
  gatePass: GatePassCore,
  context: GatePassVerificationContext,
): string[] {
  const lines = [
    `GatePass ${gatePass.jti} was created locally for ${context.expectedAction}.`,
    "The verifier checked mandate, evidence, intent, expiry, nonce, scope, signature status, and local safety flags.",
    "Claimed agent identity alone was not treated as trust.",
    `The local decision is ${decision}.`,
    "No real tool, payment, settlement, network call, live system contact, or action execution occurred.",
  ];
  for (const reason of rejectionReasons) {
    lines.push(`${reason}: ${GATEPASS_REJECTION_REASON_GUIDE[reason].meaning}`);
  }
  if (decision === "allow") {
    lines.push("This is a local-only allowance, not production readiness, production-grade crypto, or legal/compliance/security certification.");
  }
  return lines;
}

function createReceiptSummary(
  result: Omit<GatePassRoundTripResult, "receiptSummary">,
): GatePassRoundTripReceiptSummary {
  return {
    receiptId: `gatepass_round_trip_receipt_${createHash("sha256")
      .update(`${GATEPASS_ROUND_TRIP_VERSION}|${result.gatePassId}|${result.decision}|${result.reasons.join(",")}`, "utf8")
      .digest("hex")
      .slice(0, 24)}`,
    lifecycle: ["create", "verify", "decide", "explain"],
    createdLocally: true,
    verifiedLocally: true,
    rejectedLocally: result.decision !== "allow",
    wouldAllowLocally: result.decision === "allow",
    realToolExecuted: false,
    actionExecution: false,
  };
}

function countDecisions(results: readonly GatePassRoundTripResult[]): Record<GatePassDecision, number> {
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

function createPackId(results: readonly GatePassRoundTripResult[]): string {
  const seed = results
    .map((result) => `${result.gatePassId}:${result.scenarioId}:${result.decision}:${result.rejectionReasons.join(",")}`)
    .join("|");
  return `gatepass_round_trip_${createHash("sha256")
    .update(`${GATEPASS_ROUND_TRIP_VERSION}|${seed}`, "utf8")
    .digest("hex")
    .slice(0, 24)}`;
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}
