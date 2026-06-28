import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { CONTRACT_VERSION } from "./contract.js";

export const INCIDENT_RESPONSE_VERSION = "atg.incident-response.v1" as const;
export const INCIDENT_RECORD_VERSION = "atg.incident-record.v1" as const;
export const INCIDENT_RESPONSE_SAFETY_STATEMENT =
  "Incident response readiness is a local planning snapshot only. It does not provide production incident response, external alerting, customer notification automation, legal compliance, security certification, payment processing, or action execution.";
export const INCIDENT_RECORD_SAFETY_STATEMENT =
  "This is a local incident record template only. It does not notify customers, file legal reports, process payments, or execute actions.";

export type IncidentReadinessStatus = "pass" | "partial" | "fail" | "not_started" | "future";
export type IncidentReadinessSeverity = "info" | "warning" | "critical";

export interface IncidentSeverityDefinition {
  id: "sev0_critical" | "sev1_high" | "sev2_medium" | "sev3_low";
  label: string;
  example_conditions: string[];
  recommended_response: string;
  escalation_required: boolean;
}

export interface IncidentReadinessCheck {
  id: string;
  label: string;
  status: IncidentReadinessStatus;
  severity: IncidentReadinessSeverity;
  evidence: string[];
  recommendation: string;
}

export interface IncidentResponseReadinessReport {
  [key: string]: unknown;
  contract_version: typeof CONTRACT_VERSION;
  incident_response_version: typeof INCIDENT_RESPONSE_VERSION;
  generated_at: string;
  local_only: true;
  production_incident_response_enabled: false;
  external_alerting_enabled: false;
  customer_notification_automation_enabled: false;
  overall: {
    incident_response_readiness_percent: 30;
    status: "local_incident_response_planning_only";
    next_gate: "define_production_incident_process_before_public_hosting";
  };
  severity_model: IncidentSeverityDefinition[];
  checks: IncidentReadinessCheck[];
  containment_steps: string[];
  recovery_steps: string[];
  required_before_public_hosting: string[];
  recommended_operational_controls: string[];
  safety_statement: string;
}

export interface IncidentRecordTemplate {
  incident_record_version: typeof INCIDENT_RECORD_VERSION;
  created_at: string;
  local_only: true;
  incident_id: "local-incident-placeholder";
  severity: "sev2_medium";
  status: "draft";
  summary: string;
  timeline: unknown[];
  affected_clients: string[];
  affected_endpoints: string[];
  request_ids: string[];
  suspected_cause: string;
  containment_actions: string[];
  recovery_actions: string[];
  evidence_links: string[];
  lessons_learned: string;
  safety_statement: string;
}

export function createIncidentResponseReadinessReport(
  now = new Date(),
): IncidentResponseReadinessReport {
  return {
    contract_version: CONTRACT_VERSION,
    incident_response_version: INCIDENT_RESPONSE_VERSION,
    generated_at: now.toISOString(),
    local_only: true,
    production_incident_response_enabled: false,
    external_alerting_enabled: false,
    customer_notification_automation_enabled: false,
    overall: {
      incident_response_readiness_percent: 30,
      status: "local_incident_response_planning_only",
      next_gate: "define_production_incident_process_before_public_hosting",
    },
    severity_model: severityModel(),
    checks: readinessChecks(),
    containment_steps: [
      "stop public exposure if hosted in future",
      "require API keys",
      "rotate suspected exposed keys",
      "disable the affected client through an approved local process",
      "preserve logs and request IDs",
      "pause risky endpoints through an approved operational process",
      "review rate-limit and unauthorized request events",
      "generate an evidence bundle if relevant",
      "avoid deleting logs before review",
      "document the incident timeline",
    ],
    recovery_steps: [
      "confirm the issue is contained",
      "restore known-good configuration",
      "rerun tests",
      "verify local gateway health",
      "verify OpenAPI and agent manifest endpoints",
      "verify entitlement, rate-limit, and monitoring endpoints",
      "review preserved logs and request IDs",
      "update the incident record",
      "document lessons learned",
      "update readiness gaps",
      "do not re-enable hosted or public mode without review",
    ],
    required_before_public_hosting: [
      "named incident owner",
      "approved incident response runbook",
      "tested escalation process",
      "external alerting",
      "approved log retention policy",
      "tested key rotation procedure",
      "tested backup and recovery procedure",
      "approved customer communication template",
      "legal review process",
      "security review process",
      "post-incident review process",
      "production monitoring integration",
      "payment incident procedure before billing is enabled",
    ],
    recommended_operational_controls: [
      "request IDs on all responses",
      "structured incident records",
      "immutable log retention where appropriate",
      "key rotation after suspected exposure",
      "client suspension mechanism",
      "incident timeline record",
      "severity classification",
      "post-incident review",
      "rollback checklist",
      "staged recovery",
      "monitoring and alerting integration before hosted mode",
      "customer notification process before public commercial launch",
    ],
    safety_statement: INCIDENT_RESPONSE_SAFETY_STATEMENT,
  };
}

export function createIncidentRecordTemplate(now = new Date()): IncidentRecordTemplate {
  return {
    incident_record_version: INCIDENT_RECORD_VERSION,
    created_at: now.toISOString(),
    local_only: true,
    incident_id: "local-incident-placeholder",
    severity: "sev2_medium",
    status: "draft",
    summary: "",
    timeline: [],
    affected_clients: [],
    affected_endpoints: [],
    request_ids: [],
    suspected_cause: "",
    containment_actions: [],
    recovery_actions: [],
    evidence_links: [],
    lessons_learned: "",
    safety_statement: INCIDENT_RECORD_SAFETY_STATEMENT,
  };
}

export function formatIncidentResponseReadinessForConsole(
  report: IncidentResponseReadinessReport,
): string {
  return [
    "Agent Trust Gate incident response and operational recovery readiness",
    `incident_response_version: ${report.incident_response_version}`,
    `generated_at: ${report.generated_at}`,
    `incident_response_readiness_percent: ${report.overall.incident_response_readiness_percent}`,
    `status: ${report.overall.status}`,
    `production_incident_response_enabled: ${report.production_incident_response_enabled}`,
    `external_alerting_enabled: ${report.external_alerting_enabled}`,
    `customer_notification_automation_enabled: ${report.customer_notification_automation_enabled}`,
    "",
    "Severity model:",
    ...report.severity_model.map((severity) => `- ${severity.id}: ${severity.label}`),
    "",
    `next_gate: ${report.overall.next_gate}`,
    "",
    report.safety_statement,
  ].join("\n");
}

export function formatIncidentRecordTemplateForConsole(template: IncidentRecordTemplate): string {
  return [
    "Agent Trust Gate local incident record template",
    `incident_record_version: ${template.incident_record_version}`,
    `created_at: ${template.created_at}`,
    `incident_id: ${template.incident_id}`,
    `severity: ${template.severity}`,
    `status: ${template.status}`,
    "",
    template.safety_statement,
  ].join("\n");
}

export function writeIncidentResponseReadinessReport(
  outputPath: string,
  report = createIncidentResponseReadinessReport(),
): string {
  return writeJson(outputPath, report);
}

export function writeIncidentRecordTemplate(
  outputPath: string,
  template = createIncidentRecordTemplate(),
): string {
  return writeJson(outputPath, template);
}

function writeJson(outputPath: string, value: unknown): string {
  const resolvedPath = resolve(outputPath);
  mkdirSync(dirname(resolvedPath), { recursive: true });
  writeFileSync(resolvedPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  return resolvedPath;
}

function severityModel(): IncidentSeverityDefinition[] {
  return [
    {
      id: "sev0_critical",
      label: "Critical incident",
      example_conditions: [
        "future hosted service unavailable for all clients",
        "confirmed widespread key exposure",
        "future payment integrity incident after payments are enabled",
      ],
      recommended_response: "Immediately contain exposure, preserve evidence, and escalate to the named incident owner.",
      escalation_required: true,
    },
    {
      id: "sev1_high",
      label: "High-severity incident",
      example_conditions: [
        "suspected API key exposure",
        "repeated unauthorized requests affecting a client",
        "sustained rate-limit spike",
      ],
      recommended_response: "Begin urgent triage, restrict affected access, preserve logs, and escalate.",
      escalation_required: true,
    },
    {
      id: "sev2_medium",
      label: "Medium-severity incident",
      example_conditions: [
        "evidence bundle generation failure",
        "malformed gateway logs affecting local audit",
        "isolated repeated authorization errors",
      ],
      recommended_response: "Record, investigate, contain locally, and schedule a documented recovery review.",
      escalation_required: false,
    },
    {
      id: "sev3_low",
      label: "Low-severity incident",
      example_conditions: [
        "single malformed log entry",
        "non-blocking local documentation mismatch",
      ],
      recommended_response: "Record and correct through normal maintenance while preserving relevant evidence.",
      escalation_required: false,
    },
  ];
}

function readinessChecks(): IncidentReadinessCheck[] {
  return [
    check("incident_response_template_available", "Incident response template available", "pass", "info", ["A deterministic local incident record template can be printed or exported."], "Exercise and approve the template before hosted operation."),
    check("severity_model_available", "Severity model available", "pass", "info", ["Local sev0 through sev3 definitions and example conditions are documented."], "Assign response targets and owners before public hosting."),
    check("containment_steps_available", "Containment guidance available", "partial", "warning", ["Local planning guidance covers keys, clients, logs, endpoints, and evidence."], "Convert guidance into an approved, tested operational runbook."),
    check("recovery_steps_available", "Recovery guidance available", "partial", "warning", ["Local planning guidance covers known-good restoration, tests, endpoint checks, and review."], "Test rollback and recovery in staging before public hosting."),
    check("request_ids_available", "Request IDs available", "pass", "info", ["Gateway responses and local logs include request IDs."], "Propagate identifiers through future hosted telemetry."),
    check("request_logging_available", "Request logging available", "partial", "warning", ["Append-only local JSONL gateway logs support local investigation."], "Add protected retention, integrity, privacy, and access controls."),
    check("monitoring_health_available", "Monitoring health available", "pass", "info", ["Local monitoring health identifies operational signal gaps."], "Integrate production telemetry and alerts before hosting."),
    check("security_readiness_available", "Security readiness available", "pass", "info", ["Security readiness identifies unresolved production controls."], "Keep incident gates synchronized with security review."),
    check("hosted_readiness_available", "Hosted readiness available", "pass", "info", ["Hosted readiness identifies blockers before public deployment."], "Do not host until critical blockers are closed."),
    check("rate_limit_signals_available", "Rate-limit signals available", "partial", "warning", ["Local rate-limit and abuse-control signals can support triage."], "Add distributed abuse monitoring and alerting for hosted mode."),
    check("evidence_bundle_available", "Evidence bundle available", "partial", "warning", ["Existing review evidence can be exported locally when relevant."], "Define incident evidence integrity, access, and retention controls."),
    check("external_alerting_missing", "External alerting missing", "not_started", "critical", ["No external paging, email, SMS, or chat alerting is enabled."], "Implement and test owned alert routes before public hosting."),
    check("customer_notification_process_missing", "Customer notification process missing", "not_started", "critical", ["No customer notification workflow or automation exists."], "Approve legal, privacy, ownership, and communication procedures before launch."),
    check("production_incident_owner_missing", "Production incident owner missing", "not_started", "critical", ["No staffed production incident role is configured."], "Name primary and backup incident owners with escalation authority."),
    check("log_retention_policy_missing", "Log retention policy missing", "not_started", "critical", ["No approved production retention or deletion policy exists."], "Approve retention, legal hold, access, privacy, and deletion rules."),
    check("backup_recovery_process_missing", "Backup and recovery process missing", "not_started", "critical", ["No hosted data store or tested recovery process exists."], "Define and test recovery objectives, backups, restores, and evidence."),
    check("key_rotation_process_missing", "Key rotation process missing", "not_started", "critical", ["Local keys can be replaced manually, but no production rotation workflow exists."], "Implement auditable issue, rotation, revocation, and emergency replacement."),
    check("legal_review_process_missing", "Legal review process missing", "not_started", "critical", ["No approved legal incident or notification process exists."], "Obtain qualified legal review before public commercial operation."),
    check("payment_incident_process_future", "Payment incident process is future", "future", "warning", ["Payments, billing, and automatic purchase are disabled."], "Create payment incident and reconciliation procedures before billing is enabled."),
    check("public_hosting_not_enabled", "Public hosting not enabled", "pass", "info", ["The gateway remains local-only and binds to localhost by default."], "Keep public hosting disabled until incident and security controls are operational."),
  ];
}

function check(
  id: string,
  label: string,
  status: IncidentReadinessStatus,
  severity: IncidentReadinessSeverity,
  evidence: string[],
  recommendation: string,
): IncidentReadinessCheck {
  return { id, label, status, severity, evidence, recommendation };
}
