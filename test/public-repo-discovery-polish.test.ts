import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();
const docPath = "docs/public-repo-discovery-polish.md";
const description = "Local-first pre-action / pre-settlement trust enforcement layer for agent-led actions and payments.";
const topics = [
  "ai-agents",
  "agent-safety",
  "trust",
  "ai-governance",
  "agent-payments",
  "pre-settlement",
  "audit-trail",
  "receipts",
  "typescript",
  "local-first",
];
const contactEmail = "gpmiddleton71@gmail.com";
const oldEmail = ["legalintelligencerecruitment", "outlook.com"].join("@");
const coreLine = "No mandate. No evidence. No verified intent. No signed gate pass. No settlement.";

function read(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test("public repo discovery polish doc exists and README links it", () => {
  assert.equal(existsSync(join(root, docPath)), true, docPath);
  assert.match(read("README.md"), /\(docs\/public-repo-discovery-polish\.md\)/);
});

test("recommended GitHub description and topics are present", () => {
  const doc = read(docPath);
  assert.match(doc, new RegExp(escapeRegExp(description)));

  for (const topic of topics) {
    assert.match(doc, new RegExp(`\\\`${escapeRegExp(topic)}\\\``), topic);
    assert.match(topic, /^[a-z0-9][a-z0-9-]*[a-z0-9]$/);
  }
});

test("discovery polish carries public contact, audience, and core safety line", () => {
  const doc = read(docPath);

  assert.match(doc, new RegExp(escapeRegExp(contactEmail)));
  assert.doesNotMatch(doc, new RegExp(escapeRegExp(oldEmail), "i"));
  assert.match(doc, new RegExp(escapeRegExp(coreLine)));

  for (const audience of [
    "developers",
    "agent builders",
    "payment and integration reviewers",
    "trust and safety reviewers",
    "AI governance reviewers",
  ]) {
    assert.match(doc, new RegExp(escapeRegExp(audience), "i"), audience);
  }
});

test("launch records mention P3-M111 discovery polish", () => {
  assert.match(read("docs/p3-mission-register.md"), /P3-M111 \| Public Repo Discovery Polish/i);
  assert.match(read("docs/public-launch-record.md"), /P3-M111 adds public repo discovery polish/i);
  assert.match(read("docs/global-code-launch-sequence.md"), /P3-M111 adds public repo discovery polish/i);
  assert.match(read("PUBLIC_LAUNCH_CHECKLIST.md"), /\(docs\/public-repo-discovery-polish\.md\)/);
});

test("discovery polish does not introduce active live-action language or sensitive values", () => {
  const doc = read(docPath);

  for (const forbidden of [
    /\blive API is active\b/i,
    /\blive APIs are active\b/i,
    /\blive payments are active\b/i,
    /\bsettlement execution is active\b/i,
    /\bhosted service is available\b/i,
    /\bproduction signing is active\b/i,
    /\bautomated agent contact is active\b/i,
    /\boutreach automation is active\b/i,
    /\bAUC is integrated\b/i,
    /\bAgent Contact System is integrated\b/i,
    /\bexecutes actions\b/i,
    /\bmoves money\b/i,
    /\bdeploys infrastructure\b/i,
    /\bpublishes packages\b/i,
    /\bcreates tags\b/i,
  ]) {
    assert.doesNotMatch(doc, forbidden);
  }

  assert.doesNotMatch(doc, /sk_(?:live|test)_[a-z0-9]{16,}/i);
  assert.doesNotMatch(doc, /AKIA[0-9A-Z]{16}/);
  assert.doesNotMatch(doc, /gh[pousr]_[A-Za-z0-9_]{20,}/);
  assert.doesNotMatch(doc, /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i);
  assert.doesNotMatch(doc, /\b0x[a-f0-9]{40}\b/i);
  assert.doesNotMatch(doc, /\b(?:enable|activate|configure|connect|execute)\s+(?:x402|AP2|Stripe|payment processing|payment rail)\b/i);
});
