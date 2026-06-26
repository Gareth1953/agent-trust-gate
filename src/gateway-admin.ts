import { existsSync, readFileSync } from "node:fs";

import { CONTRACT_VERSION } from "./contract.js";
import { DEFAULT_GATEWAY_CLIENTS_FILE } from "./gateway-auth.js";
import {
  auditGatewayClientUsage,
  auditGatewayUsage,
  DEFAULT_GATEWAY_REQUEST_LOG_PATH,
  isProtectedGatewayLogEntry,
  readValidGatewayRequestLogEntries,
  type GatewayClientUsageAudit,
  type GatewayRequestLogEntry,
  type GatewayUsageSummary,
} from "./gateway-logging.js";

export type GatewayAdminAllowanceStatus =
  | "unlimited"
  | "under_limit"
  | "at_limit"
  | "over_limit"
  | "unknown";

export interface GatewayAdminClientSummary {
  client_id: string;
  configured: boolean;
  has_api_key_configured: boolean;
  total_requests: number;
  protected_requests: number;
  decision_requests: number;
  approval_pack_requests: number;
  evidence_bundle_requests: number;
  successful_requests: number;
  error_requests: number;
  unauthorized_requests: number;
  over_limit_requests: number;
  allowed_count: number;
  blocked_count: number;
  approval_required_count: number;
  allowance_status: GatewayAdminAllowanceStatus;
  first_request_at: string | null;
  last_request_at: string | null;
  label?: string;
  decision_allowance?: number;
  allowance_window?: string;
  used_decisions?: number;
  remaining_decisions?: number;
}

export interface GatewayAdminSummary {
  contract_version: string;
  generated_at: string;
  gateway_logs_path: string;
  clients_file_path: string;
  clients_file_found: boolean;
  gateway_health: {
    log_file_found: boolean;
    total_requests: number;
    successful_requests: number;
    error_requests: number;
    malformed_log_lines_count: number;
    first_request_at: string | null;
    last_request_at: string | null;
  };
  decision_activity: {
    decision_requests_count: number;
    approval_pack_requests_count: number;
    evidence_bundle_requests_count: number;
    health_requests_count: number;
    allowed_count: number;
    blocked_count: number;
    approval_required_count: number;
    high_risk_count: number;
    medium_risk_count: number;
    low_risk_count: number;
    regulated_policy_count: number;
  };
  auth_activity: {
    authenticated_requests: number;
    unauthenticated_requests: number;
    unauthorized_requests: number;
  };
  usage_limit_activity: {
    over_limit_requests: number;
    usage_limited_client_counts: Record<string, number>;
  };
  clients: GatewayAdminClientSummary[];
  warnings: string[];
}

interface SanitizedGatewayClient {
  client_id: string;
  configured: true;
  has_api_key_configured: boolean;
  label?: string;
  decision_allowance?: number;
  allowance_window?: string;
}

export function createGatewayAdminSummary(options: {
  logPath?: string;
  clientsFile?: string;
} = {}): GatewayAdminSummary {
  const logPath = options.logPath ?? DEFAULT_GATEWAY_REQUEST_LOG_PATH;
  const clientsFilePath = options.clientsFile ?? DEFAULT_GATEWAY_CLIENTS_FILE;
  const usage = auditGatewayUsage(logPath);
  const clientUsage = auditGatewayClientUsage(logPath);
  const logEntries = readValidGatewayRequestLogEntries(logPath);
  const configuredClients = readConfiguredGatewayClients(clientsFilePath);
  const clients = mergeGatewayAdminClients(clientUsage, configuredClients.clients, logEntries);
  const warnings = [...configuredClients.warnings];

  if (!existsSync(logPath)) {
    warnings.push(`Gateway request log file was not found at ${logPath}.`);
  }

  if (usage.malformed_log_lines_count > 0) {
    warnings.push(`${usage.malformed_log_lines_count} malformed gateway log line(s) were ignored.`);
  }

  return {
    contract_version: CONTRACT_VERSION,
    generated_at: new Date().toISOString(),
    gateway_logs_path: logPath,
    clients_file_path: clientsFilePath,
    clients_file_found: configuredClients.found,
    gateway_health: {
      log_file_found: existsSync(logPath),
      total_requests: usage.total_requests,
      successful_requests: usage.successful_requests,
      error_requests: usage.error_requests,
      malformed_log_lines_count: usage.malformed_log_lines_count,
      first_request_at: usage.first_request_at,
      last_request_at: usage.last_request_at,
    },
    decision_activity: {
      decision_requests_count: usage.decision_requests_count,
      approval_pack_requests_count: usage.approval_pack_requests_count,
      evidence_bundle_requests_count: usage.evidence_bundle_requests_count,
      health_requests_count: usage.health_requests_count,
      allowed_count: usage.allowed_count,
      blocked_count: usage.blocked_count,
      approval_required_count: usage.approval_required_count,
      high_risk_count: usage.high_risk_count,
      medium_risk_count: usage.medium_risk_count,
      low_risk_count: usage.low_risk_count,
      regulated_policy_count: usage.regulated_policy_count,
    },
    auth_activity: {
      authenticated_requests: usage.authenticated_requests,
      unauthenticated_requests: usage.unauthenticated_requests,
      unauthorized_requests: usage.unauthorized_requests,
    },
    usage_limit_activity: {
      over_limit_requests: usage.over_limit_requests,
      usage_limited_client_counts: usage.usage_limited_client_counts,
    },
    clients,
    warnings,
  };
}

export function formatGatewayAdminForConsole(summary: GatewayAdminSummary): string {
  return [
    "Agent Trust Gate gateway admin summary",
    `contract_version: ${summary.contract_version}`,
    "",
    "Gateway health:",
    `- total_requests: ${summary.gateway_health.total_requests}`,
    `- successful_requests: ${summary.gateway_health.successful_requests}`,
    `- error_requests: ${summary.gateway_health.error_requests}`,
    `- malformed_log_lines_count: ${summary.gateway_health.malformed_log_lines_count}`,
    `- first_request_at: ${summary.gateway_health.first_request_at ?? "none"}`,
    `- last_request_at: ${summary.gateway_health.last_request_at ?? "none"}`,
    "",
    "Decision activity:",
    `- decisions: ${summary.decision_activity.decision_requests_count}`,
    `- approval_packs: ${summary.decision_activity.approval_pack_requests_count}`,
    `- evidence_bundles: ${summary.decision_activity.evidence_bundle_requests_count}`,
    `- health_checks: ${summary.decision_activity.health_requests_count}`,
    `- allowed: ${summary.decision_activity.allowed_count}`,
    `- blocked: ${summary.decision_activity.blocked_count}`,
    `- approval_required: ${summary.decision_activity.approval_required_count}`,
    "",
    "Client usage:",
    ...formatAdminClients(summary.clients),
    "",
    "Auth / limits:",
    `- authenticated_requests: ${summary.auth_activity.authenticated_requests}`,
    `- unauthenticated_requests: ${summary.auth_activity.unauthenticated_requests}`,
    `- unauthorized_requests: ${summary.auth_activity.unauthorized_requests}`,
    `- over_limit_requests: ${summary.usage_limit_activity.over_limit_requests}`,
    "",
    "Warnings:",
    ...formatWarnings(summary.warnings),
    "",
    "Safety:",
    "Local Gateway Admin Summary reads local usage logs and local client configuration only. It does not execute actions, bill customers, expose a public service, authenticate real-world identities, guarantee legality, or prove compliance.",
  ].join("\n");
}

function readConfiguredGatewayClients(clientsFilePath: string): {
  found: boolean;
  clients: SanitizedGatewayClient[];
  warnings: string[];
} {
  if (!existsSync(clientsFilePath)) {
    return {
      found: false,
      clients: [],
      warnings: [`Gateway clients file was not found at ${clientsFilePath}.`],
    };
  }

  try {
    const parsed = JSON.parse(readFileSync(clientsFilePath, "utf8")) as unknown;
    if (!isGatewayClientsFile(parsed)) {
      return {
        found: true,
        clients: [],
        warnings: [`Gateway clients file at ${clientsFilePath} did not match the expected shape.`],
      };
    }

    return {
      found: true,
      clients: parsed.clients.map((client) => ({
        client_id: client.client_id,
        configured: true,
        has_api_key_configured: client.api_key.trim().length > 0,
        ...(client.label === undefined ? {} : { label: client.label }),
        ...(client.decision_allowance === undefined
          ? {}
          : { decision_allowance: client.decision_allowance }),
        ...(client.allowance_window === undefined ? {} : { allowance_window: client.allowance_window }),
      })),
      warnings: [],
    };
  } catch (error) {
    return {
      found: true,
      clients: [],
      warnings: [`Unable to read gateway clients file at ${clientsFilePath}: ${errorMessage(error)}`],
    };
  }
}

function mergeGatewayAdminClients(
  clientUsage: GatewayClientUsageAudit,
  configuredClients: SanitizedGatewayClient[],
  logEntries: GatewayRequestLogEntry[],
): GatewayAdminClientSummary[] {
  const clients = new Map<string, GatewayAdminClientSummary>();

  for (const client of clientUsage.clients) {
    clients.set(client.client_id, {
      client_id: client.client_id,
      configured: false,
      has_api_key_configured: false,
      total_requests: client.total_requests,
      protected_requests: client.protected_requests,
      decision_requests: client.decision_requests,
      approval_pack_requests: client.approval_pack_requests,
      evidence_bundle_requests: client.evidence_bundle_requests,
      successful_requests: client.successful_requests,
      error_requests: client.error_requests,
      unauthorized_requests: client.unauthorized_requests,
      over_limit_requests: client.over_limit_requests,
      allowed_count: client.allowed_count,
      blocked_count: client.blocked_count,
      approval_required_count: client.approval_required_count,
      allowance_status: "unlimited",
      first_request_at: client.first_request_at,
      last_request_at: client.last_request_at,
    });
  }

  for (const configuredClient of configuredClients) {
    const existing = clients.get(configuredClient.client_id) ?? emptyAdminClient(configuredClient.client_id);
    clients.set(configuredClient.client_id, {
      ...existing,
      configured: true,
      has_api_key_configured: configuredClient.has_api_key_configured,
      ...(configuredClient.label === undefined ? {} : { label: configuredClient.label }),
      ...(configuredClient.decision_allowance === undefined
        ? {}
        : { decision_allowance: configuredClient.decision_allowance }),
      ...(configuredClient.allowance_window === undefined
        ? {}
        : { allowance_window: configuredClient.allowance_window }),
    });
  }

  for (const client of clients.values()) {
    const usedDecisions = countUsedProtectedDecisions(logEntries, client.client_id);
    if (client.decision_allowance !== undefined) {
      client.used_decisions = usedDecisions;
      client.remaining_decisions = Math.max(client.decision_allowance - usedDecisions, 0);
    }
    client.allowance_status = allowanceStatus(client, usedDecisions);
  }

  return [...clients.values()].sort((left, right) => left.client_id.localeCompare(right.client_id));
}

function emptyAdminClient(clientId: string): GatewayAdminClientSummary {
  return {
    client_id: clientId,
    configured: false,
    has_api_key_configured: false,
    total_requests: 0,
    protected_requests: 0,
    decision_requests: 0,
    approval_pack_requests: 0,
    evidence_bundle_requests: 0,
    successful_requests: 0,
    error_requests: 0,
    unauthorized_requests: 0,
    over_limit_requests: 0,
    allowed_count: 0,
    blocked_count: 0,
    approval_required_count: 0,
    allowance_status: "unknown",
    first_request_at: null,
    last_request_at: null,
  };
}

function countUsedProtectedDecisions(entries: GatewayRequestLogEntry[], clientId: string): number {
  return entries.filter((entry) => (
    (entry.client_id ?? "local-anonymous") === clientId &&
    entry.ok &&
    isProtectedGatewayLogEntry(entry)
  )).length;
}

function allowanceStatus(
  client: GatewayAdminClientSummary,
  usedDecisions: number,
): GatewayAdminAllowanceStatus {
  if (client.over_limit_requests > 0) {
    return "over_limit";
  }
  if (client.decision_allowance === undefined) {
    return "unlimited";
  }
  if (usedDecisions < client.decision_allowance) {
    return "under_limit";
  }
  if (usedDecisions === client.decision_allowance) {
    return "at_limit";
  }
  if (usedDecisions > client.decision_allowance) {
    return "over_limit";
  }
  return "unknown";
}

function formatAdminClients(clients: GatewayAdminClientSummary[]): string[] {
  if (clients.length === 0) {
    return ["- none: 0"];
  }

  return clients.map((client) => {
    if (client.decision_allowance === undefined) {
      if (client.allowance_status === "over_limit" || client.allowance_status === "unknown") {
        return `- ${client.client_id}: allowance=unknown, total_requests=${client.total_requests}, status=${client.allowance_status}`;
      }
      return `- ${client.client_id}: unlimited, total_requests=${client.total_requests}, status=${client.allowance_status}`;
    }

    return `- ${client.client_id}: used ${client.used_decisions ?? 0} / ${client.decision_allowance}, remaining ${client.remaining_decisions ?? 0}, status=${client.allowance_status}`;
  });
}

function formatWarnings(warnings: string[]): string[] {
  if (warnings.length === 0) {
    return ["- none"];
  }

  return warnings.map((warning) => `- ${warning}`);
}

function isGatewayClientsFile(value: unknown): value is {
  clients: Array<{
    client_id: string;
    api_key: string;
    label?: string;
    decision_allowance?: number;
    allowance_window?: string;
  }>;
} {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const candidate = value as { clients?: unknown };
  return Array.isArray(candidate.clients) && candidate.clients.every(isGatewayClientLike);
}

function isGatewayClientLike(value: unknown): value is {
  client_id: string;
  api_key: string;
  label?: string;
  decision_allowance?: number;
  allowance_window?: string;
} {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const candidate = value as {
    client_id?: unknown;
    api_key?: unknown;
    label?: unknown;
    decision_allowance?: unknown;
    allowance_window?: unknown;
  };

  return (
    typeof candidate.client_id === "string" &&
    typeof candidate.api_key === "string" &&
    (candidate.label === undefined || typeof candidate.label === "string") &&
    (
      candidate.decision_allowance === undefined ||
      typeof candidate.decision_allowance === "number"
    ) &&
    (
      candidate.allowance_window === undefined ||
      typeof candidate.allowance_window === "string"
    )
  );
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
