import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();
const docPath = "docs/public-repo-commercial-conversion-review.md";
const contactEmail = "gpmiddleton71@gmail.com";
const oldEmail = ["legalintelligencerecruitment", "outlook.com"].join("@");
const coreLine = "No mandate. No evidence. No verified intent. No signed gate pass. No settlement.";
const reviewerLinks = [
  "docs/clone-and-run-quickstart.md",
  "docs/simplified-developer-cli.md",
  "docs/schema-formalisation-and-evidence-model.md",
  "docs/local-signed-receipt-and-proof-prototype.md",
  "docs/adversarial-evaluation-pack.md",
  "docs/reference-integration-examples.md",
  "docs/paid-pilot-readiness-review.md",
  "docs/public-reviewer-and-paid-pilot-enquiry-pack.md",
  "docs/paid-pilot-enquiry-checklist.md",
  "docs/public-repo-commercial-conversion-review.md",
  "llms.txt",
  "agent-trust-gate.agent-card.json",
] as const;

function read(path: string): string {
  return readFileSync(join(root, path), "utf8");
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

test("public repo commercial conversion review exists and README links it", () => {
  assert.equal(existsSync(join(root, docPath)), true, docPath);
  assert.match(read("README.md"), new RegExp(`\\(${escapeRegExp(docPath)}\\)`));
  assert.match(read(docPath), /P3-M125/);
  assert.match(read(docPath), new RegExp(escapeRegExp(coreLine)));
});

test("README includes a clear reviewer start-here path near the top", () => {
  const source = read("README.md");
  assert.match(source, /## Start here for reviewers/i);
  assert.match(source, /For a fast public review, use this path/i);
  const start = source.indexOf("## Start here for reviewers");
  const clone = source.indexOf("## Clone and run locally");
  assert.ok(start > -1 && clone > start, "reviewer path should appear before clone section");
  for (const path of reviewerLinks) {
    assert.equal(existsSync(join(root, path)), true, path);
    assert.match(source, new RegExp(escapeRegExp(path)), path);
  }
});

test("README what-to-inspect-first checklist covers local proof assets", () => {
  const source = read("README.md");
  assert.match(source, /## What to inspect first/i);
  for (const expected of [
    "npm run cli -- help",
    "npm run demo:adversarial",
    "npm run demo:integrations",
    "npm run proof:money-gate",
    "hardened request, receipt, and money-gate proof schemas",
    "local signed receipt/proof prototype",
    "adversarial pack",
    "reference integrations",
    "paid pilot readiness",
  ]) {
    assert.match(source, new RegExp(escapeRegExp(expected), "i"), expected);
  }
});

test("README commercial enquiry path is clear and human-reviewed", () => {
  const source = read("README.md");
  assert.match(source, /## Commercial enquiry path/i);
  for (const expected of [
    "paid technical review",
    "local pilot discussion",
    "integration feasibility review",
    "AI governance/safety review",
    "pre-settlement trust workflow review",
    contactEmail,
    "All enquiries are human-reviewed",
    "automatic access after payment",
  ]) {
    assert.match(source, new RegExp(escapeRegExp(expected), "i"), expected);
  }
  assert.match(source, /No enquiry or payment\s+grants automatic acceptance/i);
});

test("README what-this-repo-does-not-do boundary is clear", () => {
  const source = read("README.md");
  assert.match(source, /## What this repo does not do/i);
  for (const expected of [
    "not ready for production deployment",
    "live API",
    "hosted service",
    "live payment processing",
    "settlement execution",
    "wallet/banking logic",
    "production signing",
    "autonomous action execution",
  ]) {
    assert.match(source, new RegExp(escapeRegExp(expected), "i"), expected);
  }
  assert.match(source, /legal\/compliance\/security\s+approval/i);
});

test("conversion review documents strengths friction offers exclusions and next actions", () => {
  const doc = read(docPath);
  for (const expected of [
    "Repo Buyer/Reviewer Journey",
    "Current Commercial Conversion Strengths",
    "Current Conversion Friction",
    "Recommended Public Repo Navigation Path",
    "What A Serious Reviewer Should Inspect First",
    "What A Paid Enquiry Should Ask For",
    "What The Project Can Safely Offer Now",
    "What It Must Not Claim",
    "Recommended Next Commercial Actions",
    "Commercial Enquiry Path",
    contactEmail,
  ]) {
    assert.match(doc, new RegExp(escapeRegExp(expected)), expected);
  }
});

test("P3-M125 is recorded in related docs and metadata", () => {
  const paths = [
    "README.md",
    "llms.txt",
    "agent-trust-gate.agent-card.json",
    "agent-trust-gate.manifest.json",
    "docs/public-reviewer-and-paid-pilot-enquiry-pack.md",
    "docs/paid-pilot-readiness-review.md",
    "docs/paid-pilot-enquiry-checklist.md",
    "docs/pricing-and-paid-pilot-menu.md",
    "docs/paid-pilot-offer.md",
    "docs/commercial-payment-capture-pack.md",
    "docs/agent-readable-discovery-and-system-metadata.md",
    "docs/system-integration-metadata.md",
    "docs/p3-mission-register.md",
    "docs/public-launch-record.md",
    "PUBLIC_LAUNCH_CHECKLIST.md",
    "RELEASE_NOTES.md",
    "CHANGELOG.md",
  ];
  for (const path of paths) {
    assert.equal(existsSync(join(root, path)), true, path);
    assert.match(read(path), /P3-M125/, path);
  }
});

test("public contact old-email absence and core safety line are preserved", () => {
  const combined = [
    read("README.md"),
    read(docPath),
    read("llms.txt"),
    read("agent-trust-gate.agent-card.json"),
    read("agent-trust-gate.manifest.json"),
  ].join("\n");
  assert.match(combined, new RegExp(escapeRegExp(contactEmail)));
  assert.match(combined, new RegExp(escapeRegExp(coreLine)));
  assert.doesNotMatch(combined, new RegExp(escapeRegExp(oldEmail), "i"));

  const files = [...gitFiles(["ls-files"]), ...gitFiles(["ls-files", "--others", "--exclude-standard"])];
  for (const path of files) {
    if (!existsSync(path)) continue;
    assert.doesNotMatch(readFileSync(path, "utf8"), new RegExp(escapeRegExp(oldEmail), "i"), path);
  }
});

test("conversion review introduces no production live payment settlement or automatic-access claims", () => {
  const combined = [
    read("README.md"),
    read(docPath),
    read("PUBLIC_LAUNCH_CHECKLIST.md"),
    read("docs/public-launch-record.md"),
  ].join("\n");

  for (const forbidden of [
    /\bAgent Trust Gate(?:™)? is production-ready\b/i,
    /\bproduction readiness is (?:claimed|approved|complete|ready)\b/i,
    /\blive payment\/settlement readiness is (?:claimed|approved|complete|ready)\b/i,
    /\bsecurity is certified\b/i,
    /\bcertified security is (?:granted|complete|active|available)\b/i,
    /\blive payment processing is (?:enabled|active|available|configured)\b/i,
    /\bsettlement execution is (?:enabled|active|available|configured)\b/i,
    /\bpayment automatically grants\b/i,
    /\bautomatic access is granted\b/i,
    /\bautomatic acceptance is granted\b/i,
    /\bautomatic access after payment is granted\b/i,
  ]) {
    assert.doesNotMatch(combined, forbidden);
  }
});

test("conversion review introduces no outreach automation or forbidden live-action language", () => {
  const combined = [
    read("README.md"),
    read(docPath),
    read("llms.txt"),
    read("agent-trust-gate.agent-card.json"),
    read("agent-trust-gate.manifest.json"),
  ].join("\n");

  for (const forbidden of [
    /\bautomates outreach\b/i,
    /\bsends emails automatically\b/i,
    /\bharvests contacts\b/i,
    /\bscrapes contacts\b/i,
    /\bcreates? live forms?\b/i,
    /\blive API is (?:enabled|active|available|configured)\b/i,
    /\bMCP server (?:is|has been) (?:enabled|active|available|configured|created)\b/i,
    /\blive agent-to-agent communication is (?:enabled|active|available|configured)\b/i,
    /\bPayPal API (?:is|has been) (?:integrated|enabled|configured|activated)\b/i,
    /\bStripe (?:is|has been) (?:integrated|enabled|configured|activated)\b/i,
    /\bcheckout is (?:enabled|active|available|configured)\b/i,
    /\bwebhooks? (?:are|is) (?:enabled|active|available|configured)\b/i,
    /\bwallet\/banking logic is (?:enabled|active|available|configured)\b/i,
    /\bhosted service is (?:enabled|active|available|configured)\b/i,
    /\bdeployment is (?:performed|active|available|configured)\b/i,
    /\bexternal-agent contact is (?:enabled|active|available|configured)\b/i,
    /\bproduction signing is (?:enabled|active|available|configured)\b/i,
    /\bAUC is integrated\b/i,
    /\bAgent Contact System is integrated\b/i,
    /\bexecutes actions\b/i,
  ]) {
    assert.doesNotMatch(combined, forbidden);
  }
});

test("all repository JSON examples schemas and metadata remain valid", () => {
  const jsonFiles = [
    ...jsonFilesUnder("examples"),
    ...jsonFilesUnder("schemas"),
    "agent-trust-gate.manifest.json",
    "agent-trust-gate.agent-card.json",
  ];
  assert.ok(jsonFiles.length > 300);
  for (const path of jsonFiles) assert.doesNotThrow(() => JSON.parse(read(path)), path);
});
