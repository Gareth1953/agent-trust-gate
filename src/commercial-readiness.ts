import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { CONTRACT_VERSION } from "./contract.js";

export const COMMERCIAL_READINESS_VERSION = "atg.commercial-readiness.v1" as const;
export const COMMERCIAL_READINESS_SAFETY_STATEMENT =
  "Commercial readiness is a local planning snapshot only. It does not bill customers, process payments, enable automatic purchase, execute actions, expose a public service, authenticate real-world identities, guarantee legality, or prove compliance.";

export type CommercialReadinessStatus = "complete" | "partial" | "not_started" | "future";

export interface CommercialReadinessCategory {
  id: string;
  label: string;
  readiness_percent: number;
  status: CommercialReadinessStatus;
  evidence: string[];
  gaps: string[];
  next_step: string;
}

export interface CommercialReadinessSnapshot {
  [key: string]: unknown;
  contract_version: typeof CONTRACT_VERSION;
  readiness_version: typeof COMMERCIAL_READINESS_VERSION;
  generated_at: string;
  local_only: true;
  overall: {
    local_product_readiness_percent: 86;
    commercial_mvp_readiness_percent: 63;
    full_target_readiness_percent: 38;
    status: "local_infrastructure_ready_not_commercially_complete";
  };
  categories: CommercialReadinessCategory[];
  completed_capabilities: string[];
  missing_capabilities: string[];
  recommended_next_steps: string[];
  safety_statement: string;
}

export function createCommercialReadinessSnapshot(
  now = new Date(),
): CommercialReadinessSnapshot {
  return {
    contract_version: CONTRACT_VERSION,
    readiness_version: COMMERCIAL_READINESS_VERSION,
    generated_at: now.toISOString(),
    local_only: true,
    overall: {
      local_product_readiness_percent: 86,
      commercial_mvp_readiness_percent: 63,
      full_target_readiness_percent: 38,
      status: "local_infrastructure_ready_not_commercially_complete",
    },
    categories: categories(),
    completed_capabilities: [
      "deterministic_pre_action_trust_decisions",
      "policy_profiles_and_human_approval_boundary",
      "portable_receipts_reviews_and_evidence_bundles",
      "localhost_gateway_api",
      "local_request_metering_client_identity_and_allowances",
      "local_entitlement_and_upgrade_signals",
      "openapi_sdk_quickstart_and_agent_discovery",
      "local_admin_and_commercial_readiness_summaries",
      "hosted_and_production_security_readiness_packs",
    ],
    missing_capabilities: [
      "production_hosting_and_edge_availability",
      "production_identity_authentication_and_authorization",
      "customer_accounts_and_tenant_isolation",
      "payment_processing_and_billing_ledger",
      "automatic_machine_to_machine_purchase",
      "production_monitoring_incident_response_and_slas",
      "legal_terms_privacy_and_commercial_positioning",
      "public_developer_portal_and_global_distribution",
      "global_automated_marketing",
      "governed_market_scanning_and_adaptive_upgrade_recommendations",
    ],
    recommended_next_steps: [
      "Define production threat model, deployment architecture, tenant isolation, and secrets management.",
      "Establish legal terms, privacy position, data handling policy, and commercial claims review.",
      "Design customer accounts, production authentication, authorization, and audit retention.",
      "Build hosted observability, incident response, backups, availability targets, and operational runbooks.",
      "Validate pricing and entitlement design before implementing payment or billing integrations.",
      "Pilot with developers and agent builders before public distribution or automated marketing.",
      "Define governed data sources and human oversight before any adaptive market scanning or recommendations.",
    ],
    safety_statement: COMMERCIAL_READINESS_SAFETY_STATEMENT,
  };
}

export function formatCommercialReadinessForConsole(
  snapshot: CommercialReadinessSnapshot,
): string {
  const blockedTargets = snapshot.categories.filter((category) => (
    category.status === "not_started" || category.status === "future"
  ));
  return [
    "Agent Trust Gate commercial readiness snapshot",
    `readiness_version: ${snapshot.readiness_version}`,
    `generated_at: ${snapshot.generated_at}`,
    `status: ${snapshot.overall.status}`,
    "",
    "Overall readiness:",
    `- local_product_readiness_percent: ${snapshot.overall.local_product_readiness_percent}`,
    `- commercial_mvp_readiness_percent: ${snapshot.overall.commercial_mvp_readiness_percent}`,
    `- full_target_readiness_percent: ${snapshot.overall.full_target_readiness_percent}`,
    "",
    "Not started / future targets:",
    ...blockedTargets.map((category) => (
      `- ${category.id}: ${category.status} (${category.readiness_percent}%)`
    )),
    "",
    "Recommended next steps:",
    ...snapshot.recommended_next_steps.map((step) => `- ${step}`),
    "",
    snapshot.safety_statement,
  ].join("\n");
}

export function writeCommercialReadinessSnapshot(
  outputPath: string,
  snapshot = createCommercialReadinessSnapshot(),
): string {
  const resolvedPath = resolve(outputPath);
  mkdirSync(dirname(resolvedPath), { recursive: true });
  writeFileSync(
    resolvedPath,
    `${JSON.stringify(snapshot, null, 2)}\n`,
    "utf8",
  );
  return resolvedPath;
}

function categories(): CommercialReadinessCategory[] {
  return [
    complete("core_trust_decision_engine", "Core trust decision engine", 100, ["Deterministic verify-before-action rules and stable atg.v1 receipts."], [], "Maintain regression coverage as policies evolve."),
    complete("policy_profiles", "Policy profiles", 100, ["Standard, strict, and regulated-style local policy profiles."], ["Profiles do not prove legal or regulatory compliance."], "Add governed customer-specific policy administration later."),
    partial("approval_and_human_review", "Approval and human review", 95, ["Approval packs, explicit review decisions, and approval integrity checks."], ["No hosted reviewer identity or workflow service."], "Design production reviewer identity and authorization controls."),
    partial("evidence_bundle_layer", "Evidence bundle layer", 95, ["Portable local review and evidence bundle exports."], ["No external evidence verification or immutable hosted retention."], "Define production retention and verification requirements."),
    complete("local_gateway_api", "Local gateway API", 100, ["Localhost-only health, decision, approval, evidence, discovery, and entitlement endpoints."], ["Not deployed or hardened for public production traffic."], "Preserve localhost guarantees until production architecture is approved."),
    partial("gateway_logging_and_metering", "Gateway logging and metering", 95, ["Append-only local JSONL request logs and usage summaries."], ["No production telemetry pipeline, retention policy, or tamper resistance."], "Design hosted metering durability and privacy controls."),
    partial("client_identity_and_api_key_gate", "Client identity and API key gate", 90, ["Optional local client IDs and API-key matching without key logging."], ["Local API keys do not authenticate real-world identities or provide production-grade lifecycle management."], "Design production identity, key rotation, revocation, and authorization."),
    partial("client_usage_limits", "Client usage limits", 95, ["Local all-time, daily, and monthly decision allowances with 429 enforcement."], ["No distributed atomic counters or multi-instance consistency."], "Specify production quota consistency and concurrency behavior."),
    partial("gateway_admin_summary", "Gateway admin summary", 90, ["Local operator summary for health, clients, outcomes, auth, and limits."], ["No hosted admin console or role-based access."], "Define production operator roles and audit controls."),
    partial("developer_quickstart", "Developer quickstart", 95, ["Safe Node, PowerShell, curl, and sample-action quickstarts."], ["No hosted onboarding journey or support process."], "Pilot onboarding with external developers."),
    partial("openapi_contract", "OpenAPI contract", 95, ["Tracked OpenAPI 3.1 contract with local export and discovery endpoint."], ["No compatibility policy or published API lifecycle."], "Define versioning, deprecation, and compatibility commitments."),
    partial("sdk_wrappers", "SDK wrappers", 90, ["Dependency-free Node and PowerShell starter wrappers."], ["Not published, versioned, or supported as production SDK packages."], "Validate ergonomics before packaging supported SDKs."),
    partial("agent_manifest", "Agent manifest", 95, ["Machine-readable capabilities, tools, auth, usage, and safety metadata."], ["No hosted registry publication or signed manifest."], "Define signing and distribution requirements."),
    partial("mcp_style_adapter", "MCP-style adapter", 85, ["Inspectable local tool schemas and dependency-free adapter example."], ["Not a production MCP server and not registry-published."], "Validate framework demand before implementing a production transport."),
    partial("entitlement_and_upgrade_signals", "Entitlement and upgrade signals", 90, ["Local active, unlimited, at-limit, over-limit, and unknown-client signals."], ["Purchase, automatic purchase, billing, and account entitlements are disabled."], "Validate commercial entitlement semantics before payment integration."),
    partial("production_hosting", "Production hosting", 25, ["Local hosted deployment and production security readiness reports, checklists, safe environment guidance, and migration notes exist."], ["No hosted deployment, public service, production authentication, monitoring, tenant isolation, or legal review exists."], "Complete production security controls and deployment review before hosting."),
    partial("production_authentication", "Production authentication", 20, ["Local development API-key gate exists."], ["No real-world identity, OAuth/OIDC, tenant authorization, key lifecycle, or abuse controls."], "Select production identity and authorization architecture."),
    partial("production_security_readiness", "Production security readiness", 30, ["A deterministic local security readiness report, critical-gap inventory, control recommendations, and operational templates exist."], ["No production authentication, managed secret storage, transport security, rate limiting, monitoring, incident response program, legal review, or certification exists."], "Implement and independently review production security controls before public hosting."),
    notStarted("customer_accounts", "Customer accounts", "No customer, tenant, organization, or account lifecycle system.", "Define tenant model, onboarding, roles, and account recovery."),
    notStarted("payment_processing", "Payment processing", "No payment processor or transaction flow is integrated.", "Validate pricing and legal design before selecting payment infrastructure."),
    future("automatic_machine_to_machine_purchase", "Automatic machine-to-machine purchase", "Automatic purchase is explicitly disabled.", "Wait for a governed payment, consent, fraud, refund, and authorization design."),
    notStarted("billing_records", "Billing records", "No invoices, billing ledger, taxation, refunds, or revenue recognition records.", "Design auditable billing records only after pricing validation."),
    future("global_automated_marketing", "Global automated marketing", "No automated marketing, distribution, or acquisition system exists.", "Establish product-market evidence, brand controls, consent, and legal review first."),
    partial("public_developer_docs", "Public developer docs", 35, ["Comprehensive local README, quickstart, OpenAPI, SDK, and agent examples."], ["No hosted public documentation portal, search, analytics, or support lifecycle."], "Test documentation with pilot users before public hosting."),
    future("self_learning_market_scanning", "Self-learning market scanning", "No web scanning, external data collection, or self-learning pipeline exists.", "Define lawful data sources, governance, evaluation, and human oversight before implementation."),
    future("adaptive_upgrade_recommendations", "Adaptive upgrade recommendations", "Only static local upgrade-required signals exist; recommendations do not adapt or self-modify.", "Design explainable, reviewed recommendation logic after commercial usage data exists."),
    partial("production_monitoring", "Production monitoring", 15, ["Local logs, health endpoint, and deterministic audits exist."], ["No hosted metrics, tracing, alerting, incident response, SLOs, backups, or disaster recovery."], "Define observability and operational readiness requirements."),
    partial("legal_terms_and_commercial_positioning", "Legal terms and commercial positioning", 10, ["Safety statements avoid claims of legality or compliance."], ["No reviewed terms, privacy policy, data processing terms, SLA, or commercial claims framework."], "Obtain qualified legal review before commercial launch."),
  ];
}

function complete(
  id: string,
  label: string,
  readiness: number,
  evidence: string[],
  gaps: string[],
  nextStep: string,
): CommercialReadinessCategory {
  return category(id, label, readiness, "complete", evidence, gaps, nextStep);
}

function partial(
  id: string,
  label: string,
  readiness: number,
  evidence: string[],
  gaps: string[],
  nextStep: string,
): CommercialReadinessCategory {
  return category(id, label, readiness, "partial", evidence, gaps, nextStep);
}

function notStarted(
  id: string,
  label: string,
  gap: string,
  nextStep: string,
): CommercialReadinessCategory {
  return category(id, label, 0, "not_started", [], [gap], nextStep);
}

function future(
  id: string,
  label: string,
  gap: string,
  nextStep: string,
): CommercialReadinessCategory {
  return category(id, label, 0, "future", [], [gap], nextStep);
}

function category(
  id: string,
  label: string,
  readiness: number,
  status: CommercialReadinessStatus,
  evidence: string[],
  gaps: string[],
  nextStep: string,
): CommercialReadinessCategory {
  return {
    id,
    label,
    readiness_percent: readiness,
    status,
    evidence,
    gaps,
    next_step: nextStep,
  };
}
