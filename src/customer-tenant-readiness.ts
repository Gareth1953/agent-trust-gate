import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { CONTRACT_VERSION } from "./contract.js";
import {
  readLocalCustomerTenantsFile,
  type LocalCustomerTenantsResult,
} from "./customer-tenants.js";

export const CUSTOMER_TENANT_READINESS_VERSION = "atg.customer-tenant-readiness.v1" as const;
export const CUSTOMER_TENANT_READINESS_SAFETY_STATEMENT =
  "Customer and tenant readiness is a local planning snapshot only. It does not create real customer accounts, collect personal data, bill customers, process payments, enable automatic purchase, expose a public service, or execute actions.";

export type CustomerTenantReadinessStatus = "pass" | "partial" | "fail" | "not_started" | "future";
export type CustomerTenantReadinessSeverity = "info" | "warning" | "critical";

export interface CustomerTenantReadinessCheck {
  id: string;
  label: string;
  status: CustomerTenantReadinessStatus;
  severity: CustomerTenantReadinessSeverity;
  evidence: string[];
  recommendation: string;
}

export interface CustomerTenantReadinessReport {
  [key: string]: unknown;
  contract_version: typeof CONTRACT_VERSION;
  customer_tenant_readiness_version: typeof CUSTOMER_TENANT_READINESS_VERSION;
  generated_at: string;
  local_only: true;
  production_customer_accounts_enabled: false;
  real_customer_data_enabled: false;
  billing_enabled: false;
  payment_processing_enabled: false;
  automatic_purchase_enabled: false;
  overall: {
    customer_tenant_readiness_percent: 30;
    status: "local_customer_tenant_planning_only";
    next_gate: "define_production_customer_account_and_billing_model_before_payments";
  };
  account_model: {
    account_id_format: "local-account-placeholder";
    supports_tenants: true;
    supports_client_ownership: true;
    supports_plan_status: true;
    supports_usage_ownership: true;
    production_login_enabled: false;
    personal_data_collection_enabled: false;
    real_customer_records_enabled: false;
  };
  tenant_model: {
    concepts: string[];
    production_tenant_records_enabled: false;
    allowed_local_billing_status: "not_enabled";
    allowed_local_payment_status: "not_enabled";
  };
  client_mapping_model: {
    concepts: string[];
    production_mapping_enabled: false;
    local_only_mapping_available: true;
  };
  local_tenant_config: LocalCustomerTenantsResult;
  checks: CustomerTenantReadinessCheck[];
  required_before_billing: string[];
  recommended_customer_controls: string[];
  safety_statement: string;
}

export function createCustomerTenantReadinessReport(options: {
  now?: Date;
  tenantsFile?: string;
} = {}): CustomerTenantReadinessReport {
  const localTenantConfig = readLocalCustomerTenantsFile(options.tenantsFile);
  return {
    contract_version: CONTRACT_VERSION,
    customer_tenant_readiness_version: CUSTOMER_TENANT_READINESS_VERSION,
    generated_at: (options.now ?? new Date()).toISOString(),
    local_only: true,
    production_customer_accounts_enabled: false,
    real_customer_data_enabled: false,
    billing_enabled: false,
    payment_processing_enabled: false,
    automatic_purchase_enabled: false,
    overall: {
      customer_tenant_readiness_percent: 30,
      status: "local_customer_tenant_planning_only",
      next_gate: "define_production_customer_account_and_billing_model_before_payments",
    },
    account_model: {
      account_id_format: "local-account-placeholder",
      supports_tenants: true,
      supports_client_ownership: true,
      supports_plan_status: true,
      supports_usage_ownership: true,
      production_login_enabled: false,
      personal_data_collection_enabled: false,
      real_customer_records_enabled: false,
    },
    tenant_model: {
      concepts: [
        "tenant_id",
        "account_id",
        "tenant_name",
        "tenant_status",
        "plan_code",
        "billing_status",
        "payment_status",
        "created_at",
        "clients",
      ],
      production_tenant_records_enabled: false,
      allowed_local_billing_status: "not_enabled",
      allowed_local_payment_status: "not_enabled",
    },
    client_mapping_model: {
      concepts: [
        "client_id",
        "tenant_id",
        "account_id",
        "plan_code",
        "entitlement_status",
        "usage_owner",
        "billing_owner",
      ],
      production_mapping_enabled: false,
      local_only_mapping_available: true,
    },
    local_tenant_config: localTenantConfig,
    checks: readinessChecks(localTenantConfig),
    required_before_billing: [
      "production-grade authentication and authorization",
      "secure customer and tenant database",
      "tenant isolation review",
      "privacy policy and data-flow review",
      "approved data retention, deletion, and export policy",
      "reviewed terms of service and acceptable use policy",
      "approved billing terms and pricing model",
      "payment provider security and legal review",
      "customer support and account recovery process",
      "customer incident and notification process",
      "auditable billing ledger and reconciliation controls",
      "payment incident procedure before billing is enabled",
    ],
    recommended_customer_controls: [
      "opaque non-personal account and tenant identifiers",
      "least-privilege tenant authorization",
      "one explicit usage owner per client",
      "one explicit billing owner per tenant",
      "auditable client-to-tenant mapping changes",
      "API key lifecycle separate from account identity",
      "customer data minimization",
      "customer data export and deletion process",
      "account suspension and recovery controls",
      "billing status separated from payment status",
      "human review before enabling commercial charging",
      "automatic purchase disabled until governed payment controls exist",
    ],
    safety_statement: CUSTOMER_TENANT_READINESS_SAFETY_STATEMENT,
  };
}

export function formatCustomerTenantReadinessForConsole(
  report: CustomerTenantReadinessReport,
): string {
  return [
    "Agent Trust Gate customer account and tenant readiness",
    `customer_tenant_readiness_version: ${report.customer_tenant_readiness_version}`,
    `generated_at: ${report.generated_at}`,
    `customer_tenant_readiness_percent: ${report.overall.customer_tenant_readiness_percent}`,
    `status: ${report.overall.status}`,
    `production_customer_accounts_enabled: ${report.production_customer_accounts_enabled}`,
    `real_customer_data_enabled: ${report.real_customer_data_enabled}`,
    `billing_enabled: ${report.billing_enabled}`,
    `payment_processing_enabled: ${report.payment_processing_enabled}`,
    `automatic_purchase_enabled: ${report.automatic_purchase_enabled}`,
    `local_placeholder_tenants: ${report.local_tenant_config.tenant_count}`,
    "",
    `next_gate: ${report.overall.next_gate}`,
    "",
    report.safety_statement,
  ].join("\n");
}

export function writeCustomerTenantReadinessReport(
  outputPath: string,
  report = createCustomerTenantReadinessReport(),
): string {
  const resolvedPath = resolve(outputPath);
  mkdirSync(dirname(resolvedPath), { recursive: true });
  writeFileSync(resolvedPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return resolvedPath;
}

function readinessChecks(config: LocalCustomerTenantsResult): CustomerTenantReadinessCheck[] {
  return [
    check("local_account_model_available", "Local account model available", "partial", "warning", ["A deterministic non-personal account and ownership model is documented."], "Implement independently reviewed production identity, storage, and lifecycle controls."),
    check("tenant_model_available", "Tenant model available", "partial", "warning", ["Tenant, account, plan, billing, payment, and client concepts are machine-readable."], "Define production tenant isolation and authorization boundaries."),
    check("client_ownership_model_available", "Client ownership model available", "partial", "warning", ["Future client-to-account, tenant, usage-owner, and billing-owner relationships are defined."], "Implement auditable mapping changes only after production account controls exist."),
    check("local_placeholder_config_available", "Local placeholder config support available", config.tenants_file_found ? "pass" : "partial", "info", [config.tenants_file_found ? `${config.tenant_count} safe local placeholder tenant record(s) loaded.` : "An optional safe local placeholder file can be inspected."], "Never place real customer data or API keys in example tenant configuration."),
    check("production_customer_accounts_missing", "Production customer accounts missing", "not_started", "critical", ["No real customer records, signup, login, or account lifecycle exists."], "Design authentication, authorization, recovery, suspension, deletion, and support before launch."),
    check("production_login_missing", "Production login missing", "not_started", "critical", ["No password, login, signup, session, or external identity provider exists."], "Select a production identity architecture and complete threat, privacy, and recovery reviews."),
    check("personal_data_collection_disabled", "Personal data collection disabled", "pass", "info", ["The local model requires no names, email addresses, passwords, or payment data."], "Keep data collection minimized and obtain privacy review before any production collection."),
    check("secure_customer_database_missing", "Secure customer database missing", "not_started", "critical", ["No account or tenant database exists."], "Design encryption, access control, isolation, backup, retention, deletion, and audit controls."),
    check("billing_relationship_missing", "Billing relationship missing", "not_started", "critical", ["Billing owners and statuses are planning concepts only; billing is disabled."], "Approve pricing, billing terms, ledger, tax, reconciliation, refund, and support processes."),
    check("billing_payment_readiness_available", "Billing and payment readiness available", "partial", "warning", ["A price-free placeholder plan catalogue and disabled billing, payment, and machine-purchase model exist."], "Complete provider, legal, tax, security, ledger, monitoring, and customer-control gates before charging."),
    check("payment_processing_missing", "Payment processing missing", "not_started", "critical", ["Payment processing and automatic purchase are disabled."], "Complete legal, security, consent, fraud, and processor review before payments."),
    check("customer_support_process_missing", "Customer support process missing", "not_started", "warning", ["No production onboarding, recovery, dispute, or support workflow exists."], "Define owned support and escalation processes before customer launch."),
    check("customer_notification_process_missing", "Customer notification process missing", "not_started", "critical", ["No automated or staffed customer notification process exists."], "Approve legal and operational notification procedures before public service."),
    check("public_hosting_not_enabled", "Public hosting not enabled", "pass", "info", ["The gateway remains local-only and localhost-bound by default."], "Do not enable public hosting until account, security, privacy, and operational gates are complete."),
  ];
}

function check(
  id: string,
  label: string,
  status: CustomerTenantReadinessStatus,
  severity: CustomerTenantReadinessSeverity,
  evidence: string[],
  recommendation: string,
): CustomerTenantReadinessCheck {
  return { id, label, status, severity, evidence, recommendation };
}
