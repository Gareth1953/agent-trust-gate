import type { GatewayClient } from "./gateway-auth.js";
import {
  DEFAULT_GATEWAY_REQUEST_LOG_PATH,
  isProtectedGatewayLogEntry,
  readValidGatewayRequestLogEntries,
} from "./gateway-logging.js";

export type AllowanceWindow = "all_time" | "daily" | "monthly";

export interface GatewayUsageLimitResult {
  usage_checked: boolean;
  client_id: string;
  decision_allowance?: number;
  allowance_window?: AllowanceWindow;
  used_decisions?: number;
  remaining_decisions?: number;
  over_limit: boolean;
}

export interface GatewayUsageObject {
  client_id: string;
  decision_allowance: number;
  allowance_window: AllowanceWindow;
  used_decisions: number;
  remaining_decisions: number;
  over_limit: boolean;
}

export function checkGatewayClientUsageLimit(input: {
  client: GatewayClient | undefined;
  clientId: string;
  gatewayLogPath?: string;
  now?: Date;
}): GatewayUsageLimitResult {
  const client = input.client;
  if (client?.decision_allowance === undefined) {
    return {
      usage_checked: false,
      client_id: input.clientId,
      over_limit: false,
    };
  }

  const allowanceWindow = client.allowance_window ?? "all_time";
  const now = input.now ?? new Date();
  const usedDecisions = countUsedProtectedRequests({
    clientId: input.clientId,
    allowanceWindow,
    gatewayLogPath: input.gatewayLogPath ?? DEFAULT_GATEWAY_REQUEST_LOG_PATH,
    now,
  });
  const remainingDecisions = Math.max(client.decision_allowance - usedDecisions, 0);

  return {
    usage_checked: true,
    client_id: input.clientId,
    decision_allowance: client.decision_allowance,
    allowance_window: allowanceWindow,
    used_decisions: usedDecisions,
    remaining_decisions: remainingDecisions,
    over_limit: usedDecisions >= client.decision_allowance,
  };
}

export function usageObject(
  usage: GatewayUsageLimitResult,
  acceptedCurrentRequest: boolean,
): GatewayUsageObject | undefined {
  if (
    !usage.usage_checked ||
    usage.decision_allowance === undefined ||
    usage.allowance_window === undefined ||
    usage.used_decisions === undefined ||
    usage.remaining_decisions === undefined
  ) {
    return undefined;
  }

  const usedDecisions = acceptedCurrentRequest ? usage.used_decisions + 1 : usage.used_decisions;
  const remainingDecisions = Math.max(usage.decision_allowance - usedDecisions, 0);

  return {
    client_id: usage.client_id,
    decision_allowance: usage.decision_allowance,
    allowance_window: usage.allowance_window,
    used_decisions: usedDecisions,
    remaining_decisions: remainingDecisions,
    over_limit: usage.over_limit,
  };
}

function countUsedProtectedRequests(input: {
  clientId: string;
  allowanceWindow: AllowanceWindow;
  gatewayLogPath: string;
  now: Date;
}): number {
  const windowStart = allowanceWindowStart(input.allowanceWindow, input.now);
  return readValidGatewayRequestLogEntries(input.gatewayLogPath).filter((entry) => {
    if (entry.client_id !== input.clientId || !isProtectedGatewayLogEntry(entry)) {
      return false;
    }
    if (!entry.ok) {
      return false;
    }
    return windowStart === null || entry.timestamp >= windowStart;
  }).length;
}

function allowanceWindowStart(window: AllowanceWindow, now: Date): string | null {
  if (window === "all_time") {
    return null;
  }

  if (window === "daily") {
    return new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
    )).toISOString();
  }

  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}
