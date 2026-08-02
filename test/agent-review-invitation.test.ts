import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import {
  AGENT_REVIEW_INVITATION_FILE,
  AGENT_REVIEW_INVITATION_SCHEMA,
  ARD_AI_CATALOG,
  ARD_AI_CATALOG_SCHEMA,
  BRING_YOUR_AGENT_SCENARIO_EXAMPLE,
  BRING_YOUR_AGENT_SCENARIO_SCHEMA,
  BRING_YOUR_AGENT_SCENARIO_TEMPLATE,
  renderAgentInvitationSummary,
  validateAgentInvitationPack,
} from "../src/agent-review-invitation.js";
import { runAgentInvitationCli } from "../src/agent-review-invitation-cli.js";
import { validateDiscoverySite } from "../src/discovery-site-validator.js";
import { validateJsonSchemaFile } from "../src/json-schema-validator.js";

const root = process.cwd();
const publicPages = [
  "discovery-site/index.html",
  "discovery-site/for-agents.html",
  "discovery-site/bring-your-agent-scenario.html",
  "discovery-site/agent-standing-demo.html",
  "discovery-site/human-authority-demo.html",
];

function read(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

function json(path: string): Record<string, unknown> {
  return JSON.parse(read(path)) as Record<string, unknown>;
}

function record(value: unknown): Record<string, unknown> {
  assert.equal(typeof value, "object");
  assert.notEqual(value, null);
  assert.equal(Array.isArray(value), false);
  return value as Record<string, unknown>;
}

test("canonical P3-M155 invitation validates against its closed versioned schema", () => {
  const invitation = json(AGENT_REVIEW_INVITATION_FILE);
  const result = validateJsonSchemaFile(AGENT_REVIEW_INVITATION_SCHEMA, invitation);
  assert.deepEqual(result.errors, []);
  assert.equal(result.valid, true);
  assert.equal(invitation.version, "atg.agent-review-invitation.v1");
  assert.equal(invitation.mission, "P3-M155");
});

test("invitation declares the correct static local-only state", () => {
  const state = record(json(AGENT_REVIEW_INVITATION_FILE).currentState);
  assert.equal(state.localOnly, true);
  assert.equal(state.nonProduction, true);
  assert.equal(state.staticPublicDiscovery, true);
  assert.equal(state.remoteInvocation, false);
  assert.equal(state.hostedApi, false);
  assert.equal(state.automaticOutreach, false);
  assert.equal(state.externalAgentsContacted, "none");
  assert.equal(state.externalActionsPerformed, "none");
});

test("invitation links Agent Standing, Human Authority and exact-action GatePass material", () => {
  const invitation = json(AGENT_REVIEW_INVITATION_FILE);
  const routes = JSON.stringify(record(invitation.routes));
  const publicRoutes = JSON.stringify(record(invitation.publicDemonstrationRoutes));
  assert.match(routes, /verified-agent-standing/);
  assert.match(routes, /verified-human-authority/);
  assert.match(routes, /exact-action-gatepass/);
  assert.match(publicRoutes, /agent-standing-demo\.html/);
  assert.match(publicRoutes, /human-authority-demo\.html/);
  assert.match(publicRoutes, /exact-action-gatepass/);
});

test("commercial and scenario contact require an accountable human", () => {
  const invitation = json(AGENT_REVIEW_INVITATION_FILE);
  const human = record(invitation.accountableHumanRequirement);
  const contact = record(invitation.contactRoute);
  const pilot = record(invitation.paidPilotRoute);
  assert.equal(human.required, true);
  assert.equal(human.agentMayPrepareScenario, true);
  assert.equal(human.agentMayShareScenarioAutonomously, false);
  assert.equal(human.agentMayContractIndependently, false);
  assert.equal(contact.humanReviewed, true);
  assert.equal(contact.automaticSubmission, false);
  assert.equal(pilot.humanReviewed, true);
  assert.equal(pilot.scopeSubjectToWrittenAgreement, true);
  assert.equal(pilot.automaticAcceptance, false);
  assert.equal(pilot.automaticAccessAfterPayment, false);
});

test("synthetic example and downloadable template validate against the scenario schema", () => {
  for (const path of [BRING_YOUR_AGENT_SCENARIO_EXAMPLE, BRING_YOUR_AGENT_SCENARIO_TEMPLATE]) {
    const result = validateJsonSchemaFile(BRING_YOUR_AGENT_SCENARIO_SCHEMA, json(path));
    assert.equal(result.valid, true, `${path}: ${result.errors.join("; ")}`);
  }
  const example = json(BRING_YOUR_AGENT_SCENARIO_EXAMPLE);
  assert.equal(example.informationClassification, "fictional_synthetic");
  assert.doesNotMatch(JSON.stringify(example), /Joey|Tesco|ALDI|Palo Alto Networks/i);
});

test("scenario schema uses integer minor units and bounded fields", () => {
  const schema = read(BRING_YOUR_AGENT_SCENARIO_SCHEMA);
  assert.match(schema, /"amountMinorUnits"/);
  assert.match(schema, /"type": \["integer", "null"\]/);
  assert.match(schema, /"maxLength"/);
  assert.match(schema, /"maxItems"/);
  assert.match(schema, /"additionalProperties": false/);
});

test("prohibited sensitive information guidance is complete and absent from accepted fields", () => {
  const invitation = json(AGENT_REVIEW_INVITATION_FILE);
  const prohibited = invitation.prohibitedInformation as string[];
  const accepted = JSON.stringify(invitation.acceptedInformation);
  for (const item of [
    "passwords", "api_keys", "wallet_seed_phrases", "card_details",
    "production_credentials", "production_tokens", "private_keys",
    "customer_personal_data", "medical_information", "confidential_commercial_data",
    "unrestricted_logs", "live_payment_instructions", "real_settlement_instructions",
    "production_endpoints",
  ]) {
    assert.ok(prohibited.includes(item), item);
    assert.doesNotMatch(accepted, new RegExp(`\\b${item}\\b`, "i"));
  }
  assert.match(read("discovery-site/bring-your-agent-scenario.html"), /Never include/i);
});

test("live A2A, live MCP and hosted API are declared non-capabilities", () => {
  const invitation = json(AGENT_REVIEW_INVITATION_FILE);
  const nonCapabilities = invitation.nonCapabilities as string[];
  assert.ok(nonCapabilities.includes("live_a2a"));
  assert.ok(nonCapabilities.includes("live_mcp"));
  assert.ok(nonCapabilities.includes("hosted_gatepass_api"));
  const card = json("agent-trust-gate.agent-card.json");
  assert.equal(card.metadata_kind, "static_discovery_readiness_metadata_not_an_a2a_agent_card");
  const flags = record(card.safety_flags);
  assert.equal(flags.a2a_server, false);
  assert.equal(flags.mcp_server, false);
  assert.equal(flags.operational_endpoint, false);
});

test("agent cannot automatically enrol, submit, purchase or contract", () => {
  const invitation = json(AGENT_REVIEW_INVITATION_FILE);
  const nonCapabilities = invitation.nonCapabilities as string[];
  const human = record(invitation.accountableHumanRequirement);
  const contact = record(invitation.contactRoute);
  assert.ok(nonCapabilities.includes("automatic_agent_enrolment"));
  assert.ok(nonCapabilities.includes("autonomous_message_submission"));
  assert.ok(nonCapabilities.includes("autonomous_commercial_acceptance"));
  assert.equal(human.agentMayContractIndependently, false);
  assert.equal(contact.automaticEnrolment, false);
  assert.equal(contact.automaticCommercialAcceptance, false);
});

test("public pages contain no form, upload, network, tracking, cookie or payment code", () => {
  const html = publicPages.map(read).join("\n");
  assert.doesNotMatch(html, /<form\b|<input\b[^>]*type=["']?file|<iframe\b/i);
  assert.doesNotMatch(html, /\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource|sendBeacon|\.submit\s*\(/i);
  assert.doesNotMatch(html, /gtag|googletagmanager|analytics\.js|document\.cookie|localStorage|sessionStorage/i);
  assert.doesNotMatch(html, /paypal|stripe|checkout\.com|payment[_-]?link/i);
});

test("public pages state the accountable-human and outcome boundaries", () => {
  const agentPage = read("discovery-site/for-agents.html");
  const scenarioPage = read("discovery-site/bring-your-agent-scenario.html");
  assert.match(agentPage, /Are you a software agent acting for a person, organisation or system\?/);
  assert.match(agentPage, /DISCOVER[\s\S]*TEST LOCALLY[\s\S]*HUMAN OWNER REVIEWS/);
  assert.match(scenarioPage, /An agent may prepare this scenario\. An accountable human must decide whether it is shared\./);
  assert.match(scenarioPage, /STANDING_VERIFIED/);
  assert.match(scenarioPage, /STANDING_REFUSED/);
  assert.match(scenarioPage, /STANDING_UNVERIFIABLE/);
});

test("ARD catalogue validates against the authoritative schema snapshot and remains static", () => {
  const catalogue = json(ARD_AI_CATALOG);
  const result = validateJsonSchemaFile(ARD_AI_CATALOG_SCHEMA, catalogue);
  assert.equal(result.valid, true, result.errors.join("; "));
  assert.equal(catalogue.specVersion, "1.0");
  const encoded = JSON.stringify(catalogue);
  assert.match(encoded, /application\/json/);
  assert.match(encoded, /static-review-invitation/);
  assert.doesNotMatch(encoded, /application\/(?:mcp|a2a)/i);
  assert.doesNotMatch(encoded, /"(?:a2aServer|mcpServer|hostedGatepassApi)":true/);
});

test("discovery site validator confirms all local public links", () => {
  const report = validateDiscoverySite();
  const linkCheck = report.checks.find((candidate) => candidate.id === "all_local_public_links_valid");
  assert.equal(linkCheck?.passed, true, linkCheck?.detail);
  assert.equal(report.valid, true, report.checks.filter((candidate) => !candidate.passed).map((candidate) => candidate.id).join(", "));
});

test("Pages workflow deploys every P3-M155 public asset", () => {
  const workflow = read(".github/workflows/deploy-discovery-pages.yml");
  for (const path of [
    "agent-trust-gate.agent-review-invitation.json",
    "schemas/agent-review-invitation.schema.json",
    "schemas/bring-your-agent-scenario.schema.json",
    "schemas/ard-ai-catalog-v1.0.schema.json",
    "examples/bring-your-agent-scenario.example.json",
    "for-agents.html",
    "bring-your-agent-scenario.html",
    "bring-your-agent-scenario.template.json",
    "ai-catalog.json",
  ]) assert.match(workflow, new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), path);
});

test("existing machine-discovery assets remain present and version-compatible", () => {
  for (const path of [
    "agent-trust-gate.discovery.json",
    "agent-trust-gate.agent-card.json",
    "agent-trust-gate.manifest.json",
    "llms.txt",
  ]) assert.equal(existsSync(join(root, path)), true, path);
  assert.equal(json("agent-trust-gate.discovery.json").formatVersion, "atg.machine-discovery.local.v1");
  assert.equal(json("agent-trust-gate.manifest.json").manifest_version, "atg.code-readable-integration.v1");
  assert.equal(json("package.json").version, "0.1.0");
});

test("deterministic invitation report and CLI expose required summary and JSON modes", () => {
  const report = validateAgentInvitationPack();
  assert.equal(report.overallPassed, true);
  const summary = renderAgentInvitationSummary(report);
  assert.match(summary, /^ATG AGENT DISCOVERY AND INVITATION RESULT/);
  assert.match(summary, /Overall: AGENT DISCOVERY AND INVITATION ACTIVATION PASSED/);
  const stdout: string[] = [];
  const stderr: string[] = [];
  assert.equal(runAgentInvitationCli(["--summary-only"], { stdout: (value) => stdout.push(value), stderr: (value) => stderr.push(value) }), 0);
  assert.match(stdout.join("\n"), /Canonical invitation present: passed/);
  stdout.length = 0;
  assert.equal(runAgentInvitationCli(["--json"], { stdout: (value) => stdout.push(value), stderr: (value) => stderr.push(value) }), 0);
  assert.equal((JSON.parse(stdout.join("\n")) as { overallPassed: boolean }).overallPassed, true);
  assert.deepEqual(stderr, []);
});

test("validator fails closed for false hosted, enrolment, contracting and sensitive-data claims", () => {
  const canonical = json(AGENT_REVIEW_INVITATION_FILE);

  const hosted = structuredClone(canonical);
  record(hosted.currentState).hostedApi = true;
  assert.equal(validateAgentInvitationPack({ invitation: hosted }).overallPassed, false);

  const enrolment = structuredClone(canonical);
  record(enrolment.contactRoute).automaticEnrolment = true;
  assert.equal(validateAgentInvitationPack({ invitation: enrolment }).overallPassed, false);

  const contracting = structuredClone(canonical);
  record(contracting.accountableHumanRequirement).agentMayContractIndependently = true;
  assert.equal(validateAgentInvitationPack({ invitation: contracting }).overallPassed, false);

  const sensitive = structuredClone(canonical);
  (sensitive.acceptedInformation as string[]).push("Please provide API keys for evaluation.");
  assert.equal(validateAgentInvitationPack({ invitation: sensitive }).overallPassed, false);

  const productionIdentity = structuredClone(canonical);
  (productionIdentity.claimsBoundary as string[])[0] = "ATG verifies production identities.";
  assert.equal(validateAgentInvitationPack({ invitation: productionIdentity }).overallPassed, false);

  const autonomousPurchase = structuredClone(canonical);
  (autonomousPurchase.claimsBoundary as string[])[0] = "An agent may purchase and contract for a pilot.";
  assert.equal(validateAgentInvitationPack({ invitation: autonomousPurchase }).overallPassed, false);
});

test("validator rejects a public data-collection form or runtime network code", () => {
  const report = validateAgentInvitationPack({
    publicHtml: ["<form><input type=\"file\"></form><script>fetch('/submit')</script>"],
  });
  assert.equal(report.overallPassed, false);
  assert.equal(report.checks.find((candidate) => candidate.id === "accountable_human_route_present")?.passed, false);
  assert.equal(report.checks.find((candidate) => candidate.id === "external_actions_performed_none")?.passed, false);
});
