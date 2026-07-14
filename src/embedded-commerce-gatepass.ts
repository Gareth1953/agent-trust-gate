import { createHash } from "node:crypto";

export const EMBEDDED_COMMERCE_GATEPASS_VERSION =
  "atg.embedded-commerce-gatepass.local.v1" as const;
export const EMBEDDED_COMMERCE_GATEPASS_REPORT_VERSION =
  "atg.embedded-commerce-gatepass.report.local.v1" as const;
export const EMBEDDED_COMMERCE_GATEPASS_REFERENCE_TIME =
  "2026-07-14T09:00:00.000Z" as const;
export const EMBEDDED_COMMERCE_GATEPASS_PUBLIC_CONTACT =
  "gpmiddleton71@gmail.com" as const;
export const EMBEDDED_COMMERCE_GATEPASS_COMMAND =
  "npm run demo:commerce-gatepass" as const;
export const EMBEDDED_COMMERCE_CORE_POSITION =
  "No mandate. No evidence. No verified intent. No signed GatePass. No settlement." as const;
export const EMBEDDED_COMMERCE_CHECKOUT_POSITION =
  "No verified basket. No valid mandate. No current approval. No GatePass. No checkout." as const;
export const EMBEDDED_COMMERCE_DESIGN_PARTNER_PRINCIPLE =
  "We prove the trust architecture. The design partner funds the real integration." as const;
export const EMBEDDED_COMMERCE_COMMERCIAL_APPLICATION =
  "featured_embedded_commerce_gatepass" as const;
export const EMBEDDED_COMMERCE_TARGET_AUDIENCES = [
  "supermarkets",
  "grocery retailers",
  "general retailers",
  "AI-shopping platforms",
  "commerce infrastructure teams",
  "payment and checkout providers",
  "retail-system architects",
  "AI governance and transaction-risk teams",
] as const;
export const EMBEDDED_COMMERCE_EVALUATION_SCOPE = [
  "mandate enforcement",
  "basket integrity",
  "substitution controls",
  "price and fee limits",
  "approval freshness",
  "merchant and destination checks",
  "replay protection",
  "GatePass and refusal-receipt outputs",
] as const;

export type CommerceMandateStatus = "active" | "expired" | "revoked" | "missing";
export type CommerceApprovalStatus = "approved" | "missing" | "expired" | "rejected" | "not_required";
export type CommerceGateVerdict = "allow" | "refuse";

export type CommerceGateScenarioId =
  | "valid_basket_within_mandate"
  | "unauthorised_substitution"
  | "wrong_product_variant"
  | "excess_quantity"
  | "item_price_exceeds_limit"
  | "final_total_exceeds_cap"
  | "unexpected_delivery_fee"
  | "delivery_address_changed"
  | "merchant_changed"
  | "currency_changed"
  | "approval_expired"
  | "human_approval_missing"
  | "basket_changed_after_approval"
  | "replayed_request"
  | "missing_evidence";

export type CommerceGateCheckId =
  | "buyer_mandate_exists"
  | "mandate_active_not_expired"
  | "merchant_authorised"
  | "product_categories_match"
  | "product_variants_match"
  | "quantities_within_limits"
  | "per_item_prices_within_limits"
  | "subtotal_within_cap"
  | "fees_within_limits"
  | "final_total_within_cap"
  | "substitutions_allowed"
  | "substitutions_policy_compliant"
  | "delivery_destination_matches"
  | "currency_matches"
  | "human_approval_present_when_required"
  | "approval_current"
  | "basket_unchanged_after_approval"
  | "merchant_basket_approval_identifiers_consistent"
  | "nonce_not_replayed"
  | "evidence_sufficient";

export interface CommerceMerchant {
  merchantId: string;
  merchantName: string;
  merchantCategory: string;
}

export interface CommerceSubstitutionPolicy {
  substitutionsAllowed: boolean;
  allowedSubstitutionCategories: string[];
  forbiddenBrands: string[];
  mustPreserveVariantRequirements: true;
  maxSubstitutionUnitPrice: number;
}

export interface CommerceMandate {
  mandateId: string;
  buyerReference: string;
  status: CommerceMandateStatus;
  issuedAt: string;
  expiresAt: string;
  authorisedMerchantIds: string[];
  authorisedMerchantCategories: string[];
  requestedItemCategories: string[];
  requiredVariantRestrictions: Record<string, string>;
  approvedCurrency: string;
  approvedDeliveryDestinationRef: string;
  quantityLimits: {
    maxPerLineItem: number;
    maxTotalItems: number;
  };
  priceLimits: {
    maxUnitPrice: number;
    maxSubtotal: number;
    maxDeliveryFee: number;
    maxServiceFee: number;
    maxOtherFees: number;
    maxFinalTotal: number;
  };
  substitutionPolicy: CommerceSubstitutionPolicy;
  humanApprovalRequired: boolean;
}

export interface CommerceBasketItem {
  lineItemId: string;
  productId: string;
  productName: string;
  category: string;
  brand: string;
  variant: Record<string, string>;
  quantity: number;
  unitPrice: number;
  currency: string;
  substitutedForLineItemId: string | null;
  evidenceRef: string;
}

export interface CommerceBasket {
  basketId: string;
  merchantId: string;
  merchantCategory: string;
  currency: string;
  deliveryDestinationRef: string;
  items: CommerceBasketItem[];
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  otherFees: number;
  finalTotal: number;
}

export interface CommerceApproval {
  approvalId: string;
  requestId: string;
  mandateId: string;
  basketId: string;
  required: boolean;
  present: boolean;
  status: CommerceApprovalStatus;
  approvedAt: string | null;
  expiresAt: string | null;
  approverReference: string | null;
  approvedBasketHash: string | null;
}

export interface CommerceEvidence {
  mandateEvidenceRef: string | null;
  basketSnapshotEvidenceRef: string | null;
  finalBasketEvidenceRef: string | null;
  approvalEvidenceRef: string | null;
  priceEvidenceRefs: string[];
  deliveryEvidenceRef: string | null;
  nonceEvidenceRef: string | null;
  sufficient: boolean;
}

export interface CommerceReplayProtection {
  requestId: string;
  nonce: string;
  seenNonces: string[];
  singleUseRequired: true;
}

export interface CommerceGateRequest {
  schemaVersion: typeof EMBEDDED_COMMERCE_GATEPASS_VERSION;
  scenarioId: CommerceGateScenarioId;
  requestId: string;
  nonce: string;
  referenceTime: string;
  merchant: CommerceMerchant;
  mandate: CommerceMandate;
  approvedBasketSnapshot: CommerceBasket;
  finalBasket: CommerceBasket;
  approval: CommerceApproval;
  evidence: CommerceEvidence;
  replayProtection: CommerceReplayProtection;
  localOnly: true;
  syntheticOnly: true;
}

export interface CommerceGateCheck {
  id: CommerceGateCheckId;
  passed: boolean;
  detail: string;
}

export interface CommerceGatePass {
  gatePassId: string;
  gatePassVersion: typeof EMBEDDED_COMMERCE_GATEPASS_VERSION;
  requestId: string;
  mandateId: string;
  merchantId: string;
  basketId: string;
  currency: string;
  approvedBasketHash: string;
  finalBasketHash: string;
  approvalId: string;
  issuedAt: string;
  expiresAt: string;
  status: "commerce_gatepass_issued_for_local_demo";
  checkoutAuthority: "none_local_pre_checkout_demonstration_only";
  signature: {
    status: "local_demo_placeholder";
    productionSigning: false;
  };
  localOnly: true;
  nonProduction: true;
}

export interface CommerceRefusalReceipt {
  receiptId: string;
  receiptVersion: typeof EMBEDDED_COMMERCE_GATEPASS_VERSION;
  requestId: string;
  mandateId: string;
  basketId: string;
  verdict: "refuse";
  blockedAt: string;
  failedChecks: CommerceGateCheckId[];
  refusalReasons: string[];
  summary: string;
  requiredNextSteps: string[];
  noCheckout: true;
  noPaymentAuthorisation: true;
  noSettlementExecution: true;
  localOnly: true;
  nonProduction: true;
}

export interface CommerceGateSafetyFlags {
  localOnly: true;
  syntheticOnly: true;
  nonProduction: true;
  networkCalls: false;
  liveRetailerIntegration: false;
  liveAiProviderIntegration: false;
  checkoutCreated: false;
  paymentAuthorisation: false;
  settlementExecution: false;
  actionExecution: false;
  accountLogin: false;
  cardHandling: false;
  paymentCredentialHandling: false;
  a2aServer: false;
  mcpServer: false;
  productionSigning: false;
  productionGradeCrypto: false;
  realPersonalData: false;
}

export interface CommerceGateEvaluation extends CommerceGateSafetyFlags {
  version: typeof EMBEDDED_COMMERCE_GATEPASS_VERSION;
  scenarioId: CommerceGateScenarioId;
  requestId: string;
  verdict: CommerceGateVerdict;
  allowed: boolean;
  commercePosition: typeof EMBEDDED_COMMERCE_CHECKOUT_POSITION;
  checks: CommerceGateCheck[];
  failedChecks: CommerceGateCheckId[];
  refusalReasons: string[];
  gatePass?: CommerceGatePass;
  refusalReceipt?: CommerceRefusalReceipt;
  note: "Local deterministic embedded-commerce GatePass demonstrator only; no retailer integration, AI-provider integration, checkout, account login, card handling, payment authorisation, settlement execution, network call, production signing, or action execution occurred.";
}

export interface EmbeddedCommerceGatepassReport extends CommerceGateSafetyFlags {
  project: "Agent Trust Gate";
  purpose: string;
  reportVersion: typeof EMBEDDED_COMMERCE_GATEPASS_REPORT_VERSION;
  command: typeof EMBEDDED_COMMERCE_GATEPASS_COMMAND;
  corePosition: typeof EMBEDDED_COMMERCE_CORE_POSITION;
  commercePosition: typeof EMBEDDED_COMMERCE_CHECKOUT_POSITION;
  commercialApplication: typeof EMBEDDED_COMMERCE_COMMERCIAL_APPLICATION;
  targetAudiences: typeof EMBEDDED_COMMERCE_TARGET_AUDIENCES;
  evaluationScope: typeof EMBEDDED_COMMERCE_EVALUATION_SCOPE;
  designPartnerPrinciple: typeof EMBEDDED_COMMERCE_DESIGN_PARTNER_PRINCIPLE;
  publicContact: typeof EMBEDDED_COMMERCE_GATEPASS_PUBLIC_CONTACT;
  paidEvaluationPilot: {
    available: true;
    startingPriceGbp: 1500;
    boundary: "Subject to scope and written agreement; real integration is separate design-partner work.";
  };
  referenceTime: typeof EMBEDDED_COMMERCE_GATEPASS_REFERENCE_TIME;
  scenarioCount: number;
  allowedCount: number;
  refusedCount: number;
  exampleFiles: typeof EMBEDDED_COMMERCE_EXAMPLE_FILES;
  recommendedFirstExperience: "npm run demo:reviewer-kit";
  optionalSpecialistCommand: typeof EMBEDDED_COMMERCE_GATEPASS_COMMAND;
  nonProductionStatus: string;
  sampleRequest: CommerceGateRequest;
  sampleGatePass: CommerceGatePass;
  sampleRefusalReceipt: CommerceRefusalReceipt;
  scenarios: Record<CommerceGateScenarioId, {
    request: CommerceGateRequest;
    result: CommerceGateEvaluation;
  }>;
}

export type EmbeddedCommerceGatepassSummary = Omit<
  EmbeddedCommerceGatepassReport,
  "sampleRequest" | "sampleGatePass" | "sampleRefusalReceipt" | "scenarios"
>;

export const EMBEDDED_COMMERCE_EXAMPLE_FILES: Record<
  | "valid_basket_within_mandate"
  | "unauthorised_substitution"
  | "final_total_exceeds_cap"
  | "delivery_address_changed"
  | "approval_expired"
  | "replayed_request"
  | "missing_evidence",
  string
> = {
  valid_basket_within_mandate: "examples/commerce-valid-basket.json",
  unauthorised_substitution: "examples/commerce-unauthorised-substitution.json",
  final_total_exceeds_cap: "examples/commerce-price-cap-breach.json",
  delivery_address_changed: "examples/commerce-address-change.json",
  approval_expired: "examples/commerce-expired-approval.json",
  replayed_request: "examples/commerce-replay-attempt.json",
  missing_evidence: "examples/commerce-missing-evidence.json",
};

export const EMBEDDED_COMMERCE_SAFETY_FLAGS: CommerceGateSafetyFlags = {
  localOnly: true,
  syntheticOnly: true,
  nonProduction: true,
  networkCalls: false,
  liveRetailerIntegration: false,
  liveAiProviderIntegration: false,
  checkoutCreated: false,
  paymentAuthorisation: false,
  settlementExecution: false,
  actionExecution: false,
  accountLogin: false,
  cardHandling: false,
  paymentCredentialHandling: false,
  a2aServer: false,
  mcpServer: false,
  productionSigning: false,
  productionGradeCrypto: false,
  realPersonalData: false,
};

const NOTE: CommerceGateEvaluation["note"] =
  "Local deterministic embedded-commerce GatePass demonstrator only; no retailer integration, AI-provider integration, checkout, account login, card handling, payment authorisation, settlement execution, network call, production signing, or action execution occurred.";

const SCENARIO_ORDER: CommerceGateScenarioId[] = [
  "valid_basket_within_mandate",
  "unauthorised_substitution",
  "wrong_product_variant",
  "excess_quantity",
  "item_price_exceeds_limit",
  "final_total_exceeds_cap",
  "unexpected_delivery_fee",
  "delivery_address_changed",
  "merchant_changed",
  "currency_changed",
  "approval_expired",
  "human_approval_missing",
  "basket_changed_after_approval",
  "replayed_request",
  "missing_evidence",
];

export function evaluateEmbeddedCommerceGate(
  request: CommerceGateRequest,
): CommerceGateEvaluation {
  const checks = buildChecks(request);
  const failedChecks = checks
    .filter((check) => !check.passed)
    .map((check) => check.id);
  const refusalReasons = failedChecks.map(reasonForFailedCheck);
  const allowed = failedChecks.length === 0;
  const base = {
    version: EMBEDDED_COMMERCE_GATEPASS_VERSION,
    scenarioId: request.scenarioId,
    requestId: request.requestId,
    verdict: allowed ? "allow" : "refuse",
    allowed,
    commercePosition: EMBEDDED_COMMERCE_CHECKOUT_POSITION,
    checks,
    failedChecks,
    refusalReasons,
    note: NOTE,
    ...EMBEDDED_COMMERCE_SAFETY_FLAGS,
  } satisfies Omit<CommerceGateEvaluation, "gatePass" | "refusalReceipt">;

  if (allowed) {
    return {
      ...base,
      gatePass: createCommerceGatePass(request),
    };
  }

  return {
    ...base,
    refusalReceipt: createCommerceRefusalReceipt(request, failedChecks, refusalReasons),
  };
}

export function createEmbeddedCommerceScenarioInputs(): Record<CommerceGateScenarioId, CommerceGateRequest> {
  const valid = createBaseRequest("valid_basket_within_mandate");
  return {
    valid_basket_within_mandate: valid,
    unauthorised_substitution: mutateScenario("unauthorised_substitution", valid, (request) => {
      request.finalBasket.items[0] = {
        ...request.finalBasket.items[0]!,
        lineItemId: "line_formula_substitution_unauthorised",
        productId: "fictional_formula_stage_2_alt_brand",
        productName: "Fictional Follow-On Formula Substitute 800g",
        category: "infant_formula",
        brand: "Unapproved Formula Co",
        variant: {
          formulaStage: "stage_2",
          packageSize: "800g",
          preparationType: "powder",
        },
        substitutedForLineItemId: "line_formula_requested",
        evidenceRef: "evidence_substitution_offer_unauthorised",
      };
      recalculateBasket(request.finalBasket);
    }),
    wrong_product_variant: mutateScenario("wrong_product_variant", valid, (request) => {
      request.finalBasket.items[0] = {
        ...request.finalBasket.items[0]!,
        variant: {
          formulaStage: "stage_2",
          packageSize: "800g",
          preparationType: "powder",
        },
        productName: "Fictional Follow-On Formula 800g",
      };
    }),
    excess_quantity: mutateScenario("excess_quantity", valid, (request) => {
      request.finalBasket.items[0] = { ...request.finalBasket.items[0]!, quantity: 3 };
      recalculateBasket(request.finalBasket);
    }),
    item_price_exceeds_limit: mutateScenario("item_price_exceeds_limit", valid, (request) => {
      request.finalBasket.items[0] = { ...request.finalBasket.items[0]!, unitPrice: 26.5 };
      recalculateBasket(request.finalBasket);
    }),
    final_total_exceeds_cap: mutateScenario("final_total_exceeds_cap", valid, (request) => {
      request.finalBasket.items[1] = { ...request.finalBasket.items[1]!, unitPrice: 25 };
      recalculateBasket(request.finalBasket);
    }),
    unexpected_delivery_fee: mutateScenario("unexpected_delivery_fee", valid, (request) => {
      request.finalBasket.deliveryFee = 6.5;
      recalculateBasket(request.finalBasket, false);
    }),
    delivery_address_changed: mutateScenario("delivery_address_changed", valid, (request) => {
      request.finalBasket.deliveryDestinationRef = "synthetic_delivery_destination_changed";
    }),
    merchant_changed: mutateScenario("merchant_changed", valid, (request) => {
      request.merchant = {
        merchantId: "fictional_discount_outlet",
        merchantName: "Fictional Discount Outlet",
        merchantCategory: "general_marketplace",
      };
      request.finalBasket.merchantId = "fictional_discount_outlet";
      request.finalBasket.merchantCategory = "general_marketplace";
    }),
    currency_changed: mutateScenario("currency_changed", valid, (request) => {
      request.finalBasket.currency = "USD";
      for (const item of request.finalBasket.items) item.currency = "USD";
    }),
    approval_expired: mutateScenario("approval_expired", valid, (request) => {
      request.approval.status = "expired";
      request.approval.expiresAt = "2026-07-14T08:59:00.000Z";
    }),
    human_approval_missing: mutateScenario("human_approval_missing", valid, (request) => {
      request.approval.present = false;
      request.approval.status = "missing";
      request.approval.approvedAt = null;
      request.approval.expiresAt = null;
      request.approval.approverReference = null;
      request.approval.approvedBasketHash = null;
    }),
    basket_changed_after_approval: mutateScenario("basket_changed_after_approval", valid, (request) => {
      request.finalBasket.items[1] = {
        ...request.finalBasket.items[1]!,
        quantity: 2,
      };
      recalculateBasket(request.finalBasket);
    }),
    replayed_request: mutateScenario("replayed_request", valid, (request) => {
      request.replayProtection.seenNonces = [request.nonce];
    }),
    missing_evidence: mutateScenario("missing_evidence", valid, (request) => {
      request.evidence = {
        mandateEvidenceRef: null,
        basketSnapshotEvidenceRef: null,
        finalBasketEvidenceRef: null,
        approvalEvidenceRef: null,
        priceEvidenceRefs: [],
        deliveryEvidenceRef: null,
        nonceEvidenceRef: null,
        sufficient: false,
      };
    }),
  };
}

export function runEmbeddedCommerceGatepassScenario(
  scenarioId: CommerceGateScenarioId,
): CommerceGateEvaluation {
  return evaluateEmbeddedCommerceGate(createEmbeddedCommerceScenarioInputs()[scenarioId]);
}

export function runEmbeddedCommerceGatepassDemo(): EmbeddedCommerceGatepassReport {
  const inputs = createEmbeddedCommerceScenarioInputs();
  const scenarios = Object.fromEntries(
    SCENARIO_ORDER.map((scenarioId) => {
      const request = inputs[scenarioId];
      return [scenarioId, {
        request,
        result: evaluateEmbeddedCommerceGate(request),
      }];
    }),
  ) as Record<CommerceGateScenarioId, { request: CommerceGateRequest; result: CommerceGateEvaluation }>;
  const results = Object.values(scenarios).map((scenario) => scenario.result);
  const validResult = scenarios.valid_basket_within_mandate.result;
  const refusalResult = scenarios.unauthorised_substitution.result;
  if (validResult.gatePass === undefined) throw new Error("Valid commerce scenario did not issue a GatePass.");
  if (refusalResult.refusalReceipt === undefined) throw new Error("Refusal commerce scenario did not issue a receipt.");
  return {
    project: "Agent Trust Gate",
    purpose:
      "Deterministic local Embedded Commerce GatePass demonstrator for pre-checkout basket verification.",
    reportVersion: EMBEDDED_COMMERCE_GATEPASS_REPORT_VERSION,
    command: EMBEDDED_COMMERCE_GATEPASS_COMMAND,
    corePosition: EMBEDDED_COMMERCE_CORE_POSITION,
    commercePosition: EMBEDDED_COMMERCE_CHECKOUT_POSITION,
    commercialApplication: EMBEDDED_COMMERCE_COMMERCIAL_APPLICATION,
    targetAudiences: EMBEDDED_COMMERCE_TARGET_AUDIENCES,
    evaluationScope: EMBEDDED_COMMERCE_EVALUATION_SCOPE,
    designPartnerPrinciple: EMBEDDED_COMMERCE_DESIGN_PARTNER_PRINCIPLE,
    publicContact: EMBEDDED_COMMERCE_GATEPASS_PUBLIC_CONTACT,
    paidEvaluationPilot: {
      available: true,
      startingPriceGbp: 1500,
      boundary: "Subject to scope and written agreement; real integration is separate design-partner work.",
    },
    referenceTime: EMBEDDED_COMMERCE_GATEPASS_REFERENCE_TIME,
    scenarioCount: results.length,
    allowedCount: results.filter((result) => result.allowed).length,
    refusedCount: results.filter((result) => !result.allowed).length,
    exampleFiles: EMBEDDED_COMMERCE_EXAMPLE_FILES,
    recommendedFirstExperience: "npm run demo:reviewer-kit",
    optionalSpecialistCommand: EMBEDDED_COMMERCE_GATEPASS_COMMAND,
    nonProductionStatus:
      "Local deterministic synthetic evaluation only; no retailer, shopping-agent, checkout, payment, settlement, A2A, MCP, API, or production integration exists.",
    sampleRequest: scenarios.valid_basket_within_mandate.request,
    sampleGatePass: validResult.gatePass,
    sampleRefusalReceipt: refusalResult.refusalReceipt,
    scenarios,
    ...EMBEDDED_COMMERCE_SAFETY_FLAGS,
  };
}

export function summariseEmbeddedCommerceGatepassDemo(
  report: EmbeddedCommerceGatepassReport = runEmbeddedCommerceGatepassDemo(),
): EmbeddedCommerceGatepassSummary {
  const {
    sampleRequest: _sampleRequest,
    sampleGatePass: _sampleGatePass,
    sampleRefusalReceipt: _sampleRefusalReceipt,
    scenarios: _scenarios,
    ...summary
  } = report;
  return summary;
}

export function getEmbeddedCommerceScenarioRequest(
  scenarioId: CommerceGateScenarioId,
): CommerceGateRequest {
  return createEmbeddedCommerceScenarioInputs()[scenarioId];
}

export function isEmbeddedCommerceScenarioId(value: string): value is CommerceGateScenarioId {
  return (SCENARIO_ORDER as readonly string[]).includes(value);
}

export function createCommerceBasketHash(basket: CommerceBasket): string {
  return `commerce_basket_${createStableHash(canonicalJson(basket))}`;
}

function createBaseRequest(scenarioId: CommerceGateScenarioId): CommerceGateRequest {
  const requestId = `commerce_request_${scenarioId}`;
  const merchant: CommerceMerchant = {
    merchantId: "fictional_family_market",
    merchantName: "Fictional Family Market",
    merchantCategory: "regulated_grocery",
  };
  const mandate: CommerceMandate = {
    mandateId: "commerce_mandate_synthetic_family_shop_001",
    buyerReference: "synthetic_buyer_reference",
    status: "active",
    issuedAt: "2026-07-14T08:00:00.000Z",
    expiresAt: "2026-07-14T10:00:00.000Z",
    authorisedMerchantIds: ["fictional_family_market"],
    authorisedMerchantCategories: ["regulated_grocery"],
    requestedItemCategories: ["infant_formula", "nappies"],
    requiredVariantRestrictions: {
      formulaStage: "stage_1",
      packageSize: "800g",
      preparationType: "powder",
    },
    approvedCurrency: "GBP",
    approvedDeliveryDestinationRef: "synthetic_delivery_destination_primary",
    quantityLimits: {
      maxPerLineItem: 2,
      maxTotalItems: 4,
    },
    priceLimits: {
      maxUnitPrice: 25,
      maxSubtotal: 45,
      maxDeliveryFee: 3,
      maxServiceFee: 2,
      maxOtherFees: 0,
      maxFinalTotal: 50,
    },
    substitutionPolicy: {
      substitutionsAllowed: true,
      allowedSubstitutionCategories: ["infant_formula", "nappies"],
      forbiddenBrands: ["Unapproved Formula Co"],
      mustPreserveVariantRequirements: true,
      maxSubstitutionUnitPrice: 25,
    },
    humanApprovalRequired: true,
  };
  const approvedBasketSnapshot = createValidBasket();
  const approvedBasketHash = createCommerceBasketHash(approvedBasketSnapshot);
  return {
    schemaVersion: EMBEDDED_COMMERCE_GATEPASS_VERSION,
    scenarioId,
    requestId,
    nonce: `nonce_${scenarioId}`,
    referenceTime: EMBEDDED_COMMERCE_GATEPASS_REFERENCE_TIME,
    merchant,
    mandate,
    approvedBasketSnapshot,
    finalBasket: structuredClone(approvedBasketSnapshot),
    approval: {
      approvalId: "commerce_approval_synthetic_001",
      requestId,
      mandateId: mandate.mandateId,
      basketId: approvedBasketSnapshot.basketId,
      required: true,
      present: true,
      status: "approved",
      approvedAt: "2026-07-14T08:30:00.000Z",
      expiresAt: "2026-07-14T09:30:00.000Z",
      approverReference: "synthetic_human_approval_ref",
      approvedBasketHash,
    },
    evidence: {
      mandateEvidenceRef: "evidence_mandate_synthetic_001",
      basketSnapshotEvidenceRef: "evidence_approved_basket_snapshot_001",
      finalBasketEvidenceRef: "evidence_final_basket_001",
      approvalEvidenceRef: "evidence_human_approval_001",
      priceEvidenceRefs: ["evidence_price_formula_001", "evidence_price_nappies_001"],
      deliveryEvidenceRef: "evidence_delivery_destination_ref_001",
      nonceEvidenceRef: `evidence_nonce_${scenarioId}`,
      sufficient: true,
    },
    replayProtection: {
      requestId,
      nonce: `nonce_${scenarioId}`,
      seenNonces: [],
      singleUseRequired: true,
    },
    localOnly: true,
    syntheticOnly: true,
  };
}

function createValidBasket(): CommerceBasket {
  const basket: CommerceBasket = {
    basketId: "commerce_basket_synthetic_001",
    merchantId: "fictional_family_market",
    merchantCategory: "regulated_grocery",
    currency: "GBP",
    deliveryDestinationRef: "synthetic_delivery_destination_primary",
    items: [
      {
        lineItemId: "line_formula_requested",
        productId: "fictional_formula_stage_1_800g",
        productName: "Fictional First Infant Formula 800g",
        category: "infant_formula",
        brand: "Fictional Formula Brand",
        variant: {
          formulaStage: "stage_1",
          packageSize: "800g",
          preparationType: "powder",
        },
        quantity: 1,
        unitPrice: 23,
        currency: "GBP",
        substitutedForLineItemId: null,
        evidenceRef: "evidence_line_formula_requested",
      },
      {
        lineItemId: "line_nappies_requested",
        productId: "fictional_nappies_size_2",
        productName: "Fictional Nappies Size 2 Pack",
        category: "nappies",
        brand: "Fictional Care",
        variant: {
          formulaStage: "stage_1",
          packageSize: "800g",
          preparationType: "powder",
        },
        quantity: 1,
        unitPrice: 12,
        currency: "GBP",
        substitutedForLineItemId: null,
        evidenceRef: "evidence_line_nappies_requested",
      },
    ],
    subtotal: 35,
    deliveryFee: 2,
    serviceFee: 1,
    otherFees: 0,
    finalTotal: 38,
  };
  return basket;
}

function mutateScenario(
  scenarioId: CommerceGateScenarioId,
  source: CommerceGateRequest,
  mutator: (request: CommerceGateRequest) => void,
): CommerceGateRequest {
  const request = structuredClone(source);
  request.scenarioId = scenarioId;
  request.requestId = `commerce_request_${scenarioId}`;
  request.nonce = `nonce_${scenarioId}`;
  request.approval.requestId = request.requestId;
  request.replayProtection.requestId = request.requestId;
  request.replayProtection.nonce = request.nonce;
  request.evidence.nonceEvidenceRef = `evidence_nonce_${scenarioId}`;
  mutator(request);
  return request;
}

function buildChecks(request: CommerceGateRequest): CommerceGateCheck[] {
  const referenceTime = Date.parse(request.referenceTime);
  const finalBasketHash = createCommerceBasketHash(request.finalBasket);
  const approvedSnapshotHash = createCommerceBasketHash(request.approvedBasketSnapshot);
  const approvalExpiry = request.approval.expiresAt === null ? Number.NaN : Date.parse(request.approval.expiresAt);
  return [
    check(
      "buyer_mandate_exists",
      request.mandate.status !== "missing" && !isBlank(request.mandate.mandateId),
      "buyer mandate id and status are present",
    ),
    check(
      "mandate_active_not_expired",
      request.mandate.status === "active" &&
        Date.parse(request.mandate.issuedAt) <= referenceTime &&
        Date.parse(request.mandate.expiresAt) > referenceTime,
      "mandate is active and fresh at the reference time",
    ),
    check(
      "merchant_authorised",
      request.mandate.authorisedMerchantIds.includes(request.finalBasket.merchantId) ||
        request.mandate.authorisedMerchantCategories.includes(request.finalBasket.merchantCategory),
      "final basket merchant id or merchant category is authorised by the mandate",
    ),
    check(
      "product_categories_match",
      request.finalBasket.items.every((item) => request.mandate.requestedItemCategories.includes(item.category)),
      "every final basket line item stays within requested item categories",
    ),
    check(
      "product_variants_match",
      request.finalBasket.items.every((item) => itemMatchesVariantRestrictions(item, request.mandate)),
      "strict product variant restrictions remain satisfied",
    ),
    check(
      "quantities_within_limits",
      request.finalBasket.items.every((item) => item.quantity <= request.mandate.quantityLimits.maxPerLineItem) &&
        itemCount(request.finalBasket) <= request.mandate.quantityLimits.maxTotalItems,
      "line quantities and total item count remain within authorised limits",
    ),
    check(
      "per_item_prices_within_limits",
      request.finalBasket.items.every((item) => item.unitPrice <= request.mandate.priceLimits.maxUnitPrice),
      "per-item prices remain within the mandate limit",
    ),
    check(
      "subtotal_within_cap",
      request.finalBasket.subtotal <= request.mandate.priceLimits.maxSubtotal &&
        request.finalBasket.subtotal === calculateSubtotal(request.finalBasket),
      "basket subtotal is within cap and matches item totals",
    ),
    check(
      "fees_within_limits",
      request.finalBasket.deliveryFee <= request.mandate.priceLimits.maxDeliveryFee &&
        request.finalBasket.serviceFee <= request.mandate.priceLimits.maxServiceFee &&
        request.finalBasket.otherFees <= request.mandate.priceLimits.maxOtherFees,
      "delivery, service, and other fees remain within authorised limits",
    ),
    check(
      "final_total_within_cap",
      request.finalBasket.finalTotal <= request.mandate.priceLimits.maxFinalTotal &&
        request.finalBasket.finalTotal === calculateFinalTotal(request.finalBasket),
      "final total is within cap and reconciles to subtotal plus fees",
    ),
    check(
      "substitutions_allowed",
      !hasSubstitution(request.finalBasket) || request.mandate.substitutionPolicy.substitutionsAllowed,
      "substitutions only occur when the mandate allows substitutions",
    ),
    check(
      "substitutions_policy_compliant",
      substitutionsComply(request.finalBasket, request.mandate),
      "substituted products satisfy category, brand, variant, and price policy",
    ),
    check(
      "delivery_destination_matches",
      request.finalBasket.deliveryDestinationRef === request.mandate.approvedDeliveryDestinationRef,
      "delivery destination reference matches the approved destination",
    ),
    check(
      "currency_matches",
      request.finalBasket.currency === request.mandate.approvedCurrency &&
        request.finalBasket.items.every((item) => item.currency === request.mandate.approvedCurrency),
      "basket and line item currencies match the approved currency",
    ),
    check(
      "human_approval_present_when_required",
      !request.mandate.humanApprovalRequired ||
        (request.approval.required && request.approval.present && request.approval.status === "approved"),
      "human approval is present when the mandate requires it",
    ),
    check(
      "approval_current",
      !request.approval.required ||
        (request.approval.status === "approved" &&
          request.approval.expiresAt !== null &&
          !Number.isNaN(approvalExpiry) &&
          approvalExpiry > referenceTime),
      "approval remains current at the reference time",
    ),
    check(
      "basket_unchanged_after_approval",
      request.approval.approvedBasketHash !== null &&
        request.approval.approvedBasketHash === approvedSnapshotHash &&
        request.approval.approvedBasketHash === finalBasketHash,
      "final basket hash matches the human-approved basket snapshot",
    ),
    check(
      "merchant_basket_approval_identifiers_consistent",
      request.merchant.merchantId === request.finalBasket.merchantId &&
        request.merchant.merchantCategory === request.finalBasket.merchantCategory &&
        request.approval.requestId === request.requestId &&
        request.approval.mandateId === request.mandate.mandateId &&
        request.approval.basketId === request.approvedBasketSnapshot.basketId &&
        request.replayProtection.requestId === request.requestId,
      "merchant, basket, approval, mandate, and request identifiers are consistent",
    ),
    check(
      "nonce_not_replayed",
      request.replayProtection.singleUseRequired &&
        request.replayProtection.nonce === request.nonce &&
        !request.replayProtection.seenNonces.includes(request.nonce),
      "single-use nonce has not already been observed",
    ),
    check(
      "evidence_sufficient",
      evidenceIsSufficient(request.evidence),
      "evidence references are sufficient for the local decision",
    ),
  ];
}

function createCommerceGatePass(request: CommerceGateRequest): CommerceGatePass {
  const finalBasketHash = createCommerceBasketHash(request.finalBasket);
  const approvedBasketHash = createCommerceBasketHash(request.approvedBasketSnapshot);
  return {
    gatePassId: `commerce_gatepass_${createStableHash(`${request.requestId}|${finalBasketHash}|allow`)}`,
    gatePassVersion: EMBEDDED_COMMERCE_GATEPASS_VERSION,
    requestId: request.requestId,
    mandateId: request.mandate.mandateId,
    merchantId: request.finalBasket.merchantId,
    basketId: request.finalBasket.basketId,
    currency: request.finalBasket.currency,
    approvedBasketHash,
    finalBasketHash,
    approvalId: request.approval.approvalId,
    issuedAt: request.referenceTime,
    expiresAt: request.approval.expiresAt ?? request.mandate.expiresAt,
    status: "commerce_gatepass_issued_for_local_demo",
    checkoutAuthority: "none_local_pre_checkout_demonstration_only",
    signature: {
      status: "local_demo_placeholder",
      productionSigning: false,
    },
    localOnly: true,
    nonProduction: true,
  };
}

function createCommerceRefusalReceipt(
  request: CommerceGateRequest,
  failedChecks: CommerceGateCheckId[],
  refusalReasons: string[],
): CommerceRefusalReceipt {
  return {
    receiptId: `commerce_refusal_${createStableHash(`${request.requestId}|${failedChecks.join(",")}`)}`,
    receiptVersion: EMBEDDED_COMMERCE_GATEPASS_VERSION,
    requestId: request.requestId,
    mandateId: request.mandate.mandateId,
    basketId: request.finalBasket.basketId,
    verdict: "refuse",
    blockedAt: request.referenceTime,
    failedChecks,
    refusalReasons,
    summary: "Checkout should be blocked because the final basket did not satisfy the local mandate gate.",
    requiredNextSteps: failedChecks.map(requiredNextStepForFailedCheck),
    noCheckout: true,
    noPaymentAuthorisation: true,
    noSettlementExecution: true,
    localOnly: true,
    nonProduction: true,
  };
}

function reasonForFailedCheck(checkId: CommerceGateCheckId): string {
  return `commerce_${checkId}_failed`;
}

function requiredNextStepForFailedCheck(checkId: CommerceGateCheckId): string {
  const steps: Record<CommerceGateCheckId, string> = {
    buyer_mandate_exists: "provide_active_buyer_mandate_before_checkout",
    mandate_active_not_expired: "refresh_or_replace_expired_mandate",
    merchant_authorised: "return_to_authorised_merchant_or_category",
    product_categories_match: "remove_items_outside_requested_categories",
    product_variants_match: "restore_required_product_variant_restrictions",
    quantities_within_limits: "reduce_quantities_to_authorised_limits",
    per_item_prices_within_limits: "restore_per_item_prices_within_limit_or_seek_new_approval",
    subtotal_within_cap: "reduce_subtotal_or_seek_new_approval",
    fees_within_limits: "remove_unexpected_fees_or_seek_new_approval",
    final_total_within_cap: "reduce_final_total_or_seek_new_approval",
    substitutions_allowed: "remove_substitution_or_obtain_mandate_allowing_substitution",
    substitutions_policy_compliant: "replace_non_compliant_substitution_with_policy_compliant_item",
    delivery_destination_matches: "restore_approved_delivery_destination",
    currency_matches: "restore_approved_currency",
    human_approval_present_when_required: "obtain_current_human_approval",
    approval_current: "refresh_expired_approval",
    basket_unchanged_after_approval: "obtain_new_approval_for_changed_basket",
    merchant_basket_approval_identifiers_consistent: "reconcile_request_merchant_basket_and_approval_identifiers",
    nonce_not_replayed: "issue_fresh_single_use_nonce",
    evidence_sufficient: "provide_sufficient_mandate_basket_approval_price_delivery_and_nonce_evidence",
  };
  return steps[checkId];
}

function check(id: CommerceGateCheckId, passed: boolean, detail: string): CommerceGateCheck {
  return { id, passed, detail };
}

function itemMatchesVariantRestrictions(item: CommerceBasketItem, mandate: CommerceMandate): boolean {
  if (item.category !== "infant_formula") return true;
  return Object.entries(mandate.requiredVariantRestrictions)
    .every(([key, value]) => item.variant[key] === value);
}

function substitutionsComply(basket: CommerceBasket, mandate: CommerceMandate): boolean {
  return basket.items
    .filter((item) => item.substitutedForLineItemId !== null)
    .every((item) =>
      mandate.substitutionPolicy.allowedSubstitutionCategories.includes(item.category) &&
      !mandate.substitutionPolicy.forbiddenBrands.includes(item.brand) &&
      item.unitPrice <= mandate.substitutionPolicy.maxSubstitutionUnitPrice &&
      (!mandate.substitutionPolicy.mustPreserveVariantRequirements ||
        itemMatchesVariantRestrictions(item, mandate))
    );
}

function hasSubstitution(basket: CommerceBasket): boolean {
  return basket.items.some((item) => item.substitutedForLineItemId !== null);
}

function evidenceIsSufficient(evidence: CommerceEvidence): boolean {
  return evidence.sufficient &&
    evidence.mandateEvidenceRef !== null &&
    evidence.basketSnapshotEvidenceRef !== null &&
    evidence.finalBasketEvidenceRef !== null &&
    evidence.approvalEvidenceRef !== null &&
    evidence.priceEvidenceRefs.length > 0 &&
    evidence.deliveryEvidenceRef !== null &&
    evidence.nonceEvidenceRef !== null;
}

function itemCount(basket: CommerceBasket): number {
  return basket.items.reduce((sum, item) => sum + item.quantity, 0);
}

function calculateSubtotal(basket: CommerceBasket): number {
  return roundMoney(basket.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0));
}

function calculateFinalTotal(basket: CommerceBasket): number {
  return roundMoney(basket.subtotal + basket.deliveryFee + basket.serviceFee + basket.otherFees);
}

function recalculateBasket(basket: CommerceBasket, includeSubtotal = true): void {
  if (includeSubtotal) basket.subtotal = calculateSubtotal(basket);
  basket.finalTotal = calculateFinalTotal(basket);
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value !== null && typeof value === "object") {
    return `{${Object.keys(value as Record<string, unknown>).sort().map((key) => {
      const item = (value as Record<string, unknown>)[key];
      return `${JSON.stringify(key)}:${canonicalJson(item)}`;
    }).join(",")}}`;
  }
  return JSON.stringify(value);
}

function createStableHash(seed: string): string {
  return createHash("sha256").update(seed, "utf8").digest("hex").slice(0, 24);
}

function isBlank(value: string | null): boolean {
  return value === null || value.trim() === "";
}
