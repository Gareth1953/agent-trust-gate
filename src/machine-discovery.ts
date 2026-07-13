export const MACHINE_DISCOVERY_VERSION = "atg.machine-discovery.local.v1" as const;
export const MACHINE_DISCOVERY_REPORT_VERSION = "atg.machine-discovery.report.local.v1" as const;
export const MACHINE_DISCOVERY_CONTACT = "gpmiddleton71@gmail.com" as const;
export const MACHINE_DISCOVERY_FIRST_COMMAND = "npm run demo:reviewer-kit" as const;
export const MACHINE_DISCOVERY_COMMAND = "npm run demo:discovery" as const;

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
  githubPagesDeploymentActive: false;
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
    githubPagesDeploymentStatus: "prepared_but_inactive_static_source_only";
    networkEndpointStatus: "no_live_endpoint";
    paymentSettlementStatus: "no_real_payment_or_settlement_execution";
    actionExecutionStatus: "no_live_autonomous_action_execution";
  };
  claimsBoundary: readonly string[];
  machineReadableResourceLinks: Record<string, string>;
  recommendedCommands: readonly string[];
  coreCommercialPosition: "No mandate. No evidence. No verified intent. No signed GatePass. No settlement.";
  lastReviewed: {
    mission: "P3-M142";
    date: "2026-07-13";
    reviewType: "local_machine_discovery_and_registry_readiness";
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
  readinessSummary: Record<string, RegistryReadinessStatus | string>;
  inactiveStatuses: {
    a2aServer: false;
    mcpServer: false;
    npmPublication: false;
    githubPagesDeployment: false;
    realActionExecution: false;
    livePaymentExecution: false;
    realSettlementExecution: false;
    networkEndpoint: false;
    autonomousOutreach: false;
    directBotMessaging: false;
    liveAgentToAgentCommunication: false;
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
    githubPagesDeploymentActive: false;
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
  a2aServer: false;
  mcpServer: false;
  npmPublished: false;
  githubPagesDeploymentActive: false;
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
  githubPagesDeploymentActive: false,
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
    ],
    statuses: MACHINE_DISCOVERY_SAFETY_FLAGS,
    inactiveIntegrationStatus: {
      a2aServerStatus: "not_implemented_no_live_a2a_server_no_endpoint",
      mcpServerStatus: "not_implemented_no_live_mcp_server_no_tools",
      mcpRegistryStatus: "not_published_not_ready_until_real_server_exists",
      npmPublicationStatus: "not_published_package_private",
      githubPagesDeploymentStatus: "prepared_but_inactive_static_source_only",
      networkEndpointStatus: "no_live_endpoint",
      paymentSettlementStatus: "no_real_payment_or_settlement_execution",
      actionExecutionStatus: "no_live_autonomous_action_execution",
    },
    claimsBoundary: [
      "local deterministic evaluation only",
      "passive discovery metadata only",
      "reviewer-ready does not mean production-ready",
      "no live A2A server",
      "no live MCP server",
      "not listed in the MCP Registry",
      "not published on npm",
      "GitHub Pages source is prepared but not deployed",
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
    },
    recommendedCommands: [
      MACHINE_DISCOVERY_FIRST_COMMAND,
      MACHINE_DISCOVERY_COMMAND,
      "npm run demo:gatepass-round-trip",
      "npm run demo:gatepass-scorecard",
      "npm run demo:gatepass-wrapper",
      "npm run demo:paid-pilot",
    ],
    coreCommercialPosition:
      "No mandate. No evidence. No verified intent. No signed GatePass. No settlement.",
    lastReviewed: {
      mission: "P3-M142",
      date: "2026-07-13",
      reviewType: "local_machine_discovery_and_registry_readiness",
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
    readinessSummary: {
      githubRepositoryDiscovery: "Active",
      githubTopics: "Active - added manually through GitHub",
      llmsTxt: "Active",
      canonicalDiscoveryJson: "Active",
      staticSiteSource: "Ready for review",
      githubPagesDeployment: "Requires explicit approval",
      a2aMetadataReadiness: "Prepared but inactive",
      a2aServerReadiness: "Not implemented",
      mcpDesignReadiness: "Prepared but inactive",
      mcpServerReadiness: "Not implemented",
      mcpRegistryReadiness: "Not implemented",
      npmPackagingReadiness: "Ready for review",
      npmPublicationReadiness: "Requires explicit approval",
      paidPilotCommercialRoute: "Active",
    },
    inactiveStatuses: {
      a2aServer: false,
      mcpServer: false,
      npmPublication: false,
      githubPagesDeployment: false,
      realActionExecution: false,
      livePaymentExecution: false,
      realSettlementExecution: false,
      networkEndpoint: false,
      autonomousOutreach: false,
      directBotMessaging: false,
      liveAgentToAgentCommunication: false,
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
      githubPagesDeploymentActive: false,
      livePaymentProcessing: false,
      settlementExecution: false,
      productionSigning: false,
      productionCertification: false,
      securityCertification: false,
      legalComplianceGuarantee: false,
    },
    safetyBoundary:
      "Passive machine discovery and local deterministic evaluation only. No live endpoint, no A2A server, no MCP server, no npm publication, no GitHub Pages deployment, no real tool execution, no network calls, no live payment processing, no settlement execution, and no action execution.",
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
    a2aServer: record.statuses.a2aServer,
    mcpServer: record.statuses.mcpServer,
    npmPublished: record.statuses.npmPublished,
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
      id: "inactive_protocols",
      passed: !record.statuses.a2aServer &&
        !record.statuses.mcpServer &&
        !record.statuses.npmPublished &&
        !record.statuses.githubPagesDeploymentActive,
      detail: "A2A, MCP, npm publication, and GitHub Pages deployment are inactive",
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
        record.claimsBoundary.some((claim) => claim.includes("not published on npm")),
      detail: "claims boundary covers inactive protocol and publication states",
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
