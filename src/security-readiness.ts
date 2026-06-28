import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { CONTRACT_VERSION } from "./contract.js";

export const SECURITY_READINESS_VERSION = "atg.security-readiness.v1" as const;
export const SECURITY_READINESS_SAFETY_STATEMENT =
  "Security readiness is a local planning snapshot only. It is not a security certification and does not prove legal, privacy, SOC2, ISO27001, GDPR, payment, or production compliance.";

export type SecurityReadinessCheckStatus =
  | "pass"
  | "partial"
  | "fail"
  | "not_started"
  | "future";
export type SecurityReadinessSeverity = "info" | "warning" | "critical";

export interface SecurityReadinessCheck {
  id: string;
  label: string;
  status: SecurityReadinessCheckStatus;
  severity: SecurityReadinessSeverity;
  evidence: string[];
  recommendation: string;
}

export interface SecurityReadinessReport {
  [key: string]: unknown;
  contract_version: typeof CONTRACT_VERSION;
  security_readiness_version: typeof SECURITY_READINESS_VERSION;
  generated_at: string;
  local_only: true;
  production_security_certified: false;
  public_service_safe: false;
  payment_security_ready: false;
  overall: {
    security_readiness_percent: 40;
    status: "security_preparation_only_not_production_certified";
    next_gate: "complete_production_security_controls_before_public_hosting";
  };
  checks: SecurityReadinessCheck[];
  critical_gaps: string[];
  required_before_public_hosting: string[];
  recommended_security_controls: string[];
  safety_statement: string;
}

export function createSecurityReadinessReport(now = new Date()): SecurityReadinessReport {
  return {
    contract_version: CONTRACT_VERSION,
    security_readiness_version: SECURITY_READINESS_VERSION,
    generated_at: now.toISOString(),
    local_only: true,
    production_security_certified: false,
    public_service_safe: false,
    payment_security_ready: false,
    overall: {
      security_readiness_percent: 40,
      status: "security_preparation_only_not_production_certified",
      next_gate: "complete_production_security_controls_before_public_hosting",
    },
    checks: securityChecks(),
    critical_gaps: [
      "production_authentication_not_implemented",
      "secure_secret_storage_not_implemented",
      "production_rate_limiting_not_implemented",
      "production_abuse_monitoring_not_implemented",
      "production_monitoring_not_implemented",
      "production_incident_response_not_operational",
      "transport_security_not_configured",
      "legal_terms_not_reviewed",
      "payment_security_not_started",
    ],
    required_before_public_hosting: [
      "production-grade authentication and authorization",
      "secure secret storage",
      "API key rotation and revocation process",
      "HTTPS/TLS termination and certificate lifecycle",
      "distributed rate limiting",
      "abuse monitoring and response controls",
      "production monitoring and availability objectives",
      "security alerting and escalation",
      "production log retention and access policy",
      "privacy and customer data retention policy",
      "qualified privacy review",
      "reviewed legal terms and acceptable use policy",
      "incident response and breach notification process",
      "dependency vulnerability and supply-chain review",
      "deployment rollback process",
      "isolated staging environment",
      "backup and recovery plan",
      "payment security review before billing is introduced",
    ],
    recommended_security_controls: [
      "require API key authentication in hosted mode until stronger authenticated identity is implemented",
      "never log raw secrets",
      "hash sensitive identifiers where appropriate",
      "rotate and revoke API keys",
      "enforce per-client rate limits",
      "retain per-client usage quotas",
      "include request IDs on all responses",
      "retain access-controlled audit logs",
      "apply a strict CORS policy if browser access is added",
      "use HTTPS only for hosted operation",
      "record structured security events",
      "protect administrative endpoints",
      "use a least-privilege deployment environment",
      "run a dependency audit workflow",
      "publish a vulnerability disclosure contact when public",
      "maintain and exercise an incident response runbook",
    ],
    safety_statement: SECURITY_READINESS_SAFETY_STATEMENT,
  };
}

export function formatSecurityReadinessForConsole(report: SecurityReadinessReport): string {
  const criticalChecks = report.checks.filter((check) => check.severity === "critical");
  return [
    "Agent Trust Gate production security readiness",
    `security_readiness_version: ${report.security_readiness_version}`,
    `generated_at: ${report.generated_at}`,
    `security_readiness_percent: ${report.overall.security_readiness_percent}`,
    `status: ${report.overall.status}`,
    `production_security_certified: ${report.production_security_certified}`,
    `public_service_safe: ${report.public_service_safe}`,
    `payment_security_ready: ${report.payment_security_ready}`,
    "",
    "Critical security checks:",
    ...criticalChecks.map((check) => `- ${check.id}: ${check.status}`),
    "",
    "Next gate:",
    `- ${report.overall.next_gate}`,
    "",
    report.safety_statement,
  ].join("\n");
}

export function writeSecurityReadinessReport(
  outputPath: string,
  report = createSecurityReadinessReport(),
): string {
  const resolvedPath = resolve(outputPath);
  mkdirSync(dirname(resolvedPath), { recursive: true });
  writeFileSync(resolvedPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return resolvedPath;
}

function securityChecks(): SecurityReadinessCheck[] {
  return [
    check("local_only_default_binding", "Local-only default binding", "pass", "info", ["The gateway defaults to 127.0.0.1 and does not bind publicly."], "Keep localhost as the default until a reviewed production architecture exists."),
    check("api_key_support_available", "Local API-key support available", "partial", "warning", ["Protected endpoints can require local development API keys."], "Replace local key matching with production identity, authorization, rotation, and revocation controls."),
    check("raw_api_keys_not_logged", "Raw API keys are not logged", "pass", "info", ["Gateway request logs omit X-ATG-API-Key values."], "Verify redaction across production telemetry, traces, and error reporting."),
    check("client_identity_available", "Local client identity available", "partial", "warning", ["X-ATG-Client-ID supports local attribution."], "Use authenticated tenant and workload identities before hosting."),
    check("request_id_available", "Request IDs available", "pass", "info", ["Gateway JSON responses and request logs include request IDs."], "Propagate request IDs through future hosted proxies and telemetry."),
    check("request_logging_available", "Request logging available", "partial", "warning", ["Local append-only JSONL request logs exist."], "Define centralized access controls, integrity, redaction, retention, and deletion."),
    check("entitlement_signals_available", "Entitlement signals available", "partial", "warning", ["Local allowance and over-limit signals exist."], "Bind production entitlements to authenticated accounts and atomic metering."),
    check("admin_summary_available", "Local admin summary available", "partial", "warning", ["Local usage and client summaries are inspectable."], "Protect production administrative surfaces with role-based authorization and audit logging."),
    check("hosted_readiness_available", "Hosted readiness available", "pass", "info", ["A deterministic hosted deployment readiness pack exists."], "Keep hosted and security gates synchronized as controls are implemented."),
    check("openapi_available", "OpenAPI contract available", "pass", "info", ["A tracked OpenAPI 3.1 contract documents local gateway behavior."], "Add a reviewed production API security and lifecycle policy before publication."),
    check("agent_manifest_available", "Agent manifest available", "pass", "info", ["Machine-readable local capability and safety metadata exists."], "Consider signed discovery only after production trust controls exist."),
    check("production_authentication_missing", "Production authentication missing", "not_started", "critical", ["Local API keys do not authenticate real-world identities or tenants."], "Implement production-grade authentication, authorization, tenant isolation, and lifecycle controls."),
    check("secret_storage_missing", "Managed secret storage missing", "not_started", "critical", ["Local client keys are stored in an ignored JSON file."], "Use managed secret storage with scoped access, audit, rotation, and revocation."),
    check("key_rotation_missing", "Key rotation process missing", "not_started", "critical", ["No production key rotation or revocation workflow exists."], "Define rotation intervals, emergency revocation, overlap, and client migration procedures."),
    check("rate_limiting_local_only", "Rate limiting is local only", "partial", "warning", ["Configured clients can use deterministic per-server runtime request limits with 429 responses."], "Replace local counters with distributed per-client and global rate limits, burst controls, and request-size limits before hosting."),
    check("abuse_prevention_local_signals", "Abuse prevention has local signals only", "partial", "warning", ["Local status reports expose suspicious-volume, repeated-error, unknown-client, and over-limit signals."], "Add production telemetry, anomaly detection, containment, review, and appeal procedures before hosting."),
    check("production_monitoring_local_signals", "Production monitoring has local signals only", "partial", "warning", ["Local operational health, runtime, request-log, error, unauthorized, and rate-limit summaries exist."], "Add hosted metrics, tracing, availability objectives, protected dashboards, and on-call ownership."),
    check("alerting_missing", "Security alerting missing", "not_started", "critical", ["No production security or availability alerts are configured."], "Define actionable alerts, severity levels, escalation paths, and test schedules."),
    check("incident_response_partial_local", "Incident response is partial and local", "partial", "warning", ["A local readiness report, severity model, containment and recovery guidance, and incident record export exist."], "Assign owners and exercise detection, containment, recovery, communication, and review before hosting."),
    check("data_retention_policy_missing", "Data retention policy missing", "not_started", "critical", ["No approved retention or deletion schedule exists for hosted logs or customer data."], "Define purpose, access, retention, deletion, legal hold, and customer request handling."),
    check("privacy_review_missing", "Privacy review missing", "not_started", "critical", ["No qualified hosted privacy review has occurred."], "Review data flows, minimization, lawful basis, processors, regions, and customer commitments."),
    check("legal_terms_missing", "Legal terms missing", "not_started", "critical", ["No reviewed hosted terms or acceptable use policy exists."], "Obtain qualified review before making the service public or commercial."),
    check("dependency_vulnerability_review_required", "Dependency vulnerability review required", "not_started", "critical", ["Tests and lockfiles do not constitute a production vulnerability program."], "Establish dependency inventory, advisory monitoring, patch SLAs, and supply-chain review."),
    check("transport_security_required", "Transport security required", "not_started", "critical", ["The local gateway uses loopback HTTP and has no TLS termination."], "Require HTTPS/TLS, certificate lifecycle management, secure proxy headers, and downgrade prevention."),
    check("public_hosting_not_enabled", "Public hosting not enabled", "pass", "info", ["The gateway remains localhost-only and no public service is enabled."], "Keep public hosting disabled until every critical production security gate is complete."),
    check("payment_security_not_started", "Payment security not started", "future", "critical", ["Payment, billing, and automatic purchase are disabled."], "Complete payment threat modeling, data-scope reduction, legal review, and processor due diligence before billing."),
  ];
}

function check(
  id: string,
  label: string,
  status: SecurityReadinessCheckStatus,
  severity: SecurityReadinessSeverity,
  evidence: string[],
  recommendation: string,
): SecurityReadinessCheck {
  return { id, label, status, severity, evidence, recommendation };
}
