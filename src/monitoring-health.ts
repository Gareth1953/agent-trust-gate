import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { CONTRACT_VERSION } from "./contract.js";
import {
  auditGatewayUsage,
  DEFAULT_GATEWAY_REQUEST_LOG_PATH,
} from "./gateway-logging.js";

export const MONITORING_HEALTH_VERSION = "atg.monitoring-health.v1" as const;
export const MONITORING_HEALTH_SAFETY_STATEMENT =
  "Monitoring health is a local planning and operational signal only. It does not provide production monitoring, external alerting, public uptime guarantees, payment processing, or action execution.";

export type MonitoringHealthCheckStatus =
  | "pass"
  | "partial"
  | "fail"
  | "not_started"
  | "future";
export type MonitoringHealthSeverity = "info" | "warning" | "critical";

export interface MonitoringHealthCheck {
  id: string;
  label: string;
  status: MonitoringHealthCheckStatus;
  severity: MonitoringHealthSeverity;
  evidence: string[];
  recommendation: string;
}

export interface MonitoringHealthReport {
  [key: string]: unknown;
  contract_version: typeof CONTRACT_VERSION;
  monitoring_health_version: typeof MONITORING_HEALTH_VERSION;
  generated_at: string;
  local_only: true;
  production_monitoring_enabled: false;
  external_alerting_enabled: false;
  public_uptime_sla_enabled: false;
  overall: {
    monitoring_readiness_percent: 33;
    status: "local_monitoring_signals_only";
    next_gate: "add_production_monitoring_and_alerting_before_public_hosting";
  };
  runtime: {
    scope: "current_gateway_process" | "not_available";
    uptime_available: boolean;
    started_at: string | null;
    uptime_seconds: number | null;
  };
  health: {
    gateway_health_endpoint_available: true;
    request_logging_available: true;
    request_id_available: true;
    usage_metering_available: true;
    rate_limit_signals_available: true;
    security_readiness_available: true;
    hosted_readiness_available: true;
  };
  log_health: {
    log_file_found: boolean;
    log_file_path: string;
    total_logged_requests: number;
    error_requests: number;
    rate_limited_requests: number;
    unauthorized_requests: number;
    malformed_log_lines: number;
    first_request_at: string | null;
    last_request_at: string | null;
  };
  checks: MonitoringHealthCheck[];
  required_before_public_hosting: string[];
  recommended_monitoring_controls: string[];
  safety_statement: string;
}

export interface MonitoringHealthOptions {
  now?: Date;
  gatewayLogPath?: string;
  runtimeStartedAt?: Date;
}

export function createMonitoringHealthReport(
  options: MonitoringHealthOptions = {},
): MonitoringHealthReport {
  const now = options.now ?? new Date();
  const gatewayLogPath = options.gatewayLogPath ?? DEFAULT_GATEWAY_REQUEST_LOG_PATH;
  const usage = auditGatewayUsage(gatewayLogPath);
  const runtimeStartedAt = options.runtimeStartedAt;
  const uptimeSeconds = runtimeStartedAt === undefined
    ? null
    : Math.max(0, Math.floor((now.getTime() - runtimeStartedAt.getTime()) / 1000));

  return {
    contract_version: CONTRACT_VERSION,
    monitoring_health_version: MONITORING_HEALTH_VERSION,
    generated_at: now.toISOString(),
    local_only: true,
    production_monitoring_enabled: false,
    external_alerting_enabled: false,
    public_uptime_sla_enabled: false,
    overall: {
      monitoring_readiness_percent: 33,
      status: "local_monitoring_signals_only",
      next_gate: "add_production_monitoring_and_alerting_before_public_hosting",
    },
    runtime: {
      scope: runtimeStartedAt === undefined ? "not_available" : "current_gateway_process",
      uptime_available: runtimeStartedAt !== undefined,
      started_at: runtimeStartedAt?.toISOString() ?? null,
      uptime_seconds: uptimeSeconds,
    },
    health: {
      gateway_health_endpoint_available: true,
      request_logging_available: true,
      request_id_available: true,
      usage_metering_available: true,
      rate_limit_signals_available: true,
      security_readiness_available: true,
      hosted_readiness_available: true,
    },
    log_health: {
      log_file_found: existsSync(gatewayLogPath),
      log_file_path: gatewayLogPath,
      total_logged_requests: usage.total_requests,
      error_requests: usage.error_requests,
      rate_limited_requests: usage.error_code_counts.ATG_RATE_LIMIT_EXCEEDED ?? 0,
      unauthorized_requests: usage.unauthorized_requests,
      malformed_log_lines: usage.malformed_log_lines_count,
      first_request_at: usage.first_request_at,
      last_request_at: usage.last_request_at,
    },
    checks: monitoringChecks(),
    required_before_public_hosting: [
      "production uptime monitoring",
      "external alerting",
      "error-rate monitoring",
      "rate-limit monitoring",
      "abuse-event monitoring",
      "authentication failure monitoring",
      "API latency monitoring",
      "approved log retention policy",
      "operational incident response workflow",
      "backup and recovery monitoring",
      "deployment health checks",
      "protected production dashboard",
      "payment and billing monitoring before billing is enabled",
    ],
    recommended_monitoring_controls: [
      "request IDs on all responses",
      "structured JSON logs",
      "per-endpoint request counts",
      "per-client error counts",
      "per-client rate-limit counts",
      "unauthorized request counts",
      "over-limit request counts",
      "alerting on high error rate",
      "alerting on repeated unauthorized requests",
      "alerting on rate-limit spikes",
      "uptime checks for hosted mode",
      "latency tracking for hosted mode",
      "safe log retention policy",
      "admin dashboard protection",
      "tested incident response runbook",
    ],
    safety_statement: MONITORING_HEALTH_SAFETY_STATEMENT,
  };
}

export function formatMonitoringHealthForConsole(report: MonitoringHealthReport): string {
  return [
    "Agent Trust Gate local monitoring health",
    `monitoring_health_version: ${report.monitoring_health_version}`,
    `generated_at: ${report.generated_at}`,
    `monitoring_readiness_percent: ${report.overall.monitoring_readiness_percent}`,
    `status: ${report.overall.status}`,
    `production_monitoring_enabled: ${report.production_monitoring_enabled}`,
    `external_alerting_enabled: ${report.external_alerting_enabled}`,
    `public_uptime_sla_enabled: ${report.public_uptime_sla_enabled}`,
    "",
    "Runtime:",
    `- scope: ${report.runtime.scope}`,
    `- uptime_seconds: ${report.runtime.uptime_seconds ?? "not_available"}`,
    "",
    "Log health:",
    `- log_file_found: ${report.log_health.log_file_found}`,
    `- total_logged_requests: ${report.log_health.total_logged_requests}`,
    `- error_requests: ${report.log_health.error_requests}`,
    `- rate_limited_requests: ${report.log_health.rate_limited_requests}`,
    `- unauthorized_requests: ${report.log_health.unauthorized_requests}`,
    `- malformed_log_lines: ${report.log_health.malformed_log_lines}`,
    "",
    `next_gate: ${report.overall.next_gate}`,
    "",
    report.safety_statement,
  ].join("\n");
}

export function writeMonitoringHealthReport(
  outputPath: string,
  report = createMonitoringHealthReport(),
): string {
  const resolvedPath = resolve(outputPath);
  mkdirSync(dirname(resolvedPath), { recursive: true });
  writeFileSync(resolvedPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return resolvedPath;
}

function monitoringChecks(): MonitoringHealthCheck[] {
  return [
    check("local_health_endpoint_available", "Local health endpoint available", "pass", "info", ["GET /v1/health returns deterministic local gateway status."], "Keep the health contract stable and separate liveness from future readiness checks."),
    check("request_ids_available", "Request IDs available", "pass", "info", ["Gateway responses and local logs include request IDs."], "Propagate request IDs through every future proxy and telemetry pipeline."),
    check("request_logging_available", "Request logging available", "partial", "warning", ["Local append-only JSONL request logging and malformed-line counting exist."], "Add protected centralized logging, integrity controls, retention, and deletion before hosting."),
    check("usage_metering_available", "Usage metering available", "partial", "warning", ["Local endpoint, outcome, client, auth, and limit counts are available."], "Implement durable multi-instance metrics and reconciliation before hosting."),
    check("entitlement_status_available", "Entitlement status available", "partial", "warning", ["Local usage and entitlement status can be inspected."], "Bind hosted entitlements to authenticated customer accounts and monitored billing controls later."),
    check("rate_limit_signals_available", "Rate-limit signals available", "partial", "warning", ["Local runtime 429 events and audit counters are available."], "Monitor distributed limits and abuse signals across hosted instances."),
    check("admin_summary_available", "Admin summary available", "partial", "warning", ["A local operator summary reads usage logs and client configuration."], "Protect production dashboards with role-based access and security audit logs."),
    check("hosted_readiness_available", "Hosted readiness available", "pass", "info", ["A deterministic hosted readiness report identifies deployment blockers."], "Keep operational gates synchronized with deployment architecture."),
    check("security_readiness_available", "Security readiness available", "pass", "info", ["A deterministic security readiness report identifies control gaps."], "Track evidence as production controls are implemented and independently reviewed."),
    check("commercial_readiness_available", "Commercial readiness available", "pass", "info", ["Commercial target gaps and scores are reported locally."], "Keep readiness scoring conservative and evidence-based."),
    check("local_log_audit_available", "Local log audit available", "partial", "warning", ["Local usage, errors, unauthorized requests, malformed lines, and rate-limit events can be summarized."], "Define production metric ownership, retention, integrity, and privacy controls."),
    check("production_monitoring_local_signals", "Production monitoring has local signals only", "partial", "warning", ["Local health, logs, request IDs, usage, auth, and rate-limit summaries exist."], "Add hosted uptime, latency, error-rate, saturation, dependency, and security-event monitoring."),
    check("external_alerting_missing", "External alerting missing", "not_started", "critical", ["No email, SMS, chat, paging, or external alert integration exists."], "Define alert ownership, severity, escalation, deduplication, and tested delivery before hosting."),
    check("uptime_sla_missing", "Public uptime SLA missing", "not_started", "critical", ["No public service, external probe, availability objective, or uptime commitment exists."], "Define measurable service objectives before considering any contractual SLA."),
    check("log_retention_policy_missing", "Log retention policy missing", "not_started", "critical", ["Local logs have no approved production retention or deletion schedule."], "Approve purpose, access, retention, deletion, legal hold, and customer-data handling."),
    check("incident_response_partial_local", "Incident response is partial and local", "partial", "warning", ["A local severity model, readiness report, containment and recovery guidance, and incident record export exist."], "Assign owners and exercise detection, triage, containment, recovery, communication, and review before hosting."),
    check("production_dashboard_missing", "Production dashboard missing", "not_started", "warning", ["No hosted operations dashboard exists."], "Build a protected dashboard only after metric definitions and access controls are approved."),
    check("backup_recovery_monitoring_missing", "Backup and recovery monitoring missing", "not_started", "critical", ["No hosted data store, backup verification, or recovery telemetry exists."], "Define backup scope, restore objectives, test frequency, alerts, and evidence before hosting."),
    check("payment_monitoring_not_started", "Payment monitoring not started", "future", "warning", ["Payments, billing, and automatic purchase are disabled."], "Design transaction, fraud, reconciliation, refund, and processor monitoring before billing."),
    check("public_hosting_not_enabled", "Public hosting not enabled", "pass", "info", ["The gateway remains bound to localhost by default."], "Do not expose a public service until critical monitoring and security controls are complete."),
  ];
}

function check(
  id: string,
  label: string,
  status: MonitoringHealthCheckStatus,
  severity: MonitoringHealthSeverity,
  evidence: string[],
  recommendation: string,
): MonitoringHealthCheck {
  return { id, label, status, severity, evidence, recommendation };
}
