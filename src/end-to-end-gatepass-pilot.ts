import { createHash } from "node:crypto";

import {
  createLocalGatePassAuditReceipt,
  type LocalGatePassAuditReceipt,
} from "./local-gate-pass-receipt.js";
import { LocalGatePassReplayStore } from "./local-gate-pass-protection.js";
import {
  simulateLocalSettlementBlocker,
  type LocalSettlementBlockerDecision,
} from "./local-settlement-blocker.js";
import {
  signLocalTrustReceipt,
  verifyLocalTrustReceiptSignature,
  type LocalSignedProofVerificationDecision,
  type LocalSignedTrustReceipt,
} from "./local-signed-proof.js";
import {
  verifyLocalTrustReceipt,
  type LocalTrustReceiptVerificationDecision,
} from "./local-trust-receipt-verifier.js";
import type { LocalGatePassDemoInput } from "./local-gate-pass-demo.js";

export const END_TO_END_GATEPASS_PILOT_VERSION =
  "atg.end-to-end-gatepass-pilot.local.v1" as const;
export const END_TO_END_GATEPASS_PILOT_REPORT_VERSION =
  "atg.end-to-end-gatepass-pilot.report.local.v1" as const;
export const END_TO_END_GATEPASS_PILOT_COMMAND = "npm run demo:gatepass-pilot" as const;
export const END_TO_END_GATEPASS_PILOT_REFERENCE_TIME =
  "2026-07-15T09:00:00.000Z" as const;
export const END_TO_END_GATEPASS_PILOT_OUTPUT_DIR = "reports/gatepass-pilot" as const;
export const END_TO_END_GATEPASS_PILOT_CORE_RULE =
  "No mandate. No evidence. No verified intent. No signed GatePass. No settlement." as const;
export const END_TO_END_GATEPASS_PILOT_NOTE =
  "Local end-to-end pilot only; settlement is simulated and no real payment, settlement, API call, network call, credential, secret, customer data, production signing, or action execution is created." as const;

export type EndToEndGatePassPilotScenarioId = "permitted_action" | "refused_action";
export type EndToEndGatePassPilotDecision = "allow" | "refuse";
export type EndToEndGatePassPilotSettlementResult = "permitted_to_proceed" | "blocked";

export interface EndToEndGatePassPilotSafetyFlags {
  localOnly: true;
  simulatedSettlementOnly: true;
  networkCallPerformed: false;
  externalApiCalled: false;
  livePaymentProcessed: false;
  realSettlementExecuted: false;
  productionSigning: false;
  productionCredentialUsed: false;
  customerDataIncluded: false;
  actionExecuted: false;
  mcpProxyCreated: false;
  ssoIntegrated: false;
}

export interface EndToEndGatePassPilotCheck {
  id:
    | "mandate"
    | "action_scope"
    | "spend_limit"
    | "evidence"
    | "human_approval"
    | "gatepass_signature"
    | "settlement_adapter";
  label: string;
  passed: boolean;
  reason: string;
}

export interface EndToEndGatePassPilotSettlementDecision extends EndToEndGatePassPilotSafetyFlags {
  pilotIdentifier: string;
  actionIdentifier: string;
  requestId: string;
  gatePassIdentifier: string | null;
  result: EndToEndGatePassPilotSettlementResult;
  permitted: boolean;
  blockingReasons: string[];
  receiptVerification: LocalTrustReceiptVerificationDecision;
  signatureVerification: LocalSignedProofVerificationDecision;
  settlementBlocker: LocalSettlementBlockerDecision;
  checkedAt: string;
  disclaimer: typeof END_TO_END_GATEPASS_PILOT_NOTE;
}

export interface EndToEndGatePassPilotScenarioResult extends EndToEndGatePassPilotSafetyFlags {
  scenarioId: EndToEndGatePassPilotScenarioId;
  pilotIdentifier: string;
  actionIdentifier: string;
  requestId: string;
  requestingAgent: string;
  mandateReference: string;
  actionType: string;
  requestedValue: {
    amount: number;
    currency: "GBP";
    unit: "gbp";
  };
  scopeResult: "passed" | "failed";
  spendCapResult: "passed" | "failed";
  evidenceResult: "passed" | "failed";
  approvalResult: "passed" | "failed";
  riskTier: string;
  decision: EndToEndGatePassPilotDecision;
  gatePassIdentifier: string | null;
  refusalReasons: string[];
  gatePassIssueTime: string | null;
  gatePassExpiryTime: string | null;
  proposedAction: LocalGatePassDemoInput;
  checks: EndToEndGatePassPilotCheck[];
  gatePassReceipt: LocalGatePassAuditReceipt;
  signedGatePass: LocalSignedTrustReceipt | null;
  settlement: EndToEndGatePassPilotSettlementDecision;
  auditEvidenceReferences: {
    proposedAction: string;
    receipt: string;
    signedGatePass: string | null;
    settlementDecision: string;
  };
  disclaimer: typeof END_TO_END_GATEPASS_PILOT_NOTE;
}

export interface EndToEndGatePassPilotReport extends EndToEndGatePassPilotSafetyFlags {
  reportVersion: typeof END_TO_END_GATEPASS_PILOT_REPORT_VERSION;
  pilotIdentifier: string;
  command: typeof END_TO_END_GATEPASS_PILOT_COMMAND;
  coreRule: typeof END_TO_END_GATEPASS_PILOT_CORE_RULE;
  recommendedFirstExperience: "npm run demo:reviewer-kit";
  scenarioCount: 2;
  permittedCount: number;
  refusedCount: number;
  simulatedSettlementPermittedCount: number;
  simulatedSettlementBlockedCount: number;
  auditOutputDirectory: string;
  auditEvidenceReferences: {
    report: string;
    permittedAction: EndToEndGatePassPilotScenarioResult["auditEvidenceReferences"];
    refusedAction: EndToEndGatePassPilotScenarioResult["auditEvidenceReferences"];
  };
  commercialPilotPositioning: {
    name: "Agent Trust Gate Technical Review and Integration Feasibility Pilot";
    route: "commercially_agreed_local_feasibility_review";
    customerProvides: readonly string[];
    atgEvaluates: readonly string[];
    customerReceives: readonly string[];
  };
  scenarios: Record<EndToEndGatePassPilotScenarioId, EndToEndGatePassPilotScenarioResult>;
  checkedAt: typeof END_TO_END_GATEPASS_PILOT_REFERENCE_TIME;
  disclaimer: typeof END_TO_END_GATEPASS_PILOT_NOTE;
}

export type EndToEndGatePassPilotSummary = Omit<EndToEndGatePassPilotReport, "scenarios">;

export interface EndToEndGatePassSettlementValidationInput {
  pilotIdentifier: string;
  action: LocalGatePassDemoInput;
  receipt?: LocalGatePassAuditReceipt;
  signedGatePass?: LocalSignedTrustReceipt | null;
  evaluatedAt: string;
  replayStore?: LocalGatePassReplayStore;
  consume?: boolean;
}

export const END_TO_END_GATEPASS_PILOT_SAFETY_FLAGS: EndToEndGatePassPilotSafetyFlags = {
  localOnly: true,
  simulatedSettlementOnly: true,
  networkCallPerformed: false,
  externalApiCalled: false,
  livePaymentProcessed: false,
  realSettlementExecuted: false,
  productionSigning: false,
  productionCredentialUsed: false,
  customerDataIncluded: false,
  actionExecuted: false,
  mcpProxyCreated: false,
  ssoIntegrated: false,
};

export const END_TO_END_GATEPASS_PILOT_EXAMPLE_FILES = {
  permittedAction: "examples/gatepass-pilot-permitted-action.json",
  refusedAction: "examples/gatepass-pilot-refused-action.json",
  report: "examples/end-to-end-gatepass-pilot-report.json",
} as const;

export function createEndToEndGatePassPilotScenarioInputs(): Record<
  EndToEndGatePassPilotScenarioId,
  LocalGatePassDemoInput
> {
  const base: LocalGatePassDemoInput = {
    schema_version: "atg.local-agent-action-request.v2",
    request_id: "p3_m145_permitted_supplier_payment",
    action_id: "pilot_action_supplier_payment_001",
    agent_id: "delegated_procurement_agent_local",
    requested_action: "authorise_supplier_invoice_payment",
    action_category: "money_movement",
    local_only: true,
    issuer_ref: "fictional_buyer_ops_lead",
    verifier_ref: "agent_trust_gate_local_pilot",
    nonce: "nonce_p3_m145_permitted_001",
    mandate: {
      present: true,
      mandate_id: "mandate_p3_m145_supplier_payment_limit",
      scope: "authorise_supplier_invoice_payment",
      expires_at: "2026-07-15T09:10:00.000Z",
      issuer_ref: "fictional_buyer_ops_lead",
    },
    verified_intent: {
      present: true,
      status: "verified",
      source: "synthetic_buyer_instruction_fixture",
      verifier_ref: "agent_trust_gate_local_pilot",
      verified_at: "2026-07-15T08:59:30.000Z",
    },
    evidence: {
      present: true,
      fresh: true,
      evidence_id: "evidence_p3_m145_invoice_policy_match",
      evidence_type: "local_fixture",
      source: "synthetic_invoice_and_policy_fixture",
      local_reference: "examples/gatepass-pilot-permitted-action.json",
      evidence_hash: "sha256:local-demo-fixture-p3-m145-permitted",
      verified_at: "2026-07-15T08:59:45.000Z",
      freshness: {
        checked_at: "2026-07-15T09:00:00.000Z",
        expires_at: "2026-07-15T09:05:00.000Z",
        max_age_seconds: 300,
      },
    },
    limits: {
      spend_amount_gbp: 480,
      max_allowed_gbp: 500,
    },
    approval: {
      required: true,
      status: "approved",
    },
    risk_context: {
      risk_tier: "high",
      policy_decision: "allow",
      policy_pack_version: "local-demo-v1",
    },
    proof_metadata: {
      schema_version: "atg.local-proof-metadata.v1",
      proof_purpose: "pre_settlement_money_gate",
      proof_status: "candidate",
      issuer_ref: "fictional_buyer_ops_lead",
      verifier_ref: "agent_trust_gate_local_pilot",
      created_at: "2026-07-15T09:00:00.000Z",
      expires_at: "2026-07-15T09:05:00.000Z",
      nonce: "nonce_p3_m145_permitted_001",
      local_only: true,
      replay_freshness: {
        nonce: "nonce_p3_m145_permitted_001",
        single_use: true,
        freshness_window_seconds: 300,
        replay_protection: "local_in_memory_single_use",
      },
    },
    checked_at: "2026-07-15T09:00:00.000Z",
  };

  return {
    permitted_action: base,
    refused_action: {
      ...structuredClone(base),
      request_id: "p3_m145_refused_supplier_payment",
      action_id: "pilot_action_supplier_payment_002",
      nonce: "nonce_p3_m145_refused_001",
      evidence: {
        ...base.evidence,
        local_reference: "examples/gatepass-pilot-refused-action.json",
        evidence_hash: "sha256:local-demo-fixture-p3-m145-refused",
      },
      limits: {
        spend_amount_gbp: 875,
        max_allowed_gbp: 500,
      },
      approval: {
        required: true,
        status: "approved",
      },
      proof_metadata: {
        ...base.proof_metadata,
        nonce: "nonce_p3_m145_refused_001",
        replay_freshness: {
          nonce: "nonce_p3_m145_refused_001",
          single_use: true,
          freshness_window_seconds: 300,
          replay_protection: "local_in_memory_single_use",
        },
      },
    },
  };
}

export function runEndToEndGatePassPilot(
  options: { outputDirectory?: string } = {},
): EndToEndGatePassPilotReport {
  const outputDirectory = normaliseOutputDirectory(options.outputDirectory ?? END_TO_END_GATEPASS_PILOT_OUTPUT_DIR);
  const pilotIdentifier = createPilotIdentifier();
  const replayStore = new LocalGatePassReplayStore();
  const inputs = createEndToEndGatePassPilotScenarioInputs();
  const permitted = evaluateEndToEndGatePassPilotScenario(
    "permitted_action",
    inputs.permitted_action,
    pilotIdentifier,
    outputDirectory,
    replayStore,
  );
  const refused = evaluateEndToEndGatePassPilotScenario(
    "refused_action",
    inputs.refused_action,
    pilotIdentifier,
    outputDirectory,
    replayStore,
  );
  const scenarios = {
    permitted_action: permitted,
    refused_action: refused,
  };
  const scenarioValues = Object.values(scenarios);
  return {
    reportVersion: END_TO_END_GATEPASS_PILOT_REPORT_VERSION,
    pilotIdentifier,
    command: END_TO_END_GATEPASS_PILOT_COMMAND,
    coreRule: END_TO_END_GATEPASS_PILOT_CORE_RULE,
    recommendedFirstExperience: "npm run demo:reviewer-kit",
    scenarioCount: 2,
    permittedCount: scenarioValues.filter((scenario) => scenario.decision === "allow").length,
    refusedCount: scenarioValues.filter((scenario) => scenario.decision === "refuse").length,
    simulatedSettlementPermittedCount: scenarioValues.filter((scenario) => scenario.settlement.permitted).length,
    simulatedSettlementBlockedCount: scenarioValues.filter((scenario) => !scenario.settlement.permitted).length,
    auditOutputDirectory: outputDirectory,
    auditEvidenceReferences: {
      report: `${outputDirectory}/end-to-end-gatepass-pilot-report.json`,
      permittedAction: permitted.auditEvidenceReferences,
      refusedAction: refused.auditEvidenceReferences,
    },
    commercialPilotPositioning: {
      name: "Agent Trust Gate Technical Review and Integration Feasibility Pilot",
      route: "commercially_agreed_local_feasibility_review",
      customerProvides: [
        "synthetic or sanitised delegated-action examples",
        "action categories and authority boundaries",
        "spend or value limits",
        "approval and evidence requirements",
        "desired GatePass validity and replay rules",
      ],
      atgEvaluates: [
        "mandate and scope fit",
        "spend or value limits",
        "evidence sufficiency",
        "human approval status",
        "GatePass freshness, integrity, and replay safety",
        "refusal-receipt and audit-evidence output",
      ],
      customerReceives: [
        "local GatePass examples",
        "refusal receipts",
        "simulated settlement decisions",
        "audit evidence references",
        "integration observations and next-stage architecture notes",
      ],
    },
    scenarios,
    checkedAt: END_TO_END_GATEPASS_PILOT_REFERENCE_TIME,
    disclaimer: END_TO_END_GATEPASS_PILOT_NOTE,
    ...END_TO_END_GATEPASS_PILOT_SAFETY_FLAGS,
  };
}

export function runEndToEndGatePassPilotScenario(
  scenarioId: EndToEndGatePassPilotScenarioId,
  options: { outputDirectory?: string } = {},
): EndToEndGatePassPilotScenarioResult {
  return runEndToEndGatePassPilot(options).scenarios[scenarioId];
}

export function summariseEndToEndGatePassPilot(
  report: EndToEndGatePassPilotReport,
): EndToEndGatePassPilotSummary {
  const { scenarios: _scenarios, ...summary } = report;
  return summary;
}

export function validateGatePassPilotSettlement(
  input: EndToEndGatePassSettlementValidationInput,
): EndToEndGatePassPilotSettlementDecision {
  const receipt = input.receipt;
  const signedGatePass = input.signedGatePass ?? null;
  const missingReceipt = receipt === undefined;
  const expectedRequest = input.action.request_id;
  const expectedAgent = input.action.agent_id;
  const expectedAction = input.action.requested_action;
  const receiptVerification = missingReceipt
    ? verifyLocalTrustReceipt(undefined, {
      current_time: input.evaluatedAt,
      require_settlement_eligibility: true,
    })
    : verifyLocalTrustReceipt(receipt, {
      expected_request_id: expectedRequest,
      expected_agent_id: expectedAgent,
      expected_requested_action: expectedAction,
      current_time: input.evaluatedAt,
      require_settlement_eligibility: true,
      replay_store: input.replayStore ?? new LocalGatePassReplayStore(),
    });
  const signatureVerification = signedGatePass === null
    ? verifyLocalTrustReceiptSignature(undefined, { checkedAt: input.evaluatedAt })
    : verifyLocalTrustReceiptSignature(signedGatePass, { checkedAt: input.evaluatedAt });
  const signedPayloadMatchesReceipt = signedGatePass !== null
    && receipt !== undefined
    && signedGatePass.payload.receipt_id === receipt.receipt_id
    && signedGatePass.payload.request_id === receipt.request_id;
  const settlementBlocker = simulateLocalSettlementBlocker(receipt, {
    evaluated_at: input.evaluatedAt,
    replay_store: input.replayStore ?? new LocalGatePassReplayStore(),
    consume: input.consume ?? true,
  });
  const amountMatches = receipt !== undefined
    && safeAmount(input.action.limits?.spend_amount_gbp) <= safeAmount(input.action.limits?.max_allowed_gbp);
  const scopeMatches = scopeMatchesAction(input.action);
  const mandateMatches = receipt !== undefined
    && receipt.mandate_id === (input.action.mandate?.mandate_id ?? receipt.mandate_id)
    && input.action.mandate?.present === true;
  const approvalSatisfied = receipt !== undefined && receipt.checks.approval.passed === true;
  const allowed = receiptVerification.verified
    && receiptVerification.valid_for_simulated_settlement
    && signatureVerification.verified
    && signedPayloadMatchesReceipt
    && settlementBlocker.settlement_simulation === "allowed"
    && amountMatches
    && scopeMatches
    && mandateMatches
    && approvalSatisfied;
  const blockingReasons = collectSettlementBlockingReasons({
    missingReceipt,
    receiptVerification,
    signatureVerification,
    signedPayloadMatchesReceipt,
    settlementBlocker,
    amountMatches,
    scopeMatches,
    mandateMatches,
    approvalSatisfied,
  });
  return {
    pilotIdentifier: input.pilotIdentifier,
    actionIdentifier: safeIdentifier(input.action.action_id ?? input.action.request_id),
    requestId: safeIdentifier(input.action.request_id),
    gatePassIdentifier: receipt?.receipt_id ?? null,
    result: allowed ? "permitted_to_proceed" : "blocked",
    permitted: allowed,
    blockingReasons,
    receiptVerification,
    signatureVerification,
    settlementBlocker,
    checkedAt: safeTimestamp(input.evaluatedAt),
    disclaimer: END_TO_END_GATEPASS_PILOT_NOTE,
    ...END_TO_END_GATEPASS_PILOT_SAFETY_FLAGS,
  };
}

function evaluateEndToEndGatePassPilotScenario(
  scenarioId: EndToEndGatePassPilotScenarioId,
  action: LocalGatePassDemoInput,
  pilotIdentifier: string,
  outputDirectory: string,
  replayStore: LocalGatePassReplayStore,
): EndToEndGatePassPilotScenarioResult {
  const receipt = createLocalGatePassAuditReceipt(action);
  const scopePassed = scopeMatchesAction(action);
  const baseAllowed = receipt.receipt_type === "signed_gate_pass"
    && receipt.verdict === "allow_signed_gate_pass"
    && receipt.allowed === true
    && scopePassed;
  const signedGatePass = baseAllowed
    ? signLocalTrustReceipt(receipt, {
      issuerReference: receipt.issuer_ref,
      verifierReference: receipt.verifier_ref,
      signedAt: receipt.checked_at,
    })
    : null;
  const settlement = validateGatePassPilotSettlement({
    pilotIdentifier,
    action,
    receipt,
    signedGatePass,
    evaluatedAt: action.checked_at ?? END_TO_END_GATEPASS_PILOT_REFERENCE_TIME,
    replayStore,
    consume: true,
  });
  const decision: EndToEndGatePassPilotDecision = settlement.permitted ? "allow" : "refuse";
  const refusalReasons = decision === "allow"
    ? []
    : unique([
      ...receipt.reason_codes,
      ...settlement.blockingReasons,
    ]);
  const auditEvidenceReferences = auditReferencesFor(outputDirectory, scenarioId, signedGatePass !== null);
  const checks = createPilotChecks(action, receipt, scopePassed, signedGatePass, settlement);
  return {
    scenarioId,
    pilotIdentifier,
    actionIdentifier: safeIdentifier(action.action_id ?? action.request_id),
    requestId: safeIdentifier(action.request_id),
    requestingAgent: safeIdentifier(action.agent_id),
    mandateReference: safeIdentifier(action.mandate?.mandate_id ?? "missing_mandate"),
    actionType: safeIdentifier(action.requested_action),
    requestedValue: {
      amount: safeAmount(action.limits?.spend_amount_gbp),
      currency: "GBP",
      unit: "gbp",
    },
    scopeResult: scopePassed ? "passed" : "failed",
    spendCapResult: receipt.checks.limits.passed ? "passed" : "failed",
    evidenceResult: receipt.checks.evidence.passed ? "passed" : "failed",
    approvalResult: receipt.checks.approval.passed ? "passed" : "failed",
    riskTier: receipt.risk_tier,
    decision,
    gatePassIdentifier: signedGatePass?.payload.receipt_id ?? null,
    refusalReasons,
    gatePassIssueTime: signedGatePass?.signatureMetadata.signedAt ?? null,
    gatePassExpiryTime: receipt.gate_pass_validity?.expires_at ?? null,
    proposedAction: structuredClone(action),
    checks,
    gatePassReceipt: receipt,
    signedGatePass,
    settlement,
    auditEvidenceReferences,
    disclaimer: END_TO_END_GATEPASS_PILOT_NOTE,
    ...END_TO_END_GATEPASS_PILOT_SAFETY_FLAGS,
  };
}

function createPilotChecks(
  action: LocalGatePassDemoInput,
  receipt: LocalGatePassAuditReceipt,
  scopePassed: boolean,
  signedGatePass: LocalSignedTrustReceipt | null,
  settlement: EndToEndGatePassPilotSettlementDecision,
): EndToEndGatePassPilotCheck[] {
  return [
    {
      id: "mandate",
      label: "Mandate exists and remains current",
      passed: receipt.checks.mandate.passed,
      reason: receipt.checks.mandate.reason,
    },
    {
      id: "action_scope",
      label: "Proposed action matches mandate scope",
      passed: scopePassed,
      reason: scopePassed
        ? "requested_action_matches_mandate_scope"
        : "requested_action_outside_mandate_scope",
    },
    {
      id: "spend_limit",
      label: "Requested value stays within spend cap",
      passed: receipt.checks.limits.passed,
      reason: `${receipt.checks.limits.reason}; requested=${safeAmount(action.limits?.spend_amount_gbp)} GBP cap=${safeAmount(action.limits?.max_allowed_gbp)} GBP`,
    },
    {
      id: "evidence",
      label: "Required evidence is present and fresh",
      passed: receipt.checks.evidence.passed,
      reason: receipt.checks.evidence.reason,
    },
    {
      id: "human_approval",
      label: "Human approval requirement is satisfied",
      passed: receipt.checks.approval.passed,
      reason: receipt.checks.approval.reason,
    },
    {
      id: "gatepass_signature",
      label: "Local-demo signed GatePass artifact verifies",
      passed: signedGatePass !== null && settlement.signatureVerification.verified,
      reason: signedGatePass === null
        ? "signed_gatepass_not_issued_for_refusal_or_failed_check"
        : settlement.signatureVerification.reasonCodes.join(", "),
    },
    {
      id: "settlement_adapter",
      label: "Local simulated settlement adapter decision",
      passed: settlement.permitted,
      reason: settlement.permitted
        ? "valid_gatepass_permits_local_simulated_settlement"
        : settlement.blockingReasons.join(", "),
    },
  ];
}

function collectSettlementBlockingReasons(input: {
  missingReceipt: boolean;
  receiptVerification: LocalTrustReceiptVerificationDecision;
  signatureVerification: LocalSignedProofVerificationDecision;
  signedPayloadMatchesReceipt: boolean;
  settlementBlocker: LocalSettlementBlockerDecision;
  amountMatches: boolean;
  scopeMatches: boolean;
  mandateMatches: boolean;
  approvalSatisfied: boolean;
}): string[] {
  const reasons: string[] = [];
  if (input.missingReceipt) reasons.push("missing_gatepass_receipt");
  if (!input.receiptVerification.verified) {
    reasons.push(...input.receiptVerification.reason_codes.map((code) => `receipt_${code}`));
  }
  if (!input.receiptVerification.valid_for_simulated_settlement) {
    reasons.push("receipt_not_valid_for_simulated_settlement");
  }
  if (!input.signatureVerification.verified) {
    reasons.push(...input.signatureVerification.reasonCodes.map((code) => `signature_${code}`));
  }
  if (!input.signedPayloadMatchesReceipt) reasons.push("signed_gatepass_payload_mismatch");
  if (input.settlementBlocker.settlement_simulation !== "allowed") {
    reasons.push(...input.settlementBlocker.block_reason_codes.map((code) => `settlement_${code}`));
  }
  if (!input.amountMatches) reasons.push("requested_value_exceeds_authorised_limit");
  if (!input.scopeMatches) reasons.push("action_scope_mismatch");
  if (!input.mandateMatches) reasons.push("mandate_mismatch_or_missing");
  if (!input.approvalSatisfied) reasons.push("approval_requirement_not_satisfied");
  return unique(reasons);
}

function auditReferencesFor(
  outputDirectory: string,
  scenarioId: EndToEndGatePassPilotScenarioId,
  hasSignedGatePass: boolean,
): EndToEndGatePassPilotScenarioResult["auditEvidenceReferences"] {
  const stem = scenarioId.replace("_", "-");
  return {
    proposedAction: `${outputDirectory}/${stem}-proposed-action.json`,
    receipt: `${outputDirectory}/${stem}-gatepass-receipt.json`,
    signedGatePass: hasSignedGatePass ? `${outputDirectory}/${stem}-signed-gatepass.json` : null,
    settlementDecision: `${outputDirectory}/${stem}-settlement-decision.json`,
  };
}

function scopeMatchesAction(action: LocalGatePassDemoInput): boolean {
  return normaliseToken(action.mandate?.scope) === normaliseToken(action.requested_action)
    && normaliseToken(action.requested_action) !== "";
}

function createPilotIdentifier(): string {
  const seed = `${END_TO_END_GATEPASS_PILOT_VERSION}|${END_TO_END_GATEPASS_PILOT_REFERENCE_TIME}`;
  return `p3_m145_gatepass_pilot_${createHash("sha256").update(seed, "utf8").digest("hex").slice(0, 16)}`;
}

function safeAmount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0;
}

function safeIdentifier(value: string): string {
  const output = value.trim().replace(/[^a-zA-Z0-9_-]+/g, "_").slice(0, 96);
  return output || "local_demo_identifier";
}

function safeTimestamp(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? "1970-01-01T00:00:00.000Z" : parsed.toISOString();
}

function normaliseToken(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normaliseOutputDirectory(value: string): string {
  return value.trim().replace(/\\/g, "/").replace(/\/+$/g, "") || END_TO_END_GATEPASS_PILOT_OUTPUT_DIR;
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}
