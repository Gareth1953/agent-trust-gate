import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

import {
  InMemoryNonceStore,
  createBaseExactActionInput,
  createCanonicalActionEnvelope,
  createFixedTrustedClock,
  createPolicyDecisionReceipt,
  createVerifierContext,
  issueExactActionGatePass,
  recomputeCanonicalActionDigest,
  verifyAndExecuteSimulatedAction,
  type CanonicalActionEnvelope,
  type CanonicalActionEnvelopeInput,
  type ExactActionGatePass,
  type ExecutionReceipt,
  type PolicyDecisionReceipt,
} from "./exact-action-gatepass.js";
import {
  createNorthstarAgentStandingFixture,
  evaluateAgentStanding,
  NORTHSTAR_ORGANISATION_ID,
  NORTHSTAR_PROCUREMENT_AGENT_ID,
  type AgentStandingDecisionReceipt,
} from "./agent-standing.js";
import {
  createCanonicalPayloadHash,
  createDeterministicLocalFixtureKeyPair,
  signCanonicalLocalFixturePayload,
  verifyCanonicalLocalFixturePayload,
} from "./local-signed-proof.js";

export const EXACT_ACTION_TRUST_GATEWAY_PROTOTYPE_VERSION =
  "atg.exact-action-trust-gateway.prototype.local.v1" as const;
export const EXACT_ACTION_TRUST_GATEWAY_RECEIPT_VERSION =
  "atg.exact-action-trust-receipt.local.v1" as const;
export const EXACT_ACTION_TRUST_GATEWAY_REFERENCE_TIME =
  "2026-09-02T09:00:00.000Z" as const;
export const EXACT_ACTION_TRUST_GATEWAY_POLICY_VERSION =
  "northstar-exact-action-policy-2026-09-02.v1" as const;
export const EXACT_ACTION_TRUST_GATEWAY_POSITIONING =
  "Verify the exact human authority behind the exact AI-agent action before the action is allowed to happen." as const;
export const EXACT_ACTION_TRUST_GATEWAY_CORE_RULE =
  "No verified authority. No valid mandate. No exact-action proof. No GatePass. No action." as const;
export const EXACT_ACTION_TRUST_GATEWAY_STATUS = "WORKING LOCAL PILOT-READY PROTOTYPE" as const;
export const EXACT_ACTION_TRUST_GATEWAY_DISCLAIMER =
  "Synthetic data only. Simulated procurement execution only. No real payment or external action." as const;

export type ExactActionPrototypeScenarioId =
  | "allowed"
  | "overspend"
  | "wrong_human_authority"
  | "expired_authority"
  | "action_tampering"
  | "replay"
  | "agent_standing_failure"
  | "expired_mandate";

export const BUYER_PROTOTYPE_SCENARIOS: readonly ExactActionPrototypeScenarioId[] = [
  "allowed",
  "overspend",
  "wrong_human_authority",
  "expired_authority",
  "action_tampering",
  "replay",
  "agent_standing_failure",
] as const;

export type AtgPrototypeDecision = "GATEPASS_ISSUED" | "ACTION_REFUSED";
export type AtgPrototypeCheckStatus = "PASS" | "BLOCK";
export type PrototypeExecutionStatus =
  | "NOT_ATTEMPTED"
  | "SIMULATED_PURCHASE_COMPLETED"
  | "BLOCKED_NO_GATEPASS"
  | "BLOCKED_ACTION_MISMATCH"
  | "BLOCKED_EXPIRED_GATEPASS"
  | "BLOCKED_REPLAY"
  | "BLOCKED_INVALID_GATEPASS";

export type PrototypePrimaryFailureCode =
  | "AUTHORITY_LIMIT_EXCEEDED"
  | "HUMAN_NOT_AUTHORISED"
  | "AUTHORITY_EXPIRED"
  | "AGENT_STANDING_INVALID"
  | "EXACT_ACTION_MISMATCH"
  | "GATEPASS_REPLAY"
  | "MANDATE_EXPIRED"
  | "EVIDENCE_INVALID"
  | "MANDATE_MISSING"
  | "HUMAN_AUTHORITY_PROOF_MISSING"
  | "MALFORMED_EXACT_ACTION"
  | "GATEPASS_EXPIRED"
  | "GATEPASS_MISSING"
  | "GATEPASS_MALFORMED"
  | "GATEPASS_INVALID_SIGNATURE"
  | "NONCE_MISMATCH"
  | "UNKNOWN_AGENT"
  | "UNKNOWN_HUMAN"
  | "SUPPLIER_NOT_PERMITTED"
  | "PRODUCT_CATEGORY_NOT_PERMITTED"
  | "CURRENCY_NOT_PERMITTED"
  | "JURISDICTION_NOT_PERMITTED"
  | "RISK_TIER_NOT_PERMITTED"
  | "QUANTITY_NOT_PERMITTED"
  | "POLICY_VERSION_MISMATCH"
  | "UNKNOWN_FAILURE";

export interface PrototypePrimaryFailure {
  code: PrototypePrimaryFailureCode;
  summary: string;
  requestedLabel: string | null;
  requestedValue: string | number | null;
  requestedDisplay: string | null;
  permittedLabel: string | null;
  permittedValue: string | number | null;
  permittedDisplay: string | null;
  relevantValues: Record<string, string | number | boolean | null>;
}

export interface StructuredPrototypeRefusal {
  primaryFailure: PrototypePrimaryFailure;
  primaryFailureCode: PrototypePrimaryFailureCode;
  primaryFailureSummary: string;
  failedChecks: Array<Pick<AtgPrototypeCheck, "id" | "label" | "reason">>;
  consequentialBlocks: string[];
  decision: "ACTION_REFUSED" | "EXECUTION_BLOCKED";
  gatePassIssued: boolean;
  executionPermitted: false;
}

export interface ReceiptExecutiveSummary {
  whoAuthorized: string;
  organisation: string;
  whichAgent: string;
  exactAction: string;
  amount: number;
  currency: string;
  whyAtgDecided: string;
  decision: AtgPrototypeDecision | "EXECUTION_BLOCKED";
  gatePassStatus: "NOT_ISSUED" | "ISSUED" | "CONSUMED" | "REPLAY_REFUSED" | "EXECUTION_BLOCKED";
  executionStatus: PrototypeExecutionStatus;
  timestamp: string;
  receiptVerificationStatus: "VERIFIED_LOCAL_FIXTURE";
}

export interface ExactActionPrototypeFaults {
  missingEvidence?: boolean;
  staleEvidence?: boolean;
  missingMandate?: boolean;
  missingHumanAuthorityProof?: boolean;
  malformedExactAction?: boolean;
  unknownAgent?: boolean;
}

export interface HumanPurchasePermission {
  currency: string;
  maxAmount: number;
  department?: string;
  jurisdiction?: string;
  riskTiers?: string[];
  permittedSuppliers?: string[];
  permittedCategories?: string[];
}

export interface HumanAuthorityEmployeeFixture {
  employeeId: string;
  displayName: string;
  role: string;
  department: string;
  organisationId?: string;
  organisationName?: string;
  appointmentStatus?: string;
  status: string;
  permissions: Record<string, HumanPurchasePermission>;
}

export interface HumanAuthenticationFixture {
  employeeId: string;
  status: string;
  method: string;
  phishingResistant: boolean;
  userPresence: boolean;
  userVerification: boolean;
  assurance: string;
}

export interface HumanAuthorityProof {
  type: string;
  version: string;
  proofId: string;
  organisationId: string;
  organisationName: string;
  policyId: string;
  policyVersion: string;
  actionDigest: string;
  actionType: string;
  amount: number;
  currency: string;
  jurisdiction: string;
  primaryApprover: {
    employeeId: string;
    displayName: string;
    role: string;
    department: string;
    status: string;
    authentication: HumanAuthenticationFixture;
    authorityLimit: HumanPurchasePermission;
  };
  issuedAt: string;
  expiresAt: string;
  nonce: string;
  nonceState: string;
  integrity: {
    suite: string;
    keyId: string;
    signature: string;
    warning: string;
  };
  [key: string]: unknown;
}

interface HumanAuthorityDemoResult {
  observed: "allowed" | "refused";
  decision: { outcome: string; code: string; message: string };
  canonicalActionDigest: string;
  checks: Array<{ check: string; passed: boolean; detail: string }>;
  humanAuthorityProof: HumanAuthorityProof | null;
  gatePass: unknown | null;
  executionReceipt: unknown | null;
}

interface HumanAuthorityDemoModule {
  runScenario: (scenario: Record<string, unknown>) => HumanAuthorityDemoResult;
  verifySignedObject: (value: unknown) => boolean;
  getHumanAuthorityFixture: (
    employeeId: string,
    authenticationId: string,
  ) => { employee: HumanAuthorityEmployeeFixture | null; authentication: HumanAuthenticationFixture | null };
}

export interface ProcurementOffer {
  offerId: string;
  supplierId: string;
  supplierName: string;
  product: string;
  quantity: number;
  totalAmount: number;
  currency: "GBP";
  deliveryDays: number;
  paymentTerms: string;
  synthetic: true;
}

export interface ProcurementEvidenceRecord {
  evidenceId: string;
  evidenceType: "synthetic_supplier_research_and_negotiation";
  generatedAt: string;
  expiresAt: string;
  status: "present" | "missing" | "stale";
  offersInspected: ProcurementOffer[];
  comparisonSummary: string;
  negotiation: {
    supplierId: string;
    openingAmount: number;
    finalAmount: number;
    currency: "GBP";
    commercialTermsReference: string;
    outcome: string;
  };
  selectedSupplierId: string;
  digest: string;
  synthetic: true;
  networkCallPerformed: false;
}

export interface BoundedProcurementMandate {
  mandateId: string;
  organisationId: typeof NORTHSTAR_ORGANISATION_ID;
  humanAuthorityProofReference: string;
  humanId: string;
  agentId: typeof NORTHSTAR_PROCUREMENT_AGENT_ID;
  instruction: string;
  permittedObjective: string;
  permittedActionClasses: readonly ["research", "compare", "negotiate", "purchase"];
  permittedSupplierIds: string[];
  permittedCategories: string[];
  product: "Product X";
  maximumQuantity: 200;
  currency: "GBP";
  maximumAmount: 25000;
  jurisdiction: "GB";
  riskTier: "medium";
  validFrom: string;
  expiresAt: string;
  evidenceRequirements: string[];
  status: "active" | "missing";
  policyVersion: typeof EXACT_ACTION_TRUST_GATEWAY_POLICY_VERSION;
  digest: string;
  synthetic: true;
}

export interface ProposedProcurementAction {
  organisationId: string;
  humanAuthorityProofReference: string;
  mandateId: string;
  agentId: string;
  supplierId: string;
  supplierName: string;
  product: string;
  category: string;
  quantity: number;
  totalAmount: number;
  currency: string;
  commercialTermsReference: string;
  actionType: string;
  jurisdiction: string;
  riskTier: string;
  timestamp: string;
  nonce: string;
  policyVersion: string;
}

export interface ExactActionPrototypeScenarioInput {
  scenarioId: ExactActionPrototypeScenarioId;
  title: string;
  description: string;
  expected: "allow" | "refuse" | "block_at_execution";
  humanEmployeeId: string;
  humanAuthenticationId: string;
  humanAuthorityExpiresAt: string;
  agentDisabled: boolean;
  mandateExpiresAt: string;
  proposedAction: Omit<ProposedProcurementAction, "humanAuthorityProofReference" | "mandateId">;
  executionMutation: Partial<ProposedProcurementAction> | null;
  faults?: ExactActionPrototypeFaults;
}

export interface AtgPrototypeCheck {
  ordinal: number;
  id: string;
  label: string;
  status: AtgPrototypeCheckStatus;
  passed: boolean;
  reason: string;
}

export interface PrototypeExecutionRecord {
  receiptVersion: "atg.simulated-procurement-execution-receipt.local.v1";
  receiptId: string;
  status: PrototypeExecutionStatus;
  gatePassId: string | null;
  expectedActionDigest: string;
  proposedActionDigest: string | null;
  supplierId: string;
  supplierName: string;
  quantity: number;
  totalAmount: number;
  currency: string;
  executedAt: string | null;
  simulatedPurchaseReference: string | null;
  gatePassConsumed: boolean;
  reasonCodes: string[];
  reason: string;
  underlyingExactActionReceipt: ExecutionReceipt | null;
  simulatedOnly: true;
  networkCallPerformed: false;
  externalApiCalled: false;
  realOrderCreated: false;
  realPaymentProcessed: false;
}

export interface ExactActionTrustReceiptIntegrity {
  algorithm: "sha256+ed25519-local-fixture";
  payloadDigest: string;
  signature: string;
  keyId: string;
  localFixtureOnly: true;
  productionKeyCustody: false;
}

export interface ExactActionTrustReceipt {
  receiptVersion: typeof EXACT_ACTION_TRUST_GATEWAY_RECEIPT_VERSION;
  receiptId: string;
  prototypeVersion: typeof EXACT_ACTION_TRUST_GATEWAY_PROTOTYPE_VERSION;
  prototypeStatus: typeof EXACT_ACTION_TRUST_GATEWAY_STATUS;
  scenarioId: ExactActionPrototypeScenarioId;
  runId: string;
  generatedAt: string;
  organisation: { id: string; name: "Northstar Retail Ltd"; synthetic: true };
  human: {
    employee: HumanAuthorityEmployeeFixture | null;
    authentication: HumanAuthenticationFixture | null;
    authorityProof: HumanAuthorityProof | null;
    authorityProofVerified: boolean;
    authorityProofReference: string | null;
    authorityProofDigest: string | null;
  };
  agent: {
    id: typeof NORTHSTAR_PROCUREMENT_AGENT_ID;
    displayName: "Northstar Procurement Agent 04";
    standing: AgentStandingDecisionReceipt;
    permittedCapability: "supplier research, comparison, negotiation and simulated purchasing";
  };
  mandate: BoundedProcurementMandate;
  evidence: ProcurementEvidenceRecord;
  exactAction: CanonicalActionEnvelope;
  checks: AtgPrototypeCheck[];
  policyDecision: PolicyDecisionReceipt;
  decision: AtgPrototypeDecision;
  refusal: StructuredPrototypeRefusal | null;
  executiveSummary: ReceiptExecutiveSummary;
  gatePass: ExactActionGatePass | null;
  gatePassIssued: boolean;
  exactActionDigest: string;
  executionPermitted: boolean;
  execution: PrototypeExecutionRecord | null;
  humanReadableReceipt: string;
  auditResult: string;
  safety: {
    localOnly: true;
    syntheticDataOnly: true;
    simulatedProcurementExecutionOnly: true;
    networkCallPerformed: false;
    externalApiCalled: false;
    realOrderCreated: false;
    realPaymentProcessed: false;
    realSettlementExecuted: false;
    productionCredentialUsed: false;
    productionSecretsUsed: false;
  };
  integrity: ExactActionTrustReceiptIntegrity;
}

export interface ExactActionPrototypeEvaluation {
  runId: string;
  scenario: ExactActionPrototypeScenarioInput;
  humanAuthorityResult: HumanAuthorityDemoResult;
  agentStandingReceipt: AgentStandingDecisionReceipt;
  mandate: BoundedProcurementMandate;
  evidence: ProcurementEvidenceRecord;
  proposedAction: ProposedProcurementAction;
  exactActionInput: CanonicalActionEnvelopeInput;
  exactAction: CanonicalActionEnvelope;
  checks: AtgPrototypeCheck[];
  decision: AtgPrototypeDecision;
  refusal: StructuredPrototypeRefusal | null;
  policyDecisionReceipt: PolicyDecisionReceipt;
  gatePass: ExactActionGatePass | null;
  trustReceipt: ExactActionTrustReceipt;
}

export interface ExactActionPrototypeExecutionResult {
  execution: PrototypeExecutionRecord;
  trustReceipt: ExactActionTrustReceipt;
}

export interface TrustReceiptVerification {
  verified: boolean;
  receiptId: string;
  checks: Array<{ id: string; passed: boolean; reason: string }>;
  reasonCodes: string[];
  checkedAt: string;
  localOnly: true;
}

export interface ExactActionPrototypeScenarioPreview {
  scenario: ExactActionPrototypeScenarioInput;
  human: HumanAuthorityEmployeeFixture | null;
  authentication: HumanAuthenticationFixture | null;
  agent: { id: string; displayName: string; standing: string; permittedCapability: string };
  mandate: Omit<BoundedProcurementMandate, "humanAuthorityProofReference" | "digest">;
  evidence: ProcurementEvidenceRecord;
}

export interface ExactActionPrototypeSmokeResult {
  prototypeVersion: typeof EXACT_ACTION_TRUST_GATEWAY_PROTOTYPE_VERSION;
  passed: boolean;
  totalScenarios: number;
  passedScenarios: number;
  scenarios: Array<{
    scenarioId: Exclude<ExactActionPrototypeScenarioId, "expired_mandate">;
    passed: boolean;
    observed: string;
    expected: string;
    gatePassIssued: boolean;
    executionStatus: PrototypeExecutionStatus;
  }>;
  networkCallPerformed: false;
}

const HUMAN_INSTRUCTION =
  "Find suitable suppliers for 200 units of Product X. Compare suitable offers. Negotiate within the approved commercial conditions. Purchase up to a maximum total value of £25,000 on our behalf, subject to Agent Trust Gate approval.";
const RECEIPT_KEY = createDeterministicLocalFixtureKeyPair("atg-exact-action-trust-receipt-v1");
const SAFETY = {
  localOnly: true,
  syntheticDataOnly: true,
  simulatedProcurementExecutionOnly: true,
  networkCallPerformed: false,
  externalApiCalled: false,
  realOrderCreated: false,
  realPaymentProcessed: false,
  realSettlementExecuted: false,
  productionCredentialUsed: false,
  productionSecretsUsed: false,
} as const;

let humanAuthorityModulePromise: Promise<HumanAuthorityDemoModule> | undefined;

export class ExactActionTrustGatewayPrototype {
  readonly #nonceStore = new InMemoryNonceStore();

  async evaluateExactAction(
    scenarioOrInput: ExactActionPrototypeScenarioId | ExactActionPrototypeScenarioInput,
  ): Promise<ExactActionPrototypeEvaluation> {
    const scenario = typeof scenarioOrInput === "string"
      ? createExactActionPrototypeScenario(scenarioOrInput)
      : structuredClone(scenarioOrInput);
    const humanModule = await loadHumanAuthorityModule();
    const fixture = humanModule.getHumanAuthorityFixture(
      scenario.humanEmployeeId,
      scenario.humanAuthenticationId,
    );
    const rawHumanAuthorityResult = humanModule.runScenario(createHumanAuthorityScenario(scenario));
    const humanAuthorityResult: HumanAuthorityDemoResult = scenario.faults?.missingHumanAuthorityProof
      ? {
        ...rawHumanAuthorityResult,
        observed: "refused",
        decision: {
          outcome: "REFUSED",
          code: "HUMAN_AUTHORITY_PROOF_MISSING",
          message: "The required Human Authority Proof is missing.",
        },
        humanAuthorityProof: null,
      }
      : rawHumanAuthorityResult;
    const authorityProof = humanAuthorityResult.humanAuthorityProof;
    const authorityProofVerified = authorityProof !== null && humanModule.verifySignedObject(authorityProof);
    const authorityProofReference = authorityProof?.proofId ?? "HAP-NOT-ISSUED";

    const mandate = createMandate(scenario, authorityProofReference);
    const evidence = createProcurementEvidence(scenario.faults);
    const proposedAction: ProposedProcurementAction = {
      ...scenario.proposedAction,
      humanAuthorityProofReference: authorityProofReference,
      mandateId: mandate.mandateId,
    };
    const standingInput = createNorthstarAgentStandingFixture({
      requestIdentifier: `prototype_${scenario.scenarioId}`,
      amountMinorUnits: Math.round(proposedAction.totalAmount * 100),
      currency: proposedAction.currency,
      quantity: proposedAction.quantity,
      counterpartyIdentifier: proposedAction.supplierId,
      checkedAt: EXACT_ACTION_TRUST_GATEWAY_REFERENCE_TIME,
      disabled: scenario.agentDisabled,
    });
    if (scenario.faults?.unknownAgent) {
      standingInput.claim.agentIdentifier = proposedAction.agentId;
      standingInput.request.agentIdentifier = proposedAction.agentId;
    }
    const agentStandingReceipt = evaluateAgentStanding(standingInput);
    const exactActionInput = createExactActionInput({
      proposedAction,
      mandate,
      evidence,
      authorityProof,
    });
    const exactAction = createCanonicalActionEnvelope(exactActionInput);
    const checks = createAtgChecks({
      scenario,
      humanFixture: fixture,
      humanAuthorityResult,
      authorityProofVerified,
      agentStandingReceipt,
      mandate,
      evidence,
      proposedAction,
      exactAction,
      canonicalInputValid: scenario.faults?.malformedExactAction !== true,
      nonceStore: this.#nonceStore,
    });
    const decision: AtgPrototypeDecision = checks.every((check) => check.passed)
      ? "GATEPASS_ISSUED"
      : "ACTION_REFUSED";
    const refusal = decision === "ACTION_REFUSED"
      ? createEvaluationRefusal({ scenario, fixture, humanAuthorityResult, agentStandingReceipt, mandate, evidence, proposedAction, checks })
      : null;
    const failedReasons = checks
      .filter((check) => !check.passed)
      .map((check) => `${check.id}: ${check.reason}`);
    const issuance = decision === "GATEPASS_ISSUED"
      ? issueExactActionGatePass(exactActionInput)
      : null;
    if (issuance !== null) this.#nonceStore.registerUnused(issuance.gatePass);
    const policyDecisionReceipt = issuance?.decisionReceipt ?? createPolicyDecisionReceipt({
      decision: "refused",
      action: exactAction,
      gatePass: null,
      reasons: failedReasons.length === 0 ? ["FAIL_CLOSED_UNKNOWN_STATUS"] : failedReasons,
    });
    const runId = `atg_run_${shortDigest({ scenarioId: scenario.scenarioId, actionDigest: exactAction.actionDigest })}`;
    const receipt = createTrustReceipt({
      runId,
      scenario,
      fixture,
      authorityProof,
      authorityProofVerified,
      agentStandingReceipt,
      mandate,
      evidence,
      exactAction,
      checks,
      policyDecisionReceipt,
      decision,
      refusal,
      gatePass: issuance?.gatePass ?? null,
      execution: null,
    });
    return {
      runId,
      scenario,
      humanAuthorityResult,
      agentStandingReceipt,
      mandate,
      evidence,
      proposedAction,
      exactActionInput,
      exactAction,
      checks,
      decision,
      refusal,
      policyDecisionReceipt,
      gatePass: issuance?.gatePass ?? null,
      trustReceipt: receipt,
    };
  }

  async executeWithGatePass(
    evaluation: ExactActionPrototypeEvaluation,
    options: {
      actionPatch?: Partial<ProposedProcurementAction>;
      gatePass?: unknown;
      executedAt?: string;
    } = {},
  ): Promise<ExactActionPrototypeExecutionResult> {
    const gatePassCandidate = options.gatePass === undefined ? evaluation.gatePass : options.gatePass;
    const proposedAction = {
      ...evaluation.proposedAction,
      ...(options.actionPatch ?? {}),
    };
    const attemptedInput = patchExactActionInput(evaluation.exactActionInput, proposedAction);
    let execution: PrototypeExecutionRecord;
    if (gatePassCandidate === null || gatePassCandidate === undefined) {
      execution = blockedExecution(
        evaluation,
        proposedAction,
        "BLOCKED_NO_GATEPASS",
        ["NO_VALID_GATEPASS"],
        "No valid GatePass was supplied. No simulated purchase was executed.",
      );
    } else if (!isExactActionGatePass(gatePassCandidate)) {
      execution = blockedExecution(
        evaluation,
        proposedAction,
        "BLOCKED_INVALID_GATEPASS",
        ["MALFORMED_GATEPASS"],
        "The supplied GatePass is malformed. Execution failed closed.",
      );
    } else {
      const issuance = {
        gatePass: gatePassCandidate,
        decisionReceipt: evaluation.policyDecisionReceipt,
      };
      const executionTime = options.executedAt ?? "2026-09-02T09:01:00.000Z";
      const context = createVerifierContext(issuance, this.#nonceStore, {
        trustedClock: createFixedTrustedClock(executionTime),
      });
      const underlying = await verifyAndExecuteSimulatedAction(
        gatePassCandidate,
        attemptedInput,
        context,
        (action) => ({
          acknowledged: true,
          simulatedSideEffectReference: `synthetic-procurement://purchase/${shortDigest(action.actionDigest)}`,
        }),
      );
      execution = executionFromExactActionReceipt(evaluation, proposedAction, underlying);
    }
    const trustReceipt = recreateTrustReceipt(evaluation, execution);
    return { execution, trustReceipt };
  }

  verifyTrustReceipt(receipt: unknown): TrustReceiptVerification {
    return verifyExactActionTrustReceipt(receipt);
  }
}

export function createExactActionPrototypeScenario(
  scenarioId: ExactActionPrototypeScenarioId,
): ExactActionPrototypeScenarioInput {
  const baseAction: Omit<ProposedProcurementAction, "humanAuthorityProofReference" | "mandateId"> = {
    organisationId: NORTHSTAR_ORGANISATION_ID,
    agentId: NORTHSTAR_PROCUREMENT_AGENT_ID,
    supplierId: "SUP-HARBOUR-001",
    supplierName: "Harbour Supply Ltd",
    product: "Product X",
    category: "product_x",
    quantity: 200,
    totalAmount: scenarioId === "overspend" ? 31000 : 23750,
    currency: "GBP",
    commercialTermsReference: "TERMS-HARBOUR-NEGOTIATED-001",
    actionType: "purchase",
    jurisdiction: "GB",
    riskTier: "medium",
    timestamp: "2026-09-02T09:00:00.000Z",
    nonce: `nonce_northstar_${scenarioId}_001`,
    policyVersion: EXACT_ACTION_TRUST_GATEWAY_POLICY_VERSION,
  };
  const descriptors: Record<ExactActionPrototypeScenarioId, {
    title: string;
    description: string;
    expected: ExactActionPrototypeScenarioInput["expected"];
  }> = {
    allowed: {
      title: "Scenario A — Allowed",
      description: "£23,750 purchase within Alex Morgan's £25,000 purchasing authority.",
      expected: "allow",
    },
    overspend: {
      title: "Scenario B — Overspend",
      description: "£31,000 exceeds the human authority and mandate maximum.",
      expected: "refuse",
    },
    wrong_human_authority: {
      title: "Scenario C — Wrong Human Authority",
      description: "An active synthetic employee has research scope but no purchasing authority.",
      expected: "refuse",
    },
    expired_authority: {
      title: "Scenario D — Expired Authority",
      description: "The Human Authority Proof expires before ATG evaluation.",
      expected: "refuse",
    },
    action_tampering: {
      title: "Scenario E — Action Tampering",
      description: "ATG allows £23,750, then the execution request is changed to £24,250.",
      expected: "block_at_execution",
    },
    replay: {
      title: "Scenario F — Replay",
      description: "A valid one-use GatePass is presented again after successful simulated execution.",
      expected: "block_at_execution",
    },
    agent_standing_failure: {
      title: "Scenario G — Agent Standing Failure",
      description: "The Northstar procurement agent's signed delegation is revoked.",
      expected: "refuse",
    },
    expired_mandate: {
      title: "Control Test — Expired Mandate",
      description: "The bounded machine-readable mandate expires before ATG evaluation.",
      expected: "refuse",
    },
  };
  const descriptor = descriptors[scenarioId];
  return {
    scenarioId,
    ...descriptor,
    humanEmployeeId: scenarioId === "wrong_human_authority"
      ? "EMP-NORTHSTAR-0091"
      : "EMP-NORTHSTAR-0042",
    humanAuthenticationId: scenarioId === "wrong_human_authority"
      ? "AUTH-NORTHSTAR-JORDAN-001"
      : "AUTH-NORTHSTAR-ALEX-001",
    humanAuthorityExpiresAt: scenarioId === "expired_authority"
      ? "2026-09-02T08:59:00.000Z"
      : "2026-09-02T17:00:00.000Z",
    agentDisabled: scenarioId === "agent_standing_failure",
    mandateExpiresAt: scenarioId === "expired_mandate"
      ? "2026-09-02T08:59:00.000Z"
      : "2026-09-02T17:00:00.000Z",
    proposedAction: baseAction,
    executionMutation: scenarioId === "action_tampering" ? { totalAmount: 24250 } : null,
    faults: {},
  };
}

export async function getExactActionPrototypeScenarioPreview(
  scenarioId: ExactActionPrototypeScenarioId,
): Promise<ExactActionPrototypeScenarioPreview> {
  const scenario = createExactActionPrototypeScenario(scenarioId);
  const humanModule = await loadHumanAuthorityModule();
  const fixture = humanModule.getHumanAuthorityFixture(
    scenario.humanEmployeeId,
    scenario.humanAuthenticationId,
  );
  const mandate = createMandate(scenario, "issued-after-authority-verification");
  const { humanAuthorityProofReference: _proof, digest: _digest, ...mandatePreview } = mandate;
  return {
    scenario,
    human: fixture.employee,
    authentication: fixture.authentication,
    agent: {
      id: NORTHSTAR_PROCUREMENT_AGENT_ID,
      displayName: "Northstar Procurement Agent 04",
      standing: scenario.agentDisabled ? "revoked" : "active",
      permittedCapability: "supplier research, comparison, negotiation and simulated purchasing",
    },
    mandate: mandatePreview,
    evidence: createProcurementEvidence(),
  };
}

export function verifyExactActionTrustReceipt(receipt: unknown): TrustReceiptVerification {
  const checkedAt = EXACT_ACTION_TRUST_GATEWAY_REFERENCE_TIME;
  if (!isRecord(receipt)
    || !isRecord(receipt.integrity)
    || typeof receipt.integrity.payloadDigest !== "string"
    || typeof receipt.integrity.signature !== "string"
    || typeof receipt.integrity.keyId !== "string"
    || typeof receipt.receiptId !== "string"
    || !isRecord(receipt.exactAction)
    || typeof receipt.exactAction.actionDigest !== "string"
    || typeof receipt.exactAction.amount !== "number"
    || typeof receipt.exactAction.currency !== "string"
    || (receipt.decision !== "GATEPASS_ISSUED" && receipt.decision !== "ACTION_REFUSED")) {
    return {
      verified: false,
      receiptId: "unknown",
      checks: [{ id: "receipt_structure", passed: false, reason: "Receipt or integrity block is malformed." }],
      reasonCodes: ["MALFORMED_TRUST_RECEIPT"],
      checkedAt,
      localOnly: true,
    };
  }
  const candidate = receipt as unknown as ExactActionTrustReceipt;
  const { integrity, ...unsigned } = candidate;
  const recomputedDigest = createCanonicalPayloadHash(unsigned);
  const integrityValid = integrity.payloadDigest === recomputedDigest
    && integrity.keyId === RECEIPT_KEY.keyId
    && verifyCanonicalLocalFixturePayload(unsigned, integrity.signature, RECEIPT_KEY.publicKeyPem);
  let canonicalActionValid = false;
  try {
    canonicalActionValid = recomputeCanonicalActionDigest(candidate.exactAction) === candidate.exactAction.actionDigest;
  } catch {
    canonicalActionValid = false;
  }
  const gatePassConsistent = candidate.decision === "GATEPASS_ISSUED"
    ? isRecord(candidate.gatePass)
      && isRecord(candidate.gatePass.action)
      && candidate.gatePass.action.actionDigest === candidate.exactActionDigest
      && candidate.gatePassIssued
    : candidate.gatePass === null && !candidate.gatePassIssued;
  const executionConsistent = candidate.execution === null
    || (isRecord(candidate.execution)
      && candidate.execution.expectedActionDigest === candidate.exactActionDigest
      && candidate.execution.networkCallPerformed === false
      && candidate.execution.realOrderCreated === false
      && candidate.execution.realPaymentProcessed === false);
  const humanReadableConsistent = typeof candidate.humanReadableReceipt === "string"
    && candidate.humanReadableReceipt.includes(candidate.receiptId)
    && candidate.humanReadableReceipt.includes(candidate.exactActionDigest)
    && candidate.humanReadableReceipt.includes(candidate.decision)
    && candidate.humanReadableReceipt.includes(formatGbp(candidate.exactAction.amount ?? 0));
  const executiveSummaryConsistent = isRecord(candidate.executiveSummary)
    && candidate.executiveSummary.amount === candidate.exactAction.amount
    && candidate.executiveSummary.currency === candidate.exactAction.currency
    && candidate.executiveSummary.timestamp === candidate.generatedAt
    && candidate.executiveSummary.receiptVerificationStatus === "VERIFIED_LOCAL_FIXTURE"
    && typeof candidate.executiveSummary.whyAtgDecided === "string"
    && candidate.executiveSummary.whyAtgDecided.length > 0;
  const safetyConsistent = isRecord(candidate.safety)
    && candidate.safety.localOnly === true
    && candidate.safety.syntheticDataOnly === true
    && candidate.safety.networkCallPerformed === false
    && candidate.safety.externalApiCalled === false
    && candidate.safety.realOrderCreated === false
    && candidate.safety.realPaymentProcessed === false;
  const checks = [
    { id: "receipt_integrity", passed: integrityValid, reason: integrityValid ? "Local fixture signature and payload digest verify." : "Receipt integrity verification failed." },
    { id: "canonical_exact_action", passed: canonicalActionValid, reason: canonicalActionValid ? "Exact-action digest recomputes." : "Exact-action digest mismatch." },
    { id: "gatepass_binding", passed: gatePassConsistent, reason: gatePassConsistent ? "Decision and GatePass binding are consistent." : "Decision and GatePass binding conflict." },
    { id: "execution_evidence", passed: executionConsistent, reason: executionConsistent ? "Execution evidence is internally consistent." : "Execution evidence conflicts with the exact action or safety boundary." },
    { id: "human_readable_match", passed: humanReadableConsistent, reason: humanReadableConsistent ? "Human-readable receipt matches machine evidence." : "Human-readable receipt does not match machine evidence." },
    { id: "executive_summary_match", passed: executiveSummaryConsistent, reason: executiveSummaryConsistent ? "Executive summary matches signed machine evidence." : "Executive summary conflicts with machine evidence." },
    { id: "safety_boundary", passed: safetyConsistent, reason: safetyConsistent ? "Local synthetic no-network boundary is retained." : "Safety boundary is missing or unsafe." },
  ];
  return {
    verified: checks.every((check) => check.passed),
    receiptId: typeof candidate.receiptId === "string" ? candidate.receiptId : "unknown",
    checks,
    reasonCodes: checks.filter((check) => !check.passed).map((check) => check.id.toUpperCase()),
    checkedAt,
    localOnly: true,
  };
}

export async function runExactActionPrototypeSmoke(): Promise<ExactActionPrototypeSmokeResult> {
  const observations: ExactActionPrototypeSmokeResult["scenarios"] = [];
  for (const scenarioId of BUYER_PROTOTYPE_SCENARIOS) {
    const gateway = new ExactActionTrustGatewayPrototype();
    const evaluation = await gateway.evaluateExactAction(scenarioId);
    let executionStatus: PrototypeExecutionStatus = "NOT_ATTEMPTED";
    let passed = false;
    if (scenarioId === "allowed") {
      const result = await gateway.executeWithGatePass(evaluation);
      executionStatus = result.execution.status;
      passed = evaluation.decision === "GATEPASS_ISSUED"
        && executionStatus === "SIMULATED_PURCHASE_COMPLETED"
        && gateway.verifyTrustReceipt(result.trustReceipt).verified;
    } else if (scenarioId === "action_tampering") {
      const result = await gateway.executeWithGatePass(evaluation, {
        actionPatch: evaluation.scenario.executionMutation ?? {},
      });
      executionStatus = result.execution.status;
      passed = evaluation.decision === "GATEPASS_ISSUED"
        && executionStatus === "BLOCKED_ACTION_MISMATCH";
    } else if (scenarioId === "replay") {
      const first = await gateway.executeWithGatePass(evaluation);
      const second = await gateway.executeWithGatePass(evaluation);
      executionStatus = second.execution.status;
      passed = first.execution.status === "SIMULATED_PURCHASE_COMPLETED"
        && second.execution.status === "BLOCKED_REPLAY";
    } else {
      const result = await gateway.executeWithGatePass(evaluation);
      executionStatus = result.execution.status;
      passed = evaluation.decision === "ACTION_REFUSED"
        && evaluation.gatePass === null
        && executionStatus === "BLOCKED_NO_GATEPASS";
    }
    observations.push({
      scenarioId: scenarioId as Exclude<ExactActionPrototypeScenarioId, "expired_mandate">,
      passed,
      observed: `${evaluation.decision} / ${executionStatus}`,
      expected: evaluation.scenario.expected,
      gatePassIssued: evaluation.gatePass !== null,
      executionStatus,
    });
  }
  return {
    prototypeVersion: EXACT_ACTION_TRUST_GATEWAY_PROTOTYPE_VERSION,
    passed: observations.every((observation) => observation.passed),
    totalScenarios: observations.length,
    passedScenarios: observations.filter((observation) => observation.passed).length,
    scenarios: observations,
    networkCallPerformed: false,
  };
}

function createHumanAuthorityScenario(scenario: ExactActionPrototypeScenarioInput): Record<string, unknown> {
  return {
    id: `northstar_${scenario.scenarioId}`,
    title: scenario.title,
    expected: scenario.scenarioId === "overspend"
      || scenario.scenarioId === "wrong_human_authority"
      || scenario.scenarioId === "expired_authority"
      ? "refused"
      : "allowed",
    action: {
      actionId: `PROCURE-${scenario.scenarioId.toUpperCase()}`,
      type: "purchase",
      amount: scenario.proposedAction.totalAmount,
      currency: scenario.proposedAction.currency,
      product: scenario.proposedAction.product,
      category: scenario.proposedAction.category,
      quantity: scenario.proposedAction.quantity,
      supplierId: scenario.proposedAction.supplierId,
      accountRef: "NORTHSTAR-PROCUREMENT-GB",
      department: "Procurement",
      jurisdiction: scenario.proposedAction.jurisdiction,
      riskTier: scenario.proposedAction.riskTier,
      requestedBy: NORTHSTAR_PROCUREMENT_AGENT_ID,
      evidenceRefs: ["EVIDENCE-NORTHSTAR-PROCUREMENT-001"],
      requiresIndependentApproval: false,
      secondApprovalRequiredAbove: 25000,
    },
    approverId: scenario.humanEmployeeId,
    authId: scenario.humanAuthenticationId,
    organisationId: NORTHSTAR_ORGANISATION_ID,
    organisationName: "Northstar Retail Ltd",
    authorityPolicyId: "POLICY-NORTHSTAR-HUMAN-AUTHORITY-001",
    authorityPolicyVersion: EXACT_ACTION_TRUST_GATEWAY_POLICY_VERSION,
    authorityIssuedAt: "2026-09-02T08:55:00.000Z",
    authorityExpiresAt: scenario.humanAuthorityExpiresAt,
    validationAt: EXACT_ACTION_TRUST_GATEWAY_REFERENCE_TIME,
    authorityOnly: true,
  };
}

function createMandate(
  scenario: ExactActionPrototypeScenarioInput,
  authorityProofReference: string,
): BoundedProcurementMandate {
  const unsigned = {
    mandateId: `MANDATE-NORTHSTAR-${scenario.scenarioId.toUpperCase()}-001`,
    organisationId: NORTHSTAR_ORGANISATION_ID,
    humanAuthorityProofReference: authorityProofReference,
    humanId: scenario.humanEmployeeId,
    agentId: NORTHSTAR_PROCUREMENT_AGENT_ID,
    instruction: HUMAN_INSTRUCTION,
    permittedObjective: "Source, compare, negotiate and purchase 200 units of Product X within approved conditions.",
    permittedActionClasses: ["research", "compare", "negotiate", "purchase"] as const,
    permittedSupplierIds: ["SUP-HARBOUR-001"],
    permittedCategories: ["product_x"],
    product: "Product X" as const,
    maximumQuantity: 200 as const,
    currency: "GBP" as const,
    maximumAmount: 25000 as const,
    jurisdiction: "GB" as const,
    riskTier: "medium" as const,
    validFrom: "2026-09-02T08:55:00.000Z",
    expiresAt: scenario.mandateExpiresAt,
    evidenceRequirements: [
      "three synthetic supplier offers",
      "price, delivery and payment-term comparison",
      "negotiation record",
      "selected supplier rationale",
    ],
    status: scenario.faults?.missingMandate ? "missing" as const : "active" as const,
    policyVersion: EXACT_ACTION_TRUST_GATEWAY_POLICY_VERSION,
    synthetic: true as const,
  };
  return { ...unsigned, digest: createCanonicalPayloadHash(unsigned) };
}

function createProcurementEvidence(faults: ExactActionPrototypeFaults = {}): ProcurementEvidenceRecord {
  const offers: ProcurementOffer[] = [
    {
      offerId: "OFFER-BEACON-001",
      supplierId: "SUP-BEACON-002",
      supplierName: "Beacon Industrial Ltd",
      product: "Product X",
      quantity: 200,
      totalAmount: 24200,
      currency: "GBP",
      deliveryDays: 7,
      paymentTerms: "Net 30",
      synthetic: true,
    },
    {
      offerId: "OFFER-HARBOUR-001",
      supplierId: "SUP-HARBOUR-001",
      supplierName: "Harbour Supply Ltd",
      product: "Product X",
      quantity: 200,
      totalAmount: 24000,
      currency: "GBP",
      deliveryDays: 9,
      paymentTerms: "Net 30",
      synthetic: true,
    },
    {
      offerId: "OFFER-RIDGEWAY-001",
      supplierId: "SUP-RIDGEWAY-003",
      supplierName: "Ridgeway Components Ltd",
      product: "Product X",
      quantity: 200,
      totalAmount: 23950,
      currency: "GBP",
      deliveryDays: 14,
      paymentTerms: "Net 30",
      synthetic: true,
    },
  ];
  const unsigned = {
    evidenceId: "EVIDENCE-NORTHSTAR-PROCUREMENT-001",
    evidenceType: "synthetic_supplier_research_and_negotiation" as const,
    generatedAt: "2026-09-02T08:58:00.000Z",
    expiresAt: faults.staleEvidence ? "2026-09-02T08:59:00.000Z" : "2026-09-02T09:13:00.000Z",
    status: faults.missingEvidence ? "missing" as const : faults.staleEvidence ? "stale" as const : "present" as const,
    offersInspected: faults.missingEvidence ? [] : offers,
    comparisonSummary: "Three synthetic offers compared on price, delivery and terms. Harbour became best-value after negotiation and was the only purchase-approved supplier.",
    negotiation: {
      supplierId: "SUP-HARBOUR-001",
      openingAmount: 24000,
      finalAmount: 23750,
      currency: "GBP" as const,
      commercialTermsReference: "TERMS-HARBOUR-NEGOTIATED-001",
      outcome: "£250 reduction and payment terms improved from Net 30 to Net 45.",
    },
    selectedSupplierId: "SUP-HARBOUR-001",
    synthetic: true as const,
    networkCallPerformed: false as const,
  };
  return { ...unsigned, digest: createCanonicalPayloadHash(unsigned) };
}

function createExactActionInput(input: {
  proposedAction: ProposedProcurementAction;
  mandate: BoundedProcurementMandate;
  evidence: ProcurementEvidenceRecord;
  authorityProof: HumanAuthorityProof | null;
}): CanonicalActionEnvelopeInput {
  const action = input.proposedAction;
  return createBaseExactActionInput({
    issuerIdentity: "atg:local:northstar-exact-action-policy-authority",
    verificationProfile: "atg:local:northstar-point-of-action-verifier",
    subjectAgentIdentity: action.agentId,
    nativeSessionId: `northstar_session_${action.nonce}`,
    nativeRunId: `northstar_run_${action.nonce}`,
    operatorIdentity: input.authorityProof?.primaryApprover.employeeId ?? null,
    mandateIdentity: input.mandate.mandateId,
    mandateReference: `mandate://local/${input.mandate.mandateId}`,
    mandateDigest: input.mandate.digest,
    policyReference: `policy://local/${EXACT_ACTION_TRUST_GATEWAY_POLICY_VERSION}`,
    policyDigest: createCanonicalPayloadHash({
      policyVersion: EXACT_ACTION_TRUST_GATEWAY_POLICY_VERSION,
      coreRule: EXACT_ACTION_TRUST_GATEWAY_CORE_RULE,
    }),
    evidenceReference: `evidence://local/${input.evidence.evidenceId}`,
    evidenceDigest: input.evidence.digest,
    approvalRequired: true,
    humanApprovalReference: input.authorityProof?.proofId ?? null,
    humanApprovalDigest: input.authorityProof === null
      ? null
      : createCanonicalPayloadHash(input.authorityProof),
    toolIdentity: "local.synthetic-procurement-execution-adapter",
    toolSchemaVersion: "1.0.0",
    operationName: "simulate_procurement_purchase",
    canonicalArguments: action,
    targetIdentity: action.supplierId,
    amount: action.totalAmount,
    currency: action.currency,
    operatingEnvironment: "local_synthetic_procurement_simulation",
    issuedAt: action.timestamp,
    notBefore: action.timestamp,
    expiresAt: "2026-09-02T09:05:00.000Z",
    nonce: action.nonce,
    idempotencyKey: `idempotency_${action.nonce}`,
  });
}

function createAtgChecks(input: {
  scenario: ExactActionPrototypeScenarioInput;
  humanFixture: { employee: HumanAuthorityEmployeeFixture | null; authentication: HumanAuthenticationFixture | null };
  humanAuthorityResult: HumanAuthorityDemoResult;
  authorityProofVerified: boolean;
  agentStandingReceipt: AgentStandingDecisionReceipt;
  mandate: BoundedProcurementMandate;
  evidence: ProcurementEvidenceRecord;
  proposedAction: ProposedProcurementAction;
  exactAction: CanonicalActionEnvelope;
  canonicalInputValid: boolean;
  nonceStore: InMemoryNonceStore;
}): AtgPrototypeCheck[] {
  const now = Date.parse(EXACT_ACTION_TRUST_GATEWAY_REFERENCE_TIME);
  const employee = input.humanFixture.employee;
  const authentication = input.humanFixture.authentication;
  const permission = employee?.permissions.purchase;
  const mandate = input.mandate;
  const action = input.proposedAction;
  const proof = input.humanAuthorityResult.humanAuthorityProof;
  const identityEvidencePresent = employee !== null
    && authentication !== null
    && authentication.employeeId === employee.employeeId
    && authentication.status === "verified"
    && authentication.userPresence
    && authentication.userVerification;
  const authorityValid = input.humanAuthorityResult.decision.outcome === "ALLOWED"
    && proof !== null
    && input.authorityProofVerified
    && permission !== undefined;
  const mandatePresent = mandate.status !== "missing" && mandate.mandateId.trim() !== "" && mandate.digest.trim() !== "";
  const mandateCurrent = mandate.status === "active"
    && Date.parse(mandate.validFrom) <= now
    && Date.parse(mandate.expiresAt) > now;
  const supplierAndCategoryPermitted = mandate.permittedSupplierIds.includes(action.supplierId)
    && mandate.permittedCategories.includes(action.category)
    && permission?.permittedSuppliers?.includes(action.supplierId) === true
    && permission.permittedCategories?.includes(action.category) === true;
  const evidencePresentAndFresh = input.evidence.status === "present"
    && input.evidence.offersInspected.length === 3
    && input.evidence.digest.trim() !== ""
    && Date.parse(input.evidence.generatedAt) <= now
    && Date.parse(input.evidence.expiresAt) > now;
  const canonicalValid = input.canonicalInputValid
    && recomputeCanonicalActionDigest(input.exactAction) === input.exactAction.actionDigest;
  const exactBindingValid = canonicalValid
    && proof !== null
    && input.exactAction.humanApprovalReference === proof.proofId
    && input.exactAction.mandateIdentity === mandate.mandateId
    && input.exactAction.subjectAgentIdentity === action.agentId
    && input.exactAction.targetIdentity === action.supplierId
    && input.exactAction.amount === action.totalAmount;
  const firstFifteen = [
    identityEvidencePresent,
    employee?.status === "active" && (employee.appointmentStatus ?? "active") === "active",
    authorityValid,
    proof !== null && Date.parse(proof.expiresAt) > now,
    input.agentStandingReceipt.outcome === "STANDING_VERIFIED",
    mandatePresent,
    mandateCurrent,
    (mandate.permittedActionClasses as readonly string[]).includes(action.actionType) && mandate.product === action.product,
    supplierAndCategoryPermitted,
    action.quantity > 0 && action.quantity <= mandate.maximumQuantity,
    permission !== undefined && action.totalAmount <= mandate.maximumAmount && action.totalAmount <= permission.maxAmount,
    action.currency === mandate.currency && permission?.currency === action.currency,
    action.jurisdiction === mandate.jurisdiction && permission?.jurisdiction === action.jurisdiction,
    action.riskTier === mandate.riskTier && permission?.riskTiers?.includes(action.riskTier) === true,
    evidencePresentAndFresh,
  ];
  const values = [
    ...firstFifteen,
    firstFifteen.every(Boolean) && action.policyVersion === EXACT_ACTION_TRUST_GATEWAY_POLICY_VERSION,
    canonicalValid,
    exactBindingValid,
    input.nonceStore.get(action.nonce) === null,
    input.nonceStore.get(action.nonce) === null,
  ];
  const labels = [
    ["human_identity_evidence", "Human identity evidence present", "Verified synthetic authentication evidence is required."],
    ["human_active", "Human active / employed / appointed", "The human must be currently active and appointed."],
    ["human_authority", "Exact human authority valid", input.humanAuthorityResult.decision.message],
    ["human_authority_fresh", "Human authority not expired", proof === null ? "No Human Authority Proof was issued." : `Authority expires at ${proof.expiresAt}.`],
    ["agent_standing", "Agent standing valid", input.agentStandingReceipt.reasonCodes.join(", ")],
    ["mandate_present", "Mandate present", "A machine-readable bounded mandate is required."],
    ["mandate_fresh", "Mandate not expired", `Mandate expires at ${mandate.expiresAt}.`],
    ["action_scope", "Proposed action within scope", "Purchase action and Product X must be within the mandate."],
    ["supplier_category", "Supplier / category permitted", "Both mandate and human authority must permit the supplier and category."],
    ["quantity", "Quantity permitted", `Requested ${action.quantity}; maximum ${mandate.maximumQuantity}.`],
    ["amount", "Amount within £25,000 maximum", `Requested ${formatGbp(action.totalAmount)}; authorised maximum ${formatGbp(mandate.maximumAmount)}.`],
    ["currency", "Correct currency", `Requested ${action.currency}; required ${mandate.currency}.`],
    ["jurisdiction", "Correct jurisdiction", `Requested ${action.jurisdiction}; required ${mandate.jurisdiction}.`],
    ["risk_tier", "Risk-tier permission", `Requested ${action.riskTier}; permitted ${mandate.riskTier}.`],
    ["evidence", "Evidence present and fresh", `Evidence ${input.evidence.evidenceId} expires at ${input.evidence.expiresAt}.`],
    ["policy", "Policy decision permits action", action.policyVersion === EXACT_ACTION_TRUST_GATEWAY_POLICY_VERSION
      ? EXACT_ACTION_TRUST_GATEWAY_CORE_RULE
      : `Requested ${action.policyVersion}; required ${EXACT_ACTION_TRUST_GATEWAY_POLICY_VERSION}.`],
    ["canonicalisation", "Exact action canonicalisation valid", input.canonicalInputValid
      ? `Existing ATG canonical envelope digest ${input.exactAction.actionDigest}.`
      : "The exact action failed required schema/canonical input validation."],
    ["digest_binding", "Exact digest bound", "Human proof, mandate, agent, supplier and amount must match the canonical envelope."],
    ["nonce_fresh", "Nonce fresh", `Nonce ${action.nonce} must be unused.`],
    ["gatepass_replay", "GatePass not replayed", "A new one-use GatePass may be issued only for an unused nonce."],
  ] as const;
  return labels.map(([id, label, reason], index) => ({
    ordinal: index + 1,
    id,
    label,
    status: values[index] === true ? "PASS" : "BLOCK",
    passed: values[index] === true,
    reason,
  }));
}

function createEvaluationRefusal(input: {
  scenario: ExactActionPrototypeScenarioInput;
  fixture: { employee: HumanAuthorityEmployeeFixture | null; authentication: HumanAuthenticationFixture | null };
  humanAuthorityResult: HumanAuthorityDemoResult;
  agentStandingReceipt: AgentStandingDecisionReceipt;
  mandate: BoundedProcurementMandate;
  evidence: ProcurementEvidenceRecord;
  proposedAction: ProposedProcurementAction;
  checks: AtgPrototypeCheck[];
}): StructuredPrototypeRefusal {
  const action = input.proposedAction;
  const permission = input.fixture.employee?.permissions.purchase;
  let primary: PrototypePrimaryFailure;
  const humanCode = input.humanAuthorityResult.decision.code;

  if (input.scenario.faults?.malformedExactAction) {
    primary = primaryFailure("MALFORMED_EXACT_ACTION", "The exact proposed action is malformed and cannot be canonicalised safely.", "Exact action", "malformed", "Malformed", "Required shape", "valid canonical action", "Valid canonical action", { canonicalInputValid: false });
  } else if (input.fixture.employee === null) {
    primary = primaryFailure("UNKNOWN_HUMAN", "The claimed human identity is unknown, so no authority can be verified.", "Human ID", input.scenario.humanEmployeeId, input.scenario.humanEmployeeId, "Known human", null, "Required", { humanEmployeeId: input.scenario.humanEmployeeId });
  } else if (input.scenario.faults?.missingHumanAuthorityProof) {
    primary = primaryFailure("HUMAN_AUTHORITY_PROOF_MISSING", "The required Human Authority Proof is missing.", "Human Authority Proof", null, "Missing", "Required proof", null, "Present and verified", { proofPresent: false });
  } else if (humanCode === "HUMAN_PROOF_EXPIRED") {
    primary = primaryFailure("AUTHORITY_EXPIRED", "The verified human authority expired before this action was evaluated.", "Authority expiry", input.scenario.humanAuthorityExpiresAt, input.scenario.humanAuthorityExpiresAt, "Evaluation time", EXACT_ACTION_TRUST_GATEWAY_REFERENCE_TIME, EXACT_ACTION_TRUST_GATEWAY_REFERENCE_TIME, { expiresAt: input.scenario.humanAuthorityExpiresAt, evaluatedAt: EXACT_ACTION_TRUST_GATEWAY_REFERENCE_TIME });
  } else if (humanCode === "AUTHORITY_LIMIT_EXCEEDED") {
    primary = primaryFailure("AUTHORITY_LIMIT_EXCEEDED", "Requested action exceeds verified human purchasing authority.", "Requested", action.totalAmount, formatGbp(action.totalAmount), "Authorised maximum", permission?.maxAmount ?? input.mandate.maximumAmount, formatGbp(permission?.maxAmount ?? input.mandate.maximumAmount), { requestedAmount: action.totalAmount, authorisedMaximum: permission?.maxAmount ?? input.mandate.maximumAmount, currency: action.currency });
  } else if (humanCode === "SUPPLIER_NOT_AUTHORISED") {
    primary = primaryFailure("SUPPLIER_NOT_PERMITTED", "The requested supplier is outside verified human and mandate authority.", "Requested supplier", action.supplierId, action.supplierName, "Permitted supplier", input.mandate.permittedSupplierIds.join(", "), input.mandate.permittedSupplierIds.join(", "), { requestedSupplierId: action.supplierId });
  } else if (humanCode === "CATEGORY_NOT_AUTHORISED") {
    primary = primaryFailure("PRODUCT_CATEGORY_NOT_PERMITTED", "The requested product or category is outside verified human and mandate authority.", "Requested product/category", `${action.product} / ${action.category}`, `${action.product} / ${action.category}`, "Permitted product/category", `${input.mandate.product} / ${input.mandate.permittedCategories.join(", ")}`, `${input.mandate.product} / ${input.mandate.permittedCategories.join(", ")}`, { product: action.product, category: action.category });
  } else if (humanCode === "CURRENCY_NOT_AUTHORISED") {
    primary = primaryFailure("CURRENCY_NOT_PERMITTED", "The requested currency is outside verified authority and mandate scope.", "Requested currency", action.currency, action.currency, "Permitted currency", input.mandate.currency, input.mandate.currency, { requestedCurrency: action.currency, permittedCurrency: input.mandate.currency });
  } else if (humanCode === "JURISDICTION_NOT_AUTHORISED") {
    primary = primaryFailure("JURISDICTION_NOT_PERMITTED", "The requested jurisdiction is outside verified authority and mandate scope.", "Requested jurisdiction", action.jurisdiction, action.jurisdiction, "Permitted jurisdiction", input.mandate.jurisdiction, input.mandate.jurisdiction, { requestedJurisdiction: action.jurisdiction, permittedJurisdiction: input.mandate.jurisdiction });
  } else if (humanCode === "RISK_TIER_NOT_AUTHORISED") {
    primary = primaryFailure("RISK_TIER_NOT_PERMITTED", "The requested risk tier is outside verified authority and mandate scope.", "Requested risk tier", action.riskTier, action.riskTier, "Permitted risk tier", input.mandate.riskTier, input.mandate.riskTier, { requestedRiskTier: action.riskTier, permittedRiskTier: input.mandate.riskTier });
  } else if (humanCode !== "VERIFIED_HUMAN_AUTHORITY") {
    primary = primaryFailure("HUMAN_NOT_AUTHORISED", input.humanAuthorityResult.decision.message || "The human does not possess the required purchasing authority.", "Human", input.scenario.humanEmployeeId, input.fixture.employee.displayName, "Required authority", "supplier_purchase", "Supplier purchasing authority", { humanDecisionCode: humanCode });
  } else if (input.scenario.faults?.unknownAgent) {
    primary = primaryFailure("UNKNOWN_AGENT", "The claimed agent is not present in the trusted standing registry.", "Agent ID", action.agentId, action.agentId, "Known standing", null, "Required", { agentId: action.agentId });
  } else if (input.agentStandingReceipt.outcome !== "STANDING_VERIFIED") {
    primary = primaryFailure("AGENT_STANDING_INVALID", "The agent's standing is disabled, revoked, expired, or otherwise invalid.", "Agent standing", input.agentStandingReceipt.outcome, input.agentStandingReceipt.outcome, "Required standing", "STANDING_VERIFIED", "VERIFIED", { agentId: action.agentId, reasonCodes: input.agentStandingReceipt.reasonCodes.join(",") });
  } else if (input.mandate.status === "missing") {
    primary = primaryFailure("MANDATE_MISSING", "The required bounded mandate is missing.", "Mandate", null, "Missing", "Required mandate", null, "Present and valid", { mandatePresent: false });
  } else if (Date.parse(input.mandate.expiresAt) <= Date.parse(EXACT_ACTION_TRUST_GATEWAY_REFERENCE_TIME)) {
    primary = primaryFailure("MANDATE_EXPIRED", "The bounded mandate expired before this action was evaluated.", "Mandate expiry", input.mandate.expiresAt, input.mandate.expiresAt, "Evaluation time", EXACT_ACTION_TRUST_GATEWAY_REFERENCE_TIME, EXACT_ACTION_TRUST_GATEWAY_REFERENCE_TIME, { mandateId: input.mandate.mandateId });
  } else if (action.actionType !== "purchase" || action.product !== input.mandate.product || !input.mandate.permittedCategories.includes(action.category)) {
    primary = primaryFailure("PRODUCT_CATEGORY_NOT_PERMITTED", "The requested action, product, or category is outside the bounded mandate.", "Requested action/product/category", `${action.actionType} / ${action.product} / ${action.category}`, `${action.actionType} / ${action.product} / ${action.category}`, "Permitted", `purchase / ${input.mandate.product} / ${input.mandate.permittedCategories.join(", ")}`, `purchase / ${input.mandate.product} / ${input.mandate.permittedCategories.join(", ")}`, { actionType: action.actionType, product: action.product, category: action.category });
  } else if (!input.mandate.permittedSupplierIds.includes(action.supplierId)) {
    primary = primaryFailure("SUPPLIER_NOT_PERMITTED", "The requested supplier is outside the bounded mandate.", "Requested supplier", action.supplierId, action.supplierName, "Permitted supplier", input.mandate.permittedSupplierIds.join(", "), input.mandate.permittedSupplierIds.join(", "), { requestedSupplierId: action.supplierId });
  } else if (action.quantity <= 0 || action.quantity > input.mandate.maximumQuantity) {
    primary = primaryFailure("QUANTITY_NOT_PERMITTED", "The requested quantity is outside the bounded mandate.", "Requested quantity", action.quantity, String(action.quantity), "Permitted maximum", input.mandate.maximumQuantity, String(input.mandate.maximumQuantity), { requestedQuantity: action.quantity, maximumQuantity: input.mandate.maximumQuantity });
  } else if (input.evidence.status !== "present" || input.evidence.offersInspected.length !== 3) {
    primary = primaryFailure("EVIDENCE_INVALID", input.evidence.status === "stale" ? "The required procurement evidence is stale." : "The required procurement evidence is missing or incomplete.", "Evidence status", input.evidence.status, input.evidence.status.toUpperCase(), "Required evidence", "present_and_fresh", "PRESENT AND FRESH", { evidenceId: input.evidence.evidenceId, evidenceStatus: input.evidence.status });
  } else if (action.policyVersion !== EXACT_ACTION_TRUST_GATEWAY_POLICY_VERSION) {
    primary = primaryFailure("POLICY_VERSION_MISMATCH", "The action names a policy version that is not the active policy.", "Requested policy", action.policyVersion, action.policyVersion, "Active policy", EXACT_ACTION_TRUST_GATEWAY_POLICY_VERSION, EXACT_ACTION_TRUST_GATEWAY_POLICY_VERSION, { requestedPolicyVersion: action.policyVersion });
  } else {
    const first = input.checks.find((check) => !check.passed);
    primary = primaryFailure("UNKNOWN_FAILURE", first?.reason ?? "An unknown or unsafe state prevented approval.", first?.label ?? "Unknown state", null, first?.reason ?? "Unknown", "Required", null, "Verified safe state", { failClosed: true });
  }
  return structuredRefusal(primary, input.checks, "ACTION_REFUSED", false);
}

function createExecutionRefusal(execution: PrototypeExecutionRecord, checks: AtgPrototypeCheck[]): StructuredPrototypeRefusal {
  const code: PrototypePrimaryFailureCode = execution.status === "BLOCKED_ACTION_MISMATCH"
    ? execution.reasonCodes.some((reason) => reason.includes("NONCE")) ? "NONCE_MISMATCH" : "EXACT_ACTION_MISMATCH"
    : execution.status === "BLOCKED_REPLAY" ? "GATEPASS_REPLAY"
      : execution.status === "BLOCKED_EXPIRED_GATEPASS" ? "GATEPASS_EXPIRED"
        : execution.status === "BLOCKED_NO_GATEPASS" ? "GATEPASS_MISSING"
          : execution.reasonCodes.some((reason) => reason.includes("SIGNATURE")) ? "GATEPASS_INVALID_SIGNATURE"
            : execution.reasonCodes.includes("MALFORMED_GATEPASS") ? "GATEPASS_MALFORMED"
              : "UNKNOWN_FAILURE";
  const summaries: Record<PrototypePrimaryFailureCode, string> = {
    EXACT_ACTION_MISMATCH: "The presented GatePass does not bind the exact action requested at execution.",
    NONCE_MISMATCH: "The execution nonce does not match the one-use GatePass binding.",
    GATEPASS_REPLAY: "The GatePass was already consumed; replay was refused.",
    GATEPASS_EXPIRED: "The GatePass expired before execution was attempted.",
    GATEPASS_MISSING: "No GatePass was supplied, so execution cannot proceed.",
    GATEPASS_INVALID_SIGNATURE: "The GatePass signature did not verify.",
    GATEPASS_MALFORMED: "The supplied GatePass is malformed.",
    UNKNOWN_FAILURE: execution.reason,
    AUTHORITY_LIMIT_EXCEEDED: execution.reason, HUMAN_NOT_AUTHORISED: execution.reason,
    AUTHORITY_EXPIRED: execution.reason, AGENT_STANDING_INVALID: execution.reason,
    MANDATE_EXPIRED: execution.reason, EVIDENCE_INVALID: execution.reason,
    MANDATE_MISSING: execution.reason, HUMAN_AUTHORITY_PROOF_MISSING: execution.reason,
    MALFORMED_EXACT_ACTION: execution.reason, UNKNOWN_AGENT: execution.reason,
    UNKNOWN_HUMAN: execution.reason, SUPPLIER_NOT_PERMITTED: execution.reason,
    PRODUCT_CATEGORY_NOT_PERMITTED: execution.reason, CURRENCY_NOT_PERMITTED: execution.reason,
    JURISDICTION_NOT_PERMITTED: execution.reason, RISK_TIER_NOT_PERMITTED: execution.reason,
    QUANTITY_NOT_PERMITTED: execution.reason, POLICY_VERSION_MISMATCH: execution.reason,
  };
  const primary = primaryFailure(code, summaries[code], "Presented action digest", execution.proposedActionDigest, execution.proposedActionDigest, "GatePass-bound digest", execution.expectedActionDigest, execution.expectedActionDigest, { gatePassId: execution.gatePassId, gatePassConsumed: execution.gatePassConsumed });
  return structuredRefusal(primary, checks, "EXECUTION_BLOCKED", true);
}

function primaryFailure(
  code: PrototypePrimaryFailureCode,
  summary: string,
  requestedLabel: string | null,
  requestedValue: string | number | null,
  requestedDisplay: string | null,
  permittedLabel: string | null,
  permittedValue: string | number | null,
  permittedDisplay: string | null,
  relevantValues: Record<string, string | number | boolean | null>,
): PrototypePrimaryFailure {
  return { code, summary, requestedLabel, requestedValue, requestedDisplay, permittedLabel, permittedValue, permittedDisplay, relevantValues };
}

function structuredRefusal(
  primary: PrototypePrimaryFailure,
  checks: AtgPrototypeCheck[],
  decision: StructuredPrototypeRefusal["decision"],
  gatePassIssued: boolean,
): StructuredPrototypeRefusal {
  return {
    primaryFailure: primary,
    primaryFailureCode: primary.code,
    primaryFailureSummary: primary.summary,
    failedChecks: checks.filter((check) => !check.passed).map(({ id, label, reason }) => ({ id, label, reason })),
    consequentialBlocks: [
      "Policy cannot permit execution.",
      gatePassIssued ? "The issued GatePass cannot authorise this execution attempt." : "GatePass cannot be issued.",
      "Execution remains blocked.",
    ],
    decision,
    gatePassIssued,
    executionPermitted: false,
  };
}

function patchExactActionInput(
  original: CanonicalActionEnvelopeInput,
  proposedAction: ProposedProcurementAction,
): CanonicalActionEnvelopeInput {
  return {
    ...original,
    mandateIdentity: proposedAction.mandateId,
    subjectAgentIdentity: proposedAction.agentId,
    targetIdentity: proposedAction.supplierId,
    amount: proposedAction.totalAmount,
    currency: proposedAction.currency,
    operationName: proposedAction.actionType === "purchase"
      ? "simulate_procurement_purchase"
      : proposedAction.actionType,
    canonicalArguments: proposedAction,
    nativeSessionId: `northstar_session_${proposedAction.nonce}`,
    nativeRunId: `northstar_run_${proposedAction.nonce}`,
    issuedAt: proposedAction.timestamp,
    notBefore: proposedAction.timestamp,
    nonce: proposedAction.nonce,
    idempotencyKey: `idempotency_${proposedAction.nonce}`,
  };
}

function executionFromExactActionReceipt(
  evaluation: ExactActionPrototypeEvaluation,
  action: ProposedProcurementAction,
  receipt: ExecutionReceipt,
): PrototypeExecutionRecord {
  const status: PrototypeExecutionStatus = receipt.resultStatus === "executed"
    ? "SIMULATED_PURCHASE_COMPLETED"
    : receipt.resultStatus === "action_mismatch"
      ? "BLOCKED_ACTION_MISMATCH"
      : receipt.resultStatus === "replay_rejected"
        ? "BLOCKED_REPLAY"
        : receipt.resultStatus === "expired_before_execution"
          ? "BLOCKED_EXPIRED_GATEPASS"
          : "BLOCKED_INVALID_GATEPASS";
  const reason = status === "SIMULATED_PURCHASE_COMPLETED"
    ? "Valid one-use GatePass exactly matched the action. The local procurement adapter recorded a simulated purchase."
    : status === "BLOCKED_ACTION_MISMATCH"
      ? "The action changed after GatePass issuance. Exact-action binding blocked execution."
      : status === "BLOCKED_REPLAY"
        ? "GatePass already consumed / replay refused."
        : status === "BLOCKED_EXPIRED_GATEPASS"
          ? "The GatePass expired before execution."
          : receipt.safeFailureDetail ?? "GatePass verification failed closed.";
  const reasonCodes = action.nonce !== evaluation.proposedAction.nonce
    ? ["NONCE_MISMATCH", ...receipt.reasonCodes]
    : receipt.reasonCodes.length === 0 ? ["SIMULATED_EXECUTION_COMPLETED"] : [...receipt.reasonCodes];
  return {
    receiptVersion: "atg.simulated-procurement-execution-receipt.local.v1",
    receiptId: `simulated_execution_${shortDigest({ gatePassId: receipt.gatePassId, status, proposed: receipt.verification.proposedActionDigest })}`,
    status,
    gatePassId: receipt.gatePassId,
    expectedActionDigest: evaluation.exactAction.actionDigest,
    proposedActionDigest: receipt.verification.proposedActionDigest,
    supplierId: action.supplierId,
    supplierName: action.supplierName,
    quantity: action.quantity,
    totalAmount: action.totalAmount,
    currency: action.currency,
    executedAt: status === "SIMULATED_PURCHASE_COMPLETED"
      ? receipt.executionAcknowledgementTimestamp
      : null,
    simulatedPurchaseReference: receipt.simulatedSideEffectReference,
    gatePassConsumed: receipt.verification.nonceConsumed,
    reasonCodes,
    reason,
    underlyingExactActionReceipt: receipt,
    simulatedOnly: true,
    networkCallPerformed: false,
    externalApiCalled: false,
    realOrderCreated: false,
    realPaymentProcessed: false,
  };
}

function blockedExecution(
  evaluation: ExactActionPrototypeEvaluation,
  action: ProposedProcurementAction,
  status: PrototypeExecutionStatus,
  reasonCodes: string[],
  reason: string,
): PrototypeExecutionRecord {
  return {
    receiptVersion: "atg.simulated-procurement-execution-receipt.local.v1",
    receiptId: `simulated_execution_${shortDigest({ runId: evaluation.runId, status, reasonCodes })}`,
    status,
    gatePassId: null,
    expectedActionDigest: evaluation.exactAction.actionDigest,
    proposedActionDigest: createCanonicalActionEnvelope(patchExactActionInput(
      evaluation.exactActionInput,
      action,
    )).actionDigest,
    supplierId: action.supplierId,
    supplierName: action.supplierName,
    quantity: action.quantity,
    totalAmount: action.totalAmount,
    currency: action.currency,
    executedAt: null,
    simulatedPurchaseReference: null,
    gatePassConsumed: false,
    reasonCodes,
    reason,
    underlyingExactActionReceipt: null,
    simulatedOnly: true,
    networkCallPerformed: false,
    externalApiCalled: false,
    realOrderCreated: false,
    realPaymentProcessed: false,
  };
}

function createTrustReceipt(input: {
  runId: string;
  scenario: ExactActionPrototypeScenarioInput;
  fixture: { employee: HumanAuthorityEmployeeFixture | null; authentication: HumanAuthenticationFixture | null };
  authorityProof: HumanAuthorityProof | null;
  authorityProofVerified: boolean;
  agentStandingReceipt: AgentStandingDecisionReceipt;
  mandate: BoundedProcurementMandate;
  evidence: ProcurementEvidenceRecord;
  exactAction: CanonicalActionEnvelope;
  checks: AtgPrototypeCheck[];
  policyDecisionReceipt: PolicyDecisionReceipt;
  decision: AtgPrototypeDecision;
  refusal: StructuredPrototypeRefusal | null;
  gatePass: ExactActionGatePass | null;
  execution: PrototypeExecutionRecord | null;
}): ExactActionTrustReceipt {
  const generatedAt = input.execution?.executedAt
    ?? input.execution?.underlyingExactActionReceipt?.verificationTimestamp
    ?? EXACT_ACTION_TRUST_GATEWAY_REFERENCE_TIME;
  const receiptId = `trust_receipt_${shortDigest({
    runId: input.runId,
    decision: input.decision,
    execution: input.execution?.status ?? "NOT_ATTEMPTED",
  })}`;
  const refusal = input.refusal ?? (input.execution !== null
    && input.execution.status !== "SIMULATED_PURCHASE_COMPLETED"
      ? createExecutionRefusal(input.execution, input.checks)
      : null);
  const action = input.exactAction.canonicalArguments as unknown as ProposedProcurementAction;
  const executionStatus = input.execution?.status ?? "NOT_ATTEMPTED";
  const executiveSummary: ReceiptExecutiveSummary = {
    whoAuthorized: input.fixture.employee?.displayName ?? "Unknown human",
    organisation: "Northstar Retail Ltd (SYNTHETIC / FICTIONAL)",
    whichAgent: "Northstar Procurement Agent 04",
    exactAction: `${action.actionType} ${action.quantity} units of ${action.product} from ${action.supplierName}`,
    amount: action.totalAmount,
    currency: action.currency,
    whyAtgDecided: refusal?.primaryFailureSummary
      ?? "Every required authority, standing, mandate, evidence, policy, canonicalisation, binding, freshness and replay check passed.",
    decision: refusal?.decision === "EXECUTION_BLOCKED" ? "EXECUTION_BLOCKED" : input.decision,
    gatePassStatus: executionStatus === "SIMULATED_PURCHASE_COMPLETED" ? "CONSUMED"
      : executionStatus === "BLOCKED_REPLAY" ? "REPLAY_REFUSED"
        : refusal?.decision === "EXECUTION_BLOCKED" ? "EXECUTION_BLOCKED"
          : input.gatePass === null ? "NOT_ISSUED" : "ISSUED",
    executionStatus,
    timestamp: generatedAt,
    receiptVerificationStatus: "VERIFIED_LOCAL_FIXTURE",
  };
  const base = {
    receiptVersion: EXACT_ACTION_TRUST_GATEWAY_RECEIPT_VERSION,
    receiptId,
    prototypeVersion: EXACT_ACTION_TRUST_GATEWAY_PROTOTYPE_VERSION,
    prototypeStatus: EXACT_ACTION_TRUST_GATEWAY_STATUS,
    scenarioId: input.scenario.scenarioId,
    runId: input.runId,
    generatedAt,
    organisation: { id: NORTHSTAR_ORGANISATION_ID, name: "Northstar Retail Ltd" as const, synthetic: true as const },
    human: {
      employee: input.fixture.employee,
      authentication: input.fixture.authentication,
      authorityProof: input.authorityProof,
      authorityProofVerified: input.authorityProofVerified,
      authorityProofReference: input.authorityProof?.proofId ?? null,
      authorityProofDigest: input.authorityProof === null ? null : createCanonicalPayloadHash(input.authorityProof),
    },
    agent: {
      id: NORTHSTAR_PROCUREMENT_AGENT_ID,
      displayName: "Northstar Procurement Agent 04" as const,
      standing: input.agentStandingReceipt,
      permittedCapability: "supplier research, comparison, negotiation and simulated purchasing" as const,
    },
    mandate: input.mandate,
    evidence: input.evidence,
    exactAction: input.exactAction,
    checks: input.checks,
    policyDecision: input.policyDecisionReceipt,
    decision: input.decision,
    refusal,
    executiveSummary,
    gatePass: input.gatePass,
    gatePassIssued: input.gatePass !== null,
    exactActionDigest: input.exactAction.actionDigest,
    executionPermitted: input.gatePass !== null
      && (input.execution === null || input.execution.status === "SIMULATED_PURCHASE_COMPLETED"),
    execution: input.execution,
    auditResult: input.execution?.status === "SIMULATED_PURCHASE_COMPLETED"
      ? "Exact authorised human and exact agent action trace retained."
      : input.decision === "ACTION_REFUSED"
        ? "Refusal evidence retained; no GatePass issued and no purchase executed."
        : input.execution === null
          ? "Exact-action GatePass issued; execution has not yet been attempted."
          : "Execution block evidence retained; no purchase executed.",
    safety: SAFETY,
  };
  const humanReadableReceipt = renderHumanReadableReceipt(base);
  const unsigned = { ...base, humanReadableReceipt };
  const payloadDigest = createCanonicalPayloadHash(unsigned);
  return {
    ...unsigned,
    integrity: {
      algorithm: "sha256+ed25519-local-fixture",
      payloadDigest,
      signature: signCanonicalLocalFixturePayload(unsigned, RECEIPT_KEY),
      keyId: RECEIPT_KEY.keyId,
      localFixtureOnly: true,
      productionKeyCustody: false,
    },
  };
}

function recreateTrustReceipt(
  evaluation: ExactActionPrototypeEvaluation,
  execution: PrototypeExecutionRecord,
): ExactActionTrustReceipt {
  return createTrustReceipt({
    runId: evaluation.runId,
    scenario: evaluation.scenario,
    fixture: {
      employee: evaluation.trustReceipt.human.employee,
      authentication: evaluation.trustReceipt.human.authentication,
    },
    authorityProof: evaluation.trustReceipt.human.authorityProof,
    authorityProofVerified: evaluation.trustReceipt.human.authorityProofVerified,
    agentStandingReceipt: evaluation.agentStandingReceipt,
    mandate: evaluation.mandate,
    evidence: evaluation.evidence,
    exactAction: evaluation.exactAction,
    checks: evaluation.checks,
    policyDecisionReceipt: evaluation.policyDecisionReceipt,
    decision: evaluation.decision,
    refusal: evaluation.refusal,
    gatePass: evaluation.gatePass,
    execution,
  });
}

function renderHumanReadableReceipt(input: Omit<ExactActionTrustReceipt, "humanReadableReceipt" | "integrity">): string {
  const employee = input.human.employee;
  const action = input.exactAction.canonicalArguments as unknown as ProposedProcurementAction;
  const failedChecks = input.checks.filter((check) => !check.passed);
  const executionStatus = input.execution?.status ?? "NOT_ATTEMPTED";
  return [
    "AGENT TRUST GATE™",
    "EXACT ACTION TRUST RECEIPT",
    `Receipt: ${input.receiptId}`,
    `Status: ${EXACT_ACTION_TRUST_GATEWAY_STATUS}`,
    "",
    "EXECUTIVE SUMMARY",
    `Who authorised it: ${input.executiveSummary.whoAuthorized}`,
    `Organisation: ${input.executiveSummary.organisation}`,
    `Which agent acted: ${input.executiveSummary.whichAgent}`,
    `Exact action: ${input.executiveSummary.exactAction}`,
    `Amount: ${formatCurrency(input.executiveSummary.amount, input.executiveSummary.currency)} ${input.executiveSummary.currency}`,
    `Why ATG decided: ${input.executiveSummary.whyAtgDecided}`,
    `Decision: ${input.executiveSummary.decision}`,
    `GatePass status: ${input.executiveSummary.gatePassStatus}`,
    `Execution status: ${input.executiveSummary.executionStatus}`,
    `Timestamp: ${input.executiveSummary.timestamp}`,
    `Receipt verification status: ${input.executiveSummary.receiptVerificationStatus}`,
    ...(input.refusal === null ? [] : [
      "",
      input.refusal.decision === "ACTION_REFUSED" ? "ACTION REFUSED" : "EXECUTION BLOCKED",
      input.refusal.decision === "ACTION_REFUSED" ? "WHY ATG BLOCKED THIS ACTION" : "WHY ATG BLOCKED EXECUTION",
      `Primary reason [${input.refusal.primaryFailureCode}]: ${input.refusal.primaryFailureSummary}`,
      ...(input.refusal.primaryFailure.requestedDisplay === null ? [] : [`${input.refusal.primaryFailure.requestedLabel ?? "Requested"}: ${input.refusal.primaryFailure.requestedDisplay}`]),
      ...(input.refusal.primaryFailure.permittedDisplay === null ? [] : [`${input.refusal.primaryFailure.permittedLabel ?? "Permitted"}: ${input.refusal.primaryFailure.permittedDisplay}`]),
      `GatePass: ${input.refusal.gatePassIssued ? "ISSUED BUT NOT VALID FOR THIS EXECUTION" : "NOT ISSUED"}`,
      "Execution: BLOCKED",
      ...(input.refusal.decision === "ACTION_REFUSED" ? ["No GatePass issued.", "No purchase executed."] : []),
      "Consequential blocks:",
      ...input.refusal.consequentialBlocks.map((item) => `- ${item}`),
    ]),
    "",
    "FULL AUDIT DETAIL",
    "",
    "Human authority:",
    `${employee?.displayName ?? "Unknown human"}`,
    `${employee?.role ?? "Unknown role"}`,
    "Northstar Retail Ltd (SYNTHETIC / FICTIONAL)",
    "",
    "Authority:",
    employee?.permissions.purchase === undefined
      ? "No supplier purchasing authority"
      : `Supplier purchasing up to ${formatGbp(employee.permissions.purchase.maxAmount)}`,
    `Human Authority Proof: ${input.human.authorityProofVerified ? "VERIFIED" : "NOT VERIFIED"}`,
    "",
    "Agent:",
    `${input.agent.displayName} (${input.agent.id})`,
    `Agent Standing: ${input.agent.standing.outcome === "STANDING_VERIFIED" ? "VERIFIED" : "NOT VERIFIED"}`,
    "",
    "Mandate:",
    "Source, compare and negotiate 200 units of Product X",
    "Purchase permitted up to £25,000 subject to ATG approval",
    `Mandate ID: ${input.mandate.mandateId}`,
    "",
    "Agent work:",
    `${input.evidence.offersInspected.length} synthetic supplier offers inspected`,
    input.evidence.negotiation.outcome,
    `Evidence: ${input.evidence.evidenceId} / VALID`,
    "",
    "Proposed purchase:",
    `${action.supplierName} (${action.supplierId})`,
    `${action.quantity} units of ${action.product}`,
    `${formatCurrency(action.totalAmount, action.currency)} ${action.currency}`,
    `Policy: ${action.policyVersion}`,
    `Exact-action digest: ${input.exactActionDigest}`,
    "",
    "ATG checks:",
    ...input.checks.map((check) => `${check.status} — ${check.label}: ${check.reason}`),
    "",
    `Decision: ${input.decision}`,
    `GatePass issued: ${input.gatePassIssued ? "YES" : "NO"}`,
    `GatePass reference: ${input.gatePass?.gatePassId ?? "NONE"}`,
    `Execution permitted: ${input.executionPermitted ? "YES — exact matching one-use GatePass required" : "NO"}`,
    `Execution: ${executionStatus}`,
    `Simulated execution occurred: ${executionStatus === "SIMULATED_PURCHASE_COMPLETED" ? "YES" : "NO"}`,
    `GatePass consumed: ${input.execution?.gatePassConsumed === true ? "YES" : "NO"}`,
    `When: ${input.execution?.executedAt ?? input.generatedAt}`,
    ...(failedChecks.length === 0 ? [] : [
      "",
      "Failed checks:",
      ...failedChecks.map((check) => `- ${check.label}: ${check.reason}`),
    ]),
    "",
    `Audit result: ${input.auditResult}`,
    EXACT_ACTION_TRUST_GATEWAY_DISCLAIMER,
  ].join("\n");
}

async function loadHumanAuthorityModule(): Promise<HumanAuthorityDemoModule> {
  humanAuthorityModulePromise ??= import(pathToFileURL(resolve(
    process.cwd(),
    "src",
    "human-authority-demo.mjs",
  )).href) as Promise<HumanAuthorityDemoModule>;
  return humanAuthorityModulePromise;
}

function isExactActionGatePass(value: unknown): value is ExactActionGatePass {
  return isRecord(value)
    && typeof value.gatePassId === "string"
    && value.decision === "allow"
    && isRecord(value.action)
    && typeof value.action.actionDigest === "string"
    && isRecord(value.signature)
    && typeof value.signature.signature === "string";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function shortDigest(value: unknown): string {
  return createCanonicalPayloadHash(value).slice("sha256:".length, "sha256:".length + 24);
}

function formatGbp(value: number): string {
  return formatCurrency(value, "GBP");
}

function formatCurrency(value: number, currency: string): string {
  if (!Number.isFinite(value)) return String(value);
  if (!/^[A-Z]{3}$/.test(currency)) return `${value}`;
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);
}
