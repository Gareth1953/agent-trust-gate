import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export type LocalTenantStatus = "local_placeholder" | "inactive_placeholder";

export interface LocalTenantPlaceholder {
  account_id: string;
  tenant_id: string;
  tenant_name: string;
  tenant_status: LocalTenantStatus;
  plan_code: string;
  billing_status: "not_enabled";
  payment_status: "not_enabled";
  automatic_purchase_enabled: false;
  clients: string[];
}

export interface LocalCustomerTenantsFile {
  tenants: LocalTenantPlaceholder[];
}

export interface LocalCustomerTenantsResult {
  tenants_file_provided: boolean;
  tenants_file_found: boolean;
  tenants_file_path: string | null;
  tenant_count: number;
  tenants: LocalTenantPlaceholder[];
}

export class CustomerTenantsConfigError extends Error {
  readonly code = "INVALID_CUSTOMER_TENANTS_CONFIG";

  constructor(message: string) {
    super(message);
    this.name = "CustomerTenantsConfigError";
  }
}

export function readLocalCustomerTenantsFile(
  tenantsFile?: string,
): LocalCustomerTenantsResult {
  if (tenantsFile === undefined) {
    return {
      tenants_file_provided: false,
      tenants_file_found: false,
      tenants_file_path: null,
      tenant_count: 0,
      tenants: [],
    };
  }

  const resolvedPath = resolve(tenantsFile);
  if (!existsSync(resolvedPath)) {
    throw new CustomerTenantsConfigError(`Local tenants file was not found at "${resolvedPath}".`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(resolvedPath, "utf8")) as unknown;
  } catch (error) {
    throw new CustomerTenantsConfigError(`Unable to read local tenants file: ${errorMessage(error)}`);
  }

  if (!isCustomerTenantsFile(parsed)) {
    throw new CustomerTenantsConfigError(
      "Local tenants file must contain safe placeholder tenant records with disabled billing, payments, and automatic purchase.",
    );
  }

  validateUniqueIds(parsed.tenants);
  return {
    tenants_file_provided: true,
    tenants_file_found: true,
    tenants_file_path: resolvedPath,
    tenant_count: parsed.tenants.length,
    tenants: parsed.tenants,
  };
}

function isCustomerTenantsFile(value: unknown): value is LocalCustomerTenantsFile {
  if (!isRecord(value) || !Array.isArray(value.tenants)) {
    return false;
  }
  return value.tenants.every((tenant) => (
    isRecord(tenant) &&
    nonEmptyString(tenant.account_id) &&
    nonEmptyString(tenant.tenant_id) &&
    nonEmptyString(tenant.tenant_name) &&
    (tenant.tenant_status === "local_placeholder" || tenant.tenant_status === "inactive_placeholder") &&
    nonEmptyString(tenant.plan_code) &&
    tenant.billing_status === "not_enabled" &&
    tenant.payment_status === "not_enabled" &&
    tenant.automatic_purchase_enabled === false &&
    Array.isArray(tenant.clients) &&
    tenant.clients.every(nonEmptyString)
  ));
}

function validateUniqueIds(tenants: LocalTenantPlaceholder[]): void {
  const accountIds = new Set<string>();
  const tenantIds = new Set<string>();
  const clientIds = new Set<string>();
  for (const tenant of tenants) {
    if (accountIds.has(tenant.account_id)) {
      throw new CustomerTenantsConfigError(`Duplicate local account_id: ${tenant.account_id}`);
    }
    if (tenantIds.has(tenant.tenant_id)) {
      throw new CustomerTenantsConfigError(`Duplicate local tenant_id: ${tenant.tenant_id}`);
    }
    accountIds.add(tenant.account_id);
    tenantIds.add(tenant.tenant_id);
    for (const clientId of tenant.clients) {
      if (clientIds.has(clientId)) {
        throw new CustomerTenantsConfigError(`Local client_id is assigned more than once: ${clientId}`);
      }
      clientIds.add(clientId);
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
