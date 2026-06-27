import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { CONTRACT_VERSION } from "./contract.js";

export const DEFAULT_GATEWAY_LOGS_DIRECTORY = "gateway-logs";
export const DEFAULT_GATEWAY_REQUEST_LOG_PATH = join(
  DEFAULT_GATEWAY_LOGS_DIRECTORY,
  "gateway-requests.jsonl",
);

export interface GatewayRequestLogEntry {
  request_id: string;
  timestamp: string;
  endpoint: string;
  method: string;
  ok: boolean;
  status_code: number;
  contract_version: string;
  gateway_mode: "local";
  duration_ms: number;
  client_id?: string;
  auth_required?: boolean;
  auth_ok?: boolean | null;
  usage_checked?: boolean;
  decision_allowance?: number;
  allowance_window?: string;
  used_decisions?: number;
  remaining_decisions?: number;
  over_limit?: boolean;
  rate_limit_status?: string;
  abuse_status?: string;
  rate_limit_max_requests?: number;
  rate_limit_used_requests?: number;
  rate_limit_remaining_requests?: number;
  policy_profile?: string;
  action_type?: string;
  actor?: string;
  target?: string;
  allowed?: boolean;
  risk_level?: string;
  human_approval_required?: boolean;
  regulated_policy?: boolean;
  error_code?: string;
}

export interface GatewayUsageSummary {
  gateway_logs_path: string;
  total_requests: number;
  successful_requests: number;
  error_requests: number;
  malformed_log_lines_count: number;
  endpoint_counts: Record<string, number>;
  method_counts: Record<string, number>;
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
  client_id_counts: Record<string, number>;
  authenticated_requests: number;
  unauthenticated_requests: number;
  unauthorized_requests: number;
  over_limit_requests: number;
  usage_limited_client_counts: Record<string, number>;
  client_usage_summary: Record<string, GatewayClientUsageSummary>;
  policy_profile_counts: Record<string, number>;
  error_code_counts: Record<string, number>;
  first_request_at: string | null;
  last_request_at: string | null;
}

export type GatewayRequestListEntry =
  | (Pick<
      GatewayRequestLogEntry,
      | "request_id"
      | "timestamp"
      | "endpoint"
      | "method"
      | "ok"
      | "status_code"
      | "gateway_mode"
    > & {
      status: "valid";
      client_id: string;
      auth_required: boolean;
      auth_ok: boolean | null;
      usage_checked: boolean;
      over_limit: boolean;
      remaining_decisions?: number;
      policy_profile?: string;
      action_type?: string;
      allowed?: boolean;
      risk_level?: string;
      human_approval_required?: boolean;
      error_code?: string;
    })
  | {
      status: "malformed";
      line_number: number;
      error: string;
    };

export interface GatewayClientUsageSummary {
  client_id: string;
  total_requests: number;
  protected_requests: number;
  decision_requests: number;
  approval_pack_requests: number;
  evidence_bundle_requests: number;
  allowed_count: number;
  blocked_count: number;
  error_requests: number;
  over_limit_requests: number;
  latest_request_at: string | null;
}

export interface GatewayClientUsageAudit {
  gateway_logs_path: string;
  clients: Array<GatewayClientUsageSummary & {
    successful_requests: number;
    unauthorized_requests: number;
    approval_required_count: number;
    first_request_at: string | null;
    last_request_at: string | null;
  }>;
}

export function appendGatewayRequestLog(
  entry: GatewayRequestLogEntry,
  logPath = DEFAULT_GATEWAY_REQUEST_LOG_PATH,
): void {
  try {
    mkdirSync(dirname(logPath), { recursive: true });
    appendFileSync(logPath, `${JSON.stringify(entry)}\n`, "utf8");
  } catch {
    // Gateway logging is best-effort. API responses must not fail because local logging failed.
  }
}

export function auditGatewayUsage(logPath = DEFAULT_GATEWAY_REQUEST_LOG_PATH): GatewayUsageSummary {
  const summary = emptyGatewayUsageSummary(logPath);
  const parsedEntries = readGatewayRequestLog(logPath);

  for (const parsed of parsedEntries) {
    if (parsed.status === "malformed") {
      summary.malformed_log_lines_count += 1;
      continue;
    }

    const entry = parsed.entry;
    const clientId = entry.client_id ?? "local-anonymous";
    const authRequired = entry.auth_required ?? false;
    const authOk = entry.auth_ok ?? null;
    summary.total_requests += 1;
    increment(summary.endpoint_counts, entry.endpoint);
    increment(summary.method_counts, entry.method);
    increment(summary.client_id_counts, clientId);
    updateClientUsageSummary(summary.client_usage_summary, entry, clientId);

    if (entry.ok) {
      summary.successful_requests += 1;
    } else {
      summary.error_requests += 1;
    }

    if (authOk === true) {
      summary.authenticated_requests += 1;
    }
    if (!authRequired) {
      summary.unauthenticated_requests += 1;
    }
    if (authOk === false || entry.error_code === "UNAUTHORIZED_GATEWAY_REQUEST") {
      summary.unauthorized_requests += 1;
    }
    if (entry.over_limit === true || entry.error_code === "CLIENT_USAGE_LIMIT_EXCEEDED") {
      summary.over_limit_requests += 1;
      increment(summary.usage_limited_client_counts, clientId);
    }

    if (entry.endpoint === "/v1/decision") {
      summary.decision_requests_count += 1;
    }
    if (entry.endpoint === "/v1/approval-pack") {
      summary.approval_pack_requests_count += 1;
    }
    if (entry.endpoint === "/v1/evidence-bundle") {
      summary.evidence_bundle_requests_count += 1;
    }
    if (entry.endpoint === "/v1/health") {
      summary.health_requests_count += 1;
    }

    if (entry.allowed === true) {
      summary.allowed_count += 1;
    } else if (entry.allowed === false) {
      summary.blocked_count += 1;
    }

    if (entry.human_approval_required === true) {
      summary.approval_required_count += 1;
    }

    if (entry.risk_level === "high") {
      summary.high_risk_count += 1;
    } else if (entry.risk_level === "medium") {
      summary.medium_risk_count += 1;
    } else if (entry.risk_level === "low") {
      summary.low_risk_count += 1;
    }

    if (entry.regulated_policy === true) {
      summary.regulated_policy_count += 1;
    }

    if (entry.policy_profile !== undefined) {
      increment(summary.policy_profile_counts, entry.policy_profile);
    }

    if (entry.error_code !== undefined) {
      increment(summary.error_code_counts, entry.error_code);
    }

    if (summary.first_request_at === null || entry.timestamp < summary.first_request_at) {
      summary.first_request_at = entry.timestamp;
    }
    if (summary.last_request_at === null || entry.timestamp > summary.last_request_at) {
      summary.last_request_at = entry.timestamp;
    }
  }

  return summary;
}

export function listGatewayRequests(
  limit = 20,
  logPath = DEFAULT_GATEWAY_REQUEST_LOG_PATH,
): GatewayRequestListEntry[] {
  const parsedEntries = readGatewayRequestLog(logPath);
  return parsedEntries.slice(-limit).map((parsed) => {
    if (parsed.status === "malformed") {
      return {
        status: "malformed",
        line_number: parsed.line_number,
        error: parsed.error,
      };
    }

    const entry = parsed.entry;
    return {
      status: "valid",
      request_id: entry.request_id,
      timestamp: entry.timestamp,
      endpoint: entry.endpoint,
      method: entry.method,
      ok: entry.ok,
      status_code: entry.status_code,
      gateway_mode: entry.gateway_mode,
      client_id: entry.client_id ?? "local-anonymous",
      auth_required: entry.auth_required ?? false,
      auth_ok: entry.auth_ok ?? null,
      usage_checked: entry.usage_checked ?? false,
      over_limit: entry.over_limit ?? false,
      ...(entry.remaining_decisions === undefined
        ? {}
        : { remaining_decisions: entry.remaining_decisions }),
      ...(entry.policy_profile === undefined ? {} : { policy_profile: entry.policy_profile }),
      ...(entry.action_type === undefined ? {} : { action_type: entry.action_type }),
      ...(entry.allowed === undefined ? {} : { allowed: entry.allowed }),
      ...(entry.risk_level === undefined ? {} : { risk_level: entry.risk_level }),
      ...(entry.human_approval_required === undefined
        ? {}
        : { human_approval_required: entry.human_approval_required }),
      ...(entry.error_code === undefined ? {} : { error_code: entry.error_code }),
    };
  });
}

export function emptyGatewayUsageSummary(logPath = DEFAULT_GATEWAY_REQUEST_LOG_PATH): GatewayUsageSummary {
  return {
    gateway_logs_path: logPath,
    total_requests: 0,
    successful_requests: 0,
    error_requests: 0,
    malformed_log_lines_count: 0,
    endpoint_counts: {},
    method_counts: {},
    decision_requests_count: 0,
    approval_pack_requests_count: 0,
    evidence_bundle_requests_count: 0,
    health_requests_count: 0,
    allowed_count: 0,
    blocked_count: 0,
    approval_required_count: 0,
    high_risk_count: 0,
    medium_risk_count: 0,
    low_risk_count: 0,
    regulated_policy_count: 0,
    client_id_counts: {},
    authenticated_requests: 0,
    unauthenticated_requests: 0,
    unauthorized_requests: 0,
    over_limit_requests: 0,
    usage_limited_client_counts: {},
    client_usage_summary: {},
    policy_profile_counts: {},
    error_code_counts: {},
    first_request_at: null,
    last_request_at: null,
  };
}

export function auditGatewayClientUsage(
  logPath = DEFAULT_GATEWAY_REQUEST_LOG_PATH,
): GatewayClientUsageAudit {
  const clientsById: Record<string, GatewayClientUsageAudit["clients"][number]> = {};

  for (const entry of readValidGatewayRequestLogEntries(logPath)) {
    const clientId = entry.client_id ?? "local-anonymous";
    const client = clientsById[clientId] ?? {
      client_id: clientId,
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
      first_request_at: null,
      last_request_at: null,
      latest_request_at: null,
    };

    updateFullClientUsageSummary(client, entry);
    clientsById[clientId] = client;
  }

  return {
    gateway_logs_path: logPath,
    clients: Object.values(clientsById).sort((left, right) => (
      left.client_id.localeCompare(right.client_id)
    )),
  };
}

export function readValidGatewayRequestLogEntries(
  logPath = DEFAULT_GATEWAY_REQUEST_LOG_PATH,
): GatewayRequestLogEntry[] {
  return readGatewayRequestLog(logPath)
    .filter((entry): entry is { status: "valid"; entry: GatewayRequestLogEntry } => (
      entry.status === "valid"
    ))
    .map((entry) => entry.entry);
}

export function isProtectedGatewayLogEntry(entry: GatewayRequestLogEntry): boolean {
  return (
    entry.method === "POST" &&
    (
      entry.endpoint === "/v1/decision" ||
      entry.endpoint === "/v1/approval-pack" ||
      entry.endpoint === "/v1/evidence-bundle"
    )
  );
}

function readGatewayRequestLog(logPath: string): Array<
  | { status: "valid"; entry: GatewayRequestLogEntry }
  | { status: "malformed"; line_number: number; error: string }
> {
  if (!existsSync(logPath)) {
    return [];
  }

  const contents = readFileSync(logPath, "utf8");
  return contents
    .split(/\r?\n/)
    .map((line, index) => ({ line, lineNumber: index + 1 }))
    .filter(({ line }) => line.trim().length > 0)
    .map(({ line, lineNumber }) => parseGatewayLogLine(line, lineNumber));
}

function parseGatewayLogLine(
  line: string,
  lineNumber: number,
):
  | { status: "valid"; entry: GatewayRequestLogEntry }
  | { status: "malformed"; line_number: number; error: string } {
  try {
    const parsed = JSON.parse(line) as unknown;
    if (!isGatewayRequestLogEntry(parsed)) {
      return {
        status: "malformed",
        line_number: lineNumber,
        error: "Log line does not match gateway request log shape.",
      };
    }
    return { status: "valid", entry: parsed };
  } catch (error) {
    return {
      status: "malformed",
      line_number: lineNumber,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function isGatewayRequestLogEntry(value: unknown): value is GatewayRequestLogEntry {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Partial<GatewayRequestLogEntry>;
  return (
    typeof candidate.request_id === "string" &&
    typeof candidate.timestamp === "string" &&
    typeof candidate.endpoint === "string" &&
    typeof candidate.method === "string" &&
    typeof candidate.ok === "boolean" &&
    typeof candidate.status_code === "number" &&
    candidate.contract_version === CONTRACT_VERSION &&
    candidate.gateway_mode === "local" &&
    typeof candidate.duration_ms === "number"
  );
}

function increment(counts: Record<string, number>, key: string): void {
  counts[key] = (counts[key] ?? 0) + 1;
}

function updateClientUsageSummary(
  summaries: Record<string, GatewayClientUsageSummary>,
  entry: GatewayRequestLogEntry,
  clientId: string,
): void {
  const summary = summaries[clientId] ?? {
    client_id: clientId,
    total_requests: 0,
    protected_requests: 0,
    decision_requests: 0,
    approval_pack_requests: 0,
    evidence_bundle_requests: 0,
    allowed_count: 0,
    blocked_count: 0,
    error_requests: 0,
    over_limit_requests: 0,
    latest_request_at: null,
  };

  updateBaseClientUsageSummary(summary, entry);
  summaries[clientId] = summary;
}

function updateFullClientUsageSummary(
  summary: GatewayClientUsageAudit["clients"][number],
  entry: GatewayRequestLogEntry,
): void {
  updateBaseClientUsageSummary(summary, entry);
  if (entry.ok) {
    summary.successful_requests += 1;
  }
  if (entry.error_code === "UNAUTHORIZED_GATEWAY_REQUEST" || entry.auth_ok === false) {
    summary.unauthorized_requests += 1;
  }
  if (entry.human_approval_required === true) {
    summary.approval_required_count += 1;
  }
  if (summary.first_request_at === null || entry.timestamp < summary.first_request_at) {
    summary.first_request_at = entry.timestamp;
  }
  summary.last_request_at = summary.latest_request_at;
}

function updateBaseClientUsageSummary(
  summary: GatewayClientUsageSummary,
  entry: GatewayRequestLogEntry,
): void {
  summary.total_requests += 1;
  if (isProtectedGatewayLogEntry(entry)) {
    summary.protected_requests += 1;
  }
  if (entry.endpoint === "/v1/decision") {
    summary.decision_requests += 1;
  }
  if (entry.endpoint === "/v1/approval-pack") {
    summary.approval_pack_requests += 1;
  }
  if (entry.endpoint === "/v1/evidence-bundle") {
    summary.evidence_bundle_requests += 1;
  }
  if (entry.allowed === true) {
    summary.allowed_count += 1;
  } else if (entry.allowed === false) {
    summary.blocked_count += 1;
  }
  if (!entry.ok) {
    summary.error_requests += 1;
  }
  if (entry.over_limit === true || entry.error_code === "CLIENT_USAGE_LIMIT_EXCEEDED") {
    summary.over_limit_requests += 1;
  }
  if (summary.latest_request_at === null || entry.timestamp > summary.latest_request_at) {
    summary.latest_request_at = entry.timestamp;
  }
}
