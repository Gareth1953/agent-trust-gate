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
      description: "Client local decision allowance or runtime request limit exceeded.",
      content: {
        "application/json": {
          schema: {
            oneOf: [schema("ErrorResponse"), schema("RateLimitExceededResponse")],
          },
        },
      },
      "x-atg-error-codes": ["CLIENT_USAGE_LIMIT_EXCEEDED", "ATG_RATE_LIMIT_EXCEEDED"],
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
      "/v1/agent-manifest.json": {
        get: {
          tags: ["Gateway"],
          summary: "Read agent integration metadata",
          description: "Returns local discovery metadata only and does not require an API key. The request ID is returned in the X-ATG-Request-ID header.",
          parameters: [{ $ref: "#/components/parameters/ClientIdHeader" }],
          responses: {
            "200": {
              description: "Agent-readable local integration manifest.",
              headers: {
                "X-ATG-Request-ID": {
                  description: "Local gateway request identifier.",
                  schema: { type: "string" },
                },
              },
              content: { "application/json": { schema: schema("AgentIntegrationManifest") } },
            },
            "405": errors["405"],
            "500": errors["500"],
          },
        },
      },
      "/v1/entitlement": {
        get: {
          tags: ["Gateway"],
          summary: "Read local client entitlement status",
          description: "Returns local usage, allowance, over-limit, and upgrade-required signals. Requires a valid local API key only when the gateway runs in API-key mode. Purchase, automatic purchase, and billing remain disabled.",
          parameters: protectedParameters,
          security: [{}, { LocalApiKey: [] }],
          responses: {
            "200": response("Local entitlement and disabled commerce signals.", "EntitlementResponse"),
            "401": errors["401"],
            "405": errors["405"],
            "500": errors["500"],
          },
        },
      },
      "/v1/commercial-readiness": {
        get: {
          tags: ["Gateway"],
          summary: "Read the local commercial readiness snapshot",
          description: "Returns deterministic planning scores and gaps only. It does not implement hosting, payments, billing, automatic purchase, marketing automation, or action execution.",
          parameters: [{ $ref: "#/components/parameters/ClientIdHeader" }],
          responses: {
            "200": response("Local commercial readiness planning snapshot.", "CommercialReadinessResponse"),
            "405": errors["405"],
            "500": errors["500"],
          },
        },
      },
      "/v1/hosted-readiness": {
        get: {
          tags: ["Gateway"],
          summary: "Read local hosted deployment readiness",
          description: "Returns planning checks and safe configuration guidance only. It does not deploy Agent Trust Gate, change the localhost binding, or expose a public service.",
          parameters: [{ $ref: "#/components/parameters/ClientIdHeader" }],
          responses: {
            "200": response("Local hosted deployment readiness report.", "HostedReadinessResponse"),
            "405": errors["405"],
            "500": errors["500"],
          },
        },
      },
      "/v1/security-readiness": {
        get: {
          tags: ["Gateway"],
          summary: "Read local production security readiness",
          description: "Returns deterministic security planning checks and gaps only. It does not certify security, deploy Agent Trust Gate, change the localhost binding, or expose a public service.",
          parameters: [{ $ref: "#/components/parameters/ClientIdHeader" }],
          responses: {
            "200": response("Local production security readiness report.", "SecurityReadinessResponse"),
            "405": errors["405"],
            "500": errors["500"],
          },
        },
      },
      "/v1/rate-limit-status": {
        get: {
          tags: ["Gateway"],
          summary: "Read local rate-limit and abuse-control status",
          description: "Returns local runtime counters and deterministic signals only. API-key mode protects client status when enabled. This is not production-grade abuse prevention and does not purchase capacity.",
          parameters: protectedParameters,
          security: [{}, { LocalApiKey: [] }],
          responses: {
            "200": response("Local rate-limit and abuse-control status.", "RateLimitStatusResponse"),
            "401": errors["401"],
            "405": errors["405"],
            "500": errors["500"],
          },
        },
      },
      "/v1/monitoring-health": {
        get: {
          tags: ["Gateway"],
          summary: "Read local monitoring and operational health",
          description: "Returns local runtime and request-log signals only. It does not provide production monitoring, external alerting, public uptime guarantees, deployment, or action execution.",
          parameters: [{ $ref: "#/components/parameters/ClientIdHeader" }],
          responses: {
            "200": response("Local monitoring and operational health report.", "MonitoringHealthResponse"),
            "405": errors["405"],
            "500": errors["500"],
          },
        },
      },
      "/v1/incident-response-readiness": {
        get: {
          tags: ["Gateway"],
          summary: "Read local incident response and recovery readiness",
          description: "Returns local planning metadata only. It does not provide production incident response, external alerting, customer notifications, deployment, or action execution.",
          parameters: [{ $ref: "#/components/parameters/ClientIdHeader" }],
          responses: {
            "200": response("Local incident response and operational recovery readiness report.", "IncidentResponseReadinessResponse"),
            "405": errors["405"],
            "500": errors["500"],
          },
        },
      },
      "/v1/customer-tenant-readiness": {
        get: {
          tags: ["Gateway"],
          summary: "Read local customer account and tenant readiness",
          description: "Returns local planning metadata only. It does not create real accounts, collect personal data, provide login or signup, bill customers, process payments, enable automatic purchase, or execute actions.",
          parameters: [{ $ref: "#/components/parameters/ClientIdHeader" }],
          responses: {
            "200": response("Local customer account and tenant readiness report.", "CustomerTenantReadinessResponse"),
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
        entitlement_status: { type: "string", enum: ["over_limit"] },
        upgrade_required: { type: "boolean" },
        purchase_enabled: { type: "boolean", const: false },
        automatic_purchase_enabled: { type: "boolean", const: false },
        billing_enabled: { type: "boolean", const: false },
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
    AgentIntegrationManifest: {
      type: "object",
      required: ["name", "product", "contract_version", "gateway_api_version", "manifest_version", "local_only", "base_url", "openapi_url", "capabilities", "schemas", "tools", "auth", "usage_model", "safety_statement"],
      properties: {
        name: { type: "string", const: "Agent Trust Gate" },
        product: { type: "string", const: "agent-trust-gate" },
        contract_version: contractVersion,
        gateway_api_version: { type: "string", const: GATEWAY_API_VERSION },
        manifest_version: { type: "string", const: "atg.agent-manifest.v1" },
        local_only: { type: "boolean", const: true },
        base_url: { type: "string", const: "http://127.0.0.1:8787" },
        openapi_url: { type: "string", const: "/v1/openapi.json" },
        capabilities: { type: "array", items: { type: "string" } },
        schemas: { type: "object" },
        tools: { type: "array", items: { type: "object" } },
        auth: { type: "object" },
        usage_model: { type: "object" },
        safety_statement: { type: "string" },
      },
    },
    EntitlementResponse: {
      type: "object",
      required: ["contract_version", "entitlement_version", "request_id", "client_id", "tenant_id", "account_id", "local_only", "billing_enabled", "payment_processing_enabled", "automatic_purchase_enabled", "entitlement_status", "usage", "upgrade", "safety_statement"],
      properties: {
        contract_version: contractVersion,
        entitlement_version: { type: "string", const: "atg.entitlement.v1" },
        request_id: { type: "string" },
        client_id: { type: "string" },
        tenant_id: { type: "null", description: "Reserved for future tenant ownership; local entitlement lookup does not create or resolve customer records." },
        account_id: { type: "null", description: "Reserved for future account ownership; local entitlement lookup does not create or resolve customer records." },
        local_only: { type: "boolean", const: true },
        billing_enabled: { type: "boolean", const: false },
        payment_processing_enabled: { type: "boolean", const: false },
        automatic_purchase_enabled: { type: "boolean", const: false },
        entitlement_status: {
          type: "string",
          enum: ["active", "unlimited_local", "at_limit", "over_limit", "unknown_client"],
        },
        usage: {
          type: "object",
          required: ["decision_allowance", "allowance_window", "used_decisions", "remaining_decisions", "over_limit"],
          properties: {
            decision_allowance: { type: ["integer", "null"], minimum: 0 },
            allowance_window: { type: ["string", "null"], enum: ["all_time", "daily", "monthly", null] },
            used_decisions: { type: "integer", minimum: 0 },
            remaining_decisions: { type: ["integer", "null"], minimum: 0 },
            over_limit: { type: "boolean" },
          },
        },
        upgrade: {
          type: "object",
          required: ["upgrade_required", "upgrade_reason", "purchase_enabled", "automatic_purchase_enabled", "billing_enabled", "purchase_mode"],
          properties: {
            upgrade_required: { type: "boolean" },
            upgrade_reason: {
              type: ["string", "null"],
              enum: ["local_decision_allowance_exceeded", "local_decision_allowance_at_limit", null],
            },
            purchase_enabled: { type: "boolean", const: false, description: "Real purchase is not enabled." },
            automatic_purchase_enabled: { type: "boolean", const: false, description: "Automatic purchase is not enabled." },
            billing_enabled: { type: "boolean", const: false, description: "Billing is not enabled." },
            purchase_mode: { type: "string", const: "not_enabled_local_only" },
          },
        },
        safety_statement: { type: "string" },
      },
    },
    CommercialReadinessCategory: {
      type: "object",
      required: ["id", "label", "readiness_percent", "status", "evidence", "gaps", "next_step"],
      properties: {
        id: { type: "string" },
        label: { type: "string" },
        readiness_percent: { type: "integer", minimum: 0, maximum: 100 },
        status: { type: "string", enum: ["complete", "partial", "not_started", "future"] },
        evidence: { type: "array", items: { type: "string" } },
        gaps: { type: "array", items: { type: "string" } },
        next_step: { type: "string" },
      },
    },
    CommercialReadinessResponse: {
      type: "object",
      required: ["contract_version", "readiness_version", "generated_at", "request_id", "local_only", "overall", "categories", "completed_capabilities", "missing_capabilities", "recommended_next_steps", "safety_statement"],
      properties: {
        contract_version: contractVersion,
        readiness_version: { type: "string", const: "atg.commercial-readiness.v1" },
        generated_at: { type: "string", format: "date-time" },
        request_id: { type: "string" },
        local_only: { type: "boolean", const: true },
        overall: {
          type: "object",
          required: ["local_product_readiness_percent", "commercial_mvp_readiness_percent", "full_target_readiness_percent", "status"],
          properties: {
            local_product_readiness_percent: { type: "integer", minimum: 0, maximum: 100 },
            commercial_mvp_readiness_percent: { type: "integer", minimum: 0, maximum: 100 },
            full_target_readiness_percent: { type: "integer", minimum: 0, maximum: 100, description: "Must not be interpreted as 100% commercial completion." },
            status: { type: "string", const: "local_infrastructure_ready_not_commercially_complete" },
          },
        },
        categories: {
          type: "array",
          items: { $ref: "#/components/schemas/CommercialReadinessCategory" },
        },
        completed_capabilities: { type: "array", items: { type: "string" } },
        missing_capabilities: { type: "array", items: { type: "string" } },
        recommended_next_steps: { type: "array", items: { type: "string" } },
        safety_statement: {
          type: "string",
          description: "Planning only: no billing, payment processing, automatic purchase, public hosting, or action execution.",
        },
      },
    },
    HostedReadinessCheck: {
      type: "object",
      required: ["id", "label", "status", "severity", "evidence", "recommendation"],
      properties: {
        id: { type: "string" },
        label: { type: "string" },
        status: { type: "string", enum: ["pass", "partial", "fail", "not_started", "future"] },
        severity: { type: "string", enum: ["info", "warning", "critical"] },
        evidence: { type: "array", items: { type: "string" } },
        recommendation: { type: "string" },
      },
    },
    HostedReadinessResponse: {
      type: "object",
      required: ["contract_version", "hosted_readiness_version", "generated_at", "request_id", "local_only", "hosted_deployment_enabled", "public_service_enabled", "production_ready", "overall", "checks", "required_before_hosting", "recommended_environment", "safety_statement"],
      properties: {
        contract_version: contractVersion,
        hosted_readiness_version: { type: "string", const: "atg.hosted-readiness.v1" },
        generated_at: { type: "string", format: "date-time" },
        request_id: { type: "string" },
        local_only: { type: "boolean", const: true },
        hosted_deployment_enabled: { type: "boolean", const: false },
        public_service_enabled: { type: "boolean", const: false },
        production_ready: { type: "boolean", const: false },
        overall: {
          type: "object",
          required: ["hosted_readiness_percent", "status", "next_gate"],
          properties: {
            hosted_readiness_percent: { type: "integer", minimum: 0, maximum: 100 },
            status: { type: "string", const: "not_hosted_preparation_only" },
            next_gate: { type: "string", const: "complete_production_security_controls_before_public_hosting" },
          },
        },
        checks: {
          type: "array",
          items: { $ref: "#/components/schemas/HostedReadinessCheck" },
        },
        required_before_hosting: { type: "array", items: { type: "string" } },
        recommended_environment: {
          type: "object",
          required: ["host", "port", "require_api_key", "public_base_url", "hosted_deployment_enabled", "payment_enabled", "automatic_purchase_enabled", "billing_enabled", "tls_termination", "secrets_storage"],
          properties: {
            host: { type: "string", const: "127.0.0.1" },
            port: { type: "integer", const: 8787 },
            require_api_key: { type: "boolean", const: false },
            clients_file: { type: "string" },
            log_file: { type: "string" },
            public_base_url: { type: "null" },
            hosted_deployment_enabled: { type: "boolean", const: false },
            payment_enabled: { type: "boolean", const: false },
            automatic_purchase_enabled: { type: "boolean", const: false },
            billing_enabled: { type: "boolean", const: false },
            tls_termination: { type: "string", const: "required_before_public_hosting" },
            secrets_storage: { type: "string", const: "managed_secret_storage_required_before_hosting" },
          },
        },
        safety_statement: {
          type: "string",
          description: "Planning only: no deployment, public exposure, payments, billing, automatic purchase, or action execution.",
        },
      },
    },
    SecurityReadinessCheck: {
      type: "object",
      required: ["id", "label", "status", "severity", "evidence", "recommendation"],
      properties: {
        id: { type: "string" },
        label: { type: "string" },
        status: { type: "string", enum: ["pass", "partial", "fail", "not_started", "future"] },
        severity: { type: "string", enum: ["info", "warning", "critical"] },
        evidence: { type: "array", items: { type: "string" } },
        recommendation: { type: "string" },
      },
    },
    SecurityReadinessResponse: {
      type: "object",
      required: ["contract_version", "security_readiness_version", "generated_at", "request_id", "local_only", "production_security_certified", "public_service_safe", "payment_security_ready", "overall", "checks", "critical_gaps", "required_before_public_hosting", "recommended_security_controls", "safety_statement"],
      properties: {
        contract_version: contractVersion,
        security_readiness_version: { type: "string", const: "atg.security-readiness.v1" },
        generated_at: { type: "string", format: "date-time" },
        request_id: { type: "string" },
        local_only: { type: "boolean", const: true },
        production_security_certified: { type: "boolean", const: false },
        public_service_safe: { type: "boolean", const: false },
        payment_security_ready: { type: "boolean", const: false },
        overall: {
          type: "object",
          required: ["security_readiness_percent", "status", "next_gate"],
          properties: {
            security_readiness_percent: { type: "integer", minimum: 0, maximum: 100 },
            status: { type: "string", const: "security_preparation_only_not_production_certified" },
            next_gate: { type: "string", const: "complete_production_security_controls_before_public_hosting" },
          },
        },
        checks: {
          type: "array",
          items: { $ref: "#/components/schemas/SecurityReadinessCheck" },
        },
        critical_gaps: { type: "array", items: { type: "string" } },
        required_before_public_hosting: { type: "array", items: { type: "string" } },
        recommended_security_controls: { type: "array", items: { type: "string" } },
        safety_statement: {
          type: "string",
          description: "Planning only: not security, legal, privacy, SOC2, ISO27001, GDPR, payment, or production certification.",
        },
      },
    },
    AbuseSignal: {
      type: "object",
      required: ["abuse_status", "reasons"],
      properties: {
        abuse_status: {
          type: "string",
          enum: ["none", "suspicious_volume", "over_limit", "repeated_errors", "unknown_client"],
        },
        reasons: { type: "array", items: { type: "string" } },
      },
    },
    RateLimitStatusResponse: {
      type: "object",
      required: ["contract_version", "rate_limit_version", "client_id", "local_only", "rate_limit_status", "rate_limited", "window", "abuse_signal", "upgrade", "safety_statement"],
      properties: {
        contract_version: contractVersion,
        rate_limit_version: { type: "string", const: "atg.rate-limit.v1" },
        request_id: { type: "string" },
        client_id: { type: "string" },
        local_only: { type: "boolean", const: true },
        rate_limit_status: {
          type: "string",
          enum: ["not_configured", "within_limit", "near_limit", "at_limit", "over_limit"],
        },
        rate_limited: { type: "boolean" },
        window: {
          type: "object",
          required: ["window_type", "max_requests", "used_requests", "remaining_requests"],
          properties: {
            window_type: { type: "string", enum: ["local_runtime", "local_log_audit"] },
            max_requests: { type: ["integer", "null"], minimum: 1 },
            used_requests: { type: "integer", minimum: 0 },
            remaining_requests: { type: ["integer", "null"], minimum: 0 },
          },
        },
        abuse_signal: { $ref: "#/components/schemas/AbuseSignal" },
        upgrade: {
          type: "object",
          required: ["upgrade_required", "purchase_enabled", "automatic_purchase_enabled", "billing_enabled"],
          properties: {
            upgrade_required: { type: "boolean" },
            purchase_enabled: { type: "boolean", const: false },
            automatic_purchase_enabled: { type: "boolean", const: false },
            billing_enabled: { type: "boolean", const: false },
          },
        },
        safety_statement: {
          type: "string",
          description: "Local control only; not production-grade abuse prevention, billing, payment processing, or action execution.",
        },
      },
    },
    RateLimitExceededResponse: {
      type: "object",
      required: ["ok", "contract_version", "request_id", "client_id", "rate_limit_status", "abuse_status", "rate_limit", "purchase_enabled", "automatic_purchase_enabled", "billing_enabled", "executes_actions", "error"],
      properties: {
        ok: { type: "boolean", const: false },
        contract_version: contractVersion,
        request_id: { type: "string" },
        client_id: { type: "string" },
        rate_limit_status: { type: "string", const: "over_limit" },
        abuse_status: { type: "string", const: "over_limit" },
        rate_limit: { $ref: "#/components/schemas/RateLimitStatusResponse" },
        purchase_enabled: { type: "boolean", const: false },
        automatic_purchase_enabled: { type: "boolean", const: false },
        billing_enabled: { type: "boolean", const: false },
        executes_actions: { type: "boolean", const: false },
        error: {
          type: "object",
          required: ["code", "message", "details"],
          properties: {
            code: { type: "string", const: "ATG_RATE_LIMIT_EXCEEDED" },
            message: { type: "string" },
            details: { type: "array", items: {} },
          },
        },
      },
    },
    IncidentSeverity: {
      type: "object",
      required: ["id", "label", "example_conditions", "recommended_response", "escalation_required"],
      properties: {
        id: { type: "string", enum: ["sev0_critical", "sev1_high", "sev2_medium", "sev3_low"] },
        label: { type: "string" },
        example_conditions: { type: "array", items: { type: "string" } },
        recommended_response: { type: "string" },
        escalation_required: { type: "boolean" },
      },
    },
    IncidentReadinessCheck: {
      type: "object",
      required: ["id", "label", "status", "severity", "evidence", "recommendation"],
      properties: {
        id: { type: "string" },
        label: { type: "string" },
        status: { type: "string", enum: ["pass", "partial", "fail", "not_started", "future"] },
        severity: { type: "string", enum: ["info", "warning", "critical"] },
        evidence: { type: "array", items: { type: "string" } },
        recommendation: { type: "string" },
      },
    },
    IncidentResponseStep: {
      type: "string",
      description: "Deterministic local planning guidance. It is not an automatically executed operation.",
    },
    IncidentResponseReadinessResponse: {
      type: "object",
      required: ["contract_version", "incident_response_version", "generated_at", "request_id", "local_only", "production_incident_response_enabled", "external_alerting_enabled", "customer_notification_automation_enabled", "overall", "severity_model", "checks", "containment_steps", "recovery_steps", "required_before_public_hosting", "recommended_operational_controls", "safety_statement"],
      properties: {
        contract_version: contractVersion,
        incident_response_version: { type: "string", const: "atg.incident-response.v1" },
        generated_at: { type: "string", format: "date-time" },
        request_id: { type: "string" },
        local_only: { type: "boolean", const: true },
        production_incident_response_enabled: { type: "boolean", const: false },
        external_alerting_enabled: { type: "boolean", const: false },
        customer_notification_automation_enabled: { type: "boolean", const: false },
        overall: {
          type: "object",
          required: ["incident_response_readiness_percent", "status", "next_gate"],
          properties: {
            incident_response_readiness_percent: { type: "integer", minimum: 0, maximum: 100 },
            status: { type: "string", const: "local_incident_response_planning_only" },
            next_gate: { type: "string", const: "define_production_incident_process_before_public_hosting" },
          },
        },
        severity_model: { type: "array", items: { $ref: "#/components/schemas/IncidentSeverity" } },
        checks: { type: "array", items: { $ref: "#/components/schemas/IncidentReadinessCheck" } },
        containment_steps: { type: "array", items: { $ref: "#/components/schemas/IncidentResponseStep" } },
        recovery_steps: { type: "array", items: { $ref: "#/components/schemas/IncidentResponseStep" } },
        required_before_public_hosting: { type: "array", items: { type: "string" } },
        recommended_operational_controls: { type: "array", items: { type: "string" } },
        safety_statement: {
          type: "string",
          description: "Planning only: no production incident response, alerting, notification automation, certification, payment processing, or action execution.",
        },
      },
    },
    CustomerTenantReadinessCheck: {
      type: "object",
      required: ["id", "label", "status", "severity", "evidence", "recommendation"],
      properties: {
        id: { type: "string" },
        label: { type: "string" },
        status: { type: "string", enum: ["pass", "partial", "fail", "not_started", "future"] },
        severity: { type: "string", enum: ["info", "warning", "critical"] },
        evidence: { type: "array", items: { type: "string" } },
        recommendation: { type: "string" },
      },
    },
    CustomerAccountModel: {
      type: "object",
      required: ["account_id_format", "supports_tenants", "supports_client_ownership", "supports_plan_status", "supports_usage_ownership", "production_login_enabled", "personal_data_collection_enabled", "real_customer_records_enabled"],
      properties: {
        account_id_format: { type: "string", const: "local-account-placeholder" },
        supports_tenants: { type: "boolean", const: true },
        supports_client_ownership: { type: "boolean", const: true },
        supports_plan_status: { type: "boolean", const: true },
        supports_usage_ownership: { type: "boolean", const: true },
        production_login_enabled: { type: "boolean", const: false },
        personal_data_collection_enabled: { type: "boolean", const: false },
        real_customer_records_enabled: { type: "boolean", const: false },
      },
    },
    CustomerTenantModel: {
      type: "object",
      required: ["concepts", "production_tenant_records_enabled", "allowed_local_billing_status", "allowed_local_payment_status"],
      properties: {
        concepts: { type: "array", items: { type: "string", enum: ["tenant_id", "account_id", "tenant_name", "tenant_status", "plan_code", "billing_status", "payment_status", "created_at", "clients"] } },
        production_tenant_records_enabled: { type: "boolean", const: false },
        allowed_local_billing_status: { type: "string", const: "not_enabled" },
        allowed_local_payment_status: { type: "string", const: "not_enabled" },
      },
    },
    CustomerClientMappingModel: {
      type: "object",
      required: ["concepts", "production_mapping_enabled", "local_only_mapping_available"],
      properties: {
        concepts: { type: "array", items: { type: "string", enum: ["client_id", "tenant_id", "account_id", "plan_code", "entitlement_status", "usage_owner", "billing_owner"] } },
        production_mapping_enabled: { type: "boolean", const: false },
        local_only_mapping_available: { type: "boolean", const: true },
      },
    },
    CustomerTenantReadinessResponse: {
      type: "object",
      required: ["contract_version", "customer_tenant_readiness_version", "generated_at", "request_id", "local_only", "production_customer_accounts_enabled", "real_customer_data_enabled", "billing_enabled", "payment_processing_enabled", "automatic_purchase_enabled", "overall", "account_model", "tenant_model", "client_mapping_model", "local_tenant_config", "checks", "required_before_billing", "recommended_customer_controls", "safety_statement"],
      properties: {
        contract_version: contractVersion,
        customer_tenant_readiness_version: { type: "string", const: "atg.customer-tenant-readiness.v1" },
        generated_at: { type: "string", format: "date-time" },
        request_id: { type: "string" },
        local_only: { type: "boolean", const: true },
        production_customer_accounts_enabled: { type: "boolean", const: false },
        real_customer_data_enabled: { type: "boolean", const: false },
        billing_enabled: { type: "boolean", const: false },
        payment_processing_enabled: { type: "boolean", const: false },
        automatic_purchase_enabled: { type: "boolean", const: false },
        overall: {
          type: "object",
          required: ["customer_tenant_readiness_percent", "status", "next_gate"],
          properties: {
            customer_tenant_readiness_percent: { type: "integer", minimum: 0, maximum: 100 },
            status: { type: "string", const: "local_customer_tenant_planning_only" },
            next_gate: { type: "string", const: "define_production_customer_account_and_billing_model_before_payments" },
          },
        },
        account_model: { $ref: "#/components/schemas/CustomerAccountModel" },
        tenant_model: { $ref: "#/components/schemas/CustomerTenantModel" },
        client_mapping_model: { $ref: "#/components/schemas/CustomerClientMappingModel" },
        local_tenant_config: {
          type: "object",
          description: "Optional validated local placeholder metadata only; no account is created.",
        },
        checks: { type: "array", items: { $ref: "#/components/schemas/CustomerTenantReadinessCheck" } },
        required_before_billing: { type: "array", items: { type: "string" } },
        recommended_customer_controls: { type: "array", items: { type: "string" } },
        safety_statement: {
          type: "string",
          description: "Local planning only: no real accounts, personal-data collection, login, billing, payments, automatic purchase, public service, or action execution.",
        },
      },
    },
    MonitoringHealthCheck: {
      type: "object",
      required: ["id", "label", "status", "severity", "evidence", "recommendation"],
      properties: {
        id: { type: "string" },
        label: { type: "string" },
        status: { type: "string", enum: ["pass", "partial", "fail", "not_started", "future"] },
        severity: { type: "string", enum: ["info", "warning", "critical"] },
        evidence: { type: "array", items: { type: "string" } },
        recommendation: { type: "string" },
      },
    },
    MonitoringLogHealth: {
      type: "object",
      required: ["log_file_found", "log_file_path", "total_logged_requests", "error_requests", "rate_limited_requests", "unauthorized_requests", "malformed_log_lines", "first_request_at", "last_request_at"],
      properties: {
        log_file_found: { type: "boolean" },
        log_file_path: { type: "string" },
        total_logged_requests: { type: "integer", minimum: 0 },
        error_requests: { type: "integer", minimum: 0 },
        rate_limited_requests: { type: "integer", minimum: 0 },
        unauthorized_requests: { type: "integer", minimum: 0 },
        malformed_log_lines: { type: "integer", minimum: 0 },
        first_request_at: { type: ["string", "null"], format: "date-time" },
        last_request_at: { type: ["string", "null"], format: "date-time" },
      },
    },
    MonitoringHealthResponse: {
      type: "object",
      required: ["contract_version", "monitoring_health_version", "generated_at", "request_id", "local_only", "production_monitoring_enabled", "external_alerting_enabled", "public_uptime_sla_enabled", "overall", "runtime", "health", "log_health", "checks", "required_before_public_hosting", "recommended_monitoring_controls", "safety_statement"],
      properties: {
        contract_version: contractVersion,
        monitoring_health_version: { type: "string", const: "atg.monitoring-health.v1" },
        generated_at: { type: "string", format: "date-time" },
        request_id: { type: "string" },
        local_only: { type: "boolean", const: true },
        production_monitoring_enabled: { type: "boolean", const: false },
        external_alerting_enabled: { type: "boolean", const: false },
        public_uptime_sla_enabled: { type: "boolean", const: false },
        overall: {
          type: "object",
          required: ["monitoring_readiness_percent", "status", "next_gate"],
          properties: {
            monitoring_readiness_percent: { type: "integer", minimum: 0, maximum: 100 },
            status: { type: "string", const: "local_monitoring_signals_only" },
            next_gate: { type: "string", const: "add_production_monitoring_and_alerting_before_public_hosting" },
          },
        },
        runtime: {
          type: "object",
          required: ["scope", "uptime_available", "started_at", "uptime_seconds"],
          properties: {
            scope: { type: "string", enum: ["current_gateway_process", "not_available"] },
            uptime_available: { type: "boolean" },
            started_at: { type: ["string", "null"], format: "date-time" },
            uptime_seconds: { type: ["integer", "null"], minimum: 0 },
          },
        },
        health: {
          type: "object",
          required: ["gateway_health_endpoint_available", "request_logging_available", "request_id_available", "usage_metering_available", "rate_limit_signals_available", "security_readiness_available", "hosted_readiness_available"],
          properties: {
            gateway_health_endpoint_available: { type: "boolean", const: true },
            request_logging_available: { type: "boolean", const: true },
            request_id_available: { type: "boolean", const: true },
            usage_metering_available: { type: "boolean", const: true },
            rate_limit_signals_available: { type: "boolean", const: true },
            security_readiness_available: { type: "boolean", const: true },
            hosted_readiness_available: { type: "boolean", const: true },
          },
        },
        log_health: { $ref: "#/components/schemas/MonitoringLogHealth" },
        checks: { type: "array", items: { $ref: "#/components/schemas/MonitoringHealthCheck" } },
        required_before_public_hosting: { type: "array", items: { type: "string" } },
        recommended_monitoring_controls: { type: "array", items: { type: "string" } },
        safety_statement: {
          type: "string",
          description: "Local signal only: no production monitoring, external alerting, public uptime SLA, payment processing, or action execution.",
        },
      },
    },
  };
}
