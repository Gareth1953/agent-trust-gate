import type {
  BusinessPolicyOutcome,
  BusinessPolicyReference,
  BusinessRiskAssessment,
  EvidenceDecayResult,
} from "./business-policy-contract.js";
import type { ActionCapabilityPassportReference } from "./action-capability-passport.js";
import { createCanonicalPayloadHash } from "./local-signed-proof.js";

export const SHADOW_DECISION_RECEIPT_VERSION =
  "atg.shadow-decision-receipt.local.v1" as const;

export interface ShadowDecisionReceipt {
  receiptVersion: typeof SHADOW_DECISION_RECEIPT_VERSION;
  receiptType: "shadow_decision";
  receiptId: string;
  mode: "shadow";
  observational: true;
  nonAuthorising: true;
  wouldOutcome: BusinessPolicyOutcome;
  reasonCodes: string[];
  ruleIdentifiers: string[];
  passportReference: ActionCapabilityPassportReference;
  policyReference: BusinessPolicyReference;
  exactActionDigest: string | null;
  riskAssessment: BusinessRiskAssessment | null;
  evidenceDecay: EvidenceDecayResult | null;
  evaluatedAt: string;
  gatePassIssued: false;
  executionAuthority: false;
  actionExecuted: false;
  originalActionImmutable: true;
  resubmissionRequiresNewEvaluation: true;
  buyerPolicyApprovalProven: false;
  localOnly: true;
  syntheticOnly: true;
  productionReady: false;
  receiptDigest: string;
}

export function createShadowDecisionReceipt(
  input: Omit<ShadowDecisionReceipt, "receiptVersion" | "receiptType" | "receiptId" | "mode" |
    "observational" | "nonAuthorising" | "gatePassIssued" | "executionAuthority" |
    "actionExecuted" | "originalActionImmutable" | "resubmissionRequiresNewEvaluation" |
    "buyerPolicyApprovalProven" | "localOnly" | "syntheticOnly" | "productionReady" | "receiptDigest">,
): ShadowDecisionReceipt {
  const body = {
    receiptVersion: SHADOW_DECISION_RECEIPT_VERSION,
    receiptType: "shadow_decision" as const,
    receiptId: "",
    mode: "shadow" as const,
    observational: true as const,
    nonAuthorising: true as const,
    ...structuredClone(input),
    gatePassIssued: false as const,
    executionAuthority: false as const,
    actionExecuted: false as const,
    originalActionImmutable: true as const,
    resubmissionRequiresNewEvaluation: true as const,
    buyerPolicyApprovalProven: false as const,
    localOnly: true as const,
    syntheticOnly: true as const,
    productionReady: false as const,
  };
  const receiptId = `shadow:${createCanonicalPayloadHash(body).slice("sha256:".length, 33)}`;
  const withId = { ...body, receiptId };
  return { ...withId, receiptDigest: createCanonicalPayloadHash(withId) };
}

export function isStructurallyGatePass(value: unknown): boolean {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return record.gatePassVersion !== undefined
    || record.signature !== undefined
    || record.issuanceReference !== undefined;
}
