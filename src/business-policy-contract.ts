import type { TrustedClock } from "./exact-action-gatepass.js";
import type { ProposedProcurementAction } from "./exact-action-trust-gateway-prototype.js";
import { createCanonicalPayloadHash } from "./local-signed-proof.js";

export const BUSINESS_POLICY_CONTRACT_SCHEMA_VERSION =
  "atg.business-policy-contract.local.v1" as const;
export const BUSINESS_POLICY_REFERENCE_TIME = "2026-09-02T09:00:00.000Z" as const;
export const BUSINESS_POLICY_MINIMUM_TRUSTED_TIME = "2026-09-02T08:59:00.000Z" as const;

export type BusinessPolicyStatus = "active" | "inactive" | "revoked";
export type BusinessPolicyOutcome = "ACCEPT" | "REFER" | "REJECT";
export type BusinessRiskTier = "ROUTINE" | "ELEVATED" | "HIGH" | "PROHIBITED";
export type EvidenceObservationStatus = "valid" | "missing" | "invalid";
export type EvidenceFreshnessState =
  | "FRESH"
  | "STALE"
  | "MISSING"
  | "INVALID"
  | "FUTURE_DATED"
  | "MALFORMED";
export type BusinessPolicyRiskCondition =
  | "PROHIBITED_OR_OUT_OF_SCOPE"
  | "HUMAN_REVIEW_AMOUNT_BAND"
  | "CUSTOMER_IMPACT"
  | "DEFAULT_ROUTINE";

export interface BusinessPolicyReference {
  policyId: string;
  policyVersion: string;
  policyDigest: string;
}

export interface BusinessActionContext {
  destinationClass: string;
  supplierAccountReferenceClass: string;
  counterpartyClass: string;
  recipientClass: string;
  environment: string;
  customerImpactClass: "none" | "indirect" | "customer_facing";
  customerContactRequested: boolean;
  discountBasisPoints: number;
  refundAmountMinorUnits: number;
  cancellationAmountMinorUnits: number;
  additionalApprovalReference: string | null;
  requestedAuthorityExpansion: boolean;
  agentClaimsPolicyApproval: boolean;
}

export interface BusinessPolicyRiskRule {
  ruleId: string;
  condition: BusinessPolicyRiskCondition;
  tier: BusinessRiskTier;
  outcome: BusinessPolicyOutcome;
}

export interface EvidenceFreshnessRule {
  ruleId: string;
  evidenceType: string;
  maximumAgeSeconds: number;
  missingOutcome: Exclude<BusinessPolicyOutcome, "ACCEPT">;
  staleOutcome: Exclude<BusinessPolicyOutcome, "ACCEPT">;
  invalidOutcome: "REJECT";
  futureDatedOutcome: "REJECT";
}

export interface BusinessPolicyContract {
  policySchemaVersion: typeof BUSINESS_POLICY_CONTRACT_SCHEMA_VERSION;
  policyId: string;
  policyVersion: string;
  owningOrganisationId: string;
  policyOwnerReference: string;
  effectiveAt: string;
  expiresAt: string | null;
  permittedActionTypes: readonly string[];
  permittedTools: readonly string[];
  permittedOperations: readonly string[];
  permittedSupplierIds: readonly string[];
  permittedCounterpartyClasses: readonly string[];
  permittedRecipientClasses: readonly string[];
  permittedDestinationClasses: readonly string[];
  permittedSupplierAccountReferenceClasses: readonly string[];
  permittedEnvironments: readonly string[];
  currency: string;
  individualActionLimits: {
    automaticAcceptMaximumMinorUnits: number;
    absoluteMaximumMinorUnits: number;
    maximumQuantity: number;
  };
  humanReviewBands: readonly [{
    ruleId: string;
    minimumMinorUnits: number;
    maximumMinorUnits: number;
    outcome: "REFER";
  }];
  prohibitedActionClasses: readonly string[];
  customerContactRestrictions: {
    contactPermitted: false;
    permittedChannels: readonly [];
  };
  pricingLimits: {
    maximumDiscountBasisPoints: number;
    maximumRefundMinorUnits: number;
    maximumCancellationMinorUnits: number;
  };
  requiredEvidenceTypes: readonly string[];
  evidenceFreshnessRules: readonly EvidenceFreshnessRule[];
  requiredAuthorityTier: string;
  separationOfDuties: {
    required: true;
    requesterMayApprove: false;
    additionalApprovalAboveMinorUnits: number;
  };
  riskTierRules: readonly BusinessPolicyRiskRule[];
  policyStatus: BusinessPolicyStatus;
  revocationReference: string | null;
  minimumTrustedTime: string;
  localOnly: true;
  syntheticOnly: true;
  createsAuthority: false;
  policyDigest: string;
}

export interface EvidenceObservation {
  evidenceType: string;
  evidenceReference: string;
  status: EvidenceObservationStatus;
  issuedAt: string | null;
  observedAt: string | null;
  expiresAt: string | null;
}

export interface EvidenceObservationSet {
  evidenceSetId: string;
  observations: readonly EvidenceObservation[];
}

export interface EvidenceFreshnessEvaluation {
  evidenceType: string;
  evidenceReference: string | null;
  ruleId: string;
  state: EvidenceFreshnessState;
  outcome: BusinessPolicyOutcome;
  issuedAt: string | null;
  observedAt: string | null;
  expiresAt: string | null;
  maximumAgeSeconds: number;
  ageSeconds: number | null;
}

export interface BusinessRiskAssessment {
  tier: BusinessRiskTier;
  outcome: BusinessPolicyOutcome;
  ruleIdentifiers: string[];
  facts: {
    amountMinorUnits: number;
    quantity: number;
    customerImpactClass: BusinessActionContext["customerImpactClass"];
  };
  deterministic: true;
  modelUsed: false;
}

export interface EvidenceDecayResult {
  available: boolean;
  evaluatedAt: string | null;
  clockId: string | null;
  outcome: BusinessPolicyOutcome;
  reasonCodes: string[];
  ruleIdentifiers: string[];
  evaluations: EvidenceFreshnessEvaluation[];
}

export interface BusinessPolicyEvaluation {
  outcome: BusinessPolicyOutcome;
  reasonCodes: string[];
  ruleIdentifiers: string[];
  risk: BusinessRiskAssessment;
  evidenceDecay: EvidenceDecayResult;
}

export type PolicyResolutionReasonCode =
  | "POLICY_VERIFIED"
  | "POLICY_UNKNOWN"
  | "POLICY_VERSION_MISMATCH"
  | "POLICY_DIGEST_MISMATCH"
  | "POLICY_MALFORMED"
  | "POLICY_NOT_YET_EFFECTIVE"
  | "POLICY_EXPIRED"
  | "POLICY_INACTIVE"
  | "POLICY_REVOKED";

export interface BusinessPolicyResolution {
  verified: boolean;
  reasonCode: PolicyResolutionReasonCode;
  policy: BusinessPolicyContract | null;
}

const KNOWN_RISK_RULES: Readonly<Record<BusinessPolicyRiskCondition, {
  tier: BusinessRiskTier;
  outcome: BusinessPolicyOutcome;
}>> = {
  PROHIBITED_OR_OUT_OF_SCOPE: { tier: "PROHIBITED", outcome: "REJECT" },
  HUMAN_REVIEW_AMOUNT_BAND: { tier: "HIGH", outcome: "REFER" },
  CUSTOMER_IMPACT: { tier: "ELEVATED", outcome: "REFER" },
  DEFAULT_ROUTINE: { tier: "ROUTINE", outcome: "ACCEPT" },
};

export function computeBusinessPolicyDigest(
  policy: Omit<BusinessPolicyContract, "policyDigest">,
): string {
  return createCanonicalPayloadHash(policy);
}

export function createBusinessPolicyContract(
  input: Omit<BusinessPolicyContract, "policyDigest">,
): BusinessPolicyContract {
  return { ...structuredClone(input), policyDigest: computeBusinessPolicyDigest(input) };
}

export function verifyBusinessPolicyIntegrity(policy: BusinessPolicyContract): boolean {
  const { policyDigest, ...unsigned } = policy;
  return policyDigest === computeBusinessPolicyDigest(unsigned);
}

export class BusinessPolicyRegistry {
  readonly #policies = new Map<string, BusinessPolicyContract>();

  constructor(policies: readonly BusinessPolicyContract[]) {
    for (const policy of policies) this.#policies.set(policy.policyId, structuredClone(policy));
  }

  resolve(reference: BusinessPolicyReference, evaluatedAt: string): BusinessPolicyResolution {
    const policy = this.#policies.get(reference.policyId);
    if (policy === undefined) return { verified: false, reasonCode: "POLICY_UNKNOWN", policy: null };
    if (reference.policyVersion !== policy.policyVersion) {
      return { verified: false, reasonCode: "POLICY_VERSION_MISMATCH", policy: null };
    }
    if (reference.policyDigest !== policy.policyDigest) {
      return { verified: false, reasonCode: "POLICY_DIGEST_MISMATCH", policy: null };
    }
    let wellFormed = false;
    try {
      wellFormed = verifyBusinessPolicyIntegrity(policy) && isWellFormedPolicy(policy);
    } catch {
      wellFormed = false;
    }
    if (!wellFormed) {
      return { verified: false, reasonCode: "POLICY_MALFORMED", policy: null };
    }
    const now = Date.parse(evaluatedAt);
    const effective = Date.parse(policy.effectiveAt);
    const expiry = policy.expiresAt === null ? null : Date.parse(policy.expiresAt);
    if (!Number.isFinite(now)) return { verified: false, reasonCode: "POLICY_MALFORMED", policy: null };
    if (now < effective) return { verified: false, reasonCode: "POLICY_NOT_YET_EFFECTIVE", policy: null };
    if (expiry !== null && now >= expiry) return { verified: false, reasonCode: "POLICY_EXPIRED", policy: null };
    if (policy.policyStatus === "inactive") return { verified: false, reasonCode: "POLICY_INACTIVE", policy: null };
    if (policy.policyStatus === "revoked") return { verified: false, reasonCode: "POLICY_REVOKED", policy: null };
    return { verified: true, reasonCode: "POLICY_VERIFIED", policy: structuredClone(policy) };
  }
}

export class EvidenceObservationRegistry {
  readonly #sets = new Map<string, EvidenceObservationSet>();

  constructor(sets: readonly EvidenceObservationSet[]) {
    for (const set of sets) this.#sets.set(set.evidenceSetId, structuredClone(set));
  }

  resolve(evidenceSetId: string): EvidenceObservationSet | null {
    const set = this.#sets.get(evidenceSetId);
    return set === undefined ? null : structuredClone(set);
  }
}

export function evaluateEvidenceDecay(
  policy: BusinessPolicyContract,
  evidenceSet: EvidenceObservationSet,
  clock: TrustedClock | null,
): EvidenceDecayResult {
  let now: Date | undefined;
  try {
    now = clock?.now();
  } catch {
    now = undefined;
  }
  if (clock === null || now === undefined || !Number.isFinite(now.valueOf())) {
    return failedClock("CLOCK_UNAVAILABLE", clock?.clockId ?? null);
  }
  if (now.valueOf() < Date.parse(policy.minimumTrustedTime)) {
    return failedClock("CLOCK_ROLLBACK_DETECTED", clock.clockId);
  }

  const evaluations = policy.evidenceFreshnessRules.map((rule) => {
    const observation = evidenceSet.observations.find((candidate) => candidate.evidenceType === rule.evidenceType);
    return evaluateObservation(rule, observation, now as Date);
  });
  const outcome = combineOutcomes(evaluations.map((evaluation) => evaluation.outcome));
  const reasonCodes = evaluations
    .filter((evaluation) => evaluation.state !== "FRESH")
    .map((evaluation) => `EVIDENCE_${evaluation.evidenceType.toUpperCase()}_${evaluation.state}`);
  return {
    available: true,
    evaluatedAt: now.toISOString(),
    clockId: clock.clockId,
    outcome,
    reasonCodes: reasonCodes.length === 0 ? ["EVIDENCE_FRESHNESS_VERIFIED"] : reasonCodes,
    ruleIdentifiers: evaluations.map((evaluation) => evaluation.ruleId),
    evaluations,
  };
}

export function classifyBusinessRisk(input: {
  policy: BusinessPolicyContract;
  action: ProposedProcurementAction;
  amountMinorUnits: number;
  context: BusinessActionContext;
}): BusinessRiskAssessment {
  const { policy, action, amountMinorUnits, context } = input;
  const prohibited = !policy.permittedActionTypes.includes(action.actionType)
    || !policy.permittedSupplierIds.includes(action.supplierId)
    || !policy.permittedCounterpartyClasses.includes(context.counterpartyClass)
    || !policy.permittedRecipientClasses.includes(context.recipientClass)
    || !policy.permittedDestinationClasses.includes(context.destinationClass)
    || !policy.permittedSupplierAccountReferenceClasses.includes(context.supplierAccountReferenceClass)
    || !policy.permittedEnvironments.includes(context.environment)
    || action.currency !== policy.currency
    || action.quantity > policy.individualActionLimits.maximumQuantity
    || amountMinorUnits > policy.individualActionLimits.absoluteMaximumMinorUnits
    || context.customerContactRequested
    || context.discountBasisPoints > policy.pricingLimits.maximumDiscountBasisPoints
    || context.refundAmountMinorUnits > policy.pricingLimits.maximumRefundMinorUnits
    || context.cancellationAmountMinorUnits > policy.pricingLimits.maximumCancellationMinorUnits
    || context.requestedAuthorityExpansion
    || context.agentClaimsPolicyApproval
    || policy.prohibitedActionClasses.includes(action.actionType);
  if (prohibited) return riskFor(policy, "PROHIBITED_OR_OUT_OF_SCOPE", input);

  const reviewBand = policy.humanReviewBands[0];
  if (amountMinorUnits >= reviewBand.minimumMinorUnits
    && amountMinorUnits <= reviewBand.maximumMinorUnits) {
    return riskFor(policy, "HUMAN_REVIEW_AMOUNT_BAND", input);
  }
  if (context.customerImpactClass !== "none") return riskFor(policy, "CUSTOMER_IMPACT", input);
  return riskFor(policy, "DEFAULT_ROUTINE", input);
}

export function evaluateBusinessPolicy(input: {
  policy: BusinessPolicyContract;
  action: ProposedProcurementAction;
  amountMinorUnits: number;
  context: BusinessActionContext;
  evidenceSet: EvidenceObservationSet;
  clock: TrustedClock | null;
}): BusinessPolicyEvaluation {
  const risk = classifyBusinessRisk(input);
  const evidenceDecay = evaluateEvidenceDecay(input.policy, input.evidenceSet, input.clock);
  const reasonCodes = [...evidenceDecay.reasonCodes];
  const ruleIdentifiers = [...risk.ruleIdentifiers, ...evidenceDecay.ruleIdentifiers];
  let outcome = combineOutcomes([risk.outcome, evidenceDecay.outcome]);

  if (risk.tier === "HIGH"
    && input.context.additionalApprovalReference === null
    && input.amountMinorUnits > input.policy.separationOfDuties.additionalApprovalAboveMinorUnits) {
    outcome = combineOutcomes([outcome, "REFER"]);
    reasonCodes.push("ADDITIONAL_APPROVAL_REQUIRED");
    ruleIdentifiers.push("SOD-ADDITIONAL-APPROVAL-001");
  }
  if (risk.tier === "PROHIBITED") reasonCodes.push("PROHIBITED_ACTION_TIER");
  else if (risk.tier === "HIGH") reasonCodes.push("HUMAN_REVIEW_AMOUNT_BAND");
  else if (risk.tier === "ELEVATED") reasonCodes.push("CUSTOMER_IMPACT_REVIEW_REQUIRED");
  else reasonCodes.push("ROUTINE_POLICY_RULES_PASSED");

  return {
    outcome,
    reasonCodes: [...new Set(reasonCodes)],
    ruleIdentifiers: [...new Set(ruleIdentifiers)],
    risk,
    evidenceDecay,
  };
}

export const DEFAULT_BUSINESS_POLICY = createBusinessPolicyContract({
  policySchemaVersion: BUSINESS_POLICY_CONTRACT_SCHEMA_VERSION,
  policyId: "policy.synthetic-buyer.procurement.v1",
  policyVersion: "1.0.0",
  owningOrganisationId: "ORG-NORTHSTAR-RETAIL-SYNTHETIC",
  policyOwnerReference: "fixture://northstar/policy-owner/procurement-director",
  effectiveAt: "2026-09-01T00:00:00.000Z",
  expiresAt: "2027-09-01T00:00:00.000Z",
  permittedActionTypes: ["purchase"],
  permittedTools: ["atg.evaluate_action"],
  permittedOperations: ["evaluate_exact_action"],
  permittedSupplierIds: ["SUP-HARBOUR-001"],
  permittedCounterpartyClasses: ["supplier_a"],
  permittedRecipientClasses: ["approved_supplier"],
  permittedDestinationClasses: ["approved_warehouse"],
  permittedSupplierAccountReferenceClasses: ["approved_supplier_account"],
  permittedEnvironments: ["local_synthetic_procurement_simulation"],
  currency: "GBP",
  individualActionLimits: {
    automaticAcceptMaximumMinorUnits: 500_000,
    absoluteMaximumMinorUnits: 1_000_000,
    maximumQuantity: 100,
  },
  humanReviewBands: [{
    ruleId: "AMOUNT-REVIEW-001",
    minimumMinorUnits: 500_001,
    maximumMinorUnits: 1_000_000,
    outcome: "REFER",
  }],
  prohibitedActionClasses: [
    "customer_communication", "payment", "settlement", "supplier_account_change",
    "authority_expansion", "policy_administration",
  ],
  customerContactRestrictions: { contactPermitted: false, permittedChannels: [] },
  pricingLimits: {
    maximumDiscountBasisPoints: 0,
    maximumRefundMinorUnits: 0,
    maximumCancellationMinorUnits: 0,
  },
  requiredEvidenceTypes: [
    "human_authority", "human_approval", "agent_standing", "mandate", "procurement_evidence",
  ],
  evidenceFreshnessRules: [
    freshnessRule("FRESH-HUMAN-AUTHORITY-001", "human_authority", 3_600, "REJECT", "REJECT"),
    freshnessRule("FRESH-HUMAN-APPROVAL-001", "human_approval", 3_600, "REFER", "REFER"),
    freshnessRule("FRESH-AGENT-STANDING-001", "agent_standing", 600, "REJECT", "REJECT"),
    freshnessRule("FRESH-MANDATE-001", "mandate", 3_600, "REJECT", "REJECT"),
    freshnessRule("FRESH-PROCUREMENT-EVIDENCE-001", "procurement_evidence", 300, "REFER", "REFER"),
  ],
  requiredAuthorityTier: "TIER_2_PURCHASE",
  separationOfDuties: {
    required: true,
    requesterMayApprove: false,
    additionalApprovalAboveMinorUnits: 500_000,
  },
  riskTierRules: [
    riskRule("RISK-PROHIBITED-001", "PROHIBITED_OR_OUT_OF_SCOPE"),
    riskRule("RISK-HIGH-001", "HUMAN_REVIEW_AMOUNT_BAND"),
    riskRule("RISK-ELEVATED-001", "CUSTOMER_IMPACT"),
    riskRule("RISK-ROUTINE-001", "DEFAULT_ROUTINE"),
  ],
  policyStatus: "active",
  revocationReference: null,
  minimumTrustedTime: BUSINESS_POLICY_MINIMUM_TRUSTED_TIME,
  localOnly: true,
  syntheticOnly: true,
  createsAuthority: false,
});

export const DEFAULT_EVIDENCE_OBSERVATION_SETS: readonly EvidenceObservationSet[] = [
  evidenceSet("evidence-set.fresh.v1"),
  evidenceSet("evidence-set.stale-refreshable.v1", { procurement_evidence: { issuedAt: "2026-09-02T08:40:00.000Z" } }),
  evidenceSet("evidence-set.missing-refreshable.v1", { procurement_evidence: { status: "missing", issuedAt: null, observedAt: null, expiresAt: null } }),
  evidenceSet("evidence-set.future-dated.v1", { procurement_evidence: { issuedAt: "2026-09-02T09:05:00.000Z", observedAt: "2026-09-02T09:05:00.000Z" } }),
  evidenceSet("evidence-set.invalid-authority.v1", { human_authority: { status: "invalid" } }),
  evidenceSet("evidence-set.invalid-standing.v1", { agent_standing: { status: "invalid" } }),
];

function freshnessRule(
  ruleId: string,
  evidenceType: string,
  maximumAgeSeconds: number,
  missingOutcome: "REFER" | "REJECT",
  staleOutcome: "REFER" | "REJECT",
): EvidenceFreshnessRule {
  return { ruleId, evidenceType, maximumAgeSeconds, missingOutcome, staleOutcome, invalidOutcome: "REJECT", futureDatedOutcome: "REJECT" };
}

function riskRule(ruleId: string, condition: BusinessPolicyRiskCondition): BusinessPolicyRiskRule {
  return { ruleId, condition, ...KNOWN_RISK_RULES[condition] };
}

function evidenceSet(
  evidenceSetId: string,
  patches: Partial<Record<string, Partial<EvidenceObservation>>> = {},
): EvidenceObservationSet {
  const base: EvidenceObservation[] = [
    observation("human_authority", "fixture://northstar/human-authority/EMP-NORTHSTAR-0042", "2026-09-02T08:55:00.000Z", "2026-09-02T17:00:00.000Z"),
    observation("human_approval", "fixture://northstar/human-approval/EMP-NORTHSTAR-0042", "2026-09-02T08:55:00.000Z", "2026-09-02T17:00:00.000Z"),
    observation("agent_standing", "fixture://northstar/agent-standing/procurement-agent-04", "2026-09-02T08:58:00.000Z", "2026-09-02T09:30:00.000Z"),
    observation("mandate", "fixture://northstar/mandate/procurement-purchase-v1", "2026-09-02T08:55:00.000Z", "2026-09-02T17:00:00.000Z"),
    observation("procurement_evidence", "fixture://northstar/procurement-evidence/001", "2026-09-02T08:58:00.000Z", "2026-09-02T09:13:00.000Z"),
  ];
  return {
    evidenceSetId,
    observations: base.map((item) => ({ ...item, ...(patches[item.evidenceType] ?? {}) })),
  };
}

function observation(
  evidenceType: string,
  evidenceReference: string,
  issuedAt: string,
  expiresAt: string,
): EvidenceObservation {
  return { evidenceType, evidenceReference, status: "valid", issuedAt, observedAt: BUSINESS_POLICY_REFERENCE_TIME, expiresAt };
}

function isWellFormedPolicy(policy: BusinessPolicyContract): boolean {
  const effective = Date.parse(policy.effectiveAt);
  const expiry = policy.expiresAt === null ? null : Date.parse(policy.expiresAt);
  const minimumTime = Date.parse(policy.minimumTrustedTime);
  const limits = policy.individualActionLimits;
  const band = policy.humanReviewBands[0];
  if (limits === undefined || band === undefined
    || policy.riskTierRules === undefined
    || policy.evidenceFreshnessRules === undefined
    || policy.requiredEvidenceTypes === undefined
    || policy.permittedTools === undefined
    || policy.permittedOperations === undefined) return false;
  const riskRulesValid = policy.riskTierRules.length === 4
    && new Set(policy.riskTierRules.map((rule) => rule.condition)).size === 4
    && new Set(policy.riskTierRules.map((rule) => rule.ruleId)).size === 4
    && policy.riskTierRules.every((rule) => {
      const expected = KNOWN_RISK_RULES[rule.condition];
      return rule.ruleId.trim().length > 0
        && expected !== undefined
        && rule.tier === expected.tier
        && rule.outcome === expected.outcome;
    });
  const freshnessRulesValid = policy.evidenceFreshnessRules.length === policy.requiredEvidenceTypes.length
    && new Set(policy.requiredEvidenceTypes).size === policy.requiredEvidenceTypes.length
    && new Set(policy.evidenceFreshnessRules.map((rule) => rule.evidenceType)).size === policy.evidenceFreshnessRules.length
    && new Set(policy.evidenceFreshnessRules.map((rule) => rule.ruleId)).size === policy.evidenceFreshnessRules.length
    && policy.evidenceFreshnessRules.every((rule) => policy.requiredEvidenceTypes.includes(rule.evidenceType)
      && rule.ruleId.trim().length > 0
      && Number.isSafeInteger(rule.maximumAgeSeconds) && rule.maximumAgeSeconds >= 0);
  return policy.policySchemaVersion === BUSINESS_POLICY_CONTRACT_SCHEMA_VERSION
    && policy.policyId.trim().length > 0
    && policy.policyVersion.trim().length > 0
    && policy.owningOrganisationId.trim().length > 0
    && policy.policyOwnerReference.trim().length > 0
    && Number.isFinite(effective)
    && (expiry === null || (Number.isFinite(expiry) && expiry > effective))
    && Number.isFinite(minimumTime)
    && /^[A-Z]{3}$/.test(policy.currency)
    && Number.isSafeInteger(limits.automaticAcceptMaximumMinorUnits)
    && Number.isSafeInteger(limits.absoluteMaximumMinorUnits)
    && limits.automaticAcceptMaximumMinorUnits >= 0
    && limits.absoluteMaximumMinorUnits >= limits.automaticAcceptMaximumMinorUnits
    && Number.isSafeInteger(limits.maximumQuantity)
    && limits.maximumQuantity > 0
    && Number.isSafeInteger(band.minimumMinorUnits)
    && Number.isSafeInteger(band.maximumMinorUnits)
    && band.minimumMinorUnits === limits.automaticAcceptMaximumMinorUnits + 1
    && band.maximumMinorUnits === limits.absoluteMaximumMinorUnits
    && band.outcome === "REFER"
    && band.ruleId.trim().length > 0
    && policy.permittedTools.length > 0
    && policy.permittedOperations.length > 0
    && policy.customerContactRestrictions.contactPermitted === false
    && policy.separationOfDuties.required === true
    && policy.separationOfDuties.requesterMayApprove === false
    && policy.localOnly === true
    && policy.syntheticOnly === true
    && policy.createsAuthority === false
    && (policy.policyStatus === "revoked"
      ? typeof policy.revocationReference === "string" && policy.revocationReference.trim().length > 0
      : policy.revocationReference === null)
    && riskRulesValid
    && freshnessRulesValid;
}

function evaluateObservation(
  rule: EvidenceFreshnessRule,
  observation: EvidenceObservation | undefined,
  now: Date,
): EvidenceFreshnessEvaluation {
  const base = {
    evidenceType: rule.evidenceType,
    evidenceReference: observation?.evidenceReference ?? null,
    ruleId: rule.ruleId,
    issuedAt: observation?.issuedAt ?? null,
    observedAt: observation?.observedAt ?? null,
    expiresAt: observation?.expiresAt ?? null,
    maximumAgeSeconds: rule.maximumAgeSeconds,
  };
  if (observation === undefined || observation.status === "missing") {
    return { ...base, state: "MISSING", outcome: rule.missingOutcome, ageSeconds: null };
  }
  if (observation.status === "invalid") {
    return { ...base, state: "INVALID", outcome: rule.invalidOutcome, ageSeconds: null };
  }
  const issued = observation.issuedAt === null ? Number.NaN : Date.parse(observation.issuedAt);
  const observed = observation.observedAt === null ? Number.NaN : Date.parse(observation.observedAt);
  const expiry = observation.expiresAt === null ? null : Date.parse(observation.expiresAt);
  if (!Number.isFinite(issued) || !Number.isFinite(observed) || (expiry !== null && !Number.isFinite(expiry)) || observed < issued) {
    return { ...base, state: "MALFORMED", outcome: "REJECT", ageSeconds: null };
  }
  if (issued > now.valueOf() || observed > now.valueOf()) {
    return { ...base, state: "FUTURE_DATED", outcome: rule.futureDatedOutcome, ageSeconds: null };
  }
  const ageSeconds = Math.floor((now.valueOf() - issued) / 1000);
  if ((expiry !== null && now.valueOf() >= expiry) || ageSeconds > rule.maximumAgeSeconds) {
    return { ...base, state: "STALE", outcome: rule.staleOutcome, ageSeconds };
  }
  return { ...base, state: "FRESH", outcome: "ACCEPT", ageSeconds };
}

function riskFor(
  policy: BusinessPolicyContract,
  condition: BusinessPolicyRiskCondition,
  input: { action: ProposedProcurementAction; amountMinorUnits: number; context: BusinessActionContext },
): BusinessRiskAssessment {
  const rule = policy.riskTierRules.find((candidate) => candidate.condition === condition);
  if (rule === undefined) {
    return {
      tier: "PROHIBITED",
      outcome: "REJECT",
      ruleIdentifiers: ["POLICY_UNKNOWN_RISK_RULE"],
      facts: { amountMinorUnits: input.amountMinorUnits, quantity: input.action.quantity, customerImpactClass: input.context.customerImpactClass },
      deterministic: true,
      modelUsed: false,
    };
  }
  return {
    tier: rule.tier,
    outcome: rule.outcome,
    ruleIdentifiers: [rule.ruleId],
    facts: { amountMinorUnits: input.amountMinorUnits, quantity: input.action.quantity, customerImpactClass: input.context.customerImpactClass },
    deterministic: true,
    modelUsed: false,
  };
}

function combineOutcomes(outcomes: readonly BusinessPolicyOutcome[]): BusinessPolicyOutcome {
  if (outcomes.includes("REJECT")) return "REJECT";
  if (outcomes.includes("REFER")) return "REFER";
  return "ACCEPT";
}

function failedClock(reasonCode: "CLOCK_UNAVAILABLE" | "CLOCK_ROLLBACK_DETECTED", clockId: string | null): EvidenceDecayResult {
  return {
    available: false,
    evaluatedAt: null,
    clockId,
    outcome: "REJECT",
    reasonCodes: [reasonCode],
    ruleIdentifiers: ["EVIDENCE-CLOCK-FAIL-CLOSED-001"],
    evaluations: [],
  };
}
