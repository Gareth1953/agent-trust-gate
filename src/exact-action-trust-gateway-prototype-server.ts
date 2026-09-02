import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { extname, resolve } from "node:path";

import { CONTRACT_VERSION } from "./contract.js";
import {
  authenticateGatewayRequest,
  loadGatewayAuthConfig,
  type GatewayAuthConfig,
  type GatewayClient,
} from "./gateway-auth.js";
import { appendGatewayRequestLog } from "./gateway-logging.js";
import { createLocalGatewayRateLimiter } from "./gateway-rate-limits.js";
import {
  BUYER_PROTOTYPE_SCENARIOS,
  EXACT_ACTION_TRUST_GATEWAY_DISCLAIMER,
  EXACT_ACTION_TRUST_GATEWAY_POSITIONING,
  EXACT_ACTION_TRUST_GATEWAY_STATUS,
  ExactActionTrustGatewayPrototype,
  createExactActionPrototypeScenario,
  getExactActionPrototypeScenarioPreview,
  type ExactActionPrototypeEvaluation,
  type ExactActionPrototypeScenarioId,
  type ExactActionTrustReceipt,
  type ProposedProcurementAction,
} from "./exact-action-trust-gateway-prototype.js";

export const DEFAULT_EXACT_ACTION_PROTOTYPE_HOST = "127.0.0.1" as const;
export const DEFAULT_EXACT_ACTION_PROTOTYPE_PORT = 8794 as const;
export const DEFAULT_EXACT_ACTION_PROTOTYPE_LOG =
  "gateway-logs/exact-action-prototype-requests.jsonl" as const;

export interface ExactActionPrototypeServerOptions {
  host?: string;
  port?: number;
  staticDirectory?: string;
  logPath?: string;
  requireApiKey?: boolean;
  clients?: GatewayClient[];
  maxRequests?: number;
}

interface PrototypeSession {
  gateway: ExactActionTrustGatewayPrototype;
  evaluation: ExactActionPrototypeEvaluation;
  latestReceipt: ExactActionTrustReceipt;
}

interface RequestContext {
  requestId: string;
  startedAt: number;
  timestamp: string;
  endpoint: string;
  method: string;
  logPath: string;
  authRequired: boolean;
  authOk: boolean | null;
  clientId: string;
}

export function createExactActionPrototypeServer(
  options: ExactActionPrototypeServerOptions = {},
): Server {
  const staticDirectory = resolve(options.staticDirectory ?? "prototype/exact-action");
  const logPath = options.logPath ?? DEFAULT_EXACT_ACTION_PROTOTYPE_LOG;
  const authConfig = loadGatewayAuthConfig({
    ...(options.requireApiKey === undefined ? {} : { requireApiKey: options.requireApiKey }),
    ...(options.clients === undefined ? {} : { clients: options.clients }),
  });
  const rateLimiter = createLocalGatewayRateLimiter();
  const sessions = new Map<string, PrototypeSession>();
  const maxRequests = options.maxRequests ?? 100;

  return createServer((request, response) => {
    void handleRequest({
      request,
      response,
      staticDirectory,
      logPath,
      authConfig,
      sessions,
      maxRequests,
      rateLimiter,
    });
  });
}

export function startExactActionPrototypeServer(
  options: ExactActionPrototypeServerOptions = {},
): Server {
  const host = options.host ?? DEFAULT_EXACT_ACTION_PROTOTYPE_HOST;
  const port = options.port ?? DEFAULT_EXACT_ACTION_PROTOTYPE_PORT;
  if (!isLoopbackHost(host)) {
    throw new Error("The V1 prototype must remain local-only and may bind only to 127.0.0.1, localhost, or ::1.");
  }
  const server = createExactActionPrototypeServer(options);
  server.listen(port, host, () => {
    const address = server.address();
    const actualPort = typeof address === "object" && address !== null ? address.port : port;
    console.log("Agent Trust Gate™ — Exact Action Trust Gateway");
    console.log("Working Local Pilot-Ready Prototype");
    console.log("");
    console.log("Open:");
    console.log(`http://${host}:${actualPort}`);
    console.log("");
    console.log("Synthetic demonstration only.");
    console.log("No real transaction or external system will be used.");
  });
  return server;
}

async function handleRequest(input: {
  request: IncomingMessage;
  response: ServerResponse;
  staticDirectory: string;
  logPath: string;
  authConfig: GatewayAuthConfig;
  sessions: Map<string, PrototypeSession>;
  maxRequests: number;
  rateLimiter: ReturnType<typeof createLocalGatewayRateLimiter>;
}): Promise<void> {
  const url = new URL(input.request.url ?? "/", `http://${input.request.headers.host ?? "127.0.0.1"}`);
  const isApiMutation = url.pathname.startsWith("/api/") && input.request.method === "POST";
  const auth = authenticateGatewayRequest({
    protectedEndpoint: isApiMutation,
    ...headerOption("clientIdHeader", input.request.headers["x-atg-client-id"]),
    ...headerOption("apiKeyHeader", input.request.headers["x-atg-api-key"]),
    authConfig: input.authConfig,
  });
  const context: RequestContext = {
    requestId: `prototype_${randomUUID()}`,
    startedAt: Date.now(),
    timestamp: new Date().toISOString(),
    endpoint: url.pathname,
    method: input.request.method ?? "UNKNOWN",
    logPath: input.logPath,
    authRequired: auth.auth_required,
    authOk: auth.auth_ok,
    clientId: auth.client_id,
  };
  try {
    if (auth.error_code !== undefined) {
      writeJson(input.response, context, 401, {
        ok: false,
        error: { code: auth.error_code, message: auth.error_message },
      }, auth.error_code);
      return;
    }
    if (isApiMutation) {
      const rate = input.rateLimiter.consume({
        clientId: context.clientId,
        rateLimit: { max_requests: input.maxRequests, window: "local_runtime" },
        knownClient: true,
      });
      if (rate.rate_limited) {
        writeJson(input.response, context, 429, {
          ok: false,
          error: { code: "LOCAL_RATE_LIMIT_EXCEEDED", message: "Local prototype request limit exceeded." },
          rateLimit: rate,
        }, "LOCAL_RATE_LIMIT_EXCEEDED");
        return;
      }
    }

    if (url.pathname === "/api/health" && input.request.method === "GET") {
      writeJson(input.response, context, 200, {
        ok: true,
        status: EXACT_ACTION_TRUST_GATEWAY_STATUS,
        localOnly: true,
        syntheticDataOnly: true,
        networkCallPerformed: false,
      });
      return;
    }
    if (url.pathname === "/api/scenarios" && input.request.method === "GET") {
      writeJson(input.response, context, 200, {
        ok: true,
        positioning: EXACT_ACTION_TRUST_GATEWAY_POSITIONING,
        status: EXACT_ACTION_TRUST_GATEWAY_STATUS,
        disclaimer: EXACT_ACTION_TRUST_GATEWAY_DISCLAIMER,
        scenarios: BUYER_PROTOTYPE_SCENARIOS.map((scenarioId) => createExactActionPrototypeScenario(scenarioId)),
      });
      return;
    }
    if (url.pathname === "/api/preview" && input.request.method === "GET") {
      const scenarioId = parseScenarioId(text(url.searchParams.get("scenario")));
      const preview = await getExactActionPrototypeScenarioPreview(scenarioId);
      writeJson(input.response, context, 200, { ok: true, preview });
      return;
    }
    if (url.pathname === "/api/evaluate" && input.request.method === "POST") {
      const body = await readJsonBody(input.request);
      const scenarioId = parseScenarioId(text(body.scenarioId));
      const gateway = new ExactActionTrustGatewayPrototype();
      const evaluation = await gateway.evaluateExactAction(scenarioId);
      input.sessions.set(evaluation.runId, {
        gateway,
        evaluation,
        latestReceipt: evaluation.trustReceipt,
      });
      writeJson(input.response, context, 200, { ok: true, evaluation }, undefined, {
        actionType: evaluation.exactAction.operationName,
        actor: evaluation.exactAction.operatorIdentity ?? "unknown",
        target: evaluation.exactAction.targetIdentity,
        allowed: evaluation.decision === "GATEPASS_ISSUED",
      });
      return;
    }
    if ((url.pathname === "/api/execute" || url.pathname === "/api/replay")
      && input.request.method === "POST") {
      const body = await readJsonBody(input.request);
      const runId = text(body.runId);
      const session = input.sessions.get(runId);
      if (session === undefined) throw new PrototypeHttpError("RUN_NOT_FOUND", "Evaluate a scenario before execution.", 404);
      const actionPatch = url.pathname === "/api/execute"
        ? parseExecutionPatch(body, session.evaluation)
        : undefined;
      const result = await session.gateway.executeWithGatePass(session.evaluation, {
        ...(actionPatch === undefined ? {} : { actionPatch }),
      });
      session.latestReceipt = result.trustReceipt;
      writeJson(input.response, context, 200, { ok: true, result }, undefined, {
        actionType: "simulate_procurement_purchase",
        actor: session.evaluation.exactAction.operatorIdentity ?? "unknown",
        target: result.execution.supplierId,
        allowed: result.execution.status === "SIMULATED_PURCHASE_COMPLETED",
      });
      return;
    }
    if (url.pathname === "/api/verify-receipt" && input.request.method === "POST") {
      const body = await readJsonBody(input.request);
      const runId = text(body.runId);
      const session = input.sessions.get(runId);
      const receipt = session?.latestReceipt ?? body.receipt;
      const verifier = session?.gateway ?? new ExactActionTrustGatewayPrototype();
      const verification = verifier.verifyTrustReceipt(receipt);
      writeJson(input.response, context, 200, { ok: true, verification });
      return;
    }
    if (url.pathname.startsWith("/api/")) {
      throw new PrototypeHttpError("NOT_FOUND", `Unknown prototype route ${url.pathname}.`, 404);
    }
    serveStatic(input.response, context, input.staticDirectory, url.pathname);
  } catch (error) {
    const known = error instanceof PrototypeHttpError;
    writeJson(input.response, context, known ? error.statusCode : 500, {
      ok: false,
      error: {
        code: known ? error.code : "INTERNAL_PROTOTYPE_ERROR",
        message: known ? error.message : "Unexpected local prototype error.",
      },
    }, known ? error.code : "INTERNAL_PROTOTYPE_ERROR");
  }
}

function serveStatic(
  response: ServerResponse,
  context: RequestContext,
  staticDirectory: string,
  pathname: string,
): void {
  const files: Record<string, string> = {
    "/": "index.html",
    "/index.html": "index.html",
    "/app.js": "app.js",
    "/styles.css": "styles.css",
  };
  const relative = files[pathname];
  if (relative === undefined) {
    writeJson(response, context, 404, { ok: false, error: { code: "NOT_FOUND", message: "Prototype asset not found." } }, "NOT_FOUND");
    return;
  }
  const filePath = resolve(staticDirectory, relative);
  if (!filePath.startsWith(`${staticDirectory}\\`) && filePath !== staticDirectory) {
    writeJson(response, context, 403, { ok: false, error: { code: "ASSET_PATH_BLOCKED", message: "Asset path blocked." } }, "ASSET_PATH_BLOCKED");
    return;
  }
  if (!existsSync(filePath)) {
    writeJson(response, context, 404, { ok: false, error: { code: "ASSET_NOT_FOUND", message: "Prototype asset is missing." } }, "ASSET_NOT_FOUND");
    return;
  }
  const content = readFileSync(filePath);
  const contentType = extname(filePath) === ".html"
    ? "text/html; charset=utf-8"
    : extname(filePath) === ".css"
      ? "text/css; charset=utf-8"
      : "text/javascript; charset=utf-8";
  appendLog(context, 200, true);
  response.writeHead(200, {
    "content-type": contentType,
    "cache-control": "no-store",
    "content-security-policy": "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "referrer-policy": "no-referrer",
    "x-atg-request-id": context.requestId,
  });
  response.end(content);
}

async function readJsonBody(request: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const data = typeof chunk === "string" ? Buffer.from(chunk) : chunk;
    size += data.length;
    if (size > 128 * 1024) throw new PrototypeHttpError("BODY_TOO_LARGE", "Request body exceeds 128 KiB.", 413);
    chunks.push(data);
  }
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (raw === "") return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed)) throw new Error("object required");
    return parsed;
  } catch {
    throw new PrototypeHttpError("INVALID_JSON", "Request body must be a JSON object.", 400);
  }
}

function parseExecutionPatch(
  body: Record<string, unknown>,
  evaluation: ExactActionPrototypeEvaluation,
): Partial<ProposedProcurementAction> | undefined {
  if (body.useScenarioMutation === true) return evaluation.scenario.executionMutation ?? undefined;
  if (!isRecord(body.actionPatch)) return undefined;
  const patch: Partial<ProposedProcurementAction> = {};
  if (typeof body.actionPatch.totalAmount === "number" && Number.isFinite(body.actionPatch.totalAmount)) {
    patch.totalAmount = body.actionPatch.totalAmount;
  }
  if (typeof body.actionPatch.supplierId === "string") patch.supplierId = body.actionPatch.supplierId;
  if (typeof body.actionPatch.supplierName === "string") patch.supplierName = body.actionPatch.supplierName;
  return patch;
}

function parseScenarioId(value: string): ExactActionPrototypeScenarioId {
  if ((BUYER_PROTOTYPE_SCENARIOS as readonly string[]).includes(value)) {
    return value as ExactActionPrototypeScenarioId;
  }
  throw new PrototypeHttpError("UNKNOWN_SCENARIO", `Unknown buyer scenario ${value || "(missing)"}.`, 400);
}

function writeJson(
  response: ServerResponse,
  context: RequestContext,
  statusCode: number,
  body: Record<string, unknown>,
  errorCode?: string,
  metadata: { actionType?: string; actor?: string; target?: string; allowed?: boolean } = {},
): void {
  appendLog(context, statusCode, statusCode >= 200 && statusCode < 400, errorCode, metadata);
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    "x-atg-request-id": context.requestId,
  });
  response.end(`${JSON.stringify(body, null, 2)}\n`);
}

function appendLog(
  context: RequestContext,
  statusCode: number,
  ok: boolean,
  errorCode?: string,
  metadata: { actionType?: string; actor?: string; target?: string; allowed?: boolean } = {},
): void {
  appendGatewayRequestLog({
    request_id: context.requestId,
    timestamp: context.timestamp,
    endpoint: context.endpoint,
    method: context.method,
    ok,
    status_code: statusCode,
    contract_version: CONTRACT_VERSION,
    gateway_mode: "local",
    duration_ms: Date.now() - context.startedAt,
    client_id: context.clientId,
    auth_required: context.authRequired,
    auth_ok: context.authOk,
    usage_checked: context.method === "POST",
    over_limit: statusCode === 429,
    ...(metadata.actionType === undefined ? {} : { action_type: metadata.actionType }),
    ...(metadata.actor === undefined ? {} : { actor: metadata.actor }),
    ...(metadata.target === undefined ? {} : { target: metadata.target }),
    ...(metadata.allowed === undefined ? {} : { allowed: metadata.allowed }),
    ...(errorCode === undefined ? {} : { error_code: errorCode }),
  }, context.logPath);
}

function headerOption<K extends "clientIdHeader" | "apiKeyHeader">(
  key: K,
  value: string | string[] | undefined,
): Partial<Record<K, string>> {
  const textValue = Array.isArray(value) ? value[0] : value;
  return textValue === undefined ? {} : { [key]: textValue } as Record<K, string>;
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isLoopbackHost(host: string): boolean {
  return host === "127.0.0.1" || host === "localhost" || host === "::1";
}

class PrototypeHttpError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly statusCode: number,
  ) {
    super(message);
    this.name = "PrototypeHttpError";
  }
}
