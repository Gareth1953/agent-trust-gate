import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();
const buyerDoc = "docs/buyer-use-cases-and-revenue-triggers.md";
const triggerDoc = "docs/revenue-trigger-map.md";
const scopeDoc = "docs/paid-review-scope-examples.md";
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

test("buyer use case revenue trigger docs exist and README links them", () => {
  const readme = read("README.md");
  for (const path of [buyerDoc, triggerDoc, scopeDoc]) {
    assert.equal(existsSync(join(root, path)), true, path);
    assert.match(readme, new RegExp(escapeRegExp(path)), path);
  }
  assert.match(readme, /## Buyer use cases and revenue triggers/i);
  assert.match(readme, /most commercially relevant when an AI agent or automated workflow may affect\s+money, settlement, access, publication, procurement, customer outcomes,\s+sensitive tools, or other high-impact actions/i);
});

test("buyer categories are present with commercial review fields", () => {
  const doc = read(buyerDoc);
  for (const category of [
    "AI agent builders",
    "AI automation developers",
    "AI governance consultants",
    "enterprise automation reviewers",
    "fintech/payment workflow reviewers",
    "agent platform/tool developers",
    "trust and safety reviewers",
    "compliance-adjacent technical reviewers",
    "procurement/workflow automation reviewers",
  ]) {
    assert.match(doc, new RegExp(escapeRegExp(category), "i"), category);
  }
  for (const heading of [
    "Why They Might Care",
    "Likely Pain Point",
    "Possible Paid Enquiry Trigger",
    "Suitable Paid Review Type",
    "Safe Current Offer",
  ]) {
    assert.match(doc, new RegExp(escapeRegExp(heading)), heading);
  }
});

test("revenue triggers are mapped to local review angles", () => {
  const doc = read(triggerDoc);
  for (const trigger of [
    "Agent can act without human approval",
    "Agent can move toward payment/settlement without mandate",
    "Agent cannot prove evidence used for decision",
    "Agent cannot produce a trust receipt",
    "Approvals can be replayed",
    "Sensitive tool calls are not gated",
    "No local audit trail exists",
    "User intent is unclear or spoofable",
    "Agent identity can be spoofed",
    "High-risk actions are not escalated",
    "No pre-settlement gate exists",
    "No pre-access/session intent gate concept exists",
    "Enterprise reviewer needs local proof before wider discussion",
  ]) {
    assert.match(doc, new RegExp(escapeRegExp(trigger), "i"), trigger);
  }
  for (const heading of [
    "Problem",
    "Risk",
    "What Agent Trust Gate Can Review Locally",
    "Possible Paid Review Angle",
    "What Not To Claim",
  ]) {
    assert.match(doc, new RegExp(escapeRegExp(heading)), heading);
  }
});

test("paid review scope examples are present and bounded", () => {
  const doc = read(scopeDoc);
  for (const scope of [
    "Agent Workflow Trust Review",
    "Pre-Settlement Trust Review",
    "Human Approval And Evidence Review",
    "Signed Receipt / Replay Risk Review",
    "Sensitive Tool-Call Gate Review",
    "Session Intent / Agent Traffic Trust Review",
    "Integration Feasibility Review",
    "Local Pilot Scoping Review",
  ]) {
    assert.match(doc, new RegExp(escapeRegExp(scope)), scope);
  }
  for (const expected of [
    "Purpose:",
    "What would be reviewed:",
    "Likely deliverable:",
    "Safe limitations:",
    "What is not included:",
  ]) {
    assert.match(doc, new RegExp(escapeRegExp(expected)), expected);
  }
});

test("P3-M126 is recorded in related docs and metadata", () => {
  const paths = [
    "README.md",
    "llms.txt",
    "agent-trust-gate.agent-card.json",
    "agent-trust-gate.manifest.json",
    "docs/public-repo-commercial-conversion-review.md",
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
    assert.match(read(path), /P3-M126/, path);
  }
});

test("public contact old-email absence and core safety line are preserved", () => {
  const combined = [
    read("README.md"),
    read(buyerDoc),
    read(triggerDoc),
    read(scopeDoc),
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

test("buyer pack introduces no production live payment settlement or automatic-access claims", () => {
  const combined = [
    read("README.md"),
    read(buyerDoc),
    read(triggerDoc),
    read(scopeDoc),
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

test("buyer pack claims no guaranteed demand revenue or paid pilot conversion", () => {
  const combined = [
    read("README.md"),
    read(buyerDoc),
    read(triggerDoc),
    read(scopeDoc),
    read("RELEASE_NOTES.md"),
    read("CHANGELOG.md"),
  ].join("\n");

  for (const forbidden of [
    /\bguaranteed buyer demand is (?:claimed|available|confirmed|proved)\b/i,
    /\bguaranteed revenue is (?:claimed|available|confirmed|proved)\b/i,
    /\bguaranteed paid-pilot conversion is (?:claimed|available|confirmed|proved)\b/i,
    /\bbuyer demand is guaranteed\b/i,
    /\brevenue is guaranteed\b/i,
    /\bpaid-pilot conversion is guaranteed\b/i,
    /\bwill generate revenue\b/i,
    /\bwill convert paid pilots\b/i,
  ]) {
    assert.doesNotMatch(combined, forbidden);
  }
});

test("buyer pack introduces no outreach automation or forbidden live-action language", () => {
  const combined = [
    read("README.md"),
    read(buyerDoc),
    read(triggerDoc),
    read(scopeDoc),
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
