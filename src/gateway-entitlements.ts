import { existsSync } from "node:fs";

import { CONTRACT_VERSION } from "./contract.js";
import {
  DEFAULT_GATEWAY_CLIENT_ID,
  loadGatewayAuthConfig,
  normalizeClientId,
  type GatewayClient,
} from "./gateway-auth.js";
import {
  DEFAULT_GATEWAY_REQUEST_LOG_PATH,
  isProtectedGatewayLogEntry,
  readValidGatewayRequestLogEntries,
} from "./gateway-logging.js";
import {
  allowanceWindowStart,
  countUsedProtectedRequests,
  type AllowanceWindow,
} from "./gateway-usage-limits.js";

export const ENTITLEMENT_VERSION = "atg.entitlement.v1" as const;
export const ENTITLEMENT_SAFETY_STATEMENT =
  "Entitlement status is a local control signal only. Agent Trust Gate does not bill customers, process payments, or execute actions.";

export type EntitlementStatus =
  | "active"
  | "unlimited_local"
  | "at_limit"
  | "over_limit"
  | "unknown_client";

export interface GatewayEntitlementStatus {
  [key: string]: unknown;
  contract_version: typeof CONTRACT_VERSION;
  entitlement_version: typeof ENTITLEMENT_VERSION;
  client_id: string;
  tenant_id: null;
  account_id: null;
  local_only: true;
  billing_enabled: false;
  payment_processing_enabled: false;
  automatic_purchase_enabled: false;
  entitlement_status: EntitlementStatus;
  usage: {
    decision_allowance: number | null;
    allowance_window: AllowanceWindow | null;
    used_decisions: number;
    remaining_decisions: number | null;
    over_limit: boolean;
  };
  upgrade: {
    upgrade_required: boolean;
    upgrade_reason:
      | "local_decision_allowance_exceeded"
      | "local_decision_allowance_at_limit"
      | null;
    purchase_enabled: false;
    automatic_purchase_enabled: false;
    billing_enabled: false;
    purchase_mode: "not_enabled_local_only";
  };
  safety_statement: string;
}

export function getGatewayEntitlementStatus(input: {
  clientId?: string;
  clients?: GatewayClient[];
  gatewayLogPath?: string;
  now?: Date;
} = {}): GatewayEntitlementStatus {
  const clientId = normalizeClientId(input.clientId ?? DEFAULT_GATEWAY_CLIENT_ID);
  const clients = input.clients ?? [];
  const client = clients.find((candidate) => candidate.client_id === clientId);
  const gatewayLogPath = input.gatewayLogPath ?? DEFAULT_GATEWAY_REQUEST_LOG_PATH;
  const now = input.now ?? new Date();
  const allowanceWindow = client?.allowance_window ?? "all_time";
  const usedDecisions = countUsedProtectedRequests({
    clientId,
    allowanceWindow,
    gatewayLogPath,
    now,
  });
  const hasProtectedUsage = readValidGatewayRequestLogEntries(gatewayLogPath).some((entry) => (
    (entry.client_id ?? DEFAULT_GATEWAY_CLIENT_ID) === clientId &&
    entry.ok &&
    isProtectedGatewayLogEntry(entry)
  ));

  let entitlementStatus: EntitlementStatus;
  let remainingDecisions: number | null = null;
  let overLimit = false;

  if (client === undefined && !hasProtectedUsage) {
    entitlementStatus = "unknown_client";
  } else if (client?.decision_allowance === undefined) {
    entitlementStatus = "unlimited_local";
  } else {
    remainingDecisions = Math.max(client.decision_allowance - usedDecisions, 0);
    const overLimitEvent = hasCurrentOverLimitEvent({
      clientId,
      allowanceWindow,
      gatewayLogPath,
      now,
    });
    overLimit = usedDecisions > client.decision_allowance || overLimitEvent;
    entitlementStatus = overLimit
      ? "over_limit"
      : remainingDecisions === 0
        ? "at_limit"
        : "active";
  }

  const upgradeRequired = entitlementStatus === "at_limit" || entitlementStatus === "over_limit";
  const upgradeReason = entitlementStatus === "over_limit"
    ? "local_decision_allowance_exceeded"
    : entitlementStatus === "at_limit"
      ? "local_decision_allowance_at_limit"
      : null;

  return {
    contract_version: CONTRACT_VERSION,
    entitlement_version: ENTITLEMENT_VERSION,
    client_id: clientId,
    tenant_id: null,
    account_id: null,
    local_only: true,
    billing_enabled: false,
    payment_processing_enabled: false,
    automatic_purchase_enabled: false,
    entitlement_status: entitlementStatus,
    usage: {
      decision_allowance: client?.decision_allowance ?? null,
      allowance_window: client?.decision_allowance === undefined ? null : allowanceWindow,
      used_decisions: usedDecisions,
      remaining_decisions: remainingDecisions,
      over_limit: overLimit,
    },
    upgrade: {
      upgrade_required: upgradeRequired,
      upgrade_reason: upgradeReason,
      purchase_enabled: false,
      automatic_purchase_enabled: false,
      billing_enabled: false,
      purchase_mode: "not_enabled_local_only",
    },
    safety_statement: ENTITLEMENT_SAFETY_STATEMENT,
  };
}

export function readEntitlementClientsFile(clientsFile: string | undefined): GatewayClient[] {
  if (clientsFile === undefined || !existsSync(clientsFile)) {
    return [];
  }
  return loadGatewayAuthConfig({ requireApiKey: true, clientsFile }).clients;
}

export function formatGatewayEntitlementForConsole(entitlement: GatewayEntitlementStatus): string {
  return [
    "Agent Trust Gate local entitlement status",
    `contract_version: ${entitlement.contract_version}`,
    `entitlement_version: ${entitlement.entitlement_version}`,
    `client_id: ${entitlement.client_id}`,
    `tenant_id: ${entitlement.tenant_id ?? "not_configured"}`,
    `account_id: ${entitlement.account_id ?? "not_configured"}`,
    `entitlement_status: ${entitlement.entitlement_status}`,
    "",
    "Usage:",
    `- decision_allowance: ${entitlement.usage.decision_allowance ?? "unlimited_or_unknown"}`,
    `- allowance_window: ${entitlement.usage.allowance_window ?? "none"}`,
    `- used_decisions: ${entitlement.usage.used_decisions}`,
    `- remaining_decisions: ${entitlement.usage.remaining_decisions ?? "unlimited_or_unknown"}`,
    `- over_limit: ${entitlement.usage.over_limit}`,
    "",
    "Upgrade signal:",
    `- upgrade_required: ${entitlement.upgrade.upgrade_required}`,
    `- upgrade_reason: ${entitlement.upgrade.upgrade_reason ?? "none"}`,
    `- purchase_enabled: ${entitlement.upgrade.purchase_enabled}`,
    `- automatic_purchase_enabled: ${entitlement.upgrade.automatic_purchase_enabled}`,
    `- billing_enabled: ${entitlement.upgrade.billing_enabled}`,
    "",
    entitlement.safety_statement,
  ].join("\n");
}

function hasCurrentOverLimitEvent(input: {
  clientId: string;
  allowanceWindow: AllowanceWindow;
  gatewayLogPath: string;
  now: Date;
}): boolean {
  const windowStart = allowanceWindowStart(input.allowanceWindow, input.now);
  return readValidGatewayRequestLogEntries(input.gatewayLogPath).some((entry) => (
    (entry.client_id ?? DEFAULT_GATEWAY_CLIENT_ID) === input.clientId &&
    (entry.over_limit === true || entry.error_code === "CLIENT_USAGE_LIMIT_EXCEEDED") &&
    (windowStart === null || entry.timestamp >= windowStart)
  ));
}
