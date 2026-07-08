import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const githubDocs = [
  "docs/public-github-release-execution-checklist.md",
  "docs/github-repository-profile.md",
  "docs/public-launch-post-checks.md",
] as const;

function read(path: string): string {
  return readFileSync(path, "utf8");
}

test("public GitHub execution documents exist", () => {
  for (const path of githubDocs) assert.equal(existsSync(path), true, path);
});

test("README and public launch checklist link every GitHub execution document", () => {
  for (const container of ["README.md", "PUBLIC_LAUNCH_CHECKLIST.md"]) {
    const source = read(container);
    for (const path of githubDocs) assert.ok(source.includes(path), `${container}: ${path}`);
  }
});

test("mission register records P3-M107", () => {
  assert.match(read("docs/p3-mission-register.md"), /P3-M107 \| Public GitHub Release Execution Checklist/);
});

test("GitHub checklist requires human approval and prohibits automatic remote push", () => {
  const source = read(githubDocs[0]);
  assert.match(source, /Human approval is required before any remote command/i);
  assert.match(source, /Do not run remote push automatically/i);
  assert.match(source, /Do not run these commands automatically/i);
  assert.ok(source.includes("git remote add origin <GITHUB_REPO_URL>"));
});

test("GitHub checklist retains inactive product and integration boundaries", () => {
  const source = read(githubDocs[0]);
  for (const boundary of [
    "No live payments",
    "No real settlement or settlement execution",
    "No external agent contact",
    "AUC is not integrated",
    "Agent Contact System is not integrated",
  ]) assert.ok(source.includes(boundary), boundary);
});

test("GitHub execution documents contain no actual repository URL or live endpoint", () => {
  const source = githubDocs.map(read).join("\n");
  assert.doesNotMatch(source, /https?:\/\/github\.com\/[a-z0-9_.-]+\/[a-z0-9_.-]+/i);
  assert.doesNotMatch(source, /https?:\/\//i);
  assert.ok(source.includes("<GITHUB_REPO_URL>"));
});

test("GitHub execution documents contain no real secret, financial identifier, or payment-rail instruction", () => {
  const paths = [...githubDocs, "PUBLIC_LAUNCH_CHECKLIST.md"];
  const realSecret = /sk_(?:live|test)_[a-z0-9]{16,}|AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9_]{20,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/i;
  const financialIdentifier = /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b|\b0x[a-f0-9]{40}\b|\b(?:routing|sort code|card number)\s*[:=]\s*\d{6,19}\b/i;
  const railInstruction = /\b(?:enable|activate|configure|connect|execute)\s+(?:x402|AP2|Stripe|a payment rail|payment processing)\b/i;

  for (const path of paths) {
    const source = read(path);
    assert.doesNotMatch(source, realSecret, path);
    assert.doesNotMatch(source, financialIdentifier, path);
    assert.doesNotMatch(source, railInstruction, path);
  }
});
