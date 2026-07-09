import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();
const publicRepoUrl = "https://github.com/Gareth1953/agent-trust-gate";
const contactEmail = "gpmiddleton71@gmail.com";
const oldEmail = ["legalintelligencerecruitment", "outlook.com"].join("@");
const coreLine = "No mandate. No evidence. No verified intent. No signed gate pass. No settlement.";

function read(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

const requiredFiles = [
  "docs/public-launch-record.md",
  "README.md",
  "PUBLIC_LAUNCH_CHECKLIST.md",
  "RELEASE_NOTES.md",
  "CHANGELOG.md",
  "docs/p3-mission-register.md",
  "docs/public-github-release-execution-checklist.md",
  "docs/public-launch-post-checks.md",
  "docs/global-code-launch-sequence.md",
];

test("public launch record exists and records required launch facts", () => {
  const path = "docs/public-launch-record.md";
  assert.equal(existsSync(join(root, path)), true, path);

  const record = read(path);
  assert.match(record, /P3-M109 records the public GitHub launch state/i);
  assert.match(record, /P3-M108 public GitHub launch is complete/i);
  assert.match(record, new RegExp(publicRepoUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(record, /Launch status: public GitHub repository created and pushed/i);
  assert.match(record, /Branch: main/i);
  assert.match(record, new RegExp(contactEmail.replace(".", "\\.")));
  assert.match(record, new RegExp(coreLine.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

test("README and launch documents link or refer to the public launch record", () => {
  assert.match(read("README.md"), /\(docs\/public-launch-record\.md\)/);
  assert.match(read("PUBLIC_LAUNCH_CHECKLIST.md"), /\(docs\/public-launch-record\.md\)/);
  assert.match(read("docs/public-github-release-execution-checklist.md"), /\(public-launch-record\.md\)/);
  assert.match(read("docs/public-launch-post-checks.md"), /\(public-launch-record\.md\)/);
  assert.match(read("RELEASE_NOTES.md"), /P3-M109: Public Launch Record/i);
  assert.match(read("CHANGELOG.md"), /P3-M109 public launch record/i);
  assert.match(read("docs/p3-mission-register.md"), /P3-M109 \| Public Launch Record and Post-Launch Safety Checklist/i);
  assert.match(read("docs/global-code-launch-sequence.md"), /P3-M109 records the public launch/i);
});

test("post-launch documents preserve future approval boundaries", () => {
  const combined = requiredFiles.map(read).join("\n");

  assert.match(combined, /tag\/package publish\/deployment remain future human-approved steps/i);
  assert.match(combined, /No live APIs/i);
  assert.match(combined, /No live payments/i);
  assert.match(combined, /settlement execution/i);
  assert.match(combined, /external-agent contact/i);
  assert.match(combined, /AUC is not integrated/i);
  assert.match(combined, /Agent Contact System is not integrated/i);
  assert.match(combined, /action execution/i);
});

test("public contact hygiene is preserved", () => {
  const combined = requiredFiles.map(read).join("\n");

  assert.match(combined, new RegExp(contactEmail.replace(".", "\\.")));
  assert.doesNotMatch(combined, new RegExp(oldEmail.replace(".", "\\."), "i"));
});

test("launch record contains only the approved public URL and no sensitive operational values", () => {
  const record = read("docs/public-launch-record.md");
  const urls = record.match(/https?:\/\/[^\s)]+/g) ?? [];

  assert.deepEqual(urls, [publicRepoUrl]);
  assert.doesNotMatch(record, /sk_(?:live|test)_[a-z0-9]{16,}/i);
  assert.doesNotMatch(record, /AKIA[0-9A-Z]{16}/);
  assert.doesNotMatch(record, /gh[pousr]_[A-Za-z0-9_]{20,}/);
  assert.doesNotMatch(record, /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i);
  assert.doesNotMatch(record, /\b0x[a-f0-9]{40}\b/i);
  assert.doesNotMatch(record, /\b(?:enable|activate|configure|connect|execute)\s+(?:x402|AP2|Stripe|payment processing|payment rail)\b/i);
});
