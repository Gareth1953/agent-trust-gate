import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { validateJsonSchemaFile } from "./json-schema-validator.js";

export const AGENT_REVIEW_INVITATION_VERSION = "atg.agent-review-invitation.v1" as const;
export const AGENT_REVIEW_INVITATION_MISSION = "P3-M155" as const;
export const AGENT_REVIEW_INVITATION_FILE = "agent-trust-gate.agent-review-invitation.json" as const;
export const AGENT_REVIEW_INVITATION_SCHEMA = "schemas/agent-review-invitation.schema.json" as const;
export const BRING_YOUR_AGENT_SCENARIO_SCHEMA = "schemas/bring-your-agent-scenario.schema.json" as const;
export const BRING_YOUR_AGENT_SCENARIO_EXAMPLE = "examples/bring-your-agent-scenario.example.json" as const;
export const BRING_YOUR_AGENT_SCENARIO_TEMPLATE = "discovery-site/bring-your-agent-scenario.template.json" as const;
export const ARD_AI_CATALOG_SCHEMA = "schemas/ard-ai-catalog-v1.0.schema.json" as const;
export const ARD_AI_CATALOG = "discovery-site/ai-catalog.json" as const;

const root = process.cwd();
const requiredCapabilities = [
  "verify-agent-standing",
  "verify-principal-delegation",
  "verify-human-authority",
  "bind-exact-action",
  "issue-local-gatepass",
  "refuse-invalid-or-unverifiable-standing",
  "detect-changed-action",
  "refuse-expired-or-replayed-proof",
  "produce-decision-receipt",
  "produce-execution-receipt",
] as const;
const requiredNonCapabilities = [
  "live_remote_invocation",
  "automatic_agent_enrolment",
  "autonomous_message_submission",
  "hosted_gatepass_api",
  "live_a2a",
  "live_mcp",
  "production_identity_verification",
  "payment_processing",
  "settlement",
  "autonomous_commercial_acceptance",
] as const;
const prohibitedInformation = [
  "passwords",
  "api_keys",
  "wallet_seed_phrases",
  "card_details",
  "production_credentials",
  "production_tokens",
  "private_keys",
  "customer_personal_data",
  "medical_information",
  "confidential_commercial_data",
  "unrestricted_logs",
  "live_payment_instructions",
  "real_settlement_instructions",
  "production_endpoints",
] as const;

export interface AgentInvitationValidationCheck {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface AgentInvitationValidationReport {
  project: "Agent Trust Gate";
  mission: typeof AGENT_REVIEW_INVITATION_MISSION;
  version: typeof AGENT_REVIEW_INVITATION_VERSION;
  purpose: "Deterministic local validation of the static agent discovery and reviewer invitation pack";
  checks: readonly AgentInvitationValidationCheck[];
  automaticOutreachPerformed: "none";
  externalAgentsContacted: "none";
  externalActionsPerformed: "none";
  networkCalls: false;
  overallPassed: boolean;
}

export interface AgentInvitationValidationOverrides {
  invitation?: unknown;
  scenarioExample?: unknown;
  scenarioTemplate?: unknown;
  ardCatalog?: unknown;
  publicHtml?: readonly string[];
  agentCard?: unknown;
}

export function validateAgentInvitationPack(
  overrides: AgentInvitationValidationOverrides = {},
): AgentInvitationValidationReport {
  const invitation = overrides.invitation ?? readJson(AGENT_REVIEW_INVITATION_FILE);
  const scenarioExample = overrides.scenarioExample ?? readJson(BRING_YOUR_AGENT_SCENARIO_EXAMPLE);
  const scenarioTemplate = overrides.scenarioTemplate ?? readJson(BRING_YOUR_AGENT_SCENARIO_TEMPLATE);
  const ardCatalog = overrides.ardCatalog ?? readJson(ARD_AI_CATALOG);
  const agentCard = overrides.agentCard ?? readJson("agent-trust-gate.agent-card.json");
  const publicHtml = overrides.publicHtml ?? [
    "discovery-site/index.html",
    "discovery-site/for-agents.html",
    "discovery-site/bring-your-agent-scenario.html",
    "discovery-site/agent-standing-demo.html",
    "discovery-site/human-authority-demo.html",
  ].filter((path) => exists(path)).map(read);

  const invitationValidation = validateJsonSchemaFile(AGENT_REVIEW_INVITATION_SCHEMA, invitation);
  const scenarioExampleValidation = validateJsonSchemaFile(BRING_YOUR_AGENT_SCENARIO_SCHEMA, scenarioExample);
  const scenarioTemplateValidation = validateJsonSchemaFile(BRING_YOUR_AGENT_SCENARIO_SCHEMA, scenarioTemplate);
  const ardValidation = validateJsonSchemaFile(ARD_AI_CATALOG_SCHEMA, ardCatalog);
  const invitationRecord = asRecord(invitation);
  const currentState = asRecord(invitationRecord.currentState);
  const routes = asRecord(invitationRecord.routes);
  const publicRoutes = asRecord(invitationRecord.publicDemonstrationRoutes);
  const accountableHuman = asRecord(invitationRecord.accountableHumanRequirement);
  const paidPilot = asRecord(invitationRecord.paidPilotRoute);
  const contact = asRecord(invitationRecord.contactRoute);
  const nonCapabilities = stringArray(invitationRecord.nonCapabilities);
  const invitationProhibited = stringArray(invitationRecord.prohibitedInformation);
  const capabilityIds = recordArray(invitationRecord.supportedReviewCapabilities)
    .map((capability) => capability.identifier)
    .filter((value): value is string => typeof value === "string");
  const combinedHtml = publicHtml.join("\n");
  const combinedPublicMetadata = `${JSON.stringify(invitation)}\n${JSON.stringify(ardCatalog)}\n${JSON.stringify(agentCard)}\n${combinedHtml}`;
  const acceptedInformation = stringArray(invitationRecord.acceptedInformation);
  const sensitiveFieldNamesAbsent = prohibitedInformation.every((field) =>
    !schemaDefinesField(BRING_YOUR_AGENT_SCENARIO_SCHEMA, field)
  );
  const sensitiveInformationRequestAbsent = [
    /\bpasswords?\b/i,
    /\bapi[-_ ]?keys?\b/i,
    /\bwallet seed phrases?\b/i,
    /\bcard details?\b/i,
    /\bproduction (?:credentials?|tokens?)\b/i,
    /\bprivate keys?\b/i,
    /\bcustomer personal data\b/i,
    /\bmedical information\b/i,
    /\bconfidential commercial data\b/i,
    /\bunrestricted logs?\b/i,
    /\blive payment instructions?\b/i,
    /\breal settlement instructions?\b/i,
    /\bproduction endpoints?\b/i,
  ].every((pattern) => acceptedInformation.every((item) => !pattern.test(item)));
  const publicCollectionAbsent = !/<form\b|<input\b[^>]*type=["']?file|\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon/i
    .test(combinedHtml);
  const positiveLiveA2aClaimAbsent = !/"(?:a2aServer|liveA2a)"\s*:\s*true|\b(?:operates?|provides?|exposes?)\s+(?:a\s+)?live A2A/i
    .test(combinedPublicMetadata);
  const positiveLiveMcpClaimAbsent = !/"(?:mcpServer|liveMcp)"\s*:\s*true|\b(?:operates?|provides?|exposes?)\s+(?:a\s+)?live MCP/i
    .test(combinedPublicMetadata);
  const positiveHostedApiClaimAbsent = !/"(?:hostedApi|hostedGatepassApi|live_endpoint|liveEndpoint)"\s*:\s*true|\bhosted GatePass API (?:is|available|active)/i
    .test(combinedPublicMetadata);
  const unsupportedClaimAbsent = !/"(?:productionIdentityVerification|paymentProcessing|settlementExecution|productionReady)"\s*:\s*true|\bATG is production[- ]ready\b/i
    .test(combinedPublicMetadata);
  const unsupportedPositiveProseAbsent = !/\bATG\s+(?:provides?|offers?|operates?|performs?|verifies?|processes?|executes?|accepts?)\s+(?:a\s+|an\s+)?(?:production[- ]identity verification|production identities|payment processing|payments|settlement|live credentials|customer data|hosted GatePass API|live A2A|live MCP)\b/i
    .test(combinedPublicMetadata);
  const autonomousAgentClaimAbsent = !/\b(?:an?\s+|the\s+)?agent\s+(?:can|may|will)\s+(?:automatically\s+)?(?:enrol|enroll|submit|share|buy|purchase|contract|accept)\b/i
    .test(combinedPublicMetadata);
  const agentCardRecord = asRecord(agentCard);
  const agentCardSafety = asRecord(agentCardRecord.safety_flags);
  const staticCardBoundary = agentCardRecord.status === "local_demo_only"
    && agentCardSafety.a2a_server === false
    && agentCardSafety.mcp_server === false
    && agentCardSafety.operational_endpoint === false;

  const checks: AgentInvitationValidationCheck[] = [
    check(
      "canonical_invitation_present",
      "Canonical invitation present",
      exists(AGENT_REVIEW_INVITATION_FILE)
        && invitationValidation.valid
        && invitationRecord.version === AGENT_REVIEW_INVITATION_VERSION
        && invitationRecord.mission === AGENT_REVIEW_INVITATION_MISSION
        && currentState.localOnly === true
        && currentState.nonProduction === true
        && requiredCapabilities.every((id) => capabilityIds.includes(id))
        && requiredNonCapabilities.every((id) => nonCapabilities.includes(id))
        && prohibitedInformation.every((item) => invitationProhibited.includes(item))
        && sensitiveFieldNamesAbsent
        && sensitiveInformationRequestAbsent
        && unsupportedClaimAbsent
        && unsupportedPositiveProseAbsent
        && autonomousAgentClaimAbsent
        && ardValidation.valid,
      compactErrors([...invitationValidation.errors, ...ardValidation.errors]),
    ),
    check(
      "agent_standing_route_present",
      "Agent Standing route present",
      routePresent(publicRoutes.agentStanding, "agent-standing-demo.html")
        && pathMentions(routes.verifiedAgentStanding, "verified-agent-standing"),
      "public demonstrator and technical documentation routes are declared",
    ),
    check(
      "human_authority_route_present",
      "Human Authority route present",
      routePresent(publicRoutes.humanAuthority, "human-authority-demo.html")
        && pathMentions(routes.humanAuthority, "verified-human-authority"),
      "public demonstrator and technical documentation routes are declared",
    ),
    check(
      "exact_action_gatepass_route_present",
      "Exact-action GatePass route present",
      pathMentions(publicRoutes.exactActionGatePass, "exact-action-gatepass")
        && pathMentions(routes.exactActionGatePass, "exact-action-gatepass"),
      "exact-action GatePass technical route is declared",
    ),
    check(
      "safe_scenario_schema_valid",
      "Safe scenario schema valid",
      exists(BRING_YOUR_AGENT_SCENARIO_SCHEMA)
        && scenarioTemplateValidation.valid
        && sensitiveFieldNamesAbsent
        && sensitiveInformationRequestAbsent,
      compactErrors(scenarioTemplateValidation.errors),
    ),
    check(
      "synthetic_example_valid",
      "Synthetic example valid",
      scenarioExampleValidation.valid
        && asRecord(scenarioExample).informationClassification === "fictional_synthetic"
        && !/Joey|Tesco|ALDI|Palo Alto Networks/i.test(JSON.stringify(scenarioExample)),
      compactErrors(scenarioExampleValidation.errors),
    ),
    check(
      "accountable_human_route_present",
      "Accountable-human route present",
      accountableHuman.required === true
        && accountableHuman.agentMayPrepareScenario === true
        && accountableHuman.agentMayShareScenarioAutonomously === false
        && accountableHuman.agentMayContractIndependently === false
        && contact.humanReviewed === true
        && contact.manualActivationRequired === true
        && contact.automaticSubmission === false
        && autonomousAgentClaimAbsent
        && publicCollectionAbsent,
      "manual accountable-human decision is required and no collection form or upload path exists",
    ),
    check(
      "paid_controlled_pilot_route_present",
      "Paid controlled pilot route present",
      paidPilot.status === "human_reviewed_enquiry_only"
        && paidPilot.humanReviewed === true
        && paidPilot.scopeSubjectToWrittenAgreement === true
        && paidPilot.automaticAcceptance === false
        && paidPilot.automaticAccessAfterPayment === false
        && paidPilot.productionWorkIncluded === false
        && paidPilot.initialEvaluationAcceptsLiveCredentials === false
        && paidPilot.initialEvaluationAcceptsCustomerData === false
        && accountableHuman.agentMayContractIndependently === false
        && autonomousAgentClaimAbsent,
      "commercial route is human reviewed, separately agreed, non-production and non-automatic",
    ),
    check(
      "live_a2a_claim_absent",
      "Live A2A claim absent",
      nonCapabilities.includes("live_a2a") && positiveLiveA2aClaimAbsent && staticCardBoundary,
      "A2A remains an explicit non-capability and the agent-card is static local metadata",
    ),
    check(
      "live_mcp_claim_absent",
      "Live MCP claim absent",
      nonCapabilities.includes("live_mcp") && positiveLiveMcpClaimAbsent && staticCardBoundary,
      "MCP remains an explicit non-capability and no MCP server is advertised",
    ),
    check(
      "hosted_api_claim_absent",
      "Hosted API claim absent",
      nonCapabilities.includes("hosted_gatepass_api")
        && currentState.hostedApi === false
        && positiveHostedApiClaimAbsent,
      "hosted GatePass API remains an explicit non-capability",
    ),
    check(
      "automatic_outreach_none",
      "Automatic outreach performed",
      currentState.automaticOutreach === false
        && contact.automaticSubmission === false
        && publicCollectionAbsent,
      "none",
    ),
    check(
      "external_agents_contacted_none",
      "External agents contacted",
      currentState.externalAgentsContacted === "none",
      "none",
    ),
    check(
      "external_actions_performed_none",
      "External actions performed",
      currentState.externalActionsPerformed === "none" && publicCollectionAbsent,
      "none",
    ),
  ];

  return {
    project: "Agent Trust Gate",
    mission: AGENT_REVIEW_INVITATION_MISSION,
    version: AGENT_REVIEW_INVITATION_VERSION,
    purpose: "Deterministic local validation of the static agent discovery and reviewer invitation pack",
    checks,
    automaticOutreachPerformed: "none",
    externalAgentsContacted: "none",
    externalActionsPerformed: "none",
    networkCalls: false,
    overallPassed: checks.every((candidate) => candidate.passed),
  };
}

export function renderAgentInvitationSummary(report: AgentInvitationValidationReport): string {
  const byId = (id: string) => report.checks.find((candidate) => candidate.id === id)?.passed === true;
  return [
    "ATG AGENT DISCOVERY AND INVITATION RESULT",
    "",
    `Canonical invitation present: ${passed(byId("canonical_invitation_present"))}`,
    `Agent Standing route present: ${passed(byId("agent_standing_route_present"))}`,
    `Human Authority route present: ${passed(byId("human_authority_route_present"))}`,
    `Exact-action GatePass route present: ${passed(byId("exact_action_gatepass_route_present"))}`,
    `Safe scenario schema valid: ${passed(byId("safe_scenario_schema_valid"))}`,
    `Synthetic example valid: ${passed(byId("synthetic_example_valid"))}`,
    `Accountable-human route present: ${passed(byId("accountable_human_route_present"))}`,
    `Paid controlled pilot route present: ${passed(byId("paid_controlled_pilot_route_present"))}`,
    `Live A2A claim absent: ${passed(byId("live_a2a_claim_absent"))}`,
    `Live MCP claim absent: ${passed(byId("live_mcp_claim_absent"))}`,
    `Hosted API claim absent: ${passed(byId("hosted_api_claim_absent"))}`,
    `Automatic outreach performed: ${byId("automatic_outreach_none") ? "none" : "UNEXPECTED"}`,
    `External agents contacted: ${byId("external_agents_contacted_none") ? "none" : "UNEXPECTED"}`,
    `External actions performed: ${byId("external_actions_performed_none") ? "none" : "UNEXPECTED"}`,
    `Overall: AGENT DISCOVERY AND INVITATION ACTIVATION ${report.overallPassed ? "PASSED" : "FAILED"}`,
  ].join("\n");
}

function read(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

function readJson(path: string): unknown {
  return JSON.parse(read(path)) as unknown;
}

function exists(path: string): boolean {
  return existsSync(join(root, path));
}

function schemaDefinesField(schemaPath: string, field: string): boolean {
  const schema = read(schemaPath);
  return new RegExp(`"${field.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"\\s*:`).test(schema);
}

function routePresent(value: unknown, suffix: string): boolean {
  return typeof value === "string"
    && value.startsWith("https://gareth1953.github.io/agent-trust-gate/")
    && value.endsWith(suffix)
    && exists(`discovery-site/${suffix}`);
}

function pathMentions(value: unknown, fragment: string): boolean {
  return typeof value === "string" && value.includes(fragment);
}

function check(id: string, label: string, passedValue: boolean, detail: string): AgentInvitationValidationCheck {
  return { id, label, passed: passedValue, detail };
}

function compactErrors(errors: readonly string[]): string {
  return errors.length === 0 ? "schema validation passed" : errors.slice(0, 4).join("; ");
}

function passed(value: boolean): "passed" | "FAILED" {
  return value ? "passed" : "FAILED";
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function recordArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.map(asRecord) : [];
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}
