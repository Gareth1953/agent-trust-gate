import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import test from "node:test";

import {
  MACHINE_DISCOVERY_CONTACT,
  MACHINE_DISCOVERY_FIRST_COMMAND,
  getMachineDiscoveryRecord,
  getMachineDiscoveryReport,
  summariseMachineDiscovery,
  validateMachineDiscoveryRecord,
  type MachineDiscoveryRecord,
  type MachineDiscoveryReport,
} from "../src/machine-discovery.js";
import {
  runMachineDiscoveryCli,
  type MachineDiscoveryCliIo,
} from "../src/machine-discovery-cli.js";

const root = process.cwd();
const contactEmail = "gpmiddleton71@gmail.com";
const oldEmail = ["legalintelligencerecruitment", "outlook.com"].join("@");
const docs = [
  "docs/machine-discovery-and-registry-readiness.md",
  "docs/machine-readable-entry-points.md",
  "docs/github-pages-discovery-readiness.md",
  "docs/a2a-discovery-readiness-boundary.md",
  "docs/mcp-registry-readiness-boundary.md",
  "docs/npm-publication-readiness.md",
  "docs/registry-readiness-scorecard.md",
];
const staticFiles = [
  "discovery-site/index.html",
  "discovery-site/README.md",
  "discovery-site/robots.txt",
  "discovery-site/.nojekyll",
];
const corePhrases = [
  "GatePass is a scoped, time-bound, action-specific proof primitive for agent actions.",
  "No signed GatePass. No settlement.",
  "Do not trust the agent. Trust the GatePass.",
  "No proof. No permission.",
  "No mandate. No action.",
];

function read(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

function readJson<T>(path: string): T {
  return JSON.parse(read(path)) as T;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function jsonFilesUnder(path: string): string[] {
  const full = join(root, path);
  const files: string[] = [];
  for (const entry of readdirSync(full)) {
    const child = join(path, entry);
    const childFull = join(root, child);
    if (statSync(childFull).isDirectory()) files.push(...jsonFilesUnder(child));
    else if (entry.endsWith(".json")) files.push(child);
  }
  return files;
}

function gitFiles(args: string[]): string[] {
  const result = spawnSync("git", args, { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.split(/\r?\n/).filter(Boolean);
}

function assertInactiveDiscovery(record: MachineDiscoveryRecord): void {
  assert.equal(record.statuses.nonProduction, true);
  assert.equal(record.statuses.manualInputOnly, true);
  assert.equal(record.statuses.humanApprovalRequired, true);
  assert.equal(record.statuses.localOnlyEvaluation, true);
  assert.equal(record.statuses.realActionExecution, false);
  assert.equal(record.statuses.realPaymentExecution, false);
  assert.equal(record.statuses.realSettlementExecution, false);
  assert.equal(record.statuses.a2aServer, false);
  assert.equal(record.statuses.mcpServer, false);
  assert.equal(record.statuses.npmPublished, false);
  assert.equal(record.statuses.githubPagesDeploymentActive, false);
  assert.equal(record.statuses.authenticationActive, false);
  assert.equal(record.statuses.networkEndpointActive, false);
  assert.equal(record.statuses.autonomousOutreach, false);
  assert.equal(record.statuses.directBotMessaging, false);
  assert.equal(record.statuses.liveAgentToAgentCommunication, false);
  assert.equal(record.statuses.scraping, false);
  assert.equal(record.statuses.analyticsTracking, false);
  assert.equal(record.statuses.cookies, false);
  assert.equal(record.statuses.paymentLinks, false);
  assert.equal(record.statuses.checkout, false);
  assert.equal(record.statuses.productionSigning, false);
  assert.equal(record.statuses.productionCertification, false);
  assert.equal(record.statuses.securityCertification, false);
  assert.equal(record.statuses.legalComplianceGuarantee, false);
}

function assertReportSafety(report: MachineDiscoveryReport): void {
  assert.equal(report.inactiveStatuses.a2aServer, false);
  assert.equal(report.inactiveStatuses.mcpServer, false);
  assert.equal(report.inactiveStatuses.npmPublication, false);
  assert.equal(report.inactiveStatuses.githubPagesDeployment, false);
  assert.equal(report.inactiveStatuses.realActionExecution, false);
  assert.equal(report.inactiveStatuses.livePaymentExecution, false);
  assert.equal(report.inactiveStatuses.realSettlementExecution, false);
  assert.equal(report.inactiveStatuses.networkEndpoint, false);
  assert.equal(report.safetyFlags.localDemoOnly, true);
  assert.equal(report.safetyFlags.manualInputOnly, true);
  assert.equal(report.safetyFlags.humanApprovalRequired, true);
  assert.equal(report.safetyFlags.nonProduction, true);
  assert.equal(report.safetyFlags.realToolExecution, false);
  assert.equal(report.safetyFlags.actionExecution, false);
  assert.equal(report.safetyFlags.networkCalls, false);
  assert.equal(report.safetyFlags.liveApi, false);
  assert.equal(report.safetyFlags.a2aServer, false);
  assert.equal(report.safetyFlags.mcpServer, false);
  assert.equal(report.safetyFlags.npmPublished, false);
  assert.equal(report.safetyFlags.githubPagesDeploymentActive, false);
  assert.equal(report.safetyFlags.livePaymentProcessing, false);
  assert.equal(report.safetyFlags.settlementExecution, false);
  assert.equal(report.safetyFlags.productionSigning, false);
  assert.equal(report.safetyFlags.productionCertification, false);
  assert.equal(report.safetyFlags.securityCertification, false);
  assert.equal(report.safetyFlags.legalComplianceGuarantee, false);
}

test("machine discovery docs static source example README links and package command exist", () => {
  const readme = read("README.md");
  for (const path of [
    "agent-trust-gate.discovery.json",
    ...docs,
    ...staticFiles,
    "examples/machine-discovery-report.json",
  ]) {
    assert.equal(existsSync(join(root, path)), true, path);
  }
  for (const path of [
    "agent-trust-gate.discovery.json",
    ...docs,
    "examples/machine-discovery-report.json",
  ]) {
    assert.match(readme, new RegExp(escapeRegExp(path)), path);
  }
  assert.match(readme, /Machine and Developer Discovery/);
  assert.match(readme, /npm run demo:discovery/);
  assert.match(read("package.json"), /demo:discovery/);
});

test("reviewer kit remains the first recommended README command", () => {
  const readme = read("README.md");
  const firstReviewerKit = readme.indexOf(MACHINE_DISCOVERY_FIRST_COMMAND);
  const firstDiscovery = readme.indexOf("npm run demo:discovery");
  assert.ok(firstReviewerKit >= 0);
  assert.ok(firstDiscovery > firstReviewerKit);
});

test("canonical discovery JSON matches deterministic model and inactive statuses", () => {
  const fromFile = readJson<MachineDiscoveryRecord>("agent-trust-gate.discovery.json");
  const fromModel = getMachineDiscoveryRecord();
  assert.deepEqual(fromFile, fromModel);
  assert.equal(fromFile.publicContactEmail, MACHINE_DISCOVERY_CONTACT);
  assert.equal(fromFile.headlineProductConcept, "GatePass");
  assert.equal(fromFile.reviewerKit.command, MACHINE_DISCOVERY_FIRST_COMMAND);
  assert.equal(fromFile.paidPilot.indicativeStartingPriceGbp, 1500);
  assert.equal(fromFile.inactiveIntegrationStatus.a2aServerStatus, "not_implemented_no_live_a2a_server_no_endpoint");
  assert.equal(fromFile.inactiveIntegrationStatus.mcpServerStatus, "not_implemented_no_live_mcp_server_no_tools");
  assert.equal(fromFile.inactiveIntegrationStatus.npmPublicationStatus, "not_published_package_private");
  assert.equal(fromFile.inactiveIntegrationStatus.githubPagesDeploymentStatus, "prepared_but_inactive_static_source_only");
  assertInactiveDiscovery(fromFile);
});

test("machine discovery report and summary preserve discovery boundaries", () => {
  const report = getMachineDiscoveryReport();
  assertReportSafety(report);
  assert.equal(report.publicContact, contactEmail);
  assert.equal(report.recommendedFirstCommand, MACHINE_DISCOVERY_FIRST_COMMAND);
  assert.equal(report.readinessSummary.githubTopics, "Active - added manually through GitHub");
  assert.equal(report.readinessSummary.a2aServerReadiness, "Not implemented");
  assert.equal(report.readinessSummary.mcpRegistryReadiness, "Not implemented");
  assert.equal(report.readinessSummary.npmPublicationReadiness, "Requires explicit approval");
  assert.match(report.safetyBoundary, /No live endpoint/);

  const summary = summariseMachineDiscovery();
  assert.equal(summary.a2aServer, false);
  assert.equal(summary.mcpServer, false);
  assert.equal(summary.npmPublished, false);
  assert.equal(summary.githubPagesDeploymentActive, false);
  assert.equal(summary.realActionExecution, false);
  assert.equal(summary.realPaymentExecution, false);
  assert.equal(summary.realSettlementExecution, false);
});

test("local machine discovery validator passes required checks", () => {
  const validation = validateMachineDiscoveryRecord();
  assert.equal(validation.valid, true);
  assert.ok(validation.checks.length >= 6);
  for (const check of validation.checks) assert.equal(check.passed, true, check.id);
});

test("machine discovery CLI supports summary-only and JSON-only output", () => {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const io: MachineDiscoveryCliIo = {
    stdout: (value) => stdout.push(value),
    stderr: (value) => stderr.push(value),
  };
  assert.equal(runMachineDiscoveryCli(["--summary-only"], io), 0);
  assert.equal(stderr.length, 0);
  assert.match(stdout[0] ?? "", /Agent Trust Gate machine discovery/);
  assert.doesNotMatch(stdout[0] ?? "", /machine-readable entry points:/);

  const compiled = spawnSync(process.execPath, [
    resolve("dist/src/machine-discovery-cli.js"),
    "--json",
  ], { encoding: "utf8" });
  assert.equal(compiled.status, 0, compiled.stderr);
  assert.equal(compiled.stderr, "");
  const parsed = JSON.parse(compiled.stdout) as MachineDiscoveryReport;
  assertReportSafety(parsed);
  assert.equal(parsed.recommendedFirstCommand, MACHINE_DISCOVERY_FIRST_COMMAND);
});

test("machine-readable discovery report example is aligned and safe", () => {
  const example = readJson<MachineDiscoveryReport>("examples/machine-discovery-report.json");
  assertReportSafety(example);
  assert.equal(example.sourceRecord, "agent-trust-gate.discovery.json");
  assert.equal(example.publicContact, contactEmail);
  assert.equal(example.paidPilot.indicativeStartingPriceGbp, 1500);
  assert.equal(example.readinessSummary.githubTopics, "Active - added manually through GitHub");
});

test("static discovery site has no external scripts analytics tracking forms or checkout", () => {
  const html = read("discovery-site/index.html");
  assert.match(html, /application\/ld\+json/);
  assert.doesNotMatch(html, /<script\b(?![^>]*type="application\/ld\+json")[^>]*>/i);
  assert.doesNotMatch(html, /<script[^>]+src=/i);
  assert.doesNotMatch(html, /<form\b/i);
  assert.doesNotMatch(html, /analytics|gtag|googletagmanager|facebook|pixel|segment|plausible|cookie/i);
  assert.doesNotMatch(html, /checkout|payment link|payment button/i);
  assert.doesNotMatch(html, /https?:\/\/(?!schema\.org|github\.com\/Gareth1953\/agent-trust-gate)/i);
  assert.match(html, /No live A2A server/);
  assert.match(html, /MCP server: not implemented/);
  assert.match(read("discovery-site/README.md"), /prepared but inactive/);
});

test("A2A MCP npm Pages and registry boundaries remain inactive", () => {
  assert.equal(existsSync(join(root, ".well-known", "agent-card.json")), false);
  assert.equal(existsSync(join(root, "server.json")), false);
  assert.equal(existsSync(join(root, ".github", "workflows", "pages.yml")), false);
  assert.equal(existsSync(join(root, ".github", "workflows", "pages.yaml")), false);
  assert.match(read("docs/a2a-discovery-readiness-boundary.md"), /no live A2A server/i);
  assert.match(read("docs/mcp-registry-readiness-boundary.md"), /not currently an MCP server/i);
  assert.match(read("docs/npm-publication-readiness.md"), /remain private/i);
  assert.match(read("docs/github-pages-discovery-readiness.md"), /prepared but inactive/i);
});

test("metadata records P3-M142 and core discovery boundaries", () => {
  const combined = [
    read("README.md"),
    read("llms.txt"),
    read("agent-trust-gate.manifest.json"),
    read("agent-trust-gate.agent-card.json"),
    ...docs.map(read),
  ].join("\n");

  assert.match(combined, /P3-M142/);
  assert.match(combined, /Machine Discovery and Registry Readiness/i);
  assert.match(combined, /GatePass remains (?:the )?headline/i);
  assert.match(combined, /Agent Trust Language remains supporting material/i);
  assert.match(combined, /reviewer kit remains the recommended first/i);
  assert.match(combined, /Paid Evaluation Pilot/);
  assert.match(combined, /£1,500/);
  assert.match(combined, /GitHub topics.*manual/i);
  assert.match(combined, new RegExp(escapeRegExp(contactEmail)));
  for (const phrase of corePhrases) assert.match(combined, new RegExp(escapeRegExp(phrase)));
  assert.doesNotMatch(combined, new RegExp(escapeRegExp(oldEmail), "i"));
});

test("machine discovery docs introduce no forbidden operational claims", () => {
  const combined = [
    read("README.md"),
    read("agent-trust-gate.discovery.json"),
    ...docs.map(read),
    read("examples/machine-discovery-report.json"),
    read("discovery-site/index.html"),
  ].join("\n");
  const forbidden = [
    /\bATG is a live A2A agent\b/i,
    /\blive A2A endpoint is active\b/i,
    /\bMCP server is active\b/i,
    /\b(?:is|are|has been|have been) listed in the MCP Registry\b/i,
    /\b(?:is|are|has been|have been) published on npm\b/i,
    /\bGitHub Pages (?:is|are|has been|have been) active\b/i,
    /\bautonomously contacts agents\b/i,
    /\bexecutes real tools\b/i,
    /\bcontrols real agents\b/i,
    /\bguarantees safety\b/i,
    /\bguarantees compliance\b/i,
    /\bperforms real settlement\b/i,
    /\bprotects live payments\b/i,
    /\bproduction-grade cryptography is active\b/i,
    /\bregistration or publication has occurred\b/i,
    /\bPayPal API integration (?:is|has been) (?:implemented|enabled|provided|configured)\b/i,
    /\bStripe integration (?:is|has been) (?:implemented|enabled|provided|configured)\b/i,
    /\bcheckout (?:is|has been) (?:implemented|enabled|provided|configured)\b/i,
    /\bpayment links? (?:are|is|have been|has been) (?:implemented|enabled|provided|configured)\b/i,
  ];
  for (const pattern of forbidden) assert.doesNotMatch(combined, pattern);
});

test("package version private status scripts and exports remain correct", () => {
  const packageJson = readJson<{ version: string; private: boolean; scripts: Record<string, string> }>("package.json");
  assert.equal(packageJson.version, "0.1.0");
  assert.equal(packageJson.private, true);
  const demoScript = packageJson.scripts["demo:discovery"];
  if (typeof demoScript !== "string") throw new Error("demo:discovery script is missing");
  assert.match(demoScript, /machine-discovery-cli\.js/);
  assert.match(read("src/index.ts"), /machine-discovery/);
});

test("all repository JSON examples schemas and metadata remain valid", () => {
  const files = [
    ...jsonFilesUnder("examples"),
    ...jsonFilesUnder("schemas"),
    "agent-trust-gate.manifest.json",
    "agent-trust-gate.agent-card.json",
    "agent-trust-gate.discovery.json",
  ];
  for (const file of files) assert.doesNotThrow(() => readJson<unknown>(file), file);
});

test("old public email is absent from tracked files", () => {
  const tracked = gitFiles(["ls-files"]);
  for (const file of tracked) {
    if (!existsSync(join(root, file))) continue;
    const content = read(file);
    assert.doesNotMatch(content, new RegExp(escapeRegExp(oldEmail), "i"), file);
  }
});
