export const MACHINE_DISCOVERY_VERSION = "atg.machine-discovery.local.v1" as const;
export const MACHINE_DISCOVERY_REPORT_VERSION = "atg.machine-discovery.report.local.v1" as const;
export const MACHINE_DISCOVERY_CONTACT = "gpmiddleton71@gmail.com" as const;
export const MACHINE_DISCOVERY_FIRST_COMMAND = "npm run demo:reviewer-kit" as const;
export const MACHINE_DISCOVERY_COMMAND = "npm run demo:discovery" as const;
export const MACHINE_DISCOVERY_SITE_VALIDATION_COMMAND = "npm run validate:discovery-site" as const;
export const MACHINE_DISCOVERY_EXPECTED_PAGES_URL = "https://gareth1953.github.io/agent-trust-gate/" as const;
export const MACHINE_DISCOVERY_PAGES_BASE_PATH = "/agent-trust-gate/" as const;
export const MACHINE_DISCOVERY_PAGES_WORKFLOW = ".github/workflows/deploy-discovery-pages.yml" as const;
export const MACHINE_DISCOVERY_PAGES_DEPLOYMENT_METHOD = "GitHub Actions" as const;
export const MACHINE_DISCOVERY_PAGES_WORKFLOW_RUN = "Deploy discovery Pages #1" as const;
export const MACHINE_DISCOVERY_ACTIVATION_SOURCE_COMMIT =
  "4c68e1b9eef33505da3444f64d170eda1f32a046" as const;

export const MACHINE_DISCOVERY_CORE_PHRASES = [
  "GatePass is a scoped, time-bound, action-specific proof primitive for agent actions.",
  "GatePass provides a common, machine-readable format for expressing authority, mandate, scope, freshness, and evidence.",
  "No mandate. No evidence. No verified intent. No signed GatePass. No settlement.",
  "Do not trust the agent. Trust the GatePass.",
  "No proof. No permission.",
  "No mandate. No action.",
] as const;

export type RegistryReadinessStatus =
  | "Active"
  | "Ready for review"
  | "Prepared but inactive"
  | "Not implemented"
  | "Requires explicit approval"
  | "Prohibited in current mission";

export interface MachineDiscoveryStatuses {
  nonProduction: true;
  manualInputOnly: true;
  humanApprovalRequired: true;
  localOnlyEvaluation: true;
  realActionExecution: false;
  realPaymentExecution: false;
  realSettlementExecution: false;
  a2aServer: false;
  mcpServer: false;
  npmPublished: false;
  githubPagesWorkflowPrepared: true;
  githubPagesDeploymentWorkflowActive: true;
  githubPagesConfigured: true;
  githubPagesActive: true;
  githubPagesPubliclyReachable: true;
  githubPagesHttpsVerified: true;
  githubPagesLiveUrlVerified: true;
  githubPagesDeploymentActive: true;
  authenticationActive: false;
  networkEndpointActive: false;
  autonomousOutreach: false;
  directBotMessaging: false;
  liveAgentToAgentCommunication: false;
  scraping: false;
  analyticsTracking: false;
  cookies: false;
  paymentLinks: false;
  checkout: false;
  productionSigning: false;
  productionCertification: false;
  securityCertification: false;
  legalComplianceGuarantee: false;
}

export interface MachineDiscoveryRecord {
  formatVersion: typeof MACHINE_DISCOVERY_VERSION;
  stableIdentifier: "com.gareth1953.agent-trust-gate";
  productName: "Agent Trust Gate";
  conciseDescription: string;
  repositoryLocation: "https://github.com/Gareth1953/agent-trust-gate";
  documentationEntryPoint: "README.md";
  reviewerKit: {
    entryPoint: "docs/one-command-reviewer-demo-kit.md";
    quickstart: "docs/reviewer-demo-kit-quickstart.md";
    command: typeof MACHINE_DISCOVERY_FIRST_COMMAND;
    recommendedFirstExperience: true;
  };
  paidPilot: {
    document: "docs/paid-pilot-commercial-entry.md";
    offerExample: "examples/paid-pilot-offer.json";
    name: "Agent Trust Gate Paid Evaluation Pilot";
    indicativeStartingPriceGbp: 1500;
    priceBoundary: string;
    status: "human_reviewed_enquiry_only";
  };
  embeddedCommerceGatepass: {
    document: "docs/embedded-commerce-gatepass.md";
    designPartnerDocument: "docs/embedded-commerce-design-partner-pilot.md";
    command: "npm run demo:commerce-gatepass";
    exampleReport: "examples/embedded-commerce-gatepass-report.json";
    commercialApplication: "featured_embedded_commerce_gatepass";
    targetAudiences: readonly string[];
    evaluationScope: readonly string[];
    status: "local_deterministic_synthetic_evaluation";
    commercialRoute: "paid_evaluation_or_design_partner_pilot";
    designPartnerPosition: "We prove the trust architecture. The design partner funds the real integration.";
    integrationBoundary: string;
  };
  publicContactEmail: typeof MACHINE_DISCOVERY_CONTACT;
  licence: "MIT";
  implementationLanguage: "TypeScript";
  headlineProductConcept: "GatePass";
  supportingConcepts: readonly string[];
  capabilityCategories: readonly string[];
  intendedUsers: readonly string[];
  statuses: MachineDiscoveryStatuses;
  inactiveIntegrationStatus: {
    a2aServerStatus: "not_implemented_no_live_a2a_server_no_endpoint";
    mcpServerStatus: "not_implemented_no_live_mcp_server_no_tools";
    mcpRegistryStatus: "not_published_not_ready_until_real_server_exists";
    npmPublicationStatus: "not_published_package_private";
    githubPagesDeploymentStatus: "active_public_https_verified_static_discovery_via_github_actions";
    networkEndpointStatus: "no_live_endpoint";
    paymentSettlementStatus: "no_real_payment_or_settlement_execution";
    actionExecutionStatus: "no_live_autonomous_action_execution";
  };
  githubPagesPassiveDiscovery: {
    liveUrl: typeof MACHINE_DISCOVERY_EXPECTED_PAGES_URL;
    basePath: typeof MACHINE_DISCOVERY_PAGES_BASE_PATH;
    deploymentWorkflow: typeof MACHINE_DISCOVERY_PAGES_WORKFLOW;
    deploymentMethod: typeof MACHINE_DISCOVERY_PAGES_DEPLOYMENT_METHOD;
    workflowPrepared: true;
    deploymentWorkflowActive: true;
    configured: true;
    active: true;
    publiclyReachable: true;
    httpsVerified: true;
    liveUrlVerified: true;
    liveVerificationStatus: "verified";
    activationDate: "2026-07-13";
    activationSourceCommit: typeof MACHINE_DISCOVERY_ACTIVATION_SOURCE_COMMIT;
    workflowRun: typeof MACHINE_DISCOVERY_PAGES_WORKFLOW_RUN;
    currentLiveStatusClaim: "active_public_https_verified_static_discovery";
    artifactIncludes: readonly [
      "discovery-site contents",
      "agent-trust-gate.discovery.json",
      "agent-trust-gate.agent-card.json",
      "agent-trust-gate.manifest.json",
      "llms.txt",
    ];
    artifactExcludes: readonly string[];
  };
  claimsBoundary: readonly string[];
  machineReadableResourceLinks: Record<string, string>;
  recommendedCommands: readonly string[];
  coreCommercialPosition: "No mandate. No evidence. No verified intent. No signed GatePass. No settlement.";
  lastReviewed: {
    mission: "P3-M144A";
    date: "2026-07-14";
    reviewType: "embedded_commerce_commercial_positioning_update";
    reviewedBy: "Agent Trust Gate local repository metadata";
  };
}

export interface MachineDiscoveryReport {
  project: "Agent Trust Gate";
  purpose: string;
  formatVersion: typeof MACHINE_DISCOVERY_REPORT_VERSION;
  sourceRecord: "agent-trust-gate.discovery.json";
  recommendedFirstCommand: typeof MACHINE_DISCOVERY_FIRST_COMMAND;
  discoveryCommand: typeof MACHINE_DISCOVERY_COMMAND;
  headlineProductConcept: "GatePass";
  gatepassPositioning: typeof MACHINE_DISCOVERY_CORE_PHRASES[0];
  technicalWording: typeof MACHINE_DISCOVERY_CORE_PHRASES[1];
  paidPilot: MachineDiscoveryRecord["paidPilot"];
  embeddedCommerceGatepass: MachineDiscoveryRecord["embeddedCommerceGatepass"];
  readinessSummary: Record<string, RegistryReadinessStatus | string>;
  inactiveStatuses: {
    a2aServer: false;
    mcpServer: false;
    npmPublication: false;
    realActionExecution: false;
    livePaymentExecution: false;
    realSettlementExecution: false;
    networkEndpoint: false;
    autonomousOutreach: false;
    directBotMessaging: false;
    liveAgentToAgentCommunication: false;
  };
  pagesDiscovery: {
    liveUrl: typeof MACHINE_DISCOVERY_EXPECTED_PAGES_URL;
    configured: true;
    active: true;
    publiclyReachable: true;
    httpsVerified: true;
    liveUrlVerified: true;
    deploymentMethod: typeof MACHINE_DISCOVERY_PAGES_DEPLOYMENT_METHOD;
    deploymentWorkflowActive: true;
    liveVerificationStatus: "verified";
    activationSourceCommit: typeof MACHINE_DISCOVERY_ACTIVATION_SOURCE_COMMIT;
  };
  safetyFlags: {
    localDemoOnly: true;
    manualInputOnly: true;
    humanApprovalRequired: true;
    nonProduction: true;
    realToolExecution: false;
    actionExecution: false;
    networkCalls: false;
    liveApi: false;
    a2aServer: false;
    mcpServer: false;
    npmPublished: false;
    githubPagesWorkflowPrepared: true;
    githubPagesDeploymentWorkflowActive: true;
    githubPagesConfigured: true;
    githubPagesActive: true;
    githubPagesPubliclyReachable: true;
    githubPagesHttpsVerified: true;
    githubPagesLiveUrlVerified: true;
    githubPagesDeploymentActive: true;
    livePaymentProcessing: false;
    settlementExecution: false;
    productionSigning: false;
    productionCertification: false;
    securityCertification: false;
    legalComplianceGuarantee: false;
  };
  safetyBoundary: string;
  publicContact: typeof MACHINE_DISCOVERY_CONTACT;
  lastReviewed: MachineDiscoveryRecord["lastReviewed"];
}

export interface MachineDiscoverySummary {
  project: "Agent Trust Gate";
  formatVersion: typeof MACHINE_DISCOVERY_VERSION;
  recommendedFirstCommand: typeof MACHINE_DISCOVERY_FIRST_COMMAND;
  discoveryCommand: typeof MACHINE_DISCOVERY_COMMAND;
  headlineProductConcept: "GatePass";
  paidPilotStartingPriceGbp: 1500;
  embeddedCommerceGatepassCommand: "npm run demo:commerce-gatepass";
  a2aServer: false;
  mcpServer: false;
  npmPublished: false;
  githubPagesWorkflowPrepared: true;
  githubPagesDeploymentWorkflowActive: true;
  githubPagesConfigured: true;
  githubPagesActive: true;
  githubPagesPubliclyReachable: true;
  githubPagesHttpsVerified: true;
  githubPagesLiveUrlVerified: true;
  githubPagesDeploymentActive: true;
  realActionExecution: false;
  realPaymentExecution: false;
  realSettlementExecution: false;
  publicContact: typeof MACHINE_DISCOVERY_CONTACT;
}

export interface MachineDiscoveryValidation {
  valid: boolean;
  checks: readonly {
    id: string;
    passed: boolean;
    detail: string;
  }[];
}

export const MACHINE_DISCOVERY_SAFETY_FLAGS: MachineDiscoveryStatuses = {
  nonProduction: true,
  manualInputOnly: true,
  humanApprovalRequired: true,
  localOnlyEvaluation: true,
  realActionExecution: false,
  realPaymentExecution: false,
  realSettlementExecution: false,
  a2aServer: false,
  mcpServer: false,
  npmPublished: false,
  githubPagesWorkflowPrepared: true,
  githubPagesDeploymentWorkflowActive: true,
  githubPagesConfigured: true,
  githubPagesActive: true,
  githubPagesPubliclyReachable: true,
  githubPagesHttpsVerified: true,
  githubPagesLiveUrlVerified: true,
  githubPagesDeploymentActive: true,
  authenticationActive: false,
  networkEndpointActive: false,
  autonomousOutreach: false,
  directBotMessaging: false,
  liveAgentToAgentCommunication: false,
  scraping: false,
  analyticsTracking: false,
  cookies: false,
  paymentLinks: false,
  checkout: false,
  productionSigning: false,
  productionCertification: false,
  securityCertification: false,
  legalComplianceGuarantee: false,
};

export function getMachineDiscoveryRecord(): MachineDiscoveryRecord {
  return {
    formatVersion: MACHINE_DISCOVERY_VERSION,
    stableIdentifier: "com.gareth1953.agent-trust-gate",
    productName: "Agent Trust Gate",
    conciseDescription:
      "Local-first GatePass proof-of-concept for checking scoped authority, mandate, evidence, intent, freshness, and approval before sensitive AI-agent actions.",
    repositoryLocation: "https://github.com/Gareth1953/agent-trust-gate",
    documentationEntryPoint: "README.md",
    reviewerKit: {
      entryPoint: "docs/one-command-reviewer-demo-kit.md",
      quickstart: "docs/reviewer-demo-kit-quickstart.md",
      command: MACHINE_DISCOVERY_FIRST_COMMAND,
      recommendedFirstExperience: true,
    },
    paidPilot: {
      document: "docs/paid-pilot-commercial-entry.md",
      offerExample: "examples/paid-pilot-offer.json",
      name: "Agent Trust Gate Paid Evaluation Pilot",
      indicativeStartingPriceGbp: 1500,
      priceBoundary: "Starting from £1,500 subject to scope and written agreement.",
      status: "human_reviewed_enquiry_only",
    },
    embeddedCommerceGatepass: {
      document: "docs/embedded-commerce-gatepass.md",
      designPartnerDocument: "docs/embedded-commerce-design-partner-pilot.md",
      command: "npm run demo:commerce-gatepass",
      exampleReport: "examples/embedded-commerce-gatepass-report.json",
      commercialApplication: "featured_embedded_commerce_gatepass",
      targetAudiences: [
        "supermarkets",
        "grocery retailers",
        "general retailers",
        "AI-shopping platforms",
        "commerce infrastructure teams",
        "payment and checkout providers",
        "retail-system architects",
        "AI governance and transaction-risk teams",
      ],
      evaluationScope: [
        "mandate enforcement",
        "basket integrity",
        "substitution controls",
        "price and fee limits",
        "approval freshness",
        "merchant and destination checks",
        "replay protection",
        "GatePass and refusal-receipt outputs",
      ],
      status: "local_deterministic_synthetic_evaluation",
      commercialRoute: "paid_evaluation_or_design_partner_pilot",
      designPartnerPosition: "We prove the trust architecture. The design partner funds the real integration.",
      integrationBoundary:
        "Synthetic commerce evaluation only; no live retailer integration, no shopping-agent integration, no checkout, no account login, no card handling, no payment or settlement execution, no API, no A2A, no MCP, no network, and no production integration exists.",
    },
    publicContactEmail: MACHINE_DISCOVERY_CONTACT,
    licence: "MIT",
    implementationLanguage: "TypeScript",
    headlineProductConcept: "GatePass",
    supportingConcepts: [
      "ProofPackage",
      "VerificationContract",
      "Tool Gate",
      "Pre-Settlement Gate",
      "GatePass proof vocabulary",
      "GatePass claims vocabulary",
      "Agent Trust Language as supporting material only",
    ],
    capabilityCategories: [
      "local GatePass create-verify-reject lifecycle",
      "local adversarial scorecard",
      "local developer wrapper",
      "local reviewer kit",
      "local embedded commerce pre-checkout basket verification demo",
      "local paid evaluation pilot packaging",
      "passive machine-readable discovery metadata",
    ],
    intendedUsers: [
      "developers",
      "AI agent builders",
      "technical reviewers",
      "AI governance reviewers",
      "trust and safety reviewers",
      "payment workflow reviewers",
      "commercial pilot evaluators",
      "commerce infrastructure reviewers",
      "retailer trust and safety reviewers",
      "payment-provider evaluation teams",
    ],
    statuses: MACHINE_DISCOVERY_SAFETY_FLAGS,
    inactiveIntegrationStatus: {
      a2aServerStatus: "not_implemented_no_live_a2a_server_no_endpoint",
      mcpServerStatus: "not_implemented_no_live_mcp_server_no_tools",
      mcpRegistryStatus: "not_published_not_ready_until_real_server_exists",
      npmPublicationStatus: "not_published_package_private",
      githubPagesDeploymentStatus: "active_public_https_verified_static_discovery_via_github_actions",
      networkEndpointStatus: "no_live_endpoint",
      paymentSettlementStatus: "no_real_payment_or_settlement_execution",
      actionExecutionStatus: "no_live_autonomous_action_execution",
    },
    githubPagesPassiveDiscovery: {
      liveUrl: MACHINE_DISCOVERY_EXPECTED_PAGES_URL,
      basePath: MACHINE_DISCOVERY_PAGES_BASE_PATH,
      deploymentWorkflow: MACHINE_DISCOVERY_PAGES_WORKFLOW,
      deploymentMethod: MACHINE_DISCOVERY_PAGES_DEPLOYMENT_METHOD,
      workflowPrepared: true,
      deploymentWorkflowActive: true,
      configured: true,
      active: true,
      publiclyReachable: true,
      httpsVerified: true,
      liveUrlVerified: true,
      liveVerificationStatus: "verified",
      activationDate: "2026-07-13",
      activationSourceCommit: MACHINE_DISCOVERY_ACTIVATION_SOURCE_COMMIT,
      workflowRun: MACHINE_DISCOVERY_PAGES_WORKFLOW_RUN,
      currentLiveStatusClaim: "active_public_https_verified_static_discovery",
      artifactIncludes: [
        "discovery-site contents",
        "agent-trust-gate.discovery.json",
        "agent-trust-gate.agent-card.json",
        "agent-trust-gate.manifest.json",
        "llms.txt",
      ],
      artifactExcludes: [
        ".git",
        ".github source files",
        "test files",
        "TypeScript source not needed by the site",
        "package-lock files",
        "credentials",
        "receipts",
        "environment files",
        "internal build artefacts",
      ],
    },
    claimsBoundary: [
      "local deterministic evaluation only",
      "passive discovery metadata only",
      "reviewer-ready does not mean production-ready",
      "no live A2A server",
      "no live MCP server",
      "not listed in the MCP Registry",
      "not published on npm",
      "GitHub Pages passive discovery is active, public, and HTTPS verified as a static discovery route",
      "Embedded Commerce GatePass is a local deterministic synthetic demonstrator only",
      "no real payment or settlement execution",
      "no live autonomous action execution",
      "no guaranteed safety, compliance, buyer demand, or paid-pilot conversion",
    ],
    machineReadableResourceLinks: {
      readme: "README.md",
      llms: "llms.txt",
      canonicalDiscovery: "agent-trust-gate.discovery.json",
      agentCard: "agent-trust-gate.agent-card.json",
      manifest: "agent-trust-gate.manifest.json",
      schemasDirectory: "schemas/",
      examplesDirectory: "examples/",
      reviewerKitReportExample: "examples/gatepass-reviewer-kit-report.json",
      paidPilotOfferExample: "examples/paid-pilot-offer.json",
      machineDiscoveryReportExample: "examples/machine-discovery-report.json",
      embeddedCommerceGatepass: "docs/embedded-commerce-gatepass.md",
      embeddedCommerceDesignPartnerPilot: "docs/embedded-commerce-design-partner-pilot.md",
      embeddedCommerceReportExample: "examples/embedded-commerce-gatepass-report.json",
      livePagesUrl: MACHINE_DISCOVERY_EXPECTED_PAGES_URL,
      livePagesDiscoveryRecord: `${MACHINE_DISCOVERY_EXPECTED_PAGES_URL}agent-trust-gate.discovery.json`,
      livePagesLlms: `${MACHINE_DISCOVERY_EXPECTED_PAGES_URL}llms.txt`,
      livePagesAgentCard: `${MACHINE_DISCOVERY_EXPECTED_PAGES_URL}agent-trust-gate.agent-card.json`,
      livePagesManifest: `${MACHINE_DISCOVERY_EXPECTED_PAGES_URL}agent-trust-gate.manifest.json`,
    },
    recommendedCommands: [
      MACHINE_DISCOVERY_FIRST_COMMAND,
      MACHINE_DISCOVERY_COMMAND,
      MACHINE_DISCOVERY_SITE_VALIDATION_COMMAND,
      "npm run demo:commerce-gatepass",
      "npm run demo:gatepass-round-trip",
      "npm run demo:gatepass-scorecard",
      "npm run demo:gatepass-wrapper",
      "npm run demo:paid-pilot",
    ],
    coreCommercialPosition:
      "No mandate. No evidence. No verified intent. No signed GatePass. No settlement.",
    lastReviewed: {
      mission: "P3-M144A",
      date: "2026-07-14",
      reviewType: "embedded_commerce_commercial_positioning_update",
      reviewedBy: "Agent Trust Gate local repository metadata",
    },
  };
}

export function getMachineDiscoveryReport(
  record: MachineDiscoveryRecord = getMachineDiscoveryRecord(),
): MachineDiscoveryReport {
  return {
    project: "Agent Trust Gate",
    purpose: "Deterministic local machine-discovery and registry-readiness report.",
    formatVersion: MACHINE_DISCOVERY_REPORT_VERSION,
    sourceRecord: "agent-trust-gate.discovery.json",
    recommendedFirstCommand: MACHINE_DISCOVERY_FIRST_COMMAND,
    discoveryCommand: MACHINE_DISCOVERY_COMMAND,
    headlineProductConcept: record.headlineProductConcept,
    gatepassPositioning: MACHINE_DISCOVERY_CORE_PHRASES[0],
    technicalWording: MACHINE_DISCOVERY_CORE_PHRASES[1],
    paidPilot: record.paidPilot,
    embeddedCommerceGatepass: record.embeddedCommerceGatepass,
    readinessSummary: {
      githubRepositoryDiscovery: "Active",
      githubTopics: "Active - added manually through GitHub",
      llmsTxt: "Active",
      canonicalDiscoveryJson: "Active",
      staticSiteSource: "Active",
      githubPagesDeployment: "Active - public HTTPS verified static discovery site deployed by GitHub Actions",
      livePagesUrl: MACHINE_DISCOVERY_EXPECTED_PAGES_URL,
      a2aMetadataReadiness: "Prepared but inactive",
      a2aServerReadiness: "Not implemented",
      mcpDesignReadiness: "Prepared but inactive",
      mcpServerReadiness: "Not implemented",
      mcpRegistryReadiness: "Not implemented",
      npmPackagingReadiness: "Ready for review",
      npmPublicationReadiness: "Requires explicit approval",
      paidPilotCommercialRoute: "Active",
      embeddedCommerceGatepass: "Ready for local synthetic evaluation - no live checkout or payment integration",
    },
    inactiveStatuses: {
      a2aServer: false,
      mcpServer: false,
      npmPublication: false,
      realActionExecution: false,
      livePaymentExecution: false,
      realSettlementExecution: false,
      networkEndpoint: false,
      autonomousOutreach: false,
      directBotMessaging: false,
      liveAgentToAgentCommunication: false,
    },
    pagesDiscovery: {
      liveUrl: MACHINE_DISCOVERY_EXPECTED_PAGES_URL,
      configured: true,
      active: true,
      publiclyReachable: true,
      httpsVerified: true,
      liveUrlVerified: true,
      deploymentMethod: MACHINE_DISCOVERY_PAGES_DEPLOYMENT_METHOD,
      deploymentWorkflowActive: true,
      liveVerificationStatus: "verified",
      activationSourceCommit: MACHINE_DISCOVERY_ACTIVATION_SOURCE_COMMIT,
    },
    safetyFlags: {
      localDemoOnly: true,
      manualInputOnly: true,
      humanApprovalRequired: true,
      nonProduction: true,
      realToolExecution: false,
      actionExecution: false,
      networkCalls: false,
      liveApi: false,
      a2aServer: false,
      mcpServer: false,
      npmPublished: false,
      githubPagesWorkflowPrepared: true,
      githubPagesDeploymentWorkflowActive: true,
      githubPagesConfigured: true,
      githubPagesActive: true,
      githubPagesPubliclyReachable: true,
      githubPagesHttpsVerified: true,
      githubPagesLiveUrlVerified: true,
      githubPagesDeploymentActive: true,
      livePaymentProcessing: false,
      settlementExecution: false,
      productionSigning: false,
      productionCertification: false,
      securityCertification: false,
      legalComplianceGuarantee: false,
    },
    safetyBoundary:
      "Passive machine discovery and local deterministic evaluation only. GitHub Pages passive discovery is active, public, and HTTPS verified as a static discovery route. Embedded Commerce GatePass is synthetic pre-checkout basket verification only. No live API endpoint, no A2A server, no MCP server, no npm publication, no retailer integration, no shopping-agent integration, no checkout, no card handling, no real tool execution, no product network calls, no live payment processing, no settlement execution, and no action execution.",
    publicContact: record.publicContactEmail,
    lastReviewed: record.lastReviewed,
  };
}

export function summariseMachineDiscovery(
  record: MachineDiscoveryRecord = getMachineDiscoveryRecord(),
): MachineDiscoverySummary {
  return {
    project: "Agent Trust Gate",
    formatVersion: record.formatVersion,
    recommendedFirstCommand: record.reviewerKit.command,
    discoveryCommand: MACHINE_DISCOVERY_COMMAND,
    headlineProductConcept: record.headlineProductConcept,
    paidPilotStartingPriceGbp: record.paidPilot.indicativeStartingPriceGbp,
    embeddedCommerceGatepassCommand: record.embeddedCommerceGatepass.command,
    a2aServer: record.statuses.a2aServer,
    mcpServer: record.statuses.mcpServer,
    npmPublished: record.statuses.npmPublished,
    githubPagesWorkflowPrepared: record.statuses.githubPagesWorkflowPrepared,
    githubPagesDeploymentWorkflowActive: record.statuses.githubPagesDeploymentWorkflowActive,
    githubPagesConfigured: record.statuses.githubPagesConfigured,
    githubPagesActive: record.statuses.githubPagesActive,
    githubPagesPubliclyReachable: record.statuses.githubPagesPubliclyReachable,
    githubPagesHttpsVerified: record.statuses.githubPagesHttpsVerified,
    githubPagesLiveUrlVerified: record.statuses.githubPagesLiveUrlVerified,
    githubPagesDeploymentActive: record.statuses.githubPagesDeploymentActive,
    realActionExecution: record.statuses.realActionExecution,
    realPaymentExecution: record.statuses.realPaymentExecution,
    realSettlementExecution: record.statuses.realSettlementExecution,
    publicContact: record.publicContactEmail,
  };
}

export function validateMachineDiscoveryRecord(
  record: MachineDiscoveryRecord = getMachineDiscoveryRecord(),
): MachineDiscoveryValidation {
  const checks = [
    {
      id: "format_version",
      passed: record.formatVersion === MACHINE_DISCOVERY_VERSION,
      detail: "canonical discovery record uses the current local format version",
    },
    {
      id: "reviewer_first",
      passed: record.reviewerKit.command === MACHINE_DISCOVERY_FIRST_COMMAND &&
        record.reviewerKit.recommendedFirstExperience,
      detail: "reviewer kit remains the recommended first experience",
    },
    {
      id: "contact",
      passed: record.publicContactEmail === MACHINE_DISCOVERY_CONTACT,
      detail: "approved public contact email is present",
    },
    {
      id: "paid_pilot",
      passed: record.paidPilot.indicativeStartingPriceGbp === 1500 &&
        record.paidPilot.status === "human_reviewed_enquiry_only",
      detail: "Paid Evaluation Pilot route is present with cautious indicative price",
    },
    {
      id: "embedded_commerce_gatepass",
      passed: record.embeddedCommerceGatepass.command === "npm run demo:commerce-gatepass" &&
        record.embeddedCommerceGatepass.commercialApplication === "featured_embedded_commerce_gatepass" &&
        record.embeddedCommerceGatepass.commercialRoute === "paid_evaluation_or_design_partner_pilot" &&
        record.embeddedCommerceGatepass.targetAudiences.includes("supermarkets") &&
        record.embeddedCommerceGatepass.evaluationScope.includes("basket integrity") &&
        record.embeddedCommerceGatepass.status === "local_deterministic_synthetic_evaluation" &&
        record.embeddedCommerceGatepass.integrationBoundary.includes("no live retailer") &&
        record.embeddedCommerceGatepass.integrationBoundary.includes("no checkout") &&
        record.embeddedCommerceGatepass.integrationBoundary.includes("no live"),
      detail: "Embedded Commerce GatePass is present as a local synthetic demonstrator only",
    },
    {
      id: "inactive_protocols",
      passed: !record.statuses.a2aServer &&
        !record.statuses.mcpServer &&
        !record.statuses.npmPublished &&
        record.statuses.githubPagesWorkflowPrepared &&
        record.statuses.githubPagesDeploymentWorkflowActive &&
        record.statuses.githubPagesDeploymentActive,
      detail: "A2A, MCP, and npm publication remain inactive while the static GitHub Pages discovery route is active",
    },
    {
      id: "inactive_execution",
      passed: !record.statuses.realActionExecution &&
        !record.statuses.realPaymentExecution &&
        !record.statuses.realSettlementExecution &&
        !record.statuses.networkEndpointActive,
      detail: "real action, payment, settlement, and network endpoint statuses remain inactive",
    },
    {
      id: "claims_boundary",
      passed: record.claimsBoundary.some((claim) => claim.includes("no live A2A server")) &&
        record.claimsBoundary.some((claim) => claim.includes("no live MCP server")) &&
        record.claimsBoundary.some((claim) => claim.includes("not published on npm")) &&
        record.claimsBoundary.some((claim) => claim.includes("GitHub Pages passive discovery is active")),
      detail: "claims boundary covers inactive protocol and publication states",
    },
    {
      id: "pages_activation_verified",
      passed: record.githubPagesPassiveDiscovery.liveUrl === MACHINE_DISCOVERY_EXPECTED_PAGES_URL &&
        record.githubPagesPassiveDiscovery.workflowPrepared &&
        record.githubPagesPassiveDiscovery.deploymentWorkflowActive &&
        record.githubPagesPassiveDiscovery.configured &&
        record.githubPagesPassiveDiscovery.active &&
        record.githubPagesPassiveDiscovery.publiclyReachable &&
        record.githubPagesPassiveDiscovery.httpsVerified &&
        record.githubPagesPassiveDiscovery.liveUrlVerified &&
        record.githubPagesPassiveDiscovery.liveVerificationStatus === "verified" &&
        record.githubPagesPassiveDiscovery.activationSourceCommit === MACHINE_DISCOVERY_ACTIVATION_SOURCE_COMMIT &&
        record.githubPagesPassiveDiscovery.currentLiveStatusClaim === "active_public_https_verified_static_discovery",
      detail: "GitHub Pages passive discovery is active, public, and HTTPS verified",
    },
  ] as const;

  return {
    valid: checks.every((check) => check.passed),
    checks,
  };
}

export function getMachineDiscoverySafetyBoundary(): string {
  return getMachineDiscoveryReport().safetyBoundary;
}
