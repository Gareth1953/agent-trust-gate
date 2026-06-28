import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { CONTRACT_VERSION } from "./contract.js";

export const LAUNCH_READINESS_VERSION = "atg.launch-readiness.v1" as const;
export const LAUNCH_READINESS_SAFETY_STATEMENT =
  "Launch readiness is a local planning snapshot only. It does not publish Agent Trust Gate, expose a public service, collect signups, bill customers, process payments, enable automatic purchase, execute actions, or certify production readiness.";

export type DocumentationSectionStatus = "complete" | "partial" | "missing" | "future";
export type LaunchCheckStatus = "pass" | "partial" | "fail" | "not_started" | "future";
export type LaunchCheckSeverity = "info" | "warning" | "critical";

export interface DocumentationSection {
  id: string;
  title: string;
  status: DocumentationSectionStatus;
  path: string;
  purpose: string;
  gaps: string[];
}

export interface LaunchCheck {
  id: string;
  label: string;
  status: LaunchCheckStatus;
  severity: LaunchCheckSeverity;
  evidence: string[];
  recommendation: string;
}

export interface DeveloperAssets {
  openapi_available: true;
  sdk_wrappers_available: true;
  quickstart_available: true;
  mcp_adapter_available: true;
  agent_manifest_available: true;
  local_gateway_available: true;
  public_docs_directory_available: true;
  hosted_demo_available: false;
  public_package_available: false;
  public_api_available: false;
  production_docs_site_available: false;
}

export interface LaunchReadinessReport {
  [key: string]: unknown;
  contract_version: typeof CONTRACT_VERSION;
  launch_readiness_version: typeof LAUNCH_READINESS_VERSION;
  generated_at: string;
  local_only: true;
  public_launch_enabled: false;
  public_docs_ready: false;
  hosted_service_enabled: false;
  package_published: false;
  payments_enabled: false;
  automatic_purchase_enabled: false;
  overall: {
    developer_launch_readiness_percent: 38;
    status: "public_launch_preparation_only";
    next_gate: "complete_public_docs_hosted_demo_and_security_review_before_launch";
  };
  documentation_sections: DocumentationSection[];
  developer_assets: DeveloperAssets;
  launch_checks: LaunchCheck[];
  required_before_public_launch: string[];
  recommended_launch_controls: string[];
  safety_statement: string;
}

export function createLaunchReadinessReport(now = new Date()): LaunchReadinessReport {
  return {
    contract_version: CONTRACT_VERSION,
    launch_readiness_version: LAUNCH_READINESS_VERSION,
    generated_at: now.toISOString(),
    local_only: true,
    public_launch_enabled: false,
    public_docs_ready: false,
    hosted_service_enabled: false,
    package_published: false,
    payments_enabled: false,
    automatic_purchase_enabled: false,
    overall: {
      developer_launch_readiness_percent: 38,
      status: "public_launch_preparation_only",
      next_gate: "complete_public_docs_hosted_demo_and_security_review_before_launch",
    },
    documentation_sections: documentationSections(),
    developer_assets: {
      openapi_available: true,
      sdk_wrappers_available: true,
      quickstart_available: true,
      mcp_adapter_available: true,
      agent_manifest_available: true,
      local_gateway_available: true,
      public_docs_directory_available: true,
      hosted_demo_available: false,
      public_package_available: false,
      public_api_available: false,
      production_docs_site_available: false,
    },
    launch_checks: launchChecks(),
    required_before_public_launch: [
      "public developer documentation review",
      "hosted demo or sandbox decision",
      "production security review",
      "legal and terms review",
      "privacy and data policy review",
      "support contact and support process",
      "pricing and plan decision",
      "customer onboarding decision",
      "package publishing decision",
      "versioning and release policy",
      "abuse prevention review",
      "monitoring and incident response review",
      "payment provider decision before any paid launch",
      "explicit Gareth approval before public launch",
    ],
    recommended_launch_controls: [
      "clear local-only wording",
      "no compliance overclaims",
      "no payment claims until enabled",
      "no automatic purchase claims until enabled",
      "stable API examples",
      "copy-paste quickstart",
      "safe demo client keys only",
      "public changelog",
      "support boundary statement",
      "security contact before hosted launch",
      "release checklist",
      "hosted launch gate",
      "developer onboarding checklist",
    ],
    safety_statement: LAUNCH_READINESS_SAFETY_STATEMENT,
  };
}

export function formatLaunchReadinessForConsole(report: LaunchReadinessReport): string {
  return [
    "Agent Trust Gate public developer documentation and launch readiness",
    `launch_readiness_version: ${report.launch_readiness_version}`,
    `generated_at: ${report.generated_at}`,
    `developer_launch_readiness_percent: ${report.overall.developer_launch_readiness_percent}`,
    `status: ${report.overall.status}`,
    `public_launch_enabled: ${report.public_launch_enabled}`,
    `public_docs_ready: ${report.public_docs_ready}`,
    `hosted_service_enabled: ${report.hosted_service_enabled}`,
    `package_published: ${report.package_published}`,
    `payments_enabled: ${report.payments_enabled}`,
    `automatic_purchase_enabled: ${report.automatic_purchase_enabled}`,
    "",
    `next_gate: ${report.overall.next_gate}`,
    "",
    report.safety_statement,
  ].join("\n");
}

export function writeLaunchReadinessReport(
  outputPath: string,
  report = createLaunchReadinessReport(),
): string {
  const resolvedPath = resolve(outputPath);
  mkdirSync(dirname(resolvedPath), { recursive: true });
  writeFileSync(resolvedPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return resolvedPath;
}

function documentationSections(): DocumentationSection[] {
  const section = (id: string, title: string, path: string, purpose: string, gaps: string[] = []): DocumentationSection => ({
    id, title, status: gaps.length === 0 ? "complete" : "partial", path, purpose, gaps,
  });
  return [
    section("product_overview", "Product overview", "docs/public-developer/product-overview.md", "Explain the pre-action trust gateway and its audience."),
    section("problem_statement", "Problem statement", "docs/public-developer/product-overview.md", "Describe trust boundaries for high-impact agent actions."),
    section("trust_decision_concept", "Trust decision concept", "docs/public-developer/product-overview.md", "Explain ALLOW, BLOCK, and REQUEST HUMAN."),
    section("local_quickstart", "Local quickstart", "docs/public-developer/local-quickstart.md", "Build, test, start, and call the local gateway."),
    section("gateway_api", "Gateway API", "docs/public-developer/gateway-api.md", "Describe local HTTP contracts, identity headers, and response tracing."),
    section("openapi_contract", "OpenAPI contract", "docs/public-developer/openapi-and-sdk.md", "Locate and export the machine-readable API contract."),
    section("sdk_wrappers", "SDK wrappers", "docs/public-developer/openapi-and-sdk.md", "Use inspectable Node and PowerShell clients."),
    section("agent_manifest", "Agent manifest", "docs/public-developer/agent-manifest-and-mcp.md", "Discover agent-readable capabilities and safety metadata."),
    section("mcp_adapter", "MCP adapter", "docs/public-developer/agent-manifest-and-mcp.md", "Demonstrate local MCP-style tool dispatch."),
    section("entitlement_and_usage", "Entitlement and usage", "docs/public-developer/usage-entitlements-rate-limits.md", "Explain local metering, entitlement, and upgrade signals."),
    section("rate_limits_and_abuse_signals", "Rate limits and abuse signals", "docs/public-developer/usage-entitlements-rate-limits.md", "Explain local-only request controls and 429 behavior."),
    section("approval_packs", "Approval packs", "docs/public-developer/approval-evidence-layer.md", "Explain human approval preparation."),
    section("human_review_records", "Human review records", "docs/public-developer/approval-evidence-layer.md", "Explain explicit reviewer decisions."),
    section("evidence_bundles", "Evidence bundles", "docs/public-developer/approval-evidence-layer.md", "Explain portable local evidence exports."),
    section("commercial_readiness", "Commercial readiness", "docs/public-developer/hosted-launch-roadmap.md", "Explain conservative progress reporting."),
    section("hosted_readiness", "Hosted readiness", "docs/public-developer/hosted-launch-roadmap.md", "Explain pre-hosting blockers.", ["No hosted service or sandbox exists."]),
    section("security_readiness", "Security readiness", "docs/public-developer/hosted-launch-roadmap.md", "Explain unresolved production security controls.", ["No production security certification or independent review exists."]),
    section("billing_payment_readiness", "Billing and payment readiness", "docs/public-developer/billing-and-machine-purchase-boundaries.md", "Explain disabled billing and payment planning.", ["No provider, billing, tariff, or payment processing exists."]),
    section("machine_purchase_policy", "Machine purchase policy", "docs/public-developer/billing-and-machine-purchase-boundaries.md", "Explain deny-by-default automatic purchase boundaries.", ["Automatic purchase and payment execution remain disabled."]),
    section("limitations_and_safety_boundaries", "Limitations and safety boundaries", "docs/public-developer/safety-and-limitations.md", "State product, legal, security, and execution limits."),
    section("future_hosted_launch", "Future hosted launch", "docs/public-developer/hosted-launch-roadmap.md", "List gates before any public launch.", ["Hosting, support, legal review, security controls, and launch approval remain incomplete."]),
  ];
}

function launchChecks(): LaunchCheck[] {
  const check = (id:string,label:string,status:LaunchCheckStatus,severity:LaunchCheckSeverity,evidence:string[],recommendation:string):LaunchCheck => ({id,label,status,severity,evidence,recommendation});
  return [
    check("local_docs_created", "Local public developer docs created", "pass", "info", ["A structured local external-developer documentation pack exists."], "Review with external pilot developers before publication."),
    check("product_overview_available", "Product overview available", "pass", "info", ["Product, problem, decisions, evidence, and boundaries are documented."], "Validate terminology with target integrators."),
    check("quickstart_available", "Quickstart available", "pass", "info", ["Local build, gateway, curl, SDK, and inspection commands are documented."], "Continuously test copy-paste commands."),
    check("openapi_documented", "OpenAPI documented", "pass", "info", ["Tracked and HTTP OpenAPI access are documented."], "Add compatibility policy before public release."),
    check("sdk_documented", "SDK wrappers documented", "pass", "info", ["Node and PowerShell wrapper paths and demos are documented."], "Decide whether to publish supported packages later."),
    check("agent_manifest_documented", "Agent manifest documented", "pass", "info", ["Agent discovery contract is documented."], "Version discovery changes conservatively."),
    check("mcp_adapter_documented", "MCP adapter documented", "pass", "info", ["Local MCP-style example and non-production boundary are documented."], "Do not claim production MCP compatibility without implementation and testing."),
    check("safety_boundaries_documented", "Safety boundaries documented", "pass", "info", ["No-execution, local-only, legal, compliance, security, payment, and purchase limits are explicit."], "Keep wording synchronized with implementation."),
    check("no_payments_enabled", "Payments remain disabled", "pass", "info", ["No provider, charges, payment details, or payment processing exists."], "Do not make payment claims until independently reviewed and enabled."),
    check("no_automatic_purchase_enabled", "Automatic purchase remains disabled", "pass", "info", ["Deny-by-default policy and zero limits remain in force."], "Require explicit approval and all payment controls before enabling."),
    check("hosted_service_not_enabled", "Hosted service not enabled", "pass", "info", ["Gateway remains localhost-only by default."], "Complete all production gates before hosting."),
    check("public_docs_site_missing", "Public docs site missing", "not_started", "warning", ["Documentation exists locally only."], "Choose publication, ownership, versioning, and security controls before launch."),
    check("hosted_demo_missing", "Hosted demo missing", "not_started", "warning", ["No hosted sandbox or demo exists."], "Decide whether a protected sandbox is appropriate after security review."),
    check("production_security_review_missing", "Production security review missing", "not_started", "critical", ["No production security certification or independent review exists."], "Complete threat modeling, control implementation, testing, and review."),
    check("legal_terms_review_missing", "Legal and terms review missing", "not_started", "critical", ["No reviewed public terms, privacy policy, or acceptable-use policy exists."], "Obtain qualified review before launch."),
    check("pricing_not_finalized", "Pricing not finalized", "not_started", "warning", ["Plans are price-free placeholders only."], "Validate pricing, tax, support, refund, and billing terms before paid launch."),
    check("customer_signup_missing", "Customer signup missing", "not_started", "warning", ["No signup, login, or real customer account system exists."], "Decide onboarding architecture after privacy and security review."),
    check("support_contact_missing_or_placeholder", "Support contact missing", "not_started", "warning", ["No public support contact or operating process exists."], "Define ownership, hours, escalation, and response boundaries."),
    check("package_publish_not_started", "Package publishing not started", "future", "info", ["No package has been published."], "Define support, release, signing, and deprecation policy first."),
    check("global_marketing_readiness_available", "Global marketing readiness available", "partial", "info", ["A local positioning, distribution-channel, launch-message, and control inventory exists."], "Keep outreach, publication, ads, tracking, and signup capture disabled until every public launch gate passes."),
  ];
}
