import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { CONTRACT_VERSION } from "./contract.js";

export const HOSTED_READINESS_VERSION = "atg.hosted-readiness.v1" as const;
export const HOSTED_READINESS_SAFETY_STATEMENT =
  "Hosted readiness is a local planning and configuration aid only. It does not deploy Agent Trust Gate, expose a public service, bill customers, process payments, enable automatic purchase, execute actions, authenticate real-world identities, guarantee legality, or prove compliance.";

export type HostedReadinessCheckStatus =
  | "pass"
  | "partial"
  | "fail"
  | "not_started"
  | "future";
export type HostedReadinessSeverity = "info" | "warning" | "critical";

export interface HostedReadinessCheck {
  id: string;
  label: string;
  status: HostedReadinessCheckStatus;
  severity: HostedReadinessSeverity;
  evidence: string[];
  recommendation: string;
}

export interface HostedReadinessReport {
  [key: string]: unknown;
  contract_version: typeof CONTRACT_VERSION;
  hosted_readiness_version: typeof HOSTED_READINESS_VERSION;
  generated_at: string;
  local_only: true;
  hosted_deployment_enabled: false;
  public_service_enabled: false;
  production_ready: false;
  overall: {
    hosted_readiness_percent: 30;
    status: "not_hosted_preparation_only";
    next_gate: "complete_production_security_controls_before_public_hosting";
  };
  checks: HostedReadinessCheck[];
  required_before_hosting: string[];
  recommended_environment: {
    host: "127.0.0.1";
    port: 8787;
    require_api_key: false;
    clients_file: "./gateway-clients.json";
    log_file: "./gateway-logs/gateway-requests.jsonl";
    public_base_url: null;
    hosted_deployment_enabled: false;
    payment_enabled: false;
    automatic_purchase_enabled: false;
    billing_enabled: false;
    tls_termination: "required_before_public_hosting";
    secrets_storage: "managed_secret_storage_required_before_hosting";
  };
  safety_statement: string;
}

export function createHostedReadinessReport(now = new Date()): HostedReadinessReport {
  return {
    contract_version: CONTRACT_VERSION,
    hosted_readiness_version: HOSTED_READINESS_VERSION,
    generated_at: now.toISOString(),
    local_only: true,
    hosted_deployment_enabled: false,
    public_service_enabled: false,
    production_ready: false,
    overall: {
      hosted_readiness_percent: 30,
      status: "not_hosted_preparation_only",
      next_gate: "complete_production_security_controls_before_public_hosting",
    },
    checks: hostedChecks(),
    required_before_hosting: [
      "production-grade authentication and authorization",
      "managed secure key and secret storage",
      "HTTPS/TLS termination and certificate lifecycle plan",
      "distributed rate limiting and quota enforcement",
      "abuse detection, alerting, and response controls",
      "production logging retention and access policy",
      "privacy, customer data, and retention policy",
      "customer account, tenant isolation, and role model",
      "payment and billing design if commercial charging is introduced",
      "reviewed legal terms, privacy notice, and acceptable use policy",
      "incident response and breach notification plan",
      "deployment rollback and disaster recovery plan",
      "secret rotation and revocation process",
      "isolated staging environment and promotion controls",
      "production metrics, tracing, alerting, and availability objectives",
      "vulnerability, dependency, and supply-chain security review",
    ],
    recommended_environment: {
      host: "127.0.0.1",
      port: 8787,
      require_api_key: false,
      clients_file: "./gateway-clients.json",
      log_file: "./gateway-logs/gateway-requests.jsonl",
      public_base_url: null,
      hosted_deployment_enabled: false,
      payment_enabled: false,
      automatic_purchase_enabled: false,
      billing_enabled: false,
      tls_termination: "required_before_public_hosting",
      secrets_storage: "managed_secret_storage_required_before_hosting",
    },
    safety_statement: HOSTED_READINESS_SAFETY_STATEMENT,
  };
}

export function formatHostedReadinessForConsole(report: HostedReadinessReport): string {
  const blockers = report.checks.filter((check) => check.severity === "critical");
  return [
    "Agent Trust Gate hosted deployment readiness",
    `hosted_readiness_version: ${report.hosted_readiness_version}`,
    `generated_at: ${report.generated_at}`,
    `hosted_readiness_percent: ${report.overall.hosted_readiness_percent}`,
    `status: ${report.overall.status}`,
    `hosted_deployment_enabled: ${report.hosted_deployment_enabled}`,
    `public_service_enabled: ${report.public_service_enabled}`,
    `production_ready: ${report.production_ready}`,
    "",
    "Critical pre-hosting checks:",
    ...blockers.map((check) => `- ${check.id}: ${check.status}`),
    "",
    "Next gate:",
    `- ${report.overall.next_gate}`,
    "",
    report.safety_statement,
  ].join("\n");
}

export function writeHostedReadinessReport(
  outputPath: string,
  report = createHostedReadinessReport(),
): string {
  const resolvedPath = resolve(outputPath);
  mkdirSync(dirname(resolvedPath), { recursive: true });
  writeFileSync(resolvedPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return resolvedPath;
}

function hostedChecks(): HostedReadinessCheck[] {
  return [
    check("local_gateway_default_binding", "Local gateway default binding", "pass", "info", ["Gateway default host is 127.0.0.1."], "Keep localhost as the default in all future deployment work."),
    check("public_binding_disabled_by_default", "Public binding disabled by default", "pass", "info", ["The gateway does not bind to 0.0.0.0 by default."], "Require explicit security review before introducing any public binding option."),
    check("api_key_support_available", "Local API-key support available", "partial", "warning", ["Protected endpoints can require local API keys."], "Replace local development keys with production identity, rotation, revocation, and authorization controls."),
    check("raw_api_keys_not_logged", "Raw API keys are not logged", "pass", "info", ["Gateway request logs omit raw API-key values."], "Verify this property with production telemetry and error handling before hosting."),
    check("client_identity_available", "Local client identity available", "partial", "warning", ["X-ATG-Client-ID supports local attribution."], "Introduce authenticated tenant and workload identities before hosting."),
    check("request_logging_available", "Request logging available", "partial", "warning", ["Local append-only JSONL request logs exist."], "Define durable centralized logging, access controls, redaction, and retention."),
    check("usage_metering_available", "Usage metering available", "partial", "warning", ["Local endpoint and client usage summaries exist."], "Design atomic distributed metering and reconciliation for multiple instances."),
    check("entitlement_signals_available", "Entitlement signals available", "partial", "warning", ["Local allowance and upgrade-required signals exist."], "Connect entitlements to authenticated accounts only after commercial design review."),
    check("openapi_available", "OpenAPI contract available", "pass", "info", ["A tracked OpenAPI 3.1 contract and local discovery endpoint exist."], "Define production API lifecycle, compatibility, and deprecation policies."),
    check("agent_manifest_available", "Agent integration manifest available", "pass", "info", ["Machine-readable local capabilities and tools are published in the repo."], "Plan signed hosted discovery only after production controls exist."),
    check("commercial_readiness_available", "Commercial readiness snapshot available", "pass", "info", ["A deterministic readiness scorecard reports missing commercial capabilities."], "Keep the scorecard conservative and evidence-based."),
    check("security_readiness_available", "Production security readiness available", "pass", "info", ["A deterministic local security readiness report, checklist, and planning documents exist."], "Complete the identified production controls and obtain independent review before hosting."),
    check("production_authentication_missing", "Production authentication missing", "not_started", "critical", ["Only local development API-key matching exists."], "Implement production-grade identity, authentication, authorization, and tenant isolation."),
    check("customer_accounts_missing", "Customer accounts missing", "not_started", "warning", ["No customer or tenant account lifecycle exists."], "Define onboarding, roles, account recovery, offboarding, and isolation."),
    check("payment_processing_missing", "Payment processing missing", "not_started", "warning", ["Payments are explicitly disabled."], "Complete pricing, legal, consent, fraud, and refund design before selecting a processor."),
    check("billing_records_missing", "Billing records missing", "not_started", "warning", ["No invoice or billing ledger exists."], "Design auditable billing records only if commercial charging is introduced."),
    check("production_monitoring_missing", "Production monitoring missing", "not_started", "critical", ["Only local health and log inspection exist."], "Add metrics, tracing, alerting, SLOs, incident response, backup, and disaster recovery plans."),
    check("rate_limiting_missing_or_local_only", "Production rate limiting missing", "not_started", "critical", ["Local client allowances are not network abuse controls."], "Implement distributed rate limiting, request-size controls, timeouts, and denial-of-service protections."),
    check("terms_and_legal_review_missing", "Terms and legal review missing", "not_started", "critical", ["Safety wording avoids unsupported legal and compliance claims."], "Obtain qualified review of terms, privacy, acceptable use, data processing, and commercial claims."),
    check("public_hosting_not_enabled", "Public hosting not enabled", "pass", "info", ["hosted_deployment_enabled and public_service_enabled are false."], "Do not enable public hosting until every critical pre-hosting gate is complete."),
  ];
}

function check(
  id: string,
  label: string,
  status: HostedReadinessCheckStatus,
  severity: HostedReadinessSeverity,
  evidence: string[],
  recommendation: string,
): HostedReadinessCheck {
  return { id, label, status, severity, evidence, recommendation };
}
