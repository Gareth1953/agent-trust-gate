import {
  createCanonicalActionEnvelope,
  createPolicyDecisionReceipt,
  issueExactActionGatePass,
  type CanonicalJsonValue,
  type ExactActionGatePass,
  type PolicyDecisionReceipt,
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

export const MCP_EXACT_ACTION_REQUEST_VERSION =
  "atg.mcp-exact-action-request.local.v1" as const;
export const MCP_EXACT_ACTION_RESULT_VERSION =
  "atg.mcp-exact-action-result.local.v1" as const;
export const MCP_EXACT_ACTION_PROTOCOL_VERSION = "2025-06-18" as const;
export const MCP_EXACT_ACTION_GATEWAY_VERSION =
  "atg.mcp-exact-action-gateway.local.v1" as const;

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

export const MCP_EXACT_ACTION_TOOL_INPUT_SCHEMA = {
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

export const MCP_EXACT_ACTION_TOOL_OUTPUT_SCHEMA = {
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

export const MCP_EXACT_ACTION_INPUT_SCHEMA_DIGEST = createCanonicalPayloadHash(
  MCP_EXACT_ACTION_TOOL_INPUT_SCHEMA,
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
  readonly #evaluatedAt: string;

  constructor(options: {
    prototype?: ExactActionTrustGatewayPrototype;
    registry?: ActionCapabilityPassportRegistry;
    evaluatedAt?: string;
  } = {}) {
    this.#prototype = options.prototype ?? new ExactActionTrustGatewayPrototype();
    this.#registry = options.registry
      ?? new ActionCapabilityPassportRegistry([DEFAULT_ACTION_CAPABILITY_PASSPORT]);
    this.#evaluatedAt = options.evaluatedAt ?? ACTION_CAPABILITY_PASSPORT_REFERENCE_TIME;
  }

  async evaluateAction(value: unknown): Promise<McpExactActionResult> {
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
    const evaluation = await this.#prototype.evaluateExactAction(scenario);
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

    if (evaluation.decision === "GATEPASS_ISSUED") {
      const issuance = issueExactActionGatePass(exactActionInput);
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
