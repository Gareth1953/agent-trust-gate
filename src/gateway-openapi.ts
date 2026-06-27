import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { CONTRACT_VERSION, SUPPORTED_POLICY_PROFILES } from "./contract.js";

export const GATEWAY_API_VERSION = "atg.gateway.v1" as const;
export const GATEWAY_OPENAPI_VERSION = "3.1.0" as const;
export const GATEWAY_OPENAPI_SAFETY_STATEMENT =
  "The OpenAPI contract describes the local gateway interface. It does not expose a public service, execute actions, bill customers, authenticate real-world identities, guarantee legality, or prove compliance.";

export type GatewayOpenApiDocument = Record<string, unknown>;

const jsonContent = { "application/json": { schema: {} } };

export function createGatewayOpenApiDocument(): GatewayOpenApiDocument {
  const schema = (name: string) => ({ $ref: `#/components/schemas/${name}` });
  const response = (description: string, name: string) => ({
    description,
    content: { "application/json": { schema: schema(name) } },
  });
  const errors = {
    "400": response("Invalid JSON, request, or action descriptor.", "ErrorResponse"),
    "401": response("Unauthorized local gateway request.", "ErrorResponse"),
    "405": response("The endpoint does not support this HTTP method.", "ErrorResponse"),
    "429": {
      ...response("Client local decision allowance exceeded.", "ErrorResponse"),
      "x-atg-error-code": "CLIENT_USAGE_LIMIT_EXCEEDED",
    },
    "500": response("Unexpected local gateway error.", "ErrorResponse"),
  };
  const protectedParameters = [
    { $ref: "#/components/parameters/ClientIdHeader" },
    { $ref: "#/components/parameters/ApiKeyHeader" },
  ];

  return {
    openapi: GATEWAY_OPENAPI_VERSION,
    info: {
      title: "Agent Trust Gate Local Gateway API",
      version: GATEWAY_API_VERSION,
      description: `A localhost-only pre-action trust decision and evidence API. ${GATEWAY_OPENAPI_SAFETY_STATEMENT}`,
      "x-atg-contract-version": CONTRACT_VERSION,
      "x-atg-gateway-api-version": GATEWAY_API_VERSION,
    },
    servers: [
      {
        url: "http://127.0.0.1:8787",
        description: "Local machine gateway only. Do not expose publicly.",
      },
    ],
    tags: [
      { name: "Gateway", description: "Local health and contract discovery." },
      { name: "Trust", description: "Local trust decisions and approval evidence." },
    ],
    paths: {
      "/v1/health": {
        get: {
          tags: ["Gateway"],
          summary: "Check local gateway health",
          parameters: [{ $ref: "#/components/parameters/ClientIdHeader" }],
          responses: {
            "200": response("Gateway health and local API-key mode status.", "HealthResponse"),
            "405": errors["405"],
            "500": errors["500"],
          },
        },
      },
      "/v1/openapi.json": {
        get: {
          tags: ["Gateway"],
          summary: "Read the local gateway OpenAPI contract",
          description: "Does not require an API key. The response request ID is returned in the X-ATG-Request-ID header.",
          parameters: [{ $ref: "#/components/parameters/ClientIdHeader" }],
          responses: {
            "200": {
              description: "The OpenAPI document.",
              headers: {
                "X-ATG-Request-ID": {
                  description: "Local gateway request identifier.",
                  schema: { type: "string" },
                },
              },
              content: jsonContent,
            },
            "405": errors["405"],
            "500": errors["500"],
          },
        },
      },
      "/v1/decision": {
        post: {
          tags: ["Trust"],
          summary: "Evaluate an action before execution",
          description: "Returns a trust decision only. Agent Trust Gate does not execute the described action.",
          parameters: protectedParameters,
          security: [{}, { LocalApiKey: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  oneOf: [schema("ActionDescriptor"), schema("GatewayDecisionRequest")],
                },
              },
            },
          },
          responses: {
            "200": response("Local trust decision.", "DecisionResponse"),
            ...errors,
          },
        },
      },
      "/v1/approval-pack": {
        post: {
          tags: ["Trust"],
          summary: "Create a local approval packet",
          parameters: protectedParameters,
          security: [{}, { LocalApiKey: [] }],
          requestBody: {
            required: true,
            content: { "application/json": { schema: schema("GatewayApprovalPackRequest") } },
          },
          responses: {
            "200": response("Approval packet and optional local save status.", "ApprovalPackResponse"),
            ...errors,
          },
        },
      },
      "/v1/evidence-bundle": {
        post: {
          tags: ["Trust"],
          summary: "Create a local evidence bundle",
          parameters: protectedParameters,
          security: [{}, { LocalApiKey: [] }],
          requestBody: {
            required: true,
            content: { "application/json": { schema: schema("GatewayEvidenceBundleRequest") } },
          },
          responses: {
            "200": response("Evidence bundle and optional local save status.", "EvidenceBundleResponse"),
            ...errors,
          },
        },
      },
    },
    components: {
      responses: {
        InvalidRequest: response("Invalid JSON, request, or action descriptor.", "ErrorResponse"),
        UnauthorizedGatewayRequest: response("Unauthorized local gateway request.", "ErrorResponse"),
        UnknownRoute: response("Unknown local gateway route.", "ErrorResponse"),
        MethodNotAllowed: response("Unsupported method for a known local gateway route.", "ErrorResponse"),
        ClientUsageLimitExceeded: {
          ...response("Client local decision allowance exceeded.", "ErrorResponse"),
          "x-atg-error-code": "CLIENT_USAGE_LIMIT_EXCEEDED",
        },
        InternalGatewayError: response("Unexpected local gateway error.", "ErrorResponse"),
      },
      parameters: {
        ClientIdHeader: {
          name: "X-ATG-Client-ID",
          in: "header",
          required: false,
          description: "Optional local calling-system identifier. Defaults to local-anonymous.",
          schema: { type: "string" },
        },
        ApiKeyHeader: {
          name: "X-ATG-API-Key",
          in: "header",
          required: false,
          description: "Required on protected endpoints only when local API-key mode is enabled. Local development hardening only; it does not authenticate real-world identities. Raw API keys must not be logged.",
          schema: { type: "string", format: "password", writeOnly: true },
        },
      },
      securitySchemes: {
        LocalApiKey: {
          type: "apiKey",
          in: "header",
          name: "X-ATG-API-Key",
          description: "Optional localhost-only API-key gate. Raw API keys must not be logged.",
        },
      },
      schemas: createSchemas(),
    },
    "x-atg-contract-version": CONTRACT_VERSION,
    "x-atg-gateway-api-version": GATEWAY_API_VERSION,
    "x-atg-local-only": true,
    "x-atg-safety-statement": GATEWAY_OPENAPI_SAFETY_STATEMENT,
  };
}

export function formatGatewayOpenApiForConsole(): string {
  const document = createGatewayOpenApiDocument();
  const paths = document.paths as Record<string, unknown>;
  return [
    "Agent Trust Gate gateway OpenAPI contract",
    `openapi: ${String(document.openapi)}`,
    `contract_version: ${CONTRACT_VERSION}`,
    `gateway_api_version: ${GATEWAY_API_VERSION}`,
    "",
    "HTTP endpoints:",
    ...Object.keys(paths).map((path) => `- ${path}`),
    "",
    "Optional local headers:",
    "- X-ATG-Client-ID",
    "- X-ATG-API-Key",
    "",
    GATEWAY_OPENAPI_SAFETY_STATEMENT,
  ].join("\n");
}

export function writeGatewayOpenApiDocument(outputPath: string): string {
  const resolvedPath = resolve(outputPath);
  mkdirSync(dirname(resolvedPath), { recursive: true });
  writeFileSync(resolvedPath, `${JSON.stringify(createGatewayOpenApiDocument(), null, 2)}\n`, "utf8");
  return resolvedPath;
}

function createSchemas(): Record<string, unknown> {
  const contractVersion = { type: "string", const: CONTRACT_VERSION };
  const riskLevel = { type: "string", enum: ["low", "medium", "high", "blocked"] };
  const policyProfile = { type: "string", enum: [...SUPPORTED_POLICY_PROFILES], default: "standard" };
  const commonDecisionProperties = {
    ok: { type: "boolean", const: true },
    request_id: { type: "string" },
    client_id: { type: "string" },
    contract_version: contractVersion,
    allowed: { type: "boolean" },
    risk_level: riskLevel,
    human_approval_required: { type: "boolean" },
    action_type: { type: "string" },
    actor: { type: "string" },
    target: { type: "string" },
    policy_profile: policyProfile,
    regulated_policy: { type: "boolean" },
    approval_reason: { type: ["string", "null"] },
    reasons: { type: "array", items: { type: "string" } },
    gateway_mode: { type: "string", const: "local" },
    safety_statement: { type: "string" },
    usage: { $ref: "#/components/schemas/UsageInfo" },
  };

  return {
    ActionDescriptor: {
      type: "object",
      additionalProperties: false,
      required: ["action_type", "description", "actor", "target"],
      properties: {
        action_type: { type: "string", minLength: 1 },
        description: { type: "string", minLength: 1 },
        actor: { type: "string", minLength: 1 },
        target: { type: "string", minLength: 1 },
        estimated_cost_gbp: { type: "number", minimum: 0 },
        public_action: { type: "boolean" },
        external_commitment: { type: "boolean" },
        money_movement: { type: "boolean" },
        legal_or_compliance_sensitive: { type: "boolean" },
        customer_or_user_facing: { type: "boolean" },
        evidence: { type: "array", items: { type: "string" } },
        rollback_plan: { type: "string" },
        human_approval_status: {
          type: "string",
          enum: ["not_requested", "requested", "approved", "rejected"],
        },
      },
    },
    GatewayDecisionRequest: {
      type: "object",
      additionalProperties: false,
      required: ["action"],
      properties: {
        policy_profile: policyProfile,
        action: { $ref: "#/components/schemas/ActionDescriptor" },
      },
    },
    GatewayApprovalPackRequest: {
      type: "object",
      additionalProperties: false,
      required: ["action"],
      properties: {
        policy_profile: policyProfile,
        action: { $ref: "#/components/schemas/ActionDescriptor" },
        save_approval_pack: { type: "boolean", default: false },
      },
    },
    GatewayEvidenceBundleRequest: {
      type: "object",
      additionalProperties: false,
      required: ["review_record_path"],
      properties: {
        review_record_path: { type: "string", description: "Local review record path." },
        save_evidence_bundle: { type: "boolean", default: false },
      },
    },
    ErrorDetail: {
      type: "object",
      additionalProperties: true,
      properties: { field: { type: "string" }, issue: { type: "string" } },
    },
    ErrorResponse: {
      type: "object",
      required: ["ok", "contract_version", "request_id", "client_id", "error"],
      properties: {
        ok: { type: "boolean", const: false },
        contract_version: contractVersion,
        request_id: { type: "string" },
        client_id: { type: "string" },
        usage: { $ref: "#/components/schemas/UsageInfo" },
        error: {
          type: "object",
          required: ["code", "message", "details"],
          properties: {
            code: {
              type: "string",
              enum: ["INVALID_JSON", "INVALID_ACTION_DESCRIPTOR", "INVALID_EVIDENCE_BUNDLE_INPUT", "UNKNOWN_POLICY_PROFILE", "UNAUTHORIZED_GATEWAY_REQUEST", "NOT_FOUND", "METHOD_NOT_ALLOWED", "CLIENT_USAGE_LIMIT_EXCEEDED", "INTERNAL_GATEWAY_ERROR"],
            },
            message: { type: "string" },
            details: { type: "array", items: { $ref: "#/components/schemas/ErrorDetail" } },
          },
        },
      },
    },
    UsageInfo: {
      type: "object",
      required: ["client_id", "decision_allowance", "allowance_window", "used_decisions", "remaining_decisions", "over_limit"],
      properties: {
        client_id: { type: "string" },
        decision_allowance: { type: "integer", minimum: 0 },
        allowance_window: { type: "string", enum: ["all_time", "daily", "monthly"] },
        used_decisions: { type: "integer", minimum: 0 },
        remaining_decisions: { type: "integer", minimum: 0 },
        over_limit: { type: "boolean" },
      },
    },
    HealthResponse: {
      type: "object",
      required: ["ok", "request_id", "client_id", "service", "contract_version", "mode", "api_key_required", "checked_at"],
      properties: {
        ok: { type: "boolean", const: true },
        request_id: { type: "string" },
        client_id: { type: "string" },
        service: { type: "string", const: "agent-trust-gate" },
        contract_version: contractVersion,
        mode: { type: "string", const: "local-gateway" },
        api_key_required: { type: "boolean" },
        checked_at: { type: "string", format: "date-time" },
      },
    },
    DecisionResponse: {
      type: "object",
      required: ["ok", "request_id", "client_id", "contract_version", "allowed", "risk_level", "human_approval_required", "action_type", "actor", "target", "policy_profile", "regulated_policy", "gateway_mode", "safety_statement"],
      properties: {
        ...commonDecisionProperties,
        receipt_id: { type: "string" },
        checked_at: { type: "string", format: "date-time" },
      },
    },
    ApprovalPackResponse: {
      type: "object",
      required: ["request_id", "client_id", "contract_version", "allowed", "risk_level", "human_approval_required", "action_type", "actor", "target", "policy_profile", "regulated_policy", "approval_pack_saved"],
      properties: {
        ...commonDecisionProperties,
        checked_at: { type: "string", format: "date-time" },
        description: { type: "string" },
        human_review_status: { type: "string", enum: ["pending", "not_required"] },
        approval_statement: { type: "string" },
        receipt_id: { type: "string" },
        approval_pack_saved: { type: "boolean" },
        approval_pack_path: { type: "string" },
      },
    },
    EvidenceBundleResponse: {
      type: "object",
      required: ["request_id", "client_id", "contract_version", "evidence_bundle_version", "created_at", "action", "trust_decision", "human_review", "timeline", "safety_statement", "evidence_bundle_saved"],
      properties: {
        request_id: { type: "string" },
        client_id: { type: "string" },
        contract_version: contractVersion,
        evidence_bundle_version: { type: "string", const: "atg.evidence.v1" },
        created_at: { type: "string", format: "date-time" },
        source_review_record_path: { type: "string" },
        source_approval_pack_path: { type: "string" },
        approval_pack_hash: { type: "string" },
        approval_pack_integrity_status: { type: "string" },
        action: { type: "object" },
        trust_decision: { type: "object" },
        human_review: { type: "object" },
        timeline: { type: "object" },
        safety_statement: { type: "string" },
        usage: { $ref: "#/components/schemas/UsageInfo" },
        evidence_bundle_saved: { type: "boolean" },
        evidence_bundle_path: { type: "string" },
      },
    },
  };
}
