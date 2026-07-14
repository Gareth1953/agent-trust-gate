import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import test from "node:test";

import {
  MACHINE_DISCOVERY_EXPECTED_PAGES_URL,
  getMachineDiscoveryRecord,
  getMachineDiscoveryReport,
  summariseMachineDiscovery,
} from "../src/machine-discovery.js";
import { validateDiscoverySite } from "../src/discovery-site-validator.js";

const root = process.cwd();
const oldEmail = ["legalintelligencerecruitment", "outlook.com"].join("@");
const expectedUrl = "https://gareth1953.github.io/agent-trust-gate/";
const workflowPath = ".github/workflows/deploy-discovery-pages.yml";
const activationDocs = [
  "docs/github-pages-passive-discovery-activation.md",
  "docs/passive-discovery-live-verification-checklist.md",
  "docs/repository-social-preview-upload.md",
  "docs/passive-discovery-activation-record-template.md",
  "docs/passive-discovery-activation-record.md",
];
const siteFiles = [
  "discovery-site/index.html",
  "discovery-site/404.html",
  "discovery-site/robots.txt",
  "discovery-site/sitemap.xml",
  "discovery-site/.nojekyll",
  "discovery-site/README.md",
];
const artifactFiles = [
  "agent-trust-gate.discovery.json",
  "agent-trust-gate.agent-card.json",
  "agent-trust-gate.manifest.json",
  "llms.txt",
];

function read(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

function readJson<T>(path: string): T {
  return JSON.parse(read(path)) as T;
}

function gitFiles(args: string[]): string[] {
  const result = spawnSync("git", args, { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.split(/\r?\n/).filter(Boolean);
}

function filesUnder(path: string): string[] {
  const fullPath = join(root, path);
  const files: string[] = [];
  for (const entry of readdirSync(fullPath)) {
    const child = join(path, entry);
    const childFullPath = join(root, child);
    if (statSync(childFullPath).isDirectory()) files.push(...filesUnder(child));
    else files.push(child.replace(/\\/g, "/"));
  }
  return files;
}

test("P3-M143 workflow and activation docs exist", () => {
  for (const path of [workflowPath, ...activationDocs, ...siteFiles]) {
    assert.equal(existsSync(join(root, path)), true, path);
  }
  const combinedDocs = activationDocs.map(read).join("\n");
  assert.match(combinedDocs, /active and verified/i);
  assert.match(combinedDocs, /HTTPS:\s*verified|HTTPS is active/i);
  assert.match(combinedDocs, /Gareth approval|Final human approver|manual/i);
  assert.match(combinedDocs, new RegExp(expectedUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

test("GitHub Pages workflow uses required actions permissions triggers and selected artifact files", () => {
  const workflow = read(workflowPath);
  for (const action of [
    "actions/checkout@v6",
    "actions/configure-pages@v5",
    "actions/upload-pages-artifact@v4",
    "actions/deploy-pages@v4",
  ]) {
    assert.match(workflow, new RegExp(action.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /branches:\s*\n\s*-\s*main/);
  assert.match(workflow, /paths:/);
  assert.match(workflow, /discovery-site\/\*\*/);
  assert.match(workflow, /agent-trust-gate\.discovery\.json/);
  assert.match(workflow, /contents:\s*read/);
  assert.match(workflow, /pages:\s*write/);
  assert.match(workflow, /id-token:\s*write/);
  assert.match(workflow, /concurrency:/);
  assert.match(workflow, /environment:\s*\n\s*name:\s*github-pages/);
  assert.match(workflow, /mkdir -p _site/);
  assert.match(workflow, /cp -R discovery-site\/\. _site\//);
  for (const file of artifactFiles) assert.match(workflow, new RegExp(`cp ${file.replace(/\./g, "\\.")} _site/`));
  assert.doesNotMatch(workflow, /cp -R \. _site/);
  assert.doesNotMatch(workflow, /secrets\./i);
  assert.doesNotMatch(workflow, /CNAME|custom domain/i);
});

test("static discovery site is accessible source with safe machine discovery metadata", () => {
  const html = read("discovery-site/index.html");
  const robots = read("discovery-site/robots.txt");
  const sitemap = read("discovery-site/sitemap.xml");
  assert.match(html, /<title>Agent Trust Gate - Passive GatePass Discovery<\/title>/);
  assert.match(html, /<meta name="description"/);
  assert.match(html, new RegExp(`rel="canonical" href="${expectedUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
  assert.match(html, /property="og:title"/);
  assert.match(html, /name="twitter:card"/);
  assert.match(html, /application\/ld\+json/);
  assert.match(html, /npm run demo:reviewer-kit/);
  assert.match(html, /GatePass is a scoped, time-bound, action-specific proof primitive for agent actions\./);
  assert.match(html, /Passive discovery site active/);
  assert.match(html, /Public machine-readable discovery route/);
  assert.match(html, /Hosted through GitHub Pages/i);
  assert.match(html, /No live A2A endpoint/);
  assert.match(html, /MCP server: not implemented/);
  assert.match(html, /agent-trust-gate\.discovery\.json/);
  assert.match(html, /llms\.txt/);
  assert.match(html, /agent-trust-gate\.agent-card\.json/);
  assert.match(html, /agent-trust-gate\.manifest\.json/);
  assert.match(html, /docs\/paid-pilot-commercial-entry\.md/);
  assert.match(html, /mailto:gpmiddleton71@gmail\.com/);
  assert.match(robots, new RegExp(`${expectedUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}sitemap\\.xml`));
  assert.match(sitemap, new RegExp(expectedUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

test("static discovery site contains no scripts forms analytics payment links media or custom domain", () => {
  const html = read("discovery-site/index.html");
  const allSiteText = siteFiles.map(read).join("\n");
  assert.doesNotMatch(html, /<script\b[^>]*\bsrc\s*=/i);
  assert.doesNotMatch(html, /<form\b/i);
  assert.doesNotMatch(html, /<iframe\b/i);
  assert.doesNotMatch(html, /<img\b/i);
  assert.doesNotMatch(html, /<video\b/i);
  assert.doesNotMatch(html, /gtag|googletagmanager|plausible|segment|mixpanel|document\.cookie|Set-Cookie|localStorage|sessionStorage|tracking\s*pixel|fingerprint/i);
  assert.doesNotMatch(allSiteText, /paypal\.com|stripe\.com|buy-now|payment-button/i);
  assert.equal(existsSync(join(root, "discovery-site", "CNAME")), false);
  const imageFiles = filesUnder("discovery-site").filter((file) => /\.(png|jpe?g|gif|webp|svg)$/i.test(file));
  assert.deepEqual(imageFiles, []);
});

test("discovery metadata reports active verified passive discovery without service inflation", () => {
  const record = getMachineDiscoveryRecord();
  assert.equal(record.githubPagesPassiveDiscovery.liveUrl, MACHINE_DISCOVERY_EXPECTED_PAGES_URL);
  assert.equal(record.githubPagesPassiveDiscovery.workflowPrepared, true);
  assert.equal(record.githubPagesPassiveDiscovery.deploymentMethod, "GitHub Actions");
  assert.equal(record.githubPagesPassiveDiscovery.deploymentWorkflowActive, true);
  assert.equal(record.githubPagesPassiveDiscovery.configured, true);
  assert.equal(record.githubPagesPassiveDiscovery.active, true);
  assert.equal(record.githubPagesPassiveDiscovery.publiclyReachable, true);
  assert.equal(record.githubPagesPassiveDiscovery.httpsVerified, true);
  assert.equal(record.githubPagesPassiveDiscovery.liveUrlVerified, true);
  assert.equal(record.githubPagesPassiveDiscovery.liveVerificationStatus, "verified");
  assert.equal(record.githubPagesPassiveDiscovery.activationSourceCommit, "4c68e1b9eef33505da3444f64d170eda1f32a046");
  assert.equal(record.githubPagesPassiveDiscovery.currentLiveStatusClaim, "active_public_https_verified_static_discovery");
  assert.equal(record.statuses.githubPagesWorkflowPrepared, true);
  assert.equal(record.statuses.githubPagesDeploymentWorkflowActive, true);
  assert.equal(record.statuses.githubPagesDeploymentActive, true);
  assert.equal(record.statuses.a2aServer, false);
  assert.equal(record.statuses.mcpServer, false);
  assert.equal(record.statuses.npmPublished, false);
  assert.equal(record.statuses.realActionExecution, false);
  assert.equal(record.statuses.realPaymentExecution, false);
  assert.equal(record.statuses.realSettlementExecution, false);

  const summary = summariseMachineDiscovery(record);
  assert.equal(summary.githubPagesWorkflowPrepared, true);
  assert.equal(summary.githubPagesDeploymentActive, true);
  assert.equal(summary.githubPagesHttpsVerified, true);

  const report = getMachineDiscoveryReport(record);
  assert.equal(report.safetyFlags.githubPagesWorkflowPrepared, true);
  assert.equal(report.safetyFlags.githubPagesDeploymentActive, true);
  assert.equal(report.pagesDiscovery.active, true);
  assert.match(report.safetyBoundary, /GitHub Pages passive discovery is active/);

  const fileRecord = readJson<ReturnType<typeof getMachineDiscoveryRecord>>("agent-trust-gate.discovery.json");
  assert.deepEqual(fileRecord, record);
  const example = readJson<ReturnType<typeof getMachineDiscoveryReport>>("examples/machine-discovery-report.json");
  assert.equal(example.safetyFlags.githubPagesWorkflowPrepared, true);
  assert.equal(example.safetyFlags.githubPagesDeploymentActive, true);
  assert.equal(example.pagesDiscovery.httpsVerified, true);
});

test("local discovery-site validator passes and compiled command runs", () => {
  const report = validateDiscoverySite();
  assert.equal(report.valid, true);
  assert.equal(report.localDemoOnly, true);
  assert.equal(report.networkCalls, false);
  assert.equal(report.githubPagesDeploymentActive, true);
  assert.equal(report.actionExecution, false);
  for (const check of report.checks) assert.equal(check.passed, true, check.id);

  const compiled = spawnSync(process.execPath, [resolve("dist/src/discovery-site-validator.js")], {
    encoding: "utf8",
  });
  assert.equal(compiled.status, 0, compiled.stderr);
  assert.match(compiled.stdout, /Agent Trust Gate discovery-site validation/);
});

test("README and metadata keep reviewer kit first and GatePass headline", () => {
  const readme = read("README.md");
  assert.ok(readme.indexOf("npm run demo:reviewer-kit") >= 0);
  assert.ok(readme.indexOf("npm run validate:discovery-site") > readme.indexOf("npm run demo:reviewer-kit"));
  assert.match(readme, /Public passive discovery site/i);
  assert.match(readme, /Active and verified/i);
  assert.match(readme, /GatePass remains the headline/);
  for (const path of activationDocs) assert.match(readme, new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

  const combined = [
    read("llms.txt"),
    read("agent-trust-gate.agent-card.json"),
    read("agent-trust-gate.manifest.json"),
  ].join("\n");
  assert.match(combined, /P3-M143/);
  assert.match(combined, /githubPagesDeploymentWorkflowPrepared"?\s*:?\s*(?:true|is true)/i);
  assert.match(combined, /githubPagesActive"?\s*:?\s*(?:true|is true)/i);
  assert.match(combined, /githubPagesHttpsVerified"?\s*:?\s*(?:true|is true)/i);
  assert.match(combined, /githubPagesDeployment"?\s*:?\s*(?:true|is true)/i);
});

test("package remains private and no operational endpoint or publication files are introduced", () => {
  const packageJson = readJson<{ version: string; private: boolean; scripts: Record<string, string> }>("package.json");
  assert.equal(packageJson.version, "0.1.0");
  assert.equal(packageJson.private, true);
  const validateScript = packageJson.scripts["validate:discovery-site"];
  if (typeof validateScript !== "string") throw new Error("validate:discovery-site script is missing");
  assert.match(validateScript, /discovery-site-validator\.js/);
  assert.equal(existsSync(join(root, ".well-known", "agent-card.json")), false);
  assert.equal(existsSync(join(root, "server.json")), false);
  assert.equal(existsSync(join(root, "discovery-site", "CNAME")), false);
});

test("tracked files contain approved contact and no old email", () => {
  const tracked = gitFiles(["ls-files"]);
  const combined = tracked
    .filter((file) => existsSync(join(root, file)))
    .map(read)
    .join("\n");
  assert.match(combined, /gpmiddleton71@gmail\.com/);
  assert.doesNotMatch(combined, new RegExp(oldEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
});
