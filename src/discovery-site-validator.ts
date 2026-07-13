import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import {
  MACHINE_DISCOVERY_CONTACT,
  MACHINE_DISCOVERY_EXPECTED_PAGES_URL,
  MACHINE_DISCOVERY_PAGES_BASE_PATH,
  MACHINE_DISCOVERY_PAGES_WORKFLOW,
} from "./machine-discovery.js";

export interface DiscoverySiteValidationCheck {
  id: string;
  passed: boolean;
  detail: string;
}

export interface DiscoverySiteValidationReport {
  project: "Agent Trust Gate";
  purpose: "Local static discovery-site validation";
  expectedPagesUrl: typeof MACHINE_DISCOVERY_EXPECTED_PAGES_URL;
  basePath: typeof MACHINE_DISCOVERY_PAGES_BASE_PATH;
  workflow: typeof MACHINE_DISCOVERY_PAGES_WORKFLOW;
  valid: boolean;
  localDemoOnly: true;
  networkCalls: false;
  githubPagesDeploymentActive: false;
  actionExecution: false;
  checks: readonly DiscoverySiteValidationCheck[];
}

const root = process.cwd();
const requiredSiteFiles = [
  "discovery-site/index.html",
  "discovery-site/404.html",
  "discovery-site/robots.txt",
  "discovery-site/sitemap.xml",
  "discovery-site/.nojekyll",
  "discovery-site/README.md",
] as const;
const requiredArtifactFiles = [
  "agent-trust-gate.discovery.json",
  "agent-trust-gate.agent-card.json",
  "agent-trust-gate.manifest.json",
  "llms.txt",
] as const;
const workflowActions = [
  "actions/checkout@v6",
  "actions/configure-pages@v5",
  "actions/upload-pages-artifact@v4",
  "actions/deploy-pages@v4",
] as const;

export function validateDiscoverySite(): DiscoverySiteValidationReport {
  const indexHtml = read("discovery-site/index.html");
  const notFoundHtml = read("discovery-site/404.html");
  const robotsTxt = read("discovery-site/robots.txt");
  const sitemapXml = read("discovery-site/sitemap.xml");
  const workflow = read(MACHINE_DISCOVERY_PAGES_WORKFLOW);
  const workflowUses = Array.from(workflow.matchAll(/uses:\s*([^\s]+)/g), (match) => match[1] ?? "");
  const allowedWorkflowActions = new Set<string>(workflowActions);
  const links = extractLinks(indexHtml);
  const jsonLdValues = extractJsonLd(indexHtml);
  const parsedJsonLd = jsonLdValues.map((value) => JSON.parse(value) as unknown);
  const trackedPaths = listFiles(".");
  const checks: DiscoverySiteValidationCheck[] = [
    {
      id: "required_files",
      passed: [...requiredSiteFiles, ...requiredArtifactFiles, MACHINE_DISCOVERY_PAGES_WORKFLOW].every((path) =>
        existsSync(join(root, path))
      ),
      detail: "required discovery-site, metadata, and workflow files exist",
    },
    {
      id: "index_at_artifact_root",
      passed: workflow.includes("cp -R discovery-site/. _site/") &&
        workflow.includes("test -f _site/index.html"),
      detail: "workflow copies discovery-site contents so index.html is at the Pages artifact root",
    },
    {
      id: "selected_artifact_files_only",
      passed: requiredArtifactFiles.every((file) => workflow.includes(`cp ${file} _site/`)) &&
        workflow.includes("test ! -e _site/.git") &&
        workflow.includes("test ! -e _site/.github") &&
        !workflow.includes("cp -R . _site"),
      detail: "workflow copies selected static files and excludes repository internals",
    },
    {
      id: "official_github_actions_only",
      passed: workflowActions.every((action) => workflowUses.includes(action)) &&
        workflowUses.every((action) => allowedWorkflowActions.has(action)),
      detail: "workflow uses only the required official GitHub-owned actions and versions",
    },
    {
      id: "minimal_pages_permissions",
      passed: /contents:\s*read/.test(workflow) &&
        /pages:\s*write/.test(workflow) &&
        /id-token:\s*write/.test(workflow),
      detail: "workflow declares the minimum Pages permissions required for deployment",
    },
    {
      id: "json_ld_parses",
      passed: parsedJsonLd.length >= 1,
      detail: "index.html includes valid JSON-LD metadata",
    },
    {
      id: "expected_base_path",
      passed: indexHtml.includes(MACHINE_DISCOVERY_EXPECTED_PAGES_URL) &&
        notFoundHtml.includes(MACHINE_DISCOVERY_PAGES_BASE_PATH) &&
        sitemapXml.includes(MACHINE_DISCOVERY_EXPECTED_PAGES_URL) &&
        robotsTxt.includes(`${MACHINE_DISCOVERY_EXPECTED_PAGES_URL}sitemap.xml`),
      detail: "canonical URL, 404 link, robots.txt, and sitemap use the expected Pages project path",
    },
    {
      id: "required_links",
      passed: [
        "https://github.com/Gareth1953/agent-trust-gate",
        "https://github.com/Gareth1953/agent-trust-gate/blob/main/README.md",
        "https://github.com/Gareth1953/agent-trust-gate/blob/main/docs/one-command-reviewer-demo-kit.md",
        "https://github.com/Gareth1953/agent-trust-gate/blob/main/docs/paid-pilot-commercial-entry.md",
        "agent-trust-gate.discovery.json",
        "llms.txt",
        "agent-trust-gate.agent-card.json",
        "agent-trust-gate.manifest.json",
        `mailto:${MACHINE_DISCOVERY_CONTACT}`,
      ].every((href) => links.includes(href)),
      detail: "index.html links to repository, reviewer kit, paid pilot, metadata files, and public contact email",
    },
    {
      id: "no_external_scripts_or_assets",
      passed: !/<script\b[^>]*\bsrc\s*=/i.test(indexHtml) &&
        !/<link\b[^>]*\brel=["']?stylesheet["']?[^>]*https?:\/\//i.test(indexHtml) &&
        !/<img\b/i.test(indexHtml) &&
        !/<video\b/i.test(indexHtml),
      detail: "static site has no external JavaScript, external fonts, third-party images, or embedded video",
    },
    {
      id: "no_forms_iframes_or_chat",
      passed: !/<form\b/i.test(indexHtml) &&
        !/<iframe\b/i.test(indexHtml) &&
        !/live\s*chat|newsletter|signup/i.test(indexHtml),
      detail: "static site has no forms, iframes, live chat, or newsletter signup",
    },
    {
      id: "no_tracking_or_cookies",
      passed: !/gtag|googletagmanager|plausible|segment|mixpanel|analytics\.js|tracking\s*pixel|document\.cookie|Set-Cookie|localStorage|sessionStorage|fingerprint/i.test(indexHtml),
      detail: "static site has no analytics, tracking pixels, cookie code, storage code, or fingerprinting code",
    },
    {
      id: "no_payment_or_checkout_links",
      passed: links.every((href) => !/paypal|stripe|checkout|payment|invoice/i.test(href)),
      detail: "static site has no checkout, payment, PayPal, Stripe, or invoice URLs",
    },
    {
      id: "no_unsupported_operational_claims",
      passed: [
        /\blive A2A endpoint is active\b/i,
        /\bMCP server is active\b/i,
        /\bproduction ready\b/i,
        /\bguaranteed safety\b/i,
        /\bguaranteed compliance\b/i,
        /\breal payment protection\b/i,
        /\bsettlement execution is active\b/i,
      ].every((pattern) => !pattern.test(indexHtml)),
      detail: "static site avoids live endpoint, production, guarantee, payment, and settlement claims",
    },
    {
      id: "machine_readable_json_valid",
      passed: requiredArtifactFiles
        .filter((file) => file.endsWith(".json"))
        .every((file) => canParseJson(read(file))),
      detail: "machine-readable JSON files included in the Pages artifact remain valid",
    },
    {
      id: "no_cname_or_well_known_endpoint",
      passed: !existsSync(join(root, "discovery-site", "CNAME")) &&
        !trackedPaths.some((path) => path.includes(".well-known/agent-card.json")),
      detail: "static source does not add a custom domain or operational .well-known A2A endpoint",
    },
  ];

  return {
    project: "Agent Trust Gate",
    purpose: "Local static discovery-site validation",
    expectedPagesUrl: MACHINE_DISCOVERY_EXPECTED_PAGES_URL,
    basePath: MACHINE_DISCOVERY_PAGES_BASE_PATH,
    workflow: MACHINE_DISCOVERY_PAGES_WORKFLOW,
    valid: checks.every((check) => check.passed),
    localDemoOnly: true,
    networkCalls: false,
    githubPagesDeploymentActive: false,
    actionExecution: false,
    checks,
  };
}

export function renderDiscoverySiteValidation(report: DiscoverySiteValidationReport): string {
  return [
    "Agent Trust Gate discovery-site validation",
    `expected Pages URL: ${report.expectedPagesUrl}`,
    `workflow: ${report.workflow}`,
    `valid: ${report.valid}`,
    "",
    ...report.checks.map((check) => `- ${check.id}: ${check.passed ? "pass" : "fail"} - ${check.detail}`),
    "",
    JSON.stringify({
      valid: report.valid,
      localDemoOnly: report.localDemoOnly,
      networkCalls: report.networkCalls,
      githubPagesDeploymentActive: report.githubPagesDeploymentActive,
      actionExecution: report.actionExecution,
    }, null, 2),
  ].join("\n");
}

function read(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

function extractJsonLd(html: string): string[] {
  return Array.from(
    html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi),
    (match) => match[1]?.trim() ?? "",
  ).filter(Boolean);
}

function extractLinks(html: string): string[] {
  return Array.from(
    html.matchAll(/\bhref=["']([^"']+)["']/gi),
    (match) => match[1] ?? "",
  ).filter(Boolean);
}

function canParseJson(value: string): boolean {
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
}

function listFiles(path: string): string[] {
  const fullPath = join(root, path);
  if (!existsSync(fullPath)) return [];
  const files: string[] = [];
  for (const entry of readdirSync(fullPath)) {
    if (entry === ".git" || entry === "node_modules" || entry === "dist") continue;
    const child = join(path, entry);
    const childFullPath = join(root, child);
    if (statSync(childFullPath).isDirectory()) files.push(...listFiles(child));
    else files.push(child.replace(/\\/g, "/"));
  }
  return files;
}

if (require.main === module) {
  const report = validateDiscoverySite();
  console.log(renderDiscoverySiteValidation(report));
  process.exitCode = report.valid ? 0 : 1;
}
