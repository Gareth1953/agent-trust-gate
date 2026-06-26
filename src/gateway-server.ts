import { randomUUID } from "node:crypto";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";

import { ActionValidationError } from "./action-validation.js";
import { createApprovalPack, saveApprovalPackToArchive } from "./approval-pack.js";
import { CONTRACT_VERSION } from "./contract.js";
import {
  createEvidenceBundle,
  EvidenceBundleError,
  saveEvidenceBundle,
  withEvidenceBundleSaveStatus,
} from "./evidence-bundle.js";
import {
  appendGatewayRequestLog,
  DEFAULT_GATEWAY_REQUEST_LOG_PATH,
  type GatewayRequestLogEntry,
} from "./gateway-logging.js";
import {
  authenticateGatewayRequest,
  loadGatewayAuthConfig,
  type GatewayAuthConfig,
  type GatewayClient,
} from "./gateway-auth.js";
import { verifyBeforeAction } from "./verify-before-action.js";
import type { VerifyBeforeActionInput } from "./types.js";

export const DEFAULT_GATEWAY_HOST = "127.0.0.1";
export const DEFAULT_GATEWAY_PORT = 8787;
export const GATEWAY_SAFETY_STATEMENT =
  "Agent Trust Gate returns local trust decisions only. It does not execute actions.";

export interface GatewayServerOptions {
  host?: string;
  port?: number;
  gatewayLogPath?: string;
  requireApiKey?: boolean;
  clientsFile?: string;
  clients?: GatewayClient[];
}

type GatewayBody = Record<string, unknown>;

interface GatewayRequestContext {
  request_id: string;
  started_at: number;
  timestamp: string;
  endpoint: string;
  method: string;
  gatewayLogPath: string;
  client_id: string;
  auth_required: boolean;
  auth_ok: boolean | null;
}

type GatewayResponseBody = Record<string, unknown>;

type GatewayLogMetadata = Partial<
  Pick<
    GatewayRequestLogEntry,
    | "policy_profile"
    | "action_type"
    | "actor"
    | "target"
    | "allowed"
    | "risk_level"
    | "human_approval_required"
    | "regulated_policy"
    | "error_code"
    | "client_id"
    | "auth_required"
    | "auth_ok"
  >
>;

export function createGatewayServer(options: GatewayServerOptions = {}): Server {
  const gatewayLogPath = options.gatewayLogPath ?? DEFAULT_GATEWAY_REQUEST_LOG_PATH;
  const authConfig = loadGatewayAuthConfig({
    ...(options.requireApiKey === undefined ? {} : { requireApiKey: options.requireApiKey }),
    ...(options.clientsFile === undefined ? {} : { clientsFile: options.clientsFile }),
    ...(options.clients === undefined ? {} : { clients: options.clients }),
  });
  return createServer((request, response) => {
    void handleGatewayRequest(request, response, gatewayLogPath, authConfig);
  });
}

export function startGatewayServer(options: GatewayServerOptions = {}): Server {
  const host = options.host ?? DEFAULT_GATEWAY_HOST;
  const port = options.port ?? DEFAULT_GATEWAY_PORT;
  const server = createGatewayServer(options);

  server.listen(port, host, () => {
    console.log(
      `Agent Trust Gate local gateway listening on http://${host}:${port} (localhost only).`,
    );
    console.log("Local Gateway API Mode returns trust decisions and evidence objects only.");
    console.log(GATEWAY_SAFETY_STATEMENT);
  });

  return server;
}

async function handleGatewayRequest(
  request: IncomingMessage,
  response: ServerResponse,
  gatewayLogPath: string,
  authConfig: GatewayAuthConfig,
): Promise<void> {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);
  const protectedEndpoint = isProtectedGatewayEndpoint(url.pathname, request.method);
  const authResult = authenticateGatewayRequest({
    protectedEndpoint,
    ...optionalHeader("clientIdHeader", headerValue(request, "x-atg-client-id")),
    ...optionalHeader("apiKeyHeader", headerValue(request, "x-atg-api-key")),
    authConfig,
  });
  const context: GatewayRequestContext = {
    request_id: `gw_${randomUUID()}`,
    started_at: Date.now(),
    timestamp: new Date().toISOString(),
    endpoint: url.pathname,
    method: request.method ?? "UNKNOWN",
    gatewayLogPath,
    client_id: authResult.client_id,
    auth_required: authResult.auth_required,
    auth_ok: authResult.auth_ok,
  };

  try {
    if (authResult.error_code !== undefined) {
      writeGatewayJson(
        response,
        context,
        401,
        errorResponse(
          context.request_id,
          context.client_id,
          authResult.error_code,
          authResult.error_message ?? "Unauthorized local gateway request.",
        ),
        { error_code: authResult.error_code },
      );
      return;
    }

    if (url.pathname === "/v1/health") {
      if (request.method !== "GET") {
        writeGatewayJson(
          response,
          context,
          405,
          errorResponse(context.request_id, context.client_id, "METHOD_NOT_ALLOWED", "GET is required for /v1/health."),
          { error_code: "METHOD_NOT_ALLOWED" },
        );
        return;
      }

      writeGatewayJson(response, context, 200, {
        ok: true,
        request_id: context.request_id,
        client_id: context.client_id,
        service: "agent-trust-gate",
        contract_version: CONTRACT_VERSION,
        mode: "local-gateway",
        api_key_required: authConfig.require_api_key,
        checked_at: new Date().toISOString(),
      });
      return;
    }

    if (url.pathname === "/v1/decision") {
      if (request.method !== "POST") {
        writeGatewayJson(
          response,
          context,
          405,
          errorResponse(context.request_id, context.client_id, "METHOD_NOT_ALLOWED", "POST is required for /v1/decision."),
          { error_code: "METHOD_NOT_ALLOWED" },
        );
        return;
      }

      const body = await readJsonBody(request);
      const { action, policyProfile } = parseActionGatewayBody(body, url);
      const receipt = verifyBeforeAction(action as VerifyBeforeActionInput, policyProfile === undefined ? {} : { policy_profile: policyProfile });
      writeGatewayJson(response, context, 200, toGatewayDecision(context.request_id, context.client_id, receipt), {
        policy_profile: receipt.policy_profile,
        action_type: receipt.input_summary.action_type,
        actor: receipt.input_summary.actor,
        target: receipt.input_summary.target,
        allowed: receipt.allowed,
        risk_level: receipt.risk_level,
        human_approval_required: receipt.human_approval_required,
        regulated_policy: receipt.regulated_policy,
      });
      return;
    }

    if (url.pathname === "/v1/approval-pack") {
      if (request.method !== "POST") {
        writeGatewayJson(
          response,
          context,
          405,
          errorResponse(context.request_id, context.client_id, "METHOD_NOT_ALLOWED", "POST is required for /v1/approval-pack."),
          { error_code: "METHOD_NOT_ALLOWED" },
        );
        return;
      }

      const body = await readJsonBody(request);
      const { action, policyProfile } = parseActionGatewayBody(body, url);
      const receipt = verifyBeforeAction(action as VerifyBeforeActionInput, policyProfile === undefined ? {} : { policy_profile: policyProfile });
      const approvalPack = createApprovalPack(receipt);
      const approvalPackPath = body.save_approval_pack === true
        ? saveApprovalPackToArchive(approvalPack)
        : undefined;
      writeGatewayJson(response, context, 200, {
        ...approvalPack,
        request_id: context.request_id,
        client_id: context.client_id,
        approval_pack_saved: approvalPackPath !== undefined,
        ...(approvalPackPath === undefined ? {} : { approval_pack_path: approvalPackPath }),
      }, {
        policy_profile: receipt.policy_profile,
        action_type: receipt.input_summary.action_type,
        actor: receipt.input_summary.actor,
        target: receipt.input_summary.target,
        allowed: receipt.allowed,
        risk_level: receipt.risk_level,
        human_approval_required: receipt.human_approval_required,
        regulated_policy: receipt.regulated_policy,
      });
      return;
    }

    if (url.pathname === "/v1/evidence-bundle") {
      if (request.method !== "POST") {
        writeGatewayJson(
          response,
          context,
          405,
          errorResponse(context.request_id, context.client_id, "METHOD_NOT_ALLOWED", "POST is required for /v1/evidence-bundle."),
          { error_code: "METHOD_NOT_ALLOWED" },
        );
        return;
      }

      const body = await readJsonBody(request);
      const reviewRecordPath = typeof body.review_record_path === "string"
        ? body.review_record_path
        : "";
      const evidenceBundle = createEvidenceBundle(reviewRecordPath);
      const evidenceBundlePath = body.save_evidence_bundle === true
        ? saveEvidenceBundle(evidenceBundle)
        : undefined;
      writeGatewayJson(response, context, 200, {
        ...withEvidenceBundleSaveStatus(evidenceBundle, evidenceBundlePath),
        request_id: context.request_id,
        client_id: context.client_id,
      }, {
        policy_profile: evidenceBundle.trust_decision.policy_profile,
        action_type: evidenceBundle.action.action_type,
        actor: evidenceBundle.action.actor,
        target: evidenceBundle.action.target,
        allowed: evidenceBundle.trust_decision.allowed,
        risk_level: evidenceBundle.trust_decision.risk_level,
        human_approval_required: evidenceBundle.trust_decision.human_approval_required,
        regulated_policy: evidenceBundle.trust_decision.regulated_policy,
      });
      return;
    }

    writeGatewayJson(
      response,
      context,
      404,
      errorResponse(context.request_id, context.client_id, "NOT_FOUND", `Unknown route "${url.pathname}".`),
      { error_code: "NOT_FOUND" },
    );
  } catch (error) {
    if (error instanceof GatewayInputError) {
      writeGatewayJson(
        response,
        context,
        400,
        errorResponse(context.request_id, context.client_id, error.code, error.message, error.details),
        { error_code: error.code },
      );
      return;
    }

    if (error instanceof ActionValidationError) {
      writeGatewayJson(
        response,
        context,
        400,
        errorResponse(context.request_id, context.client_id, "INVALID_ACTION_DESCRIPTOR", error.message, error.details),
        { error_code: "INVALID_ACTION_DESCRIPTOR" },
      );
      return;
    }

    if (error instanceof EvidenceBundleError) {
      writeGatewayJson(
        response,
        context,
        400,
        errorResponse(context.request_id, context.client_id, error.code, error.message, error.details),
        { error_code: error.code },
      );
      return;
    }

    if (errorMessage(error).includes("Unknown policy profile")) {
      writeGatewayJson(
        response,
        context,
        400,
        errorResponse(context.request_id, context.client_id, "UNKNOWN_POLICY_PROFILE", errorMessage(error)),
        { error_code: "UNKNOWN_POLICY_PROFILE" },
      );
      return;
    }

    writeGatewayJson(
      response,
      context,
      500,
      errorResponse(
        context.request_id,
        context.client_id,
        "INTERNAL_GATEWAY_ERROR",
        "Unexpected local gateway error.",
      ),
      { error_code: "INTERNAL_GATEWAY_ERROR" },
    );
  }
}

function toGatewayDecision(
  requestId: string,
  clientId: string,
  receipt: ReturnType<typeof verifyBeforeAction>,
) {
  return {
    ok: true,
    request_id: requestId,
    client_id: clientId,
    contract_version: receipt.contract_version,
    allowed: receipt.allowed,
    risk_level: receipt.risk_level,
    human_approval_required: receipt.human_approval_required,
    action_type: receipt.input_summary.action_type,
    actor: receipt.input_summary.actor,
    target: receipt.input_summary.target,
    policy_profile: receipt.policy_profile,
    regulated_policy: receipt.regulated_policy,
    approval_reason: receipt.approval_reason,
    reasons: receipt.approval_reason === null ? [] : [receipt.approval_reason],
    gateway_mode: "local",
    safety_statement: GATEWAY_SAFETY_STATEMENT,
    receipt_id: receipt.receipt_id,
    checked_at: receipt.timestamp,
  };
}

function parseActionGatewayBody(
  body: GatewayBody,
  url: URL,
): { action: unknown; policyProfile?: string } {
  const queryPolicy = url.searchParams.get("policy") ?? url.searchParams.get("policy_profile");
  const bodyPolicy = typeof body.policy_profile === "string" ? body.policy_profile : undefined;
  const policyProfile = bodyPolicy ?? queryPolicy ?? undefined;
  const action = isPlainObject(body.action) ? body.action : body;

  return policyProfile === undefined ? { action } : { action, policyProfile };
}

async function readJsonBody(request: IncomingMessage): Promise<GatewayBody> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  const rawBody = Buffer.concat(chunks).toString("utf8").trim();
  if (rawBody.length === 0) {
    throw new GatewayInputError("INVALID_JSON", "Request body must be JSON.");
  }

  try {
    const parsed = JSON.parse(rawBody) as unknown;
    if (!isPlainObject(parsed)) {
      throw new GatewayInputError("INVALID_JSON", "Request JSON body must be an object.");
    }
    return parsed;
  } catch (error) {
    if (error instanceof GatewayInputError) {
      throw error;
    }
    throw new GatewayInputError("INVALID_JSON", `Invalid JSON: ${errorMessage(error)}`);
  }
}

function writeGatewayJson(
  response: ServerResponse,
  context: GatewayRequestContext,
  statusCode: number,
  body: GatewayResponseBody,
  metadata: GatewayLogMetadata = {},
): void {
  appendGatewayRequestLog({
    request_id: context.request_id,
    timestamp: context.timestamp,
    endpoint: context.endpoint,
    method: context.method,
    ok: statusCode >= 200 && statusCode < 400,
    status_code: statusCode,
    contract_version: CONTRACT_VERSION,
    gateway_mode: "local",
    duration_ms: Date.now() - context.started_at,
    client_id: context.client_id,
    auth_required: context.auth_required,
    auth_ok: context.auth_ok,
    ...metadata,
  }, context.gatewayLogPath);

  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
  });
  response.end(`${JSON.stringify(body, null, 2)}\n`);
}

function errorResponse(
  requestId: string,
  clientId: string,
  code: string,
  message: string,
  details: unknown[] = [],
) {
  return {
    ok: false,
    request_id: requestId,
    client_id: clientId,
    contract_version: CONTRACT_VERSION,
    error: {
      code,
      message,
      details,
    },
  };
}

function isProtectedGatewayEndpoint(pathname: string, method: string | undefined): boolean {
  return (
    method === "POST" &&
    (
      pathname === "/v1/decision" ||
      pathname === "/v1/approval-pack" ||
      pathname === "/v1/evidence-bundle"
    )
  );
}

function headerValue(request: IncomingMessage, headerName: string): string | undefined {
  const value = request.headers[headerName];
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function optionalHeader(
  key: "clientIdHeader" | "apiKeyHeader",
  value: string | undefined,
): { clientIdHeader?: string; apiKeyHeader?: string } {
  return value === undefined ? {} : { [key]: value };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

class GatewayInputError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly details: unknown[] = [],
  ) {
    super(message);
    this.name = "GatewayInputError";
  }
}
