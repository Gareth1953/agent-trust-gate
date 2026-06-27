import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { CONTRACT_VERSION } from "./contract.js";
import {
  isProtectedGatewayLogEntry,
  type GatewayRequestLogEntry,
} from "./gateway-logging.js";

export const RATE_LIMIT_VERSION = "atg.rate-limit.v1" as const;
export const RATE_LIMIT_SAFETY_STATEMENT =
  "Rate limit and abuse-control signals are local controls only. They are not production-grade abuse prevention and do not bill customers, process payments, or execute actions.";

export type RateLimitStatus =
  | "not_configured"
  | "within_limit"
  | "near_limit"
  | "at_limit"
  | "over_limit";
export type AbuseStatus =
  | "none"
  | "suspicious_volume"
  | "over_limit"
  | "repeated_errors"
  | "unknown_client";

export interface GatewayRateLimitConfig {
  max_requests: number;
  window: "local_runtime";
}

export interface RateLimitStatusReport {
  [key: string]: unknown;
  contract_version: typeof CONTRACT_VERSION;
  rate_limit_version: typeof RATE_LIMIT_VERSION;
  client_id: string;
  local_only: true;
  rate_limit_status: RateLimitStatus;
  rate_limited: boolean;
  window: {
    window_type: "local_runtime" | "local_log_audit";
    max_requests: number | null;
    used_requests: number;
    remaining_requests: number | null;
  };
  abuse_signal: {
    abuse_status: AbuseStatus;
    reasons: string[];
  };
  upgrade: {
    upgrade_required: boolean;
    purchase_enabled: false;
    automatic_purchase_enabled: false;
    billing_enabled: false;
  };
  safety_statement: string;
}

export interface LocalGatewayRateLimiter {
  inspect(input: RateLimitInspectionInput): RateLimitStatusReport;
  consume(input: RateLimitInspectionInput): RateLimitStatusReport;
}

export interface RateLimitInspectionInput {
  clientId: string;
  rateLimit?: GatewayRateLimitConfig;
  knownClient?: boolean;
  repeatedErrors?: number;
  windowType?: "local_runtime" | "local_log_audit";
}

export function calculateLocalRequestCount(
  entries: GatewayRequestLogEntry[],
  clientId: string,
): number {
  return entries.filter((entry) => (
    (entry.client_id ?? "local-anonymous") === clientId && isProtectedGatewayLogEntry(entry)
  )).length;
}

export function createRateLimitStatus(input: {
  clientId: string;
  maxRequests?: number;
  usedRequests?: number;
  knownClient?: boolean;
  repeatedErrors?: number;
  windowType?: "local_runtime" | "local_log_audit";
}): RateLimitStatusReport {
  const usedRequests = Math.max(0, Math.trunc(input.usedRequests ?? 0));
  const maxRequests = input.maxRequests;
  const status = rateLimitStatus(maxRequests, usedRequests);
  const abuse = abuseSignal({
    status,
    knownClient: input.knownClient ?? true,
    repeatedErrors: Math.max(0, Math.trunc(input.repeatedErrors ?? 0)),
  });
  const rateLimited = status === "over_limit";

  return {
    contract_version: CONTRACT_VERSION,
    rate_limit_version: RATE_LIMIT_VERSION,
    client_id: input.clientId,
    local_only: true,
    rate_limit_status: status,
    rate_limited: rateLimited,
    window: {
      window_type: input.windowType ?? "local_runtime",
      max_requests: maxRequests ?? null,
      used_requests: usedRequests,
      remaining_requests: maxRequests === undefined
        ? null
        : Math.max(0, maxRequests - usedRequests),
    },
    abuse_signal: abuse,
    upgrade: {
      upgrade_required: rateLimited,
      purchase_enabled: false,
      automatic_purchase_enabled: false,
      billing_enabled: false,
    },
    safety_statement: RATE_LIMIT_SAFETY_STATEMENT,
  };
}

export function createLocalGatewayRateLimiter(): LocalGatewayRateLimiter {
  const requestCounts = new Map<string, number>();

  function evaluate(input: RateLimitInspectionInput, consume: boolean): RateLimitStatusReport {
    const currentCount = requestCounts.get(input.clientId) ?? 0;
    const usedRequests = input.rateLimit === undefined || !consume
      ? currentCount
      : currentCount + 1;
    if (input.rateLimit !== undefined && consume) {
      requestCounts.set(input.clientId, usedRequests);
    }
    return createRateLimitStatus({
      clientId: input.clientId,
      ...(input.rateLimit === undefined
        ? {}
        : { maxRequests: input.rateLimit.max_requests }),
      usedRequests,
      ...(input.knownClient === undefined ? {} : { knownClient: input.knownClient }),
      ...(input.repeatedErrors === undefined ? {} : { repeatedErrors: input.repeatedErrors }),
      ...(input.windowType === undefined ? {} : { windowType: input.windowType }),
    });
  }

  return {
    inspect: (input) => evaluate(input, false),
    consume: (input) => evaluate(input, true),
  };
}

export function formatRateLimitStatusForConsole(report: RateLimitStatusReport): string {
  return [
    "Agent Trust Gate local rate limit status",
    `rate_limit_version: ${report.rate_limit_version}`,
    `client_id: ${report.client_id}`,
    `rate_limit_status: ${report.rate_limit_status}`,
    `rate_limited: ${report.rate_limited}`,
    "",
    "Local window:",
    `- window_type: ${report.window.window_type}`,
    `- max_requests: ${report.window.max_requests ?? "not_configured"}`,
    `- used_requests: ${report.window.used_requests}`,
    `- remaining_requests: ${report.window.remaining_requests ?? "not_configured"}`,
    "",
    "Abuse signal:",
    `- abuse_status: ${report.abuse_signal.abuse_status}`,
    `- reasons: ${report.abuse_signal.reasons.join(", ") || "none"}`,
    "",
    report.safety_statement,
  ].join("\n");
}

export function writeRateLimitStatusReport(
  outputPath: string,
  report: RateLimitStatusReport,
): string {
  const resolvedPath = resolve(outputPath);
  mkdirSync(dirname(resolvedPath), { recursive: true });
  writeFileSync(resolvedPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return resolvedPath;
}

function rateLimitStatus(maxRequests: number | undefined, usedRequests: number): RateLimitStatus {
  if (maxRequests === undefined) {
    return "not_configured";
  }
  if (usedRequests > maxRequests) {
    return "over_limit";
  }
  if (usedRequests === maxRequests) {
    return "at_limit";
  }
  if (maxRequests > 0 && usedRequests / maxRequests >= 0.8) {
    return "near_limit";
  }
  return "within_limit";
}

function abuseSignal(input: {
  status: RateLimitStatus;
  knownClient: boolean;
  repeatedErrors: number;
}): RateLimitStatusReport["abuse_signal"] {
  if (!input.knownClient) {
    return { abuse_status: "unknown_client", reasons: ["Client is not present in local configuration."] };
  }
  if (input.status === "over_limit") {
    return { abuse_status: "over_limit", reasons: ["Configured local runtime request limit was exceeded."] };
  }
  if (input.repeatedErrors >= 3) {
    return { abuse_status: "repeated_errors", reasons: ["Three or more local request errors were observed."] };
  }
  if (input.status === "near_limit" || input.status === "at_limit") {
    return { abuse_status: "suspicious_volume", reasons: ["Local request volume is near or at the configured limit."] };
  }
  return { abuse_status: "none", reasons: [] };
}
