import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const coreRule = "No mandate. No evidence. No verified intent. No signed gate pass. No settlement.";
const releaseDocs = [
  "docs/public-release-candidate-readiness.md",
  "docs/local-launch-bundle-inventory.md",
  "docs/release-candidate-tag-guidance.md",
  "docs/release-candidate-safety-assertions.md",
] as const;

function read(path: string): string {
  return readFileSync(path, "utf8");
}

test("release-candidate documents exist", () => {
  for (const path of releaseDocs) assert.equal(existsSync(path), true, path);
});

test("README links every release-candidate document and retains the core rule", () => {
  const source = read("README.md");
  assert.ok(source.includes(coreRule));
  assert.match(source, /## Release Candidate and Local Launch Bundle/);
  for (const path of releaseDocs) assert.ok(source.includes(path), path);
});

test("release notes, changelog, and public checklist record P3-M104 readiness", () => {
  assert.match(read("RELEASE_NOTES.md"), /## Release Candidate Readiness/);
  assert.match(read("CHANGELOG.md"), /Unreleased \/ Release Candidate/);
  const checklist = read("PUBLIC_LAUNCH_CHECKLIST.md");
  assert.match(checklist, /## Release-candidate checklist/i);
  for (const item of ["npm test", "npm run build", "npm run typecheck", "No package publish or remote tag push"]) {
    assert.ok(checklist.includes(item), item);
  }
});

test("tag guidance is explicit, local, and never automatic", () => {
  const source = read("docs/release-candidate-tag-guidance.md");
  assert.ok(source.includes("v0.1.0-rc.1"));
  assert.match(source, /do not run automatically/i);
  assert.match(source, /Do not create a git tag unless Gareth explicitly requests it/i);
  assert.match(source, /Do not push any tag/i);
  assert.match(source, /Do not push to a remote/i);
  assert.match(source, /Do not publish a package/i);
});

test("safety assertions retain inactive operational capabilities", () => {
  const source = read("docs/release-candidate-safety-assertions.md");
  for (const boundary of [
    "No live API",
    "No live payments",
    "No real settlement or settlement execution",
    "No external agent contact",
  ]) assert.ok(source.includes(boundary), boundary);
});

test("release documents preserve AUC and Agent Contact System separation", () => {
  for (const path of releaseDocs) {
    const source = read(path);
    assert.match(source, /AUC is not integrated/i, path);
    assert.match(source, /Agent Contact System is not integrated/i, path);
  }
});

test("release documents contain no real endpoint or sensitive operational value", () => {
  const paths = [...releaseDocs, "RELEASE_NOTES.md", "CHANGELOG.md", "PUBLIC_LAUNCH_CHECKLIST.md"];
  const externalEndpoint = /https?:\/\/(?!(?:127\.0\.0\.1(?::\d+)?(?:\/|\b)|localhost(?::\d+)?(?:\/|\b)|\[?::1\]?(?::\d+)?(?:\/|\b)|gareth1953\.github\.io\/agent-trust-gate\/?))[^\s)`"']+/i;
  const realSecret = /sk_(?:live|test)_[a-z0-9]{16,}|AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9_]{20,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/i;
  const financialIdentifier = /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b|\b0x[a-f0-9]{40}\b|\b(?:routing|sort code|card number)\s*[:=]\s*\d{6,19}\b/i;
  const railInstruction = /\b(?:enable|activate|configure|connect|execute)\s+(?:x402|AP2|Stripe|a payment rail|payment processing)\b/i;

  for (const path of paths) {
    const source = read(path);
    assert.doesNotMatch(source, externalEndpoint, path);
    assert.doesNotMatch(source, realSecret, path);
    assert.doesNotMatch(source, financialIdentifier, path);
    assert.doesNotMatch(source, railInstruction, path);
  }
});
