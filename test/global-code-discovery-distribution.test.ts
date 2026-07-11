import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();
const globalDoc = "docs/global-code-discovery-and-developer-distribution-pack.md";
const githubDoc = "docs/github-discovery-metadata-guide.md";
const checklistDoc = "docs/developer-distribution-checklist.md";
const sharingDoc = "docs/global-developer-sharing-copy.md";
const agentNoteDoc = "docs/agent-readable-distribution-note.md";
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

test("global code discovery distribution docs exist and README links them", () => {
  const readme = read("README.md");
  for (const path of [globalDoc, githubDoc, checklistDoc, sharingDoc, agentNoteDoc]) {
    assert.equal(existsSync(join(root, path)), true, path);
    assert.match(readme, new RegExp(escapeRegExp(path)), path);
  }
  assert.match(readme, /## Global code discovery and manual sharing/i);
  assert.match(readme, /developer finds the repo, understands the\s+trust problem, runs the local demo, sees paid-review relevance, and contacts\s+Gareth manually/i);
});

test("GitHub topics and metadata guidance are present and manual-only", () => {
  const doc = read(githubDoc);
  for (const topic of [
    "ai-agents",
    "agentic-ai",
    "ai-safety",
    "ai-governance",
    "trust-layer",
    "developer-tools",
    "signed-receipts",
    "proof-of-action",
    "pre-settlement",
    "human-in-the-loop",
    "typescript",
  ]) {
    assert.match(doc, new RegExp(escapeRegExp(topic)), topic);
  }
  for (const expected of [
    "Suggested GitHub About Description",
    "Website Field Guidance",
    "Suggested Short Repo Tagline",
    "Suggested One-Line Positioning",
    "Suggested README Search Phrases",
    "Suggested Safe Public Labels/Categories",
    "manual guidance only",
  ]) {
    assert.match(doc, new RegExp(escapeRegExp(expected), "i"), expected);
  }
});

test("developer distribution checklist covers safe manual routes and warnings", () => {
  const doc = read(checklistDoc);
  for (const expected of [
    "GitHub README clarity",
    "GitHub topics",
    "GitHub discussions",
    "developer communities",
    "AI safety/governance communities",
    "agent framework communities",
    "fintech/payment workflow reviewer communities",
    "technical blog/manual write-up",
    "LinkedIn manual post",
    "X manual post under 360 characters",
    "public repo link",
    "known contacts",
    "spam",
    "scrape contacts",
    "mass cold email",
    "automate outreach",
    "misleading claims",
    "production readiness",
    "payment readiness",
    "settlement readiness",
  ]) {
    assert.match(doc, new RegExp(escapeRegExp(expected), "i"), expected);
  }
});

test("manual sharing copy is present and X post is under 360 characters", () => {
  const doc = read(sharingDoc);
  for (const expected of [
    "Short X Post",
    "LinkedIn Post",
    "GitHub Discussion / Manual Post",
    "Developer Community Post",
    "AI Governance Reviewer Post",
    "Agent Builder Reviewer Post",
    "Fintech / Payment Workflow Reviewer Post",
    "Short Direct Message To A Known Contact",
    "Reply: What Is This?",
    "Reply: Is This Production-Ready?",
    "Reply: Can We Pay For A Review?",
    "manual-use",
  ]) {
    assert.match(doc, new RegExp(escapeRegExp(expected), "i"), expected);
  }
  const xPost = fencedBlockAfter(doc, "## Short X Post");
  assert.ok(xPost.length < 360, `X post length ${xPost.length} should be under 360`);
  assert.match(xPost, /https:\/\/github\.com\/Gareth1953\/agent-trust-gate/);
});

test("agent-readable distribution boundaries are present", () => {
  const doc = read(agentNoteDoc);
  for (const expected of [
    "llms.txt Purpose",
    "Agent Card Purpose",
    "Manifest Purpose",
    "How Agents And Developer Tools May Read The Project",
    "What Agents Are Allowed To Infer",
    "What Agents Must Not Infer",
    "No autonomous operation authority",
    "No live API authority",
    "No payment or settlement authority",
    "No external contact authority",
    "No action execution authority",
  ]) {
    assert.match(doc, new RegExp(escapeRegExp(expected), "i"), expected);
  }
});

test("P3-M127 is recorded in related docs and metadata", () => {
  const paths = [
    "README.md",
    "llms.txt",
    "agent-trust-gate.agent-card.json",
    "agent-trust-gate.manifest.json",
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
    assert.match(read(path), /P3-M127/, path);
  }
});

test("public contact old-email absence and core safety line are preserved", () => {
  const combined = [
    read("README.md"),
    read(globalDoc),
    read(githubDoc),
    read(checklistDoc),
    read(sharingDoc),
    read(agentNoteDoc),
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

test("distribution pack introduces no production live payment settlement or automatic-access claims", () => {
  const combined = [
    read("README.md"),
    read(globalDoc),
    read(githubDoc),
    read(checklistDoc),
    read(sharingDoc),
    read(agentNoteDoc),
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

test("distribution pack claims no guaranteed discovery demand or paid pilot conversion", () => {
  const combined = [
    read("README.md"),
    read(globalDoc),
    read(checklistDoc),
    read(sharingDoc),
    read(agentNoteDoc),
    read("RELEASE_NOTES.md"),
    read("CHANGELOG.md"),
  ].join("\n");

  for (const forbidden of [
    /\bguaranteed global discovery is (?:claimed|available|confirmed|proved)\b/i,
    /\bguaranteed buyer demand is (?:claimed|available|confirmed|proved)\b/i,
    /\bguaranteed paid-pilot conversion is (?:claimed|available|confirmed|proved)\b/i,
    /\bglobal discovery is guaranteed\b/i,
    /\bbuyer demand is guaranteed\b/i,
    /\bpaid-pilot conversion is guaranteed\b/i,
    /\bwill get discovered globally\b/i,
    /\bwill generate demand\b/i,
    /\bwill convert paid pilots\b/i,
  ]) {
    assert.doesNotMatch(combined, forbidden);
  }
});

test("distribution pack introduces no outreach scraping ads tracking or forbidden live-action language", () => {
  const combined = [
    read("README.md"),
    read(globalDoc),
    read(githubDoc),
    read(checklistDoc),
    read(sharingDoc),
    read(agentNoteDoc),
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
