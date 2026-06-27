import { existsSync, readFileSync } from "node:fs";

import type { GatewayRateLimitConfig } from "./gateway-rate-limits.js";

export const DEFAULT_GATEWAY_CLIENT_ID = "local-anonymous";
export const DEFAULT_GATEWAY_CLIENTS_FILE = "gateway-clients.json";

export interface GatewayClient {
  client_id: string;
  api_key: string;
  label?: string;
  decision_allowance?: number;
  allowance_window?: "all_time" | "daily" | "monthly";
  rate_limit?: GatewayRateLimitConfig;
}

export interface GatewayAuthConfig {
  require_api_key: boolean;
  clients: GatewayClient[];
}

export interface GatewayAuthResult {
  client_id: string;
  auth_required: boolean;
  auth_ok: boolean | null;
  error_code?: "UNAUTHORIZED_GATEWAY_REQUEST";
  error_message?: string;
}

export class GatewayAuthConfigError extends Error {
  readonly code = "INVALID_GATEWAY_AUTH_CONFIG";

  constructor(message: string) {
    super(message);
    this.name = "GatewayAuthConfigError";
  }
}

export function loadGatewayAuthConfig(options: {
  requireApiKey?: boolean;
  clientsFile?: string;
  clients?: GatewayClient[];
} = {}): GatewayAuthConfig {
  const requireApiKey = options.requireApiKey === true;

  if (!requireApiKey) {
    if (options.clients !== undefined) {
      validateClients(options.clients);
      return { require_api_key: false, clients: options.clients };
    }
    return { require_api_key: false, clients: [] };
  }

  if (options.clients !== undefined) {
    validateClients(options.clients);
    return { require_api_key: true, clients: options.clients };
  }

  const clientsFile = options.clientsFile ?? DEFAULT_GATEWAY_CLIENTS_FILE;
  if (!existsSync(clientsFile)) {
    throw new GatewayAuthConfigError(
      `API key mode requires a local clients file at "${clientsFile}".`,
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(clientsFile, "utf8")) as unknown;
  } catch (error) {
    throw new GatewayAuthConfigError(`Unable to read gateway clients file: ${errorMessage(error)}`);
  }

  if (!isClientsFile(parsed)) {
    throw new GatewayAuthConfigError(
      "Gateway clients file must contain a clients array with client_id and api_key strings.",
    );
  }

  validateClients(parsed.clients);
  return { require_api_key: true, clients: parsed.clients };
}

export function authenticateGatewayRequest(input: {
  protectedEndpoint: boolean;
  clientIdHeader?: string;
  apiKeyHeader?: string;
  authConfig: GatewayAuthConfig;
}): GatewayAuthResult {
  const requestedClientId = normalizeClientId(input.clientIdHeader);

  if (!input.protectedEndpoint || !input.authConfig.require_api_key) {
    return {
      client_id: requestedClientId,
      auth_required: false,
      auth_ok: null,
    };
  }

  const apiKey = input.apiKeyHeader?.trim();
  if (apiKey === undefined || apiKey.length === 0) {
    return unauthorized(requestedClientId, "Missing X-ATG-API-Key header.");
  }

  const matchedClient = input.authConfig.clients.find((client) => client.api_key === apiKey);
  if (matchedClient === undefined) {
    return unauthorized(requestedClientId, "Invalid local gateway API key.");
  }

  if (
    input.clientIdHeader !== undefined &&
    requestedClientId !== DEFAULT_GATEWAY_CLIENT_ID &&
    requestedClientId !== matchedClient.client_id
  ) {
    return unauthorized(
      requestedClientId,
      "X-ATG-Client-ID does not match the supplied local API key.",
    );
  }

  return {
    client_id: matchedClient.client_id,
    auth_required: true,
    auth_ok: true,
  };
}

export function normalizeClientId(clientId: string | undefined): string {
  const normalized = clientId?.trim();
  return normalized === undefined || normalized.length === 0
    ? DEFAULT_GATEWAY_CLIENT_ID
    : normalized;
}

function unauthorized(clientId: string, message: string): GatewayAuthResult {
  return {
    client_id: clientId,
    auth_required: true,
    auth_ok: false,
    error_code: "UNAUTHORIZED_GATEWAY_REQUEST",
    error_message: message,
  };
}

function validateClients(clients: GatewayClient[]): void {
  if (clients.length === 0) {
    throw new GatewayAuthConfigError("API key mode requires at least one local gateway client.");
  }

  for (const client of clients) {
    if (client.client_id.trim().length === 0 || client.api_key.trim().length === 0) {
      throw new GatewayAuthConfigError("Gateway clients require non-empty client_id and api_key values.");
    }
    if (
      client.decision_allowance !== undefined &&
      (!Number.isInteger(client.decision_allowance) || client.decision_allowance < 0)
    ) {
      throw new GatewayAuthConfigError("Gateway client decision_allowance must be a non-negative integer.");
    }
    if (
      client.allowance_window !== undefined &&
      client.allowance_window !== "all_time" &&
      client.allowance_window !== "daily" &&
      client.allowance_window !== "monthly"
    ) {
      throw new GatewayAuthConfigError("Gateway client allowance_window must be all_time, daily, or monthly.");
    }
    if (
      client.rate_limit !== undefined &&
      (
        !Number.isInteger(client.rate_limit.max_requests) ||
        client.rate_limit.max_requests < 1 ||
        client.rate_limit.window !== "local_runtime"
      )
    ) {
      throw new GatewayAuthConfigError(
        "Gateway client rate_limit requires a positive integer max_requests and window local_runtime.",
      );
    }
  }
}

function isClientsFile(value: unknown): value is { clients: GatewayClient[] } {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const candidate = value as { clients?: unknown };
  return (
    Array.isArray(candidate.clients) &&
    candidate.clients.every((client) => {
      if (typeof client !== "object" || client === null || Array.isArray(client)) {
        return false;
      }

      const gatewayClient = client as Partial<GatewayClient>;
      return (
        typeof gatewayClient.client_id === "string" &&
        typeof gatewayClient.api_key === "string" &&
        (gatewayClient.label === undefined || typeof gatewayClient.label === "string") &&
        (
          gatewayClient.decision_allowance === undefined ||
          typeof gatewayClient.decision_allowance === "number"
        ) &&
        (
          gatewayClient.allowance_window === undefined ||
          typeof gatewayClient.allowance_window === "string"
        ) &&
        (
          gatewayClient.rate_limit === undefined ||
          (
            typeof gatewayClient.rate_limit === "object" &&
            gatewayClient.rate_limit !== null &&
            !Array.isArray(gatewayClient.rate_limit)
          )
        )
      );
    })
  );
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
