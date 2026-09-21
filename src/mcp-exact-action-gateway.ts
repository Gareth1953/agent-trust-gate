import {
  createCanonicalActionEnvelope,
  createFixedTrustedClock,
  createPolicyDecisionReceipt,
  issueExactActionGatePass,
  type CanonicalJsonValue,
  type ExactActionGatePass,
  type PolicyDecisionReceipt,
  type TrustedClock,
} from "./exact-action-gatepass.js";
import {
  ExactActionTrustGatewayPrototype,
  createExactActionPrototypeScenario,
  type ProposedProcurementAction,
} from "./exact-action-trust-gateway-prototype.js";
import { createCanonicalPayloadHash } from "./local-signed-proof.js";
import {
  ACTION_CAPABILITY_PASSPORT_REFERENCE_TIME,
  ACTION_CAPABILITY_PASSPORT_SCHEMA_VERSION,
  ActionCapabilityPassportRegistry,
  MCP_EXACT_ACTION_INPUT_SCHEMA_IDENTITY,
  MCP_EXACT_ACTION_INPUT_SCHEMA_VERSION,
  MCP_EXACT_ACTION_OPERATION,
  MCP_EXACT_ACTION_SERVER_IDENTITY,
  MCP_EXACT_ACTION_TOOL_NAME,
  createActionCapabilityPassport,
  type ActionCapabilityPassport,
  type ActionCapabilityPassportReference,
} from "./action-capability-passport.js";
import {
  BUSINESS_POLICY_REFERENCE_TIME,
  BusinessPolicyRegistry,
  DEFAULT_BUSINESS_POLICY,
  DEFAULT_EVIDENCE_OBSERVATION_SETS,
  EvidenceObservationRegistry,
  evaluateBusinessPolicy,
  type BusinessActionContext,
  type BusinessPolicyEvaluation,
  type BusinessPolicyOutcome,
  type BusinessPolicyReference,
} from "./business-policy-contract.js";
import {
  createShadowDecisionReceipt,
  type ShadowDecisionReceipt,
} from "./shadow-decision-receipt.js";
import {
  DEFAULT_AGGREGATE_EXPOSURE_RULE,
  DurableStateError,
  LocalDurableLifecycleStore,
  type ActionLifecycleRecord,
  type AggregateExposureRule,
  type ExposurePreview,
} from "./durable-action-lifecycle.js";

export const MCP_EXACT_ACTION_REQUEST_VERSION =
  "atg.mcp-exact-action-request.local.v1" as const;
export const MCP_EXACT_ACTION_RESULT_VERSION =
  "atg.mcp-exact-action-result.local.v1" as const;
export const MCP_EXACT_ACTION_PROTOCOL_VERSION = "2025-06-18" as const;
export const MCP_EXACT_ACTION_GATEWAY_VERSION =
  "atg.mcp-exact-action-gateway.local.v1" as const;
export const MCP_BUSINESS_POLICY_REQUEST_VERSION =
  "atg.mcp-exact-action-request.local.v2" as const;
export const MCP_BUSINESS_POLICY_RESULT_VERSION =
  "atg.mcp-exact-action-result.local.v2" as const;
export const MCP_BUSINESS_POLICY_INPUT_SCHEMA_VERSION = "2.0.0" as const;

const LEGACY_MCP_EXPOSURE_RULE: AggregateExposureRule = {
  ruleId: "EXPOSURE-LEGACY-MCP-PURCHASE-24H-001",
  policyId: "legacy-p3-m158-exact-action",
  policyVersion: "1.0.0",
  actionFamily: "purchase",
  currency: "GBP",
  counterpartyClass: "legacy_registered_supplier",
  windowSeconds: 86_400,
  maximumAggregateMinorUnits: 100_000_000,
  maximumActionCount: 100,
  exhaustionOutcome: "REJECT",
};

export const REGISTERED_EVIDENCE_REFERENCES = {
  humanAuthority: "fixture://northstar/human-authority/EMP-NORTHSTAR-0042",
  humanApproval: "fixture://northstar/human-approval/EMP-NORTHSTAR-0042",
  agentStanding: "fixture://northstar/agent-standing/procurement-agent-04",
  mandate: "fixture://northstar/mandate/procurement-purchase-v1",
} as const;

export interface McpExactActionToolBinding {
  mcpServerIdentity: string;
  toolIdentity: string;
  operation: string;
  inputSchemaIdentity: string;
  inputSchemaVersion: string;
  inputSchemaDigest: string;
}

export interface McpExactActionEvidenceReferences {
  humanAuthority: string;
  humanApproval: string;
  agentStanding: string;
  mandate: string;
}

export interface McpExactActionRequest {
  requestVersion: typeof MCP_EXACT_ACTION_REQUEST_VERSION;
  passportReference: ActionCapabilityPassportReference;
  toolBinding: McpExactActionToolBinding;
  evidenceReferences: McpExactActionEvidenceReferences;
  proposedAction: Omit<ProposedProcurementAction, "humanAuthorityProofReference" | "mandateId">;
}

export type McpExactActionOutcome = "ACCEPT" | "REJECT";

export interface McpExactActionResult {
  resultVersion: typeof MCP_EXACT_ACTION_RESULT_VERSION;
  gatewayVersion: typeof MCP_EXACT_ACTION_GATEWAY_VERSION;
  outcome: McpExactActionOutcome;
  reasonCodes: string[];
  passport: {
    passportId: string;
    passportVersion: string;
    passportDigest: string;
    verified: boolean;
  };
  exactActionDigest: string | null;
  policyDecisionReceipt: PolicyDecisionReceipt | null;
  gatePass: ExactActionGatePass | null;
  gatePassIssued: boolean;
  supportedOutcomes: readonly ["ACCEPT", "REJECT"];
  deferredOutcomes: readonly ["REFER", "REVOKE"];
  executionReceipt: null;
  executionAvailable: false;
  actionExecuted: false;
  localOnly: true;
  productionReady: false;
  commercialWisdomAssessed: false;
}

export interface McpBusinessPolicyRequest {
  requestVersion: typeof MCP_BUSINESS_POLICY_REQUEST_VERSION;
  mode: "enforced" | "shadow";
  passportReference: ActionCapabilityPassportReference;
  toolBinding: McpExactActionToolBinding;
  businessPolicyReference: BusinessPolicyReference;
  evidenceSetReference: string;
  evidenceReferences: McpExactActionEvidenceReferences;
  amountMinorUnits: number;
  businessContext: BusinessActionContext;
  proposedAction: McpExactActionRequest["proposedAction"];
}

export interface McpBusinessPolicyResult {
  resultVersion: typeof MCP_BUSINESS_POLICY_RESULT_VERSION;
  gatewayVersion: typeof MCP_EXACT_ACTION_GATEWAY_VERSION;
  mode: "enforced" | "shadow";
  outcome: BusinessPolicyOutcome | "SHADOW";
  wouldOutcome: BusinessPolicyOutcome | null;
  reasonCodes: string[];
  ruleIdentifiers: string[];
  passport: ActionCapabilityPassportReference & { verified: boolean };
  businessPolicy: BusinessPolicyReference & { verified: boolean };
  exactActionDigest: string | null;
  riskAssessment: BusinessPolicyEvaluation["risk"] | null;
  evidenceDecay: BusinessPolicyEvaluation["evidenceDecay"] | null;
  policyDecisionReceipt: PolicyDecisionReceipt | null;
  shadowDecisionReceipt: ShadowDecisionReceipt | null;
  gatePass: ExactActionGatePass | null;
  gatePassIssued: boolean;
  supportedOutcomes: readonly ["ACCEPT", "REFER", "REJECT"];
  deferredOutcomes: readonly ["REVOKE"];
  executionReceipt: null;
  executionAvailable: false;
  actionExecuted: false;
  enforcementStateMutated: boolean;
  localOnly: true;
  syntheticOnly: true;
  observational: boolean;
  authorising: boolean;
  lifecycle: {
    lifecycleId: string;
    lifecycleRevision: number;
    status: ActionLifecycleRecord["status"];
  } | null;
  aggregateExposure: ExposurePreview | null;
  emergencyStopActive: boolean | null;
  durableState: "persisted" | "not_created" | "unavailable";
  productionReady: false;
  commercialWisdomAssessed: false;
}

export const MCP_EXACT_ACTION_TOOL_INPUT_SCHEMA_V1 = {
  type: "object",
  additionalProperties: false,
  required: [
    "requestVersion",
    "passportReference",
    "toolBinding",
    "evidenceReferences",
    "proposedAction",
  ],
  properties: {
    requestVersion: { const: MCP_EXACT_ACTION_REQUEST_VERSION },
    passportReference: {
      type: "object",
      additionalProperties: false,
      required: ["passportId", "passportVersion", "passportDigest"],
      properties: {
        passportId: { type: "string", minLength: 1, maxLength: 160 },
        passportVersion: { type: "string", minLength: 1, maxLength: 40 },
        passportDigest: { type: "string", pattern: "^sha256:[a-f0-9]{64}$" },
      },
    },
    toolBinding: {
      type: "object",
      additionalProperties: false,
      required: [
        "mcpServerIdentity",
        "toolIdentity",
        "operation",
        "inputSchemaIdentity",
        "inputSchemaVersion",
        "inputSchemaDigest",
      ],
      properties: {
        mcpServerIdentity: { type: "string", minLength: 1, maxLength: 200 },
        toolIdentity: { type: "string", minLength: 1, maxLength: 120 },
        operation: { type: "string", minLength: 1, maxLength: 120 },
        inputSchemaIdentity: { type: "string", minLength: 1, maxLength: 160 },
        inputSchemaVersion: { type: "string", minLength: 1, maxLength: 40 },
        inputSchemaDigest: { type: "string", pattern: "^sha256:[a-f0-9]{64}$" },
      },
    },
    evidenceReferences: {
      type: "object",
      additionalProperties: false,
      required: ["humanAuthority", "humanApproval", "agentStanding", "mandate"],
      properties: {
        humanAuthority: { type: "string", minLength: 1, maxLength: 240 },
        humanApproval: { type: "string", minLength: 1, maxLength: 240 },
        agentStanding: { type: "string", minLength: 1, maxLength: 240 },
        mandate: { type: "string", minLength: 1, maxLength: 240 },
      },
    },
    proposedAction: {
      type: "object",
      additionalProperties: false,
      required: [
        "organisationId", "agentId", "supplierId", "supplierName", "product",
        "category", "quantity", "totalAmount", "currency", "commercialTermsReference",
        "actionType", "jurisdiction", "riskTier", "timestamp", "nonce", "policyVersion",
      ],
      properties: {
        organisationId: { type: "string", minLength: 1, maxLength: 160 },
        agentId: { type: "string", minLength: 1, maxLength: 200 },
        supplierId: { type: "string", minLength: 1, maxLength: 160 },
        supplierName: { type: "string", minLength: 1, maxLength: 200 },
        product: { type: "string", minLength: 1, maxLength: 200 },
        category: { type: "string", minLength: 1, maxLength: 120 },
        quantity: { type: "integer", minimum: 1, maximum: 1000000 },
        totalAmount: { type: "number", minimum: 0, maximum: 1000000000 },
        currency: { type: "string", pattern: "^[A-Z]{3}$" },
        commercialTermsReference: { type: "string", minLength: 1, maxLength: 200 },
        actionType: { type: "string", minLength: 1, maxLength: 120 },
        jurisdiction: { type: "string", minLength: 2, maxLength: 32 },
        riskTier: { type: "string", minLength: 1, maxLength: 40 },
        timestamp: { type: "string", format: "date-time", maxLength: 40 },
        nonce: { type: "string", minLength: 8, maxLength: 200 },
        policyVersion: { type: "string", minLength: 1, maxLength: 160 },
      },
    },
  },
} as const;

export const MCP_EXACT_ACTION_TOOL_OUTPUT_SCHEMA_V1 = {
  type: "object",
  additionalProperties: true,
  required: [
    "resultVersion", "gatewayVersion", "outcome", "reasonCodes", "passport",
    "exactActionDigest", "policyDecisionReceipt", "gatePass", "gatePassIssued",
    "supportedOutcomes", "deferredOutcomes", "executionReceipt", "executionAvailable",
    "actionExecuted", "localOnly", "productionReady", "commercialWisdomAssessed",
  ],
  properties: {
    resultVersion: { const: MCP_EXACT_ACTION_RESULT_VERSION },
    gatewayVersion: { const: MCP_EXACT_ACTION_GATEWAY_VERSION },
    outcome: { enum: ["ACCEPT", "REJECT"] },
    reasonCodes: { type: "array", items: { type: "string" } },
    gatePassIssued: { type: "boolean" },
    executionReceipt: { type: "null" },
    executionAvailable: { const: false },
    actionExecuted: { const: false },
    localOnly: { const: true },
    productionReady: { const: false },
    commercialWisdomAssessed: { const: false },
  },
} as const;

export const MCP_BUSINESS_POLICY_TOOL_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "requestVersion", "mode", "passportReference", "toolBinding",
    "businessPolicyReference", "evidenceSetReference", "evidenceReferences",
    "amountMinorUnits", "businessContext", "proposedAction",
  ],
  properties: {
    requestVersion: { const: MCP_BUSINESS_POLICY_REQUEST_VERSION },
    mode: { enum: ["enforced", "shadow"] },
    passportReference: MCP_EXACT_ACTION_TOOL_INPUT_SCHEMA_V1.properties.passportReference,
    toolBinding: MCP_EXACT_ACTION_TOOL_INPUT_SCHEMA_V1.properties.toolBinding,
    businessPolicyReference: {
      type: "object", additionalProperties: false,
      required: ["policyId", "policyVersion", "policyDigest"],
      properties: {
        policyId: { type: "string", minLength: 1, maxLength: 160 },
        policyVersion: { type: "string", minLength: 1, maxLength: 40 },
        policyDigest: { type: "string", pattern: "^sha256:[a-f0-9]{64}$" },
      },
    },
    evidenceSetReference: { type: "string", minLength: 1, maxLength: 200 },
    evidenceReferences: MCP_EXACT_ACTION_TOOL_INPUT_SCHEMA_V1.properties.evidenceReferences,
    amountMinorUnits: { type: "integer", minimum: 0, maximum: 100000000000 },
    businessContext: {
      type: "object", additionalProperties: false,
      required: [
        "destinationClass", "supplierAccountReferenceClass", "counterpartyClass",
        "recipientClass", "environment", "customerImpactClass", "customerContactRequested",
        "discountBasisPoints", "refundAmountMinorUnits", "cancellationAmountMinorUnits",
        "additionalApprovalReference", "requestedAuthorityExpansion", "agentClaimsPolicyApproval",
      ],
      properties: {
        destinationClass: { type: "string", minLength: 1, maxLength: 120 },
        supplierAccountReferenceClass: { type: "string", minLength: 1, maxLength: 120 },
        counterpartyClass: { type: "string", minLength: 1, maxLength: 120 },
        recipientClass: { type: "string", minLength: 1, maxLength: 120 },
        environment: { type: "string", minLength: 1, maxLength: 160 },
        customerImpactClass: { enum: ["none", "indirect", "customer_facing"] },
        customerContactRequested: { type: "boolean" },
        discountBasisPoints: { type: "integer", minimum: 0 },
        refundAmountMinorUnits: { type: "integer", minimum: 0 },
        cancellationAmountMinorUnits: { type: "integer", minimum: 0 },
        additionalApprovalReference: { type: ["string", "null"] },
        requestedAuthorityExpansion: { type: "boolean" },
        agentClaimsPolicyApproval: { type: "boolean" },
      },
    },
    proposedAction: MCP_EXACT_ACTION_TOOL_INPUT_SCHEMA_V1.properties.proposedAction,
  },
} as const;

export const MCP_BUSINESS_POLICY_TOOL_OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: true,
  required: [
    "resultVersion", "gatewayVersion", "mode", "outcome", "wouldOutcome",
    "reasonCodes", "ruleIdentifiers", "passport", "businessPolicy", "exactActionDigest",
    "riskAssessment", "evidenceDecay", "policyDecisionReceipt", "shadowDecisionReceipt",
    "gatePass", "gatePassIssued", "executionReceipt", "executionAvailable", "actionExecuted",
    "localOnly", "syntheticOnly", "observational", "authorising", "productionReady",
  ],
  properties: {
    resultVersion: { const: MCP_BUSINESS_POLICY_RESULT_VERSION },
    gatewayVersion: { const: MCP_EXACT_ACTION_GATEWAY_VERSION },
    mode: { enum: ["enforced", "shadow"] },
    outcome: { enum: ["ACCEPT", "REFER", "REJECT", "SHADOW"] },
    wouldOutcome: { type: ["string", "null"], enum: ["ACCEPT", "REFER", "REJECT", null] },
    gatePassIssued: { type: "boolean" },
    executionReceipt: { type: "null" },
    executionAvailable: { const: false }, actionExecuted: { const: false },
    localOnly: { const: true }, syntheticOnly: { const: true }, productionReady: { const: false },
  },
} as const;

export const MCP_EXACT_ACTION_TOOL_INPUT_SCHEMA = {
  oneOf: [MCP_EXACT_ACTION_TOOL_INPUT_SCHEMA_V1, MCP_BUSINESS_POLICY_TOOL_INPUT_SCHEMA],
} as const;
export const MCP_EXACT_ACTION_TOOL_OUTPUT_SCHEMA = {
  oneOf: [MCP_EXACT_ACTION_TOOL_OUTPUT_SCHEMA_V1, MCP_BUSINESS_POLICY_TOOL_OUTPUT_SCHEMA],
} as const;

export const MCP_EXACT_ACTION_INPUT_SCHEMA_DIGEST = createCanonicalPayloadHash(
  MCP_EXACT_ACTION_TOOL_INPUT_SCHEMA_V1,
);

export const DEFAULT_ACTION_CAPABILITY_PASSPORT = createActionCapabilityPassport({
  passportSchemaVersion: ACTION_CAPABILITY_PASSPORT_SCHEMA_VERSION,
  passportId: "passport.atg.local.procurement-evaluation.v1",
  passportVersion: "1.0.0",
  mcpServerIdentity: MCP_EXACT_ACTION_SERVER_IDENTITY,
  toolIdentity: MCP_EXACT_ACTION_TOOL_NAME,
  operation: MCP_EXACT_ACTION_OPERATION,
  inputSchema: {
    identity: MCP_EXACT_ACTION_INPUT_SCHEMA_IDENTITY,
    version: MCP_EXACT_ACTION_INPUT_SCHEMA_VERSION,
    digest: MCP_EXACT_ACTION_INPUT_SCHEMA_DIGEST,
  },
  permittedActionType: "purchase",
  permittedEnvironment: "local_synthetic_procurement_simulation",
  permittedAdapterClass: "evaluation_only_non_executable",
  riskClassification: "medium",
  reversibilityClassification: "not_applicable_evaluation_only",
  evidenceRequirements: [
    "registered human authority evidence",
    "registered human approval evidence",
    "registered agent standing evidence",
    "registered bounded mandate",
    "fresh synthetic procurement evidence",
  ],
  effectiveAt: "2026-09-01T00:00:00.000Z",
  expiresAt: "2027-09-01T00:00:00.000Z",
  status: "active",
  revocationReference: null,
  localOnly: true,
  executionAvailable: false,
});

export const MCP_BUSINESS_POLICY_INPUT_SCHEMA_DIGEST = createCanonicalPayloadHash(
  MCP_BUSINESS_POLICY_TOOL_INPUT_SCHEMA,
);

export const DEFAULT_BUSINESS_POLICY_ACTION_CAPABILITY_PASSPORT = createActionCapabilityPassport({
  passportSchemaVersion: ACTION_CAPABILITY_PASSPORT_SCHEMA_VERSION,
  passportId: "passport.atg.local.procurement-policy-evaluation.v2",
  passportVersion: "2.0.0",
  mcpServerIdentity: MCP_EXACT_ACTION_SERVER_IDENTITY,
  toolIdentity: MCP_EXACT_ACTION_TOOL_NAME,
  operation: MCP_EXACT_ACTION_OPERATION,
  inputSchema: {
    identity: MCP_EXACT_ACTION_INPUT_SCHEMA_IDENTITY,
    version: MCP_BUSINESS_POLICY_INPUT_SCHEMA_VERSION,
    digest: MCP_BUSINESS_POLICY_INPUT_SCHEMA_DIGEST,
  },
  permittedActionType: "purchase",
  permittedEnvironment: "local_synthetic_procurement_simulation",
  permittedAdapterClass: "evaluation_only_non_executable",
  riskClassification: "medium",
  reversibilityClassification: "not_applicable_evaluation_only",
  evidenceRequirements: [
    "registered human authority and approval evidence",
    "registered agent standing and bounded mandate",
    "registered Business Policy Contract",
    "registered freshness observations",
  ],
  effectiveAt: "2026-09-01T00:00:00.000Z",
  expiresAt: "2027-09-01T00:00:00.000Z",
  status: "active",
  revocationReference: null,
  localOnly: true,
  executionAvailable: false,
});

export class McpExactActionInputError extends Error {
  constructor(
    readonly reasonCode: string,
    message: string,
  ) {
    super(message);
    this.name = "McpExactActionInputError";
  }
}

export class McpExactActionGateway {
  readonly #prototype: ExactActionTrustGatewayPrototype;
  readonly #registry: ActionCapabilityPassportRegistry;
  readonly #policyRegistry: BusinessPolicyRegistry;
  readonly #evidenceRegistry: EvidenceObservationRegistry;
  readonly #evaluatedAt: string;
  readonly #clock: TrustedClock | null;
  readonly #durableStore: LocalDurableLifecycleStore;
  readonly #exposureRule: AggregateExposureRule;

  constructor(options: {
    prototype?: ExactActionTrustGatewayPrototype;
    registry?: ActionCapabilityPassportRegistry;
    policyRegistry?: BusinessPolicyRegistry;
    evidenceRegistry?: EvidenceObservationRegistry;
    evaluatedAt?: string;
    clock?: TrustedClock | null;
    durableStore?: LocalDurableLifecycleStore;
    durableStatePath?: string;
    exposureRule?: AggregateExposureRule;
  } = {}) {
    this.#prototype = options.prototype ?? new ExactActionTrustGatewayPrototype();
    this.#registry = options.registry
      ?? new ActionCapabilityPassportRegistry([
        DEFAULT_ACTION_CAPABILITY_PASSPORT,
        DEFAULT_BUSINESS_POLICY_ACTION_CAPABILITY_PASSPORT,
      ]);
    this.#policyRegistry = options.policyRegistry ?? new BusinessPolicyRegistry([DEFAULT_BUSINESS_POLICY]);
    this.#evidenceRegistry = options.evidenceRegistry
      ?? new EvidenceObservationRegistry(DEFAULT_EVIDENCE_OBSERVATION_SETS);
    this.#evaluatedAt = options.evaluatedAt ?? ACTION_CAPABILITY_PASSPORT_REFERENCE_TIME;
    this.#clock = options.clock === undefined
      ? createFixedTrustedClock(BUSINESS_POLICY_REFERENCE_TIME)
      : options.clock;
    this.#durableStore = options.durableStore
      ?? new LocalDurableLifecycleStore(options.durableStatePath === undefined
        ? {}
        : { statePath: options.durableStatePath });
    this.#exposureRule = structuredClone(options.exposureRule ?? DEFAULT_AGGREGATE_EXPOSURE_RULE);
  }

  async evaluateAction(value: unknown): Promise<McpExactActionResult | McpBusinessPolicyResult> {
    if (isRecordValue(value) && value.requestVersion === MCP_BUSINESS_POLICY_REQUEST_VERSION) {
      return this.#evaluateBusinessPolicyAction(value);
    }
    return this.#evaluateLegacyAction(value);
  }

  async #evaluateLegacyAction(value: unknown): Promise<McpExactActionResult> {
    const request = validateMcpExactActionRequest(value);
    const passportResolution = this.#registry.resolve(request.passportReference, this.#evaluatedAt);
    if (!passportResolution.verified || passportResolution.passport === null) {
      return rejectedWithoutDecision(request.passportReference, passportResolution.reasonCode);
    }
    const passport = passportResolution.passport;
    const bindingFailure = verifyRequestBindings(request, passport);
    if (bindingFailure !== null) {
      return rejectedWithoutDecision(request.passportReference, bindingFailure);
    }

    const scenario = createExactActionPrototypeScenario("allowed");
    scenario.proposedAction = structuredClone(request.proposedAction);
    scenario.executionMutation = null;
    const evaluation = await this.#prototype.assessExactAction(scenario);
    const exactActionInput = {
      ...evaluation.exactActionInput,
      toolIdentity: passport.toolIdentity,
      toolSchemaVersion: `${passport.inputSchema.identity}@${passport.inputSchema.version}#${passport.inputSchema.digest}`,
      operationName: passport.operation,
      canonicalArguments: {
        requestVersion: request.requestVersion,
        passportReference: request.passportReference,
        proposedAction: evaluation.proposedAction,
      } as unknown as CanonicalJsonValue,
    };
    const exactAction = createCanonicalActionEnvelope(exactActionInput);

    if (evaluation.authorised) {
      const issuance = issueExactActionGatePass(exactActionInput);
      try {
        const durable = this.#durableStore.issue({
          gatePass: issuance.gatePass,
          passportDigest: request.passportReference.passportDigest,
          policyId: LEGACY_MCP_EXPOSURE_RULE.policyId,
          policyVersion: LEGACY_MCP_EXPOSURE_RULE.policyVersion,
          amountMinorUnits: Math.round(evaluation.proposedAction.totalAmount * 100),
          actionFamily: evaluation.proposedAction.actionType,
          counterpartyClass: LEGACY_MCP_EXPOSURE_RULE.counterpartyClass,
          rule: LEGACY_MCP_EXPOSURE_RULE,
          recordedAt: evaluation.proposedAction.timestamp,
        });
        if (!durable.issued) {
          const receipt = createPolicyDecisionReceipt({
            decision: "refused", action: exactAction, gatePass: null, reasons: durable.reasonCodes,
          });
          return baseResult({
            request, outcome: "REJECT", reasonCodes: durable.reasonCodes,
            exactActionDigest: exactAction.actionDigest, policyDecisionReceipt: receipt, gatePass: null,
          });
        }
      } catch (error) {
        const reasonCode = error instanceof DurableStateError ? error.reasonCode : "DURABLE_STATE_UNAVAILABLE";
        const receipt = createPolicyDecisionReceipt({ decision: "refused", action: exactAction, gatePass: null, reasons: [reasonCode] });
        return baseResult({
          request, outcome: "REJECT", reasonCodes: [reasonCode],
          exactActionDigest: exactAction.actionDigest, policyDecisionReceipt: receipt, gatePass: null,
        });
      }
      return baseResult({
        request,
        outcome: "ACCEPT",
        reasonCodes: ["EXACT_ACTION_AUTHORISED", "PASSPORT_VERIFIED"],
        exactActionDigest: exactAction.actionDigest,
        policyDecisionReceipt: issuance.decisionReceipt,
        gatePass: issuance.gatePass,
      });
    }

    const reasonCodes = evaluation.refusal === null
      ? ["EXACT_ACTION_REFUSED"]
      : [
        evaluation.refusal.primaryFailureCode,
        ...evaluation.refusal.failedChecks.map((check) => `CHECK_${check.id.toUpperCase()}_FAILED`),
      ];
    const decisionReceipt = createPolicyDecisionReceipt({
      decision: "refused",
      action: exactAction,
      gatePass: null,
      reasons: reasonCodes,
    });
    return baseResult({
      request,
      outcome: "REJECT",
      reasonCodes,
      exactActionDigest: exactAction.actionDigest,
      policyDecisionReceipt: decisionReceipt,
      gatePass: null,
    });
  }

  async #evaluateBusinessPolicyAction(value: unknown): Promise<McpBusinessPolicyResult> {
    const request = validateMcpBusinessPolicyRequest(value);
    const passportResolution = this.#registry.resolve(request.passportReference, this.#evaluatedAt);
    if (!passportResolution.verified || passportResolution.passport === null) {
      return rejectedBusinessResult(request, passportResolution.reasonCode, false, false);
    }
    const passport = passportResolution.passport;
    const bindingFailure = verifyBusinessRequestBindings(request, passport);
    if (bindingFailure !== null) return rejectedBusinessResult(request, bindingFailure, true, false);

    const policyResolution = this.#policyRegistry.resolve(request.businessPolicyReference, this.#evaluatedAt);
    if (!policyResolution.verified || policyResolution.policy === null) {
      return rejectedBusinessResult(request, policyResolution.reasonCode, true, false);
    }
    const policy = policyResolution.policy;
    if (!policy.permittedTools.includes(passport.toolIdentity)
      || !policy.permittedOperations.includes(passport.operation)
      || !policy.permittedActionTypes.includes(passport.permittedActionType)
      || !policy.permittedEnvironments.includes(passport.permittedEnvironment)) {
      return rejectedBusinessResult(request, "POLICY_PASSPORT_MISMATCH", true, true);
    }
    const evidenceSet = this.#evidenceRegistry.resolve(request.evidenceSetReference);
    if (evidenceSet === null) {
      return rejectedBusinessResult(request, "EVIDENCE_SET_UNKNOWN", true, true);
    }

    const scenario = createExactActionPrototypeScenario("allowed");
    scenario.proposedAction = structuredClone(request.proposedAction);
    scenario.executionMutation = null;
    const assessment = await this.#prototype.assessExactAction(scenario);
    const exactActionInput = {
      ...assessment.exactActionInput,
      toolIdentity: passport.toolIdentity,
      toolSchemaVersion: `${passport.inputSchema.identity}@${passport.inputSchema.version}#${passport.inputSchema.digest}`,
      operationName: passport.operation,
      policyReference: `policy://local/${policy.policyId}/${policy.policyVersion}`,
      policyDigest: policy.policyDigest,
      operatingEnvironment: request.businessContext.environment,
      canonicalArguments: {
        requestVersion: request.requestVersion,
        mode: request.mode,
        passportReference: request.passportReference,
        businessPolicyReference: request.businessPolicyReference,
        evidenceSetReference: request.evidenceSetReference,
        evidenceReferences: request.evidenceReferences,
        amountMinorUnits: request.amountMinorUnits,
        businessContext: request.businessContext,
        proposedAction: assessment.proposedAction,
      } as unknown as CanonicalJsonValue,
    };
    const exactAction = createCanonicalActionEnvelope(exactActionInput);
    const policyEvaluation = evaluateBusinessPolicy({
      policy,
      action: assessment.proposedAction,
      amountMinorUnits: request.amountMinorUnits,
      context: request.businessContext,
      evidenceSet,
      clock: this.#clock,
    });
    let wouldOutcome: BusinessPolicyOutcome = policyEvaluation.outcome;
    const coreReasons = assessment.refusal === null
      ? ["EXACT_ACTION_AUTHORISED"]
      : [
        assessment.refusal.primaryFailureCode,
        ...assessment.refusal.failedChecks.map((check) => `CHECK_${check.id.toUpperCase()}_FAILED`),
      ];
    if (!assessment.authorised) wouldOutcome = "REJECT";
    let reasonCodes = [...new Set([
      ...coreReasons,
      "PASSPORT_VERIFIED",
      "POLICY_VERIFIED",
      ...policyEvaluation.reasonCodes,
      ...(request.mode === "shadow" ? ["SHADOW_OBSERVATIONAL_NON_AUTHORISING"] : []),
    ])];
    let exposure: ExposurePreview | null = null;
    let emergencyStopActive: boolean | null = null;

    try {
      emergencyStopActive = this.#durableStore.isEmergencyStopActive();
      exposure = this.#durableStore.previewExposure({
        policyId: policy.policyId,
        policyVersion: policy.policyVersion,
        policyDigest: policy.policyDigest,
        passportDigest: request.passportReference.passportDigest,
        amountMinorUnits: request.amountMinorUnits,
        actionFamily: assessment.proposedAction.actionType,
        counterpartyClass: request.businessContext.counterpartyClass,
        currency: assessment.proposedAction.currency,
        rule: this.#exposureRule,
        recordedAt: this.#evaluatedAt,
      });
      if (emergencyStopActive) {
        wouldOutcome = "REJECT";
        reasonCodes = [...new Set([...reasonCodes, "EMERGENCY_STOP_ACTIVE"])];
      } else if (!exposure.withinLimit) {
        if (exposure.reasonCode === "EXPOSURE_CURRENCY_MISMATCH"
          || exposure.reasonCode === "EXPOSURE_RULE_MISMATCH") {
          wouldOutcome = "REJECT";
        } else if (wouldOutcome !== "REJECT") {
          wouldOutcome = this.#exposureRule.exhaustionOutcome;
        }
        reasonCodes = [...new Set([...reasonCodes, exposure.reasonCode])];
      }
    } catch (error) {
      wouldOutcome = "REJECT";
      const reasonCode = error instanceof DurableStateError ? error.reasonCode : "DURABLE_STATE_UNAVAILABLE";
      reasonCodes = [...new Set([...reasonCodes, reasonCode])];
    }

    if (request.mode === "shadow") {
      const shadowDecisionReceipt = createShadowDecisionReceipt({
        wouldOutcome,
        reasonCodes,
        ruleIdentifiers: policyEvaluation.ruleIdentifiers,
        passportReference: request.passportReference,
        policyReference: request.businessPolicyReference,
        exactActionDigest: exactAction.actionDigest,
        riskAssessment: policyEvaluation.risk,
        evidenceDecay: policyEvaluation.evidenceDecay,
        evaluatedAt: policyEvaluation.evidenceDecay.evaluatedAt ?? this.#evaluatedAt,
      });
      return businessResult({
        request, outcome: "SHADOW", wouldOutcome, reasonCodes,
        ruleIdentifiers: policyEvaluation.ruleIdentifiers, passportVerified: true,
        policyVerified: true, exactActionDigest: exactAction.actionDigest,
        policyEvaluation, policyDecisionReceipt: null, shadowDecisionReceipt, gatePass: null,
        exposure, emergencyStopActive, durableState: "not_created",
      });
    }

    if (wouldOutcome === "ACCEPT") {
      const issuance = issueExactActionGatePass(exactActionInput);
      try {
        const durable = this.#durableStore.issue({
          gatePass: issuance.gatePass,
          passportDigest: request.passportReference.passportDigest,
          policyId: policy.policyId,
          policyVersion: policy.policyVersion,
          amountMinorUnits: request.amountMinorUnits,
          actionFamily: assessment.proposedAction.actionType,
          counterpartyClass: request.businessContext.counterpartyClass,
          rule: this.#exposureRule,
          recordedAt: this.#evaluatedAt,
        });
        if (durable.issued && durable.lifecycle !== null) {
          return businessResult({
            request, outcome: "ACCEPT", wouldOutcome: null,
            reasonCodes: [...reasonCodes, ...durable.reasonCodes],
            ruleIdentifiers: policyEvaluation.ruleIdentifiers, passportVerified: true,
            policyVerified: true, exactActionDigest: exactAction.actionDigest,
            policyEvaluation, policyDecisionReceipt: issuance.decisionReceipt,
            shadowDecisionReceipt: null, gatePass: issuance.gatePass,
            lifecycle: durable.lifecycle, exposure: durable.exposure,
            emergencyStopActive: false, durableState: "persisted",
          });
        }
        wouldOutcome = durable.outcome === "REFER" ? "REFER" : "REJECT";
        reasonCodes = [...new Set([...reasonCodes, ...durable.reasonCodes])];
        exposure = durable.exposure;
      } catch (error) {
        wouldOutcome = "REJECT";
        const reasonCode = error instanceof DurableStateError ? error.reasonCode : "DURABLE_STATE_UNAVAILABLE";
        reasonCodes = [...new Set([...reasonCodes, reasonCode])];
      }
    }

    let lifecycle: ActionLifecycleRecord | null = null;
    let durableState: McpBusinessPolicyResult["durableState"] = "not_created";
    try {
      lifecycle = this.#durableStore.recordNonAuthorisingDecision({
        status: wouldOutcome === "REFER" ? "REFERRED" : "REJECTED",
        actionDigest: exactAction.actionDigest,
        policyDigest: policy.policyDigest,
        passportDigest: request.passportReference.passportDigest,
        subjectAgentIdentity: assessment.proposedAction.agentId,
        nonce: assessment.proposedAction.nonce,
        issuedAt: assessment.proposedAction.timestamp,
        expiresAt: exactAction.expiresAt,
        amountMinorUnits: request.amountMinorUnits,
        currency: assessment.proposedAction.currency,
        actionFamily: assessment.proposedAction.actionType,
        recordedAt: this.#evaluatedAt,
      });
      durableState = "persisted";
    } catch (error) {
      const reasonCode = error instanceof DurableStateError ? error.reasonCode : "DURABLE_STATE_UNAVAILABLE";
      reasonCodes = [...new Set([...reasonCodes, reasonCode])];
      durableState = "unavailable";
    }
    const decisionReceipt = createPolicyDecisionReceipt({
      decision: wouldOutcome === "REFER" ? "escalated" : "refused",
      action: exactAction,
      gatePass: null,
      reasons: reasonCodes,
    });
    return businessResult({
      request, outcome: wouldOutcome, wouldOutcome: null, reasonCodes,
      ruleIdentifiers: policyEvaluation.ruleIdentifiers, passportVerified: true,
      policyVerified: true, exactActionDigest: exactAction.actionDigest,
      policyEvaluation, policyDecisionReceipt: decisionReceipt,
      shadowDecisionReceipt: null, gatePass: null,
      lifecycle, exposure, emergencyStopActive, durableState,
    });
  }
}

export function createDefaultMcpExactActionRequest(
  actionPatch: Partial<McpExactActionRequest["proposedAction"]> = {},
): McpExactActionRequest {
  const action = createExactActionPrototypeScenario("allowed").proposedAction;
  return {
    requestVersion: MCP_EXACT_ACTION_REQUEST_VERSION,
    passportReference: {
      passportId: DEFAULT_ACTION_CAPABILITY_PASSPORT.passportId,
      passportVersion: DEFAULT_ACTION_CAPABILITY_PASSPORT.passportVersion,
      passportDigest: DEFAULT_ACTION_CAPABILITY_PASSPORT.passportDigest,
    },
    toolBinding: {
      mcpServerIdentity: DEFAULT_ACTION_CAPABILITY_PASSPORT.mcpServerIdentity,
      toolIdentity: DEFAULT_ACTION_CAPABILITY_PASSPORT.toolIdentity,
      operation: DEFAULT_ACTION_CAPABILITY_PASSPORT.operation,
      inputSchemaIdentity: DEFAULT_ACTION_CAPABILITY_PASSPORT.inputSchema.identity,
      inputSchemaVersion: DEFAULT_ACTION_CAPABILITY_PASSPORT.inputSchema.version,
      inputSchemaDigest: DEFAULT_ACTION_CAPABILITY_PASSPORT.inputSchema.digest,
    },
    evidenceReferences: { ...REGISTERED_EVIDENCE_REFERENCES },
    proposedAction: { ...action, ...actionPatch },
  };
}

export function createDefaultMcpBusinessPolicyRequest(
  mode: "enforced" | "shadow" = "enforced",
  actionPatch: Partial<McpBusinessPolicyRequest["proposedAction"]> = {},
  contextPatch: Partial<BusinessActionContext> = {},
): McpBusinessPolicyRequest {
  const action = createExactActionPrototypeScenario("allowed").proposedAction;
  const proposedAction = {
    ...action,
    quantity: 100,
    totalAmount: 4_000,
    nonce: `nonce_northstar_policy_${mode}_001`,
    ...actionPatch,
  };
  return {
    requestVersion: MCP_BUSINESS_POLICY_REQUEST_VERSION,
    mode,
    passportReference: {
      passportId: DEFAULT_BUSINESS_POLICY_ACTION_CAPABILITY_PASSPORT.passportId,
      passportVersion: DEFAULT_BUSINESS_POLICY_ACTION_CAPABILITY_PASSPORT.passportVersion,
      passportDigest: DEFAULT_BUSINESS_POLICY_ACTION_CAPABILITY_PASSPORT.passportDigest,
    },
    toolBinding: {
      mcpServerIdentity: DEFAULT_BUSINESS_POLICY_ACTION_CAPABILITY_PASSPORT.mcpServerIdentity,
      toolIdentity: DEFAULT_BUSINESS_POLICY_ACTION_CAPABILITY_PASSPORT.toolIdentity,
      operation: DEFAULT_BUSINESS_POLICY_ACTION_CAPABILITY_PASSPORT.operation,
      inputSchemaIdentity: DEFAULT_BUSINESS_POLICY_ACTION_CAPABILITY_PASSPORT.inputSchema.identity,
      inputSchemaVersion: DEFAULT_BUSINESS_POLICY_ACTION_CAPABILITY_PASSPORT.inputSchema.version,
      inputSchemaDigest: DEFAULT_BUSINESS_POLICY_ACTION_CAPABILITY_PASSPORT.inputSchema.digest,
    },
    businessPolicyReference: {
      policyId: DEFAULT_BUSINESS_POLICY.policyId,
      policyVersion: DEFAULT_BUSINESS_POLICY.policyVersion,
      policyDigest: DEFAULT_BUSINESS_POLICY.policyDigest,
    },
    evidenceSetReference: "evidence-set.fresh.v1",
    evidenceReferences: { ...REGISTERED_EVIDENCE_REFERENCES },
    amountMinorUnits: proposedAction.totalAmount * 100,
    businessContext: {
      destinationClass: "approved_warehouse",
      supplierAccountReferenceClass: "approved_supplier_account",
      counterpartyClass: "supplier_a",
      recipientClass: "approved_supplier",
      environment: "local_synthetic_procurement_simulation",
      customerImpactClass: "none",
      customerContactRequested: false,
      discountBasisPoints: 0,
      refundAmountMinorUnits: 0,
      cancellationAmountMinorUnits: 0,
      additionalApprovalReference: null,
      requestedAuthorityExpansion: false,
      agentClaimsPolicyApproval: false,
      ...contextPatch,
    },
    proposedAction,
  };
}

export function validateMcpBusinessPolicyRequest(value: unknown): McpBusinessPolicyRequest {
  const root = requireRecord(value, "MCP_INPUT_INVALID", "Tool arguments must be an object.");
  requireExactKeys(root, [
    "requestVersion", "mode", "passportReference", "toolBinding", "businessPolicyReference",
    "evidenceSetReference", "evidenceReferences", "amountMinorUnits", "businessContext", "proposedAction",
  ]);
  if (root.requestVersion !== MCP_BUSINESS_POLICY_REQUEST_VERSION) {
    throw new McpExactActionInputError("REQUEST_VERSION_INVALID", "Unsupported business-policy request version.");
  }
  if (root.mode !== "enforced" && root.mode !== "shadow") {
    throw new McpExactActionInputError("MODE_INVALID", "Mode must be enforced or shadow.");
  }
  const legacy = validateMcpExactActionRequest({
    requestVersion: MCP_EXACT_ACTION_REQUEST_VERSION,
    passportReference: root.passportReference,
    toolBinding: root.toolBinding,
    evidenceReferences: root.evidenceReferences,
    proposedAction: root.proposedAction,
  });
  const policy = requireRecord(root.businessPolicyReference, "POLICY_REFERENCE_INVALID", "Policy reference must be an object.");
  requireExactKeys(policy, ["policyId", "policyVersion", "policyDigest"]);
  requireBoundedString(policy.policyId, "POLICY_ID_INVALID", 1, 160);
  requireBoundedString(policy.policyVersion, "POLICY_VERSION_INVALID", 1, 40);
  requireBoundedString(policy.policyDigest, "POLICY_DIGEST_INVALID", 1, 80);
  if (!/^sha256:[a-f0-9]{64}$/.test(policy.policyDigest)) {
    throw new McpExactActionInputError("POLICY_DIGEST_INVALID", "Policy digest must use lowercase sha256:<hex> form.");
  }
  requireBoundedString(root.evidenceSetReference, "EVIDENCE_SET_REFERENCE_INVALID", 1, 200);
  if (!Number.isSafeInteger(root.amountMinorUnits) || (root.amountMinorUnits as number) < 0) {
    throw new McpExactActionInputError("AMOUNT_MINOR_UNITS_INVALID", "Amount must be a non-negative safe integer in minor currency units.");
  }
  if ((root.amountMinorUnits as number) !== legacy.proposedAction.totalAmount * 100) {
    throw new McpExactActionInputError("AMOUNT_MINOR_UNITS_MISMATCH", "Minor units must exactly match the proposed action total.");
  }
  const context = requireRecord(root.businessContext, "BUSINESS_CONTEXT_INVALID", "Business context must be an object.");
  const contextKeys = [
    "destinationClass", "supplierAccountReferenceClass", "counterpartyClass", "recipientClass", "environment",
    "customerImpactClass", "customerContactRequested", "discountBasisPoints", "refundAmountMinorUnits",
    "cancellationAmountMinorUnits", "additionalApprovalReference", "requestedAuthorityExpansion", "agentClaimsPolicyApproval",
  ];
  requireExactKeys(context, contextKeys);
  for (const key of ["destinationClass", "supplierAccountReferenceClass", "counterpartyClass", "recipientClass", "environment"] as const) {
    requireBoundedString(context[key], `BUSINESS_CONTEXT_${key.toUpperCase()}_INVALID`, 1, 160);
  }
  if (!(["none", "indirect", "customer_facing"] as unknown[]).includes(context.customerImpactClass)) {
    throw new McpExactActionInputError("CUSTOMER_IMPACT_CLASS_INVALID", "Customer impact class is not controlled vocabulary.");
  }
  for (const key of ["customerContactRequested", "requestedAuthorityExpansion", "agentClaimsPolicyApproval"] as const) {
    if (typeof context[key] !== "boolean") throw new McpExactActionInputError("BUSINESS_CONTEXT_BOOLEAN_INVALID", `${key} must be boolean.`);
  }
  for (const key of ["discountBasisPoints", "refundAmountMinorUnits", "cancellationAmountMinorUnits"] as const) {
    if (!Number.isSafeInteger(context[key]) || (context[key] as number) < 0) {
      throw new McpExactActionInputError("BUSINESS_CONTEXT_AMOUNT_INVALID", `${key} must be a non-negative safe integer.`);
    }
  }
  if (context.additionalApprovalReference !== null
    && (typeof context.additionalApprovalReference !== "string"
      || context.additionalApprovalReference.trim().length === 0
      || context.additionalApprovalReference.length > 240)) {
    throw new McpExactActionInputError("ADDITIONAL_APPROVAL_REFERENCE_INVALID", "Additional approval reference must be null or a bounded string.");
  }
  return structuredClone(root) as unknown as McpBusinessPolicyRequest;
}

function verifyBusinessRequestBindings(
  request: McpBusinessPolicyRequest,
  passport: ActionCapabilityPassport,
): string | null {
  const legacyRequest: McpExactActionRequest = {
    requestVersion: MCP_EXACT_ACTION_REQUEST_VERSION,
    passportReference: request.passportReference,
    toolBinding: request.toolBinding,
    evidenceReferences: request.evidenceReferences,
    proposedAction: request.proposedAction,
  };
  const failure = verifyRequestBindings(legacyRequest, passport);
  if (failure !== null) return failure;
  if (request.businessContext.environment !== passport.permittedEnvironment) return "ENVIRONMENT_NOT_PERMITTED";
  return null;
}

function businessResult(input: {
  request: McpBusinessPolicyRequest;
  outcome: McpBusinessPolicyResult["outcome"];
  wouldOutcome: BusinessPolicyOutcome | null;
  reasonCodes: string[];
  ruleIdentifiers: string[];
  passportVerified: boolean;
  policyVerified: boolean;
  exactActionDigest: string | null;
  policyEvaluation: BusinessPolicyEvaluation | null;
  policyDecisionReceipt: PolicyDecisionReceipt | null;
  shadowDecisionReceipt: ShadowDecisionReceipt | null;
  gatePass: ExactActionGatePass | null;
  lifecycle?: ActionLifecycleRecord | null;
  exposure?: ExposurePreview | null;
  emergencyStopActive?: boolean | null;
  durableState?: McpBusinessPolicyResult["durableState"];
}): McpBusinessPolicyResult {
  const shadow = input.request.mode === "shadow";
  return {
    resultVersion: MCP_BUSINESS_POLICY_RESULT_VERSION,
    gatewayVersion: MCP_EXACT_ACTION_GATEWAY_VERSION,
    mode: input.request.mode,
    outcome: input.outcome,
    wouldOutcome: input.wouldOutcome,
    reasonCodes: [...new Set(input.reasonCodes)],
    ruleIdentifiers: [...new Set(input.ruleIdentifiers)],
    passport: { ...input.request.passportReference, verified: input.passportVerified },
    businessPolicy: { ...input.request.businessPolicyReference, verified: input.policyVerified },
    exactActionDigest: input.exactActionDigest,
    riskAssessment: input.policyEvaluation?.risk ?? null,
    evidenceDecay: input.policyEvaluation?.evidenceDecay ?? null,
    policyDecisionReceipt: input.policyDecisionReceipt,
    shadowDecisionReceipt: input.shadowDecisionReceipt,
    gatePass: input.gatePass,
    gatePassIssued: input.gatePass !== null,
    supportedOutcomes: ["ACCEPT", "REFER", "REJECT"],
    deferredOutcomes: ["REVOKE"],
    executionReceipt: null,
    executionAvailable: false,
    actionExecuted: false,
    enforcementStateMutated: input.gatePass !== null,
    localOnly: true,
    syntheticOnly: true,
    observational: shadow,
    authorising: input.gatePass !== null,
    lifecycle: input.lifecycle === undefined || input.lifecycle === null ? null : {
      lifecycleId: input.lifecycle.lifecycleId,
      lifecycleRevision: input.lifecycle.lifecycleRevision,
      status: input.lifecycle.status,
    },
    aggregateExposure: input.exposure ?? null,
    emergencyStopActive: input.emergencyStopActive ?? null,
    durableState: input.durableState ?? "not_created",
    productionReady: false,
    commercialWisdomAssessed: false,
  };
}

function rejectedBusinessResult(
  request: McpBusinessPolicyRequest,
  reasonCode: string,
  passportVerified: boolean,
  policyVerified: boolean,
): McpBusinessPolicyResult {
  const reasonCodes = [reasonCode, ...(request.mode === "shadow" ? ["SHADOW_OBSERVATIONAL_NON_AUTHORISING"] : [])];
  const shadowDecisionReceipt = request.mode === "shadow"
    ? createShadowDecisionReceipt({
      wouldOutcome: "REJECT", reasonCodes, ruleIdentifiers: [],
      passportReference: request.passportReference, policyReference: request.businessPolicyReference,
      exactActionDigest: null, riskAssessment: null, evidenceDecay: null, evaluatedAt: BUSINESS_POLICY_REFERENCE_TIME,
    })
    : null;
  return businessResult({
    request,
    outcome: request.mode === "shadow" ? "SHADOW" : "REJECT",
    wouldOutcome: request.mode === "shadow" ? "REJECT" : null,
    reasonCodes,
    ruleIdentifiers: [],
    passportVerified,
    policyVerified,
    exactActionDigest: null,
    policyEvaluation: null,
    policyDecisionReceipt: null,
    shadowDecisionReceipt,
    gatePass: null,
  });
}

function isRecordValue(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function verifyRequestBindings(
  request: McpExactActionRequest,
  passport: ActionCapabilityPassport,
): string | null {
  const binding = request.toolBinding;
  if (binding.mcpServerIdentity !== passport.mcpServerIdentity) return "MCP_SERVER_IDENTITY_MISMATCH";
  if (binding.toolIdentity !== passport.toolIdentity) return "TOOL_IDENTITY_MISMATCH";
  if (binding.operation !== passport.operation) return "OPERATION_MISMATCH";
  if (binding.inputSchemaIdentity !== passport.inputSchema.identity) return "SCHEMA_IDENTITY_MISMATCH";
  if (binding.inputSchemaVersion !== passport.inputSchema.version) return "SCHEMA_VERSION_MISMATCH";
  if (binding.inputSchemaDigest !== passport.inputSchema.digest) return "SCHEMA_DIGEST_MISMATCH";
  if (request.proposedAction.actionType !== passport.permittedActionType) return "ACTION_TYPE_NOT_PERMITTED";
  for (const key of Object.keys(REGISTERED_EVIDENCE_REFERENCES) as Array<keyof McpExactActionEvidenceReferences>) {
    if (request.evidenceReferences[key] !== REGISTERED_EVIDENCE_REFERENCES[key]) {
      return "EVIDENCE_REFERENCE_MISMATCH";
    }
  }
  return null;
}

function baseResult(input: {
  request: McpExactActionRequest;
  outcome: McpExactActionOutcome;
  reasonCodes: string[];
  exactActionDigest: string;
  policyDecisionReceipt: PolicyDecisionReceipt;
  gatePass: ExactActionGatePass | null;
}): McpExactActionResult {
  return {
    resultVersion: MCP_EXACT_ACTION_RESULT_VERSION,
    gatewayVersion: MCP_EXACT_ACTION_GATEWAY_VERSION,
    outcome: input.outcome,
    reasonCodes: [...new Set(input.reasonCodes)],
    passport: { ...input.request.passportReference, verified: true },
    exactActionDigest: input.exactActionDigest,
    policyDecisionReceipt: input.policyDecisionReceipt,
    gatePass: input.gatePass,
    gatePassIssued: input.gatePass !== null,
    supportedOutcomes: ["ACCEPT", "REJECT"],
    deferredOutcomes: ["REFER", "REVOKE"],
    executionReceipt: null,
    executionAvailable: false,
    actionExecuted: false,
    localOnly: true,
    productionReady: false,
    commercialWisdomAssessed: false,
  };
}

function rejectedWithoutDecision(
  reference: ActionCapabilityPassportReference,
  reasonCode: string,
): McpExactActionResult {
  return {
    resultVersion: MCP_EXACT_ACTION_RESULT_VERSION,
    gatewayVersion: MCP_EXACT_ACTION_GATEWAY_VERSION,
    outcome: "REJECT",
    reasonCodes: [reasonCode],
    passport: { ...reference, verified: false },
    exactActionDigest: null,
    policyDecisionReceipt: null,
    gatePass: null,
    gatePassIssued: false,
    supportedOutcomes: ["ACCEPT", "REJECT"],
    deferredOutcomes: ["REFER", "REVOKE"],
    executionReceipt: null,
    executionAvailable: false,
    actionExecuted: false,
    localOnly: true,
    productionReady: false,
    commercialWisdomAssessed: false,
  };
}

export function validateMcpExactActionRequest(value: unknown): McpExactActionRequest {
  const root = requireRecord(value, "MCP_INPUT_INVALID", "Tool arguments must be an object.");
  requireExactKeys(root, ["requestVersion", "passportReference", "toolBinding", "evidenceReferences", "proposedAction"]);
  if (root.requestVersion !== MCP_EXACT_ACTION_REQUEST_VERSION) {
    throw new McpExactActionInputError("REQUEST_VERSION_INVALID", "Unsupported MCP exact-action request version.");
  }
  const passportReference = requireRecord(root.passportReference, "PASSPORT_REFERENCE_INVALID", "Passport reference must be an object.");
  requireExactKeys(passportReference, ["passportId", "passportVersion", "passportDigest"]);
  const toolBinding = requireRecord(root.toolBinding, "TOOL_BINDING_INVALID", "Tool binding must be an object.");
  requireExactKeys(toolBinding, ["mcpServerIdentity", "toolIdentity", "operation", "inputSchemaIdentity", "inputSchemaVersion", "inputSchemaDigest"]);
  const evidenceReferences = requireRecord(root.evidenceReferences, "EVIDENCE_REFERENCES_INVALID", "Evidence references must be an object.");
  requireExactKeys(evidenceReferences, ["humanAuthority", "humanApproval", "agentStanding", "mandate"]);
  const proposedAction = requireRecord(root.proposedAction, "PROPOSED_ACTION_INVALID", "Proposed action must be an object.");
  const actionKeys = [
    "organisationId", "agentId", "supplierId", "supplierName", "product", "category",
    "quantity", "totalAmount", "currency", "commercialTermsReference", "actionType",
    "jurisdiction", "riskTier", "timestamp", "nonce", "policyVersion",
  ];
  requireExactKeys(proposedAction, actionKeys);

  const actionStringLimits: Record<string, { min: number; max: number }> = {
    organisationId: { min: 1, max: 160 }, agentId: { min: 1, max: 200 },
    supplierId: { min: 1, max: 160 }, supplierName: { min: 1, max: 200 },
    product: { min: 1, max: 200 }, category: { min: 1, max: 120 },
    currency: { min: 3, max: 3 }, commercialTermsReference: { min: 1, max: 200 },
    actionType: { min: 1, max: 120 }, jurisdiction: { min: 2, max: 32 },
    riskTier: { min: 1, max: 40 }, timestamp: { min: 1, max: 40 },
    nonce: { min: 8, max: 200 }, policyVersion: { min: 1, max: 160 },
  };
  for (const [key, limits] of Object.entries(actionStringLimits)) {
    requireBoundedString(proposedAction[key], `PROPOSED_ACTION_${key.toUpperCase()}_INVALID`, limits.min, limits.max);
  }
  if (!Number.isInteger(proposedAction.quantity)
    || (proposedAction.quantity as number) < 1
    || (proposedAction.quantity as number) > 1_000_000) {
    throw new McpExactActionInputError("PROPOSED_ACTION_QUANTITY_INVALID", "Quantity must be a positive integer.");
  }
  if (typeof proposedAction.totalAmount !== "number"
    || !Number.isFinite(proposedAction.totalAmount)
    || proposedAction.totalAmount < 0
    || proposedAction.totalAmount > 1_000_000_000) {
    throw new McpExactActionInputError("PROPOSED_ACTION_AMOUNT_INVALID", "Total amount must be a finite non-negative number.");
  }
  if (!/^[A-Z]{3}$/.test(proposedAction.currency as string)) {
    throw new McpExactActionInputError("PROPOSED_ACTION_CURRENCY_INVALID", "Currency must be a three-letter uppercase code.");
  }
  if (!Number.isFinite(Date.parse(proposedAction.timestamp as string))) {
    throw new McpExactActionInputError("PROPOSED_ACTION_TIMESTAMP_INVALID", "Timestamp must be an ISO date-time.");
  }
  requireBoundedString(passportReference.passportId, "PASSPORT_ID_INVALID", 1, 160);
  requireBoundedString(passportReference.passportVersion, "PASSPORT_VERSION_INVALID", 1, 40);
  requireBoundedString(passportReference.passportDigest, "PASSPORT_DIGEST_INVALID", 1, 80);
  requireBoundedString(toolBinding.mcpServerIdentity, "MCP_SERVER_IDENTITY_INVALID", 1, 200);
  requireBoundedString(toolBinding.toolIdentity, "TOOL_IDENTITY_INVALID", 1, 120);
  requireBoundedString(toolBinding.operation, "OPERATION_INVALID", 1, 120);
  requireBoundedString(toolBinding.inputSchemaIdentity, "SCHEMA_IDENTITY_INVALID", 1, 160);
  requireBoundedString(toolBinding.inputSchemaVersion, "SCHEMA_VERSION_INVALID", 1, 40);
  requireBoundedString(toolBinding.inputSchemaDigest, "SCHEMA_DIGEST_INVALID", 1, 80);
  for (const key of ["humanAuthority", "humanApproval", "agentStanding", "mandate"] as const) {
    requireBoundedString(evidenceReferences[key], `${key.toUpperCase()}_INVALID`, 1, 240);
  }
  if (!/^sha256:[a-f0-9]{64}$/.test(passportReference.passportDigest as string)
    || !/^sha256:[a-f0-9]{64}$/.test(toolBinding.inputSchemaDigest as string)) {
    throw new McpExactActionInputError("DIGEST_FORMAT_INVALID", "Digests must use lowercase sha256:<hex> form.");
  }
  return structuredClone(root) as unknown as McpExactActionRequest;
}

function requireRecord(value: unknown, reasonCode: string, message: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new McpExactActionInputError(reasonCode, message);
  }
  return value as Record<string, unknown>;
}

function requireExactKeys(record: Record<string, unknown>, expected: readonly string[]): void {
  const actual = Object.keys(record).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    throw new McpExactActionInputError(
      "UNEXPECTED_OR_MISSING_FIELD",
      `Expected exactly these fields: ${wanted.join(", ")}.`,
    );
  }
}

function requireBoundedString(
  value: unknown,
  reasonCode: string,
  minimumLength: number,
  maximumLength: number,
): asserts value is string {
  if (typeof value !== "string"
    || value.trim().length < minimumLength
    || value.length > maximumLength) {
    throw new McpExactActionInputError(reasonCode, "A bounded non-empty string is required.");
  }
}
