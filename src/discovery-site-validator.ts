import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";

import {
  MACHINE_DISCOVERY_EXPECTED_PAGES_URL,
  MACHINE_DISCOVERY_PAGES_WORKFLOW,
} from "./machine-discovery.js";

const DISCOVERY_SITE_PUBLIC_URL = "https://agenttrustgate.com/" as const;
const DISCOVERY_SITE_BASE_PATH = "/" as const;
const DISCOVERY_SITE_CONTACT = "gareth@agenttrustgate.com" as const;

export interface DiscoverySiteValidationCheck {
  id: string;
  passed: boolean;
  detail: string;
}

export interface DiscoverySiteValidationReport {
  project: "Agent Trust Gate";
  purpose: "Local static discovery-site validation";
  expectedPagesUrl: typeof DISCOVERY_SITE_PUBLIC_URL;
  basePath: typeof DISCOVERY_SITE_BASE_PATH;
  workflow: typeof MACHINE_DISCOVERY_PAGES_WORKFLOW;
  valid: boolean;
  localDemoOnly: true;
  networkCalls: false;
  githubPagesDeploymentActive: true;
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
  "discovery-site/company.html",
  "discovery-site/contact.html",
  "discovery-site/corporate.css",
  "discovery-site/corporate.js",
  "discovery-site/evidence.html",
  "discovery-site/privacy.html",
  "discovery-site/solutions.html",
  "discovery-site/technology.html",
  "discovery-site/for-agents.html",
  "discovery-site/bring-your-agent-scenario.html",
  "discovery-site/bring-your-agent-scenario.template.json",
  "discovery-site/ai-catalog.json",
  "discovery-site/exact-action-authority-control-model.html",
  "discovery-site/evidence-and-reviewer.html",
  "discovery-site/retail-supply-chain-ai-agent-authority.html",
  "discovery-site/public-procurement-ai-agent-authority.html",
  "discovery-site/financial-services-ai-agent-authority.html",
  "discovery-site/agent-standing-demo.html",
  "discovery-site/human-authority-demo.html",
  "discovery-site/google8583929aeb1cff63.html",
  "discovery-site/a7f3c9e14d8b42f6a1c75e9d2b6048cf.txt",
] as const;
const requiredArtifactFiles = [
  "agent-trust-gate.discovery.json",
  "agent-trust-gate.agent-card.json",
  "agent-trust-gate.manifest.json",
  "agent-trust-gate.agent-review-invitation.json",
  "schemas/agent-review-invitation.schema.json",
  "schemas/bring-your-agent-scenario.schema.json",
  "schemas/ard-ai-catalog-v1.0.schema.json",
  "examples/bring-your-agent-scenario.example.json",
  "llms.txt",
] as const;
const publicHtmlFiles = [
  "discovery-site/index.html",
  "discovery-site/404.html",
  "discovery-site/company.html",
  "discovery-site/contact.html",
  "discovery-site/evidence.html",
  "discovery-site/privacy.html",
  "discovery-site/solutions.html",
  "discovery-site/technology.html",
  "discovery-site/for-agents.html",
  "discovery-site/bring-your-agent-scenario.html",
  "discovery-site/exact-action-authority-control-model.html",
  "discovery-site/evidence-and-reviewer.html",
  "discovery-site/retail-supply-chain-ai-agent-authority.html",
  "discovery-site/public-procurement-ai-agent-authority.html",
  "discovery-site/financial-services-ai-agent-authority.html",
  "discovery-site/agent-standing-demo.html",
  "discovery-site/human-authority-demo.html",
] as const;
const seoPublicHtmlFiles = [
  "discovery-site/index.html",
  "discovery-site/exact-action-authority-control-model.html",
  "discovery-site/evidence-and-reviewer.html",
  "discovery-site/retail-supply-chain-ai-agent-authority.html",
  "discovery-site/public-procurement-ai-agent-authority.html",
  "discovery-site/financial-services-ai-agent-authority.html",
  "discovery-site/agent-standing-demo.html",
  "discovery-site/human-authority-demo.html",
] as const;
const googleVerificationFile = "discovery-site/google8583929aeb1cff63.html" as const;
const googleVerificationValue = "google-site-verification: google8583929aeb1cff63.html" as const;
const indexNowKeyFile = "discovery-site/a7f3c9e14d8b42f6a1c75e9d2b6048cf.txt" as const;
const indexNowKey = "a7f3c9e14d8b42f6a1c75e9d2b6048cf" as const;
const workflowActions = [
  "actions/checkout@v6",
  "actions/configure-pages@v5",
  "actions/upload-pages-artifact@v4",
  "actions/deploy-pages@v4",
] as const;

export function validateDiscoverySite(): DiscoverySiteValidationReport {
  const indexHtml = read("discovery-site/index.html");
  const notFoundHtml = read("discovery-site/404.html");
  const publicHtml = publicHtmlFiles.map((path) => read(path));
  const combinedPublicHtml = publicHtml.join("\n");
  const corporateScript = read("discovery-site/corporate.js");
  const privacyHtml = read("discovery-site/privacy.html");
  const robotsTxt = read("discovery-site/robots.txt");
  const sitemapXml = read("discovery-site/sitemap.xml");
  const workflow = read(MACHINE_DISCOVERY_PAGES_WORKFLOW);
  const workflowUses = Array.from(workflow.matchAll(/uses:\s*([^\s]+)/g), (match) => match[1] ?? "");
  const allowedWorkflowActions = new Set<string>(workflowActions);
  const links = extractLinks(indexHtml);
  const allNormalisedLinks = publicHtml.flatMap(extractLinks).map((href) => href.replace(/^\.\//, ""));
  const scriptSources = publicHtml.flatMap(extractScriptSources);
  const analyticsUrlLiterals = Array.from(
    corporateScript.matchAll(/https:\/\/[^'"\s)]+/g),
    (match) => match[0] ?? "",
  );
  const analyticsEventNames = Array.from(
    corporateScript.matchAll(/eventName\s*=\s*'([^']+)'/g),
    (match) => match[1] ?? "",
  );
  const indexJsonLdValues = extractJsonLd(indexHtml);
  const allJsonLdValues = publicHtmlFiles.flatMap((path) => extractJsonLd(read(path)));
  const trackedPaths = listFiles(".");
  const artifactPaths = new Set([
    ...listFiles("discovery-site").map((path) => path.replace(/^discovery-site\//, "")),
    "assets/agent-trust-gate-readme-hero.png",
    "assets/agent-trust-gate-social-preview.png",
    "agent-trust-gate.discovery.json",
    "agent-trust-gate.agent-card.json",
    "agent-trust-gate.manifest.json",
    "agent-trust-gate.agent-review-invitation.json",
    "llms.txt",
    "schemas/agent-review-invitation.schema.json",
    "schemas/bring-your-agent-scenario.schema.json",
    "schemas/ard-ai-catalog-v1.0.schema.json",
    "examples/bring-your-agent-scenario.example.json",
  ]);
  const invalidLocalLinks = publicHtmlFiles.flatMap((path) =>
    localLinkFailures(path, read(path), artifactPaths).map((href) => `${path}: ${href}`)
  );
  const invalidLocalAssets = publicHtmlFiles.flatMap((path) =>
    localAssetFailures(path, read(path), artifactPaths).map((src) => `${path}: ${src}`)
  );
  const seoMetadataFailures = seoPublicHtmlFiles.flatMap((path) => {
    const html = read(path);
    const file = path.replace(/^discovery-site\//, "");
    const expectedCanonical = file === "index.html"
      ? DISCOVERY_SITE_PUBLIC_URL
      : `${MACHINE_DISCOVERY_EXPECTED_PAGES_URL}${file}`;
    const failures: string[] = [];
    if (!/<title>[^<]+<\/title>/i.test(html)) failures.push(`${path}: title`);
    if (!/<meta\s+name=["']description["']\s+content=["'][^"']+["']\s*\/?\s*>/i.test(html)) {
      failures.push(`${path}: description`);
    }
    if (!html.includes(`<link rel="canonical" href="${expectedCanonical}">`)) {
      failures.push(`${path}: canonical`);
    }
    if (/<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html)) {
      failures.push(`${path}: noindex`);
    }
    return failures;
  });
  const expectedSitemapUrls = seoPublicHtmlFiles.map((path) => {
    const file = path.replace(/^discovery-site\//, "");
    return file === "index.html"
      ? DISCOVERY_SITE_PUBLIC_URL
      : `${DISCOVERY_SITE_PUBLIC_URL}${file}`;
  });
  const imageAltFailures = seoPublicHtmlFiles.flatMap((path) =>
    extractImageTags(read(path))
      .filter((tag) => !/\balt=["'][^"']+["']/i.test(tag))
      .map(() => path)
  );
  const obsoleteStatusPattern = new RegExp([
    "activation\\s+prepared",
    "live\\s+verification\\s+pending",
    "live\\s+verification\\s+remains\\s+pending",
    "Expected\\s+public\\s+path\\s+after\\s+manual\\s+Pages\\s+activation",
  ].join("|"), "i");
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
      passed: [
        "agent-trust-gate.discovery.json",
        "agent-trust-gate.agent-card.json",
        "agent-trust-gate.manifest.json",
        "agent-trust-gate.agent-review-invitation.json",
        "llms.txt",
      ].every((file) => workflow.includes(`cp ${file} _site/`)) &&
        workflow.includes("mkdir -p _site/assets _site/schemas _site/examples") &&
        workflow.includes("cp schemas/agent-review-invitation.schema.json _site/schemas/") &&
        workflow.includes("cp schemas/bring-your-agent-scenario.schema.json _site/schemas/") &&
        workflow.includes("cp schemas/ard-ai-catalog-v1.0.schema.json _site/schemas/") &&
        workflow.includes("cp examples/bring-your-agent-scenario.example.json _site/examples/") &&
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
      passed: indexJsonLdValues.length >= 1
        && allJsonLdValues.length >= seoPublicHtmlFiles.length
        && allJsonLdValues.every(canParseJson)
        && extractJsonLd(read("discovery-site/agent-standing-demo.html")).some(canParseJson),
      detail: "all principal public pages include parseable JSON-LD, including the Agent Standing demonstrator",
    },
    {
      id: "seo_metadata_and_indexability",
      passed: seoMetadataFailures.length === 0,
      detail: seoMetadataFailures.length === 0
        ? "principal public pages have titles, descriptions, canonical URLs and no noindex directive"
        : `public metadata failures: ${seoMetadataFailures.join(", ")}`,
    },
    {
      id: "sitemap_membership",
      passed: expectedSitemapUrls.every((url) => sitemapXml.includes(`<loc>${url}</loc>`)),
      detail: "the sitemap includes the home, control, reviewer, sector, Human Authority and Agent Standing routes",
    },
    {
      id: "image_alt_text",
      passed: imageAltFailures.length === 0,
      detail: imageAltFailures.length === 0
        ? "every public content image has non-empty alternative text"
        : `missing image alt text: ${imageAltFailures.join(", ")}`,
    },
    {
      id: "search_and_indexnow_verification_preserved",
      passed: read(googleVerificationFile).trim() === googleVerificationValue
        && read(indexNowKeyFile).trim() === indexNowKey
        && workflow.includes(`test -f _site/google8583929aeb1cff63.html`)
        && workflow.includes(`grep -qx '${googleVerificationValue}' _site/google8583929aeb1cff63.html`)
        && workflow.includes(`grep -qx '${indexNowKey}' _site/${indexNowKey}.txt`),
      detail: "Google Search Console verification and IndexNow key content are preserved and deployment-checked",
    },
    {
      id: "expected_base_path",
      passed: indexHtml.includes(DISCOVERY_SITE_PUBLIC_URL) &&
        notFoundHtml.includes('href="./"') &&
        sitemapXml.includes(DISCOVERY_SITE_PUBLIC_URL) &&
        robotsTxt.includes(`${DISCOVERY_SITE_PUBLIC_URL}sitemap.xml`) &&
        robotsTxt.includes(`Agentmap: ${DISCOVERY_SITE_PUBLIC_URL}ai-catalog.json`) &&
        indexHtml.includes(`<link rel="ai-catalog" href="${DISCOVERY_SITE_PUBLIC_URL}ai-catalog.json">`),
      detail: "canonical URL, relative 404 home link, robots.txt, sitemap, Agentmap and catalogue link use the current corporate Pages route",
    },
    {
      id: "active_verified_wording",
      passed: /Verify authority before AI acts\./i.test(indexHtml) &&
        /local-first trust enforcement demonstrator/i.test(indexHtml) &&
        /Public demonstrator only; production deployment is not claimed\./i.test(indexHtml) &&
        !obsoleteStatusPattern.test(indexHtml),
      detail: "index.html states the current corporate proposition and non-production boundary without obsolete pending wording",
    },
    {
      id: "required_links",
      passed: [
        "https://github.com/Gareth1953/agent-trust-gate",
        "https://github.com/Gareth1953/agent-trust-gate/blob/main/README.md",
        "https://github.com/Gareth1953/agent-trust-gate/blob/main/docs/one-command-reviewer-demo-kit.md",
        "https://github.com/Gareth1953/agent-trust-gate/blob/main/docs/paid-pilot-commercial-entry.md",
        "https://github.com/Gareth1953/agent-trust-gate/blob/main/CITATION.cff",
        "https://github.com/Gareth1953/agent-trust-gate/blob/main/SECURITY.md",
        "agent-trust-gate.discovery.json",
        "llms.txt",
        "agent-trust-gate.agent-card.json",
        "agent-trust-gate.manifest.json",
        "agent-trust-gate.agent-review-invitation.json",
        "ai-catalog.json",
        "for-agents.html",
        "bring-your-agent-scenario.html",
        "bring-your-agent-scenario.template.json",
        "schemas/agent-review-invitation.schema.json",
        "schemas/bring-your-agent-scenario.schema.json",
        "examples/bring-your-agent-scenario.example.json",
        `mailto:${DISCOVERY_SITE_CONTACT}`,
      ].every((href) => allNormalisedLinks.includes(href)),
      detail: "the public site links to the repository, reviewer kit, agent routes, scenario pack, metadata files, paid pilot and corporate contact email",
    },
    {
      id: "no_external_scripts_or_assets",
      passed: scriptSources.length > 0 &&
        scriptSources.every((src) => src === "./corporate.js") &&
        !/<link\b[^>]*\brel=["']?stylesheet["']?[^>]*https?:\/\//i.test(combinedPublicHtml) &&
        !/<img\b[^>]*\bsrc=["']https?:\/\//i.test(combinedPublicHtml) &&
        !/<video\b/i.test(combinedPublicHtml),
      detail: "public pages use only the checked-in corporate script and no external stylesheets, third-party images or embedded video",
    },
    {
      id: "no_forms_iframes_or_chat",
      passed: !/<form\b/i.test(combinedPublicHtml) &&
        !/<input\b[^>]*\btype=["']?file/i.test(combinedPublicHtml) &&
        !/<iframe\b/i.test(combinedPublicHtml) &&
        !/<(?:live-chat|chat-widget|newsletter-signup)\b/i.test(combinedPublicHtml),
      detail: "public pages have no forms, uploads, iframes, live chat, or newsletter signup",
    },
    {
      id: "privacy_conscious_analytics_only",
      passed: corporateScript.includes("if (!isPublicAtgSite) return;") &&
        corporateScript.includes("api_host: 'https://us.i.posthog.com'") &&
        corporateScript.includes("person_profiles: 'identified_only'") &&
        corporateScript.includes("persistence: 'localStorage'") &&
        corporateScript.includes("autocapture: false") &&
        corporateScript.includes("capture_pageview: false") &&
        corporateScript.includes("capture_pageleave: false") &&
        corporateScript.includes("disable_session_recording: true") &&
        corporateScript.includes("disable_surveys: true") &&
        corporateScript.includes("respect_dnt: true") &&
        corporateScript.includes("$geoip_disable: true") &&
        analyticsUrlLiterals.length === 2 &&
        analyticsUrlLiterals.every((url) => url === "https://us.i.posthog.com" || url === "https://us.posthog.com") &&
        analyticsEventNames.length === 3 &&
        analyticsEventNames.every((event) => [
          "atg_contact_email_click",
          "atg_github_click",
          "atg_reviewer_resource_click",
        ].includes(event)) &&
        (corporateScript.match(/window\.posthog\.capture\s*\(/g)?.length ?? 0) === 2 &&
        !/posthog\.identify\s*\(|posthog\.startSessionRecording\s*\(|document\.cookie|Set-Cookie|fingerprint|\beval\s*\(|new\s+Function\s*\(/i.test(corporateScript) &&
        /PostHog autocapture, surveys and session recording are disabled/i.test(privacyHtml) &&
        /anonymous browser identifier is stored in local storage/i.test(privacyHtml),
      detail: "the sole analytics path is hostname-gated PostHog with disclosed local storage, DNT, no autocapture, no surveys, no session recording, no GeoIP enrichment and no visitor identification",
    },
    {
      id: "no_public_network_or_submission_code",
      passed: !/\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource|sendBeacon|\.submit\s*\(/i.test(`${combinedPublicHtml}\n${corporateScript}`),
      detail: "public source contains no fetch, socket, beacon or form-submission path beyond the separately constrained analytics loader",
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
        /\bATG (?:is |provides a )?production[- ]ready\b/i,
        /\bATG guarantees (?:safety|compliance)\b/i,
        /\breal payment protection\b/i,
        /\bsettlement execution is active\b/i,
        /"(?:a2aServer|mcpServer|hostedGatepassApi|productionReady)"\s*:\s*true/i,
      ].every((pattern) => !pattern.test(combinedPublicHtml)),
      detail: "static site avoids live endpoint, production, guarantee, payment, and settlement claims",
    },
    {
      id: "machine_readable_json_valid",
      passed: [
        ...requiredArtifactFiles.filter((file) => file.endsWith(".json")),
        "discovery-site/ai-catalog.json",
        "discovery-site/bring-your-agent-scenario.template.json",
      ]
        .every((file) => canParseJson(read(file))),
      detail: "machine-readable JSON files included in the Pages artifact remain valid",
    },
    {
      id: "all_local_public_links_valid",
      passed: invalidLocalLinks.length === 0,
      detail: invalidLocalLinks.length === 0
        ? "every relative link in each public HTML page resolves within the selected Pages artifact"
        : `unresolved selected-artifact links: ${invalidLocalLinks.join(", ")}`,
    },
    {
      id: "all_local_public_assets_valid",
      passed: invalidLocalAssets.length === 0,
      detail: invalidLocalAssets.length === 0
        ? "every relative image or media reference resolves within the selected Pages artifact"
        : `unresolved selected-artifact assets: ${invalidLocalAssets.join(", ")}`,
    },
    {
      id: "no_cname_or_well_known_endpoint",
      passed: !existsSync(join(root, "discovery-site", "CNAME")) &&
        !trackedPaths.some((path) => path.includes(".well-known/agent-card.json")),
      detail: "Pages source has no checked-in CNAME override or operational .well-known A2A endpoint",
    },
  ];

  return {
    project: "Agent Trust Gate",
    purpose: "Local static discovery-site validation",
    expectedPagesUrl: DISCOVERY_SITE_PUBLIC_URL,
    basePath: DISCOVERY_SITE_BASE_PATH,
    workflow: MACHINE_DISCOVERY_PAGES_WORKFLOW,
    valid: checks.every((check) => check.passed),
    localDemoOnly: true,
    networkCalls: false,
    githubPagesDeploymentActive: true,
    actionExecution: false,
    checks,
  };
}

export function renderDiscoverySiteValidation(report: DiscoverySiteValidationReport): string {
  return [
    "Agent Trust Gate discovery-site validation",
    `Pages URL: ${report.expectedPagesUrl}`,
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

function extractAssetSources(html: string): string[] {
  return Array.from(
    html.matchAll(/\b(?:src|poster)=["']([^"']+)["']/gi),
    (match) => match[1] ?? "",
  ).filter(Boolean);
}

function extractScriptSources(html: string): string[] {
  return Array.from(
    html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi),
    (match) => match[1] ?? "",
  ).filter(Boolean);
}

function extractImageTags(html: string): string[] {
  return Array.from(html.matchAll(/<img\b[^>]*>/gi), (match) => match[0] ?? "");
}

function canParseJson(value: string): boolean {
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
}

function localLinkFailures(
  sourcePath: string,
  html: string,
  artifactPaths: ReadonlySet<string>,
): string[] {
  const sourceArtifactPath = sourcePath.replace(/^discovery-site\//, "");
  return extractLinks(html).filter((href) => {
    if (/^(?:https?:|mailto:|#)/i.test(href)) return false;
    const withoutFragment = href.split("#", 1)[0]?.split("?", 1)[0] ?? "";
    if (withoutFragment === "") return false;
    if (withoutFragment === "." || withoutFragment === "./" || withoutFragment === "/") {
      return !artifactPaths.has("index.html");
    }
    const candidate = join(dirname(sourceArtifactPath), withoutFragment)
      .replace(/\\/g, "/")
      .replace(/^\.\//, "");
    const artifactPath = withoutFragment.endsWith("/") || candidate === "."
      ? `${candidate === "." ? "" : `${candidate}/`}index.html`
      : candidate;
    return !artifactPaths.has(artifactPath);
  });
}

function localAssetFailures(
  sourcePath: string,
  html: string,
  artifactPaths: ReadonlySet<string>,
): string[] {
  const sourceArtifactPath = sourcePath.replace(/^discovery-site\//, "");
  return extractAssetSources(html).filter((src) => {
    if (/^(?:https?:|data:|blob:)/i.test(src)) return false;
    const withoutFragment = src.split("#", 1)[0]?.split("?", 1)[0] ?? "";
    if (withoutFragment === "") return false;
    const candidate = join(dirname(sourceArtifactPath), withoutFragment)
      .replace(/\\/g, "/")
      .replace(/^\.\//, "");
    return !artifactPaths.has(candidate);
  });
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
