import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();
const contactEmail = "gpmiddleton71@gmail.com";
const oldEmail = ["legalintelligencerecruitment", "outlook.com"].join("@");
const coreLine = "No mandate. No evidence. No verified intent. No signed gate pass. No settlement.";
const docs = [
  "docs/public-reviewer-and-paid-pilot-enquiry-pack.md",
  "docs/reviewer-enquiry-copy.md",
  "docs/paid-pilot-enquiry-checklist.md",
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

test("public reviewer and paid pilot enquiry docs exist and README links them", () => {
  const readme = read("README.md");
  for (const path of docs) {
    assert.equal(existsSync(join(root, path)), true, path);
    assert.match(readme, new RegExp(`\\(${escapeRegExp(path)}\\)`), path);
  }
  assert.match(readme, /Reviewer and paid pilot enquiries/i);
});

test("reviewer pack contains the required review path and enquiry routes", () => {
  const doc = read("docs/public-reviewer-and-paid-pilot-enquiry-pack.md");
  for (const required of [
    "README.md",
    "docs/clone-and-run-quickstart.md",
    "docs/simplified-developer-cli.md",
    "docs/schema-formalisation-and-evidence-model.md",
    "docs/local-signed-receipt-and-proof-prototype.md",
    "docs/adversarial-evaluation-pack.md",
    "docs/reference-integration-examples.md",
    "docs/paid-pilot-readiness-review.md",
    "llms.txt",
    "agent-trust-gate.agent-card.json",
    "Paid Technical Review Enquiry Route",
    "Local Pilot Discussion Route",
    "Integration Feasibility Review Route",
    "Human Approval Requirement",
  ]) {
    assert.match(doc, new RegExp(escapeRegExp(required)), required);
  }
});

test("manual-use reviewer copy includes an X social post under 360 characters", () => {
  const copy = read("docs/reviewer-enquiry-copy.md");
  const match = copy.match(/## Short X\/Social Post\s+([\s\S]*?)\r?\n\r?\n## LinkedIn-Style Post/);
  assert.ok(match, "short X/social post section");
  const socialPost = match[1]?.trim() ?? "";
  assert.ok(socialPost.length > 0);
  assert.ok(socialPost.length < 360, `social post length: ${socialPost.length}`);
  assert.match(copy, /manual human use only/i);
  assert.match(copy, /does not imply automated\s+outreach/i);
});

test("paid pilot enquiry checklist asks for serious scope without collecting unsafe material", () => {
  const checklist = read("docs/paid-pilot-enquiry-checklist.md");
  for (const required of [
    "problem area",
    "intended agent or workflow type",
    "sensitivity of the action",
    "whether money, payment-adjacent logic, or settlement is involved",
    "desired local review scope",
    "mandate, evidence, and verified intent requirements",
    "Human-Approved Next Step",
  ]) {
    assert.match(checklist, new RegExp(escapeRegExp(required), "i"), required);
  }
  assert.match(checklist, /Do not include secrets, credentials, private keys/i);
});

test("P3-M124 is recorded in related docs and metadata", () => {
  const paths = [
    "README.md",
    "llms.txt",
    "agent-trust-gate.agent-card.json",
    "agent-trust-gate.manifest.json",
    "docs/paid-pilot-readiness-review.md",
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
    assert.match(read(path), /P3-M124/, path);
  }
});

test("public contact old-email absence and core safety line are preserved", () => {
  const combined = [
    read("README.md"),
    ...docs.map(read),
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

test("reviewer enquiry pack introduces no production or live payment settlement claims", () => {
  const combined = [
    read("README.md"),
    ...docs.map(read),
    read("PUBLIC_LAUNCH_CHECKLIST.md"),
    read("docs/public-launch-record.md"),
  ].join("\n");

  for (const forbidden of [
    /\bAgent Trust Gate(?:™)? is production-ready\b/i,
    /\bproduction readiness is (?:claimed|approved|complete|ready)\b/i,
    /\blive payment\/settlement readiness is (?:claimed|approved|complete|ready)\b/i,
    /\bsecurity is certified\b/i,
    /\bcertified security is (?:granted|complete|active|available)\b/i,
    /\b(?:provides|offers|includes|grants) (?:a )?legal guarantee\b/i,
    /\b(?:provides|offers|includes|grants) (?:a )?financial guarantee\b/i,
    /\b(?:provides|offers|includes|grants) (?:a )?compliance guarantee\b/i,
    /\b(?:provides|offers|includes|grants) (?:a )?procurement guarantee\b/i,
    /\b(?:provides|offers|includes|grants) (?:a )?settlement guarantee\b/i,
    /\b(?:provides|offers|includes|grants) (?:a )?security guarantee\b/i,
    /\blive payment processing is (?:enabled|active|available|configured)\b/i,
    /\bsettlement execution is (?:enabled|active|available|configured)\b/i,
    /\bpayment automatically grants\b/i,
    /\bautomatic access is granted\b/i,
    /\bautomatic acceptance is granted\b/i,
  ]) {
    assert.doesNotMatch(combined, forbidden);
  }
});

test("reviewer enquiry pack introduces no outreach automation or forbidden live-action language", () => {
  const combined = [
    read("README.md"),
    ...docs.map(read),
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
