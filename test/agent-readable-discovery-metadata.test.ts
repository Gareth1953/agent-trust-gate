import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();
const publicRepoUrl = "https://github.com/Gareth1953/agent-trust-gate";
const contactEmail = "gpmiddleton71@gmail.com";
const oldEmail = ["legalintelligencerecruitment", "outlook.com"].join("@");
const coreLine = "No mandate. No evidence. No verified intent. No signed gate pass. No settlement.";
const discoveryDocs = [
  "docs/agent-readable-discovery-and-system-metadata.md",
  "docs/system-integration-metadata.md",
  "docs/example-agent-discovery-prompts.md",
] as const;
const metadataJsonFiles = [
  "agent-trust-gate.manifest.json",
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
    if (statSync(childFull).isDirectory()) {
      files.push(...jsonFilesUnder(child));
    } else if (entry.endsWith(".json")) {
      files.push(child);
    }
  }
  return files;
}

test("agent-readable discovery assets exist", () => {
  assert.equal(existsSync(join(root, "llms.txt")), true, "llms.txt");
  for (const path of discoveryDocs) assert.equal(existsSync(join(root, path)), true, path);
  for (const path of metadataJsonFiles) assert.equal(existsSync(join(root, path)), true, path);
});

test("README links to the new discovery assets", () => {
  const source = read("README.md");
  for (const path of [
    "llms.txt",
    "docs/agent-readable-discovery-and-system-metadata.md",
    "docs/system-integration-metadata.md",
    "docs/example-agent-discovery-prompts.md",
    "agent-trust-gate.agent-card.json",
  ]) {
    assert.match(source, new RegExp(`\\(${escapeRegExp(path)}\\)`), path);
  }
});

test("public repo URL contact core line and readable boundary are present", () => {
  const combined = [
    read("llms.txt"),
    ...discoveryDocs.map(read),
    ...metadataJsonFiles.map(read),
  ].join("\n");
  assert.match(combined, new RegExp(escapeRegExp(publicRepoUrl)));
  assert.match(combined, new RegExp(escapeRegExp(contactEmail)));
  assert.match(combined, new RegExp(escapeRegExp(coreLine)));
  assert.match(combined, /Readable now\. Callable later\. Autonomous execution never without gate control\./);
  assert.match(combined, /Claimed agent identity is not trust/i);
  assert.match(combined, /Behaviour, mandate, evidence, verified intent, and session context must decide access/i);
  assert.doesNotMatch(combined, new RegExp(escapeRegExp(oldEmail), "i"));
});

test("agent card and root manifest preserve disabled authority flags", () => {
  const manifest = JSON.parse(read("agent-trust-gate.manifest.json")) as Record<string, unknown>;
  const card = JSON.parse(read("agent-trust-gate.agent-card.json")) as {
    safety_flags: Record<string, unknown>;
    public_repository_url: string;
    discovery_status: string;
  };

  assert.equal(manifest.project_status, "local_demo_only");
  assert.equal(manifest.discovery_status, "readable_now_callable_later");
  assert.equal(manifest.live_endpoint, false);
  assert.equal(manifest.mcp_server_functionality, false);
  assert.equal(manifest.autonomous_authority, false);
  assert.equal(manifest.payment_authority, false);
  assert.equal(manifest.settlement_authority, false);
  assert.equal(manifest.production_signing, false);
  assert.equal(manifest.external_agent_contact, false);
  assert.equal(manifest.action_execution, false);

  assert.equal(card.public_repository_url, publicRepoUrl);
  assert.equal(card.discovery_status, "readable_now_callable_later");
  for (const key of [
    "live_endpoint",
    "live_api",
    "mcp_server_functionality",
    "autonomous_authority",
    "agent_negotiation",
    "live_agent_to_agent_communication",
    "autonomous_contact",
    "external_agent_contact",
    "payment_authority",
    "settlement_authority",
    "live_payments",
    "live_settlement",
    "production_signing",
    "production_key_management",
    "cloud_network_calls",
    "action_execution",
  ]) {
    assert.equal(card.safety_flags[key], false, key);
  }
});

test("new discovery prompts do not request unsafe agent actions", () => {
  const prompts = read("docs/example-agent-discovery-prompts.md");
  assert.match(prompts, /Do not ask agents to:/);
  for (const forbidden of [
    /\bcontact the public email automatically\b/i,
    /\bcreate payment requests\b/i,
    /\bprocess payments\b/i,
    /\bexecute settlement\b/i,
    /\bdeploy or publish anything\b/i,
    /\bscrape or crawl external targets\b/i,
    /\bexecute actions\b/i,
  ]) {
    assert.match(prompts, forbidden);
  }
  assert.doesNotMatch(prompts, /\bplease contact\b/i);
  assert.doesNotMatch(prompts, /\bplease pay\b/i);
});

test("related docs and records mention P3-M122", () => {
  const paths = [
    "README.md",
    "docs/paid-pilot-readiness-review.md",
    "docs/reference-integration-examples.md",
    "docs/simplified-developer-cli.md",
    "docs/external-reviewer-signal-and-hardening-roadmap.md",
    "docs/p3-mission-register.md",
    "docs/public-launch-record.md",
    "PUBLIC_LAUNCH_CHECKLIST.md",
    "RELEASE_NOTES.md",
    "CHANGELOG.md",
  ];
  for (const path of paths) {
    assert.equal(existsSync(join(root, path)), true, path);
    assert.match(read(path), /P3-M122/, path);
  }
});

test("old public email is absent from tracked files", () => {
  const tracked = spawnSync("git", ["ls-files"], { encoding: "utf8" });
  assert.equal(tracked.status, 0);
  for (const path of tracked.stdout.split(/\r?\n/).filter(Boolean)) {
    if (!existsSync(path)) continue;
    assert.doesNotMatch(readFileSync(path, "utf8"), new RegExp(escapeRegExp(oldEmail), "i"), path);
  }
});

test("discovery metadata introduces no active live-action payment or deployment language", () => {
  const combined = [
    read("llms.txt"),
    ...discoveryDocs.map(read),
    ...metadataJsonFiles.map(read),
    read("README.md"),
    read("PUBLIC_LAUNCH_CHECKLIST.md"),
    read("docs/public-launch-record.md"),
  ].join("\n");

  for (const forbidden of [
    /\blive endpoint is (?:enabled|active|available|configured|created)\b/i,
    /\blive agent endpoint is (?:enabled|active|available|configured|created)\b/i,
    /\bMCP server (?:is|has been) (?:enabled|active|available|configured|created)\b/i,
    /\bautonomous authority is (?:granted|enabled|active|available|configured)\b/i,
    /\bpayment authority is (?:granted|enabled|active|available|configured)\b/i,
    /\bsettlement authority is (?:granted|enabled|active|available|configured)\b/i,
    /\blive payment processing is (?:enabled|active|available|configured)\b/i,
    /\bPayPal API (?:is|has been) (?:integrated|enabled|configured|activated)\b/i,
    /\bStripe (?:is|has been) (?:integrated|enabled|configured|activated)\b/i,
    /\bcheckout is (?:enabled|active|available|configured)\b/i,
    /\bwebhooks? (?:are|is) (?:enabled|active|available|configured)\b/i,
    /\bproduction signing is (?:enabled|active|available|configured)\b/i,
    /\bdeployment is (?:performed|active|available|configured)\b/i,
    /\bexternal-agent contact is (?:enabled|active|available|configured)\b/i,
    /\bAUC is integrated\b/i,
    /\bAgent Contact System is integrated\b/i,
    /\bexecutes actions\b/i,
    /\bis production-ready\b/i,
    /\bsecurity is certified\b/i,
    /\bsecurity certification is (?:granted|complete|active|available)\b/i,
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
  for (const path of jsonFiles) {
    assert.doesNotThrow(() => JSON.parse(read(path)), path);
  }
});
