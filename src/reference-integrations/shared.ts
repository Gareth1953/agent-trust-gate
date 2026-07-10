import type { LocalGatePassDemoInput } from "../local-gate-pass-demo.js";
import {
  createLocalGatePassAuditReceipt,
  summariseLocalGatePassAudit,
  type LocalGatePassAuditReceipt,
  type LocalGatePassAuditSummary,
} from "../local-gate-pass-receipt.js";
import {
  runLocalEndToEndMoneyGateProof,
  summariseLocalEndToEndMoneyGateProof,
  type LocalEndToEndMoneyGateProofResult,
  type LocalEndToEndMoneyGateProofSummary,
} from "../local-end-to-end-money-gate-proof.js";
import {
  simulateLocalSettlementBlocker,
  type LocalSettlementBlockerDecision,
} from "../local-settlement-blocker.js";
import {
  signLocalTrustReceipt,
  verifyLocalTrustReceiptSignature,
  type LocalSignedProofVerificationDecision,
} from "../local-signed-proof.js";
import {
  verifyLocalTrustReceipt,
  type LocalTrustReceiptVerificationDecision,
} from "../local-trust-receipt-verifier.js";

export const REFERENCE_INTEGRATIONS_VERSION = "atg.reference-integrations.v1" as const;
export const REFERENCE_INTEGRATIONS_RULE =
  "No mandate. No evidence. No verified intent. No signed gate pass. No settlement." as const;
export const REFERENCE_INTEGRATIONS_PUBLIC_CONTACT = "gpmiddleton71@gmail.com" as const;

export type ReferenceIntegrationPatternId =
  | "generic_agent_loop"
  | "tool_calling_guardrail"
  | "human_in_the_loop_escalation"
  | "pre_settlement_money_gate"
  | "governance_reviewer_flow"
  | "agent_to_agent_handoff_gate"
  | "trust_gate_wrapper";

export type ReferenceIntegrationVerdict = "allow" | "block" | "escalate";

export interface ReferenceIntegrationSafetyFlags {
  localDemoOnly: true;
  localOnly: true;
  productionSigning: false;
  paymentAuthorisation: false;
  settlementAuthorisation: false;
  privateDataIncluded: false;
  networkCallPerformed: false;
  cloudCallPerformed: false;
  externalFrameworkCalled: false;
  externalAgentContacted: false;
  paymentTriggered: false;
  settlementExecuted: false;
  actionExecuted: false;
  sensitiveActionExecuted: false;
  officialFrameworkIntegration: false;
}

export interface ReferenceReceiptSummary {
  requestId: string;
  receiptId: string;
  verdict: string;
  receiptType: string;
  settlementAllowedByGate: boolean;
  humanReviewRequired: boolean;
  failedChecks: string[];
  reasonCodes: string[];
}

export interface ReferenceReceiptVerificationSummary {
  verified: boolean;
  validForSimulatedSettlement: boolean;
  structurallyValid: boolean;
  fresh: boolean;
  replaySafe: boolean;
  settlementBlockerAllowed: boolean;
  mode: "local_simulation_only";
  reasonCodes: string[];
}

export interface ReferenceSettlementBlockerSummary {
  settlementSimulation: "allowed" | "blocked";
  blocked: boolean;
  blockReasonCodes: string[];
  settlementExecuted: false;
  paymentTriggered: false;
  networkCallPerformed: false;
  actionExecuted: false;
  mode: "local_simulation_only";
}

export interface ReferenceSignedProofSummary {
  verified: boolean;
  signedPayloadType: string;
  payloadHashMatches: boolean;
  signatureValid: boolean;
  reasonCodes: string[];
  localDemoOnly: boolean;
  productionSigning: boolean;
  paymentAuthorisation: boolean;
  settlementAuthorisation: boolean;
}

export interface ReferenceIntegrationResult extends ReferenceIntegrationSafetyFlags {
  integrationVersion: typeof REFERENCE_INTEGRATIONS_VERSION;
  patternId: ReferenceIntegrationPatternId;
  patternTitle: string;
  frameworkShape: string;
  trustGatePlacement: string;
  requestedAction: string;
  sensitiveAction: string;
  result: ReferenceIntegrationVerdict;
  blocked: boolean;
  allowedLocally: boolean;
  escalated: boolean;
  reasonCodes: string[];
  evidenceTrail: string[];
  receipt: ReferenceReceiptSummary;
  receiptVerification: ReferenceReceiptVerificationSummary;
  settlementBlocker?: ReferenceSettlementBlockerSummary;
  signedProof?: ReferenceSignedProofSummary;
  moneyGateProof?: {
    proofStatus: string;
    proofPassed: boolean;
    controlsProven: number;
    simulatedSettlementEligibleCount: number;
    failureReasons: string[];
    localOnly: true;
    paymentTriggered: false;
    settlementExecuted: false;
    actionExecuted: false;
  };
  reviewerSummary?: {
    reviewQueue: "local_governance_review";
    reviewStatus: "queued_for_human_review" | "review_not_required";
    auditableReceipt: true;
  };
  handoffSummary?: {
    sourceAgent: string;
    targetAgent: string;
    externalAgentContacted: false;
    handoffAllowed: boolean;
  };
  wrapperSummary?: {
    apiShape: "trustGate.evaluate(request)";
    deterministic: true;
    returnType: "allow_block_escalate";
  };
  rule: typeof REFERENCE_INTEGRATIONS_RULE;
  publicContactEmail: typeof REFERENCE_INTEGRATIONS_PUBLIC_CONTACT;
  note: "Local reference integration example only; no framework adapter, network call, payment, settlement, external-agent contact, production signing, or action execution occurred.";
}

export interface ReferenceIntegrationPack extends ReferenceIntegrationSafetyFlags {
  integrationVersion: typeof REFERENCE_INTEGRATIONS_VERSION;
  packType: "local_reference_integration_examples";
  patternCount: number;
  allowedCount: number;
  blockedCount: number;
  escalatedCount: number;
  patternIds: ReferenceIntegrationPatternId[];
  rule: typeof REFERENCE_INTEGRATIONS_RULE;
  publicContactEmail: typeof REFERENCE_INTEGRATIONS_PUBLIC_CONTACT;
  note: "Local reference integration examples only; no official framework integration, live API, payment, settlement, external-agent contact, production signing, or action execution occurred.";
  patterns: ReferenceIntegrationResult[];
}

export type ReferenceIntegrationPackSummary = Omit<ReferenceIntegrationPack, "patterns"> & {
  patternResults: Array<{
    patternId: ReferenceIntegrationPatternId;
    result: ReferenceIntegrationVerdict;
    reasonCodes: string[];
  }>;
};

export const REFERENCE_INTEGRATION_EXAMPLE_FILES: Record<ReferenceIntegrationPatternId, string> = {
  generic_agent_loop: "examples/reference-generic-agent-loop.json",
  tool_calling_guardrail: "examples/reference-tool-calling-guardrail.json",
  human_in_the_loop_escalation: "examples/reference-human-in-the-loop-escalation.json",
  pre_settlement_money_gate: "examples/reference-pre-settlement-money-gate.json",
  governance_reviewer_flow: "examples/reference-governance-reviewer-flow.json",
  agent_to_agent_handoff_gate: "examples/reference-agent-to-agent-handoff-gate.json",
  trust_gate_wrapper: "examples/reference-trust-gate-wrapper.json",
};

export const REFERENCE_INTEGRATION_NOTE =
  "Local reference integration example only; no framework adapter, network call, payment, settlement, external-agent contact, production signing, or action execution occurred." as const;

export const REFERENCE_INTEGRATION_PACK_NOTE =
  "Local reference integration examples only; no official framework integration, live API, payment, settlement, external-agent contact, production signing, or action execution occurred." as const;

export const REFERENCE_SAFETY_FLAGS: ReferenceIntegrationSafetyFlags = {
  localDemoOnly: true,
  localOnly: true,
  productionSigning: false,
  paymentAuthorisation: false,
  settlementAuthorisation: false,
  privateDataIncluded: false,
  networkCallPerformed: false,
  cloudCallPerformed: false,
  externalFrameworkCalled: false,
  externalAgentContacted: false,
  paymentTriggered: false,
  settlementExecuted: false,
  actionExecuted: false,
  sensitiveActionExecuted: false,
  officialFrameworkIntegration: false,
};

export function createReferenceRequest(
  patternId: ReferenceIntegrationPatternId,
  options: {
    requestedAction: string;
    actionCategory: string;
    spendAmountGbp?: number;
    maxAllowedGbp?: number;
    approvalRequired?: boolean;
    approvalStatus?: "not_required" | "pending" | "approved" | "rejected" | "unknown";
    mandatePresent?: boolean;
    evidencePresent?: boolean;
    evidenceFresh?: boolean;
    verifiedIntentPresent?: boolean;
    proofPurpose?: "pre_action_trust_gate" | "pre_settlement_money_gate";
  },
): LocalGatePassDemoInput {
  const suffix = patternId.replaceAll("_", "-");
  const checkedAt = "2026-07-10T10:00:00.000Z";
  const expiresAt = "2026-07-10T10:05:00.000Z";
  const mandatePresent = options.mandatePresent ?? true;
  const evidencePresent = options.evidencePresent ?? true;
  const evidenceFresh = options.evidenceFresh ?? true;
  const verifiedIntentPresent = options.verifiedIntentPresent ?? true;
  const approvalRequired = options.approvalRequired ?? false;
  const approvalStatus = options.approvalStatus ?? (approvalRequired ? "approved" : "not_required");

  return {
    schema_version: "atg.local-agent-action-request.v2",
    request_id: `reference-${suffix}`,
    action_id: `action-${suffix}`,
    agent_id: `agent-${suffix}`,
    requested_action: options.requestedAction,
    action_category: options.actionCategory,
    local_only: true,
    issuer_ref: "reference_local_issuer",
    verifier_ref: "reference_local_verifier",
    nonce: `nonce-reference-${suffix}`,
    mandate: {
      present: mandatePresent,
      mandate_id: `mandate-${suffix}`,
      scope: `Local reference scope for ${patternId}.`,
      expires_at: expiresAt,
      issuer_ref: "reference_local_issuer",
    },
    verified_intent: {
      present: verifiedIntentPresent,
      status: verifiedIntentPresent ? "verified" : "missing",
      source: "local_reference_fixture",
      verifier_ref: "reference_local_verifier",
      verified_at: checkedAt,
    },
    evidence: {
      present: evidencePresent,
      fresh: evidenceFresh,
      evidence_id: `evidence-${suffix}`,
      evidence_type: "local_fixture",
      source: "local_reference_fixture",
      local_reference: `examples/reference-${suffix}.json`,
      evidence_hash: "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      verified_at: checkedAt,
      freshness: {
        checked_at: checkedAt,
        expires_at: expiresAt,
        max_age_seconds: 300,
      },
    },
    limits: {
      spend_amount_gbp: options.spendAmountGbp ?? 0,
      max_allowed_gbp: options.maxAllowedGbp ?? 0,
    },
    approval: {
      required: approvalRequired,
      status: approvalStatus,
    },
    risk_context: {
      risk_tier: riskTierForCategory(options.actionCategory),
      policy_decision: approvalStatus === "pending" ? "review_required" : "allow",
      policy_pack_version: "local-demo-v1",
    },
    proof_metadata: {
      schema_version: "atg.local-proof-metadata.v1",
      proof_purpose: options.proofPurpose ?? "pre_action_trust_gate",
      proof_status: "candidate",
      issuer_ref: "reference_local_issuer",
      verifier_ref: "reference_local_verifier",
      created_at: checkedAt,
      expires_at: expiresAt,
      nonce: `nonce-reference-${suffix}`,
      local_only: true,
      replay_freshness: {
        nonce: `nonce-reference-${suffix}`,
        single_use: true,
        freshness_window_seconds: 300,
        replay_protection: "local_in_memory_single_use",
      },
    },
    checked_at: checkedAt,
  };
}

export function createGateArtifacts(input: LocalGatePassDemoInput): {
  receipt: LocalGatePassAuditReceipt;
  gateSummary: LocalGatePassAuditSummary;
  verification: LocalTrustReceiptVerificationDecision;
} {
  const receipt = createLocalGatePassAuditReceipt(input);
  return {
    receipt,
    gateSummary: summariseLocalGatePassAudit(receipt),
    verification: verifyLocalTrustReceipt(receipt, {
      expected_request_id: input.request_id,
      expected_agent_id: input.agent_id,
      expected_requested_action: input.requested_action,
      current_time: receipt.checked_at,
      require_settlement_eligibility: true,
    }),
  };
}

export function createReferenceIntegrationResult(
  params: {
    patternId: ReferenceIntegrationPatternId;
    patternTitle: string;
    frameworkShape: string;
    trustGatePlacement: string;
    sensitiveAction: string;
    result: ReferenceIntegrationVerdict;
    input: LocalGatePassDemoInput;
    reasonCodes: readonly string[];
    evidenceTrail: readonly string[];
    settlementBlocker?: LocalSettlementBlockerDecision;
    signedProofVerification?: LocalSignedProofVerificationDecision;
    moneyGateProof?: LocalEndToEndMoneyGateProofResult;
    reviewerSummary?: ReferenceIntegrationResult["reviewerSummary"];
    handoffSummary?: ReferenceIntegrationResult["handoffSummary"];
    wrapperSummary?: ReferenceIntegrationResult["wrapperSummary"];
  },
): ReferenceIntegrationResult {
  const artifacts = createGateArtifacts(params.input);
  const output: ReferenceIntegrationResult = {
    integrationVersion: REFERENCE_INTEGRATIONS_VERSION,
    patternId: params.patternId,
    patternTitle: params.patternTitle,
    frameworkShape: params.frameworkShape,
    trustGatePlacement: params.trustGatePlacement,
    requestedAction: params.input.requested_action,
    sensitiveAction: params.sensitiveAction,
    result: params.result,
    blocked: params.result === "block",
    allowedLocally: params.result === "allow",
    escalated: params.result === "escalate",
    reasonCodes: unique(params.reasonCodes),
    evidenceTrail: [...params.evidenceTrail],
    receipt: summariseReceipt(artifacts.receipt, artifacts.gateSummary),
    receiptVerification: summariseVerification(artifacts.verification),
    rule: REFERENCE_INTEGRATIONS_RULE,
    publicContactEmail: REFERENCE_INTEGRATIONS_PUBLIC_CONTACT,
    note: REFERENCE_INTEGRATION_NOTE,
    ...REFERENCE_SAFETY_FLAGS,
  };
  if (params.settlementBlocker !== undefined) {
    output.settlementBlocker = summariseSettlementBlocker(params.settlementBlocker);
  }
  if (params.signedProofVerification !== undefined) {
    output.signedProof = summariseSignedProof(params.signedProofVerification);
  }
  if (params.moneyGateProof !== undefined) {
    output.moneyGateProof = summariseMoneyGateProof(params.moneyGateProof);
  }
  if (params.reviewerSummary !== undefined) output.reviewerSummary = params.reviewerSummary;
  if (params.handoffSummary !== undefined) output.handoffSummary = params.handoffSummary;
  if (params.wrapperSummary !== undefined) output.wrapperSummary = params.wrapperSummary;
  return output;
}

export function signAndVerifyLocalReceipt(receipt: LocalGatePassAuditReceipt): LocalSignedProofVerificationDecision {
  const signed = signLocalTrustReceipt(receipt, { signedAt: receipt.checked_at });
  return verifyLocalTrustReceiptSignature(signed, { checkedAt: receipt.checked_at });
}

export function createMoneyGateProof(input: LocalGatePassDemoInput): LocalEndToEndMoneyGateProofResult {
  return runLocalEndToEndMoneyGateProof({
    ...input,
    proof_id: `${input.request_id}-money-gate-proof`,
  });
}

export function createSettlementBlocker(input: LocalGatePassDemoInput): LocalSettlementBlockerDecision {
  return simulateLocalSettlementBlocker(createLocalGatePassAuditReceipt(input), {
    evaluated_at: input.checked_at ?? "1970-01-01T00:00:00.000Z",
  });
}

export function summarisePack(patterns: readonly ReferenceIntegrationResult[]): ReferenceIntegrationPackSummary {
  const pack = createReferenceIntegrationPack(patterns);
  const { patterns: _patterns, ...summary } = pack;
  return {
    ...summary,
    patternResults: patterns.map((pattern) => ({
      patternId: pattern.patternId,
      result: pattern.result,
      reasonCodes: [...pattern.reasonCodes],
    })),
  };
}

export function createReferenceIntegrationPack(
  patterns: readonly ReferenceIntegrationResult[],
): ReferenceIntegrationPack {
  return {
    integrationVersion: REFERENCE_INTEGRATIONS_VERSION,
    packType: "local_reference_integration_examples",
    patternCount: patterns.length,
    allowedCount: patterns.filter((pattern) => pattern.result === "allow").length,
    blockedCount: patterns.filter((pattern) => pattern.result === "block").length,
    escalatedCount: patterns.filter((pattern) => pattern.result === "escalate").length,
    patternIds: patterns.map((pattern) => pattern.patternId),
    rule: REFERENCE_INTEGRATIONS_RULE,
    publicContactEmail: REFERENCE_INTEGRATIONS_PUBLIC_CONTACT,
    note: REFERENCE_INTEGRATION_PACK_NOTE,
    patterns: [...patterns],
    ...REFERENCE_SAFETY_FLAGS,
  };
}

function summariseReceipt(
  receipt: LocalGatePassAuditReceipt,
  summary: LocalGatePassAuditSummary,
): ReferenceReceiptSummary {
  return {
    requestId: receipt.request_id,
    receiptId: receipt.receipt_id,
    verdict: summary.verdict,
    receiptType: summary.receipt_type,
    settlementAllowedByGate: summary.settlement_allowed,
    humanReviewRequired: summary.human_review_required,
    failedChecks: [...summary.failed_checks],
    reasonCodes: [...summary.reason_codes],
  };
}

function summariseVerification(
  decision: LocalTrustReceiptVerificationDecision,
): ReferenceReceiptVerificationSummary {
  return {
    verified: decision.verified,
    validForSimulatedSettlement: decision.valid_for_simulated_settlement,
    structurallyValid: decision.structurally_valid,
    fresh: decision.fresh,
    replaySafe: decision.replay_safe,
    settlementBlockerAllowed: decision.settlement_blocker_allowed,
    mode: decision.mode,
    reasonCodes: [...decision.reason_codes],
  };
}

function summariseSettlementBlocker(
  decision: LocalSettlementBlockerDecision,
): ReferenceSettlementBlockerSummary {
  return {
    settlementSimulation: decision.settlement_simulation,
    blocked: decision.blocked,
    blockReasonCodes: [...decision.block_reason_codes],
    settlementExecuted: decision.settlement_executed,
    paymentTriggered: decision.payment_triggered,
    networkCallPerformed: decision.network_call_performed,
    actionExecuted: decision.action_executed,
    mode: decision.mode,
  };
}

function summariseSignedProof(
  decision: LocalSignedProofVerificationDecision,
): ReferenceSignedProofSummary {
  return {
    verified: decision.verified,
    signedPayloadType: decision.signedPayloadType,
    payloadHashMatches: decision.payloadHashMatches,
    signatureValid: decision.signatureValid,
    reasonCodes: [...decision.reasonCodes],
    localDemoOnly: decision.localDemoOnly,
    productionSigning: decision.productionSigning,
    paymentAuthorisation: decision.paymentAuthorisation,
    settlementAuthorisation: decision.settlementAuthorisation,
  };
}

function summariseMoneyGateProof(
  proof: LocalEndToEndMoneyGateProofResult,
): NonNullable<ReferenceIntegrationResult["moneyGateProof"]> {
  const summary: LocalEndToEndMoneyGateProofSummary = summariseLocalEndToEndMoneyGateProof(proof);
  return {
    proofStatus: summary.proof_status,
    proofPassed: summary.proof_passed,
    controlsProven: summary.controls_proven,
    simulatedSettlementEligibleCount: summary.simulated_settlement_eligible_count,
    failureReasons: [...summary.failure_reasons],
    localOnly: summary.local_only,
    paymentTriggered: summary.payment_triggered,
    settlementExecuted: summary.settlement_executed,
    actionExecuted: summary.action_executed,
  };
}

function riskTierForCategory(
  category: string,
): "low" | "medium" | "high" | "blocked" {
  if (["money_review", "money_movement", "purchase_authorization"].includes(category)) return "high";
  if (["supplier_review", "workflow_recommendation"].includes(category)) return "medium";
  return "low";
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}
