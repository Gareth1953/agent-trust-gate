import { existsSync, readFileSync } from "node:fs";
import { join, normalize, resolve } from "node:path";

export interface PublicClaimCheck { id: string; passed: boolean; detail: string; }
export interface PublicClaimsValidationReport {
  version: "atg.public-claims-validation.v1";
  valid: boolean;
  checks: PublicClaimCheck[];
  externalActionOccurred: false;
  authorityGranted: false;
}

export interface PublicClaimsValidationOverrides {
  readme?: string;
  indexHtml?: string;
  evidenceHtml?: string;
  technologyHtml?: string;
  contactHtml?: string;
  privacyHtml?: string;
  pilotHtml?: string;
  corporateScript?: string;
  corporateCss?: string;
  evidenceBundle?: Record<string, unknown>;
  claimsRegister?: Record<string, unknown>;
  packageJson?: Record<string, unknown>;
}

const root = process.cwd();
const requiredCommands = [
  "build", "typecheck", "mcp:stdio", "demo:purchasing-lifecycle",
  "evidence:m162", "verify:m162", "test:customer-trust-evidence", "test:m162-regression",
] as const;

export function validatePublicClaims(overrides: PublicClaimsValidationOverrides = {}): PublicClaimsValidationReport {
  const readme = overrides.readme ?? read("README.md");
  const indexHtml = overrides.indexHtml ?? read("discovery-site/index.html");
  const evidenceHtml = overrides.evidenceHtml ?? read("discovery-site/evidence.html");
  const technologyHtml = overrides.technologyHtml ?? read("discovery-site/technology.html");
  const contactHtml = overrides.contactHtml ?? read("discovery-site/contact.html");
  const privacyHtml = overrides.privacyHtml ?? read("discovery-site/privacy.html");
  const pilotHtml = overrides.pilotHtml ?? read("discovery-site/controlled-buyer-pilot.html");
  const corporateScript = overrides.corporateScript ?? read("discovery-site/corporate.js");
  const corporateCss = overrides.corporateCss ?? read("discovery-site/corporate.css");
  const evidenceBundle = overrides.evidenceBundle ?? json("examples/p3-m162/evidence-bundle.json");
  const claimsRegister = overrides.claimsRegister ?? json("docs/P3-M163-public-claims-evidence-register.json");
  const packageJson = overrides.packageJson ?? json("package.json");
  const publicText = [readme, indexHtml, evidenceHtml, technologyHtml, contactHtml, privacyHtml, pilotHtml].join("\n");
  const checks: PublicClaimCheck[] = [];
  const check = (id: string, passed: boolean, detail: string) => checks.push({ id, passed, detail });

  const coverage = record(evidenceBundle.coverageMap);
  const totals = record(coverage.totals);
  const metrics = array(record(evidenceBundle.metrics).metrics).map(record);
  const metric = (id: string) => metrics.find((item) => item.metricId === id);
  check("m162_bundle_version", evidenceBundle.bundleVersion === "atg.m162-evidence-bundle.local.v1", "public claims use the locked M162 evidence bundle version");
  check("coverage_totals", totals.DEMONSTRATED === 18 && totals.PARTIALLY_DEMONSTRATED === 2 && totals.NOT_DEMONSTRATED === 3 && totals.OUT_OF_SCOPE === 2 && array(coverage.entries).length === 25, "coverage totals reconcile to 18/2/3/2 and 25");
  check("verdict_metrics", metric("METRIC-VERDICT-ACCEPT")?.value === 1 && metric("METRIC-VERDICT-REJECT")?.value === 6 && metric("METRIC-VERDICT-REFER")?.value === 2 && metric("METRIC-VERDICT-SHADOW")?.value === 1, "ten-case verdict counts reconcile to M162");
  check("boundary_metrics", metric("METRIC-SHADOW-GATEPASSES")?.value === 0 && metric("METRIC-AUTOMATIC-CRASH-RETRIES")?.value === 0 && metric("METRIC-EVIDENCE-LINK-VERIFICATION")?.numerator === 1 && metric("METRIC-EVIDENCE-LINK-VERIFICATION")?.denominator === 1, "zero Shadow GatePasses, zero automatic retries and 1/1 evidence link reconcile");

  const numericPhrases = ["18 DEMONSTRATED", "2 PARTIALLY_DEMONSTRATED", "3 NOT_DEMONSTRATED", "2 OUT_OF_SCOPE", "25 total", "1/10 ACCEPT", "6/10 REJECT", "2/10 REFER", "1/10 SHADOW"];
  check("public_numeric_claims", numericPhrases.every((phrase) => publicText.includes(phrase)), "README/site numerical claims match the locked bundle");
  const publicPlainText = publicText.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  check("no_unsupported_public_metrics", !/(?:19|17) DEMONSTRATED|(?:3|1) PARTIALLY_DEMONSTRATED|(?:4|2) NOT_DEMONSTRATED|(?:3|1) OUT_OF_SCOPE|(?:2|0)\/10 ACCEPT|(?:7|5)\/10 REJECT|(?:3|1)\/10 REFER|(?:2|0)\/10 SHADOW/i.test(publicPlainText), "no altered public coverage or verdict count is present");
  check("synthetic_metric_label", /Observed in the deterministic ten-case synthetic demonstration\./i.test(indexHtml) && /observed in the deterministic ten-case synthetic demonstration/i.test(readme), "public metrics carry the required synthetic-observation label");

  const claims = array(claimsRegister.claims).map(record);
  check("claims_register", claimsRegister.registerVersion === "atg.public-claims-evidence-register.v1" && claims.length >= 15 && claims.every((item) => typeof item.claimId === "string" && typeof item.evidenceSource === "string" && existsSync(join(root, String(item.evidenceSource)))), "every registered material claim names an existing evidence source");
  check("classification_inventory", ["DEMONSTRATED", "PARTIALLY_DEMONSTRATED", "NOT_DEMONSTRATED", "OUT_OF_SCOPE"].every((status) => claims.some((item) => item.classification === status)), "claim inventory retains demonstrated, partial, absent and out-of-scope classes");

  const scripts = record(packageJson.scripts);
  check("package_commands", requiredCommands.every((command) => typeof scripts[command] === "string") && requiredCommands.every((command) => publicText.includes(command)), "all published commands exist in package.json and appear on a public review surface");
  check("readme_links", markdownLinkTargets(readme).every((target) => repositoryLinkResolves(target)), "all README relative links resolve locally");
  check("site_links", [indexHtml, evidenceHtml, technologyHtml, contactHtml, privacyHtml, pilotHtml].every((html) => htmlLinkTargets(html).every((target) => siteLinkResolves(target))), "all modified-site relative links resolve in the static site");

  check("single_h1", [indexHtml, evidenceHtml, technologyHtml, contactHtml, privacyHtml, pilotHtml].every((html) => (html.match(/<h1\b/gi) ?? []).length === 1), "each modified public page has one logical H1");
  check("accessible_navigation", /<nav\b[^>]*aria-label="Primary navigation"/i.test(indexHtml) && /aria-controls="primary-navigation"/i.test(indexHtml), "home navigation has explicit accessible name and menu relationship");
  check("focus_and_motion", /:focus-visible/.test(corporateCss) && /prefers-reduced-motion:\s*reduce/.test(corporateCss), "visible focus and reduced-motion treatment are present");
  check("responsive_table", /class="table-scroll"[^>]*role="region"[^>]*tabindex="0"/i.test(indexHtml) && /overflow-x:\s*auto/.test(corporateCss), "the ten-case table has a keyboard-focusable responsive container");
  check("responsive_breakpoints", /max-width:\s*980px/.test(corporateCss) && /max-width:\s*760px/.test(corporateCss) && /overflow-wrap:\s*anywhere/.test(corporateCss), "desktop/tablet/mobile layout and long-label wrapping are explicit");

  check("receipt_non_authority", /Customer Trust Receipts[^.]*non-authorising/i.test(publicText) && /cannot reserve, execute, retry, revoke or act as GatePasses/i.test(publicText), "Customer Trust Receipts are never described as authority");
  check("shadow_non_authority", /Shadow Mode[\s\S]{0,220}(?:issues no GatePass|no GatePass)/i.test(publicText) && !/Shadow Mode[^.]{0,120}(?:issues|creates|grants) (?:a )?GatePass/i.test(publicText), "Shadow Mode is explicitly non-authorising");
  check("synthetic_adapter_boundary", /frozen in-process synthetic adapter/i.test(indexHtml) && /makes no real order or payment/i.test(indexHtml), "synthetic acknowledgement is not described as real execution");
  check("pilot_claim", /Paid evaluation pilots starting from £1,500/i.test(indexHtml) && /indicative, scope-dependent/i.test(indexHtml) && /Paid evaluation pilots starting from £1,500/i.test(contactHtml) && /indicative and scope-dependent/i.test(contactHtml) && /Paid evaluation pilots starting from £1,500/i.test(pilotHtml) && /indicative and scope-dependent/i.test(pilotHtml), "pilot price is consistently qualified as indicative and scope-dependent");

  const limitationConcepts = ["not production ready", "customer adoption", "regulatory approval", "guaranteed compliance", "guaranteed safety", "proven ROI", "statistical significance", "distributed durability", "real external-effect reconciliation", "business-outcome correctness"];
  check("required_limitations", limitationConcepts.every((phrase) => publicText.toLowerCase().includes(phrase.toLowerCase())), "required limitations and non-claims are visible");
  const forbidden = [/\bATG is (?:a )?production[- ]ready/i, /\bATG is customer[- ]validated/i, /\bATG guarantees? (?:safety|compliance)/i, /\bATG has proven (?:fraud|loss|risk) reduction/i, /\bATG executed a real (?:purchase|payment|settlement)/i, /Customer Trust Receipt (?:authorises|permits|grants)/i];
  check("prohibited_implications", forbidden.every((pattern) => !pattern.test(publicText)), "no prohibited authority, customer, production, guarantee or live-effect implication appears");
  check("no_analytics_tracking", !/posthog|analytics|tracking pixel|sendBeacon|fetch\s*\(|XMLHttpRequest|WebSocket|https?:\/\//i.test(corporateScript) && /no contact forms, analytics, tracking/i.test(privacyHtml), "checked-in runtime has no analytics, tracking or network path");
  check("one_mcp_tool", /exactly (?:one tool|`atg\.evaluate_action`)|Only <code>atg\.evaluate_action<\/code> is exposed/i.test(publicText) && !/atg\.(?:execute|revoke|admin|emergency)/i.test(publicText), "public MCP claim remains evaluation-only with one tool");

  return { version: "atg.public-claims-validation.v1", valid: checks.every((item) => item.passed), checks, externalActionOccurred: false, authorityGranted: false };
}

export function renderPublicClaimsValidation(report: PublicClaimsValidationReport): string {
  return ["P3-M163 public claims validation", `valid: ${report.valid}`, ...report.checks.map((item) => `- ${item.id}: ${item.passed ? "pass" : "fail"} - ${item.detail}`)].join("\n");
}

function read(path: string): string { return readFileSync(join(root, path), "utf8"); }
function json(path: string): Record<string, unknown> { return JSON.parse(read(path)) as Record<string, unknown>; }
function record(value: unknown): Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {}; }
function array(value: unknown): unknown[] { return Array.isArray(value) ? value : []; }
function markdownLinkTargets(source: string): string[] { return [...source.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].map((match) => match[1] ?? "").filter(Boolean); }
function htmlLinkTargets(source: string): string[] { return [...source.matchAll(/\bhref=["']([^"']+)["']/gi)].map((match) => match[1] ?? "").filter(Boolean); }
function repositoryLinkResolves(target: string): boolean {
  if (/^(?:https?:|mailto:|#)/i.test(target)) return true;
  const clean = target.replace(/^<|>$/g, "").split("#", 1)[0] ?? "";
  return clean === "" || existsSync(resolve(root, clean));
}
function siteLinkResolves(target: string): boolean {
  if (/^(?:https?:|mailto:|#)/i.test(target)) return true;
  const clean = target.split("#", 1)[0]?.split("?", 1)[0] ?? "";
  if (clean === "" || clean === "./" || clean === ".") return true;
  const relative = clean.replace(/^\.\//, "");
  return existsSync(normalize(join(root, "discovery-site", relative))) || existsSync(normalize(join(root, relative)));
}

if (require.main === module) {
  const report = validatePublicClaims();
  console.log(renderPublicClaimsValidation(report));
  process.exitCode = report.valid ? 0 : 1;
}
