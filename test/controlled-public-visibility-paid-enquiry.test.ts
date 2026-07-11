import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();
const visibilityDoc = "docs/controlled-public-visibility-and-paid-enquiry-positioning.md";
const checklistDoc = "docs/public-visibility-readiness-checklist.md";
const paidDoc = "docs/paid-enquiry-positioning.md";
const messageDoc = "docs/public-positioning-message-bank.md";
const sequenceDoc = "docs/controlled-distribution-sequence.md";
const contactEmail = "gpmiddleton71@gmail.com";
const oldEmail = ["legalintelligencerecruitment", "outlook.com"].join("@");
const coreLine = "No mandate. No evidence. No verified intent. No signed gate pass. No settlement.";

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

function fencedBlockAfter(source: string, heading: string): string {
  const start = source.indexOf(heading);
  assert.notEqual(start, -1, heading);
  const fromHeading = source.slice(start);
  const match = /```text\r?\n([\s\S]*?)\r?\n```/.exec(fromHeading);
  assert.ok(match, `missing fenced text block after ${heading}`);
  const content = match[1];
  if (content === undefined) throw new Error(`missing fenced text content after ${heading}`);
  return content.trim();
}

test("controlled public visibility docs exist and README links them", () => {
  const readme = read("README.md");
  for (const path of [visibilityDoc, checklistDoc, paidDoc, messageDoc, sequenceDoc]) {
    assert.equal(existsSync(join(root, path)), true, path);
    assert.match(readme, new RegExp(escapeRegExp(path)), path);
  }
  assert.match(readme, /## Controlled public visibility and paid enquiries/i);
  assert.match(readme, /paid technical review \/ local pilot feasibility\s+\/ integration assessment/i);
});

test("public visibility readiness checklist includes safety and commercial checks", () => {
  const doc = read(checklistDoc);
  for (const expected of [
    "README start-here path is clear",
    "Local clone/run route is clear",
    "Paid enquiry route is clear",
    "Public contact email is visible",
    "Safety boundary is visible",
    "\"Not production-ready\" boundary is visible",
    "No live payment or settlement claims",
    "No legal/compliance/security guarantees",
    "No automated outreach",
    "No scraping or contact harvesting",
    "No tracking or analytics",
    "No paid ads or ad pixels",
    "No automatic access after payment",
    "Manual-only sharing copy is available",
    "GitHub metadata guidance is available",
    "Agent-readable discovery files are present",
    "Buyer/revenue trigger docs are present",
    "Paid review scope docs are present",
  ]) {
    assert.match(doc, new RegExp(escapeRegExp(expected), "i"), expected);
  }
});

test("paid enquiry positioning includes current offer, scope types, outputs, and exclusions", () => {
  const doc = read(paidDoc);
  assert.match(doc, /Paid technical review \/ local pilot feasibility \/ integration assessment/);
  for (const expected of [
    "Agent Workflow Trust Review",
    "Pre-Settlement Trust Review",
    "Human Approval and Evidence Review",
    "Signed Receipt / Replay Risk Review",
    "Sensitive Tool-Call Gate Review",
    "Session Intent / Agent Traffic Trust Review",
    "Integration Feasibility Review",
    "Local Pilot Scoping Review",
    "manual discussion",
    "scoped technical review",
    "local proof review",
    "written findings",
    "local pilot discussion",
    "production deployment",
    "payment activation",
    "settlement authority",
    "legal/compliance certification",
    "automatic access",
    "guaranteed acceptance",
    "guaranteed commercial result",
  ]) {
    assert.match(doc, new RegExp(escapeRegExp(expected), "i"), expected);
  }
});

test("public positioning message bank includes manual-use copy and X post under 360 characters", () => {
  const doc = read(messageDoc);
  for (const expected of [
    "One-Line Positioning",
    "Short Repo Description",
    "Short Why This Matters Message",
    "Short X Post",
    "LinkedIn-Style Short Post",
    "Developer Community Short Post",
    "AI Governance Reviewer Short Post",
    "Fintech / Payment Workflow Reviewer Short Post",
    "What This Is Reply",
    "What This Is Not Reply",
    "Can We Pay For A Review Reply",
    "Is It Production-Ready Reply",
    "manual-use",
  ]) {
    assert.match(doc, new RegExp(escapeRegExp(expected), "i"), expected);
  }
  const xPost = fencedBlockAfter(doc, "## Short X Post");
  assert.ok(xPost.length < 360, `X post length ${xPost.length} should be under 360`);
  assert.match(xPost, /https:\/\/github\.com\/Gareth1953\/agent-trust-gate/);
});

test("controlled distribution sequence includes staged manual visibility and stop conditions", () => {
  const doc = read(sequenceDoc);
  for (const expected of [
    "Stage 1 - GitHub Metadata / Manual Repo Polish",
    "Stage 2 - Manual Post To Gareth-Controlled Accounts Only",
    "Stage 3 - Manual Sharing To Known/Relevant Technical Contacts Only",
    "Stage 4 - Manual Developer/Community Post Where Rules Allow",
    "Stage 5 - Respond Manually To Genuine Enquiries",
    "Stage 6 - Invite Serious Enquiries To Paid Technical Review / Local Pilot Discussion",
    "messaging causes confusion",
    "people assume production readiness",
    "payment/settlement claims are misunderstood",
    "legal/compliance/security certification is inferred",
    "spam-like behaviour would be required",
    "enquiries request live integration before safe review",
  ]) {
    assert.match(doc, new RegExp(escapeRegExp(expected), "i"), expected);
  }
});

test("P3-M128 is recorded in related docs and metadata", () => {
  const paths = [
    "README.md",
    "llms.txt",
    "agent-trust-gate.agent-card.json",
    "agent-trust-gate.manifest.json",
    "docs/global-code-discovery-and-developer-distribution-pack.md",
    "docs/github-discovery-metadata-guide.md",
    "docs/developer-distribution-checklist.md",
    "docs/global-developer-sharing-copy.md",
    "docs/public-repo-commercial-conversion-review.md",
    "docs/public-reviewer-and-paid-pilot-enquiry-pack.md",
    "docs/buyer-use-cases-and-revenue-triggers.md",
    "docs/revenue-trigger-map.md",
    "docs/paid-review-scope-examples.md",
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
    assert.match(read(path), /P3-M128/, path);
  }
});

test("public contact old-email absence and core safety line are preserved", () => {
  const combined = [
    read("README.md"),
    read(visibilityDoc),
    read(checklistDoc),
    read(paidDoc),
    read(messageDoc),
    read(sequenceDoc),
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

test("controlled visibility pack introduces no readiness certification or automatic-access claims", () => {
  const combined = [
    read("README.md"),
    read(visibilityDoc),
    read(checklistDoc),
    read(paidDoc),
    read(messageDoc),
    read(sequenceDoc),
    read("PUBLIC_LAUNCH_CHECKLIST.md"),
    read("docs/public-launch-record.md"),
  ].join("\n");

  for (const forbidden of [
    /\bAgent Trust Gate(?:™)? is production-ready\b/i,
    /\bproduction readiness is (?:claimed|approved|complete|ready)\b/i,
    /\blive payment\/settlement readiness is (?:claimed|approved|complete|ready)\b/i,
    /\bsecurity is certified\b/i,
    /\bcertified security is (?:granted|complete|active|available)\b/i,
    /\blegal\/compliance\/security certification is (?:claimed|granted|active|available)\b/i,
    /\blive payment processing is (?:enabled|active|available|configured)\b/i,
    /\bsettlement execution is (?:enabled|active|available|configured)\b/i,
    /\bpayment automatically grants\b/i,
    /\bautomatic paid-pilot acceptance is (?:approved|granted|active|available)\b/i,
    /\bautomatic access is granted\b/i,
    /\bautomatic acceptance is granted\b/i,
    /\bautomatic access after payment is granted\b/i,
  ]) {
    assert.doesNotMatch(combined, forbidden);
  }
});

test("controlled visibility pack claims no guaranteed visibility demand or paid pilot conversion", () => {
  const combined = [
    read("README.md"),
    read(visibilityDoc),
    read(checklistDoc),
    read(paidDoc),
    read(messageDoc),
    read(sequenceDoc),
    read("RELEASE_NOTES.md"),
    read("CHANGELOG.md"),
  ].join("\n");

  for (const forbidden of [
    /\bguaranteed public visibility is (?:available|confirmed|proved)\b/i,
    /\bguaranteed global discovery is (?:available|confirmed|proved)\b/i,
    /\bguaranteed buyer demand is (?:available|confirmed|proved)\b/i,
    /\bguaranteed paid pilot conversion is (?:available|confirmed|proved)\b/i,
    /\bpublic visibility is guaranteed\b/i,
    /\bglobal discovery is guaranteed\b/i,
    /\bbuyer demand is guaranteed\b/i,
    /\bpaid pilot conversion is guaranteed\b/i,
    /\bwill get public visibility\b/i,
    /\bwill generate demand\b/i,
    /\bwill convert paid pilots\b/i,
  ]) {
    assert.doesNotMatch(combined, forbidden);
  }
});

test("controlled visibility pack introduces no outreach scraping ads tracking or forbidden live-action language", () => {
  const combined = [
    read("README.md"),
    read(visibilityDoc),
    read(checklistDoc),
    read(paidDoc),
    read(messageDoc),
    read(sequenceDoc),
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
    /\bpaid ads are (?:enabled|active|available|configured)\b/i,
    /\bad pixels? (?:are|is) (?:enabled|active|available|configured)\b/i,
    /\btracking is (?:enabled|active|available|configured)\b/i,
    /\banalytics (?:are|is) (?:enabled|active|available|configured)\b/i,
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
