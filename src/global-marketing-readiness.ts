import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { CONTRACT_VERSION } from "./contract.js";

export const GLOBAL_MARKETING_READINESS_VERSION = "atg.global-marketing-readiness.v1" as const;
export const GLOBAL_MARKETING_READINESS_SAFETY_STATEMENT =
  "Global marketing readiness is a local planning snapshot only. It does not publish content, send outreach, run ads, track users, collect signups, expose a public service, bill customers, process payments, enable automatic purchase, or execute actions.";

export type DistributionChannelStatus = "not_started" | "partial" | "future" | "blocked";
export type MarketingReadinessCheckStatus = "pass" | "partial" | "fail" | "not_started" | "future";
export type MarketingReadinessCheckSeverity = "info" | "warning" | "critical";

export interface DistributionChannel {
  id: string;
  label: string;
  status: DistributionChannelStatus;
  readiness_percent: number;
  purpose: string;
  current_assets: string[];
  gaps: string[];
  launch_risk: string;
  next_step: string;
}

export interface MarketingReadinessCheck {
  id: string;
  label: string;
  status: MarketingReadinessCheckStatus;
  severity: MarketingReadinessCheckSeverity;
  evidence: string[];
  recommendation: string;
}

export interface GlobalMarketingReadinessReport {
  [key: string]: unknown;
  contract_version: typeof CONTRACT_VERSION;
  global_marketing_readiness_version: typeof GLOBAL_MARKETING_READINESS_VERSION;
  generated_at: string;
  local_only: true;
  global_marketing_enabled: false;
  automated_outreach_enabled: false;
  public_distribution_enabled: false;
  analytics_tracking_enabled: false;
  paid_ads_enabled: false;
  signup_capture_enabled: false;
  outbound_agent_contact_enabled: false;
  automated_agent_outreach_enabled: false;
  external_agent_scanning_enabled: false;
  human_approval_required_before_contact: true;
  overall: {
    global_marketing_readiness_percent: 20;
    status: "local_marketing_distribution_planning_only";
    next_gate: "complete_public_launch_security_and_distribution_review_before_marketing";
  };
  positioning_model: {
    category: "pre-action trust gateway for AI agents";
    primary_audience: string[];
    core_message: string;
    differentiators: string[];
    overclaim_boundaries: string[];
  };
  agent_to_agent_discovery_readiness: {
    status: "local_discovery_drafts_only";
    supported_future_protocols: string[];
    agent_card_draft_available: true;
    integration_invitation_draft_available: true;
  };
  distribution_channels: DistributionChannel[];
  developer_adoption_assets: Record<string, boolean>;
  launch_message_assets: Array<{ id: string; draft: string; local_draft_only: true }>;
  checks: MarketingReadinessCheck[];
  required_before_global_distribution: string[];
  recommended_distribution_controls: string[];
  safety_statement: string;
}

export function createGlobalMarketingReadinessReport(now = new Date()): GlobalMarketingReadinessReport {
  return {
    contract_version: CONTRACT_VERSION,
    global_marketing_readiness_version: GLOBAL_MARKETING_READINESS_VERSION,
    generated_at: now.toISOString(),
    local_only: true,
    global_marketing_enabled: false,
    automated_outreach_enabled: false,
    public_distribution_enabled: false,
    analytics_tracking_enabled: false,
    paid_ads_enabled: false,
    signup_capture_enabled: false,
    outbound_agent_contact_enabled: false,
    automated_agent_outreach_enabled: false,
    external_agent_scanning_enabled: false,
    human_approval_required_before_contact: true,
    overall: {
      global_marketing_readiness_percent: 20,
      status: "local_marketing_distribution_planning_only",
      next_gate: "complete_public_launch_security_and_distribution_review_before_marketing",
    },
    positioning_model: {
      category: "pre-action trust gateway for AI agents",
      primary_audience: [
        "AI agent developers",
        "agent platform builders",
        "enterprise AI teams",
        "AI governance and safety teams",
        "developers building tools that act before humans review them",
      ],
      core_message: "Agent Trust Gate checks high-impact AI actions before they execute and returns ALLOW, BLOCK, or REQUEST HUMAN with evidence.",
      differentiators: [
        "pre-action trust decision",
        "approval and evidence layer",
        "agent-readable manifest",
        "OpenAPI and SDK integration",
        "entitlement and usage signals",
        "machine-purchase policy readiness with automatic purchase disabled",
      ],
      overclaim_boundaries: [
        "does not guarantee legality",
        "does not prove compliance",
        "does not authenticate real-world identity",
        "does not execute actions",
        "does not process payments",
        "does not enable automatic purchase",
      ],
    },
    agent_to_agent_discovery_readiness: {
      status: "local_discovery_drafts_only",
      supported_future_protocols: [
        "MCP-style tools",
        "Agent Manifest",
        "A2A-style Agent Card",
        "OpenAPI",
        "SDK wrappers",
      ],
      agent_card_draft_available: true,
      integration_invitation_draft_available: true,
    },
    distribution_channels: distributionChannels(),
    developer_adoption_assets: {
      public_developer_docs_available: true,
      local_quickstart_available: true,
      openapi_available: true,
      sdk_wrappers_available: true,
      mcp_adapter_available: true,
      agent_manifest_available: true,
      launch_readiness_available: true,
      hosted_demo_available: false,
      public_repo_ready: false,
      package_publish_ready: false,
      support_process_ready: false,
      pricing_public_ready: false,
      production_security_ready: false,
    },
    launch_message_assets: [
      { id: "one_sentence_positioning", draft: "Agent Trust Gate is a local-first pre-action trust gateway that helps AI agents request trust decisions before high-impact actions execute.", local_draft_only: true },
      { id: "developer_value_statement", draft: "Integrate local trust decisions through JSON, OpenAPI, and inspectable SDK wrappers before your system performs an action.", local_draft_only: true },
      { id: "agent_builder_value_statement", draft: "Give agents machine-readable ALLOW, BLOCK, or REQUEST HUMAN results with evidence and usage signals.", local_draft_only: true },
      { id: "enterprise_safety_value_statement", draft: "Evaluate governed workflows locally with explicit approval and evidence boundaries; production controls remain future work.", local_draft_only: true },
      { id: "launch_warning_boundaries", draft: "Local planning only: no hosted service, public API, compliance guarantee, payment processing, or automatic purchase.", local_draft_only: true },
    ],
    checks: marketingChecks(),
    required_before_global_distribution: [
      "explicit Gareth approval before launch",
      "public repository decision",
      "public documentation review",
      "hosted demo or local-only launch decision",
      "production security review",
      "legal and terms review",
      "privacy and data policy review",
      "pricing and plan decision",
      "support process",
      "abuse prevention review",
      "incident response review",
      "monitoring review",
      "public changelog and release policy",
      "package publishing decision",
      "brand and domain decision",
      "analytics and tracking privacy decision",
      "payment provider decision before paid launch",
      "automatic purchase approval process before any machine purchase launch",
    ],
    recommended_distribution_controls: [
      "avoid compliance overclaims",
      "avoid payment claims until payments are enabled",
      "avoid automatic-purchase claims until enabled",
      "clearly label local-only status",
      "provide copy-paste developer quickstart",
      "provide safe demo keys only",
      "use public changelog before public launch",
      "define support boundaries",
      "define security contact before hosted launch",
      "define pricing boundaries before paid launch",
      "define pilot customer review process",
      "require Gareth approval before public distribution",
    ],
    safety_statement: GLOBAL_MARKETING_READINESS_SAFETY_STATEMENT,
  };
}

export function formatGlobalMarketingReadinessForConsole(report: GlobalMarketingReadinessReport): string {
  return [
    "Agent Trust Gate global marketing and distribution readiness",
    `global_marketing_readiness_version: ${report.global_marketing_readiness_version}`,
    `generated_at: ${report.generated_at}`,
    `global_marketing_readiness_percent: ${report.overall.global_marketing_readiness_percent}`,
    `status: ${report.overall.status}`,
    `global_marketing_enabled: ${report.global_marketing_enabled}`,
    `automated_outreach_enabled: ${report.automated_outreach_enabled}`,
    `public_distribution_enabled: ${report.public_distribution_enabled}`,
    `analytics_tracking_enabled: ${report.analytics_tracking_enabled}`,
    `paid_ads_enabled: ${report.paid_ads_enabled}`,
    `signup_capture_enabled: ${report.signup_capture_enabled}`,
    `outbound_agent_contact_enabled: ${report.outbound_agent_contact_enabled}`,
    `automated_agent_outreach_enabled: ${report.automated_agent_outreach_enabled}`,
    `external_agent_scanning_enabled: ${report.external_agent_scanning_enabled}`,
    `human_approval_required_before_contact: ${report.human_approval_required_before_contact}`,
    "",
    `next_gate: ${report.overall.next_gate}`,
    "",
    report.safety_statement,
  ].join("\n");
}

export function writeGlobalMarketingReadinessReport(outputPath: string, report = createGlobalMarketingReadinessReport()): string {
  const resolvedPath = resolve(outputPath);
  mkdirSync(dirname(resolvedPath), { recursive: true });
  writeFileSync(resolvedPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return resolvedPath;
}

function distributionChannels(): DistributionChannel[] {
  const channel = (id:string,label:string,status:DistributionChannelStatus,readiness:number,purpose:string,assets:string[],gaps:string[],risk:string,next:string):DistributionChannel => ({id,label,status,readiness_percent:readiness,purpose,current_assets:assets,gaps,launch_risk:risk,next_step:next});
  return [
    channel("public_github_repository", "Public GitHub repository", "blocked", 35, "Provide inspectable source and issue tracking.", ["Local repository", "README", "tests"], ["No publication decision, security review, contribution policy, or support owner."], "Secrets, unsupported commitments, or unsafe examples could be published.", "Complete repository and security review before explicit publication approval."),
    channel("developer_docs_site", "Developer docs site", "not_started", 30, "Provide searchable integration documentation.", ["Local public-developer documentation pack"], ["No hosting, search, versioning, analytics decision, or owner."], "Documentation could overstate production capabilities or become stale.", "Review content and choose a controlled publication model."),
    channel("npm_package", "npm package", "not_started", 20, "Distribute a supported JavaScript client.", ["Local SDK-style wrapper"], ["No package, signing, release, compatibility, or support policy."], "Developers may treat examples as a supported production SDK.", "Define packaging and lifecycle policy before publishing."),
    channel("openapi_directory", "OpenAPI directory", "partial", 35, "Make the gateway contract discoverable.", ["Tracked OpenAPI 3.1 contract", "local export command"], ["No public endpoint, listing review, or compatibility guarantee."], "A public listing could imply a live API.", "Review the contract and clearly label local-only availability."),
    channel("mcp_tool_directory", "MCP tool directory", "partial", 30, "Make trust tools discoverable to agent builders.", ["Local MCP-style tool definitions", "agent manifest"], ["No production MCP server, registry listing, or conformance review."], "An example adapter could be mistaken for a production server.", "Complete conformance and safety review before any listing."),
    channel("ai_agent_marketplaces", "AI agent marketplaces", "future", 10, "Reach agent platform integrators.", ["Agent-readable manifest"], ["No marketplace target, hosted service, terms, billing, or support."], "Listings could imply execution, identity, compliance, or payment capabilities.", "Wait for hosted, legal, security, and support readiness."),
    channel("product_hunt_or_launch_platform", "Launch platforms", "future", 10, "Coordinate a future public product announcement.", ["Local draft positioning"], ["No launch approval, public product, support, pricing, or hosted demo."], "Premature launch would create unsupported expectations.", "Use only after all public launch gates pass."),
    channel("linkedin_thought_leadership", "LinkedIn thought leadership", "not_started", 10, "Explain pre-action trust concepts.", ["Local positioning model"], ["No editorial review, account policy, measurement decision, or approval."], "Unreviewed claims could imply legal or compliance guarantees.", "Create reviewed educational guidance only after launch approval."),
    channel("technical_blog_posts", "Technical blog posts", "not_started", 20, "Teach integration and trust-gateway architecture.", ["Developer docs", "OpenAPI", "examples"], ["No publishing venue, review workflow, or maintenance owner."], "Examples could become stale or expose unsafe defaults.", "Define technical review and update ownership."),
    channel("demo_video", "Demo video", "not_started", 15, "Demonstrate local gateway integration.", ["Quickstart and SDK demos"], ["No script, recording, accessibility, or claims review."], "A demo could imply hosted or production availability.", "Script a clearly local-only demo after review."),
    channel("hosted_sandbox", "Hosted sandbox", "blocked", 5, "Allow protected evaluation without local setup.", [], ["Hosting, production auth, monitoring, legal terms, support, and abuse controls are incomplete."], "Public exposure before production controls is unsafe.", "Do not create until hosted and security gates pass."),
    channel("enterprise_pilot_pack", "Enterprise pilot pack", "future", 25, "Support governed evaluation with selected teams.", ["Evidence layer", "readiness reports", "developer docs"], ["No pilot terms, support model, privacy review, or success criteria."], "Pilot expectations may exceed local product boundaries.", "Define a reviewed local-only pilot process."),
    channel("direct_partner_integrations", "Direct partner integrations", "future", 15, "Integrate trust decisions into agent platforms.", ["OpenAPI", "SDK wrappers", "manifest"], ["No partner terms, production API, support SLA, or security review."], "Integration could create operational and legal commitments.", "Wait for production and commercial governance."),
  ];
}

function marketingChecks(): MarketingReadinessCheck[] {
  const check=(id:string,label:string,status:MarketingReadinessCheckStatus,severity:MarketingReadinessCheckSeverity,evidence:string[],recommendation:string):MarketingReadinessCheck=>({id,label,status,severity,evidence,recommendation});
  return [
    check("public_developer_docs_created", "Public developer docs created locally", "pass", "info", ["A structured external-developer pack exists in the repository."], "Complete independent review before publication."),
    check("product_positioning_defined", "Product positioning defined", "pass", "info", ["Audience, category, message, differentiators, and overclaim boundaries are explicit."], "Validate with pilot developers without publishing claims."),
    check("developer_quickstart_available", "Developer quickstart available", "pass", "info", ["Local quickstart and safe examples exist."], "Keep commands tested."),
    check("openapi_available", "OpenAPI available", "pass", "info", ["A tracked local API contract exists."], "Define public compatibility guarantees before distribution."),
    check("sdk_available", "SDK wrappers available", "pass", "info", ["Inspectible local Node and PowerShell wrappers exist."], "Do not present them as published production SDKs."),
    check("mcp_adapter_available", "MCP-style adapter available", "pass", "info", ["Local non-production tool definitions and adapter exist."], "Complete conformance review before directory listing."),
    check("agent_manifest_available", "Agent manifest available", "pass", "info", ["Local machine-readable discovery metadata exists."], "Keep disabled commerce and execution boundaries explicit."),
    check("safety_boundaries_documented", "Safety boundaries documented", "pass", "info", ["Local-only, no-execution, no-compliance, and no-certification boundaries are documented."], "Review all launch copy against these boundaries."),
    check("billing_boundaries_documented", "Billing boundaries documented", "pass", "info", ["Billing and payment readiness explicitly remains disabled."], "Avoid pricing or payment claims until enabled and reviewed."),
    check("machine_purchase_boundaries_documented", "Machine purchase boundaries documented", "pass", "info", ["Automatic purchase is deny-by-default and disabled."], "Do not market automatic purchase as available."),
    check("hosted_service_not_enabled", "Hosted service not enabled", "pass", "info", ["No hosted deployment exists."], "Complete hosted gates before public distribution."),
    check("public_api_not_enabled", "Public API not enabled", "pass", "info", ["Gateway remains localhost-only."], "Do not advertise a public endpoint."),
    check("payment_processing_not_enabled", "Payment processing not enabled", "pass", "info", ["No payment provider or charging flow exists."], "Complete payment and legal review before paid launch."),
    check("automatic_purchase_not_enabled", "Automatic purchase not enabled", "pass", "info", ["Automatic purchase remains false."], "Require explicit approval and production controls before any future enablement."),
    check("public_repo_not_published", "Public repository not published", "not_started", "warning", ["Repository remains local/private."], "Make an explicit reviewed publication decision."),
    check("package_not_published", "Package not published", "not_started", "warning", ["No npm package is published."], "Define package ownership and support policy first."),
    check("docs_site_not_deployed", "Docs site not deployed", "not_started", "warning", ["Developer docs remain local."], "Review and version docs before deployment."),
    check("analytics_not_enabled", "Analytics and tracking not enabled", "pass", "info", ["No analytics, pixels, or tracking services were added."], "Complete a privacy decision before any future measurement."),
    check("outreach_not_enabled", "Automated outreach not enabled", "pass", "info", ["No email, social, or CRM automation exists."], "Require consent, legal review, and explicit approval before outreach."),
    check("paid_ads_not_enabled", "Paid ads not enabled", "pass", "info", ["No advertising account or campaign exists."], "Do not run ads before launch approval and measurement governance."),
    check("signup_capture_not_enabled", "Signup capture not enabled", "pass", "info", ["No forms, mailing lists, or personal-data collection exists."], "Complete privacy, security, and retention design before collection."),
    check("production_security_review_missing", "Production security review missing", "not_started", "critical", ["Production security is not certified or complete."], "Complete review before public hosting or distribution."),
    check("legal_terms_review_missing", "Legal and terms review missing", "not_started", "critical", ["No reviewed public terms, privacy policy, or marketing claims exist."], "Obtain qualified review before publication."),
    check("support_process_missing", "Support process missing", "not_started", "warning", ["No public support owner or service boundary exists."], "Define support scope and escalation."),
    check("pricing_not_finalized", "Pricing not finalized", "not_started", "warning", ["Plan prices remain null placeholders."], "Validate pricing and terms before paid messaging."),
    check("hosted_demo_missing", "Hosted demo missing", "not_started", "warning", ["No hosted sandbox is available."], "Decide whether a protected demo is appropriate after production review."),
  ];
}
