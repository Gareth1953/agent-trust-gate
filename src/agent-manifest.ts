import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { CONTRACT_VERSION } from "./contract.js";
import { GATEWAY_API_VERSION } from "./gateway-openapi.js";

export const AGENT_MANIFEST_VERSION = "atg.agent-manifest.v1" as const;
export const AGENT_MANIFEST_SAFETY_STATEMENT =
  "Agent Trust Gate returns local trust decisions and evidence objects only. It does not execute actions, bill customers, process payments, expose a public service, authenticate real-world identities, guarantee legality, or prove compliance.";

export interface AgentManifestTool {
  name: string;
  description: string;
  transport: "http" | "local_cli";
  http_method: "GET" | "POST" | "LOCAL_CLI";
  path: string;
  input_schema_ref: string;
  output_summary: string;
  safety_note: string;
  executes_actions: false;
}

export interface AgentIntegrationManifest {
  [key: string]: unknown;
  name: "Agent Trust Gate";
  product: "agent-trust-gate";
  contract_version: typeof CONTRACT_VERSION;
  gateway_api_version: typeof GATEWAY_API_VERSION;
  manifest_version: typeof AGENT_MANIFEST_VERSION;
  local_only: true;
  base_url: "http://127.0.0.1:8787";
  openapi_url: "/v1/openapi.json";
  capabilities: string[];
  schemas: Record<string, unknown>;
  tools: AgentManifestTool[];
  auth: {
    supports_client_id_header: true;
    client_id_header: "X-ATG-Client-ID";
    supports_api_key_header: true;
    api_key_header: "X-ATG-API-Key";
    api_key_mode: "optional_local_development";
    raw_api_keys_logged: false;
    real_world_identity_authentication: false;
  };
  usage_model: {
    usage_metering_available: true;
    client_allowances_available: true;
    over_limit_error_code: "CLIENT_USAGE_LIMIT_EXCEEDED";
    purchase_enabled: false;
    automatic_purchase_enabled: false;
    billing_enabled: false;
    local_only_note: string;
  };
  safety_statement: string;
}

const decisionSafety =
  "Returns a local trust decision only. The tool never executes the described action.";
const evidenceSafety =
  "Returns or saves local evidence only when explicitly requested. The tool never executes actions.";
const inspectionSafety =
  "Reads local gateway metadata or usage records only. Agent Trust Gate returns trust decisions and evidence only and never executes actions.";

export function createAgentIntegrationManifest(): AgentIntegrationManifest {
  return {
    name: "Agent Trust Gate",
    product: "agent-trust-gate",
    contract_version: CONTRACT_VERSION,
    gateway_api_version: GATEWAY_API_VERSION,
    manifest_version: AGENT_MANIFEST_VERSION,
    local_only: true,
    base_url: "http://127.0.0.1:8787",
    openapi_url: "/v1/openapi.json",
    capabilities: [
      "pre_action_trust_decision",
      "approval_pack_generation",
      "human_review_evidence",
      "evidence_bundle_export",
      "gateway_usage_metering",
      "local_client_allowances",
      "local_admin_summary",
      "agent_entitlement_status",
      "commercial_readiness_snapshot",
      "hosted_deployment_readiness",
    ],
    schemas: {
      EmptyInput: {
        type: "object",
        additionalProperties: false,
        properties: {},
      },
      LocalCliInput: {
        type: "object",
        additionalProperties: false,
        properties: {},
        description: "No tool input. Execute the documented local CLI flag from the repository.",
      },
    },
    tools: [
      httpTool(
        "atg_health",
        "Check local gateway health and whether optional local API-key mode is enabled.",
        "GET",
        "/v1/health",
        "#/schemas/EmptyInput",
        "Health, service, request, client, and API-key-mode fields.",
        inspectionSafety,
      ),
      httpTool(
        "atg_decide",
        "Evaluate a stable action descriptor before a caller takes a high-impact action.",
        "POST",
        "/v1/decision",
        "/v1/openapi.json#/components/schemas/GatewayDecisionRequest",
        "ALLOW, BLOCK, or human-approval-required trust decision with risk and usage fields.",
        decisionSafety,
      ),
      httpTool(
        "atg_create_approval_pack",
        "Create a local approval packet from an action trust decision.",
        "POST",
        "/v1/approval-pack",
        "/v1/openapi.json#/components/schemas/GatewayApprovalPackRequest",
        "Approval packet and optional explicit local save status.",
        evidenceSafety,
      ),
      httpTool(
        "atg_create_evidence_bundle",
        "Create a portable local evidence bundle from a human review record.",
        "POST",
        "/v1/evidence-bundle",
        "/v1/openapi.json#/components/schemas/GatewayEvidenceBundleRequest",
        "Evidence bundle and optional explicit local save status.",
        evidenceSafety,
      ),
      httpTool(
        "atg_get_openapi",
        "Retrieve the machine-readable local gateway API contract.",
        "GET",
        "/v1/openapi.json",
        "#/schemas/EmptyInput",
        "OpenAPI 3.1 document for the local gateway.",
        inspectionSafety,
      ),
      httpTool(
        "atg_get_entitlement",
        "Read local client identity, allowance, remaining usage, and upgrade-required signals.",
        "GET",
        "/v1/entitlement",
        "#/schemas/EmptyInput",
        "Local entitlement status and disabled purchase, automatic-purchase, and billing signals.",
        "Returns a local entitlement control signal only. It never purchases, bills, processes payments, or executes actions.",
      ),
      httpTool(
        "atg_get_commercial_readiness",
        "Read an honest local planning snapshot for local, commercial MVP, and full-target readiness.",
        "GET",
        "/v1/commercial-readiness",
        "#/schemas/EmptyInput",
        "Readiness percentages, category evidence and gaps, missing capabilities, and next steps.",
        "Returns local planning metadata only. It never bills, processes payments, enables automatic purchase, or executes actions.",
      ),
      httpTool(
        "atg_get_hosted_readiness",
        "Read local pre-hosting checks, blockers, environment guidance, and required gates.",
        "GET",
        "/v1/hosted-readiness",
        "#/schemas/EmptyInput",
        "Hosted preparation percentage, checks, blockers, required controls, and safe local defaults.",
        "Preparation only. It does not deploy Agent Trust Gate, bind publicly, or expose a service.",
      ),
      cliTool(
        "atg_get_usage",
        "Read the local gateway usage and allowance summary through the CLI.",
        "--gateway-usage --json",
        "Gateway usage totals, client counts, limits, and errors from local logs.",
      ),
      cliTool(
        "atg_get_admin_summary",
        "Read the local operator summary through the CLI.",
        "--gateway-admin --json",
        "Local gateway health, decision activity, authentication, limits, and client summaries.",
      ),
    ],
    auth: {
      supports_client_id_header: true,
      client_id_header: "X-ATG-Client-ID",
      supports_api_key_header: true,
      api_key_header: "X-ATG-API-Key",
      api_key_mode: "optional_local_development",
      raw_api_keys_logged: false,
      real_world_identity_authentication: false,
    },
    usage_model: {
      usage_metering_available: true,
      client_allowances_available: true,
      over_limit_error_code: "CLIENT_USAGE_LIMIT_EXCEEDED",
      purchase_enabled: false,
      automatic_purchase_enabled: false,
      billing_enabled: false,
      local_only_note:
        "Usage and allowance fields are local control records only. They do not bill customers or process payments.",
    },
    safety_statement: AGENT_MANIFEST_SAFETY_STATEMENT,
  };
}

export function formatAgentManifestForConsole(): string {
  const manifest = createAgentIntegrationManifest();
  return [
    "Agent Trust Gate agent integration manifest",
    `manifest_version: ${manifest.manifest_version}`,
    `contract_version: ${manifest.contract_version}`,
    `gateway_api_version: ${manifest.gateway_api_version}`,
    `base_url: ${manifest.base_url}`,
    `openapi_url: ${manifest.openapi_url}`,
    "",
    "Capabilities:",
    ...manifest.capabilities.map((capability) => `- ${capability}`),
    "",
    "Tools:",
    ...manifest.tools.map((tool) => `- ${tool.name}: ${tool.http_method} ${tool.path}`),
    "",
    "Commercial controls:",
    `- purchase_enabled: ${manifest.usage_model.purchase_enabled}`,
    `- automatic_purchase_enabled: ${manifest.usage_model.automatic_purchase_enabled}`,
    `- billing_enabled: ${manifest.usage_model.billing_enabled}`,
    "",
    manifest.safety_statement,
  ].join("\n");
}

export function writeAgentIntegrationManifest(outputPath: string): string {
  const resolvedPath = resolve(outputPath);
  mkdirSync(dirname(resolvedPath), { recursive: true });
  writeFileSync(
    resolvedPath,
    `${JSON.stringify(createAgentIntegrationManifest(), null, 2)}\n`,
    "utf8",
  );
  return resolvedPath;
}

function httpTool(
  name: string,
  description: string,
  method: "GET" | "POST",
  path: string,
  inputSchemaRef: string,
  outputSummary: string,
  safetyNote: string,
): AgentManifestTool {
  return {
    name,
    description,
    transport: "http",
    http_method: method,
    path,
    input_schema_ref: inputSchemaRef,
    output_summary: outputSummary,
    safety_note: safetyNote,
    executes_actions: false,
  };
}

function cliTool(
  name: string,
  description: string,
  path: string,
  outputSummary: string,
): AgentManifestTool {
  return {
    name,
    description,
    transport: "local_cli",
    http_method: "LOCAL_CLI",
    path,
    input_schema_ref: "#/schemas/LocalCliInput",
    output_summary: outputSummary,
    safety_note: inspectionSafety,
    executes_actions: false,
  };
}
