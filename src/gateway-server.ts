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
import { verifyBeforeAction } from "./verify-before-action.js";
import type { VerifyBeforeActionInput } from "./types.js";

export const DEFAULT_GATEWAY_HOST = "127.0.0.1";
export const DEFAULT_GATEWAY_PORT = 8787;
export const GATEWAY_SAFETY_STATEMENT =
  "Agent Trust Gate returns local trust decisions only. It does not execute actions.";

export interface GatewayServerOptions {
  host?: string;
  port?: number;
}

type GatewayBody = Record<string, unknown>;

export function createGatewayServer(): Server {
  return createServer((request, response) => {
    void handleGatewayRequest(request, response);
  });
}

export function startGatewayServer(options: GatewayServerOptions = {}): Server {
  const host = options.host ?? DEFAULT_GATEWAY_HOST;
  const port = options.port ?? DEFAULT_GATEWAY_PORT;
  const server = createGatewayServer();

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
): Promise<void> {
  try {
    const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);

    if (url.pathname === "/v1/health") {
      if (request.method !== "GET") {
        writeJson(response, 405, errorResponse("METHOD_NOT_ALLOWED", "GET is required for /v1/health."));
        return;
      }

      writeJson(response, 200, {
        ok: true,
        service: "agent-trust-gate",
        contract_version: CONTRACT_VERSION,
        mode: "local-gateway",
        checked_at: new Date().toISOString(),
      });
      return;
    }

    if (url.pathname === "/v1/decision") {
      if (request.method !== "POST") {
        writeJson(response, 405, errorResponse("METHOD_NOT_ALLOWED", "POST is required for /v1/decision."));
        return;
      }

      const body = await readJsonBody(request);
      const { action, policyProfile } = parseActionGatewayBody(body, url);
      const receipt = verifyBeforeAction(action as VerifyBeforeActionInput, policyProfile === undefined ? {} : { policy_profile: policyProfile });
      writeJson(response, 200, toGatewayDecision(receipt));
      return;
    }

    if (url.pathname === "/v1/approval-pack") {
      if (request.method !== "POST") {
        writeJson(response, 405, errorResponse("METHOD_NOT_ALLOWED", "POST is required for /v1/approval-pack."));
        return;
      }

      const body = await readJsonBody(request);
      const { action, policyProfile } = parseActionGatewayBody(body, url);
      const receipt = verifyBeforeAction(action as VerifyBeforeActionInput, policyProfile === undefined ? {} : { policy_profile: policyProfile });
      const approvalPack = createApprovalPack(receipt);
      const approvalPackPath = body.save_approval_pack === true
        ? saveApprovalPackToArchive(approvalPack)
        : undefined;
      writeJson(response, 200, {
        ...approvalPack,
        approval_pack_saved: approvalPackPath !== undefined,
        ...(approvalPackPath === undefined ? {} : { approval_pack_path: approvalPackPath }),
      });
      return;
    }

    if (url.pathname === "/v1/evidence-bundle") {
      if (request.method !== "POST") {
        writeJson(response, 405, errorResponse("METHOD_NOT_ALLOWED", "POST is required for /v1/evidence-bundle."));
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
      writeJson(response, 200, withEvidenceBundleSaveStatus(evidenceBundle, evidenceBundlePath));
      return;
    }

    writeJson(response, 404, errorResponse("NOT_FOUND", `Unknown route "${url.pathname}".`));
  } catch (error) {
    if (error instanceof GatewayInputError) {
      writeJson(response, 400, errorResponse(error.code, error.message, error.details));
      return;
    }

    if (error instanceof ActionValidationError) {
      writeJson(
        response,
        400,
        errorResponse("INVALID_ACTION_DESCRIPTOR", error.message, error.details),
      );
      return;
    }

    if (error instanceof EvidenceBundleError) {
      writeJson(response, 400, errorResponse(error.code, error.message, error.details));
      return;
    }

    if (errorMessage(error).includes("Unknown policy profile")) {
      writeJson(response, 400, errorResponse("UNKNOWN_POLICY_PROFILE", errorMessage(error)));
      return;
    }

    writeJson(
      response,
      500,
      errorResponse("INTERNAL_GATEWAY_ERROR", "Unexpected local gateway error."),
    );
  }
}

function toGatewayDecision(receipt: ReturnType<typeof verifyBeforeAction>) {
  return {
    ok: true,
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

function writeJson(response: ServerResponse, statusCode: number, body: unknown): void {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
  });
  response.end(`${JSON.stringify(body, null, 2)}\n`);
}

function errorResponse(code: string, message: string, details: unknown[] = []) {
  return {
    ok: false,
    contract_version: CONTRACT_VERSION,
    error: {
      code,
      message,
      details,
    },
  };
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
