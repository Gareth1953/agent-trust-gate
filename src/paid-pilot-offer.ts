export const PAID_PILOT_OFFER_VERSION = "atg.paid-pilot-offer.local.v1" as const;
export const PAID_PILOT_OFFER_ID = "atg-paid-evaluation-pilot" as const;
export const PAID_PILOT_OFFER_CONTACT = "gpmiddleton71@gmail.com" as const;
export const PAID_PILOT_OFFER_FIRST_COMMAND = "npm run demo:reviewer-kit" as const;

export const PAID_PILOT_OFFER_CORE_PHRASES = [
  "GatePass is a scoped, time-bound, action-specific proof primitive for agent actions.",
  "GatePass provides a common, machine-readable format for expressing authority, mandate, scope, freshness, and evidence.",
  "No mandate. No evidence. No verified intent. No signed GatePass. No settlement.",
  "Do not trust the agent. Trust the GatePass.",
  "No proof. No permission.",
  "No mandate. No action.",
] as const;

export interface PaidPilotOfferSafetyFlags {
  localDemoOnly: true;
  manualInputOnly: true;
  humanApproved: true;
  nonProduction: true;
  nonCustodial: true;
  nonAutonomous: true;
  advisoryOnly: true;
  realToolExecution: false;
  actionExecution: false;
  networkCalls: false;
  liveApi: false;
  mcpServerFunctionality: false;
  paymentIntegration: false;
  paymentLinks: false;
  checkout: false;
  livePaymentProcessing: false;
  paypalApiIntegration: false;
  stripeIntegration: false;
  webhookIntegration: false;
  walletBankingLogic: false;
  settlementExecution: false;
  productionSigning: false;
  productionCertification: false;
  securityCertification: false;
  legalComplianceGuarantee: false;
  guaranteedResults: false;
  automaticAcceptance: false;
  automaticAccessAfterPayment: false;
}

export interface PaidPilotOffer extends PaidPilotOfferSafetyFlags {
  project: "Agent Trust Gate";
  offerIdentifier: typeof PAID_PILOT_OFFER_ID;
  name: "Agent Trust Gate Paid Evaluation Pilot";
  version: typeof PAID_PILOT_OFFER_VERSION;
  status: "human_reviewed_enquiry_only";
  buyerJourney: string[];
  recommendedFirstCommand: typeof PAID_PILOT_OFFER_FIRST_COMMAND;
  secondaryCommands: string[];
  corePositioning: typeof PAID_PILOT_OFFER_CORE_PHRASES;
  startingCurrency: "GBP";
  indicativeStartingPrice: 1500;
  priceQualifier: string;
  engagementType: "paid_controlled_non_production_evaluation_pilot";
  evaluatedControls: string[];
  includedDeliverables: string[];
  buyerInputsRequired: string[];
  exclusions: string[];
  approvalRequirements: string[];
  enquiryTemplateFields: string[];
  paymentBoundary: string;
  safetyBoundary: string;
  publicContact: typeof PAID_PILOT_OFFER_CONTACT;
}

export const PAID_PILOT_OFFER_SAFETY_FLAGS: PaidPilotOfferSafetyFlags = {
  localDemoOnly: true,
  manualInputOnly: true,
  humanApproved: true,
  nonProduction: true,
  nonCustodial: true,
  nonAutonomous: true,
  advisoryOnly: true,
  realToolExecution: false,
  actionExecution: false,
  networkCalls: false,
  liveApi: false,
  mcpServerFunctionality: false,
  paymentIntegration: false,
  paymentLinks: false,
  checkout: false,
  livePaymentProcessing: false,
  paypalApiIntegration: false,
  stripeIntegration: false,
  webhookIntegration: false,
  walletBankingLogic: false,
  settlementExecution: false,
  productionSigning: false,
  productionCertification: false,
  securityCertification: false,
  legalComplianceGuarantee: false,
  guaranteedResults: false,
  automaticAcceptance: false,
  automaticAccessAfterPayment: false,
};

export function getPaidPilotOffer(): PaidPilotOffer {
  return {
    project: "Agent Trust Gate",
    offerIdentifier: PAID_PILOT_OFFER_ID,
    name: "Agent Trust Gate Paid Evaluation Pilot",
    version: PAID_PILOT_OFFER_VERSION,
    status: "human_reviewed_enquiry_only",
    buyerJourney: [
      "SEE IT - run or review the existing reviewer kit.",
      "TEST IT - perform a local developer evaluation.",
      "BUY A PILOT - request a paid controlled non-production evaluation pilot.",
    ],
    recommendedFirstCommand: PAID_PILOT_OFFER_FIRST_COMMAND,
    secondaryCommands: [
      "npm run demo:gatepass-round-trip",
      "npm run demo:gatepass-scorecard",
      "npm run demo:gatepass-wrapper",
    ],
    corePositioning: PAID_PILOT_OFFER_CORE_PHRASES,
    startingCurrency: "GBP",
    indicativeStartingPrice: 1500,
    priceQualifier:
      "Starting from £1,500 for a defined local evaluation pilot, subject to scope and written agreement.",
    engagementType: "paid_controlled_non_production_evaluation_pilot",
    evaluatedControls: [
      "mandate",
      "evidence",
      "verified intent",
      "approval status",
      "action scope",
      "value or spend limits",
      "GatePass validity",
      "refusal reasons",
      "audit and trust-receipt output",
    ],
    includedDeliverables: [
      "local reviewer-kit walkthrough",
      "local GatePass lifecycle review",
      "local developer wrapper evaluation",
      "local scenario mapping",
      "written findings if agreed in scope",
    ],
    buyerInputsRequired: [
      "organisation or project name",
      "general use case",
      "type of proposed agent action",
      "desired evaluation outcome",
      "preferred contact method",
    ],
    exclusions: [
      "production deployment",
      "production signing",
      "live APIs",
      "MCP server functionality",
      "real tool execution",
      "action execution",
      "live payment processing",
      "PayPal API integration",
      "Stripe integration",
      "checkout",
      "payment links",
      "webhooks",
      "wallet or banking logic",
      "real settlement execution",
      "legal/compliance/security certification",
      "automatic paid-pilot acceptance",
      "automatic access after payment",
    ],
    approvalRequirements: [
      "Gareth reviews the enquiry manually",
      "scope, delivery, price, and timetable require written agreement",
      "payment method is agreed separately outside the repository",
      "no payment or enquiry grants automatic access or production authority",
    ],
    enquiryTemplateFields: [
      "organisation or project name",
      "general use case",
      "type of proposed agent action",
      "desired evaluation outcome",
      "preferred contact method",
    ],
    paymentBoundary:
      "Payment method may be agreed separately. PayPal may be used for manually approved invoices if separately agreed, but this repository includes no PayPal API integration, Stripe integration, checkout, payment buttons, payment links, webhooks, wallet or banking logic, live payment processing, or settlement execution.",
    safetyBoundary:
      "Local, manual-input only, human-approved, non-production, non-custodial, non-autonomous, advisory evaluation. No production readiness, production signing, legal/compliance/security certification, real payment processing, settlement execution, network calls, real tool execution, or action execution is provided.",
    publicContact: PAID_PILOT_OFFER_CONTACT,
    ...PAID_PILOT_OFFER_SAFETY_FLAGS,
  };
}

export function summarisePaidPilotOffer(
  offer: PaidPilotOffer = getPaidPilotOffer(),
): Omit<PaidPilotOffer, "includedDeliverables" | "buyerInputsRequired" | "exclusions" | "approvalRequirements"> {
  const {
    includedDeliverables: _includedDeliverables,
    buyerInputsRequired: _buyerInputsRequired,
    exclusions: _exclusions,
    approvalRequirements: _approvalRequirements,
    ...summary
  } = offer;
  return summary;
}

export function getPaidPilotSafetyBoundary(): string {
  return getPaidPilotOffer().safetyBoundary;
}
